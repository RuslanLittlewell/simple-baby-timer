import type {
  PersonalRegime,
  RegimeGhostKind,
  RegimeGhostSegment,
} from './personal-regime';

const DAY_MINUTES = 24 * 60;
const MINUTE_MS = 60_000;
const DAY_MS = DAY_MINUTES * MINUTE_MS;

export interface RegimeAdjustmentAnchor {
  afterEndMin: number;
  deltaMin: number;
}

export interface DailyRegimeAdjustment {
  dayKey: string;
  anchors: RegimeAdjustmentAnchor[];
}

export interface CompletedSleep {
  start: number;
  end: number;
}

export interface EffectiveSleepWindow {
  baseStartMin: number;
  baseEndMin: number;
  startMin: number;
  endMin: number;
  settlingStartMin: number;
}

export function regimeAdjustmentDayKey(ms: number): string {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function isDailyRegimeAdjustment(value: unknown): value is DailyRegimeAdjustment {
  if (!value || typeof value !== 'object') return false;
  const adjustment = value as Partial<DailyRegimeAdjustment>;
  if (typeof adjustment.dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(adjustment.dayKey)) {
    return false;
  }
  if (!Array.isArray(adjustment.anchors)) return false;
  let previousEnd = -Infinity;
  return adjustment.anchors.every((anchor) => {
    if (!anchor || typeof anchor !== 'object') return false;
    const valid =
      isFiniteNumber(anchor.afterEndMin) &&
      anchor.afterEndMin >= 0 &&
      anchor.afterEndMin <= DAY_MINUTES * 2 &&
      anchor.afterEndMin > previousEnd &&
      isFiniteNumber(anchor.deltaMin) &&
      Math.abs(anchor.deltaMin) <= DAY_MINUTES;
    previousEnd = anchor.afterEndMin;
    return valid;
  });
}

export function regimeAdjustmentOffset(
  adjustment: DailyRegimeAdjustment | undefined,
  baseMinute: number,
): number {
  if (!adjustment) return 0;
  return adjustment.anchors.reduce(
    (total, anchor) => total + (anchor.afterEndMin <= baseMinute ? anchor.deltaMin : 0),
    0,
  );
}

function baseSleepWindows(regime: PersonalRegime) {
  return [
    {
      startMin: regime.bedMin - DAY_MINUTES,
      endMin: regime.wakeMin,
      settlingMin: regime.bedtimeSettlingMin,
    },
    ...regime.naps.map((nap) => ({
      startMin: nap.startMin,
      endMin: nap.endMin,
      settlingMin: regime.napSettlingMin,
    })),
    {
      startMin: regime.bedMin,
      endMin: regime.wakeMin + DAY_MINUTES,
      settlingMin: regime.bedtimeSettlingMin,
    },
  ];
}

export function effectiveRegimeSleepWindows(
  regime: PersonalRegime,
  adjustment?: DailyRegimeAdjustment,
): EffectiveSleepWindow[] {
  return baseSleepWindows(regime).map((window) => {
    const offset = regimeAdjustmentOffset(adjustment, window.startMin);
    return {
      baseStartMin: window.startMin,
      baseEndMin: window.endMin,
      startMin: window.startMin + offset,
      endMin: window.endMin + offset,
      settlingStartMin: window.startMin - (window.settlingMin ?? 0) + offset,
    };
  });
}

export function adjustmentAfterCompletedSleep(
  regime: PersonalRegime,
  current: DailyRegimeAdjustment | undefined,
  sleep: CompletedSleep,
): DailyRegimeAdjustment | null {
  if (!isFiniteNumber(sleep.start) || !isFiniteNumber(sleep.end) || sleep.end <= sleep.start) {
    return null;
  }

  const dayKey = regimeAdjustmentDayKey(sleep.end);
  const existing = current?.dayKey === dayKey ? current : undefined;
  const endDate = new Date(sleep.end);
  const baseDayNumber = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );
  const minuteRelativeToEndDay = (timestamp: number) => {
    const date = new Date(timestamp);
    const dayNumber = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOffset = Math.round((dayNumber - baseDayNumber) / DAY_MS);
    return (
      dayOffset * DAY_MINUTES +
      date.getHours() * 60 +
      date.getMinutes() +
      date.getSeconds() / 60 +
      date.getMilliseconds() / MINUTE_MS
    );
  };
  const actualStartMin = minuteRelativeToEndDay(sleep.start);
  const actualEndMin = minuteRelativeToEndDay(sleep.end);

  const match = effectiveRegimeSleepWindows(regime, existing)
    .map((window) => ({
      window,
      overlap: Math.min(actualEndMin, window.endMin) - Math.max(actualStartMin, window.startMin),
    }))
    .filter((candidate) => candidate.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)[0]?.window;
  if (!match) return null;

  const deltaMin = Math.round(actualEndMin - match.endMin);
  const anchors = (existing?.anchors ?? []).filter(
    (anchor) => anchor.afterEndMin !== match.baseEndMin,
  );
  if (deltaMin !== 0) anchors.push({ afterEndMin: match.baseEndMin, deltaMin });
  anchors.sort((a, b) => a.afterEndMin - b.afterEndMin);
  return { dayKey, anchors };
}

const wrapMinutes = (minutes: number) =>
  ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

export function adjustedRegimeGhostSegments(
  regime: PersonalRegime,
  adjustment?: DailyRegimeAdjustment,
): RegimeGhostSegment[] {
  const planned: { kind: RegimeGhostKind; startMin: number; endMin: number }[] = [];

  for (const window of effectiveRegimeSleepWindows(regime, adjustment)) {
    if (window.settlingStartMin < window.startMin) {
      planned.push({
        kind: 'settling',
        startMin: window.settlingStartMin,
        endMin: window.startMin,
      });
    }
    planned.push({ kind: 'sleep', startMin: window.startMin, endMin: window.endMin });
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
