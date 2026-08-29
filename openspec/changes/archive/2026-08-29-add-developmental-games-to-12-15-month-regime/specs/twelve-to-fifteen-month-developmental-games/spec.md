## Purpose

Give parents of 12–15 month children age-appropriate play activities inside the wake blocks of the regime schedule.

## ADDED Requirements

### Requirement: The 12–15 month regime offers developmental games in its wake blocks
The system MUST attach eighteen developmental games to the 12–15 month regime, grouped into three wake-block sets of six, and MUST preserve the declared order without duplicates.

#### Scenario: Parent opens a wake-block activity
- **WHEN** a parent opens the detail modal for a wake block in the 12–15 month regime
- **THEN** the modal lists that block's six developmental games in their declared order
- **AND** each game shows a title and an instruction

#### Scenario: Schedule has more wake blocks than groups
- **WHEN** the schedule contains more wake blocks than there are groups
- **THEN** the groups repeat from the beginning in a deterministic order

#### Scenario: Another age band is opened
- **WHEN** a parent opens a regime outside the bands configured for games
- **THEN** no developmental games are shown

### Requirement: Activities cover object play, communication, and movement
The game set MUST cover object manipulation, speech and imitation, and gross motor with sensory play, with one focus per wake-block group.

#### Scenario: Parent moves between wake blocks
- **WHEN** a parent opens consecutive wake blocks
- **THEN** each block presents a coherent developmental focus rather than a mixed sample

### Requirement: Shared play guidance precedes the activities
The system MUST show one shared 5–15 minute play recommendation above the game list, stating that activities are not a test.

#### Scenario: Parent opens an activity with games
- **WHEN** the detail modal renders developmental games for this age
- **THEN** the shared guidance appears between the general note and the first game

### Requirement: Safety constraints are stated in the affected activity
Activities involving dough, climbing, walking support, or small objects MUST state their safety constraint inside the instruction itself.

#### Scenario: Parent reads a climbing or dough activity
- **WHEN** a parent reads one of these activities in isolation
- **THEN** the supervision or safety constraint is visible in that instruction without needing another block

### Requirement: Every activity is translated into all supported languages
Every title, instruction, and the shared guidance MUST be present and non-empty in all nine supported languages.

#### Scenario: App language is changed
- **WHEN** a parent switches the app to any supported language
- **THEN** every 12–15 month game title, instruction, and the shared guidance appears in that language
