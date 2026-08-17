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
  EVENT_DURATION_MS,
  claimUnownedSessions,
  deleteAllSessions,
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
  clearSyncState,
  enqueueSessionUpsert,
  pushLiveSession,
  startTrial as startTrialOnAccount,
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

const STORAGE_KEY = 'babytimer.settings.v1';

export const TIMER_MIN = 15;
export const TIMER_MAX = 600;
export const TIMER_STEP = 15;

export const SETTLING_MIN = 5;
export const SETTLING_MAX = 120;
export const SETTLING_STEP = 5;

type Settings = {
  sleepMinutes: number;
  awakeMinutes: number;
  settlingMinutes: number;
  sleepNotificationsEnabled: boolean;
  awakeNotificationsEnabled: boolean;
  settlingNotificationsEnabled: boolean;
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
  // Which account the data on this device belongs to. Sync compares it with
  // whoever just signed in: a different id means the device changed hands and
  // the previous account's children must not stay on screen.
  accountId: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  sleepMinutes: 120,
  awakeMinutes: 120,
  settlingMinutes: 30,
  // Reminders stay off until the parent asks for them: an app that starts
  // buzzing on its own, around a sleeping baby, is the wrong first impression.
  sleepNotificationsEnabled: false,
  awakeNotificationsEnabled: false,
  settlingNotificationsEnabled: false,
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
const clampSettling = (value: number) =>
  Math.min(SETTLING_MAX, Math.max(SETTLING_MIN, Math.round(value / SETTLING_STEP) * SETTLING_STEP));
const pickNumber = (value: unknown, clamp: (n: number) => number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value) : fallback;

export type Session = {
  kind: ActivityKind;
  startedAt: number;
  reminderId: string | null;
  // Time already spent on this activity in the runs that led into this one —
  // see ReminderChain.
  carriedMs?: number;
  childId?: string;
  // True once the timer was announced in live_sessions — only such timers may
  // be cancelled locally when the partner stops them remotely.
  livePushed?: boolean;
  // A refresh requested before this publication completed cannot prove that
  // the newly published timer was removed remotely.
  livePublishedAt?: number;
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

type ReminderKind = Exclude<ActivityKind, 'feeding'>;
export type MainActivityKind = Exclude<ActivityKind, 'feeding'>;

// Stopping an activity and starting the same one again continues one reminder
// instead of restarting it: two hours of sleep split into 1h + 1h still warns
// at the two-hour mark. A different activity in between, or a long pause, ends
// the chain — and simply stopping without restarting cancels the reminder.
const CHAIN_GAP_MS = 15 * 60_000;

interface ReminderChain {
  kind: ReminderKind;
  elapsedMs: number;
  endedAt: number;
}

const carriedFor = (chain: ReminderChain | null, kind: ReminderKind, now: number) =>
  chain && chain.kind === kind && now - chain.endedAt <= CHAIN_GAP_MS ? chain.elapsedMs : 0;

type AppStore = PersistedState & {
  // Transient (not persisted): what the last finished activity leaves behind
  // for a follow-up run of the same kind.
  reminderChain: ReminderChain | null;
  // Transient (not persisted): tells the root layout to show the Paywall
  // once, right after onboarding hands off into the app.
  pendingPaywall: boolean;
  setPendingPaywall: (pending: boolean) => void;
  // Transient (not persisted): the account check found no usable account, so
  // the app puts the sign-in screen in front of everything.
  authRequired: boolean;
  setAuthRequired: (required: boolean) => void;
  dataVersion: number;
  proActive: boolean;
  proExpiresAt?: number;
  proRenewsAt?: number;
  // Server-derived: true once the account has started its trial, so the paywall
  // stops offering it — during the trial and forever after it.
  trialUsed: boolean;
  session: Session;
  feeding: Session;
  remoteLive: RemoteLive[];
  // Transient: activity controls stay locked until the current foreground
  // pass has reconciled children, history and live timers.
  activitySyncStatus: 'syncing' | 'ready';
  activitySyncGeneration: number;
  beginActivitySync: (generation: number) => void;
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
  setSettlingMinutes: (value: number) => void;
  setNotificationsEnabled: (kind: ReminderKind, enabled: boolean) => void;
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
  setProStatus: (
    active: boolean,
    expiresAt?: number,
    renewsAt?: number,
    trialUsed?: boolean,
  ) => void;
  setAccountId: (id: string | null) => void;
  // Everything the account owns on this device: children, history, running
  // timers and PRO state. Deleting the account also sends the app back through
  // onboarding; swapping accounts keeps it, since setup is already done.
  clearAccountData: (options?: { keepOnboarding?: boolean }) => Promise<void>;
  activateTestPro: () => Promise<void>;
  startTrial: () => Promise<void>;
  addManualActivity: (
    kind: ActivityKind,
    start: number,
    end: number,
    proDetails?: ProDetails,
    milkMl?: number,
  ) => Promise<void>;
  // startedAt back-dates the timer; it defaults to now and never runs ahead.
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

// Shortest awake stretch worth recording — see finalizeSession.
const MIN_AWAKE_MS = 60_000;

// The volume lives in the pro details; the top-level field is what the day
// stats and the timeline read, so keep the two in step.
const milkOf = (proDetails?: ProDetails) =>
  proDetails?.type === 'feeding' && proDetails.mode === 'bottle'
    ? proDetails.volumeMl
    : undefined;

// Returns the moment the session was closed, so a follow-up activity can start
// exactly there instead of a few milliseconds later.
async function finalizeSession(
  current: NonNullable<Session>,
  endedAt = Date.now(),
): Promise<number> {
  let end = endedAt;
  // Awake is started automatically when sleep or settling stops, so a few
  // seconds of it is the seam between two activities rather than a record.
  // Dropping it leaves the reminder chain untouched: as far as the timers are
  // concerned this stretch never happened.
  if (current.kind === 'awake' && end - current.startedAt < MIN_AWAKE_MS) return end;
  // Preserve even accidental/very short starts so the calendar can expose
  // them for editing or deletion. The timeline gives them a larger hit area.
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
  pushSessionIfShared(session);
  useAppStore.setState((state) => ({
    dataVersion: state.dataVersion + 1,
    reminderChain:
      current.kind === 'feeding'
        ? null
        : {
            kind: current.kind,
            elapsedMs: (current.carriedMs ?? 0) + (end - current.startedAt),
            endedAt: end,
          },
  }));
  return end;
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

// A true stop waits for its delete so a subsequent start cannot be removed by
// a late request against the same (child_id, track) row.
async function clearLiveIfShared(current: NonNullable<Session>, track: LiveTrack) {
  const remoteId = remoteIdOfChild(current.childId);
  if (!remoteId) return;
  try {
    await clearLiveSession(remoteId, track);
  } catch {
    // Local timers remain authoritative while offline.
  }
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
      accountId: null,
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
      reminderChain: null,

      beginActivitySync: (generation) => {
        if (generation < get().activitySyncGeneration) return;
        set({ activitySyncStatus: 'syncing', activitySyncGeneration: generation });
      },

      finishActivitySync: (generation) => {
        if (generation !== get().activitySyncGeneration) return;
        set({ activitySyncStatus: 'ready' });
      },

      // Applies the fresh live-timer list; also cancels local timers that the
      // partner already stopped (they saved the completed record themselves).
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
          stopLiveActivity(track);
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
          await pushLiveSession(
            remoteId,
            track,
            current.kind,
            current.startedAt,
            current.proDetails,
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

      // Stops a timer that runs on the partner's device. A true final stop
      // removes the live row; sleep/settling hand over that same row to awake.
      stopRemoteActivity: async (track) => {
        if (get().activitySyncStatus === 'syncing') return;
        const state = get();
        const live = state.remoteLive.find(
          (item) => item.track === track && item.childId === state.activeChildId,
        );
        if (!live) return;
        const remoteId = remoteIdOfChild(live.childId);

        // Give immediate visual feedback. Persistence and remote cleanup can
        // finish after the active timer has disappeared from the interface.
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
        if (remoteId) enqueueSessionUpsert(remoteId, session);
        const continuesAsAwake = live.kind === 'sleep' || live.kind === 'settling';
        if (remoteId && !continuesAsAwake) {
          try {
            await clearLiveSession(remoteId, track);
          } catch {
            // The stopped remote timer has already disappeared locally.
          }
        }
        set((current) => ({
          dataVersion: current.dataVersion + 1,
          // Stopping a partner-run timer is also an explicit end, so a future
          // activity must receive its full reminder interval.
          reminderChain: null,
        }));

        // Same hand-over as a local stop: whoever closes the sleep starts the
        // awake stretch, and only that device does it.
        if (continuesAsAwake) {
          await get().transitionMainActivity('awake', undefined, end);
        }
      },

      transitionMainActivity: async (kind, proDetails, handoverAtInput) => {
        // A timestamp is supplied only by an activity operation that already
        // owns the handover (for example sleep -> awake). Let that operation
        // finish if foreground sync begins while it is in flight.
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
            const remoteId = remoteIdOfChild(remote.childId);
            if (remoteId) enqueueSessionUpsert(remoteId, completed);
            set((current) => ({
              dataVersion: current.dataVersion + 1,
              reminderChain: null,
            }));
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
      setSettlingMinutes: (value) => set({ settlingMinutes: clampSettling(value) }),
      setNotificationsEnabled: (kind, enabled) => {
        const key = `${kind}NotificationsEnabled` as const;
        set({ [key]: enabled });
        const track = trackOf(kind);
        const current = get()[track];
        if (current?.kind !== kind) return;
        if (enabled) {
          startLiveActivity(
            track,
            kind,
            current.startedAt - (current.carriedMs ?? 0),
            liveActivityLabels(get().language, kind, current.startedAt),
          );
          return;
        }
        stopLiveActivity(track);
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

      addChild: (name, gradientKey, birthday) => {
        const trimmed = name.trim();
        const state = get();
        if (!trimmed || state.children.length >= MAX_CHILDREN) return;
        const child: Child = { id: `${Date.now()}`, name: trimmed, gradientKey, birthday };
        const isFirst = state.children.length === 0;
        set({ children: [...state.children, child], activeChildId: child.id });
        // The first child adopts the history recorded before children existed.
        const claim = isFirst ? claimUnownedSessions(child.id) : Promise.resolve();
        // Local creation stays instant and offline-friendly. Once signed in,
        // the idempotent server RPC links the child and uploads its history;
        // syncNow retries this path after any temporary failure.
        void claim
          .then(() => syncChildToCloud(child))
          .then((remoteId) => get().setChildRemoteId(child.id, remoteId))
          .catch(() => {});
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
            child.id === id ? { ...child, remoteId } : child,
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
      setAccountId: (id) => set({ accountId: id }),

      clearAccountData: async ({ keepOnboarding = false } = {}) => {
        // Stop anything running first: a reminder or Live Activity would
        // otherwise outlive the data it refers to.
        for (const track of ['session', 'feeding'] as const) {
          const current = get()[track];
          if (!current) continue;
          stopLiveActivity(track);
          cancelReminder(current.reminderId);
        }
        set({
          children: [],
          activeChildId: null,
          removedRemoteIds: [],
          session: null,
          feeding: null,
          remoteLive: [],
          reminderChain: null,
          proActive: false,
          proExpiresAt: undefined,
          proRenewsAt: undefined,
          trialUsed: false,
          accountId: null,
          // Back to square one: without this the app keeps thinking setup is
          // done and lands on an activity screen that has no child to show.
          // A swap between accounts keeps it — that device is already set up.
          ...(keepOnboarding ? {} : { onboardingComplete: false }),
          // A gate that asked for the paywall just before the account went
          // away must not get its modal afterwards.
          pendingPaywall: false,
          dataVersion: get().dataVersion + 1,
        });
        await deleteAllSessions();
        await clearSyncState();
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

      addManualActivity: async (kind, start, end, proDetails, milkMl) => {
        if (get().activitySyncStatus === 'syncing') return;
        const activeChild = get().children.find((child) => child.id === get().activeChildId);
        const hasProAccess = get().proActive || activeChild?.proEnabled === true;
        const session: ActivitySession = {
          id: `${start}-${kind}-${Date.now()}`,
          kind,
          start,
          end,
          childId: get().activeChildId ?? undefined,
          milkMl,
          proDetails: hasProAccess ? proDetails : undefined,
        };
        await saveSession(session);
        pushSessionIfShared(session);
        set((state) => ({ dataVersion: state.dataVersion + 1 }));
      },

      startActivity: async (kind, startedAtInput, proDetails) => {
        // Nested replacement starts run while mainTransitionPending is true and
        // must finish even if the app begins syncing between its two writes.
        if (get().activitySyncStatus === 'syncing' && !get().mainTransitionPending) return;
        const track = trackOf(kind);
        const {
          sleepMinutes,
          awakeMinutes,
          settlingMinutes,
          sleepNotificationsEnabled,
          awakeNotificationsEnabled,
          settlingNotificationsEnabled,
          language,
        } = get();

        const prev = get()[track];
        let startedAt = Math.min(startedAtInput ?? Date.now(), Date.now());
        if (prev) {
          // The replacement may have its notifications disabled and therefore
          // may not start another widget; always close the previous one first.
          stopLiveActivity(track);
          await cancelReminder(prev.reminderId);
          startedAt = await finalizeSession(
            prev,
            Math.max(startedAt, prev.startedAt + 1),
          );
        }

        // A back-dated start (the pro panel lets one be picked) still counts
        // its reminder and auto-stop from now, not from the timer's origin.
        const limitMinutes: number | null =
          kind === 'sleep'
            ? sleepMinutes
            : kind === 'awake'
              ? awakeMinutes
              : kind === 'settling'
                ? settlingMinutes
                : null;
        // Time already served by an immediately preceding run of the same kind.
        // A chain that already used up the limit has had its reminder, so the
        // next run starts a fresh one instead of firing at once.
        const carried =
          kind === 'feeding' ? 0 : carriedFor(get().reminderChain, kind, Date.now());
        const carriedMs =
          limitMinutes !== null && carried < limitMinutes * 60_000 ? carried : 0;
        const elapsedMs = Date.now() - startedAt + carriedMs;

        const notificationsEnabled =
          kind === 'sleep'
            ? sleepNotificationsEnabled
            : kind === 'awake'
              ? awakeNotificationsEnabled
              : kind === 'settling'
                ? settlingNotificationsEnabled
                : false;

        // Time carried over from a preceding run of the same kind belongs on
        // the widget's clock too, so it starts from the earlier point.
        if (notificationsEnabled) {
          startLiveActivity(
            track,
            kind,
            startedAt - carriedMs,
            liveActivityLabels(language, kind, startedAt),
          );
        }

        // Publish the active timer before requesting notification permission.
        // This lets a quick second tap stop it while scheduling is still in flight.
        const started = {
          kind,
          startedAt,
          reminderId: null,
          carriedMs,
          childId: get().activeChildId ?? undefined,
          proDetails,
        };
        set(track === 'feeding' ? { feeding: started } : { session: started });

        // Announce the timer to the partner's devices.
        get().retryPendingLive().catch(() => {});

        let reminderId: string | null = null;
        if (notificationsEnabled && limitMinutes !== null) {
          try {
            reminderId = await scheduleActivityNotification(
              {
                title: translate(language, `notif.${kind}.title`),
                body: translate(language, `notif.${kind}.body`),
              },
              Math.max(1, limitMinutes * 60 - elapsedMs / 1000),
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
                : kind === 'settling'
                  ? latest.settlingNotificationsEnabled
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
        if (get().activitySyncStatus === 'syncing') return;
        const track = trackOf(kind);
        const current = get()[track];
        if (!current) return;

        // Update the UI before waiting for native notification APIs and local
        // persistence. The captured session is still finalized below.
        set(track === 'feeding' ? { feeding: null } : { session: null });

        stopLiveActivity(track);
        const continuesAsAwake = kind === 'sleep' || kind === 'settling';
        if (!continuesAsAwake) await clearLiveIfShared(current, track);
        await cancelReminder(current.reminderId);
        const end = await finalizeSession(current);

        // Pressing Stop is an explicit end, not a pause. Discard any elapsed
        // reminder time so starting the same activity again always schedules
        // its full configured interval (for example, a new sleep gets 2h).
        set({ reminderChain: null });

        // Waking up is the natural continuation of sleep and of settling, so
        // the awake timer picks up at the very moment they stop — otherwise the
        // day leaves an untracked hole in the timeline.
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
        settlingMinutes,
        sleepNotificationsEnabled,
        awakeNotificationsEnabled,
        settlingNotificationsEnabled,
        language,
        themeMode,
        children,
        activeChildId,
        removedRemoteIds,
        onboardingComplete,
        accountId,
      }) => ({
        sleepMinutes,
        awakeMinutes,
        settlingMinutes,
        sleepNotificationsEnabled,
        awakeNotificationsEnabled,
        settlingNotificationsEnabled,
        language,
        themeMode,
        children,
        activeChildId,
        removedRemoteIds,
        onboardingComplete,
        accountId,
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
          settlingMinutes: pickNumber(
            saved.settlingMinutes,
            clampSettling,
            current.settlingMinutes,
          ),
          sleepNotificationsEnabled:
            typeof saved.sleepNotificationsEnabled === 'boolean'
              ? saved.sleepNotificationsEnabled
              : current.sleepNotificationsEnabled,
          awakeNotificationsEnabled:
            typeof saved.awakeNotificationsEnabled === 'boolean'
              ? saved.awakeNotificationsEnabled
              : current.awakeNotificationsEnabled,
          settlingNotificationsEnabled:
            typeof saved.settlingNotificationsEnabled === 'boolean'
              ? saved.settlingNotificationsEnabled
              : current.settlingNotificationsEnabled,
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
          // Installs from before this field get claimed by whoever signs in
          // next, so their own data is not treated as another account's.
          accountId: typeof saved.accountId === 'string' ? saved.accountId : null,
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
