## Why

In the day view the calendar header offers no way to move between days: the chevron on the left is not a "back" control at all — it opens the week view — so stepping to yesterday means going through the week or month screen and picking a date. The header also has the space for direct day stepping, right beside the large date it already shows.

## What Changes

- Replace the left chevron in the day-view header with a calendar icon, keeping its existing action of opening the week view and giving it an accessible label it currently lacks.
- Add a backward and a forward arrow flanking the centred date block, stepping the shown day by one.
- Keep the timeline's scroll position when the day changes, so stepping through days compares the same hours.
- Leave the week and month views' own headers untouched.

## Capabilities

### New Capabilities

- `calendar-day-header-navigation`: Stepping the calendar's day view one day at a time from the header, and reaching the week view through a calendar icon rather than a chevron.

### Modified Capabilities

None. `openspec/specs/` describes only `manual-entry-day-selection`, which this change does not touch.

## Impact

- `src/features/calendar/calendar-screen.tsx`: swap the header icon, add the two day arrows around the date block, and add a day-stepping handler that leaves the scroll position alone.
- No changes to `WeekView`, `MonthView`, the timeline, the pinch-zoom hook, persistence, or sync.
- No new translation keys: `editor.prevDay` / `editor.nextDay` cover the arrows and `calendar.week` covers the calendar icon, in every supported language.

## Assumptions

- Stepping forward is not capped at today: the month view already lets a caregiver open a future day, so the arrows stay consistent with it.
- The calendar icon is `calendar-month-outline` from the MaterialCommunityIcons set already used across the header.
