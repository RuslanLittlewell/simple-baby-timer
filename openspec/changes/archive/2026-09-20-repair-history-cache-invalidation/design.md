## Context

See `proposal.md` for motivation and the delta spec for the behavior contract.

Activity rows live in AsyncStorage under per-day keys and carry the local child id that owned them when they were written. Reads filter by that id. Downloaded history is tracked separately by a registry keyed by **remote** child id holding a plain list of week keys, and a week in that list short-circuits every later request for it. Today's day is the one range fetched unconditionally; the active child's current week goes through the registry like any other week.

Three properties of that arrangement work against each other. A local child id is regenerated whenever a remote child is re-established locally, which orphans every stored row while the registry, keyed by remote id, survives untouched. A week is recorded as downloaded even when the response applied nothing. And account clearing sets state, then deletes rows, then clears the registry, so a failure or termination in the middle leaves records claiming rows that are gone. Any one of them turns into permanently invisible history because nothing ever re-checks a recorded week.

## Goals / Non-Goals

**Goals:**

- Make a download record falsifiable: it stands only while the activity it describes is still readable under the identity that stored it.
- Repair installs already in the broken state without asking users to reinstall.
- Keep the request volume of ordinary calendar browsing unchanged for ranges that do hold activity.

**Non-Goals:**

- Change the storage layout of activity rows, or how they are keyed by day.
- Introduce a reconciliation scan that walks stored activity to validate records.
- Make the local child id stable across re-establishment; that is a separate concern and the design must survive it changing.
- Change server queries, RLS, pagination, or the authentication lifecycle.

## Decisions

### Carry the owning local child id inside the record, and bump the storage key

The registry record becomes an object holding the local child id it was written for alongside the week keys, stored under a new `v2` key prefix. A lookup for a different local child id reports nothing downloaded, and the next successful download replaces the record wholesale rather than merging into a foreign identity's list.

One identity per remote child is enough: a remote child has exactly one local representation at a time, so a per-week identity map was rejected as larger with no added recovery.

The `v1` prefix is removed alongside the other legacy prefixes already handled during state clearing, and is never read. That doubles as the migration: every install starts with an empty `v2` record, so devices whose history is currently unreachable re-download it on first launch after the update, including the case where the local child id never changed and the rows were deleted by an interrupted clear. The cost is one history pass per child per install, which is the same work a fresh sign-in already does.

### Record only what applied, and bound how long an empty result suppresses requests

A week is recorded as downloaded only when the download applied at least one row. An empty result instead marks a short-lived freshness stamp, reusing the existing timestamp-registry shape that the current day already uses, with its own prefix and TTL. Within the TTL the range is not requested again; after it, the range is requested normally.

This is what makes the ambiguity safe. An empty response means either "this week genuinely holds nothing" or "this request could not see the child's rows", and the client cannot tell them apart from the response alone. Treating it as authoritative is what makes the failure permanent; treating it as fresh-for-now keeps calendar scrolling from thrashing while still letting the range heal on its own.

A permanent empty record guarded by a separate authorization probe was rejected: it adds a round trip and still trusts a judgment the client cannot make locally. Never suppressing empty ranges was rejected because opening a month view fans out to every week in it.

### Clear records before the activity they describe

`clearAccountData` clears the sync state first, then deletes activity rows, then applies the state update. Every interruption point then leaves either both intact or the records already gone, and a missing record only ever costs a redundant download. Deleting rows first is what produces the unrecoverable ordering, so the ordering itself is the fix rather than a try/finally around the current one.

Row deletion stays best-effort within the operation: if it fails after the records were cleared, the orphaned rows are superseded by the next download instead of hiding it.

### Leave the active child's current-week path alone

Once records are identity-scoped and empty results no longer stick, the existing split — today unconditionally, the rest of the current week through the registry — is correct as written, and no longer collapses to "today only" when a record is stale. Force-refreshing the active child's current week on every sync pass was rejected as re-fetching a week's rows on every foreground with nothing left to fix.

## Risks / Trade-offs

- **[Every install re-downloads history once after the update]** → Bounded by the same per-child week fetch a new sign-in performs; it happens once, on a key that is never read again.
- **[Genuinely empty weeks are re-requested after the freshness window]** → Those queries return no rows and are cheap; the TTL is sized so that continuous browsing of one range does not repeat the request.
- **[Records and rows can still diverge if AsyncStorage fails between the two clears]** → The chosen ordering makes that divergence self-correcting: the surviving side is always the one that triggers a download rather than the one that suppresses it.
- **[A child re-established under a new local id discards a valid record]** → Intentional; the rows under the old id are unreadable anyway, and one re-download restores them.

## Migration Plan

Ship the registry record change, the marking policy, and the clearing order together; the `v1` prefix removal is the whole migration and needs no separate step. Rollback restores the previous prefix, which reverts installs to an empty `v1` record and one more re-download. No server, database, or authentication change is involved.
