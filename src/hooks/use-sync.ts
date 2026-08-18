import { type RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  checkAccount,
  getUserId,
  isOAuthInFlight,
  isSupabaseConfigured,
  signOutLocal,
  supabase,
} from '@/lib/supabase';
import { logAuthDiagnostic } from '@/lib/auth-diagnostics';
import { authGeneration } from '@/lib/auth-generation';
import {
  accountOutcomeRequiresGate,
  authEventRequiresGate,
  isForegroundEdge,
} from '@/lib/auth-lifecycle';
import { SingleFlightCoordinator } from '@/lib/single-flight-coordinator';
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
const gateTimers = new Map<number, ReturnType<typeof setTimeout>>();

// One full pass. The coordinator below serializes calls so this body never
// races another copy of itself.
async function performSyncPass(generation: number): Promise<SyncOutcome> {
  const capturedAuthGeneration = authGeneration.snapshot();
  const isCurrentAuth = () => authGeneration.isCurrent(capturedAuthGeneration);
  logAuthDiagnostic('sync-start', {
    syncGeneration: generation,
    authGeneration: capturedAuthGeneration,
  });
  if (!isSupabaseConfigured) return 'unavailable';
  try {
    // The account comes first: entering the app (and every return to it)
    // re-checks that it still exists, and only then is there any point in
    // uploading or pulling anything.
    const account = await checkAccount();
    if (!isCurrentAuth()) return 'unavailable';
    // Offline: keep whatever the last successful pass established.
    if (account === 'inconclusive') return 'unavailable';
    if (accountOutcomeRequiresGate(account)) {
      // Returning from the provider sheet raises a foreground edge, and that
      // pass lands here while the code is still on its way to being exchanged:
      // there is no session yet, which is not the same as having lost one.
      // Signing out now would also wipe the PKCE verifier and break the
      // exchange that is about to run.
      if (isOAuthInFlight()) return 'unavailable';
      await signOutLocal();
      if (!isCurrentAuth()) return 'unavailable';
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
    if (!isCurrentAuth()) return 'unavailable';
    const known = useAppStore.getState().accountId;
    if (userId && known !== userId) {
      if (known) {
        await useAppStore.getState().clearAccountData({ keepOnboarding: true });
        if (!isCurrentAuth()) return 'unavailable';
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
    if (!isCurrentAuth()) return 'unavailable';

    await flushQueue();
    if (!isCurrentAuth()) return 'unavailable';

    // Subscription and trial are re-evaluated here, so a plan that ran out
    // while the app was closed locks PRO again on the way in. Two sources:
    // the profile row, which the RevenueCat webhook keeps current and which
    // the server's RLS trusts, and the receipt on the device, which is right
    // the instant a purchase completes — before any webhook has landed.
    const pro = await fetchAccountProStatus();
    const receipt = await fetchEntitlement().catch(() => ({ active: false }) as ProEntitlement);
    if (!isCurrentAuth()) return 'unavailable';
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
      if (!isCurrentAuth()) return 'unavailable';
      clearRemovedRemoteId(remoteId);
    }

    for (const child of useAppStore.getState().children) {
      if (child.remoteId) {
        await syncChildProfile(child);
        if (!isCurrentAuth()) return 'unavailable';
        continue;
      }
      const remoteId = await syncChildToCloud(child);
      if (!isCurrentAuth()) return 'unavailable';
      useAppStore.getState().setChildRemoteId(child.id, remoteId);
    }

    const remote = await fetchRemoteChildren();
    if (!isCurrentAuth()) return 'unavailable';
    useAppStore.getState().upsertRemoteChildren(remote);

    const { children, bumpDataVersion } = useAppStore.getState();
    let applied = 0;
    for (const child of children) {
      if (!child.remoteId) continue;
      applied += await pullChildSessions(child.remoteId, child.id);
      if (!isCurrentAuth()) return 'unavailable';
    }
    if (applied > 0) bumpDataVersion();
    await refreshLive();
    if (!isCurrentAuth()) return 'unavailable';
    return 'success';
  } catch {
    // Offline or Supabase unreachable — the queue survives, retry later.
    return 'failed';
  }
}

const syncCoordinator = new SingleFlightCoordinator(async (generation) => {
  const outcome = await performSyncPass(generation);
  logAuthDiagnostic('sync-result', { outcome, syncGeneration: generation });
  const timer = gateTimers.get(generation);
  if (timer) clearTimeout(timer);
  gateTimers.delete(generation);
  useAppStore.getState().finishActivitySync(generation);
});

// Full sync requests are single-flight. A foreground request explicitly asks
// for a pass that starts after any older in-flight work; ordinary duplicate
// callers join the current runner.
export function syncNow({ fresh = false }: { fresh?: boolean } = {}): Promise<void> {
  return syncCoordinator.request(fresh, (generation) => {
    logAuthDiagnostic('sync-request', { fresh, syncGeneration: generation });
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
  });
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
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const hasSession = !!session;
      if (session) {
        const verified = authGeneration.observeVerifiedSession();
        setAuthed(true);
        logAuthDiagnostic('auth-event', {
          authEvent: event,
          hasSession: true,
          authGeneration: verified.generation,
        });
        useAppStore.getState().setAuthRequired(false);
        // INITIAL_SESSION is covered by the mount pass. Supabase can emit
        // SIGNED_IN again when revalidating an existing session, so only a
        // transition from no session requests a fresh account sync.
        if (verified.isNew) {
          logAuthDiagnostic('verified-session', {
            stage: 'gate-transition',
            authGeneration: verified.generation,
            hasSession: true,
          });
          void syncNow({ fresh: true });
        }
        return;
      }
      setAuthed(false);
      logAuthDiagnostic('auth-event', {
        authEvent: event,
        hasSession: false,
        authGeneration: authGeneration.snapshot(),
      });
      // A null payload is meaningful only for the initial recovery result or
      // an explicit SDK SIGNED_OUT event. Other auth events must not turn a
      // transient observation into a destructive UI transition.
      if (!authEventRequiresGate(event, hasSession)) return;
      // Same reason as in the sync pass: a sign-in in progress has no session
      // yet, and the sign-out it triggers here would cancel itself.
      if (isOAuthInFlight()) return;
      authGeneration.observeMissingSession();
      const capturedGeneration = authGeneration.snapshot();
      // Supabase awaits auth callbacks. Verify outside this callback so
      // getSession cannot deadlock initialization and so a newer session wins.
      queueMicrotask(() => {
        void (async () => {
          const { data: current } = await supabase.auth.getSession();
          if (current.session || !authGeneration.isCurrent(capturedGeneration)) {
            logAuthDiagnostic('auth-event', {
              authEvent: event,
              stage: 'stale-rejected',
              authGeneration: capturedGeneration,
              hasSession: !!current.session,
            });
            return;
          }
          if (!authGeneration.claimMissingEffects(capturedGeneration)) return;
          const syncState = useAppStore.getState();
          syncState.finishActivitySync(syncState.activitySyncGeneration);
          syncState.setProStatus(false);
          syncState.setAuthRequired(true);
          // Purchases go back to an anonymous id, so the next person to sign in
          // on this device does not inherit the subscription.
          await forgetPurchaser();
        })();
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let disposed = false;
    let previousState = AppState.currentState;

    const startForegroundAuth = async (fresh: boolean) => {
      await supabase.auth.startAutoRefresh();
      if (!disposed) await syncNow({ fresh });
    };

    if (previousState === 'active') void startForegroundAuth(false);
    else void supabase.auth.stopAutoRefresh();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === previousState) return;
      const previous = previousState;
      previousState = nextState;
      logAuthDiagnostic('app-state', {
        previousAppState: previous,
        nextAppState: nextState,
      });
      if (isForegroundEdge(previous, nextState)) {
        void startForegroundAuth(true);
      } else if (previous === 'active') {
        void supabase.auth.stopAutoRefresh();
      }
    });
    return () => {
      disposed = true;
      subscription.remove();
      void supabase.auth.stopAutoRefresh();
    };
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
