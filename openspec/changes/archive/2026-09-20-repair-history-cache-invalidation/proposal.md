## Why

Activity history can become permanently invisible on a device: the client remembers which history weeks it has downloaded, but that memory outlives the data it describes and is never re-checked. After an unexpected re-authentication the app re-downloads only the current day, so a child's profile shows today's activity while every earlier day stays empty even though the rows are intact on the server.

## What Changes

- Stop recording a history week as downloaded when the fetch that covered it applied no rows, so an empty result can never stand in for real history.
- Key the downloaded-history memory to the local child identity that received the rows, so a regenerated local child id cannot inherit another identity's download record.
- Discard the downloaded-history memory before local activity data is deleted, and make account-data clearing complete or leave no stale record behind.
- Re-download a child's current week when the recorded history does not account for the locally stored activity, so an already-broken install repairs itself without reinstalling.
- Add regression tests for empty fetches, child-identity changes, interrupted account clearing, and repeated loads of an already-downloaded week.

## Capabilities

### New Capabilities

- `durable-activity-history-cache`: Defines when downloaded activity history may be recorded as complete, how that record is scoped and invalidated, and how the client recovers history it can no longer account for.

### Modified Capabilities

None.

## Impact

- `src/lib/activity-history-loading.ts`: registry scoping, and the record shape that carries child identity.
- `src/lib/sync.ts`: week/day load paths, marking policy, and `clearSyncState` ordering.
- `src/state/app-state.ts`: `clearAccountData` ordering and failure behavior.
- `src/hooks/use-sync.ts`: current-week recovery when the recorded history is not trustworthy.
- Activity history and sync tests; no database, server, or authentication changes.
- Existing installs keep their stored records; entries that predate child-identity scoping are treated as unaccounted and re-downloaded once.
