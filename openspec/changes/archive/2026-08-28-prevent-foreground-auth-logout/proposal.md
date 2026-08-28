## Why

Returning to the app after locking a real device can incorrectly present the sign-in gate even though the user did not sign out and the account still exists. Foreground network recovery, token refresh, and account synchronization currently treat too broad a set of transient failures as definitive session loss, making an intermittent connectivity or rate-limit response destructive.

## What Changes

- Manage Supabase token auto-refresh explicitly from the React Native `AppState` lifecycle, starting it while active and stopping it while inactive or backgrounded.
- Distinguish confirmed authentication loss from transient, rate-limited, timed-out, server, and unknown account-check failures.
- Preserve the current authenticated UI and local data after a single inconclusive foreground account check; show the auth gate only after a definitive session/account rejection.
- Coalesce repeated foreground activation signals so they do not create bursts of account checks or token refresh work.
- Add structured development diagnostics for AppState transitions, auth events, account-check classifications, and sync generations without recording access tokens, refresh tokens, authorization headers, user email, or other credentials.
- Add regression coverage for resume, offline, rate-limit, expired-token refresh, revoked-session, and repeated-activation scenarios.

## Capabilities

### New Capabilities

- `resilient-auth-session-lifecycle`: Authentication continuity, foreground token-refresh lifecycle, definitive logout classification, request coalescing, and privacy-safe diagnostics for React Native app resume.

### Modified Capabilities

None. No authentication lifecycle capability currently exists in the main OpenSpec specifications.

## Impact

- `src/lib/supabase.ts`: account-check result classification and auth diagnostics.
- `src/hooks/use-sync.ts`: AppState-driven auto-refresh, foreground request coalescing, auth event handling, and gate policy.
- `src/app/_layout.tsx` and the app store auth state may be affected if an explicit intermediate or verification state is required before presenting the sign-in gate.
- Supabase Auth remains the identity provider; no database schema, OAuth provider, persisted child-data, or public API migration is expected.
- Tests will need controllable AppState, Supabase auth events, account responses, and foreground-sync scheduling.
