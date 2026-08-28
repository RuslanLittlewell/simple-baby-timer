## Why

On a real device, explicitly signing out can leave the app unable to establish a new authenticated session. Logout and OAuth sign-in are asynchronous flows that currently share global auth callbacks and fallback local sign-out behavior, so stale logout work or an incorrectly handled callback can clear or re-gate a newly created session.

## What Changes

- Make explicit logout a bounded transaction that cannot mutate or clear a session created by a later sign-in attempt.
- Make the auth gate support immediate reauthentication with Google or Apple after logout, including repeated attempts after cancellation or provider failure.
- Verify the newly exchanged Supabase session before dismissing the auth gate and navigating to the child list.
- Prevent stale `SIGNED_OUT`, account-check, sync-generation, or fallback sign-out completions from overriding a newer authenticated session.
- Keep the login controls recoverable: loading state must end on cancellation/error, and actionable sanitized diagnostics must identify the failed stage without exposing OAuth codes or tokens.
- Add regression coverage for logout followed by same-account login, different-account login, cancelled OAuth, failed exchange, and stale logout/sync completion races.

## Capabilities

### New Capabilities

- `reliable-post-logout-reauthentication`: User-visible and concurrency behavior required to sign in successfully immediately after explicit logout.

### Modified Capabilities

None. The related resilient auth lifecycle change is still unarchived and no matching capability exists in the main specifications.

## Impact

- `src/lib/supabase.ts`: logout completion semantics, OAuth exchange verification, and sanitized stage diagnostics.
- `src/hooks/use-sync.ts`: ordering between auth events, logout identity, sync generations, and a newly established session.
- `src/features/children/components/auth-form.tsx` and `src/app/_layout.tsx`: recoverable login state and safe gate dismissal/navigation.
- Existing Supabase OAuth providers and redirect configuration remain unchanged unless diagnostics prove a configuration defect.
- No database schema or persisted child/session format migration is expected.
