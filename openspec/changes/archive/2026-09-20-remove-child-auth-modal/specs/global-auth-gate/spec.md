## Purpose

Ensure protected in-app actions consistently use the application-wide authentication gate whenever the current account session is missing.

## ADDED Requirements

### Requirement: Missing session opens the global authentication gate
The system SHALL activate the application-wide authentication gate when a protected child-management action discovers that the user is not signed in.

#### Scenario: Signed-out user tries to join by code
- **WHEN** a signed-out user selects the join-by-code action
- **THEN** the application displays the global authentication screen instead of a child-screen authentication modal

#### Scenario: Signed-out user tries to share a child
- **WHEN** a signed-out user selects the share-child action
- **THEN** the application displays the global authentication screen instead of a child-screen authentication modal

### Requirement: Protected action is not resumed implicitly
The system SHALL return the user to the children screen after successful reauthentication and SHALL NOT automatically resume the protected action that originally detected the missing session.

#### Scenario: User completes reauthentication
- **WHEN** a user signs in through the global authentication gate after selecting a protected child action
- **THEN** the children screen is shown and the user can explicitly select the action again

### Requirement: Signed-in action routing is preserved
The system SHALL keep existing share-child, join-code, and Pro entitlement routing unchanged for users with a valid session.

#### Scenario: Signed-in user joins by code
- **WHEN** a signed-in user selects the join-by-code action
- **THEN** the join-code interface opens directly

#### Scenario: Signed-in Pro user shares a child
- **WHEN** a signed-in user with an active Pro entitlement selects share-child
- **THEN** the share-child interface opens directly

#### Scenario: Signed-in non-Pro user shares a child
- **WHEN** a signed-in user without an active Pro entitlement selects share-child
- **THEN** the existing Pro upgrade flow is shown
