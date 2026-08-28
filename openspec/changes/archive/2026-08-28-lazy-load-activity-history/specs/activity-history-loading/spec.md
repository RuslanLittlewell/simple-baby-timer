## Purpose

Ensure activity history becomes available quickly for the current month while older and future months are retrieved only when the user needs them.

## ADDED Requirements

### Requirement: Initial history is limited to the current month
After authentication and child reconciliation, the system SHALL load activity history for the calendar month containing the current date for each synchronized child, without requiring the complete remote history to finish first.

#### Scenario: Existing account opens the app
- **WHEN** an authenticated user opens the app with one or more synchronized children
- **THEN** the system loads each child's activity sessions overlapping the current calendar month
- **AND** initial history synchronization does not fetch sessions solely because they belong to earlier or later months

#### Scenario: Current month is already available locally
- **WHEN** initial synchronization runs and the current month was previously loaded for the child
- **THEN** the system keeps the locally available history usable while refreshing the required current-month range

### Requirement: History is loaded on demand by calendar month
The system SHALL request any calendar month needed to display a selected calendar day, week, month, or statistics period that is not already available locally.

#### Scenario: User opens an older calendar month
- **WHEN** the user navigates to a date in an older calendar month that has not been loaded
- **THEN** the system loads that month's activity history for the active child
- **AND** refreshes the visible data after the load completes

#### Scenario: Week crosses a month boundary
- **WHEN** the requested week or statistics period intersects two calendar months
- **THEN** the system loads every intersecting month that is not already available

#### Scenario: Requested month is already loaded
- **WHEN** multiple views request a month already marked as loaded
- **THEN** the system does not perform another completed-range fetch unless an explicit refresh requires it

#### Scenario: Callers request the same missing month concurrently
- **WHEN** two or more callers request the same child and calendar month before its load completes
- **THEN** the system shares one in-flight load and all callers observe its completion

### Requirement: Range loading is complete and deterministic
The system SHALL retrieve all accessible sessions overlapping a requested calendar month using deterministic pagination and SHALL merge them without deleting history outside that month.

#### Scenario: Month contains more than one server page
- **WHEN** a requested month contains more sessions than a single server response can return
- **THEN** the system retrieves every page exactly once using a stable ordering with a unique tie-breaker

#### Scenario: Session crosses a month boundary
- **WHEN** a session begins before the requested month and ends during it, or begins during the month and ends after it
- **THEN** the session is included in the loaded result

#### Scenario: Remote row is a deletion tombstone
- **WHEN** the requested range includes a remotely deleted session
- **THEN** the corresponding local session is removed during the merge

### Requirement: Loaded-range state is durable and scoped
The system SHALL persist completed month state per remote child and SHALL clear that state when the associated synchronization identity is cleared.

#### Scenario: App restarts after a completed load
- **WHEN** the app restarts after a month finished loading
- **THEN** the system recognizes that month as locally available for the same remote child

#### Scenario: Range loading fails
- **WHEN** a requested month cannot be loaded
- **THEN** the month is not marked as loaded
- **AND** a later request can retry it

#### Scenario: Account data is cleared
- **WHEN** account synchronization data is cleared or the user changes accounts
- **THEN** all loaded-month metadata belonging to the previous synchronization identity is removed

### Requirement: Local history remains available offline
The system SHALL continue to display already stored activity sessions while a requested remote month is unavailable or still loading.

#### Scenario: Older month is opened without network access
- **WHEN** the user opens a month that has local sessions but its remote range cannot currently be refreshed
- **THEN** the system displays the existing local sessions
- **AND** permits a later range-load retry
