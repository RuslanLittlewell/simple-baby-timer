## Context

`InteractiveStatCard` currently wraps its metric in a dashed inset outline and places a small swap icon inside that outline. The four-card row gives each card limited horizontal space, so every decorative element must remain subordinate to the value. The toggle state, press animation, and accessibility contract are already implemented by `make-day-stats-interactive`; this follow-up changes only the visual affordance. See `proposal.md` and `specs/borderless-stat-affordance/spec.md`.

## Goals / Non-Goals

**Goals:**

- Make sleep and feeding recognizable as controls without any content border.
- Communicate that each control has exactly two display states and show which state is active.
- Preserve metric width, platform compatibility, and the existing press animation.

**Non-Goals:**

- Change toggle behaviour, labels, accessibility strings, or daily-stat calculations.
- Add instructional text such as “Tap” inside the narrow cards.
- Change diaper or poop into controls.
- Introduce assets, dependencies, or global state.

## Decisions

### Replace the inset outline with an elevated card surface

The interactive card itself will receive a restrained platform-appropriate shadow/elevation while retaining the same background and corner radius. Static cards remain flat. The difference in depth makes the entire surface read as pressable without consuming internal content space.

Using a conventional outer border was rejected because it recreates the visual noise the change is intended to remove. A stronger gradient was rejected because it would compete with activity colours and imply selection rather than interactivity.

### Put the swap symbol in a small tonal badge

The existing swap icon will move into a rounded badge in the upper-right area. The badge uses a low-opacity version of the current activity colour as its background and the full activity colour for the icon. The content wrapper will reserve a small top area for the badge so it cannot overlap long values.

A text label such as “Tap” was rejected because it is difficult to localize within a quarter-width card and adds more reading than the interaction deserves.

### Add a two-position pill indicator in normal layout flow

Below the label, two short pills represent the two available metrics. The active pill is wider and uses the activity colour; the inactive pill is smaller and uses the theme border/disabled colour. `alternateSelected` chooses which pill is active, so the indicator changes in the same render as the metric.

The indicator stays in normal layout flow rather than absolute positioning. This adds a few vertical pixels but prevents overlap at narrow widths and makes both states legible even when the activity colour does not change, as with feeding count and milk volume.

### Preserve the existing animation and accessibility boundary

The `AnimatedPressable` remains the single touch and accessibility target. Existing named press handlers, scale values, button role, current-value label, and alternate-metric hint remain unchanged. Only the content arrangement and visual styles are replaced.

## Risks / Trade-offs

- **Elevation and shadow render differently on iOS and Android** → Use restrained values for both platform shadow properties and Android elevation, and verify neither card clips inside the row.
- **Additional vertical indicator increases row height** → Use 3–4 pixel pills and compact spacing; keep all four cards equal-height through the row layout.
- **Swap badge could collide with long values** → Reserve top space in the content flow and keep the badge compact rather than overlaying the metric line.
- **Multiple affordances could still feel busy** → Keep badge and indicator low-contrast at rest; activity colour is strongest only on the selected pill and metric.

## Migration Plan

Remove the inset border styles and replace the current content wrapper in place. No state or data migration is needed. Rollback restores the prior wrapper styles without affecting stored activity data or toggle behaviour.
