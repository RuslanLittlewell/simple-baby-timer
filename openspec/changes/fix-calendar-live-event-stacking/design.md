## Context

`TimelineBlocks` renders completed duration entries and point events as absolute siblings. `LiveBlocks` is mounted after it in `calendar-screen.tsx`, so live gradients naturally paint above earlier siblings even though they represent less-specific, non-editable state. The current-time line is mounted last and already uses `pointerEvents="none"`. See `proposal.md` and `specs/calendar-event-layering/spec.md`.

React Native stacking must be explicit for consistent iOS and Android behaviour; JSX order alone is too easy to reverse during later timeline changes.

## Goals / Non-Goals

**Goals:**

- Establish a documented activity-layer hierarchy shared by calendar components.
- Ensure visible completed entries receive touches ahead of overlapping live blocks.
- Preserve the special prominence and touch target of compact point events.

**Non-Goals:**

- Resolve overlaps by changing lanes, widths, timestamps, or minimum touch heights.
- Make live blocks editable or visually redesign any block.
- Change event sorting, persistence, day clipping, or zoom calculations.

## Decisions

### Define explicit named stacking levels

Calendar timeline styles will use a small set of named numeric levels with this order:

1. Grid/background
2. Live activity blocks
3. Completed duration blocks
4. Diaper and poop point-event markers
5. Current-time line

The levels should be colocated with timeline rendering constants or styles rather than scattered magic numbers. Explicit `zIndex` values make the contract readable and keep completed entries above live blocks even if component order changes.

Relying only on reversing `<LiveBlocks>` and `<TimelineBlocks>` in JSX was rejected because it leaves point events and the current-time indicator implicit and is fragile across platforms and future refactors.

### Give point events a distinct level above completed durations

Point events deliberately render with a minimum touch height that can extend beyond their real short duration. Their narrow right-side lane and striped treatment are intended to remain accessible inside longer activities, so `eventBlock` receives a higher stacking level than normal completed blocks.

Using one level for all completed entries was rejected because render sorting is lane-based rather than a stable semantic guarantee, and a duration block could otherwise intercept the enlarged marker area.

### Keep live blocks below interactive history

Live blocks remain non-editable visual status and receive the lowest activity-content level. Completed `Pressable` entries above them therefore own the overlapping touch region. No pointer-event disabling is applied to the live layer globally, because its future interaction contract should not be silently changed outside the overlap requirement.

### Keep the current-time line visual-only

The current-time line receives the highest visual level and retains `pointerEvents="none"`. This allows the red indicator to cross every block without becoming the touch target.

Android elevation is not required for this flat absolute layout and could introduce unwanted shadows. Verification will confirm `zIndex` sibling ordering on both platforms; elevation should be added only if an actual platform rendering failure is observed.

## Risks / Trade-offs

- **A completed full-width block can obscure part of the live gradient** → This is intentional only where the entries overlap; the completed record is the more specific and editable item.
- **Minimum-height point events can claim a larger touch region than their timestamp span** → Preserve the current behaviour and place them above other entries so their existing accessibility target remains reliable.
- **Nested views can form unexpected stacking contexts** → Apply levels to the absolute root elements (`Pressable`/live gradient), not their internal gradient or stripe children.
- **Android and iOS can differ when elevation is mixed with z-index** → Avoid adding elevation and verify the flat sibling hierarchy through platform builds and focused visual interaction checks.

## Migration Plan

No data or state migration is needed. Deploy the style and render-order adjustment together. Rollback removes the explicit levels and restores the previous live-over-history painting behaviour without affecting stored entries.
