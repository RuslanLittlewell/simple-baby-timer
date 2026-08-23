## Purpose

Covers the reminders the app raises when a settling, sleep or awake stretch runs past its configured length: when one is scheduled, what it says, and how loudly it arrives.

## ADDED Requirements

### Requirement: Reminders arrive quietly

A reminder SHALL be delivered without a sound, without waking or lighting the screen, and without breaking through the platform's do-not-disturb or focus modes. It SHALL still be delivered, and SHALL remain readable in the notification list afterwards.

#### Scenario: A reminder comes due at night

- **WHEN** a reminder becomes due while the device is locked and silent
- **THEN** it makes no sound
- **AND** it does not wake the screen

#### Scenario: A reminder comes due during focus

- **WHEN** a reminder becomes due while a focus or do-not-disturb mode is on
- **THEN** it does not break through it

#### Scenario: The caregiver looks later

- **WHEN** the caregiver opens the notification list after a reminder was delivered
- **THEN** the reminder is there to read

### Requirement: A reminder is named by its mode and says what to do

A reminder's title SHALL be the name of the activity it belongs to, as the app names it everywhere else. Its body SHALL tell the caregiver what the reminder is for.

#### Scenario: Settling

- **WHEN** the settling reminder is delivered
- **THEN** its title is the app's name for settling
- **AND** its body reads "Напоминаем, чтобы вы не забыли выйти из режима засыпания." in Russian, and the same meaning in each other supported language

#### Scenario: Sleep

- **WHEN** the sleep reminder is delivered
- **THEN** its title is the app's name for sleep
- **AND** its body reads "Напоминаем, что вы планировали пробуждение." in Russian, and the same meaning in each other supported language

#### Scenario: Awake

- **WHEN** the awake reminder is delivered
- **THEN** its title is the app's name for awake
- **AND** its body reads "Напоминаем, что пора переходить ко сну." in Russian, and the same meaning in each other supported language

#### Scenario: The caregiver's language

- **WHEN** the app's language is any of the supported nine
- **THEN** both the title and the body are in that language

### Requirement: Every run is reminded on its own full interval

Starting an activity SHALL schedule its reminder for the whole interval configured for that activity, measured from the moment that run started. Time spent in an earlier run of the same activity SHALL NOT shorten it, however recently that run ended.

#### Scenario: Returning to a mode after switching away

- **WHEN** the caregiver runs sleep for most of its interval, switches to another mode by hand, and starts sleep again a few minutes later
- **THEN** the new sleep reminder is due a full sleep interval after that restart

#### Scenario: A back-dated start

- **WHEN** an activity is started with an earlier start time
- **THEN** its reminder is due a full interval after that chosen moment

#### Scenario: The widget agrees

- **WHEN** an activity is running
- **THEN** the Live Activity's elapsed time counts from the moment that run started, with nothing carried in from an earlier run

### Requirement: Switching modes retires the previous reminder

Starting a different activity, or stopping the running one, SHALL cancel the reminder the previous activity had pending, so a reminder never arrives for a mode that is no longer running.

#### Scenario: Switching by hand

- **WHEN** the caregiver switches from one activity to another
- **THEN** the reminder that belonged to the first one never arrives

#### Scenario: Stopping

- **WHEN** the caregiver stops the running activity
- **THEN** its pending reminder never arrives

#### Scenario: Switching while the reminder is still being scheduled

- **WHEN** the caregiver switches modes in the moment between starting an activity and its reminder being registered with the system
- **THEN** that reminder is still cancelled and never arrives

### Requirement: Reminders respect their per-activity switch

A reminder SHALL be scheduled only while reminders are enabled for that activity in settings.

#### Scenario: Reminders switched off

- **WHEN** reminders for an activity are switched off and that activity is started
- **THEN** no reminder is scheduled for it
