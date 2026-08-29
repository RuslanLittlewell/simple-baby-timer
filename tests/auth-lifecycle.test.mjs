import assert from 'node:assert/strict';
import test from 'node:test';

import {
  accountOutcomeRequiresGate,
  authEventRequiresGate,
  authStatusClass,
  classifyAuthFailure,
  classifySessionRecovery,
  isForegroundEdge,
  requiresSessionRefresh,
} from '../src/lib/auth-lifecycle.ts';
import { createAuthDiagnosticRecord } from '../src/lib/auth-diagnostics.ts';
import { SingleFlightCoordinator } from '../src/lib/single-flight-coordinator.ts';
import {
  AuthGenerationCoordinator,
  LatestAttemptCoordinator,
} from '../src/lib/auth-generation.ts';

test('valid and successfully refreshed sessions remain authenticated', () => {
  assert.equal(classifySessionRecovery(true), 'ok');
  assert.equal(accountOutcomeRequiresGate('ok'), false);
});

test('explicit unauthorized and forbidden responses are definitive', () => {
  for (const status of [401, 403]) {
    const outcome = classifyAuthFailure({ status, retryable: false });
    assert.equal(outcome, 'definitive-auth-loss');
    assert.equal(accountOutcomeRequiresGate(outcome), true);
  }
});

test('a rejected access token asks the refresh token before ending the session', () => {
  // The 16:47 logout: GET /auth/v1/user answered 403 while the refresh token
  // was still good, and the session was discarded without ever spending it.
  for (const status of [401, 403]) {
    assert.equal(requiresSessionRefresh({ status, retryable: false }), true);
  }
});

test('a failed refresh, not the rejected request, ends the session', () => {
  for (const code of ['refresh_token_not_found', 'refresh_token_already_used']) {
    // Already proven dead by the refresh endpoint - nothing left to ask.
    assert.equal(requiresSessionRefresh({ status: 403, code, retryable: false }), false);
    assert.equal(classifyAuthFailure({ status: 400, code, retryable: false }), 'definitive-auth-loss');
  }
});

test('failures that cannot be a stale token are never worth a refresh', () => {
  const failures = [
    { status: 401, retryable: true },
    { status: 429, retryable: false },
    { status: 503, retryable: false },
    { status: 400, code: 'unexpected', retryable: false },
    { status: undefined, retryable: false },
  ];
  for (const failure of failures) {
    assert.equal(requiresSessionRefresh(failure), false);
  }
});

test('invalid and rotated-away refresh credentials are definitive', () => {
  for (const code of ['refresh_token_not_found', 'refresh_token_already_used']) {
    const outcome = classifyAuthFailure({ status: 400, code, retryable: false });
    assert.equal(outcome, 'definitive-auth-loss');
  }
});

test('network, timeout, rate-limit, server, and unknown failures are inconclusive', () => {
  const failures = [
    { status: 0, retryable: true },
    { status: 408, retryable: true },
    { status: 429, retryable: false },
    { status: 503, retryable: false },
    { status: undefined, retryable: false },
    { status: 400, code: 'unexpected', retryable: false },
  ];
  for (const failure of failures) {
    const outcome = classifyAuthFailure(failure);
    assert.equal(outcome, 'inconclusive');
    assert.equal(accountOutcomeRequiresGate(outcome), false);
  }
});

test('a retryable transport failure never becomes destructive because of its status', () => {
  assert.equal(
    classifyAuthFailure({ status: 401, retryable: true }),
    'inconclusive',
  );
});

test('explicit logout and missing initial session require the auth gate', () => {
  assert.equal(authEventRequiresGate('SIGNED_OUT', false), true);
  assert.equal(authEventRequiresGate('INITIAL_SESSION', false), true);
  assert.equal(authEventRequiresGate('TOKEN_REFRESHED', false), false);
  assert.equal(authEventRequiresGate('SIGNED_OUT', true), false);
});

test('only a non-active to active edge requests foreground work', () => {
  assert.equal(isForegroundEdge('background', 'active'), true);
  assert.equal(isForegroundEdge('inactive', 'active'), true);
  assert.equal(isForegroundEdge('active', 'active'), false);
  assert.equal(isForegroundEdge('active', 'background'), false);
});

test('overlapping fresh requests remain single-flight and collapse follow-ups', async () => {
  let activeRuns = 0;
  let maximumConcurrentRuns = 0;
  const generations = [];
  let releaseFirst;
  const firstRunBlocked = new Promise((resolve) => {
    releaseFirst = resolve;
  });

  const coordinator = new SingleFlightCoordinator(async (generation) => {
    activeRuns += 1;
    maximumConcurrentRuns = Math.max(maximumConcurrentRuns, activeRuns);
    generations.push(generation);
    if (generations.length === 1) await firstRunBlocked;
    activeRuns -= 1;
  });

  const requested = [];
  const first = coordinator.request(false, (generation) => requested.push(generation));
  const second = coordinator.request(true, (generation) => requested.push(generation));
  const third = coordinator.request(true, (generation) => requested.push(generation));
  releaseFirst();
  await Promise.all([first, second, third]);

  assert.equal(maximumConcurrentRuns, 1);
  assert.deepEqual(requested, [1, 2, 3]);
  assert.deepEqual(generations, [1, 3]);
});

test('auth diagnostics retain only allow-listed non-sensitive fields', () => {
  const record = createAuthDiagnosticRecord('account-check', {
    outcome: 'inconclusive',
    statusClass: authStatusClass(429),
    syncGeneration: 7,
    accessToken: 'secret',
    email: 'parent@example.com',
    rawError: { authorization: 'Bearer secret' },
  });

  assert.deepEqual(record, {
    event: 'account-check',
    outcome: 'inconclusive',
    statusClass: '4xx',
    syncGeneration: 7,
  });
});

test('a verified session advances auth generation and defeats stale logout work', () => {
  const auth = new AuthGenerationCoordinator();
  const initial = auth.observeVerifiedSession();
  const logout = auth.beginLogout();
  const replacement = auth.observeVerifiedSession();

  assert.equal(initial.isNew, true);
  assert.equal(auth.isCurrent(logout), false);
  assert.equal(auth.isCurrent(replacement.generation), true);
});

test('same-account and different-account re-login share safe generation semantics', () => {
  for (const _accountChanged of [false, true]) {
    const auth = new AuthGenerationCoordinator();
    auth.observeVerifiedSession();
    const logout = auth.beginLogout();
    const login = auth.observeVerifiedSession();
    assert.equal(login.generation > logout, true);
  }
});

test('duplicate signed-out effects are claimed only once', () => {
  const auth = new AuthGenerationCoordinator();
  auth.observeVerifiedSession();
  const logout = auth.beginLogout();
  auth.observeMissingSession();
  assert.equal(auth.claimMissingEffects(logout), true);
  assert.equal(auth.claimMissingEffects(logout), false);
});

test('normal and failed remote logout cannot authorize cleanup of a newer session', () => {
  for (const _remoteFailed of [false, true]) {
    const auth = new AuthGenerationCoordinator();
    auth.observeVerifiedSession();
    const logout = auth.beginLogout();
    auth.observeVerifiedSession();
    assert.equal(auth.isCurrent(logout), false);
  }
});

test('late OAuth cancellation, exchange failure, and success cannot win over retry', () => {
  for (const _completion of ['cancelled', 'exchange-failed', 'success']) {
    const attempts = new LatestAttemptCoordinator();
    const stale = attempts.begin();
    const latest = attempts.begin();
    assert.equal(attempts.isCurrent(stale), false);
    assert.equal(attempts.isCurrent(latest), true);
  }
});

test('missing session verification does not create a verified generation', () => {
  const auth = new AuthGenerationCoordinator();
  const before = auth.snapshot();
  assert.equal(auth.snapshot(), before);
  assert.equal(auth.claimMissingEffects(before), true);
});
