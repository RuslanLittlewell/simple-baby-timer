import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { AppState as RNAppState } from 'react-native';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

import { type ThemeMode } from '@/constants/theme';
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
  type ProDetails,
} from '@/lib/activity-store';
import {
  MAX_CHILDREN,
  isChildGradientKey,
  type Child,
  type ChildGradientKey,
} from '@/lib/children';
import { startLiveActivity, stopLiveActivity } from '@/lib/live-activity';
import {
  activateTestPro as activateTestProPurchase,
  clearLiveSession,
  enqueueSessionUpsert,
  pushLiveSession,
  updateLiveSessionDetails,
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
  sleepNotificationsEnabled: boolean;
  awakeNotificationsEnabled: boolean;
  feedingNotificationsEnabled: boolean;
  language: LanguageCode;
  themeMode: ThemeMode;
};

type PersistedState = Settings & {
  children: Child[];
  activeChildId: string | null;
  // remoteIds of children deleted locally, so account-restore sync won't bring
  // them back before the server-side leave takes effect.
  removedRemoteIds: string[];
  // Gates the first-launch welcome/auth/child-setup flow.
  onboardingComplete: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  sleepMinutes: 120,
  awakeMinutes: 120,
  feedingMinutes: 20,
  sleepNotificationsEnabled: true,
  awakeNotificationsEnabled: true,
  feedingNotificationsEnabled: true,
  language: DEFAULT_LANGUAGE,
  themeMode: 'dark',
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
      id: item.id,
      name: item.name,
      gradientKey: item.gradientKey,
      birthday: typeof item.birthday === 'number' ? item.birthday : undefined,
      proEnabled: item.proEnabled === true,
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
  proDetails?: ProDetails;
} | null;

// A timer running on the partner's device (from live_sessions).
export interface RemoteLive {
  childId: string;
  track: LiveTrack;
  kind: ActivityKind;
  startedAt: number;
  proDetails?: ProDetails;
}

const trackOf = (kind: ActivityKind): 'session' | 'feeding' =>
  kind === 'feeding' ? 'feeding' : 'session';

type AppStore = PersistedState & {
  // Transient (not persisted): tells the root layout to show the Paywall
  // once, right after onboarding hands off into the app.
  pendingPaywall: boolean;
  setPendingPaywall: (pending: boolean) => void;
  dataVersion: number;
  proActive: boolean;
  proExpiresAt?: number;
  proRenewsAt?: number;
  session: Session;
  feeding: Session;
  remoteLive: RemoteLive[];
  reconcileRemoteLive: (list: RemoteLive[]) => void;
  stopRemoteActivity: (track: LiveTrack) => Promise<void>;
  setSleepMinutes: (value: number) => void;
  setAwakeMinutes: (value: number) => void;
  setFeedingMinutes: (value: number) => void;
  setNotificationsEnabled: (
    kind: Exclude<ActivityKind, 'settling'>,
    enabled: boolean,
  ) => void;
  setActiveProDetails: (details: ProDetails) => void;
  setLanguage: (code: LanguageCode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setOnboardingComplete: (complete: boolean) => void;
  addChild: (name: string, gradientKey: ChildGradientKey, birthday: number) => void;
  addSharedChild: (child: RemoteChild) => Child | null;
  upsertRemoteChildren: (remote: RemoteChild[]) => void;
  setChildRemoteId: (id: string, remoteId: string) => void;
  removeChild: (id: string) => void;
  clearRemovedRemoteId: (remoteId: string) => void;
  selectChild: (id: string) => void;
  bumpDataVersion: () => void;
  setProStatus: (active: boolean, expiresAt?: number, renewsAt?: number) => void;
  activateTestPro: () => Promise<void>;
  addManualActivity: (
    kind: ActivityKind,
    start: number,
    end: number,
    proDetails?: ProDetails,
  ) => Promise<void>;
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
  // Preserve even accidental/very short starts so the calendar can expose
  // them for editing or deletion. The timeline gives them a larger hit area.
  if (end <= current.startedAt) end = current.startedAt + 1;
  const session: ActivitySession = {
    id: `${current.startedAt}-${current.kind}`,
    kind: current.kind,
    start: current.startedAt,
    end,
    childId: current.childId,
    proDetails: current.proDetails,
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
      removedRemoteIds: [],
      onboardingComplete: false,
      pendingPaywall: false,
      dataVersion: 0,
      proActive: false,
      proExpiresAt: undefined,
      proRenewsAt: undefined,
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
        if (end <= live.startedAt) end = live.startedAt + 1;
        const session: ActivitySession = {
          id: `${live.startedAt}-${live.kind}`,
          kind: live.kind,
          start: live.startedAt,
          end,
          childId: live.childId,
          proDetails: live.proDetails,
        };
        await saveSession(session);
        if (remoteId) enqueueSessionUpsert(remoteId, session);
        if (remoteId) clearLiveSession(remoteId, track).catch(() => {});
        set((current) => ({
          remoteLive: current.remoteLive.filter((item) => item !== live),
          dataVersion: current.dataVersion + 1,
        }));
      },

      setSleepMinutes: (value) => set({ sleepMinutes: clampTimer(value) }),
      setAwakeMinutes: (value) => set({ awakeMinutes: clampTimer(value) }),
      setFeedingMinutes: (value) => set({ feedingMinutes: clampFeeding(value) }),
      setNotificationsEnabled: (kind, enabled) => {
        const key = `${kind}NotificationsEnabled` as const;
        set({ [key]: enabled });
        if (enabled) return;
        const track = trackOf(kind);
        const current = get()[track];
        if (current?.kind !== kind || !current.reminderId) return;
        cancelReminder(current.reminderId);
        const updated = { ...current, reminderId: null };
        set(track === 'feeding' ? { feeding: updated } : { session: updated });
      },
      setActiveProDetails: (details) => {
        const track = details.type === 'feeding' ? 'feeding' : 'session';
        const current = get()[track];
        if (!current || current.kind !== details.type) return;
        const updated = { ...current, proDetails: details };
        set(track === 'feeding' ? { feeding: updated } : { session: updated });
        const remoteId = remoteIdOfChild(current.childId);
        if (remoteId) updateLiveSessionDetails(remoteId, track, details).catch(() => {});
      },
      setLanguage: (code) => set({ language: normalizeLanguage(code) }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setPendingPaywall: (pending) => set({ pendingPaywall: pending }),
      setThemeMode: (mode) => set({ themeMode: mode }),

      addChild: (name, gradientKey, birthday) => {
        const trimmed = name.trim();
        const state = get();
        if (!trimmed || state.children.length >= MAX_CHILDREN) return;
        const child: Child = { id: `${Date.now()}`, name: trimmed, gradientKey, birthday };
        const isFirst = state.children.length === 0;
        set({ children: [...state.children, child], activeChildId: child.id });
        // The first child adopts the history recorded before children existed.
        if (isFirst) claimUnownedSessions(child.id);
      },

      addSharedChild: (remote) => {
        const state = get();
        // Joining clears any tombstone so the child can come back.
        const removedRemoteIds = state.removedRemoteIds.filter((rid) => rid !== remote.remoteId);
        const existing = state.children.find((child) => child.remoteId === remote.remoteId);
        if (existing) {
          const updated = remote.proEnabled ? { ...existing, proEnabled: true } : existing;
          set({
            children: state.children.map((child) => (child.id === existing.id ? updated : child)),
            activeChildId: existing.id,
            removedRemoteIds,
          });
          return updated;
        }
        if (state.children.length >= MAX_CHILDREN) {
          set({ removedRemoteIds });
          return null;
        }
        const child: Child = {
          id: `${Date.now()}`,
          name: remote.name.trim(),
          gradientKey: isChildGradientKey(remote.gradientKey) ? remote.gradientKey : 'sky',
          birthday: remote.birthday,
          proEnabled: remote.proEnabled,
          remoteId: remote.remoteId,
        };
        set({ children: [...state.children, child], activeChildId: child.id, removedRemoteIds });
        return child;
      },

      // Restores account children missing on this device (new device / reinstall).
      upsertRemoteChildren: (remote) =>
        set((state) => {
          const children = [...state.children];
          let changed = false;
          for (const item of remote) {
            // Don't resurrect a child the user just deleted here.
            if (state.removedRemoteIds.includes(item.remoteId)) continue;
            const existingIndex = children.findIndex(
              (child) => child.remoteId === item.remoteId,
            );
            if (existingIndex >= 0) {
              if (item.proEnabled && !children[existingIndex].proEnabled) {
                children[existingIndex] = { ...children[existingIndex], proEnabled: true };
                changed = true;
              }
              continue;
            }
            if (children.length >= MAX_CHILDREN) break;
            children.push({
              id: `${Date.now()}-${item.remoteId.slice(0, 8)}`,
              name: item.name,
              gradientKey: isChildGradientKey(item.gradientKey) ? item.gradientKey : 'sky',
              birthday: item.birthday,
              proEnabled: item.proEnabled,
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
            child.id === id ? { ...child, remoteId, proEnabled: true } : child,
          ),
        })),

      selectChild: (id) =>
        set((state) =>
          state.children.some((child) => child.id === id) ? { activeChildId: id } : {},
        ),

      removeChild: (id) =>
        set((state) => {
          const removed = state.children.find((child) => child.id === id);
          const children = state.children.filter((child) => child.id !== id);
          return {
            children,
            removedRemoteIds:
              removed?.remoteId && !state.removedRemoteIds.includes(removed.remoteId)
                ? [...state.removedRemoteIds, removed.remoteId]
                : state.removedRemoteIds,
            activeChildId:
              state.activeChildId === id ? (children[0]?.id ?? null) : state.activeChildId,
            dataVersion: state.dataVersion + 1,
          };
        }),

      clearRemovedRemoteId: (remoteId) =>
        set((state) => ({
          removedRemoteIds: state.removedRemoteIds.filter((id) => id !== remoteId),
        })),

      bumpDataVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
      setProStatus: (active, expiresAt, renewsAt) =>
        set({ proActive: active, proExpiresAt: expiresAt, proRenewsAt: renewsAt }),
      activateTestPro: async () => {
        const renewsAt = await activateTestProPurchase();
        set({ proActive: true, proExpiresAt: undefined, proRenewsAt: renewsAt });
      },

      addManualActivity: async (kind, start, end, proDetails) => {
        const activeChild = get().children.find((child) => child.id === get().activeChildId);
        const hasProAccess = get().proActive || activeChild?.proEnabled === true;
        const session: ActivitySession = {
          id: `${start}-${kind}-${Date.now()}`,
          kind,
          start,
          end,
          childId: get().activeChildId ?? undefined,
          proDetails: hasProAccess ? proDetails : undefined,
        };
        await saveSession(session);
        pushSessionIfShared(session);
        set((state) => ({ dataVersion: state.dataVersion + 1 }));
      },

      startActivity: async (kind) => {
        const track = trackOf(kind);
        const {
          sleepMinutes,
          awakeMinutes,
          feedingMinutes,
          sleepNotificationsEnabled,
          awakeNotificationsEnabled,
          feedingNotificationsEnabled,
          language,
        } = get();

        const prev = get()[track];
        if (prev) {
          if (track === 'feeding') clearAutoStop();
          clearLiveIfShared(prev, track);
          await cancelReminder(prev.reminderId);
          await finalizeSession(prev, feedingMinutes);
        }

        const startedAt = Date.now();
        const limitMinutes =
          kind === 'sleep'
            ? sleepMinutes
            : kind === 'awake' || kind === 'settling'
              ? awakeMinutes
              : feedingMinutes;

        startLiveActivity(
          track,
          kind,
          startedAt + limitMinutes * 60_000,
          liveActivityLabels(language, kind, startedAt),
        );

        // Publish the active timer before requesting notification permission.
        // This lets a quick second tap stop it while scheduling is still in flight.
        const started = {
          kind,
          startedAt,
          reminderId: null,
          childId: get().activeChildId ?? undefined,
        };
        set(track === 'feeding' ? { feeding: started } : { session: started });

        if (track === 'feeding') {
          autoStopTimer = setTimeout(() => {
            const current = get().feeding;
            if (current?.startedAt !== startedAt) return;
            stopLiveActivity('feeding');
            clearLiveIfShared(current, 'feeding');
            cancelReminder(current.reminderId);
            finalizeSession(current, get().feedingMinutes).then(() => set({ feeding: null }));
          }, limitMinutes * 60_000);
        }

        // Announce the timer to the partner's devices.
        const remoteChildId = remoteIdOfChild(started.childId);
        if (remoteChildId) {
          pushLiveSession(remoteChildId, track, kind, startedAt)
            .then(() => {
              const current = get()[track];
              if (current?.startedAt !== startedAt) return;
              const updated = { ...current, livePushed: true };
              set(track === 'feeding' ? { feeding: updated } : { session: updated });
              if (current.proDetails) {
                updateLiveSessionDetails(
                  remoteChildId,
                  track,
                  current.proDetails,
                ).catch(() => {});
              }
            })
            .catch(() => {});
        }

        const notificationsEnabled =
          kind === 'sleep'
            ? sleepNotificationsEnabled
            : kind === 'awake'
              ? awakeNotificationsEnabled
              : kind === 'feeding'
                ? feedingNotificationsEnabled
                : false;
        let reminderId: string | null = null;
        if (notificationsEnabled) {
          try {
            reminderId = await scheduleActivityNotification(
              {
                title: translate(language, `notif.${kind}.title`),
                body: translate(language, `notif.${kind}.body`),
              },
              limitMinutes * 60,
            );
          } catch {
            // A platform notification failure must not block the timer itself.
          }
        }

        if (reminderId) {
          const latest = get();
          const current = latest[track];
          const stillEnabled =
            kind === 'sleep'
              ? latest.sleepNotificationsEnabled
              : kind === 'awake'
                ? latest.awakeNotificationsEnabled
                : kind === 'feeding'
                  ? latest.feedingNotificationsEnabled
                  : false;
          if (current?.startedAt === startedAt && stillEnabled) {
            const updated = { ...current, reminderId };
            set(track === 'feeding' ? { feeding: updated } : { session: updated });
          } else {
            // The timer was stopped or replaced before scheduling completed.
            await cancelReminder(reminderId);
          }
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
        sleepNotificationsEnabled,
        awakeNotificationsEnabled,
        feedingNotificationsEnabled,
        language,
        themeMode,
        children,
        activeChildId,
        removedRemoteIds,
        onboardingComplete,
      }) => ({
        sleepMinutes,
        awakeMinutes,
        feedingMinutes,
        sleepNotificationsEnabled,
        awakeNotificationsEnabled,
        feedingNotificationsEnabled,
        language,
        themeMode,
        children,
        activeChildId,
        removedRemoteIds,
        onboardingComplete,
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
          sleepNotificationsEnabled:
            typeof saved.sleepNotificationsEnabled === 'boolean'
              ? saved.sleepNotificationsEnabled
              : true,
          awakeNotificationsEnabled:
            typeof saved.awakeNotificationsEnabled === 'boolean'
              ? saved.awakeNotificationsEnabled
              : true,
          feedingNotificationsEnabled:
            typeof saved.feedingNotificationsEnabled === 'boolean'
              ? saved.feedingNotificationsEnabled
              : true,
          language: normalizeLanguage(saved.language),
          themeMode: saved.themeMode === 'light' ? 'light' : 'dark',
          children,
          removedRemoteIds: Array.isArray(saved.removedRemoteIds)
            ? saved.removedRemoteIds.filter((id): id is string => typeof id === 'string')
            : [],
          activeChildId: children.some((child) => child.id === saved.activeChildId)
            ? (saved.activeChildId ?? null)
            : null,
          // Existing installs upgrading to this field shouldn't be sent back
          // through onboarding — infer completion from having set up a child.
          onboardingComplete:
            typeof saved.onboardingComplete === 'boolean'
              ? saved.onboardingComplete
              : children.length > 0,
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
