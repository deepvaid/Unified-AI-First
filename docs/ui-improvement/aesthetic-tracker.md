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
- 2026-09-03 — Wave 2 complete (Dashboard, Analytics, Contacts): 27 rows done (3 already compliant), 0 skipped/blocked, 24 page commits + shared fix 42cd73f (shell-inset / detailSidebarWidth / menu.railWidth / chart.height tokens, info+warning chip tones, MpSectionHeader wrap, MpListRow focus ring per E2, recipe B1 empty-state note). Rejected/deferred: `.v-card.rounded-lg !important` removal (DESIGN_AUDIT P1-8 load-bearing); ContactDetail campaign rows → MpListRow (page redesign, later pass); identity-cell width token (no recurrence). **Human decision needed:** `.mp-label-value dt` renders uppercase 11/600 (F5) but recipe C2 says inline labels beside a value are sentence-case 12 — Tickets (reference) uses the uppercase dt, ContactDetail eRFM now shows "RFM GROUP"; pick one and amend the recipe. Observations: TestCampaignReports/TransactionalReports render empty on the default 30-day range (mock dates aged out); DispatchedOrders shows "$-97.90" on a refund row (template literal, not formatCurrency). Wave-2 worktrees were based on 20f601c (pre-wave-1) — merges were clean and the gate re-verified on master.
