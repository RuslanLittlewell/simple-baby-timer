## Why

Starting settling, sleep, or awake always stamps the timer with the moment the button was pressed. A caregiver who notices ten minutes late that the baby fell asleep has no way to say so at the moment of tapping — the only repair is to start the timer anyway and edit the entry in the calendar afterwards. The store already accepts a back-dated start (`transitionMainActivity` takes a handover timestamp and `startActivity` clamps it), so what is missing is the ability to pick that time.

## What Changes

- Starting settling, sleep, or awake asks for the start time, with the wheel already on the current time so confirming without touching it behaves exactly as today.
- In the basic panel the time step appears as soon as the activity button is pressed.
- In the PRO panel, settling and sleep show it after the card's save button is pressed, once the parameters are chosen.
- The awake button behaves identically in both panels: it has no PRO parameters, so it goes straight to the time step in either one.
- The offered range is bounded: no later than now, and no earlier than the running activity's start or midnight, whichever is later.
- Dismissing the time step starts nothing and leaves the current activity untouched.
- **BREAKING** for the panel contract only: the PRO panel's save callback now reports whether the activity actually started, so a dismissed time step leaves the card open. No stored data, sync payload, or user-visible history format changes.

## Capabilities

### New Capabilities

- `activity-start-time-choice`: Choosing the moment a main activity timer starts at the point of starting it, instead of always stamping it with the current time.

### Modified Capabilities

None. `openspec/specs/` describes `manual-entry-day-selection` and `calendar-day-header-navigation`, neither of which covers starting a timer.

## Impact

- `src/features/activity/activity-screen.tsx`: `handleMainActivity` and `handleSaveMainActivity` route through the time step instead of starting straight away; the screen owns the step, which is what keeps the awake button one shared path across both panels.
- `src/features/activity/components/pro-activety-panel.tsx`: the save press asks for a time before it calls back.
- `src/components/wheel-field.tsx`: gains a way to tell its owner the picker was dismissed without a confirmation — needed because the new flows mount the picker only to ask one question.
- No changes to `transitionMainActivity` or `startActivity`: both already accept and clamp a back-dated start.
- No new translation keys: the step reuses `editor.start`, and the sheet's own `common.done` / `editor.cancel`.
- Feeding is untouched: bottle already picks its own start time, and the breast timer was not part of this request.
