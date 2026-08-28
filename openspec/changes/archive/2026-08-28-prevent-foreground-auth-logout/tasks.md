## 1. Auth Outcome Classification

- [x] 1.1 Review the exact Expo SDK 57 AppState lifecycle guidance and the installed Supabase Auth client's React Native refresh/error behavior before changing code.
- [x] 1.2 Replace the broad account-check fallback with explicit valid, definitive-auth-loss, and temporary/inconclusive outcomes.
- [x] 1.3 Classify 429, timeout, retryable network, 5xx, and unknown errors as non-destructive while limiting definitive loss to validated unauthorized/forbidden or invalid-refresh cases.
- [x] 1.4 Ensure local sign-out and account-data gating are invoked only for explicit user logout or a definitive authentication-loss outcome.

## 2. React Native Auth Lifecycle

- [x] 2.1 Add one AppState owner that starts Supabase proactive refresh in the active state and stops it in inactive/background states, including correct cold-start initialization and cleanup.
- [x] 2.2 Order foreground validation after refresh startup without discarding the persisted session during background transitions.
- [x] 2.3 Track the previous AppState and suppress duplicate `active` notifications that do not represent a new foreground edge.
- [x] 2.4 Coordinate auth callbacks with the existing sync generation runner so overlapping signed-in/token-refreshed/foreground triggers cause no concurrent account checks and at most one required follow-up pass.

## 3. Auth Gate Policy

- [x] 3.1 Distinguish initial session recovery, explicit user sign-out, definitive invalidation, and unexpected null-session auth events before changing `authRequired`.
- [x] 3.2 Preserve the authenticated interface, local children, activity history, timers, and PRO state through a single temporary or inconclusive foreground validation failure.
- [x] 3.3 Keep explicit sign-out and confirmed revoked, invalid, or deleted account flows immediate and verify they still present the login experience.
- [x] 3.4 Ensure temporary auth outcomes release the bounded foreground Activity sync gate through its existing offline/fail-open policy.

## 4. Privacy-Safe Diagnostics

- [x] 4.1 Add a development-only structured auth diagnostic helper with an allow-listed schema for lifecycle transitions, auth event names, result classes, status classes, and sync generations.
- [x] 4.2 Instrument AppState, auth callbacks, account checks, and foreground sync boundaries without passing sessions, user objects, raw error bodies, URLs, headers, tokens, emails, or provider payloads to the logger.
- [x] 4.3 Verify representative diagnostics are sufficient to correlate one lock/unlock sequence and contain no credentials or direct user identifiers.

## 5. Regression Verification

- [x] 5.1 Add deterministic tests for valid resume, delayed connectivity, offline mode, timeout, 429, 5xx, unknown errors, expired access-token refresh, invalid refresh credentials, 401/403 rejection, and explicit logout.
- [x] 5.2 Add concurrency tests proving repeated `active` events and overlapping auth/sync triggers run at most one account check concurrently and do not produce a request burst.
- [x] 5.3 Verify temporary failures never call local sign-out, clear account data, reset purchaser state, or present the auth gate, while definitive failures do.
- [ ] 5.4 Run TypeScript and project validation, then test physical-device lock/unlock with normal connectivity, delayed network recovery, and airplane mode before release.
