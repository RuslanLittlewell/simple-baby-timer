## Why

Three complaints about the same feature. The reminders arrive as loudly as the platform allows: they are sent with `interruptionLevel: 'timeSensitive'` and a sound, so they break through Focus and light up the lock screen at night, which is exactly when a sleeping baby's parent does not want their phone shouting. Their wording says little about what to do. And a mode restarted within fifteen minutes inherits the leftover of the previous run's timer through `reminderChain`, so a caregiver who switches modes by hand and comes back can get a reminder minutes later instead of at the interval they configured.

## What Changes

- Reminders are delivered quietly: no sound, no screen wake, no breaking through Focus. They wait in the notification list instead of announcing themselves.
- Each reminder's title becomes the mode's own name, and its body says what to do. The separate reminder titles are dropped in favour of the names the app already has.
- The body texts become, in Russian and faithfully translated into the other eight languages:
  - settling — "Напоминаем, чтобы вы не забыли выйти из режима засыпания."
  - sleep — "Напоминаем, что вы планировали пробуждение."
  - awake — "Напоминаем, что пора переходить ко сну."
- Every run of an activity schedules its full configured interval. The carry-over between consecutive runs of the same kind is removed, so a mode switched by hand and started again is not cut short by what the previous run used up.
- The Live Activity keeps showing the mode and the elapsed time, now counted from the moment the run actually started.

## Capabilities

### New Capabilities

- `activity-reminders`: When an activity reminder is scheduled, what it says, and how loudly it arrives.

### Modified Capabilities

None. `openspec/specs/` holds `manual-entry-day-selection` and `calendar-day-header-navigation`, neither of which covers reminders.

## Impact

- `src/lib/notifications.ts`: the interruption level and sound of a scheduled reminder.
- `src/state/app-state.ts`: `reminderChain`, `carriedFor`, `CHAIN_GAP_MS` and `carriedMs` are removed, and the reminder's title comes from the activity's own name.
- `src/i18n/index.ts`: three reminder bodies rewritten across nine languages; the three `notif.*.title` keys are removed.
- No changes to the Live Activity extension, to what is stored, or to sync.

## Assumptions

- iOS gives an app no way to keep its notifications off the lock screen — that is a per-app setting the person owns, under Settings → Notifications. What the app controls is how loudly they arrive, and this change makes them as quiet as the platform allows.
- The awake text is taken as "пора переходить ко сну"; the request read "пока", which is a typo for that.
