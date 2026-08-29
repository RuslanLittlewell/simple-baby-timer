## Purpose

Provide localized, age-appropriate developmental play suggestions and shared play guidance in every wake block of the 10–12 month regime.

## ADDED Requirements

### Requirement: Every supplied game is included
The system SHALL provide all eighteen supplied developmental games for the 10–12 month regime, preserving each game's title, instructional meaning, age-appropriate expectations, and safety constraints.

#### Scenario: User reviews the complete 10–12 month game set
- **WHEN** all developmental games assigned to the 10–12 month regime are considered
- **THEN** each of the eighteen supplied games appears exactly once

### Requirement: Games are distributed across wake blocks
The system SHALL assign the eighteen developmental games deterministically across the three 10–12 month wake blocks in groups of six.

#### Scenario: User opens each wake block
- **WHEN** the user reviews all three wake blocks in the 10–12 month regime
- **THEN** each block presents six games and the combined blocks cover all eighteen games without duplication

#### Scenario: Assignment is reconstructed
- **WHEN** the 10–12 month schedule is localized or rendered again
- **THEN** the same ordered game groups are assigned to the same wake blocks

### Requirement: General play guidance is shown
The system SHALL present localized guidance with the 10–12 month developmental games stating that play is best offered in short 5–15 minute episodes and must not be treated as a test, including that failure to follow a request does not prove lack of understanding.

#### Scenario: User reads a wake block's game suggestions
- **WHEN** the user opens developmental games in a 10–12 month wake block
- **THEN** the shared short-play and non-testing guidance is available alongside the suggestions

### Requirement: Games and guidance are fully localized
The system SHALL provide titles, complete instructions, and the shared play guidance in Russian, Ukrainian, Polish, English, Spanish, French, German, Portuguese, and Italian.

#### Scenario: User changes the application language
- **WHEN** the selected language is any of the nine supported languages
- **THEN** every 10–12 month game title, instruction, and shared guidance is displayed in that language without falling back to a translation key

### Requirement: Safety and developmental meaning are retained
Every localization SHALL preserve the supplied cautions about realistic sorting and stacking expectations, adult demonstration, stable push equipment, avoiding support by raised arms, safe obstacle play, and uninterrupted adult supervision around water.

#### Scenario: Safety-sensitive games are shown in translation
- **WHEN** the user views sorting, tower, instruction-following, push-and-pull, support movement, obstacle, or water-play content in any supported language
- **THEN** its relevant expectation or safety constraint remains explicit

### Requirement: Existing schedule remains unchanged
Adding developmental games SHALL NOT change the order, kind, start time, or end time of any existing 10–12 month schedule step or enable these games for another age regime.

#### Scenario: Schedule data is compared before and after the change
- **WHEN** the 10–12 month schedule steps are compared
- **THEN** their timing and activity kinds are unchanged and only the intended age regime receives the new game groups
