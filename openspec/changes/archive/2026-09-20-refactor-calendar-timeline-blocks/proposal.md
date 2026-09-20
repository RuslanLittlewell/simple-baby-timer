## Why

The calendar timeline currently combines completed-block rendering, live-block rendering, layout calculations, and styles in one `timeline-blocks.tsx` file. Splitting these responsibilities into a feature-local component folder will make the timeline easier to navigate, test, and extend without changing its behavior.

## What Changes

- Replace the single `components/timeline-blocks.tsx` module with a `components/timeline-blocks/` folder.
- Separate completed timeline blocks and live timeline blocks into focused component files.
- Move reusable timeline calculations and presentation helpers into a dedicated helper module.
- Move React Native styles into a dedicated styles module.
- Preserve the existing public imports for `TimelineBlocks`, `LiveBlocks`, and `LiveBlock` through a folder entry point.
- Preserve all calendar rendering, accessibility, interaction, layering, sizing, icons, breast-side markers, labels, gradients, and time behavior.

## Capabilities

### New Capabilities

None. This is an internal refactor with no new behavior.

### Modified Capabilities

None. Existing calendar requirements remain unchanged, so this change opts out of delta specs.

## Impact

- `src/features/calendar/components/timeline-blocks.tsx` will be replaced by a folder with an index entry point, focused components, helpers, types, and styles.
- Calendar screen imports remain compatible.
- Calendar presentation tests that inspect source paths or module structure will be updated to follow the new folder layout.
- No stored data, API, dependency, or synchronization changes are required.
