## Context

See proposal.md — Why. What the code does today:

- `scheduleActivityNotification` sends `sound: true` with `interruptionLevel: 'timeSensitive'`, the level reserved for things that may interrupt a focus mode.
- `startActivity` builds the message from `notif.<kind>.title` and `notif.<kind>.body`, two keys per activity in each of nine languages.
- `reminderChain` records what the last run of a kind used up; `carriedFor` returns it when the same kind restarts within `CHAIN_GAP_MS` (15 minutes); `carriedMs` then both shortens the new reminder and back-dates the Live Activity's timer. `stopActivity` clears the chain, but a manual switch does not.
- Cancellation is already thorough: `startActivity` cancels the previous run's reminder, `stopActivity` cancels its own, and the post-scheduling block cancels an id that arrives after the timer it belonged to was replaced.

## Goals / Non-Goals

**Goals:**

- Make the reminder as unobtrusive as the platform permits without switching it off.
- Make each run's reminder depend only on that run.
- Keep the existing cancellation guarantees intact while the surrounding code changes.

**Non-Goals:**

- Touching the Live Activity extension or how the widget looks.
- Adding a home-screen widget.
- Making reminders configurable beyond the per-activity switches that already exist.
- Removing reminders from the lock screen outright — see the constraint below.

## Decisions

**`interruptionLevel: 'passive'` and no sound.** The four levels are passive, active, timeSensitive and critical; passive is the only one that neither plays a sound nor lights the screen, which is what "quietly" has to mean for a reminder that fires at three in the morning. The alternative, `active`, still wakes the screen. The reminder is not lost — it sits in the notification list.

**The platform decides lock-screen visibility, not the app.** There is no API for "deliver this notification but keep it off the lock screen"; that is a per-app switch the person controls in Settings. Passive delivery is the closest the app can get, and the honest framing for the requirement is how loudly the reminder arrives rather than where it appears. If what actually needs to disappear from the lock screen is the widget rather than the reminder, that is a different change — the widget was explicitly kept here.

**The title comes from `kind.<activity>`, the keys the app already uses everywhere.** That removes three keys per language rather than adding any, and guarantees the reminder names the mode exactly as the rest of the app does. Only the three bodies are rewritten.

**`reminderChain` is deleted, not disabled.** Once every run schedules its full interval, `carriedFor` can only ever return zero, so keeping the structure would leave three concepts — the chain, the gap constant, and `carriedMs` — that no longer decide anything. `carriedMs` also back-dates the Live Activity's start, so it goes with them and the widget counts from the real start of the run.

**Cancellation is left exactly as it is.** It already covers the switch, the stop and the race between starting and registering. The spec pins that behaviour so this rewrite cannot quietly lose it.

## Risks / Trade-offs

- **A quiet reminder is a reminder that can be missed** — passive delivery means a caregiver who does not look at their phone will not learn the interval elapsed. → That is the trade being asked for; the Live Activity still shows the running time at a glance, and the per-activity switches still allow turning a reminder off entirely rather than leaving it noisy.
- **The lock-screen wording may not be what was meant** — the request asked for no timers or widgets on the lock screen, and the decision taken was to keep the widget and quiet the reminders. If the widget itself is the thing that must go, this change addresses the wrong half. → Called out here and in the summary so it is settled before implementation, not after.
- **Dropping the carry-over can postpone a reminder indefinitely** — that carry-over existed so that a nap stopped and restarted repeatedly still reminded at the two-hour mark; without it, each restart buys another full interval. → This is the explicit request: a run started by hand should get its whole interval. The behaviour is now predictable, which the old rule was not — its fifteen-minute window was invisible to the caregiver.
- **Nine languages of new wording** — three bodies each, and a mistranslation is not caught by any test. → The Russian strings are fixed by the spec; the rest are translations of them, to be read once by someone before release.
