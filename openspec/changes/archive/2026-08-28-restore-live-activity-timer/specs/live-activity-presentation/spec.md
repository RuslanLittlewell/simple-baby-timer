## Purpose

Covers what the Live Activity shows while a settling, sleep, awake or feeding timer runs — in the Dynamic Island and on the lock screen.

## ADDED Requirements

### Requirement: The Dynamic Island shows how long the activity has run

While an activity's Live Activity is showing, the Dynamic Island SHALL show the time elapsed since that run started, alongside the mode's icon. It SHALL do so in the compact presentation, in the minimal presentation, and in the expanded one.

#### Scenario: Compact presentation

- **WHEN** an activity is running and another app is in the foreground
- **THEN** the island shows the mode's icon on one side and the running time on the other

#### Scenario: Minimal presentation

- **WHEN** the island is showing the activity alongside another live activity
- **THEN** the running time is what it shows

#### Scenario: Expanded presentation

- **WHEN** the caregiver expands the island
- **THEN** it shows the mode and the running time

#### Scenario: The time keeps running

- **WHEN** the activity has been running for some minutes and the app has not been opened
- **THEN** the time shown has advanced accordingly

### Requirement: The lock-screen card is minimal

The lock-screen presentation SHALL show only the mode and the time elapsed since the run started. It SHALL NOT state the clock time at which the activity began, and SHALL use the tightest padding and smallest icon that keep it legible.

#### Scenario: An activity is running

- **WHEN** the caregiver looks at the lock screen while an activity runs
- **THEN** the card names the mode and shows the running time
- **AND** it does not show when the activity started

#### Scenario: Two activities at once

- **WHEN** a main activity and a feeding run together
- **THEN** each card is minimal in the same way

### Requirement: The elapsed time is the same one the app shows

The time on the widget SHALL count up from the moment the run started, matching the timer on the app's own screen, including when the activity was started with an earlier time.

#### Scenario: A back-dated start

- **WHEN** an activity is started with a time ten minutes in the past
- **THEN** the widget already shows ten minutes

#### Scenario: The app is open

- **WHEN** the app's activity screen and the widget are both visible
- **THEN** they show the same elapsed time

### Requirement: The widget ends with the activity

Stopping the activity, or switching to another, SHALL end that Live Activity rather than leaving it showing a timer that no longer runs.

#### Scenario: Stopping

- **WHEN** the caregiver stops the running activity
- **THEN** its Live Activity disappears from the island and the lock screen

#### Scenario: Switching

- **WHEN** the caregiver switches to a different activity
- **THEN** the widget shows the new mode and counts from its start
