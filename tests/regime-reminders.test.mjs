import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REGIME_DEFAULT_PREPARATION_MIN,
  planRegimeReminders,
  regimeReminderTime,
} from '../src/lib/regime-reminders.ts';
import {
  planRegimeDay,
  regimeAdjustmentDayKey,
  regimeGhostSegments,
} from '../src/lib/personal-regime-adjustment.ts';

process.env.TZ = 'Europe/Berlin';

const at = (dayOffset, hours, minutes = 0) =>
  new Date(2026, 8, 16 + dayOffset, hours, minutes).getTime();

/** Naps at 09:00, 12:00 and 16:00, night at 21:00, half an hour of settling. */
const regime = {
  computedAt: at(0, 0),
  basedOnDays: 30,
  wakeMin: 7 * 60,
  bedMin: 21 * 60,
  naps: [
    { startMin: 9 * 60, endMin: 10 * 60 },
    { startMin: 12 * 60, endMin: 14 * 60 },
    { startMin: 16 * 60, endMin: 16 * 60 + 45 },
  ],
  napSettlingMin: 30,
  bedtimeSettlingMin: 30,
};

const times = (plans) => plans.map((plan) => new Date(plan.at).toISOString());
const sleepTimes = (plans) => plans.map((plan) => regimeReminderTime(plan.sleepStartMin));

test('a reminder comes exactly when the sleep preparation begins', () => {
  const plans = planRegimeReminders(regime, at(0, 6));
  assert.deepEqual(times(plans), times([
    { at: at(0, 8, 30) },
    { at: at(0, 11, 30) },
    { at: at(0, 15, 30) },
    { at: at(0, 20, 30) },
  ]));
  assert.deepEqual(sleepTimes(plans), ['09:00', '12:00', '16:00', '21:00']);
});

test('reminders fire at the start of the preparation blocks the calendar shows', () => {
  const progress = {
    dayKey: regimeAdjustmentDayKey(at(0, 6)),
    awakeSinceMin: 6 * 60,
    napsTaken: 0,
    asleepSinceMin: null,
  };
  const preparationStarts = regimeGhostSegments(planRegimeDay(regime, progress))
    .filter((segment) => segment.kind === 'settling' && segment.startMin > progress.awakeSinceMin)
    .map((segment) => at(0, 0, segment.startMin));
  const plans = planRegimeReminders(regime, at(0, 6), 17 * 60 * 60_000, progress);

  assert.equal(plans.length, 4);
  assert.deepEqual(times(plans), times(preparationStarts.map((start) => ({ at: start }))));
});

test('the plan reaches into tomorrow and stops at the horizon', () => {
  const plans = planRegimeReminders(regime, at(0, 12));
  assert.deepEqual(times(plans), times([
    { at: at(0, 15, 30) },
    { at: at(0, 20, 30) },
    { at: at(1, 8, 30) },
    { at: at(1, 11, 30) },
  ]));
});

test('without a recorded settling the preparation is counted back from the sleep', () => {
  assert.equal(REGIME_DEFAULT_PREPARATION_MIN, 30);
  const plans = planRegimeReminders(
    { ...regime, napSettlingMin: null, bedtimeSettlingMin: null },
    at(0, 6),
  );
  assert.deepEqual(times(plans), times([
    { at: at(0, 8, 30) },
    { at: at(0, 11, 30) },
    { at: at(0, 15, 30) },
    { at: at(0, 20, 30) },
  ]));
  assert.deepEqual(sleepTimes(plans), ['09:00', '12:00', '16:00', '21:00']);
});

test('a longer settling moves the reminder earlier by the same amount', () => {
  const plans = planRegimeReminders(
    { ...regime, naps: [], bedtimeSettlingMin: 50 },
    at(0, 12),
  );
  assert.deepEqual(times(plans), times([{ at: at(0, 20, 10) }]));
  assert.deepEqual(sleepTimes(plans), ['21:00']);
});

test('a bedtime past midnight is reminded when its preparation begins', () => {
  const plans = planRegimeReminders(
    { ...regime, naps: [], bedMin: 24 * 60 + 30, napSettlingMin: null },
    at(0, 12),
  );
  assert.deepEqual(times(plans), times([{ at: at(1, 0) }]));
  assert.deepEqual(sleepTimes(plans), ['00:30']);
});

test('nothing is planned for a schedule whose blocks have passed', () => {
  assert.deepEqual(planRegimeReminders({ ...regime, naps: [] }, at(0, 22), 60 * 60_000), []);
});

test('today reminders follow the re-planned day while tomorrow stays unchanged', () => {
  // Up at 06:00 instead of 07:00: the first nap comes two hours later as
  // usual, the later wake windows stretch to keep the 21:00 night.
  const progress = {
    dayKey: regimeAdjustmentDayKey(at(0, 6)),
    awakeSinceMin: 6 * 60,
    napsTaken: 0,
    asleepSinceMin: null,
  };
  const plans = planRegimeReminders(regime, at(0, 6), 30 * 60 * 60_000, progress);

  assert.deepEqual(times(plans), times([
    { at: at(0, 7, 30) },
    { at: at(0, 10, 45) },
    { at: at(0, 15) },
    { at: at(0, 20, 30) },
    { at: at(1, 8, 30) },
    { at: at(1, 11, 30) },
  ]));
  assert.deepEqual(sleepTimes(plans), ['08:00', '11:15', '15:30', '21:00', '09:00', '12:00']);
});

test('no reminder is planned for a nap that is already running', () => {
  const plans = planRegimeReminders(regime, at(0, 9, 30), 24 * 60 * 60_000, {
    dayKey: regimeAdjustmentDayKey(at(0, 9, 30)),
    awakeSinceMin: 7 * 60,
    napsTaken: 0,
    asleepSinceMin: 9 * 60,
  });

  assert.deepEqual(times(plans.slice(0, 1)), times([{ at: at(0, 11, 30) }]));
  assert.equal(regimeReminderTime(plans[0].sleepStartMin), '12:00');
});

test('progress from another local day is ignored', () => {
  const plans = planRegimeReminders(regime, at(0, 6), 24 * 60 * 60_000, {
    dayKey: regimeAdjustmentDayKey(at(-1, 6)),
    awakeSinceMin: 6 * 60,
    napsTaken: 0,
    asleepSinceMin: null,
  });

  assert.deepEqual(times(plans.slice(0, 1)), times([{ at: at(0, 8, 30) }]));
  assert.equal(regimeReminderTime(plans[0].sleepStartMin), '09:00');
});
