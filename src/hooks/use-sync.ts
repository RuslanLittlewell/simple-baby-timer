import { type RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { translate } from '@/i18n';
import {
  confirmAccountLoss,
  getUserId,
  isOAuthInFlight,
  isSupabaseConfigured,
  signOutLocal,
  supabase,
  verifyAccount,
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
  isChildCurrentDayFresh,
  leaveChild,
  loadChildCurrentDay,
  loadChildCurrentWeek,
  loadChildCurrentWeekRemainder,
  mergeRemoteSessionRows,
  type SessionRow,
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
import { subscribeToLiveActivityPushTokens } from '@/lib/live-activity-sync';
import {
  reconcileLiveActivities,
  type DesiredLiveActivity,
} from '@/lib/live-activity';

type SyncOutcome = 'success' | 'unavailable' | 'auth-required' | 'failed';

const ACTIVITY_SYNC_TIMEOUT_MS = 15_000;
const gateTimers = new Map<number, ReturnType<typeof setTimeout>>();
const criticalRefreshes = new Map<number, boolean>();

function finishActivityGate(generation: number) {
  const timer = gateTimers.get(generation);
  if (timer) clearTimeout(timer);
  gateTimers.delete(generation);
  useAppStore.getState().finishActivitySync(generation);
}


async function performSyncPass(generation: number): Promise<SyncOutcome> {
  const capturedAuthGeneration = authGeneration.snapshot();
  const capturedVerificationEpoch = authGeneration.verificationSnapshot();
  const isCurrentAuth = () => authGeneration.isCurrent(capturedAuthGeneration);
  logAuthDiagnostic('sync-start', {
    syncGeneration: generation,
    authGeneration: capturedAuthGeneration,
  });
  if (!isSupabaseConfigured) return 'unavailable';
  try {
    
    
    
    const account = await verifyAccount('sync');
    if (!isCurrentAuth()) return 'unavailable';
    
    if (account === 'inconclusive') return 'unavailable';
    if (accountOutcomeRequiresGate(account)) {
      
      
      
      
      
      if (isOAuthInFlight()) return 'unavailable';
      if (!(await confirmAccountLoss(capturedVerificationEpoch))) return 'unavailable';
      await signOutLocal();
      if (
        !isCurrentAuth() ||
        !authGeneration.isVerificationCurrent(capturedVerificationEpoch)
      ) return 'unavailable';
      useAppStore.getState().setProStatus(false);
      useAppStore.getState().setAuthRequired(true);
      return 'auth-required';
    }
    useAppStore.getState().setAuthRequired(false);

    
    
    
    
    const userId = await getUserId();
    if (!isCurrentAuth()) return 'unavailable';
    const known = useAppStore.getState().accountId;
    if (userId && known !== userId) {
      if (known) {
        await useAppStore.getState().clearAccountData({ keepOnboarding: true });
        if (!isCurrentAuth()) return 'unavailable';
      }
      
      
      
      for (const kind of ['sleep', 'awake', 'settling'] as const) {
        useAppStore.getState().setNotificationsEnabled(kind, false);
      }
    }
    
    
    if (userId) useAppStore.getState().setAccountId(userId);
    const remote = await fetchRemoteChildren(userId);
    if (!isCurrentAuth()) return 'unavailable';
    useAppStore.getState().upsertRemoteChildren(remote);

    const criticalState = useAppStore.getState();
    const activeChild = criticalState.children.find(
      (child) => child.id === criticalState.activeChildId,
    );
    const refreshCritical = criticalRefreshes.get(generation) ?? true;
    const [historyResult] = await Promise.allSettled([
      activeChild?.remoteId && refreshCritical
        ? loadChildCurrentDay(activeChild.remoteId, activeChild.id)
        : Promise.resolve(0),
      refreshLive(),
    ]);
    if (!isCurrentAuth()) return 'unavailable';
    if (historyResult.status === 'fulfilled' && historyResult.value > 0) {
      useAppStore.getState().bumpDataVersion();
    }
    finishActivityGate(generation);

    const activeWeekCompletion = activeChild?.remoteId
      ? (historyResult.status === 'fulfilled'
          ? loadChildCurrentWeekRemainder(activeChild.remoteId, activeChild.id)
          : loadChildCurrentWeek(activeChild.remoteId, activeChild.id, { refresh: true }))
        .catch(() => 0)
      : Promise.resolve(0);

    if (userId) await identifyPurchaser(userId);
    if (!isCurrentAuth()) return 'unavailable';

    await flushQueue();
    if (!isCurrentAuth()) return 'unavailable';

    const [pro, receipt] = await Promise.all([
      fetchAccountProStatus(),
      fetchEntitlement().catch(() => ({ active: false }) as ProEntitlement),
    ]);
    if (!isCurrentAuth()) return 'unavailable';
    useAppStore.getState().setProStatus(
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

    let createdRemoteChild = false;
    for (const child of useAppStore.getState().children) {
      if (child.remoteId) {
        await syncChildProfile(child);
        if (!isCurrentAuth()) return 'unavailable';
        continue;
      }
      const remoteId = await syncChildToCloud(child);
      if (!isCurrentAuth()) return 'unavailable';
      useAppStore.getState().setChildRemoteId(child.id, remoteId);
      createdRemoteChild = true;
    }

    if (createdRemoteChild) {
      const refreshedRemote = await fetchRemoteChildren(userId);
      if (!isCurrentAuth()) return 'unavailable';
      useAppStore.getState().upsertRemoteChildren(refreshedRemote);
    }

    const { children, bumpDataVersion } = useAppStore.getState();
    const backgroundResults = await Promise.allSettled([
      activeWeekCompletion,
      ...children
        .filter((child) => child.remoteId && child.id !== activeChild?.id)
        .map((child) => loadChildCurrentWeek(child.remoteId!, child.id, { refresh: true })),
    ]);
    if (!isCurrentAuth()) return 'unavailable';
    const applied = backgroundResults.reduce(
      (total, result) => total + (result.status === 'fulfilled' ? result.value : 0),
      0,
    );
    if (applied > 0) bumpDataVersion();
    await refreshLive();
    if (!isCurrentAuth()) return 'unavailable';
    return 'success';
  } catch {
    
    return 'failed';
  }
}

const syncCoordinator = new SingleFlightCoordinator(async (generation) => {
  const outcome = await performSyncPass(generation);
  criticalRefreshes.delete(generation);
  logAuthDiagnostic('sync-result', { outcome, syncGeneration: generation });
  finishActivityGate(generation);
});




export async function syncNow(
  { fresh = false, force = false }: { fresh?: boolean; force?: boolean } = {},
): Promise<void> {
  const state = useAppStore.getState();
  const activeChild = state.children.find((child) => child.id === state.activeChildId);
  const locallyFresh =
    !force && !!activeChild?.remoteId && await isChildCurrentDayFresh(activeChild.remoteId);
  return syncCoordinator.request(fresh, (generation) => {
    const gated = !locallyFresh;
    logAuthDiagnostic('sync-request', { fresh, syncGeneration: generation });
    criticalRefreshes.set(generation, gated);
    useAppStore.getState().prepareActivitySync(generation, gated);
    if (!gated) return;
    gateTimers.set(
      generation,
      setTimeout(() => {
        finishActivityGate(generation);
      }, ACTIVITY_SYNC_TIMEOUT_MS),
    );
  });
}



async function refreshLivePass(): Promise<void> {
  const { children, reconcileRemoteLive, retryPendingLive } = useAppStore.getState();
  const shared = children.filter((child) => child.remoteId);
  if (!shared.length) {
    reconcileRemoteLive([]);
    await reconcileCurrentLiveActivities([]);
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
  await reconcileCurrentLiveActivities(rows);
}

async function reconcileCurrentLiveActivities(
  rows: Awaited<ReturnType<typeof fetchLiveSessions>>,
) {
  const state = useAppStore.getState();
  const desired = new Map<string, DesiredLiveActivity>();
  for (const row of rows) {
    const item: DesiredLiveActivity = {
      ownerId: row.remoteChildId,
      slot: row.track,
      kind: row.kind,
      startedAt: row.startedAt,
      labels: { title: translate(state.language, `kind.${row.kind}`) },
    };
    desired.set(`${item.ownerId}|${item.slot}`, item);
  }
  for (const slot of ['session', 'feeding'] as const) {
    const current = state[slot];
    if (!current) continue;
    const child = state.children.find((item) => item.id === current.childId);
    const item: DesiredLiveActivity = {
      ownerId: child?.remoteId ?? current.childId ?? 'current',
      slot,
      kind: current.kind,
      startedAt: current.startedAt,
      labels: { title: translate(state.language, `kind.${current.kind}`) },
    };
    desired.set(`${item.ownerId}|${item.slot}`, item);
  }
  await reconcileLiveActivities([...desired.values()]);
}



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



async function applyRealtimeSessionRow(row: Record<string, unknown>, localChildId: string) {
  if (typeof row.id !== 'string' || typeof row.kind !== 'string') return;
  await mergeRemoteSessionRows([row as unknown as SessionRow], localChildId);
  useAppStore.getState().bumpDataVersion();
}



export function useSync() {
  const children = useAppStore((state) => state.children);
  const language = useAppStore((state) => state.language);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!authed) return;
    return subscribeToLiveActivityPushTokens(language);
  }, [authed, language]);

  
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
          verificationEpoch: verified.verificationEpoch,
        });
        useAppStore.getState().setAuthRequired(false);
        
        
        
        if (verified.isNew) {
          logAuthDiagnostic('verified-session', {
            stage: 'gate-transition',
            authGeneration: verified.generation,
            hasSession: true,
          });
          const accountChanged = useAppStore.getState().accountId !== session.user.id;
          void syncNow({ fresh: true, force: accountChanged });
        }
        return;
      }
      logAuthDiagnostic('auth-event', {
        authEvent: event,
        hasSession: false,
        authGeneration: authGeneration.snapshot(),
      });
      
      
      
      if (!authEventRequiresGate(event, hasSession)) return;
      
      
      if (isOAuthInFlight()) return;
      authGeneration.observeMissingSession();
      const capturedVerificationEpoch = authGeneration.verificationSnapshot();

      const applyMissingSession = async () => {
        if (!authGeneration.claimMissingEffects(capturedVerificationEpoch)) return;
        setAuthed(false);
        const syncState = useAppStore.getState();
        syncState.finishActivitySync(syncState.activitySyncGeneration);
        syncState.setProStatus(false);
        syncState.setAuthRequired(true);
        await forgetPurchaser();
      };

      if (authGeneration.isExplicitLogoutPending()) {
        void applyMissingSession();
        return;
      }
      
      
      queueMicrotask(() => {
        void (async () => {
          const { data: current } = await supabase.auth.getSession();
          if (
            current.session ||
            !authGeneration.isVerificationCurrent(capturedVerificationEpoch)
          ) {
            logAuthDiagnostic('auth-event', {
              authEvent: event,
              stage: 'stale-rejected',
              verificationEpoch: capturedVerificationEpoch,
              hasSession: !!current.session,
              recoverySource: 'auth-event',
              disposition: 'stale-rejected',
            });
            return;
          }
          const outcome = await verifyAccount('auth-event');
          if (
            outcome === 'ok' ||
            !(await confirmAccountLoss(capturedVerificationEpoch))
          ) return;
          await applyMissingSession();
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
      if (disposed) return;
      await verifyAccount('foreground');
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
            (payload) => {
              const row = payload.new as Record<string, unknown>;
              void applyRealtimeSessionRow(row, localChildId).catch(() => {});
            },
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
