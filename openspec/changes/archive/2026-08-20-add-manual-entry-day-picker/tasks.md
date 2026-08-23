## 1. Day State In The Add Modal

- [x] 1.1 Add `startDayMs` and `endDayMs` state to `AddActivityModal` and seed both from `startOfDayMs(day.getTime())` inside the existing reset effect, so reopening the modal always returns them to the viewed calendar day.
- [x] 1.2 Read `language` from `useAppStore` and resolve `WEEKDAYS_I18N[language]` in the modal, matching how `EntryEditor` supplies weekday labels to the stepper.

## 2. Day Steppers In The Time Row

- [x] 2.1 Render a `DayStepper` below the start `WheelField`, bound to `startDayMs`, using `theme.text` / `theme.backgroundElement` and clearing `error` on change.
- [x] 2.2 Render a second `DayStepper` below the end `WheelField`, bound to `endDayMs`, with the same colors and error clearing.
- [x] 2.3 Confirm both steppers stay visible for every kind the modal offers — settling, sleep, awake, and feeding — and that switching kinds does not reset the chosen days.

## 3. Submit And Validation

- [x] 3.1 Change `submit` to build `start` from `combineDayTime(startDayMs, startTime)` and `end` from `combineDayTime(endDayMs, endTime)`, dropping the use of the `day` prop for timestamp construction.
- [x] 3.2 Keep the single `end <= start` check on the combined timestamps and the existing `editor.errTimeFormat` / `editor.errEndAfterStart` messages; add no roll-over that moves the end day on the caregiver's behalf.

## 4. Verification

- [ ] 4.1 Verify an entry created with both steppers stepped back one day is stored and shown on that earlier day, and that an untouched form still saves onto the viewed day.
- [ ] 4.2 Verify an overnight case: start 22:30 on the viewed day, end day stepped forward one, end 06:00 — it saves and appears on both days in the calendar.
- [ ] 4.3 Verify the rejection cases still show the existing error: identical start and end instants, and an end instant before the start instant on the same day.
- [ ] 4.4 Verify layout on a small device that the taller time column keeps the save button reachable in the scrollable modal, in both light and dark themes.
- [x] 4.5 Run the project typecheck and lint, then run strict OpenSpec validation for `add-manual-entry-day-picker` and review the final diff.
