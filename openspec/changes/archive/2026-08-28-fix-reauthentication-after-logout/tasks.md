## 1. Reproduction and Diagnostics

- [x] 1.1 Review the exact Expo SDK 57 WebBrowser, Linking, and AppState behavior plus the installed Supabase Auth sign-out, PKCE exchange, and auth-event sequences before changing code.
- [x] 1.2 Extend the credential-safe auth diagnostics with post-logout stages and an auth/attempt generation, without logging callback URLs, OAuth codes, tokens, user objects, emails, or raw provider errors.
- [ ] 1.3 Reproduce logout followed by Google and Apple login on a physical device and identify whether failure occurs at provider launch, redirect delivery, code exchange, session verification, gate transition, or a stale completion.
- [ ] 1.4 Verify the configured application scheme and Supabase/provider redirect allow-lists only if diagnostics show that the callback is not delivered or accepted.

## 2. Session-Scoped Logout

- [x] 2.1 Add a monotonic, non-persisted auth generation that advances when a newer session becomes verified.
- [x] 2.2 Capture the initiating session/auth generation for explicit logout and make its local cleanup idempotent.
- [x] 2.3 Remove or guard fallback local sign-out so it cannot clear a session established after the logout began.
- [x] 2.4 Deduplicate repeated `SIGNED_OUT` effects for auth gate, PRO reset, sync-gate release, and purchaser reset.

## 3. Verified Reauthentication

- [x] 3.1 Give each OAuth attempt an identity and ignore late cancellation, error, or success completions from older attempts.
- [x] 3.2 Verify a usable Supabase session after callback exchange before returning OAuth success to the auth form.
- [x] 3.3 Route auth-listener and form success through one idempotent verified-session transition that closes the gate, navigates to children, and starts synchronization once.
- [x] 3.4 Reject stale account-check and sync-generation mutations when they were captured before the newly verified auth generation.
- [x] 3.5 Preserve existing different-account data isolation, notification defaults, and purchaser identification after successful reauthentication.

## 4. Recoverable Login UI

- [x] 4.1 Ensure the auth form clears busy state after provider cancellation, redirect failure, exchange failure, and session-verification failure.
- [x] 4.2 Keep Google and Apple buttons usable for repeated attempts without restarting the app and prevent stale attempts from changing the latest error/loading state.
- [x] 4.3 Show existing localized retryable auth messaging while keeping detailed failure stages limited to sanitized development diagnostics.

## 5. Regression Verification

- [x] 5.1 Add deterministic tests for normal logout, remote logout failure, duplicate `SIGNED_OUT`, same-account re-login, different-account re-login, cancellation, failed exchange, and missing verified session.
- [x] 5.2 Add race tests proving stale logout cleanup, account-check results, sync completions, and OAuth attempts cannot override a newer verified session.
- [x] 5.3 Run TypeScript, auth tests, strict OpenSpec validation, and iOS/Android production exports.
- [ ] 5.4 Validate repeated logout/login cycles with Google and Apple on a physical device, including cancellation followed by retry, before release.
