## Context

See `proposal.md` for motivation. The editor initializes values from an optional `ActivitySession`, applies different timestamp rules to day activities, normal activities, and fixed-duration events, conditionally edits or preserves pro details, writes local storage, and enqueues remote sync operations. Its only consumer imports `EntryEditor` through `./components/entry-editor`.

## Goals / Non-Goals

**Goals:**

- Keep the modal shell focused on layout and composition.
- Centralize transient editor state and derived flags in one local hook.
- Make timestamp, milk, and pro-details transformations independently testable.
- Isolate persistence/sync orchestration from form presentation.
- Split time, milk, editable/read-only pro sections, header, and save action into focused components.
- Preserve the extensionless public import.

**Non-Goals:**

- Changing which entry kinds expose date steppers or editable pro parameters.
- Changing timestamp rollover, fixed event duration, validation limits, or error messages.
- Changing delete confirmation, local persistence, sync queue semantics, translations, or styling.
- Introducing a form library, validation dependency, navigation change, or global editor state.

## Decisions

### Preserve the public boundary with a folder entry point

Create `components/entry-editor/index.ts` that exports `EntryEditor`; move the implementation into the folder. `calendar-screen.tsx` keeps its current import path.

Deep consumer imports were rejected because they would couple the screen to internal editor organization.

### Put transient form state in one local hook

Create `use-entry-editor-form.ts` to initialize form values whenever `entry` changes, expose named derived flags (`editingEvent`, `editingDay`, `editableProKind`), clear errors for time/milk changes, toggle settling methods, and coordinate save/delete actions.

Keeping independent state calls in the shell was rejected because it would preserve the current orchestration complexity. Global state was rejected because the editor is modal-local.

### Extract pure transformations from side effects

Create `helpers.ts` for:

- mapping an entry to initial form values;
- converting time input to a Date for wheel controls;
- building edited timestamps for day, overnight, and fixed-duration rules;
- validating and normalizing milk values;
- building editable pro details;
- deriving editor-kind flags.

The hook will call these helpers, then perform local persistence and sync side effects. Pure helpers receive explicit inputs and avoid React/store imports so Node tests can call them directly.

### Keep persistence and synchronization ordered in the hook

Save continues to call `updateSession`, conditionally enqueue an upsert using the child remote id, await `onChanged`, then close. Delete continues to confirm first, call `deleteSession`, conditionally enqueue a delete, await `onChanged`, then close. Remote-id lookup remains based on the current children store.

Moving sync calls into presentation components was rejected because it would mix UI and data side effects.

### Split presentation by responsibility

Use focused components:

- `editor-header.tsx` for title and delete action;
- `editable-pro-section.tsx` for settling/sleep/feeding controls;
- `readonly-pro-section.tsx` for locked pro details and required messaging;
- `editor-time-fields.tsx` for wheel fields and optional day steppers;
- `milk-field.tsx` for feeding amount input;
- `save-button.tsx` for the save action.

The modal shell retains `Modal`, `WheelSheetHost`, keyboard avoidance, blur, backdrop, card composition, error placement, and section ordering.

### Centralize contracts and styles

Use `types.ts` for public props, form values, option/value types, section theme, and callback contracts. Use one `styles.ts` with the intended existing style values. Complex inline conditionals become named booleans, colors, options, or helper results before JSX.

## Risks / Trade-offs

- [Timestamp extraction can alter overnight or date-step behavior] → Add pure tests for day activities, same-day normal entries that cross midnight, and fixed-duration events.
- [Pro gating can overwrite details for non-Pro users] → Preserve the rule `proActive ? rebuiltDetails : entry.proDetails` and test both paths.
- [Save/delete ordering can drift] → Keep orchestration in the hook and add structural assertions for persistence, enqueue, callback, and close ordering.
- [Form initialization can lose bottle fallback behavior] → Test `entry.milkMl`, bottle `volumeMl`, missing content, and every pro-detail branch.
- [Component extraction can change layout] → Move the intended style values and component hierarchy unchanged.
- [Folder and old file can conflict] → Create the folder entry point before removing the original module, then verify TypeScript resolution.

## Migration Plan

1. Add folder entry point, types, pure helpers, styles, and form hook.
2. Extract focused presentation sections and assemble the modal shell.
3. Remove the original single file after imports resolve through the folder.
4. Add helper and structural tests, then run TypeScript, lint, calendar regressions, and strict OpenSpec validation.

Rollback consists of restoring the original component and test paths; no persisted-data migration is required.
