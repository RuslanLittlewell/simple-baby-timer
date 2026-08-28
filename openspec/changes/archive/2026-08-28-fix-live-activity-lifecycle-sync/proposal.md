## Why

Live Activities can remain on the lock screen after their mode has been stopped because the app only remembers locally created activity IDs in process memory. Although active modes are synchronized through Supabase, every participating iOS device does not reliably reconcile its system Live Activities with that shared state.

## What Changes

- End the matching Live Activity immediately when a mode stops or switches.
- Reconcile system Live Activities with the authoritative `live_sessions` rows after launch, foregrounding, and Realtime changes.
- Propagate starts and ends to other registered iOS devices and make delivery safe to retry.
- Remove stale Live Activity instance registrations after an activity ends or APNs rejects its token.
- Prevent duplicate lock-screen cards for the same child and activity track.

## Capabilities

### New Capabilities

- `live-activity-lifecycle-sync`: Covers creation, replacement, reconciliation, and removal of Live Activities across devices sharing a child.

### Modified Capabilities

- None.

## Impact

- iOS Live Activity wrapper and its local activity-ID lifecycle.
- App-state reconciliation and Supabase Realtime/foreground synchronization.
- Live Activity device/instance registration tables and `live-activity-push` Edge Function.
- Device tests for local stop, relaunch recovery, remote start, remote stop, and duplicate prevention.
