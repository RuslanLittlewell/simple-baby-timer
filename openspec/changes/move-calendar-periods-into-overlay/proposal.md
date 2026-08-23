## Why

The week and month views replace the day screen instead of covering it: `CalendarScreen` returns a different tree entirely when `view` is not `'day'`. Every switch therefore unmounts the timeline, its `ScrollView`, the live blocks and the `<GestureDetector>` that carries the pinch-zoom gesture, while the gesture object itself survives in `usePinchZoom`. Detaching and reattaching a gesture across remounts is a known source of flicker and of native crashes in gesture-handler, which matches what the app does: a visible glitch on every switch, and a crash after a few of them.

Presenting the periods as an overlay over a day view that stays mounted removes the remount, and with it the cause.

## What Changes

- The week and month views move into a single modal over the day view; the day view is never unmounted to show them.
- That modal is presented the way the calendar's own add-activity modal is: a centred card of the same width over a blurred backdrop, sharing its styles, and no taller than 70% of the screen.
- The calendar icon in the day header opens that overlay on the week.
- The chevron at the top of the overlay becomes a plain toggle between week and month, rather than a "back" control that goes one level deeper in the week and one level back in the month.
- Picking any day in either view closes the overlay and moves the day view to that day.
- Closing the overlay — with its close button or the system back gesture — returns to the day view exactly as it was left.
- The statistics control leaves the overlay's top bar, so nothing there can open a second modal on top of it. Statistics stay reachable from the day header, where they already are.
- The timeline still recentres when a day is picked from the overlay, which now needs an explicit scroll instead of relying on a remount.

## Capabilities

### New Capabilities

- `calendar-period-overlay`: Reaching the week and month views from the day screen, switching between them, and what picking a day there does.

### Modified Capabilities

None. `openspec/specs/` holds `manual-entry-day-selection` and `calendar-day-header-navigation`; the latter covers the day header's own controls, which this change does not alter.

## Impact

- `src/features/calendar/calendar-screen.tsx`: `view` becomes an overlay flag, the two early returns give way to one modal, and day picking scrolls the timeline explicitly.
- `src/features/calendar/components/week-view.tsx` and `month-view.tsx`: their shared control changes meaning from "go a level up or down" to "switch to the other period".
- `src/features/calendar/components/overlay-shell.tsx`: becomes a card on the shared modal styles instead of a full-screen gradient, and its optional statistics control is removed along with the prop, which no caller keeps.
- `src/features/calendar/components/week-view.tsx`: its full-bleed layout goes, since seven rows can no longer share a whole screen.
- No changes to stored data, sync, statistics, or the entry editor.

## Assumptions

- The overlay is a `Modal`, matching the three the calendar already uses, rather than a router screen.
- Stepping days with the header arrows keeps preserving the scroll position, as `calendar-day-header-navigation` requires; only picking a day from the overlay recentres. The two are deliberately different.
