## Why

The 18–24 month band is the last age regime without developmental games. Children here run, jump, speak in short phrases, sort by a rule, and insist on doing things themselves, so their wake blocks can carry activities matching those milestones instead of showing only a schedule note. Completing this band also closes the rollout: every timed regime then offers games.

## What Changes

- Add eighteen developmental games for the 18–24 month regime, split into three wake-block groups of six.
- Group the activities by developmental focus: object play with sorting and pre-writing, speech with pretend play and self-care, and gross motor with sensory play.
- Add the shared play recommendation for this age, extended with how to handle the "no" and "me myself" stage.
- Translate every title, instruction, and the shared guidance into all nine supported languages.
- Keep safety wording explicit for stairs, running water, jumping, dough, and sticker backing sheets.

## Capabilities

### New Capabilities

- `eighteen-to-twenty-four-month-developmental-games`: Defines the game set, wake-block grouping, and translation coverage for the 18–24 month regime.

### Modified Capabilities

None.

## Impact

- Adds `developmental-games-18-24-i18n.mjs` and its type declaration.
- Extends the game id union, the aggregated registry, and the group definitions in `developmental-games.ts`.
- Attaches the groups and guidance to `regime.8` in `data.ts`.
- Leaves `regime.0` as the only band without games, which the regime-coverage test now pins.
- Does not change any schedule timing, existing game content, or other age bands.
