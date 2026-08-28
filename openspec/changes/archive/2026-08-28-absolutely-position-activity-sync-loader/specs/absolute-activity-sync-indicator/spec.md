## Purpose

Present the Activity synchronization indicator as an independent top-center screen element, without making it part of the header layout.

## ADDED Requirements

### Requirement: Loader is independent from the header
The Activity synchronization loader MUST be rendered as a separate screen-level DOM element, MUST be positioned absolutely at the horizontal center near the safe-area top, and MUST NOT be a child of or participate in the Activity header layout.

#### Scenario: Child badge width changes
- **WHEN** the active child name or age changes the width of the child badge
- **THEN** the synchronization loader remains at the same horizontal screen-center position
- **AND** the header structure and layout remain unchanged

#### Scenario: Premium content changes
- **WHEN** the Premium badge is shown, hidden, or changes the width of the right header control
- **THEN** the synchronization loader remains at the same horizontal screen-center position
- **AND** the header structure and layout remain unchanged

#### Scenario: Device safe area changes
- **WHEN** the screen has a different top safe-area inset
- **THEN** the loader remains centered horizontally and positioned below the unsafe top region

### Requirement: Loader uses the supplied glowing-orb treatment
The loader MUST use a native adaptation of the supplied SVGator artwork with a transparent background, a compact 3:2 canvas, pink/blue/violet glowing forms and rings, and a continuous animation approximating the source's three-second cycle. It MUST NOT execute the SVGator web runtime or an embedded browser script.

#### Scenario: Loader is rendered
- **WHEN** synchronization is pending
- **THEN** the user sees the animated glowing-orb treatment without a blurred or opaque backdrop

#### Scenario: Animation repeats
- **WHEN** synchronization remains pending for longer than one animation cycle
- **THEN** the native animation continues smoothly until synchronization reaches a terminal outcome

### Requirement: Absolute loader preserves existing behavior
The absolute loader MUST preserve its existing visibility lifecycle, accessibility, and non-interactive behavior without changing synchronization or Activity-button gating.

#### Scenario: Synchronization is pending
- **WHEN** Activity synchronization is pending
- **THEN** the absolute loader is visible and animated with the glowing-orb treatment
- **AND** it does not intercept input anywhere on the screen

#### Scenario: Synchronization finishes
- **WHEN** Activity synchronization reaches a terminal outcome
- **THEN** the absolute loader is removed without changing the position or behavior of header controls
