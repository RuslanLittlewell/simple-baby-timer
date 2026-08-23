## Context

See proposal.md — Why. The day header ([calendar-screen.tsx](../../../src/features/calendar/calendar-screen.tsx)) is a centred row with three pieces: an absolutely positioned `backBtn` on the left (`chevron-left` → `openWeek`), a centred `dateBlock` (day number at 40pt over `MM.YYYY`), and an absolutely positioned `headerActions` group on the right (statistics, plus).

What already exists and shapes the approach:

- `goToDay` sets `shownDay`, clears `didAutoScroll`, and switches to the day view. Clearing that ref is what makes `onContentSizeChange` re-run the "scroll to now, or to 06:00" jump.
- The timeline reads `shownDay` through `dayStartMs`/`dayEndMs`, and `isToday` gates the now-line. Both follow `shownDay` with no extra work.
- `DayStepper` exists but is built for a compact inline row inside a modal, with its own label format and 13pt text.

## Goals / Non-Goals

**Goals:**

- Day stepping that reuses the existing `shownDay` state and nothing else.
- A header that still fits its three groups on a narrow screen.

**Non-Goals:**

- Touching `WeekView` / `MonthView` headers, or their week and month arrows.
- Swipe-to-change-day gestures — the pinch gesture already owns the timeline.
- Any "jump to today" affordance.
- Reusing `DayStepper` here (see below).

## Decisions

**Step by setting `shownDay` directly, not through `goToDay`.** The new handler is `setShownDay(new Date(y, m, d + delta))` and deliberately does not touch `didAutoScroll`, which is exactly what preserves the scroll position the user asked for. `goToDay` keeps its current behaviour for the week and month views, so opening a day from there still recentres. The alternative — routing the arrows through `goToDay` and adding a flag to suppress the scroll reset — puts a parameter on a function whose other two callers never want it.

**Local date arithmetic for the step**, matching `shiftDayMs` in the calendar helpers: constructing `new Date(year, month, date + delta)` rolls months and years correctly and stays on the local calendar day across DST, which arithmetic on milliseconds would not.

**Two standalone `Pressable` arrows flanking `dateBlock`, not `DayStepper`.** `DayStepper` bakes in its own label (`Пн, 20.08`), a 13pt centred text, a background pill, and `marginTop` — dropping it into the header would replace the 40pt date block that is the day view's anchor. The header instead keeps `dateBlock` and puts a `chevron-left` / `chevron-right` on each side of it, sized to match the existing header controls.

**Wrap the centre in a row rather than absolutely positioning the arrows.** `dateBlock` becomes a `dateRow` (`flexDirection: 'row'`, `alignItems: 'center'`) holding arrow, date block, arrow. The row stays centred by the header's `justifyContent: 'center'`, so the date stays optically centred and the arrows sit symmetrically around it whether the date is one or two digits.

**Reuse the existing translation keys.** `editor.prevDay` / `editor.nextDay` are already generic "Previous day" / "Next day" strings used by `DayStepper`, and `calendar.week` names the week view for the calendar icon's label. No new keys, no translation pass across five languages.

## Risks / Trade-offs

- **Header crowding on a narrow screen** — the centre row now needs roughly two 40pt controls plus the date, between an absolutely positioned icon on the left and two on the right. → Keep the arrows to the icon size already used by `headerAction` (34×40) and check the smallest supported width; if it is tight, the arrows lose their outer padding before the date block loses size.
- **Arrows sit next to a 40pt date** — a chevron at the default header size may look undersized beside it. → Size the chevrons to read as a pair with the date rather than matching the right-hand actions exactly; this is a visual judgement to confirm on device.
- **Preserved scroll can land on empty space** — stepping to a day whose records sit elsewhere leaves the caregiver looking at blank hours. → Intended: the scroll position is the caregiver's, and the empty-state overlay already covers a day with no records at all.
- **Losing the chevron removes the only "leave this screen" affordance in the header** — a caregiver used to the chevron may read the calendar icon as "go to a date" rather than "back to week". → It performs the same action either way, and the new accessible label states it; the arrows now absorb the day-to-day movement that made the chevron feel like navigation.
