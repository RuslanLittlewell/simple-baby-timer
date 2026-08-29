## Purpose

Make the recorded breast side visible directly in completed and active calendar feeding blocks without requiring users to open each entry.

## ADDED Requirements

### Requirement: Breast side maps to a compact marker
The system SHALL map left-breast feeding to `L`, right-breast feeding to `R`, and both-breast feeding to `RL`.

#### Scenario: Left-breast session is displayed
- **WHEN** a feeding block contains breast details with side `left`
- **THEN** the block displays `L`

#### Scenario: Right-breast session is displayed
- **WHEN** a feeding block contains breast details with side `right`
- **THEN** the block displays `R`

#### Scenario: Both-breast session is displayed
- **WHEN** a feeding block contains breast details with side `both`
- **THEN** the block displays `RL`

### Requirement: Marker follows the block icons
The system SHALL place the breast-side marker after the activity and breast-detail icons and before the feeding title whenever the block has enough height to show its text row.

#### Scenario: Completed breast-feeding block has visible text
- **WHEN** a completed breast-feeding block is tall enough to render its content row
- **THEN** the side marker appears between its icons and feeding title

#### Scenario: Active breast-feeding block has visible text
- **WHEN** an active breast-feeding block is tall enough to render its content row and has breast-side details
- **THEN** the side marker appears between its icons and feeding title

### Requirement: Marker is restricted to breast feeding
The system SHALL NOT show a breast-side marker for bottle feeding, feeding sessions without breast details, or non-feeding activities.

#### Scenario: Bottle feeding is displayed
- **WHEN** a feeding block contains bottle details
- **THEN** no `L`, `R`, or `RL` breast-side marker is added

#### Scenario: Legacy feeding lacks details
- **WHEN** a feeding block has no breast-mode side details
- **THEN** the existing block content is displayed without a side marker

### Requirement: Existing calendar information is preserved
The marker SHALL NOT replace or remove existing activity/detail icons, feeding titles, volume values, time ranges, active styling, or editing interactions.

#### Scenario: Bottle volume is displayed
- **WHEN** a completed bottle-feeding block has a stored milk volume
- **THEN** its existing volume text remains visible and no breast-side marker is shown
