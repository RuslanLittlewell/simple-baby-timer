## Why

Returning to the foreground can very rarely show the global sign-in gate even though Supabase has successfully refreshed the session and continues accepting authenticated requests. The current client treats a momentarily missing local session or a lone `SIGNED_OUT` callback as definitive auth loss, so a stale foreground check can locally erase a valid refreshed session.

## What Changes

- Serialize foreground session recovery and account validation so validation cannot race the initial auto-refresh tick.
- Require confirmed credential loss before performing destructive local sign-out or showing the global auth gate.
- Make every verified session observation invalidate older missing-session and logout work, including `TOKEN_REFRESHED` for an already authenticated account.
- Route action-level authentication checks through the same verified recovery policy instead of opening the gate after one empty `getSession()` result.
- Add deterministic regression tests for refresh/check ordering, stale auth generations, transient missing sessions, and genuine logout.
- Extend credential-safe lifecycle diagnostics so tests and development logs distinguish explicit logout, confirmed auth loss, and rejected stale work.

## Capabilities

### New Capabilities

- `resilient-auth-session-lifecycle`: Defines authoritative session recovery, foreground validation ordering, stale-work rejection, and global auth-gate behavior.

### Modified Capabilities

None.

## Impact

- `src/hooks/use-sync.ts`: foreground lifecycle sequencing, auth-event handling, and gate activation.
- `src/lib/supabase.ts`: non-destructive session recovery and definitive auth-loss verification.
- `src/lib/auth-generation.ts`: generation semantics for verified sessions and stale work.
- `src/features/children/child-select-screen.tsx`: action-level authentication verification.
- `src/lib/auth-diagnostics.ts`: privacy-safe lifecycle evidence.
- Authentication lifecycle tests; no database, OAuth-provider, or persisted-data migration.
