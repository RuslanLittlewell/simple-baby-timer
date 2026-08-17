## Why

When the app returns from the background, `syncNow()` starts asynchronously while the Activity screen remains interactive with potentially stale local and remote live-session state. A user can therefore switch the main activity before foreground reconciliation finishes, allowing the incoming sync result to conflict with or erase the newly requested mode.

## What Changes

- Expose a foreground synchronization lifecycle that distinguishes an initial/foreground reconciliation from background realtime updates.
- Treat live-session reconciliation for all linked children as a required part of a successful foreground synchronization pass.
- Show a blocking loading state over the Activity screen while its foreground synchronization is pending, with activity controls unavailable until current timers are reconciled.
- Serialize or reject activity mutations that race the foreground synchronization boundary so the first mode change after resume uses the synchronized state.
- Preserve offline usability: an unreachable backend must finish the foreground gate using the last reliable local state instead of leaving the Activity screen blocked indefinitely.
- Protect the lifecycle against overlapping startup, auth, realtime, and foreground sync requests so only the latest relevant pass controls readiness.

## Capabilities

### New Capabilities

- `foreground-activity-sync-gate`: Readiness, loading, concurrency, and offline behavior required before activity controls can mutate timers after app launch or foreground resume.

### Modified Capabilities

None. The previously proposed `reliable-main-activity-transition` capability is not yet part of the main specs; this change defines the additional foreground-readiness behavior in its new capability.

## Impact

- Affects the app lifecycle and synchronization orchestration in `src/hooks/use-sync.ts`.
- Adds observable sync/readiness state to the application store and consumes it in `src/features/activity/activity-screen.tsx` and its activity panels.
- Interacts with Supabase account checks, queued writes, child/session pulls, `live_sessions` reconciliation, realtime refreshes, and existing atomic main-activity transitions.
- Requires localized accessible loading text and UI treatment for the Activity screen.
- No database schema or external API migration is expected.
