const DAY_MINUTES = 24 * 60;

export function minutesToPixels(minutes: number, hourHeight: number): number {
  return (minutes / 60) * hourHeight;
}

export function sessionLayout(
  start: number,
  end: number,
  dayStartMs: number,
  hourHeight: number,
) {
  const startMin = (start - dayStartMs) / 60_000;
  const endMin = (end - dayStartMs) / 60_000;
  const clampedStart = Math.max(0, Math.min(DAY_MINUTES, startMin));
  const clampedEnd = Math.max(0, Math.min(DAY_MINUTES, endMin));
  if (clampedEnd <= clampedStart) return null;

  const top = minutesToPixels(clampedStart, hourHeight);
  return {
    top,
    spanHeight: minutesToPixels(clampedEnd, hourHeight) - top,
    visibleStart: dayStartMs + clampedStart * 60_000,
    visibleEnd: dayStartMs + clampedEnd * 60_000,
  };
}

export function blockVisibility(height: number) {
  return {
    showText: height >= 16,
    showTime: height >= 34,
  };
}

export function durationBlockHeight(
  spanHeight: number,
  hourHeight: number,
  minimumHeight: number,
): number {
  return Math.max(spanHeight, minutesToPixels(5, hourHeight), minimumHeight);
}

export function eventBlockHeight(
  spanHeight: number,
  hourHeight: number,
  minimumHeight: number,
): number {
  return Math.max(spanHeight, minutesToPixels(10, hourHeight), minimumHeight);
}

export function eventStripeCount(
  blockWidth: number,
  eventHeight: number,
  stripePitch: number,
): number {
  return Math.ceil((blockWidth + 2 * eventHeight) / stripePitch);
}

export interface FeedingInterval {
  start: number;
  end: number;
}

export interface FeedingGap {
  /** When the earlier feeding ended. */
  from: number;
  /** When the next feeding started. */
  to: number;
  top: number;
  height: number;
}

/**
 * Breaks between consecutive feedings, laid out for the shown day. A break is
 * measured in full even when one of its feedings belongs to a neighbouring day,
 * while its line is clipped to the part that falls inside the shown day.
 */
export function feedingGaps(
  feedings: FeedingInterval[],
  dayStartMs: number,
  hourHeight: number,
): FeedingGap[] {
  const ordered = [...feedings].sort((a, b) => a.start - b.start);
  const gaps: FeedingGap[] = [];
  let previousEnd: number | null = null;

  for (const feeding of ordered) {
    if (previousEnd !== null && feeding.start - previousEnd >= 60_000) {
      const layout = sessionLayout(previousEnd, feeding.start, dayStartMs, hourHeight);
      if (layout) {
        gaps.push({
          from: previousEnd,
          to: feeding.start,
          top: layout.top,
          height: layout.spanHeight,
        });
      }
    }
    previousEnd = Math.max(previousEnd ?? feeding.end, feeding.end);
  }
  return gaps;
}
