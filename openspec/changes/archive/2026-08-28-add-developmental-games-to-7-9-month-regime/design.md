## Context

See `proposal.md` and `specs/regime-developmental-games-7-9-months/spec.md`. Existing developmental-game groups live at age level and are passed to the timeline independently of the selected variant. The 7–9 month regime at index 4 has a two-nap variant with three generated wake blocks and a three-nap variant with four, so one shared grouping cannot satisfy both approved distributions.

## Goals / Non-Goals

**Goals:**

- Support optional game groups at schedule-variant level while retaining age-level groups for existing regimes.
- Cover all seventeen age-specific games once in either 7–9 month variant.
- Switch groups immediately and deterministically with the selected variant.
- Add complete, safety-preserving translations across all nine languages.

**Non-Goals:**

- Migrating younger regime data from age level to variant level.
- Changing schedule geometry, randomizing games, rotating across days, or tracking completion.
- Adding a new presentation component or changing the wake-block modal layout.

## Decisions

### Add optional groups to each regime variant

Extend the variant model with optional developmental-game groups. Localization resolves variant-level groups exactly as it already resolves age-level groups. When rendering, the selected variant’s groups take precedence; the age-level groups remain the compatibility fallback.

Alternative considered: store a map keyed by variant index on the age object. Putting content on the variant keeps schedule-specific data colocated and avoids synchronizing array indexes across separate structures.

### Define two deterministic partitions over the same seventeen IDs

The two-nap variant uses:

1. Where is the toy?; Peekaboo; Treasure box; Put in and take out; Two containers; Tower to knock down.
2. Rolling ball; Musical cause and effect; Copy me; Syllable dialogue; Name and show; Picture books.
3. Mirror games; Obstacle course; Reach and move; Tunnel; Supervised water.

The three-nap variant uses:

1. Where is the toy?; Peekaboo; Treasure box; Put in and take out; Two containers.
2. Tower to knock down; Rolling ball; Musical cause and effect; Copy me.
3. Syllable dialogue; Name and show; Picture books; Mirror games.
4. Obstacle course; Reach and move; Tunnel; Supervised water.

Both partitions preserve source order and include every ID exactly once. This makes review and tests straightforward while adapting density to each schedule.

Alternative considered: derive balanced chunks automatically. Explicit groups keep semantic sequencing stable and prevent unrelated future ID additions from silently changing the schedule.

### Keep 7–9 month IDs age-specific

Add seventeen distinct IDs rather than reusing similarly named younger games. Their directions and safety details differ, especially for object permanence, movement, and water play.

Alternative considered: reuse title-level concepts and override only instructions. It adds indirection and increases the risk of resolving the wrong age-specific text.

### Preserve full safety text in every locale

Each language record includes complete title and instruction pairs. Tests enumerate all keys and check representative critical phrases for prohibited small objects, supervision near obstacles and tunnels, and uninterrupted adult presence in water.

Alternative considered: rely on fallback localization. This would violate complete localization and could obscure safety instructions for a selected language.

## Risks / Trade-offs

- [Six games in one modal can produce long content] → Reuse the existing scroll-safe modal and verify the largest group.
- [Variant-level groups could accidentally override younger regimes] → Use optional variant data with age-level fallback and add compatibility tests.
- [Seventeen games across nine languages create many keys] → Add exhaustive completeness tests.
- [Both partitions might drift apart when edited] → Test that each independently equals the complete ID set with no duplicates.

## Migration Plan

No persisted-data migration is required. Deploy the optional variant field, localization, renderer precedence, data, and tests together. Rollback removes variant-level groups and restores the existing age-level-only behavior.
