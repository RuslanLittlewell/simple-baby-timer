## 1. Independent Loader Composition

- [x] 1.1 Review the exact Expo SDK 57 and React Native positioning guidance before editing code.
- [x] 1.2 Remove the synchronization-loader node and slot styles from the Activity header without changing the header's child badge or Premium/menu elements.
- [x] 1.3 Mount the conditional loader as a separate screen-level sibling in a fixed 36 by 24 px absolute wrapper centered horizontally below the top safe-area inset.
- [x] 1.4 Make the overlay pointer-transparent and layer it without affecting layout or interaction.

## 2. Native Glowing-Orb Loader

- [x] 2.1 Replace the simple spinner with a React Native SVG/Reanimated adaptation of the supplied SVGator artwork.
- [x] 2.2 Reproduce the compact 3:2 composition, pink/blue/violet glow and rings, and an approximately three-second repeating motion cycle without browser scripts or a blurred backdrop.
- [x] 2.3 Preserve the existing accessibility label, conditional lifecycle, and Activity-only disabled-state behavior.

## 3. Verification

- [x] 3.1 Add focused contract tests proving the loader is outside the header and its horizontal position does not depend on header sibling widths.
- [x] 3.2 Verify regular/dense layouts, safe-area variations, and Premium shown/hidden states preserve the top-center loader position and existing synchronization behavior.
- [x] 3.3 Run targeted tests, TypeScript checks, linting, Expo build/export, strict OpenSpec validation, and final diff review.
