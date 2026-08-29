## Context

See `proposal.md` for motivation. The regime screen already resolves per-age game groups through `resolveDevelopmentalGameGroups` and assigns them to wake blocks with `assignGamesToAwakeFills`. The 10–12 month band established the current shape: eighteen games, three groups of six, and one shared guidance string rendered above the list.

## Goals / Non-Goals

**Goals:**

- Cover the 12–15 month band with activities that match walking, first words, and early pretend play.
- Reuse the existing grouping and translation mechanics without introducing new plumbing.
- Keep every instruction short enough to read inside the capped detail modal.

**Non-Goals:**

- Changing schedule timing, wake-block boundaries, or any other age band.
- Introducing per-variant game groups: this age has a single variant shape.
- Adding imagery or media to the game list.

## Decisions

### Reuse the 10–12 month structure rather than inventing a new one

Eighteen games in three groups of six keeps one group per wake block with a clean cycle on overflow, and matches what parents already see one band earlier. A different count was rejected because it would make the cycling behaviour differ between adjacent ages for no user-visible benefit.

### Group by developmental focus, not by difficulty

Group one covers object manipulation, group two speech and imitation, group three gross motor and sensory play. Each wake block therefore has a coherent theme instead of a mixed sample. Ordering by difficulty was rejected because wake blocks are assigned by position, not by the child's progress.

### Keep the shared guidance as a separate key

The 5–15 minute recommendation stays one string per language under `regime.game.m1215Guidance`, rendered above the list. Repeating the caveat inside each instruction was rejected as noise in a scrolling card.

### Carry safety wording in the instruction itself

Supervision for dough, arm's-reach for climbing, no walking by raised arms, and no swallowable objects are written into the affected instructions rather than collected in one warning. A parent reading a single activity in the modal sees only that activity, so a separate warning block could be missed.

## Risks / Trade-offs

- [Translations drift from the English source] → A language-coverage test asserts every id has a non-empty title and instruction in all nine languages.
- [Instructions grow too long for the card] → Each instruction stays to two or three short sentences, and the detail modal scrolls within its height cap.
- [A future age band silently inherits these groups] → The regime-coverage test pins exactly which regime indices carry games.

## Migration Plan

Content-only change with no persisted data. Ships with the normal release; rollback is removing the group attachment on `regime.6`.
