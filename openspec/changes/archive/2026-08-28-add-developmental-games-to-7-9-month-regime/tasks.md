## 1. Variant-Level Game Support

- [x] 1.1 Extend regime variants and localization with optional variant-level developmental-game groups while retaining age-level compatibility
- [x] 1.2 Update timeline wiring to prefer groups from the selected variant and fall back to the regime’s age-level groups

## 2. Age-Specific Game Data and Distribution

- [x] 2.1 Add seventeen distinct 7–9 month developmental-game IDs and structured title/instruction keys
- [x] 2.2 Add the two-nap `6 / 6 / 5` distribution covering all seventeen games exactly once
- [x] 2.3 Add the three-nap `5 / 4 / 4 / 4` distribution covering all seventeen games exactly once
- [x] 2.4 Attach the corresponding distribution to each 7–9 month variant without modifying schedule steps or timings

## 3. Complete Localization

- [x] 3.1 Add Russian and English titles and full instructions for all seventeen games
- [x] 3.2 Add Ukrainian, Polish, Spanish, French, German, Portuguese, and Italian titles and full instructions for all seventeen games
- [x] 3.3 Verify every translation retains object-size, prohibited-small-item, supervision, tunnel-stability, edge, face, and uninterrupted-water-contact guidance

## 4. Verification

- [x] 4.1 Add tests for exact `6 / 6 / 5` and `5 / 4 / 4 / 4` group sizes, complete unique coverage, deterministic order, and cyclic overflow
- [x] 4.2 Add tests for selected-variant precedence, age-level fallback compatibility, regime isolation, and unchanged timing of both 7–9 month variants
- [x] 4.3 Add localization completeness and representative safety-content tests for all seventeen games in all nine languages
- [x] 4.4 Run focused tests, TypeScript validation, lint, and strict OpenSpec validation
