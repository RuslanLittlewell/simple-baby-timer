## Context

See `proposal.md` for the observed real-device failure and `specs/resilient-auth-session-lifecycle/spec.md` for the behavior contract. The app persists the Supabase session in AsyncStorage, enables automatic refresh in the client, starts a full synchronization at mount and on every `AppState` transition to `active`, and immediately sets the global auth gate whenever an auth callback carries no session.

`checkAccount()` currently classifies only recognized retryable fetch errors and 5xx responses as temporary. Every other error becomes `missing`; the sync pass then calls local sign-out, which removes the stored session and emits `SIGNED_OUT`. This makes responses such as 429 and unclassified mobile-network failures destructive. Supabase's React Native lifecycle guidance also expects the app to explicitly start proactive refresh while active and stop it outside the foreground.

## Goals / Non-Goals

**Goals:**

- Establish one owner for the AppState-to-auth-refresh lifecycle.
- Make definitive versus inconclusive auth outcomes explicit and conservative.
- Keep the existing authenticated UI and local data usable through temporary failures.
- Integrate auth validation with the existing serialized sync generations rather than creating a second concurrency lane.
- Produce useful, credential-safe development evidence for future real-device reports.

**Non-Goals:**

- Change OAuth providers, redirect handling, Supabase schema, or token lifetime configuration.
- Keep a genuinely revoked or deleted account signed in.
- Persist a second copy of access or refresh tokens outside Supabase storage.
- Add analytics or transmit auth diagnostics to a third-party service.
- Redesign the login screen or foreground Activity loading overlay.

## Decisions

### Drive proactive refresh from the existing AppState subscription

The single lifecycle subscription in `useSync()` will start Supabase auto-refresh when the current or next state is `active` and stop it for `inactive` and `background`. Initial setup must account for the current AppState so a cold launch does not wait for a transition event. Foreground sync is requested only after refresh has been started, while backgrounding must not clear the persisted session.

Keeping lifecycle control beside synchronization avoids multiple listeners with conflicting ownership. Leaving continuous non-browser auto-refresh unmanaged was rejected because suspended mobile timers can resume unpredictably and Supabase explicitly exposes lifecycle methods for this environment.

### Use a conservative account-check result model

Account validation will return a result that separates `valid`, `definitive-auth-loss`, and `temporary/inconclusive` outcomes. Only explicit authentication rejection—such as a relevant 401/403 response from authenticated user validation or an auth-client error explicitly identifying an invalid/revoked refresh credential—qualifies as definitive. A missing local session is definitive only when initialization has completed and the absence is not part of an in-flight recovery or foreground refresh.

429, timeout, retryable transport errors, 5xx, and unknown statuses/errors remain inconclusive. The default branch must fail safe by retaining auth, rather than fail closed by deleting the session. A broad “all other errors mean missing account” branch was rejected because new platform or SDK error shapes would silently become logout paths.

### Separate auth observation from destructive logout policy

The auth state callback will still update subscription eligibility when a session is present, but it will not treat every null-session callback as independently sufficient to destroy account state. Explicit user sign-out remains immediate. Unexpected `SIGNED_OUT` or null-session observations are correlated with the client lifecycle and definitive validation outcome before the global gate changes; initialization must distinguish `INITIAL_SESSION` from later events.

The store's `authRequired` value remains the final UI signal. If needed, a module-local verification state can represent `unknown/checking/trusted/invalid` so the UI does not need a new persisted field. Adding a fixed delay before every auth gate was rejected because it hides races without classifying them and slows legitimate logout.

### Reuse the serialized sync coordinator for deduplication

Foreground validation remains inside `performSyncPass()` and uses the existing generation-based single-flight runner. AppState handling will suppress duplicate `active` notifications that do not represent a transition from a non-active state. Auth callbacks during the same refresh/foreground cycle must join or request at most the coordinator's existing single follow-up generation rather than create an independent account-check loop.

This preserves the Activity sync gate contract and avoids another mutex. Tests should assert maximum concurrency and request count, not only final state.

### Emit sanitized structured development diagnostics

A small auth diagnostic helper will emit stable event records in development builds. Records include an event name, prior/next AppState, auth event type, classified outcome or HTTP status class, and sync generation where applicable. It accepts only an allow-listed payload assembled by callers; it never accepts a session, user object, URL, headers, token, email, provider response, or raw error body.

Development-only local logging is chosen over production telemetry because the current requirement is reproduction and diagnosis without introducing a new data processor. Raw error logging was rejected because auth errors can contain sensitive request context.

## Risks / Trade-offs

- **[A conservative unknown-error policy can temporarily retain a revoked session]** → Protected backend operations still enforce server authorization; retry validation later, and switch to the gate immediately on a definitive rejection.
- **[Supabase may emit `SIGNED_OUT` after internally removing an invalid refresh session]** → Correlate the event with explicit logout and refresh/validation outcome, and cover the installed SDK's event sequence in tests before finalizing the listener policy.
- **[AppState can move through `inactive` briefly during system UI transitions]** → Treat every non-active state as a reason to stop proactive refresh but request foreground validation only on a real non-active-to-active edge.
- **[Coalescing may skip a useful duplicate request]** → Permit one serialized follow-up when auth state changes during an in-flight generation; never run account checks concurrently.
- **[Development logs may become noisy]** → Use concise stable event names and log only lifecycle/auth boundaries rather than every sync operation.

## Migration Plan

No database or persisted-state migration is required. Deploy the client-side lifecycle, classification, gate policy, diagnostics, and tests together. Existing stored Supabase sessions continue using the same AsyncStorage keys.

Rollback restores the previous refresh and account-check behavior without changing stored user data, although it also restores the intermittent logout risk. Validate on a physical iOS device with lock/unlock, delayed network recovery, airplane mode, expired access token, repeated active events, explicit logout, and revoked credentials before release.
