/**
 * The notifications of the personal schedule: a nudge before every settling
 * block it plans, so the preparation starts on time instead of the sleep.
 */
import type { PersonalRegime } from './personal-regime';

/** How long before the settling block the reminder arrives. */
export const REGIME_REMINDER_LEAD_MIN = 30;

const MINUTE_MS = 60_000;
const DAY_MINUTES = 24 * 60;
const DAY_MS = DAY_MINUTES * MINUTE_MS;

export interface RegimeReminderPlan {
  /** When the notification fires. */
  at: number;
  /** Minutes after local midnight the settling block starts. */
  settlingStartMin: number;
}

const wrapMinutes = (minutes: number) => ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

/**
 * Where the preparation for each sleep begins. Without a recorded settling
 * the sleep is its own beginning, and the lead time still comes before it.
 */
function settlingStarts(regime: PersonalRegime): number[] {
  const naps = regime.naps.map((nap) => nap.startMin - (regime.napSettlingMin ?? 0));
  return [...naps, regime.bedMin - (regime.bedtimeSettlingMin ?? 0)];
}

const localMidnight = (now: number, dayOffset: number) => {
  const date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset).getTime();
};

/**
 * The reminders of the next `horizonMs`. Two days are laid out because a plan
 * made at noon reaches into tomorrow, and a bedtime can fall past midnight.
 */
export function planRegimeReminders(
  regime: PersonalRegime,
  now: number,
  horizonMs = DAY_MS,
): RegimeReminderPlan[] {
  const plans: RegimeReminderPlan[] = [];
  for (const dayOffset of [0, 1]) {
    const midnight = localMidnight(now, dayOffset);
    for (const settlingStartMin of settlingStarts(regime)) {
      const at = midnight + (settlingStartMin - REGIME_REMINDER_LEAD_MIN) * MINUTE_MS;
      if (at <= now || at > now + horizonMs) continue;
      plans.push({ at, settlingStartMin: wrapMinutes(settlingStartMin) });
    }
  }
  return plans.sort((a, b) => a.at - b.at);
}

/** The settling time as the notification spells it out. */
export function regimeReminderTime(settlingStartMin: number): string {
  const minutes = wrapMinutes(settlingStartMin);
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
}
