## Why

Parents currently cannot record or review how a child’s height and weight change over time. Adding a small growth history makes the child profile more useful and keeps the latest measurements visible from the main activity screen.

## What Changes

- Require height and weight when creating a child and store them as the first measurement dated on the child’s birthday.
- Show the child’s latest height and weight directly below the child profile chip on the activity screen.
- Open a growth-history modal when the latest-measurement summary is pressed.
- List dated measurements chronologically in a modal whose history area shows at most four rows, open the list at its newest row, and allow users to add a row with a date, height, and weight or edit an existing row.
- Persist measurements locally and synchronize them through Supabase so members of a shared child see the same history.
- Add localized labels, validation messages, and accessible actions for every supported app language.

## Capabilities

### New Capabilities

- `child-growth-history`: Capture, display, edit, persist, and synchronize dated child height and weight measurements.

### Modified Capabilities

None.

## Impact

- Child creation and onboarding forms, app state actions, the activity-screen child header, and new growth-history UI components.
- Local persisted data gains per-child measurement records while remaining compatible with existing saved children.
- Supabase schema, RLS policies, and synchronization code gain a child measurement table and CRUD operations.
- Translation resources and focused tests cover creation, sorting/latest-value selection, validation, editing, persistence, synchronization, and presentation.
