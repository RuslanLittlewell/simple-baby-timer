## Why

Activity history is currently synchronized as an unbounded stream behind a single cursor, so a device can appear fully synchronized while older local weeks are missing. The app should become useful quickly by loading the current calendar month first and fetch older or future history only when the user navigates to it.

## What Changes

- Load the active child's current calendar month during the initial synchronization pass.
- Lazily load a calendar month when calendar navigation or statistics requires a date outside the locally loaded ranges.
- Persist per-child loaded-month state so completed ranges are not fetched repeatedly, while allowing concurrent callers to share one in-flight request.
- Fetch range pages deterministically and merge them into the existing local activity store without removing unrelated local history.
- Surface range-load completion to calendar and statistics views through the existing data-version mechanism.
- Reset loaded-range metadata when account or child synchronization state is cleared.

## Capabilities

### New Capabilities

- `activity-history-loading`: Defines initial current-month synchronization and on-demand loading of additional activity-history months.

### Modified Capabilities

None.

## Impact

- Activity synchronization in `src/lib/sync.ts` and `src/hooks/use-sync.ts`.
- Calendar and statistics data-loading flows under `src/features/calendar/`.
- AsyncStorage metadata for loaded child/month ranges.
- Tests for initial loading, lazy loading, pagination, deduplication, and reset behavior.
- No database schema or new runtime dependency is expected.
