## Context

See `proposal.md` for motivation. Activity sessions are persisted in date-keyed AsyncStorage buckets and calendar views read only from that local store. Remote synchronization currently walks every row ordered only by `updated_at` behind one per-child cursor. The calendar day view and statistics modal request arbitrary date ranges, while week and month overlays provide navigation without loading data themselves.

The implementation must preserve offline-first rendering, shared-child behavior, deletion tombstones, and existing user changes in the working tree. No database migration or new dependency is needed.

## Goals / Non-Goals

**Goals:**

- Bound initial remote history work to the current calendar month.
- Provide one reusable month-range loader for initial sync, calendar navigation, and statistics.
- Make pagination stable even when many rows share ordering values.
- Avoid duplicate requests and persist successful per-child month coverage.
- Preserve local sessions outside the fetched range.

**Non-Goals:**

- Evicting old local history or limiting offline retention.
- Changing calendar navigation or adding new loading UI.
- Changing the Supabase schema or RLS policies.
- Prefetching adjacent months that the user has not requested.

## Decisions

### Use calendar months as the cache and request unit

Represent a range with a local-time `YYYY-MM` key and derive exact `[monthStart, nextMonthStart)` millisecond bounds. A higher-level helper expands an arbitrary visible range into all intersecting month keys. Calendar months match the requested startup behavior and keep cache metadata compact.

Alternative considered: cache arbitrary day ranges. That minimizes transferred data for a single day but makes overlap merging, coverage checks, and week/month boundary handling substantially more complex.

### Separate range hydration from live updates

Replace the unbounded first pull with explicit month hydration. Initial sync requests the current month. Calendar and statistics consumers request the months intersecting their visible period. Realtime changes continue to update local data for synchronized children without turning startup into a full-history pull; range hydration remains the source of completeness when an unloaded month is opened.

Alternative considered: retain the global `updated_at` cursor for initial hydration. A cursor cannot express which historical time ranges are locally complete and recreates the current failure when local rows and cursor metadata diverge.

### Query overlap and paginate with a unique stable order

Range queries select rows with `start_ms < rangeEnd` and `end_ms > rangeStart`, including deletion tombstones whose original bounds remain stored. Pages use `(start_ms, id)` ascending as a compound cursor, with the next predicate expressing `start_ms > lastStart OR (start_ms = lastStart AND id > lastId)`. This prevents equal sort values at a page boundary from being skipped.

Alternative considered: offset pagination. Concurrent inserts can shift offsets and cause duplicates or omissions; keyset pagination remains stable.

### Persist only completed coverage and deduplicate in memory

Store a versioned per-remote-child set of completed month keys in AsyncStorage. Maintain an in-memory promise map keyed by `remoteChildId/month` so concurrent callers share one request. Add the durable key only after every page merges successfully; failure removes the in-flight entry and leaves the month retryable.

Alternative considered: persist loading/error states. Those states become stale across process termination and add no value beyond the in-memory promise and absence of a completed marker.

### Keep local rendering independent from remote success

Views continue reading AsyncStorage immediately. They trigger month hydration as an effect and bump the existing data version only after newly fetched rows have merged. A network failure therefore leaves existing local history visible and can be retried on a later navigation or foreground sync.

## Risks / Trade-offs

- [A loaded marker can outlive corrupted or manually removed session buckets] → Current-month startup uses an explicit refresh; account reset clears coverage metadata, and an explicit refresh path bypasses the marker.
- [A session crossing a boundary may be returned for two months] → Existing merge-by-session-ID behavior makes repeated rows idempotent.
- [Rapid navigation may start requests for several different months] → Deduplicate identical child/month requests while allowing distinct requested months to proceed.
- [Realtime delivery can be missed while the app is offline] → Refresh the current month on foreground synchronization; opening any other month can explicitly refresh it when required.

## Migration Plan

1. Introduce versioned loaded-month metadata without reading the legacy global cursor as proof of month coverage.
2. Use month-range hydration for startup and view-driven requests.
3. Clear both legacy cursor keys and new loaded-month metadata during synchronization reset.
4. Retain existing local session buckets; no destructive data migration is performed.
5. Rollback can restore the previous pull path while ignoring the additive loaded-month metadata.
