## Context

See `proposal.md` for motivation. The header currently contains a flexible center loader slot between the child badge and `MobileMenu`; its center is therefore calculated from remaining space. The supplied replacement is a complex SVGator animation that relies on browser scripts and SVG features that cannot be used directly in React Native.

## Goals / Non-Goals

**Goals:**

- Keep the Activity header markup and layout free of loader elements.
- Anchor a separate loader to the horizontal screen center near the safe-area top.
- Reproduce the supplied loader's recognizable glowing-orb character using native primitives.
- Preserve synchronization lifecycle, accessibility, and Activity-action gating.

**Non-Goals:**

- Change child badge or Premium/menu layout.
- Change synchronization or disabled-state logic.
- Embed the SVGator JavaScript runtime or reproduce every source path morph pixel-for-pixel.

## Decisions

### Render a screen-level overlay sibling

Restore the header to its normal child badge and `MobileMenu` children. Mount the conditional loader separately under the Activity screen root, alongside the safe-area content rather than inside the header. Give its wrapper `position: "absolute"`, `left: "50%"`, a fixed 36 by 24 px canvas, and `translateX: -18`. Derive its fixed top offset from `useSafeAreaInsets().top` plus a design-system spacing value, so the loader clears the unsafe region without reading or depending on header measurements.

The wrapper uses `pointerEvents="none"` and a deliberate z-index. A fixed-width wrapper avoids creating a full-width input layer and makes the centering geometry explicit.

### Adapt the SVGator artwork to native animation

Implement a compact 3:2 `react-native-svg` composition using gradients, translucent rings, glow-like layered shapes, and the source palette (pink, blue, violet, red, and white accents). Drive rotation, scale/pulse, and opacity phases with Reanimated on an approximately 3000 ms repeating timeline. Do not copy or execute the SVGator script: browser-only filter and path-morph details are represented with native-compatible layered shapes and transforms.

### Keep behavioral state unchanged

Continue to derive visibility from the existing synchronization presentation state. The loader remains accessible and transparent, and only Activity mutation controls remain disabled while synchronization is pending. No data-loading or synchronization state machine changes are part of this change.

## Risks / Trade-offs

- **[The native adaptation is not a pixel-exact SVGator rendering]** → Preserve the source's palette, proportions, glow, rings, and motion character while using supported native primitives.
- **[The overlay can visually overlap content on unusually tight screens]** → Keep it compact, pointer-transparent, safe-area-aware, and verify dense layouts.
- **[Native SVG glow differs across platforms]** → Prefer layered translucent shapes and gradients over unsupported browser filters.

## Migration Plan

Remove the header loader slot, mount the new absolute screen-level indicator, and replace the spinner artwork. Rollback restores the previous indicator component and header slot without any state or data migration.
