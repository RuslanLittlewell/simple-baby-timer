import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calendarMonthOf,
  calendarMonthsInRange,
  compoundCursorFilter,
  LoadedMonthRegistry,
  MonthLoadCoordinator,
  paginateCompound,
  partitionDeletedRows,
} from '../src/lib/activity-history-loading.ts';

test('calendar month uses local calendar boundaries', () => {
  const month = calendarMonthOf(new Date(2026, 1, 18, 12));
  assert.equal(month.key, '2026-02');
  assert.equal(month.startMs, new Date(2026, 1, 1).getTime());
  assert.equal(month.endMs, new Date(2026, 2, 1).getTime());
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

test('loaded month registry is durable and preserves concurrent month marks', async () => {
  const values = new Map();
  const storage = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
  };
  const registry = new LoadedMonthRegistry(storage, (childId) => `loaded/${childId}`);
  await Promise.all([
    registry.mark('child', '2026-01'),
    registry.mark('child', '2026-02'),
  ]);
  const afterRestart = new LoadedMonthRegistry(storage, (childId) => `loaded/${childId}`);
  assert.equal(await afterRestart.has('child', '2026-01'), true);
  assert.equal(await afterRestart.has('child', '2026-02'), true);
  assert.equal(await afterRestart.has('other-child', '2026-01'), false);
});

test('range includes every intersecting month and excludes exact end boundary', () => {
  const start = new Date(2026, 0, 31, 23).getTime();
  const end = new Date(2026, 2, 1).getTime();
  assert.deepEqual(calendarMonthsInRange(start, end).map(({ key }) => key), [
    '2026-01',
    '2026-02',
  ]);
  assert.deepEqual(calendarMonthsInRange(end, end), []);
});

test('compound cursor has a unique id tie-breaker', () => {
  assert.equal(
    compoundCursorFilter(123, '123-sleep'),
    'start_ms.gt.123,and(start_ms.eq.123,id.gt.123-sleep)',
  );
});

test('concurrent month loads share one promise and failed loads remain retryable', async () => {
  const coordinator = new MonthLoadCoordinator();
  let calls = 0;
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  const load = async () => {
    calls += 1;
    await blocked;
    return 7;
  };
  const first = coordinator.run('child/month', load);
  const second = coordinator.run('child/month', load);
  assert.equal(first, second);
  release();
  assert.deepEqual(await Promise.all([first, second]), [7, 7]);
  assert.equal(calls, 1);

  await assert.rejects(coordinator.run('retry', async () => { throw new Error('offline'); }));
  assert.equal(await coordinator.run('retry', async () => 2), 2);
});
