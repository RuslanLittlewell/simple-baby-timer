const MINUTES_PER_DAY = 24 * 60;
const CURRENT_TIME_LEAD = 140;

export function timelineFocusTargetY(
  currentTimeMs: number,
  dayStartMs: number,
  hourHeight: number,
  viewportHeight: number,
  bottomPadding: number,
) {
  const currentMinutes = Math.min(
    MINUTES_PER_DAY,
    Math.max(0, (currentTimeMs - dayStartMs) / 60_000),
  );
  const target = (currentMinutes / 60) * hourHeight - CURRENT_TIME_LEAD;
  const maxScroll = Math.max(
    0,
    24 * hourHeight + bottomPadding - viewportHeight,
  );

  return Math.min(maxScroll, Math.max(0, target));
}
