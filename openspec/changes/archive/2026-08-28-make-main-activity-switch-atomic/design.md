## Context

The app models settling, sleep, and awake on one `session` track. Locally, `startActivity` finalizes an existing session before starting another. For a linked child, however, finalization currently launches a fire-and-forget delete of `live_sessions`, while the replacement later launches an upsert against the same `(child_id, track)` primary key. Those requests can finish out of order. Realtime refresh then treats the missing row as a partner stop and clears a local replacement marked as published. See `proposal.md` and `specs/reliable-main-activity-transition/spec.md`.

The PRO panel separately awaits its toggle callback but has no pending-submit state, so multiple presses can enter the same transition with stale props.

## Goals / Non-Goals

**Goals:**

- Give replacement and final stop distinct shared-state semantics.
- Make local and partner-originated main-activity handovers converge on one new live row.
- Preserve exact handover timestamps, completed history, reminders, Live Activities, and PRO details.
- Make Save single-flight without changing how activity options are selected.

**Non-Goals:**

- Change the `live_sessions` schema, activity taxonomy, notification durations, or automatic awake policy.
- Make local activity start depend on network availability.
- Add a global operation queue or change feeding’s independent track.

## Decisions

### Model replacement as an explicit store operation

The store will expose one main-activity transition path that knows whether it is replacing a local session, a partner-originated live session, or no activity. Replacement will finalize the prior record and start the requested kind at one captured handover timestamp. UI code will request the desired next kind instead of composing a remote stop and a separate start.

Reusing the existing stop-then-start callbacks was rejected because those callbacks intentionally encode final-stop behaviour, including row deletion and automatic awake startup. A boolean scattered across UI calls was also rejected because callers could omit it and recreate the race.

### Upsert over the existing shared row during replacement

The replacement path will not call the shared-row delete helper. After local finalization it will publish the replacement with an upsert to the same `(child_id, session)` row. The existing delete remains in paths that truly leave the track inactive. Product-defined automatic awake continuation counts as a replacement and must use the same no-delete handover.

For partner-originated state, the replacing device saves the previous record and directly upserts the next state rather than calling the existing remote-stop operation that deletes and starts awake. This prevents both an empty realtime snapshot and an unnecessary intermediate awake activity.

### Keep local replacement authoritative during cloud publication

The replacement timer is committed locally before waiting for cloud publication, preserving offline behaviour. Publication success may mark the local session as synchronized, but a failed publication must not make realtime reconciliation interpret the local timer as remotely stopped. Reconciliation should only clear a local timer based on a trustworthy published identity, and completion handlers must verify both the track identity and start time before mutating newer state.

Making network success a prerequisite for local start was rejected because timers must remain usable offline.

### Attach PRO details within the transition boundary

The main transition API should accept optional details for the requested activity so the new local session starts with those details and the first shared upsert can include them. Existing detail-update behaviour remains useful for editing an already-running activity, but the Save flow should not depend on a second state mutation immediately after start.

This removes the window in which Save has completed the timer switch but a concurrent reconciliation prevents `setActiveProDetails` from finding the new session.

### Guard Save with component-local pending state

The PRO panel will set a pending flag synchronously before invoking its async Save flow, disable the primary control, and ignore additional presses until the promise settles. A `try/finally` releases the guard; the panel closes only after success and remains open after a rejection. Pending state also prevents the same control from changing from Save to Stop mid-request and launching a competing operation.

A debounce was rejected because it still permits a second submission after the debounce interval while a slow transition remains pending.

## Risks / Trade-offs

- **Existing stop helpers automatically start awake** → Route automatic awake through the replacement operation so it does not delete and recreate the main live row.
- **Realtime echoes can arrive before or after local state updates** → Match reconciliation and async callbacks against child, track, kind/start identity, and publication state before clearing or updating a session.
- **Cloud upsert failure leaves the server on the previous activity while local state advances** → Keep the replacement local and retry publication through the existing sync/reconnect mechanism or an explicit live refresh strategy; never clear it solely because the failed write produced no row.
- **A pending panel could unmount before completion** → Keep the guard component-local and avoid state updates after unmount where the current lifecycle requires it.
- **Changing the transition API touches basic and PRO panels** → Route all main-activity entry points through the same store operation and verify local, remote, offline, and explicit-stop scenarios.

## Migration Plan

No database or persisted-state migration is required. Deploy the client change so replacements use upsert-only handovers while explicit stops retain delete semantics. Rollback restores the previous orchestration but also restores the delete/upsert race; stored sessions and live rows remain compatible in either version.
