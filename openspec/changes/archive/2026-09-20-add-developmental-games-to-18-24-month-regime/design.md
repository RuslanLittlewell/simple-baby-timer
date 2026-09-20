## Context

See `proposal.md` for motivation. The 10–12, 12–15, and 15–18 month bands established the shape this change follows: eighteen games, three wake-block groups of six, one shared guidance string above the list, and translations for all nine supported languages.

## Goals / Non-Goals

**Goals:**

- Cover the final age band with activities matching running, first phrases, rule-based sorting, and growing independence.
- Reuse the existing grouping and translation mechanics without new plumbing.
- Keep every instruction short enough to read inside the capped detail modal.

**Non-Goals:**

- Changing schedule timing, wake-block boundaries, or any other age band.
- Adding games to `regime.0`, where the newborn schedule has no wake-block play.
- Introducing per-variant game groups: this age has a single variant shape.

## Decisions

### Keep the established eighteen-game, 6/6/6 shape

Matching the three preceding bands keeps cycling behaviour identical across every age that has games, so the rhythm a parent learns once holds throughout. A different count was rejected for making the last band behave unlike its neighbours.

### Advance each focus rather than introducing new themes

Sorting moves from matching one trait to naming the rule, stacking reaches six blocks plus building sideways, scribbles become deliberate lines and circles, single pretend actions become a whole scene, and walking becomes running with a stop cue. The progression stays legible from the previous band.

### Address the autonomy stage in the shared guidance

At 18–24 months refusal and "me myself" dominate, so the guidance adds offering a real choice of two, letting the child do the part they can manage, and finishing the hard part together. Reusing the 15–18 month wording was rejected because it does not address what parents actually meet here.

### Carry safety wording in the instruction itself

Stairs, running water, jumping, dough, and sticker backing sheets each state their constraint inside the affected instruction. A parent reading one activity in the modal sees only that activity, so a separate warning block could be missed.

## Risks / Trade-offs

- [Translations drift from the English source] → The language-coverage test asserts every id has a non-empty title and instruction in all nine languages.
- [Instructions grow too long for the card] → Each instruction stays to two or three short sentences, and the detail modal scrolls within its height cap.
- [Only the newborn band should now lack games] → The regime-coverage test pins `regime.0` as the sole exception and counts the attachments.

## Migration Plan

Content-only change with no persisted data. Ships with the normal release; rollback is removing the group attachment on `regime.8`.
