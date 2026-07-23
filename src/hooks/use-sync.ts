import { type RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getIsSignedIn, isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  fetchLiveSessions,
  fetchRemoteChildren,
  flushQueue,
  pullChildSessions,
} from '@/lib/sync';
import { useAppStore, type RemoteLive } from '@/state/app-state';

// Full sync pass: upload the pending queue, restore children linked to the
// account (new device / reinstall) and pull remote sessions for every shared
// child. Safe to call anytime — silently skips when offline or signed out.
export async function syncNow(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await flushQueue();
    if (!(await getIsSignedIn())) return;

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
  } catch {
    // Offline or Supabase unreachable — the queue survives, retry later.
  }
}

// Fetches the partner's currently running timers for every shared child and
// hands them to the store (which also cancels remotely stopped local timers).
async function refreshLive(): Promise<void> {
  const { children, reconcileRemoteLive } = useAppStore.getState();
  const shared = children.filter((child) => child.remoteId);
  if (!shared.length) {
    reconcileRemoteLive([]);
    return;
  }
  const rows = await fetchLiveSessions(shared.map((child) => child.remoteId!));
  const localIdByRemote = new Map(shared.map((child) => [child.remoteId!, child.id]));
  const mapped: RemoteLive[] = [];
  for (const row of rows) {
    const childId = localIdByRemote.get(row.remoteChildId);
    if (childId) {
      mapped.push({ childId, track: row.track, kind: row.kind, startedAt: row.startedAt });
    }
  }
  reconcileRemoteLive(mapped);
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
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    syncNow();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
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
