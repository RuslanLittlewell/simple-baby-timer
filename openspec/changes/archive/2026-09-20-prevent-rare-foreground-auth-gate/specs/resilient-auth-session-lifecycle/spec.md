## Purpose

Keeps authenticated users inside the application across foreground recovery and token rotation while still presenting sign-in promptly after credentials are conclusively lost.

## ADDED Requirements

### Requirement: Foreground recovery precedes account validation
The system SHALL settle foreground session recovery before using the local session state to decide whether authentication is required.

#### Scenario: Expiring token refreshes on foreground
- **WHEN** the application becomes active with a refreshable session whose access token requires renewal
- **THEN** the system completes or joins that recovery before deciding whether to show the sign-in gate

#### Scenario: Concurrent foreground requests share recovery
- **WHEN** multiple foreground or synchronization triggers arrive during one session recovery
- **THEN** the system uses one authoritative recovery result and does not perform competing destructive auth transitions

### Requirement: Transient absence does not require authentication
The system MUST preserve the current authenticated UI and local credentials when session absence or an authentication callback has not conclusively established credential loss.

#### Scenario: Session is temporarily unavailable
- **WHEN** a local session read is empty while recovery may still be active or a subsequent verified session is available
- **THEN** the system keeps the sign-in gate closed and does not erase local credentials

#### Scenario: Unexpected signed-out callback is recovered
- **WHEN** the auth client emits a null-session event without an explicit user logout and session recovery succeeds
- **THEN** the system rejects the null-session transition and remains authenticated

#### Scenario: Temporary recovery failure
- **WHEN** validation or refresh fails because of transport, timeout, rate-limit, server, or unknown conditions
- **THEN** the system retains the session state and retries on a later lifecycle or authenticated action

### Requirement: Verified sessions invalidate stale auth-loss work
Every verified session observation MUST invalidate older pending work that could clear credentials or open the sign-in gate, even when the account identity has not changed.

#### Scenario: Refresh finishes before an older missing-session check
- **WHEN** a token refresh verifies a session and an older missing-session check completes afterward
- **THEN** the older check cannot sign out locally or show the sign-in gate

#### Scenario: Repeated verification for the same account
- **WHEN** an already authenticated account emits another verified session event
- **THEN** that event establishes a newer auth epoch for stale-work rejection

### Requirement: Definitive auth loss opens the gate
The system SHALL show the global sign-in gate only after explicit user logout or authoritative recovery confirms that the stored credentials cannot establish a session.

#### Scenario: User explicitly signs out
- **WHEN** the user requests logout
- **THEN** the system clears the local session and shows the sign-in experience without waiting for recovery

#### Scenario: Refresh credentials are invalid
- **WHEN** authoritative recovery reports that the refresh credential is missing, revoked, or already consumed and no newer verified session exists
- **THEN** the system clears local authenticated state and shows the sign-in gate

### Requirement: Authenticated actions use authoritative verification
An action that requires authentication MUST use the same recovery policy as foreground synchronization and MUST NOT open the global gate from a single empty local session read.

#### Scenario: Protected child action during token recovery
- **WHEN** a user requests a protected child action while a refreshable session is being recovered
- **THEN** the action waits for or joins recovery and continues without showing sign-in after successful recovery

#### Scenario: Protected child action after confirmed auth loss
- **WHEN** a user requests a protected child action and authoritative recovery confirms credential loss
- **THEN** the action is stopped and the sign-in gate is shown

