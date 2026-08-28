## Purpose

Communicate foreground Activity synchronization unobtrusively in the header while preventing only activity-recording actions that are unsafe before synchronization completes.

## ADDED Requirements

### Requirement: Synchronization appears as a header indicator
While Activity synchronization is pending, the system MUST show a compact rotating indicator in the Activity header between the active-child badge and the Premium/menu control.

#### Scenario: Synchronization begins
- **WHEN** the Activity screen enters its synchronization-pending state
- **THEN** the rotating indicator appears between the child badge and Premium/menu control
- **AND** the Activity content remains visible without a full-screen backdrop or blur

#### Scenario: Synchronization finishes
- **WHEN** Activity synchronization reaches a terminal outcome
- **THEN** the header indicator is removed
- **AND** the header layout continues to contain the child badge and Premium/menu control

### Requirement: Indicator follows the supplied Premium-styled visual
The synchronization indicator MUST use the supplied 24-by-24 path silhouette, rotate continuously with a 0.6-second cycle, and use a color consistent with the Premium badge palette.

#### Scenario: Indicator is visible
- **WHEN** synchronization is pending
- **THEN** the supplied loader path rotates continuously around the center of its 24-by-24 view box
- **AND** its visible color matches the Premium visual treatment
- **AND** it has no surrounding loader background or label

### Requirement: Only Activity action buttons are disabled
While Activity synchronization is pending, the system MUST disable buttons that start, stop, switch, or log an Activity entry and MUST leave unrelated header and navigation controls enabled.

#### Scenario: User presses an Activity action during synchronization
- **WHEN** synchronization is pending and the user presses a main activity, feeding, or event action button
- **THEN** the button does not invoke its Activity mutation
- **AND** the button exposes its disabled state to assistive technology

#### Scenario: User presses a non-Activity control during synchronization
- **WHEN** synchronization is pending and the user presses the child badge, Premium/menu control, or another navigation control
- **THEN** the control remains enabled and performs its normal action

#### Scenario: Synchronization completes
- **WHEN** synchronization is no longer pending
- **THEN** all Activity action buttons return to their normal enabled behavior

### Requirement: Header indicator is accessible
The synchronization indicator MUST expose progress and busy semantics with the localized synchronization description without turning the entire screen into an accessibility-blocking overlay.

#### Scenario: Assistive technology observes synchronization
- **WHEN** the header indicator is visible
- **THEN** assistive technology identifies it as an in-progress synchronization state
- **AND** can access the localized synchronization description
- **AND** can still reach enabled non-Activity controls
