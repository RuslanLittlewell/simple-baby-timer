## Purpose

Give parents of 15–18 month children age-appropriate play activities inside the wake blocks of the regime schedule.

## ADDED Requirements

### Requirement: The 15–18 month regime offers developmental games in its wake blocks
The system MUST attach eighteen developmental games to the 15–18 month regime, grouped into three wake-block sets of six, and MUST preserve the declared order without duplicates.

#### Scenario: Parent opens a wake-block activity
- **WHEN** a parent opens the detail modal for a wake block in the 15–18 month regime
- **THEN** the modal lists that block's six developmental games in their declared order
- **AND** each game shows a title and an instruction

#### Scenario: Schedule has more wake blocks than groups
- **WHEN** the schedule contains more wake blocks than there are groups
- **THEN** the groups repeat from the beginning in a deterministic order

#### Scenario: An age band without games is opened
- **WHEN** a parent opens a regime outside the bands configured for games
- **THEN** no developmental games are shown

### Requirement: Activities advance the previous band rather than repeating it
Each wake-block group MUST carry the same developmental focus as the preceding age band at a higher level of difficulty.

#### Scenario: Parent moves up from the previous band
- **WHEN** a parent compares this age with the 12–15 month band
- **THEN** the activities in each focus present a harder version of the same skill rather than an unrelated set

### Requirement: Shared play guidance precedes the activities
The system MUST show one shared play recommendation above the game list, stating that refusing an activity is normal and that offering a choice of two works better than insisting.

#### Scenario: Parent opens an activity with games
- **WHEN** the detail modal renders developmental games for this age
- **THEN** the shared guidance appears between the general note and the first game

### Requirement: Safety constraints are stated in the affected activity
Activities involving stairs, water, threading beads, or pegs MUST state their safety constraint inside the instruction itself.

#### Scenario: Parent reads a stairs or water activity
- **WHEN** a parent reads one of these activities in isolation
- **THEN** the supervision or safety constraint is visible in that instruction without needing another block

### Requirement: Every activity is translated into all supported languages
Every title, instruction, and the shared guidance MUST be present and non-empty in all nine supported languages.

#### Scenario: App language is changed
- **WHEN** a parent switches the app to any supported language
- **THEN** every 15–18 month game title, instruction, and the shared guidance appears in that language
