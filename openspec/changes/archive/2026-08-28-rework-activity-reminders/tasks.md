## 1. Quiet Delivery

- [x] 1.1 Send reminders with `interruptionLevel: 'passive'` and no sound in `scheduleActivityNotification`, leaving the Android channel and the time-interval trigger as they are.
- [x] 1.2 Lower the Android channel's importance to match, so the platform does not raise a heads-up notification there either.

## 2. Wording

- [x] 2.1 Build the reminder's title from `kind.<activity>` in `startActivity` instead of `notif.<activity>.title`.
- [x] 2.2 Rewrite the three `notif.*.body` strings in Russian to the texts the spec fixes, and translate each into the other eight languages.
- [x] 2.3 Remove the three `notif.*.title` keys from all nine languages, once nothing reads them.

## 3. Full Interval Per Run

- [x] 3.1 Remove `reminderChain` from the store, along with `carriedFor`, `CHAIN_GAP_MS`, the `ReminderChain` type and every write to it in `finalizeSession`, `stopActivity` and the reset paths.
- [x] 3.2 Remove `carriedMs` from the running session, so the reminder delay is the configured interval measured from the run's own start.
- [x] 3.3 Start the Live Activity from the run's actual start instead of `startedAt - carriedMs`.
- [x] 3.4 Confirm the reminder still accounts for a back-dated start — a run started ten minutes ago is still due a full interval after that moment, not after now.

## 4. Verification

- [ ] 4.1 Verify on device that a reminder arrives silently, does not wake the screen, and does not break through a focus mode, while remaining readable in the notification list.
- [ ] 4.2 Verify each of the three reminders shows the activity's name as its title and the new body text, and that both follow the app's language.
- [ ] 4.3 Verify the carry-over is gone: run sleep close to its interval, switch modes by hand, start sleep again, and confirm the reminder is a full interval away rather than minutes.
- [ ] 4.4 Verify switching modes and stopping still leave no reminder behind, including a switch made immediately after starting.
- [ ] 4.5 Verify the Live Activity shows the mode and counts from the moment the run started.
- [ ] 4.6 Verify an activity whose reminders are switched off schedules nothing.
- [x] 4.7 Run the project typecheck and lint, then run strict OpenSpec validation for `rework-activity-reminders` and review the final diff.
