## Why

The calendar renders current live activity blocks after completed timeline entries, so a long running activity can visually cover events recorded inside the same time range. Those completed events must remain visible and tappable because they carry distinct historical information.

## What Changes

- Define an explicit calendar stacking order instead of relying on sibling render order.
- Render current live activity blocks below completed timeline entries that overlap them.
- Keep compact diaper and poop event markers above both live and completed duration blocks.
- Keep the current-time line visible above timeline content without intercepting touches.
- Preserve existing lane widths, positions, gradients, timestamps, and entry-edit interactions.

## Capabilities

### New Capabilities

- `calendar-event-layering`: Predictable visual and touch stacking for live activities, completed duration entries, point-event markers, and the current-time indicator.

### Modified Capabilities

None. No main specification currently defines calendar timeline stacking.

## Impact

- `src/features/calendar/components/timeline-blocks.tsx`: assign explicit stacking levels to completed blocks, point events, and live blocks.
- `src/features/calendar/calendar-screen.tsx`: align component order and the current-time line with the stacking contract.
- No changes to activity data, calculations, persistence, Supabase, navigation, translations, or dependencies.
