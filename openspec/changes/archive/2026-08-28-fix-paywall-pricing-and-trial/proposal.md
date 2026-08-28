## Why

App Review rejected the subscription purchase flow: the calculated monthly price is shown more conspicuously than the amount actually billed. In the paywall's plan rows this is worse than a prominence problem — for any multi-month package the billed amount is not shown at all. `priceFor` divides the package price by its number of months and renders only that figure, so the yearly row reads "1 год · $3.99/мес" and the $47.88 that leaves the card appears nowhere on the screen.

Separately, the account trial is fully built but unreachable: `startTrial` calls a Supabase RPC that grants a one-off 14-day trial and the server refuses a second call, `trialUsed` already flows back through account sync, and yet nothing in the app ever calls it. The only trace of it in the UI is a translated button label.

## What Changes

- Every plan row leads with the amount that will be billed, in the largest and heaviest type in the row.
- The calculated per-month figure, the saving badge, and any free-trial label move to a subordinate line: smaller type, secondary colour, below the billed amount.
- The display-only preview plans are removed. A paywall that cannot load plans now says so instead of standing in for the store with prices of its own.
- Failing to load plans, failing to buy, and failing to start the trial are told apart and worded separately; cancelling the store's sheet stays silent.
- The account's own 14-day trial becomes the last option in the plan list, priced at zero, started through the existing `startTrial` action.
- The main button follows the selection: it starts the trial while that option is chosen, and buys the plan otherwise.
- The trial option is listed only while the account has not used it, and never alongside a store plan that already carries an Apple free trial, so the list never makes two competing free offers.
- The auto-renewal wording is hidden while the trial option is selected, since the trial neither renews nor charges. The wording itself is unchanged.

## Capabilities

### New Capabilities

- `paywall-price-prominence`: How the paywall ranks its pricing elements, so the billed amount is what a reader sees first.
- `paywall-trial-activation`: Reaching the account's one-off trial from the paywall, and what the screen does once it is used.
- `paywall-failure-states`: What the paywall shows when plans will not load, a purchase does not complete, or the trial will not start.

### Modified Capabilities

None. `openspec/specs/` describes `manual-entry-day-selection` and `calendar-day-header-navigation`, neither of which touches purchasing.

## Impact

- `src/features/onboarding/components/paywall-modal.tsx`: row layout, preview plan data, and the new trial control.
- No changes to `src/lib/purchases.ts`, to `startTrial` in `src/state/app-state.ts`, or to the Supabase RPC behind it — the trial path already exists and is only being connected.
- `src/i18n/index.ts`: three new keys across all nine languages — the trial option's name in the plan list, plus separate wording for a failed purchase and a failed trial start. Everything else reuses `paywall.perMonth`, `paywall.freeDays`, `paywall.startTrial` and `paywall.error`.
- No changes to what is stored, synced, or purchased.

## Assumptions

- The trial option needs a signed-in account, since the RPC requires a session; without one, or without Supabase configured, it is not listed.
- Its label carries no day count. The length lives on the server, and the client only learns it from the RPC's answer, so a hardcoded "14" in nine languages could drift out of step with it.
