import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { AppState as RNAppState } from 'react-native';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  translate,
  type LanguageCode,
  type TranslateParams,
} from '@/i18n';
import { EVENT_DURATION_MS, saveSession, type EventKind } from '@/lib/activity-store';
import {
  MAX_CHILDREN,
  isChildGradientKey,
  type Child,
  type ChildGradientKey,
} from '@/lib/children';
import { startLiveActivity, stopLiveActivity } from '@/lib/live-activity';
import {
  cancelReminder,
  configureNotificationHandler,
  scheduleActivityNotification,
  type ActivityKind,
} from '@/lib/notifications';

const STORAGE_KEY = 'babytimer.settings.v1';

export const TIMER_MIN = 15;
export const TIMER_MAX = 600;
export const TIMER_STEP = 15;

export const FEEDING_MIN = 5;
export const FEEDING_MAX = 60;
export const FEEDING_STEP = 5;

type Settings = {
  sleepMinutes: number;
  awakeMinutes: number;
  feedingMinutes: number;
  language: LanguageCode;
};

type PersistedState = Settings & {
  children: Child[];
  activeChildId: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  sleepMinutes: 120,
  awakeMinutes: 120,
  feedingMinutes: 20,
  language: DEFAULT_LANGUAGE,
};

const sanitizeChildren = (value: unknown): Child[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Child =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as Child).id === 'string' &&
        typeof (item as Child).name === 'string' &&
        isChildGradientKey((item as Child).gradientKey),
    )
    .slice(0, MAX_CHILDREN);
};

const clampTimer = (value: number) =>
  Math.min(TIMER_MAX, Math.max(TIMER_MIN, Math.round(value / TIMER_STEP) * TIMER_STEP));
const clampFeeding = (value: number) =>
  Math.min(FEEDING_MAX, Math.max(FEEDING_MIN, Math.round(value / FEEDING_STEP) * FEEDING_STEP));

const pickNumber = (value: unknown, clamp: (n: number) => number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value) : fallback;

export type Session = {
  kind: ActivityKind;
  startedAt: number;
  reminderId: string | null;
} | null;

const trackOf = (kind: ActivityKind): 'session' | 'feeding' =>
  kind === 'feeding' ? 'feeding' : 'session';

type AppStore = PersistedState & {
  dataVersion: number;
  session: Session;
  feeding: Session;
  setSleepMinutes: (value: number) => void;
  setAwakeMinutes: (value: number) => void;
  setFeedingMinutes: (value: number) => void;
  setLanguage: (code: LanguageCode) => void;
  addChild: (name: string, gradientKey: ChildGradientKey) => void;
  selectChild: (id: string) => void;
  startActivity: (kind: ActivityKind) => Promise<void>;
  stopActivity: (kind: ActivityKind) => Promise<void>;
  logEvent: (kind: EventKind) => Promise<void>;
};

const storage: PersistStorage<PersistedState> = {
  getItem: async (name) => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return 'state' in parsed ? parsed : { state: parsed, version: 0 };
    } catch {
      return null;
    }
  },
  setItem: (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

type LegacySettings = Partial<Settings> & { sleepHours?: number; awakeHours?: number };

let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
const clearAutoStop = () => {
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
};

async function finalizeSession(current: NonNullable<Session>, feedingMinutes: number) {
  let end = Date.now();
  if (current.kind === 'feeding') {
    const limitEnd = current.startedAt + feedingMinutes * 60_000;
    if (end > limitEnd) end = limitEnd;
  }
  if (end - current.startedAt < 1000) return;
  await saveSession({
    id: `${current.startedAt}-${current.kind}`,
    kind: current.kind,
    start: current.startedAt,
    end,
  });
  useAppStore.setState((state) => ({ dataVersion: state.dataVersion + 1 }));
}

const pad2 = (n: number) => String(n).padStart(2, '0');
function liveActivityLabels(language: LanguageCode, kind: ActivityKind, startedAt: number) {
  const at = new Date(startedAt);
  return {
    title: translate(language, `kind.${kind}`),
    subtitle: translate(language, 'live.startedAt', {
      time: `${pad2(at.getHours())}:${pad2(at.getMinutes())}`,
    }),
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      children: [],
      activeChildId: null,
      dataVersion: 0,
      session: null,
      feeding: null,

      setSleepMinutes: (value) => set({ sleepMinutes: clampTimer(value) }),
      setAwakeMinutes: (value) => set({ awakeMinutes: clampTimer(value) }),
      setFeedingMinutes: (value) => set({ feedingMinutes: clampFeeding(value) }),
      setLanguage: (code) => set({ language: normalizeLanguage(code) }),

      addChild: (name, gradientKey) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed || state.children.length >= MAX_CHILDREN) return {};
          const child: Child = { id: `${Date.now()}`, name: trimmed, gradientKey };
          return { children: [...state.children, child], activeChildId: child.id };
        }),

      selectChild: (id) =>
        set((state) =>
          state.children.some((child) => child.id === id) ? { activeChildId: id } : {},
        ),

      startActivity: async (kind) => {
        const track = trackOf(kind);
        const { sleepMinutes, awakeMinutes, feedingMinutes, language } = get();

        const prev = get()[track];
        if (prev) {
          if (track === 'feeding') clearAutoStop();
          await cancelReminder(prev.reminderId);
          await finalizeSession(prev, feedingMinutes);
        }

        const startedAt = Date.now();
        const limitMinutes =
          kind === 'sleep' ? sleepMinutes : kind === 'awake' ? awakeMinutes : feedingMinutes;

        startLiveActivity(
          track,
          kind,
          startedAt + limitMinutes * 60_000,
          liveActivityLabels(language, kind, startedAt),
        );

        const reminderId = await scheduleActivityNotification(
          {
            title: translate(language, `notif.${kind}.title`),
            body: translate(language, `notif.${kind}.body`),
          },
          limitMinutes * 60,
        );

        if (track === 'feeding') {
          autoStopTimer = setTimeout(() => {
            const current = get().feeding;
            if (current?.startedAt !== startedAt) return;
            stopLiveActivity('feeding');
            finalizeSession(current, get().feedingMinutes).then(() => set({ feeding: null }));
          }, limitMinutes * 60_000);
        }

        const started = { kind, startedAt, reminderId };
        set(track === 'feeding' ? { feeding: started } : { session: started });
      },

      stopActivity: async (kind) => {
        const track = trackOf(kind);
        const current = get()[track];
        if (!current) return;
        if (track === 'feeding') clearAutoStop();
        stopLiveActivity(track);
        await cancelReminder(current.reminderId);
        await finalizeSession(current, get().feedingMinutes);
        set(track === 'feeding' ? { feeding: null } : { session: null });
      },

      logEvent: async (kind) => {
        const start = Date.now();
        await saveSession({
          id: `${start}-${kind}`,
          kind,
          start,
          end: start + EVENT_DURATION_MS,
        });
        set((state) => ({ dataVersion: state.dataVersion + 1 }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
      partialize: ({
        sleepMinutes,
        awakeMinutes,
        feedingMinutes,
        language,
        children,
        activeChildId,
      }) => ({
        sleepMinutes,
        awakeMinutes,
        feedingMinutes,
        language,
        children,
        activeChildId,
      }),
      migrate: (persisted, version) => {
        const legacy = (persisted ?? {}) as LegacySettings;
        if (version > 0) return legacy as PersistedState;
        return {
          ...DEFAULT_SETTINGS,
          ...legacy,
          sleepMinutes: legacy.sleepMinutes ?? (legacy.sleepHours ?? NaN) * 60,
          awakeMinutes: legacy.awakeMinutes ?? (legacy.awakeHours ?? NaN) * 60,
        } as PersistedState;
      },
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedState>;
        const children = sanitizeChildren(saved.children);
        return {
          ...current,
          sleepMinutes: pickNumber(saved.sleepMinutes, clampTimer, current.sleepMinutes),
          awakeMinutes: pickNumber(saved.awakeMinutes, clampTimer, current.awakeMinutes),
          feedingMinutes: pickNumber(saved.feedingMinutes, clampFeeding, current.feedingMinutes),
          language: normalizeLanguage(saved.language),
          children,
          activeChildId: children.some((child) => child.id === saved.activeChildId)
            ? (saved.activeChildId ?? null)
            : null,
        };
      },
    },
  ),
);

export function useT() {
  const language = useAppStore((state) => state.language);
  return useCallback(
    (key: string, params?: TranslateParams) => translate(language, key, params),
    [language],
  );
}

configureNotificationHandler();

const globalScope = globalThis as typeof globalThis & {
  __babytimerAppStateSub?: { remove: () => void };
};
globalScope.__babytimerAppStateSub?.remove();
globalScope.__babytimerAppStateSub = RNAppState.addEventListener('change', (state) => {
  if (state !== 'active') return;
  const { feeding, feedingMinutes } = useAppStore.getState();
  if (!feeding) return;
  if (Date.now() - feeding.startedAt < feedingMinutes * 60_000) return;
  clearAutoStop();
  stopLiveActivity('feeding');
  finalizeSession(feeding, feedingMinutes).then(() => useAppStore.setState({ feeding: null }));
});
