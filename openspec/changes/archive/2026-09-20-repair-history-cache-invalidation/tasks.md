## 1. Identity-Scoped Download Records

- [x] 1.1 Change the loaded-week record to carry the local child id it was written for, and make lookups for a different local child id report nothing downloaded
- [x] 1.2 Make a successful download replace a foreign identity's record wholesale instead of merging week keys into it
- [x] 1.3 Move the loaded-week storage prefix to `v2` and retire the `v1` prefix through the same legacy-prefix cleanup as the other superseded keys

## 2. Marking Policy

- [x] 2.1 Record a week as downloaded only when the download applied at least one row
- [x] 2.2 Add a bounded freshness stamp for downloads that applied nothing, with its own storage prefix and TTL, and consult it before requesting a range again
- [x] 2.3 Pass the active child's local identity through every week and range load path so records and lookups agree

## 3. Clearing Order

- [x] 3.1 Reorder `clearAccountData` to clear sync state before deleting activity rows and before applying the state update
- [x] 3.2 Keep row deletion best-effort so a failure after the records were cleared cannot abort the clear or leave a suppressing record

## 4. Regression Verification

- [x] 4.1 Add tests for an empty download not being recorded, and for the freshness window suppressing then releasing the repeat request
- [x] 4.2 Add tests for a regenerated local child id ignoring the previous identity's record, and for an unscoped legacy record being treated as not downloaded
- [x] 4.3 Add a test that an interrupted account clear leaves no record claiming deleted rows
- [x] 4.4 Add a test that an already-downloaded non-empty week is still served locally without a new request
- [x] 4.5 Run the history and sync tests, the full test suite, type checking, and strict OpenSpec validation
