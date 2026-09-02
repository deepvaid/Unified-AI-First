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

### Module 01 — Dashboard   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Dashboards/DashboardsList.vue | /accounts/2000290/dashboards | standard | pending |  | skeleton + responsive headers + 375px overflow fixed; ad-hoc redesign: single kebab per row, type chips → text, back-to header, factual subtitle |
| 2 | DashboardView.vue | /accounts/2000290/dashboard · /dashboard/2000290-home | standard | pending |  | serves 2 routes; ad-hoc redesign: compact grouped Actions/Add-content menus, switcher row buttons removed, single-header widget wizard |
| 3 | Analytics/LiveView.vue | /accounts/2000290/analytics/live_view | standard | pending |  | ad-hoc light redesign: single live indicator, heading scale; 18 pre-existing `!important` untouched (roadmap #16 cluster) |

### Module 02 — Analytics (Reports)   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Analytics/MonthlyTotals.vue | /accounts/2000290/analytics/monthly_totals | standard | pending |  | loading state + responsive columns (table overflowed 201px→0 at 375px); error state N/A (no fetch path); **touched shared MpPageHeader** (actions wrap <600px, f923f0f — fixed 97px header clip) — spot-check prior pages at gate |
| 2 | Analytics/OrdersReport.vue | /accounts/2000290/analytics/orders | standard | pending |  | loading state + responsive columns (0 overflow at 375px); MpStatusChip type="order" already correct; error state N/A |
| 3 | Analytics/DispatchedOrders.vue | /accounts/2000290/analytics/dispatched_orders | standard | pending |  | loading state + responsive columns (0 overflow at 375px); error state N/A |
| 4 | Analytics/SalesSummary.vue | /accounts/2000290/analytics/sales_summary | standard | pending |  | loading state gates whole data region (bars+table); responsive columns (269px→0 at 375px); channel-bar rows already had a 700px breakpoint, measured 0 — untouched; error state N/A |
| 5 | Analytics/ERFMReport.vue | /accounts/2000290/erfm_report | standard | pending |  | **Page replaced 2026-08-31** (UAT deep-crawl rebuild — the audited card-grid page was an invented design, not this URL). Re-audited after the rebuild: 0 horizontal overflow at 375px, matrices scroll in their own containers, MpTableSkeleton loading in all 4 data sections, MpEmptyState present, zero px literals / hardcoded colours, contrast 244/244 pass. The earlier note about no card-grid skeleton convention no longer applies — the sections are row×column shaped, so MpTableSkeleton fits. Docs: `docs/rebuild/erfm-report/` |
| 6 | Analytics/CampaignReports.vue | /accounts/2000290/reports | standard | pending |  | loading state + responsive columns (Name+Status at 375px, 6 cols at 1280px); 0 overflow |
| 7 | Analytics/RecurringCampaignReports.vue | /accounts/2000290/analytics/recurring_campaign_reports | standard | pending |  | loading state + responsive columns (Name+Frequency at 375px); 0 overflow |
| 8 | Analytics/ABCampaignReports.vue | /accounts/2000290/analytics/ab_campaign_reports | standard | pending |  | loading state + responsive columns (Test Name+Lift — the outcome — at 375px); 0 overflow |
| 9 | Analytics/TestCampaignReports.vue | /accounts/2000290/analytics/test_campaign_reports | standard | pending |  | loading state + responsive columns (Scenario+Provider at 375px); 0 overflow |
| 10 | Analytics/WebsiteReports.vue | /accounts/2000290/analytics/website_reports | standard | pending |  | loading state + responsive columns (Path+Pageviews at 375px); 0 overflow |
| 11 | Analytics/JourneyReports.vue | /accounts/2000290/analytics/journey_reports | standard | pending |  | loading state + responsive columns (Name+Active Contacts at 375px); 0 overflow |
| 12 | Analytics/CustomReports.vue | /accounts/2000290/analytics/custom_reports | standard | pending |  | already compliant — no commit. Card grid + MpFormDrawer builder; the one page in this module with a real primary CTA (`color="primary" variant="flat"` Create Report). 0 overflow at 375px (page/cards/footers/header), MpEmptyState with action, all icon buttons have aria-label, drawer goes full-width on phone with 0 overflow. Loading state not added (card grid — same reasoning as row 5). One flagged "unlabeled input" was a false positive: Vuetify's internal auto-grow sizer textarea (aria-hidden, readOnly, out of tab order); the real textarea is labelled |
| 13 | Analytics/TransactionalReports.vue | /accounts/2000290/analytics/transactional_reports | standard | pending |  | loading state + responsive columns (Event+Delivery Rate at 375px); 0 overflow |
| 14 | Analytics/LogInspector.vue | /accounts/2000290/analytics/log_inspector | standard | pending |  | loading state + responsive columns; Level+Message kept at 375px and Timestamp dropped (inverse of report tables — the message is the content); 0 overflow |

### Module 03 — Contacts (Audience)   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Contacts/AllContacts.vue | /accounts/2000290/contacts | standard | pending |  | ad-hoc polish (subtitle count bug, chip vocab, dates, CTA variants) + redesign (score dots, hover hint removed); touched shared MpStatusChip (additive contact-map entries) — spot-check prior pages at gate |
| 2 | Contacts/ContactDetail.vue | /accounts/2000290/contacts/:contactId (see Defaults) | standard | pending |  | ad-hoc redesign: flat profile (gradient hero removed), KPIs 8→4, sidebar 6→4 cards, back-to header |
| 3 | Contacts/ContactLists.vue | /accounts/2000290/lists | standard | pending |  | loading state + responsive columns (229px→**7px** at 375px — residual is cell-padding-driven, not column-driven; see Module 03 note) + itemLabel on row kebabs (6 identical→6 unique names); label "Total Contacts"→"Contacts" for cross-page consistency |
| 4 | Contacts/Segments.vue | /accounts/2000290/segments | standard | pending |  | loading state + responsive columns (106px→0 at 375px) + itemLabel (12 identical→12 unique); label "Total Contacts"→"Contacts" |
| 5 | Contacts/ContactFields.vue | /accounts/2000290/contact_fields | standard | pending |  | loading state + responsive columns (170px→0 at 375px) + itemLabel (5 identical→5 unique) |
| 6 | Contacts/ContactTags.vue | /accounts/2000290/tags | standard | pending |  | loading state + itemLabel (5 identical→5 unique); label "Contacts Tagged"→"Contacts". No column tiering — only 3 cols, all load-bearing; residual **20px** overflow at 375px is cell-padding-driven (see Module 03 note) |
| 7 | Contacts/RelationalTables.vue | /accounts/2000290/relational_tables | standard | pending |  | loading state + responsive columns (171px→0 at 375px) + itemLabel (3 identical→3 unique) |
| 8 | Contacts/SQLQueries.vue | /accounts/2000290/sql_queries | standard | pending |  | loading state + responsive columns (250px→0 at 375px) + itemLabel (3 identical→3 unique) |
| 9 | Contacts/SecureLists.vue | /accounts/2000290/secure_lists | standard | pending |  | loading state + responsive columns (88px→0 at 375px) + itemLabel (2 identical→2 unique) |
| 10 | Contacts/WebTracking.vue | /accounts/2000290/web_tracking | standard | pending |  | a11y: read-only tracking-domain field had a dangling aria-labelledby and no accessible name (WCAG 4.1.2) — added aria-label, verified via a11y tree. Static page: table/list states N/A; 0 overflow at 375px |

## Wave 3

### Module 06 — Merchandising (MerchCloud)   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Merchandising/MerchandisingHome.vue | /commerce/2000290/merchandising | standard | pending |  |  |
| 2 | Merchandising/SearchPreview.vue | /commerce/2000290/merchandising/search/preview | standard | pending |  |  |
| 3 | Merchandising/Synonyms.vue | /commerce/2000290/merchandising/search/synonyms | standard | pending |  |  |
| 4 | Merchandising/PageRedirects.vue | /commerce/2000290/merchandising/search/redirects | standard | pending |  |  |
| 5 | Merchandising/Collections.vue | /commerce/2000290/merchandising/collections | standard | pending |  | redesign a846e3a + Edit-pins wired to Default Merchandising pinning editor |
| 6 | Merchandising/DefaultMerchandising.vue | /commerce/2000290/merchandising/default-merchandising (+ /pinning/:ruleId, /rules/:ruleId) | standard | pending |  | Findify replica built: pinning + rules tabs, pin editor w/ drag reorder (4ec82ca), rule editor w/ live preview, store data layer (7cebe6e) |
| 7 | Merchandising/RecommendationEngines.vue | /commerce/2000290/merchandising/recommendations (+ /:engineId editor) | standard | pending |  | engine wizard rebuilt to match real Findify flow (page→type→settings→filters, user-verified screenshots); list itself still pre-redesign — polish at module pass |
| 8 | Merchandising/FieldTransformations.vue | /commerce/2000290/merchandising/fields | standard | pending |  |  |

### Module 07 — Retail   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Retail/RetailHome.vue | /commerce/2000290/retail | standard | pending |  |  |
| 2 | Retail/Registers.vue | /commerce/2000290/retail/registers | standard | pending |  |  |
| 3 | Retail/Transactions.vue | /commerce/2000290/retail/transactions | standard | pending |  |  |
| 4 | Retail/Associates.vue | /commerce/2000290/retail/associates | standard | pending |  |  |
| 5 | Retail/PosPreview.vue | /commerce/2000290/retail/pos-preview | builder | pending |  | fullPage; intentional hardcoded hex (device mock — allowlisted); stakeholder fix: persistent scan/search on sale home (Brendan feedback) |
| 6 | Retail/StockByLocation.vue | /commerce/2000290/retail/stock | standard | pending |  |  |
| 7 | Retail/BulkInventory.vue | /commerce/2000290/retail/inventory | standard | pending |  |  |
| 8 | Retail/Pricing.vue | /commerce/2000290/retail/pricing | standard | pending |  |  |
| 9 | Retail/Hardware.vue | /commerce/2000290/retail/hardware | standard | pending |  |  |
| 10 | Retail/RetailSettings.vue | /commerce/2000290/retail/settings | standard | pending |  |  |

### Module 08 — Sales Channels   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | SalesChannels/SalesChannelsList.vue | /accounts/2000290/sales_channels | standard | pending |  |  |
| 2 | SalesChannels/CreateSalesChannel.vue | /accounts/2000290/sales_channels/new | standard | pending |  |  |
| 3 | SalesChannels/SalesChannelLocations.vue | /accounts/2000290/sales_channels/pos-store/locations | standard | pending |  | ad-hoc redesign: role chips → joined text, row avatars removed, toolbar title dropped |
| 4 | SalesChannels/SalesChannelLocationDetail.vue | /accounts/2000290/sales_channels/pos-store/locations/loc-bondi | standard | pending |  |  |
| 5 | SalesChannels/SalesChannelDetail.vue | /accounts/2000290/sales_channels/pos-store | standard | pending |  | bespoke identity header is CORRECT (roadmap #9/#14) — don't "fix" it |
| 6 | SalesChannels/StoreThemeBuilder.vue | /accounts/2000290/sales_channels/retest-sales-notification/theme | builder | pending |  | builderShell (2026-07-19): MpBuilderShell v2, live chip replaces dirty dot, --mp-border-subtle |
| 7 | SalesChannels/StoreThemeCode.vue | /accounts/2000290/sales_channels/retest-sales-notification/theme/code | builder | pending |  | builderShell (2026-07-19): MpBuilderShell v2, duplicate back control removed |

### Module 11 — Da Vinci   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | DaVinci/DaVinciAI.vue | /accounts/2000290/da-vinci · /da-vinci/dashboard | standard | pending |  | serves 2 routes |
| 2 | DaVinci/DaVinciCopilot.vue | /accounts/2000290/da-vinci/copilot | builder | pending |  | flush layout; chat surface |
| 3 | DaVinci/DaVinciExperience.vue | /accounts/2000290/da-vinci/experience | builder | pending |  | fullPage; WebGL orb — intentional canvas hex (allowlisted); screenshots may freeze when tab hidden |

## Wave 4

### Module 09 — Marketing   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Marketing/MarketingLanding.vue | /accounts/2000290/marketing | standard | pending |  |  |
| 2 | Marketing/ContentLanding.vue | /accounts/2000290/content | standard | pending |  |  |
| 3 | Marketing/CreateCampaign.vue | /accounts/2000290/campaigns/new | builder | pending |  | builderShell (2026-07-19): system chrome + rounded frame; roadmap #10 reference flow — likely compliant |
| 4 | Marketing/EmailCampaigns.vue | /accounts/2000290/campaigns | standard | pending |  | roadmap #7/#12/#17 touched |
| 5 | Marketing/JourneyBuilder.vue | /accounts/2000290/journeys/1/builder · /data_journeys/1/builder | builder | pending |  | builderShell (2026-07-19): MpBuilderShell v2, unified dirty chip; empty-canvas exemption (roadmap P1 #5) |
| 6 | Marketing/FormBuilder.vue | /accounts/2000290/acquisition/forms/create | builder | pending |  | builderShell (2026-07-19): MpBuilderShell v2 + steps slot, dark-safe device mock |
| 7 | Marketing/TransactionalEmail.vue | /accounts/2000290/sms_campaigns · /transactional_campaigns · /transactional_sms | standard | pending |  | serves 3 routes — spot-check aliases |
| 8 | Marketing/CampaignTags.vue | /accounts/2000290/campaign_tags | standard | pending |  |  |
| 9 | Marketing/AcquisitionForms.vue | /accounts/2000290/acquisition · /lead_ads | standard | pending |  | serves 2 routes |
| 10 | Marketing/LandingPages.vue | /accounts/2000290/landing_pages | standard | pending |  |  |
| 11 | Marketing/SignupForms.vue | /accounts/2000290/signup_forms | standard | pending |  |  |
| 12 | Marketing/Surveys.vue | /accounts/2000290/surveys | standard | pending |  |  |
| 13 | Marketing/Journeys.vue | /accounts/2000290/journeys | standard | pending |  |  |
| 14 | Marketing/DataJourneys.vue | /accounts/2000290/data_journeys | standard | pending |  |  |
| 15 | Marketing/EmailContent.vue | /accounts/2000290/contents | standard | pending |  | roadmap #13 touched |
| 16 | Marketing/DynamicContent.vue | /accounts/2000290/dynamic_contents | standard | pending |  |  |
| 17 | Marketing/ImageLibrary.vue | /accounts/2000290/images | standard | pending |  | roadmap #13 touched |
| 18 | Marketing/FooterManagement.vue | /accounts/2000290/footers | standard | pending |  |  |
| 19 | Marketing/OptimizeOnOpen.vue | /accounts/2000290/image_groups | standard | pending |  |  |
| 20 | Marketing/ContentFeeds.vue | /accounts/2000290/content_feeds | standard | pending |  |  |
| 21 | Marketing/CouponBanks.vue | /accounts/2000290/coupon_banks | standard | pending |  |  |
| 22 | Marketing/PreferencePages.vue | /accounts/2000290/preference_pages | standard | pending |  |  |
| 23 | Marketing/CountdownTimer.vue | /accounts/2000290/live_content_images | standard | pending |  |  |
| 24 | Marketing/CreateJourney.vue | /accounts/2000290/journeys/new | builder | pending |  | builderShell (2026-07-19): normalized to MpPageHeader band (was bespoke toolbar) |
| 25 | Marketing/CreateSmsCampaign.vue | /accounts/2000290/sms_campaigns/new | builder | pending |  | builderShell (2026-07-19): frame-fill + new leave guard |
| 26 | Marketing/CreateTransactional.vue | /accounts/2000290/transactional_campaigns/new | builder | pending |  | builderShell (2026-07-19): frame-fill + new leave guard |
| 27 | Marketing/CreateTransactionalSms.vue | /accounts/2000290/transactional_sms/new | builder | pending |  | builderShell (2026-07-19): frame-fill + new leave guard |
| 28 | Marketing/LandingPageEditor.vue | /accounts/2000290/landing_pages/editor/1/edit | builder | pending |  | builderShell (2026-07-19): MpBuilderShell v2, toolbar decluttered; autosave — deliberately no leave guard |
| 29 | Marketing/EmailContentEditor.vue | /accounts/2000290/contents/editor/1 | builder | pending |  | builderShell (2026-07-19): shell v2 reference consumer |

### Module 13 — Settings   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Settings/pages/AccountDefaultsPage.vue | /accounts/2000290/settings/account-defaults | standard | pending |  | default child; audit SettingsLayout.vue shell here too |
| 2 | Settings/pages/GeneralPage.vue | /accounts/2000290/settings/general | standard | pending |  | 2 `!important` (roadmap note) |
| 3 | Settings/pages/NotificationsPage.vue | /accounts/2000290/settings/notifications | standard | pending |  |  |
| 4 | Settings/pages/UsersPermissionsPage.vue | /accounts/2000290/settings/users-permissions | standard | pending |  |  |
| 5 | Settings/pages/AuditLogPage.vue | /accounts/2000290/settings/audit-log | standard | pending |  |  |
| 6 | Settings/pages/ConnectionsPage.vue | /accounts/2000290/settings/connections | standard | pending |  |  |
| 7 | Settings/pages/DnsSetupPage.vue | /accounts/2000290/settings/dns-setup | standard | pending |  |  |
| 8 | Settings/pages/IntegrationsPage.vue | /accounts/2000290/settings/integrations | standard | pending |  |  |
| 9 | Settings/pages/TrackingAnalyticsPage.vue | /accounts/2000290/settings/tracking-analytics | standard | pending |  |  |
| 10 | Settings/pages/PrivacyConsentPage.vue | /accounts/2000290/settings/privacy-consent | standard | pending |  |  |
| 11 | Settings/pages/SecurityPage.vue | /accounts/2000290/settings/security | standard | pending |  |  |
| 12 | Settings/pages/StoreProfilePage.vue | /accounts/2000290/settings/store-profile | standard | pending |  |  |
| 13 | Settings/pages/SalesChannelsPage.vue | /accounts/2000290/settings/sales-channels | standard | pending |  |  |
| 14 | Settings/pages/PaymentAccountPage.vue | /accounts/2000290/settings/payment-account | standard | pending |  |  |
| 15 | Settings/pages/ServicePage.vue | /accounts/2000290/settings/service | standard | pending |  |  |
| 16 | Settings/pages/AiSettingsPage.vue | /accounts/2000290/settings/ai-settings | standard | pending |  |  |

## Progress log

- 2026-09-02 — Tracker generated from page-tracker.md (14 modules, all rows pending, grouped into waves W1–W4).
- 2026-09-02 — Wave 1 complete (Products, Commerce, Service, App Store, Billing & Misc): 21 rows done (1 already compliant), 0 skipped/blocked, 20 page commits + shared fix c66ffbb. Three views discovered that page-tracker mis-filed as aliases (CustomGiftCards, PurchasableGiftCards, ChatbotList) added as pending rows for a follow-up. Rejected proposals: MpFilterTabs baked mb-4, MpDataTableToolbar 375 wrap regrouping (both affect every list page — dedicated pass), MpSectionHeader description slot + MpListRow subtitle prop (API additions, out of scope), builder-body pa-* on wizard cards (builder profile excludes B by design), global table tabular-nums (already global at global.scss .v-table td), extra width tokens for 720/520/120/128 (no ramp yet).
