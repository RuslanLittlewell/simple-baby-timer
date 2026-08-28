## Purpose

Keeps every iOS lock-screen Live Activity consistent with the currently running shared child activities, including changes made locally, remotely, or while the app was suspended.

## ADDED Requirements

### Requirement: Stopping a mode removes its Live Activity
The system SHALL end and immediately dismiss the Live Activity for the same child and track when that running mode is stopped.

#### Scenario: Local stop
- **WHEN** a caregiver stops a running mode on the device
- **THEN** its Live Activity disappears from the Dynamic Island and lock screen

#### Scenario: Mode switch
- **WHEN** a caregiver replaces a running main mode with another mode
- **THEN** the old Live Activity is ended and at most one card remains for that child and track

### Requirement: Shared mode changes reach other devices
The system SHALL reflect starts, replacements, and stops on every registered iOS device belonging to a caregiver who shares access to the child.

#### Scenario: Remote start
- **WHEN** a caregiver starts a mode on one device
- **THEN** another registered device with access to the child receives a Live Activity for the same kind and start time

#### Scenario: Remote stop
- **WHEN** a caregiver stops a mode on one device
- **THEN** the corresponding Live Activity is ended and dismissed on the other registered devices

### Requirement: Device state is reconciled
The system SHALL reconcile Live Activities against the authoritative active-mode state after app launch, foreground entry, authentication, and relevant realtime changes.

#### Scenario: Mode ended while device was offline
- **WHEN** the app returns to the foreground after missing a remote stop
- **THEN** the stale Live Activity is removed

#### Scenario: Mode started while device was offline
- **WHEN** the app returns to the foreground and the shared child has a running mode
- **THEN** the device shows a matching Live Activity without creating duplicates

#### Scenario: App process restarted
- **WHEN** the app process restarts while a Live Activity exists
- **THEN** the app can still update or end that Live Activity during reconciliation

### Requirement: Delivery is idempotent and self-cleaning
Repeated synchronization SHALL NOT create more than one Live Activity per child and track, and invalid or ended instances SHALL be removed from the server registry.

#### Scenario: Duplicate start delivery
- **WHEN** the same start is delivered or reconciled more than once
- **THEN** only one current Live Activity remains for that child and track

#### Scenario: Invalid APNs token
- **WHEN** APNs reports that a Live Activity token is no longer valid
- **THEN** the corresponding instance registration is deleted and later deliveries continue for other devices

