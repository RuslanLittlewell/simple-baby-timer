## Context

See `proposal.md` for the observed failure. `useSync()` currently calls the exported `syncNow()` independently from mount, authentication, and every `AppState` transition to `active`. Those promises are not coordinated and their progress is not exposed to UI. The full pass applies account, child, history, and live-session results incrementally; `refreshLive()` runs last, while realtime callbacks can schedule additional pulls and live refreshes in parallel. The Activity screen therefore stays actionable throughout an uncertain reconciliation window.

The existing main-activity transition protects its own replacement operation, but it cannot protect an action that begins from a stale pre-resume snapshot or a delayed sync operation that was already in flight. Timers must also remain usable without connectivity, so cloud success cannot be a permanent prerequisite for local actions.

## Goals / Non-Goals

**Goals:**

- Define one authoritative lifecycle for startup and foreground synchronization.
- Keep the Activity screen blocked until the pass has attempted all state required to choose the correct current activity, including live sessions.
- Prevent overlapping sync completions and activity mutations from crossing the foreground readiness boundary.
- Preserve fast offline access and existing realtime collaboration.
- Make pending state observable, accessible, and non-persistent.

**Non-Goals:**

- Block navigation or unrelated screens during synchronization.
- Require cloud connectivity before timers can be used.
- Change Supabase tables, activity types, reminder policy, or the visual structure of the activity panels.
- Replace realtime synchronization with polling.

## Decisions

### Coordinate full sync requests through a serialized foreground-aware runner

Introduce a module-level synchronization coordinator used by mount, auth, foreground, and explicit sync callers. It owns the running promise and monotonically increasing request generation. Only one full pass mutates synchronized state at a time. If a foreground request arrives during a pass that started earlier, the coordinator records a required follow-up pass; the Activity gate remains pending until that foreground-relevant pass reaches a terminal outcome.

Joining the existing promise alone was rejected because it may have captured children or app state before the resume event. Allowing independent promises to race was rejected because an older completion can reconcile stale live rows after the UI becomes ready.

### Model Activity readiness as ephemeral store state

Add a non-persisted foreground status such as `idle | syncing | ready` plus a generation/token owned by the coordinator. A blocking request sets `syncing` synchronously before asynchronous work begins. Only the completion matching the active blocking generation may move it to `ready`; `finally` handles every terminal path.

Putting this only in component state was rejected because `useSync()` lives at the root and activity mutation functions also need a second-layer guard. Persisting it was rejected because relaunching with a stored `syncing` value could permanently cover the screen.

### Define the readiness boundary after live-session reconciliation

The coordinated pass retains the current ordering—account validity, queued writes, subscription, children, completed history—then explicitly awaits pending live publication and the live-session fetch/reconciliation step. Successful completion of earlier stages does not release the Activity gate. Realtime-triggered live refreshes use the same ordered refresh mechanism or freshness token so an older snapshot cannot be applied after a newer one.

This boundary favors correctness over enabling controls a few moments earlier. Showing the loader only around `fetchLiveSessions()` was rejected because child restoration, queued activity writes, or history pulls may change which remote rows must be fetched.

### Guard mutations in both UI and state layers

While the Activity screen observes `syncing`, it renders a full-screen, touch-blocking overlay above its content with an activity indicator and localized status label. Controls receive disabled/busy accessibility semantics where applicable. Store entry points that start, stop, replace, or log activities also check the same foreground gate, preventing a stale callback or programmatic path from bypassing the overlay.

The guard does not queue a tap for later execution. The user acts after the synchronized state is visible, avoiding an intent captured against the wrong current mode.

### Fail open locally after a terminal synchronization failure

Network/account operations return a classified outcome instead of relying only on the current broad swallowed exception. An unreachable or failed pass leaves local timers untouched, completes the active gate in `finally`, and permits offline mutations that will use the existing upload queue/retry flow. If a bounded timeout is needed around the gate, it invalidates that generation before releasing the UI; late work from the invalid generation must not reconcile live state.

Showing an indefinite loader was rejected because tracking must work offline. Clearing local timers on failure was rejected because local state is authoritative until a trustworthy remote snapshot is available.

## Risks / Trade-offs

- **[Foreground sync can be noticeably slow]** → Keep the gate scoped to the Activity screen, show immediate progress feedback, and release it on handled offline failure.
- **[Repeated AppState `active` events can enqueue redundant passes]** → Coalesce requests by generation and allow at most one required follow-up pass.
- **[A timeout can release controls while network work continues]** → Invalidate the timed-out generation and require freshness checks before any later live reconciliation is applied.
- **[UI-only tests may miss store bypasses]** → Test both disabled interaction and direct mutation guards during the pending state.
- **[Blocking all event logging briefly adds friction]** → Apply one consistent gate because every event can depend on the active child restored by the same pass.

## Migration Plan

No persisted-state or database migration is required. Deploy the coordinator, ephemeral readiness field, guards, overlay, and translations together. Existing installations begin with the readiness default derived at runtime and perform a normal launch synchronization. Rollback removes the gate and coordinator without changing stored sessions or shared rows.
