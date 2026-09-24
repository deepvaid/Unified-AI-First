# CHANGES — Maropay prototype (2026-09-23)

Slice U7, hardening and report (2026-09-24):

- **List error states.** Transactions, Payouts and Disputes load through `useMaropayListLoad`, backed by the new adapter read `readRecords`. When the reviewer arms "Next request times out", the next load fails, and the list shows `MpErrorState` with **Try again**. Counts and export wait until the list has loaded. The switch is now also in the user menu's Maropay demo block.
- **Tab counts follow the filters** on all three lists. Store, provider, method, payout and search narrow the counts, not just the rows (M07).
- **Accessibility**, from an axe-core 4.12 pass over every Maropay page and overlay:
  - `MaropayLayout` uses a `div` instead of a second `<main>` inside `v-main`;
  - the row-actions column headers have a screen-reader name;
  - the checkout preview's sections are `h2`, not `h3` straight under the page title;
  - **`MpDialog` returns focus to its opener** when it closes. This is shared: it covers every dialog, not just Maropay's.
- **Phone width:** the payment page's four-outcome demo control scrolls inside its row instead of pushing the card sideways.
- **`MpDataTableToolbar`** says "1 record", not "1 records".
- 1 new test (90 total). New docs: `docs/maropay/implementation-report.md`. Also updated: `DESIGN_AUDIT.md` (Maropay changelog) and `CLAUDE.md` (file tree, `npm run test:maropay`, references).

Slice U6, account settings and notification links (2026-09-24):

- **Settings** (`MaropaySettings.vue`, rail child `settings`) is now a real page. Its six tabs live in `?tab=`, so other pages and notifications link straight to a section. Without an account it shows "Set up Maropay first". Each tab is its own file in `src/views/Maropay/settings/`:
  - **Business** (`BusinessTab.vue`): legal details are read-only. **Request a change** covers legal name, trading name, registration number and website. It creates a *waiting on review* task, and the current value stays until our payments partner approves it; a demo card approves or declines. The details shoppers see (statement descriptor, support email and phone) apply straight away, validated like setup. Address, country and representative changes go through support.
  - **Payout account** (`BankAccountsTab.vue`): the masked account, the schedule and **Change**, which runs the existing bank drawer and step-up. The M08 paused-payouts alert appears here too. Finance users see it read-only; store operations users get a lock state (M12).
  - **Payment methods** (`MethodsTab.vue`): the account's methods and rates. `MaropayRatesTable` gained a `caption` prop, so Settings can name the terms the rates came from.
  - **Stores** (`StoresTab.vue`): linked stores with their status and methods, plus **Link a store**, which links the store and opens its Payments page (M07). Store operations users see only their stores.
  - **Permissions** (`PermissionsTab.vue`): who can do what, read from the same `can()` the adapter enforces, and the full history table.
  - **Stop or close** (`CloseTab.vue`): **Stop on all stores** is a danger confirm listing each store's fallback; it changes routing only (M14). **Close account** stays disabled until nothing is in flight (live stores, open disputes, payouts on the way, a balance), then asks for a confirm and a step-up.
- **Closed accounts.** `MaropayAccount.closedAt` is new, and older saves read back as open. Closing disables payments and payouts, resolves open tasks and adds a `closed` overview headline. The store Payments page and setup show that headline instead of next steps, and Settings disables every change.
- **Notifications link to their fix.** `NotificationRow` renders a notification that has a `to` as a link, and the app-bar panel closes when you follow one. Rows without a link stay buttons.
- New data layer:
  - model: the `change_business` action, the `business_change` task kind carrying the requested `change`, and the `business` and `account` history kinds;
  - adapter: `requestBusinessChange`, `simulateBusinessChangeOutcome`, `updatePublicDetails`, `deactivateAllStores` and `closeAccount`, plus closed-account guards on `linkStore` and `updateBankAccount`;
  - readiness: `closureChecks`.
  There are 5 new tests (89 total).
- `MaropayPlaceholder.vue` is deleted — every Maropay route is now a real page.

Slice U5, payouts and disputes (2026-09-24):

- **Payouts** (`MaropayPayouts.vue`):
  - the next payout as an estimate row ("≈", "Estimated …", "Paused" when blocked);
  - tabs All, Upcoming, In transit, Sent to bank and Failed;
  - balance cards and Export CSV for owners and finance;
  - a "Payouts are paused" alert with **Confirm bank account** and **Use a different account** (M08);
  - failed-payout alerts linking to the fix (M09);
  - a demo card to run the next payout (M01).
  Store operations users get a lock state.
- **Payout detail** (`MaropayPayoutDetail.vue`):
  - status alerts: "Sent to bank" means the transfer was confirmed as sent, never that the bank credited it;
  - a breakdown whose lines are sums of balance movements, so they always add up, with Payments linking to `Transactions?payout=`;
  - the included movements, history, support references, and a demo card to confirm or return a transfer.
  A failed payout is fixed here: **Update bank account** opens the bank drawer, and **Retry payout** stays disabled until the account has changed. `payouts/upcoming` shows the estimate on its own page.
- **Disputes** (`MaropayDisputes.vue`): the deadline column is written out ("Due in 8 days"), with ink added at 3 days or fewer — never colour alone. Tabs cover every status, and store operations users get a lock state.
- **Dispute detail** (`MaropayDisputeDetail.vue`):
  - the deadline alert in words, and what the shopper's bank says;
  - an evidence checklist edited in a drawer (mock document plus note);
  - a written response that saves as a draft while typing ("Draft saved 2:32 PM");
  - **Submit evidence** (disabled with the missing items as a tooltip; the confirm says it's final) and **Accept dispute** (danger confirm listing what's lost);
  - won, lost and accepted outcomes that each state the cost;
  - a money breakdown, dispute history and demo outcome controls (M11).
- New Product components, with stories:
  - `MaropayStepUpDialog`: `MpDialog` sm, persistent; the prototype code 246810 is shown; three wrong codes end the attempt.
  - `MaropayBankAccountDrawer`: the country decides the bank-code name and length; the step-up check runs only after the details validate; only the last four digits are kept.
- New pure modules, with 6 new tests (84 total):
  - `src/maropay/payouts.ts`: `payoutLines`, which always sum to the payout; tabs; CSV rows that say whether arrival is confirmed or estimated.
  - `src/maropay/disputes.ts`: calendar-day `deadlineLabel`, `missingEvidence`, tabs.
  - Bank-account validation (`bankAccountErrors`, `bankCodeFor`, `digitsOnly`) moved into `onboarding.ts` and is now shared by the setup wizard and the bank drawer.
- Bank tasks (M08) now point at Payouts, where paused payouts are explained and resumed.
- `MaropayPlaceholder` keeps only Settings.
- **Fixes:**
  - U4 Transactions (and the new Disputes list) no longer clip rows and the pagination footer. The page root dropped `h-100`, because the Maropay shell scrolls its own content.
  - `MpAlert` action buttons now wrap instead of running off narrow screens (`flex-wrap`).

Slice U4, checkout preview, transactions and orders (2026-09-24):

- **Checkout preview** (`MaropayCheckoutPreview.vue`, rail child `checkout-preview`) runs a shopper checkout on a live store. You pick the store, the product and one of five outcomes: successful payment, bank asks to confirm (3-D Secure), card declined, pay on another page (buy now, pay later) or delayed confirmation (bank debit). You can also switch between desktop and mobile. Each run creates a sample order and payment. Pay can't charge twice: the button locks while busy, and the adapter's confirm is idempotent. Outcomes that the store's methods can't produce are listed with what to turn on. The shopper side is the new bespoke `CheckoutPreviewFrame`, a merchant-chrome simulation on tokens with `--cp-*` re-skin props.
- **Transactions** (`MaropayTransactions.vue`) shows every payment, including ones an earlier provider took:
  - tabs All, Succeeded, Pending, Refunded, Disputed and Failed;
  - Store as the quick filter, and Provider and Method in the filter drawer;
  - totals that follow the filter;
  - Export CSV (owners and finance only);
  - row actions (view, open order, refund), with store staff scoped to their stores.
- **Payment detail** (`MaropayPaymentDetail.vue`) shows details, the money breakdown, refunds, the timeline and support references. It offers capture, cancel authorisation and refund, with status alerts for processing, authorised, failed, cancelled, disputed and earlier-provider payments. A demo card delivers bank events (duplicates and late ones are ignored), sets the next refund's outcome, settles pending refunds, opens a dispute and times out the next request. There are not-found and no-access branches.
- **Order detail** now reads its payment from Maropay:
  - a provider row;
  - **View in Maropay**;
  - refunded / left-to-refund;
  - capture and cancel for authorised payments;
  - processing notice.
  Refund opens `MaropayRefundDrawer` for tracked orders, including PayPal ones, which refund through PayPal. Untracked orders keep the old drawer. The hardcoded `$` amount now uses the shared money markup.
- New Product components, with `Product/Maropay/*` stories:
  - `MaropayTimeline`: icon and tone come from the event kind, not the text; newest first, including same-minute events;
  - `MaropayLedgerBreakdown`: signed lines add up to a total; generic enough to explain a payout in U5;
  - `MaropayRefundDrawer`: one idempotency key per attempt, a note about the original provider, and the rejected-refund and timeout states;
  - `CheckoutPreviewFrame`.
- New pure module `src/maropay/transactions.ts`: tab buckets, CSV rows (no guessed fees for earlier providers), and which methods each preview flow can run on. 4 new tests (78 total).
- New token `component.preview.viewport.mobile` (390) for the checkout preview's phone width.
- `MaropayPlaceholder` keeps only payouts, disputes and settings.

Slice U3, store activation (2026-09-24):

- The store editor's `payments` route (`StorePayments`) is now `StorePaymentsPage.vue`, which replaces the placeholder. It shows:
  - which provider takes this store's new checkouts;
  - the activation checklist, where each item has its fix: run the test checkout, choose methods, review the changes, or provide information;
  - payment methods by category, with a review drawer for methods that need approval;
  - capture mode;
  - "What changes when you activate", including the method-by-method comparison against the previous provider (M06);
  - the store's activity.
  Activating and stopping both go through `MpConfirmDialog` and change only where new checkouts go. The page also covers POS channels, other-platform stores, store staff not assigned to this store, no Maropay account, setup in progress, a declined business and an unlinked store. A demo card simulates method approvals and failing test checkouts. The `store` entry is gone from `MaropayPlaceholder`.
- New Product components, with `Product/Maropay/*` stories: `MaropayActivationChecklist` (the item's state is shown and read out; fixes come through the `#action` slot) and `MaropayMethodRow` (rate, requirements, and the checkout switch or **Set up**).
- Store editor rail: new **Selling** group with **Payments**, between Customize and Store content (`storeEditorMenu.ts`, `StoreEditorSidebar.vue` and its story).
- Sales channel overview: the web-store setup item "Connected apps — Payments and fulfillment are connected", which was always done, is now **Online payments** and is driven by Maropay data. The Connected apps list names the provider that actually takes payments: Maropay when live, otherwise the store's previous provider, and Stripe when there's no Maropay record.
- Activation checklist: *action required* is now the merchant's move (to do) rather than waiting on our payments partner; only *under review* waits. The payout item says payouts turn on once the business is verified. New `payoutScheduleLabel` in `readiness.ts`, shared by the wizard and the store page.

Slice U2, setup wizard (2026-09-24):

- `/accounts/:accountId/maropay/setup` is now `MaropaySetupWizard.vue` (was the placeholder). One route, four states: the six-step wizard (saved on every change, resumes where the merchant stopped), a focused **Provide information** view for a verification request (`?task=`), the submitted outcome (readiness card, "what happens next", demo-only decision controls while under review, support references when declined), and a lock for store operations. The `setup` entry is gone from `MaropayPlaceholder`.
- New `src/maropay/onboarding.ts` holds the per-step rules. The wizard uses them to guide the merchant; the adapter uses them to refuse. `submitOnboarding` now validates the draft's **content** (it used to trust `completedSteps`), records `reusedVerifiedDetails`, and resolves open owner-review requests. Draft saves go through the new adapter op `saveOnboardingStep`, which also sets eligibility when the registration country changes. 11 new tests (73 total).
- `STEP_LABELS` shortened for the step chips (Business · Rates and terms · Verification · Payout account · Public details · Review). The overview's "Step N of 6" line uses the same labels.
- Overview: an unsupported registration country chosen *during* setup now offers "Review setup details" and no longer shows the "Ask for this decision to be reviewed" support alert. That alert is kept for a declined verification.

Slice U1, shell and discovery:

- New sidebar group **Maropay** (after Retail, `requires: 'commerce'`) and a rail workspace at `/accounts/:accountId/maropay/*` (`MaropayLayout`, `MaropaySidebar`, `maropayMenu.ts`); the Overview is built, other surfaces render `MaropayPlaceholder` until their slice lands. `StorePayments` route added under the store editor (placeholder; rail item comes with its page).
- `MpStatusChip` — new `type`s `payout`, `dispute`, `method`, `readiness`; `payment` gains `succeeded` / `processing` / `cancelled` and icons.
- New Product components in `src/components/maropay/` (stories under `Product/Maropay/*`): `MaropayMoney`, `MaropayReadinessCard`, `MaropayTaskList`, `MaropayBalanceCards`, `MaropayRatesTable`, `MaropayActingRoleBanner`, `MaropaySupportAlert`, `MaropayDemoControls`.
- Settings › Payment Account — placeholder → signpost into Maropay (no second source of truth).
- Get Started — task `payments` renamed "Set up payments" and pointed at the Maropay overview.
- User menu — "Maropay demo state" block (scenario, reset, act as). `?maropay=` is now dropped from the URL once applied, so a refresh keeps the reviewer's progress.

Slice 1, data layer — no new screens yet. Decisions and production gaps: `docs/maropay/decisions.md`.

- `MpStatusChip` — `payment` map key `partially_refunded` → `'partially refunded'` (the label Commerce actually writes; it rendered grey before) + new `disputed` key.
- Retail › Payments — provider label "Maropost Payments" → "Maropay" (value `maropost_payments` unchanged).
- `useCommerce` — `Order.paymentProvider` / `Order.paymentId` (optional); new `applyPaymentSummary`, `clearPaymentSummary`, `createCheckoutOrder`; `refundOrder` delegates Maropay-tracked orders to `useMaropay`.
- `useNotifications` — `push()` and an optional `to` route on `AppNotification`.
- `App.vue` — starts `useMaropay` with the app; `?maropay=m01…m15` loads a review scenario.

# CHANGES — UI polish & consistency pass (2026-08-29)

Refinement pass over the product modules + PLG/RBAC prototypes: zero functional changes — visual
structure, grouping, component consistency, and accessibility only. Patterns per the approved
Phase 2 standards; full audit trail in `POLISH-AUDIT.md`; deferred items in `GAPS.md`.

**Legend** — the four problem areas: **F** forms/grouping · **C** containment · **M** action
menus · **D** drawers/dialogs.

## Foundations (components — e288b42)

- `MpRowActionsMenu` — M: `location="bottom end"` default, explicit `aria-haspopup="menu"`, `role="menu"` list, click-swallowing trigger, 40px hit-area on the compact glyph; story footgun examples fixed.
- `MpFormSection` — F: opt-in grouped mode — with slot content renders `<section role="group" aria-labelledby>` around heading + fields.
- `MpFormDrawer` — D: title is a real `h2`; `aria-describedby` wired to the body (MpDialog parity).
- `SettingsSection` — C: converged onto `component.card.*` tokens (radius, padding, compact breakpoint) + `aria-labelledby` heading association.

## Merchandising (bd73588)

- Collections / FieldTransformations / PageRedirects / RecommendationEngines / Synonyms / DefaultMerchandising (×2) / EngineEditor / RuleEditor — M: hand-rolled kebabs → `MpRowActionsMenu` with `:itemLabel`, `role="menuitem"`, one danger recipe (inline `opacity:0.4` divider styles removed).
- DefaultMerchandising / EngineEditor — M: labeled dropdowns keep triggers, panel chrome converged.
- PinningEditor / SearchPinningEditor / SearchBlacklisting — F: toolbar fields moved to the placeholder + `aria-label` chrome contract so control rows share one 40px baseline (visible top labels removed — flagged).

## Marketing (964bb02)

- AcquisitionForms — D/F: filter drawer + embed dialog headings → grouped `MpFormSection`; template-picker margins → container gap; M: divider-before-Delete replacing `text-error mt-1` (×2), `role="menuitem"` everywhere.
- EmailContent / LandingPages — M: `mt-1` → divider recipe.
- CampaignTags / DataJourneys / OptimizeOnOpen / PreferencePages — D/F: flat drawer bodies → `MpFormGrid`; M: divider + `role="menuitem"` + `:itemLabel`.
- DynamicContent — D: "Rule N" heading → `MpFormSection`; bordered `.dc-rule` boxes flattened to divided rows.
- LandingPageEditor — D/F: Page Settings drawer → URL / SEO / Tracking grouped sections (field order: redirect moved beside URL).
- CreateCampaign / CreateSmsCampaign — C: outlined schedule tiles → flat border recipe, `mb-3` → radio-group token gap.
- CreateAbCampaign — C: outlined group cards → `flat border rounded="lg"`.
- ContentFeeds / CouponBanks / FooterManagement / Journeys / EmailCampaigns / SmsCampaigns / TransactionalEmail / TransactionalSms — M: `role="menuitem"`, divider normalization, `:itemLabel` threading.
- components/marketing: JourneyFlowColumn — M: canvas-node kebab → `MpRowActionsMenu` (v-card wrapper dropped, `base-color="error"` → divider + `text-error`); CampaignContentEditor — D: hand-rolled dialog header → `MpSectionHeader` with `#actions`.

## Commerce + Products (206c7f1)

- CreateDraftOrder — F: customer triple + address drawer `v-row` grids → `MpFormGrid` (city/postal paired, long fields full-width).
- CustomGiftCards — D: view drawer rebuilt (preview card on token inset, details → `MpFormSection` + divided `MpListRow`s); create-drawer preview margins → card gap; M: `role="menuitem"`, `:itemLabel="item.code"`.
- PurchasableGiftCards — D/F: filter heading → grouped `MpFormSection`; "Organise" panel title aligned to section spec; M: recipe fixes.
- Fulfillments — F: filter heading + bare select → `MpFormSection` + `MpFormGrid`; M: recipe + `:itemLabel`.
- CommerceCloudLanding — C: `rounded="xl"` → `rounded="lg"` (both cards).
- Coupons / DraftOrders / SalesOrders — M: `role="menuitem"`, clean dividers, `:itemLabel`.
- Reservations — F: both sections converted to grouped mode wrapping new `MpFormGrid`s.
- Inventory — D: drawer preview card inset → card token; M: recipe fixes.
- ProductsList — M: saved-views `ellipsis` menu → `MpRowActionsMenu` (danger recipe, subheader kept); Import/New-product dropdown chrome.
- Collections / PriceLists / TaxCategories / ProductRecommendations / ProductImportLogs — M: recipe + panel chrome fixes.

## Retail + Settings + Service (fcbcd6f)

- Retail/Registers — D: detail drawer's three pseudo-headings → grouped `MpFormSection` (`role="group"` verified live), five stray margins removed, nested bordered sub-boxes flattened to divided lists (VList theme border opted out); pair-drawer instruction card → `MpFormSection` on shell rhythm; M: `more-horizontal` kebab → `MpRowActionsMenu` + `:itemLabel`.
- Retail/Staff — D: bordered PIN/info cards flattened; `mt-1` → container gap.
- Settings/Users — M: kebab → `MpRowActionsMenu` with divider before "Remove User"; F: drawer select in `MpFormGrid`.
- Settings/pages/RolesPermissionsPage — F: drawer's 4 flat fields → `MpFormGrid`; M: recipe fixes.
- Settings/pages/AuditLogPage — F: filter-panel selects → `MpFormGrid`.
- Settings/pages/UsersPermissionsPage — M: `role="menuitem"` ×5, `:itemLabel`, divider opacity removed.
- Settings/pages/ServicePage — C: both hand-rolled bordered boxes flattened to divided rows.
- Settings/Billing — C: two heading styles → `MpSectionHeader`.
- Settings/Profile — F: hand-rolled heading → grouped `MpFormSection`.
- Settings/DesignSystemDemo — D: raw `v-navigation-drawer` (no trap/roles) → `MpFormDrawer` (verified: `role="dialog"`, Escape, 440 on-ramp).
- Service/Tickets — M: ticket-pane kebab → `MpRowActionsMenu`; canned-response picker already compliant.
- Service/ChatbotBuilder — F: 21 field margins removed, 9 headings → `MpFormSection`, `v-row` grids → `MpFormGrid`, launcher tiles under `MpFormField`; D: publish-dialog heading → `MpFormSection`.
- Service/ChatbotList — M: recipe + `:itemLabel`.
- styles/retail-widgets.scss — C: resting card shadow removed (border-only; hover lift kept — see GAPS §8).

## Contacts + Dashboards + misc (6526cdd)

- Contacts (AllContacts, ContactFields, ContactLists, ContactTags, RelationalTables, SQLQueries, SecureLists, Segments) — M: `role="menuitem"` + divider recipe; D: ContactTags/SecureLists flat drawer bodies → `MpFormGrid`; Segments stray `mt-1` removed.
- ContactDetail — M: header kebab → `MpRowActionsMenu` with `:itemLabel="fullName"`.
- Analytics/CustomReports — M: `base-color="error"` → `text-error` inside the existing menu.
- Dashboards/DashboardsList — M: 6-item kebab → `MpRowActionsMenu` (all conditionals preserved).
- DashboardView — M: grouped Actions panel kept (deliberate module-01 design) but converged to menu radius/listItem tokens + `role="menu"`/`menuitem` + `aria-haspopup`; F: date-range 2+2 fields → `MpFormGrid :cols="2"` (bespoke CSS deleted).
- GetStarted — M: header kebab → `MpRowActionsMenu`.
- DaVinciAI / Plg/CheckoutView — C: borderless hero/provisioning cards gain `border`.
- Billing/BillingView — D: addon drawer children on shell gap (scoped margins deleted); C: 4 nested boxes' hardcoded 10px radius → the nested 12 token.
- Integrations — C: app-tile card gains `rounded="lg"`.
- components: ReportFieldPicker headings → `MpFormSection`; DashboardFormDialog + PlgTalkToSalesDialog bodies → `MpFormGrid`; MpManageFoldersDrawer nesting indent → `--mp-space-24` token; DvHistoryDrawer kebab → `MpRowActionsMenu` (bespoke danger class deleted); MpDaVinciBot danger item → `text-error` (bespoke class deleted); DashboardWidgetActionMenu Remove → `text-error`.

## SalesChannels (140b228)

- SalesChannelsList — M: kebab → `MpRowActionsMenu` (wrapping v-card dropped).
- StoreThemeBuilder — M: toolbar kebab → `MpRowActionsMenu`.
- StoreCampaigns / StoreContentList / StoreNavigation — M: `role="menuitem"` + `:itemLabel` convergence.
- SalesChannelDetail — C: feature sub-boxes flattened to divider-separated rows.

## Verification

- `npm run type-check` ✓ · `npm run contrast:check` 244/244 ✓ · `npm run build` ✓ (after every slice).
- Live checks: extended menu verified on Contacts (role=menu, aria-expanded, right-edge alignment, 40px target); Registers drawer verified (three `role="group"` sections, flat rows, sticky footer); DesignSystemDemo drawer verified (role=dialog, Escape, focus restore, 440 width).

### A11y verification (live, dev server)

- **Keyboard — menu** (Registers row kebab): visible focus ring on the trigger; opens on
  activation with `aria-expanded="true"`; 3 `role="menuitem"` items in a `role="menu"` panel;
  Escape closes and returns focus to the trigger. (The browser-automation harness dispatches
  key events without `key` values, so Enter-activation was exercised via the button's native
  click activation + real-valued KeyboardEvents.)
- **Keyboard — drawer** (Registers detail): focus moves into the panel on open; Tab on the last
  focusable wraps to the first and Shift+Tab wraps back (7 focusables, "Close" → "Deactivate");
  Escape closes and focus is restored.
- **Keyboard — form** (Pair-register drawer): `h2` title; all 5 fields labelled and tabbable in
  DOM order inside a 16px-token `MpFormGrid`.
- **axe (axe-core, page-level)** — before/after on the byte-for-byte twin pages
  `DashboardGradientView` (untouched) vs `DashboardView` (swept): identical violation profiles
  (52 nodes each, all in shared pre-existing chrome — Vuetify select internals with
  `role="option"`, unlabeled `v-data-table` checkboxes, tooltip names, landmark structure) →
  **zero regressions**. Scoped to the changed surface (the open Actions panel): 0 violations on
  both; the swept panel additionally carries `role="menu"`/`menuitem` where the twin has none.
  On Registers, every violation node was inspected and traces to pre-existing Vuetify internals,
  not the pass. Issue *classes* removed outright: the raw no-role/no-trap drawer
  (DesignSystemDemo), color-only danger items without separation, sub-40px icon-button targets
  on row kebabs, form sections with no programmatic field association.

## Notable flags (see also GAPS.md)

- Merchandising toolbar fields: visible top labels → placeholder + aria-label chrome (per the documented toolbar contract) — say the word if visible labels were wanted there.
- Retail widget cards lost their resting shadow (rule compliance) — hover lift kept.
- Menu accessible names converged to the component's "<Thing> actions for <name>" pattern (aria copy only).
- `Settings/Users.vue`, `Settings/Profile.vue`, `Settings/Billing.vue` appear unrouted (legacy views) — edited for consistency but only reachable via type-check; candidates for the same cleanup as `AudienceView.vue` (GAPS §6).

---

# Follow-up slice (2026-08-30) — GAPS backlog worked to closure

Every deferred item from the first pass was actioned; per-item outcomes live in `GAPS.md`
(each entry now carries ✅/◐/⚠). Summary:

- **MpMenuItem** shipped and adopted by every action menu in the app (~185 items, ~68 files) —
  `role="menuitem"` is a component guarantee now, not a convention; the eight slot-label
  Marketing menus converged onto the same anatomy.
- **`guarded`** rolled out to the seven dirty-state drawers (CustomGiftCards, PurchasableGiftCards,
  ContactFields, SearchRules, Tickets, InviteUsersDrawer, UserAccessDrawer) with the
  "Discard changes?" confirm; verified live (dirty Escape → confirm; clean Escape → closes).
- **useFocusTrap** composable extracted (MpFormDrawer + DvHistoryDrawer); the float-drawer
  closed-state hack deduplicated into `global.scss` `.mp-float-drawer`; copilot gutters tokenized.
- **Toast API** finding was stale — `useToast` + `MpToastStack` already serve ~100 files.
- **Retail**: menu "Deactivate" now carries the danger recipe (matches the drawer footer);
  all remaining widget/tile hover shadows removed.
- **`component.builder.panelWidth`** token added; `.jb-panel` consumes it.
- **AppBar mobile search**: MpDialog rebuild evaluated and rejected (title-led header can't host
  an input-led sheet) — exemption documented in-code, dialog `aria-label` added.
- **axe app-level**: dashboard widget titles h3→h2, activity feed focusable + named region.
  Remaining findings are Vuetify-internal (GAPS §10).
- **Dead views** (AudienceView + legacy Settings Users/Profile/Billing): verified unreferenced;
  deletion is permission-gated here — `git rm` one-liner in GAPS §6.

Gates: type-check ✓ · contrast 244/244 ✓ · app build ✓ · Storybook build ✓.
