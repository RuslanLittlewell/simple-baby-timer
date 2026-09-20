import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addGrowthMeasurementToList,
  dateFromDateOnly,
  dateOnlyFromDate,
  editGrowthMeasurementInList,
  isValidGrowthMeasurement,
  latestGrowthMeasurement,
  mergeGrowthMeasurementLists,
  parseMeasurementNumber,
  sanitizeGrowthMeasurements,
  sortGrowthMeasurements,
} from '../src/lib/growth-measurements.ts';

const measurement = (id, measuredOn, updatedAt = 1) => ({
  id,
  childId: 'child',
  measuredOn,
  heightCm: 60.5,
  weightKg: 5.25,
  updatedAt,
});

test('date-only conversion preserves the local calendar day', () => {
  const date = new Date(2026, 8, 16, 23, 45);
  assert.equal(dateOnlyFromDate(date), '2026-09-16');
  const restored = dateFromDateOnly('2026-09-16');
  assert.deepEqual(
    [restored?.getFullYear(), restored?.getMonth(), restored?.getDate()],
    [2026, 8, 16],
  );
  assert.equal(dateFromDateOnly('2026-02-30'), null);
});

test('measurement parsing accepts locale decimal separators and rejects invalid values', () => {
  assert.equal(parseMeasurementNumber(' 5,25 '), 5.25);
  assert.equal(parseMeasurementNumber('60.5'), 60.5);
  assert.equal(parseMeasurementNumber('0'), null);
  assert.equal(parseMeasurementNumber('-2'), null);
  assert.equal(parseMeasurementNumber('abc'), null);
});

test('validation enforces birthday and current-day date bounds', () => {
  const value = measurement('one', '2026-04-10');
  assert.equal(isValidGrowthMeasurement(value, '2026-01-01', '2026-09-16'), true);
  assert.equal(isValidGrowthMeasurement(value, '2026-05-01', '2026-09-16'), false);
  assert.equal(isValidGrowthMeasurement(value, '2026-01-01', '2026-04-09'), false);
});

test('measurements sort newest first with deterministic id tie-breaking', () => {
  const rows = [
    measurement('a', '2026-02-01'),
    measurement('b', '2026-03-01'),
    measurement('c', '2026-03-01'),
  ];
  assert.deepEqual(sortGrowthMeasurements(rows).map((row) => row.id), ['c', 'b', 'a']);
  assert.equal(latestGrowthMeasurement(rows)?.id, 'c');
});

test('sanitization drops malformed rows and keeps the newest copy of an id', () => {
  const rows = sanitizeGrowthMeasurements([
    measurement('same', '2026-01-01', 1),
    { ...measurement('same', '2026-02-01', 2), weightKg: 6 },
    { ...measurement('bad', 'not-a-date'), heightCm: 0 },
    null,
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].measuredOn, '2026-02-01');
  assert.equal(rows[0].weightKg, 6);
});

test('add and edit retain stable identity and reorder the local list', () => {
  const added = addGrowthMeasurementToList([], {
    childId: 'child',
    measuredOn: '2026-01-01',
    heightCm: 50,
    weightKg: 3.5,
  }, 10, 'stable-id');
  const edited = editGrowthMeasurementInList(added.measurements, 'stable-id', {
    measuredOn: '2026-03-01',
    heightCm: 61,
    weightKg: 5.2,
  }, 20);
  assert.equal(edited?.measurement.id, 'stable-id');
  assert.equal(edited?.measurement.updatedAt, 20);
  assert.equal(edited?.measurements[0].measuredOn, '2026-03-01');
});

test('remote merge keeps pending local edits and otherwise accepts the newest row', () => {
  const local = measurement('same', '2026-01-01', 20);
  const remote = { ...measurement('same', '2026-02-01', 30), weightKg: 7 };
  assert.equal(mergeGrowthMeasurementLists([local], [remote])[0].weightKg, 7);
  assert.equal(
    mergeGrowthMeasurementLists([local], [remote], new Set(['same']))[0].measuredOn,
    '2026-01-01',
  );
});
