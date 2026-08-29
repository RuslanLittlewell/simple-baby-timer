## 1. Height Cap

- [x] 1.1 Add an explicit 600-point regime modal height cap to the pure sizing helper
- [x] 1.2 Return the smaller of the height cap and the existing safe-area-aware available height
- [x] 1.3 Enable the native vertical scroll indicator in the regime information modal
- [x] 1.4 Move the optional shared play guidance above the developmental-game list while keeping it inside the scroll view

## 2. Verification

- [x] 2.1 Add tests showing an iPhone 17-sized viewport is capped at 600 points and an iPhone 8-sized viewport remains capped by its 599-point available height
- [x] 2.2 Verify short content retains natural height and long game content remains internally scrollable with a visible vertical indicator
- [x] 2.3 Verify shared guidance renders between the general note and the first game
- [x] 2.4 Run focused tests, TypeScript validation, lint, and strict OpenSpec validation
