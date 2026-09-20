## 1. Platform and Data Foundations

- [x] 1.1 Read the exact Expo SDK 57 documentation relevant to Modal, TextInput, date input integration, and supported React Native behavior before changing application code.
- [x] 1.2 Implement date-only conversion, locale-aware decimal parsing/formatting, measurement validation, deterministic sorting, and latest-measurement helpers with unit tests.
- [x] 1.3 Implement sanitized per-child local measurement persistence, stable row IDs, add/edit/merge operations, and child-data cleanup with unit tests.

## 2. Cloud Schema and Synchronization

- [x] 2.1 Add a timestamped Supabase migration for `child_measurements`, its index and updated-at trigger, authenticated grants, and child-member RLS policies; mirror the final schema in `supabase/schema.sql`.
- [x] 2.2 Implement measurement fetch, upsert queueing, retry/flush, remote timestamp merge, and missing-table compatibility in the sync layer.
- [x] 2.3 Connect measurement upload/download to child creation, remote-ID assignment, shared-child loading, account cleanup, and child removal, with focused synchronization tests.

## 3. Child Creation

- [x] 3.1 Extend the add-child modal with required localized height and weight inputs, decimal input normalization, validation, and accessible labels.
- [x] 3.2 Update onboarding and child-selection save flows plus app-state actions to create the birthday-dated initial measurement without changing profile-edit behavior.

## 4. Growth History Interface

- [x] 4.1 Add a reusable growth summary under the activity-screen profile chip that displays the latest localized height/weight or the add-first-measurement empty state.
- [x] 4.2 Build the growth-history modal with dated rows, empty state, add action, and row selection for editing.
- [x] 4.3 Build the shared add/edit measurement form with a birthday-to-today date picker, height/weight validation, localized display, keyboard handling, save/cancel actions, and accessibility labels.
- [x] 4.4 Wire optimistic local add/edit updates and background synchronization into the activity screen so the summary and list refresh immediately.
- [x] 4.5 Present weight before height in the profile summary, history rows, measurement editor, and child-creation form, including matching accessibility text and tests.
- [x] 4.6 Display history oldest-to-newest with the latest row at the bottom, constrain the modal height, scroll to the bottom when it opens, and align each edit icon to the far right.
- [x] 4.7 Size the history viewport for exactly four complete rows and make additional rows scroll within that viewport.
- [x] 4.8 Remove decorative weight and height icons from the growth summary below the child profile chip while preserving its text and interaction.
- [x] 4.9 Keep the child profile chip and Premium/menu control on the same top row while left-aligning the growth summary directly below the child chip.

## 5. Localization and Verification

- [x] 5.1 Add every growth-history string and accessibility label to all supported app languages.
- [x] 5.2 Add focused presentation tests covering field requirements, modal entry points, latest-value rendering, row ordering, edit behavior, and localization key parity.
- [x] 5.3 Run the focused test suite, full project tests, lint, TypeScript checking, and strict OpenSpec validation; fix all regressions.
