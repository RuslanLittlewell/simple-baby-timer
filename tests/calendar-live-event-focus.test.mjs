import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { timelineFocusTargetY } from '../src/features/calendar/timeline-focus.ts';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

test('focus target places the current-time end below a stable visual lead', () => {
  const dayStart = Date.UTC(2026, 8, 20);

  assert.equal(
    timelineFocusTargetY(dayStart + 10 * HOUR, dayStart, 96, 600, 64),
    820,
  );
});

test('focus target stays at the top around local midnight', () => {
  const dayStart = Date.UTC(2026, 8, 20);

  assert.equal(
    timelineFocusTargetY(dayStart + 30 * MINUTE, dayStart, 96, 600, 64),
    0,
  );
  assert.equal(
    timelineFocusTargetY(dayStart - HOUR, dayStart, 96, 600, 64),
    0,
  );
});

test('focus target is bounded by the viewport near the end of the day', () => {
  const dayStart = Date.UTC(2026, 8, 20);
  const maxScroll = 24 * 96 + 64 - 600;

  assert.equal(
    timelineFocusTargetY(dayStart + 23 * HOUR + 50 * MINUTE, dayStart, 96, 600, 64),
    maxScroll,
  );
});

test('Calendar focus selects today and uses the shared live-event end coordinate', () => {
  const source = readFileSync(
    new URL('../src/features/calendar/calendar-screen.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /useFocusEffect\(/);
  assert.match(source, /setShownDay\(focusedToday\)/);
  assert.match(source, /pendingFocusAt\.current = focusedToday\.getTime\(\)/);
  assert.match(source, /timelineFocusTargetY\(\s*focusedAt,/);
  assert.match(source, /const endMin = clampDayMin\(nowMinutes\)/);
  assert.doesNotMatch(source, /didAutoScroll/);
});
