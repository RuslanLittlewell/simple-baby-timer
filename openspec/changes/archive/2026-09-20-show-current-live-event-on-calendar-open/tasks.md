## 1. Calendar Focus Behavior

- [x] 1.1 Add a pure, bounded timeline focus-target helper for today's current-time coordinate
- [x] 1.2 Observe Calendar tab focus and reset the day timeline state to today without affecting navigation while the tab remains active
- [x] 1.3 Fulfill each focus request once after the current-day timeline layout is ready, preserving the existing zoom and pinch scroll behavior

## 2. Regression Verification

- [x] 2.1 Add focused tests for ordinary current-time positioning, midnight bounds, and active-event focus wiring
- [x] 2.2 Run focused Calendar tests, the full test suite, type checking, lint, strict OpenSpec validation, and diff checks
