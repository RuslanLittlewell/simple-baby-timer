import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const childScreenUrl = new URL('../src/features/children/child-select-screen.tsx', import.meta.url);

test('confirmed session loss activates the global auth gate and stops the child action', () => {
  const source = readFileSync(childScreenUrl, 'utf8');
  const requestStart = source.indexOf('const requestAction');
  const requestEnd = source.indexOf('const pickChild', requestStart);
  const requestSource = source.slice(requestStart, requestEnd);
  const verification = requestSource.indexOf("verifyAccount('protected-action')");
  const signedOutCheck = requestSource.indexOf("account !== 'ok'", verification);
  const confirmation = requestSource.indexOf('confirmAccountLoss(verificationEpoch)', signedOutCheck);
  const gateActivation = requestSource.indexOf('setAuthRequired(true)', signedOutCheck);
  const earlyReturn = requestSource.indexOf('return;', gateActivation);

  assert.ok(verification >= 0);
  assert.ok(signedOutCheck > verification);
  assert.ok(confirmation > signedOutCheck);
  assert.ok(gateActivation > confirmation);
  assert.ok(earlyReturn > gateActivation);
});

test('signed-in join and share routing remains connected', () => {
  const source = readFileSync(childScreenUrl, 'utf8');

  assert.match(source, /if \(action\.type === ['"]share['"] && !proActive\)/);
  assert.match(source, /requestPro\(action\)/);
  assert.match(source, /runAction\(action\)/);
  assert.match(source, /else setEnteringCode\(true\)/);
  assert.match(source, /setSharingChildId\(action\.childId\)/);
});

test('duplicate auth modal and its pending-action connections are removed', () => {
  const source = readFileSync(childScreenUrl, 'utf8');
  const modalUrl = new URL(
    '../src/features/children/components/auth-modal.tsx',
    import.meta.url,
  );

  assert.equal(existsSync(modalUrl), false);
  assert.doesNotMatch(source, /AuthModal|auth-modal|pendingAction|setPendingAction/);
  assert.doesNotMatch(source, /syncNow/);
});

test('onboarding and root authentication still use the shared auth form', () => {
  const rootSource = readFileSync(new URL('../src/app/_layout.tsx', import.meta.url), 'utf8');
  const onboardingSource = readFileSync(
    new URL('../src/features/onboarding/auth-screen.tsx', import.meta.url),
    'utf8',
  );
  const authFormUrl = new URL(
    '../src/features/children/components/auth-form.tsx',
    import.meta.url,
  );

  assert.equal(existsSync(authFormUrl), true);
  assert.match(rootSource, /onboardingComplete && authRequired/);
  assert.match(rootSource, /<OnboardingAuthScreen/);
  assert.match(onboardingSource, /<AuthForm onSignedIn=\{onSignedIn\}/);
});
