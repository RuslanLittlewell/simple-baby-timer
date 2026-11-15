import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getAllSessionsForChild,
  isSessionKind,
  mergeRemoteSessions,
  type ActivitySession,
  type SessionKind,
} from '@/lib/activity-store';
import { type Child, type ChildGradientKey } from '@/lib/children';
import {
  sanitizeGrowthMeasurements,
  type GrowthMeasurement,
} from '@/lib/growth-measurements';
import { type ActivityKind } from '@/lib/notifications';
import { getUserId, requireSession, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { dispatchLiveActivityPush } from '@/lib/live-activity-sync';
import { formatLiveActivityTime } from '@/lib/live-activity';
import {
  calendarDayOf,
  calendarWeekOf,
  calendarWeeksInRange,
  compoundCursorFilter,
  LoadedWeekRegistry,
  FreshnessRegistry,
  HistoryRangeRegistry,
  WeekLoadCoordinator,
  paginateCompound,
  partitionDeletedRows,
  type CalendarWeek,
} from '@/lib/activity-history-loading';
import { StoredList, withoutSent } from '@/lib/stored-list';
import { useGrowthStore } from '@/state/growth-state';

const QUEUE_KEY = 'babytimer.sync.queue.v1';
const cursorKey = (remoteId: string) => `babytimer.sync.cursor.${remoteId}`;
const LEGACY_LOADED_MONTHS_PREFIX = 'babytimer.sync.loaded-months.v1.';
const legacyLoadedMonthsKey = (remoteId: string) => `${LEGACY_LOADED_MONTHS_PREFIX}${remoteId}`;
const LEGACY_LOADED_WEEKS_PREFIX = 'babytimer.sync.loaded-weeks.v1.';
const legacyLoadedWeeksKey = (remoteId: string) => `${LEGACY_LOADED_WEEKS_PREFIX}${remoteId}`;
const LOADED_WEEKS_PREFIX = 'babytimer.sync.loaded-weeks.v2.';
const loadedWeeksKey = (remoteId: string) => `${LOADED_WEEKS_PREFIX}${remoteId}`;
const EMPTY_RANGES_PREFIX = 'babytimer.sync.empty-ranges.v1.';
const emptyRangesKey = (remoteId: string) => `${EMPTY_RANGES_PREFIX}${remoteId}`;
const LEGACY_WEEK_FRESHNESS_PREFIX = 'babytimer.sync.week-freshness.v1.';
const legacyWeekFreshnessKey = (remoteId: string) => `${LEGACY_WEEK_FRESHNESS_PREFIX}${remoteId}`;
const DAY_FRESHNESS_PREFIX = 'babytimer.sync.day-freshness.v1.';
const dayFreshnessKey = (remoteId: string) => `${DAY_FRESHNESS_PREFIX}${remoteId}`;
const CHANGE_CURSOR_PREFIX = 'babytimer.sync.change-cursor.v1.';
const changeCursorKey = (remoteId: string) => `${CHANGE_CURSOR_PREFIX}${remoteId}`;
/**
 * A row's `updated_at` is its transaction's start time, so a row can become
 * visible after a later-stamped one was already read. Each pull therefore
 * re-reads this much before its cursor; merging the same row twice is harmless.
 */
const CHANGE_CURSOR_OVERLAP_MS = 5 * 60_000;
export const CURRENT_DAY_FRESHNESS_MS = 60_000;
export const EMPTY_RANGE_FRESHNESS_MS = 5 * 60_000;
const UPSERT_CHUNK = 500;
const HISTORY_PAGE_SIZE = 1000;
const weekLoads = new WeekLoadCoordinator();
const loadedWeeks = new LoadedWeekRegistry(AsyncStorage, loadedWeeksKey);
const dayFreshness = new FreshnessRegistry(AsyncStorage, dayFreshnessKey);
const historyRanges = new HistoryRangeRegistry(
  loadedWeeks,
  new FreshnessRegistry(AsyncStorage, emptyRangesKey),
  EMPTY_RANGE_FRESHNESS_MS,
);

export interface SessionRow {
  child_id: string;
  id: string;
  kind: string;
  start_ms: number;
  end_ms: number;
  milk_ml: number | null;
  pro_details: ActivitySession['proDetails'] | null;
  notes?: string | null;
  title?: string | null;
  deleted: boolean;
  updated_at: string;
}

function rowsToLocalChanges(rows: SessionRow[], localChildId: string) {
  const { activeRows, deletedIds } = partitionDeletedRows(rows);
  // A kind from a newer app version would have nothing to draw it with.
  const upserts: ActivitySession[] = activeRows
    .filter((row) => isSessionKind(row.kind))
    .map((row) => ({
      id: row.id,
      kind: row.kind as SessionKind,
      start: Number(row.start_ms),
      end: Number(row.end_ms),
      milkMl: row.milk_ml ?? undefined,
      proDetails: row.pro_details ?? undefined,
      notes: row.notes ?? undefined,
      title: row.title ?? undefined,
      childId: localChildId,
    }));
  return {
    upserts,
    deletedIds,
  };
}

/**
 * Applies downloaded rows and reports how many changed the stored history.
 * A row whose local edit is still waiting to be uploaded is skipped: the copy
 * on this device is the newer one, and the server's would silently revert it.
 */
export async function mergeRemoteSessionRows(
  rows: SessionRow[],
  localChildId: string,
): Promise<number> {
  if (!rows.length) return 0;
  const pending = new Set(
    (await uploadQueue.read()).map((op) => `${op.remoteChildId}/${op.session.id}`),
  );
  const settledRows = pending.size
    ? rows.filter((row) => !pending.has(`${row.child_id}/${row.id}`))
    : rows;
  const { upserts, deletedIds } = rowsToLocalChanges(settledRows, localChildId);
  return mergeRemoteSessions(upserts, deletedIds);
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
  notes: op.session.notes ?? null,
  title: op.session.title ?? null,
  deleted: op.deleted,
});

async function upsertSessionRows(rows: ReturnType<typeof toRow>[]): Promise<void> {
  let compatibleRows: Record<string, unknown>[] = rows;
  let result = await supabase.from('sessions').upsert(compatibleRows);
  for (const column of ['notes', 'title', 'pro_details'] as const) {
    if (
      !result.error ||
      !result.error.message.includes(column)
    ) continue;
    compatibleRows = compatibleRows.map(({ [column]: _missing, ...row }) => row);
    result = await supabase.from('sessions').upsert(compatibleRows);
  }
  if (result.error) throw result.error;
}

/**
 * Records waiting to be uploaded. Its changes take turns: several records saved
 * together, or a save landing while an upload was in flight, used to overwrite
 * each other here, and a record was dropped before it ever reached the server.
 */
const uploadQueue = new StoredList<QueuedOp>(AsyncStorage, QUEUE_KEY);

const sameQueuedRecord = (a: QueuedOp, b: QueuedOp) =>
  a.session.id === b.session.id && a.remoteChildId === b.remoteChildId;

const queueFailureListeners = new Set<() => void>();

/** Called when queued records could not be uploaded and are still waiting. */
export function subscribeToQueueFailures(listener: () => void): () => void {
  queueFailureListeners.add(listener);
  return () => {
    queueFailureListeners.delete(listener);
  };
}

async function enqueue(op: QueuedOp): Promise<void> {
  if (!isSupabaseConfigured) return;
  await uploadQueue.update((queue) => [
    ...queue.filter((item) => !sameQueuedRecord(item, op)),
    op,
  ]);
  flushQueue().catch(() => {
    for (const listener of queueFailureListeners) listener();
  });
}

export async function clearSyncState(): Promise<void> {
  // A queue write still in flight would otherwise bring the queue back afterwards.
  await uploadQueue.settled();
  const keys = await AsyncStorage.getAllKeys();
  weekLoads.clear();
  await AsyncStorage.multiRemove([
    QUEUE_KEY,
    ...keys.filter((key) => key.startsWith('babytimer.sync.cursor.')),
    ...keys.filter((key) => key.startsWith(LEGACY_LOADED_MONTHS_PREFIX)),
    ...keys.filter((key) => key.startsWith(LEGACY_LOADED_WEEKS_PREFIX)),
    ...keys.filter((key) => key.startsWith(LOADED_WEEKS_PREFIX)),
    ...keys.filter((key) => key.startsWith(LEGACY_WEEK_FRESHNESS_PREFIX)),
    ...keys.filter((key) => key.startsWith(DAY_FRESHNESS_PREFIX)),
    ...keys.filter((key) => key.startsWith(EMPTY_RANGES_PREFIX)),
    ...keys.filter((key) => key.startsWith(CHANGE_CURSOR_PREFIX)),
  ]);
}

interface GrowthMeasurementRow {
  child_id: string;
  id: string;
  measured_on: string;
  height_cm: number | string;
  weight_kg: number | string;
  updated_at: string;
}

const isMissingGrowthTable = (error: { code?: string; message?: string }): boolean =>
  error.code === '42P01' ||
  error.code === 'PGRST205' ||
  error.message?.includes('child_measurements') === true;

function growthMeasurementFromRow(
  row: GrowthMeasurementRow,
  localChildId: string,
): GrowthMeasurement | null {
  const updatedAt = Date.parse(row.updated_at);
  const sanitized = sanitizeGrowthMeasurements([{
    id: row.id,
    childId: localChildId,
    measuredOn: row.measured_on,
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    updatedAt,
  }]);
  return sanitized[0] ?? null;
}

export async function flushGrowthMeasurements(children: Child[]): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const state = useGrowthStore.getState();
  const pending = new Set(state.pendingIds);
  const remoteIdByLocal = new Map(
    children
      .filter((child): child is Child & { remoteId: string } => !!child.remoteId)
      .map((child) => [child.id, child.remoteId]),
  );
  const submitted = state.measurements.filter(
    (measurement) => pending.has(measurement.id) && remoteIdByLocal.has(measurement.childId),
  );
  if (!submitted.length) return 0;
  await requireSession();
  const rows = submitted.map((measurement) => ({
    child_id: remoteIdByLocal.get(measurement.childId)!,
    id: measurement.id,
    measured_on: measurement.measuredOn,
    height_cm: measurement.heightCm,
    weight_kg: measurement.weightKg,
  }));
  const { data, error } = await supabase
    .from('child_measurements')
    .upsert(rows, { onConflict: 'child_id,id' })
    .select('child_id, id, measured_on, height_cm, weight_kg, updated_at');
  if (error) {
    if (isMissingGrowthTable(error)) return 0;
    throw error;
  }
  const localIdByRemote = new Map(
    [...remoteIdByLocal.entries()].map(([localId, remoteId]) => [remoteId, localId]),
  );
  const returnedById = new Map<string, GrowthMeasurement>();
  for (const row of (data ?? []) as GrowthMeasurementRow[]) {
    const localChildId = localIdByRemote.get(row.child_id);
    if (!localChildId) continue;
    const measurement = growthMeasurementFromRow(row, localChildId);
    if (measurement) returnedById.set(measurement.id, measurement);
  }
  useGrowthStore.getState().markMeasurementsSynced(
    submitted.map((measurement) => ({
      measurement: returnedById.get(measurement.id) ?? measurement,
      submittedUpdatedAt: measurement.updatedAt,
    })),
  );
  return submitted.length;
}

export async function fetchGrowthMeasurements(children: Child[]): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const shared = children.filter(
    (child): child is Child & { remoteId: string } => !!child.remoteId,
  );
  if (!shared.length) return 0;
  await requireSession();
  let applied = 0;
  for (const child of shared) {
    const { data, error } = await supabase
      .from('child_measurements')
      .select('child_id, id, measured_on, height_cm, weight_kg, updated_at')
      .eq('child_id', child.remoteId)
      .order('measured_on', { ascending: false })
      .order('id', { ascending: false });
    if (error) {
      if (isMissingGrowthTable(error)) return applied;
      throw error;
    }
    const measurements = ((data ?? []) as GrowthMeasurementRow[])
      .map((row) => growthMeasurementFromRow(row, child.id))
      .filter((item): item is GrowthMeasurement => item !== null);
    useGrowthStore.getState().mergeRemoteMeasurements(child.id, measurements);
    applied += measurements.length;
  }
  return applied;
}

export async function syncGrowthMeasurements(children: Child[]): Promise<number> {
  await flushGrowthMeasurements(children);
  return fetchGrowthMeasurements(children);
}

export function applyRealtimeGrowthMeasurementRow(
  row: Record<string, unknown>,
  localChildId: string,
): void {
  const measurement = growthMeasurementFromRow(
    row as unknown as GrowthMeasurementRow,
    localChildId,
  );
  if (measurement) {
    useGrowthStore.getState().mergeRemoteMeasurements(localChildId, [measurement]);
  }
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

const PRO_ACTIVATION_POLLS = 10;
const PRO_ACTIVATION_POLL_MS = 1500;

/**
 * Pro is read from the profile only. After a purchase the server copies the
 * RevenueCat entitlement into it; if that call is unavailable, the webhook
 * does the same a little later, so the profile is polled for a while.
 */
export async function refreshAccountProStatus(): Promise<AccountProStatus> {
  if (!isSupabaseConfigured) return { active: false, trialUsed: false };
  await requireSession();
  const { error } = await supabase.functions.invoke('refresh-pro-status');
  let status = await fetchAccountProStatus();
  if (!error) return status;
  for (let attempt = 0; !status.active && attempt < PRO_ACTIVATION_POLLS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, PRO_ACTIVATION_POLL_MS));
    status = await fetchAccountProStatus();
  }
  return status;
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

async function flushQueuePass(): Promise<void> {
  const queue = await uploadQueue.read();
  if (!queue.length) return;
  await requireSession();

  // One child's rows being refused must not hold back every other child's.
  const byChild = new Map<string, QueuedOp[]>();
  for (const op of queue) {
    byChild.set(op.remoteChildId, [...(byChild.get(op.remoteChildId) ?? []), op]);
  }

  let failure: unknown;
  for (const ops of byChild.values()) {
    try {
      for (let i = 0; i < ops.length; i += UPSERT_CHUNK) {
        const chunk = ops.slice(i, i + UPSERT_CHUNK);
        await upsertSessionRows(chunk.map(toRow));
        // Only what was just sent leaves the queue: a record edited again while
        // the request was in flight keeps its newer copy for the next pass.
        await uploadQueue.update((current) => withoutSent(current, chunk));
      }
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure) throw failure;
}

let flushInFlight: Promise<void> | null = null;
let flushRequestedAgain = false;

/** Uploads the queued records. A call made during an upload runs one more pass after it. */
export function flushQueue(): Promise<void> {
  if (!isSupabaseConfigured) return Promise.resolve();
  if (flushInFlight) {
    flushRequestedAgain = true;
    return flushInFlight;
  }
  const run = (async () => {
    do {
      flushRequestedAgain = false;
      await flushQueuePass();
    } while (flushRequestedAgain);
  })().finally(() => {
    flushInFlight = null;
  });
  flushInFlight = run;
  return run;
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
  await flushGrowthMeasurements([{ ...child, remoteId }]);
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

export async function fetchRemoteChildren(knownUserId?: string | null): Promise<RemoteChild[]> {
  if (!isSupabaseConfigured) return [];
  await requireSession();
  const userId = knownUserId === undefined ? await getUserId() : knownUserId;
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
  lastFeedingAt: number | null = null,
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
    lastFeedingTime: lastFeedingAt === null ? null : formatLiveActivityTime(lastFeedingAt),
    lastFeedingAt,
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
  await AsyncStorage.multiRemove([
    cursorKey(remoteId),
    legacyLoadedMonthsKey(remoteId),
    legacyLoadedWeeksKey(remoteId),
    loadedWeeksKey(remoteId),
    legacyWeekFreshnessKey(remoteId),
    dayFreshnessKey(remoteId),
    emptyRangesKey(remoteId),
    changeCursorKey(remoteId),
  ]);
  await uploadQueue.update((queue) => queue.filter((op) => op.remoteChildId !== remoteId));
}

async function fetchHistoryPages(
  remoteId: string,
  localChildId: string,
  range: Pick<CalendarWeek, 'startMs' | 'endMs'>,
): Promise<number> {
  await requireSession();
  return paginateCompound(
    HISTORY_PAGE_SIZE,
    async (cursor) => {
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('child_id', remoteId)
        .lt('start_ms', range.endMs)
        .gt('end_ms', range.startMs)
        .order('start_ms', { ascending: true })
        .order('id', { ascending: true })
        .limit(HISTORY_PAGE_SIZE);
      if (cursor) query = query.or(compoundCursorFilter(cursor.startMs, cursor.id));

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as SessionRow[]).map((row) => ({
        ...row,
        startMs: Number(row.start_ms),
      }));
    },
    async (rows) => {
      await mergeRemoteSessionRows(rows, localChildId);
    },
  );
}

export async function loadChildHistoryWeek(
  remoteId: string,
  localChildId: string,
  week: CalendarWeek,
  { refresh = false }: { refresh?: boolean } = {},
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const requestKey = `${remoteId}/${week.key}`;
  return weekLoads.run(requestKey, async () => {
    if (!refresh && (await historyRanges.isSettled(remoteId, localChildId, week.key))) return 0;
    const applied = await fetchHistoryPages(remoteId, localChildId, week);
    await historyRanges.record(remoteId, localChildId, week.key, applied);
    return applied;
  });
}

export async function loadChildCurrentDay(
  remoteId: string,
  localChildId: string,
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const day = calendarDayOf(new Date());
  return weekLoads.run(`${remoteId}/day/${day.key}`, async () => {
    const applied = await fetchHistoryPages(remoteId, localChildId, day);
    await dayFreshness.mark(remoteId, day.key);
    return applied;
  });
}

export async function isChildCurrentDayFresh(
  remoteId: string,
  maxAgeMs = CURRENT_DAY_FRESHNESS_MS,
): Promise<boolean> {
  const day = calendarDayOf(new Date());
  return dayFreshness.isFresh(remoteId, day.key, maxAgeMs);
}

interface ChangeCursor {
  localChildId: string;
  /** The server's own `updated_at` text, kept verbatim so no precision is lost. */
  updatedAt: string;
}

async function readChangeCursor(
  remoteId: string,
  localChildId: string,
): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(changeCursorKey(remoteId));
    const parsed = raw ? (JSON.parse(raw) as Partial<ChangeCursor>) : null;
    if (
      !parsed ||
      parsed.localChildId !== localChildId ||
      typeof parsed.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(parsed.updatedAt))
    ) return null;
    return parsed.updatedAt;
  } catch {
    return null;
  }
}

const writeChangeCursor = (remoteId: string, localChildId: string, updatedAt: string) =>
  AsyncStorage.setItem(
    changeCursorKey(remoteId),
    JSON.stringify({ localChildId, updatedAt } satisfies ChangeCursor),
  );

/**
 * Downloads every record of the child that was added, edited or deleted on the
 * server since the last pull, whichever day it belongs to. Week downloads are
 * remembered as done, and realtime misses whatever happens while the app is
 * closed or offline, so without this a change made by another caregiver to an
 * already downloaded day never arrived.
 */
export async function pullChildChanges(
  remoteId: string,
  localChildId: string,
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  return weekLoads.run(`${remoteId}/changes`, async () => {
    await requireSession();
    const cursor = await readChangeCursor(remoteId, localChildId);

    if (cursor === null) {
      // Nothing says how stale the downloaded weeks are, so they are forgotten
      // and download once more; from this point on changes are followed.
      const { data, error } = await supabase
        .from('sessions')
        .select('updated_at')
        .eq('child_id', remoteId)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      const latest = (data?.[0] as { updated_at?: string } | undefined)?.updated_at;
      await loadedWeeks.reset(remoteId, localChildId);
      await writeChangeCursor(
        remoteId,
        localChildId,
        typeof latest === 'string' ? latest : new Date(0).toISOString(),
      );
      return 0;
    }

    let since = new Date(Date.parse(cursor) - CHANGE_CURSOR_OVERLAP_MS).toISOString();
    let newest = cursor;
    let changed = 0;
    // Rows already merged from the page boundary's timestamp, which the next page repeats.
    let boundaryIds = new Set<string>();
    for (;;) {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('child_id', remoteId)
        .gte('updated_at', since)
        .order('updated_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(HISTORY_PAGE_SIZE);
      if (error) throw error;
      const page = (data ?? []) as SessionRow[];
      const rows = page.filter((row) => !boundaryIds.has(row.id));
      if (rows.length) {
        changed += await mergeRemoteSessionRows(rows, localChildId);
        const last = page[page.length - 1].updated_at;
        if (Date.parse(last) >= Date.parse(newest)) newest = last;
      }
      if (page.length < HISTORY_PAGE_SIZE) break;
      const last = page[page.length - 1].updated_at;
      // A full page stamped with a single instant cannot be stepped through by
      // timestamp; such a bulk write is left to the week downloads.
      if (last === since && !rows.length) break;
      boundaryIds = new Set(
        [...(last === since ? boundaryIds : []), ...page
          .filter((row) => row.updated_at === last)
          .map((row) => row.id)],
      );
      since = last;
    }
    if (newest !== cursor) await writeChangeCursor(remoteId, localChildId, newest);
    return changed;
  });
}

export async function loadChildHistoryRange(
  remoteId: string,
  localChildId: string,
  startMs: number,
  endMs: number,
  options: { refresh?: boolean } = {},
): Promise<number> {
  const counts = await Promise.all(
    calendarWeeksInRange(startMs, endMs).map((week) =>
      loadChildHistoryWeek(remoteId, localChildId, week, options),
    ),
  );
  return counts.reduce((sum, count) => sum + count, 0);
}

/** Loads a long span one week at a time, so a large history is not requested all at once. */
export async function syncChildHistory(
  remoteId: string,
  localChildId: string,
  startMs: number,
  endMs: number,
  options: { refresh?: boolean } = {},
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  let applied = 0;
  for (const week of calendarWeeksInRange(startMs, endMs)) {
    applied += await loadChildHistoryWeek(remoteId, localChildId, week, options);
  }
  return applied;
}

export function loadChildCurrentWeek(
  remoteId: string,
  localChildId: string,
  options: { refresh?: boolean } = {},
): Promise<number> {
  return loadChildHistoryWeek(remoteId, localChildId, calendarWeekOf(new Date()), options);
}

export async function loadChildCurrentWeekRemainder(
  remoteId: string,
  localChildId: string,
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const now = new Date();
  const week = calendarWeekOf(now);
  const day = calendarDayOf(now);
  return weekLoads.run(`${remoteId}/${week.key}`, async () => {
    if (await historyRanges.isSettled(remoteId, localChildId, week.key)) return 0;
    const ranges = [
      { startMs: week.startMs, endMs: day.startMs },
      { startMs: day.endMs, endMs: week.endMs },
    ].filter((range) => range.endMs > range.startMs);
    const counts = await Promise.all(
      ranges.map((range) => fetchHistoryPages(remoteId, localChildId, range)),
    );
    const applied = counts.reduce((sum, count) => sum + count, 0);
    await historyRanges.record(remoteId, localChildId, week.key, applied);
    return applied;
  });
}
