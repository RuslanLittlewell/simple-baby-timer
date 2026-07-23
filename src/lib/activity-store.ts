import AsyncStorage from '@react-native-async-storage/async-storage';

import { type ActivityKind } from '@/lib/notifications';

export type EventKind = 'poop' | 'diaper';

export const EVENT_DURATION_MS = 5 * 60_000;

export type SessionKind = ActivityKind | EventKind;

export type ActivitySession = {
  id: string;
  kind: SessionKind;
  start: number;
  end: number;

  milkMl?: number;
};

const PREFIX = 'babytimer.sessions.';

export function dayKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const storageKey = (dayKey: string) => `${PREFIX}${dayKey}`;

export async function getSessionsForDay(date: Date): Promise<ActivitySession[]> {
  try {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
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

    return sessions
      .filter((session) => session.start < dayEnd && session.end > dayStart)
      .sort((a, b) => a.start - b.start);
  } catch {
    return [];
  }
}

export async function saveSession(session: ActivitySession): Promise<void> {
  const key = storageKey(dayKeyFromDate(new Date(session.start)));
  try {
    const raw = await AsyncStorage.getItem(key);
    const list: ActivitySession[] = raw ? JSON.parse(raw) : [];
    list.push(session);
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
  updates: Pick<ActivitySession, 'start' | 'end'> & { milkMl?: number },
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

  // Start moved to another day — relocate the entry to that day's bucket.
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
