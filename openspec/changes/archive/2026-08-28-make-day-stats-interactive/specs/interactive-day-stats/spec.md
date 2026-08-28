## Purpose

Provide compact, discoverable controls in the daily statistics row so caregivers can switch between related activity totals without leaving the activity screen.

## ADDED Requirements

### Requirement: Sleep card toggles sleep and awake duration

The daily statistics row SHALL present the sleep card as a button that initially displays the current day's total sleep duration and toggles between sleep duration and awake duration on each activation.

#### Scenario: Initial sleep metric

- **WHEN** the daily statistics row is first displayed
- **THEN** the sleep card shows the current day's total sleep duration
- **AND** the card uses the sleep label and sleep activity colour

#### Scenario: Show awake duration

- **WHEN** the user activates the sleep card while sleep duration is displayed
- **THEN** the same card shows the current day's total awake duration
- **AND** the card uses the awake label and awake activity colour

#### Scenario: Return to sleep duration

- **WHEN** the user activates the sleep card while awake duration is displayed
- **THEN** the same card returns to the current day's total sleep duration

### Requirement: Feeding card toggles count and milk volume

The daily statistics row SHALL present the feeding card as a button that initially displays the current day's feeding count and toggles between feeding count and the current day's total recorded milk volume on each activation.

#### Scenario: Initial feeding metric

- **WHEN** the daily statistics row is first displayed
- **THEN** the feeding card shows the current day's feeding count
- **AND** the card uses the feeding label and feeding activity colour

#### Scenario: Show recorded milk volume

- **WHEN** the user activates the feeding card while the feeding count is displayed
- **THEN** the same card shows the current day's total recorded milk volume followed by the localized millilitre unit
- **AND** a day without recorded volume is shown as zero millilitres

#### Scenario: Return to feeding count

- **WHEN** the user activates the feeding card while milk volume is displayed
- **THEN** the same card returns to the current day's feeding count

### Requirement: Interactive cards are visually discoverable

The sleep and feeding cards MUST have a consistent visual affordance that distinguishes them from the non-interactive cards without reducing the readability of their values.

#### Scenario: Interactive cards at rest

- **WHEN** the daily statistics row is visible and no card is being pressed
- **THEN** the sleep and feeding cards show an inner dashed outline and a compact toggle indicator
- **AND** the diaper and poop cards do not show the interactive affordance

#### Scenario: Metric selection changes

- **WHEN** an interactive card switches to its alternate metric
- **THEN** its value, label, colour, and toggle indicator update together to represent the selected metric

### Requirement: Interactive cards animate on activation

Each interactive statistics card SHALL provide immediate press feedback and SHALL complete the metric switch without delaying user interaction.

#### Scenario: Press feedback

- **WHEN** the user presses an interactive statistics card
- **THEN** the card briefly scales down
- **AND** the card springs or eases back to its resting scale after release
- **AND** the selected metric toggles once for that activation

### Requirement: Interactive cards expose accessible button semantics

Each interactive statistics card MUST be exposed as a button and MUST communicate both its current metric and the result of activating it to assistive technology.

#### Scenario: Screen reader focuses an interactive card

- **WHEN** assistive technology focuses the sleep or feeding card
- **THEN** it announces button semantics
- **AND** it announces the currently displayed metric and value
- **AND** its accessibility hint describes the alternate metric available on activation

### Requirement: Daily totals remain live while toggled

The selected card view SHALL continue to reflect updated daily statistics when activity data changes.

#### Scenario: Statistics update on an alternate metric

- **WHEN** an interactive card is showing its alternate metric and the underlying daily total changes
- **THEN** the displayed value updates without resetting the card to its default metric
