import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getAllSessionsForChild,
  mergeRemoteSessions,
  type ActivitySession,
  type SessionKind,
} from '@/lib/activity-store';
import { type Child, type ChildGradientKey } from '@/lib/children';
import { type ActivityKind } from '@/lib/notifications';
import { getUserId, requireSession, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { dispatchLiveActivityPush } from '@/lib/live-activity-sync';

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
  pro_details: ActivitySession['proDetails'] | null;
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
  pro_details: op.session.proDetails ?? null,
  deleted: op.deleted,
});

async function upsertSessionRows(rows: ReturnType<typeof toRow>[]): Promise<void> {
  let result = await supabase.from('sessions').upsert(rows);
  if (
    result.error &&
    (result.error.code === '42703' ||
      result.error.code === 'PGRST204' ||
      result.error.message.includes('pro_details'))
  ) {
    result = await supabase.from('sessions').upsert(
      rows.map(({ pro_details: _proDetails, ...row }) => row),
    );
  }
  if (result.error) throw result.error;
}

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
  const next = queue.filter(
    (item) => !(item.session.id === op.session.id && item.remoteChildId === op.remoteChildId),
  );
  next.push(op);
  await writeQueue(next);
  flushQueue().catch(() => {});
}

export async function clearSyncState(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove([
    QUEUE_KEY,
    ...keys.filter((key) => key.startsWith('babytimer.sync.cursor.')),
  ]);
}

export const enqueueSessionUpsert = (remoteChildId: string, session: ActivitySession) =>
  enqueue({ remoteChildId, session, deleted: false });

export const enqueueSessionDelete = (remoteChildId: string, session: ActivitySession) =>
  enqueue({ remoteChildId, session, deleted: true });

export interface AccountProStatus {
  active: boolean;
  expiresAt?: number;
  renewsAt?: number;
  trialUsed: boolean;
}

export async function fetchAccountProStatus(): Promise<AccountProStatus> {
  if (!isSupabaseConfigured) return { active: false, trialUsed: false };
  await requireSession();
  const { data, error } = await supabase
    .from('profiles')
    .select('pro_active, trial_ends_at, pro_renews_at')
    .maybeSingle();
  if (
    error?.code === '42P01' ||
    error?.code === 'PGRST116' ||
    error?.code === 'PGRST205'
  ) return { active: false, trialUsed: false };
  if (error) throw error;
  const trialEndsAt =
    typeof data?.trial_ends_at === 'string' ? Date.parse(data.trial_ends_at) : NaN;
  const renewsAt =
    typeof data?.pro_renews_at === 'string' ? Date.parse(data.pro_renews_at) : NaN;
  const paid = data?.pro_active === true;
  const trialActive = Number.isFinite(trialEndsAt) && trialEndsAt > Date.now();
  const paidActive =
    paid && (!Number.isFinite(renewsAt) || renewsAt > Date.now());
  return {
    active: paidActive || trialActive,
    expiresAt: !paidActive && trialActive ? trialEndsAt : undefined,
    renewsAt: paidActive && Number.isFinite(renewsAt) ? renewsAt : undefined,
    trialUsed: Number.isFinite(trialEndsAt),
  };
}

export async function deleteAccount(): Promise<void> {
  await requireSession();
  const { error } = await supabase.rpc('delete_account');
  if (error) throw error;
}

export async function startTrial(): Promise<number> {
  await requireSession();
  const { data, error } = await supabase.rpc('start_trial');
  if (error) throw error;
  const endsAt = Date.parse(data as string);
  if (!Number.isFinite(endsAt)) throw new Error('invalid trial end date');
  return endsAt;
}

export async function activateTestPro(): Promise<number> {
  await requireSession();
  const { data, error } = await supabase.rpc('activate_test_pro');
  if (error) throw error;
  const renewsAt = Date.parse(data as string);
  if (!Number.isFinite(renewsAt)) throw new Error('invalid renewal date');
  return renewsAt;
}

let flushing = false;

export async function flushQueue(): Promise<void> {
  if (!isSupabaseConfigured || flushing) return;
  flushing = true;
  try {
    const queue = await readQueue();
    if (!queue.length) return;
    await requireSession();
    for (let i = 0; i < queue.length; i += UPSERT_CHUNK) {
      const chunk = queue.slice(i, i + UPSERT_CHUNK);
      await upsertSessionRows(chunk.map(toRow));
      await writeQueue(queue.slice(i + UPSERT_CHUNK));
    }
  } finally {
    flushing = false;
  }
}

export async function syncChildToCloud(child: Child): Promise<string> {
  await requireSession();
  const { data, error } = await supabase.rpc('ensure_owned_child', {
    local_id: child.id,
    child_name: child.name,
    child_gradient_key: child.gradientKey,
    child_birthday_ms: child.birthday ?? null,
  });
  if (error) throw error;
  const remoteId = data as string;
  if (!remoteId) throw new Error('invalid remote child id');

  const sessions = await getAllSessionsForChild(child.id);
  for (let i = 0; i < sessions.length; i += UPSERT_CHUNK) {
    const chunk = sessions.slice(i, i + UPSERT_CHUNK);
    await upsertSessionRows(
      chunk.map((session) => toRow({ remoteChildId: remoteId, session, deleted: false })),
    );
  }
  return remoteId;
}

export async function shareChild(child: Child): Promise<string> {
  if (child.remoteId && child.isOwner !== true) throw new Error('only the child owner can share');
  if (child.remoteId) return child.remoteId;
  const remoteId = await syncChildToCloud(child);
  return remoteId;
}

export async function createInviteCode(remoteId: string): Promise<string> {
  await requireSession();
  const { data, error } = await supabase.rpc('create_invite', { cid: remoteId });
  if (error) throw error;
  return data as string;
}

export async function syncChildProfile(child: Child): Promise<void> {
  if (!child.remoteId || child.isOwner !== true) return;
  await requireSession();
  const profile: {
    name: string;
    gradient_key: ChildGradientKey;
    birthday_ms?: number;
  } = {
    name: child.name,
    gradient_key: child.gradientKey,
  };
  if (child.birthday !== undefined) profile.birthday_ms = child.birthday;
  const { error } = await supabase
    .from('children')
    .update(profile)
    .eq('id', child.remoteId);
  if (error && !isMissingBirthdayColumn(error)) throw error;
}

export interface RemoteChild {
  remoteId: string;
  name: string;
  gradientKey: ChildGradientKey;
  birthday?: number;
  proEnabled?: boolean;
  isOwner: boolean;
}

const birthdayFromRow = (value: unknown): number | undefined =>
  value === null || value === undefined ? undefined : Number(value);

const isMissingBirthdayColumn = (error: { code?: string; message?: string }): boolean =>
  error.code === '42703' ||
  error.code === 'PGRST204' ||
  error.message?.includes('birthday_ms') === true;

export async function fetchRemoteChildren(): Promise<RemoteChild[]> {
  if (!isSupabaseConfigured) return [];
  await requireSession();
  const userId = await getUserId();
  let result = await supabase
    .from('children')
    .select('id, name, gradient_key, birthday_ms, pro_enabled, created_by');
  if (result.error && isMissingBirthdayColumn(result.error)) {
    result = await supabase.from('children').select('id, name, gradient_key, created_by');
  }
  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => ({
    remoteId: row.id as string,
    name: row.name as string,
    gradientKey: row.gradient_key as ChildGradientKey,
    birthday: birthdayFromRow('birthday_ms' in row ? row.birthday_ms : undefined),
    proEnabled: row.pro_enabled === true,
    isOwner: row.created_by === userId,
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
    birthday: birthdayFromRow(row.birthday_ms),
    proEnabled: row.pro_enabled === true,
    isOwner: row.is_owner === true,
  };
}

export type LiveTrack = 'session' | 'feeding';

export interface RemoteLiveRow {
  remoteChildId: string;
  track: LiveTrack;
  kind: ActivityKind;
  startedAt: number;
  proDetails?: ActivitySession['proDetails'];
}

export async function pushLiveSession(
  remoteChildId: string,
  track: LiveTrack,
  kind: ActivityKind,
  startedAtMs: number,
  proDetails?: ActivitySession['proDetails'],
): Promise<void> {
  if (!isSupabaseConfigured) return;
  await requireSession();
  const { error } = await supabase.from('live_sessions').upsert({
    child_id: remoteChildId,
    track,
    kind,
    started_at_ms: startedAtMs,
    pro_details: proDetails ?? null,
  });
  if (error) throw error;
  dispatchLiveActivityPush('start', remoteChildId, track, {
    kind,
    startedAt: startedAtMs,
  }).catch(() => {});
}

export async function updateLiveSessionDetails(
  remoteChildId: string,
  track: LiveTrack,
  proDetails: ActivitySession['proDetails'],
): Promise<void> {
  if (!isSupabaseConfigured) return;
  await requireSession();
  const { error } = await supabase
    .from('live_sessions')
    .update({ pro_details: proDetails ?? null })
    .eq('child_id', remoteChildId)
    .eq('track', track);
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
  dispatchLiveActivityPush('end', remoteChildId, track).catch(() => {});
}

export async function fetchLiveSessions(remoteChildIds: string[]): Promise<RemoteLiveRow[]> {
  if (!isSupabaseConfigured || !remoteChildIds.length) return [];
  await requireSession();
  const { data, error } = await supabase
    .from('live_sessions')
    .select('*')
    .in('child_id', remoteChildIds);
  if (error) throw error;
  return (data ?? [])
    .filter((row) => ['settling', 'sleep', 'awake', 'feeding'].includes(row.kind as string))
    .map((row) => ({
      remoteChildId: row.child_id as string,
      track: row.track === 'feeding' ? 'feeding' : 'session',
      kind: row.kind as ActivityKind,
      startedAt: Number(row.started_at_ms),
      proDetails: row.pro_details as ActivitySession['proDetails'] | undefined,
    }));
}

export async function leaveChild(remoteId: string): Promise<void> {
  await requireSession();
  const { error } = await supabase.rpc('leave_child', { cid: remoteId });
  if (error) throw error;
  await AsyncStorage.removeItem(cursorKey(remoteId));
  const queue = await readQueue();
  await writeQueue(queue.filter((op) => op.remoteChildId !== remoteId));
}

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
        proDetails: row.pro_details ?? undefined,
        childId: localChildId,
      }));
    const deletedIds = rows.filter((row) => row.deleted).map((row) => row.id);

    await mergeRemoteSessions(upserts, deletedIds);
    await AsyncStorage.setItem(cursorKey(remoteId), rows[rows.length - 1].updated_at);
    applied += rows.length;
    if (rows.length < 1000) return applied;
  }
}
