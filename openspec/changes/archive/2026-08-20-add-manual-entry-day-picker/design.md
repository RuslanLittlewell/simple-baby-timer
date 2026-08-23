## Context

See proposal.md — Why. The pieces already exist: `DayStepper` is a self-contained control (`dayMs`, `weekdays`, colors, `onChange`, `t`), `combineDayTime(dayMs, {hours, minutes})` builds a timestamp from a day and a time, and `EntryEditor` already wires the two together for settling/sleep/awake. `AddActivityModal` instead calls `combineDayTime(day.getTime(), …)` for both ends, where `day` is the calendar day passed in from `CalendarScreen`.

Two constraints shape the approach:

- `saveSession` files an entry under the day key of its `start`, so writing an entry to a day other than the one on screen needs no store or persistence work.
- The editor deliberately shows no day stepper for feeding (`editingDay` excludes it). The creation form is being asked to show it for every kind, so the two forms diverge on purpose.

## Goals / Non-Goals

**Goals:**

- Reuse `DayStepper` unchanged, so the create and edit forms share one day control and one visual language.
- Keep the modal's existing reset-on-open behaviour authoritative: opening the modal always re-seeds every field, days included.
- Let start and end days move independently, so an overnight stretch is expressible.

**Non-Goals:**

- Changing `EntryEditor`, including its choice not to step the day for feeding entries.
- Adding a calendar-style date picker, month jumping, or free date entry — stepping by one day matches the editor.
- Bounding how far the day steppers may travel (no "not in the future" or "not before the child's birth" rule).
- Changing what the calendar shows after a save.

## Decisions

**Day lives in state as a day-start timestamp, not inside the time strings.** The modal keeps `startInput`/`endInput` as `HH:mm` strings; add `startDayMs`/`endDayMs` alongside them, seeded in the existing `useEffect` from `startOfDayMs(day.getTime())`. Submit becomes `combineDayTime(startDayMs, startTime)` / `combineDayTime(endDayMs, endTime)`. This mirrors `EntryEditor` exactly and leaves the `WheelField` time pickers untouched. The alternative — holding full `Date` objects for start and end — would mean rewriting `timeAsDate`, `fmtTime` round-tripping, and the reset effect for no gain.

**Both day steppers render for all four kinds.** The user chose consistency inside the creation form over parity with the editor's `editingDay` rule. A kind-dependent stepper would also make the modal's height jump when switching to feeding, which the current fixed two-column time row avoids. The divergence is worth recording: if the editor is later made to step feeding days too, the two forms converge and no code here needs to change.

**Cross-midnight is allowed by dropping the same-day assumption, not by adding roll-over logic.** Validation stays a single `end <= start` check on the combined timestamps. The modal never silently pushes the end to the next day the way `EntryEditor` does for the non-`perDayDate` branch — with an explicit end-day selector on screen, guessing would contradict what the caregiver picked.

**Seed both steppers from the same day, always.** Even for an entry the caregiver intends to run overnight, the end day starts equal to the start day; they step it forward. Auto-advancing the end day when the end time is earlier than the start time was rejected: it would make the visible end-day value change under the caregiver's fingers while they scroll the time wheel.

**Weekday labels come from the store, as in the editor.** The modal reads `language` from `useAppStore` and indexes `WEEKDAYS_I18N`; `editor.prevDay` / `editor.nextDay` already exist for the stepper's accessibility labels, so no new i18n keys.

## Risks / Trade-offs

- **An entry saved for another day vanishes from view** — the calendar reloads the day on screen via `getSessionsForDay`, which keeps only entries overlapping that day, so a caregiver who steps back a day and saves an entry that ends before midnight sees no new block. → Accepted and unchanged from how the editor already behaves when an entry is moved off the viewed day; the save still closes the modal, giving the usual confirmation that it took.
- **Taller time column** — two steppers add height inside a modal already capped at 88% and scrollable. → The stepper is compact (a 2px-padded row) and the content is already in a `ScrollView`; verify on a small device that the save button stays reachable.
- **A far-off day can be picked by holding the stepper** — nothing prevents logging an entry weeks away. → Out of scope here; the same is true of the editor today.
- **Overnight entries change what day statistics see** — an entry crossing midnight is filed on its start day but overlaps the next. → `computeDayStats` already clamps durations to the day window (`durationInDay`), and `getSessionsForDay` selects by overlap rather than by bucket, so a crossing entry is already returned for both days and no new handling is needed; worth a manual check that an overnight sleep shows on both days.
