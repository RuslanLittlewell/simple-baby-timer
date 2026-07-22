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
    const raw = await AsyncStorage.getItem(storageKey(dayKeyFromDate(date)));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivitySession[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => a.start - b.start) : [];
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
  const key = storageKey(dayKeyFromDate(originalDate));
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return;

  const list = JSON.parse(raw) as ActivitySession[];
  const next = list.map((session) =>
    session.id === sessionId ? { ...session, ...updates } : session,
  ).sort((a, b) => a.start - b.start);
  await AsyncStorage.setItem(key, JSON.stringify(next));
}
