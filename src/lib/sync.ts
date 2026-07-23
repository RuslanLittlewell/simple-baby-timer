import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getAllSessionsForChild,
  mergeRemoteSessions,
  type ActivitySession,
  type SessionKind,
} from '@/lib/activity-store';
import { type Child, type ChildGradientKey } from '@/lib/children';
import { type ActivityKind } from '@/lib/notifications';
import { requireSession, isSupabaseConfigured, supabase } from '@/lib/supabase';

const QUEUE_KEY = 'babytimer.sync.queue.v1';
const cursorKey = (remoteId: string) => `babytimer.sync.cursor.${remoteId}`;
const UPSERT_CHUNK = 500;

interface SessionRow {
  child_id: string;
  id: string;
  kind: string;
  start_ms: number;
  end_ms: number;
  milk_ml: number | null;
  deleted: boolean;
  updated_at: string;
}

interface QueuedOp {
  remoteChildId: string;
  session: ActivitySession;
  deleted: boolean;
}

const toRow = (op: QueuedOp) => ({
  child_id: op.remoteChildId,
  id: op.session.id,
  kind: op.session.kind,
  start_ms: op.session.start,
  end_ms: op.session.end,
  milk_ml: op.session.milkMl ?? null,
  deleted: op.deleted,
});

const readQueue = async (): Promise<QueuedOp[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: QueuedOp[]) =>
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

async function enqueue(op: QueuedOp): Promise<void> {
  if (!isSupabaseConfigured) return;
  const queue = await readQueue();
  // The latest op for a session wins; drop stale entries for the same id.
  const next = queue.filter(
    (item) => !(item.session.id === op.session.id && item.remoteChildId === op.remoteChildId),
  );
  next.push(op);
  await writeQueue(next);
  flushQueue().catch(() => {});
}

export const enqueueSessionUpsert = (remoteChildId: string, session: ActivitySession) =>
  enqueue({ remoteChildId, session, deleted: false });

export const enqueueSessionDelete = (remoteChildId: string, session: ActivitySession) =>
  enqueue({ remoteChildId, session, deleted: true });

let flushing = false;

// Uploads all queued ops; keeps the queue intact when the network fails.
export async function flushQueue(): Promise<void> {
  if (!isSupabaseConfigured || flushing) return;
  flushing = true;
  try {
    const queue = await readQueue();
    if (!queue.length) return;
    await requireSession();
    for (let i = 0; i < queue.length; i += UPSERT_CHUNK) {
      const chunk = queue.slice(i, i + UPSERT_CHUNK);
      const { error } = await supabase.from('sessions').upsert(chunk.map(toRow));
      if (error) throw error;
      await writeQueue(queue.slice(i + UPSERT_CHUNK));
    }
  } finally {
    flushing = false;
  }
}

// Creates the remote child, registers the caller as a member and uploads the
// child's local history. Returns the remote uuid to store on the local child.
export async function shareChild(child: Child): Promise<string> {
  await requireSession();
  const { data, error } = await supabase
    .from('children')
    .insert({ name: child.name, gradient_key: child.gradientKey })
    .select('id')
    .single();
  if (error) throw error;
  const remoteId = data.id as string;

  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user.id;
  if (!userId) throw new Error('no session');
  const { error: memberError } = await supabase
    .from('child_members')
    .insert({ child_id: remoteId, user_id: userId });
  if (memberError) throw memberError;

  const sessions = await getAllSessionsForChild(child.id);
  for (let i = 0; i < sessions.length; i += UPSERT_CHUNK) {
    const chunk = sessions.slice(i, i + UPSERT_CHUNK);
    const { error: pushError } = await supabase.from('sessions').upsert(
      chunk.map((session) => toRow({ remoteChildId: remoteId, session, deleted: false })),
    );
    if (pushError) throw pushError;
  }
  return remoteId;
}

export async function createInviteCode(remoteId: string): Promise<string> {
  await requireSession();
  const { data, error } = await supabase.rpc('create_invite', { cid: remoteId });
  if (error) throw error;
  return data as string;
}

export interface RemoteChild {
  remoteId: string;
  name: string;
  gradientKey: ChildGradientKey;
}

// All children the signed-in account has access to (RLS narrows the select
// to own + member rows). Used to restore children on a new device.
export async function fetchRemoteChildren(): Promise<RemoteChild[]> {
  if (!isSupabaseConfigured) return [];
  await requireSession();
  const { data, error } = await supabase.from('children').select('id, name, gradient_key');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    remoteId: row.id as string,
    name: row.name as string,
    gradientKey: row.gradient_key as ChildGradientKey,
  }));
}

export async function redeemInvite(code: string): Promise<RemoteChild> {
  await requireSession();
  const { data, error } = await supabase.rpc('redeem_invite', { invite_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('invalid code');
  return {
    remoteId: row.child_id as string,
    name: row.name as string,
    gradientKey: row.gradient_key as ChildGradientKey,
  };
}

export type LiveTrack = 'session' | 'feeding';

export interface RemoteLiveRow {
  remoteChildId: string;
  track: LiveTrack;
  kind: ActivityKind;
  startedAt: number;
}

// Announces a running timer to the child's members (start = upsert).
export async function pushLiveSession(
  remoteChildId: string,
  track: LiveTrack,
  kind: ActivityKind,
  startedAtMs: number,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  await requireSession();
  const { error } = await supabase.from('live_sessions').upsert({
    child_id: remoteChildId,
    track,
    kind,
    started_at_ms: startedAtMs,
  });
  if (error) throw error;
}

export async function clearLiveSession(remoteChildId: string, track: LiveTrack): Promise<void> {
  if (!isSupabaseConfigured) return;
  await requireSession();
  const { error } = await supabase
    .from('live_sessions')
    .delete()
    .eq('child_id', remoteChildId)
    .eq('track', track);
  if (error) throw error;
}

export async function fetchLiveSessions(remoteChildIds: string[]): Promise<RemoteLiveRow[]> {
  if (!isSupabaseConfigured || !remoteChildIds.length) return [];
  await requireSession();
  const { data, error } = await supabase
    .from('live_sessions')
    .select('child_id, track, kind, started_at_ms')
    .in('child_id', remoteChildIds);
  if (error) throw error;
  return (data ?? [])
    .filter((row) => ['sleep', 'awake', 'feeding'].includes(row.kind as string))
    .map((row) => ({
      remoteChildId: row.child_id as string,
      track: row.track === 'feeding' ? 'feeding' : 'session',
      kind: row.kind as ActivityKind,
      startedAt: Number(row.started_at_ms),
    }));
}

// Leaves a shared child on the server (the child itself is deleted once the
// last member leaves) and clears local sync state for it.
export async function leaveChild(remoteId: string): Promise<void> {
  await requireSession();
  const { error } = await supabase.rpc('leave_child', { cid: remoteId });
  if (error) throw error;
  await AsyncStorage.removeItem(cursorKey(remoteId));
  const queue = await readQueue();
  await writeQueue(queue.filter((op) => op.remoteChildId !== remoteId));
}

// Pulls remote changes since the stored cursor and merges them into the local
// day buckets. Returns the number of applied rows.
export async function pullChildSessions(
  remoteId: string,
  localChildId: string,
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  await requireSession();
  let applied = 0;

  for (;;) {
    const cursor = await AsyncStorage.getItem(cursorKey(remoteId));
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('child_id', remoteId)
      .order('updated_at', { ascending: true })
      .limit(1000);
    if (cursor) query = query.gt('updated_at', cursor);

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as SessionRow[];
    if (!rows.length) return applied;

    const upserts: ActivitySession[] = rows
      .filter((row) => !row.deleted)
      .map((row) => ({
        id: row.id,
        kind: row.kind as SessionKind,
        start: Number(row.start_ms),
        end: Number(row.end_ms),
        milkMl: row.milk_ml ?? undefined,
        childId: localChildId,
      }));
    const deletedIds = rows.filter((row) => row.deleted).map((row) => row.id);

    await mergeRemoteSessions(upserts, deletedIds);
    await AsyncStorage.setItem(cursorKey(remoteId), rows[rows.length - 1].updated_at);
    applied += rows.length;
    if (rows.length < 1000) return applied;
  }
}
