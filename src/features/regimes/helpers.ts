import { type RegimeVariant } from './types';

const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatMin = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;

export interface TimelineWindow {
  startHour: number; // first hour line
  endHour: number; // last hour line
}

// The hour range that tightly contains every timed step of a variant, padded
// to whole hours so the grid looks like the calendar day view.
export function windowForVariant(variant: RegimeVariant): TimelineWindow {
  let min = 24 * 60;
  let max = 0;
  for (const step of variant.steps) {
    if (step.startMin === null) continue;
    min = Math.min(min, step.startMin);
    max = Math.max(max, step.endMin ?? step.startMin);
  }
  if (min > max) return { startHour: 6, endHour: 21 };
  return { startHour: Math.floor(min / 60), endHour: Math.ceil(max / 60) };
}

const MIN_FILL_MINUTES = 10;

// Awake windows = the parts of the day between sleeps. Feedings and activities
// overlay these, so only sleep carves the timeline.
export function awakeFills(
  variant: RegimeVariant,
  startMin: number,
  endMin: number,
): { startMin: number; endMin: number }[] {
  const sleeps = variant.steps
    .filter((s) => s.kind === 'sleep' && s.startMin !== null && s.endMin !== null)
    .map((s) => [s.startMin as number, s.endMin as number] as const)
    .sort((a, b) => a[0] - b[0]);

  const fills: { startMin: number; endMin: number }[] = [];
  let cursor = startMin;
  for (const [a, b] of sleeps) {
    if (a - cursor >= MIN_FILL_MINUTES) fills.push({ startMin: cursor, endMin: a });
    cursor = Math.max(cursor, b);
  }
  if (endMin - cursor >= MIN_FILL_MINUTES) fills.push({ startMin: cursor, endMin: endMin });
  return fills;
}
