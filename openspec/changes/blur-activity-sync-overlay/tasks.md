## 1. Blur Overlay Structure

- [x] 1.1 Review the exact Expo SDK 57 BlurView guidance and the project’s existing iOS and Android blur patterns before editing the Activity screen.
- [x] 1.2 Replace the opaque synchronization surface with a transparent full-screen responder container and an absolute, non-interactive BlurView layer.
- [x] 1.3 Configure moderate theme-aware blur intensity/tint and the established Android blur method without adding dependencies.
- [x] 1.4 Add a translucent theme-compatible fallback that does not become an opaque full-screen fill when native blur is unavailable.

## 2. Loader Presentation and Safety

- [x] 2.1 Place the progress indicator and localized label above the blur with a compact translucent contrast treatment suitable for light and dark themes.
- [x] 2.2 Preserve full-screen touch interception, stacking order, progress role, busy state, and localized accessibility label.
- [x] 2.3 Verify mounting and removal remain controlled exclusively by the existing synchronization-pending state.

## 3. Verification

- [x] 3.1 Verify Activity content remains recognizably blurred and loader content remains readable in light and dark themes.
- [x] 3.2 Verify taps, swipes, basic/PRO controls, and activity events do not pass through the blurred overlay.
- [x] 3.3 Verify native blur and fallback behavior on relevant iOS and Android targets.
- [x] 3.4 Run TypeScript checks, iOS and Android Expo builds/tests, strict OpenSpec validation, and final diff review.
