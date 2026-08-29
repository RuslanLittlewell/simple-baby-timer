## 1. Viewport-safe sizing

- [x] 1.1 Add a pure helper that calculates the available modal height from the window height, safe-area insets, and vertical outer spacing.
- [x] 1.2 Update `RegimeNoteModal` to use live window dimensions and safe-area insets and apply the calculated value as the card maximum height.
- [x] 1.3 Ensure the modal content scroll view shrinks and scrolls inside the constrained card without changing existing visuals or dismissal behavior.

## 2. Verification

- [x] 2.1 Add focused tests for iPhone 8-sized, larger, and changed-orientation viewport height calculations, including safe-area spacing.
- [x] 2.2 Verify long content remains reachable by internal scrolling and short content keeps its natural height.
- [x] 2.3 Run the relevant tests, type checking, linting, and strict OpenSpec validation.
