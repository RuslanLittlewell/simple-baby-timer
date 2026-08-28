## 1. Overlay State

- [x] 1.1 Replace `view: 'day' | 'week' | 'month'` with `overlay: 'none' | 'week' | 'month'` in `calendar-screen.tsx`, and point the header's calendar control at opening the week.
- [x] 1.2 Keep `openWeek` seeding `weekStart` from the shown day and clearing the pinch offset before the overlay opens.

## 2. One Modal Over The Day View

- [x] 2.1 Delete the two early returns and render the day view unconditionally.
- [x] 2.2 Render a single `Modal` with `visible={overlay !== 'none'}`, `animationType="fade"` and `onRequestClose` closing the overlay, choosing `WeekView` or `MonthView` from the flag.
- [x] 2.3 Pass the switch callback to both views in place of `onOpenMonth` and `onBackToWeek`, and seed `monthCursor` from `weekStart` when switching into the month.
- [x] 2.4 Give the switch control an accessible label naming the period it moves to.
- [x] 2.6 Move `OverlayShell` onto `modalStyles`: the centred backdrop, the `BlurView` overlay, and a card of the same width, radius, border and padding as the add-activity modal, capped at 70% of the screen height and scrolling inside that cap.
- [x] 2.7 Drop the `fill` layout from `WeekView` and size its seven rows to their content.
- [x] 2.8 Close the overlay when the backdrop outside the card is tapped, as the other modals do.
- [x] 2.5 Remove the statistics control from `OverlayShell` together with its `onStats` prop, and drop `onOpenStats` from `WeekView`, `MonthView` and both call sites, leaving the day header's statistics control untouched.

## 3. Scrolling And Timing

- [x] 3.1 Make `goToDay` close the overlay and scroll the timeline explicitly to the same target the first-layout auto-scroll uses, instead of clearing `didAutoScroll`.
- [x] 3.2 Leave `shiftShownDay` untouched, so the header arrows keep the scroll position.
- [x] 3.3 Gate the `syncCurrentDate` interval on the overlay being closed, and run one sync when it closes.

## 4. Verification

- [ ] 4.1 Verify the calendar control opens the overlay on the week containing the shown day, and that switching week ↔ month several times shows no flicker and no crash.
- [ ] 4.10 Verify the card is centred, no wider than the add-activity modal, over a blurred backdrop, and never taller than 70% of the screen — including a month that needs six rows, and on the narrowest supported screen.
- [ ] 4.2 Verify closing the overlay leaves the day, the scroll position and the zoom exactly as they were.
- [ ] 4.3 Verify picking a day from both the week and the month closes the overlay, shows that day, and recentres the timeline — to the current time for today, to the usual hour otherwise.
- [ ] 4.4 Verify the header arrows still keep the scroll position, so the two behaviours stay distinct.
- [ ] 4.5 Verify the overlay's top bar shows only the switch and the close control, and that statistics still open from the day header.
- [ ] 4.6 Verify the system back gesture closes the overlay on Android and does not leave the calendar.
- [ ] 4.7 Verify pinch-zoom still works on the timeline after the overlay has been opened and closed, and that taps inside the overlay register normally.
- [ ] 4.8 Verify the now-line is correct immediately after the overlay closes.
- [x] 4.9 Run the project typecheck and lint, then run strict OpenSpec validation for `move-calendar-periods-into-overlay` and review the final diff.
