## Context

The current single-flight synchronization owns the activity gate for its entire pass. That pass performs account checks, entitlement resolution, queued mutations, child-profile work, remote child discovery, current-month history for every child, and live-state refresh using mostly sequential awaits. History caching and range coordination are currently month-keyed.

## Goals / Non-Goals

**Goals:**

- Separate the activity-ready boundary from completion of the full synchronization pass.
- Minimize the critical remote history query to the active child's current local day.
- Retain single-flight behavior, generation safety, cached presentation, and a bounded gate timeout.
- Keep lazy history navigation capable of loading every requested date.
- Avoid showing the activity gate or issuing a foreground history query when today's local critical data is less than 60 seconds old.

**Non-Goals:**

- Changing the Supabase schema or session row format.
- Removing account, entitlement, profile, queue, or other-child synchronization.
- Introducing a new global loading UI.

## Decisions

### Split critical readiness from full-pass completion

The synchronization coordinator will still own the complete background pass, but the activity gate will finish through a generation-safe critical-ready callback after the active child's current day and live state settle. Final pass completion remains a fallback that also releases the gate.

Alternative considered: retain one completion boundary and parallelize every request. This reduces total duration but still lets unrelated slow operations block activity controls.

### Resolve the active child before critical loading

After remote children are reconciled, the pass will select the current active child's latest store representation and run an exact local-day history fetch together with live-state refresh. If there is no remote active child, live refresh alone forms the critical stage.

Alternative considered: load all children in parallel. That increases network and merge contention and does not improve readiness for the visible child.

### Use local calendar weeks as cache and query units

History helpers will provide stable week keys and half-open `[start, end)` ranges. The existing range paginator, compound cursor, and in-flight coordinator will be reused with week keys. Calendar navigation will resolve all intersecting weeks, allowing ranges that span week boundaries.

Alternative considered: request an arbitrary rolling seven-day window. Calendar weeks produce stable reusable cache keys and predictable navigation behavior.

### Refresh cached critical data without clearing it

The current-day foreground query uses refresh semantics but merges into local storage. Existing local sessions remain visible until remote results are applied. After the gate is released, the weekly loader fills any missing remainder of the current week; older weeks remain lazy.

### Persist day freshness separately from weekly loaded-state

The critical registry will store a last-successful-refresh timestamp per remote child and local calendar day. The timestamp answers whether today's foreground network refresh is warranted; weekly loaded markers continue to control lazy history. A day is foreground-fresh for 60 seconds. Only a successful exact-day remote fetch advances the timestamp.

Alternative considered: use the weekly loaded marker for readiness. That keeps the loader dependent on a seven-day query and cannot distinguish whether today's critical data is fresh.

### Decide the activity gate before starting network work

At sync request time, the app will inspect the active child's current-day metadata. A normal foreground resume with a fresh day starts or continues background sync without moving activity status back to `syncing`. Missing or stale data starts the existing generation-safe gate. Forced events bypass freshness.

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
- [Persisted freshness could outlive cleared activity data] → Clear day timestamps with sync/account data and require locally stored sessions plus a fresh timestamp for the fast path.
- [Today's exact query and the background week query can overlap] → Share in-flight coordination where possible and start weekly completion only after the critical day settles.

## Migration Plan

Deploy the day freshness key alongside the existing weekly history keys. Old week freshness metadata is ignored and removed by sync-state cleanup. No activity-row migration is required.
