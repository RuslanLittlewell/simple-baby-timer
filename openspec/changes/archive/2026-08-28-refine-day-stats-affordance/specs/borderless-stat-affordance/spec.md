## Purpose

Make compact toggleable statistic cards visibly interactive without surrounding their content with a border or competing with the primary metric.

## ADDED Requirements

### Requirement: Interactive statistics cards use a border-free affordance

Interactive daily-statistics cards MUST NOT use a solid, dashed, or dotted content border to communicate interactivity. They SHALL instead use a subtly elevated surface and a compact activity-coloured swap badge.

#### Scenario: Interactive cards at rest

- **WHEN** the daily statistics row is visible and no card is being pressed
- **THEN** the sleep and feeding cards have no content outline
- **AND** each has a subtle elevated treatment relative to the flat informational cards
- **AND** each shows a compact rounded badge containing a swap symbol in its upper-right area

#### Scenario: Informational cards remain visually distinct

- **WHEN** the daily statistics row is visible
- **THEN** the diaper and poop cards do not show the swap badge or position indicator
- **AND** they retain their flat, non-interactive presentation

### Requirement: Interactive statistics cards communicate toggle position

Each interactive card SHALL show a compact two-position indicator whose active position corresponds to the metric currently displayed.

#### Scenario: Default metric is selected

- **WHEN** an interactive card shows its default metric
- **THEN** the first position in its indicator is visually active
- **AND** the second position is visually inactive

#### Scenario: Alternate metric is selected

- **WHEN** the user activates an interactive card and its alternate metric is displayed
- **THEN** the second position in its indicator becomes visually active
- **AND** the first position becomes visually inactive

#### Scenario: Card returns to default metric

- **WHEN** the user activates an interactive card while its alternate metric is displayed
- **THEN** the first indicator position becomes active again together with the default metric

### Requirement: Affordance preserves metric readability and feedback

The border-free affordance MUST fit inside the existing four-card row without obscuring or reflowing the displayed metric, and the existing press animation and accessible button semantics MUST remain available.

#### Scenario: Long metric value is displayed

- **WHEN** a localized duration or milk value approaches the available card width
- **THEN** the metric remains the primary visual element
- **AND** the swap badge and position indicator do not overlap the value or label

#### Scenario: Interactive card is activated

- **WHEN** the user presses the sleep or feeding card
- **THEN** the card provides its existing scale-down and return animation
- **AND** the metric and position indicator toggle exactly once
- **AND** assistive technology continues to receive button semantics, current value, and alternate-metric hint
