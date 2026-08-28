## Context

The current single-flight synchronization owns the activity gate for its entire pass. That pass performs account checks, entitlement resolution, queued mutations, child-profile work, remote child discovery, current-month history for every child, and live-state refresh using mostly sequential awaits. History caching and range coordination are currently month-keyed.

## Goals / Non-Goals

**Goals:**

- Separate the activity-ready boundary from completion of the full synchronization pass.
- Minimize the critical remote history query to the active child's current local calendar week.
- Retain single-flight behavior, generation safety, cached presentation, and a bounded gate timeout.
- Keep lazy history navigation capable of loading every requested date.
- Avoid showing the activity gate or issuing a foreground history query when local critical data is less than 60 seconds old.

**Non-Goals:**

- Changing the Supabase schema or session row format.
- Removing account, entitlement, profile, queue, or other-child synchronization.
- Introducing a new global loading UI.

## Decisions

### Split critical readiness from full-pass completion

The synchronization coordinator will still own the complete background pass, but the activity gate will finish through a generation-safe critical-ready callback after the active child's current week and live state settle. Final pass completion remains a fallback that also releases the gate.

Alternative considered: retain one completion boundary and parallelize every request. This reduces total duration but still lets unrelated slow operations block activity controls.

### Resolve the active child before critical loading

After remote children are reconciled, the pass will select the current active child's latest store representation and run its weekly history fetch together with live-state refresh. If there is no remote active child, live refresh alone forms the critical stage.

Alternative considered: load all children in parallel. That increases network and merge contention and does not improve readiness for the visible child.

### Use local calendar weeks as cache and query units

History helpers will provide stable week keys and half-open `[start, end)` ranges. The existing range paginator, compound cursor, and in-flight coordinator will be reused with week keys. Calendar navigation will resolve all intersecting weeks, allowing ranges that span week boundaries.

Alternative considered: request an arbitrary rolling seven-day window. Calendar weeks produce stable reusable cache keys and predictable navigation behavior.

### Refresh cached critical data without clearing it

The current week foreground query uses refresh semantics but merges into local storage. Existing local sessions remain visible until remote results are applied. Older weeks use the registry to avoid repeated requests unless explicitly refreshed.

### Persist week freshness separately from loaded-state

The weekly registry will store a last-successful-refresh timestamp per remote child and week. A loaded marker answers whether local history exists; the timestamp answers whether a foreground network refresh is warranted. A week is foreground-fresh for 60 seconds. Only successful remote fetches advance the timestamp.

Alternative considered: treat every loaded week as indefinitely fresh. This minimizes requests but can leave cross-device changes stale without an explicit navigation refresh.

### Decide the activity gate before starting network work

At sync request time, the app will inspect the active child's current-week metadata. A normal foreground resume with a fresh week starts or continues background sync without moving activity status back to `syncing`. Missing or stale data starts the existing generation-safe gate. Forced events bypass freshness.

Alternative considered: start the gate and immediately finish it after reading storage. That still produces a visible loader flash and temporarily disables controls.

### Distinguish forced events from routine foreground resumes

Routine foreground transitions use freshness-aware synchronization. Authentication/account transitions, active-child changes, and explicit refresh operations force critical validation. The single-flight coordinator retains generation collapsing for both paths.

### Reuse remote identity and child discovery results

The pass obtains user identity once and passes or reuses it where child discovery needs it. Remote children are fetched once before critical reconciliation. A second fetch occurs only when background work created at least one new remote mapping.

Alternative considered: unconditional second reconciliation. It is simpler but duplicates a network request on the common path.

## Risks / Trade-offs

- [The background pass can update children after the gate opens] → Keep generation checks and store reconciliation; only the activity gate is decoupled.
- [A week boundary uses the device timezone] → Derive week bounds with local `Date` operations, matching calendar presentation.
- [Realtime/live refresh failure could delay readiness] → Settle the critical stage on success or failure and retain the existing safety timeout.
- [Changing cache-key granularity leaves old month markers unused] → Introduce a versioned weekly registry prefix; old keys remain harmless and can be removed by existing sync-state cleanup logic.
- [A 60-second cache can briefly hide changes made on another device] → Realtime remains active, forced refresh bypasses TTL, and routine background sync still refreshes after controls are available.
- [Persisted freshness could outlive cleared activity data] → Clear week timestamps with sync/account data and require both a loaded marker and fresh timestamp for the fast path.

## Migration Plan

Deploy the weekly helpers and registry key together with the synchronization split. No persistent activity data migration is required; weeks will be fetched and marked on demand. Rollback restores month loading and ignores the weekly registry keys.
