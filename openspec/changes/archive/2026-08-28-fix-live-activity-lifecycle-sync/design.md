## Context

See proposal.md for motivation and the lifecycle-sync spec for required behavior. `live_sessions` already supplies the authoritative shared state and Supabase Realtime already triggers `refreshLive`. Local Live Activity IDs currently exist only in a module-level object, while remote activities register their update tokens in `live_activity_instances`. The Edge Function already ends previous remote instances before starting replacements.

The integration uses the alpha `expo-live-activity` package, so the implementation must be based on the APIs actually exposed by the installed version and its bundled native module.

## Goals / Non-Goals

**Goals:**

- Make local and remote stop/switch paths converge on one idempotent lifecycle operation.
- Recover control of existing system activities after process restart.
- Use `live_sessions` as the source of truth and tolerate missed or repeated Realtime/APNs delivery.
- Keep server instance registrations aligned with APNs lifecycle results.

**Non-Goals:**

- Synchronizing Live Activities through iCloud independently of the existing account/child sharing model.
- Showing Live Activities to users who have not registered an eligible iOS device.
- Replacing `expo-live-activity` or redesigning the widget presentation.

## Decisions

**Reconcile desired state instead of treating events as truth.** Realtime and APNs are wake-up/delivery mechanisms; `live_sessions` remains authoritative. On launch and foreground, the client compares the desired active tracks with locally known system activities, ending stale cards and starting missing cards. This handles missed events and offline devices. Event-only synchronization was rejected because it cannot repair missed stops.

**Persist activity identity and verify it against the native module.** Store the child/track/activity-ID mapping in AsyncStorage and hydrate it before reconciliation. If the installed module exposes enumeration of active activities, use that as the stronger source and use persisted metadata to associate IDs with child/track. Persistence alone was rejected because iOS may independently dismiss an activity.

**Use child plus track as the idempotency key.** A replacement first ends every known instance for that key, then starts the desired activity once. Start time and kind determine whether the existing activity already matches. This preserves the supported simultaneous `session` and `feeding` cards without duplication.

**Keep push fan-out, but clean registrations based on APNs responses.** The Edge Function continues to send end-before-start to other installations. Permanent APNs failures remove the relevant device or instance token; transient failures remain retryable. An end request removes instance rows only after delivery is attempted, so repeated end requests are harmless.

**Reconcile after the store has accepted remote state.** `refreshLivePass` maps remote child IDs, calls the existing store reconciliation, then invokes Live Activity reconciliation from the resulting store state. This avoids creating a card from a stale Realtime payload and keeps foreground and Realtime paths identical.

## Risks / Trade-offs

- **The package may not expose active-activity enumeration** → inspect the installed TypeScript and Swift APIs first; retain persisted IDs and add a narrow native bridge only if no public API can end recovered activities.
- **AsyncStorage can contain an ID iOS already removed** → treat stop/update failures as successful cleanup and delete the stale mapping.
- **APNs delivery is not guaranteed** → foreground reconciliation repairs eventual state from `live_sessions`.
- **Two devices may switch modes concurrently** → the database row wins; every client reconciles to its final kind and start time.
- **Server cleanup could remove a temporarily failing token** → only permanent APNs statuses trigger deletion; transient failures are logged and retained.

## Migration Plan

1. Add client-side lifecycle persistence and reconciliation without changing the database schema.
2. Update and deploy the Edge Function cleanup/idempotency behavior.
3. Release the iOS build and verify local and two-device scenarios in TestFlight.
4. Roll back the client and function independently if necessary; existing `live_sessions` data remains compatible.
