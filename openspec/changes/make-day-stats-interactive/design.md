## Context

`DayStatsRow` renders four equal-width cards from a `DayStats` value. The data model already includes `sleepMs`, `awakeMs`, `feedingCount`, and `milkMl`; only `sleepMs` and `feedingCount` are currently presented. The component is rendered above the activity controls and must remain compact enough for four cards on a phone-width row. See `proposal.md` for motivation and `specs/interactive-day-stats/spec.md` for observable behaviour.

## Goals / Non-Goals

**Goals:**

- Add discoverable interaction without increasing the number or width of cards.
- Keep the selected presentation local to `DayStatsRow` while allowing incoming statistics to update normally.
- Reuse the existing activity palette, typography, and animation dependency.
- Preserve accessibility and a clear distinction between interactive and informational cards.

**Non-Goals:**

- Persist the selected metric across screen remounts or app launches.
- Change how daily totals are calculated or stored.
- Make diaper and poop cards interactive.
- Add navigation, modals, or new dependencies.

## Decisions

### Keep independent local view state for the two cards

`DayStatsRow` will hold one boolean/enum for the sleep-card view and one for the feeding-card view. The default views remain sleep duration and feeding count. Incoming `stats` values will be formatted during render, so updated totals appear without resetting either selection.

This is preferred over Zustand state because the selection is temporary presentation state with no meaning outside the row. It is also preferred over a single shared index because each card must toggle independently.

### Render interactive and static cards through explicit card variants

The row will use a small internal interactive-card component backed by `Pressable`, while diaper and poop remain static themed views. Item metadata will provide the selected value, label, colour, accessibility text, and toggle handler. Event handlers containing branching or animation logic will be named functions rather than inline JSX blocks, following the component convention established in the activity feature.

This avoids making every card look actionable and keeps the interaction boundary explicit.

### Use a dashed inset outline and swap icon as the affordance

The sleep and feeding buttons will retain the existing outer card surface and add an inset container with a subtle dashed border derived from the selected activity colour. A compact `swap-horizontal` icon will sit inside the card without competing with the metric. Together these cues communicate that the card can be pressed and has an alternate value.

A dashed outline alone was considered but rejected because it can read as decoration. An icon alone was also rejected because its meaning is less clear without a button-like boundary.

### Animate the card surface, not the statistics layout

The existing Reanimated dependency will drive a shared scale value: `onPressIn` eases the card down to approximately `0.96`, and `onPressOut` springs it back to `1`. The metric toggles once through `onPress`. Animating the whole card avoids layout shifts and keeps adjacent cards stable.

Cross-fading the text was considered but is unnecessary for the first implementation and could make rapid updates harder to read.

### Build accessibility text from localized metric labels and values

Each interactive card will use button role semantics. Its label will include the selected metric and formatted value, while its hint will state which metric activation will reveal. Existing translations will be reused where suitable, with new concise statistics keys added for milk and toggle hints where required.

## Risks / Trade-offs

- **Long localized duration strings may crowd a quarter-width card** → Preserve single-line truncation and test representative languages at narrow device widths.
- **The dashed border may vary slightly between iOS and Android rendering** → Keep it inset, use a modest border width, and verify both platforms; the swap icon remains a second affordance.
- **Users may expect the selected view to persist** → Deliberately reset to the familiar default when the row remounts; persistence can be added later if user feedback supports it.
- **Repeated rapid taps could leave the press scale mid-animation** → Use interruptible shared-value animations and make the toggle depend only on the discrete press event.

## Migration Plan

No data migration is required. The component can be rolled back by restoring the static card rendering; stored activity data and daily-stat calculations remain compatible.
