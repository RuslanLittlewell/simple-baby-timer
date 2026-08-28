## Context

See `proposal.md` for motivation. The Activity screen currently mounts a full-screen `BlurView` overlay containing a React Native `ActivityIndicator` and label whenever `activitySyncStatus` is `syncing`. Mutation handlers already guard against that state, but the overlay also blocks unrelated controls. The header currently lays out the child badge and `MobileMenu` with `space-between`.

The project already includes `react-native-svg` and `react-native-reanimated`. The supplied loader uses a 24-by-24 SVG path and a 0.6-second continuous rotation. No new dependency is required.

## Goals / Non-Goals

**Goals:**

- Remove every full-screen synchronization visual and pointer-interception layer from Activity.
- Keep synchronization visible in a stable header slot without displacing the child badge or menu unpredictably.
- Disable the rendered Activity mutation controls in addition to retaining handler/store guards.
- Preserve progress accessibility in the smaller indicator.

**Non-Goals:**

- Change synchronization timing, timeout, failure, or retry behavior.
- Disable child selection, Premium/menu, tab navigation, settings, or passive data inspection.
- Add progress percentage or synchronization cancellation.
- Redesign the Premium badge itself.

## Decisions

### Render a dedicated header sync indicator component

Create a small component containing the supplied SVG path in `viewBox="0 0 24 24"`. Wrap the SVG with an animated view and rotate it from 0 to 360 degrees using a linear, repeating 600 ms timing animation. Mount it only while synchronization is pending so the animation is cancelled through normal component cleanup.

Embedding SVG's web-oriented `<animateTransform>` directly was rejected because React Native SVG animation support differs from browser SVG. Animating the native wrapper uses the project's established Reanimated runtime consistently on iOS and Android.

### Reuse the Premium accent as the loader fill

Use the Premium badge's magenta accent (`#C026D3`) for the path so the indicator visually belongs to the Premium header treatment while remaining a single-color, legible 24 px glyph. Keep the component background transparent and render no synchronization text beside it.

Recreating the full Premium gradient inside the tiny path was rejected because it adds SVG definitions without a meaningful visual advantage at header size.

### Give the loader a centered header slot

Change the header layout to three children: the existing child badge, a flexible center slot containing the conditional indicator, and the existing `MobileMenu`. Use a center slot that absorbs remaining width while preserving the existing left and right controls. The indicator must sit visually between those controls and must not intercept touches outside its own bounds.

Absolutely positioning the loader was rejected because child names and the Premium badge can vary in width and overlap the indicator on narrow devices.

### Disable controls at their Pressable boundary

Pass the synchronization state as `disabled` to the Activity controls responsible for main activity transitions, feeding, and event logging. Each affected `Pressable` receives the native disabled prop, disabled accessibility state, and the established disabled visual treatment. Existing handler and store guards remain as defense in depth.

Do not pass this state to the child chip, `MobileMenu`, tabs, or unrelated header/navigation controls. A full-screen responder layer is removed entirely.

## Risks / Trade-offs

- **[Long child names plus Premium can constrain the center slot]** → Preserve child-name shrinking and give the center slot flexible width with a fixed-size 24 px indicator.
- **[A handler could be added without wiring its Pressable disabled state]** → Keep existing mutation guards and add focused verification for every Activity action control.
- **[Infinite animation can outlive synchronization if cleanup regresses]** → Mount the component conditionally and cancel/reset the animation in effect cleanup.
- **[Removing the overlay exposes content during refresh]** → This is intentional; mutation buttons remain disabled while passive content and unrelated navigation stay available.

## Migration Plan

1. Add the dedicated SVG header indicator using existing dependencies.
2. Insert its conditional center slot into the Activity header.
3. Wire synchronization disabled state to Activity mutation controls.
4. Remove the blur overlay, ActivityIndicator, label container, and unused styles/imports.
5. Rollback restores the prior overlay while leaving synchronization state unchanged.
