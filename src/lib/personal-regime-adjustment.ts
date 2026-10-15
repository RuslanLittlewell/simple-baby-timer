/**
 * Today's plan, kept in step with the day as it goes. What already happened
 * is on record and needs no suggestions; the rest of the day is laid out
 * again from the latest wake-up, the way the child's own rhythm continues
 * from there: the wake window that belongs to the next nap, then the nap,
 * and so on until the night. The windows bend a little, and a nap is added
 * or dropped, so that bedtime stays near the usual one.
 */
import {
  chainNaps,
  findNight,
  regimeRhythm,
  rhythmStretch,
  type PersonalRegime,
  type PersonalRegimeNap,
  type RegimeGhostKind,
  type RegimeGhostSegment,
  type RegimeRhythm,
} from './personal-regime.ts';

const DAY_MINUTES = 24 * 60;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** How far the remaining wake windows bend to keep bedtime in place. */
const MIN_STRETCH = 0.8;
const MAX_STRETCH = 1.25;
/** Without a recorded night, sleeps before this hour are not naps. */
const EARLIEST_NAP_HOUR = 5;

/** How today has gone so far, as much of it as the rest of the plan depends on. */
export interface RegimeDayProgress {
  dayKey: string;
  /**
   * The end of the night or of the latest nap since, in minutes after local
   * midnight; null while the night lasts or when it was not recorded.
   */
  awakeSinceMin: number | null;
  /** Naps finished since the night. */
  napsTaken: number;
  /** The start of the sleep running now, once the child has been up. */
  asleepSinceMin: number | null;
}

export interface PlannedSleep {
  /** Minutes after the day's local midnight: below zero yesterday, past a full day tomorrow. */
  startMin: number;
  endMin: number;
  /** Where its preparation begins; the sleep itself when there is none. */
  settlingStartMin: number;
}

export interface RegimeDayPlan {
  /** The night that ends this morning, while the child is not up yet. */
  lastNight: PlannedSleep | null;
  naps: PlannedSleep[];
  tonight: PlannedSleep;
}

export function regimeAdjustmentDayKey(ms: number): string {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isDayMinute = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0 && value <= DAY_MINUTES;

export function isRegimeDayProgress(value: unknown): value is RegimeDayProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Partial<RegimeDayProgress>;
  return (
    typeof progress.dayKey === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(progress.dayKey) &&
    (progress.awakeSinceMin === null || isDayMinute(progress.awakeSinceMin)) &&
    Number.isInteger(progress.napsTaken) &&
    (progress.napsTaken as number) >= 0 &&
    (progress.asleepSinceMin === null || isDayMinute(progress.asleepSinceMin))
  );
}

/** Sleeps interrupted for at most this long count as one sleep. */
export const SLEEP_MERGE_GAP_MS = 15 * MINUTE_MS;

/** A recorded sleep, or the running one when `end` is null. */
export interface DaySleep {
  start: number;
  end: number | null;
}

export function mergeSleepFragments(
  sleeps: DaySleep[],
  gapMs = SLEEP_MERGE_GAP_MS,
): DaySleep[] {
  const merged: DaySleep[] = [];
  for (const sleep of [...sleeps].sort((a, b) => a.start - b.start)) {
    const previous = merged[merged.length - 1];
    if (previous && previous.end !== null && sleep.start - previous.end <= gapMs) {
      previous.end = sleep.end === null ? null : Math.max(previous.end, sleep.end);
    } else {
      merged.push({ ...sleep });
    }
  }
  return merged;
}

/** Local clock minutes, so a daylight-saving change does not move the plan. */
const clockMinute = (ms: number) => {
  const date = new Date(ms);
  return Math.round(date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60);
};

/**
 * Reads today off the recorded sleeps: when the night ended, the naps since
 * and a sleep running now. The night is found the same way the schedule
 * finds it when it learns, so a feed in the small hours does not end it.
 */
export function regimeDayProgress(sleeps: DaySleep[], now: number): RegimeDayProgress {
  const dayKey = regimeAdjustmentDayKey(now);
  const today = new Date(now);
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).getTime();
  const notUp: RegimeDayProgress = { dayKey, awakeSinceMin: null, napsTaken: 0, asleepSinceMin: null };

  const merged = mergeSleepFragments(sleeps.filter((sleep) => sleep.start < now));
  const night = findNight(
    merged.map((sleep) => ({ start: sleep.start, end: sleep.end ?? now })),
    yesterday,
  );
  if (night && merged[night.last].end === null) return notUp;

  const daySleeps = night
    ? merged.slice(night.last + 1)
    : merged.filter((sleep) => sleep.start >= midnight + EARLIEST_NAP_HOUR * HOUR_MS);
  const naps = daySleeps.filter((sleep) => sleep.end !== null);
  const awakeSince = naps.at(-1)?.end ?? (night ? night.wake : null);
  if (awakeSince === null || awakeSince < midnight) return notUp;

  const running = daySleeps.find((sleep) => sleep.end === null);
  return {
    dayKey,
    awakeSinceMin: clockMinute(awakeSince),
    napsTaken: naps.length,
    asleepSinceMin: running && running.start >= awakeSince ? clockMinute(running.start) : null,
  };
}

/**
 * The rhythm left after `napsTaken` naps, shortened or lengthened to
 * `napCount` naps: a dropped nap is one of the last, an added one repeats
 * the last.
 */
function remainingRhythm(rhythm: RegimeRhythm, napsTaken: number, napCount: number): RegimeRhythm {
  const planned = rhythm.napDurations.length;
  const wakeWindows: number[] = [];
  const napDurations: number[] = [];
  for (let offset = 0; offset < napCount; offset++) {
    const index = Math.min(napsTaken + offset, planned - 1);
    wakeWindows.push(rhythm.wakeWindows[index]);
    napDurations.push(rhythm.napDurations[index]);
  }
  wakeWindows.push(rhythm.wakeWindows[planned]);
  return { wakeWindows, napDurations };
}

/**
 * The rest of the day from a wake-up. The wake window the child is in keeps
 * its usual length - an early riser gets tired early, not late. The windows
 * after it bend towards the usual bedtime, never past the limits, and the
 * number of naps is the one that then gets closest to it; on a tie, the
 * usual number.
 */
function restOfDay(
  regime: PersonalRegime,
  rhythm: RegimeRhythm,
  napsTaken: number,
  fromMin: number,
): { naps: PersonalRegimeNap[]; bedMin: number } {
  const planned = rhythm.napDurations.length;
  const usual = Math.max(0, planned - napsTaken);
  const counts = planned ? [usual, usual - 1, usual + 1].filter((count) => count >= 0) : [0];
  const options = counts.map((count) => {
    const rest = remainingRhythm(rhythm, napsTaken, count);
    const [current, ...later] = rest.wakeWindows;
    const stretch = Math.min(
      MAX_STRETCH,
      Math.max(
        MIN_STRETCH,
        rhythmStretch(
          { wakeWindows: later, napDurations: rest.napDurations },
          regime.bedMin - fromMin - current,
        ),
      ),
    );
    const bent: RegimeRhythm = {
      wakeWindows: [current, ...later.map((window) => window * stretch)],
      napDurations: rest.napDurations,
    };
    return chainNaps(fromMin, bent, 1, regime);
  });
  return options.reduce((chosen, option) =>
    Math.abs(option.bedMin - regime.bedMin) < Math.abs(chosen.bedMin - regime.bedMin)
      ? option
      : chosen,
  );
}

const plannedSleep = (startMin: number, endMin: number, settlingMin: number | null): PlannedSleep => ({
  startMin,
  endMin,
  settlingStartMin: startMin - (settlingMin ?? 0),
});

/**
 * The day's suggested sleeps. Without progress, or before the child is up,
 * it is the learned schedule as it stands; afterwards only what is still
 * ahead, laid out from the latest wake-up. A sleep running now is a nap
 * expected to last the usual time, unless it is nearer to bedtime than to
 * the next nap: then the night has begun.
 */
export function planRegimeDay(regime: PersonalRegime, progress?: RegimeDayProgress): RegimeDayPlan {
  const tomorrowWakeMin = regime.wakeMin + DAY_MINUTES;
  if (!progress || progress.awakeSinceMin === null) {
    return {
      lastNight: plannedSleep(regime.bedMin - DAY_MINUTES, regime.wakeMin, regime.bedtimeSettlingMin),
      naps: regime.naps.map((nap) => plannedSleep(nap.startMin, nap.endMin, regime.napSettlingMin)),
      tonight: plannedSleep(regime.bedMin, tomorrowWakeMin, regime.bedtimeSettlingMin),
    };
  }

  const rhythm = regimeRhythm(regime);
  const asleepSince = progress.asleepSinceMin;
  let napsTaken = progress.napsTaken;
  let rest = restOfDay(regime, rhythm, napsTaken, progress.awakeSinceMin);
  const naps: PlannedSleep[] = [];
  if (asleepSince !== null) {
    const nextNap = rest.naps[0];
    if (!nextNap || Math.abs(asleepSince - nextNap.startMin) > Math.abs(rest.bedMin - asleepSince)) {
      return { lastNight: null, naps: [], tonight: plannedSleep(asleepSince, tomorrowWakeMin, null) };
    }
    const duration = rhythm.napDurations[Math.min(napsTaken, rhythm.napDurations.length - 1)];
    naps.push(plannedSleep(asleepSince, asleepSince + duration, null));
    napsTaken += 1;
    rest = restOfDay(regime, rhythm, napsTaken, asleepSince + duration);
  }
  for (const nap of rest.naps) naps.push(plannedSleep(nap.startMin, nap.endMin, regime.napSettlingMin));
  return {
    lastNight: null,
    naps,
    tonight: plannedSleep(rest.bedMin, tomorrowWakeMin, regime.bedtimeSettlingMin),
  };
}

const wrapMinutes = (minutes: number) =>
  ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

/** The plan as blocks on its calendar day, clipped to it. */
export function regimeGhostSegments(plan: RegimeDayPlan): RegimeGhostSegment[] {
  const planned: { kind: RegimeGhostKind; startMin: number; endMin: number }[] = [];
  for (const sleep of [plan.lastNight, ...plan.naps, plan.tonight]) {
    if (!sleep) continue;
    if (sleep.settlingStartMin < sleep.startMin) {
      planned.push({ kind: 'settling', startMin: sleep.settlingStartMin, endMin: sleep.startMin });
    }
    planned.push({ kind: 'sleep', startMin: sleep.startMin, endMin: sleep.endMin });
  }

  return planned
    .map((segment) => ({
      kind: segment.kind,
      startMin: Math.max(0, segment.startMin),
      endMin: Math.min(DAY_MINUTES, segment.endMin),
      plannedStartMin: wrapMinutes(segment.startMin),
      plannedEndMin: wrapMinutes(segment.endMin),
    }))
    .filter((segment) => segment.endMin > segment.startMin);
}
