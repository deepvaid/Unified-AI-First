import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAccountsStore, type SubscriptionKey } from '@/stores/useAccounts'

declare module 'vue-router' {
  interface RouteMeta {
    fullPage?: boolean
    /** Builder/wizard chrome: real AppBar + rail-collapsed sidebar + rounded content frame. */
    builderShell?: boolean
    flush?: boolean
    railShell?: boolean
    storeEditor?: boolean
    merchandisingShell?: boolean
    merchScope?: 'search' | 'collections'
    reportKind?: 'snapshot' | 'search' | 'collections' | 'recommendations'
    requires?: SubscriptionKey
  }
}

const commerceGate = { requires: 'commerce' as const }

const routes: RouteRecordRaw[] = [
  // 1. Dashboard
  { path: '/accounts/:accountId/get-started', name: 'GetStarted', component: () => import('@/views/GetStarted.vue') },
  { path: '/accounts/:accountId/dashboards', name: 'DashboardsList', component: () => import('@/views/Dashboards/DashboardsList.vue') },
  { path: '/accounts/:accountId/dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/accounts/:accountId/dashboard/:dashboardId', name: 'DashboardDetail', component: () => import('@/views/DashboardView.vue') },
  { path: '/accounts/:accountId/analytics/live_view', name: 'LiveView', component: () => import('@/views/Analytics/LiveView.vue') },
  
  // 2. Analytics (Reports)
  { path: '/accounts/:accountId/analytics/monthly_totals', name: 'MonthlyTotals', component: () => import('@/views/Analytics/MonthlyTotals.vue') },
  { path: '/accounts/:accountId/analytics/orders', name: 'OrdersReport', component: () => import('@/views/Analytics/OrdersReport.vue') },
  { path: '/accounts/:accountId/analytics/dispatched_orders', name: 'DispatchedOrders', component: () => import('@/views/Analytics/DispatchedOrders.vue') },
  { path: '/accounts/:accountId/analytics/sales_summary', name: 'SalesSummary', component: () => import('@/views/Analytics/SalesSummary.vue') },
  { path: '/accounts/:accountId/analytics/erfm_report', name: 'ERFMReport', component: () => import('@/views/Analytics/ERFMReport.vue') },
  { path: '/accounts/:accountId/reports', name: 'CampaignReports', component: () => import('@/views/Analytics/CampaignReports.vue') },
  { path: '/accounts/:accountId/analytics/recurring_campaign_reports', name: 'RecurringCampaignReports', component: () => import('@/views/Analytics/RecurringCampaignReports.vue') },
  { path: '/accounts/:accountId/analytics/ab_campaign_reports', name: 'ABCampaignReports', component: () => import('@/views/Analytics/ABCampaignReports.vue') },
  { path: '/accounts/:accountId/analytics/test_campaign_reports', name: 'TestCampaignReports', component: () => import('@/views/Analytics/TestCampaignReports.vue') },
  { path: '/accounts/:accountId/analytics/website_reports', name: 'WebsiteReports', component: () => import('@/views/Analytics/WebsiteReports.vue') },
  { path: '/accounts/:accountId/analytics/journey_reports', name: 'JourneyReports', component: () => import('@/views/Analytics/JourneyReports.vue') },
  { path: '/accounts/:accountId/analytics/custom_reports', name: 'CustomReports', component: () => import('@/views/Analytics/CustomReports.vue') },
  { path: '/accounts/:accountId/analytics/transactional_reports', name: 'TransactionalReports', component: () => import('@/views/Analytics/TransactionalReports.vue') },
  { path: '/accounts/:accountId/analytics/log_inspector', name: 'LogInspector', component: () => import('@/views/Analytics/LogInspector.vue') },

  // 3. Contacts (Audience)
  { path: '/accounts/:accountId/contacts', name: 'AllContacts', component: () => import('@/views/Contacts/AllContacts.vue') },
  { path: '/accounts/:accountId/contacts/:id', name: 'ContactDetail', component: () => import('@/views/Contacts/ContactDetail.vue') },
  { path: '/accounts/:accountId/lists', name: 'ContactLists', component: () => import('@/views/Contacts/ContactLists.vue') },
  { path: '/accounts/:accountId/segments', name: 'Segments', component: () => import('@/views/Contacts/Segments.vue') },
  { path: '/accounts/:accountId/contact_fields', name: 'ContactFields', component: () => import('@/views/Contacts/ContactFields.vue') },
  { path: '/accounts/:accountId/tags', name: 'ContactTags', component: () => import('@/views/Contacts/ContactTags.vue') },
  { path: '/accounts/:accountId/relational_tables', name: 'RelationalTables', component: () => import('@/views/Contacts/RelationalTables.vue') },
  { path: '/accounts/:accountId/sql_queries', name: 'SQLQueries', component: () => import('@/views/Contacts/SQLQueries.vue') },
  { path: '/accounts/:accountId/secure_lists', name: 'SecureLists', component: () => import('@/views/Contacts/SecureLists.vue') },
  { path: '/accounts/:accountId/web_tracking', name: 'WebTracking', component: () => import('@/views/Contacts/WebTracking.vue') },

  // Commerce Cloud landing (shown when active account is not subscribed to commerce)
  { path: '/accounts/:accountId/commerce-cloud', name: 'CommerceCloudLanding', component: () => import('@/views/Commerce/CommerceCloudLanding.vue') },

  // 4. Products
  { path: '/commerce/:accountId/product_recommendations', name: 'ProductRecommendations', component: () => import('@/views/Products/ProductRecommendations.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/products', name: 'Products', component: () => import('@/views/Products/ProductsList.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/products/new', name: 'ProductNew', component: () => import('@/views/Products/ProductWizard.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/products/kits/new', name: 'ProductKitNew', component: () => import('@/views/Products/KitWizard.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/products/import/new/csv', name: 'ProductImportCsv', component: () => import('@/views/Products/ProductImportWizard.vue'), props: { source: 'csv' }, meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/products/import/new/ftp', name: 'ProductImportFtp', component: () => import('@/views/Products/ProductImportWizard.vue'), props: { source: 'ftp' }, meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/products/:productId/edit', name: 'ProductEdit', component: () => import('@/views/Products/ProductWizard.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/product_tax_category', name: 'ProductTaxCategory', component: () => import('@/views/Products/TaxCategories.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/products/collections', name: 'Collections', component: () => import('@/views/Products/Collections.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/inventory', name: 'Inventory', component: () => import('@/views/Products/Inventory.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/products/reservations', name: 'Reservations', component: () => import('@/views/Products/Reservations.vue'), meta: commerceGate },

  // 5. Commerce
  { path: '/commerce/:accountId/orders', name: 'SalesOrders', component: () => import('@/views/Commerce/SalesOrders.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/orders/drafts', name: 'DraftOrders', component: () => import('@/views/Commerce/DraftOrders.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/orders/drafts/new', name: 'CreateDraftOrder', component: () => import('@/views/Commerce/CreateDraftOrder.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/orders/drafts/:draftId(\\d+)', name: 'EditDraftOrder', component: () => import('@/views/Commerce/CreateDraftOrder.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/orders/:orderId(\\d+)', name: 'OrderDetail', component: () => import('@/views/Commerce/OrderDetail.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/fulfillments', name: 'Fulfillments', component: () => import('@/views/Commerce/Fulfillments.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/coupons', name: 'Coupons', component: () => import('@/views/Commerce/Coupons.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/promotions', name: 'Promotions', component: () => import('@/views/Commerce/Coupons.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/promotions/new', name: 'CreatePromotion', component: () => import('@/views/Commerce/CreatePromotion.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/promotions/:promoId/edit', name: 'EditPromotion', component: () => import('@/views/Commerce/CreatePromotion.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/custom_gift_cards', name: 'CustomGiftCards', component: () => import('@/views/Commerce/CustomGiftCards.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/purchasable_gift_cards', name: 'PurchasableGiftCards', component: () => import('@/views/Commerce/PurchasableGiftCards.vue'), meta: commerceGate },
  { path: '/commerce/:accountId/sales_channels', name: 'StoreSetup', redirect: to => ({ name: 'SalesChannels', params: { accountId: to.params.accountId } }), meta: commerceGate },

  // 5.5 Merchandise (MerchCloud)
  // Global entry: select an online channel before entering the workspace.
  { path: '/commerce/:accountId/merchandising', name: 'MerchandisingHome', component: () => import('@/views/Merchandising/MerchandisingChannelSelector.vue'), meta: commerceGate },
  // Canonical channel-scoped workspace. Existing merchandising views are reused
  // inside this shell while their data ownership is migrated in later slices.
  {
    path: '/accounts/:accountId/sales_channels/:channelId/merchandising',
    component: () => import('@/views/Merchandising/MerchandisingLayout.vue'),
    meta: { ...commerceGate, merchandisingShell: true },
    children: [
      { path: '', name: 'MerchandisingChannelOverview', component: () => import('@/views/Merchandising/MerchandisingChannelOverview.vue') },
      // Search tools (Findify parity, A12)
      { path: 'search/preview', name: 'MerchandisingChannelSearchPreview', component: () => import('@/views/Merchandising/SearchPreview.vue') },
      { path: 'search/pinning', name: 'MerchandisingChannelSearchPinning', component: () => import('@/views/Merchandising/SearchPinning.vue') },
      { path: 'search/pinning/:pinId', name: 'MerchandisingChannelSearchPinEdit', component: () => import('@/views/Merchandising/SearchPinningEditor.vue') },
      { path: 'search/rules', name: 'MerchandisingChannelSearchRules', component: () => import('@/views/Merchandising/SearchRules.vue') },
      { path: 'search/promo-cards', name: 'MerchandisingChannelSearchPromos', component: () => import('@/views/Merchandising/MerchPromoCards.vue'), meta: { merchScope: 'search' } },
      { path: 'search/banners', name: 'MerchandisingChannelSearchBanners', component: () => import('@/views/Merchandising/MerchBanners.vue'), meta: { merchScope: 'search' } },
      { path: 'search/blacklisting', name: 'MerchandisingChannelBlacklisting', component: () => import('@/views/Merchandising/SearchBlacklisting.vue') },
      { path: 'search/synonyms', name: 'MerchandisingChannelSynonyms', component: () => import('@/views/Merchandising/Synonyms.vue') },
      { path: 'search/redirects', name: 'MerchandisingChannelRedirects', component: () => import('@/views/Merchandising/PageRedirects.vue') },
      { path: 'search/content', name: 'MerchandisingChannelContent', component: () => import('@/views/Merchandising/SearchContent.vue') },
      // Smart Collections
      { path: 'smart-collections/collections', name: 'MerchandisingChannelCollections', component: () => import('@/views/Merchandising/Collections.vue') },
      { path: 'smart-collections/collections/:collectionId', name: 'MerchandisingChannelCollectionEdit', component: () => import('@/views/Merchandising/CollectionEditor.vue') },
      { path: 'smart-collections/default-merchandising', name: 'MerchandisingChannelDefaults', component: () => import('@/views/Merchandising/DefaultMerchandising.vue') },
      { path: 'smart-collections/default-merchandising/pinning/:ruleId', name: 'MerchandisingChannelPinning', component: () => import('@/views/Merchandising/PinningEditor.vue') },
      { path: 'smart-collections/default-merchandising/rules/:ruleId', name: 'MerchandisingChannelRuleEdit', component: () => import('@/views/Merchandising/RuleEditor.vue') },
      { path: 'smart-collections/promo-cards', name: 'MerchandisingChannelCollectionPromos', component: () => import('@/views/Merchandising/MerchPromoCards.vue'), meta: { merchScope: 'collections' } },
      { path: 'smart-collections/banners', name: 'MerchandisingChannelCollectionBanners', component: () => import('@/views/Merchandising/MerchBanners.vue'), meta: { merchScope: 'collections' } },
      // Recommendations
      { path: 'recommendations/:engineId', name: 'MerchandisingChannelEngineEdit', component: () => import('@/views/Merchandising/EngineEditor.vue') },
      { path: 'recommendations', name: 'MerchandisingChannelRecommendations', component: () => import('@/views/Merchandising/RecommendationEngines.vue') },
      // Analytics (one shared view, four reports)
      { path: 'analytics', name: 'MerchandisingChannelAnalytics', component: () => import('@/views/Merchandising/MerchandisingAnalytics.vue'), meta: { reportKind: 'snapshot' } },
      { path: 'analytics/search', name: 'MerchandisingChannelAnalyticsSearch', component: () => import('@/views/Merchandising/MerchandisingAnalytics.vue'), meta: { reportKind: 'search' } },
      { path: 'analytics/collections', name: 'MerchandisingChannelAnalyticsCollections', component: () => import('@/views/Merchandising/MerchandisingAnalytics.vue'), meta: { reportKind: 'collections' } },
      { path: 'analytics/recommendations', name: 'MerchandisingChannelAnalyticsRecommendations', component: () => import('@/views/Merchandising/MerchandisingAnalytics.vue'), meta: { reportKind: 'recommendations' } },
      // Settings
      { path: 'setup', name: 'MerchandisingChannelSetup', component: () => import('@/views/Merchandising/MerchandisingChannelSetup.vue') },
      { path: 'setup/product-sync', name: 'MerchandisingChannelProductSync', component: () => import('@/views/Merchandising/MerchProductSync.vue') },
      { path: 'setup/integrations', name: 'MerchandisingChannelIntegrations', component: () => import('@/views/Merchandising/MerchIntegrationsPage.vue') },
      { path: 'setup/fields', name: 'MerchandisingChannelFields', component: () => import('@/views/Merchandising/FieldTransformations.vue') },
      { path: ':pathMatch(.*)*', redirect: { name: 'MerchandisingChannelOverview' } },
    ],
  },
  // Compatibility redirects keep old bookmarks safe but require a channel
  // selection before opening a section.
  { path: '/commerce/:accountId/merchandising/:pathMatch(.*)*', redirect: to => ({ name: 'MerchandisingHome', params: { accountId: to.params.accountId } }), meta: commerceGate },

  // 5.6 Retail
  { path: '/commerce/:accountId/retail',              name: 'RetailHome',         component: () => import('@/views/Retail/RetailHome.vue'),       meta: commerceGate },
  { path: '/commerce/:accountId/retail/locations',    name: 'RetailLocations',    redirect: to => ({ name: 'SalesChannelLocations', params: { accountId: to.params.accountId, channelId: 'pos-store' } }), meta: commerceGate },
  { path: '/commerce/:accountId/retail/registers',    name: 'RetailRegisters',    component: () => import('@/views/Retail/Registers.vue'),        meta: commerceGate },
  { path: '/commerce/:accountId/retail/transactions', name: 'RetailTransactions', component: () => import('@/views/Retail/Transactions.vue'),     meta: commerceGate },
  { path: '/commerce/:accountId/retail/associates',   name: 'RetailAssociates',   component: () => import('@/views/Retail/Associates.vue'),       meta: commerceGate },
  { path: '/commerce/:accountId/retail/pos-preview',  name: 'RetailPosPreview',   component: () => import('@/views/Retail/PosPreview.vue'),       meta: { ...commerceGate, fullPage: true } },
  { path: '/commerce/:accountId/retail/stock',        name: 'RetailStock',        component: () => import('@/views/Retail/StockByLocation.vue'),  meta: commerceGate },
  { path: '/commerce/:accountId/retail/inventory',    name: 'RetailBulkInventory',component: () => import('@/views/Retail/BulkInventory.vue'),   meta: commerceGate },
  { path: '/commerce/:accountId/retail/pricing',      name: 'RetailPricing',      component: () => import('@/views/Retail/Pricing.vue'),          meta: commerceGate },
  { path: '/commerce/:accountId/retail/hardware',     name: 'RetailHardware',     component: () => import('@/views/Retail/Hardware.vue'),         meta: commerceGate },
  { path: '/commerce/:accountId/retail/settings',     name: 'RetailSettings',     component: () => import('@/views/Retail/RetailSettings.vue'),   meta: commerceGate },

  // 5.7 Sales Channels
  { path: '/accounts/:accountId/sales_channels', name: 'SalesChannels', component: () => import('@/views/SalesChannels/SalesChannelsList.vue'), meta: commerceGate },
  { path: '/accounts/:accountId/sales_channels/new', name: 'CreateSalesChannel', component: () => import('@/views/SalesChannels/CreateSalesChannel.vue'), meta: commerceGate },
  { path: '/accounts/:accountId/sales_channels/:channelId/locations', name: 'SalesChannelLocations', component: () => import('@/views/SalesChannels/SalesChannelLocations.vue'), meta: commerceGate },
  { path: '/accounts/:accountId/sales_channels/:channelId/locations/:locationId', name: 'SalesChannelLocationDetail', component: () => import('@/views/SalesChannels/SalesChannelLocationDetail.vue'), meta: commerceGate },
  { path: '/accounts/:accountId/sales_channels/:channelId/theme', name: 'StoreThemeBuilder', component: () => import('@/views/SalesChannels/StoreThemeBuilder.vue'), meta: { ...commerceGate, fullPage: true } },
  { path: '/accounts/:accountId/sales_channels/:channelId/theme/code', name: 'StoreThemeCode', component: () => import('@/views/SalesChannels/StoreThemeCode.vue'), meta: { ...commerceGate, fullPage: true } },
  // Store editor shell (UAT parity A06b): StoreEditorLayout adds a per-store section
  // rail around the hub + section pages. URLs/route names unchanged; fullPage theme
  // routes and POS-oriented locations routes stay standalone above.
  {
    path: '/accounts/:accountId/sales_channels/:channelId',
    component: () => import('@/views/SalesChannels/StoreEditorLayout.vue'),
    meta: { ...commerceGate, storeEditor: true },
    children: [
      { path: '', name: 'SalesChannelDetail', component: () => import('@/views/SalesChannels/SalesChannelDetail.vue') },
      { path: 'navigation', name: 'StoreNavigation', component: () => import('@/views/SalesChannels/StoreNavigation.vue') },
      { path: 'navigation/new', name: 'StoreNavigationMenuCreate', component: () => import('@/views/SalesChannels/StoreNavigationMenuEditor.vue') },
      { path: 'navigation/:menuId', name: 'StoreNavigationMenuEdit', component: () => import('@/views/SalesChannels/StoreNavigationMenuEditor.vue') },
      { path: 'pages', name: 'StorePages', component: () => import('@/views/SalesChannels/StoreContentList.vue'), meta: { contentKind: 'page' } },
      { path: 'pages/new', name: 'StorePageCreate', component: () => import('@/views/SalesChannels/StoreContentEditor.vue'), meta: { contentKind: 'page' } },
      { path: 'pages/:entryId', name: 'StorePageEdit', component: () => import('@/views/SalesChannels/StoreContentEditor.vue'), meta: { contentKind: 'page' } },
      { path: 'blogs', name: 'StoreBlogs', component: () => import('@/views/SalesChannels/StoreContentList.vue'), meta: { contentKind: 'blog' } },
      { path: 'blogs/new', name: 'StoreBlogCreate', component: () => import('@/views/SalesChannels/StoreContentEditor.vue'), meta: { contentKind: 'blog' } },
      { path: 'blogs/:entryId', name: 'StoreBlogEdit', component: () => import('@/views/SalesChannels/StoreContentEditor.vue'), meta: { contentKind: 'blog' } },
      { path: 'campaigns', name: 'StoreCampaigns', component: () => import('@/views/SalesChannels/StoreCampaigns.vue') },
      { path: 'assets', name: 'StoreAssets', component: () => import('@/views/SalesChannels/StoreAssets.vue') },
    ],
  },

  // 6. Marketing
  { path: '/accounts/:accountId/marketing', name: 'MarketingHome', component: () => import('@/views/Marketing/MarketingLanding.vue') },
  { path: '/accounts/:accountId/content', name: 'ContentLanding', component: () => import('@/views/Marketing/ContentLanding.vue') },
  { path: '/accounts/:accountId/campaigns/new', name: 'CreateCampaign', component: () => import('@/views/Marketing/CreateCampaign.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/campaigns', name: 'EmailCampaigns', component: () => import('@/views/Marketing/EmailCampaigns.vue') },
  { path: '/accounts/:accountId/campaigns/:id/report', name: 'CampaignReport', component: () => import('@/views/Marketing/CampaignReportDetail.vue') },
  { path: '/accounts/:accountId/journeys/new', name: 'CreateJourney', component: () => import('@/views/Marketing/CreateJourney.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/journeys/:id/builder', name: 'JourneyBuilder', component: () => import('@/views/Marketing/JourneyBuilder.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/acquisition/forms/create', name: 'FormBuilder', component: () => import('@/views/Marketing/FormBuilder.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/sms_campaigns/new', name: 'CreateSmsCampaign', component: () => import('@/views/Marketing/CreateSmsCampaign.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/sms_campaigns', name: 'SmsCampaigns', component: () => import('@/views/Marketing/SmsCampaigns.vue') },
  { path: '/accounts/:accountId/transactional_campaigns/new', name: 'CreateTransactional', component: () => import('@/views/Marketing/CreateTransactional.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/transactional_campaigns', name: 'TransactionalEmail', component: () => import('@/views/Marketing/TransactionalEmail.vue') },
  { path: '/accounts/:accountId/transactional_sms/new', name: 'CreateTransactionalSms', component: () => import('@/views/Marketing/CreateTransactionalSms.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/transactional_sms', name: 'TransactionalSms', component: () => import('@/views/Marketing/TransactionalSms.vue') },
  { path: '/accounts/:accountId/campaign_tags', name: 'CampaignTags', component: () => import('@/views/Marketing/CampaignTags.vue') },
  { path: '/accounts/:accountId/acquisition', name: 'AcquisitionForms', component: () => import('@/views/Marketing/AcquisitionForms.vue') },
  { path: '/accounts/:accountId/landing_pages', name: 'LandingPages', component: () => import('@/views/Marketing/LandingPages.vue') },
  { path: '/accounts/:accountId/landing_pages/templates', name: 'LandingPageTemplates', component: () => import('@/views/Marketing/LandingPageTemplates.vue') },
  { path: '/accounts/:accountId/landing_pages/editor/:id/edit', name: 'LandingPageEditor', component: () => import('@/views/Marketing/LandingPageEditor.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/lead_ads', name: 'LeadAds', component: () => import('@/views/Marketing/AcquisitionForms.vue') },
  { path: '/accounts/:accountId/signup_forms', name: 'SignupForms', component: () => import('@/views/Marketing/SignupForms.vue') },
  { path: '/accounts/:accountId/surveys', name: 'Surveys', component: () => import('@/views/Marketing/Surveys.vue') },
  { path: '/accounts/:accountId/journeys', name: 'Journeys', component: () => import('@/views/Marketing/Journeys.vue') },
  { path: '/accounts/:accountId/data_journeys', name: 'DataJourneys', component: () => import('@/views/Marketing/DataJourneys.vue') },
  { path: '/accounts/:accountId/data_journeys/:id/builder', name: 'DataJourneyBuilder', component: () => import('@/views/Marketing/JourneyBuilder.vue'), meta: { fullPage: true, flowDomain: 'data' } },
  { path: '/accounts/:accountId/contents', name: 'EmailContent', component: () => import('@/views/Marketing/EmailContent.vue') },
  { path: '/accounts/:accountId/contents/editor/:id', name: 'EmailContentEditor', component: () => import('@/views/Marketing/EmailContentEditor.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/dynamic_contents', name: 'DynamicContent', component: () => import('@/views/Marketing/DynamicContent.vue') },
  { path: '/accounts/:accountId/images', name: 'ImageLibrary', component: () => import('@/views/Marketing/ImageLibrary.vue') },
  { path: '/accounts/:accountId/footers', name: 'FooterManagement', component: () => import('@/views/Marketing/FooterManagement.vue') },
  { path: '/accounts/:accountId/image_groups', name: 'OptimizeOnOpen', component: () => import('@/views/Marketing/OptimizeOnOpen.vue') },
  { path: '/accounts/:accountId/content_feeds', name: 'ContentFeeds', component: () => import('@/views/Marketing/ContentFeeds.vue') },
  { path: '/accounts/:accountId/coupon_banks', name: 'CouponBanks', component: () => import('@/views/Marketing/CouponBanks.vue') },
  { path: '/accounts/:accountId/preference_pages', name: 'PreferencePages', component: () => import('@/views/Marketing/PreferencePages.vue') },
  { path: '/accounts/:accountId/live_content_images', name: 'CountdownTimer', component: () => import('@/views/Marketing/CountdownTimer.vue') },

  // 7. Service
  { path: '/accounts/:accountId/service', name: 'Tickets', component: () => import('@/views/Service/Tickets.vue') },
  { path: '/accounts/:accountId/chatbot', name: 'ChatbotList', component: () => import('@/views/Service/ChatbotList.vue') },
  { path: '/accounts/:accountId/chatbot/archived', name: 'ChatbotArchived', component: () => import('@/views/Service/ChatbotArchived.vue') },
  { path: '/accounts/:accountId/chatbot/:id', name: 'ChatbotBuilder', component: () => import('@/views/Service/ChatbotBuilder.vue'), meta: { fullPage: true } },

  // 8. Da Vinci
  { path: '/accounts/:accountId/da-vinci', name: 'DaVinciAI', component: () => import('@/views/DaVinci/DaVinciAI.vue') },
  { path: '/accounts/:accountId/da-vinci/dashboard', name: 'DaVinciDashboard', component: () => import('@/views/DaVinci/DaVinciAI.vue') },
  {
    path: '/accounts/:accountId/da-vinci/copilot/:conversationId?',
    name: 'DaVinciCopilot',
    component: () => import('@/views/DaVinci/DaVinciCopilot.vue'),
    meta: { flush: true },
  },
  {
    path: '/accounts/:accountId/da-vinci/experience',
    name: 'DaVinciExperience',
    component: () => import('@/views/DaVinci/DaVinciExperience.vue'),
    meta: { fullPage: true },
  },

  // 9. App Store (formerly Integrations)
  { path: '/accounts/:accountId/app_store', name: 'AppStore', component: () => import('@/views/Integrations/Integrations.vue') },

  // 10. Settings & User Account
  {
    path: '/accounts/:accountId/settings',
    name: 'Settings',
    component: () => import('@/views/Settings/SettingsLayout.vue'),
    redirect: { name: 'SettingsAccountDefaults' },
    meta: { railShell: true },
    children: [
      { path: 'general',             name: 'SettingsGeneral',            component: () => import('@/views/Settings/pages/GeneralPage.vue') },
      { path: 'notifications',       name: 'SettingsNotifications',      component: () => import('@/views/Settings/pages/NotificationsPage.vue') },
      { path: 'account-defaults',    name: 'SettingsAccountDefaults',    component: () => import('@/views/Settings/pages/AccountDefaultsPage.vue') },
      { path: 'account-billing',     redirect: to => ({ name: 'Billing', params: { accountId: to.params.accountId } }) },
      { path: 'users-permissions',   name: 'SettingsUsersPermissions',   component: () => import('@/views/Settings/pages/UsersPermissionsPage.vue') },
      { path: 'roles',               name: 'SettingsRoles',              component: () => import('@/views/Settings/pages/RolesPermissionsPage.vue') },
      { path: 'roles/:roleId',       name: 'SettingsRoleDetail',         component: () => import('@/views/Settings/pages/RoleDetailPage.vue') },
      { path: 'audit-log',           name: 'SettingsAuditLog',           component: () => import('@/views/Settings/pages/AuditLogPage.vue') },
      { path: 'connections',         name: 'SettingsConnections',        component: () => import('@/views/Settings/pages/ConnectionsPage.vue') },
      { path: 'dns-setup',           name: 'SettingsDnsSetup',           component: () => import('@/views/Settings/pages/DnsSetupPage.vue') },
      { path: 'integrations',        name: 'SettingsIntegrations',       component: () => import('@/views/Settings/pages/IntegrationsPage.vue') },
      { path: 'tracking-analytics',  name: 'SettingsTrackingAnalytics',  component: () => import('@/views/Settings/pages/TrackingAnalyticsPage.vue') },
      { path: 'privacy-consent',     name: 'SettingsPrivacyConsent',     component: () => import('@/views/Settings/pages/PrivacyConsentPage.vue') },
      { path: 'security',            name: 'SettingsSecurity',           component: () => import('@/views/Settings/pages/SecurityPage.vue') },
      { path: 'store-profile',       name: 'SettingsStoreProfile',       component: () => import('@/views/Settings/pages/StoreProfilePage.vue') },
      { path: 'sales-channels',      name: 'SettingsSalesChannels',      component: () => import('@/views/Settings/pages/SalesChannelsPage.vue') },
      { path: 'payment-account',     name: 'SettingsPaymentAccount',     component: () => import('@/views/Settings/pages/PaymentAccountPage.vue') },
      { path: 'service',             name: 'SettingsService',            component: () => import('@/views/Settings/pages/ServicePage.vue') },
      { path: 'ai-settings',         name: 'SettingsAiSettings',         component: () => import('@/views/Settings/pages/AiSettingsPage.vue') },
    ],
  },
  // Account & Billing — standalone area, separate from app Settings
  { path: '/accounts/:accountId/billing', name: 'Billing', component: () => import('@/views/Billing/BillingView.vue') },

  // PLG — trial signup, plan selection, mock hosted checkout
  { path: '/signup', name: 'Signup', component: () => import('@/views/Plg/SignupView.vue'), meta: { fullPage: true } },
  { path: '/accounts/:accountId/plans', name: 'Plans', component: () => import('@/views/Plg/PlansView.vue') },
  { path: '/accounts/:accountId/checkout', name: 'Checkout', component: () => import('@/views/Plg/CheckoutView.vue'), meta: { fullPage: true } },

  { path: '/accounts/:accountId/design-system', name: 'DesignSystemDemo', component: () => import('@/views/Settings/DesignSystemDemo.vue') },

  // Presentation surfaces — stakeholder showcase landing, talk deck, reel title cards
  { path: '/showcase', name: 'Showcase', component: () => import('@/views/Showcase/ShowcaseView.vue'), meta: { fullPage: true } },
  { path: '/wow', redirect: '/showcase' },
  { path: '/deck', name: 'Deck', component: () => import('@/views/Deck/DeckView.vue'), meta: { fullPage: true } },
  { path: '/reel', name: 'Reel', component: () => import('@/views/Reel/ReelView.vue'), meta: { fullPage: true } },

  // Redirect root to dashboard
  { path: '/', redirect: '/accounts/2000290/dashboard' },
  // Catchall
  { path: '/:pathMatch(.*)*', redirect: '/accounts/2000290/dashboard' }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const accounts = useAccountsStore()

  // Keep the active account in sync with the account in the URL, so every
  // subscription gate (sidebar locks, chatbot capabilities, billing, settings)
  // reflects the account you are actually looking at — not a stale switcher choice.
  const routeAccountId = Array.isArray(to.params.accountId) ? to.params.accountId[0] : to.params.accountId
  if (routeAccountId && routeAccountId !== accounts.activeId && accounts.accounts.some(a => a.id === routeAccountId)) {
    accounts.switchTo(routeAccountId)
  }

  const required = to.meta.requires
  if (!required) return true
  if (accounts.hasSubscription(required)) return true
  return {
    name: 'CommerceCloudLanding',
    params: { accountId: accounts.activeId },
  }
})

export default router
