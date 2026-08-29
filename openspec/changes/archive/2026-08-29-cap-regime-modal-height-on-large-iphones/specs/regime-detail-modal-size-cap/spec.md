## Purpose

Keep regime information and developmental-game modals comfortably sized on both compact and tall phones while retaining access to all content.

## ADDED Requirements

### Requirement: Modal height has a device-independent cap
The system SHALL limit the regime detail modal card to no more than 600 points in height, even when the usable viewport is taller.

#### Scenario: Modal opens on an iPhone 17-sized viewport
- **WHEN** the usable viewport would allow a modal taller than 600 points
- **THEN** the modal card maximum height is 600 points

### Requirement: Viewport safety takes precedence
The system SHALL use the smaller of the 600-point cap and the height available after safe-area insets and outer spacing.

#### Scenario: Modal opens on an iPhone 8-sized viewport
- **WHEN** the usable height after safe-area insets and outer spacing is 599 points
- **THEN** the modal card maximum height is 599 points rather than 600 points

### Requirement: Content behavior is preserved
The system SHALL keep overflowing content scrollable inside the capped modal, SHALL display its native vertical scroll indicator, and SHALL preserve natural height when content is shorter than the maximum.

#### Scenario: Developmental games exceed the capped height
- **WHEN** the modal content requires more than the allowed maximum height
- **THEN** the user can scroll inside the modal to reach every game and shared guidance and can see the vertical scroll indicator while scrolling

#### Scenario: Modal content is short
- **WHEN** the content requires less than the allowed maximum height
- **THEN** the modal uses its natural content height

### Requirement: Shared play guidance precedes games
The system SHALL display the localized shared recommendation about short 5–15 minute play episodes and non-testing directly above the developmental-game list in an applicable regime modal.

#### Scenario: User opens a 10–12 month wake block
- **WHEN** the modal contains shared play guidance and developmental games
- **THEN** the guidance appears after the block's general note and before the first numbered game
