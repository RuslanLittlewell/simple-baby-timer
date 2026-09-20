## Why

The 12–15 month band now carries developmental games, leaving 15–18 months as the next gap. Children in this band walk confidently, use a spoon, say first phrases, and start sorting, so their wake blocks can carry activities matching those milestones instead of showing only a schedule note.

## What Changes

- Add eighteen developmental games for the 15–18 month regime, split into three wake-block groups of six.
- Group the activities by developmental focus: object play and early sorting, speech with everyday self-care, and gross motor with sensory play.
- Add the shared play recommendation for this age, extended with the reminder that refusing an activity is normal and a choice of two beats insisting.
- Translate every title, instruction, and the shared guidance into all nine supported languages.
- Keep safety wording explicit for stairs, water, threading beads, and pegs.

## Capabilities

### New Capabilities

- `fifteen-to-eighteen-month-developmental-games`: Defines the game set, wake-block grouping, and translation coverage for the 15–18 month regime.

### Modified Capabilities

None.

## Impact

- Adds `developmental-games-15-18-i18n.mjs` and its type declaration.
- Extends the game id union, the aggregated registry, and the group definitions in `developmental-games.ts`.
- Attaches the groups and guidance to `regime.7` in `data.ts`.
- Does not change any schedule timing, existing game content, or other age bands.
