## 1. Module Foundation

- [x] 1.1 Create the `components/add-activity-modal/` folder and entry point while preserving the existing `AddActivityModal` export
- [x] 1.2 Move public props, form values, option types, and section contracts into a dedicated types module
- [x] 1.3 Move the existing local stylesheet into a dedicated styles module without changing visual values

## 2. Form Logic

- [x] 2.1 Extract pure default-time, input conversion, and positive bottle-volume helpers
- [x] 2.2 Extract pure pro-details and start/end timestamp construction helpers while preserving event duration and validation behavior
- [x] 2.3 Create a modal-local form hook that owns reset state, derived values, setters, errors, saving state, and submission
- [x] 2.4 Replace complex conditional expressions in rendering with named values supplied by the hook or section components

## 3. Component Decomposition

- [x] 3.1 Extract the reusable select field and activity-kind selector components
- [x] 3.2 Extract start/end time fields with their existing wheel controls and day steppers
- [x] 3.3 Extract settling methods and sleep/feeding pro-parameter sections
- [x] 3.4 Extract the save action and assemble the focused sections in the modal shell
- [x] 3.5 Remove the original single-file module after the calendar import resolves through the folder entry point

## 4. Verification

- [x] 4.1 Add pure helper tests for defaults, time conversion, event ranges, invalid ranges, volume parsing, and pro-details payloads
- [x] 4.2 Add structural tests for folder ownership, stable public exports, and preservation of modal/wheel/pro-gating presentation
- [x] 4.3 Run focused tests, TypeScript validation, lint, strict OpenSpec validation, and diff checks
