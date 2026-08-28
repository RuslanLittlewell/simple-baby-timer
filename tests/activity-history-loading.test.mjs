import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calendarWeekOf,
  calendarWeeksInRange,
  compoundCursorFilter,
  LoadedWeekRegistry,
  WeekFreshnessRegistry,
  WeekLoadCoordinator,
  paginateCompound,
  partitionDeletedRows,
} from '../src/lib/activity-history-loading.ts';

test('calendar week uses local Monday boundaries', () => {
  const week = calendarWeekOf(new Date(2026, 1, 18, 12));
  assert.equal(week.key, '2026-02-16');
  assert.equal(week.startMs, new Date(2026, 1, 16).getTime());
  assert.equal(week.endMs, new Date(2026, 1, 23).getTime());
});

test('deletion tombstones are separated from active range rows', () => {
  const result = partitionDeletedRows([
    { id: 'active', deleted: false },
    { id: 'removed', deleted: true },
  ]);
  assert.deepEqual(result.activeRows, [{ id: 'active', deleted: false }]);
  assert.deepEqual(result.deletedIds, ['removed']);
});

test('compound pagination does not skip rows sharing a page-boundary timestamp', async () => {
  const source = Array.from({ length: 1005 }, (_, index) => ({
    startMs: 42,
    id: String(index).padStart(4, '0'),
  }));
  const received = [];
  const count = await paginateCompound(
    1000,
    async (cursor) => source
      .filter((row) => !cursor || row.startMs > cursor.startMs ||
        (row.startMs === cursor.startMs && row.id > cursor.id))
      .slice(0, 1000),
    async (rows) => { received.push(...rows); },
  );
  assert.equal(count, source.length);
  assert.deepEqual(received, source);
});

test('loaded week registry is durable and preserves concurrent week marks', async () => {
  const values = new Map();
  const storage = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
  };
  const registry = new LoadedWeekRegistry(storage, (childId) => `loaded/${childId}`);
  await Promise.all([
    registry.mark('child', '2026-01-05'),
    registry.mark('child', '2026-01-12'),
  ]);
  const afterRestart = new LoadedWeekRegistry(storage, (childId) => `loaded/${childId}`);
  assert.equal(await afterRestart.has('child', '2026-01-05'), true);
  assert.equal(await afterRestart.has('child', '2026-01-12'), true);
  assert.equal(await afterRestart.has('other-child', '2026-01-05'), false);
});

test('week freshness uses a strict TTL and survives a registry restart', async () => {
  const values = new Map();
  const storage = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
  };
  const keyForChild = (childId) => `fresh/${childId}`;
  const registry = new WeekFreshnessRegistry(storage, keyForChild);
  await registry.mark('child', '2026-02-16', 1_000);

  const afterRestart = new WeekFreshnessRegistry(storage, keyForChild);
  assert.equal(await afterRestart.isFresh('child', '2026-02-16', 60_000, 60_999), true);
  assert.equal(await afterRestart.isFresh('child', '2026-02-16', 60_000, 61_000), false);
  assert.equal(await afterRestart.isFresh('child', 'missing', 60_000, 1_001), false);
});

test('failed freshness persistence never reports a week as fresh', async () => {
  const storage = {
    async getItem() { return null; },
    async setItem() { throw new Error('storage unavailable'); },
  };
  const registry = new WeekFreshnessRegistry(storage, (childId) => `fresh/${childId}`);
  await assert.rejects(registry.mark('child', '2026-02-16', 1_000));
  assert.equal(await registry.isFresh('child', '2026-02-16', 60_000, 1_001), false);
});

test('range includes every intersecting week and excludes exact end boundary', () => {
  const start = new Date(2026, 0, 31, 23).getTime();
  const end = new Date(2026, 1, 9).getTime();
  assert.deepEqual(calendarWeeksInRange(start, end).map(({ key }) => key), [
    '2026-01-26',
    '2026-02-02',
  ]);
  assert.deepEqual(calendarWeeksInRange(end, end), []);
});

test('compound cursor has a unique id tie-breaker', () => {
  assert.equal(
    compoundCursorFilter(123, '123-sleep'),
    'start_ms.gt.123,and(start_ms.eq.123,id.gt.123-sleep)',
  );
});

test('concurrent week loads share one promise and failed loads remain retryable', async () => {
  const coordinator = new WeekLoadCoordinator();
  let calls = 0;
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  const load = async () => {
    calls += 1;
    await blocked;
    return 7;
  };
  const first = coordinator.run('child/week', load);
  const second = coordinator.run('child/week', load);
  assert.equal(first, second);
  release();
  assert.deepEqual(await Promise.all([first, second]), [7, 7]);
  assert.equal(calls, 1);

  await assert.rejects(coordinator.run('retry', async () => { throw new Error('offline'); }));
  assert.equal(await coordinator.run('retry', async () => 2), 2);
});
