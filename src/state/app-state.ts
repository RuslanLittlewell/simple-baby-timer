import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
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
  claimUnownedSessions,
  deleteAllSessions,
  getLatestFeedingStart,
  resolveOverlappingSessions,
  saveSession,
  eventDurationMs,
  type ActivitySession,
  type EventKind,
  type OverlapResolution,
  type ProDetails,
  type SessionKind,
} from '@/lib/activity-store';
import {
  MAX_CHILDREN,
  isChildGradientKey,
  type Child,
  type ChildGradientKey,
} from '@/lib/children';
import {
  buildLiveActivityLabels,
  startLiveActivity,
  stopLiveActivity,
  updateLiveActivityLastFeeding,
} from '@/lib/live-activity';
import { dateOnlyFromDate } from '@/lib/growth-measurements';
import {
  activateTestPro as activateTestProPurchase,
  clearLiveSession,
  clearSyncState,
  enqueueSessionDelete,
  enqueueSessionUpsert,
  pushLiveSession,
  startTrial as startTrialOnAccount,
  syncChildProfile,
  syncChildToCloud,
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
import { hasProAccess } from '@/lib/pro-access';
import { usePersonalRegimeStore } from '@/state/personal-regime-state';
import { useGrowthStore } from '@/state/growth-state';

const STORAGE_KEY = 'babytimer.settings.v1';

export const TIMER_MIN = 15;
export const TIMER_MAX = 600;
export const TIMER_STEP = 15;

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
  
  
  removedRemoteIds: string[];
  
  onboardingComplete: boolean;
  
  
  
  accountId: string | null;
  /** Countdowns started by hand in settings, so they survive a restart. */
  armedReminders: ArmedReminders;
};

export interface ArmedReminder {
  id: string;
  firesAt: number;
}

type ArmedReminders = Partial<Record<ReminderKind, ArmedReminder>>;

const sanitizeArmedReminders = (value: unknown, now = Date.now()): ArmedReminders => {
  if (!value || typeof value !== 'object') return {};
  const saved = value as Record<string, Partial<ArmedReminder> | undefined>;
  const armed: ArmedReminders = {};
  for (const kind of REMINDER_KINDS) {
    const entry = saved[kind];
    // A countdown that ran out while the app was closed has already been shown.
    if (!entry || typeof entry.id !== 'string' || typeof entry.firesAt !== 'number') continue;
    if (entry.firesAt <= now) continue;
    armed[kind] = { id: entry.id, firesAt: entry.firesAt };
  }
  return armed;
};

const DEFAULT_SETTINGS: Settings = {
  sleepMinutes: 120,
  awakeMinutes: 120,
  feedingMinutes: 180,
  
  
  sleepNotificationsEnabled: false,
  awakeNotificationsEnabled: false,
  feedingNotificationsEnabled: false,
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
      isOwner: item.isOwner === true,
    }))
    .slice(0, MAX_CHILDREN);
};

const clampTimer = (value: number) =>
  Math.min(TIMER_MAX, Math.max(TIMER_MIN, Math.round(value / TIMER_STEP) * TIMER_STEP));
const pickNumber = (value: unknown, clamp: (n: number) => number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value) : fallback;

const reminderMinutes = (settings: Settings, kind: ReminderKind) =>
  kind === 'sleep'
    ? settings.sleepMinutes
    : kind === 'awake'
      ? settings.awakeMinutes
      : settings.feedingMinutes;

export type Session = {
  kind: ActivityKind;
  startedAt: number;
  reminderId: string | null;
  childId?: string;
  
  
  livePushed?: boolean;
  
  
  livePublishedAt?: number;
  proDetails?: ProDetails;
} | null;


export interface RemoteLive {
  childId: string;
  track: LiveTrack;
  kind: ActivityKind;
  startedAt: number;
  proDetails?: ProDetails;
}

const trackOf = (kind: ActivityKind): 'session' | 'feeding' =>
  kind === 'feeding' ? 'feeding' : 'session';

/** Settling is timed by hand on the activity screen and gets no reminder. */
type ReminderKind = Exclude<ActivityKind, 'settling'>;
const REMINDER_KINDS = ['sleep', 'awake', 'feeding'] as const satisfies readonly ReminderKind[];
export type MainActivityKind = Exclude<ActivityKind, 'feeding'>;

type AppStore = PersistedState & {
  
  
  pendingPaywall: boolean;
  setPendingPaywall: (pending: boolean) => void;
  
  
  authRequired: boolean;
  setAuthRequired: (required: boolean) => void;
  dataVersion: number;
  proActive: boolean;
  proExpiresAt?: number;
  proRenewsAt?: number;
  
  
  trialUsed: boolean;
  session: Session;
  feeding: Session;
  remoteLive: RemoteLive[];
  
  
  activitySyncStatus: 'syncing' | 'ready';
  activitySyncGeneration: number;
  beginActivitySync: (generation: number) => void;
  prepareActivitySync: (generation: number, gated: boolean) => void;
  finishActivitySync: (generation: number) => void;
  mainTransitionPending: boolean;
  reconcileRemoteLive: (list: RemoteLive[], requestedAt?: number) => void;
  retryPendingLive: () => Promise<void>;
  stopRemoteActivity: (track: LiveTrack) => Promise<void>;
  transitionMainActivity: (
    kind: MainActivityKind,
    proDetails?: ProDetails,
    handoverAt?: number,
  ) => Promise<void>;
  setSleepMinutes: (value: number) => void;
  setAwakeMinutes: (value: number) => void;
  setFeedingMinutes: (value: number) => void;
  setNotificationsEnabled: (kind: ReminderKind, enabled: boolean) => void;
  /** Starts that reminder's countdown, by default a full interval from now. */
  armReminder: (kind: ReminderKind, firesAt?: number) => Promise<void>;
  cancelArmedReminder: (kind: ReminderKind) => Promise<void>;
  setActiveProDetails: (details: ProDetails) => void;
  setLanguage: (code: LanguageCode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setOnboardingComplete: (complete: boolean) => void;
  addChild: (
    name: string,
    gradientKey: ChildGradientKey,
    birthday: number,
    heightCm: number,
    weightKg: number,
  ) => void;
  updateChild: (
    id: string,
    name: string,
    gradientKey: ChildGradientKey,
    birthday: number,
  ) => void;
  addSharedChild: (child: RemoteChild) => Child | null;
  upsertRemoteChildren: (remote: RemoteChild[]) => void;
  setChildRemoteId: (id: string, remoteId: string) => void;
  removeChild: (id: string) => void;
  clearRemovedRemoteId: (remoteId: string) => void;
  selectChild: (id: string) => void;
  bumpDataVersion: () => void;
  setProStatus: (
    active: boolean,
    expiresAt?: number,
    renewsAt?: number,
    trialUsed?: boolean,
  ) => void;
  setAccountId: (id: string | null) => void;
  
  
  
  clearAccountData: (options?: { keepOnboarding?: boolean }) => Promise<void>;
  activateTestPro: () => Promise<void>;
  startTrial: () => Promise<void>;
  addManualActivity: (
    kind: SessionKind,
    start: number,
    end: number,
    proDetails?: ProDetails,
    milkMl?: number,
    title?: string,
  ) => Promise<void>;
  
  startActivity: (
    kind: ActivityKind,
    startedAt?: number,
    proDetails?: ProDetails,
  ) => Promise<void>;
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


const MIN_AWAKE_MS = 60_000;



const milkOf = (proDetails?: ProDetails) =>
  proDetails?.type === 'feeding' && proDetails.mode === 'bottle'
    ? proDetails.volumeMl
    : undefined;

function recordRegimeWakeUp(session: ActivitySession) {
  if (session.kind !== 'sleep' || !session.childId) return;
  usePersonalRegimeStore
    .getState()
    .recordCompletedSleep(session.childId, session.start, session.end);
}



async function finalizeSession(
  current: NonNullable<Session>,
  endedAt = Date.now(),
): Promise<number> {
  let end = endedAt;
  
  
  
  
  if (current.kind === 'awake' && end - current.startedAt < MIN_AWAKE_MS) return end;
  
  
  if (end <= current.startedAt) end = current.startedAt + 1;
  const session: ActivitySession = {
    id: `${current.startedAt}-${current.kind}`,
    kind: current.kind,
    start: current.startedAt,
    end,
    childId: current.childId,
    milkMl: milkOf(current.proDetails),
    proDetails: current.proDetails,
  };
  await saveSession(session);
  recordRegimeWakeUp(session);
  pushSessionIfShared(session);
  useAppStore.setState((state) => ({ dataVersion: state.dataVersion + 1 }));
  return end;
}

function remoteIdOfChild(childId?: string): string | undefined {
  if (!childId) return undefined;
  return useAppStore.getState().children.find((c) => c.id === childId)?.remoteId;
}

function pushSessionIfShared(session: ActivitySession) {
  const remoteId = remoteIdOfChild(session.childId);
  if (remoteId) enqueueSessionUpsert(remoteId, session);
}

function pushOverlapResolutionIfShared(resolution: OverlapResolution) {
  for (const session of [...resolution.updated, ...resolution.created]) {
    pushSessionIfShared(session);
  }
  for (const session of resolution.deleted) {
    const remoteId = remoteIdOfChild(session.childId);
    if (remoteId) enqueueSessionDelete(remoteId, session);
  }
}

async function clearLiveIfShared(current: NonNullable<Session>, track: LiveTrack) {
  const remoteId = remoteIdOfChild(current.childId);
  if (!remoteId) return;
  try {
    await clearLiveSession(remoteId, track);
  } catch {
  }
}

const latestTimestamp = (...values: (number | null | undefined)[]): number | null =>
  values.reduce<number | null>(
    (latest, value) => value === null || value === undefined
      ? latest
      : latest === null ? value : Math.max(latest, value),
    null,
  );

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      children: [],
      activeChildId: null,
      removedRemoteIds: [],
      onboardingComplete: false,
      accountId: null,
      armedReminders: {},
      pendingPaywall: false,
      authRequired: false,
      dataVersion: 0,
      proActive: false,
      proExpiresAt: undefined,
      proRenewsAt: undefined,
      trialUsed: false,
      session: null,
      feeding: null,
      remoteLive: [],
      activitySyncStatus: 'syncing',
      activitySyncGeneration: 0,
      mainTransitionPending: false,

      beginActivitySync: (generation) => {
        if (generation < get().activitySyncGeneration) return;
        set({ activitySyncStatus: 'syncing', activitySyncGeneration: generation });
      },

      prepareActivitySync: (generation, gated) => {
        if (generation < get().activitySyncGeneration) return;
        set({
          activitySyncStatus: gated ? 'syncing' : 'ready',
          activitySyncGeneration: generation,
        });
      },

      finishActivitySync: (generation) => {
        if (generation !== get().activitySyncGeneration) return;
        set({ activitySyncStatus: 'ready' });
      },

      reconcileRemoteLive: (list, requestedAt = Date.now()) => {
        for (const track of ['session', 'feeding'] as const) {
          const current = get()[track === 'feeding' ? 'feeding' : 'session'];
          if (!current?.livePushed || !current.childId) continue;
          if (current.livePublishedAt && requestedAt < current.livePublishedAt) continue;
          const stillLive = list.some(
            (item) =>
              item.childId === current.childId &&
              item.track === track &&
              item.kind === current.kind &&
              item.startedAt === current.startedAt,
          );
          if (stillLive) continue;
          stopLiveActivity(track, remoteIdOfChild(current.childId) ?? current.childId);
          cancelReminder(current.reminderId);
          set(track === 'feeding' ? { feeding: null } : { session: null });
        }
        set({ remoteLive: list });
      },

      retryPendingLive: async () => {
        for (const track of ['session', 'feeding'] as const) {
          const key = track === 'feeding' ? 'feeding' : 'session';
          const current = get()[key];
          if (!current || current.livePushed) continue;
          const remoteId = remoteIdOfChild(current.childId);
          if (!remoteId) continue;
          const liveFeeding = get().feeding;
          const lastFeedingAt = latestTimestamp(
            await getLatestFeedingStart(current.childId),
            liveFeeding && liveFeeding.childId === current.childId
              ? liveFeeding.startedAt
              : null,
          );
          await pushLiveSession(
            remoteId,
            track,
            current.kind,
            current.startedAt,
            current.proDetails,
            lastFeedingAt,
          );
          const latest = get()[key];
          if (
            !latest ||
            latest.childId !== current.childId ||
            latest.kind !== current.kind ||
            latest.startedAt !== current.startedAt
          ) {
            continue;
          }
          const updated = {
            ...latest,
            livePushed: true,
            livePublishedAt: Date.now(),
          };
          set(track === 'feeding' ? { feeding: updated } : { session: updated });
        }
      },

      stopRemoteActivity: async (track) => {
        if (get().activitySyncStatus === 'syncing') return;
        const state = get();
        const live = state.remoteLive.find(
          (item) => item.track === track && item.childId === state.activeChildId,
        );
        if (!live) return;
        const remoteId = remoteIdOfChild(live.childId);

        set((current) => ({
          remoteLive: current.remoteLive.filter((item) => item !== live),
        }));

        let end = Date.now();
        if (end <= live.startedAt) end = live.startedAt + 1;
        const session: ActivitySession = {
          id: `${live.startedAt}-${live.kind}`,
          kind: live.kind,
          start: live.startedAt,
          end,
          childId: live.childId,
          milkMl: milkOf(live.proDetails),
          proDetails: live.proDetails,
        };
        await saveSession(session);
        recordRegimeWakeUp(session);
        if (remoteId) enqueueSessionUpsert(remoteId, session);
        const continuesAsAwake = live.kind === 'sleep' || live.kind === 'settling';
        if (remoteId && !continuesAsAwake) {
          try {
            await clearLiveSession(remoteId, track);
          } catch {
          }
        }
        set((current) => ({ dataVersion: current.dataVersion + 1 }));

        if (continuesAsAwake) {
          await get().transitionMainActivity('awake', undefined, end);
        }
      },

      transitionMainActivity: async (kind, proDetails, handoverAtInput) => {
        if (get().activitySyncStatus === 'syncing' && handoverAtInput === undefined) return;
        if (get().mainTransitionPending) return;
        set({ mainTransitionPending: true });
        try {
          const state = get();
          if (state.session?.kind === kind) {
            if (proDetails) get().setActiveProDetails(proDetails);
            return;
          }

          const handoverAt = handoverAtInput ?? Date.now();
          const remote = state.session
            ? null
            : (state.remoteLive.find(
                (item) => item.track === 'session' && item.childId === state.activeChildId,
              ) ?? null);

          if (remote) {
            let end = handoverAt;
            if (end <= remote.startedAt) end = remote.startedAt + 1;
            const completed: ActivitySession = {
              id: `${remote.startedAt}-${remote.kind}`,
              kind: remote.kind,
              start: remote.startedAt,
              end,
              childId: remote.childId,
              milkMl: milkOf(remote.proDetails),
              proDetails: remote.proDetails,
            };
            set((current) => ({
              remoteLive: current.remoteLive.filter((item) => item !== remote),
            }));
            await saveSession(completed);
            recordRegimeWakeUp(completed);
            const remoteId = remoteIdOfChild(remote.childId);
            if (remoteId) enqueueSessionUpsert(remoteId, completed);
            set((current) => ({ dataVersion: current.dataVersion + 1 }));
            await get().startActivity(kind, end, proDetails);
            return;
          }

          await get().startActivity(kind, handoverAt, proDetails);
        } finally {
          set({ mainTransitionPending: false });
        }
      },

      setSleepMinutes: (value) => set({ sleepMinutes: clampTimer(value) }),
      setAwakeMinutes: (value) => set({ awakeMinutes: clampTimer(value) }),
      setFeedingMinutes: (value) => set({ feedingMinutes: clampTimer(value) }),
      armReminder: async (kind, firesAt) => {
        const { armedReminders, language } = get();
        await cancelReminder(armedReminders[kind]?.id);
        const at = firesAt ?? Date.now() + reminderMinutes(get(), kind) * 60_000;
        const delayMs = at - Date.now();
        // An interval that has already run out is nothing to wait for.
        const id =
          delayMs > 0
            ? await scheduleActivityNotification(
                {
                  title: translate(language, `kind.${kind}`),
                  body: translate(language, `notif.${kind}.body`),
                },
                delayMs / 1000,
              )
            : null;
        set((state) => ({
          armedReminders: {
            ...state.armedReminders,
            // A refused permission leaves nothing to count down to.
            [kind]: id ? { id, firesAt: at } : undefined,
          },
        }));
      },

      cancelArmedReminder: async (kind) => {
        const armed = get().armedReminders[kind];
        set((state) => ({ armedReminders: { ...state.armedReminders, [kind]: undefined } }));
        await cancelReminder(armed?.id);
      },

      setNotificationsEnabled: (kind, enabled) => {
        const key = `${kind}NotificationsEnabled` as const;
        set({ [key]: enabled });
        if (!enabled) void get().cancelArmedReminder(kind);
        const track = trackOf(kind);
        const current = get()[track];
        if (current?.kind !== kind) return;
        if (enabled) return;
        if (current.reminderId) {
          cancelReminder(current.reminderId);
          const updated = { ...current, reminderId: null };
          set(track === 'feeding' ? { feeding: updated } : { session: updated });
        }
      },
      setActiveProDetails: (details) => {
        if (get().activitySyncStatus === 'syncing') return;
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
      setAuthRequired: (required) => set({ authRequired: required }),
      setThemeMode: (mode) => set({ themeMode: mode }),

      addChild: (name, gradientKey, birthday, heightCm, weightKg) => {
        const trimmed = name.trim();
        const state = get();
        if (
          !trimmed ||
          state.children.length >= MAX_CHILDREN ||
          !Number.isFinite(heightCm) ||
          heightCm <= 0 ||
          !Number.isFinite(weightKg) ||
          weightKg <= 0
        ) return;
        const child: Child = { id: `${Date.now()}`, name: trimmed, gradientKey, birthday, isOwner: true };
        const isFirst = state.children.length === 0;
        set({ children: [...state.children, child], activeChildId: child.id });
        useGrowthStore.getState().addMeasurement({
          childId: child.id,
          measuredOn: dateOnlyFromDate(new Date(birthday)),
          heightCm,
          weightKg,
        });
        const claim = isFirst ? claimUnownedSessions(child.id) : Promise.resolve();
        void claim
          .then(() => syncChildToCloud(child))
          .then((remoteId) => get().setChildRemoteId(child.id, remoteId))
          .catch(() => {});
      },

      updateChild: (id, name, gradientKey, birthday) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          children: state.children.map((child) =>
            child.id === id && (!child.remoteId || child.isOwner === true)
              ? { ...child, name: trimmed, gradientKey, birthday }
              : child,
          ),
        }));
        const child = get().children.find((item) => item.id === id);
        if (child) syncChildProfile(child).catch(() => {});
      },

      addSharedChild: (remote) => {
        const state = get();
        const removedRemoteIds = state.removedRemoteIds.filter((rid) => rid !== remote.remoteId);
        const existing = state.children.find((child) => child.remoteId === remote.remoteId);
        if (existing) {
          const updated = { ...existing, proEnabled: remote.proEnabled };
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
          isOwner: remote.isOwner,
        };
        set({ children: [...state.children, child], activeChildId: child.id, removedRemoteIds });
        return child;
      },

      upsertRemoteChildren: (remote) =>
        set((state) => {
          const children = [...state.children];
          let changed = false;
          for (const item of remote) {
            if (state.removedRemoteIds.includes(item.remoteId)) continue;
            const existingIndex = children.findIndex(
              (child) => child.remoteId === item.remoteId,
            );
            if (existingIndex >= 0) {
              const existing = children[existingIndex];
              if (
                existing.name !== item.name ||
                existing.birthday !== item.birthday ||
                existing.gradientKey !== item.gradientKey ||
                existing.proEnabled !== item.proEnabled ||
                existing.isOwner !== item.isOwner
              ) {
                children[existingIndex] = {
                  ...existing,
                  name: item.name,
                  birthday: item.birthday,
                  gradientKey: isChildGradientKey(item.gradientKey) ? item.gradientKey : 'sky',
                  proEnabled: item.proEnabled,
                  isOwner: item.isOwner,
                };
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
              isOwner: item.isOwner,
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
            child.id === id ? { ...child, remoteId, isOwner: true } : child,
          ),
        })),

      selectChild: (id) =>
        set((state) =>
          state.children.some((child) => child.id === id) ? { activeChildId: id } : {},
        ),

      removeChild: (id) => {
        usePersonalRegimeStore.getState().removeRegime(id);
        useGrowthStore.getState().removeChildMeasurements(id);
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
        });
      },

      clearRemovedRemoteId: (remoteId) =>
        set((state) => ({
          removedRemoteIds: state.removedRemoteIds.filter((id) => id !== remoteId),
        })),

      bumpDataVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
      setAccountId: (id) => set({ accountId: id }),

      clearAccountData: async ({ keepOnboarding = false } = {}) => {
        for (const track of ['session', 'feeding'] as const) {
          const current = get()[track];
          if (!current) continue;
          stopLiveActivity(track, remoteIdOfChild(current.childId) ?? current.childId);
          cancelReminder(current.reminderId);
        }
        /**
         * Download records go first. Any interruption after this point leaves
         * rows the next download supersedes, whereas the reverse order leaves
         * records claiming rows that are already gone - and a claimed range is
         * never requested again.
         */
        await clearSyncState();
        await deleteAllSessions().catch(() => {});
        // The schedule goes with the account, and so do its notifications.
        for (const reminder of usePersonalRegimeStore.getState().settlingReminders) {
          await cancelReminder(reminder.id);
        }
        usePersonalRegimeStore.getState().clear();
        useGrowthStore.getState().clearMeasurements();
        set({
          children: [],
          activeChildId: null,
          removedRemoteIds: [],
          session: null,
          feeding: null,
          remoteLive: [],
          proActive: false,
          proExpiresAt: undefined,
          proRenewsAt: undefined,
          trialUsed: false,
          accountId: null,
          ...(keepOnboarding ? {} : { onboardingComplete: false }),
          pendingPaywall: false,
          dataVersion: get().dataVersion + 1,
        });
      },

      setProStatus: (active, expiresAt, renewsAt, trialUsed = false) =>
        set({
          proActive: active,
          proExpiresAt: expiresAt,
          proRenewsAt: renewsAt,
          trialUsed,
        }),
      activateTestPro: async () => {
        const renewsAt = await activateTestProPurchase();
        set({ proActive: true, proExpiresAt: undefined, proRenewsAt: renewsAt });
      },
      startTrial: async () => {
        const expiresAt = await startTrialOnAccount();
        set({
          proActive: true,
          proExpiresAt: expiresAt,
          proRenewsAt: undefined,
          trialUsed: true,
        });
      },

      addManualActivity: async (kind, start, end, proDetails, milkMl, title) => {
        if (get().activitySyncStatus === 'syncing') return;
        const childId = get().activeChildId ?? undefined;
        const resolution = await resolveOverlappingSessions(kind, start, end, childId);
        pushOverlapResolutionIfShared(resolution);
        const proAccess = hasProAccess(get());
        const session: ActivitySession = {
          id: `${start}-${kind}-${Date.now()}`,
          kind,
          start,
          end,
          childId,
          milkMl,
          proDetails: proAccess ? proDetails : undefined,
          title,
        };
        await saveSession(session);
        recordRegimeWakeUp(session);
        pushSessionIfShared(session);
        set((state) => ({ dataVersion: state.dataVersion + 1 }));
        if (kind === 'feeding') {
          const lastFeedingAt = await getLatestFeedingStart(session.childId);
          updateLiveActivityLastFeeding(
            remoteIdOfChild(session.childId) ?? session.childId ?? 'current',
            get().language,
            lastFeedingAt,
          );
        }
      },

      startActivity: async (kind, startedAtInput, proDetails) => {
        if (get().activitySyncStatus === 'syncing' && !get().mainTransitionPending) return;
        const track = trackOf(kind);
        const {
          sleepMinutes,
          awakeMinutes,
          sleepNotificationsEnabled,
          awakeNotificationsEnabled,
          language,
        } = get();

        // A feed that starts now makes the wait for it pointless.
        if (kind === 'feeding') await get().cancelArmedReminder('feeding');

        const prev = get()[track];
        let startedAt = Math.min(startedAtInput ?? Date.now(), Date.now());
        if (prev) {
          stopLiveActivity(track, remoteIdOfChild(prev.childId) ?? prev.childId);
          await cancelReminder(prev.reminderId);
          startedAt = await finalizeSession(
            prev,
            Math.max(startedAt, prev.startedAt + 1),
          );
        }

        const limitMinutes: number | null =
          kind === 'sleep' ? sleepMinutes : kind === 'awake' ? awakeMinutes : null;
        const elapsedMs = Date.now() - startedAt;

        const notificationsEnabled =
          kind === 'sleep'
            ? sleepNotificationsEnabled
            : kind === 'awake'
              ? awakeNotificationsEnabled
              : false;

        const childId = get().activeChildId ?? undefined;
        const ownerId = remoteIdOfChild(childId) ?? childId ?? 'current';
        const liveFeeding = get().feeding;
        const lastFeedingAt = latestTimestamp(
          await getLatestFeedingStart(childId),
          kind === 'feeding' ? startedAt : null,
          liveFeeding && liveFeeding.childId === childId ? liveFeeding.startedAt : null,
        );

        startLiveActivity(
          track,
          kind,
          startedAt,
          buildLiveActivityLabels(language, kind, lastFeedingAt),
          ownerId,
        );
        if (kind === 'feeding') {
          updateLiveActivityLastFeeding(ownerId, language, lastFeedingAt);
        }

        const started = {
          kind,
          startedAt,
          reminderId: null,
          childId: get().activeChildId ?? undefined,
          proDetails,
        };
        set(track === 'feeding' ? { feeding: started } : { session: started });

        get().retryPendingLive().catch(() => {});

        let reminderId: string | null = null;
        if (notificationsEnabled && limitMinutes !== null) {
          try {
            reminderId = await scheduleActivityNotification(
              {
                title: translate(language, `kind.${kind}`),
                body: translate(language, `notif.${kind}.body`),
              },
              Math.max(1, limitMinutes * 60 - elapsedMs / 1000),
            );
          } catch {
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
                : false;
          if (current?.startedAt === startedAt && stillEnabled) {
            const updated = { ...current, reminderId };
            set(track === 'feeding' ? { feeding: updated } : { session: updated });
          } else {
            await cancelReminder(reminderId);
          }
        }
      },

      stopActivity: async (kind) => {
        if (get().activitySyncStatus === 'syncing') return;
        const track = trackOf(kind);
        const current = get()[track];
        if (!current) return;

        set(track === 'feeding' ? { feeding: null } : { session: null });

        stopLiveActivity(track, remoteIdOfChild(current.childId) ?? current.childId);
        /**
         * The interval between feeds is counted from the start of the one that
         * just ended, and it is armed here because a reminder held by the
         * session itself would be cancelled along with it.
         */
        if (kind === 'feeding' && get().feedingNotificationsEnabled) {
          await get().armReminder('feeding', current.startedAt + get().feedingMinutes * 60_000);
        }
        const continuesAsAwake = kind === 'sleep' || kind === 'settling';
        if (!continuesAsAwake) await clearLiveIfShared(current, track);
        await cancelReminder(current.reminderId);
        const end = await finalizeSession(current);

        if (continuesAsAwake) {
          await get().transitionMainActivity('awake', undefined, end);
        }
      },

      logEvent: async (kind) => {
        if (get().activitySyncStatus === 'syncing') return;
        const start = Date.now();
        const session: ActivitySession = {
          id: `${start}-${kind}`,
          kind,
          start,
          end: start + eventDurationMs(kind),
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
        accountId,
        armedReminders,
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
        accountId,
        armedReminders,
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
          feedingMinutes: pickNumber(saved.feedingMinutes, clampTimer, current.feedingMinutes),
          sleepNotificationsEnabled:
            typeof saved.sleepNotificationsEnabled === 'boolean'
              ? saved.sleepNotificationsEnabled
              : current.sleepNotificationsEnabled,
          awakeNotificationsEnabled:
            typeof saved.awakeNotificationsEnabled === 'boolean'
              ? saved.awakeNotificationsEnabled
              : current.awakeNotificationsEnabled,
          feedingNotificationsEnabled:
            typeof saved.feedingNotificationsEnabled === 'boolean'
              ? saved.feedingNotificationsEnabled
              : current.feedingNotificationsEnabled,
          language: normalizeLanguage(saved.language),
          themeMode: saved.themeMode === 'light' ? 'light' : 'dark',
          children,
          removedRemoteIds: Array.isArray(saved.removedRemoteIds)
            ? saved.removedRemoteIds.filter((id): id is string => typeof id === 'string')
            : [],
          activeChildId: children.some((child) => child.id === saved.activeChildId)
            ? (saved.activeChildId ?? null)
            : null,
          onboardingComplete:
            typeof saved.onboardingComplete === 'boolean'
              ? saved.onboardingComplete
              : children.length > 0,
          accountId: typeof saved.accountId === 'string' ? saved.accountId : null,
          armedReminders: sanitizeArmedReminders(saved.armedReminders),
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

useAppStore.persist.onFinishHydration((state) => {
  const first = state.children[0];
  if (first) claimUnownedSessions(first.id);
});
