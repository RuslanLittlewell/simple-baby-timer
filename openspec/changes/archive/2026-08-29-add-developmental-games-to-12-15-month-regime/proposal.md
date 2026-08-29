## Why

The 12–15 month regime is the first age band after the developmental-game rollout stopped. Children in this band walk, scribble, and start pretend play, so the wake blocks can carry activities that match those milestones instead of showing only a schedule note.

## What Changes

- Add eighteen developmental games for the 12–15 month regime, split into three wake-block groups of six.
- Group the activities by developmental focus: object manipulation, speech and imitation, and gross motor with sensory play.
- Add the shared 5–15 minute play recommendation for this age, matching the 10–12 month treatment.
- Translate every title, instruction, and the shared guidance into all nine supported languages.
- Keep safety wording explicit for climbing, dough, walking support, and small objects.

## Capabilities

### New Capabilities

- `twelve-to-fifteen-month-developmental-games`: Defines the game set, wake-block grouping, and translation coverage for the 12–15 month regime.

### Modified Capabilities

None.

## Impact

- Adds `developmental-games-12-15-i18n.mjs` and its type declaration.
- Extends the game id union, the game registry, and the group definitions in `developmental-games.ts`.
- Attaches the groups and guidance to `regime.6` in `data.ts`.
- Does not change any schedule timing, existing game content, or other age bands.
