## Context

See `proposal.md` for motivation and `specs/global-auth-gate/spec.md` for behavior. `ChildSelectScreen` currently checks `getIsSignedIn()` before share and join-code actions. A missing session creates local `pendingAction`, which opens `AuthModal`; successful sign-in performs a fresh sync and resumes or paywalls the action. Separately, the root layout already renders `OnboardingAuthScreen` whenever onboarding is complete and `authRequired` is true.

## Goals / Non-Goals

**Goals:**

- Make the root authentication gate the only post-onboarding sign-in UI.
- Remove modal-specific state, rendering, callback, and source file.
- Preserve valid-session routing for share, join code, and Pro entitlement.
- Ensure an action-level missing-session check immediately activates the root gate.

**Non-Goals:**

- Automatically resuming the interrupted action after sign-in.
- Changing onboarding authentication, providers, `AuthForm`, session monitoring, or root gate presentation.
- Changing share, join-code, paywall, synchronization, or entitlement behavior for signed-in users.

## Decisions

### Activate the existing store-backed root gate

`requestAction` will call `useAppStore.getState().setAuthRequired(true)` when `getIsSignedIn()` is false, then return. The root layout already observes this flag and overlays `OnboardingAuthScreen` for completed onboarding.

Direct navigation to a new auth route was rejected because it would duplicate the existing root gate and require additional return-path handling.

### Remove pending-action continuation

Delete the `PendingAction` local state used only for modal visibility and post-sign-in resumption. The protected action is not retained; after authentication the existing root callback returns to `/children`, where the user can retry it.

Moving pending action into global state was rejected because the user explicitly requested removal of the modal and its connections, and automatic continuation adds cross-screen lifecycle complexity.

### Keep request routing otherwise unchanged

Once signed-in status succeeds, share still checks Pro before opening, join code still opens directly, and the same `runAction`/`requestPro` paths remain. The modal-specific `syncNow` call is removed because the global authentication/session flow already initiates sync for a verified session.

### Delete only the modal wrapper

Remove `auth-modal.tsx`, but keep `auth-form.tsx` because onboarding and the root gate use it through `OnboardingAuthScreen`.

## Risks / Trade-offs

- [User must tap the protected action again after sign-in] → This is explicit specified behavior and avoids hidden cross-screen pending state.
- [The root gate might not render if onboarding is incomplete] → Protected child actions are only reachable after onboarding, and the root condition remains `onboardingComplete && authRequired`.
- [A transient sign-in check could activate the gate] → This matches the current modal behavior for the same check but presents the canonical UI.
- [Removing the modal sync call could delay data refresh] → Verified-session handling in `useSync` already starts fresh synchronization; retain tests/structural checks for that ownership.

## Migration Plan

1. Replace missing-session pending state with root gate activation.
2. Remove modal import, render block, callback, and unused `syncNow` connection.
3. Delete `auth-modal.tsx` and verify `AuthForm` remains referenced by onboarding.
4. Run focused auth/child routing tests, TypeScript, lint, and strict OpenSpec validation.

Rollback restores the modal file and local pending-action flow; no data migration is involved.
