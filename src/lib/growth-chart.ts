/**
 * The growth chart's geometry: measurements placed on a calendar-day axis, a
 * scale that never collapses, and day ticks that land on whole days.
 */
import type { GrowthMeasurement } from './growth-measurements';

export type GrowthMetric = 'weight' | 'height';

export interface GrowthChartPoint {
  /** Whole days since 1970-01-01 of the measurement date. */
  day: number;
  value: number;
  measuredOn: string;
}

export interface GrowthChartDomain {
  x: [number, number];
  y: [number, number];
}

const DAY_MS = 86_400_000;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (value: number) => String(value).padStart(2, '0');

const dayNumber = (measuredOn: string): number | null => {
  const match = DATE_ONLY_PATTERN.exec(measuredOn);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
};

/** One metric of the measurements, oldest first, spaced by the real dates between them. */
export function growthChartPoints(
  measurements: readonly GrowthMeasurement[],
  metric: GrowthMetric,
): GrowthChartPoint[] {
  return measurements
    .flatMap((measurement) => {
      const day = dayNumber(measurement.measuredOn);
      if (day === null) return [];
      const value = metric === 'weight' ? measurement.weightKg : measurement.heightCm;
      return [{ day, value, measuredOn: measurement.measuredOn }];
    })
    .sort((a, b) => a.day - b.day);
}

/**
 * Room above and below the line so the dots are never cut off, and a span for
 * a flat line or a single day, either of which would collapse the scale.
 */
export function growthChartDomain(points: readonly GrowthChartPoint[]): GrowthChartDomain {
  const days = points.map((point) => point.day);
  const values = points.map((point) => point.value);
  const minDay = Math.min(...days);
  const maxDay = Math.max(...days);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valuePad = Math.max((maxValue - minValue) * 0.15, maxValue * 0.02, 0.1);
  const dayPad = maxDay === minDay ? 1 : 0;
  return {
    x: [minDay - dayPad, maxDay + dayPad],
    y: [Math.max(0, minValue - valuePad), maxValue + valuePad],
  };
}

/** Up to `maxTicks` whole days from the first measurement to the last. */
export function growthChartDayTicks(
  points: readonly GrowthChartPoint[],
  maxTicks = 4,
): number[] {
  if (!points.length) return [];
  const first = points[0].day;
  const last = points[points.length - 1].day;
  if (last === first) return [first];
  const count = Math.min(maxTicks, last - first + 1);
  const ticks = Array.from({ length: count }, (_, index) =>
    Math.round(first + ((last - first) * index) / (count - 1)),
  );
  return [...new Set(ticks)];
}

/** An axis day: day and month, or month and year once the chart spans over a year. */
export function growthChartDayLabel(day: number, spanDays: number): string {
  const date = new Date(Math.round(day) * DAY_MS);
  const month = pad2(date.getUTCMonth() + 1);
  if (spanDays > 365) return `${month}/${String(date.getUTCFullYear()).slice(-2)}`;
  return `${pad2(date.getUTCDate())}/${month}`;
}
