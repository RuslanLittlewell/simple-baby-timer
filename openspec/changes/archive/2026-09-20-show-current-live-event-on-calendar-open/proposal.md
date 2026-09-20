## Why

The Calendar tab stays mounted between tab switches, so reopening it can preserve an old selected day and scroll position. A parent can therefore miss the activity that is currently running even though its live block exists on today's timeline.

## What Changes

- Re-focus the Calendar day timeline on today whenever the Calendar tab becomes active.
- Scroll the timeline so the current portion of an active event is visible on every Calendar entry.
- Fall back to the current-time position when no event is running.
- Preserve manual day navigation and scrolling while the Calendar tab remains open.
- Add deterministic coverage for focus target selection and Calendar focus wiring.

## Capabilities

### New Capabilities

- `calendar-live-event-focus`: Defines how the Calendar selects and reveals the current running event when the tab is opened.

### Modified Capabilities

None.

## Impact

- `src/features/calendar/calendar-screen.tsx`: tab-focus lifecycle, today selection, and timeline scroll targeting.
- Calendar feature helpers/tests for deterministic focus target calculation.
- No storage, synchronization, database, API, or dependency changes.
