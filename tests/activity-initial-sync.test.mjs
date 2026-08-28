import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const syncSource = readFileSync(
  new URL('../src/hooks/use-sync.ts', import.meta.url),
  'utf8',
);

test('critical activity work loads only the active child day alongside live state', () => {
  assert.match(
    syncSource,
    /const activeChild = criticalState\.children\.find\([\s\S]*?child\.id === criticalState\.activeChildId/,
  );
  assert.match(
    syncSource,
    /Promise\.allSettled\(\[[\s\S]*?loadChildCurrentDay\(activeChild\.remoteId, activeChild\.id\)[\s\S]*?refreshLive\(\)/,
  );
});

test('activity gate finishes before non-critical background synchronization', () => {
  const criticalRelease = syncSource.indexOf('finishActivityGate(generation);');
  const purchaserSync = syncSource.indexOf('identifyPurchaser(userId)', criticalRelease);
  const queueSync = syncSource.indexOf('flushQueue()', criticalRelease);
  const entitlementSync = syncSource.indexOf('fetchAccountProStatus()', criticalRelease);

  assert.ok(criticalRelease > 0);
  assert.ok(purchaserSync > criticalRelease);
  assert.ok(queueSync > criticalRelease);
  assert.ok(entitlementSync > criticalRelease);
});

test('other children load in the background without extending the gate', () => {
  assert.match(
    syncSource,
    /\.filter\(\(child\) => child\.remoteId && child\.id !== activeChild\?\.id\)[\s\S]*?loadChildCurrentWeek\(child\.remoteId!, child\.id, \{ refresh: true \}\)/,
  );
});

test('the active child current-week remainder starts only after the gate releases', () => {
  const criticalRelease = syncSource.indexOf('finishActivityGate(generation);');
  const remainderLoad = syncSource.indexOf('loadChildCurrentWeekRemainder(', criticalRelease);
  assert.ok(criticalRelease > 0);
  assert.ok(remainderLoad > criticalRelease);
});

test('activity gate keeps the timeout fallback and generation-safe store finish', () => {
  assert.match(syncSource, /const ACTIVITY_SYNC_TIMEOUT_MS = 15_000/);
  assert.match(
    syncSource,
    /setTimeout\(\(\) => \{[\s\S]*?finishActivityGate\(generation\);[\s\S]*?\}, ACTIVITY_SYNC_TIMEOUT_MS\)/,
  );
  assert.match(
    syncSource,
    /function finishActivityGate\(generation: number\)[\s\S]*?finishActivitySync\(generation\)/,
  );
});

test('fresh local history keeps controls ready before network synchronization', () => {
  assert.match(
    syncSource,
    /const locallyFresh =[\s\S]*?isChildCurrentDayFresh\(activeChild\.remoteId\)/,
  );
  assert.match(
    syncSource,
    /const gated = !locallyFresh;[\s\S]*?prepareActivitySync\(generation, gated\)/,
  );
  assert.match(syncSource, /if \(!gated\) return;/);
  assert.match(
    syncSource,
    /activeChild\?\.remoteId && refreshCritical[\s\S]*?loadChildCurrentDay/,
  );
});

test('only an actual account change forces restored auth past local freshness', () => {
  assert.match(syncSource, /!force && !!activeChild\?\.remoteId/);
  assert.match(
    syncSource,
    /const accountChanged = useAppStore\.getState\(\)\.accountId !== session\.user\.id;[\s\S]*?syncNow\(\{ fresh: true, force: accountChanged \}\)/,
  );
});

test('remote child discovery reuses identity and repeats only after child creation', () => {
  assert.match(syncSource, /fetchRemoteChildren\(userId\)/);
  assert.match(
    syncSource,
    /let createdRemoteChild = false;[\s\S]*?createdRemoteChild = true;[\s\S]*?if \(createdRemoteChild\) \{[\s\S]*?fetchRemoteChildren\(userId\)/,
  );
  assert.equal(syncSource.match(/fetchRemoteChildren\(userId\)/g)?.length, 2);
});
