import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  isRegimeDayProgress,
  mergeSleepFragments,
  planRegimeDay,
  regimeAdjustmentDayKey,
  regimeDayProgress,
  regimeGhostSegments,
} from '../src/lib/personal-regime-adjustment.ts';

process.env.TZ = 'Europe/Berlin';

const at = (dayOffset, hours, minutes = 0) =>
  new Date(2026, 8, 16 + dayOffset, hours, minutes).getTime();
const hm = (hours, minutes = 0) => hours * 60 + minutes;

/** Two hours awake before every sleep: naps at 09:00, 12:00 and 15:30, the night at 18:30. */
const regime = {
  computedAt: at(0, 0),
  basedOnDays: 30,
  wakeMin: hm(7),
  bedMin: hm(18, 30),
  naps: [
    { startMin: hm(9), endMin: hm(10) },
    { startMin: hm(12), endMin: hm(13, 30) },
    { startMin: hm(15, 30), endMin: hm(16, 30) },
  ],
  napSettlingMin: 20,
  bedtimeSettlingMin: 30,
};

const progress = (fields) => ({
  dayKey: regimeAdjustmentDayKey(at(0, 12)),
  awakeSinceMin: null,
  napsTaken: 0,
  asleepSinceMin: null,
  ...fields,
});
const spans = (sleeps) => sleeps.map(({ startMin, endMin }) => [startMin, endMin]);

test('before the child is up the learned schedule stands', () => {
  const night = { start: at(-1, 19), end: null };
  const before = regimeDayProgress([night], at(0, 5));
  assert.equal(before.awakeSinceMin, null);

  const plan = planRegimeDay(regime, before);
  assert.deepEqual(plan, planRegimeDay(regime));
  assert.deepEqual(spans([plan.lastNight]), [[hm(18, 30) - 24 * 60, hm(7)]]);
  assert.deepEqual(spans(plan.naps), regime.naps.map((nap) => [nap.startMin, nap.endMin]));
  assert.deepEqual(plan.naps.map((nap) => nap.settlingStartMin), [hm(8, 40), hm(11, 40), hm(15, 10)]);
});

test('an early wake-up brings the first nap forward and keeps bedtime', () => {
  const plan = planRegimeDay(regime, progress({ awakeSinceMin: hm(6) }));

  assert.equal(plan.lastNight, null);
  // The wake window the child is in keeps its two hours; the later ones
  // stretch so the night still starts at 18:30.
  assert.deepEqual(spans(plan.naps), [
    [hm(8), hm(9)],
    [hm(11, 20), hm(12, 50)],
    [hm(15, 10), hm(16, 10)],
  ]);
  assert.equal(plan.tonight.startMin, hm(18, 30));
});

test('a nap taken long before its suggestion re-plans the day from its end', () => {
  // Up at 06:00 and asleep again at 06:50, an hour before the 08:00 suggestion.
  const today = regimeDayProgress(
    [
      { start: at(-1, 19), end: at(0, 6) },
      { start: at(0, 6, 50), end: at(0, 7, 45) },
    ],
    at(0, 8),
  );
  assert.deepEqual(today, progress({ awakeSinceMin: hm(7, 45), napsTaken: 1 }));

  const plan = planRegimeDay(regime, today);
  // Two hours awake from the actual wake-up, and an extra nap so the long
  // afternoon does not end in a three-hour wake window.
  assert.deepEqual(spans(plan.naps), [
    [hm(9, 45), hm(11, 15)],
    [hm(13), hm(14)],
    [hm(15, 45), hm(16, 45)],
  ]);
  assert.equal(plan.tonight.startMin, hm(18, 30));

  const segments = regimeGhostSegments(plan);
  assert.ok(segments.every((segment) => segment.startMin >= hm(7, 45)));
  let awakeFrom = hm(7, 45);
  for (const sleep of [...plan.naps, plan.tonight]) {
    assert.ok(sleep.settlingStartMin - awakeFrom >= 30, `awake at least 30 minutes before ${sleep.startMin}`);
    awakeFrom = sleep.endMin;
  }
});

test('a late wake-up keeps its wake window and drops nothing it can fit', () => {
  const plan = planRegimeDay(regime, progress({ awakeSinceMin: hm(8) }));

  assert.equal(plan.naps[0].startMin, hm(10));
  assert.equal(plan.naps.length, 3);
  assert.equal(plan.tonight.startMin, hm(18, 30));
});

test('a running nap is expected to last as long as usual', () => {
  const plan = planRegimeDay(
    regime,
    progress({ awakeSinceMin: hm(10), napsTaken: 1, asleepSinceMin: hm(12, 10) }),
  );

  assert.deepEqual(plan.naps, [
    { startMin: hm(12, 10), endMin: hm(13, 40), settlingStartMin: hm(12, 10) },
    { startMin: hm(15, 40), endMin: hm(16, 40), settlingStartMin: hm(15, 20) },
  ]);
  assert.equal(plan.tonight.startMin, hm(18, 30));
});

test('a sleep running nearer to bedtime than to a nap is the night', () => {
  const plan = planRegimeDay(
    regime,
    progress({ awakeSinceMin: hm(16, 30), napsTaken: 3, asleepSinceMin: hm(18, 20) }),
  );

  assert.deepEqual(plan, {
    lastNight: null,
    naps: [],
    tonight: { startMin: hm(18, 20), endMin: hm(31), settlingStartMin: hm(18, 20) },
  });
});

test('the day is read off its sleeps: the night across a feed, naps and a running sleep', () => {
  const sleeps = [
    { start: at(-1, 20), end: at(0, 2) },
    { start: at(0, 2, 20), end: at(0, 6) },
    { start: at(0, 9), end: at(0, 10) },
    // A short break inside a nap does not end it.
    { start: at(0, 12), end: at(0, 12, 30) },
    { start: at(0, 12, 40), end: at(0, 13, 30) },
    { start: at(0, 15), end: null },
  ];

  assert.deepEqual(regimeDayProgress(sleeps.slice(0, 2), at(0, 7)), progress({ awakeSinceMin: hm(6) }));
  assert.deepEqual(
    regimeDayProgress(sleeps, at(0, 15, 30)),
    progress({ awakeSinceMin: hm(13, 30), napsTaken: 2, asleepSinceMin: hm(15) }),
  );
});

test('a nap resumed after a short break is still running, not a new wake-up', () => {
  const night = { start: at(-1, 20), end: at(0, 7) };
  const firstPart = { start: at(0, 12), end: at(0, 13) };

  assert.deepEqual(
    regimeDayProgress([night, firstPart], at(0, 13, 5)),
    progress({ awakeSinceMin: hm(13), napsTaken: 1 }),
  );
  assert.deepEqual(
    regimeDayProgress([night, firstPart, { start: at(0, 13, 10), end: null }], at(0, 13, 20)),
    progress({ awakeSinceMin: hm(7), asleepSinceMin: hm(12) }),
  );
});

test('without a recorded night the naps still re-plan the day', () => {
  assert.deepEqual(
    regimeDayProgress([{ start: at(0, 9), end: at(0, 10) }], at(0, 11)),
    progress({ awakeSinceMin: hm(10), napsTaken: 1 }),
  );
  assert.deepEqual(regimeDayProgress([], at(0, 11)), progress({}));
});

test('wake-up minutes use the local clock across a daylight-saving change', () => {
  const today = regimeDayProgress(
    [{ start: new Date(2026, 2, 28, 21).getTime(), end: new Date(2026, 2, 29, 6).getTime() }],
    new Date(2026, 2, 29, 7).getTime(),
  );
  assert.equal(today.awakeSinceMin, hm(6));
});

test('ghost segments stay within the shown day', () => {
  for (const plan of [
    planRegimeDay(regime),
    planRegimeDay(regime, progress({ awakeSinceMin: hm(4) })),
    planRegimeDay(regime, progress({ awakeSinceMin: hm(23), napsTaken: 3 })),
  ]) {
    const segments = regimeGhostSegments(plan);
    assert.ok(segments.every((segment) => segment.startMin >= 0));
    assert.ok(segments.every((segment) => segment.endMin <= 24 * 60));
    assert.ok(segments.every((segment) => segment.endMin > segment.startMin));
  }
});

test('ghost segments clip last and next night to the shown day', () => {
  const segments = regimeGhostSegments(
    planRegimeDay({
      computedAt: at(0, 0),
      basedOnDays: 10,
      wakeMin: 7 * 60,
      bedMin: 21 * 60,
      naps: [{ startMin: 9 * 60, endMin: 10 * 60 }],
      napSettlingMin: 20,
      bedtimeSettlingMin: 30,
    }),
  );
  assert.deepEqual(segments, [
    { kind: 'sleep', startMin: 0, endMin: 420, plannedStartMin: 1260, plannedEndMin: 420 },
    { kind: 'settling', startMin: 520, endMin: 540, plannedStartMin: 520, plannedEndMin: 540 },
    { kind: 'sleep', startMin: 540, endMin: 600, plannedStartMin: 540, plannedEndMin: 600 },
    { kind: 'settling', startMin: 1230, endMin: 1260, plannedStartMin: 1230, plannedEndMin: 1260 },
    { kind: 'sleep', startMin: 1260, endMin: 1440, plannedStartMin: 1260, plannedEndMin: 420 },
  ]);
});

test('persisted progress validation rejects malformed records', () => {
  assert.equal(isRegimeDayProgress(progress({})), true);
  assert.equal(isRegimeDayProgress(progress({ awakeSinceMin: hm(7), napsTaken: 2 })), true);
  assert.equal(isRegimeDayProgress({ ...progress({}), dayKey: '16-09-2026' }), false);
  assert.equal(isRegimeDayProgress(progress({ napsTaken: 1.5 })), false);
  assert.equal(isRegimeDayProgress(progress({ awakeSinceMin: -5 })), false);
  // A day adjustment of an earlier version.
  assert.equal(isRegimeDayProgress({ dayKey: '2026-09-16', anchors: [] }), false);
});

test('personal regime persistence sanitizes the day progress', () => {
  const source = readFileSync(
    new URL('../src/state/personal-regime-state.ts', import.meta.url),
    'utf8',
  );

  assert.match(source, /isRegimeDayProgress\(entry\[1\]\)/);
  assert.match(source, /dayProgress/);
  assert.doesNotMatch(source, /dailyAdjustments/);
});

test('Calendar limits the progress to the selected child and shown local day', () => {
  const screenSource = readFileSync(
    new URL('../src/features/calendar/calendar-screen.tsx', import.meta.url),
    'utf8',
  );
  const ghostSource = readFileSync(
    new URL(
      '../src/features/calendar/components/regime-ghost-blocks.tsx',
      import.meta.url,
    ),
    'utf8',
  );

  assert.match(screenSource, /state\.dayProgress\[activeChildId\]/);
  assert.match(screenSource, /progress=\{regimeDayProgress\}/);
  assert.match(ghostSource, /progress\?\.dayKey === regimeAdjustmentDayKey\(shownDay\.getTime\(\)\)/);
  assert.match(ghostSource, /regimeGhostSegments\(planRegimeDay\(regime, shownDayProgress\)\)/);
});

test('sleeps split by a short break merge into one, longer breaks do not', () => {
  assert.deepEqual(
    mergeSleepFragments([
      { start: at(0, 12, 20), end: at(0, 13) },
      { start: at(0, 12), end: at(0, 12, 10) },
      { start: at(0, 16), end: at(0, 17) },
    ]),
    [
      { start: at(0, 12), end: at(0, 13) },
      { start: at(0, 16), end: at(0, 17) },
    ],
  );
  assert.deepEqual(
    mergeSleepFragments([
      { start: at(0, 12), end: at(0, 13) },
      { start: at(0, 13, 15), end: null },
    ]),
    [{ start: at(0, 12), end: null }],
  );
});
