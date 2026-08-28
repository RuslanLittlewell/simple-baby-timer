## Why

The full-screen synchronization overlay obscures the Activity screen and makes a short background refresh feel disruptive. Synchronization should remain visible and keep unsafe activity actions unavailable without blocking child selection, Premium/menu access, or the rest of the screen.

## What Changes

- Remove the full-screen synchronization blur, backdrop, centered spinner, and synchronization label from the Activity screen.
- Show a compact rotating SVG synchronization indicator in the Activity header between the child badge and the Premium/menu control.
- Match the indicator color to the Premium visual palette and preserve the supplied 24-by-24 path silhouette and 0.6-second continuous rotation.
- Disable only Activity action buttons while synchronization is pending, including main activity, feeding, and event controls.
- Keep the child badge, Premium/menu control, navigation, and non-Activity interactions available while the indicator is visible.
- Preserve accessible busy/progress semantics without announcing or rendering a full-screen blocking surface.

## Capabilities

### New Capabilities

- `activity-header-sync-indicator`: Header placement, appearance, accessibility, lifecycle, and Activity-action gating for foreground synchronization.

### Modified Capabilities

None.

## Impact

- Primarily affects `src/features/activity/activity-screen/activity-screen.tsx`, its styles, and Activity action components that expose disabled state.
- Removes Activity-screen usage of `expo-blur` and the React Native `ActivityIndicator` for this synchronization state.
- Reuses the installed SVG and animation stack; no new package or native configuration is expected.
- Supersedes the presentation planned by `blur-activity-sync-overlay` without changing synchronization lifecycle or data behavior.
