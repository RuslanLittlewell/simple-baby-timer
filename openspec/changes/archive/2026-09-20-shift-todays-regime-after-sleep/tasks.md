## 1. Adjustment Model

- [x] 1.1 Add pure helpers for local-day adjustment keys, cumulative anchor offsets, effective sleep-window matching, and bounded adjusted ghost segments
- [x] 1.2 Persist validated per-child current-day adjustment anchors without changing the learned personal regime
- [x] 1.3 Add unit coverage for early, late, successive, unmatched, clipping, persistence-validation, and next-day behavior

## 2. Sleep Completion Integration

- [x] 2.1 Record an adjustment after a local running sleep is durably finalized
- [x] 2.2 Record the same adjustment for explicit shared remote-sleep completion paths without affecting manual history entry
- [x] 2.3 Add focused wiring tests for local and shared running-sleep completion

## 3. Calendar And Reminders

- [x] 3.1 Render adjusted ghost segments only when Calendar is showing the adjustment's child and local day
- [x] 3.2 Plan and reconcile today's reminders from adjusted settling times while keeping tomorrow on the learned regime
- [x] 3.3 Add Calendar and reminder regression tests for shifted and unshifted days

## 4. Verification

- [x] 4.1 Run focused regime tests, the full test suite, type checking, lint, strict OpenSpec validation, and diff checks
