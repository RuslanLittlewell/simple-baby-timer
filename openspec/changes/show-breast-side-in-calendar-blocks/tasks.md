## 1. Side Marker Derivation

- [x] 1.1 Add a pure helper mapping breast sides `left`, `right`, and `both` to `L`, `R`, and `RL`
- [x] 1.2 Return no marker for bottle, missing, and unrelated pro details

## 2. Calendar Presentation

- [x] 2.1 Render the side marker after activity/detail icons and before the title in completed feeding blocks
- [x] 2.2 Render the same marker in active feeding blocks when breast-side details are available
- [x] 2.3 Style the marker compactly while preserving existing title truncation, volume, time, and interaction behavior

## 3. Verification

- [x] 3.1 Add unit tests for all three side mappings and non-breast exclusions
- [x] 3.2 Add presentation tests for marker ordering in completed and live block rows and preservation of bottle volume text
- [x] 3.3 Run focused tests, TypeScript validation, lint, and strict OpenSpec validation
