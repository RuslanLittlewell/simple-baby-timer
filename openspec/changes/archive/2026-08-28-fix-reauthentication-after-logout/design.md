## Context

See `proposal.md` for the real-device failure and `specs/reliable-post-logout-reauthentication/spec.md` for the behavioral contract. The auth gate appears from the global `SIGNED_OUT` listener before the caller of `signOut()` necessarily finishes. The wrapper can then run fallback local sign-out after a remote error, while OAuth exchange, auth callbacks, sync generations, purchaser identity, gate dismissal, and navigation all execute asynchronously.

The current auth form trusts the boolean returned by the OAuth helper and invokes `onSignedIn()` immediately. The root callback independently clears `authRequired`, navigates, and requests fresh synchronization, while the global auth listener can perform the same gate transition from `SIGNED_IN`. There is no explicit identity tying logout cleanup or sync results to the auth session generation that created them.

## Goals / Non-Goals

**Goals:**

- Make logout and reauthentication ordered and repeatable on a real device.
- Guarantee that a newer verified session wins over every older logout/check/sync completion.
- Establish one authoritative success boundary for closing the gate and navigating.
- Keep provider cancellation and failures retryable without restarting the app.
- Capture enough sanitized diagnostics to identify the failing stage.

**Non-Goals:**

- Change Google or Apple provider configuration without evidence that configuration is invalid.
- Store OAuth codes or duplicate Supabase credentials.
- Redesign the auth screen or alter account data-isolation rules.
- Merge or archive the still-active foreground-auth change as part of this work.

## Decisions

### Reproduce and instrument the exact post-logout sequence first

Before altering behavior, add stage-level diagnostics and reproduce `signOut → SIGNED_OUT → provider launch → redirect → exchange → SIGNED_IN → verification → navigation` on a physical device. Record only stage, generation, event name, result class, and session presence. This distinguishes redirect/configuration failure from a stale cleanup race and prevents fixing the wrong layer.

### Introduce a monotonic auth generation

Maintain a non-persisted auth generation owned by the auth lifecycle. Explicit logout captures its starting generation; every successfully verified new session advances the generation. Async logout fallback, account-check, auth-gate, purchaser-reset, and post-auth navigation effects must verify that their captured generation is still current before mutating state.

A time delay was rejected because it cannot guarantee ordering. Comparing user identifiers alone was rejected because the same account may sign back in and still receive a distinct newer session.

### Make logout cleanup session-scoped and idempotent

The logout wrapper will avoid blindly issuing a second local sign-out after the SDK has already removed the initiating session. If fallback cleanup is required, it first verifies that the current auth generation/session is still the one being logged out. Repeated `SIGNED_OUT` events for the same logout are handled once for gate and purchaser-reset effects.

### Verify session before reporting OAuth success

The OAuth helper will return success only after code/token exchange succeeds and a subsequent session read confirms a usable session. The UI callback will not infer success merely from receiving a redirect. Gate dismissal and navigation will have one idempotent coordinator keyed to the verified auth generation; the auth listener may signal readiness, but duplicate callbacks cannot trigger competing transitions.

### Keep the form retryable on every non-success path

Auth form busy state is finalized for cancellation and every thrown stage error. A new attempt receives a new attempt identity so a late completion from an older browser session cannot change the latest attempt's busy/error state. Existing generic translated messaging remains, supplemented by a sanitized stage class in development diagnostics.

### Reuse and extend deterministic auth tests

Extend the existing pure policy and single-flight tests with an auth-generation coordinator and modeled OAuth attempt outcomes. Add integration-level tests around logout fallback and gate success callbacks using mocked auth operations. Physical-device validation covers universal-link delivery and browser-session behavior that unit tests cannot reproduce.

## Risks / Trade-offs

- **[The actual fault may be provider redirect configuration rather than concurrency]** → Instrument and reproduce before choosing the final code path; keep configuration inspection as an explicit task.
- **[Generation checks can suppress required cleanup]** → Suppress only mutations targeting an older generation; server-side revocation can finish independently without clearing current local auth.
- **[Both auth listener and form observe success]** → Route both through one idempotent verified-session transition.
- **[A physical-device-only callback issue may evade automation]** → Require logout/reauth validation on device for Google and Apple before marking the change complete.

## Migration Plan

No database or persisted-state migration is required. Auth generations exist only for the running app process. Deploy logout scoping, verified success coordination, retryable form handling, diagnostics, and tests together. Rollback restores the prior callbacks and logout wrapper without altering stored child data or the Supabase schema.
