## Why

The activity loader currently waits for more history than the activity screen needs immediately. The critical fetch should be reduced to the active child's current local day and live state, with weekly and older history continuing in the background.

## What Changes

- Load only the active child's current local day and live activities as the critical foreground synchronization stage.
- Hide the activity loader and enable activity controls when that critical stage completes or reaches its safety timeout.
- Continue subscription checks, queued writes, child-profile synchronization, and other children's history without holding the activity gate.
- Fetch older activity history lazily in calendar-week ranges as the user navigates to it.
- Preserve locally cached activity data while refreshing remote data in the background.
- Record when each child's day was last refreshed and use a 60-second freshness window for foreground resumes.
- Skip the activity loader and redundant foreground history request when the active child's current day is locally available and fresh.
- Load the remainder of the current week after the critical day is ready, without extending the loader.
- Reserve forced refreshes for authentication/account transitions, child changes, and explicit refresh actions.
- Avoid duplicate remote-child and user-identity requests within one synchronization pass.

## Capabilities

### New Capabilities

- `activity-initial-sync`: Defines the critical activity-ready boundary, weekly history fetching, and non-blocking background synchronization.

### Modified Capabilities

None.

## Impact

- Affects `src/hooks/use-sync.ts`, `src/lib/sync.ts`, activity history loading helpers, local sync metadata, and their tests.
- Changes Supabase session-query ranges from month-based initial loading to week-based loading.
- Does not change the database schema or external APIs.
