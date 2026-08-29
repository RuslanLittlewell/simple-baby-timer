## Purpose

Defines how age-appropriate, localized developmental game suggestions are distributed and presented within wake blocks of the 5–6 month regime without altering its schedule.

## ADDED Requirements

### Requirement: Developmental games in every 5–6 month wake block
The system SHALL present three or four age-appropriate developmental games in every generated wake block of the 5–6 month regime.

#### Scenario: Caregiver opens a wake block
- **WHEN** a caregiver selects any wake block in the 5–6 month regime
- **THEN** the system displays three or four assigned developmental games
- **AND** each game includes a title and full practical instruction

#### Scenario: Supplied activity set is distributed
- **WHEN** the current 5–6 month daily regime is displayed
- **THEN** its four wake blocks contain groups of four, four, four, and three games
- **AND** the wake blocks collectively include all fifteen supplied games exactly once

#### Scenario: Other schedule blocks are opened
- **WHEN** a caregiver selects a sleep, feeding, ritual, or other non-wake block
- **THEN** the system displays its existing detail content without developmental games

### Requirement: Deterministic age-specific distribution
The system SHALL assign the 5–6 month games consistently by wake-block position so the selection does not change between renders of the same regime.

#### Scenario: Regime is rendered repeatedly
- **WHEN** the same 5–6 month regime is rendered more than once
- **THEN** each corresponding wake block receives the same ordered game group

#### Scenario: More wake blocks exist than configured groups
- **WHEN** future schedule geometry produces more wake blocks than the four configured game groups
- **THEN** the configured groups repeat cyclically
- **AND** no wake block is left without three or four games

### Requirement: Localized content preserves safety meaning
The system SHALL display every 5–6 month game title and instruction in the currently selected supported app language while preserving the supplied safety and non-forcing guidance.

#### Scenario: App language changes
- **WHEN** the caregiver selects Russian, Ukrainian, Polish, English, Spanish, French, German, Portuguese, or Italian and opens a 5–6 month wake block
- **THEN** every assigned title and instruction is displayed in that language

#### Scenario: Safety-sensitive activity is displayed
- **WHEN** an activity involves reaching, hidden objects, sound, tummy play, crawling preparation, rolling, or objects handled by the baby
- **THEN** the instruction retains the applicable limits on distance, face covering, sound volume, supervision, support, force, object size, cleanliness, and mouth safety

### Requirement: Existing regime behavior remains unchanged
The system SHALL add developmental games only as wake-block detail content for the 5–6 month regime.

#### Scenario: Games are added to the regime
- **WHEN** developmental game content is available
- **THEN** existing sleep, feeding, ritual, and wake-window timings remain unchanged
- **AND** the change does not add these game groups to another age regime
