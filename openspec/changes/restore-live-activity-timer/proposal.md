## Why

The Live Activity shows no running time anywhere: the Dynamic Island renders only the mode's icon, and the lock-screen card is a large block whose second line is the moment the activity began rather than how long it has been going.

The cause is a version split. `expo-live-activity` is installed at 0.5.0-alpha1, whose Swift carries `elapsedTimerStartDateInMilliseconds` and renders it in the island's compact, minimal and expanded regions. The copy generated into `ios/LiveActivity/` predates that: its `ContentState` knows only `timerEndDateInMilliseconds` and `progress`, and every timer in its Dynamic Island is gated on the end date. The app sends `progressBar: { elapsedTimer: { startDate } }`, which that older Swift cannot read, so no timer is drawn — only the icon, which is not gated on anything. Three of the module's current files are missing from the project altogether.

## What Changes

- The Live Activity extension is regenerated from the installed module, so the Swift matches the state the app actually sends.
- The Dynamic Island shows the running time: in the compact trailing slot, in the minimal presentation, and in the expanded view.
- The lock-screen card is reduced to its smallest useful form — the mode and the running time — by dropping the start-time line from the state the app sends and tightening the card's padding and icon.
- Nothing about which activities start a Live Activity changes, nor the deep link, colours or icons.

## Capabilities

### New Capabilities

- `live-activity-presentation`: What the Live Activity shows while an activity runs, in the Dynamic Island and on the lock screen.

### Modified Capabilities

None. `openspec/specs/` holds `manual-entry-day-selection` and `calendar-day-header-navigation`, neither of which covers the widget.

## Impact

- `ios/LiveActivity/`: regenerated from `node_modules/expo-live-activity/ios-files`, gaining `LiveActivityHelpers.swift`, `LiveActivityMediumView.swift` and `LiveActivitySmallView.swift`, and a `LiveActivityWidget.swift` that understands the elapsed timer.
- `ios/BabyTracker.xcodeproj/project.pbxproj`: the three new files join the widget target. Regenerating also resets two settings that were patched by hand for local device builds — automatic signing with the team, and `ENABLE_USER_SCRIPT_SANDBOXING = NO` — so both are restored as part of this change.
- `src/lib/live-activity.ts`: a tighter layout, and the labels it passes through.
- `src/state/app-state.ts`: `liveActivityLabels` stops putting the start time in the subtitle.
- No changes to reminders, to what is stored, or to sync.

## Assumptions

- The lock-screen card cannot be removed while keeping the Dynamic Island: they are two presentations of one Live Activity, and iOS offers no way to suppress the lock-screen one. Making it minimal is the closest available outcome, which is what was chosen.
- The module chooses its lock-screen layout itself; the app influences it only through the state and the configuration it passes, not by selecting a view.
