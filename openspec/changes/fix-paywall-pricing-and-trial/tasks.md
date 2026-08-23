## 1. Row Layout

- [x] 1.1 Change `OptionRowProps` to take a `billed` node and an optional `secondary` node instead of the single `price` node, and lay the row out as duration plus billed amount on the first line with the subordinate node beneath.
- [x] 1.2 Add a billed-amount text style noticeably larger and heavier than `smallBold`, and render every subordinate element at `small` with `textSecondary`.
- [x] 1.3 Move the saving badge onto the subordinate line so nothing but the billed amount competes on the first line.

## 2. Real Packages

- [x] 2.1 Rewrite `priceFor` to return `pack.product.priceString` as the billed amount for every package type, monthly included.
- [x] 2.2 Add the subordinate node for a real package: the free-trial label when `freeTrialDays` returns days, and the calculated per-month figure for packages longer than a month, keeping the currency symbol taken from `priceString`.

## 3. Failure States Instead Of Preview Plans

- [x] 3.1 Delete `PREVIEW_PLANS`, `previewPicked` and `showPreview`, so an empty plan list is an error state in every build.
- [x] 3.2 Split the single `failed` flag into `loadFailed`, `purchaseFailed` and `trialFailed`, resetting all three when the paywall opens.
- [x] 3.3 Add translation keys for a failed purchase and a failed trial start across all nine languages, and point `buy`, `restore` and `beginTrial` at them.
- [x] 3.4 Show the loading indicator until the request settles, then either the plan list or the explanation — `paywall.error` when purchases are supported, `paywall.unavailable` when they are not.
- [x] 3.5 Render the trial row outside the plan list's condition so it survives a store that returns nothing, and drop `showPreview` from the main button's disabled rule.

## 4. Trial As A Plan Option

- [x] 4.1 Add a translation key naming the trial option in the plan list, with no day count, across all nine languages.
- [x] 4.2 Add a reserved identifier for the trial selection that cannot collide with a RevenueCat package identifier, and make `selected` resolve to `null` while it is picked.
- [x] 4.3 Render the trial as the last `OptionRow` in the plan list, with zero in the `billed` slot, no subordinate line, and the currency symbol borrowed from the first available package or the dollar sign.
- [x] 4.4 List it only when `trialUsed` is false, an `accountId` exists, and no offered package returns days from `freeTrialDays`.
- [x] 4.5 Make the main button start the trial while that option is selected, labelled with `paywall.startTrial`, sharing the existing `busy` flag, closing the paywall on success and showing the error text on failure.
- [x] 4.6 Hide the auto-renewal wording while the trial option is selected, leaving it unchanged for the paid plans.
- [x] 4.7 Remove the earlier link-styled trial control under the purchase button, which this replaces.

## 5. Verification

- [ ] 5.1 Verify with real packages that every row shows the billed amount as its largest element and that the per-month figure, trial label and saving badge are smaller, secondary-coloured and below it.
- [x] 5.2 Verify real plans from RevenueCat render with the billed amount leading — confirmed on device against the Test Store.
- [ ] 5.3 Verify selecting the trial row switches the main button to starting the trial, that it unlocks premium and closes the paywall, and that a second attempt on the same account reports the failure with the paywall left open.
- [ ] 5.4 Verify the row is absent when the trial is used, when no account is signed in, and when any offered package carries store free days, and that selecting a paid plan again restores the purchase button and the renewal wording.
- [ ] 5.5 Verify the four rows fit the smallest supported screen in both themes, with the trial row reading zero in the same currency as the plans above it.
- [x] 5.6 Run the project typecheck and lint, then run strict OpenSpec validation for `fix-paywall-pricing-and-trial` and review the final diff.
- [ ] 5.7 Verify the failure states on device: plans that will not load, a purchase that does not complete, a cancelled purchase sheet staying silent, and a trial that will not start.
