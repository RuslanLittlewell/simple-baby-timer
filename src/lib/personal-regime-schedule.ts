/**
 * When the personal schedule is rebuilt: once per local calendar day, at
 * midnight while the app is open, and otherwise at the first moment the app
 * comes back to a signed-in account - a sleeping phone runs no timers, so the
 * day the user missed is caught up instead of lost.
 */

/** Timers may fire a hair early, so the run lands just inside the new day. */
const MIDNIGHT_GUARD_MS = 1_000;

export interface RegimeRunCandidate {
  childId: string;
  /** The rebuild is a Pro feature, exactly like the manual recalculation. */
  hasProAccess: boolean;
  /** Local day of the last finished run, as `localDayKey` writes it. */
  lastRunDay: string | undefined;
}

export function localDayKey(ms: number): string {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Milliseconds until the start of the next local day, DST shifts included. */
export function msUntilNextLocalMidnight(now: number): number {
  const date = new Date(now);
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
  return midnight - now + MIDNIGHT_GUARD_MS;
}

export function childrenDueForRegimeRun(
  candidates: RegimeRunCandidate[],
  now: number,
): string[] {
  const today = localDayKey(now);
  return candidates
    .filter((candidate) => candidate.hasProAccess && candidate.lastRunDay !== today)
    .map((candidate) => candidate.childId);
}
