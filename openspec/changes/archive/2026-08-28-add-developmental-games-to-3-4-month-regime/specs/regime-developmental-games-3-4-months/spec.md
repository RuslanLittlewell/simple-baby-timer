## Purpose

Defines how age-appropriate, localized developmental game suggestions are distributed and presented within wake blocks of the 3–4 month regime without altering its schedule.

## ADDED Requirements

### Requirement: Developmental games in every 3–4 month wake block
The system SHALL present two or three age-appropriate developmental games in every generated wake block of the 3–4 month regime.

#### Scenario: Caregiver opens a wake block
- **WHEN** a caregiver selects any wake block in the 3–4 month regime
- **THEN** the system displays two or three assigned developmental games
- **AND** each game includes a title and practical instruction

#### Scenario: Supplied activity set is distributed
- **WHEN** the 3–4 month daily regime is displayed
- **THEN** its wake blocks collectively include all twelve supplied developmental games
- **AND** each supplied game appears at least once during the day

#### Scenario: Other schedule blocks are opened
- **WHEN** a caregiver selects a sleep, feeding, ritual, or other non-wake block
- **THEN** the system displays its existing detail content without developmental games

### Requirement: Deterministic age-specific distribution
The system SHALL assign the 3–4 month games consistently by wake-block position so the selection does not change between renders of the same regime.

#### Scenario: Regime is rendered repeatedly
- **WHEN** the same 3–4 month regime is rendered more than once
- **THEN** each corresponding wake block receives the same ordered game group

#### Scenario: More wake blocks exist than configured groups
- **WHEN** schedule geometry produces more wake blocks than the number of configured 3–4 month game groups
- **THEN** the configured groups repeat cyclically
- **AND** no wake block is left without two or three games

### Requirement: Localized game content and safety meaning
The system SHALL display every 3–4 month game title and instruction in the currently selected supported app language, with the supplied safety and non-forcing meaning preserved.

#### Scenario: App language changes
- **WHEN** the caregiver selects Russian, Ukrainian, Polish, English, Spanish, French, German, Portuguese, or Italian and opens a 3–4 month wake block
- **THEN** every assigned game title and instruction is displayed in that language

#### Scenario: Safety-sensitive activities are displayed
- **WHEN** a game involving sound, tummy play, assisted movement, turning, carrying, textures, or grasping is displayed
- **THEN** its instruction retains the applicable limits on distance, supervision, support, force, comfort, cleanliness, size, and mouth safety from the supplied source text

### Requirement: Existing regime behavior remains unchanged
The system SHALL add developmental games only as wake-block detail content for the 3–4 month regime.

#### Scenario: Games are added to the regime
- **WHEN** developmental game content is available
- **THEN** existing sleep, feeding, ritual, and wake-window timings remain unchanged
- **AND** developmental games are not added to other age regimes by this change
