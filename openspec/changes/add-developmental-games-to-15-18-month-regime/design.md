## Context

See `proposal.md` for motivation. The 10–12 and 12–15 month bands established the shape this change follows: eighteen games, three wake-block groups of six, one shared guidance string rendered above the list, and translations for all nine supported languages.

## Goals / Non-Goals

**Goals:**

- Cover the 15–18 month band with activities matching confident walking, first phrases, and early self-care.
- Reuse the existing grouping and translation mechanics without new plumbing.
- Keep every instruction short enough to read inside the capped detail modal.

**Non-Goals:**

- Changing schedule timing, wake-block boundaries, or any other age band.
- Introducing per-variant game groups: this age has a single variant shape.
- Adding imagery or media to the game list.

## Decisions

### Keep the established eighteen-game, 6/6/6 shape

Matching the two preceding bands keeps the cycling behaviour identical across adjacent ages, so a parent moving from 12–15 to 15–18 months sees the same rhythm. A different count was rejected for making adjacent ages behave differently with no user-visible benefit.

### Advance the difficulty within each existing focus

Each group carries the same theme as the previous band but a harder task: stacking becomes four or five blocks, single words become two-word phrases, and walking becomes walking along a line while carrying something. This keeps the progression legible rather than introducing unrelated activities.

### Extend the shared guidance with a refusal note

At this age refusal and strong preferences are common, so the guidance adds that declining an activity is normal and that offering a choice of two works better than insisting. Leaving the 12–15 month wording unchanged was rejected because it does not address the behaviour parents meet at this stage.

### Carry safety wording in the instruction itself

Stairs, water, beads, and pegs each state their constraint inside the affected instruction. A parent reading one activity in the modal sees only that activity, so a separate warning block could be missed.

## Risks / Trade-offs

- [Translations drift from the English source] → The language-coverage test asserts every id has a non-empty title and instruction in all nine languages.
- [Instructions grow too long for the card] → Each instruction stays to two or three short sentences, and the detail modal scrolls within its height cap.
- [A future age band silently inherits these groups] → The regime-coverage test pins exactly which regime indices carry games.

## Migration Plan

Content-only change with no persisted data. Ships with the normal release; rollback is removing the group attachment on `regime.7`.
