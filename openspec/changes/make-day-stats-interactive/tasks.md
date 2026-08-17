## 1. Metric Presentation

- [x] 1.1 Add localized statistics labels and accessibility hints for milk volume and both toggle directions in every supported language.
- [x] 1.2 Add independent local selection state and named toggle handlers for the sleep/awake and feeding-count/milk-volume card pairs.
- [x] 1.3 Build the displayed value, label, colour, accessibility label, and accessibility hint from the selected metric while continuing to consume live `DayStats` values.

## 2. Interactive Card Design

- [x] 2.1 Introduce an internal interactive statistics-card variant with button semantics while retaining the existing static presentation for diaper and poop.
- [x] 2.2 Add the inset dashed outline and compact swap indicator using the selected activity colour, preserving the four-card layout and single-line metric readability.
- [x] 2.3 Add named press-in and press-out handlers with interruptible scale-down and spring/ease-back animation, and toggle the metric exactly once through the press handler.

## 3. Verification

- [x] 3.1 Verify sleep toggles to awake and back, feeding count toggles to localized millilitres and back, and zero volume displays as `0` with the localized unit.
- [x] 3.2 Verify selected alternate metrics continue updating when `DayStats` changes and reset only when `DayStatsRow` remounts.
- [x] 3.3 Verify accessibility role, current-value announcement, alternate-metric hint, and visual press feedback on representative iOS and Android screen widths.
- [x] 3.4 Run TypeScript and available project validation checks and confirm no changes to daily-stat calculations, persistence, or non-interactive cards.
