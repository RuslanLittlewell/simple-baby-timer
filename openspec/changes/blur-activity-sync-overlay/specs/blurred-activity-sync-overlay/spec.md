## Purpose

Keep the Activity screen visually recognizable during foreground synchronization by using a blurred, accessible backdrop that still blocks unsafe interaction.

## ADDED Requirements

### Requirement: Synchronization overlay preserves blurred screen context
While Activity synchronization is pending, the system MUST show the Activity screen beneath a full-screen blur instead of replacing it with an opaque solid-color surface.

#### Scenario: Activity synchronization begins
- **WHEN** the Activity screen enters its synchronization-pending state
- **THEN** the visible Activity content remains recognizable through a blurred backdrop
- **AND** the backdrop covers the same Activity-screen area as the existing synchronization gate

#### Scenario: Synchronization finishes
- **WHEN** Activity synchronization reaches a terminal outcome
- **THEN** the blurred overlay is removed
- **AND** the fully rendered synchronized Activity screen becomes interactive

### Requirement: Loader content remains readable in every theme
The synchronization indicator and localized status text MUST remain clearly visible above the blurred content in both light and dark themes without turning the entire overlay into an opaque fill.

#### Scenario: Dark theme loader
- **WHEN** synchronization is pending in dark theme
- **THEN** the blur tint and loader treatment provide sufficient contrast against the softened screen

#### Scenario: Light theme loader
- **WHEN** synchronization is pending in light theme
- **THEN** the blur tint and loader treatment provide sufficient contrast without applying a dark full-screen cover

### Requirement: Blur overlay preserves synchronization safety
The blurred overlay MUST continue to intercept pointer input across its full area and MUST retain the existing busy/progress accessibility announcement.

#### Scenario: User touches a blurred control
- **WHEN** synchronization is pending and the user taps or swipes over an activity control visible beneath the blur
- **THEN** the underlying control receives no input

#### Scenario: Assistive technology observes the overlay
- **WHEN** the blurred synchronization overlay is visible
- **THEN** assistive technology identifies the interface as busy
- **AND** announces the localized synchronization label

### Requirement: Platforms without effective native blur remain legible
If effective native blur is unavailable, the system MUST render a theme-compatible translucent fallback that keeps loader content legible and underlying controls visibly unavailable.

#### Scenario: Native blur is unsupported or reduced
- **WHEN** the platform cannot render the intended blur effect
- **THEN** a translucent themed backdrop is displayed instead of an opaque full-screen replacement
- **AND** touch blocking and accessibility behavior remain unchanged
