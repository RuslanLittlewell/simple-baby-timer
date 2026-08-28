## Why

The Activity synchronization loader currently participates in the header flex layout, so its position shifts when the child badge or Premium/menu width changes. It should instead be an independent screen-level element anchored at the top center, while the header DOM/layout remains untouched.

## What Changes

- Remove the synchronization loader from the Activity header markup and restore the header to its child badge and Premium/menu elements only.
- Render the loader as a separate, absolutely positioned screen-level element at the safe-area top center.
- Replace the simple spinner with a native React Native SVG/Reanimated adaptation of the supplied SVGator glowing-orb loader.
- Keep the loader transparent and non-interactive, without a blurred backdrop.
- Preserve the existing synchronization lifecycle, accessibility, and Activity-only disabled behavior.

## Capabilities

### New Capabilities

- `absolute-activity-sync-indicator`: Independent top-center positioning and visual behavior for the Activity synchronization indicator.

### Modified Capabilities

None.

## Impact

- Affects the Activity screen composition/styles and synchronization-indicator component.
- Uses the project's existing React Native SVG and Reanimated stack; no SVGator runtime or web script is introduced.
- No synchronization logic, native configuration, or data changes are expected.
