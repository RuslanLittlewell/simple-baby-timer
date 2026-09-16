## Context

See `proposal.md` for motivation. Child metadata is currently persisted in the Zustand app store, while activity history uses a local-first store and Supabase synchronization. The activity screen already renders a pressable child profile chip in its header. Supabase authorizes child-scoped data through `child_members`, and existing saved children have no growth data.

The project currently declares Expo SDK 54, but project instructions require implementation decisions to be checked against the exact Expo SDK 57 documentation before code changes. The feature can use the project’s existing React Native modal, text input, wheel date field, AsyncStorage, and Supabase packages without adding a dependency.

## Goals / Non-Goals

**Goals:**

- Keep measurement data local-first so the latest value remains available offline and after restart.
- Give each measurement a stable identity so edits merge safely across devices.
- Keep calendar dates stable across time zones.
- Reuse existing modal, date-picker, theming, and localization patterns.
- Preserve existing saved children and show a usable empty state for them.

**Non-Goals:**

- Growth charts, percentiles, medical interpretation, recommendations, or unit-system preferences.
- Deleting measurement rows.
- Backfilling invented measurements for existing children.
- Changing who owns or can edit the child’s name, birthday, or appearance.

## Decisions

### Store measurements as child-scoped records with date-only values

Each measurement will contain a stable client-generated ID, local child ID, `measuredOn` in `YYYY-MM-DD` form, numeric `heightCm` and `weightKg`, and an update timestamp used for merging. A date-only string avoids the day shifting when collaborators use different time zones. Measurements will not be embedded in the cloud `children` row because they are an independently editable, growing history.

Alternative considered: store JavaScript timestamps. This matches birthdays but can render a different calendar date after a time-zone change, which is undesirable for a user-selected measurement date.

### Persist a small per-child local history and queue cloud writes

A focused growth store will persist measurement arrays in AsyncStorage and expose sanitize, sort, latest, add, edit, merge, and child-cleanup operations. Cloud mutations will be queued when a child is not yet cloud-backed or the network is unavailable, then flushed after the child receives a remote ID and during the existing synchronization lifecycle.

Alternative considered: keep measurements only inside the persisted Zustand child object. A separate store keeps the child profile model small, avoids rerendering unrelated state, and gives synchronization and schema migration a clear boundary.

### Model cloud data in a dedicated `child_measurements` table

The table will use `(child_id, id)` as its key and contain `measured_on date`, numeric height and weight fields, and `updated_at`. RLS will permit select/insert/update only when `is_child_member(child_id)` is true. The schema source and a timestamped migration will both be updated. No delete policy or UI is needed because deletion is outside scope.

Alternative considered: add a JSON history column to `children`. A relational table gives smaller updates, straightforward authorization, stable row identities, and less conflict-prone synchronization.

### Resolve edits with last-updated wins per stable row ID

Remote and local copies of the same row will be compared using their update timestamps; the newer version wins. Different rows always merge. Storage and latest-value selection retain their descending deterministic sort, while the history modal reverses that result for chronological display with the newest row at the bottom. Editing a row does not change its ID.

Alternative considered: unique one-row-per-date semantics. The request does not forbid multiple measurements on one day, so imposing uniqueness would add behavior and conflict handling the user did not request.

### Treat the creation values as a birthday measurement

The add-child form will require height and weight and create the first row with `measuredOn` equal to the chosen birthday. Editing child profile metadata later will not silently rewrite measurement dates. Growth history remains explicitly editable through its own modal.

Alternative considered: default the initial measurement to today. Pairing it with the birthday is more consistent with collecting these fields alongside the birth date and preserves the common meaning of initial height and weight.

### Keep profile navigation and growth navigation as separate targets

The existing profile chip will continue to open child selection. The activity header will align its left profile column and right Premium/menu control at their top edges, keeping both badges on one visual row. A compact, separately pressable text row immediately below and flush with the left edge of the child chip will show the latest `kg` and `cm` values without decorative icons, or an add-first-measurement label, and will open the history modal. This satisfies the placement and interaction request without changing established profile navigation.

### Use a history modal with an inline add/edit editor

The modal will have a bounded height and list date, weight, and height rows from oldest to newest. The history viewport height will be derived from four fixed-height rows and the three gaps between them, so up to four rows remain fully visible and a fifth row introduces scrolling. On open, the scroll view will move directly to the bottom so the latest row is immediately visible. Each row will reserve flexible space for its values so the edit icon stays at the far right. Pressing Add opens a blank editor defaulted to today; pressing a row opens the same editor prefilled for that record. The existing wheel date field will constrain dates to the child’s birthday through today. Numeric text inputs will accept both comma and period decimal separators, normalize internally, and display localized decimal values.

## Risks / Trade-offs

- [Offline edits to the same row on two devices can conflict] → Use stable IDs and update timestamps with deterministic last-updated-wins merging; retain all unrelated rows.
- [Client clocks can disagree] → Prefer the database-generated `updated_at` after successful sync and use the client timestamp only for unsynced local changes.
- [A child can be created locally before its cloud ID exists] → Queue the initial row by local child ID and flush it immediately after child synchronization assigns the remote ID.
- [Existing children have no latest measurement] → Preserve them unchanged and render a clear add-first-measurement action.
- [Decimal keyboard behavior differs by locale and platform] → Normalize comma and period input, validate finite positive values, and cover parsing with tests.

## Migration Plan

1. Add the `child_measurements` table, indexes, timestamp trigger, grants, and member-scoped RLS policy through a new Supabase migration and mirror it in `supabase/schema.sql`.
2. Ship local parsing and persistence as backward-compatible additive storage; missing or malformed measurement data sanitizes to an empty history.
3. Add synchronization and creation plumbing, then expose the activity summary and history modal.
4. Deploy the database migration before releasing a client that writes measurements. If the table is temporarily unavailable, retain queued local writes and keep the local UI functional.

Rollback removes the client UI and sync calls first. The additive table can remain safely in place; dropping it is optional and would be destructive, so it is not part of an automatic rollback.
