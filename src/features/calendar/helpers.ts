import { type TranslateParams } from '@/i18n';
import { type ActivitySession, type SessionKind } from '@/lib/activity-store';
import { type Session } from '@/state/app-state';

import { GUTTER, LANE_INSET, LANES } from './constants';

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

export const normalizeTimeInput = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

export const parseTime = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

export const isEvent = (kind: SessionKind) => kind === 'poop' || kind === 'diaper';

export const laneLeft = (kind: SessionKind) => GUTTER + LANES[kind] * LANE_INSET;

export function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export type DayStats = {
  sleepMs: number;
  awakeMs: number;
  milkMl: number;
  poopCount: number;
  diaperCount: number;
};

export function computeDayStats(
  sessions: ActivitySession[],
  liveSession: Session,
  now: number,
  dayStartMs: number,
  dayEndMs: number,
): DayStats {
  const durationInDay = (start: number, end: number) =>
    Math.max(0, Math.min(end, dayEndMs) - Math.max(start, dayStartMs));
  const completedSleepMs = sessions
    .filter((item) => item.kind === 'sleep')
    .reduce((sum, item) => sum + durationInDay(item.start, item.end), 0);
  const completedAwakeMs = sessions
    .filter((item) => item.kind === 'awake')
    .reduce((sum, item) => sum + durationInDay(item.start, item.end), 0);
  const liveMainMs = liveSession ? durationInDay(liveSession.startedAt, now) : 0;
  return {
    sleepMs: completedSleepMs + (liveSession?.kind === 'sleep' ? liveMainMs : 0),
    awakeMs: completedAwakeMs + (liveSession?.kind === 'awake' ? liveMainMs : 0),
    milkMl: sessions
      .filter((item) => item.kind === 'feeding' && item.start >= dayStartMs && item.start < dayEndMs)
      .reduce((sum, item) => sum + (item.milkMl ?? 0), 0),
    poopCount: sessions.filter(
      (item) => item.kind === 'poop' && item.start >= dayStartMs && item.start < dayEndMs,
    ).length,
    diaperCount: sessions.filter(
      (item) => item.kind === 'diaper' && item.start >= dayStartMs && item.start < dayEndMs,
    ).length,
  };
}
