## Purpose

Ensure that changing the child’s current main activity completes exactly once and remains consistent across the local device, shared devices, and realtime cloud state.

## ADDED Requirements

### Requirement: Main activity replacement completes as one handover

When a different main activity is selected while settling, sleep, or awake is active, the system MUST finalize the previous activity and start the selected activity exactly once as a replacement operation.

#### Scenario: Settling is replaced by sleep

- **WHEN** settling is active and the user saves sleep with its selected options
- **THEN** the settling record is finalized at the handover time
- **AND** sleep becomes the active main activity from that handover time
- **AND** the selected sleep details belong to the new sleep activity

#### Scenario: Another main activity is replaced

- **WHEN** any active settling, sleep, or awake activity is changed to a different main activity
- **THEN** the previous activity is finalized once
- **AND** the selected replacement is started once
- **AND** the two records do not overlap or leave an artificial gap at the handover boundary

### Requirement: Shared live state remains continuous during replacement

For a cloud-linked child, the system MUST replace the shared main live state without deleting the shared main-track row between the previous and next activities. It MUST delete that row only when a main activity is explicitly ended without a replacement.

#### Scenario: Cloud-linked settling is replaced by sleep

- **WHEN** settling is active for a cloud-linked child and the user saves sleep
- **THEN** the existing shared main-track row is updated to sleep with the new start time and details
- **AND** no delete of that row is issued as part of the replacement
- **AND** realtime reconciliation does not clear the newly started local sleep because of the handover

#### Scenario: Main activity is stopped without replacement

- **WHEN** the user explicitly stops a main activity and no next main activity is requested
- **THEN** the completed activity is saved
- **AND** the shared main-track row is deleted
- **AND** any product-defined automatic continuation is treated as a replacement rather than an intermediate delete followed by a start

#### Scenario: Activity is replaced from another device

- **WHEN** the active main activity originated on a partner device and this device replaces it with another main activity
- **THEN** the previous activity is finalized once
- **AND** the same shared main-track row is updated to the replacement
- **AND** all devices converge on the replacement as the active activity

### Requirement: PRO panel Save is single-flight

The PRO activity panel MUST accept at most one Save submission while its asynchronous save or activity handover is pending.

#### Scenario: User presses Save repeatedly

- **WHEN** the user presses Save more than once before the first submission completes
- **THEN** only the first submission invokes the save or handover
- **AND** the previous activity is finalized at most once
- **AND** the replacement activity is started at most once

#### Scenario: Save is pending

- **WHEN** a Save submission is in progress
- **THEN** the Save control communicates that it is unavailable for another submission
- **AND** Stop and Save cannot launch competing operations from the same expanded panel

#### Scenario: Save operation fails

- **WHEN** the save or handover rejects before completion
- **THEN** the submission lock is released
- **AND** the panel remains available so the user can retry

### Requirement: Replacement preserves timer side effects

The replacement operation MUST preserve the existing completion and startup side effects for both activities while applying each side effect only to its corresponding activity.

#### Scenario: Reminder-enabled settling is replaced by reminder-enabled sleep

- **WHEN** settling has a scheduled reminder and the user replaces it with sleep
- **THEN** the settling reminder and Live Activity are stopped
- **AND** sleep receives its own configured reminder and Live Activity
- **AND** no stale settling reminder remains scheduled

#### Scenario: Replacement uses offline local state

- **WHEN** cloud synchronization is unavailable during a main activity replacement
- **THEN** the local completed record and replacement timer remain usable
- **AND** a temporary cloud failure does not erase the locally active replacement
