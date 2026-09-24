import AsyncStorage from '@react-native-async-storage/async-storage';

import { type ActivityKind } from '@/lib/notifications';

export type EventKind = 'poop' | 'diaper' | 'nightWaking';

export const EVENT_DURATION_MS = 10 * 60_000;
export const NIGHT_WAKING_DURATION_MS = 15 * 60_000;

export const eventDurationMs = (kind: EventKind) =>
  kind === 'nightWaking' ? NIGHT_WAKING_DURATION_MS : EVENT_DURATION_MS;

/** A user-titled span of time, drawn beneath every other record. */
export type CustomKind = 'custom';

export type SessionKind = ActivityKind | EventKind | CustomKind;

export const SESSION_KINDS: readonly SessionKind[] = [
  'settling',
  'sleep',
  'awake',
  'feeding',
  'poop',
  'diaper',
  'nightWaking',
  'custom',
];

export const isSessionKind = (kind: unknown): kind is SessionKind =>
  SESSION_KINDS.includes(kind as SessionKind);

export type ProDetails =
  | {
      type: 'settling';
      methods: Array<
        | 'rocking'
        | 'fitball'
        | 'inArms'
        | 'crib'
        | 'pacifier'
        | 'whiteNoise'
        | 'music'
        | 'swaddling'
        | 'darkRoom'
        | 'walk'
        | 'independent'
      >;
    }
  | {
      type: 'sleep';
      place: 'crib' | 'stroller' | 'carSeat' | 'coSleeping' | 'carrier' | 'inArms';
    }
  | {
      type: 'feeding';
      mode: 'breast';
      side: 'left' | 'right' | 'both';
    }
  | {
      type: 'feeding';
      mode: 'bottle';
      
      
      content?: 'formula' | 'breastMilk';
      volumeMl?: number;
    };

export type ActivitySession = {
  id: string;
  kind: SessionKind;
  start: number;
  end: number;
  notes?: string;
  /** Set only on custom events. */
  title?: string;

  milkMl?: number;
  proDetails?: ProDetails;
  
  childId?: string;
};

const PREFIX = 'babytimer.sessions.';

export function dayKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const storageKey = (dayKey: string) => `${PREFIX}${dayKey}`;

export async function getSessionsInRange(
  startMs: number,
  endMs: number,
  childId?: string | null,
): Promise<ActivitySession[]> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
    if (!keys.length) return [];

    const storedDays = await AsyncStorage.multiGet(keys);
    const sessions = storedDays.flatMap(([, raw]) => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw) as ActivitySession[];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });

    const byId = new Map<string, ActivitySession>();
    for (const session of sessions) {
      if (session.start < endMs && session.end > startMs) byId.set(session.id, session);
    }
    return [...byId.values()]
      .filter((session) => !childId || !session.childId || session.childId === childId)
      .sort((a, b) => a.start - b.start);
  } catch {
    return [];
  }
}

/**
 * Awake, falling asleep and asleep describe one continuous timeline, so unlike
 * point events (feeding, diaper, ...) they can never legitimately overlap.
 */
const NON_OVERLAPPING_KINDS: ReadonlySet<SessionKind> = new Set<ActivityKind>([
  'settling',
  'sleep',
  'awake',
]);

export interface OverlapResolution {
  /** Existing sessions trimmed to make room, keeping their original id. */
  updated: ActivitySession[];
  /** New sessions split off the far side of a session the new range cut through the middle of. */
  created: ActivitySession[];
  /** Existing sessions fully covered by the new range, and so removed outright. */
  deleted: ActivitySession[];
}

/**
 * Makes room for [start, end) on the awake/settling/sleep timeline by
 * trimming, splitting or removing whichever of those sessions it overlaps,
 * rather than rejecting the new range outright.
 */
export async function resolveOverlappingSessions(
  kind: SessionKind,
  start: number,
  end: number,
  childId?: string | null,
  excludeId?: string,
): Promise<OverlapResolution> {
  const resolution: OverlapResolution = { updated: [], created: [], deleted: [] };
  if (!NON_OVERLAPPING_KINDS.has(kind)) return resolution;

  const overlapping = await getSessionsInRange(start, end, childId);
  for (const session of overlapping) {
    if (session.id === excludeId || !NON_OVERLAPPING_KINDS.has(session.kind)) continue;

    const originalDate = new Date(session.start);
    const remainderBefore = session.start < start;
    const remainderAfter = end < session.end;

    if (remainderBefore && remainderAfter) {
      await updateSession(session.id, originalDate, { start: session.start, end: start });
      resolution.updated.push({ ...session, end: start });

      const split: ActivitySession = {
        ...session,
        id: `${end}-${session.kind}-${Date.now()}`,
        start: end,
        end: session.end,
      };
      await saveSession(split);
      resolution.created.push(split);
    } else if (remainderBefore) {
      await updateSession(session.id, originalDate, { start: session.start, end: start });
      resolution.updated.push({ ...session, end: start });
    } else if (remainderAfter) {
      await updateSession(session.id, originalDate, { start: end, end: session.end });
      resolution.updated.push({ ...session, start: end });
    } else {
      await deleteSession(session.id, originalDate);
      resolution.deleted.push(session);
    }
  }
  return resolution;
}

export async function getSessionsForDay(
  date: Date,
  childId?: string | null,
): Promise<ActivitySession[]> {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
  return getSessionsInRange(dayStart, dayEnd, childId);
}

export async function getAllSessionsForChild(childId: string): Promise<ActivitySession[]> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
  if (!keys.length) return [];
  const storedDays = await AsyncStorage.multiGet(keys);
  const all = storedDays.flatMap(([, raw]) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ActivitySession[];
      return Array.isArray(parsed) ? parsed.filter((s) => s.childId === childId) : [];
    } catch {
      return [];
    }
  });
  return [...new Map(all.map((session) => [session.id, session])).values()];
}

export async function getLatestFeedingStart(
  childId?: string | null,
): Promise<number | null> {
  const sessions = await getSessionsInRange(
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    childId,
  );
  return sessions
    .filter((session) => session.kind === 'feeding')
    .reduce<number | null>(
      (latest, session) => latest === null ? session.start : Math.max(latest, session.start),
      null,
    );
}

export async function claimUnownedSessions(childId: string): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
    if (!keys.length) return;
    const storedDays = await AsyncStorage.multiGet(keys);
    for (const [key, raw] of storedDays) {
      if (!raw) continue;
      let list: ActivitySession[];
      try {
        list = JSON.parse(raw) as ActivitySession[];
      } catch {
        continue;
      }
      if (!Array.isArray(list) || !list.some((s) => !s.childId)) continue;
      const next = list.map((s) => (s.childId ? s : { ...s, childId }));
      await AsyncStorage.setItem(key, JSON.stringify(next));
    }
  } catch {
  }
}

export async function deleteAllSessions(): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
  if (keys.length) await AsyncStorage.multiRemove(keys);
}

export async function deleteSessionsForChild(childId: string): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
  if (!keys.length) return;
  const storedDays = await AsyncStorage.multiGet(keys);
  for (const [key, raw] of storedDays) {
    if (!raw) continue;
    let list: ActivitySession[];
    try {
      list = JSON.parse(raw) as ActivitySession[];
    } catch {
      continue;
    }
    if (!Array.isArray(list)) continue;
    const next = list.filter((session) => session.childId !== childId);
    if (next.length === list.length) continue;
    if (next.length) await AsyncStorage.setItem(key, JSON.stringify(next));
    else await AsyncStorage.removeItem(key);
  }
}

export async function mergeRemoteSessions(
  upserts: ActivitySession[],
  deletedIds: string[],
): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
  const storedDays = await AsyncStorage.multiGet(keys);
  const buckets = new Map<string, ActivitySession[]>();
  for (const [key, raw] of storedDays) {
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as ActivitySession[];
      if (Array.isArray(parsed)) buckets.set(key, parsed);
    } catch {
    }
  }

  const dirty = new Set<string>();
  const removeById = (id: string) => {
    for (const [key, list] of buckets) {
      const next = list.filter((s) => s.id !== id);
      if (next.length !== list.length) {
        buckets.set(key, next);
        dirty.add(key);
      }
    }
  };

  for (const id of deletedIds) removeById(id);
  for (const session of upserts) {
    removeById(session.id);
    const key = storageKey(dayKeyFromDate(new Date(session.start)));
    const list = buckets.get(key) ?? [];
    list.push(session);
    list.sort((a, b) => a.start - b.start);
    buckets.set(key, list);
    dirty.add(key);
  }

  for (const key of dirty) {
    await AsyncStorage.setItem(key, JSON.stringify(buckets.get(key) ?? []));
  }
}

export async function saveSession(session: ActivitySession): Promise<void> {
  const key = storageKey(dayKeyFromDate(new Date(session.start)));
  try {
    const raw = await AsyncStorage.getItem(key);
    const list: ActivitySession[] = raw ? JSON.parse(raw) : [];
    const existing = list.findIndex((item) => item.id === session.id);
    if (existing === -1) list.push(session);
    else list[existing] = session;
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch {
  }
}

export async function deleteSession(sessionId: string, originalDate: Date): Promise<void> {
  const key = storageKey(dayKeyFromDate(originalDate));
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return;

  const list = JSON.parse(raw) as ActivitySession[];
  await AsyncStorage.setItem(key, JSON.stringify(list.filter((s) => s.id !== sessionId)));
}

export async function updateSession(
  sessionId: string,
  originalDate: Date,
  updates: Pick<ActivitySession, 'start' | 'end'> & {
    milkMl?: number;
    proDetails?: ProDetails;
    notes?: string;
  },
): Promise<void> {
  const oldKey = storageKey(dayKeyFromDate(originalDate));
  const newKey = storageKey(dayKeyFromDate(new Date(updates.start)));

  const raw = await AsyncStorage.getItem(oldKey);
  if (!raw) return;
  const list = JSON.parse(raw) as ActivitySession[];
  const existing = list.find((session) => session.id === sessionId);
  if (!existing) return;
  const updated = { ...existing, ...updates };

  if (newKey === oldKey) {
    const next = list
      .map((session) => (session.id === sessionId ? updated : session))
      .sort((a, b) => a.start - b.start);
    await AsyncStorage.setItem(oldKey, JSON.stringify(next));
    return;
  }

  await AsyncStorage.setItem(
    oldKey,
    JSON.stringify(list.filter((session) => session.id !== sessionId)),
  );
  const targetRaw = await AsyncStorage.getItem(newKey);
  const targetList: ActivitySession[] = targetRaw ? JSON.parse(targetRaw) : [];
  targetList.push(updated);
  targetList.sort((a, b) => a.start - b.start);
  await AsyncStorage.setItem(newKey, JSON.stringify(targetList));
}
