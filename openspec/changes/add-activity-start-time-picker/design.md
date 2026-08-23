## Context

See proposal.md — Why. What already exists:

- `transitionMainActivity(kind, proDetails, handoverAt)` passes the timestamp to `startActivity`, which clamps it with `Math.min(input, Date.now())` and, when a previous session is being closed, `Math.max(startedAt, prev.startedAt + 1)`. Back-dating is therefore already safe at the store level; this change only has to supply the number.
- `WheelField` wraps the native picker with `mode`, `minimumDate`, `maximumDate`, and `openOnMount` — "opens the picker as soon as the field appears, for steps whose only purpose is picking a time". The PRO panel's bottle step is its one current user.
- The two panels reach the store through different callbacks: the basic rows and the PRO awake tile both call the screen's `handleMainActivity`, while the PRO settling and sleep cards call `handleSaveMainActivity` from the card's save button. The PRO tiles' `onStop` also route through `handleMainActivity`.

## Goals / Non-Goals

**Goals:**

- One picker component serving both flows, so the awake button is literally the same code path in both panels.
- Leave `startActivity` and `transitionMainActivity` untouched.
- Never leave a caregiver with a started timer they did not confirm, or a dismissed step that blocks the next tap.

**Non-Goals:**

- Choosing a stop time, or editing a running timer's start after the fact — the calendar's entry editor already does that.
- Any change to feeding, including the bottle step that already picks a time.
- Choosing a calendar day: the range is bounded to the current day (see below).
- Changing how reminders, auto-stop, or the live activity treat a back-dated start — all of that is existing `startActivity` behaviour.

## Decisions

**The split falls out of the existing callbacks.** `handleMainActivity` gains the time step, which covers the basic panel's three rows and the PRO awake tile at once — that is what makes "the awake button is the same in both panels" true by construction rather than by duplicated logic. `handleSaveMainActivity` gains it separately, which places it after the PRO card's save press. The stop path is the same `handleMainActivity` call with the active kind, so it must short-circuit before the step: keep the existing `mainSession?.kind === kind` branch first and only then ask for a time.

**Bound the range to the current day.** `maximumDate` is now. `minimumDate` is `max(startOfToday, runningMainSession.startedAt)`. The floor exists because the picker is a clock face: with a `time` wheel every offered value has to belong to one calendar day, or 23:00 would be ambiguous between last night and tonight. Clamping to midnight makes every pickable time unambiguous, at the cost of not being able to back-date across midnight — a caregiver in that situation starts the timer and fixes the entry in the calendar, as they do today. Adding a day stepper was considered and rejected: this is the app's most frequent action and it should stay one confirmation deep.

**Extend `WheelField` with a dismissal callback.** Both flows mount the picker only to ask one question, so the owner must learn when it closed unconfirmed — otherwise the pending state never clears and the next tap finds a component that has already used up its `openOnMount`. Add an optional `onDismiss` fired on the iOS Cancel and backdrop paths and on a non-`set` Android event. The bottle step passes nothing and keeps its current behaviour. The alternative, remounting with a changing `key`, still leaves the screen unable to tell a confirmation from a dismissal.

**A small `StartTimePicker` wrapper in the activity feature.** It renders `WheelField` with `openOnMount`, the two bounds, and a trigger styled to take no space — the sheet is the whole point, the field's own row is not wanted. Keeping it in one component means the screen holds a single `pendingStart` value (kind, plus the PRO details when they came from the card) and renders the picker only while it is set.

**The PRO card stays open until the start succeeds.** `handlePrimaryPress` currently closes the card on success. With the time step the card must survive until the caregiver confirms, so the close moves behind the confirmation; a dismissal leaves the card open with its parameters intact, matching the panel's existing "keep the panel open so the user can retry" stance on a rejected save.

## Risks / Trade-offs

- **A dismissal that is read as a start** — if `onDismiss` is missed on one platform, the pending state sticks and the button appears dead. → The callback has to be wired on both the iOS Cancel/backdrop paths and the Android non-`set` event, and checked on both platforms; a dropped Android dismissal is the likely failure.
- **`activitySyncStatus` can change while the step is open** — the guards run before the step, so a sync that begins mid-pick would meet a start that `transitionMainActivity` then drops silently. → Re-check the guard when the confirmation comes back, not only when the button was pressed.
- **The floor moves while the step is open** — a partner's device could start an activity remotely between opening the step and confirming. → Bounds are computed when the step opens; the store's own clamp is the backstop, so the worst case is a start snapped a second past the newly running session.
- **One more tap on the most frequent action** — every start now costs a confirmation. → That is the requested trade; the wheel opens on the current time so the confirmation is a single press, and the basic panel keeps it to one step.
