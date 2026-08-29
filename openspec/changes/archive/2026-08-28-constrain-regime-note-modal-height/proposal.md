## Why

Long regime details, especially wake blocks containing several developmental games, can extend beyond the visible screen on compact devices such as iPhone 8. The modal must remain fully contained within the usable viewport while keeping all content reachable.

## What Changes

- Constrain the regime detail modal to the current window height minus safe-area insets and deliberate outer spacing.
- Keep long modal content vertically scrollable inside the constrained card.
- Recalculate the available height after window-size or orientation changes.
- Preserve the existing modal appearance, backdrop dismissal, content, and behavior on larger devices.

## Capabilities

### New Capabilities

- `responsive-regime-detail-modal`: Defines viewport-safe sizing and internal scrolling for regime detail content on compact devices.

### Modified Capabilities

None.

## Impact

- `RegimeNoteModal` sizing and scroll-container styles.
- Safe-area and window-dimension handling in the regimes feature.
- Focused presentation tests for iPhone 8-sized and larger viewports.
