# POLISH-AUDIT — forms · containment · action menus · drawers

**Date:** 2026-08-29 · **Method:** full static sweep of `src/` (three parallel audits) + browser spot checks of worst offenders (noted inline as *[browser]*).
**Scope:** product modules + Plg/RBAC prototypes. Excluded: Deck, Reel, Showcase, ChartLab, EvilDashboard, ShadcnDashboard, DashboardGradient, DesignSystem sandbox (one exception: `DesignSystemDemo.vue`'s raw drawer, a real violation).
**Prior art honored:** `DESIGN_AUDIT.md` Phase 6 (form/modal rhythm — records deliberate exemptions), `docs/overlay-audit/01-overlay-component-audit.md` §7.2 (already scopes the kebab migration, architecture decision 2A locked), `docs/design-system/a11y-checklist.md` (component-level a11y baseline landed), `docs/ui-improvement/page-tracker.md` (modules 01–03 done; 04–12 pending — offenders cluster there).

The design system already holds the canonical answer to all four problem areas. Adoption is majority. This audit is therefore a **convergence work-list**, not a gap analysis.

---

## 1. Forms — flat lists, missing grouping

### 1a. Canonical trio status

- `MpFormGrid`: 85 files · `MpFormSection`: 46 files · `MpFormField`: 41 files. Phase 6 (closed 2026-08-28) already swept 592 field-level margins.
- **Systemic a11y gap:** `MpFormSection` renders a real heading but does **not** associate the fields under it (no `role="group"`, no id exposure). `MpFormGrid` is a bare CSS grid with zero semantics. `MpFormField` is the only one of the trio with `role="group"` + `aria-labelledby` — and it's for composite controls only. **No view in the repo currently produces a grouped, labelled form region.**

### 1b. Forms needing regrouping (flat lists / hand-rolled grids)

Worst-first. "Fields" = text/select/textarea count.

| Fields | File | Current state |
|---|---|---|
| 21 | `src/views/Service/ChatbotBuilder.vue` | Every field carries `mb-4`; headings hand-rolled (`text-subtitle-1 font-weight-bold mb-1` L382–438); `v-row dense`/`v-col cols="6"` as field grid |
| 19 | `src/views/Commerce/CreateDraftOrder.vue` | Customer block is `v-row dense`/`v-col md="4"` triple (L324); line items have inline `style="max-width:120px"` (L410); address drawer (L501) is raw `v-row cols="7"/"5"` instead of `MpFormGrid :cols="2"` |
| 13 | `src/views/Retail/PosPreview.vue` | POS simulator; fields scattered across ~8 panels, two flat MpDialogs (L2304, L2321); zero v-card |
| 7 | `src/views/Marketing/LandingPageEditor.vue` | Page Settings drawer (L470) is a flat 6-field list — SEO / URL / tracking are three obvious groups |
| 5 | `src/views/Marketing/AcquisitionForms.vue` | Filter menu (L352) `text-subtitle-2 … mb-3` heading + `mb-3` selects; embed dialog (L473) hand-rolls two uppercase caption headings |
| 5 | `src/views/DashboardView.vue` | Date-range menu (L657) bespoke `.dashboard-date-menu__fields` + `mt-3` |
| 4 | `src/views/Settings/pages/RolesPermissionsPage.vue` | Drawer (L300): flat 4-field list |
| 4 | `src/views/Products/Reservations.vue` | Only file with `MpFormSection` but **no `MpFormGrid`** — fields raw-stack (L262, L280) |
| 3 | `src/views/Merchandising/PinningEditor.vue` | Three floating filter fields; hand-rolled pane headings |
| 3 | `src/views/Merchandising/SearchPinningEditor.vue` | Near-identical twin of the above |
| 3 | `src/views/Merchandising/SearchBlacklisting.vue` | Two inline fields in a card (L114), no grid |
| 2 | `src/views/Marketing/CampaignTags.vue` | Two drawers with bare fields |
| 2 | `src/views/Marketing/DataJourneys.vue` | Drawer (L204): name + textarea, no grid |
| 2 | `src/views/Commerce/Fulfillments.vue` | Filter menu heading `text-subtitle-2 … mb-3` (L216) + bare select |
| 2 | `src/views/AudienceView.vue` | Two loose fields (also containment offender, §2) |
| 2 | `src/views/Settings/pages/AuditLogPage.vue` | Two filter fields, no container |
| 2 | `src/components/dashboards/DashboardFormDialog.vue` | Flat pair in MpDialog |
| 2 | `src/components/plg/PlgTalkToSalesDialog.vue` | Flat pair in MpDialog |

Recorded exemption (do not touch): `AppBar.vue` mobile search field (DESIGN_AUDIT P6-7).

### 1c. Residual hand-rolled section headings (outside 1b)

Case-by-case — several are legit preview-panel labels, not form sections:
`Settings/Billing.vue:32` · `Marketing/CreateTransactional.vue:192` · `CreateSmsCampaign.vue:305` · `CreateTransactionalSms.vue:213` · `CreateJourney.vue:252,314` · `DynamicContent.vue:194` · `EmailContentEditor.vue:151` · `FormBuilder.vue:623` · `SalesChannels/StoreThemeCode.vue:201,208` · `Integrations/Integrations.vue:60` · `DaVinci/DaVinciAI.vue:256` · `DaVinciDashboard.vue:22` · `components/marketing/JourneyAddStepMenu.vue:62` · `components/analytics/ReportFieldPicker.vue:92,106` · `components/copilot/DvContentCard.vue:30`

### 1d. Mixed-in-one-file (uses MpFormGrid but also hand-rolls a v-row field grid somewhere)

`Commerce/CreatePromotion.vue` · `Settings/Profile.vue` · `Products/{ProductEditor,Inventory,FeedTemplateEditor,ProductImportWizard,PriceListEditor,CollectionEditor}.vue` · `Contacts/ContactDetail.vue` · `Retail/{Registers,Receipts}.vue` · `SalesChannels/{StoreNavigationMenuEditor,StoreContentEditor,SalesChannelLocations,CreateSalesChannel}.vue` · `Marketing/{CreateJourney,LandingPageTemplates}.vue`
⚠ Some of these `v-row`s are card/tile grids (fine) — verify each before rewriting.

---

## 2. Containment — sections without visual separation

The rule (`CLAUDE.md`): every logical section in `v-card variant="flat" border rounded="lg"` with `component.card.*` insets. Reference exemplar: **`src/views/Products/ProductEditor.vue`** (8 identical section cards, each `MpFormSection` + `MpFormGrid`, zero margin utilities). `CreateCampaign.vue` applies the same recipe per wizard step.

### 2a. The big one: two competing recipes in Settings

- `SettingsSection` (bespoke `<section>`, visually equivalent surface, **third** heading language): `GeneralPage`, `AccountDefaultsPage`, `ServicePage`, `RoleDetailPage`, `NotificationsPage`, `IntegrationsPage`, `AiSettingsPage`, `DnsSetupPage`, `ConnectionsPage`
- Card recipe, same module: `RolesPermissionsPage`, `UsersPermissionsPage`, `AuditLogPage`, `Profile`, `Billing`, `Users`
- Five `SettingsSection` pages have an `MpFormGrid` **outside any card**: General, AccountDefaults, Service, RoleDetail, Connections

### 2b. Off-recipe cards (mixed patterns within a page)

| File | Issue |
|---|---|
| `Commerce/CommerceCloudLanding.vue` | Whole page `rounded="xl"` — wrong radius stop (2/2 cards) |
| `AudienceView.vue` | `<v-card class="bento-card bg-surface pa-0 pb-2">` — no flat, no border, no rounded |
| `Products/ProductImportWizard.vue` | 3/8 cards tonal stat tiles floating above bordered sections |
| `Marketing/CreateCampaign.vue` | Nested schedule cards `variant="outlined" pa-4 mb-3` inside step cards (L698/L724); last `mb-3` in file |
| `Marketing/CreateSmsCampaign.vue` | Same outlined schedule cards (L269/L279) |
| `Commerce/CustomGiftCards.vue` | 2/3 `color="primary" variant="tonal"` preview cards |
| `DaVinci/DaVinciAI.vue` | Borderless `flat rounded="lg"` hero above 5 bordered cards (L144) |
| `Marketing/CreateJourney.vue` | Borderless hero + `mb-6` (L181) |
| `Marketing/CreateAbCampaign.vue` | `variant="outlined"` group cards (L444) |
| `Plg/CheckoutView.vue` | Borderless `provisioning-card` (L217) |
| `Integrations/Integrations.vue` | `variant="flat" border` with **no `rounded="lg"`** (L44) |
| `Commerce/CreatePromotion.vue` | Tonal alert-card inside the form grid (L269) |
| `Products/Inventory.vue` | Tonal banner (L461) |

⚠ Judgment call per site: tonal cards that are genuinely *status/alert* surfaces stay; those doing *containment* duty converge.

### 2c. Hand-rolled bordered boxes in scoped CSS (inner sub-boxes, lower priority)

`SalesChannels/SalesChannelDetail.vue` (5) · `Billing/BillingView.vue` (4) · `Commerce/CommerceCloudLanding.vue` (3) · `Settings/pages/ServicePage.vue` (2) · `Retail/PosPreview.vue` (2) · `Contacts/ContactDetail.vue` (1) · one each in `Settings/pages/{UsersPermissions,Notifications,Integrations,DnsSetup,Connections,AiSettings}Page.vue`

### 2d. Parallel containment skins

- `src/styles/retail-widgets.scss` `.retail-widget-card`: `!important` colors **plus `box-shadow: var(--elevation-raised)`** — violates the no-elevation rule. Its comment says it mirrors a `merch-*` twin — check and fix both.

### 2e. Legitimately exempt zero-card views (verified, do not touch)

`Marketing/{ContentLanding,MarketingLanding}.vue` (ModuleLandingPage) · `Retail/{Hardware,RetailSettings}.vue` (MpComingSoonTiles) · `Settings/pages/{Security,PrivacyConsent,TrackingAnalytics,StoreProfile,SalesChannels,PaymentAccount}Page.vue` (SettingsPlaceholder) · builder-shell routes (`EmailContentEditor`, `LandingPageEditor`, `StoreThemeBuilder`, `StoreThemeCode`) · `DaVinci/{DaVinciCopilot,DaVinciExperience}.vue` · `Plg/SignupView.vue` · `Merchandising/MerchandisingSidebar.vue`

---

## 3. Action menus — inconsistent popover patterns

### 3a. Canonical status

`MpRowActionsMenu` (kebab `more-vertical` x-small + `v-list density="compact" min-width="180"`, required `ariaLabel`, optional `itemLabel`): **50 instances / 47 view files**, all prop-hygienic. 18/50 use `itemLabel` (per-row accessible names); 32 still static (tracked as UX-004 in page-tracker).

**Component gaps blocking a clean migration:**
1. No `location` prop — every hand-rolled kebab uses `location="bottom end"`; swapping shifts panel alignment
2. No `@click.stop` path — fallthrough attrs land on VMenu, not the trigger; 4 sites need it (clickable rows/cards)
3. No `size` escape hatch — ~8 pages use `size="small"`; migration standardizes down (visual change, likely desirable)
4. No `role="menu"`/`menuitem` — SRs announce a listbox (self-documented gap in its story)
5. Danger is color-only, and the **story file itself demonstrates the kebab-case `aria-label` footgun** it warns about (Variants/Sizes/States stories)
6. Trigger relies on Vuetify for `aria-haspopup`/`aria-expanded` (works, but only `AppBar.vue:478` and `PlgTrialChip.vue:78` set them explicitly)

### 3b. Hand-rolled action menus to migrate (22)

**Row kebabs — direct swaps** (all: kebab trigger → v-list, most with divider + `text-error` delete):
`Merchandising/Collections.vue:168` · `FieldTransformations.vue:213` · `PageRedirects.vue:244` · `RecommendationEngines.vue:207` (divider has inline `opacity:0.4`) · `Synonyms.vue:307` · `DefaultMerchandising.vue:158,216` · `Dashboards/DashboardsList.vue:348` · `Settings/Users.vue:114` (**`more-horizontal`**, Remove has no divider) · `Retail/Registers.vue:233` (**`more-horizontal`**, `@click.stop`, Deactivate has no danger styling) · `SalesChannels/SalesChannelsList.vue:227` (`@click.stop`, wraps list in an extra v-card) · `Merchandising/EngineEditor.vue:489` · `RuleEditor.vue:346`

**Header / panel kebabs — same anatomy:**
`Contacts/ContactDetail.vue:177` (default size) · `GetStarted.vue:98` · `Service/Tickets.vue:350` · `SalesChannels/StoreThemeBuilder.vue:622` · `components/marketing/JourneyFlowColumn.vue:86` (`@click.stop`, extra v-card wrapper, `base-color="error"` no divider) · `components/copilot/DvHistoryDrawer.vue:134` (bespoke `.dv-history__menu-danger`)

**Mixed-content kebabs — migrate chrome, keep bespoke body:**
~~`components/dashboards/DashboardWidgetActionMenu.vue:21` (embedded v-btn-toggle row)~~ ✓ done 2026-08-31 (recomposed on MpRowActionsMenu + MpSegmentedControl) · `components/MpDaVinciBot.vue:1053` (trailing check icons) · `Products/ProductsList.vue:382` (**`ellipsis`** glyph, v-list-subheader, all-destructive list)

**Fully hand-rolled (no v-list at all):**
`DashboardView.vue:571` — `Actions ▾` → raw `v-card.mp-menu` with `<button class="mp-menu-row">` rows + `.mp-menu-row--danger`. ⚠ page-tracker records this grouped menu as a *deliberate module-01 redesign* — align panel chrome/danger recipe, keep the grouping and labeled trigger. ✓ chrome aligned 2026-08-31: both twins retokenized onto `component.menu.*` (36 floor / 6 block / 14-12 type) and the Gradient copy's `role="menu"`/`menuitem`/`aria-haspopup` restored; grouping + labeled trigger kept as designed.

### 3c. Labeled-button dropdowns (grey zone — standardize panel chrome only, keep triggers)

`Products/Collections.vue:151` · `ProductImportLogs.vue:77` · `ProductsList.vue:350,362` · `Merchandising/DefaultMerchandising.vue:113` · `EngineEditor.vue:388` · `Settings/pages/UsersPermissionsPage.vue:441` · `Service/Tickets.vue:450`

### 3d. Legit non-action popovers — leave alone

Pickers/filters (`MpFolderSelect`, `MpDateRangeSelect`, `MpDataTableToolbar` quick-filter + columns, `MpSectionRail` switcher) · app shell (`AppBar` palette/quick-create/assistant/user menus, `AppSidebar` flyout) · 8 color-picker menus (FormBuilder, landing panels, ChatbotBuilder) · builder palettes (`JourneyAddStepMenu`, `LandingInsertionPoint`, StoreThemeBuilder catalog) · info popovers (`PlgTrialChip`, JourneyBuilder validation) · dashboard switcher + date-range panels.

### 3e. Destructive-item treatment — five competing conventions

1. `class="text-error"` on the item — documented convention, 54 uses
2. `base-color="error"` — 3 uses, incl. `Analytics/CustomReports.vue:217` *inside* an MpRowActionsMenu (contradicts its own docs)
3. Bespoke scoped classes coloring title only: `.dv-panel__menu-danger`, `.dv-history__menu-danger`
4. `.mp-menu-row--danger` (DashboardView) — the only one with a hover tint
5. Divider drift: canonical `<v-divider class="my-1" />` vs `style="opacity: 0.4"` inline (6 places) vs bare `<v-divider />` vs **missing entirely**: `Marketing/AcquisitionForms.vue:301,383`, `EmailContent.vue:70`, `LandingPages.vue:206` (all substitute `mt-1`), `Settings/Users.vue:121`, `JourneyFlowColumn.vue:97`

Also: `Retail/Registers.vue:240` "Deactivate" has no danger/warning styling though the bulk-bar twin uses `color="warning"` — behavior/copy call, flag not fix.
Unrelated find: `Showcase/sections/ShowcaseWall.vue:51` unlabeled icon button (out of scope, noted).

---

## 4. Side drawers & dialogs

### 4a. Canonical shells — what's already handled centrally

`MpFormDrawer` (59 instances / 51 files) and `MpDialog` (31 / 26) share `component.dialog.*` end-to-end: 20px header/body/footer bands (16 compact), body-only scroll with scroll-edge shadows, sticky header + footer by construction, body flex-gap 16 (the shell owns child spacing), `role="dialog"` + `aria-modal` + `aria-labelledby`, labeled close button, focus trap + focus restore + Escape, `guarded` close. `MpConfirmDialog`: 120 instances, nothing to fix.

**Shell asymmetries (drawer vs dialog):** drawer header title is a `div` not a heading element; no `aria-describedby` (dialog has it); no `#headerActions`/`eyebrow`/`#lead`/`flush`.

### 4b. Drawer/dialog bodies with content-level issues (worst-first)

**Hand-rolled section headings + stacked margins:**
| File | Issue |
|---|---|
| `Retail/Registers.vue:262–331` | Detail drawer: three `text-subtitle-2 font-weight-bold mb-2` pseudo-headings + `mb-5`/`mb-4` on five siblings — worst in app |
| `components/analytics/ReportFieldPicker.vue:74–139` | Two uppercase-caption `h3`s instead of MpFormSection; no grid |
| `Marketing/AcquisitionForms.vue:470–483` | Embed dialog: two caption headings + `mb-2` textareas |
| `Service/ChatbotBuilder.vue:843–872` | Publish dialog: bold subtitle heading |
| `Marketing/DynamicContent.vue:192–204` | Per-rule card: caption heading + `mb-3` + hand-rolled `pa-4`/12px-radius surface |
| `components/marketing/CampaignContentEditor.vue:112` | `h3 mb-0` + `mb-4` wrapper in fullscreen MpDialog |
| `Commerce/PurchasableGiftCards.vue:462` | Expansion-panel title styled unlike the four MpFormSections above it |
| `Billing/BillingView.vue:548–555` | Scoped CSS margins on addon-drawer children |

**Stray margins/insets the shell already owns:**
`ChatbotBuilder.vue:663` (`mb-5` wrapper per textarea — 20px vs the shell's 16) · `CustomGiftCards.vue:444–449` view drawer (`pa-5 mb-5` + `mb-4`/`mb-1`; no form primitives — sibling create drawer at 320–435 is the good pattern) and `:330–336` preview card · `Retail/Staff.vue:248` (`mt-1`, `pa-3` cards breaking the left edge) · `Registers.vue:359` pair drawer · `Contacts/Segments.vue:275` (`mt-1`, minor) · `Marketing/DataJourneys.vue:212` (`mt-3 pa-3` mini-preview) · `Products/Inventory.vue:461` (`pa-4` card as body child) · `AcquisitionForms.vue:421–428` template picker · `MpManageFoldersDrawer.vue:118–127` (hand-rolled `ml-6` nesting indent)

**Flat bodies, no form primitives (will drift):**
`WidgetWizardDrawer.vue:173` · `RolesPermissionsPage.vue:300` · `ContactTags.vue:117` · `SecureLists.vue:119` · `CampaignTags.vue:133,154` · `LandingPageEditor.vue:470` · `OptimizeOnOpen.vue:130` · `PreferencePages.vue:221` · `Settings/Users.vue:129` · `CreateDraftOrder.vue:501`

### 4c. Raw-primitive violations

- `Settings/DesignSystemDemo.vue:121` — raw `v-navigation-drawer` (width 420, off-ramp): **no role/aria-modal/labelledby, no focus trap, no Escape, no header band**. Rebuild on MpFormDrawer.
- `AppBar.vue:782` — raw fullscreen `v-dialog` mobile search: recorded exemption (P6-7); leave, note in GAPS.
- No other raw `v-dialog`/`v-navigation-drawer` in scope.

### 4d. `guarded` coverage (flag only — behavioral)

3/59 drawers and 2/31 dialogs set `guarded`. Long dirty-state forms without it: `CustomGiftCards`, `PurchasableGiftCards`, `ContactFields`, `SearchRules`, `Tickets`, `InviteUsersDrawer`, `UserAccessDrawer`. → GAPS.md, not this pass.

### 4e. Exempt special-purpose surfaces (verified)

Copilot dock (`App.vue:225`, persistent, correctly `:inert`) · `MpDaVinciBot` panel (chat composer ≠ form footer) · `DvHistoryDrawer` (re-implements the trap correctly; duplication → GAPS) · `MpBuilderShell` asides · `JourneyBuilder` `.jb-palette`/`.jb-panel` (in-flow; 380px off-ramp noted) · `MpSectionRail` · `MpBuilderPreviewDialog` (documented `flush` use).

---

## 5. Cross-page spacing/alignment inconsistencies (summary)

- Field margins vs shell/grid gaps: residual `mb-*` on fields double the rhythm (16→32) — §1b/§4b lists
- Three section-heading languages: `MpFormSection` vs `SettingsSection__title` vs hand-rolled caption/subtitle divs
- Divider treatment in menus: 3 variants (§3e.5)
- Kebab glyph: `more-vertical` vs `more-horizontal` vs `ellipsis`; trigger size `x-small` vs `small`+`density`
- Radius drift: `rounded="xl"` (CommerceCloudLanding), missing `rounded` (Integrations), 12px hand-rolled (DynamicContent rule cards)
- Elevation: `.retail-widget-card` box-shadow vs the border-only rule
- Drawer width off-ramp: DesignSystemDemo 420, `.jb-panel` 380

## 6. Browser spot checks (dev server, 1440×900, light theme)

1. **Retail/Registers detail drawer** — confirmed worst-offender status: "Device" / "Paired hardware" / "Offline queue" render as small grey pseudo-headings floating between bordered sub-boxes; the gap above each heading varies (status row → Device is wider than Device box → Paired hardware); the sub-boxes are nested boxes inside an already-bordered drawer, exactly the "nested boxes" anti-pattern. Header itself (title + subtitle + X) is the correct MpFormDrawer band.
2. **Settings/General vs Settings/Roles** — the two containment recipes are **visually near-identical at runtime** (bordered rounded surfaces, headings, same page background). The `SettingsSection` problem is code-level (parallel component, third heading spec, grids outside cards on 5 pages), not a visible clash → informs the Phase 2 recommendation: unify internals/heading spec rather than rewrite 9 pages.
3. **Merchandising/Collections row kebab (hand-rolled)** — opens `bottom end` under the trigger; items have leading icons; the divider before Delete is nearly invisible (the inline `opacity:0.4`); Delete is red icon + red text. Panel chrome is close to canonical — migration is mechanical once the component gains `location`.
4. **Contacts/AllContacts row kebab (canonical MpRowActionsMenu)** — Edit / Delete(red): **no divider before the destructive item**, confirming the divider convention is unevenly applied even inside canonical usages. Menu alignment comparable to the hand-rolled one at this trigger position; the missing `location="bottom end"` matters at right-edge columns.
5. **CustomGiftCards row kebab** — View / Disable / ─ / Delete: divider present here; three-state inconsistency with #4 visible live.
6. Baseline console noise matches page-tracker's recorded warnings (Vuetify theme deprecation + router next() warning); zero errors on the five pages visited.

## 7. Corrections from spot checks

- **`AudienceView.vue` is unrouted and unreferenced** (no router entry, no imports) — dead code. Dropped from all fix lists; flagged here per house rules (mention, don't delete unasked).
- `DashboardView.vue`'s grouped `Actions ▾` menu is a **deliberate module-01 polish redesign** (page-tracker row 2) — treat as "align panel chrome + danger recipe, keep grouping/trigger", not a kebab conversion.
