# current-day-regime-adaptation Specification

## Purpose

Keeps today's suggested routine aligned with actual wake-up times without changing the child's learned routine for later days.

## Requirements

### Requirement: Completed sleep re-anchors the remaining day
The system SHALL shift suggestions after a completed running sleep by the difference between that sleep's suggested and actual wake-up time.

#### Scenario: Night sleep ends earlier than suggested
- **WHEN** today's suggested wake-up is 07:00 and the running night sleep ends at 06:00
- **THEN** every later suggestion for today moves 60 minutes earlier

#### Scenario: Sleep ends later than suggested
- **WHEN** a running sleep ends after its adjusted suggested wake-up
- **THEN** every later suggestion for today moves later by the wake-up difference

#### Scenario: Sleep has no matching suggestion
- **WHEN** a completed running sleep does not overlap a suggested sleep for the current day
- **THEN** the system leaves the suggested regime unchanged

### Requirement: Successive wake-ups refine only the remaining plan
The system SHALL preserve earlier suggestions and apply each matched sleep completion to suggestions that follow that sleep.

#### Scenario: Later nap corrects an earlier shift
- **WHEN** the morning wake-up moved the plan earlier and a later nap ends after its adjusted suggested end
- **THEN** suggestions after that nap use the newly corrected cumulative shift while earlier suggestions retain their previous positions

#### Scenario: Completed suggestions remain stable
- **WHEN** today's plan is re-anchored after a sleep completes
- **THEN** the completed sleep and all suggestions before it do not move

### Requirement: Adjustment is limited to the current local day
The system MUST apply wake-up adjustments only to the child and local calendar day on which the sleep ended.

#### Scenario: Calendar shows another day
- **WHEN** the user views a day other than the adjusted local day
- **THEN** the Calendar renders the unadjusted personal regime for that day

#### Scenario: Local day changes
- **WHEN** the next local day begins
- **THEN** the new day starts from the learned personal regime without yesterday's adjustments

#### Scenario: Application restarts on the same day
- **WHEN** the application restarts after today's regime was adjusted
- **THEN** today's remaining suggestions retain their adjustment

### Requirement: Regime reminders follow the adjusted suggestions
The system SHALL reconcile future settling reminders when today's remaining regime changes.

#### Scenario: Early wake-up moves a future reminder earlier
- **WHEN** a completed sleep moves a future settling suggestion earlier and its reminder time is still in the future
- **THEN** the old reminder is replaced by one scheduled from the adjusted suggestion

#### Scenario: Tomorrow remains on the learned regime
- **WHEN** reminder planning extends into the next local day
- **THEN** tomorrow's reminders use the learned personal regime without today's adjustment

