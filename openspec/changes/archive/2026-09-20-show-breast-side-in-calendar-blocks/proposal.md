## Why

Calendar feeding blocks show that a session was breastfeeding but do not expose which breast was used without opening the entry. A compact side marker makes left, right, and both-side sessions distinguishable directly on the timeline.

## What Changes

- Show `L` for left-breast feeding, `R` for right-breast feeding, and `RL` when both breasts were used.
- Place the marker immediately after the activity/detail icons and before the feeding title in calendar timeline blocks.
- Apply the marker to completed and currently active feeding blocks when breast-side details are available.
- Do not show a side marker for bottle feeding, feeding without breast details, or non-feeding activities.
- Preserve existing icons, feeding volume text, time labels, editing interaction, and block sizing behavior.

## Capabilities

### New Capabilities

- `calendar-breast-side-markers`: Defines breast-side marker derivation and presentation in calendar feeding blocks.

### Modified Capabilities

None.

## Impact

- Calendar pro-details presentation helper.
- Completed and live timeline block rows.
- Focused tests for side mapping, marker placement, and non-breast exclusions.
