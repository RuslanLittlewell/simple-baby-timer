import assert from 'node:assert/strict';
import test from 'node:test';

import { planLiveActivityReconciliation } from '../src/lib/live-activity-lifecycle.ts';

const desired = (overrides = {}) => ({
  ownerId: 'child-1',
  slot: 'session',
  kind: 'sleep',
  startedAt: 100,
  ...overrides,
});

test('stale persisted activity is stopped when no mode is active', () => {
  const plan = planLiveActivityReconciliation([desired()], []);
  assert.deepEqual(plan.stopKeys, ['child-1|session']);
  assert.deepEqual(plan.start, []);
});

test('a changed mode replaces the existing activity', () => {
  const plan = planLiveActivityReconciliation([desired()], [desired({ kind: 'awake', startedAt: 200 })]);
  assert.deepEqual(plan.stopKeys, ['child-1|session']);
  assert.equal(plan.start.length, 1);
  assert.equal(plan.start[0].kind, 'awake');
});

test('a push-created activity is adopted without creating a duplicate', () => {
  const plan = planLiveActivityReconciliation(
    [desired({ kind: 'awake', startedAt: 0 })],
    [desired()],
  );
  assert.deepEqual(plan.stopKeys, []);
  assert.equal(plan.adopt.length, 1);
  assert.deepEqual(plan.start, []);
});

test('repeated reconciliation keeps one matching activity', () => {
  const plan = planLiveActivityReconciliation([desired()], [desired(), desired()]);
  assert.deepEqual(plan.stopKeys, []);
  assert.deepEqual(plan.adopt, []);
  assert.deepEqual(plan.start, []);
});

test('session and feeding tracks remain independent', () => {
  const feeding = desired({ slot: 'feeding', kind: 'feeding' });
  const plan = planLiveActivityReconciliation([desired(), feeding], [feeding]);
  assert.deepEqual(plan.stopKeys, ['child-1|session']);
  assert.deepEqual(plan.start, []);
});
