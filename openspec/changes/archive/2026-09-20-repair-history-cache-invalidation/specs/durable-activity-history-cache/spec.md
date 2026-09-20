## Purpose

Keeps a child's stored activity history and the record of what has already been downloaded in agreement, so a range is re-requested from the server whenever the device can no longer show it.

## ADDED Requirements

### Requirement: A downloaded range is recorded only when it accounts for stored activity
The system MUST NOT permanently record a history range as downloaded when the download applied no activity to local storage. An empty result MAY suppress repeated requests only for a bounded freshness period, after which the range is requested again.

#### Scenario: Download returns no activity
- **WHEN** a history range is requested and the response contains no activity for the child
- **THEN** the range is not permanently recorded as downloaded, and a later request for that range reaches the server again

#### Scenario: Empty range is revisited immediately
- **WHEN** a range that just returned no activity is requested again within the freshness period
- **THEN** the system reuses the empty result instead of issuing another request

#### Scenario: Download applies activity
- **WHEN** a history range is requested and activity for the child is written to local storage
- **THEN** the range is recorded as downloaded and later requests for it are served locally

### Requirement: Download records are scoped to the local child identity that received the activity
A record of downloaded history MUST identify the local child identity the activity was stored under. A record made under one local child identity MUST NOT suppress downloads for a different local child identity of the same remote child.

#### Scenario: Local child identity is regenerated
- **WHEN** a remote child is re-established locally under a new local child identity
- **THEN** history ranges recorded for the previous local identity do not suppress downloads, and the ranges are requested again for the new identity

#### Scenario: Record predates identity scoping
- **WHEN** a stored record does not identify which local child identity it was made under
- **THEN** the system treats the range as not downloaded and requests it again once

#### Scenario: Local child identity is unchanged
- **WHEN** history ranges were recorded for the local child identity that is still in use
- **THEN** those ranges are served locally without a new request

### Requirement: Download records never outlive the activity they describe
When local activity data for an account or a child is discarded, the corresponding download records MUST be discarded no later than the activity itself, including when the discarding operation fails or is interrupted partway.

#### Scenario: Account data is cleared
- **WHEN** local account data is cleared
- **THEN** no download record survives that claims activity which was deleted

#### Scenario: Clearing is interrupted
- **WHEN** clearing local account data fails or the application terminates partway through it
- **THEN** the surviving state does not claim any range as downloaded whose activity was already deleted

#### Scenario: A child is removed
- **WHEN** a child's local activity is removed
- **THEN** that child's download records are removed with it

### Requirement: History the device cannot show is downloaded again
The system SHALL request a history range from the server whenever the range is not present in local storage for the active child and is not recorded as downloaded for that child's current local identity.

#### Scenario: Profile is opened after records became unusable
- **WHEN** the user opens history for a child whose download records no longer apply to the current local identity
- **THEN** the client requests that child's current week from the server and the recovered activity is shown

#### Scenario: An earlier day is opened
- **WHEN** the user navigates to a day, week, or month whose activity is absent locally and not recorded as downloaded for the current local identity
- **THEN** the client requests that range from the server and shows the returned activity

#### Scenario: Recovery is not possible offline
- **WHEN** such a range is requested while the server cannot be reached
- **THEN** the range is not recorded as downloaded and is requested again on the next attempt

### Requirement: Re-authentication does not narrow visible history
Signing in again as the account that owns the locally stored activity MUST leave that activity visible and MUST NOT reduce the visible history to the current day.

#### Scenario: Forced re-authentication for the same account
- **WHEN** the user signs in again as the same account after the session was lost
- **THEN** previously visible days remain visible, either from local storage or by downloading the ranges again

#### Scenario: Sign-in as a different account
- **WHEN** the user signs in as an account different from the one whose data is stored locally
- **THEN** the stored activity and its download records are discarded together, and the new account's history is downloaded from the server
