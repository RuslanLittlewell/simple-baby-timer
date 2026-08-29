## Purpose

Ensure regime details remain fully usable within compact device viewports while preserving access to every item through internal scrolling.

## ADDED Requirements

### Requirement: Modal fits within the usable viewport
The system SHALL limit the regime detail modal card to the current window height after accounting for top and bottom safe-area insets and intentional outer spacing.

#### Scenario: Regime details open on an iPhone 8-sized viewport
- **WHEN** the user opens regime details in a 375 by 667 point viewport
- **THEN** the complete modal card remains within the usable vertical viewport

#### Scenario: Device dimensions change while the modal is visible
- **WHEN** the window height or safe-area insets change while regime details are open
- **THEN** the modal height limit updates to fit the new usable viewport

### Requirement: Long modal content remains reachable
The system SHALL provide vertical scrolling inside the constrained modal card whenever its content exceeds the available height.

#### Scenario: Developmental games exceed the available height
- **WHEN** a regime block contains more content than fits inside the constrained card
- **THEN** the user can scroll within the modal to reach all content

### Requirement: Existing modal interaction is preserved
The system SHALL retain the regime detail modal's existing visual presentation, content, and dismissal behavior on compact and larger devices.

#### Scenario: User dismisses the constrained modal
- **WHEN** the user presses the close control or the backdrop
- **THEN** the modal closes using the existing behavior

#### Scenario: Content fits on a larger device
- **WHEN** the regime content fits within the available height
- **THEN** the modal displays without expanding beyond its content solely to reach the height limit
