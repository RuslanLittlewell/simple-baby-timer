## Why

`entry-editor.tsx` currently combines editor initialization, time and pro-detail state, validation, timestamp rules, local persistence, sync queue updates, delete confirmation, multiple form sections, and all local styles in one large component. Decomposing it into a feature-local folder will make entry editing safer to maintain and easier to test.

## What Changes

- Replace the single `components/entry-editor.tsx` module with a `components/entry-editor/` folder.
- Preserve the existing `EntryEditor` public export through a folder entry point.
- Move editor state initialization, derived flags, save orchestration, and delete orchestration into focused hooks/services.
- Extract deterministic time-range, overnight adjustment, milk validation, and pro-details transformations into pure helpers.
- Separate editable pro parameters, read-only pro details, time fields, milk input, header actions, and save action into focused components.
- Move shared props and form value types into a dedicated types module.
- Move local React Native styles into a dedicated styles module.
- Replace complex inline JSX expressions with named values or helpers.
- Preserve all current editing, deletion, confirmation, persistence, synchronization, pro-access gating, translations, timestamps, overnight behavior, and visual presentation.

## Capabilities

### New Capabilities

None. This is an internal refactor with no new user-facing behavior.

### Modified Capabilities

None. Existing calendar entry-editing requirements remain unchanged, so this change opts out of delta specs.

## Impact

- `src/features/calendar/components/entry-editor.tsx` will be replaced by a component folder with a stable index, focused components, helpers, hooks, types, and styles.
- `calendar-screen.tsx` retains its current extensionless import.
- Focused tests will cover extracted timestamp, milk, pro-details, and structural behavior.
- No stored-data schema, API, dependency, synchronization protocol, or translation changes are required.
