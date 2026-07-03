# UI Polish Page Tracker

<!-- STATE FILE — the polish-module skill parses this. Keep the table format intact. -->
<!-- One row per VIEW COMPONENT (not per route). Shared views list all alias URLs; audit the first, spot-check aliases. -->
<!-- Status: pending | done | skipped | blocked. Next work item = first `pending` row top-to-bottom. -->
<!-- Profile: standard (full checklist) | builder (reduced checklist — see polish-playbook.md §3). -->
<!-- Method + checklist: docs/ui-improvement/polish-playbook.md. DoD: docs/ui-improvement-roadmap.md lines 140–147. -->

## Defaults (resolved 2026-07-03 from store mocks)

- accountId: `2000290` (subscriptions: commerce, marketing, analytics, service, davinci — passes the commerce gate)
- dashboardId: `2000290-home` (useDashboards.ts `createDashboardId(account.id, 'home')`)
- journeyId: `1` (useCampaigns.ts first journey)
- channelId: `pos-store` · locationId: `loc-bondi` (useSalesChannels.ts — pos-store has locations)
- contactId: _resolve at runtime_ — uids are seeded-rng ULIDs (useContacts.ts:295); open `/accounts/2000290/contacts`, use the first row's link. Record it here once known: `TBD`
- Baseline console noise (pre-existing, ignore; filled during pilot): `TBD`

## Module 01 — Dashboard   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Dashboards/DashboardsList.vue | /accounts/2000290/dashboards | standard | pending | | |
| 2 | DashboardView.vue | /accounts/2000290/dashboard · /dashboard/2000290-home | standard | pending | | serves 2 routes; roadmap #11 already polished CTA + star |
| 3 | Analytics/LiveView.vue | /accounts/2000290/analytics/live_view | standard | pending | | 18 `!important` (roadmap #16 cluster) |

## Module 02 — Analytics (Reports)   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Analytics/MonthlyTotals.vue | /accounts/2000290/analytics/monthly_totals | standard | pending | | |
| 2 | Analytics/OrdersReport.vue | /accounts/2000290/analytics/orders | standard | pending | | |
| 3 | Analytics/DispatchedOrders.vue | /accounts/2000290/analytics/dispatched_orders | standard | pending | | |
| 4 | Analytics/SalesSummary.vue | /accounts/2000290/analytics/sales_summary | standard | pending | | |
| 5 | Analytics/ERFMReport.vue | /accounts/2000290/analytics/erfm_report | standard | pending | | |
| 6 | Analytics/CampaignReports.vue | /accounts/2000290/reports | standard | pending | | |
| 7 | Analytics/RecurringCampaignReports.vue | /accounts/2000290/analytics/recurring_campaign_reports | standard | pending | | |
| 8 | Analytics/ABCampaignReports.vue | /accounts/2000290/analytics/ab_campaign_reports | standard | pending | | |
| 9 | Analytics/TestCampaignReports.vue | /accounts/2000290/analytics/test_campaign_reports | standard | pending | | |
| 10 | Analytics/WebsiteReports.vue | /accounts/2000290/analytics/website_reports | standard | pending | | |
| 11 | Analytics/JourneyReports.vue | /accounts/2000290/analytics/journey_reports | standard | pending | | |
| 12 | Analytics/CustomReports.vue | /accounts/2000290/analytics/custom_reports | standard | pending | | |
| 13 | Analytics/TransactionalReports.vue | /accounts/2000290/analytics/transactional_reports | standard | pending | | |
| 14 | Analytics/LogInspector.vue | /accounts/2000290/analytics/log_inspector | standard | pending | | |

## Module 03 — Contacts (Audience)   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Contacts/AllContacts.vue | /accounts/2000290/contacts | standard | pending | | polished in roadmap #7/#17 — likely near-compliant |
| 2 | Contacts/ContactDetail.vue | /accounts/2000290/contacts/:contactId (see Defaults) | standard | pending | | resolve contactId from list first; roadmap #14/#17 touched |
| 3 | Contacts/ContactLists.vue | /accounts/2000290/lists | standard | pending | | |
| 4 | Contacts/Segments.vue | /accounts/2000290/segments | standard | pending | | |
| 5 | Contacts/ContactFields.vue | /accounts/2000290/contact_fields | standard | pending | | |
| 6 | Contacts/ContactTags.vue | /accounts/2000290/tags | standard | pending | | |
| 7 | Contacts/RelationalTables.vue | /accounts/2000290/relational_tables | standard | pending | | |
| 8 | Contacts/SQLQueries.vue | /accounts/2000290/sql_queries | standard | pending | | |
| 9 | Contacts/SecureLists.vue | /accounts/2000290/secure_lists | standard | pending | | |
| 10 | Contacts/WebTracking.vue | /accounts/2000290/web_tracking | standard | pending | | |

## Module 04 — Products   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Products/ProductRecommendations.vue | /commerce/2000290/product_recommendations | standard | pending | | commerce gate |
| 2 | Products/ProductsList.vue | /commerce/2000290/products | standard | pending | | roadmap #7/#17 touched |
| 3 | Products/TaxCategories.vue | /commerce/2000290/product_tax_category | standard | pending | | |
| 4 | Products/Collections.vue | /commerce/2000290/products/collections | standard | pending | | |
| 5 | Products/Inventory.vue | /commerce/2000290/inventory | standard | pending | | |
| 6 | Products/Reservations.vue | /commerce/2000290/products/reservations | standard | pending | | |

## Module 05 — Commerce   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Commerce/CommerceCloudLanding.vue | /accounts/2000290/commerce-cloud | standard | pending | | marketing-style landing |
| 2 | Commerce/SalesOrders.vue | /commerce/2000290/orders | standard | pending | | roadmap #7/#17 touched |
| 3 | Commerce/DraftOrders.vue | /commerce/2000290/orders/drafts | standard | pending | | roadmap #7/#17 touched |
| 4 | Commerce/Fulfillments.vue | /commerce/2000290/fulfillments | standard | pending | | roadmap #7/#17 touched |
| 5 | Commerce/Coupons.vue | /commerce/2000290/coupons · /promotions · /custom_gift_cards · /purchasable_gift_cards | standard | pending | | serves 4 routes — spot-check each alias (may branch on route name) |

## Module 06 — Merchandising (MerchCloud)   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Merchandising/MerchandisingHome.vue | /commerce/2000290/merchandising | standard | pending | | |
| 2 | Merchandising/SearchPreview.vue | /commerce/2000290/merchandising/search/preview | standard | pending | | |
| 3 | Merchandising/Synonyms.vue | /commerce/2000290/merchandising/search/synonyms | standard | pending | | |
| 4 | Merchandising/PageRedirects.vue | /commerce/2000290/merchandising/search/redirects | standard | pending | | |
| 5 | Merchandising/Collections.vue | /commerce/2000290/merchandising/collections | standard | pending | | |
| 6 | Merchandising/DefaultMerchandising.vue | /commerce/2000290/merchandising/default-merchandising | standard | pending | | |
| 7 | Merchandising/RecommendationEngines.vue | /commerce/2000290/merchandising/recommendations | standard | pending | | |
| 8 | Merchandising/FieldTransformations.vue | /commerce/2000290/merchandising/fields | standard | pending | | |

## Module 07 — Retail   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Retail/RetailHome.vue | /commerce/2000290/retail | standard | pending | | |
| 2 | Retail/Registers.vue | /commerce/2000290/retail/registers | standard | pending | | |
| 3 | Retail/Transactions.vue | /commerce/2000290/retail/transactions | standard | pending | | |
| 4 | Retail/Associates.vue | /commerce/2000290/retail/associates | standard | pending | | |
| 5 | Retail/PosPreview.vue | /commerce/2000290/retail/pos-preview | builder | pending | | fullPage; intentional hardcoded hex (device mock — allowlisted) |
| 6 | Retail/StockByLocation.vue | /commerce/2000290/retail/stock | standard | pending | | |
| 7 | Retail/BulkInventory.vue | /commerce/2000290/retail/inventory | standard | pending | | |
| 8 | Retail/Pricing.vue | /commerce/2000290/retail/pricing | standard | pending | | |
| 9 | Retail/Hardware.vue | /commerce/2000290/retail/hardware | standard | pending | | |
| 10 | Retail/RetailSettings.vue | /commerce/2000290/retail/settings | standard | pending | | |

## Module 08 — Sales Channels   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | SalesChannels/SalesChannelsList.vue | /accounts/2000290/sales_channels | standard | pending | | |
| 2 | SalesChannels/CreateSalesChannel.vue | /accounts/2000290/sales_channels/new | standard | pending | | |
| 3 | SalesChannels/SalesChannelLocations.vue | /accounts/2000290/sales_channels/pos-store/locations | standard | pending | | |
| 4 | SalesChannels/SalesChannelLocationDetail.vue | /accounts/2000290/sales_channels/pos-store/locations/loc-bondi | standard | pending | | |
| 5 | SalesChannels/SalesChannelDetail.vue | /accounts/2000290/sales_channels/pos-store | standard | pending | | bespoke identity header is CORRECT (roadmap #9/#14) — don't "fix" it |

## Module 09 — Marketing   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Marketing/MarketingLanding.vue | /accounts/2000290/marketing | standard | pending | | |
| 2 | Marketing/ContentLanding.vue | /accounts/2000290/content | standard | pending | | |
| 3 | Marketing/CreateCampaign.vue | /accounts/2000290/campaigns/new | builder | pending | | fullPage wizard; roadmap #10 reference flow — likely compliant |
| 4 | Marketing/EmailCampaigns.vue | /accounts/2000290/campaigns | standard | pending | | roadmap #7/#12/#17 touched |
| 5 | Marketing/JourneyBuilder.vue | /accounts/2000290/journeys/1/builder | builder | pending | | fullPage; empty-canvas exemption (roadmap P1 #5) |
| 6 | Marketing/FormBuilder.vue | /accounts/2000290/acquisition/forms/create | builder | pending | | fullPage |
| 7 | Marketing/TransactionalEmail.vue | /accounts/2000290/sms_campaigns · /transactional_campaigns · /transactional_sms | standard | pending | | serves 3 routes — spot-check aliases |
| 8 | Marketing/CampaignTags.vue | /accounts/2000290/campaign_tags | standard | pending | | |
| 9 | Marketing/AcquisitionForms.vue | /accounts/2000290/acquisition · /lead_ads | standard | pending | | serves 2 routes |
| 10 | Marketing/LandingPages.vue | /accounts/2000290/landing_pages | standard | pending | | |
| 11 | Marketing/SignupForms.vue | /accounts/2000290/signup_forms | standard | pending | | |
| 12 | Marketing/Surveys.vue | /accounts/2000290/surveys | standard | pending | | |
| 13 | Marketing/Journeys.vue | /accounts/2000290/journeys | standard | pending | | |
| 14 | Marketing/DataJourneys.vue | /accounts/2000290/data_journeys | standard | pending | | |
| 15 | Marketing/EmailContent.vue | /accounts/2000290/contents | standard | pending | | roadmap #13 touched |
| 16 | Marketing/DynamicContent.vue | /accounts/2000290/dynamic_contents | standard | pending | | |
| 17 | Marketing/ImageLibrary.vue | /accounts/2000290/images | standard | pending | | roadmap #13 touched |
| 18 | Marketing/FooterManagement.vue | /accounts/2000290/footers | standard | pending | | |
| 19 | Marketing/OptimizeOnOpen.vue | /accounts/2000290/image_groups | standard | pending | | |
| 20 | Marketing/ContentFeeds.vue | /accounts/2000290/content_feeds | standard | pending | | |
| 21 | Marketing/CouponBanks.vue | /accounts/2000290/coupon_banks | standard | pending | | |
| 22 | Marketing/PreferencePages.vue | /accounts/2000290/preference_pages | standard | pending | | |
| 23 | Marketing/CountdownTimer.vue | /accounts/2000290/live_content_images | standard | pending | | |

## Module 10 — Service   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Service/Tickets.vue | /accounts/2000290/service · /chatbot | standard | pending | | serves 2 routes |

## Module 11 — Da Vinci   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | DaVinci/DaVinciAI.vue | /accounts/2000290/da-vinci · /da-vinci/dashboard | standard | pending | | serves 2 routes |
| 2 | DaVinci/DaVinciCopilot.vue | /accounts/2000290/da-vinci/copilot | builder | pending | | flush layout; chat surface |
| 3 | DaVinci/DaVinciExperience.vue | /accounts/2000290/da-vinci/experience | builder | pending | | fullPage; WebGL orb — intentional canvas hex (allowlisted); screenshots may freeze when tab hidden |

## Module 12 — App Store   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Integrations/Integrations.vue | /accounts/2000290/app_store | standard | pending | | |

## Module 13 — Settings   [module-status: pending]

<!-- Settings is reference-quality per the roadmap — expect many "already compliant" rows. SettingsLayout.vue (shell) is audited implicitly with row 1. -->

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Settings/pages/AccountDefaultsPage.vue | /accounts/2000290/settings/account-defaults | standard | pending | | default child; audit SettingsLayout.vue shell here too |
| 2 | Settings/pages/GeneralPage.vue | /accounts/2000290/settings/general | standard | pending | | 2 `!important` (roadmap note) |
| 3 | Settings/pages/NotificationsPage.vue | /accounts/2000290/settings/notifications | standard | pending | | |
| 4 | Settings/pages/UsersPermissionsPage.vue | /accounts/2000290/settings/users-permissions | standard | pending | | |
| 5 | Settings/pages/AuditLogPage.vue | /accounts/2000290/settings/audit-log | standard | pending | | |
| 6 | Settings/pages/ConnectionsPage.vue | /accounts/2000290/settings/connections | standard | pending | | |
| 7 | Settings/pages/DnsSetupPage.vue | /accounts/2000290/settings/dns-setup | standard | pending | | |
| 8 | Settings/pages/IntegrationsPage.vue | /accounts/2000290/settings/integrations | standard | pending | | |
| 9 | Settings/pages/TrackingAnalyticsPage.vue | /accounts/2000290/settings/tracking-analytics | standard | pending | | |
| 10 | Settings/pages/PrivacyConsentPage.vue | /accounts/2000290/settings/privacy-consent | standard | pending | | |
| 11 | Settings/pages/SecurityPage.vue | /accounts/2000290/settings/security | standard | pending | | |
| 12 | Settings/pages/StoreProfilePage.vue | /accounts/2000290/settings/store-profile | standard | pending | | |
| 13 | Settings/pages/SalesChannelsPage.vue | /accounts/2000290/settings/sales-channels | standard | pending | | |
| 14 | Settings/pages/PaymentAccountPage.vue | /accounts/2000290/settings/payment-account | standard | pending | | |
| 15 | Settings/pages/ServicePage.vue | /accounts/2000290/settings/service | standard | pending | | |
| 16 | Settings/pages/AiSettingsPage.vue | /accounts/2000290/settings/ai-settings | standard | pending | | |

## Module 14 — Billing & Misc   [module-status: pending]

| # | View file | URL(s) | Profile | Status | Commit | Notes |
|---|-----------|--------|---------|--------|--------|-------|
| 1 | Billing/BillingView.vue | /accounts/2000290/billing | standard | pending | | |
| 2 | Settings/DesignSystemDemo.vue | /accounts/2000290/design-system | standard | pending | | internal demo page — light touch |

## Progress log

- 2026-07-03 — Tracker generated from src/router/index.ts (61 route records → 102 view rows across 14 modules; redirect-only routes excluded).
