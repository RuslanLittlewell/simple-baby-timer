## Why

The sleep and feeding cards in `DayStatsRow` currently expose only one daily metric even though the row already receives the related awake-duration and milk-volume totals. Making those cards visibly interactive lets caregivers access the paired metrics without adding more cards or crowding the activity screen.

## What Changes

- Make the sleep statistics card toggle between total sleep duration and total awake duration.
- Make the feeding statistics card toggle between feeding count and total recorded milk volume in millilitres.
- Give both interactive cards a clear button affordance, including an inner dashed-border detail and an indication that another value is available.
- Animate each press and update the selected value, label, and activity colour together.
- Keep the diaper and poop cards non-interactive and visually unchanged.
- Provide button accessibility semantics and labels that describe the value shown and the value available after activation.

## Capabilities

### New Capabilities

- `interactive-day-stats`: Toggleable daily activity summary cards, their visual affordances, animation, and accessibility behaviour.

### Modified Capabilities

None.

## Impact

- `src/features/activity/components/day-stats-row.tsx`: interactive state, press handlers, animated card presentation, and accessibility metadata.
- `src/features/activity/activity-screen.tsx`: continues supplying the existing `DayStats`; no new store state or persistence is required.
- `src/features/calendar/helpers.ts`: existing `awakeMs`, `feedingCount`, and `milkMl` values are reused; calculation changes are not expected.
- `src/i18n/index.ts`: may require concise labels or accessibility hints for toggled metrics.
- No API, Supabase schema, subscription, or dependency changes are expected.
