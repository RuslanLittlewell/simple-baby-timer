## Why

The manual "Add activity" modal binds both the start and the end time to the calendar day that happens to be on screen, so a caregiver who wants to log a nap from yesterday must first navigate the calendar to that day, and a stretch that crosses midnight cannot be entered at all. The entry editor already solves this with a day stepper under each time field; the creation form should offer the same control.

## What Changes

- Add a day stepper under the start time field and under the end time field in the manual add-activity modal, using the same `DayStepper` control the entry editor uses.
- Show the day steppers for every kind the modal offers — settling, sleep, awake, and feeding — not only for the kinds the editor steps.
- Build the saved start and end timestamps from the selected days plus the picked times, instead of combining both times with the currently viewed calendar day.
- Allow an entry whose end falls on a later day than its start (a stretch across midnight), which the modal currently rejects.
- Default both day steppers to the calendar day the modal was opened on, and reset them to that day every time the modal reopens.

## Capabilities

### New Capabilities

- `manual-entry-day-selection`: Choosing the calendar day of the start and the end of a manually created activity from within the add-activity modal, independently of the day the calendar is showing.

### Modified Capabilities

None. `openspec/specs/` holds no main specs yet, so the manual add-activity behaviour this change touches is not described by an existing capability.

## Impact

- `src/features/calendar/components/add-activity-modal.tsx`: hold start/end day state, render two `DayStepper` instances, and combine day + time when submitting.
- `src/features/calendar/components/day-stepper.tsx`: reused as-is; no change expected.
- No changes to `addManualActivity` in `src/state/app-state.ts` — `saveSession` already files an entry under the day of its `start`, so an entry created for another day lands in the right bucket.
- No new translation keys: `editor.prevDay` and `editor.nextDay` already exist in every supported language.
- No changes to persistence formats, Supabase sync, APIs, or dependencies.
