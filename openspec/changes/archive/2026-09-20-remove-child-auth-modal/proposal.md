## Why

Authentication is already mandatory during onboarding and session loss is handled by the root-level `authRequired` gate. The child-selection screen's separate `AuthModal` duplicates that flow, introduces a race-dependent second login UI, and maintains local pending-action state solely for the duplicate modal.

## What Changes

- Remove the child-selection `AuthModal` component and its import/render connections.
- Remove local `pendingAction` state and the modal-specific post-sign-in synchronization/resume callback.
- When a protected child action detects no signed-in session, activate the existing global `authRequired` gate.
- Keep signed-in share, join-code, and Pro-paywall behavior unchanged.
- After reauthentication, return to the children screen; the user can retry the original protected action instead of it being resumed automatically.
- Keep the onboarding and root session-loss authentication screens unchanged.

## Capabilities

### New Capabilities

- `global-auth-gate`: Defines use of the root authentication gate when a protected in-app action discovers a missing session.

### Modified Capabilities

None.

## Impact

- Removes `src/features/children/components/auth-modal.tsx`.
- Simplifies `src/features/children/child-select-screen.tsx` state and action routing.
- Reuses `useAppStore.setAuthRequired` and the existing root `OnboardingAuthScreen`.
- Removes no authentication provider logic because both flows already share `AuthForm`.
- No persisted-data, API, dependency, or translation migration is required.
