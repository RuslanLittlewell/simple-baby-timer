import { type LanguageCode, MONTHS_I18N } from "@/i18n";
import { getSessionsInRange } from "@/lib/activity-store";
import { type Session } from "@/state/app-state";

import { computeDayStats, pad2, type DayStats } from "../../helpers";

export type StatsTab = "day" | "week" | "month";
export type AverageKey = "sleepMs" | "awakeMs" | "settlingMs" | "milkMl";

export interface DayPoint {
  dayStartMs: number;
  stats: DayStats;
}

export const TABS: StatsTab[] = ["day", "week", "month"];
export const HOUR = 3_600_000;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function periodOf(tab: StatsTab, cursor: Date) {
  if (tab === "day") return { start: startOfDay(cursor), days: 1 };
  if (tab === "week") return { start: startOfDay(cursor), days: 7 };
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  return { start, days };
}

export function previousPeriodOf(tab: StatsTab, start: Date, days: number) {
  if (tab === "month") {
    const previousStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    return {
      start: previousStart,
      days: new Date(
        previousStart.getFullYear(),
        previousStart.getMonth() + 1,
        0,
      ).getDate(),
    };
  }
  return {
    start: new Date(start.getFullYear(), start.getMonth(), start.getDate() - days),
    days,
  };
}

export function shiftCursor(tab: StatsTab, cursor: Date, delta: number) {
  if (tab === "month") {
    return new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
  }
  return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + delta);
}

export async function buildDayPoints(
  rangeStartMs: number,
  rangeEndMs: number,
  rangeDays: number,
  activeChildId: string | null,
  liveSession: Session,
  now: number,
) {
  const sessions = await getSessionsInRange(rangeStartMs, rangeEndMs, activeChildId);
  const base = new Date(rangeStartMs);
  const points: DayPoint[] = [];
  for (let index = 0; index < rangeDays; index++) {
    const dayStart = new Date(base.getFullYear(), base.getMonth(), base.getDate() + index);
    const dayStartMs = dayStart.getTime();
    const dayEndMs = new Date(
      dayStart.getFullYear(),
      dayStart.getMonth(),
      dayStart.getDate() + 1,
    ).getTime();
    points.push({
      dayStartMs,
      stats: computeDayStats(sessions, liveSession, now, dayStartMs, dayEndMs),
    });
  }
  return points;
}

export function formatPeriodLabel(
  tab: StatsTab,
  start: Date,
  endMs: number,
  language: LanguageCode,
) {
  const formatDate = (date: Date) =>
    `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
  if (tab === "day") return formatDate(start);
  if (tab === "week") {
    const last = new Date(endMs - 1);
    return `${pad2(start.getDate())}.${pad2(start.getMonth() + 1)} – ${pad2(last.getDate())}.${pad2(last.getMonth() + 1)}`;
  }
  return `${MONTHS_I18N[language][start.getMonth()]} ${start.getFullYear()}`;
}

export function averageOf(items: DayPoint[], key: AverageKey) {
  const values = items.map((point) => point.stats[key]).filter((value) => value > 0);
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

export function percentageChange(current: number, previous: number) {
  return Math.round(((current - previous) / previous) * 100);
}
