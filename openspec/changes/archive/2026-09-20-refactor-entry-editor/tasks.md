## 1. Module Foundation

- [x] 1.1 Create the `components/entry-editor/` folder and entry point while preserving the existing `EntryEditor` export
- [x] 1.2 Move public props, editor values, pro option types, theme contracts, and section callbacks into a types module
- [x] 1.3 Move the intended editor stylesheet into a dedicated styles module without changing visual values

## 2. Pure Editor Logic

- [x] 2.1 Extract entry-to-form initialization and wheel time conversion helpers
- [x] 2.2 Extract editor-kind flags and timestamp construction for day activities, overnight entries, and fixed-duration events
- [x] 2.3 Extract milk sanitization/range validation and editable pro-details construction helpers
- [x] 2.4 Replace complex conditional expressions with named derived values or helper results

## 3. Stateful Orchestration

- [x] 3.1 Create a local editor hook that owns form reset, field updates, error state, settling toggles, and derived flags
- [x] 3.2 Move save orchestration into the hook while preserving update, conditional upsert enqueue, refresh, and close ordering
- [x] 3.3 Move delete confirmation/orchestration into the hook while preserving delete, conditional delete enqueue, refresh, and close ordering

## 4. Component Decomposition

- [x] 4.1 Extract the editor header/delete action and save button components
- [x] 4.2 Extract time fields/day steppers and the feeding milk field
- [x] 4.3 Extract editable and read-only pro-detail sections, including Pro-required fallback
- [x] 4.4 Assemble focused sections in the modal shell and remove the original single-file module

## 5. Verification

- [x] 5.1 Add pure helper tests for initialization, bottle fallback, timestamp modes, rollover, event duration, milk validation, and pro details
- [x] 5.2 Add structural tests for stable exports, component ownership, persistence/sync ordering, and Pro gating
- [x] 5.3 Run focused editor tests, calendar regressions, TypeScript, lint, strict OpenSpec validation, and diff checks
