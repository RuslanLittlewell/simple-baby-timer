## 1. Calendar Icon

- [x] 1.1 Replace the header's `chevron-left` with `calendar-month-outline` in `calendar-screen.tsx`, keeping the `openWeek` handler, the `backBtn` position, and the pressed style.
- [x] 1.2 Add `accessibilityLabel={t('calendar.week')}` to that control, which currently has none.

## 2. Day Arrows Around The Date

- [x] 2.1 Add a `shiftShownDay(delta)` handler that sets `shownDay` to `new Date(year, month, date + delta)` and leaves `didAutoScroll` untouched, so the timeline keeps its scroll position.
- [x] 2.2 Wrap `dateBlock` in a centred `dateRow` holding a backward `Pressable`, the date block, and a forward `Pressable`, each labelled with `editor.prevDay` / `editor.nextDay` and using the existing pressed opacity.
- [x] 2.3 Add the `dateRow` and arrow styles, sizing the chevrons to read as a pair with the 40pt date and keeping the row clear of the absolutely positioned left icon and right actions.

## 3. Verification

- [ ] 3.1 Verify stepping back and forward changes the header date and the timeline's records, including across a month boundary and a year boundary, and that stepping past today is allowed.
- [ ] 3.2 Verify the now-line disappears when stepping off today and returns when stepping back onto it.
- [ ] 3.3 Verify the timeline keeps its scroll position when stepping days, while picking a day in the month view still recentres.
- [ ] 3.4 Verify the calendar icon still opens the week view on the week of the shown day, and check the header layout on the narrowest supported width in both themes.
- [x] 3.5 Run the project typecheck and lint, then run strict OpenSpec validation for `rework-calendar-day-header` and review the final diff.
