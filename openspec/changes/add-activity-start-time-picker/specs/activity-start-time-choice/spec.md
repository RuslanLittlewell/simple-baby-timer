## Purpose

Lets a caregiver say when a settling, sleep, or awake stretch actually began at the moment they start its timer, so a late tap records the real time instead of the time of the tap.

## ADDED Requirements

### Requirement: Starting a main activity asks for its start time

Starting settling, sleep, or awake SHALL present a time step before the timer begins. The step SHALL open on the current time, so confirming it without changing anything starts the activity at the present moment. Confirming a changed time SHALL start the activity from the chosen moment.

#### Scenario: Confirming the offered time

- **WHEN** the caregiver starts settling, sleep, or awake and confirms the time step without changing it
- **THEN** the activity starts from the current moment, as it did before this change

#### Scenario: Recording a late tap

- **WHEN** the caregiver picks a time earlier than now and confirms
- **THEN** the activity starts from that earlier moment
- **AND** the elapsed time shown counts from it

#### Scenario: Dismissing the step

- **WHEN** the caregiver dismisses the time step without confirming
- **THEN** no activity is started or stopped
- **AND** any activity that was already running keeps running unchanged

### Requirement: The basic panel asks immediately, the PRO panel after saving

In the basic panel the time step SHALL appear as soon as an activity button is pressed. In the PRO panel, settling and sleep SHALL show it after the expanded card's save button is pressed, so parameters are chosen first and the time is the last question. The awake control SHALL behave identically in both panels, going straight to the time step.

#### Scenario: Basic panel

- **WHEN** the caregiver presses settling, sleep, or awake in the basic panel
- **THEN** the time step appears immediately
- **AND** nothing is started until it is confirmed

#### Scenario: PRO panel parameters first

- **WHEN** the caregiver opens settling or sleep in the PRO panel, chooses parameters, and presses save
- **THEN** the time step appears
- **AND** confirming it starts the activity with those parameters and that time

#### Scenario: Dismissing the PRO time step

- **WHEN** the caregiver dismisses the time step opened from the PRO card
- **THEN** no activity is started
- **AND** the card stays open with the chosen parameters intact, so save can be pressed again

#### Scenario: Awake is the same control in both panels

- **WHEN** the caregiver presses awake in the PRO panel
- **THEN** the time step appears immediately, exactly as in the basic panel
- **AND** no parameter card is opened

### Requirement: The choosable range excludes the future and the running activity's past

The time step SHALL NOT offer a moment later than the present. It SHALL NOT offer a moment earlier than the start of the currently running main activity, nor earlier than the start of the current day, whichever of those two is later.

#### Scenario: The future is not offered

- **WHEN** the time step is open
- **THEN** times later than the current time cannot be chosen

#### Scenario: A running activity bounds the past

- **WHEN** a main activity has been running since 14:00 and the caregiver starts a different one at 15:30
- **THEN** times before 14:00 cannot be chosen
- **AND** times from 14:00 to 15:30 can

#### Scenario: Midnight bounds the past when nothing is running

- **WHEN** no main activity is running and the caregiver starts one
- **THEN** times before the start of the current day cannot be chosen

#### Scenario: A stretch that began yesterday

- **WHEN** a main activity has been running since 22:00 yesterday and the caregiver starts a different one at 00:30
- **THEN** the offered range begins at the start of the current day rather than at 22:00 yesterday

### Requirement: Stopping and feeding are unaffected

Stopping a running activity SHALL start no time step and SHALL stop it at the present moment, as before. The feeding controls SHALL keep their current behaviour.

#### Scenario: Stopping the running activity

- **WHEN** the caregiver presses the control of the activity that is currently running
- **THEN** it stops at the present moment with no time step

#### Scenario: Feeding is untouched

- **WHEN** the caregiver starts breast feeding, or logs a bottle
- **THEN** those flows behave exactly as they did before this change
