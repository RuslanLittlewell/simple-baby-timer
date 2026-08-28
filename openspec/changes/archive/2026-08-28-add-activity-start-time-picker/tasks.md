## 1. Dismissal Signal In WheelField

- [x] 1.1 Add an optional `onDismiss` prop to `WheelField`, fired on the iOS Cancel press and backdrop press and on an Android event whose type is not `set`, leaving confirmation behaviour unchanged.
- [x] 1.2 Confirm the bottle step in the PRO panel, which passes no `onDismiss`, still behaves exactly as before.

## 2. Start Time Step

- [x] 2.1 Add a `StartTimePicker` component to the activity feature that renders `WheelField` with `mode="time"`, `openOnMount`, a trigger occupying no space, `maximumDate` of now, and `minimumDate` of the later of the current day's start and the running main activity's start.
- [x] 2.2 Hold a `pendingStart` value in `activity-screen.tsx` carrying the kind and the optional PRO details, and render `StartTimePicker` only while it is set, clearing it on both confirmation and dismissal.

## 3. Wiring The Two Panels

- [x] 3.1 Change `handleMainActivity` to keep its stop branch and its `activitySyncing` guard first, then open the time step instead of calling `transitionMainActivity` directly — this covers the basic panel's three rows and the PRO awake tile.
- [x] 3.2 Change `handleSaveMainActivity` to open the time step carrying the card's details, and start the activity only once the step is confirmed.
- [x] 3.3 Re-check the `activitySyncing` guard when a confirmation comes back, so a sync that began while the step was open does not swallow the start silently.
- [x] 3.4 Move the PRO card's close in `handlePrimaryPress` behind the confirmation, so a dismissal leaves the card open with its chosen parameters intact.

## 4. Verification

- [ ] 4.1 Verify in the basic panel that each of settling, sleep, and awake opens the step immediately, that confirming the offered time starts the timer at the present moment, and that a picked earlier time is what the elapsed clock counts from.
- [ ] 4.2 Verify in the PRO panel that settling and sleep ask only after save, that the started activity carries the chosen parameters, and that awake opens the step immediately with no card.
- [ ] 4.3 Verify dismissal on both iOS and Android: nothing starts, a running activity is untouched, the PRO card stays open with its parameters, and the next press opens the step again.
- [ ] 4.4 Verify the bounds: the future cannot be picked, a running activity's start is the floor, midnight is the floor when nothing runs, and a stretch that began yesterday floors at the current day's start.
- [ ] 4.5 Verify stopping a running activity still stops at the present moment with no step, and that breast and bottle feeding are unchanged.
- [x] 4.6 Run the project typecheck and lint, then run strict OpenSpec validation for `add-activity-start-time-picker` and review the final diff.
