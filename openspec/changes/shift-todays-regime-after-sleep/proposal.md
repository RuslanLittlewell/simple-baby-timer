## Why

The personal regime currently stays fixed for the whole day even when a sleep ends earlier or later than suggested. That makes every later suggestion and reminder stale precisely when the parent needs the plan to respond to the child's actual wake-up time.

## What Changes

- Re-anchor the remaining suggestions for the current local day whenever a running sleep is completed.
- Shift only suggestions after the matched completed sleep by the difference between its suggested and actual wake-up time.
- Preserve earlier suggestions and keep the learned personal regime unchanged for future days.
- Apply successive sleep completions cumulatively so each later wake-up can correct the remaining day again.
- Reconcile settling reminders with the adjusted current-day suggestions.

## Capabilities

### New Capabilities

- `current-day-regime-adaptation`: Adjusts the remainder of today's suggested regime and reminders from actual completed sleep wake-up times.

### Modified Capabilities

None.

## Impact

- Personal-regime calculation helpers and persisted state gain current-day adjustment data.
- Local and shared live-sleep completion paths record a wake-up adjustment.
- Calendar ghost blocks consume the adjusted current-day plan while other days keep the base regime.
- Regime reminder planning uses today's adjustment and continues to use the base regime for tomorrow.
- Focused tests cover early, late, successive, unmatched, and day-boundary behavior.
