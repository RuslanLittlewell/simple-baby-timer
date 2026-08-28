## Purpose

Keep every recorded calendar entry visible and editable when its time range overlaps a currently running activity or another timeline element.

## ADDED Requirements

### Requirement: Completed entries appear above running activities

The calendar timeline MUST render completed entries above a current running activity wherever their visible time ranges and horizontal lanes overlap.

#### Scenario: Completed duration entry overlaps a live activity

- **WHEN** a completed duration entry occupies part of the same visible time range and lane as a running activity
- **THEN** the completed entry is drawn above the running activity in the overlapping area
- **AND** its icon, title, and available timestamp remain visible according to its existing size rules

#### Scenario: Completed entry is pressed through an overlap

- **WHEN** the user presses the visible area of a completed entry that overlaps a running activity
- **THEN** the completed entry receives the press
- **AND** its existing entry editor opens

### Requirement: Point-event markers remain the highest activity entries

Diaper and poop event markers MUST render above running activities and completed duration entries when their visual bounds overlap.

#### Scenario: Point event occurs during a running activity

- **WHEN** a diaper or poop event is recorded inside the time span of a running activity
- **THEN** its striped marker and icon remain visible above the running block
- **AND** the marker remains pressable for editing

#### Scenario: Point event overlaps a completed duration block

- **WHEN** the minimum touch height of a diaper or poop marker overlaps a completed duration block
- **THEN** the point-event marker is drawn above that completed block
- **AND** pressing the marker edits the point event rather than the block beneath it

### Requirement: Timeline utility layers preserve visibility without blocking entries

The current-time indicator MUST remain visible above activity content and MUST NOT intercept interaction with completed entries or point-event markers.

#### Scenario: Current-time line crosses an entry

- **WHEN** the current-time line crosses a live or completed calendar entry
- **THEN** the line remains visually visible
- **AND** touches continue to target the interactive entry beneath the line

### Requirement: Layering does not change timeline geometry

Changing the stacking order MUST NOT alter the calculated position, height, lane width, content, or time range of any timeline entry.

#### Scenario: Calendar is rendered at any zoom level

- **WHEN** the user views or zooms a day containing overlapping live, completed, and point-event entries
- **THEN** each entry retains its existing top position, height, horizontal lane, gradient, and label rules
- **AND** only their visual and touch stacking order differs
