## Why

Switching a cloud-linked child from one main activity to another can race the asynchronous deletion and creation of the shared `live_sessions` row. A late delete may remove the newly started activity, after which realtime reconciliation clears it locally, producing the observed “falling asleep stopped but sleep did not start” failure.

## What Changes

- Treat replacement of one main activity by another as a single live-session handover: finalize the previous activity, then upsert the replacement into the existing `(child_id, session)` row without deleting that row first.
- Delete the shared live-session row only when the user ends a main activity without replacing it.
- Preserve completed-session history, notification cancellation/rescheduling, Live Activity updates, realtime collaboration, and selected PRO details during the handover.
- Prevent the PRO panel Save action from starting more than one asynchronous transition while a save is already in progress.
- Keep the panel open and reusable if a transition fails instead of silently treating a failed request as saved.

## Capabilities

### New Capabilities

- `reliable-main-activity-transition`: Reliable, ordered switching between settling, sleep, and awake activities across local and Supabase-backed state, including single-flight PRO-panel saves.

### Modified Capabilities

None. No main specifications currently define activity-transition behaviour.

## Impact

- `src/state/app-state.ts`: distinguish activity replacement from final stop and order shared live-session mutations safely.
- `src/lib/sync.ts`: shared `live_sessions` upsert/delete semantics may receive a focused helper or explicit replacement path.
- `src/features/activity/components/pro-activety-panel.tsx`: track pending Save state and ignore repeated submissions.
- `src/features/activity/activity-screen.tsx`: propagate transition completion/failure consistently if required by the panel contract.
- Supabase schema remains unchanged because `live_sessions` is already keyed by `(child_id, track)` and supports upsert replacement.
- No migration, new dependency, or user-data format change.
