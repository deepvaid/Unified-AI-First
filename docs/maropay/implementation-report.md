# Maropay prototype — implementation report

The closing report the plan asks for (§6.8): how to review it, what was run and what happened, and
what production still needs. Written 24 September 2026; on this branch the eight slices are
squashed into one commit. Decisions, defaults and the full list of launch
dependencies are in [`decisions.md`](decisions.md). The product brief is an internal plan that
isn't published in this repository.

> **5 October 2026:** the Checkout preview page is retired. Rows below that mention it now run through
> the store's own storefront checkout (Store › Payments › "See it in your store", or Maropay › "View
> your store"), which takes the same sample payments. See F1–F4 in [`decisions.md`](decisions.md).

> **10 October 2026:** the Claude Design UI pass (decisions H1–H5): the store's Payments page is a compact Maropay
> card over one draggable checkout lineup; the overview leads with the money panel; the setup page is a timeline; the
> wizard's header is the step; the storefront's done state is a receipt with the card actually typed. Row M18's
> storefront still shows the not-live placeholder until the shopper pages move onto the merged offer (CI-2).

## Review entry point

1. `npm install`, then `npm run dev`.
2. Open **`/accounts/2000290/maropay`** (Scooter Village, which has every cloud). With no saved
   state this shows the discovery page.
3. Load a scenario with **`?maropay=m01` … `m15`** on any Maropay URL, for example
   `/accounts/2000290/maropay?maropay=m09`. The parameter is removed once it's applied, so a
   refresh keeps the reviewer's progress.
4. The reviewer controls are in the user menu under **Maropay demo state**. They switch the
   scenario, reset Maropay state for the account, preview another role (owner, finance, store
   operations) and make the next request time out. Pages that need a decision from the payments
   partner or the bank show a card marked "Demo controls — not part of the product".

Maropay can be reached from:
- the **Maropay** sidebar group;
- **Stores** in Maropay's own rail, which open a store's payments inside Maropay
  (`/accounts/2000290/maropay/stores/retest-sales-notification`);
- the store editor, under **Selling › Payments** — the store's Payments page: the compact Maropay card on top, then the **Checkout lineup** (every provider in shopper order; drag a row, or Move up / Move down in its menu), then the capture and checkout-options tiles; Maropay's own page for the store is one level down (`payments/maropay`, with "Open in Maropay");
- **View in Maropay** on an order's Payment card;
- **Settings › Payment account**;
- the **Set up payments** task on Get started;
- notifications, which link to the fix.

An account without Commerce Cloud (for example 2000292) lands on the Commerce Cloud page instead.

## What was built

| Slice | Surfaces |
|---|---|
| 1 | Domain model, money, readiness rules, scenarios M01–M15, mock adapter, Pinia store, the Commerce seam |
| U1 | Sidebar group, rail workspace, overview (discovery and live), reviewer controls, Settings signpost |
| U2 | Setup wizard: resume, "Provide information" requests, submitted outcome |
| U3 | Store Payments: activation checklist, methods, migration comparison, stopping |
| U4 | Checkout preview (five outcomes), Transactions, payment detail, order integration |
| U5 | Payouts and payout detail, disputes and dispute detail, bank change with step-up |
| U6 | Settings (business, payout account, methods, stores, permissions, stop or close), notification links |
| U7 | List error states, accessibility and responsive fixes, full scenario sweep, docs |

## Commands and results

Final run on 24 September 2026, after the last edit:

| Command | Result |
|---|---|
| `npm run type-check` | Pass |
| `npm run test:maropay` | 90 of 90 pass (`node:test`, `tests/maropay/`) |
| `npm run build` | Pass. The chunk-size warning is pre-existing |
| `npm run build-storybook` | Pass. Every `Product/Maropay/*` story builds |
| `npm run contrast:check` | 244 of 244 enforced pairs pass. No colour tokens changed |
| `npm run test:trial-lab` | Not run: this branch is based on `master`, which has no trial-lab tests. The plan's reference is to uncommitted work in another checkout |

The tests cover:
- money in 0-, 2- and 3-decimal currencies;
- every overview headline and its priority;
- each activation checklist item failing on its own;
- refund limits, idempotency and timeouts;
- event ordering, including duplicate and late events;
- account and store isolation;
- the permission matrix;
- routing refunds to the original provider;
- the setup rules;
- payout reconciliation, where lines add up to the payout;
- disputes, settings changes and account closure.

## Browser validation

Checked in the in-app browser against the Vite dev server after the final edits.

| Scenario | What was exercised | Result |
|---|---|---|
| M01 New merchant | Discovery → six-step setup, with synthetic bank details (only the last four digits reach state) → "Ready to activate" → test checkout, review, activate → checkout preview (a double-clicked Pay creates one payment) → payment detail → payout ($425.23 − $12.63 fees = $412.60, *In transit*) | Pass |
| M02 Setup abandoned | Resumes at step 3 with values after a full reload; an edit made on the step survives a reload | Pass |
| M03 Action required | "Provide information by…" → the task opens its step → upload → *Under review* → approve → ready | Pass |
| M04 Unsupported or rejected | "Maropay isn't available…" with no activation action on overview, store page or checkout preview; support path offered; PayPal keeps working | Pass |
| M05 Existing processor merchant | Verified details reused; the earlier provider's history shown with no fees and kept out of balances; manual capture kept | Pass |
| M06 Different provider | Method-by-method fee comparison; a partial refund on an old PayPal order goes through PayPal and doesn't touch the balance; activation says what stays with PayPal | Pass |
| M07 Two stores | Second store activated; its checkout payment appears; the store filter narrows tabs, count and totals (1 record, $319.81) | Pass |
| M08 Payouts paused | "Payments are active. Payouts need attention"; checkout still takes payments; confirming the bank resumes payouts | Pass |
| M09 Failed payout | Reason and returned funds shown → bank drawer → verification code typed → account changed (full number never stored) → retry creates one payout | Pass |
| M10 Partial refund | Over-limit refused with the remaining amount; $25 updates payment, order, fulfilment row and balance | Pass |
| M11 Dispute | Deadline in words → evidence → submit (confirmed as final) → under review → won; the fee isn't returned | Pass |
| M12 Permissions | Store staff get a banner and see only their store's payments; payouts, setup, bank, stop and close are locked; another store is denied | Pass |
| M13 Delayed payment | Stays processing across navigation; one confirmation captures it; a duplicate is ignored; still one payment and one capture | Pass |
| M14 Deactivation | Stopping routes new checkouts to PayPal; the checkout preview refuses; all payments, payouts and history stay | Pass |
| M15 Method pending | The store activates on cards while Klarna waits; Klarna is absent from checkout until approved | Pass |
| M16 Information needed later | A later-dated EIN request with a deadline; payments and payouts keep running until it | Pass |
| M17 Deadline passed | Payouts paused at the deadline, Maropay payments a week later; the merchant's own PayPal and bank deposit keep working | Pass |
| M18 Australian store on eWay, Afterpay and Zip | An AUD account ready to activate beside eWay, Afterpay, Zip, bank deposit and cash on delivery; the Activate dialog offers Maropay for cards or eWay keeping them; each provider row shows the illustrative platform fee | Pass |

Also checked:
- **Deep links and reload** on every Maropay route, in a fresh tab. No console errors.
- **Exports.** Both Transactions and Payouts CSVs were captured in the page without saving a file. The rows reconcile (amount − fee = net).
- **States.** Each list has empty, loading (skeleton), error (arm "Next request times out", then **Try again**), restricted and not-found states. Detail pages have not-found and no-access branches.
- **Keyboard and focus.** Dialogs and drawers take focus when they open and return it to the opener when they close. A follow-up dialog keeps focus. Wizard step changes focus the step heading.
- **Accessibility.** Every Maropay page's content scans clean with axe-core 4.12 in the light theme, and colour contrast is clean in dark. See "Outside Maropay" below for pre-existing findings in shared components.
- **Mobile at 375px.** No page scrolls sideways. The one overflow found (a demo control) was fixed.
- **Dark mode.** Every Maropay page, with no contrast failures.
- **Regressions.**
  - the non-Commerce account gate;
  - a legacy (untracked) order's refund drawer;
  - the sales channel overview;
  - Settings › Payment account;
  - Get started;
  - `/templates`;
  - Sales Orders and notifications;
  - `/signup` and `/trial-lab`;
  - a non-Maropay confirm dialog (focus returns to its trigger).

## What is mocked

- **The payments partner** is `src/services/maropay/mockAdapter.ts`. It's deterministic: ids come from persisted counters and outcomes from rules plus the reviewer's switches, with no randomness.
- **Verification, method approvals, bank transfers and dispute decisions** are made through demo controls.
- **The step-up code** is `246810`, shown in the dialog.
- **Documents** keep only their name and size.
- **Notifications** are in-app and in memory; a reload clears the feed. No email, SMS or outbound call is made.
- **Rates, the launch-country list and the method catalogue** are illustrative, as labelled.

## Deviations from the plan

- **D4 cuts:**
  - The Reports page became CSV exports on Transactions and Payouts.
  - The support case view became a contextual alert carrying references.
  - Cross-tab locks and reminder schedules are documented, not built.
- **Refunds are by amount, not by item.** §6.4 lists item and amount selection. The seeded Commerce orders' line items don't add up to their totals — one sample is a $1,180 order holding a single $12 item — so amounts suggested from items would mislead reviewers. Refunding by line and quantity is left to production.
- **Reserved funds** aren't modelled: no fixture holds a reserve. Balances show available, pending and in transit.
- **Some business changes go through support.** Registration country, registered address and representative changes need new documents, so the page says to contact support. Legal name, trading name, registration number and website go through **Request a change**.

## Known limitations

See [`decisions.md`](decisions.md#known-limitations-prototype). In short:
- Commerce re-seeds on every load, so timeline lines added in an earlier session aren't restored (the payment timeline is the durable record).
- Orders have no account id.
- Every fixture is in USD.
- The notification feed isn't persisted.

## Production gaps

Listed in full under [Production launch dependencies](decisions.md#production-launch-dependencies-not-built):
- processor choice and account model;
- signed commercial terms;
- the approved country list;
- server-side authorisation, webhooks, idempotency and reconciliation;
- cross-tab consistency, reminders and outbound notices;
- support tooling;
- the "MaroPay" / "Maropay" naming decision.

## Outside Maropay

Found while validating and raised as separate follow-up tasks rather than fixed here, because they
live in shared components (details in `DESIGN_AUDIT.md`, "Maropay changelog"):
- **Nested landmarks:** the Settings, Retail and store-editor shells nest a second `<main>`.
- **Wizard steps:** `MpWizardSteps` hides its buttons' role.
- **Overlay shells:** `MpFormDrawer` puts `role="dialog"` on a `<nav>`, and `MpDialog`'s header counts as a second banner.
- **Alert icons:** `MpAlert`'s default tone icons never render.
- **Rail on phones:** `MpSectionRail` doesn't collapse at phone width.
