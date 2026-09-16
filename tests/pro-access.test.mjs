import assert from 'node:assert/strict';
import test from 'node:test';

import { hasProAccess, selectActiveChildProAccess } from '../src/lib/pro-access.ts';

const state = (overrides = {}) => ({
  activeChildId: 'shared-pro-child',
  children: [
    { id: 'free-child' },
    { id: 'shared-pro-child', proEnabled: true },
  ],
  proActive: false,
  ...overrides,
});

test('an account subscription unlocks every child', () => {
  assert.equal(hasProAccess(state({ proActive: true }), 'free-child'), true);
});

test('a shared Premium child unlocks child-scoped features for a free account', () => {
  assert.equal(selectActiveChildProAccess(state()), true);
  assert.equal(hasProAccess(state(), 'shared-pro-child'), true);
});

test('Premium does not leak from one child to another', () => {
  assert.equal(hasProAccess(state(), 'free-child'), false);
  assert.equal(
    selectActiveChildProAccess(state({ activeChildId: 'free-child' })),
    false,
  );
});

test('there is no child-scoped access without an active child', () => {
  assert.equal(selectActiveChildProAccess(state({ activeChildId: null })), false);
});
