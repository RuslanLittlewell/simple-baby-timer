## Purpose

Defines how localized developmental games are distributed per schedule variant and presented within wake blocks of the 7–9 month regime without altering either schedule.

## ADDED Requirements

### Requirement: Variant-specific developmental games
The system SHALL assign developmental games to every generated wake block of both 7–9 month schedule variants using the distribution configured for the selected variant.

#### Scenario: Two-nap variant is selected
- **WHEN** the caregiver views the two-nap 7–9 month schedule
- **THEN** its three wake blocks display six, six, and five games respectively
- **AND** all seventeen supplied games appear exactly once during the day

#### Scenario: Three-nap variant is selected
- **WHEN** the caregiver views the three-nap 7–9 month schedule
- **THEN** its four wake blocks display five, four, four, and four games respectively
- **AND** all seventeen supplied games appear exactly once during the day

#### Scenario: Caregiver opens a wake block
- **WHEN** a caregiver selects any 7–9 month wake block
- **THEN** every assigned game includes a title and full practical instruction

#### Scenario: Other schedule blocks are opened
- **WHEN** a caregiver selects a sleep, feeding, ritual, or other non-wake block
- **THEN** the system displays its existing details without developmental games

### Requirement: Variant selection controls game distribution
The system SHALL update wake-block game groups when the caregiver changes between the two 7–9 month schedule variants.

#### Scenario: Caregiver switches schedule variant
- **WHEN** the caregiver changes from one 7–9 month variant to the other
- **THEN** each wake block uses the distribution belonging to the newly selected variant
- **AND** games from the previously selected distribution are not retained on the new timeline

#### Scenario: Existing age-level game regime is displayed
- **WHEN** a younger regime with age-level game groups is selected
- **THEN** its existing game assignment behavior remains unchanged

### Requirement: Deterministic complete distribution
The system SHALL keep game ordering deterministic within each 7–9 month variant.

#### Scenario: Variant is rendered repeatedly
- **WHEN** the same 7–9 month variant is rendered repeatedly
- **THEN** corresponding wake blocks receive the same ordered game groups

#### Scenario: More wake blocks exist than configured groups
- **WHEN** future schedule geometry produces more wake blocks than a variant has configured groups
- **THEN** that variant’s groups repeat cyclically
- **AND** no generated wake block is left without games

### Requirement: Localized content preserves safety meaning
The system SHALL display every game title and instruction in the selected supported language while retaining the supplied safety constraints.

#### Scenario: App language changes
- **WHEN** the caregiver selects Russian, Ukrainian, Polish, English, Spanish, French, German, Portuguese, or Italian and opens a 7–9 month wake block
- **THEN** every assigned title and instruction is displayed in that language

#### Scenario: Safety-sensitive game is displayed
- **WHEN** a game involves containers, small-object risks, climbing obstacles, a tunnel, hidden objects, or water
- **THEN** the instruction preserves applicable limits on object size, prohibited small items, supervision, stable construction, open ends, checked edges, face safety, and uninterrupted adult contact

### Requirement: Existing schedule timing remains unchanged
The system SHALL add developmental games as wake-block detail content without changing either 7–9 month schedule variant.

#### Scenario: Games are added to both variants
- **WHEN** developmental game content is available
- **THEN** existing sleep, feeding, ritual, and wake-window timings remain unchanged
- **AND** these variant distributions are not applied to another age regime
