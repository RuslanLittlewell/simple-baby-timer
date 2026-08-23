# manual-entry-day-selection Specification

## Purpose

Lets a caregiver pick which calendar day the start and the end of a manually created activity belong to, so past days and stretches that cross midnight can be logged without first navigating the calendar.

## Requirements

### Requirement: Manual entry creation offers a day selector for each time

The manual add-activity form SHALL present a day selector directly below its start time field and, whenever an end time field is shown, directly below that end time field. Each selector SHALL show the selected day as a weekday plus day and month, and SHALL offer stepping one day backward and one day forward. The selectors SHALL be available for every activity kind the form can create, including feeding.

#### Scenario: Day selectors are visible for a duration activity

- **WHEN** the caregiver opens the manual add-activity form and the selected kind is settling, sleep, or awake
- **THEN** a day selector appears below the start time field
- **AND** a day selector appears below the end time field
- **AND** each shows the weekday, day, and month of its selected day

#### Scenario: Day selectors are visible for feeding

- **WHEN** the caregiver switches the manual add-activity form to feeding
- **THEN** both day selectors remain visible and usable

#### Scenario: Stepping a day

- **WHEN** the caregiver activates the backward or forward control of a day selector
- **THEN** that selector moves to the previous or the next calendar day
- **AND** the other selector's day is unaffected
- **AND** any visible validation message is cleared

### Requirement: Day selectors start on the viewed calendar day

Both day selectors SHALL default to the calendar day the form was opened for, and SHALL return to that day every time the form is reopened, discarding any day chosen during an earlier session of the form.

#### Scenario: Opening the form

- **WHEN** the caregiver opens the manual add-activity form while viewing a given calendar day
- **THEN** both day selectors show that calendar day

#### Scenario: Reopening after stepping days

- **WHEN** the caregiver steps either selector to another day, closes the form without saving, and opens it again
- **THEN** both day selectors again show the calendar day currently being viewed

### Requirement: A saved manual entry uses the selected days

Saving the form SHALL produce an entry whose start combines the start selector's day with the picked start time and whose end combines the end selector's day with the picked end time. The entry SHALL be recorded against the day of its start, regardless of which calendar day was on screen when the form was opened.

#### Scenario: Logging an activity on an earlier day

- **WHEN** the caregiver steps both day selectors back one day, picks a start and an end time, and saves
- **THEN** the entry is stored with a start and an end on that earlier day
- **AND** the entry appears on that earlier day in the calendar

#### Scenario: Logging an activity on the viewed day

- **WHEN** the caregiver leaves both day selectors untouched, picks a start and an end time, and saves
- **THEN** the entry is stored on the calendar day being viewed, as before

### Requirement: Manual entries may cross midnight

The form SHALL accept an entry whose end day is later than its start day, and SHALL reject an entry only when the resulting end instant is not strictly later than the resulting start instant.

#### Scenario: Overnight sleep

- **WHEN** the caregiver picks a start time of 22:30, steps the end day forward one day, picks an end time of 06:00, and saves
- **THEN** the entry is stored as a single stretch running from 22:30 on the start day to 06:00 the following day

#### Scenario: End not after start

- **WHEN** the caregiver picks day and time values whose end instant is at or before the start instant
- **THEN** the form refuses to save
- **AND** shows the existing "end must be after start" message

#### Scenario: Earlier clock time on a later day

- **WHEN** the end time is earlier on the clock than the start time but the end day is later
- **THEN** the form treats the entry as valid and saves it
