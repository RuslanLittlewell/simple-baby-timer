## Context

See proposal.md — Why. The screen is one component, `paywall-modal.tsx`, with two pricing paths that must now agree:

- Real packages from RevenueCat, rendered through `priceFor` and `savingFor`. `priceFor` is where the rejection lives: for anything longer than a month it returns only `price / months`, and `pack.product.priceString` — the string Apple gives for the actual charge — is never rendered.
- `PREVIEW_PLANS`, a display-only list carrying `pricePerMonth` and nothing else, shown when the store returns nothing.

Both feed one `OptionRow`, which lays out radio, duration, a single `price` node, and an optional saving badge in one line.

On the trial side everything below the UI already exists: `startTrial` in the store calls the `start_trial` RPC, which grants once per account and refuses a second call; `fetchAccountProStatus` derives `trialUsed` from `trial_ends_at` and account sync writes it into the store. Only a caller is missing.

## Goals / Non-Goals

**Goals:**

- One row layout serving both the real and the preview path, so what App Review sees in production is what the preview shows.
- Make the billed amount structurally primary, not merely styled larger — the layout should make it hard to reintroduce the violation.
- Reach the existing trial with no new server work.

**Non-Goals:**

- Changing the text of the terms or renewal wording, which the caregiver chose to leave alone; when it applies is a separate matter, decided below.
- Touching `purchases.ts`, `startTrial`, or the RPC.
- Adding eligibility checking for Apple introductory offers — a real gap (the screen can promise a store trial to someone Apple would not grant one), but a separate concern from this rejection.
- Redesigning the paywall beyond the pricing block and the new control.

## Decisions

**`OptionRow` takes a billed amount and a subordinate node, not one `price`.** Splitting the prop into `billed` and `secondary` puts the requirement in the component's shape: a caller cannot render a per-month figure without passing it through the subordinate slot. The row becomes two lines — duration and billed amount on the first, trial wording, per-month figure and saving on the second. The alternative, keeping one `price` node and trusting each caller to compose it correctly, is exactly the arrangement that produced the rejection.

**The billed amount gets its own type style rather than an existing `ThemedText` type.** `smallBold` is the same size as the surrounding row text, so nothing in the current palette reads as "primary price". A local style around 18pt/700 against `small` (13pt) plus `textSecondary` for everything subordinate gives the size, weight, and colour separation the guidance names. The duration label stays `smallBold`, so the billed amount is the largest thing in the row.

**The preview list keeps its per-month numbers and gains `months`.** The totals are then computed, so 5.99 / 4.99 / 3.99 stay the single source and 5.99 / 14.97 / 47.88 follow from them and cannot drift. `savingFor`'s preview equivalent keeps comparing per-month figures, which is what the badge means.

**The trial is a row in the plan list, not a control beside it.** It is appended after the paid plans, uses the same `OptionRow`, and puts zero in the `billed` slot with no subordinate line. Selection therefore works the way the paid plans already work, and the main button reads the selection instead of owning a second path. The alternative — a link under the button — was the earlier shape here; it kept the purchase visually primary but made the trial easy to miss, which is the thing this screen most needs to communicate.

**A sentinel identifier marks the trial selection.** `picked` already holds a package identifier string, so the trial takes a reserved value that can never collide with a RevenueCat identifier. `selected` resolves to `null` while it is set, which is what tells the button, the terms line and the purchase path that no package is chosen. Carrying a separate boolean beside `picked` would let both be true at once.

**Zero is rendered in the currency of the plans beside it.** With no store product behind the row there is no `priceString` to take a symbol from, so it borrows the symbol from the first available package, falling back to the dollar sign the preview plans already use. A bare `0` next to `$47.88` would read as a different kind of number rather than a price.

**The auto-renewal line disappears with the trial selected rather than gaining new wording.** The existing terms describe a subscription that renews and charges; the trial does neither, so showing them would be the same category of misstatement the rejection was about. Hiding the line needs no new strings, and the caregiver chose to leave the wording itself alone.

**The trial row is withheld whenever any offered plan carries store free days**, not just the selected one. The earlier rule keyed on the selection, which made the row appear and vanish as the caregiver moved between plans; as a list entry it has to be stable while the list is on screen.

**Failure is reported, not swallowed.** The RPC refusing a second trial and a dead network are indistinguishable to the client, and both mean the same thing to the caregiver: it did not start. One message covers both; the paywall stays open.

**The preview plans are deleted rather than kept for development.** They existed so App Store Connect could be given a screenshot before products could be fetched; with the store now serving real products that reason is gone, and a fallback that invents `$5.99 / $14.97 / $47.88` is a liability on a screen that was already rejected once over pricing clarity. An empty list is now an error state in every build, which also makes the diagnosis unambiguous: placeholder prices can no longer disguise a missing API key.

**One state flag per kind of failure.** A single `failed` boolean served loading, buying and restoring, so a failed purchase displayed "could not load plans". Splitting it into `loadFailed`, `purchaseFailed` and `trialFailed` lets each message name what actually happened, at the cost of two more translation keys in nine languages. Restore shares the purchase wording: it is a purchase-side failure, and a third key for it would say almost the same thing.

**The trial is rendered outside the plan list's own condition.** It is granted by the account, not the store, so a store that returns nothing should not take it away — the screen then shows the explanation and the trial together rather than a dead end.

## Risks / Trade-offs

- **A zero-priced row on the screen App Review just rejected for pricing clarity** — the rejection was about which pricing element reads first, and this adds another one. A reviewer could read a "$0" plan sitting among auto-renewable subscriptions as a fresh source of confusion, especially as the trial is not a subscription and does not renew. → It sits last, carries no per-month figure or saving, drops the renewal wording that would misdescribe it, and never appears beside a plan that already offers store free days. This is the shape the caregiver asked for after the rejection; if a second rejection cites it, the link-under-the-button arrangement is the fallback.
- **The row can be mistaken for a free plan rather than a trial** — a list of durations with a zero at the bottom invites that reading. → Its label names it as a trial rather than a price tier, which is the whole job of the new translation key.
- **Two-line rows make the plan list taller** — and the trial adds a fourth row inside a modal that also carries a title, subtitle, CTA, terms, restore and legal links. → Check the smallest supported height with all three plans plus the trial row.
- **No fallback list means a misconfigured build shows only an error** — a missing API key or a broken offering now yields an error message where plans used to appear. → That is the point: the previous behaviour hid exactly these misconfigurations behind believable placeholder prices, and the message distinguishes "unavailable on this device" from "could not load".
- **`trialUsed` is only as fresh as the last account sync** — a trial used on another device may not be known yet, so the control can appear when it should not. → The server refuses the second call, so the worst case is the failure message rather than a second trial.
- **The rejection is about prominence, which is a judgement call** — a reviewer could still consider the per-month figure too visible. → Keeping the subordinate line to secondary colour and the smallest type in the row, and never repeating the per-month figure anywhere more prominent, leaves little room for the reading that was rejected.
