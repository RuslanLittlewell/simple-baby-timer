## Why

`add-activity-modal.tsx` currently combines modal orchestration, form state initialization, time conversion, validation and submission, pro-parameter construction, multiple form sections, and all local styles in one large component. Decomposing it into a feature-local folder will make the manual activity flow easier to understand, test, and extend safely.

## What Changes

- Replace the single `components/add-activity-modal.tsx` module with a `components/add-activity-modal/` folder.
- Preserve the existing `AddActivityModal` public export through a folder entry point.
- Separate modal presentation into focused header, activity selector, time fields, pro-parameter fields, and save-action components.
- Extract deterministic time/default-value, bottle-volume, pro-details, and validation/submission calculations into helper modules where practical.
- Move shared props and form value types into a dedicated types module.
- Move local React Native styles into a dedicated styles module.
- Replace complex inline JSX expressions with named values or helpers.
- Preserve all current modal behavior, translations, keyboard handling, wheel sheets, pro gating, validation, saved payloads, and visual styles.

## Capabilities

### New Capabilities

None. This is an internal refactor with no new user-facing behavior.

### Modified Capabilities

None. Existing activity creation requirements remain unchanged, so this change opts out of delta specs.

## Impact

- `src/features/calendar/components/add-activity-modal.tsx` will be replaced by a component folder with an index entry point, focused components, helpers, types, and styles.
- `calendar-screen.tsx` keeps its existing extensionless import path.
- Focused tests will cover extracted pure form helpers and structural ownership.
- No stored-data, synchronization, API, dependency, or translation changes are required.
