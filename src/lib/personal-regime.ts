/**
 * A personal schedule built from a child's own records: the medians of the
 * cleanly logged days of the last weeks, laid out on a single day. It describes
 * the rhythm the child already has; it does not search for a better one.
 */

export const PERSONAL_REGIME_MIN_AGE_MONTHS = 2;
export const PERSONAL_REGIME_MIN_HISTORY_DAYS = 21;
export const PERSONAL_REGIME_WINDOW_DAYS = 60;
export const PERSONAL_REGIME_MIN_CLEAN_DAYS = 7;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAY_MINUTES = 24 * 60;

/** Sleep pieces this close together are one sleep, e.g. a transfer to the crib. */
const TRANSFER_GAP_MS = 10 * MINUTE_MS;
const MAX_SLEEP_MS = 16 * HOUR_MS;
/**
 * A record this long was left running by mistake, so it does not count
 * towards logging the day. Long wake windows alone are kept: some days a
 * child just cannot fall asleep.
 */
const MAX_COVERING_SESSION_MS = 8 * HOUR_MS;
const MIN_DAY_COVERAGE = 0.85;
const MIN_DAY_LENGTH_MIN = 8 * 60;
const MAX_DAY_LENGTH_MIN = 18 * 60;
const MIN_TYPICAL_DAYS = 3;
const MIN_PLAN_WAKE_WINDOW_MIN = 30;
const MAX_SETTLING_MS = 3 * HOUR_MS;
const SETTLING_LINK_MS = 10 * MINUTE_MS;
const MIN_SETTLING_SAMPLES = 3;
const ROUND_MIN = 5;

export interface RegimeSourceSession {
  kind: string;
  start: number;
  end: number;
}

export interface PersonalRegimeNap {
  startMin: number;
  endMin: number;
}

export interface PersonalRegime {
  computedAt: number;
  basedOnDays: number;
  /** Minutes after local midnight. */
  wakeMin: number;
  /** Minutes after local midnight; past a full day when bedtime falls after midnight. */
  bedMin: number;
  naps: PersonalRegimeNap[];
  napSettlingMin: number | null;
  bedtimeSettlingMin: number | null;
}

export type PersonalRegimeResult =
  | { ok: true; regime: PersonalRegime }
  | { ok: false; reason: 'notEnoughData'; cleanDays: number };

export type RegimeGhostKind = 'sleep' | 'settling';

export interface RegimeGhostSegment {
  kind: RegimeGhostKind;
  /** Clipped to the shown day, in minutes after local midnight. */
  startMin: number;
  endMin: number;
  /** The planned bounds before clipping, wrapped into a single day. */
  plannedStartMin: number;
  plannedEndMin: number;
}

interface SleepBlock {
  start: number;
  end: number;
}

interface Night {
  bed: number;
  wake: number;
  first: number;
  last: number;
}

/**
 * A sleep as recorded (`start`) and as counted (`onset`): settling is split
 * evenly, so the counted sleep begins halfway through the settling before it.
 */
interface CountedSleep {
  start: number;
  onset: number;
  end: number;
}

interface CleanDay {
  wake: number;
  naps: CountedSleep[];
  bedStart: number;
  bedOnset: number;
}

const localTime = (dayMs: number, dayOffset: number, hours: number) => {
  const date = new Date(dayMs);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, hours).getTime();
};

const minuteOfDay = (ms: number) => {
  const date = new Date(ms);
  return date.getHours() * 60 + date.getMinutes();
};

/** Bedtimes after midnight sort after the evening ones instead of before them. */
const eveningMinute = (ms: number) => {
  const minute = minuteOfDay(ms);
  return minute < 12 * 60 ? minute + DAY_MINUTES : minute;
};

const roundMinutes = (minutes: number) => Math.round(minutes / ROUND_MIN) * ROUND_MIN;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sleepBlocks(sessions: RegimeSourceSession[]): SleepBlock[] {
  const sleeps = sessions
    .filter((s) => s.kind === 'sleep' && s.end > s.start && s.end - s.start < MAX_SLEEP_MS)
    .sort((a, b) => a.start - b.start);
  const blocks: SleepBlock[] = [];
  for (const sleep of sleeps) {
    const last = blocks[blocks.length - 1];
    if (last && sleep.start - last.end <= TRANSFER_GAP_MS) last.end = Math.max(last.end, sleep.end);
    else blocks.push({ start: sleep.start, end: sleep.end });
  }
  return blocks;
}

/** Night gaps are feeds and wakings; the allowance narrows once morning comes. */
function nightGapAllowanceMs(gapStart: number): number {
  const hour = new Date(gapStart).getHours();
  if (hour < 6) return 90 * MINUTE_MS;
  if (hour < 12) return 20 * MINUTE_MS;
  return 45 * MINUTE_MS;
}

/** The night that starts on the evening of `dayMs`: the sleep holding 03:00, widened across wakings. */
function findNight(blocks: SleepBlock[], dayMs: number): Night | null {
  const midnight = localTime(dayMs, 1, 0);
  const anchor = localTime(dayMs, 1, 3);
  let first = blocks.findIndex((b) => b.start <= anchor && anchor <= b.end);
  if (first < 0) {
    const latestStart = localTime(dayMs, 1, 5);
    first = blocks.findIndex(
      (b) => b.start >= midnight && b.start <= latestStart && b.end - b.start >= 2 * HOUR_MS,
    );
  }
  if (first < 0) return null;

  const eveningStart = localTime(dayMs, 0, 18);
  const morningLimit = localTime(dayMs, 1, 7);
  let last = first;
  while (
    first > 0 &&
    blocks[first - 1].start >= eveningStart &&
    blocks[first].start - blocks[first - 1].end <= nightGapAllowanceMs(blocks[first - 1].end)
  ) first--;
  while (
    last + 1 < blocks.length &&
    blocks[last + 1].start <= morningLimit &&
    blocks[last + 1].start - blocks[last].end <= nightGapAllowanceMs(blocks[last].end)
  ) last++;
  if (blocks[last].end <= midnight) return null;
  return { bed: blocks[first].start, wake: blocks[last].end, first, last };
}

function coverage(sessions: RegimeSourceSession[], from: number, to: number): number {
  const intervals = sessions
    .filter(
      (s) =>
        (s.kind === 'sleep' || s.kind === 'awake' || s.kind === 'settling') &&
        s.end - s.start < MAX_COVERING_SESSION_MS &&
        s.end > from &&
        s.start < to,
    )
    .map((s) => [Math.max(from, s.start), Math.min(to, s.end)] as const)
    .sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let cursor = from;
  for (const [start, end] of intervals) {
    const begin = Math.max(start, cursor);
    if (end <= begin) continue;
    covered += end - begin;
    cursor = end;
  }
  return covered / (to - from);
}

/** An awake timer left running through a sleep keeps only its parts outside that sleep. */
function trimAwakeBySleep(sessions: RegimeSourceSession[]): RegimeSourceSession[] {
  const sleeps = sessions
    .filter((s) => s.kind === 'sleep' && s.end > s.start)
    .sort((a, b) => a.start - b.start);
  return sessions.flatMap((session) => {
    if (session.kind !== 'awake') return [session];
    const pieces: RegimeSourceSession[] = [];
    let cursor = session.start;
    for (const sleep of sleeps) {
      if (sleep.start >= session.end) break;
      if (sleep.end <= cursor) continue;
      if (sleep.start > cursor) pieces.push({ kind: 'awake', start: cursor, end: sleep.start });
      cursor = sleep.end;
    }
    if (session.end > cursor) pieces.push({ kind: 'awake', start: cursor, end: session.end });
    return pieces;
  });
}

const linkedSettling = (settlings: RegimeSourceSession[], sleepStart: number) =>
  settlings.find((s) => Math.abs(sleepStart - s.end) <= SETTLING_LINK_MS);

function countSleep(
  settlings: RegimeSourceSession[],
  start: number,
  end: number,
  awakeSince: number,
): CountedSleep {
  const settling = linkedSettling(settlings, start);
  const onset = settling
    ? Math.max(awakeSince, Math.min(start, (settling.start + settling.end) / 2))
    : start;
  return { start, onset, end };
}

function isCleanDay(day: CleanDay, sessions: RegimeSourceSession[]): boolean {
  const lengthMin = (day.bedStart - day.wake) / MINUTE_MS;
  if (lengthMin < MIN_DAY_LENGTH_MIN || lengthMin > MAX_DAY_LENGTH_MIN) return false;
  return coverage(sessions, day.wake, day.bedStart) >= MIN_DAY_COVERAGE;
}

function collectCleanDays(
  sessions: RegimeSourceSession[],
  settlings: RegimeSourceSession[],
  blocks: SleepBlock[],
  now: number,
): CleanDay[] {
  const days: CleanDay[] = [];
  let previous = findNight(blocks, localTime(now, -PERSONAL_REGIME_WINDOW_DAYS - 1, 0));
  for (let offset = -PERSONAL_REGIME_WINDOW_DAYS; offset <= -1; offset++) {
    const night = findNight(blocks, localTime(now, offset, 0));
    if (previous && night && night.first > previous.last) {
      const naps: CountedSleep[] = [];
      let awakeSince = previous.wake;
      for (const block of blocks.slice(previous.last + 1, night.first)) {
        naps.push(countSleep(settlings, block.start, block.end, awakeSince));
        awakeSince = block.end;
      }
      const day: CleanDay = {
        wake: previous.wake,
        naps,
        bedStart: night.bed,
        bedOnset: countSleep(settlings, night.bed, night.wake, awakeSince).onset,
      };
      if (isCleanDay(day, sessions)) days.push(day);
    }
    previous = night;
  }
  return days;
}

function settlingMinutes(
  settlings: RegimeSourceSession[],
  sleepStarts: number[],
): number | null {
  const durations = sleepStarts.flatMap((start) => {
    const linked = linkedSettling(settlings, start);
    return linked ? [(linked.end - linked.start) / MINUTE_MS] : [];
  });
  return durations.length >= MIN_SETTLING_SAMPLES ? roundMinutes(median(durations)) : null;
}

/** Keeps the naps in order, apart from each other and clear of bedtime. */
function layoutNaps(
  typicalNaps: { startMin: number; durationMin: number }[],
  wakeMin: number,
  bedMin: number,
): PersonalRegimeNap[] {
  const naps: PersonalRegimeNap[] = [];
  let earliestStart = wakeMin + MIN_PLAN_WAKE_WINDOW_MIN;
  for (const nap of typicalNaps) {
    const roundedStart = roundMinutes(nap.startMin);
    const startMin = Math.max(roundedStart, earliestStart);
    const endMin = Math.max(
      startMin + ROUND_MIN,
      roundMinutes(nap.startMin + nap.durationMin) + startMin - roundedStart,
    );
    if (endMin + MIN_PLAN_WAKE_WINDOW_MIN > bedMin) break;
    naps.push({ startMin, endMin });
    earliestStart = endMin + MIN_PLAN_WAKE_WINDOW_MIN;
  }
  return naps;
}

export function buildPersonalRegime(
  sessions: RegimeSourceSession[],
  now = Date.now(),
): PersonalRegimeResult {
  const records = trimAwakeBySleep(sessions);
  const settlings = records.filter(
    (s) => s.kind === 'settling' && s.end > s.start && s.end - s.start <= MAX_SETTLING_MS,
  );
  const blocks = sleepBlocks(records);
  const days = collectCleanDays(records, settlings, blocks, now);
  if (days.length < PERSONAL_REGIME_MIN_CLEAN_DAYS) {
    return { ok: false, reason: 'notEnoughData', cleanDays: days.length };
  }

  const wakeMin = roundMinutes(median(days.map((day) => minuteOfDay(day.wake))));
  const bedMin = roundMinutes(median(days.map((day) => eveningMinute(day.bedOnset))));
  const napCount = Math.round(median(days.map((day) => day.naps.length)));
  const typicalDays = days.filter((day) => day.naps.length === napCount);
  const napSource =
    typicalDays.length >= MIN_TYPICAL_DAYS
      ? typicalDays
      : days.filter((day) => day.naps.length >= napCount);
  const typicalNaps = Array.from({ length: napCount }, (_, index) => ({
    startMin: median(napSource.map((day) => minuteOfDay(day.naps[index].onset))),
    durationMin: median(napSource.map((day) => (day.naps[index].end - day.naps[index].onset) / MINUTE_MS)),
  }));

  return {
    ok: true,
    regime: {
      computedAt: now,
      basedOnDays: days.length,
      wakeMin,
      bedMin,
      naps: layoutNaps(typicalNaps, wakeMin, bedMin),
      napSettlingMin: settlingMinutes(settlings, days.flatMap((day) => day.naps.map((nap) => nap.start))),
      bedtimeSettlingMin: settlingMinutes(settlings, days.map((day) => day.bedStart)),
    },
  };
}

/** The schedule as blocks on one calendar day: last night's tail, the naps, tonight's start. */
export function regimeGhostSegments(regime: PersonalRegime): RegimeGhostSegment[] {
  const planned: { kind: RegimeGhostKind; startMin: number; endMin: number }[] = [];
  const addSleep = (startMin: number, endMin: number, settlingMin: number | null) => {
    if (settlingMin) planned.push({ kind: 'settling', startMin: startMin - settlingMin, endMin: startMin });
    planned.push({ kind: 'sleep', startMin, endMin });
  };
  addSleep(regime.bedMin - DAY_MINUTES, regime.wakeMin, regime.bedtimeSettlingMin);
  for (const nap of regime.naps) addSleep(nap.startMin, nap.endMin, regime.napSettlingMin);
  addSleep(regime.bedMin, regime.wakeMin + DAY_MINUTES, regime.bedtimeSettlingMin);

  const wrap = (minutes: number) => ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return planned
    .map((segment) => ({
      kind: segment.kind,
      startMin: Math.max(0, segment.startMin),
      endMin: Math.min(DAY_MINUTES, segment.endMin),
      plannedStartMin: wrap(segment.startMin),
      plannedEndMin: wrap(segment.endMin),
    }))
    .filter((segment) => segment.endMin > segment.startMin);
}

export function hasRegimeHistory(sessions: RegimeSourceSession[], now = Date.now()): boolean {
  const cutoff = now - PERSONAL_REGIME_MIN_HISTORY_DAYS * DAY_MS;
  return sessions.some((s) => s.kind === 'sleep' && s.start <= cutoff);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function isPersonalRegime(value: unknown): value is PersonalRegime {
  if (!value || typeof value !== 'object') return false;
  const regime = value as Partial<PersonalRegime>;
  return (
    isFiniteNumber(regime.computedAt) &&
    isFiniteNumber(regime.basedOnDays) &&
    isFiniteNumber(regime.wakeMin) &&
    isFiniteNumber(regime.bedMin) &&
    Array.isArray(regime.naps) &&
    regime.naps.every((nap) => !!nap && isFiniteNumber(nap.startMin) && isFiniteNumber(nap.endMin)) &&
    (regime.napSettlingMin === null || isFiniteNumber(regime.napSettlingMin)) &&
    (regime.bedtimeSettlingMin === null || isFiniteNumber(regime.bedtimeSettlingMin))
  );
}
