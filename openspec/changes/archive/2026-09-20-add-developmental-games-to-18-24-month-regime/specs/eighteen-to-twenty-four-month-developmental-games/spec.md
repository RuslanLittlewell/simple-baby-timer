## Purpose

Give parents of 18–24 month children age-appropriate play activities inside the wake blocks of the regime schedule, completing the developmental-game rollout.

## ADDED Requirements

### Requirement: The 18–24 month regime offers developmental games in its wake blocks
The system MUST attach eighteen developmental games to the 18–24 month regime, grouped into three wake-block sets of six, and MUST preserve the declared order without duplicates.

#### Scenario: Parent opens a wake-block activity
- **WHEN** a parent opens the detail modal for a wake block in the 18–24 month regime
- **THEN** the modal lists that block's six developmental games in their declared order
- **AND** each game shows a title and an instruction

#### Scenario: Schedule has more wake blocks than groups
- **WHEN** the schedule contains more wake blocks than there are groups
- **THEN** the groups repeat from the beginning in a deterministic order

### Requirement: Every timed regime except the newborn band offers games
After this change the system MUST provide developmental games for every age band except the newborn regime.

#### Scenario: Parent browses the age bands
- **WHEN** a parent opens any age band other than the newborn one
- **THEN** its wake-block activities offer developmental games

#### Scenario: Parent opens the newborn band
- **WHEN** a parent opens the newborn regime
- **THEN** no developmental games are shown

### Requirement: Activities advance the previous band rather than repeating it
Each wake-block group MUST carry the same developmental focus as the preceding age band at a higher level of difficulty.

#### Scenario: Parent moves up from the previous band
- **WHEN** a parent compares this age with the 15–18 month band
- **THEN** the activities in each focus present a harder version of the same skill rather than an unrelated set

### Requirement: Shared play guidance addresses the autonomy stage
The system MUST show one shared play recommendation above the game list, covering how to offer a real choice of two, let the child do the manageable part, and finish the difficult part together.

#### Scenario: Parent opens an activity with games
- **WHEN** the detail modal renders developmental games for this age
- **THEN** the shared guidance appears between the general note and the first game

### Requirement: Safety constraints are stated in the affected activity
Activities involving stairs, running water, jumping, dough, or sticker backing sheets MUST state their safety constraint inside the instruction itself.

#### Scenario: Parent reads a stairs, water, or jumping activity
- **WHEN** a parent reads one of these activities in isolation
- **THEN** the supervision or safety constraint is visible in that instruction without needing another block

### Requirement: Every activity is translated into all supported languages
Every title, instruction, and the shared guidance MUST be present and non-empty in all nine supported languages.

#### Scenario: App language is changed
- **WHEN** a parent switches the app to any supported language
- **THEN** every 18–24 month game title, instruction, and the shared guidance appears in that language
