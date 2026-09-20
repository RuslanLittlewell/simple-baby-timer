## 1. Content

- [x] 1.1 Define eighteen 15–18 month game ids covering object play with early sorting, speech with self-care, and gross motor with sensory play
- [x] 1.2 Write titles and instructions in all nine supported languages
- [x] 1.3 Write the shared guidance, including that refusal is normal and a choice of two beats insisting
- [x] 1.4 Keep safety constraints explicit: stairs never accessible unattended, water never unsupervised, beads and pegs only at the table with an adult

## 2. Wiring

- [x] 2.1 Extend the game id union and the aggregated registry so the new ids resolve
- [x] 2.2 Add three wake-block groups of six preserving the declared order
- [x] 2.3 Merge the new strings into `DEVELOPMENTAL_GAME_STRINGS` for every language
- [x] 2.4 Attach the groups and guidance key to `regime.7`

## 3. Verification

- [x] 3.1 Assert 6/6/6 grouping, declared order, and no duplicate ids
- [x] 3.2 Assert deterministic assignment and cycling on wake-block overflow
- [x] 3.3 Assert every language carries every title, instruction, and the shared guidance
- [x] 3.4 Update the regime-coverage test so `regime.7` is expected to carry games and `regime.8` is not
- [x] 3.5 Run tests, TypeScript validation, and lint
