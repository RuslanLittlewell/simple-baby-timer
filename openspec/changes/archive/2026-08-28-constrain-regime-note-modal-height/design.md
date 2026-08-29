## Context

See `proposal.md` for motivation. `RegimeNoteModal` currently centers a card with a percentage-based `maxHeight: '82%'` and places its content in a `ScrollView`. A percentage alone does not explicitly reserve safe-area space and is difficult to validate against compact screens such as the 375 × 667 point iPhone 8 viewport.

## Goals / Non-Goals

**Goals:**

- Derive a deterministic maximum card height from the live window height, safe-area insets, and existing outer spacing.
- Keep overflowing content scrollable within the card.
- Make compact-screen behavior straightforward to test without changing the modal's content or interaction model.

**Non-Goals:**

- Redesigning the modal, changing its copy, or changing which regime activities appear.
- Introducing a new modal library or changing application-wide modal conventions.
- Changing horizontal sizing beyond preserving the existing width and maximum width.

## Decisions

### Derive the limit from live viewport measurements

The modal will read the current React Native window dimensions and safe-area insets, then calculate the maximum card height as the non-negative remainder after subtracting both vertical insets and the backdrop's intended top and bottom spacing. Live measurements make the constraint react to orientation and window changes.

An extracted pure sizing helper will own this arithmetic so compact and large viewport cases can be verified deterministically. Keeping the existing percentage was rejected because it does not express or directly test the safe-area requirement.

### Constrain the card and scroll only its content

The calculated value will be applied as the card's maximum height. The existing `ScrollView` will remain the overflow boundary and will be allowed to shrink within the card, so the backdrop and card stay fixed while long notes and activities scroll.

Making the entire modal or backdrop scroll was rejected because it could move dismissal controls and the card boundary off-screen.

### Preserve natural height below the limit

The card will receive a maximum height rather than a fixed height. Short content will therefore retain its current compact presentation on larger screens, while only overflowing content is constrained.

## Risks / Trade-offs

- [Very small viewports leave little content space] → Clamp the computed value to a non-negative height and keep content scrollable rather than allowing the card outside the viewport.
- [Nested layout rules prevent the scroll view from shrinking] → Add an explicit shrink constraint to the scroll container and cover the long-content case with a focused component or layout test.
- [Safe-area context is absent in an isolated test] → Mock the existing safe-area hook in the test harness rather than adding production fallbacks that hide integration errors.

## Migration Plan

This is a presentation-only change with no persisted-data migration. Deploy with the normal application release; rollback consists of reverting the modal sizing and helper changes.
