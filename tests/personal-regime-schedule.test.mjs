import assert from 'node:assert/strict';
import test from 'node:test';

import {
  childrenDueForRegimeRun,
  localDayKey,
  msUntilNextLocalMidnight,
} from '../src/lib/personal-regime-schedule.ts';

process.env.TZ = 'Europe/Berlin';

const HOUR_MS = 3_600_000;
/** The run lands just inside the new day, never a hair before it. */
const GUARD_MS = 1_000;
const at = (year, month, day, hours = 0, minutes = 0, seconds = 0) =>
  new Date(year, month - 1, day, hours, minutes, seconds).getTime();

test('the day key names the local calendar day', () => {
  assert.equal(localDayKey(at(2026, 9, 16, 23, 59, 59)), '2026-09-16');
  assert.equal(localDayKey(at(2026, 9, 17, 0, 0, 0)), '2026-09-17');
  assert.equal(localDayKey(at(2026, 1, 5, 12)), '2026-01-05');
});

test('the wait ends at the next local midnight', () => {
  assert.equal(msUntilNextLocalMidnight(at(2026, 9, 16, 23, 59, 30)), 30_000 + GUARD_MS);
  assert.equal(msUntilNextLocalMidnight(at(2026, 9, 16, 0, 0, 0)), 24 * HOUR_MS + GUARD_MS);
});

test('the wait follows the clock change, not a fixed day length', () => {
  // Berlin loses an hour on 29.03.2026 and gains one on 25.10.2026.
  assert.equal(msUntilNextLocalMidnight(at(2026, 3, 29)), 23 * HOUR_MS + GUARD_MS);
  assert.equal(msUntilNextLocalMidnight(at(2026, 10, 25)), 25 * HOUR_MS + GUARD_MS);
});

test('a child is due once a day, and only with Pro', () => {
  const now = at(2026, 9, 16, 0, 0, 1);
  const due = childrenDueForRegimeRun(
    [
      { childId: 'never-run', hasProAccess: true, lastRunDay: undefined },
      { childId: 'ran-yesterday', hasProAccess: true, lastRunDay: '2026-09-15' },
      { childId: 'ran-today', hasProAccess: true, lastRunDay: '2026-09-16' },
      { childId: 'no-pro', hasProAccess: false, lastRunDay: undefined },
    ],
    now,
  );
  assert.deepEqual(due, ['never-run', 'ran-yesterday']);
});

test('a child kept open past midnight becomes due again', () => {
  const candidates = [{ childId: 'child', hasProAccess: true, lastRunDay: '2026-09-16' }];
  assert.deepEqual(childrenDueForRegimeRun(candidates, at(2026, 9, 16, 23, 59)), []);
  assert.deepEqual(childrenDueForRegimeRun(candidates, at(2026, 9, 17, 0, 0, 1)), ['child']);
});
