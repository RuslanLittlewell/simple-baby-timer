## 1. Authoritative Session Recovery

- [x] 1.1 Add a single-flight session verifier that distinguishes verified, definitive-loss, and inconclusive outcomes without clearing credentials
- [x] 1.2 Make foreground authentication settle through the verifier before account synchronization can make a gate decision
- [x] 1.3 Add a final current-epoch verification immediately before any unexpected destructive local sign-out

## 2. Auth Epoch and Gate Policy

- [x] 2.1 Advance the auth epoch on every verified session event while preserving separate transition information for sync subscription work
- [x] 2.2 Route unexpected `INITIAL_SESSION` and `SIGNED_OUT` events through authoritative recovery and reject stale results
- [x] 2.3 Keep explicit user logout immediate and distinct from SDK-originated missing-session recovery

## 3. Authenticated Actions and Diagnostics

- [x] 3.1 Replace the child action's direct `getSession()` gate decision with authoritative session verification
- [x] 3.2 Extend allow-listed lifecycle diagnostics with recovery source and stale-result disposition without sensitive values

## 4. Regression Verification

- [x] 4.1 Add deterministic tests for successful refresh winning over older missing-session and destructive-check work
- [x] 4.2 Add tests for transient absence, unexpected signed-out recovery, protected-action recovery, and confirmed credential loss
- [x] 4.3 Run focused authentication tests, the full test suite, type checking, and strict OpenSpec validation
