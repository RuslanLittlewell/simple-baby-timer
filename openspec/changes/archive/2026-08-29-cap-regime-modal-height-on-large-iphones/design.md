## Context

See `proposal.md` for motivation. The modal already calculates a viewport-safe maximum from live window height, safe-area insets, and outer spacing. On tall phones that calculation can produce a visually excessive card height. The existing card uses `maxHeight`, and its content already scrolls internally.

## Goals / Non-Goals

**Goals:**

- Add a predictable upper bound without weakening the compact-screen safety calculation.
- Keep the sizing calculation deterministic and covered for iPhone 8- and iPhone 17-class viewports.
- Make overflow discoverable with the platform-native vertical scroll indicator.
- Put shared play guidance before the activity list so it is encountered first.

**Non-Goals:**

- Changing modal width, visual styling, content, or interaction behavior.
- Detecting particular iPhone model names or adding device-specific branches.

## Decisions

### Cap the existing available-height calculation at 600 points

The pure sizing helper will return the minimum of 600 points and the non-negative viewport-safe height. A shared exported constant will make the design value explicit and testable.

A model-name check was rejected because viewport behavior should remain correct for future devices, Display Zoom, rotation, and split-window environments. A percentage cap was rejected because it would make the modal unnecessarily shorter on compact screens and still vary across tall devices.

### Preserve `maxHeight` rather than setting fixed height

The card will continue receiving only a maximum height. Short content will keep its natural size, while the existing scroll view handles content above the cap.

### Enable the native vertical scroll indicator

The regime modal's existing scroll view will show its vertical indicator instead of suppressing it. This uses familiar platform behavior, adds no overlay that could obscure translated content, and automatically reflects the scroll position.

A custom persistent scrollbar was rejected because it would require measuring content and viewport sizes, maintaining animated scroll state, and adding separate accessibility behavior for an affordance already supplied by the platform.

### Render shared guidance before the game collection

Within the existing scroll content, the optional guidance block will move between the general regime note and the games container. It remains part of the same scroll view, so the height cap and scroll indicator apply consistently, while users see the 5–15 minute/non-testing context before choosing an activity.

Pinning the guidance outside the scroll view was rejected because it would reduce the already capped space available to games and introduce a separate fixed layout region.

## Risks / Trade-offs

- [Six-game blocks require more scrolling] → Preserve the internal scroll container, show its vertical indicator, and explicitly test that the cap does not replace it with fixed clipping.
- [600 points feels slightly different across platforms] → Use logical layout points consistently, avoiding fragile hardware detection.

## Migration Plan

No data migration is required. Rollback restores the uncapped viewport-safe helper result.
