## 1. Weekly History Loading

- [x] 1.1 Add local calendar-week range helpers and unit coverage for week boundaries and multi-week ranges
- [x] 1.2 Replace month-keyed remote history loading and persistence with versioned week-keyed loading
- [x] 1.3 Update calendar history callers to request all weeks intersecting the visible range and avoid duplicate cached requests

## 2. Critical Activity Synchronization

- [x] 2.1 Split the generation-safe activity gate from completion of the full synchronization pass
- [x] 2.2 Load the active child's current week and live state as the foreground critical stage
- [x] 2.3 Move entitlement, queue, profile, and other-child work behind the activity-ready boundary while preserving background completion and error handling

## 3. Verification

- [x] 3.1 Add or update tests for early gate release, timeout fallback, active-child-only foreground loading, and continued background synchronization
- [x] 3.2 Run focused tests, TypeScript validation, and OpenSpec strict validation

## 4. Local Freshness Fast Path

- [x] 4.1 Persist successful per-child weekly refresh timestamps and expose loaded-and-fresh checks with a 60-second TTL
- [x] 4.2 Decide whether to start the activity gate from local critical freshness before network synchronization begins
- [x] 4.3 Make routine foreground resumes freshness-aware while preserving forced refresh behavior for authentication, account, child-change, and explicit-refresh flows
- [x] 4.4 Reuse the resolved user identity and avoid the second remote-child fetch unless a new remote child mapping was created
- [x] 4.5 Add tests for fresh-cache loader suppression, stale/forced gating, timestamp failure handling, and remote-request deduplication
- [x] 4.6 Run focused tests, TypeScript validation, lint, and OpenSpec strict validation

## 5. Current-Day Critical Loading

- [x] 5.1 Add exact local-day range helpers and day-scoped freshness persistence for the active child
- [x] 5.2 Replace current-week critical loading and gate preflight with current-day loading and freshness checks
- [x] 5.3 Move the remainder of the active child's current week behind the activity-ready boundary
- [x] 5.4 Remove or migrate obsolete week-freshness metadata while retaining weekly lazy-history markers
- [x] 5.5 Add tests for exact day boundaries, day-only gating, and background completion of the current week
- [x] 5.6 Run focused tests, TypeScript validation, lint, and OpenSpec strict validation
