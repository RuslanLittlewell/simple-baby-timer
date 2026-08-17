import { type RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  checkAccount,
  getIsSignedIn,
  getUserId,
  isSupabaseConfigured,
  signOutLocal,
  supabase,
} from '@/lib/supabase';
import {
  fetchLiveSessions,
  fetchAccountProStatus,
  fetchRemoteChildren,
  flushQueue,
  leaveChild,
  pullChildSessions,
  syncChildToCloud,
  syncChildProfile,
} from '@/lib/sync';
import {
  fetchEntitlement,
  forgetPurchaser,
  identifyPurchaser,
  type ProEntitlement,
} from '@/lib/purchases';
import { useAppStore, type RemoteLive } from '@/state/app-state';

type SyncOutcome = 'success' | 'unavailable' | 'auth-required' | 'failed';

const ACTIVITY_SYNC_TIMEOUT_MS = 15_000;
let requestedSyncGeneration = 0;
let completedSyncGeneration = 0;
let syncRunner: Promise<void> | null = null;
const gateTimers = new Map<number, ReturnType<typeof setTimeout>>();

// One full pass. The coordinator below serializes calls so this body never
// races another copy of itself.
async function performSyncPass(): Promise<SyncOutcome> {
  if (!isSupabaseConfigured) return 'unavailable';
  try {
    // The account comes first: entering the app (and every return to it)
    // re-checks that it still exists, and only then is there any point in
    // uploading or pulling anything.
    const account = await checkAccount();
    // Offline: keep whatever the last successful pass established.
    if (account === 'unreachable') return 'unavailable';
    if (account !== 'ok') {
      if (account === 'missing') await signOutLocal();
      useAppStore.getState().setProStatus(false);
      useAppStore.getState().setAuthRequired(true);
      return 'auth-required';
    }
    useAppStore.getState().setAuthRequired(false);

    // A different account on the same device: its owner must not inherit the
    // previous one's children. Their own are restored from the server further
    // down; anything that lived only on this device belonged to the account
    // that left and goes with it.
    const userId = await getUserId();
    const known = useAppStore.getState().accountId;
    if (userId && known !== userId) {
      if (known) {
        await useAppStore.getState().clearAccountData({ keepOnboarding: true });
      }
      // Notification consent is account-specific. A newly attached account
      // starts with every reminder (and its matching Live Activity) disabled,
      // even when another account enabled them on this device before.
      for (const kind of ['sleep', 'awake', 'settling'] as const) {
        useAppStore.getState().setNotificationsEnabled(kind, false);
      }
    }
    // Only ever record a real id: overwriting it with null would make the next
    // account look like the same one and let its children through.
    if (userId) useAppStore.getState().setAccountId(userId);
    // Purchases belong to the account, not the device.
    if (userId) await identifyPurchaser(userId);

    await flushQueue();

    // Subscription and trial are re-evaluated here, so a plan that ran out
    // while the app was closed locks PRO again on the way in. Two sources:
    // the profile row, which the RevenueCat webhook keeps current and which
    // the server's RLS trusts, and the receipt on the device, which is right
    // the instant a purchase completes — before any webhook has landed.
    const pro = await fetchAccountProStatus();
    const receipt = await fetchEntitlement().catch(() => ({ active: false }) as ProEntitlement);
    useAppStore
      .getState()
      .setProStatus(
        pro.active || receipt.active,
        pro.expiresAt ?? receipt.expiresAt,
        pro.renewsAt ?? receipt.renewsAt,
        pro.trialUsed,
      );

    const { removedRemoteIds, clearRemovedRemoteId } = useAppStore.getState();
    for (const remoteId of removedRemoteIds) {
      await leaveChild(remoteId);
      clearRemovedRemoteId(remoteId);
    }

    for (const child of useAppStore.getState().children) {
      if (child.remoteId) {
        await syncChildProfile(child);
        continue;
      }
      const remoteId = await syncChildToCloud(child);
      useAppStore.getState().setChildRemoteId(child.id, remoteId);
    }

    const remote = await fetchRemoteChildren();
    useAppStore.getState().upsertRemoteChildren(remote);

    const { children, bumpDataVersion } = useAppStore.getState();
    let applied = 0;
    for (const child of children) {
      if (!child.remoteId) continue;
      applied += await pullChildSessions(child.remoteId, child.id);
    }
    if (applied > 0) bumpDataVersion();
    await refreshLive();
    return 'success';
  } catch {
    // Offline or Supabase unreachable — the queue survives, retry later.
    return 'failed';
  }
}

async function drainSyncRequests(): Promise<void> {
  try {
    while (completedSyncGeneration < requestedSyncGeneration) {
      // Requests that arrive during this pass advance requestedSyncGeneration;
      // the loop then performs one fresh follow-up for all of them.
      const generation = requestedSyncGeneration;
      await performSyncPass();
      completedSyncGeneration = generation;
      const timer = gateTimers.get(generation);
      if (timer) clearTimeout(timer);
      gateTimers.delete(generation);
      useAppStore.getState().finishActivitySync(generation);
    }
  } finally {
    syncRunner = null;
  }
}

// Full sync requests are single-flight. A foreground request explicitly asks
// for a pass that starts after any older in-flight work; ordinary duplicate
// callers join the current runner.
export function syncNow({ fresh = false }: { fresh?: boolean } = {}): Promise<void> {
  if (!syncRunner || fresh) {
    const generation = ++requestedSyncGeneration;
    useAppStore.getState().beginActivitySync(generation);
    gateTimers.set(
      generation,
      setTimeout(() => {
        gateTimers.delete(generation);
        // Fail open for offline/hung requests. Generation matching prevents an
        // old timeout from releasing a newer foreground gate.
        useAppStore.getState().finishActivitySync(generation);
      }, ACTIVITY_SYNC_TIMEOUT_MS),
    );
  }
  if (!syncRunner) syncRunner = drainSyncRequests();
  return syncRunner;
}

// Fetches the partner's currently running timers for every shared child and
// hands them to the store (which also cancels remotely stopped local timers).
async function refreshLivePass(): Promise<void> {
  const { children, reconcileRemoteLive, retryPendingLive } = useAppStore.getState();
  const shared = children.filter((child) => child.remoteId);
  if (!shared.length) {
    reconcileRemoteLive([]);
    return;
  }
  await retryPendingLive();
  const requestedAt = Date.now();
  const rows = await fetchLiveSessions(shared.map((child) => child.remoteId!));
  const localIdByRemote = new Map(shared.map((child) => [child.remoteId!, child.id]));
  const mapped: RemoteLive[] = [];
  for (const row of rows) {
    const childId = localIdByRemote.get(row.remoteChildId);
    if (childId) {
      mapped.push({
        childId,
        track: row.track,
        kind: row.kind,
        startedAt: row.startedAt,
        proDetails: row.proDetails,
      });
    }
  }
  reconcileRemoteLive(mapped, requestedAt);
}

// Foreground and realtime live snapshots share one ordered lane. A response
// can therefore never overtake a snapshot requested before it.
let liveRefreshTail: Promise<void> = Promise.resolve();

function refreshLive(): Promise<void> {
  const next = liveRefreshTail.then(refreshLivePass);
  liveRefreshTail = next.catch(() => {});
  return next;
}

let liveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleLiveRefresh() {
  if (liveRefreshTimer) clearTimeout(liveRefreshTimer);
  liveRefreshTimer = setTimeout(() => {
    liveRefreshTimer = null;
    refreshLive().catch(() => {});
  }, 200);
}

// Realtime events arrive in bursts (own echo included) — collapse them into
// one cursor-based pull per child.
const pullTimers = new Map<string, ReturnType<typeof setTimeout>>();

function schedulePull(remoteId: string, localChildId: string) {
  const pending = pullTimers.get(remoteId);
  if (pending) clearTimeout(pending);
  pullTimers.set(
    remoteId,
    setTimeout(async () => {
      pullTimers.delete(remoteId);
      try {
        const applied = await pullChildSessions(remoteId, localChildId);
        if (applied > 0) useAppStore.getState().bumpDataVersion();
      } catch {
        // Foreground sync will catch up.
      }
    }, 300),
  );
}

// Runs a sync pass on app start / foreground and keeps realtime subscriptions
// on the sessions table for every shared child while the app is open.
export function useSync() {
  const children = useAppStore((state) => state.children);
  const [authed, setAuthed] = useState(false);

  // Track the auth state so subscriptions (re)start right after sign-in.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getIsSignedIn().then(setAuthed);
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      if (session) {
        void syncNow({ fresh: true });
        return;
      }
      const syncState = useAppStore.getState();
      syncState.finishActivitySync(syncState.activitySyncGeneration);
      useAppStore.getState().setProStatus(false);
      useAppStore.getState().setAuthRequired(true);
      // Purchases go back to an anonymous id, so the next person to sign in on
      // this device does not inherit the subscription.
      void forgetPurchaser();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void syncNow();
    if (!isSupabaseConfigured) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow({ fresh: true });
    });
    return () => subscription.remove();
  }, []);

  const sharedKey = children
    .filter((child) => child.remoteId)
    .map((child) => `${child.remoteId}:${child.id}`)
    .join(',');

  useEffect(() => {
    if (!isSupabaseConfigured || !authed || !sharedKey) return;

    const channels: RealtimeChannel[] = [];
    for (const child of useAppStore.getState().children) {
      if (!child.remoteId) continue;
      const remoteId = child.remoteId;
      const localChildId = child.id;
      channels.push(
        supabase
          .channel(`sessions-${remoteId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sessions',
              filter: `child_id=eq.${remoteId}`,
            },
            () => schedulePull(remoteId, localChildId),
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'live_sessions',
              filter: `child_id=eq.${remoteId}`,
            },
            () => scheduleLiveRefresh(),
          )
          .subscribe(),
      );
    }

    return () => {
      for (const channel of channels) supabase.removeChannel(channel);
    };
  }, [sharedKey, authed]);
}
