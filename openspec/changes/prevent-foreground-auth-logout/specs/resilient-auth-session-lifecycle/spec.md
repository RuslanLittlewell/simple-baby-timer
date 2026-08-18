## Purpose

Keep an authenticated mobile session stable across background and foreground transitions while distinguishing definitive account loss from temporary connectivity and service failures.

## ADDED Requirements

### Requirement: Authentication persists through ordinary app resume
The system MUST keep the user authenticated when the app returns from an inactive or background state and no definitive evidence shows that the session or account is invalid.

#### Scenario: Resume with a valid stored session
- **WHEN** an authenticated user unlocks the device and the app becomes active
- **THEN** the app keeps the authenticated interface available and completes the required session validation without presenting the sign-in gate

#### Scenario: Resume while connectivity is still recovering
- **WHEN** the app becomes active before the device can reach the authentication service
- **THEN** the app retains the last trusted authenticated state and does not present the sign-in gate

### Requirement: Token refresh follows the application lifecycle
The system MUST run proactive session refresh only while the application is active and MUST stop proactive refresh while the application is inactive or backgrounded.

#### Scenario: Application enters the background
- **WHEN** an active authenticated application becomes inactive or enters the background
- **THEN** proactive token refresh stops without signing out the user or discarding the persisted session

#### Scenario: Application returns to the foreground
- **WHEN** an authenticated application becomes active
- **THEN** proactive token refresh starts before or as foreground authentication validation is coordinated

### Requirement: Only definitive authentication loss opens the sign-in gate
The system MUST present the sign-in gate only after an explicit user sign-out or a definitive authentication response establishes that the stored session, refresh credential, or account is no longer valid.

#### Scenario: Authentication service rejects the session
- **WHEN** session validation returns an explicit unauthorized or forbidden response that establishes the credential or account is invalid
- **THEN** the system clears the invalid local authentication session and presents the sign-in gate

#### Scenario: Refresh credential is explicitly rejected
- **WHEN** the authentication service explicitly reports that the refresh credential is invalid, revoked, or expired beyond recovery
- **THEN** the system presents the sign-in gate and does not continue treating the user as authenticated

#### Scenario: User signs out
- **WHEN** the user explicitly requests sign-out
- **THEN** the system clears the local authentication session and presents the sign-in experience

### Requirement: Inconclusive failures are non-destructive
The system MUST treat rate limits, network failures, timeouts, server failures, and unclassified account-check errors as temporary and MUST preserve the last trusted authentication state and local account data.

#### Scenario: Account check is rate-limited
- **WHEN** foreground validation receives a rate-limit response
- **THEN** the app remains authenticated, retains local account data, and leaves validation eligible for a later retry

#### Scenario: Account check times out or fails with an unknown error
- **WHEN** foreground validation times out, cannot reach the service, or receives an error that is not explicitly classified as definitive authentication loss
- **THEN** the app does not locally sign out the user and does not present the sign-in gate

#### Scenario: A single foreground check is inconclusive
- **WHEN** one foreground account check ends with a temporary or unclassified failure
- **THEN** the system releases any bounded foreground wait according to its offline policy while retaining the authenticated UI and session

### Requirement: Foreground authentication work is coalesced
The system MUST coordinate repeated active-state signals and overlapping authentication triggers so one foreground transition does not produce an uncontrolled burst of account checks or token refreshes.

#### Scenario: Active state is emitted repeatedly
- **WHEN** the runtime emits multiple active-state notifications for the same foreground transition
- **THEN** the system performs at most one concurrent foreground authentication validation and coalesces redundant work into no more than one necessary follow-up

#### Scenario: Auth event overlaps foreground synchronization
- **WHEN** a token-refresh or signed-in event occurs while foreground synchronization is already running
- **THEN** authentication and synchronization remain ordered and do not start parallel account checks that can independently change the auth gate

### Requirement: Authentication diagnostics protect credentials
The system MUST provide structured diagnostics sufficient to correlate application lifecycle, auth events, account-check outcomes, and synchronization generations, and MUST NOT record credentials or direct user identifiers.

#### Scenario: Foreground validation is diagnosed
- **WHEN** development diagnostics are enabled and the app performs foreground authentication validation
- **THEN** diagnostics identify the lifecycle transition, sanitized auth event name, classified outcome, and applicable synchronization generation

#### Scenario: Sensitive values are available to the auth client
- **WHEN** an auth event or failure contains tokens, authorization data, user email, or provider payloads
- **THEN** none of those values are included in the diagnostic output

