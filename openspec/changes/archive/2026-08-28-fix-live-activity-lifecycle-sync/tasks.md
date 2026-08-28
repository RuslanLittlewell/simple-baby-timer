## 1. Native API and lifecycle foundation

- [x] 1.1 Inspect the installed `expo-live-activity` TypeScript and iOS APIs for activity enumeration, naming, update, and dismissal support
- [x] 1.2 Add persistent child/track/activity metadata and hydrate it safely after process restart
- [x] 1.3 Make start, replacement, and stop operations idempotent and remove stale persisted metadata after native failures

## 2. Authoritative reconciliation

- [x] 2.1 Implement reconciliation from desired shared/live store state to local iOS Live Activities
- [x] 2.2 Invoke reconciliation after initial sync, foreground refresh, authentication, and `live_sessions` Realtime refresh
- [x] 2.3 Ensure local stop and mode-switch flows dismiss the previous activity immediately without creating duplicate cards

## 3. Cross-device delivery

- [x] 3.1 Verify remote start/end payloads and activity-name mapping against the installed widget/native implementation
- [x] 3.2 Make the `live-activity-push` Edge Function handle repeated start/end requests idempotently
- [x] 3.3 Remove stale instance/device registrations only for permanent APNs token failures and retain transient failures for retry

## 4. Verification

- [x] 4.1 Add focused tests for persistence, stale cleanup, replacement, and duplicate prevention
- [x] 4.2 Run typecheck/lint and existing activity-sync tests
- [ ] 4.3 Verify on physical iOS devices: local stop, switch, relaunch, remote start, remote stop, offline foreground recovery, and simultaneous session/feeding tracks
