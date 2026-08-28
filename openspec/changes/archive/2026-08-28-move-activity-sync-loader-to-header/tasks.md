## 1. Header Indicator

- [x] 1.1 Review the exact Expo SDK 57, React Native SVG, and Reanimated guidance relevant to the existing dependency versions before editing code.
- [x] 1.2 Implement a transparent 24 px header indicator with the supplied SVG path, Premium magenta fill, accessible progress semantics, and a cleaned-up 600 ms continuous rotation.
- [x] 1.3 Add a flexible center header slot that conditionally renders the indicator between the existing child badge and Premium/menu control without disabling either control.

## 2. Activity Action Gating

- [x] 2.1 Inventory the rendered main activity, feeding, and event mutation buttons and add a consistent disabled prop/accessibility contract at each Pressable boundary.
- [x] 2.2 Wire the synchronization-pending state only to those Activity action buttons while retaining the existing handler and store guards.
- [x] 2.3 Verify child selection, Premium/menu, navigation, and non-Activity interactions remain enabled during synchronization.

## 3. Overlay Removal

- [x] 3.1 Remove the full-screen synchronization BlurView, ActivityIndicator, text surface, pointer interception, and associated imports/styles.
- [x] 3.2 Confirm synchronization lifecycle and timeout behavior remain unchanged and the indicator unmounts immediately at every terminal outcome.

## 4. Verification

- [x] 4.1 Add focused tests for indicator visibility/lifecycle and the distinction between disabled Activity actions and enabled non-Activity controls.
- [x] 4.2 Verify header layout, loader animation/color, and Activity disabled states in compact and regular layouts and light/dark themes.
- [x] 4.3 Run targeted tests, TypeScript checks, linting, strict OpenSpec validation, and final diff review; resolve failures attributable to this change.
