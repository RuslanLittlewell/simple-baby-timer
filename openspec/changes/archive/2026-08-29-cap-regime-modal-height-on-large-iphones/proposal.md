## Why

The regime detail modal now fits compact screens, but on tall devices such as iPhone 17 it can still grow too high and dominate the screen. A device-independent upper limit will keep the game information window visually compact while preserving access to long content through scrolling.

## What Changes

- Cap the regime detail modal's maximum height at 600 points even when more viewport height is available.
- Continue using the smaller viewport-safe height whenever safe areas and outer spacing leave less than 600 points.
- Show the native vertical scroll indicator in the regime information modal so overflowing game content is visually discoverable.
- Move the shared 5–15 minute play recommendation above the developmental-game list so it is visible before the individual activities.
- Preserve internal scrolling, natural height for short content, appearance, and dismissal behavior.
- Add focused coverage for iPhone 17-sized and iPhone 8-sized viewports.

## Capabilities

### New Capabilities

- `regime-detail-modal-size-cap`: Defines a consistent maximum height for regime information and developmental-game modals across compact and tall phones.

### Modified Capabilities

None.

## Impact

- Regime modal height calculation helper, scroll-view presentation, content order, and tests.
- No changes to regime content, translations, schedules, or general modal interactions.
