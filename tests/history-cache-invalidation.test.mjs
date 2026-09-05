import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  FreshnessRegistry,
  HistoryRangeRegistry,
  LoadedWeekRegistry,
} from '../src/lib/activity-history-loading.ts';

const EMPTY_TTL_MS = 5 * 60_000;

function fakeStorage() {
  const values = new Map();
  return {
    values,
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
  };
}

function historyRanges(storage) {
  return new HistoryRangeRegistry(
    new LoadedWeekRegistry(storage, (childId) => `loaded/${childId}`),
    new FreshnessRegistry(storage, (childId) => `empty/${childId}`),
    EMPTY_TTL_MS,
  );
}

test('a download that applied nothing is never recorded as downloaded', async () => {
  const storage = fakeStorage();
  const ranges = historyRanges(storage);

  await ranges.record('remote', 'local', '2026-01-05', 0, 1_000);

  assert.equal(storage.values.has('loaded/remote'), false);
  assert.equal(
    await ranges.isSettled('remote', 'local', '2026-01-05', 1_000 + EMPTY_TTL_MS),
    false,
  );
});

test('an empty range is suppressed for the freshness window and released after it', async () => {
  const storage = fakeStorage();
  const ranges = historyRanges(storage);

  await ranges.record('remote', 'local', '2026-01-05', 0, 1_000);

  assert.equal(
    await ranges.isSettled('remote', 'local', '2026-01-05', 1_000 + EMPTY_TTL_MS - 1),
    true,
  );
  assert.equal(
    await ranges.isSettled('remote', 'local', '2026-01-05', 1_000 + EMPTY_TTL_MS),
    false,
  );
});

test('an applied download settles the range for good', async () => {
  const storage = fakeStorage();
  const ranges = historyRanges(storage);

  await ranges.record('remote', 'local', '2026-01-05', 3, 1_000);

  assert.equal(
    await ranges.isSettled('remote', 'local', '2026-01-05', 1_000 + EMPTY_TTL_MS * 100),
    true,
  );
  assert.equal(await ranges.isSettled('remote', 'local', '2026-01-12', 1_000), false);
});

test('a regenerated local child id ignores the previous identity record', async () => {
  const storage = fakeStorage();
  const ranges = historyRanges(storage);

  await ranges.record('remote', 'old-local', '2026-01-05', 3, 1_000);

  assert.equal(await ranges.isSettled('remote', 'old-local', '2026-01-05', 2_000), true);
  assert.equal(await ranges.isSettled('remote', 'new-local', '2026-01-05', 2_000), false);
});

test('a download under a new identity replaces the previous identity record', async () => {
  const storage = fakeStorage();
  const registry = new LoadedWeekRegistry(storage, (childId) => `loaded/${childId}`);

  await registry.mark('remote', 'old-local', '2026-01-05');
  await registry.mark('remote', 'new-local', '2026-01-12');

  assert.deepEqual(JSON.parse(storage.values.get('loaded/remote')), {
    localChildId: 'new-local',
    weeks: ['2026-01-12'],
  });
  assert.equal(await registry.has('remote', 'old-local', '2026-01-05'), false);
  assert.equal(await registry.has('remote', 'new-local', '2026-01-12'), true);
});

test('a record that predates identity scoping counts as not downloaded', async () => {
  const storage = fakeStorage();
  storage.values.set('loaded/remote', JSON.stringify(['2026-01-05', '2026-01-12']));
  const registry = new LoadedWeekRegistry(storage, (childId) => `loaded/${childId}`);

  assert.equal(await registry.has('remote', 'local', '2026-01-05'), false);

  await registry.mark('remote', 'local', '2026-01-05');
  assert.deepEqual(JSON.parse(storage.values.get('loaded/remote')), {
    localChildId: 'local',
    weeks: ['2026-01-05'],
  });
});

test('an unreadable record counts as not downloaded instead of throwing', async () => {
  const storage = fakeStorage();
  storage.values.set('loaded/remote', 'not json');
  const registry = new LoadedWeekRegistry(storage, (childId) => `loaded/${childId}`);

  assert.equal(await registry.has('remote', 'local', '2026-01-05'), false);
});

const syncSource = readFileSync(new URL('../src/lib/sync.ts', import.meta.url), 'utf8');
const stateSource = readFileSync(new URL('../src/state/app-state.ts', import.meta.url), 'utf8');

test('a settled week is served locally without reaching the network', () => {
  assert.match(
    syncSource,
    /if \(!refresh && \(await historyRanges\.isSettled\(remoteId, localChildId, week\.key\)\)\) return 0;\n\s*const applied = await fetchHistoryPages\(/,
  );
  assert.match(
    syncSource,
    /const applied = await fetchHistoryPages\(remoteId, localChildId, week\);\n\s*await historyRanges\.record\(remoteId, localChildId, week\.key, applied\);/,
  );
});

test('the current-week remainder records only what it applied', () => {
  assert.match(
    syncSource,
    /if \(await historyRanges\.isSettled\(remoteId, localChildId, week\.key\)\) return 0;/,
  );
  assert.match(
    syncSource,
    /const applied = counts\.reduce\(\(sum, count\) => sum \+ count, 0\);\n\s*await historyRanges\.record\(remoteId, localChildId, week\.key, applied\);/,
  );
});

test('the identity-scoped record uses a new prefix and retires the previous one', () => {
  assert.match(syncSource, /const LOADED_WEEKS_PREFIX = 'babytimer\.sync\.loaded-weeks\.v2\.';/);
  assert.match(
    syncSource,
    /const LEGACY_LOADED_WEEKS_PREFIX = 'babytimer\.sync\.loaded-weeks\.v1\.';/,
  );
  for (const prefix of ['LEGACY_LOADED_WEEKS_PREFIX', 'LOADED_WEEKS_PREFIX', 'EMPTY_RANGES_PREFIX']) {
    assert.match(syncSource, new RegExp(`key\\.startsWith\\(${prefix}\\)`));
  }
  for (const key of ['legacyLoadedWeeksKey', 'loadedWeeksKey', 'emptyRangesKey']) {
    assert.match(syncSource, new RegExp(`${key}\\(remoteId\\),`));
  }
});

test('an interrupted account clear leaves no record claiming deleted rows', () => {
  const clear = stateSource.indexOf('clearAccountData: async (');
  assert.ok(clear > 0);
  const records = stateSource.indexOf('await clearSyncState();', clear);
  const rows = stateSource.indexOf('await deleteAllSessions()', clear);
  const stateUpdate = stateSource.indexOf('set({', records);

  assert.ok(records > clear);
  assert.ok(rows > records);
  assert.ok(stateUpdate > rows);
  assert.match(stateSource.slice(clear), /await deleteAllSessions\(\)\.catch\(\(\) => \{\}\);/);
});
