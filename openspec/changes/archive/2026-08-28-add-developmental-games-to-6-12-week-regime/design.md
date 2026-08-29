## Context

See `proposal.md` for motivation. Timed regimes store sleep and feeding steps, while wake blocks are generated at render time from gaps around sleep. A generated wake block currently contains only the generic localized action and note, and the shared detail modal accepts a single `RegimeStep`.

The app supports Russian, Ukrainian, Polish, English, Spanish, French, German, Portuguese, and Italian through `REGIME_STRINGS` and `localizeRegimes`.

## Goals / Non-Goals

**Goals:**

- Attach structured game references to generated wake blocks without changing schedule geometry.
- Keep the game assignment deterministic and easy to validate.
- Render game titles and full instructions clearly in the existing detail flow.
- Maintain localization completeness across all supported languages.

**Non-Goals:**

- Adding timers, completion tracking, personalization, random recommendations, or new notifications.
- Changing the schedule, sleep guidance, feeding guidance, or other age regimes.
- Presenting medical or developmental milestone claims.

## Decisions

### Store games as localized structured content

Add a small `DevelopmentalGame` representation with stable keys for title and instruction. The 6–12 week regime will reference game IDs, and localization will resolve those keys alongside existing regime strings. This avoids embedding formatted lists into a single note and lets the modal render accessible, readable items.

Alternative considered: concatenate all games into each wake block's note. This would require fragile formatting, make item-level tests difficult, and blur the distinction between the existing general note and game suggestions.

### Assign games to generated wake blocks by their daily index

Extend wake-block generation to accept optional game groups for the selected regime and attach the corresponding group to each generated block. Use this deterministic six-group distribution for the current 6–12 week example day:

1. Face-to-face conversation; Find the voice.
2. Black-and-white pictures; Songs and nursery rhymes.
3. Tummy time; Bicycle legs.
4. Gentle textures; Safe mirror.
5. Walk around the home; Imitation.
6. Face-to-face conversation; Songs and nursery rhymes; Tummy time.

The first five groups cover all ten supplied games once; the final wake block repeats three calm, flexible activities. If schedule geometry later produces more wake blocks than configured groups, groups repeat cyclically; no block is left without suggestions.

Alternative considered: random selection. Deterministic assignment is preferable because it avoids changing content on re-render, guarantees full coverage, and enables stable tests.

### Extend the existing detail modal

Keep wake blocks selectable through the current timeline and extend the selected step model with optional localized games. The modal will retain the existing wake note and render a labeled list beneath it only when games exist. Other step kinds remain unchanged.

Alternative considered: place game text directly on the timeline. The blocks are too small for two or three instructions, and dense text would harm readability.

### Preserve safety wording verbatim in meaning

The tummy-time instruction must retain awake-only and continuous-supervision guidance in every language. Other instructions retain their gentle, non-forcing language. Tests will verify localization keys and structure; human-readable translations will be reviewed in source.

## Risks / Trade-offs

- [Nine-language content increases the chance of missing keys] → Add completeness tests that enumerate every game title and instruction for every supported language.
- [Long translations may overflow the modal] → Keep the modal content scrollable or constrain it within a scrollable section, and test representative long strings.
- [Suggestions could be interpreted as a mandatory routine] → Keep them in details, use suggestion-oriented wording, and do not assign exact durations or completion state.
- [The final long wake interval may represent bedtime preparation] → Use only calm, flexible repeated activities and leave the existing schedule note intact.

## Migration Plan

No persisted-data migration is required. Deploy the data-model, localization, wake-block mapping, and modal changes together. Rollback restores the previous generic wake-block details without affecting user data.
