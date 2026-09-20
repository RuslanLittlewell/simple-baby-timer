## Context

See `proposal.md` for motivation. The current component owns fourteen pieces of form state, modal-open initialization, time parsing/formatting, event duration behavior, pro-detail construction, submission validation, and every UI branch. Its only external consumer imports `AddActivityModal` through `./components/add-activity-modal`, so a folder entry point can preserve compatibility.

## Goals / Non-Goals

**Goals:**

- Keep the modal shell readable by moving form state and actions behind one feature-local hook.
- Make deterministic transformations independently testable.
- Give activity selection, time selection, pro parameters, and save presentation focused components.
- Keep shared types and styles centralized inside the component folder.
- Use named values for conditional presentation instead of complex inline expressions.

**Non-Goals:**

- Changing available activity kinds, default times, validation messages, event durations, or payloads.
- Changing modal dimensions, blur, scrolling, wheel controls, pro gating, colors, spacing, or typography.
- Introducing a form library, schema validator, new dependency, or global state.
- Reusing these internal form controls outside the add-activity modal.

## Decisions

### Preserve the public boundary with a folder entry point

Create `components/add-activity-modal/index.ts` that exports `AddActivityModal`. The implementation moves to `add-activity-modal.tsx`, allowing `calendar-screen.tsx` to retain its current extensionless import.

Deep imports from the calendar screen were rejected because they would expose internal component organization.

### Separate stateful form logic from presentation

Create `use-add-activity-form.ts` to own form state, modal-open reset behavior, derived values, setters/actions, and asynchronous submission. The top-level modal component will compose the shell and child sections from the hook result.

Keeping all state in the shell was rejected because it would leave most of the current complexity in place. Moving state into global storage was rejected because the form is transient and modal-local.

### Keep deterministic transformations in pure helpers

Create `helpers.ts` for default time values, time-to-Date conversion, positive bottle-volume parsing, pro-detail construction, and submit-range calculation/validation. Helpers accept explicit inputs and do not read hooks, translations, or theme state.

Embedding these calculations in the hook was rejected because it would make behavior harder to test without React.

### Split UI by form responsibility

Use focused internal components:

- `select-field.tsx` for the repeated label and wheel selector structure.
- `activity-field.tsx` for activity-kind options.
- `time-fields.tsx` for start/end wheel fields and day steppers.
- `pro-parameters.tsx` for sleep and feeding branches.
- `settling-methods-field.tsx` for selectable method chips.
- `save-button.tsx` for the disabled save action.

The modal shell retains `Modal`, `WheelSheetHost`, keyboard avoidance, blur, close handling, scroll composition, pro-required text, and error placement because those define the overall modal layout.

Creating one component for every individual label or input was rejected as excessive fragmentation.

### Centralize types and styles

Use `types.ts` for public props, form value/state types, section props, and option types. Use one `styles.ts` containing the existing `StyleSheet.create` values unchanged. Child components receive explicit values and callbacks rather than importing the form hook directly, keeping dependencies directional.

## Risks / Trade-offs

- [Moving form state can change reset timing when the modal opens] → Preserve the existing `[day, visible]` effect conditions and exact defaults; add helper tests for today and non-today defaults.
- [Splitting submission can alter saved timestamps or pro details] → Test event duration, invalid ranges, breast/bottle payloads, volume parsing, and non-pro exclusions as pure transformations.
- [Too many callbacks can make section props verbose] → Group related time and pro values into typed view models while keeping mutations explicit.
- [Source movement can break extensionless resolution] → Create `index.ts` before removing the old file and verify TypeScript resolution.
- [Visual drift during extraction] → Move style values verbatim and retain the same component nesting for the modal shell and form rows.

## Migration Plan

1. Add the folder entry point, shared types, helpers, hook, and styles.
2. Extract form sections and assemble them in the new modal implementation.
3. Remove the original single file once the public import resolves to the folder.
4. Add focused helper and structure tests, then run TypeScript, lint, and OpenSpec validation.

Rollback consists of restoring the original component file and test paths; no stored-data migration is involved.
