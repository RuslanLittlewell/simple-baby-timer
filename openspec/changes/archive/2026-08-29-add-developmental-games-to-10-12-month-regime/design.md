## Context

See `proposal.md` for motivation. The regimes feature already models developmental games as localized title/instruction keys, assigns deterministic groups to generated wake fills, and supports age- and variant-level group selection. The 10–12 month schedule has one variant whose two naps create three wake fills, but it currently has no developmental-game groups. The supplied final paragraph is shared guidance rather than an individual game and needs structured presentation.

## Goals / Non-Goals

**Goals:**

- Extend the existing developmental-game registry and age-level grouping mechanism for the 10–12 month regime.
- Represent the shared 5–15 minute/non-testing guidance separately from individual games and make it available in each applicable wake-block modal.
- Keep localization completeness and safety meaning testable across all supported languages.

**Non-Goals:**

- Changing schedule times, wake-fill generation, or the existing 10–12 month routine.
- Adding games to other ages or changing their established distributions.
- Adding a new interaction, completion tracking, timers, or game recommendations based on user history.

## Decisions

### Use one age-level `6 / 6 / 6` distribution

The eighteen game definitions will be grouped in their supplied order into three groups of six and attached to the 10–12 month age entry. This matches its three generated wake blocks and provides exact one-time coverage. Cycling remains available through the existing assignment helper, but is not needed by the current schedule.

Repeating smaller groups was rejected because it would either omit games or duplicate them within the current three-block schedule.

### Store shared guidance separately from games

An optional localized developmental-game guidance field will be added to the regime data model and propagated to generated wake steps. The regime detail modal will render it after the individual game list. This preserves the user's paragraph as shared advice instead of misrepresenting it as a nineteenth activity or repeating it inside every instruction.

Embedding the note in each game was rejected because it would create noisy repeated content and increase translation drift.

### Follow the existing localization registry

The eighteen games will receive stable 10–12 month-prefixed IDs and title/instruction keys in the existing developmental-game localization registry. The shared guidance will receive its own localization key in all nine supported languages. Runtime localization will continue resolving structured content before presentation.

Creating a separate localization mechanism was rejected because it would duplicate fallback and completeness behavior already used by younger regimes.

### Test content contracts and schedule isolation

Focused tests will verify exact group sizes, unique coverage, deterministic assignment, all localization values, representative safety phrases, shared guidance, and unchanged 10–12 month timings. Existing younger-age game tests will remain the compatibility baseline.

## Risks / Trade-offs

- [Six suggestions make each modal longer] → Rely on the newly viewport-constrained, internally scrollable regime modal and verify the shared guidance remains reachable.
- [Translations soften a safety or expectation qualifier] → Add representative semantic checks and manually review all translated instructions during implementation.
- [The shared guidance leaks into unrelated regimes] → Keep the field optional and assert that only the 10–12 month age entry defines it.

## Migration Plan

No persisted data migration is required. Ship the new static game and localization data with the application; rollback removes the new age-level groups, shared guidance, and associated content.
