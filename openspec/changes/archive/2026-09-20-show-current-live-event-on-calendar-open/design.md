## Context

See `proposal.md` for motivation and the delta spec for behavior. `CalendarScreen` remains mounted across native-tab switches. Its `shownDay` state and `ScrollView` offset therefore persist, while `didAutoScroll` permits the current-time auto-scroll only once per mount. Live blocks continue to update, but reopening Calendar does not create a lifecycle edge that reveals them.

## Goals / Non-Goals

**Goals:**

- Treat each Calendar tab focus as a fresh request to show today's current timeline.
- Keep one deterministic rule for positioning active live blocks and the no-live fallback.
- Apply focus scrolling only after today's state and timeline layout are ready.
- Preserve all existing live-block filtering, rendering, zoom, overlays, and manual navigation behavior.

**Non-Goals:**

- Change how active sessions are stored, synchronized, or reconciled.
- Change timeline block appearance or editing behavior.
- Recalculate personal regimes or alter activity transitions.
- Continuously force the scroll position while Calendar remains focused.

## Decisions

### Observe Calendar tab focus inside CalendarScreen

Use the router focus lifecycle to issue a focus request each time the tab becomes active. The request updates the current clock value, selects today, closes stale period overlays, and marks the timeline for one non-animated focus scroll.

Watching only component mount was rejected because native tabs preserve the screen. Watching every live-session update was rejected because it would interrupt a user who is intentionally inspecting another time while Calendar is already open.

### Focus the current-time end of live blocks

Running blocks all end at `now`, including sessions clipped at local midnight and concurrent main/feeding tracks. The focus target therefore uses today's current-time coordinate with the existing visual lead above it. The same target is the fallback when no block is active, avoiding separate scroll rules that could drift.

Scrolling to the activity start was rejected because a long sleep may place its current end outside the viewport. Choosing one track was rejected because main and feeding activities can overlap.

### Queue the focus scroll until layout is ready

Represent tab focus as a pending scroll request rather than relying on the one-time `didAutoScroll` mount flag. Fulfill it from the existing content-size/layout path after `shownDay` has become today, using the current zoom-derived hour height. Clear the request after one scroll so manual navigation remains stable.

Calling `scrollTo` immediately from the focus callback was rejected because the selected-day render and content dimensions may still describe the previously viewed day.

### Extract deterministic target calculation

Place the minute-to-scroll-offset calculation in a small Calendar helper that clamps the result to the timeline bounds. Unit tests cover ordinary daytime, midnight clipping, and viewport-safe lower bounds; source-level wiring tests verify focus requests use that helper.

## Risks / Trade-offs

- **[A focus event arrives while a period overlay is open]** -> Close the stale overlay as part of re-entering the day timeline before scrolling.
- **[Focus and a midnight rollover happen together]** -> Reuse the existing current-date synchronization and local-day comparison.
- **[The timeline has not measured yet]** -> Keep the request pending until content size is available rather than dropping it.
- **[A live event starts immediately after focus]** -> The current-time fallback already places the viewport where the new live block ends; no additional forced scroll is needed.

## Migration Plan

No data migration is required. Ship the focus lifecycle, helper, and tests together. Rollback restores the previous persistent Calendar tab position without affecting stored activity data.
