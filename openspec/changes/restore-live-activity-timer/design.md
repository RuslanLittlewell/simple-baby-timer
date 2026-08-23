## Context

See proposal.md — Why. The evidence, in the two copies of the same code:

- `node_modules/expo-live-activity/ios-files/LiveActivityWidget.swift` declares `elapsedTimerStartDateInMilliseconds` and reads it in `compactTrailing`, in `minimal` and in the expanded `.bottom` region. It ships alongside `LiveActivityHelpers.swift`, `LiveActivityMediumView.swift` and `LiveActivitySmallView.swift`.
- `ios/LiveActivity/LiveActivityWidget.swift` has no such field, gates every island timer on `timerEndDateInMilliseconds`, and the three files above are absent from the directory entirely.

The native module in `node_modules/expo-live-activity/ios/ExpoLiveActivityModule.swift` does pass `state.progressBar?.elapsedTimer?.startDate` through — the break is only in the copied widget sources.

`ios/BabyTracker.xcodeproj/project.pbxproj` lists each Swift file individually; there is no synchronized root group, so new files must be registered with the target rather than merely copied in.

## Goals / Non-Goals

**Goals:**

- Get the project's widget sources back in step with the module that feeds them.
- Show the elapsed time everywhere the module already supports it.
- Leave the lock-screen card carrying the least it can while staying useful.

**Non-Goals:**

- Writing or forking Swift views. Everything needed already exists in the module; the project's copy is simply old.
- Removing the lock-screen presentation, which iOS does not allow while the Dynamic Island is wanted.
- Adding a home-screen widget.
- Changing which activities raise a Live Activity.

## Decisions

**Regenerate rather than hand-patch.** Copying the three missing files in by hand would still leave `project.pbxproj` without them, and the widget would build without ever compiling them. `npx expo prebuild -p ios` re-runs the module's config plugin, which both copies its `ios-files` and registers them. Try it without `--clean` first, since that keeps the rest of the native project; fall back to `--clean` if the plugin does not pick up the new files.

**Two local patches must be restored afterwards.** The project currently carries hand edits that prebuild does not preserve: automatic signing with team `ZD7WN5A4B4` on both targets in place of the App Store credentials EAS stamped in, and `ENABLE_USER_SCRIPT_SANDBOXING = NO`, without which the React Native build phase cannot write `ip.txt` into the bundle. Both are known and quick, but a regeneration that forgets them looks like a broken build rather than a missing setting.

**The start time leaves the state, not the view.** The lock-screen card's second line is the `subtitle` the app supplies through `liveActivityLabels`, which formats the moment the activity began. Dropping that from the labels shortens the card without touching a single line of Swift, and it is also the honest fix: the elapsed timer already answers "how long", so the start time was the redundant half.

**Density comes from the module's configuration.** `padding`, `imageSize` and `imagePosition` are configuration the app already passes at `startActivity`; tightening them is how the card gets smaller. There is no option for choosing a lock-screen layout, so this is the whole of the available control.

## Risks / Trade-offs

- **Prebuild resets the native project** — the two patches above, and anything else added to `ios/` by hand, go with it. → They are listed in the tasks and re-applied there; `/ios` is gitignored, so nothing else in the repository is at stake.
- **The module is an alpha** — 0.5.0-alpha1 may change its state shape again, and the next upgrade can put the project back in exactly this position. → The failure is silent, which is the dangerous part: the widget renders, just without a timer. Worth checking the island after any future bump of this package.
- **The regenerated card may not look the way the old one did** — colours, icon placement and typography come from the module's newer views. → Verify on device before deciding whether the tightened padding is still needed; the request was for the smallest card, not for a specific one.
- **Two Live Activities can run at once** — a main activity and a feeding each raise their own, so a lock screen can hold two cards. → Unchanged by this work, but worth seeing once the cards are smaller, since that is when it stops looking like a bug.
