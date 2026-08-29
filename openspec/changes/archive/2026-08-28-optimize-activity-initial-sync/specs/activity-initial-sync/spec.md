## Purpose

Defines when activity controls become ready and how remote history is fetched in small weekly ranges without blocking unrelated synchronization work.

## ADDED Requirements

### Requirement: Critical activity readiness
The system SHALL keep activity controls gated only while loading the active child's current local day and current live activity state.

#### Scenario: Critical data loads successfully
- **WHEN** synchronization starts for an authenticated account with an active child
- **THEN** the system loads that child's current local day and live activity state
- **AND** enables activity controls as soon as both loads settle successfully

#### Scenario: Critical load reaches its safety timeout
- **WHEN** the critical activity load does not settle before the configured safety timeout
- **THEN** the system removes the activity gate so controls do not remain blocked indefinitely

#### Scenario: Cached activity data exists
- **WHEN** locally cached activity data is available before remote refresh completes
- **THEN** the system continues presenting that cached data during synchronization

#### Scenario: Current day cache is fresh
- **WHEN** the active child's current local day is available on the device and was refreshed less than 60 seconds ago
- **THEN** the system keeps activity controls enabled without displaying the activity loader
- **AND** does not issue a redundant foreground history request for that day

#### Scenario: Current day cache is stale
- **WHEN** the active child's current local day is missing or its last successful refresh is at least 60 seconds old
- **THEN** the system displays the activity loader while refreshing the critical activity data

#### Scenario: Forced synchronization
- **WHEN** synchronization follows an authentication or account transition, child change, or explicit refresh action
- **THEN** the system refreshes critical activity data regardless of the freshness window

### Requirement: Non-blocking background synchronization
The system SHALL continue non-critical synchronization without extending the activity loader's visible duration.

#### Scenario: Critical data is ready before account synchronization
- **WHEN** the active child's critical data is ready while subscription, queued-write, profile, or other-child synchronization is still running
- **THEN** the activity loader disappears and activity controls become enabled
- **AND** remaining synchronization continues in the background

#### Scenario: App returns to foreground with fresh local data
- **WHEN** the app returns to the foreground while the active child's current-day cache is fresh
- **THEN** background synchronization can continue without starting the activity gate

### Requirement: Deduplicated synchronization requests
The system SHALL reuse known local identity and child mappings within a synchronization pass and SHALL avoid repeating equivalent remote-child requests unless local child creation changed those mappings.

#### Scenario: No child mapping changed
- **WHEN** a synchronization pass does not create a new remote child mapping
- **THEN** the system fetches the remote child list no more than once in that pass

#### Scenario: New remote child mapping was created
- **WHEN** background synchronization creates a remote mapping for a local child
- **THEN** the system may refresh the remote child list once to reconcile the new mapping

### Requirement: Weekly activity history loading
The system SHALL request remote activity history by local calendar-week ranges and SHALL load older weeks only when requested by navigation.

#### Scenario: Initial history load
- **WHEN** the app performs the initial activity synchronization
- **THEN** it requests only the active child's current local day as foreground history
- **AND** requests the remainder of the current week only after the activity gate is released

#### Scenario: Background current-week completion
- **WHEN** the active child's current day becomes ready
- **THEN** the system loads any missing remainder of the current week in the background
- **AND** that background request does not display or extend the activity loader

#### Scenario: User navigates to older history
- **WHEN** the user opens a date whose calendar week has not been loaded
- **THEN** the system requests that week and merges it with cached history

#### Scenario: Week is already cached
- **WHEN** a requested calendar week is recorded as loaded and no refresh is requested
- **THEN** the system avoids a duplicate remote history request
