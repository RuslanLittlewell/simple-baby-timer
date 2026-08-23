# calendar-day-header-navigation Specification

## Purpose

Lets a caregiver move the calendar's day view one day at a time straight from its header, and makes the header control that opens the week view read as a calendar rather than as a back arrow.

## Requirements

### Requirement: The day header opens the week view through a calendar icon

The day view's header SHALL present its week-view control as a calendar icon rather than a directional chevron. Activating it SHALL open the week view for the week containing the shown day, exactly as before. The control SHALL carry an accessible label naming the week view.

#### Scenario: Opening the week view

- **WHEN** the caregiver activates the calendar icon in the day header
- **THEN** the week view opens on the week containing the shown day

#### Scenario: The control is not mistaken for a back arrow

- **WHEN** the day view header is visible
- **THEN** its left control shows a calendar icon
- **AND** no directional chevron appears in that position
- **AND** assistive technology announces the control as opening the week

### Requirement: The day header steps one day at a time

The day view's header SHALL show a backward control immediately before the centred date and a forward control immediately after it. Activating one SHALL move the shown day one calendar day in that direction, updating the date shown in the header and the records the timeline displays. Each control SHALL carry an accessible previous-day or next-day label. Stepping SHALL NOT be capped at the current date.

#### Scenario: Stepping back a day

- **WHEN** the caregiver activates the backward control
- **THEN** the header shows the previous calendar day
- **AND** the timeline shows that day's records

#### Scenario: Stepping forward a day

- **WHEN** the caregiver activates the forward control
- **THEN** the header shows the next calendar day
- **AND** the timeline shows that day's records

#### Scenario: Crossing a month or year boundary

- **WHEN** the shown day is the first or last day of a month or of a year and the caregiver steps across that boundary
- **THEN** the header shows the adjacent day in the neighbouring month or year, with its month and year updated

#### Scenario: Stepping past today

- **WHEN** the shown day is today and the caregiver activates the forward control
- **THEN** the shown day becomes tomorrow
- **AND** the control remains enabled

### Requirement: The day view marks the present only on today

Indicators that mark the present moment SHALL appear only while the shown day is the current date, and SHALL follow the day as the header steps.

#### Scenario: Stepping away from today

- **WHEN** the caregiver steps from today to another day
- **THEN** the current-time indicator is no longer drawn on the timeline

#### Scenario: Stepping back onto today

- **WHEN** the caregiver steps back onto the current date
- **THEN** the current-time indicator is drawn again at the current time

### Requirement: Stepping days preserves the timeline scroll position

Changing the shown day with the header controls SHALL leave the timeline scrolled where the caregiver left it, rather than jumping to the automatic starting position used when a day is opened from the week or month view.

#### Scenario: Comparing the same hours across days

- **WHEN** the caregiver scrolls the timeline to the evening hours and steps back one day
- **THEN** the timeline still shows the evening hours
- **AND** it shows the previous day's records

#### Scenario: Opening a day from the month view still recentres

- **WHEN** the caregiver picks a day in the month view
- **THEN** the timeline scrolls to its automatic starting position, as before
