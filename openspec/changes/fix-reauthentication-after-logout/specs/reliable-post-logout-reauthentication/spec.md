## Purpose

Ensure a user can establish and retain a new authenticated session immediately after explicit logout without stale asynchronous work returning the app to login.

## ADDED Requirements

### Requirement: Logout leaves authentication ready for reuse
The system MUST complete explicit logout without leaving pending destructive work that can affect a subsequent authentication attempt.

#### Scenario: Logout completes normally
- **WHEN** an authenticated user explicitly logs out
- **THEN** the current session is removed, the sign-in gate is shown, and the user can immediately start a new sign-in attempt

#### Scenario: Remote logout request fails
- **WHEN** remote token revocation fails but the local logout is completed
- **THEN** any fallback cleanup applies only to the session that initiated logout and cannot clear a session created afterward

### Requirement: User can sign in after logout
The system MUST allow successful Google or Apple authentication after explicit logout and MUST retain the resulting session.

#### Scenario: Same account signs in again
- **WHEN** a user logs out and then authenticates with the same provider account
- **THEN** the new session becomes active, the sign-in gate closes, and the app navigates to the authenticated child-selection state

#### Scenario: Different account signs in
- **WHEN** a user logs out and authenticates with a different account
- **THEN** the new account becomes authoritative and existing account-switch isolation and synchronization rules are applied

### Requirement: Newer authentication wins over stale work
The system MUST prevent logout callbacks, account checks, and synchronization completions started for an older auth state from clearing, rejecting, or obscuring a newer verified session.

#### Scenario: Stale logout finishes after OAuth exchange
- **WHEN** a new session is established before all work associated with the previous logout finishes
- **THEN** stale logout work does not remove the new session or reopen the sign-in gate

#### Scenario: Stale account check reports signed out
- **WHEN** an account-check result belongs to an auth generation older than the current verified session
- **THEN** the result is ignored for auth gating and session cleanup

#### Scenario: Old sync generation completes
- **WHEN** a pre-login synchronization generation completes after reauthentication
- **THEN** it cannot override the new session's auth state, purchaser identity, children, or navigation destination

### Requirement: Auth gate closes only for a verified session
The system MUST dismiss the post-logout sign-in gate only after the authentication client confirms that a usable session exists for the completed OAuth attempt.

#### Scenario: OAuth callback exchanges successfully
- **WHEN** the provider callback is exchanged and the authentication client returns a usable session
- **THEN** the app clears the auth requirement once and continues to the child list

#### Scenario: OAuth reports success without a usable session
- **WHEN** the callback flow completes but session verification returns no usable session
- **THEN** the sign-in gate remains visible and the user receives a retryable error state

### Requirement: Failed and cancelled attempts remain recoverable
The system MUST restore interactive login controls after OAuth cancellation, redirect failure, exchange failure, or session-verification failure.

#### Scenario: User cancels provider authentication
- **WHEN** the user closes the provider flow without authenticating
- **THEN** the loading state ends and Google and Apple sign-in controls can be used again

#### Scenario: OAuth exchange fails
- **WHEN** the provider callback cannot be exchanged for a session
- **THEN** the loading state ends, a sanitized error is shown, and another sign-in attempt can start without restarting the app

### Requirement: Reauthentication diagnostics exclude credentials
The system MUST identify the sanitized stage and auth generation of post-logout login failures without recording credentials, OAuth authorization codes, callback URLs, direct user identifiers, or provider payloads.

#### Scenario: Post-logout sign-in fails
- **WHEN** development diagnostics are enabled and reauthentication fails
- **THEN** logs identify whether failure occurred during provider launch, redirect receipt, exchange, session verification, gate transition, or stale-generation rejection without sensitive values

