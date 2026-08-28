## Why

The Activity synchronization overlay currently replaces the entire screen with a solid background, making the transition feel abrupt and hiding the context the user was viewing. A blurred backdrop should keep the Activity screen recognizable while still communicating that its controls are temporarily unavailable.

## What Changes

- Replace the opaque synchronization overlay background with a full-screen blur that preserves a softened view of the Activity screen beneath it.
- Retain the centered progress indicator and localized synchronization label with sufficient contrast in light and dark themes.
- Keep the overlay fully touch-blocking and accessible while synchronization is pending.
- Provide a platform-appropriate translucent fallback if native blur is unavailable or reduced.
- Reuse the already-installed Expo blur integration and established Android blur configuration used by existing modals.

## Capabilities

### New Capabilities

- `blurred-activity-sync-overlay`: Visual, accessibility, interaction-blocking, theme, and fallback behavior for the Activity foreground-sync overlay.

### Modified Capabilities

None. The foreground sync capability has not yet been archived into the main specs, so this visual refinement is captured as a separate capability.

## Impact

- Primarily affects `src/features/activity/activity-screen.tsx` and its overlay styles.
- Uses the existing `expo-blur` dependency; no new package or native schema change is expected.
- Must match existing blur behavior on iOS and Android and preserve the synchronization gate implemented in the preceding change.
