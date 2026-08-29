## 1. Age-Specific Game Data and Distribution

- [x] 1.1 Add fifteen distinct 5–6 month developmental-game IDs and structured title/instruction keys to the existing registry
- [x] 1.2 Add the deterministic four-group distribution with sizes 4, 4, 4, and 3 covering all fifteen games exactly once
- [x] 1.3 Attach the new game groups to the 5–6 month regime only, without modifying schedule steps or timings

## 2. Complete Localization

- [x] 2.1 Add Russian and English titles and full instructions for all fifteen 5–6 month games
- [x] 2.2 Add Ukrainian, Polish, Spanish, French, German, Portuguese, and Italian titles and full instructions for all fifteen games
- [x] 2.3 Verify translations retain the supplied limits on distance, face covering, sound volume, support, force, object safety, cleanliness, and mouth safety

## 3. Verification

- [x] 3.1 Add tests that the four current 5–6 month wake blocks receive groups sized 4, 4, 4, and 3 and cover all fifteen games exactly once
- [x] 3.2 Add tests for deterministic ordering, cyclic overflow, regime isolation, and unchanged 5–6 month schedule timing
- [x] 3.3 Add localization completeness tests for every new title and instruction in all nine supported languages, including representative safety-sensitive text
- [x] 3.4 Run focused tests, TypeScript validation, lint, and strict OpenSpec validation
