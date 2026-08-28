## Purpose

Gives the paywall a way to start the account's one-off free trial, which the app can already grant but has never offered to anyone.

## ADDED Requirements

### Requirement: The trial is the last option in the plan list

The paywall SHALL offer the account's trial as an option in the same list as the paid plans, placed after all of them. Its billed amount SHALL read as zero, in the same currency and the same prominent style the paid rows use for their billed amounts. The row SHALL carry no per-month figure and no saving.

#### Scenario: The trial option is listed

- **WHEN** the paywall lists its plans and the trial can be taken
- **THEN** a trial option appears below every paid plan
- **AND** its price reads as zero
- **AND** it shows neither a per-month figure nor a saving

#### Scenario: Choosing the trial

- **WHEN** the caregiver selects the trial option
- **THEN** it becomes the selected option
- **AND** no paid plan stays selected

### Requirement: The main button starts whichever option is selected

While the trial option is selected, the paywall's main button SHALL start the trial rather than a purchase, and SHALL say so. Selecting a paid plan again SHALL return the button to purchasing that plan.

#### Scenario: Starting the trial

- **WHEN** the trial option is selected and the caregiver presses the main button
- **THEN** the account's trial begins
- **AND** premium features unlock
- **AND** the paywall closes

#### Scenario: Switching back to a paid plan

- **WHEN** the caregiver selects a paid plan after the trial option
- **THEN** the main button offers to buy that plan
- **AND** pressing it starts a store purchase

#### Scenario: The trial cannot be started

- **WHEN** starting the trial fails, because the account has already used it or the request does not go through
- **THEN** the paywall stays open and reports the failure
- **AND** no premium features unlock

### Requirement: The trial is offered only when it can be taken

The trial option SHALL be listed only while the account has not already used its trial, and only when there is a signed-in account to grant it to. It SHALL NOT be listed when any offered plan already carries a free trial from the store, so that the list never presents two competing free offers.

#### Scenario: Trial already used

- **WHEN** the account has already used its trial
- **THEN** the trial option is not listed
- **AND** the paid plans are unaffected

#### Scenario: No account

- **WHEN** no account is signed in
- **THEN** the trial option is not listed

#### Scenario: A store plan already offers free days

- **WHEN** any offered plan carries a free trial from the store
- **THEN** the trial option is not listed
- **AND** that plan keeps its own free-days wording

### Requirement: Renewal terms do not describe the trial

The automatic-renewal wording below the main button SHALL NOT be shown while the trial option is selected, since the trial neither renews nor charges.

#### Scenario: The trial option is selected

- **WHEN** the trial option is selected
- **THEN** the auto-renewal wording is not shown

#### Scenario: A paid plan is selected

- **WHEN** a paid plan is selected
- **THEN** the wording that applies to that plan is shown, as before
