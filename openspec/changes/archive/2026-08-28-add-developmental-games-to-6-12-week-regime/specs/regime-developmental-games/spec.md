## Purpose

Defines how age-appropriate, localized developmental game suggestions are presented within baby-regime wake blocks without altering the underlying schedule.

## ADDED Requirements

### Requirement: Developmental games in the 6–12 week regime
The system SHALL present two or three age-appropriate developmental games in every wake block of the 6–12 week regime.

#### Scenario: Caregiver opens a wake block
- **WHEN** a caregiver selects any wake block in the 6–12 week regime
- **THEN** the system displays two or three developmental games assigned to that block
- **AND** each game includes a title and practical instruction

#### Scenario: Supplied activity set is distributed
- **WHEN** the 6–12 week daily regime is displayed
- **THEN** its wake blocks collectively include all ten supplied developmental games
- **AND** repeated games do not prevent any supplied game from appearing during the day

#### Scenario: Other schedule blocks are opened
- **WHEN** a caregiver selects a sleep, feeding, or other non-wake block
- **THEN** the system continues to display its existing detail content without developmental games

### Requirement: Localized developmental game content
The system SHALL display developmental game titles and instructions in the currently selected supported app language, with the same safety meaning across translations.

#### Scenario: App language changes
- **WHEN** the caregiver selects another supported language and opens a 6–12 week wake block
- **THEN** every assigned game title and instruction is displayed in that language

#### Scenario: Safety-sensitive game is displayed
- **WHEN** the tummy-time game is included in a wake block
- **THEN** its instruction states that the baby must be awake and continuously supervised on an appropriate surface or caregiver's chest

### Requirement: Regime timing remains unchanged
The system SHALL add developmental games as wake-block detail content without changing the 6–12 week regime's sleep, feeding, or wake-window timing.

#### Scenario: Games are added to the regime
- **WHEN** the developmental game content is available
- **THEN** the existing schedule step times and calculated wake-block boundaries remain unchanged
