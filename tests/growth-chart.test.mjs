import assert from 'node:assert/strict';
import test from 'node:test';

import {
  growthChartDayLabel,
  growthChartDayTicks,
  growthChartDomain,
  growthChartPoints,
} from '../src/lib/growth-chart.ts';

process.env.TZ = 'America/Los_Angeles';

const measurement = (id, measuredOn, weightKg, heightCm) => ({
  id,
  childId: 'child-1',
  measuredOn,
  weightKg,
  heightCm,
  updatedAt: 1,
});

const measurements = [
  measurement('c', '2026-10-01', 7.4, 66),
  measurement('a', '2026-08-01', 6.1, 61),
  measurement('b', '2026-09-01', 6.8, 63.5),
];

test('points follow the chosen metric, oldest first, a day apart per calendar day', () => {
  const weight = growthChartPoints(measurements, 'weight');
  assert.deepEqual(weight.map((point) => point.value), [6.1, 6.8, 7.4]);
  assert.deepEqual(weight.map((point) => point.measuredOn), ['2026-08-01', '2026-09-01', '2026-10-01']);
  assert.equal(weight[1].day - weight[0].day, 31);
  assert.equal(weight[2].day - weight[1].day, 30);
  assert.ok(weight.every((point) => Number.isInteger(point.day)));

  const height = growthChartPoints(measurements, 'height');
  assert.deepEqual(height.map((point) => point.value), [61, 63.5, 66]);
});

test('a malformed date is left off the chart', () => {
  const points = growthChartPoints([...measurements, measurement('x', '01.10.2026', 9, 70)], 'weight');
  assert.equal(points.length, 3);
});

test('the domain leaves room around the line and never dips below zero', () => {
  const points = growthChartPoints(measurements, 'weight');
  const domain = growthChartDomain(points);
  assert.deepEqual(domain.x, [points[0].day, points[2].day]);
  assert.ok(domain.y[0] < 6.1 && domain.y[0] >= 0);
  assert.ok(domain.y[1] > 7.4);
});

test('a flat line on a single day still gets a scale to draw on', () => {
  const points = growthChartPoints(
    [measurement('a', '2026-10-01', 7, 66), measurement('b', '2026-10-01', 7, 66)],
    'weight',
  );
  const domain = growthChartDomain(points);
  assert.ok(domain.x[1] > domain.x[0]);
  assert.ok(domain.y[1] > domain.y[0]);
});

test('day ticks are whole days from the first measurement to the last', () => {
  const points = growthChartPoints(measurements, 'weight');
  const ticks = growthChartDayTicks(points);
  assert.equal(ticks.length, 4);
  assert.equal(ticks[0], points[0].day);
  assert.equal(ticks[3], points[2].day);
  assert.ok(ticks.every(Number.isInteger));

  const twoDays = growthChartPoints(
    [measurement('a', '2026-10-01', 7, 66), measurement('b', '2026-10-02', 7.1, 66.2)],
    'weight',
  );
  assert.deepEqual(growthChartDayTicks(twoDays), [twoDays[0].day, twoDays[1].day]);
});

test('axis days read as day/month, and month/year past a year', () => {
  const [first] = growthChartPoints(measurements, 'weight');
  assert.equal(growthChartDayLabel(first.day, 61), '01/08');
  assert.equal(growthChartDayLabel(first.day, 400), '08/26');
});
