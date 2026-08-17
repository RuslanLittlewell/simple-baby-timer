## Context

See `proposal.md` for motivation. The synchronization gate is currently a full-screen `ThemedView` with an opaque themed background, centered `ActivityIndicator`, localized text, progress semantics, and a high z-index. The project already depends on `expo-blur` and uses `BlurView` with `experimentalBlurMethod="dimezisBlurView"` in multiple Android-compatible modal backdrops.

## Goals / Non-Goals

**Goals:**

- Preserve the existing overlay bounds, interaction blocking, lifecycle, and accessibility contract.
- Let users perceive the Activity screen beneath a clear blur effect.
- Keep the progress content readable across light and dark themes and supported platforms.
- Reuse established project patterns and avoid dependency or native configuration changes.

**Non-Goals:**

- Change when synchronization begins or ends.
- Add cancellation, progress percentage, or new synchronization states.
- Redesign the Activity screen or other modal backdrops.
- Make underlying content interactive through the blur.

## Decisions

### Separate the touch-blocking container from the visual blur layer

The existing absolute overlay becomes a transparent full-screen container that owns z-index, pointer interception, and accessibility. An absolute `BlurView` sits inside it with `pointerEvents="none"`, while the loader content remains above the blur.

Making the blur itself responsible for interaction blocking was rejected because the visual layer should remain replaceable without changing the safety behavior of the synchronization gate.

### Use the existing Expo Blur platform configuration

Use the installed `expo-blur` package with the project's established Android `dimezisBlurView` method and a moderate intensity consistent with current modal backdrops. Select a theme-aware tint so light mode stays bright and dark mode stays visually integrated.

A custom bitmap blur or newly installed UI library was rejected because the app already ships the required native implementation and has known-compatible usage patterns.

### Add only translucent contrast support

The full-screen container must not receive an opaque themed background. If centered text needs separation from complex content, place the spinner and label in a compact translucent themed surface with rounded corners; the Activity screen must remain visible around it. The blur layer also receives a low-opacity theme-compatible fallback color for platforms where blur is ineffective.

Keeping the existing full-screen fill behind `BlurView` was rejected because it would hide the source content and make the blur visually indistinguishable from the current design.

### Preserve existing synchronization semantics

The conditional rendering remains driven by the same `activitySyncing` value. The wrapper retains the localized label, progress role, busy state, absolute coverage, and higher stacking order than Activity controls. The blur view is purely presentational and must not introduce delayed mounting or unmounting that outlives the gate.

## Risks / Trade-offs

- **[Android blur may render differently across devices]** → Use the same experimental method and intensity range already exercised by project modals, plus a translucent fallback tint.
- **[Blurred colorful content can reduce label contrast]** → Use a compact translucent loader surface rather than increasing the opacity of the entire backdrop.
- **[Native blur has a rendering cost]** → Mount it only while synchronization is pending and avoid animations or nested blur layers.
- **[Wrapper pointer behavior can regress during refactoring]** → Keep the full-screen wrapper as the responder layer and verify presses and pager gestures do not reach content beneath it.

## Migration Plan

No data or native migration is required. Deploy the visual component change using the existing dependency. Rollback restores the opaque `ThemedView` without affecting synchronization state or stored activity data.
