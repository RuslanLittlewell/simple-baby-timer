## 1. Content

- [x] 1.1 Define eighteen 18–24 month game ids covering sorting and pre-writing, speech with pretend play and self-care, and gross motor with sensory play
- [x] 1.2 Write titles and instructions in all nine supported languages
- [x] 1.3 Write the shared guidance covering the "no" and "me myself" stage
- [x] 1.4 Keep safety constraints explicit: stairs never accessible unattended, never alone by running water, soft landing for jumps, constant supervision for dough, sticker backing sheets out of reach

## 2. Wiring

- [x] 2.1 Extend the game id union and the aggregated registry so the new ids resolve
- [x] 2.2 Add three wake-block groups of six preserving the declared order
- [x] 2.3 Merge the new strings into `DEVELOPMENTAL_GAME_STRINGS` for every language
- [x] 2.4 Attach the groups and guidance key to `regime.8`

## 3. Verification

- [x] 3.1 Assert 6/6/6 grouping, declared order, and no duplicate ids
- [x] 3.2 Assert deterministic assignment and cycling on wake-block overflow
- [x] 3.3 Assert every language carries every title, instruction, and the shared guidance
- [x] 3.4 Update the regime-coverage test so nine attachments are expected and `regime.0` is the only band without games
- [x] 3.5 Run tests, TypeScript validation, and lint
