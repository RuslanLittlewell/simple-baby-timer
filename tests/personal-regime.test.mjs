import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PERSONAL_REGIME_MIN_CLEAN_DAYS,
  PERSONAL_REGIME_WINDOW_DAYS,
  buildPersonalRegime,
  hasRegimeHistory,
  isPersonalRegime,
} from '../src/lib/personal-regime.ts';
import { planRegimeDay, regimeGhostSegments } from '../src/lib/personal-regime-adjustment.ts';

process.env.TZ = 'Europe/Berlin';

const NOW = new Date(2026, 8, 12, 12, 0).getTime();
// A week more than the window, so every analysed day has the night before it.
const FULL_HISTORY_DAYS = PERSONAL_REGIME_WINDOW_DAYS + 7;
const at = (dayOffset, hours, minutes = 0) =>
  new Date(2026, 8, 12 + dayOffset, hours, minutes).getTime();
const entry = (kind, day, from, to, toDay = day) => ({
  kind,
  start: at(day, ...from),
  end: at(toDay, ...to),
});

/** A day of four naps that starts at 07:00 and ends with sleep at 21:00 that night. */
function regularDay(day) {
  return [
    entry('awake', day, [7, 0], [8, 30]),
    entry('settling', day, [8, 30], [9, 0]),
    entry('sleep', day, [9, 0], [10, 0]),
    entry('awake', day, [10, 0], [11, 30]),
    entry('settling', day, [11, 30], [12, 0]),
    entry('sleep', day, [12, 0], [14, 0]),
    entry('awake', day, [14, 0], [15, 30]),
    entry('settling', day, [15, 30], [16, 0]),
    entry('sleep', day, [16, 0], [16, 45]),
    entry('awake', day, [16, 45], [17, 40]),
    entry('settling', day, [17, 40], [18, 0]),
    entry('sleep', day, [18, 0], [18, 30]),
    entry('awake', day, [18, 30], [20, 30]),
    entry('settling', day, [20, 30], [21, 0]),
    entry('sleep', day, [21, 0], [2, 0], day + 1),
    entry('sleep', day + 1, [2, 30], [7, 0]),
  ];
}

const days = (from, to, build = regularDay) => {
  const sessions = [];
  for (let day = from; day <= to; day++) sessions.push(...build(day));
  return sessions;
};

test('regular days become their own schedule', () => {
  const result = buildPersonalRegime(days(-FULL_HISTORY_DAYS, -1), NOW);
  assert.equal(result.ok, true);
  assert.deepEqual(result.regime, {
    computedAt: NOW,
    basedOnDays: PERSONAL_REGIME_WINDOW_DAYS,
    wakeMin: 7 * 60,
    bedMin: 20 * 60 + 45,
    naps: [
      { startMin: 8 * 60 + 45, endMin: 10 * 60 },
      { startMin: 11 * 60 + 45, endMin: 14 * 60 },
      { startMin: 15 * 60 + 45, endMin: 16 * 60 + 45 },
      { startMin: 17 * 60 + 50, endMin: 18 * 60 + 30 },
    ],
    napSettlingMin: 30,
    bedtimeSettlingMin: 30,
  });
});

test('settling counts half as awake and half as sleep', () => {
  // Settling 08:30–09:00 before a 09:00–10:00 sleep: the sleep is counted from 08:45.
  const { regime } = buildPersonalRegime(days(-FULL_HISTORY_DAYS, -1), NOW);
  assert.deepEqual(regime.naps[0], { startMin: 8 * 60 + 45, endMin: 10 * 60 });
  // Settling 20:30–21:00 before the night: bedtime is counted from 20:45.
  assert.equal(regime.bedMin, 20 * 60 + 45);
});

test('a night feed does not split the night and an evening catnap stays a nap', () => {
  const result = buildPersonalRegime(days(-FULL_HISTORY_DAYS, -1), NOW);
  assert.equal(result.regime.bedMin, 20 * 60 + 45);
  assert.equal(result.regime.naps.at(-1).startMin, 17 * 60 + 50);
});

test('awake left running through sleeps is cut around them and the day is kept', () => {
  const sessions = days(-FULL_HISTORY_DAYS, -1, (day) =>
    day >= -10 && day <= -5
      ? [...regularDay(day), entry('awake', day, [8, 0], [23, 0])]
      : regularDay(day),
  );
  const result = buildPersonalRegime(sessions, NOW);
  assert.deepEqual(result, buildPersonalRegime(days(-FULL_HISTORY_DAYS, -1), NOW));
});

test('wake windows come from the gaps the child had, not from clock medians', () => {
  // The second nap starts at 11, 12 or 13 and lasts 30, 150 or 90 minutes,
  // but the third always follows it after 90 minutes awake. Medians of clock
  // times would put a 150-minute gap before the third nap.
  const secondNaps = [
    [[11, 0], [11, 30], [13, 0], [14, 0]],
    [[12, 0], [14, 30], [16, 0], [17, 0]],
    [[13, 0], [14, 30], [16, 0], [17, 0]],
  ];
  const varyingDay = (day) => {
    const [napStart, napEnd, lastStart, lastEnd] = secondNaps[((day % 3) + 3) % 3];
    return [
      entry('awake', day, [7, 0], [9, 0]),
      entry('sleep', day, [9, 0], [10, 0]),
      entry('awake', day, [10, 0], napStart),
      entry('sleep', day, napStart, napEnd),
      entry('awake', day, napEnd, lastStart),
      entry('sleep', day, lastStart, lastEnd),
      entry('awake', day, lastEnd, [19, 0]),
      entry('sleep', day, [19, 0], [7, 0], day + 1),
    ];
  };
  const { regime } = buildPersonalRegime(days(-FULL_HISTORY_DAYS, -1, varyingDay), NOW);

  // Wake windows of 120, 120, 90 and 120 minutes, stretched evenly from the
  // 07:00 wake-up to the 19:00 bedtime.
  assert.deepEqual(regime.naps, [
    { startMin: 9 * 60 + 15, endMin: 10 * 60 + 15 },
    { startMin: 12 * 60 + 30, endMin: 14 * 60 },
    { startMin: 15 * 60 + 40, endMin: 16 * 60 + 40 },
  ]);
  assert.equal(regime.bedMin, 19 * 60);
});

test('days without their naps logged are left out', () => {
  const sessions = days(-FULL_HISTORY_DAYS, -1, (day) =>
    day >= -10 && day <= -5
      ? regularDay(day).filter((s) => s.kind === 'awake' || s.start >= at(day, 20, 30))
      : regularDay(day),
  );
  const result = buildPersonalRegime(sessions, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.regime.basedOnDays, PERSONAL_REGIME_WINDOW_DAYS - 6);
});

test('a logged day the child could not fall asleep for hours is kept', () => {
  // The midday nap never happens: awake from 10:00 until settling at 15:30.
  const sessions = days(-FULL_HISTORY_DAYS, -1, (day) =>
    day >= -10 && day <= -5
      ? [
          ...regularDay(day).filter((s) => s.start < at(day, 10) || s.start >= at(day, 15, 30)),
          entry('awake', day, [10, 0], [15, 30]),
        ]
      : regularDay(day),
  );
  const result = buildPersonalRegime(sessions, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.regime.basedOnDays, PERSONAL_REGIME_WINDOW_DAYS);
});

test('too few clean days is reported instead of a schedule', () => {
  const result = buildPersonalRegime(days(-6, -1), NOW);
  assert.deepEqual(result, { ok: false, reason: 'notEnoughData', cleanDays: 5 });
  assert.ok(result.cleanDays < PERSONAL_REGIME_MIN_CLEAN_DAYS);
});

test('a bedtime after midnight is kept past the end of the day', () => {
  const lateDay = (day) => [
    ...regularDay(day).filter((s) => s.start < at(day, 20, 30)),
    entry('sleep', day, [21, 0], [21, 30]),
    entry('awake', day, [21, 30], [0, 0], day + 1),
    entry('settling', day + 1, [0, 0], [0, 30]),
    entry('sleep', day + 1, [0, 30], [7, 0]),
  ];
  const result = buildPersonalRegime(days(-FULL_HISTORY_DAYS, -1, lateDay), NOW);
  assert.equal(result.ok, true);
  assert.equal(result.regime.bedMin, 24 * 60 + 15);
  assert.equal(result.regime.naps.length, 5);

  const segments = regimeGhostSegments(planRegimeDay(result.regime));
  assert.deepEqual(segments.slice(0, 2), [
    { kind: 'settling', startMin: 0, endMin: 15, plannedStartMin: 24 * 60 - 15, plannedEndMin: 15 },
    { kind: 'sleep', startMin: 15, endMin: 7 * 60, plannedStartMin: 15, plannedEndMin: 7 * 60 },
  ]);
  assert.ok(segments.every((s) => s.endMin <= 24 * 60));
});

test('history qualifies only once sleep was logged three weeks ago', () => {
  assert.equal(hasRegimeHistory(days(-20, -1), NOW), false);
  assert.equal(hasRegimeHistory(days(-22, -1), NOW), true);
  assert.equal(hasRegimeHistory([entry('awake', -40, [8, 0], [9, 0])], NOW), false);
});

test('stored schedules are validated before use', () => {
  const { regime } = buildPersonalRegime(days(-FULL_HISTORY_DAYS, -1), NOW);
  assert.equal(isPersonalRegime(regime), true);
  assert.equal(isPersonalRegime(null), false);
  assert.equal(isPersonalRegime({ ...regime, naps: [{ startMin: '09:00' }] }), false);
  assert.equal(isPersonalRegime({ ...regime, bedtimeSettlingMin: undefined }), false);
});
