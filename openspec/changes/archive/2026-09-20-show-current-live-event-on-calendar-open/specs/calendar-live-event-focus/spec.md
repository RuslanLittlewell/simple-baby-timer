## Purpose

Ensures that opening the Calendar immediately reveals the current day and the activity that is running now instead of preserving stale navigation state.

## ADDED Requirements

### Requirement: Calendar opens on the current live timeline
The system SHALL show today's timeline and position its viewport at the current portion of any running activity whenever the Calendar tab becomes active.

#### Scenario: Running activity when Calendar opens
- **WHEN** the user opens the Calendar while an activity is running for the active child
- **THEN** the Calendar selects today and scrolls the timeline so the live activity is visible at its current end

#### Scenario: Multiple concurrent activity tracks
- **WHEN** the main activity and feeding are both running when the Calendar opens
- **THEN** the Calendar positions the viewport at the shared current-time end where both live blocks are visible

#### Scenario: Activity started before today
- **WHEN** the running activity began before today's local midnight
- **THEN** the Calendar shows the portion of that live activity that intersects today and positions the viewport at its current end

### Requirement: Calendar focus has a current-time fallback
The system SHALL position today's timeline near the current time when the Calendar opens without a running activity.

#### Scenario: No running activity
- **WHEN** the user opens the Calendar and no activity is running for the active child
- **THEN** the Calendar selects today and scrolls near the current-time marker

### Requirement: In-tab navigation remains stable
The system MUST NOT reset the selected day or scroll position merely because the user navigates or scrolls while the Calendar tab remains active.

#### Scenario: User inspects another day
- **WHEN** the user selects another day while remaining on the Calendar tab
- **THEN** that day and the user's timeline position remain selected until the user leaves and reopens Calendar or selects another day

