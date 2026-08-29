import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildProDetails,
  buildTimeRange,
  initialTimeInputs,
  parsePositiveVolume,
  sanitizeVolumeInput,
  startOfLocalDay,
  timeInputAsDate,
} from '../src/features/calendar/components/add-activity-modal/helpers.ts';

test('manual activity defaults use current time today and 09:00 on other days', () => {
  const now = new Date(2026, 7, 29, 23, 50);
  assert.deepEqual(initialTimeInputs(new Date(2026, 7, 29), now), {
    startInput: '23:50',
    endInput: '23:59',
  });
  assert.deepEqual(initialTimeInputs(new Date(2026, 7, 28), now), {
    startInput: '09:00',
    endInput: '09:30',
  });
});

test('manual activity time and volume helpers preserve input behavior', () => {
  const now = new Date(2026, 7, 29, 15, 30);
  const time = timeInputAsDate('07:05', now);
  assert.equal(time.getHours(), 7);
  assert.equal(time.getMinutes(), 5);
  assert.equal(timeInputAsDate('invalid', now).getHours(), 0);
  assert.equal(startOfLocalDay(now.getTime()), new Date(2026, 7, 29).getTime());
  assert.equal(parsePositiveVolume('120'), 120);
  assert.equal(parsePositiveVolume('0'), undefined);
  assert.equal(parsePositiveVolume(''), undefined);
  assert.equal(sanitizeVolumeInput('12a345'), '1234');
});

test('manual activity ranges preserve duration events and validation', () => {
  const day = new Date(2026, 7, 29).getTime();
  assert.deepEqual(
    buildTimeRange({
      startInput: '09:00',
      endInput: 'bad',
      startDayMs: day,
      endDayMs: day,
      eventKind: true,
      eventDurationMs: 10 * 60_000,
    }),
    {
      range: {
        start: new Date(2026, 7, 29, 9).getTime(),
        end: new Date(2026, 7, 29, 9, 10).getTime(),
      },
      error: null,
    },
  );
  assert.equal(
    buildTimeRange({
      startInput: 'bad',
      endInput: '09:30',
      startDayMs: day,
      endDayMs: day,
      eventKind: false,
      eventDurationMs: 0,
    }).error,
    'format',
  );
  assert.equal(
    buildTimeRange({
      startInput: '10:00',
      endInput: '09:30',
      startDayMs: day,
      endDayMs: day,
      eventKind: false,
      eventDurationMs: 0,
    }).error,
    'endAfterStart',
  );
});

test('manual activity pro details preserve exclusions and feeding payloads', () => {
  const base = {
    proActive: true,
    kind: 'feeding',
    eventKind: false,
    settlingMethods: ['rocking'],
    sleepPlace: 'crib',
    feedingMode: 'breast',
    breastSide: 'right',
    bottleContent: 'formula',
    bottleVolume: 90,
  };
  assert.deepEqual(buildProDetails(base), {
    type: 'feeding',
    mode: 'breast',
    side: 'right',
  });
  assert.deepEqual(buildProDetails({ ...base, feedingMode: 'bottle' }), {
    type: 'feeding',
    mode: 'bottle',
    content: 'formula',
    volumeMl: 90,
  });
  assert.deepEqual(buildProDetails({ ...base, kind: 'settling' }), {
    type: 'settling',
    methods: ['rocking'],
  });
  assert.deepEqual(buildProDetails({ ...base, kind: 'sleep' }), {
    type: 'sleep',
    place: 'crib',
  });
  assert.equal(buildProDetails({ ...base, proActive: false }), undefined);
  assert.equal(buildProDetails({ ...base, kind: 'awake' }), undefined);
  assert.equal(buildProDetails({ ...base, eventKind: true }), undefined);
});

test('add activity modal is split behind a stable folder entry point', () => {
  const folder = new URL('../src/features/calendar/components/add-activity-modal/', import.meta.url);
  const indexSource = readFileSync(new URL('index.ts', folder), 'utf8');
  const modalSource = readFileSync(new URL('add-activity-modal.tsx', folder), 'utf8');
  const hookSource = readFileSync(new URL('use-add-activity-form.ts', folder), 'utf8');

  assert.match(indexSource, /export \{ AddActivityModal \}/);
  assert.match(modalSource, /<Modal/);
  assert.match(modalSource, /<WheelSheetHost>/);
  assert.match(modalSource, /<ActivityField/);
  assert.match(modalSource, /<TimeFields/);
  assert.match(modalSource, /<ProParameters/);
  assert.match(modalSource, /const showProParameters =/);
  assert.match(hookSource, /const bottleVolume =/);
  assert.equal(
    existsSync(new URL('../src/features/calendar/components/add-activity-modal.tsx', import.meta.url)),
    false,
  );
});
