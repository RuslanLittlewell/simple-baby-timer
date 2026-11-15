import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { LoadedWeekRegistry } from '../src/lib/activity-history-loading.ts';
import { StoredList, withoutSent } from '../src/lib/stored-list.ts';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');

/** Storage whose reads and writes resolve later, like the device's, so overlapping changes can race. */
function slowStorage() {
  const values = new Map();
  const later = () => new Promise((resolve) => setTimeout(resolve, 1));
  return {
    values,
    async getItem(key) {
      await later();
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      await later();
      values.set(key, value);
    },
  };
}

test('records queued at the same moment all stay in the upload queue', async () => {
  const queue = new StoredList(slowStorage(), 'queue');

  await Promise.all(
    ['a', 'b', 'c', 'd'].map((id) => queue.update((list) => [...list, { id }])),
  );

  assert.deepEqual(await queue.read(), [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]);
});

test('a record queued or edited during an upload is not dropped when the upload finishes', async () => {
  const queue = new StoredList(slowStorage(), 'queue');
  await queue.update(() => [{ id: 'a', end: 1 }, { id: 'b', end: 1 }]);

  const sent = await queue.read();
  // While the request is in flight: `a` is edited again and `c` is added.
  await queue.update((list) => [...list.filter((item) => item.id !== 'a'), { id: 'a', end: 2 }]);
  await queue.update((list) => [...list, { id: 'c', end: 1 }]);
  await queue.update((list) => withoutSent(list, sent));

  assert.deepEqual(await queue.read(), [{ id: 'a', end: 2 }, { id: 'c', end: 1 }]);
});

test('an unreadable stored queue reads as empty instead of failing', async () => {
  const storage = slowStorage();
  storage.values.set('queue', '{broken');
  assert.deepEqual(await new StoredList(storage, 'queue').read(), []);
});

test('forgetting downloaded weeks makes each of them download again', async () => {
  const registry = new LoadedWeekRegistry(slowStorage(), (childId) => `loaded/${childId}`);
  await registry.mark('remote', 'local', '2026-11-09');
  assert.equal(await registry.has('remote', 'local', '2026-11-09'), true);

  await registry.reset('remote', 'local');

  assert.equal(await registry.has('remote', 'local', '2026-11-09'), false);
  await registry.mark('remote', 'local', '2026-11-16');
  assert.equal(await registry.has('remote', 'local', '2026-11-16'), true);
});

test('every write to the stored history takes its turn behind the store lock', () => {
  const store = read('../src/lib/activity-store.ts');
  for (const name of [
    'claimUnownedSessions',
    'deleteAllSessions',
    'deleteSessionsForChild',
    'mergeRemoteSessions',
    'saveSession',
    'deleteSession',
    'updateSession',
  ]) {
    const start = store.indexOf(`export async function ${name}(`);
    const body = store.slice(start, store.indexOf('\nexport ', start + 1));
    assert.match(body, /return withStoreLock\(async \(\) => \{/, name);
  }
});

test('a sync pass follows server changes, survives a refused upload and is retried', () => {
  const sync = read('../src/hooks/use-sync.ts');
  const release = sync.indexOf('finishActivityGate(generation);');
  const pull = sync.indexOf('pullChildChanges(child.remoteId, child.id)', release);
  const remainder = sync.indexOf('loadChildCurrentWeekRemainder(', release);
  assert.ok(release > 0 && pull > release && remainder > pull);
  assert.match(sync, /const uploaded = await flushQueue\(\)\.then\(\(\) => true, \(\) => false\);/);
  assert.match(sync, /return uploaded && pulledChanges \? 'success' : 'failed';/);
  assert.match(sync, /else scheduleSyncRetry\(\);/);
  assert.match(sync, /if \(status === 'SUBSCRIBED'\) \{\s*void catchUpChild\(remoteId, localChildId\)/);
});

test('network requests cannot hang a sync pass forever', () => {
  const client = read('../src/lib/supabase.ts');
  assert.match(client, /global: \{ fetch: fetchWithTimeout \}/);
  assert.match(client, /setTimeout\(\(\) => controller\.abort\(\), REQUEST_TIMEOUT_MS\)/);
});
