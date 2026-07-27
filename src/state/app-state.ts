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
import {
  EVENT_DURATION_MS,
  claimUnownedSessions,
  saveSession,
  type ActivitySession,
  type EventKind,
} from '@/lib/activity-store';
import {
  MAX_CHILDREN,
  isChildGradientKey,
  type Child,
  type ChildGradientKey,
} from '@/lib/children';
import { startLiveActivity, stopLiveActivity } from '@/lib/live-activity';
import {
  clearLiveSession,
  enqueueSessionUpsert,
  pushLiveSession,
  type LiveTrack,
  type RemoteChild,
} from '@/lib/sync';
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
    .map((item) => ({
      ...item,
      remoteId: typeof item.remoteId === 'string' ? item.remoteId : undefined,
    }))
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
  childId?: string;
  // True once the timer was announced in live_sessions — only such timers may
  // be cancelled locally when the partner stops them remotely.
  livePushed?: boolean;
} | null;

// A timer running on the partner's device (from live_sessions).
export interface RemoteLive {
  childId: string;
  track: LiveTrack;
  kind: ActivityKind;
  startedAt: number;
}

const trackOf = (kind: ActivityKind): 'session' | 'feeding' =>
  kind === 'feeding' ? 'feeding' : 'session';

type AppStore = PersistedState & {
  dataVersion: number;
  session: Session;
  feeding: Session;
  remoteLive: RemoteLive[];
  reconcileRemoteLive: (list: RemoteLive[]) => void;
  stopRemoteActivity: (track: LiveTrack) => Promise<void>;
  setSleepMinutes: (value: number) => void;
  setAwakeMinutes: (value: number) => void;
  setFeedingMinutes: (value: number) => void;
  setLanguage: (code: LanguageCode) => void;
  addChild: (name: string, gradientKey: ChildGradientKey) => void;
  addSharedChild: (name: string, gradientKey: ChildGradientKey, remoteId: string) => Child | null;
  upsertRemoteChildren: (remote: RemoteChild[]) => void;
  setChildRemoteId: (id: string, remoteId: string) => void;
  removeChild: (id: string) => void;
  selectChild: (id: string) => void;
  bumpDataVersion: () => void;
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
  const session: ActivitySession = {
    id: `${current.startedAt}-${current.kind}`,
    kind: current.kind,
    start: current.startedAt,
    end,
    childId: current.childId,
  };
  await saveSession(session);
  pushSessionIfShared(session);
  useAppStore.setState((state) => ({ dataVersion: state.dataVersion + 1 }));
}

function remoteIdOfChild(childId?: string): string | undefined {
  if (!childId) return undefined;
  return useAppStore.getState().children.find((c) => c.id === childId)?.remoteId;
}

// Queues the session for upload when its child is linked to Supabase.
function pushSessionIfShared(session: ActivitySession) {
  const remoteId = remoteIdOfChild(session.childId);
  if (remoteId) enqueueSessionUpsert(remoteId, session);
}

// Fire-and-forget removal of the live-timer row for a stopped session.
function clearLiveIfShared(current: NonNullable<Session>, track: LiveTrack) {
  const remoteId = remoteIdOfChild(current.childId);
  if (remoteId) clearLiveSession(remoteId, track).catch(() => {});
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
      remoteLive: [],

      // Applies the fresh live-timer list; also cancels local timers that the
      // partner already stopped (they saved the completed record themselves).
      reconcileRemoteLive: (list) => {
        for (const track of ['session', 'feeding'] as const) {
          const current = get()[track === 'feeding' ? 'feeding' : 'session'];
          if (!current?.livePushed || !current.childId) continue;
          const stillLive = list.some(
            (item) =>
              item.childId === current.childId &&
              item.track === track &&
              item.startedAt === current.startedAt,
          );
          if (stillLive) continue;
          if (track === 'feeding') clearAutoStop();
          stopLiveActivity(track);
          cancelReminder(current.reminderId);
          set(track === 'feeding' ? { feeding: null } : { session: null });
        }
        set({ remoteLive: list });
      },

      // Stops a timer that runs on the partner's device: saves the completed
      // record and removes the live row so both sides converge.
      stopRemoteActivity: async (track) => {
        const state = get();
        const live = state.remoteLive.find(
          (item) => item.track === track && item.childId === state.activeChildId,
        );
        if (!live) return;
        const remoteId = remoteIdOfChild(live.childId);

        let end = Date.now();
        if (live.kind === 'feeding') {
          const limitEnd = live.startedAt + state.feedingMinutes * 60_000;
          if (end > limitEnd) end = limitEnd;
        }
        if (end - live.startedAt >= 1000) {
          const session: ActivitySession = {
            id: `${live.startedAt}-${live.kind}`,
            kind: live.kind,
            start: live.startedAt,
            end,
            childId: live.childId,
          };
          await saveSession(session);
          if (remoteId) enqueueSessionUpsert(remoteId, session);
        }
        if (remoteId) clearLiveSession(remoteId, track).catch(() => {});
        set((current) => ({
          remoteLive: current.remoteLive.filter((item) => item !== live),
          dataVersion: current.dataVersion + 1,
        }));
      },

      setSleepMinutes: (value) => set({ sleepMinutes: clampTimer(value) }),
      setAwakeMinutes: (value) => set({ awakeMinutes: clampTimer(value) }),
      setFeedingMinutes: (value) => set({ feedingMinutes: clampFeeding(value) }),
      setLanguage: (code) => set({ language: normalizeLanguage(code) }),

      addChild: (name, gradientKey) => {
        const trimmed = name.trim();
        const state = get();
        if (!trimmed || state.children.length >= MAX_CHILDREN) return;
        const child: Child = { id: `${Date.now()}`, name: trimmed, gradientKey };
        const isFirst = state.children.length === 0;
        set({ children: [...state.children, child], activeChildId: child.id });
        // The first child adopts the history recorded before children existed.
        if (isFirst) claimUnownedSessions(child.id);
      },

      addSharedChild: (name, gradientKey, remoteId) => {
        const state = get();
        const existing = state.children.find((child) => child.remoteId === remoteId);
        if (existing) {
          set({ activeChildId: existing.id });
          return existing;
        }
        if (state.children.length >= MAX_CHILDREN) return null;
        const child: Child = { id: `${Date.now()}`, name: name.trim(), gradientKey, remoteId };
        set({ children: [...state.children, child], activeChildId: child.id });
        return child;
      },

      // Restores account children missing on this device (new device / reinstall).
      upsertRemoteChildren: (remote) =>
        set((state) => {
          const children = [...state.children];
          let changed = false;
          for (const item of remote) {
            if (children.some((child) => child.remoteId === item.remoteId)) continue;
            if (children.length >= MAX_CHILDREN) break;
            children.push({
              id: `${Date.now()}-${item.remoteId.slice(0, 8)}`,
              name: item.name,
              gradientKey: isChildGradientKey(item.gradientKey) ? item.gradientKey : 'sky',
              remoteId: item.remoteId,
            });
            changed = true;
          }
          if (!changed) return {};
          return {
            children,
            activeChildId: state.activeChildId ?? children[0]?.id ?? null,
          };
        }),

      setChildRemoteId: (id, remoteId) =>
        set((state) => ({
          children: state.children.map((child) =>
            child.id === id ? { ...child, remoteId } : child,
          ),
        })),

      selectChild: (id) =>
        set((state) =>
          state.children.some((child) => child.id === id) ? { activeChildId: id } : {},
        ),

      removeChild: (id) =>
        set((state) => {
          const children = state.children.filter((child) => child.id !== id);
          return {
            children,
            activeChildId:
              state.activeChildId === id ? (children[0]?.id ?? null) : state.activeChildId,
            dataVersion: state.dataVersion + 1,
          };
        }),

      bumpDataVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),

      startActivity: async (kind) => {
        const track = trackOf(kind);
        const { sleepMinutes, awakeMinutes, feedingMinutes, language } = get();

        const prev = get()[track];
        if (prev) {
          if (track === 'feeding') clearAutoStop();
          clearLiveIfShared(prev, track);
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
            clearLiveIfShared(current, 'feeding');
            finalizeSession(current, get().feedingMinutes).then(() => set({ feeding: null }));
          }, limitMinutes * 60_000);
        }

        const started = {
          kind,
          startedAt,
          reminderId,
          childId: get().activeChildId ?? undefined,
        };
        set(track === 'feeding' ? { feeding: started } : { session: started });

        // Announce the timer to the partner's devices.
        const remoteChildId = remoteIdOfChild(started.childId);
        if (remoteChildId) {
          pushLiveSession(remoteChildId, track, kind, startedAt)
            .then(() => {
              const current = get()[track];
              if (current?.startedAt !== startedAt) return;
              const updated = { ...current, livePushed: true };
              set(track === 'feeding' ? { feeding: updated } : { session: updated });
            })
            .catch(() => {});
        }
      },

      stopActivity: async (kind) => {
        const track = trackOf(kind);
        const current = get()[track];
        if (!current) return;
        if (track === 'feeding') clearAutoStop();
        stopLiveActivity(track);
        clearLiveIfShared(current, track);
        await cancelReminder(current.reminderId);
        await finalizeSession(current, get().feedingMinutes);
        set(track === 'feeding' ? { feeding: null } : { session: null });
      },

      logEvent: async (kind) => {
        const start = Date.now();
        const session: ActivitySession = {
          id: `${start}-${kind}`,
          kind,
          start,
          end: start + EVENT_DURATION_MS,
          childId: get().activeChildId ?? undefined,
        };
        await saveSession(session);
        pushSessionIfShared(session);
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

// Legacy sessions written before children existed belong to the first child.
useAppStore.persist.onFinishHydration((state) => {
  const first = state.children[0];
  if (first) claimUnownedSessions(first.id);
});

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
  clearLiveIfShared(feeding, 'feeding');
  finalizeSession(feeding, feedingMinutes).then(() => useAppStore.setState({ feeding: null }));
});
