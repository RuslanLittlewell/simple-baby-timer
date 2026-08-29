## Context

See `proposal.md` for motivation and `specs/regime-developmental-games-3-4-months/spec.md` for behavior. The app already supports structured developmental games, deterministic wake-block assignment, localized game strings, and modal presentation for the 6–12 week regime. The 3–4 month regime is the timed regime at index 2 and currently produces five wake blocks from its schedule gaps.

## Goals / Non-Goals

**Goals:**

- Reuse the existing structured game and wake-fill assignment pipeline.
- Keep 3–4 month game IDs distinct from the younger age set so instructions can evolve independently.
- Cover all twelve supplied activities exactly once across the current five wake blocks, with two or three games per block.
- Maintain complete, type-checked translations for all nine supported languages.

**Non-Goals:**

- Changing the shared game-list UI or regime schedule geometry.
- Adding completion tracking, randomization, durations, milestone claims, or recommendations outside the 3–4 month regime.
- Reusing similar younger-age translations when the supplied 3–4 month instruction differs.

## Decisions

### Extend the existing game registry with age-specific IDs

Add twelve stable IDs and localized title/instruction keys to the existing developmental-game model. Prefix or otherwise distinguish the new IDs by age set to prevent collisions with conceptually similar younger-age games such as mirrors and textures.

Alternative considered: reuse existing mirror and texture IDs. This would couple two age ranges to one instruction even though the 3–4 month guidance contains different safety and interaction details.

### Assign five deterministic groups matching the current wake blocks

Use this distribution:

1. Catch the toy; Eye tracking.
2. Hands together and transferring; Conversation with pauses.
3. Songs with movements; Where is the sound?
4. Mirror; Different textures; Tummy-time games.
5. Turn toward the toy; Airplane carry; Room tour.

This covers all twelve activities once using group sizes 2, 2, 2, 3, and 3. The progression keeps related visual, social, sensory, and motor activities together. Existing cyclic overflow behavior remains the fallback if future schedule geometry yields additional wake blocks.

Alternative considered: random assignment. It would make coverage and testing unstable and could omit activities during a day.

### Preserve translations as complete per-language records

Add both title and instruction for all twelve games to each language record: Russian, Ukrainian, Polish, English, Spanish, French, German, Portuguese, and Italian. Translate meaning rather than shortening safety clauses, and retain Russian as the existing localization fallback.

Alternative considered: machine fallback for missing keys. Visible fallback text would violate the requirement that the selected language fully localizes each game.

### Reuse the existing modal and localization pipeline

Attach the new groups to the 3–4 month regime data and let the existing wake-fill localization and detail modal render them. No UI branching by age is needed.

Alternative considered: a separate modal for this age range. It would duplicate established accessible, scroll-safe presentation behavior without changing the user experience.

## Risks / Trade-offs

- [Twelve games across nine languages create many new keys] → Extend completeness tests across every new title and instruction key.
- [Similar game names across age ranges could resolve to the wrong instruction] → Use distinct stable IDs and assert representative age-specific text.
- [A future schedule edit could change the number of wake blocks] → Assert current complete coverage and retain deterministic cyclic overflow behavior.
- [Long translated instructions may increase modal height] → Reuse the existing scroll-safe detail modal and test long representative strings.

## Migration Plan

No persisted-data migration is required. Deploy game definitions, translations, regime mapping, and tests together. Rollback removes the 3–4 month group reference and leaves schedule data and user data unchanged.
