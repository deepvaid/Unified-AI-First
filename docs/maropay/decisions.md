# Maropay prototype — decisions and production gaps

Companion to the Maropay implementation plan, the internal product brief (not published in this repository). This file records what the prototype decided where the plan was silent or collided with the repository, and what stays out of scope. Updated 27 September 2026.

## Decisions made with the product owner

| # | Decision | Why |
|---|---|---|
| D1 | Screens are **processor-agnostic** and say "Maropay" / "our payments partner". The processor is named only on the agreements step. | The payments partner isn't settled yet. |
| D2 | Build from the plan and the MaroBase design system, then **reconcile with the Maropay designs in progress later**. | Designs are being produced in parallel. |
| D3 | **Top-level "Maropay" sidebar group** with a rail workspace at `/accounts/:accountId/maropay/*`, plus a per-store Payments page and order-level actions. | Gives the plan a persistent home while keeping contextual entry points. |
| D4 | **Cut from the prototype:** the separate Reports page (CSV export on Transactions and Payouts instead), the support case view (a contextual alert with references instead), and cross-tab locks and reminder schedules (documented only). **Kept:** the shopper checkout preview. | Keeps the prototype to surfaces that reuse the design system. |
| E1 | **Maropost-built onboarding forms via the partner API.** The wizard *is* the onboarding form and mirrors the partner's account / persons / requirements semantics. Copy stays processor-agnostic; the processor is named only on the agreements step. | Product review (26 Sep 2026): the screens should drive onboarding through the API, not hand off to a partner-hosted step. |
| E2 | **Collect the partner's currently-due set per country** (US / CA / AU / NZ / GB) and business type (company or individual; a non-profit is a company structure), including owners, directors and executives where the country asks. Later-dated (threshold) items are *not* collected up front — they become dated tasks, which is what exercises the deadline states. | Same review, point 1. |
| E3 | **After approval: prompt and task; the owner decides.** One `activate_store` task per linked store that could go live, a notification and the overview action deep-link to the store's Payments page. Activation is always an explicit confirm — never automatic, no auto-navigation. | Same review, point 3. |
| E4 | **Checkout customization in scope:** brand from the store's published theme, logo stub, pay-button label, statement descriptor and support contact at checkout; method order, default method, Apple / Google Pay as express buttons; per-method settings; default methods for new stores; editable payout schedule. **Out:** surcharge, tipping. | Same review, point 4. |

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
- **Scenarios.** `?maropay=m01…m17` loads a review scenario for the active account, using the same idiom as `?plg=`. Fixtures are built by running the mock adapter's own operations at back-dated times, so every payout reconciles to its movements. The tests assert this.
- **Setup rules live in one place.** `src/maropay/requirements.ts` is the one source of what our payments partner asks of each country × business type (currently-due keys, later-dated items, person roles, structures, ID formats, alternatives); `src/maropay/onboarding.ts` turns the keys a draft is missing into field-level issues and adds Maropost's own gates (authority, structure, support email, non-US descriptor, payout currency). The wizard uses it to reveal field errors once the merchant tries to move on; the adapter uses it to refuse a submission. Submission checks the draft's content, never the wizard's progress markers, so a step the merchant visited and later emptied can't slip through.
- **Vocabulary follows the partner.** Business type is `individual` or `company` (a non-profit is a company *structure*); the tax ID and the AU company number are separate fields with per-country labels and formats; the representative is a `Person` with a date of birth, phone, home address and — US only — the last four digits of the SSN. A full SSN is refused by the adapter and never reaches state. Legacy saves (`sole_trader`, `nonprofit`, a single `registrationNumber`, a one-string representative name) are back-filled on read.
- **Review by default.** Submitting always puts the account *under review*; nothing verifies instantly, including the reuse path. The partner's decision is the reviewer's control (`simulateReviewOutcome`): approve, ask for one keyed request (identity document, unreadable document, name ↔ tax ID mismatch with a document alternative, unreachable website with a description alternative for US businesses, proof of address, an owner's ID), or decline with one of the partner's five account-level reasons. One outstanding request per decision; partner error codes are kept for support and never shown.
- **Documents are only ever partner-requested.** The wizard no longer offers an optional photo ID; a request opens the focused "Provide information" view with the form the key needs (front/back documents, a keyed value, or a confirmation). Only a file's name and size are kept.
- **Declined is its own state.** It is not "unsupported": the overview says our payments partner couldn't approve the business and why, payments read *Not enabled* (a business that never traded simply stays off; one that traded is *Disabled*), no activation is offered anywhere, and the only route is a review through Maropost support. A business with a live store is never declined in the prototype — the partner pauses it with a request instead.
- **Approval prompts; the owner decides.** Verification raises one `activate_store` task per linked store that could go live (drafts and stores on other platforms get none), a notification that links to the store's Payments page, and an overview headline that says whether the store is *set up* (checklist done) or still *needs setup*. Nothing activates by itself; stopping Maropay on a store never re-raises its task.
- **Terms are recorded on Continue, with the date, a mock IP address and the browser** — what the partner's ToS acceptance requires. Once per version; a finance user can't accept.
- **The routing number is kept; the account number never is.** The payout draft and the payout destination hold the bank name, holder name and type, routing number, currency, country and the last four digits. The full number is validated once in the adapter and dropped.
- **Currency follows the registration country.** Choosing a country sets the account currency, re-seeds the method catalogue and the dispute fee for it (pre-submission only) and clears a payout account entered for another country. Rate labels stay USD-illustrative.
- **Later-dated requirements are staged.** A threshold item (a US company's EIN, illustratively at about $1,500 of payouts) is raised by the reviewer control as a task due in 14 days; payouts pause at the deadline and payments 7 days after it (`paymentsPauseAt`). The overview headline moves through "provide by <date>" → "payouts are paused" → "payments and payouts are paused". Detection stays a reviewer op — fixture volumes would trip any illustrative threshold.
- **Decisions and threshold items are separate.** A partner decision acts on its own requests and on threshold items the merchant has answered; an unanswered threshold item keeps its deadline through any approval or new request. An answered item past its deadline reads *paused while our payments partner reviews what you sent* — never "payments are active". A trading business is never offered Decline; the partner pauses it with a request instead. Only threshold items are staged (payouts first, payments a week later); a request on an already-verified business pauses both at its deadline.
- **A later item already on file is never asked for** (an EIN typed during setup), and each later item has its own form — a phone number, an email, a job title — never a photo ID in their place.
- **Wallets ride on cards.** Apple Pay and Google Pay can't be turned on without Cards, and turning Cards off takes them too. A declined method carries its capability-level reason.
- **Owner-only items.** Confirming authority, accepting the terms and adding the payout account are the owner's. They never stop a finance user moving through the steps. Instead the finance user's review step becomes "Ask the owner to submit", which raises an owner-review task that submission resolves.
- **Terms are accepted on Continue.** Ticking the box isn't acceptance. The acceptance, its version and the accepting role are recorded when the owner leaves the step. After that the box is locked with the date.
- **Reusing verified details** makes the verification fields read-only. The account records `reusedVerifiedDetails`; the submission still goes to review.
- **Unsupported country.** Choosing an unsupported registration country during setup marks the account `unsupported` at once. Continue is disabled, the overview says Maropay isn't available and links back to setup, and "Keep my current provider" leaves nothing changed. A *declined* verification is a different state (see above) and the only one offered a decision review through support.
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

**Deferred with S3 (paused).** From the S1 review, left for the partner-states slice: reviewer controls to pick a request kind, a decline reason or a later item from the UI (today only the identity request and the default decline are one click away; the rest run from scripts and tests); the requirement page's "answer with the alternative" control (unreachable from the UI until those reviewer controls exist).

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
| S1 | Partner-aligned model, per-country rules engine, review by default, activation tasks, M16–M17 (engine; UI kept compiling) | Done |
| S2 | Setup wizard rework (rules-driven per country and business type, people list) | Paused |
| S3 | Partner states across the product (requirement forms, checklist, decline surfaces, reviewer requests) | Paused |
| S4 | Activation kick-off after approval (store page notice, chips, sales-channel copy) | Paused |
| S5 | Store payment configuration (checkout card, method order, per-method settings) | Paused |
| S6 | Branded checkout preview | Dropped — the store's real checkout replaces the preview |
| S7 | Account-level payment settings and phase report | Paused |

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
- The approved launch-country list. `SUPPORTED_COUNTRIES` is illustrative, and so are the per-country requirement sets in `requirements.ts` (modelled on the partner's published currently-due lists), the industry (MCC) list, the company-structure lists and the non-profit sets. Production reads the requirements feed from the partner rather than a table.
- Real ToS capture (the IP address is a documentation-range mock) and a real threshold trigger for later-dated requirements.
- Server-side authorisation, verified webhooks, idempotency keys on real calls, and reconciliation jobs.
- Cross-tab consistency, reminder cadences (24 h and 72 h setup reminders, dispute deadline reminders), and the owner emails and security notifications the plan describes. Here these are in-app notifications only.
- Support tooling: case view, escalation to the processor, masked diagnostics.
- Naming: an existing "MaroPay" label in Neto and the new Maropay brand need one decision on casing and brand before launch.
