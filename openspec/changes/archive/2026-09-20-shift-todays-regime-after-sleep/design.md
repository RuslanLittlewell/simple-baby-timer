## Context

See `proposal.md` for motivation and the capability spec for behavior. `PersonalRegime` is a recurring learned template persisted per child. Calendar ghost blocks and settling reminders currently derive directly from that template, while all local running-session completions converge on `finalizeSession`; shared remote completions have explicit save paths in the app store.

The base template cannot be mutated for this feature because doing so would change tomorrow and every other displayed day. A day can also contain several completed sleeps, so one global offset is insufficient: a later wake-up must correct only the suggestions after that sleep without moving earlier suggestions again.

## Goals / Non-Goals

**Goals:**

- Represent current-day corrections independently from the learned regime.
- Preserve the duration and order of every shifted suggestion.
- Support cumulative early and late corrections over several sleeps.
- Use one adjustment model for Calendar rendering and reminder scheduling.
- Record corrections for local and explicitly stopped shared running sleeps.

**Non-Goals:**

- Rebuild the learned personal regime from a single day.
- Move suggestions on previous or future days.
- Infer corrections from manually entered or edited historical sleep records.
- Change completed activity records or live-session synchronization.

## Decisions

### Store day-scoped adjustment anchors

Persist one adjustment record per child containing a local day key and ordered anchors. Each anchor identifies the base suggested sleep end after which it applies and an incremental minute delta. A suggestion receives the sum of anchors belonging to earlier sleeps.

This piecewise model keeps prior suggestions fixed and lets a later nap revise only the remaining schedule. A single offset was rejected because it would retroactively move the morning plan after every nap. Copying and mutating a full list of rendered blocks was rejected because reminder and Calendar calculations could diverge.

Only the current record per child is retained. A mismatched day key is ignored and replaced on the next successful adjustment, which bounds persisted state and naturally prevents yesterday's shift from leaking forward.

### Match the completed sleep against the effective current-day plan

Build the day's base sleep windows from the previous night's tail, naps, and tonight's sleep. Apply existing earlier anchors to obtain each window's effective position, then choose the suggested sleep that overlaps the completed running sleep. If no suggested window overlaps, do not adjust the plan.

For a match, the new incremental delta is the rounded actual end minute minus the effective suggested end minute. Attach it after the matched base end. This makes a 07:00-to-06:00 wake-up add `-60`, while a subsequent sleep ending 30 minutes after its already shifted end adds `+30` only after that sleep.

Nearest-time fallback matching was rejected because an unplanned sleep could otherwise move the whole remaining day unexpectedly.

### Derive adjusted ghost segments without mutating PersonalRegime

Extend the regime segment calculation to accept an optional valid day adjustment. Settling and sleep segments use the same cumulative offset for their base sleep, preserving their relative duration. Calendar supplies the adjustment only when the shown local day matches its key; all other dates use the base template.

### Reuse the adjustment model in reminder planning

Reminder planning applies today's anchors to today's settling starts and uses the unadjusted template for tomorrow. Updating the persisted adjustment changes the state observed by the reminder hook, which queues its existing serialized reconciliation and replaces obsolete future notifications.

### Record only completed running sleeps

After a sleep session is durably saved, invoke one store action that computes and persists the adjustment from the saved session and the child's base regime. Call it from the centralized local finalization path and the explicit shared-remote completion paths. Manual history edits and additions remain excluded because they are not the moment the user finishes a running sleep.

## Risks / Trade-offs

- **[An unplanned sleep overlaps a suggestion only briefly]** -> Require positive overlap and choose the greatest overlap; deterministic tests cover the selection.
- **[A very early shift places a suggestion before midnight]** -> Clip rendered segments to the current day and let reminder planning discard times that have already passed.
- **[The app closes while persistence is pending]** -> Use the existing persisted Zustand store; the in-memory plan updates immediately and storage follows the same durability behavior as the base regime.
- **[A remote session disappears without an explicit stop result]** -> Do not infer an exact wake-up from delayed reconciliation; adjust only when the app has a concrete completion timestamp.

## Migration Plan

Add the optional day-adjustment map with a persisted-state version migration/default. Existing installations hydrate with no adjustments and keep current behavior until the next matched sleep completes. Rollback can ignore the additional persisted field because the learned regimes remain unchanged.
