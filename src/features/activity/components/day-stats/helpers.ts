import {
  fmtTime,
  formatDuration,
  type DayStats,
  type Translate,
} from "@/features/calendar/helpers";

import { type IconName } from "../../constants";

export type MetricIndex = 0 | 1 | 2 | 3;

export interface StatCardContent {
  icon: IconName;
  value: string;
  label: string;
  color: string;
}

interface StatAccents {
  sleep: string;
  awake: string;
  feed: string;
  diaper: string;
  poop: string;
}

export function nextMetricIndex(
  current: MetricIndex,
  optionCount = 3,
): MetricIndex {
  return current === optionCount - 1 ? 0 : ((current + 1) as MetricIndex);
}

function formatDateTime(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (isToday) return fmtTime(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month} / ${fmtTime(timestamp)}`;
}

function formatTimeWithElapsed(timestamp: number, now: number, t: Translate) {
  const elapsedMinutesMs = Math.floor(Math.max(0, now - timestamp) / 60000) * 60000;
  const elapsed = formatDuration(elapsedMinutesMs, t("unit.hours"), t("unit.minutes"));
  return `${fmtTime(timestamp)} / ${elapsed}`;
}

export function getSleepMetrics(
  stats: DayStats,
  accent: StatAccents,
  t: Translate,
): StatCardContent[] {
  return [
    {
      icon: "moon-waning-crescent",
      color: accent.sleep,
      value: stats.lastSleepAt === null ? "—" : formatDateTime(stats.lastSleepAt),
      label: t("kind.lastSleep"),
    },
    {
      icon: "moon-waning-crescent",
      color: accent.sleep,
      value: formatDuration(stats.sleepMs, t("unit.hours"), t("unit.minutes")),
      label: t("kind.sleep"),
    },
    {
      icon: "white-balance-sunny",
      color: accent.awake,
      value: formatDuration(stats.awakeMs, t("unit.hours"), t("unit.minutes")),
      label: t("kind.awake"),
    },
  ];
}

export function getFeedingMetrics(
  stats: DayStats,
  accent: StatAccents,
  t: Translate,
  now: number,
): StatCardContent[] {
  return [
    {
      icon: "baby-bottle-outline",
      color: accent.feed,
      value:
        stats.lastFeedingAt === null
          ? "—"
          : formatTimeWithElapsed(stats.lastFeedingAt, now, t),
      label: t("stats.lastFeeding"),
    },
    {
      icon: "baby-bottle-outline",
      color: accent.feed,
      value: String(stats.milkMl),
      label: t("unit.ml"),
    },
    {
      icon: "baby-bottle-outline",
      color: accent.feed,
      value: String(stats.feedingCount),
      label: t("kind.feeding"),
    },
  ];
}

export function getDiaperMetrics(
  stats: DayStats,
  accent: StatAccents,
  t: Translate,
): StatCardContent[] {
  return [
    {
      icon: "diaper-outline",
      color: accent.diaper,
      value: stats.lastDiaperAt === null ? "—" : formatDateTime(stats.lastDiaperAt),
      label: t("stats.lastDiaper"),
    },
    {
      icon: "diaper-outline",
      color: accent.diaper,
      value: String(stats.diaperCount),
      label: t("kind.diaper"),
    },
    {
      icon: "emoticon-poop",
      color: accent.poop,
      value: String(stats.poopCount),
      label: t("kind.poop"),
    },
    {
      icon: "emoticon-poop",
      color: accent.poop,
      value: stats.lastPoopAt === null ? "—" : formatDateTime(stats.lastPoopAt),
      label: t("stats.lastPoop"),
    },
  ];
}

export function getNextMetricHint(
  metrics: StatCardContent[],
  current: MetricIndex,
  t: Translate,
) {
  return t("stats.showMetric", {
    metric: metrics[nextMetricIndex(current, metrics.length)].label,
  });
}
