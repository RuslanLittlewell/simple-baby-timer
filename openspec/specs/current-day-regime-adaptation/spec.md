# current-day-regime-adaptation Specification

## Purpose

Keeps today's suggested routine aligned with how the day actually goes, the way the child's rhythm continues from the latest wake-up, without changing the child's learned routine for later days.

## Requirements

### Requirement: The learned routine is a chain of wake windows
The system SHALL learn each nap's wake window and duration as the child lived them and lay the naps out one after another from the usual wake-up, stretching the wake windows evenly so the chain reaches the usual bedtime.

#### Scenario: Nap start times vary but the gaps do not
- **WHEN** the second nap starts at different times on different days but the third nap always follows it after 90 minutes awake
- **THEN** the learned routine keeps that wake window in proportion instead of deriving it from median clock times

### Requirement: The rest of today is planned from the latest wake-up
The system SHALL lay out today's remaining suggestions from the end of the night or of the latest finished nap, whichever is later, starting with the wake window that belongs to the next nap.

#### Scenario: Night sleep ends earlier than suggested
- **WHEN** today's suggested wake-up is 07:00, the usual first wake window is two hours and the night ends at 06:00
- **THEN** the first nap is suggested at 08:00

#### Scenario: A nap is taken long before its suggestion
- **WHEN** a nap is finished that started before its suggestion and does not overlap it
- **THEN** the next suggestion follows the end of that nap by the next usual wake window

#### Scenario: Recorded sleeps change
- **WHEN** a sleep of today is added, edited, deleted or synced
- **THEN** the remaining plan is laid out again from the recorded sleeps

### Requirement: Bedtime stays near the usual one
The system SHALL keep the wake window the child is currently in at its usual length and bend only the later wake windows, by at most 20% shorter or 25% longer, towards the usual bedtime, adding or dropping one nap when that brings bedtime closer.

#### Scenario: Early start leaves a long afternoon
- **WHEN** an early nap leaves more time before bedtime than the remaining naps fill
- **THEN** an extra nap is suggested instead of an over-long wake window

#### Scenario: The day runs late
- **WHEN** the remaining wake windows cannot reach the usual bedtime within the limits
- **THEN** bedtime moves rather than wake windows bending further

### Requirement: Suggestions never leave too little time awake
The system MUST leave at least 30 minutes awake between a wake-up and the start of the next suggested preparation.

#### Scenario: Short planned wake window
- **WHEN** a usual or bent wake window is shorter than the preparation plus 30 minutes
- **THEN** the suggestion is moved later until it fits

### Requirement: Only what is ahead is suggested
The system SHALL show no suggestions for the part of today that already has recorded sleeps, and SHALL treat a sleep running now as the next nap, expected to last its usual duration, unless it started nearer to the planned bedtime than to the next planned nap.

#### Scenario: Calendar after the morning wake-up
- **WHEN** the child is up for the day
- **THEN** today's Calendar shows no suggestion for last night or for anything before the latest wake-up

#### Scenario: Nap in progress
- **WHEN** a sleep started near the next planned nap is running
- **THEN** it is shown with its expected end and the rest of the day follows from that end

#### Scenario: Night in progress
- **WHEN** a sleep started near the planned bedtime is running
- **THEN** it is treated as tonight's sleep and no further naps are suggested

#### Scenario: Night not over yet
- **WHEN** the night sleep is still running or today has no recorded wake-up
- **THEN** today shows the learned routine as it stands

### Requirement: Adjustment is limited to the current local day
The system MUST re-plan only the child and local calendar day the recorded progress belongs to.

#### Scenario: Calendar shows another day
- **WHEN** the user views a day other than the current local day
- **THEN** the Calendar renders the learned personal regime for that day

#### Scenario: Local day changes
- **WHEN** the next local day begins
- **THEN** the new day starts from the learned personal regime without yesterday's progress

#### Scenario: Application restarts on the same day
- **WHEN** the application restarts during the day
- **THEN** today's remaining suggestions are still laid out from today's recorded sleeps

### Requirement: Regime reminders follow the re-planned day
The system SHALL reconcile future settling reminders when today's remaining plan changes.

#### Scenario: Early wake-up moves a future reminder earlier
- **WHEN** a recorded wake-up moves a future settling suggestion earlier and its reminder time is still in the future
- **THEN** the old reminder is replaced by one scheduled from the new suggestion

#### Scenario: Tomorrow remains on the learned regime
- **WHEN** reminder planning extends into the next local day
- **THEN** tomorrow's reminders use the learned personal regime without today's progress
