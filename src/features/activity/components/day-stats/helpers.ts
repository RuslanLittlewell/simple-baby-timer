import {
  fmtTime,
  formatDuration,
  type DayStats,
  type Translate,
} from "@/features/calendar/helpers";

export type MetricIndex = 0 | 1 | 2 | 3;

export interface StatCardContent {
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

export function withAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export function getSleepMetrics(
  stats: DayStats,
  accent: StatAccents,
  t: Translate,
): StatCardContent[] {
  return [
    {
      color: accent.sleep,
      value: stats.lastSleepAt === null ? "—" : formatDateTime(stats.lastSleepAt),
      label: t("kind.lastSleep"),
    },
    {
      color: accent.sleep,
      value: formatDuration(stats.sleepMs, t("unit.hours"), t("unit.minutes")),
      label: t("kind.sleep"),
    },
    {
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
): StatCardContent[] {
  return [
    {
      color: accent.feed,
      value: stats.lastFeedingAt === null ? "—" : formatDateTime(stats.lastFeedingAt),
      label: t("stats.lastFeeding"),
    },
    {
      color: accent.feed,
      value: String(stats.milkMl),
      label: t("unit.ml"),
    },
    {
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
      color: accent.diaper,
      value: stats.lastDiaperAt === null ? "—" : formatDateTime(stats.lastDiaperAt),
      label: t("stats.lastDiaper"),
    },
    {
      color: accent.diaper,
      value: String(stats.diaperCount),
      label: t("kind.diaper"),
    },
    {
      color: accent.poop,
      value: String(stats.poopCount),
      label: "💩",
    },
    {
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
