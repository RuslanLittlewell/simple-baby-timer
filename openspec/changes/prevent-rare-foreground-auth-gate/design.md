## Context

See `proposal.md` for motivation and the delta spec for the behavior contract. The app has one Supabase client backed by AsyncStorage, an auth-state subscriber, a serialized synchronization coordinator, and an AppState listener. On foreground, `startAutoRefresh()` schedules an immediate tick but returns before that tick settles; `syncNow()` can therefore validate concurrently. A missing `getSession()` result currently maps directly to definitive auth loss, and the resulting local sign-out is invisible in server logs.

The existing auth generation protects some stale work, but a verified event only advances it when the coordinator previously considered the app unauthenticated. Consequently, `TOKEN_REFRESHED` for an already authenticated account is not a barrier against an older destructive check.

## Goals / Non-Goals

**Goals:**

- Establish one authoritative, single-flight recovery path used by foreground sync, auth callbacks, and protected actions.
- Make verified session observations monotonic barriers against older destructive work.
- Keep explicit logout immediate while requiring evidence before an unexpected missing session opens the gate.
- Cover race orderings with pure, deterministic tests where possible.

**Non-Goals:**

- Change Supabase token lifetimes, OAuth providers, redirect handling, or server configuration.
- Keep a session after refresh credentials are conclusively invalid.
- Persist a second token copy or add production analytics.
- Delay ordinary data synchronization once authentication is settled.

## Decisions

### Introduce a single-flight authoritative session check

Create one session-verification operation that all non-explicit auth decisions call. It first reads the initialized session, joins SDK refresh behavior when a session is present, validates the user, and attempts an explicit refresh only when the access token is rejected. A missing session without a conclusive refresh-credential error is treated as inconclusive rather than destructive.

Foreground handling will start auto-refresh and then call this operation through the existing serialized sync path. Protected child actions will call the same operation instead of reading `getSession()` directly. A fixed delay was rejected because it only changes race probability.

### Separate explicit logout from unexpected null-session events

Explicit logout advances a destructive auth epoch immediately and remains allowed to clear storage. `INITIAL_SESSION` or `SIGNED_OUT` without an explicit logout becomes a recovery signal: it schedules authoritative verification and opens the gate only if that verification confirms loss and its captured epoch is still current.

Treating every SDK `SIGNED_OUT` as user intent was rejected because the SDK also emits it during internal session removal.

### Advance the epoch on every verified session

Every session-bearing auth event advances the auth epoch, regardless of whether the account was already marked authenticated. Pending checks capture their epoch before asynchronous work and must re-check it before local sign-out, entitlement cleanup, or gate activation. Subscription resynchronization remains conditional on an unauthenticated-to-authenticated or account-change transition so routine refreshes do not trigger full sync loops.

Using account ID as the freshness key was rejected because token rotation for the same account must still invalidate older work.

### Confirm immediately before destructive local sign-out

The destructive path performs a final authoritative check after it wins the current epoch. It clears local credentials only when the same auth epoch still applies and the result remains definitive. This closes the time-of-check/time-of-use window between validation and `signOutLocal()`.

### Keep diagnostics credential-safe and development-only

Extend the existing allow-listed records with recovery source and stale-result disposition. Do not record session objects, identifiers, tokens, URLs, headers, emails, or raw errors. Existing development-only console emission remains unchanged; tests assert record sanitization.

## Risks / Trade-offs

- **[An unknown local storage failure may retain an unusable session temporarily]** → Protected backend calls still enforce authorization; retry verification on the next foreground or protected action.
- **[Advancing the epoch on every token refresh could cause useful sync work to abort]** → Capture the auth epoch only around destructive auth decisions; data sync should use stable account identity or restart through the existing coordinator.
- **[Calling refresh from several entry points could rotate tokens concurrently]** → Route every entry point through one single-flight verifier and rely on one Supabase client.
- **[A final verification adds latency to genuine forced logout]** → Explicit user logout bypasses recovery; only unexpected loss pays the extra check.

## Migration Plan

No stored-data or database migration is required. Ship the verifier, epoch changes, gate policy, action integration, and regression tests together. Rollback restores the former auth lifecycle without changing Supabase sessions or application data.
