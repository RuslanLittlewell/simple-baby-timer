## 1. Borderless Interactive Surface

- [x] 1.1 Remove the dashed inset outline and border-specific wrapper styles from `InteractiveStatCard` without changing its dimensions, metric state, or toggle handlers.
- [x] 1.2 Add restrained iOS shadow properties and Android elevation to interactive sleep and feeding cards while keeping diaper and poop cards flat.

## 2. Interaction Affordances

- [x] 2.1 Restyle the swap symbol as a compact rounded badge using a low-opacity activity-colour background and reserve enough content space to prevent value overlap.
- [x] 2.2 Add a two-position pill indicator below the label and bind its active position to `alternateSelected` for both sleep and feeding cards.
- [x] 2.3 Preserve the existing press animation, named press handlers, single-toggle behaviour, and accessible button label, value, and hint.

## 3. Verification

- [x] 3.1 Verify that sleep and feeding switch their metric and indicator exactly once in both directions, with no content border visible.
- [x] 3.2 Verify narrow-width and long-localized-value layouts on iOS and Android, including equal card heights, unclipped elevation, and no badge or indicator overlap.
- [x] 3.3 Verify that diaper and poop remain non-interactive and visually flat, then run the project typecheck and relevant existing tests.
- [x] 3.4 Run strict OpenSpec validation for `refine-day-stats-affordance` and review the final change diff.
