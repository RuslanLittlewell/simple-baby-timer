## Purpose

Ensure activity controls use a reconciled timer snapshot after app launch or foreground resume, while keeping the tracker safely usable when synchronization is unavailable.

## ADDED Requirements

### Requirement: Activity actions wait for foreground synchronization
The system MUST place the Activity screen in a pending state whenever a signed-in app launch or return from the background starts a foreground synchronization pass, and MUST NOT accept activity start, stop, replacement, or event-log actions until that pass reaches a terminal outcome.

#### Scenario: App resumes with stale timer state
- **WHEN** the app becomes active after being in the background and foreground synchronization is still pending
- **THEN** the Activity screen displays a loading state
- **AND** activity controls cannot start, stop, replace, or log an activity

#### Scenario: First action after successful resume synchronization
- **WHEN** foreground synchronization has reconciled the current child, completed history, pending writes, and live timers
- **THEN** the Activity screen removes its loading state
- **AND** the next activity action operates on the reconciled timer state

### Requirement: Foreground readiness includes live activity reconciliation
The system MUST keep foreground synchronization pending until the latest applicable live-session snapshot has been applied for every cloud-linked child included in the pass. A foreground pass MUST NOT report readiness merely because account or history synchronization completed.

#### Scenario: History completes before live timers
- **WHEN** account, child, and completed-session synchronization finishes while live-session retrieval remains pending
- **THEN** the Activity screen remains in its loading state

#### Scenario: Live timer differs from persisted local state
- **WHEN** the foreground live-session snapshot reports a different active timer than the persisted local snapshot
- **THEN** the system reconciles the difference before enabling activity controls

### Requirement: Foreground synchronization is single-flight and ordered
The system MUST coordinate overlapping launch, authentication, foreground, and realtime synchronization work so an older completion cannot mark the Activity screen ready or overwrite activity state reconciled by a newer foreground pass.

#### Scenario: App becomes active while another synchronization is running
- **WHEN** a foreground request starts while an earlier synchronization pass is still running
- **THEN** the Activity screen remains blocked until the foreground-relevant work has completed
- **AND** readiness reflects the newest applicable pass

#### Scenario: Delayed response arrives after readiness changes
- **WHEN** a response belonging to an older synchronization generation arrives after a newer pass or activity mutation
- **THEN** that response does not clear or replace the newer active timer
- **AND** it does not incorrectly change the current foreground readiness state

### Requirement: Foreground gate fails open with reliable local state
The system MUST end the blocking foreground state when synchronization cannot reach the backend, retain the last reliable local activity state, and permit offline activity tracking. The gate MUST always leave the pending state through success, handled failure, cancellation, or timeout policy.

#### Scenario: Device resumes offline
- **WHEN** foreground synchronization cannot reach the backend
- **THEN** the loading state ends without discarding the locally active timer
- **AND** activity controls become available for offline use

#### Scenario: Synchronization throws unexpectedly
- **WHEN** any foreground synchronization stage fails
- **THEN** the Activity screen is not left permanently blocked
- **AND** the failure does not erase a locally active replacement

### Requirement: Loading state clearly communicates temporary unavailability
The Activity screen MUST present an accessible, visually clear loading overlay while foreground synchronization is pending and MUST prevent touches from reaching controls beneath it.

#### Scenario: Loading overlay is visible
- **WHEN** foreground synchronization is pending on the Activity screen
- **THEN** a progress indicator and localized synchronization message are visible
- **AND** assistive technology identifies the screen as busy
- **AND** controls underneath the overlay do not receive input

#### Scenario: User is on another screen
- **WHEN** foreground synchronization is pending while the Activity screen is not visible
- **THEN** other screens remain usable unless their existing behavior independently requires synchronization
