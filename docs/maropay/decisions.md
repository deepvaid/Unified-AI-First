# Maropay prototype — decisions and production gaps

Companion to the Maropay implementation plan, the internal product brief (not published in this repository). This file records what the prototype decided where the plan was silent or collided with the repository, and what stays out of scope. Updated 24 September 2026.

## Decisions made with the product owner

| # | Decision | Why |
|---|---|---|
| D1 | Screens are **processor-agnostic** and say "Maropay" / "our payments partner". The processor is named only on the agreements step. | The payments partner isn't settled yet. |
| D2 | Build from the plan and the MaroBase design system, then **reconcile with the Maropay designs in progress later**. | Designs are being produced in parallel. |
| D3 | **Top-level "Maropay" sidebar group** with a rail workspace at `/accounts/:accountId/maropay/*`, plus a per-store Payments page and order-level actions. | Gives the plan a persistent home while keeping contextual entry points. |
| D4 | **Cut from the prototype:** the separate Reports page (CSV export on Transactions and Payouts instead), the support case view (a contextual alert with references instead), and cross-tab locks and reminder schedules (documented only). **Kept:** the shopper checkout preview. | Keeps the prototype to surfaces that reuse the design system. |

## Defaults taken during the build

- **Money.** Maropay owns `Payment` records, stored in integer minor units with a currency code (`src/maropay/money.ts`). Commerce orders keep their decimal strings and carry only a derived summary: `paymentProvider`, `paymentId`, status, method and captured date, written by `useCommerce.applyPaymentSummary`.
- **Order status labels.** The labels written back are Pending, Authorised, Paid, Partially Refunded, Refunded, Failed, Voided and Disputed. `MpStatusChip`'s payment map now keys `'partially refunded'` with a space, so the label Commerce already used finally matches (it used to render grey).
- **Provider brand.** Previous providers (PayPal, a merchant's own Stripe account) are named factually as the *original provider*. Their refunds go back through them and never touch the Maropay balance.
- **Checkout orders.** Commerce isn't persisted, so Maropay keeps a snapshot of every order its checkout creates and rebuilds it after a reload. These orders use ids from 900001 upward, numbered `#20001` and up, so they can never collide with seed, POS or draft orders.
- **Gate.** Maropay uses `commerceGate`, because the first product is Commerce Cloud online.
- **Eligible stores.** Maropost web stores only. Shopify-provider channels keep their own checkout, and POS stays in Retail › Payments.
- **Capabilities are derived, not stored.** They are computed from verification, open tasks and deadlines, so a resolved task or a passed deadline can never leave a stale "enabled".
- **Upcoming payout is derived.** It is an estimate from the unpaid balance. Stored payout states are only *In transit*, *Sent to bank* (`paid`) and *Failed*. "Sent to bank" is never presented as proof the bank credited the merchant.
- **Refunds.** Pending refunds count as committed, so they can't be over-refunded. Processing fees are not returned on refund. A disputed payment can't be refunded.
- **Permissions.** These live in the Maropay store as the acting role (owner / finance / store operations), not in `rbacData.ts`. RBAC has no finance role and enforces nothing, and its `currentUserId` is fixed. The adapter enforces permissions as well as the UI.
- **Persistence.** State is saved per account under `mp.maropay.v1:<accountId>`, and the trial lab's `cleanupAccount` removes it too. The following are never persisted:
  - step-up tokens
  - full bank numbers (only the last four digits are kept)
  - document contents (only name and status)
  - the reviewer's failure switches
- **Scenarios.** `?maropay=m01…m15` loads a review scenario for the active account, using the same idiom as `?plg=`. Fixtures are built by running the mock adapter's own operations at back-dated times, so every payout reconciles to its movements. The tests assert this.
- **Setup rules live in one place.** `src/maropay/onboarding.ts` defines what each step needs. The wizard uses it to reveal field errors once the merchant tries to move on; the adapter uses it to refuse a submission. Submission checks the draft's content, never the wizard's progress markers, so a step the merchant visited and later emptied can't slip through.
- **Owner-only items.** Confirming authority, accepting the terms and adding the payout account are the owner's. They never stop a finance user moving through the steps. Instead the finance user's review step becomes "Ask the owner to submit", which raises an owner-review task that submission resolves.
- **Terms are accepted on Continue.** Ticking the box isn't acceptance. The acceptance, its version and the accepting role are recorded when the owner leaves the step. After that the box is locked with the date.
- **Photo ID is optional in the wizard.** Submitting without it leads to the partner's request: an *Action required* verification task, due in 5 days, which opens a focused "Provide information" view rather than reopening the whole wizard. Only the file's name and size are kept.
- **Reusing verified details** makes the verification fields read-only and skips the ID. The account records `reusedVerifiedDetails`.
- **Unsupported country.** Choosing an unsupported registration country during setup marks the account `unsupported` at once. Continue is disabled, the overview says Maropay isn't available and links back to setup, and "Keep my current provider" leaves nothing changed. A declined verification is the only state offered a decision review through support.
- **Payout account entry.** The routing or bank code and the full account number are held only in the form until saved. The store keeps the last four digits, and the bank code is never stored.
- **Store activation is a sequence on one page.** The order is check, configure, review, activate. The checklist's fixes point at the page's own sections or at where the fix lives. Changing methods or capture on a store that isn't live resets its test checkout and review, so the owner never activates a configuration they didn't test.
- **"Waiting" means our payments partner's move.** Under review waits on the partner; action required is *to do* for the merchant. The checklist, task list and overview all make that distinction.
- **Activation consequences are specific.** A method with no Maropay equivalent (PayPal Checkout) is said to stay connected through the previous provider. Past payments, refunds and payouts always stay with whoever took them. Stopping Maropay changes only where new checkouts go.
- **Methods that need approval** are requested through a short drawer that asks for the listed requirements. The prototype doesn't keep the answers. The method is then *pending approval* and cards can go live meanwhile (M15). The demo card on the store page decides the review.
- **Store provider on the sales channel page.** Without a Maropay record the store keeps the long-standing Stripe row, so an account that never opens Maropay sees no change.
- **The checkout preview creates real sample records.** Each run makes an order and a payment in this prototype, so reviewers can follow them into Transactions, the order and (in U5) a payout. The flow decides which methods the run can use: cards authenticate and decline, wallets only succeed, buy now pay later redirects, and bank debits confirm later. Flows the store's methods can't produce are listed with what to turn on, not hidden without explanation.
- **Transactions tabs.** *Pending* holds processing and authorised payments, since both are waiting on someone. Cancelled authorisations appear under All only, because nothing was taken and nothing failed. Totals follow the filters, so a store filter shows that store's own numbers (M07).
- **Refunds from the order page** go through the Maropay drawer whenever the order carries a tracked payment, whichever provider took it. Untracked orders keep the order's own drawer. The drawer holds one idempotency key per attempt: a timeout retry reuses it, and a rejected refund gets a fresh one.
- **CSV export** is available to owners and finance. It leaves fees and net blank for payments an earlier provider took, rather than guessing them.
- **The next payout is an estimate on every screen.** It's shown with "≈" and an estimated date, and says "Paused" when payouts are blocked. It has its own page (`payouts/upcoming`) so its contents can be checked before it goes out. Stored payouts are only *In transit*, *Sent to bank* and *Failed*.
- **A payout explains itself.** Its breakdown lines are sums of the balance movements inside it: payments, fees, refunds, refunds returned, disputes, dispute fees and disputes won. They always add up to the payout (tested). The Payments line opens Transactions filtered to that payout.
- **Changing the bank account** goes through the details, then a step-up check, then the save. A mistyped number never costs a code. Three wrong codes end the attempt. A failed payout can be retried only after the account has changed, because the old account just bounced.
- **Bank confirmations (M08) resolve from the Payouts page.** That's where "payouts are paused" is explained; Settings keeps bank-account management (U6).
- **Disputes.** Deadlines count calendar days and are always written out. Evidence and the written response save as a draft until submitted, and submitting is final. A won dispute returns the amount but not the dispute fee; lost and accepted disputes keep both deducted. Disputes are for owners and finance only.
- **Settings splits verified from public details.** Legal details were verified, so a change is a request that waits on review; the current value stays in use until it's approved. Statement descriptor and support contacts aren't verified, so they save straight away. Address, registration country and representative changes need new documents, so they go through support in this prototype.
- **Stopping isn't closing.** Stop on all stores changes where new checkouts go and nothing else, and it can be undone store by store. Closing is final: it waits until nothing is left in flight (no live store, open dispute, payout on the way or balance), then needs a confirm and a step-up. A closed account keeps its history readable, and every page says it's closed instead of offering a next step.
- **Notifications carry their fix.** A notification pushed with a route is a link. Following it from the app-bar panel closes the panel. Notifications without a route stay plain buttons that mark themselves read.
- **Lists can fail, once.** A list's load is simulated, and the reviewer's "Next request times out" switch (user menu, or a payment's demo card) makes the next one fail. The list then shows its error state with **Try again**, and hides counts and export until it loads. The same one-shot switch covers actions: the next refund or capture times out, and retrying is safe.
- **Tab counts follow the filters.** Every filter except the tab (store, provider, method, payout, search) applies to the tab counts too, so a filtered list never shows "All 13" above "1 record".
- **Tests.** `npm run test:maropay` runs `node:test` over `tests/maropay/`. Modules under `src/maropay/` and `src/services/maropay/` import each other by relative `.ts` path, because Node doesn't resolve the Vite `@/` alias.

## Build status

| Slice | Surfaces | State |
|---|---|---|
| 1 | Data layer, mock adapter, scenarios, tests | Done |
| U1 | Sidebar group, rail workspace, Overview (discovery + live), reviewer controls, Settings signpost | Done |
| U2 | Setup wizard (resume, requirements, outcome) | Done |
| U3 | Store Payments (activation checklist, methods, migration) | Done |
| U4 | Checkout preview, Transactions, Payment detail, order integration | Done |
| U5 | Payouts, Disputes | Done |
| U6 | Maropay settings, notification links | Done |
| U7 | Hardening, M01–M15 sweep, [implementation report](implementation-report.md) | Done |

## Known limitations (prototype)

- Commerce re-seeds on every load. Order *status* is re-projected, but order timeline lines Maropay appended in an earlier session aren't restored. The Maropay payment timeline is the durable record.
- Orders have no `accountId`. Projection covers the active account only, and switching accounts hands orders back to their seed values.
- Every fixture payment is in USD, because every seeded order is. The money module and balances are currency-aware, and the tests cover JPY and KWD.
- Legacy-provider refunds on *untracked* orders keep the old record-as-full behaviour. Tracked orders refund correctly, including partial refunds.
- Refunds are by amount only. The seeded orders' line items don't add up to their totals, so item-level selection (plan §6.4) would suggest misleading amounts.
- The notification feed lives in memory, so a reload clears it. Maropay's own records keep every event.

## Production launch dependencies (not built)

- Processor choice and configuration, the account model, and any embedded KYC or notification components.
- Signed commercial terms, including rates, dispute fees, and payout policy per market.
- The approved launch-country list. `SUPPORTED_COUNTRIES` is illustrative.
- Server-side authorisation, verified webhooks, idempotency keys on real calls, and reconciliation jobs.
- Cross-tab consistency, reminder cadences (24 h and 72 h setup reminders, dispute deadline reminders), and the owner emails and security notifications the plan describes. Here these are in-app notifications only.
- Support tooling: case view, escalation to the processor, masked diagnostics.
- Naming: an existing "MaroPay" label in Neto and the new Maropay brand need one decision on casing and brand before launch.
