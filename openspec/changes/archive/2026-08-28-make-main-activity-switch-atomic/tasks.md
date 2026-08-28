## 1. Main Activity Transition

- [x] 1.1 Add an explicit store operation for starting or replacing a main activity that accepts the next kind, optional PRO details, and one captured handover timestamp.
- [x] 1.2 Make local main-activity replacement finalize the previous record, cancel its reminder and Live Activity, and start the replacement without deleting the shared main-track row.
- [x] 1.3 Make partner-originated main-activity replacement finalize the remote record and upsert the requested replacement directly, without an intermediate delete or automatic awake activity.
- [x] 1.4 Route automatic awake continuation through the replacement path while retaining shared-row deletion for a true final stop with no continuation.

## 2. Realtime and Offline Consistency

- [x] 2.1 Publish replacement kind, start time, and initial PRO details through one upsert of the existing `(child_id, session)` live row.
- [x] 2.2 Harden live publication callbacks and realtime reconciliation so stale delete/refresh results cannot clear or mutate a newer local replacement.
- [x] 2.3 Preserve a usable local replacement when live publication fails, and ensure a later sync or publication retry can converge shared state without duplicating completed history.

## 3. UI Integration and Single-Flight Save

- [x] 3.1 Route basic-panel and PRO-panel main activity changes through the explicit transition operation instead of composing stop and start callbacks.
- [x] 3.2 Pass selected settling or sleep details into the transition so they are present on the new local session and its first shared upsert.
- [x] 3.3 Add a component-local pending guard to the PRO panel primary action, disable it accessibly during submission, and ignore repeated Save or competing Stop presses.
- [x] 3.4 Close the PRO panel only after a successful Save; release the pending guard in all outcomes and leave the panel available for retry after a rejection.

## 4. Verification

- [x] 4.1 Verify local settling-to-sleep, sleep-to-awake, and awake-to-settling handovers produce one completed record and one active replacement with a shared boundary timestamp.
- [x] 4.2 Verify cloud-linked and partner-originated replacements issue no main-row delete, converge all devices on the replacement, and resist delayed realtime refresh ordering.
- [x] 4.3 Verify explicit final-stop deletion, automatic awake replacement, notification/Live Activity cleanup, offline replacement, PRO details, and rapid repeated Save presses.
- [x] 4.4 Run TypeScript checks, relevant platform builds/tests, strict OpenSpec validation, and review the final diff for unrelated changes.
