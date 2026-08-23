## 1. Regenerate The Extension

- [x] 1.1 Run `npx expo prebuild -p ios` and check whether `ios/LiveActivity/` gains `LiveActivityHelpers.swift`, `LiveActivityMediumView.swift` and `LiveActivitySmallView.swift`, and whether `LiveActivityWidget.swift` now declares `elapsedTimerStartDateInMilliseconds`.
- [x] 1.2 If the plugin did not pick them up, rerun with `--clean`.
- [x] 1.3 Confirm all three new files are registered with the `LiveActivity` target in `project.pbxproj`, not merely present on disk.
- [x] 1.4 Restore automatic signing with team `ZD7WN5A4B4` on both the `BabyTracker` and `LiveActivity` targets, clearing any `[sdk=iphoneos*]` identity or provisioning-profile overrides.
- [x] 1.5 Restore `ENABLE_USER_SCRIPT_SANDBOXING = NO` in both project-level configurations.
- [x] 1.6 Run `pod install` if prebuild did not, and confirm the project still builds.

## 2. Minimal Lock-Screen Card

- [x] 2.1 Stop putting the start time in the Live Activity subtitle in `liveActivityLabels`, leaving the mode's name as the card's text.
- [x] 2.2 Tighten the card in `startLiveActivity`'s configuration — smaller padding and icon — while keeping the mode's colour and the deep link.

## 3. Verification

- [ ] 3.1 Verify on device that the Dynamic Island shows the running time in its compact, minimal and expanded presentations, next to the mode's icon.
- [ ] 3.2 Verify the time advances while the app stays closed, and matches the timer on the activity screen when it is opened.
- [ ] 3.3 Verify an activity started with a back-dated time shows that offset already counted on the widget.
- [ ] 3.4 Verify the lock-screen card shows the mode and the running time, no start time, and is visibly smaller than before.
- [ ] 3.5 Verify stopping ends the widget, and switching modes moves it to the new mode counting from its start.
- [ ] 3.6 Verify a feeding running alongside a main activity still gives two independent cards.
- [x] 3.7 Run the project typecheck and lint, then run strict OpenSpec validation for `restore-live-activity-timer` and review the final diff.
