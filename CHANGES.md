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
