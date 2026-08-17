## 1. Timeline Layer Definitions

- [x] 1.1 Define named calendar stacking levels for grid, live blocks, completed duration blocks, point-event markers, and the current-time line.
- [x] 1.2 Apply the live level to each absolute live activity root and the completed level to each completed duration `Pressable` without changing their geometry or content.
- [x] 1.3 Apply the higher point-event level to diaper and poop marker `Pressable` roots so their enlarged touch targets remain above duration blocks.

## 2. Calendar Composition

- [x] 2.1 Align `LiveBlocks` and `TimelineBlocks` render order with the explicit hierarchy while retaining `zIndex` as the authoritative stacking contract.
- [x] 2.2 Apply the highest visual level to the current-time line and preserve its non-interactive pointer behaviour.
- [x] 2.3 Confirm no elevation, overflow, or nested child style creates a competing stacking context on iOS or Android.

## 3. Verification

- [x] 3.1 Verify a completed duration entry overlapping a live activity stays visible and opens the correct entry editor when pressed.
- [x] 3.2 Verify diaper and poop markers remain visible and editable over both live and completed duration blocks, including minimum-height overlaps.
- [x] 3.3 Verify the current-time line remains visible but does not capture touches, and that zooming preserves all existing block positions, sizes, lanes, and labels.
- [x] 3.4 Run TypeScript checks, iOS and Android platform builds, strict OpenSpec validation, and review the final diff.
