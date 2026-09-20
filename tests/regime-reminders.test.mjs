import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REGIME_REMINDER_LEAD_MIN,
  planRegimeReminders,
  regimeReminderTime,
} from '../src/lib/regime-reminders.ts';
import { regimeAdjustmentDayKey } from '../src/lib/personal-regime-adjustment.ts';

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

test('a reminder comes half an hour before every settling block', () => {
  assert.equal(REGIME_REMINDER_LEAD_MIN, 30);
  const plans = planRegimeReminders(regime, at(0, 6));
  // Settling starts at 08:30, 11:30, 15:30 and 20:30, so the day reads:
  assert.deepEqual(
    plans.map((plan) => regimeReminderTime(plan.settlingStartMin)),
    ['08:30', '11:30', '15:30', '20:30'],
  );
  assert.deepEqual(times(plans), times([
    { at: at(0, 8) },
    { at: at(0, 11) },
    { at: at(0, 15) },
    { at: at(0, 20) },
  ]));
});

test('the plan reaches into tomorrow and stops at the horizon', () => {
  const plans = planRegimeReminders(regime, at(0, 12));
  assert.deepEqual(times(plans), times([
    { at: at(0, 15) },
    { at: at(0, 20) },
    { at: at(1, 8) },
    { at: at(1, 11) },
  ]));
});

test('without a recorded settling the sleep itself gets the lead time', () => {
  const plans = planRegimeReminders(
    { ...regime, napSettlingMin: null, bedtimeSettlingMin: null },
    at(0, 6),
  );
  assert.deepEqual(
    plans.map((plan) => regimeReminderTime(plan.settlingStartMin)),
    ['09:00', '12:00', '16:00', '21:00'],
  );
  assert.deepEqual(times(plans), times([
    { at: at(0, 8, 30) },
    { at: at(0, 11, 30) },
    { at: at(0, 15, 30) },
    { at: at(0, 20, 30) },
  ]));
});

test('a bedtime past midnight keeps its own evening', () => {
  const plans = planRegimeReminders(
    { ...regime, naps: [], bedMin: 24 * 60 + 30, napSettlingMin: null },
    at(0, 12),
  );
  assert.deepEqual(times(plans), times([{ at: at(0, 23, 30) }]));
  assert.equal(regimeReminderTime(plans[0].settlingStartMin), '00:00');
});

test('nothing is planned for a schedule whose blocks have passed', () => {
  assert.deepEqual(planRegimeReminders({ ...regime, naps: [] }, at(0, 22), 60 * 60_000), []);
});

test('today reminders follow the adjusted plan while tomorrow stays unchanged', () => {
  const adjustment = {
    dayKey: regimeAdjustmentDayKey(at(0, 6)),
    anchors: [{ afterEndMin: 7 * 60, deltaMin: -60 }],
  };
  const plans = planRegimeReminders(regime, at(0, 6), 30 * 60 * 60_000, adjustment);

  assert.deepEqual(times(plans), times([
    { at: at(0, 7) },
    { at: at(0, 10) },
    { at: at(0, 14) },
    { at: at(0, 19) },
    { at: at(1, 8) },
    { at: at(1, 11) },
  ]));
  assert.deepEqual(
    plans.map((plan) => regimeReminderTime(plan.settlingStartMin)),
    ['07:30', '10:30', '14:30', '19:30', '08:30', '11:30'],
  );
});

test('an adjustment from another local day is ignored', () => {
  const plans = planRegimeReminders(regime, at(0, 6), 24 * 60 * 60_000, {
    dayKey: regimeAdjustmentDayKey(at(-1, 6)),
    anchors: [{ afterEndMin: 7 * 60, deltaMin: -60 }],
  });

  assert.equal(new Date(plans[0].at).getHours(), 8);
  assert.equal(regimeReminderTime(plans[0].settlingStartMin), '08:30');
});
