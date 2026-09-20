# child-growth-history Specification

## Purpose

Allow caregivers to keep a dated height and weight history for each child and see the most recent growth measurement at a glance.

## Requirements

### Requirement: Initial growth measurement is captured with a new child
The system SHALL require a valid height and weight when a user creates a child and SHALL save those values as the child’s first growth measurement dated on the child’s birthday.

#### Scenario: Create a child with valid growth values
- **WHEN** a user enters the required child details, a positive height in centimeters, and a positive weight in kilograms and saves the child
- **THEN** the child is created with one measurement whose date equals the child’s birthday and whose height and weight equal the entered values

#### Scenario: Prevent creation without valid growth values
- **WHEN** the height or weight is missing, non-numeric, zero, or negative
- **THEN** the save action remains unavailable and the child is not created

### Requirement: Latest growth measurement is visible below the child profile
The system SHALL display the active child’s measurement with the greatest measurement date directly below the profile chip on the activity screen, using localized height and weight units.

#### Scenario: Show the latest measurement
- **WHEN** the active child has multiple measurements
- **THEN** the summary below the profile chip shows the height and weight from the measurement with the latest date as text without decorative icons

#### Scenario: Preserve activity-header alignment
- **WHEN** the growth summary is displayed below the child profile chip
- **THEN** the child profile chip and Premium/menu control remain aligned on the same top row
- **AND** the growth summary is left-aligned directly below the child profile chip

#### Scenario: Existing child has no measurement
- **WHEN** the active child predates this capability and has no measurements
- **THEN** the area below the profile chip shows a localized action inviting the user to add the first measurement

### Requirement: Growth history can be opened from the profile summary
The system SHALL open the active child’s growth-history modal when the user activates the measurement summary or empty-state action below the profile chip.

#### Scenario: Open populated history
- **WHEN** a user presses a displayed latest measurement
- **THEN** a height-limited modal opens, lists every measurement for the active child in ascending measurement-date order with the latest row at the bottom, and initially scrolls to that latest row
- **AND** the history area displays up to four complete rows before additional rows require scrolling

#### Scenario: Keep the row edit action aligned
- **WHEN** a populated measurement row is displayed
- **THEN** its edit icon is aligned to the far right edge of the row independently of the measurement text width

#### Scenario: Open empty history
- **WHEN** a user presses the add-first-measurement action
- **THEN** the growth-history modal opens with an empty state and an available add-row action

### Requirement: User can add a dated measurement
The system SHALL let a child member add a row containing a measurement date, height in centimeters, and weight in kilograms. The date SHALL be no earlier than the child’s birthday and no later than the current local calendar date, and both numeric values SHALL be positive.

#### Scenario: Add a valid measurement
- **WHEN** a user selects an allowed date, enters valid height and weight values, and saves
- **THEN** the new row is persisted, appears in date order, and becomes the profile summary when its date is the latest

#### Scenario: Reject invalid measurement input
- **WHEN** a user enters an out-of-range date or a missing, non-numeric, zero, or negative height or weight
- **THEN** the save action remains unavailable and no measurement is added

#### Scenario: Preserve decimal precision
- **WHEN** a user enters height or weight with a decimal fraction using a supported locale’s decimal separator
- **THEN** the stored and subsequently displayed value represents the entered decimal quantity without applying an integer-only conversion

### Requirement: User can edit an existing measurement
The system SHALL let a child member edit the date, height, and weight of an existing measurement using the same validation rules as a new row.

#### Scenario: Edit an older measurement
- **WHEN** a user selects an existing row, changes one or more valid fields, and saves
- **THEN** that row is updated in place and the history is reordered if its date changed

#### Scenario: Edit the current latest measurement
- **WHEN** a user edits the measurement currently shown below the profile chip
- **THEN** the profile summary immediately reflects the latest measurement after applying the edit and re-evaluating date order

### Requirement: Measurements persist locally and synchronize for shared children
The system SHALL retain measurements across app restarts and SHALL synchronize measurements for cloud-backed children so every authorized child member can view and edit the same history.

#### Scenario: Restore local measurements
- **WHEN** the app restarts after measurements were saved
- **THEN** the locally persisted history and latest summary are restored without requiring a network connection

#### Scenario: Synchronize a local child after cloud creation
- **WHEN** a locally created child and its initial measurement receive a cloud child identifier
- **THEN** the initial measurement is uploaded and associated with that cloud child

#### Scenario: Merge remote measurements
- **WHEN** synchronization retrieves measurements created or edited by another authorized member
- **THEN** the local history is merged by stable measurement identifier and the newest available version is displayed

#### Scenario: Reject unauthorized access
- **WHEN** a signed-in user is not a member of the measurement’s child
- **THEN** the cloud service prevents that user from reading or changing the measurement

### Requirement: Growth controls are localized and accessible
The system SHALL provide localized labels and accessibility names for the profile summary, history rows, date control, height and weight fields, add action, edit action, cancel action, and save action in every language supported by the app.

#### Scenario: Use a non-English app language
- **WHEN** the app language is changed from English
- **THEN** all visible growth-history text and accessibility names use the selected language

