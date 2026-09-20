## Context

See `proposal.md` for motivation. The existing module exports `TimelineBlocks`, `LiveBlocks`, and `LiveBlock`, while also owning sorting, day-boundary clamping, height calculations, event stripe calculations, completed/live JSX, and every timeline-block style. `calendar-screen.tsx` imports the module through the extensionless `./components/timeline-blocks` path, and source-inspection tests currently target the single file.

## Goals / Non-Goals

**Goals:**

- Give the timeline-block feature one folder with a stable entry point.
- Keep rendering components focused on one block category.
- Make deterministic layout calculations independently testable.
- Centralize shared content-row rendering and styles without introducing circular imports.
- Preserve the existing external exports and runtime output.

**Non-Goals:**

- Changing block appearance, spacing, z-index, minimum heights, time thresholds, or lane placement.
- Changing calendar state, storage, synchronization, editing, accessibility labels, or translations.
- Creating a generic application-wide block component abstraction.

## Decisions

### Preserve the module boundary with a folder entry point

Create `components/timeline-blocks/index.ts` that exports `TimelineBlocks`, `LiveBlocks`, and the `LiveBlock` type. Because TypeScript resolves an extensionless folder import through `index.ts`, `calendar-screen.tsx` can keep its current import path.

Changing every consumer to deep imports was rejected because it would expose internal file organization and make later refactors harder.

### Split by rendering responsibility

Use focused modules inside the folder:

- `timeline-blocks.tsx` for ordering completed sessions and choosing event versus duration rendering.
- `event-block.tsx` for striped calendar events.
- `completed-block.tsx` for completed duration activities.
- `live-blocks.tsx` for active duration activities.
- `block-content.tsx` for the shared icon, breast-side marker, title, and optional time row.
- `types.ts` for public and shared prop/type definitions.

Keeping all JSX in one renamed file was rejected because it would only move the existing complexity without decomposing it.

### Extract deterministic calculations into helpers

Move minute-to-pixel conversion, session clamping/visibility calculations, display thresholds, and stripe-count calculation into `helpers.ts`. Helpers remain pure and accept their required values explicitly so they can be covered without rendering React Native components.

Moving hooks or color selection into helpers was rejected because helpers should not depend on React lifecycle or theme state.

### Keep one feature-local stylesheet

Move all `StyleSheet.create` declarations into `styles.ts` and import the shared `styles` object from rendering components. This preserves exact style values while removing presentation constants from component bodies.

Splitting styles into one file per small component was rejected because the styles are closely related and several are shared across completed and live blocks.

### Update structural tests to follow the new ownership

Keep behavioral helper tests and change source-inspection assertions to read the responsible component or styles module. Add coverage for extracted layout helpers so the refactor verifies parity instead of only verifying filenames.

## Risks / Trade-offs

- [Moving JSX can accidentally change ordering or conditional thresholds] → Transfer expressions unchanged and retain focused presentation tests for completed/live rows, volume text, and marker ordering.
- [Folder resolution can conflict with the old file] → Remove the old `timeline-blocks.tsx` after the folder entry point exists, leaving exactly one extensionless resolution target.
- [Over-fragmentation can make the flow harder to follow] → Limit files to clear rendering responsibilities and keep shared calculations/styles centralized.
- [Source-inspection tests can become brittle after file moves] → Point each assertion at the file that owns the behavior and add pure helper tests where possible.

## Migration Plan

1. Create the folder modules and entry point while preserving exports.
2. Update tests to target the new modules.
3. Remove the original single file.
4. Run focused calendar tests, TypeScript, lint, and strict OpenSpec validation.

Rollback consists of restoring the original module and its test paths; there is no data migration.
