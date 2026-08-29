## 1. Shared Guidance Support

- [x] 1.1 Extend regime age, generated step, and localization types with an optional developmental-game guidance field
- [x] 1.2 Propagate the localized age-level guidance into generated wake steps without affecting other step kinds or ages
- [x] 1.3 Render the shared guidance after the developmental-game list in the scrollable regime detail modal

## 2. Age-Specific Game Data and Distribution

- [x] 2.1 Add eighteen distinct 10–12 month developmental-game IDs and structured title/instruction keys
- [x] 2.2 Add a deterministic `6 / 6 / 6` grouping that covers all eighteen games exactly once in supplied order
- [x] 2.3 Attach the grouping and shared guidance key to the 10–12 month regime without modifying its schedule steps or timings

## 3. Complete Localization

- [x] 3.1 Add Russian and English titles, full instructions, and shared guidance for all supplied content
- [x] 3.2 Add Ukrainian, Polish, Spanish, French, German, Portuguese, and Italian titles, full instructions, and shared guidance
- [x] 3.3 Review every translation for realistic developmental expectations and the supplied stability, movement-support, obstacle, demonstration, and water-supervision constraints

## 4. Verification

- [x] 4.1 Add tests for exact `6 / 6 / 6` group sizes, complete unique coverage, supplied order, deterministic assignment, and cyclic overflow
- [x] 4.2 Add tests for localization completeness, shared-guidance presentation, representative safety meaning, regime isolation, and unchanged 10–12 month timings
- [x] 4.3 Run focused tests, TypeScript validation, lint, and strict OpenSpec validation
