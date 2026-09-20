import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  adjustedRegimeGhostSegments,
  adjustmentAfterCompletedSleep,
  isDailyRegimeAdjustment,
  regimeAdjustmentDayKey,
  regimeAdjustmentOffset,
} from '../src/lib/personal-regime-adjustment.ts';

process.env.TZ = 'Europe/Berlin';

const at = (dayOffset, hours, minutes = 0) =>
  new Date(2026, 8, 16 + dayOffset, hours, minutes).getTime();

const regime = {
  computedAt: at(0, 0),
  basedOnDays: 30,
  wakeMin: 7 * 60,
  bedMin: 21 * 60,
  naps: [
    { startMin: 9 * 60, endMin: 10 * 60 },
    { startMin: 12 * 60, endMin: 14 * 60 },
    { startMin: 16 * 60, endMin: 17 * 60 },
  ],
  napSettlingMin: 20,
  bedtimeSettlingMin: 30,
};

test('an early morning wake-up shifts only later suggestions', () => {
  const adjustment = adjustmentAfterCompletedSleep(regime, undefined, {
    start: at(-1, 21),
    end: at(0, 6),
  });

  assert.deepEqual(adjustment, {
    dayKey: regimeAdjustmentDayKey(at(0, 6)),
    anchors: [{ afterEndMin: 7 * 60, deltaMin: -60 }],
  });
  assert.equal(regimeAdjustmentOffset(adjustment, 0), 0);
  assert.equal(regimeAdjustmentOffset(adjustment, 9 * 60), -60);

  const sleeps = adjustedRegimeGhostSegments(regime, adjustment).filter(
    (segment) => segment.kind === 'sleep',
  );
  assert.deepEqual(sleeps.slice(0, 3).map(({ startMin, endMin }) => [startMin, endMin]), [
    [0, 7 * 60],
    [8 * 60, 9 * 60],
    [11 * 60, 13 * 60],
  ]);
});

test('a late wake-up shifts later suggestions later', () => {
  const adjustment = adjustmentAfterCompletedSleep(regime, undefined, {
    start: at(0, 9),
    end: at(0, 10, 30),
  });

  assert.deepEqual(adjustment?.anchors, [{ afterEndMin: 10 * 60, deltaMin: 30 }]);
  assert.equal(regimeAdjustmentOffset(adjustment ?? undefined, 12 * 60), 30);
});

test('a later nap corrects only the plan that follows it', () => {
  const morning = adjustmentAfterCompletedSleep(regime, undefined, {
    start: at(-1, 21),
    end: at(0, 6),
  });
  const afterNap = adjustmentAfterCompletedSleep(regime, morning ?? undefined, {
    start: at(0, 8),
    end: at(0, 9, 30),
  });

  assert.deepEqual(afterNap?.anchors, [
    { afterEndMin: 7 * 60, deltaMin: -60 },
    { afterEndMin: 10 * 60, deltaMin: 30 },
  ]);
  assert.equal(regimeAdjustmentOffset(afterNap ?? undefined, 9 * 60), -60);
  assert.equal(regimeAdjustmentOffset(afterNap ?? undefined, 12 * 60), -30);
});

test('an unmatched sleep leaves the plan unchanged', () => {
  assert.equal(
    adjustmentAfterCompletedSleep(regime, undefined, {
      start: at(0, 10, 30),
      end: at(0, 11, 30),
    }),
    null,
  );
});

test('shifted ghost segments stay within the shown day', () => {
  const segments = adjustedRegimeGhostSegments(regime, {
    dayKey: regimeAdjustmentDayKey(at(0, 6)),
    anchors: [{ afterEndMin: 7 * 60, deltaMin: -10 * 60 }],
  });

  assert.ok(segments.every((segment) => segment.startMin >= 0));
  assert.ok(segments.every((segment) => segment.endMin <= 24 * 60));
  assert.ok(segments.every((segment) => segment.endMin > segment.startMin));
});

test('the next local day replaces rather than inherits the previous adjustment', () => {
  const yesterday = {
    dayKey: regimeAdjustmentDayKey(at(0, 6)),
    anchors: [{ afterEndMin: 7 * 60, deltaMin: -60 }],
  };
  const today = adjustmentAfterCompletedSleep(regime, yesterday, {
    start: at(0, 21),
    end: at(1, 7, 30),
  });

  assert.deepEqual(today, {
    dayKey: regimeAdjustmentDayKey(at(1, 7, 30)),
    anchors: [{ afterEndMin: 7 * 60, deltaMin: 30 }],
  });
});

test('wake-up differences use local clock minutes across a daylight-saving change', () => {
  const dstRegime = { ...regime, computedAt: new Date(2026, 2, 29).getTime() };
  const adjustment = adjustmentAfterCompletedSleep(dstRegime, undefined, {
    start: new Date(2026, 2, 28, 21).getTime(),
    end: new Date(2026, 2, 29, 6).getTime(),
  });

  assert.deepEqual(adjustment?.anchors, [{ afterEndMin: 7 * 60, deltaMin: -60 }]);
});

test('persisted adjustment validation rejects malformed and unordered anchors', () => {
  assert.equal(isDailyRegimeAdjustment({ dayKey: '2026-09-16', anchors: [] }), true);
  assert.equal(isDailyRegimeAdjustment({ dayKey: '16-09-2026', anchors: [] }), false);
  assert.equal(
    isDailyRegimeAdjustment({
      dayKey: '2026-09-16',
      anchors: [
        { afterEndMin: 600, deltaMin: 30 },
        { afterEndMin: 420, deltaMin: -60 },
      ],
    }),
    false,
  );
});

test('personal regime persistence sanitizes daily adjustments', () => {
  const source = readFileSync(
    new URL('../src/state/personal-regime-state.ts', import.meta.url),
    'utf8',
  );

  assert.match(source, /isDailyRegimeAdjustment\(entry\[1\]\)/);
  assert.match(source, /version: 2/);
  assert.match(source, /migrate: \(persisted\) => persisted/);
  assert.match(source, /dailyAdjustments/);
});

test('Calendar limits the adjustment to the selected child and shown local day', () => {
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

  assert.match(screenSource, /state\.dailyAdjustments\[activeChildId\]/);
  assert.match(screenSource, /adjustment=\{regimeAdjustment\}/);
  assert.match(ghostSource, /adjustment\?\.dayKey === regimeAdjustmentDayKey\(shownDay\.getTime\(\)\)/);
  assert.match(ghostSource, /adjustedRegimeGhostSegments\(regime, shownDayAdjustment\)/);
});
