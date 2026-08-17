## Why

The dashed inset border makes the interactive statistics cards visually busy and competes with their compact values. The cards still need a clear, persistent interaction cue, but it should feel like part of the interface rather than a decorative frame.

## What Changes

- Remove the dashed inset border from the interactive sleep and feeding statistics cards.
- Present each interactive card as a subtly elevated control, with a small activity-coloured swap badge in the upper-right corner.
- Add a compact two-position indicator below the metric so the current side of the sleep/awake or count/millilitres pair is visible before and after tapping.
- Keep the existing scale/spring press animation and accessibility behaviour.
- Keep diaper and poop visually flat and non-interactive so the elevated surface, badge, and indicator consistently signal which cards can be tapped.

## Capabilities

### New Capabilities

- `borderless-stat-affordance`: Border-free visual treatment that makes compact toggleable statistic cards recognizably interactive and communicates their current position.

### Modified Capabilities

None. The related `interactive-day-stats` capability is still contained in the completed, unarchived `make-day-stats-interactive` change, so this follow-up declares its affordance as a separate capability rather than referencing a main spec that does not yet exist.

## Impact

- `src/features/activity/components/day-stats-row.tsx`: remove the dashed inset style and add the elevated surface, swap badge, and two-position indicator.
- No changes to toggle state, activity calculations, translations, persistence, APIs, Supabase, or dependencies.
- This change is a visual follow-up to `make-day-stats-interactive` and assumes that implementation remains present.
