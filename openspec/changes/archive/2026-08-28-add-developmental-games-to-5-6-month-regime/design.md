## Context

See `proposal.md` for motivation and `specs/regime-developmental-games-5-6-months/spec.md` for behavior. The app already supports structured developmental-game registries, deterministic assignment to generated wake fills, nine-language localization, and scroll-safe detail presentation. The 5–6 month schedule is regime index 3 and currently generates four wake blocks.

## Goals / Non-Goals

**Goals:**

- Reuse the established developmental-game model, localization pipeline, wake-fill assignment, and detail UI.
- Keep the fifteen 5–6 month activity IDs separate from younger-age games with similar titles.
- Display all fifteen supplied activities once per current daily schedule using the user-approved `4 / 4 / 4 / 3` grouping.
- Preserve complete titles, instructions, and safety meaning in all nine supported languages.

**Non-Goals:**

- Changing schedule geometry or adding more wake blocks.
- Adding randomization, daily rotation, completion tracking, timers, milestone claims, or new UI.
- Sharing localized instruction keys between age ranges when their source guidance differs.

## Decisions

### Add fifteen age-specific game IDs

Extend the existing registry with fifteen stable 5–6 month IDs and corresponding title/instruction keys. Age-specific IDs avoid collisions with similar games such as mirrors, sound finding, textures, and tummy play from younger regimes.

Alternative considered: reuse existing IDs. This would incorrectly couple distinct age-specific wording and safety constraints.

### Use four deterministic thematic groups

Assign the games in this order:

1. Reach for the toy; Transfer hand to hand; Two toys; What happens if…
2. Find the partly hidden toy; Peekaboo; Where is the sound?; Sound dialogue.
3. Body-part songs; Safe mirror; Texture basket; Read a book together.
4. Tummy-time games; Preparing to crawl; Roll toward interest.

The `4 / 4 / 4 / 3` sizes fit the four current wake blocks and cover all fifteen activities exactly once. Groups move from object exploration through social and sensory play to larger floor movements. Existing cyclic overflow remains the fallback if the schedule later produces additional wake blocks.

Alternative considered: show only twelve and rotate the omitted games. The user selected complete daily coverage with up to four activities in a block.

### Extend complete per-language localization records

Add titles and full instructions for every new ID in Russian, Ukrainian, Polish, English, Spanish, French, German, Portuguese, and Italian. Preserve explicit safety statements rather than shortening them, including not covering the child’s face, not pulling or pushing the body, keeping sounds quiet, and using large safe objects.

Alternative considered: runtime fallback for missing translations. That would expose another language instead of fully localizing the selected experience.

### Reuse existing presentation and assignment behavior

Attach the four groups to regime index 3 and rely on the existing localization, wake-fill, and modal pipeline. No age-specific component branching is required.

Alternative considered: build a separate 5–6 month UI. It would duplicate existing accessible behavior without a user-facing benefit.

## Risks / Trade-offs

- [Fifteen games across nine languages add many localization keys] → Add exhaustive title/instruction completeness tests.
- [Four long instructions can make details taller] → Reuse the existing scroll-safe modal and verify representative long content.
- [Similar names could map to younger-age instructions] → Use distinct IDs and test age-specific keys.
- [Future schedule changes could alter wake-block count] → Assert current four-block coverage and retain cyclic overflow behavior.

## Migration Plan

No persisted-data migration is required. Deploy definitions, translations, regime mapping, and tests together. Rollback removes the 5–6 month group reference without affecting schedules or user data.
