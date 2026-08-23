## Purpose

Covers how the week and month views are reached from the calendar's day screen, how the caregiver moves between them, and what happens to the day underneath while they are open.

## ADDED Requirements

### Requirement: The periods open as an overlay on the week

The day screen's calendar control SHALL open the week and month views as an overlay above the day view. The overlay SHALL open showing the week containing the day on screen. The day view SHALL remain in place underneath rather than being replaced.

#### Scenario: Opening the overlay

- **WHEN** the caregiver activates the calendar control in the day header
- **THEN** the overlay appears showing the week that contains the shown day

#### Scenario: The day view survives

- **WHEN** the overlay is open and then closed without picking a day
- **THEN** the day view shows the same day as before
- **AND** the timeline is still scrolled where the caregiver left it
- **AND** the zoom level is unchanged

### Requirement: One control switches between week and month

The overlay SHALL offer a single control that switches between its week and month views. Activating it from the week SHALL show the month; activating it from the month SHALL show the week. It SHALL NOT close the overlay, and the two views SHALL NOT stack — the overlay shows exactly one of them at a time.

#### Scenario: Switching to the month

- **WHEN** the overlay shows the week and the caregiver activates the switch
- **THEN** the overlay shows the month containing that week

#### Scenario: Switching back to the week

- **WHEN** the overlay shows the month and the caregiver activates the switch
- **THEN** the overlay shows the week again
- **AND** the overlay stays open

#### Scenario: Switching repeatedly

- **WHEN** the caregiver switches back and forth several times
- **THEN** each switch changes only which period is shown
- **AND** the day view underneath is untouched throughout

### Requirement: Picking a day leaves the overlay for that day

Picking a day in either view SHALL close the overlay and show that day in the day view, with the timeline scrolled to its usual starting position.

#### Scenario: Picking from the week

- **WHEN** the caregiver picks a day in the week view
- **THEN** the overlay closes
- **AND** the day view shows that day

#### Scenario: Picking from the month

- **WHEN** the caregiver picks a day in the month view
- **THEN** the overlay closes
- **AND** the day view shows that day

#### Scenario: The timeline is recentred

- **WHEN** a day is picked from the overlay
- **THEN** the timeline scrolls to the current time for today, or to the usual starting hour for any other day

#### Scenario: Header stepping is unaffected

- **WHEN** the caregiver instead steps days with the day header's arrows
- **THEN** the timeline keeps its scroll position, as it does today

### Requirement: The overlay closes without leaving the day

Closing the overlay SHALL return to the day view without changing the shown day. It SHALL be closable both by its close control and by the platform's own back gesture or button.

#### Scenario: Closing with the close control

- **WHEN** the caregiver activates the overlay's close control
- **THEN** the overlay closes and the shown day is unchanged

#### Scenario: Closing with the system back

- **WHEN** the caregiver uses the platform back gesture or button while the overlay is open
- **THEN** the overlay closes rather than leaving the calendar

### Requirement: Work that belongs to the day pauses under the overlay

Periodic work that exists to keep the day view current SHALL NOT run while the overlay covers it, and SHALL resume when the overlay closes.

#### Scenario: The overlay is open

- **WHEN** the overlay is showing
- **THEN** the day view's per-second clock updates do not run

#### Scenario: Returning to the day

- **WHEN** the overlay closes
- **THEN** those updates resume
- **AND** the current-time indicator is correct for the moment of return

### Requirement: The overlay opens nothing on top of itself

The overlay SHALL NOT offer controls that open another modal above it. The statistics view SHALL remain reachable from the day screen's own header.

#### Scenario: No statistics control in the overlay

- **WHEN** the overlay is showing either period
- **THEN** its top bar offers only the period switch and the close control

#### Scenario: Statistics are still reachable

- **WHEN** the caregiver wants the statistics
- **THEN** the day header's statistics control opens them, as before

### Requirement: The overlay is presented as a card, like the app's other modals

The overlay SHALL be presented as a centred card over a dimmed, blurred backdrop, using the same width, corner, border and padding treatment as the calendar's add-activity modal. Its height SHALL NOT exceed 70% of the screen, and content taller than that SHALL scroll within it rather than push the card past that height.

#### Scenario: The overlay is open

- **WHEN** the overlay is showing either period
- **THEN** it appears as a card no wider than the add-activity modal, centred, over a dimmed and blurred view of the day beneath
- **AND** its height is at most 70% of the screen

#### Scenario: A month with six weeks

- **WHEN** the month shown needs six rows of days
- **THEN** the card still does not exceed 70% of the screen
- **AND** all six rows remain reachable

#### Scenario: The week's seven days

- **WHEN** the week view is showing
- **THEN** its seven days fit the card rather than stretching to fill the screen

#### Scenario: Tapping outside

- **WHEN** the caregiver taps the dimmed area outside the card
- **THEN** the overlay closes, as the app's other modals do
