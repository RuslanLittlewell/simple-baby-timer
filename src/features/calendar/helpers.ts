import { type TranslateParams } from '@/i18n';
import { type ActivitySession, type SessionKind } from '@/lib/activity-store';
import { type Session } from '@/state/app-state';

import { Spacing } from '@/constants/theme';

import { GUTTER, LANES, SCREEN_WIDTH } from './constants';

export type Translate = (key: string, params?: TranslateParams) => string;

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const startOfDayMs = (ts: number) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export const startOfWeek = (date: Date) => {
  const dow = (date.getDay() + 6) % 7; // Monday = 0
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dow);
};

export const shiftDayMs = (dayMs: number, delta: number) => {
  const d = new Date(dayMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta).getTime();
};

export const combineDayTime = (dayMs: number, time: { hours: number; minutes: number }) => {
  const d = new Date(dayMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), time.hours, time.minutes).getTime();
};

export const formatDuration = (milliseconds: number, hoursUnit: string, minutesUnit: string) => {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} ${minutesUnit}`;
  if (!minutes) return `${hours} ${hoursUnit}`;
  return `${hours} ${hoursUnit} ${minutes} ${minutesUnit}`;
};

export const parseTime = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

export const isEvent = (kind: SessionKind) => kind === 'poop' || kind === 'diaper';

// Each kind keeps a fixed share of the track, measured from its right edge:
// sleep / awake / settling take all of it, feeding a half, the point events a
// fifth. LANES still decides what draws on top.
const TRACK_WIDTH = SCREEN_WIDTH - GUTTER - Spacing.two;
const trackLeft = (share: number) => GUTTER + TRACK_WIDTH * (1 - share);

export const laneLeft = (kind: SessionKind) =>
  isEvent(kind) ? trackLeft(0.2) : LANES[kind] === 0 ? GUTTER : trackLeft(0.5);

export function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export interface DayStats {
  sleepMs: number;
  awakeMs: number;
  settlingMs: number;
  milkMl: number;
  feedingCount: number;
  lastFeedingAt: number | null;
  poopCount: number;
  diaperCount: number;
}

export function computeDayStats(
  sessions: ActivitySession[],
  liveSession: Session,
  now: number,
  dayStartMs: number,
  dayEndMs: number,
  liveFeedingStartedAt?: number,
): DayStats {
  const durationInDay = (start: number, end: number) =>
    Math.max(0, Math.min(end, dayEndMs) - Math.max(start, dayStartMs));
  const completedSleepMs = sessions
    .filter((item) => item.kind === 'sleep')
    .reduce((sum, item) => sum + durationInDay(item.start, item.end), 0);
  const completedAwakeMs = sessions
    .filter((item) => item.kind === 'awake')
    .reduce((sum, item) => sum + durationInDay(item.start, item.end), 0);
  const completedSettlingMs = sessions
    .filter((item) => item.kind === 'settling')
    .reduce((sum, item) => sum + durationInDay(item.start, item.end), 0);
  const liveMainMs = liveSession ? durationInDay(liveSession.startedAt, now) : 0;
  const feedingSessions = sessions.filter(
    (item) => item.kind === 'feeding' && item.start >= dayStartMs && item.start < dayEndMs,
  );
  const feedingStarts = feedingSessions.map((item) => item.start);
  if (
    liveFeedingStartedAt !== undefined &&
    liveFeedingStartedAt >= dayStartMs &&
    liveFeedingStartedAt < dayEndMs
  ) {
    feedingStarts.push(liveFeedingStartedAt);
  }
  return {
    sleepMs: completedSleepMs + (liveSession?.kind === 'sleep' ? liveMainMs : 0),
    awakeMs: completedAwakeMs + (liveSession?.kind === 'awake' ? liveMainMs : 0),
    settlingMs: completedSettlingMs + (liveSession?.kind === 'settling' ? liveMainMs : 0),
    milkMl: feedingSessions.reduce((sum, item) => sum + (item.milkMl ?? 0), 0),
    feedingCount: feedingSessions.length,
    lastFeedingAt: feedingStarts.length ? Math.max(...feedingStarts) : null,
    poopCount: sessions.filter(
      (item) => item.kind === 'poop' && item.start >= dayStartMs && item.start < dayEndMs,
    ).length,
    diaperCount: sessions.filter(
      (item) => item.kind === 'diaper' && item.start >= dayStartMs && item.start < dayEndMs,
    ).length,
  };
}
