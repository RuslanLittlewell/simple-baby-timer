## 1. Range Loading Core

- [x] 1.1 Add calendar-month key and intersecting-month range helpers with boundary-focused unit tests.
- [x] 1.2 Implement deterministic paginated Supabase loading for sessions overlapping one calendar month, including deletion tombstones and compound cursor tests.
- [x] 1.3 Add durable per-remote-child loaded-month metadata, in-flight request deduplication, retry-on-failure behavior, and reset coverage tests.

## 2. Synchronization Integration

- [x] 2.1 Replace unbounded initial history pulling with an explicit current-month refresh for every synchronized child.
- [x] 2.2 Adapt realtime session handling so remote changes still merge locally without triggering full-history synchronization.
- [x] 2.3 Ensure account synchronization reset clears legacy cursor and loaded-month metadata without deleting unrelated data outside existing reset behavior.

## 3. Lazy View Loading

- [x] 3.1 Request the active child's required month when the calendar's selected day changes and refresh visible sessions after completion.
- [x] 3.2 Request every intersecting month for week and month navigation without blocking locally stored calendar rendering.
- [x] 3.3 Request every intersecting month for day, week, and month statistics periods and refresh charts after completion.

## 4. Verification

- [x] 4.1 Add integration-focused tests covering current-month startup, lazy older-month loading, cross-month ranges, concurrent deduplication, and offline retry behavior.
- [x] 4.2 Run targeted tests, TypeScript checks, linting, and strict OpenSpec validation; resolve failures attributable to this change.
