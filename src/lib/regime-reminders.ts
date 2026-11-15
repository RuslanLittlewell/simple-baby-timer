/**
 * The notifications of the personal schedule: a nudge the moment every sleep
 * preparation it plans begins, so the preparation starts on time instead of
 * the sleep.
 */
import type { PersonalRegime } from './personal-regime';
import { planRegimeDay, type RegimeDayProgress } from './personal-regime-adjustment.ts';

/** How long the preparation lasts for a sleep with no recorded settling. */
export const REGIME_DEFAULT_PREPARATION_MIN = 30;

const MINUTE_MS = 60_000;
const DAY_MINUTES = 24 * 60;
const DAY_MS = DAY_MINUTES * MINUTE_MS;

export interface RegimeReminderPlan {
  /** When the notification fires: the start of the sleep preparation. */
  at: number;
  /** Minutes after local midnight the sleep itself is planned. */
  sleepStartMin: number;
}

const wrapMinutes = (minutes: number) => ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

/**
 * Each sleep and where its preparation begins: the start of the "Sleep
 * preparation" block the calendar draws, or a default stretch before the
 * sleep when no settling has been recorded and the calendar draws none.
 */
const sleepPreparations = (
  regime: PersonalRegime,
  adjustment?: DailyRegimeAdjustment,
) => {
  const preparation = (baseStartMin: number, settlingMin: number | null) => {
    const sleepStartMin = baseStartMin + adjustmentOffset(adjustment, baseStartMin);
    return {
      sleepStartMin,
      preparationStartMin: sleepStartMin - (settlingMin || REGIME_DEFAULT_PREPARATION_MIN),
    };
  };
  return [
    ...regime.naps.map((nap) => preparation(nap.startMin, regime.napSettlingMin)),
    preparation(regime.bedMin, regime.bedtimeSettlingMin),
  ];
};

const localMidnight = (now: number, dayOffset: number) => {
  const date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset).getTime();
};

const localDayKey = (ms: number) => {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * The reminders of the next `horizonMs`. Two days are laid out because a plan
 * made at noon reaches into tomorrow, and a bedtime can fall past midnight.
 */
export function planRegimeReminders(
  regime: PersonalRegime,
  now: number,
  horizonMs = DAY_MS,
  progress?: RegimeDayProgress,
): RegimeReminderPlan[] {
  const plans: RegimeReminderPlan[] = [];
  for (const dayOffset of [0, 1]) {
    const midnight = localMidnight(now, dayOffset);
    const dayAdjustment =
      dayOffset === 0 && adjustment?.dayKey === localDayKey(now)
        ? adjustment
        : undefined;
    for (const { sleepStartMin, preparationStartMin } of sleepPreparations(regime, dayAdjustment)) {
      const at = midnight + preparationStartMin * MINUTE_MS;
      if (at <= now || at > now + horizonMs) continue;
      plans.push({ at, sleepStartMin: wrapMinutes(sleepStartMin) });
    }
  }
  return plans.sort((a, b) => a.at - b.at);
}

/** A planned time of day as the notification spells it out. */
export function regimeReminderTime(minutesAfterMidnight: number): string {
  const minutes = wrapMinutes(minutesAfterMidnight);
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
}
