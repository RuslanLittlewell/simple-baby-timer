## 1. Foreground Sync Coordination

- [x] 1.1 Review the exact Expo SDK 57 AppState lifecycle guidance and map every existing startup, authentication, foreground, explicit, and realtime sync entry point.
- [x] 1.2 Add non-persisted Activity sync readiness and generation state with guarded begin/finish operations to the application store.
- [x] 1.3 Refactor the full sync body to report terminal outcomes and run through a serialized coordinator that coalesces redundant requests and schedules a fresh pass when foregrounding overtakes older work.
- [x] 1.4 Keep the foreground generation pending through account, queue, entitlement, child, completed-session, pending-live-publication, and live-session reconciliation stages.
- [x] 1.5 Route mount, sign-in, AppState activation, and explicit sync callers through the coordinator without allowing an older pass to mark a newer generation ready.

## 2. Live-State Ordering and Mutation Safety

- [x] 2.1 Serialize live-session refreshes or attach freshness generations so delayed foreground and realtime snapshots cannot overwrite a newer reconciliation or activity mutation.
- [x] 2.2 Add a store-level readiness guard to activity start, stop, replacement, feeding, manual-event, and event-log entry points so non-UI callers cannot mutate during the foreground gate.
- [x] 2.3 Ensure successful, unreachable, failed, cancelled, and bounded-timeout foreground outcomes release only their matching gate while preserving reliable local timers.
- [x] 2.4 Verify offline actions continue through the existing persistence and retry queues after the foreground gate fails open.

## 3. Activity Loading Experience

- [x] 3.1 Add localized Activity synchronization copy for every supported language and verify translation-key parity.
- [x] 3.2 Render a full-screen Activity overlay with a progress indicator, busy accessibility state, and touch interception while foreground sync is pending.
- [x] 3.3 Disable or guard basic-panel, PRO-panel, feeding, and event callbacks consistently so no pending press is replayed automatically after readiness.
- [x] 3.4 Keep navigation and screens outside Activity usable while the Activity-only gate is visible.

## 4. Verification

- [x] 4.1 Verify background-to-active synchronization blocks an immediate mode change and the first allowed change uses the reconciled local or partner live timer.
- [x] 4.2 Verify overlapping launch, authentication, foreground, and realtime requests are ordered and stale completions cannot replace a newer activity or release the wrong gate.
- [x] 4.3 Verify successful online sync, offline/unreachable sync, thrown failures, timeout/cancellation, rapid resume cycles, and unlinked-child behavior never leave the loader stuck.
- [x] 4.4 Verify the overlay blocks all Activity mutations accessibly while other screens remain interactive.
- [x] 4.5 Run TypeScript checks, relevant iOS and Android Expo builds/tests, translation parity checks, strict OpenSpec validation, and final diff review.
