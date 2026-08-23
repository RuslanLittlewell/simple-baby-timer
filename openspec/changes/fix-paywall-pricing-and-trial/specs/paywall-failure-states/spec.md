## Purpose

Says what the paywall shows when it cannot do its job — plans that will not load, a purchase that does not complete, a trial that will not start — instead of standing in for the store with prices of its own.

## ADDED Requirements

### Requirement: The paywall never shows prices it invented

The paywall SHALL only display prices reported by the store. When no plans are available it SHALL show an explanation instead of a substitute list, in every build.

#### Scenario: Plans are unavailable

- **WHEN** the store returns no plans
- **THEN** no plan prices are displayed
- **AND** the screen explains that the plans could not be loaded

#### Scenario: Purchases are not supported

- **WHEN** the device or build cannot make purchases at all
- **THEN** the screen says purchases are unavailable rather than listing plans

### Requirement: Each failure says what actually failed

The paywall SHALL distinguish a failure to load plans, a purchase that did not complete, and a trial that would not start, and SHALL word each accordingly. Backing out of the store's own purchase sheet SHALL NOT be reported as a failure.

#### Scenario: Loading fails

- **WHEN** fetching the plans fails
- **THEN** the message names loading the plans as what failed

#### Scenario: A purchase fails

- **WHEN** a purchase does not complete for any reason other than the caregiver cancelling it
- **THEN** the message names the purchase as what failed
- **AND** the paywall stays open

#### Scenario: The caregiver cancels

- **WHEN** the caregiver dismisses the store's purchase sheet
- **THEN** no failure message appears

#### Scenario: The trial will not start

- **WHEN** starting the trial fails
- **THEN** the message names the trial as what failed

#### Scenario: Reopening the paywall

- **WHEN** the paywall is opened again after any failure
- **THEN** no stale failure message is shown

### Requirement: The trial survives a broken store

The trial option SHALL remain available when the plans cannot be loaded, since it is granted by the account rather than bought.

#### Scenario: No plans, trial still offered

- **WHEN** the plans fail to load and the account can still take its trial
- **THEN** the trial option is listed
- **AND** the explanation about the missing plans is shown alongside it

#### Scenario: Nothing to offer at all

- **WHEN** the plans fail to load and the account cannot take a trial
- **THEN** only the explanation is shown, with no options
