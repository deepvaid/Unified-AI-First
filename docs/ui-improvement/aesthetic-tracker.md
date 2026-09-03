# Aesthetic Pass Tracker

<!-- STATE FILE — the aesthetic-pass skill parses this. Keep the table format intact. -->
<!-- Generated 2026-09-02 from page-tracker.md (one row per view, all rows pending). page-tracker.md is the polish-module skill's state and is never edited by the aesthetic pass. -->
<!-- Status: pending | done | done-no-change | skipped | blocked. Working wave = first wave containing a module not done. -->
<!-- Method: docs/ui-improvement/aesthetic-pass-prompt.md · Look: aesthetic-recipe.md · Correctness: polish-playbook.md -->

## Defaults

- accountId `2000290` · dashboardId `2000290-home` · journeyId `1` · channelId `pos-store` · locationId `loc-bondi` (from page-tracker.md).
- Console baseline: zero errors; two known warnings (`[Vuetify UPGRADE] theme.global.name.value` deprecation, `[Vue Router warn]: The next() callback`). Bar = zero NEW errors.

## Wave 1

### Module 04 — Products   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Products/ProductRecommendations.vue | /commerce/2000290/product_recommendations | standard | done | 2c7c9ce | row icons → 16; py-10 off empty states; import summary → dl.mp-label-value; warn-ink/surface tokens; responsive column priority on 3 tables |
| 2 | Products/ProductsList.vue | /commerce/2000290/products | standard | done | e3c132f | header menus raw v-list-item → MpMenuItem in role=menu; py-10 off; thumb fallback tokens; column priority |
| 3 | Products/TaxCategories.vue | /commerce/2000290/product_tax_category | standard | done | 9d3cf4d | Export → outlined (one primary CTA); chip icon 13 → 16; py-10 off; .font-mono on token; column priority |
| 4 | Products/Collections.vue | /commerce/2000290/products/collections | standard | done | a8df279 | New-collection menu → MpMenuItem/role=menu; chip icon → 16; py-10 off; column priority |
| 5 | Products/Inventory.vue | /commerce/2000290/inventory | standard | done | 55dae7f | Export → outlined; thumb 2×!important → v-avatar + tokens; v-btn-toggle → MpSegmentedControl; icons → 16; low-stock on --warn-ink; inline numeric styles → .num; column priority |
| 6 | Products/Reservations.vue | /commerce/2000290/products/reservations | standard | done | 5305fc6 | dialog stock summary → dl.mp-label-value; icon → 16; qty on .num; py-10 off; dead #actions slot removed; column priority |
| 7 | Products/ProductWizard.vue | /commerce/2000290/products/new · /products/1/edit | builder | done | 1be3aa0 | builder: dropzone rgba dashed → 1px dashed --border-strong; fixed non-existent --mp-border-subtle ref; Remove-option tooltip |
| 8 | Products/KitWizard.vue | /commerce/2000290/products/kits/new | builder | done | 9e6575f | builder: v-alert → MpAlert; inline widths → scoped classes on space tokens; totals on .num; Remove tooltip; py-8 off empty state |
| 9 | Products/ProductImportWizard.vue | /commerce/2000290/products/import/new/csv · /import/new/ftp | builder | done | 9a9cd7e | builder: dropzone token fix; v-alert → MpAlert; inline 260/180px widths → toolbar/menu width tokens |

### Module 05 — Commerce   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Commerce/CommerceCloudLanding.vue | /accounts/2000290/commerce-cloud | standard | done | 9a0295c | full CSS retokening; pa-8 → card.paddingSpacious; nested bordered tiles → --surface-secondary fills; uppercase 11px labels → sentence-case 12; !important CTA padding removed; media queries on Sass breakpoints |
| 2 | Commerce/SalesOrders.vue | /commerce/2000290/orders | standard | done | 51eb68a | Export → outlined; expanded-row panel on tokens; dots 6 → 8px on theme colours; inline !important → scoped rule; :deep(.mp-page-subtitle) removed; py-10 off MpEmptyState |
| 3 | Commerce/DraftOrders.vue | /commerce/2000290/orders/drafts | standard | done | ae83ea9 | Export → outlined; py-10 off MpEmptyState |
| 4 | Commerce/Fulfillments.vue | /commerce/2000290/fulfillments | standard | done | d34c3a0 | Export/Print → outlined; rgba stage pill → tabular figure; filter drawer drops pa-4 wrapper; span@click → router-link; stage chips role=button + aria-pressed; chips sm; tabular-nums |
| 5 | Commerce/Coupons.vue | /commerce/2000290/coupons · /promotions · /custom_gift_cards · /purchasable_gift_cards | standard | done | 4a29203 | Export → outlined; filter drawer drops pa-4 + ad-hoc heading; inline widths → scoped classes; mono chip on token. Row note is wrong: /custom_gift_cards and /purchasable_gift_cards are separate views (CustomGiftCards.vue, PurchasableGiftCards.vue) — need their own rows, not audited |
| 6 | Commerce/CreateDraftOrder.vue | /commerce/2000290/orders/drafts/new · /drafts/1 | builder | done | 779a3bd | builder: all inline styles → scoped token classes; hairlines --border-subtle; icon 17 → 16, circle → circle-dashed; tooltips on qty/remove; media queries on $mp-layout-breakpointSplit |
| 7 | Commerce/CreatePromotion.vue | /commerce/2000290/promotions/new · /promotions/1/edit | builder | done | 77764ef | builder: :deep(.mp-page-header) → density=compact; border !important → own classes; 2× v-btn-toggle → MpSegmentedControl; v-alert → MpAlert; mono field on token |
| 8 | Commerce/CustomGiftCards.vue | /commerce/2000290/custom_gift_cards | standard | pending |  | discovered in wave 1 — listed as a Coupons alias in page-tracker but is its own view; audit in a follow-up wave |
| 9 | Commerce/PurchasableGiftCards.vue | /commerce/2000290/purchasable_gift_cards | standard | pending |  | discovered in wave 1 — same as row 8 |

### Module 10 — Service   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Service/Tickets.vue | /accounts/2000290/service | standard | done-no-change |  | already compliant (reference implementation); 3 widths + dark, 0 overflow at 375. Row URL `/chatbot` is stale — it serves ChatbotList.vue, not Tickets.vue; not audited as a row |
| 2 | Service/ChatbotBuilder.vue | /accounts/2000290/chatbot/1 | builder | done | 554a538 | builder profile: Mp* headings/option cards/segmented control/status chip/empty state, tokens for colours+weights, tooltips/aria on icon buttons, focus rings, 2 `!important` + inline max-width removed; fixed settings panel collapsing at ≤1024 |
| 3 | Service/ChatbotList.vue | /accounts/2000290/chatbot | standard | pending |  | discovered in wave 1 — page-tracker lists /chatbot as a Tickets alias but it serves this view (router index.ts:329); audit in a follow-up wave |

### Module 12 — App Store   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Integrations/Integrations.vue | /accounts/2000290/app_store | standard | done | 04441a0 | card insets on component.card.*; rgba/!important hairline + hover-lift removed; section-title/meta-label; 40 accent disc + 20 icon; MpStatusChip sm; search-aware MpEmptyState |

### Module 14 — Billing & Misc   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Billing/BillingView.vue | /accounts/2000290/billing | standard | done | ba50c9d | convention root + gap-5; v-tabs+:deep → MpFilterTabs; px → tokens; nested bordered tiles → tonal; MpListRow rows; dl.mp-label-value; banner !important removed; one flat primary CTA |
| 2 | Settings/DesignSystemDemo.vue | /accounts/2000290/design-system | standard | done | 7259463 | light touch: .ds-card on component.card.padding/gap; card titles → .mp-section-title; 12px literal → token; demo checkboxes aria-label |

## Wave 2

### Module 01 — Dashboard   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Dashboards/DashboardsList.vue | /accounts/2000290/dashboards | standard | done | adddc6e | convention root (h-100 d-flex flex-column gap-5); link weight/colour + focus ring on tokens; star 14 → 16; phone media query on $mp-layout-breakpointCompact; cell padding on table.cellPaddingInlineCompact |
| 2 | DashboardView.vue | /accounts/2000290/dashboard · /dashboard/2000290-home | standard | done | 73f493e | 2 raw v-alert → MpAlert; date-range pill → plain tonal small (7 !important + 4 :deep deleted); refresh button 3 !important deleted; focus rings → --focus-ring; rgba hovers → surface/accent/neg tokens; h1 on text.pageTitle; 640/960 queries on Sass breakpoints. Bespoke header kept (roadmap). Left: shell-bleed negative margins mirror .mp-main-shell literals; 200px date-preset column needs a token |
| 3 | Analytics/LiveView.vue | /accounts/2000290/analytics/live_view | standard | done | e4ca3e4 | 6 card roots pa-5/pa-6 → .live-card on card.padding/gap; 7 ad-hoc titles → h2.mp-section-title; funnel values on text.kpiValue; 3 hand-rolled rows → MpListRow; rgba literals → token pairs; search on toolbar.searchMinWidth. All 18 !important kept — every one is a Leaflet third-party override |

### Module 02 — Analytics (Reports)   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Analytics/MonthlyTotals.vue | /accounts/2000290/analytics/monthly_totals | standard | done | cccb24a | py-10 off MpEmptyState; revenue column drops text-primary → font-weight-medium; per-column weight/muted treatments removed |
| 2 | Analytics/OrdersReport.vue | /accounts/2000290/analytics/orders | standard | done | b27a41d | py-10 off MpEmptyState |
| 3 | Analytics/DispatchedOrders.vue | /accounts/2000290/analytics/dispatched_orders | standard | done | dd34195 | py-10 off MpEmptyState. Observation: refunded POS row renders "$-97.90" via template literal — functional formatting, not touched |
| 4 | Analytics/SalesSummary.vue | /accounts/2000290/analytics/sales_summary | standard | done | d0110ca | card header/bar-list utilities → scoped classes on card.padding; ad-hoc title → MpSectionHeader with period description; 13px trend icons → 16; all px/rgba/gradient literals → tokens; @media 700 → $mp-layout-breakpointCompact with one shared grid |
| 5 | Analytics/ERFMReport.vue | /accounts/2000290/erfm_report | standard | done | 23bfddc | 200px date fields → menu.minWidth; duplicate scoped .num deleted; @media 599 → breakpointCompact. 320px chart height left (no token — proposal) |
| 6 | Analytics/CampaignReports.vue | /accounts/2000290/reports | standard | done | 11e85b2 | py-10 off MpEmptyState |
| 7 | Analytics/RecurringCampaignReports.vue | /accounts/2000290/analytics/recurring_campaign_reports | standard | done | cf11167 | 8 fixed columns side-scrolled at 375 (619px in 311) → useResponsiveTableHeaders with occurrence child rows following visible columns; py-10 off MpEmptyState; rgba fallback → --on-surface-muted |
| 8 | Analytics/ABCampaignReports.vue | /accounts/2000290/analytics/ab_campaign_reports | standard | done | 6812512 | 11 fixed columns (880px at 375) → useResponsiveTableHeaders with variant child rows; py-10 off MpEmptyState; rgba fallback → --on-surface-muted |
| 9 | Analytics/TestCampaignReports.vue | /accounts/2000290/analytics/test_campaign_reports | standard | done | 9300581 | py-10 off MpEmptyState. Observation: renders empty on default Last 30 days — mock dates aged out |
| 10 | Analytics/WebsiteReports.vue | /accounts/2000290/analytics/website_reports | standard | done | 77aa25c | py-10 off MpEmptyState; one weight treatment (Pageviews keeps medium) |
| 11 | Analytics/JourneyReports.vue | /accounts/2000290/analytics/journey_reports | standard | done | 8e2c948 | py-10 off MpEmptyState |
| 12 | Analytics/CustomReports.vue | /accounts/2000290/analytics/custom_reports | standard | done | da3815a | useResponsiveTableHeaders (Type ≥md, Updated ≥sm); syncAriaSort reads visible header set; dead .crl-type-filter + empty #actions slot deleted |
| 13 | Analytics/TransactionalReports.vue | /accounts/2000290/analytics/transactional_reports | standard | done | 8503c7c | py-10 off MpEmptyState. Observation: renders empty on default range — mock dates aged out |
| 14 | Analytics/LogInspector.vue | /accounts/2000290/analytics/log_inspector | standard | done | d37e212 | py-10 off MpEmptyState |

### Module 03 — Contacts (Audience)   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Contacts/AllContacts.vue | /accounts/2000290/contacts | standard | done | 0e7bb09 | identity cell / score / avatar literals → tokens; focus ring → --focus-ring; status chip flat → tonal; score dots on --pos/--warn/--neg; 599.98 query → $mp-layout-breakpointCompact; raw v-alert → MpAlert; inline min-width → w-50. 48px select-column residual at 375 accepted (product call) |
| 2 | Contacts/ContactDetail.vue | /accounts/2000290/contacts/:contactId (see Defaults) | standard | done | 0b0c398 | calc(100vh - 200px) split + two inner scrollers deleted (page scrolls as one); one primary CTA; pa-5 → .dc-card on card.padding; stat strip box-in-box → --surface-secondary; headings → .mp-section-title; icons → 16 / 8px dots; eRFM → dl.mp-label-value; 340px sidebar → layout.inboxListWidth (proposal: dedicated token); KPI grid → v-row; scoped !important removed |
| 3 | Contacts/ContactLists.vue | /accounts/2000290/lists | standard | done-no-change |  | already compliant |
| 4 | Contacts/Segments.vue | /accounts/2000290/segments | standard | done | 1eb6e11 | raw v-alert → MpAlert live=off; rule block rgba → --surface-secondary on tokens; dashed note → --border-subtle; tooltips on Remove icon buttons |
| 5 | Contacts/ContactFields.vue | /accounts/2000290/contact_fields | standard | done | c21546a | check icon 18 → 16; default-fields head utilities → card.padding; inline max-width → toolbar.searchWidth class |
| 6 | Contacts/ContactTags.vue | /accounts/2000290/tags | standard | done-no-change |  | already compliant |
| 7 | Contacts/RelationalTables.vue | /accounts/2000290/relational_tables | standard | done | d6b241b | column block rgba → --surface-secondary on card.paddingCompact/radius-12; tooltip on Remove column |
| 8 | Contacts/SQLQueries.vue | /accounts/2000290/sql_queries | standard | done | 26395c1 | name-button colour → --accent-default; SQL textarea → --mp-fontFamily-mono |
| 9 | Contacts/SecureLists.vue | /accounts/2000290/secure_lists | standard | done-no-change |  | already compliant |
| 10 | Contacts/WebTracking.vue | /accounts/2000290/web_tracking | standard | done | fdf1d34 | Copy Script is the one primary CTA; pa-6 → card.padding; heading → .mp-section-title; code block rgba → --surface-secondary + mono tokens |

## Wave 3

### Module 06 — Merchandising (MerchCloud)   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Merchandising/MerchandisingChannelSelector.vue | /commerce/2000290/merchandising | standard | done | 882c649 | row corrected: the route serves MerchandisingChannelSelector.vue (no MerchandisingHome.vue exists). 10px circle health icon → 8px token dot with label; py-2 cell dropped. Shell MerchandisingLayout.vue (wraps rows 2–8) also done in ab6f8ba: hand-rolled -32/-36 margins + calc(100vh) → .mp-frame-fill; pa-8 → card.paddingSpacious; media queries on Sass breakpoints |
| 2 | Merchandising/SearchPreview.vue | /commerce/2000290/merchandising/search/preview | standard | done | 1bc62e7 | min-height="420" literal removed |
| 3 | Merchandising/Synonyms.vue | /commerce/2000290/merchandising/search/synonyms | standard | done | a7ae071 | hand-rolled bulk bar (rgba + px) → MpFloatingBulkBar; icon 14 → 16; check-circle → circle-check |
| 4 | Merchandising/PageRedirects.vue | /commerce/2000290/merchandising/search/redirects | standard | done | 3dd17d1 | hand-rolled table header → MpDataTableToolbar; card insets → component.card.*; title → .mp-section-title; tooltip + aria-expanded on collapse; link colour/420px → text-primary/state.measure |
| 5 | Merchandising/Collections.vue | /commerce/2000290/merchandising/collections | standard | done | 43cea12 | <a @click> → router-link; status chip flat → tonal; focus ring |
| 6 | Merchandising/DefaultMerchandising.vue | /commerce/2000290/merchandising/default-merchandising (+ /pinning/:ruleId, /rules/:ruleId) | standard | done | 3355cc4 | raw v-list-item menu → MpMenuItem role=menu; py-10/12 off MpEmptyState; phantom font-weight-semibold → .x-strong; chips tonal. Sub-editors: PinningEditor 75dfee1 (dashed empty box → MpEmptyState, widths → toolbar tokens, 860 media → breakpointSplit, Delete → outlined); RuleEditor b7c34d5 (pa-5 → card.padding, toggle literals → tokens + focus ring, preview 380 → inboxListWidth, aria-pressed on expand) |
| 7 | Merchandising/RecommendationEngines.vue | /commerce/2000290/merchandising/recommendations (+ /:engineId editor) | standard | done | 190f65e | list already compliant (no change). EngineEditor (wizard) 190f65e: raw v-btn-toggle → MpSegmentedControl sm; fallback menu → MpMenuItem; Da Vinci callout rgba → --surface-secondary/--accent-soft; titles → .mp-section-title; step structure untouched. MerchProductCard 03e9506: rgba literals → surface/border/accent pairs, 700 → fontWeight-bold, placeholder icon 28 → 20 |
| 8 | Merchandising/FieldTransformations.vue | /commerce/2000290/merchandising/fields | standard | done-no-change |  | already compliant |

### Module 07 — Retail   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Retail/RetailHome.vue | /commerce/2000290/retail | standard | done | 124b800 | bespoke h1 header → MpPageHeader; inline gap/font → tokens; icons 14 → 16; RetailLayout.vue shell margins/paddings tokenised in the same commit (640 inset exactly 22) |
| 2 | Retail/Registers.vue | /commerce/2000290/retail/registers | standard | done | c5d5aae | fleet tiles tokenised; hand-rolled offline warning → MpAlert warning with Sync action; status band → pos/neg/warn soft + ink pairs; inline styles removed; Export on control.height; mono → --mp-fontFamily-mono |
| 3 | Retail/Transactions.vue | /commerce/2000290/retail/transactions | standard | done-no-change |  | row is stale: no such file — the route renders Commerce/SalesOrders.vue (done in wave 1) |
| 4 | Retail/Staff.vue | /commerce/2000290/retail/associates | standard | done | cec6f35 | row corrected: route redirects to Retail/Staff.vue. inline cursor + px gap → utilities; Export on control.height; avatar drops text-white |
| 5 | Retail/PosPreview.vue | /commerce/2000290/retail/pos-preview | builder | done | ee7c422 | builder chrome only: 2× raw v-btn-toggle → MpSegmentedControl sm (icon segments, aria-label + tooltip); aria-labels on offline switch + location select; header/badge/stage px + #f59e0b → tokens. Device mock untouched; persistent scan/search kept |
| 6 | Retail/StockByLocation.vue | /commerce/2000290/retail/stock | standard | done-no-change |  | row is stale: redirect → Products/Inventory.vue?view=locations (wave 1) |
| 7 | Retail/BulkInventory.vue | /commerce/2000290/retail/inventory | standard | done-no-change |  | row is stale: redirect → Products/Inventory.vue?view=imports (wave 1) |
| 8 | Retail/Pricing.vue | /commerce/2000290/retail/pricing | standard | done-no-change |  | row is stale: redirect → Products/PriceLists.vue — PriceLists.vue is not in any tracker module; add as a follow-up row |
| 9 | Retail/Hardware.vue | /commerce/2000290/retail/hardware | standard | done-no-change |  | already compliant |
| 10 | Retail/RetailSettings.vue | /commerce/2000290/retail/settings | standard | done | 36030bd | dropped :md-cols="4" — 4 tiles now 2×2 (was 3 + orphan), matching Hardware |
| 11 | Retail/Payments.vue | /commerce/2000290/retail/payments | standard | done | 1ab4d78 | discovered in wave 3 (absent from page-tracker): pa-6 card roots → card.padding; inline max-width px → MpFormGrid cols=2 |
| 12 | Retail/Receipts.vue | /commerce/2000290/retail/receipts | standard | done | 7ba9020 | discovered in wave 3: card inset + mb-4 → ga-5 column; receipt mock rgba/px → border/on-surface-muted/mono/caption tokens, tabular-nums |
| 13 | Products/PriceLists.vue | /commerce/2000290/retail/pricing | standard | pending |  | discovered in wave 3 — served by the Retail pricing redirect but in no tracker module; audit in a follow-up |

### Module 08 — Sales Channels   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | SalesChannels/SalesChannelsList.vue | /accounts/2000290/sales_channels | standard | done | 53414ab | :deep(tbody td) 14px !important removed; cloud pills px/rgba → space/chip-radius/--pos-soft/--accent-soft pairs; row icons → 16; responsive headers |
| 2 | SalesChannels/CreateSalesChannel.vue | /accounts/2000290/sales_channels/new | standard | done | bb9e3ff | raw v-alert → MpAlert; bordered v-list review step → dl.mp-label-value. Router marks it builderShell (tracker said standard) — shell left alone, B/C/F5 applied inside step cards |
| 3 | SalesChannels/SalesChannelLocations.vue | /accounts/2000290/sales_channels/pos-store/locations | standard | done | 1d9dda9 | 3 hand-rolled stat cards → MpKpiCard; 2 raw v-alert → MpAlert; py-2 cell removed; chevron action tooltip; responsive headers. Channel status moved from MpStatusChip to the KPI subStat text |
| 4 | SalesChannels/SalesChannelLocationDetail.vue | /accounts/2000290/sales_channels/pos-store/locations/loc-bondi | standard | done | bfe6fef | 4 stat cards → MpKpiCard; address v-list → mp-label-value; card titles → .mp-section-title on card tokens; v-alert → MpAlert; responsive headers ×2 |
| 5 | SalesChannels/SalesChannelDetail.vue | /accounts/2000290/sales_channels/pos-store | standard | done | 633fe17 | ~100 px/weight literals → tokens; magic min-heights removed; hand-rolled text buttons → v-btn text; v-btn-toggle → MpSegmentedControl; circle → circle-dashed; copy tooltip. Bespoke identity header kept (roadmap) |
| 6 | SalesChannels/StoreThemeBuilder.vue | /accounts/2000290/sales_channels/retest-sales-notification/theme | builder | done | f111b40 | builder: focus rings → --focus-ring; overlay shadow → --mp-shadow-lg; hidden-row opacity → --text-disabled; rem/px/weights → tokens; rail icons 20 → 18, block icons → 16. Panel widths 324/340/44/190 stay literal (no builder-panel token yet) |
| 7 | SalesChannels/StoreThemeCode.vue | /accounts/2000290/sales_channels/retest-sales-notification/theme/code | builder | done | 9567046 | builder: rgba states → --surface-secondary/--accent-soft/--on-surface-muted; rail active bar → tonal fill; focus → --focus-ring; hairlines → --border-subtle; mono/px/rem → tokens; icons → 18/16 |

### Module 11 — Da Vinci   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | DaVinci/DaVinciAI.vue | /accounts/2000290/da-vinci · /da-vinci/dashboard | standard | done | a2ad617 | gap-5/ga-6 replace mb-6; card insets on component.card.*; hero h1 → h2 (MpPageHeader owns h1); titles → .mp-section-title; BETA chip inline px → chip-height-sm/fontSize-11; icon ramp normalised; rgba hairlines → --border-subtle; Dashboard-tab metrics compose MpKpiCard. Alias /da-vinci/dashboard spot-checked |
| 2 | DaVinci/DaVinciCopilot.vue | /accounts/2000290/da-vinci/copilot | builder | done | e04a399 | hand-rolled <button> CTA → v-btn with --dv-grad skin (6 px literals + :deep dropped); hairlines/surfaces → tokens; 48/16/260/64px → space/sectionRailWidth/appbarHeight tokens; history rail hidden below $mp-layout-breakpointSplit (chat pane was 115px wide at 375). **Decision for human:** history is unreachable on phones until an overlay trigger exists (DvHistoryDrawer supports mode=overlay) — revert the media query or add the trigger |
| 3 | DaVinci/DaVinciExperience.vue | /accounts/2000290/da-vinci/experience | builder | done | 31c82ff | builder profile: chip/live-control icons → 16; Exit/Send icon buttons gain tooltips; eyebrow 10px → fontSize-11; weights/rem/spacing/radius literals → tokens; redundant mobile !important dropped. Orb/aura canvases + glass skin untouched (allowlisted) |

## Wave 4

### Module 09 — Marketing   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Marketing/MarketingLanding.vue | /accounts/2000290/marketing | standard | done-no-change |  | already compliant — prop-driven ModuleLandingPage wrapper |
| 2 | Marketing/ContentLanding.vue | /accounts/2000290/content | standard | done-no-change |  | already compliant — prop-driven ModuleLandingPage wrapper |
| 3 | Marketing/CreateCampaign.vue | /accounts/2000290/campaigns/new | builder | done | d6fa766 | builder: review-step h3s → .mp-section-title; weight literals → tokens (incl. CampaignEmailPreview/ContentEditor). /campaigns/new itself is CampaignTypeChooser.vue — compliant |
| 4 | Marketing/EmailCampaigns.vue | /accounts/2000290/campaigns | standard | done | 2dc28ef | KPI mb-6 off root gap; py-10 off 3 empty states; :deep(.mp-page-header__main) + 600px media deleted; Manage Folders → outlined; small KPIs clipped at 375 → 12/sm-4/md-2; row icon 20 → 16; fake-link name cell de-linked |
| 5 | Marketing/JourneyBuilder.vue | /accounts/2000290/journeys/1/journey-builder · /data_journeys/1/builder | builder | done | 4bbee01 | builder (+ JourneyAddStepMenu): rename control hover/focus/pencil → tokens; chrome hairlines → --border-subtle; chrome icons → 16/18. Canvas/Vue Flow untouched. /data_journeys/1/builder alias renders the same view |
| 6 | Marketing/FormBuilder.vue | /accounts/2000290/acquisition/forms/create | builder | done | 4bbc62a | builder: 4 raw v-btn-toggle → MpSegmentedControl; 2 raw v-alert → MpAlert warning; review headings → .mp-section-title; palette eyebrow → .mp-meta-label; lock icon → 16; hover/selected/hairlines/focus → tokens. Step-card text-h5 + pa-8 left (builder profile skips A/B) |
| 7 | Marketing/TransactionalEmail.vue | /accounts/2000290/transactional_campaigns | standard | done-no-change |  | zero findings. Row note was wrong: /sms_campaigns → SmsCampaigns.vue and /transactional_sms → TransactionalSms.vue are separate views (rows below) |
| 7b | Marketing/SmsCampaigns.vue | /accounts/2000290/sms_campaigns | standard | done | a485ec5 | discovered in wave 4 (page-tracker listed it as a TransactionalEmail alias): py-10 off; responsive columns so the kebab stays on-screen at 375 |
| 7c | Marketing/TransactionalSms.vue | /accounts/2000290/transactional_sms | standard | done | 901cb1f | discovered in wave 4: literal mono stack → --mp-fontFamily-mono; responsive columns |
| 8 | Marketing/CampaignTags.vue | /accounts/2000290/campaign_tags | standard | done | 915944a | Import Tags → outlined; py-10 off empty state; Created column hides < sm |
| 9 | Marketing/AcquisitionForms.vue | /accounts/2000290/acquisition | standard | done | 9ea6e98 | py-10 off empty/error states; script snippet box surface-variant → --surface-secondary/--on-surface pair. Row corrected: /lead_ads is LeadAds.vue (separate view, row below); /acquisition redirects to /acquisition/forms |
| 9b | Marketing/LeadAds.vue | /accounts/2000290/lead_ads | standard | done | 1736243 | discovered in wave 4 (page-tracker listed it as an AcquisitionForms alias): py-10 ×2 removed; external-link icon 13 → 16 |
| 10 | Marketing/LandingPages.vue | /accounts/2000290/landing_pages | standard | done | ef3a401 | py-10 ×3 removed |
| 11 | Marketing/SignupForms.vue | /accounts/2000290/signup_forms | standard | done | 44de796 | py-10 removed (page redirects to Acquisition Forms on mount) |
| 12 | Marketing/Surveys.vue | /accounts/2000290/surveys | standard | done | 19c6ad3 | py-10 removed |
| 13 | Marketing/Journeys.vue | /accounts/2000290/journeys | standard | done | f5b477c | <div @click> + !important hover → real <button> on tokens; useResponsiveTableHeaders + skeleton; x-small → small; revenue by weight not colour |
| 14 | Marketing/DataJourneys.vue | /accounts/2000290/data_journeys | standard | done | b17a012 | pa-6 root → convention root; MpDataTableToolbar added; inline 200px header select → toolbar exclusive quickFilter (5 options preserved); skeleton + responsive columns; search-aware empty state |
| 15 | Marketing/EmailContent.vue | /accounts/2000290/contents | standard | done | 23408c8 | py-10 off empty/error states; row-name rgb(theme-primary) → --accent-default; focus-visible underline |
| 16 | Marketing/DynamicContent.vue | /accounts/2000290/dynamic_contents | standard | done | 3832c1e | View Archives flat → text (one primary CTA); py-10 off empty/error states; accent colour; 500 → weight token |
| 17 | Marketing/ImageLibrary.vue | /accounts/2000290/images | standard | done | 506b402 | Manage Folders → text; py-10 off empty/error states; rgb primary/surface → tokens; dropzone rgba → --border-strong/--on-surface-muted; bulk-bar buttons normalised; tooltip on Copy-link |
| 18 | Marketing/FooterManagement.vue | /accounts/2000290/footers | standard | done | 8de2863 | py-10 off empty/error states; link colour; weight token |
| 19 | Marketing/OptimizeOnOpen.vue | /accounts/2000290/image_groups | standard | done | d4400c0 | Manage Folders → text; py-10 off empty/error states; accent/weight tokens; bulk-bar Delete normalised |
| 20 | Marketing/ContentFeeds.vue | /accounts/2000290/content_feeds | standard | done | 3dc2704 | Manage Folders → text; py-10 off empty/error states; raw v-chip → MpStatusChip sm; tooltip on Edit; rgba hover → --surface-secondary; mb-2 in dialog removed |
| 21 | Marketing/CouponBanks.vue | /accounts/2000290/coupon_banks | standard | done | 45268ec | py-10 off empty/error states; monospace → --mp-fontFamily-mono |
| 22 | Marketing/PreferencePages.vue | /accounts/2000290/preference_pages | standard | done | 88a5c63 | py-10 off empty/error states; filter drawer pa-4 wrapper + ad-hoc heading removed; tooltip on Preview; preview mock rgba/600/480px → tokens |
| 23 | Marketing/CountdownTimer.vue | /accounts/2000290/live_content_images | standard | done | a4e2971 | py-10 off empty/error states |
| 24 | Marketing/CreateJourney.vue | /accounts/2000290/journeys/new | builder | done | 4fa427c | = JourneySelection.vue + CreateJourneyScratch.vue. Bug fixed: .js-body used non-existent --mp-layout-content-max-width (computed none) → --mp-layout-contentMaxWidth; hairline → --border-subtle; icon 14 → 16 |
| 25 | Marketing/CreateSmsCampaign.vue | /accounts/2000290/sms_campaigns/new | builder | done | f785db3 | builder: inline max-width 260px on test-phone field → flex-grow-1 |
| 26 | Marketing/CreateTransactional.vue | /accounts/2000290/transactional_campaigns/new | builder | done | 416c388 | builder: section labels → .mp-section-title; :deep(.mp-page-header) removed; hairlines/gap → tokens; inbox-mock 1:1 token swaps |
| 27 | Marketing/CreateTransactionalSms.vue | /accounts/2000290/transactional_sms/new | builder | done | 06ce4e2 | builder: <code> mono stack/bg/radius/sizes → tokens |
| 28 | Marketing/LandingPageEditor.vue | /accounts/2000290/landing_pages/editor/1/edit | builder | done | a0da7d4 | builder (+ components/marketing/landing/*): 8 raw v-btn-toggle → MpSegmentedControl; bug fixed — d-flex utilities on .lpe-left defeated the ≤768 media query, left panel now hides at 375; rem type → tokens; chrome icons → 16; focus rings added; hairlines → --border-subtle. Observation: LandingBlockView dark theme renders on-surface text over the white merchant sheet (allowlisted area, follow-up) |
| 29 | Marketing/EmailContentEditor.vue | /accounts/2000290/contents/editor/200 | builder | done | d458122 | builder: duplicate check → save icon; tooltips on block controls; eyebrow → .mp-meta-label; text-h6 → .mp-section-title; v-btn-toggle → MpSegmentedControl; palette/controls CSS on tokens; canvas untouched (allowlisted). URL corrected: ids start at 200 |

### Module 13 — Settings   [module-status: done]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Settings/pages/AccountDefaultsPage.vue | /accounts/2000290/settings/account-defaults | standard | done | 39a0902 | page already compliant; SettingsLayout shell: scoped restatement of .mp-frame-fill margins + calc(100vh) removed → composes .mp-frame-fill |
| 2 | Settings/pages/GeneralPage.vue | /accounts/2000290/settings/general | standard | done | 566413a | both !important rules deleted (renders identically); 5 px/weight literals → tokens |
| 3 | Settings/pages/NotificationsPage.vue | /accounts/2000290/settings/notifications | standard | done | ff66044 | box-in-box list → MpListRow divided with switch in #trailing; 8 literals → tokens |
| 4 | Settings/pages/UsersPermissionsPage.vue | /accounts/2000290/settings/users-permissions | standard | done | a988d50 | py-10 off both empty states; row icons → 16 in 24px disc; opacity literal dropped; bulk-menu v-list-item → MpMenuItem; literals → tokens |
| 5 | Settings/pages/AuditLogPage.vue | /accounts/2000290/settings/audit-log | standard | done | 06cd433 | v-btn-toggle → MpSegmentedControl sm (wraps at 375); v-alert → MpAlert live=off; py-14/py-10 removed; literals → tokens |
| 6 | Settings/pages/ConnectionsPage.vue | /accounts/2000290/settings/connections | standard | done | 1d58add | bordered+tinted tiles → divided rows; CTAs into SettingsSection #actions, only Generate Key primary; 5 tooltips; drawer v-btn-toggle → MpSegmentedControl; tokens |
| 7 | Settings/pages/DnsSetupPage.vue | /accounts/2000290/settings/dns-setup | standard | done | 6a0d750 | tiles → divided rows; one primary CTA; v-alert → MpAlert; icons 18 → 16; tooltips; uppercase DKIM/SPF/DMARC labels → sentence-case muted dl |
| 8 | Settings/pages/IntegrationsPage.vue | /accounts/2000290/settings/integrations | standard | done | 7e9465f | six primary Connects → outlined; tiles lose color-mix tint (hairline, radius-12); icons 26 → 20; purple → secondary; tokens |
| 9 | Settings/pages/TrackingAnalyticsPage.vue | /accounts/2000290/settings/tracking-analytics | standard | done | 24fcc00 | renders SettingsPlaceholder only — placeholder component polished in 24fcc00 (icon 22 → 18, line-height token, bold → semibold) |
| 10 | Settings/pages/PrivacyConsentPage.vue | /accounts/2000290/settings/privacy-consent | standard | done | 24fcc00 | renders SettingsPlaceholder only — placeholder component polished in 24fcc00 (icon 22 → 18, line-height token, bold → semibold) |
| 11 | Settings/pages/SecurityPage.vue | /accounts/2000290/settings/security | standard | done | 24fcc00 | renders SettingsPlaceholder only — placeholder component polished in 24fcc00 (icon 22 → 18, line-height token, bold → semibold) |
| 12 | Settings/pages/StoreProfilePage.vue | /accounts/2000290/settings/store-profile | standard | done | 24fcc00 | renders SettingsPlaceholder only — placeholder component polished in 24fcc00 (icon 22 → 18, line-height token, bold → semibold) |
| 13 | Settings/pages/SalesChannelsPage.vue | /accounts/2000290/settings/sales-channels | standard | done | 24fcc00 | renders SettingsPlaceholder only — placeholder component polished in 24fcc00 (icon 22 → 18, line-height token, bold → semibold) |
| 14 | Settings/pages/PaymentAccountPage.vue | /accounts/2000290/settings/payment-account | standard | done | 24fcc00 | renders SettingsPlaceholder only — placeholder component polished in 24fcc00 (icon 22 → 18, line-height token, bold → semibold) |
| 15 | Settings/pages/ServicePage.vue | /accounts/2000290/settings/service | standard | done | ff8feba | Add Template → outlined in #actions (Save sole primary); template rows → MpListRow divided; tooltips; 420px → state.measure; tokens |
| 16 | Settings/pages/AiSettingsPage.vue | /accounts/2000290/settings/ai-settings | standard | done | 6b9927c | bordered+tinted rows → MpListRow divided with chip in #trailing; literals → tokens |

## Progress log

- 2026-09-02 — Tracker generated from page-tracker.md (14 modules, all rows pending, grouped into waves W1–W4).
- 2026-09-02 — Wave 1 complete (Products, Commerce, Service, App Store, Billing & Misc): 21 rows done (1 already compliant), 0 skipped/blocked, 20 page commits + shared fix c66ffbb. Three views discovered that page-tracker mis-filed as aliases (CustomGiftCards, PurchasableGiftCards, ChatbotList) added as pending rows for a follow-up. Rejected proposals: MpFilterTabs baked mb-4, MpDataTableToolbar 375 wrap regrouping (both affect every list page — dedicated pass), MpSectionHeader description slot + MpListRow subtitle prop (API additions, out of scope), builder-body pa-* on wizard cards (builder profile excludes B by design), global table tabular-nums (already global at global.scss .v-table td), extra width tokens for 720/520/120/128 (no ramp yet).
- 2026-09-03 — Wave 2 complete (Dashboard, Analytics, Contacts): 27 rows done (3 already compliant), 0 skipped/blocked, 24 page commits + shared fix 42cd73f (shell-inset / detailSidebarWidth / menu.railWidth / chart.height tokens, info+warning chip tones, MpSectionHeader wrap, MpListRow focus ring per E2, recipe B1 empty-state note). Rejected/deferred: `.v-card.rounded-lg !important` removal (DESIGN_AUDIT P1-8 load-bearing); ContactDetail campaign rows → MpListRow (page redesign, later pass); identity-cell width token (no recurrence). **Human decision needed:** `.mp-label-value dt` renders uppercase 11/600 (F5) but recipe C2 says inline labels beside a value are sentence-case 12 — Tickets (reference) uses the uppercase dt, ContactDetail eRFM now shows "RFM GROUP"; pick one and amend the recipe. Observations: TestCampaignReports/TransactionalReports render empty on the default 30-day range (mock dates aged out); DispatchedOrders shows "$-97.90" on a refund row (template literal, not formatCurrency). Wave-2 worktrees were based on 20f601c (pre-wave-1) — merges were clean and the gate re-verified on master.
- 2026-09-03 — Wave 3 complete (Merchandising, Retail, Sales Channels, Da Vinci): 30 rows done (4 already compliant, 5 stale Retail rows resolved as redirects/cross-module), 0 skipped/blocked, 28 page commits + shared fix 037bf7f (shell-inset tokens into Retail/Settings/Merchandising shells, retail-widget header tokens + compact wrap, MpKpiCard trend icon 16, DvHistoryDrawer hairlines/search/icon, StorefrontPreview allow-listed). Tracker corrections: MerchandisingHome → MerchandisingChannelSelector; Associates → Staff; Payments/Receipts added (done); Products/PriceLists added (pending). Rejected/deferred: full retail-widgets.scss retoken (33 px, 9 !important — dedicated pass); builder-panel width tokens (component.builder.panelWidth 380 exists — swap StoreThemeBuilder/Code onto it when a 320/280 decision is made); product-card min-width + breakpointWide tokens (no design decision); MpSourceCloudChip icon ramp (chip-proportional by design); MpSegmentedControl generic model (API change); MpSegmentedControl aria-pressed (already applied in wave 1 — agents branched from 20f601c). **Decision for human:** DaVinciCopilot history rail hidden <960 leaves history unreachable on phones (see row note).
- 2026-09-03 — Wave 4 complete (Marketing ×3 slices, Settings) — ALL FOUR WAVES DONE: 48 rows done (3 already compliant), 0 skipped/blocked, 45 page commits + shared fix 75b60b6 (MpBuilderShell head wraps <768, MpKpiCard emphasis hero → prominent, MerchandisingLayout compact insets on shell tokens, JourneyBuilder 650 → sectionTitle weight token, settings-form.scss paddings tokenised, SettingsSection head wraps <640). Tracker corrections: LeadAds, SmsCampaigns, TransactionalSms added as rows (page-tracker listed them as aliases); EmailContentEditor URL → /contents/editor/200; JourneyBuilder URL → /journeys/1/journey-builder. Two agents were cut off by a usage limit mid-module and resumed cleanly from their worktrees. Rejected/deferred: v-tooltip directive registration (plugin change — decide separately); MpSegmentedControl generic model + block prop (API change); width tokens for truncated cells / preview columns / settings page width (no design decision); builder collapse breakpoints 900/1024 → breakpointSplit (page-level follow-up); settings-page top/right padding removal (visual decision). Observations: LandingBlockView dark theme renders on-surface text over the white merchant sheet (allowlisted area). **Open human decisions carried over:** `.mp-label-value dt` uppercase vs recipe C2 sentence-case; DaVinciCopilot history rail hidden on phones. **Follow-up rows still pending:** Commerce/CustomGiftCards, Commerce/PurchasableGiftCards, Service/ChatbotList, Products/PriceLists.
