## 1. Global Gate Routing

- [x] 1.1 Activate the existing global `authRequired` gate when a protected child action detects no signed-in session
- [x] 1.2 Preserve signed-in join-code, share-child, and Pro-paywall routing
- [x] 1.3 Remove local pending-action state and automatic post-sign-in action resumption

## 2. Remove Duplicate Modal

- [x] 2.1 Remove the `AuthModal` import, render block, sign-in callback, and modal-only sync connection from the child screen
- [x] 2.2 Delete `auth-modal.tsx` while preserving the shared `AuthForm` used by onboarding and the root gate
- [x] 2.3 Verify no source or test references to `AuthModal`, `auth-modal`, or modal pending-action state remain

## 3. Verification

- [x] 3.1 Add focused tests for missing-session gate activation and signed-in action routing
- [x] 3.2 Add structural tests confirming the duplicate modal is removed and root/onboarding authentication remains connected
- [x] 3.3 Run focused auth tests, TypeScript, lint, strict OpenSpec validation, and diff checks
