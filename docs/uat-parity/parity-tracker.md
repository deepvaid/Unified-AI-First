# UAT Parity Tracker

<!-- STATE FILE — the uat-parity skill + phase prompts parse this. Keep the table formats intact. -->
<!-- Two parts: Part A (UAT inventory, filled by the crawl phase) and Part B (gap matrix, filled by gap analysis). -->
<!-- This is the ONLY memory between sessions. Every fact learned in a session is written here before the session ends. -->
<!-- Method + rules: docs/uat-parity/parity-playbook.md. Kickoff prompts: docs/uat-parity/phase-prompts.md. -->

## Defaults

<!-- Fill <UAT_URL> once, locally. NEVER commit real credentials, cookies, tokens, or session data. -->

- UAT base URL: `https://uat.maropost.com/accounts/2000290/dashboard` — no credentials / cookies / session tokens.
- Prototype accountId: `2000290` (the account the prototype seeds; used for every prototype preview URL).
- Prototype dev server: `npm run dev` → `http://localhost:5173` (build/verify phases; Claude Code: `preview_start` "Main App").
- Screenshot path: `maropost-screenshots/uat/<module-slug>/<page-slug>.png` — gitignored; on disk only, referenced by path, never committed, never re-read into context unless building that exact page.
- Crawl conventions: one module per crawl pass; record every nav item as a row; open primary CTAs (Create / Edit / Add) one level deep to capture wizards/drawers; screenshot each distinct page.
- Security: the UAT URL lives only in this Defaults block. Session cookies, credentials, and tokens are never written to any file or commit.

## Initial Read-Only Observations (2026-07-03)

<!-- Captured from a user-authenticated, read-only UAT browser pass. No auth storage was exported. -->

- UAT dashboard access confirmed at `/accounts/2000290/dashboard`.
- Main UAT modules observed in the shell/sidebar: Dashboard, Analytics, CDP, Products, Marketing, Commerce, Retail, Service, Da Vinci AI, Apps, Settings.
- Match UAT to the prototype by feature intent, not exact URL. UAT often uses legacy paths while the Vue prototype uses newer route families.
- Likely represented but route-mismatched in the prototype: Analytics reports, CDP lists/fields/SQL/web tracking, Products, Commerce orders/promotions, Service tickets/chatbots, Da Vinci, Apps.
- Needs deeper crawl before verdict: Retail. UAT exposed a top-level `/preview/retail` link, while the prototype has multiple Retail routes.
- Prototype-only or not visible from the initial UAT sidebar pass: Merchandise, dashboard management, several Retail sub-pages, SMS / Transactional SMS / Lead Ads.
- Settings is a major gap candidate. The UAT settings landing page uses card groups: Connections (API Keys, JSON Web Token, Relational Tables, SFTP Access, SFTP Import and Export, HTTP Post URL, Conversion Attribution), DNS Setup (Sending Domains, Link Tracking Domains, Brand Management), Contacts (Global Suppression Lists, Bulk Delete Contacts, Cleansing Rules), Campaigns (Test Campaign Subject Line), Store Setup (Region, Account Config, Manage Reasons, Locations, Product Categories, Taxes, Packages, Fulfillment Agent, Shipping Settings, Email Templates), Others (301 Redirects, Custom Domains, Custom Fields, Archives), Service (Reply Templates, Ticket Types, Ticket Tags, Ticket Assignment, SLA), Channels (Support Email).
- Sensitive settings cards such as API Keys, JSON Web Token, SFTP Access, and SFTP Import and Export must only be opened in an explicitly scoped settings pass with redaction rules.
- UAT shell console baseline observed during dashboard/settings loads: Findify/MHC merchant fetch 403, Split auth 400, Vue/router warnings, and a single-spa marketing mount warning. Treat these as UAT audit context, not prototype regressions.

## Part A — UAT Inventory

<!-- Filled by the crawl phase (phase-prompts.md Prompt 1), one module per session. -->
<!-- One `## A<NN> — <Module>   [crawl-status: pending|crawled|blocked]` section per UAT top-level nav module (seeded by Prompt 0). -->
<!-- Working module = first section whose [crawl-status] is `pending`. -->
<!-- Row columns: -->
<!--   #  ............. sequential within the module -->
<!--   UAT page/flow .. human title as shown in UAT -->
<!--   UAT path ....... path after the base URL (no host, no query credentials) -->
<!--   Type ........... page | wizard | detail | tab -->
<!--   Screenshot ..... maropost-screenshots/uat/<module>/<slug>.png (path only), or `—` for URL-only inventory rows -->
<!--   Crawl status ... pending | crawled | blocked -->
<!-- Do NOT paste page HTML, DOM dumps, or transcripts here — titles, paths, types, and screenshot paths only. -->

Part A has been seeded with the top-level modules observed in the initial read-only UAT pass. URL rows below came from an authenticated UAT sidebar/settings inventory; screenshot/deep-flow crawling remains separate.

## A01 — Dashboard   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Dashboard | /accounts/2000290/dashboard | page | — | crawled |

## A02 — Analytics   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Monthly Totals | /commerce/2000290/reports/monthly-totals | page | — | crawled |
| 2 | Sales by Order | /commerce/2000290/reports/sales-by-order | page | — | crawled |
| 3 | Dispatched Orders | /commerce/2000290/reports/dispatched-orders | page | — | crawled |
| 4 | Sales Summary | /commerce/2000290/reports/sales-summary | page | — | crawled |
| 5 | eRFM Report | /accounts/2000290/erfm_report | page | — | crawled |
| 6 | Campaign Reports | /accounts/2000290/reports | page | — | crawled |
| 7 | Recurring Campaign Reports | /accounts/2000290/reports/recurring_campaign_report | page | — | crawled |
| 8 | A/B Campaign Reports | /accounts/2000290/ab_reports | page | — | crawled |
| 9 | Test Campaign Reports | /accounts/2000290/reports/test_reports | page | — | crawled |
| 10 | Website Reports | /accounts/2000290/website_reports | page | — | crawled |
| 11 | Journey Reports | /accounts/2000290/reports/journeys | page | — | crawled |
| 12 | Custom Reports | /accounts/2000290/analytics/custom_reports | page | — | crawled |
| 13 | Transactional Email Reports | /accounts/2000290/transactional_campaigns/reports | page | — | crawled |
| 14 | Log Inspector | /accounts/2000290/get_logs | page | — | crawled |

## A03 — CDP   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | All Contacts | /accounts/2000290/contacts | page | — | crawled |
| 2 | Contact Lists | /accounts/2000290/lists | page | — | crawled |
| 3 | Segments | /accounts/2000290/segments | page | — | crawled |
| 4 | Contact Fields | /accounts/2000290/custom_fields | page | — | crawled |
| 5 | Contact Tags | /accounts/2000290/tags | page | — | crawled |
| 6 | Relational Tables | /accounts/2000290/relational_tables | page | — | crawled |
| 7 | SQL Queries | /accounts/2000290/relational_queries | page | — | crawled |
| 8 | Secure Lists | /accounts/2000290/secure_lists | page | — | crawled |
| 9 | Web Tracking | /accounts/2000290/websites | page | — | crawled |

## A04 — Products   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Product Recommendations | /accounts/2000290/product_recommendations | page | — | crawled |
| 2 | Products | /commerce/2000290/products | page | — | crawled |
| 3 | Product Tax Category | /commerce/2000290/products/tax-categories | page | — | crawled |
| 4 | Collections | /commerce/2000290/products/collections | page | — | crawled |
| 5 | Inventory | /commerce/2000290/inventory | page | — | crawled |
| 6 | Reservations | /commerce/2000290/inventory/reservations | page | — | crawled |

## A05 — Marketing   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Email Campaigns | /accounts/2000290/campaigns | page | — | crawled |
| 2 | Transactional Email | /accounts/2000290/transactional_campaigns | page | — | crawled |
| 3 | Campaign Tags | /accounts/2000290/ctags | page | — | crawled |
| 4 | Acquisition Forms | /accounts/2000290/acquisition/forms | page | — | crawled |
| 5 | Landing Pages | /accounts/2000290/landing_pages | page | — | crawled |
| 6 | Signup Forms (Old) | /accounts/2000290/forms | page | — | crawled |
| 7 | Surveys | /accounts/2000290/surveys | page | — | crawled |
| 8 | Journeys | /accounts/2000290/journeys | page | — | crawled |
| 9 | Data Journeys | /accounts/2000290/data_journeys | page | — | crawled |
| 10 | Email Content | /accounts/2000290/contents | page | — | crawled |
| 11 | Dynamic Content | /accounts/2000290/dynamic_contents | page | — | crawled |
| 12 | Image Library | /accounts/2000290/folders | page | — | crawled |
| 13 | Footer Management | /accounts/2000290/footers | page | — | crawled |
| 14 | Optimise on Open | /accounts/2000290/image_groups | page | — | crawled |
| 15 | Content Feeds | /accounts/2000290/content_feeds | page | — | crawled |
| 16 | Coupon Banks | /accounts/2000290/coupon_banks | page | — | crawled |
| 17 | Preference Management | /accounts/2000290/preference_pages | page | — | crawled |
| 18 | Countdown Timer | /accounts/2000290/live_content_images | page | — | crawled |
| 19 | Journeys — template gallery | /accounts/2000290/journeys/new | wizard | — | crawled |
| 20 | Journeys — settings form | /accounts/2000290/journeys/new/scratch | wizard | — | crawled |
| 21 | Journeys — builder canvas (palette: 14 triggers / 10 actions / 4 filters / 2 delays / end) | /accounts/2000290/journeys/102/builder | detail | — | crawled |
| 22 | Journeys — node config modal | (builder) | tab | — | crawled |
| 23 | Journey Reports | /accounts/2000290/reports/journeys | page | — | blocked |
| 24 | Email Campaigns — create wizard (Details → Contacts → Content → Schedule) | /accounts/2000290/campaigns/new/email | wizard | — | crawled |
| 25 | Email Campaign — report (Dashboard / Overlay / ISP / Details tabs) | /accounts/2000290/campaigns/203 | detail | — | crawled |
| 26 | Transactional Email — create form | /accounts/2000290/transactional_campaigns/new | wizard | — | crawled |
| 27 | Campaign Tag — create modal | /accounts/2000290/ctags | wizard | — | crawled |
| 28 | Survey — create modal | /accounts/2000290/surveys | wizard | — | crawled |
| 29 | Acquisition Forms — template picker | /accounts/2000290/acquisition/forms/select | wizard | — | crawled |
| 30 | Acquisition Forms — 5-step builder | /accounts/2000290/acquisition/forms/create | wizard | — | crawled |
| 31 | Landing Pages — template library | /accounts/2000290/landing_pages/template | wizard | — | crawled |
| 32 | Email Content — drag & drop editor | /accounts/2000290/contents/drag_and_drop_beta/3660 | detail | — | crawled |
| 33 | Data Journeys — builder canvas (8 triggers / 6 actions) | /accounts/2000290/data_journeys/3/builder | detail | — | crawled |

## A06 — Commerce   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Sales Orders | /commerce/2000290/orders | page | — | crawled |
| 2 | Draft Orders | /commerce/2000290/orders/draft | page | — | crawled |
| 3 | Fulfillment | /commerce/2000290/fulfillment | page | — | crawled |
| 4 | Promotions | /commerce/2000290/promotions | page | — | crawled |
| 5 | Custom Gift Cards | /commerce/2000290/gift-cards | page | — | crawled |
| 6 | Purchasable Gift Cards | /commerce/2000290/gift-cards/Purchasable | page | — | crawled |
| 7 | Sales Channels | /commerce/2000290/sales-channel | page | — | crawled |

## A06b — Commerce — Store Editor (Sales Channels ▸ store)   [crawl-status: crawled]

Crawled 2026-07-10 (user-directed slice) on the **sandbox** base `https://sandbox.maropost.com/commerce/112201/stores/4/` (store #4 "Manisha's Testing", account 112201 — different env than the UAT Defaults base; no credentials/cookies recorded). The store editor is a per-store shell: its own left sidebar (9 sections below) + "Switch to Main" back-link + store switcher; breadcrumb `Sales Channels > <store> > <section>`. Screenshots not captured to disk — URL-only rows per existing convention.

| # | UAT page/flow | UAT path (after stores/4) | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | General — store profile (identity chips, Store URL, business identity, contact, favicon, official/shipping/return address) | /general | page | — | crawled |
| 2 | Themes — installed table + "Themes In Focus" gallery + Upload Theme | /themes | page | — | crawled |
| 3 | Pages — list (Image/Page Name/Status/Published/Updated/kebab) | /pages | page | — | crawled |
| 4 | Pages — create (Title, WYSIWYG, SEO settings; right rail: Status/Template/Image) | /pages/new | wizard | — | crawled |
| 5 | Blogs — list (same columns as Pages; empty "No records found") | /blogs | page | — | crawled |
| 6 | Blogs — SEO Settings modal (Title, Meta Description) | /blogs (modal) | wizard | — | crawled |
| 7 | Blogs — create (identical form to Pages create) | /blogs/new | wizard | — | crawled |
| 8 | Navigation — menu list (Menu Name / Menu Items chips / Status / kebab: Update Status·Edit·Delete) | /navigation | page | — | crawled |
| 9 | Navigation — create menu (same form as edit; status defaults Inactive) | /navigation/new | wizard | — | crawled |
| 10 | Navigation — edit menu "Navigation Details" (name*, flat item rows: Menu Page Name* + Link To* combobox, drag-grip reorder, row delete, + Add New Page; right rail Navigation Status) | /navigation/:menuId | detail | — | crawled |
| 11 | Campaigns — "Campaign Settings" list (Name/Targets/Status/From/To/Updated/kebab) | /campaigns | page | — | crawled |
| 12 | Campaigns — Add New Campaign modal (Name*, Targets, Start/End date+time) | /campaigns (modal) | wizard | — | crawled |
| 13 | Assets — image grid (filename bars, sort by Uploaded At, Upload Assets, pagination) | /assets | page | — | crawled |
| 14 | Integrations — cards: Google Analytics / HCaptcha / Google Places (all Inactive) | /integrations | page | — | crawled |
| 15 | Store Settings — landing cards: Website Configuration / Abandoned Cart / Payments | /settings | page | — | crawled |
| 16 | Store Settings — Website Configuration (cookie banner toggle+copy, homepage SEO title/description, sitemap URL) | /settings/website-configuration | tab | — | crawled |
| 17 | Store Settings — Abandoned Cart | /settings (card) | tab | — | pending |
| 18 | Store Settings — Payments | /settings (card) | tab | — | blocked |

Row 18 blocked by policy (payment configuration is credential-bearing; not opened). Row 17 left for a later settings pass.

## Store editor observations (2026-07-10)

<!-- Compact digest from the store-editor deep crawl. Redesign input; no transcripts. -->

- **Navigation data model is FLAT** — menu = name + status + ordered rows of {Menu Page Name, Link To}; **no nesting/indent anywhere**. Reorder = drag grip on row hover; delete = trash on row hover; "+ ADD NEW PAGE" appends a row. Nesting would be a NEW feature — excluded from the parity rebuild.
- Link To is a combobox: paste a custom URL, or select **Homepage · Search · Collection List · Collection ▸ (pick from 25) · Product ▸ · Page ▸ (2) · Blog**. Resource picking drills into a near-full-width overlay panel with its own search — it overlaps the editor sidebar and loses context (pain).
- Menu list shows top-level item names as chips per row; Status = outlined Active (green) / Inactive (red) chip; kebab = Update Status / Edit / Delete. Create defaults status to Inactive.
- Unsaved-changes guard = native browser `beforeunload` ("Leave site?"). In-app CANCEL opens a modal titled "Cancel Navigation Creation … cannot be undone" **even on the edit screen**, with CANCEL/YES buttons (double-negative; misleading copy) (pain).
- Pages and Blogs share one create form: Title* + rich-text WYSIWYG + SEO settings; right rail Status (default Inactive) / Template (Default) / Image upload. Blogs list header has a separate SEO Settings modal.
- Empty lists render bare "No records found" text — no icon, description, or CTA (pain). Full page reloads cold-boot the whole SPA behind a "Preparing an optimised workspace" splash, 5–10s (pain).
- Store editor chrome: dark sidebar with 9 sections; every form page uses top-right CANCEL/SAVE; required fields flag red only after interaction.

## A06c — Merchandising Cloud   [crawl-status: crawled]

Authenticated read-only crawl completed 2026-07-10 in the user-authenticated in-app browser. The application spans the legacy `dashboard.findify.io` shell and a newer `maropost-dashboard.findify.io/:merchantId` shell. Numeric merchant IDs are replaced with `:merchantId`; queries are omitted. Header/store identifiers were cropped from local screenshots. No cookies, storage, bearer tokens, request bodies, network payloads, API keys, or tracking scripts were inspected or exported, and no configuration was saved, published, deleted, uploaded, invited, or submitted.

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Merchandising overview / sync snapshot | / | page | merchandising-findify/overview.png | crawled |
| 2 | Search — Pinning | /solutions/search/pinning | page | merchandising-findify/search-pinning.png | crawled |
| 3 | Search — Merchandising Rules | /solutions/search/rules | page | merchandising-findify/search-rules.png | crawled |
| 4 | Search — Promo Cards | /solutions/search/promos | page | merchandising-findify/search-promo-cards.png | crawled |
| 5 | Search — Banners | /solutions/search/banners | page | merchandising-findify/search-banners.png | crawled |
| 6 | Search — blacklist suggestions | /solutions/search/blacklisting/suggestions | page | merchandising-findify/search-blacklist-suggestions.png | crawled |
| 7 | Search — blacklist product matches | /solutions/search/blacklisting/products | page | merchandising-findify/search-blacklist-products.png | crawled |
| 8 | Search — Synonyms (legacy) | /solutions/search/synonyms | page | merchandising-findify/search-synonyms.png | crawled |
| 9 | Search — Synonyms (new experience) | /:merchantId/search/synonyms | page/editor | merchandising-findify/search-synonyms-new-dashboard.png | crawled |
| 10 | Search — Page Redirects | /solutions/search/redirects | page/editor | merchandising-findify/search-redirects.png | crawled |
| 11 | Search — Preview (legacy handoff) | /solutions/search/preview | page | merchandising-findify/search-preview.png | crawled |
| 12 | Search — Preview (new experience) | /:merchantId/search/preview | page | merchandising-findify/search-preview-new-dashboard.png | crawled |
| 13 | Search — Content BETA | /solutions/smart-collections/collections | redirect | merchandising-findify/search-content.png | redirected to Collections |
| 14 | Smart Collections — Collections | /solutions/smart-collections/collections | page | merchandising-findify/smart-collections-list.png | crawled |
| 15 | Smart Collections — create collection | /solutions/smart-collections/collections/create | wizard | merchandising-findify/smart-collections-create-products.png | crawled, draft discarded |
| 16 | Smart Collections — default merchandising | /:merchantId/smart-collections/default-merchandising | page/tabs | merchandising-findify/smart-collections-default-merchandising.png | crawled |
| 17 | Smart Collections — pinning editor | /:merchantId/smart-collections/default-merchandising/pinning/create | editor | merchandising-findify/smart-collections-pinning-editor.png | crawled, draft discarded |
| 18 | Smart Collections — rules (legacy) | /solutions/smart-collections/rules | page | merchandising-findify/smart-collections-rules-legacy.png | crawled |
| 19 | Smart Collections — rule editor + preview | /:merchantId/smart-collections/default-merchandising/merch-rule/create | editor | merchandising-findify/smart-collections-merchandising-rule-editor.png | crawled, draft discarded |
| 20 | Smart Collections — Promo Cards | /solutions/smart-collections/promos | page | merchandising-findify/smart-collections-promo-cards.png | crawled |
| 21 | Smart Collections — create promo campaign | /solutions/smart-collections/promos/create | wizard | merchandising-findify/smart-collections-promo-create.png | crawled, draft discarded |
| 22 | Smart Collections — Banners | /solutions/smart-collections/banners | page | merchandising-findify/smart-collections-banners.png | crawled |
| 23 | Smart Collections — create banner | /solutions/smart-collections/banners/create | wizard | merchandising-findify/smart-collections-banner-create.png | crawled, draft discarded |
| 24 | Recommendations — engines | /:merchantId/recommendations/engines | page | merchandising-findify/recommendations-list-new.png | crawled |
| 25 | Recommendations — create engine | /:merchantId/recommendations/engines/create | four-step wizard | merchandising-findify/recommendations-create-step-1.png | crawled, draft discarded |
| 26 | Recommendations — preview | /:merchantId/recommendations/engines/preview | detail | merchandising-findify/recommendations-preview.png | crawled |
| 27 | Analytics — Snapshot | /analytics/snapshot | dashboard | merchandising-findify/analytics-snapshot.png | crawled |
| 28 | Analytics — Search | /analytics/search | dashboard/sections | merchandising-findify/analytics-search.png | crawled |
| 29 | Analytics — Smart Collections | /analytics/collections | dashboard/sections | merchandising-findify/analytics-collections.png | crawled |
| 30 | Analytics — Recommendations | /analytics/recommendations | dashboard | merchandising-findify/analytics-recommendations-verified.png | crawled |
| 31 | Setup — status, usage, Liquid/JS and API handoff | /setup/integration | page | — | blocked — redacted handoff |
| 32 | Setup — integrations | /setup/integrations | page | — | crawled, identifiers not retained |
| 33 | Setup — Search/Collections | /setup/advanced/search | settings | — | crawled |
| 34 | Setup — Autocomplete | /setup/advanced/autocomplete | settings | — | crawled |
| 35 | Setup — Recommendations | /setup/advanced/recommendations | settings | — | crawled |
| 36 | Setup — IP Blocking | /setup/advanced/ip-blocking | settings | — | crawled |
| 37 | Setup — Trend scoring BETA | /setup/advanced/trend-score | settings | — | crawled |

### Merchandising live observations (2026-07-10)

- Store context is controlled by a persistent top-bar combobox in both shells. The crawl did not enumerate or switch merchant identities; only the presence and scope behavior were recorded.
- Search and Smart Collections are separate merchandising domains. Search has query-level pinning, rules, promo cards, banners, suggestion/product blacklists, synonyms, redirects, preview, and a Content BETA item. Content currently redirects to the Collections list instead of opening a content workflow.
- The new Synonyms experience supports search, filters, upload, bulk status/delete, and inline create/edit rows. A blank inline draft was cancelled without submission.
- Smart Collection creation is a two-step activation/product-membership workflow with query, conditions, filters, sort, and storefront preview. Default merchandising combines Pinning and Rules; Promo Cards is marked coming soon there even though the legacy shell still has separate collection promo-card and banner campaign builders.
- Recommendation engines have list state, enable toggles, page/type metadata, preview, and a four-step create flow: Page Type, Recommendation Type, Settings, Filters. The empty preview requires both a widget and product selection.
- Analytics is organized as Snapshot, Search, Smart Collections, and Recommendations dashboards. Snapshot includes revenue, share of total revenue, average order value, products sold, visits, and unique visitors; the other groups expose top-query/filter/collection and recommendation-performance sections.
- Setup includes status/usage, product sync, integrations, primary catalog setup, and advanced Search/Collections, Autocomplete, Recommendations, IP Blocking, General, and Trend scoring controls. Organization-level Profile, Users, and Billing remain out of Merchandise scope.

### Merchandising documentation observations (2026-07-10)

- Merchandising rules apply weights to product or variant attributes, support include/exclude/promote behavior, can target search queries or one/many collections, and expose a popularity-weight control plus a live ranking preview.
- Search and Smart Collections have distinct rule and pinning contexts. Search pinning starts from a query; collection pinning starts from a collection. The newer collection pinning interface separates Pinned and Unpinned products, supports search/sort, click-to-pin, drag-and-drop, reordering, bulk selection, and save/edit flows.
- Smart Collections can be created manually or imported from supported commerce platforms; public documentation names Shopify, Maropost, BigCommerce, and Jetshop.
- Recommendation creation is page-aware (home, cart, product, category, custom), strategy-aware, and includes presentation, product count, notes, fallbacks, filtering rules, and preview behavior.
- The documentation also confirms banners, page redirects, stickers, sorting, promo cards, content search, personalized-search analytics, Smart Collections analytics, Recommendations analytics, product sync, and IP controls as broader capability areas. The live crawl above verifies the current dashboard IA; Content BETA remains a redirect rather than a usable workflow in the crawled account.

## A07 — Retail   [crawl-status: pending]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Retail | /preview/retail | page | — | crawled |

## A08 — Service   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Tickets | /service/2000290/tickets | page | — | crawled |
| 2 | Chatbots | /service/2000290/chatbots | page | — | crawled |

## A09 — Da Vinci AI   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Da Vinci AI | /preview/Da-Vinci | page | — | crawled |
| 2 | Dashboard | /commerce/2000290/davinci/dashboard | page | — | crawled |
| 3 | Conversations | /commerce/2000290/davinci | page | — | crawled |

## A10 — Apps   [crawl-status: crawled]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Apps | /accounts/2000290/integrations | page | — | crawled |

## A11 — Settings   [crawl-status: pending]

| # | UAT page/flow | UAT path | Type | Screenshot | Crawl status |
|---|---------------|----------|------|------------|--------------|
| 1 | Settings landing | /accounts/2000290/settings | page | — | crawled |
| 2 | API Keys | — | tab | — | blocked |
| 3 | JSON Web Token | — | tab | — | blocked |
| 4 | Relational Tables | — | tab | — | pending |
| 5 | SFTP Access | — | tab | — | blocked |
| 6 | SFTP Import and Export | — | tab | — | blocked |
| 7 | HTTP Post URL | — | tab | — | pending |
| 8 | Conversion Attribution | — | tab | — | pending |
| 9 | Sending Domains | — | tab | — | pending |
| 10 | Link Tracking Domains | — | tab | — | pending |
| 11 | Brand Management | — | tab | — | pending |
| 12 | Global Suppression Lists | — | tab | — | pending |
| 13 | Bulk Delete Contacts | — | tab | — | pending |
| 14 | Cleansing Rules | — | tab | — | pending |
| 15 | Test Campaign Subject Line | — | tab | — | pending |
| 16 | Region | — | tab | — | pending |
| 17 | Account Config | — | tab | — | pending |
| 18 | Manage Reasons | — | tab | — | pending |
| 19 | Locations | — | tab | — | pending |
| 20 | Product Categories | — | tab | — | pending |
| 21 | Taxes | — | tab | — | pending |
| 22 | Packages | — | tab | — | pending |
| 23 | Fulfillment Agent | — | tab | — | pending |
| 24 | Shipping Settings | — | tab | — | pending |
| 25 | Email Templates | — | tab | — | pending |
| 26 | 301 Redirects | — | tab | — | pending |
| 27 | Custom Domains | — | tab | — | pending |
| 28 | Custom Fields | — | tab | — | pending |
| 29 | Archives | — | tab | — | pending |
| 30 | Reply Templates | — | tab | — | pending |
| 31 | Ticket Types | — | tab | — | pending |
| 32 | Ticket Tags | — | tab | — | pending |
| 33 | Ticket Assignment | — | tab | — | pending |
| 34 | SLA | — | tab | — | pending |
| 35 | Support Email | — | tab | — | pending |

## Marketing flow observations (2026-07-05)

<!-- Compact digest from the delegated read-only deep crawl of Marketing flows. Context for Phase 2–5 redesigns; no transcripts. -->

- Journeys create flow: template gallery (6 templates + scratch) → settings (name, end date/time, enable, retrigger) → drag-drop builder. Pain: node config in modals, no template preview before commit, reports 500, no journey detail view.
- Email Campaign create: 4-step funnel (Details → Contacts → Content → Schedule/A-B). Pain: step 2 hard-gates progression (segment/table/list required), 4 separate suppress dropdowns (List/Journey/Segment/Secure List), steps 3–4 hidden until 2 completes, no upfront wizard map. Reports are KPI-rich (Dashboard/Overlay/ISP/Details + engagement charts).
- Transactional Email: lightweight single-form create (name, subject, from, language, content picker, preview link). Campaign Tags + Surveys: modal-based CRUD (survey modal: name, close date/time, quota, button text, header upload).
- Acquisition Forms: template-first (6 popup/embedded templates) → 5-step builder (Details w/ lists+domain → Settings w/ display triggers entry/exit/scroll + URL targeting → Design → Preview → Publish w/ script tag). No blank-canvas path; no field palette seen.
- Landing Pages: template library w/ Usage/Industry/Seasonal category filters, Library vs My Templates tabs; no template thumbnails. Signup Forms (Old) is legacy-labelled and slow; create flow timed out.
- Preference Pages / Coupon Banks: create flows behind modals that didn't render in the crawl (unclear creation paths). Coupon Banks list tracks Unused/Redeemed/Assigned.
- Email Content: real drag & drop editor (blocks: Title, Paragraph, List, Image, Button, Divider, Spacer, Social, HTML; tabs Content/Footer/Preview/Advanced/Custom Row Categories; save as template). Footers reuse the same editor. Image Library is folder-based w/ grid toggle.
- Dynamic Content, Content Feeds, Countdown Timer, Optimise on Open: plain list pages, all empty in UAT; creation flows not exposed.
- Data Journeys: separate node builder — triggers (Scheduled, Recurring, Import/Export Finished, Campaign Sent, Report Generated, File Uploaded, API Event) + actions (FTP Upload, Send Campaign, Start Import/Export, Send to Facebook, Secure List Import); same canvas paradigm as marketing journeys.
- Cross-cutting UAT pain: slow loads (3–4s), modal-in-modal config, kebab-only row actions, inconsistent CTA labels, terse report tab names.

## A12 — Merchandise Cloud (Findify)   [crawl-status: crawled]

Crawled 2026-07-10 (user-directed; two delegated haiku browser agents) on `https://dashboard.findify.io` — authenticated demo shop (`findify-demo-shop.myshopify.com`, TEST env). Sensitive values (API key, JS tag) recorded as [REDACTED]; Account menu titles-only. Screenshots not captured to disk — URL-only rows per convention.

| # | Findify page/flow | Path | Type | Notes | Crawl status |
|---|---|---|---|---|---|
| 1 | Search ▸ Pinning (query search + pin grid + pins table) | /solutions/search/pinning | page+form | Query input, products-per-row/page dropdowns, drag-to-pin grid; table: query, pinned count, edit/delete | crawled |
| 2 | Search ▸ Merchandising Rules | /solutions/search/rules | page+wizard | Status toggle + name table; multi-step create: Name → search terms → conditions | crawled |
| 3 | Search ▸ Promo Cards | /solutions/search/promos | page | Card gallery: preview, status toggle, delete | crawled |
| 4 | Search ▸ Banners | /solutions/search/banners | page | Card gallery: preview, status toggle, delete | crawled |
| 5 | Search ▸ Blacklisting — Search Suggestions | /solutions/search/blacklisting | tab+form | Logic dropdown (exact-match), term input; table: logic, term, actions | crawled |
| 6 | Search ▸ Blacklisting — Product Matches | /solutions/search/blacklisting | tab | Product lookup; table: product (image), status toggle | crawled |
| 7 | Search ▸ Synonyms | → maropost-dashboard.findify.io /search/synonyms | page | NEW dashboard. Table: status toggle, type (two-way/one-way), queries, leads-to; search + status/type filters + UPLOAD + ADD NEW | crawled |
| 8 | Search ▸ Page Redirects | /solutions/search/redirects | page+form | Terms + URL inputs; table: queries, URL, actions | crawled |
| 9 | Search ▸ Preview / Content (BETA) | /solutions/search/* | page | BETA; not deep-crawled | crawled |
| 10 | Smart Collections ▸ Collections | /solutions/smart-collections/collections | page+form | "Seamless Shopify collections" toggle; table: status toggle, collection, updated, filters type (Auto/Manual), delete/edit; edit tabs: Shopify Filters / Activation / Configured Filters & Sorting | crawled |
| 11 | Smart Collections ▸ Pinning | /solutions/smart-collections/pinning | page | Collection-scoped: CHOOSE COLLECTION dropdown; table: collection, pinned products | crawled |
| 12 | Smart Collections ▸ Merchandising Rules | /solutions/smart-collections/rules | page | Default rules + All rules sections; CREATE NEW + "USE NEW EXPERIENCE" (→ new dashboard) | crawled |
| 13 | Smart Collections ▸ Promo Cards / Banners | /solutions/smart-collections/promos, /banners | page | Card grids, collection-scoped variants of #3/#4 | crawled |
| 14 | Recommendations | → maropost-dashboard /recommendations/engines | page | Table: state toggle, engine name, page, type, updated, actions. Types: Popular, Newest, Recently Viewed, Personalized, Visual, Frequently Purchased Together, Viewed Together | crawled |
| 15 | Analytics ▸ Snapshot | /analytics/snapshot | report | Date-range picker; KPIs: revenue, MC revenue share, AOV, products sold, visits, unique visitors; revenue line chart + distribution table | crawled |
| 16 | Analytics ▸ Search | /analytics/search | report | Top searches / zero-results / partial matches / top filters; columns: query, searches, conversion %, orders, revenue | crawled |
| 17 | Analytics ▸ Smart Collections | /analytics/collections | report | Top collections + most-utilized filters; columns: URL, traffic, conversion, orders, revenue | crawled |
| 18 | Analytics ▸ Recommendations | /analytics/recommendations | report | Columns: widget, page, orders, sessions, conversion, revenue | crawled |
| 19 | Settings ▸ Status & usage | /setup/integration | page | Solutions status toggle (LIVE), Shopify liquid toggle, JS tag [REDACTED], API key [REDACTED]; status cards: feed pull, webhooks, active sync, search engine; indexed/create/update/delete counts | crawled |
| 20 | Settings ▸ Product Sync | /setup/product-sync/overview | page | Sync overview + indexed products count | crawled |
| 21 | Settings ▸ Integrations | /setup/integrations | page | Rating & Reviews cards: Yotpo, Stamped, Lipscore, Reviews.io, Custom — INTEGRATE buttons | crawled |
| 22 | Settings ▸ Primary Setup | /setup/primary/* | tabs | Filtering (filter groups table: group, #products, #filters, edit/toggle), Color Mapping, Stock, Translations | crawled |
| 23 | Settings ▸ Advanced Setup | /setup/advanced/* | tabs | IP Blocking, General, Search/Collections, Autocomplete, Recommendations, Trend scoring (BETA) | crawled |
| 24 | Account | (menu) | — | Titles only per policy | blocked |

## Findify observations (2026-07-10)

- **Two dashboards in flight**: Recommendations, Smart-Collections Merchandising Rules ("USE NEW EXPERIENCE"), and Synonyms redirect to `maropost-dashboard.findify.io` — a newer Maropost-branded dashboard. The old app is mid-migration; our redesign should follow the NEW experience's spirit (cleaner tables, status toggles, filters), not the legacy chrome.
- Collection-scoped merchandising tools (Pinning/Rules/Promos/Banners under Smart Collections) are the SAME tools as the Search versions plus a "CHOOSE COLLECTION" selector.
- Shared legacy patterns: list pages = header + create CTA + filter/search + table w/ inline status toggles + hover edit/delete icons; forms are full pages (no drawers); analytics = date-range picker top-right + KPI/table leaves.
- Pains: no delete confirmations observed; hover-only row actions; Settings "Status & usage" mixes status, integration snippets, and credentials with no hierarchy; frequent skeleton/spinner waits; cross-dashboard redirects break flow; forms lack inline guidance.

## Part B — Gap Matrix

<!-- Filled by gap analysis (phase-prompts.md Prompt 2), once, after all modules are crawled. -->
<!-- Match by FEATURE INTENT, not URL string — prototype paths differ from legacy UAT paths. -->
<!-- Verdict:  exists  = feature is represented in the prototype (even if the UX differs) -->
<!--           partial = feature exists but a whole sub-flow / detail page / sub-tab is missing -->
<!--           missing = not represented at all -->
<!-- Build status: pending | done | skipped  (exists rows are n/a — leave blank) -->
<!-- FROZEN RULE: `exists` rows must NEVER trigger a redesign of an existing prototype page. This effort is additive only. -->
<!-- Row columns: # | UAT page/flow | Prototype route (or —) | Verdict | Build status | Commit | Notes -->

Built 2026-07-07 from Part A (all 11 modules) diffed against `src/router/index.ts` by feature intent. Every verdict was set by a matcher agent and then adversarially re-checked by a second agent (skeptics tried to refute `missing` calls via grep/nav; `exists` calls were probed for absent sub-flows). 9 verdicts were corrected by the adversarial pass (flagged ⚑ below).

**Summary: 112 rows → 79 exists · 13 partial · 20 missing.** Build queue (all partial + missing rows) = 33; **6 A05 Marketing + 2 A06 Commerce + 3 A02 Analytics + 1 A08 Chatbots built (2026-07-08)**, 21 remaining. Rows with `done` build status = 19 (7 earlier Marketing back-fills + 6 Marketing slice + 2 gift-cards + 3 Analytics + 1 Chatbots).

**Provisional rows:** A07 Retail (1) and A11 Settings (35) were matched from UAT card/nav TITLES only — their deep crawl is still `[crawl-status: pending]` (UAT was logged out this session). Re-confirm these verdicts after the logged-in crawl.

### B-A01 — Dashboard
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Dashboard | Dashboard | exists | | | Widget grid, date presets, dashboard switcher |

### B-A02 — Analytics
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Monthly Totals | MonthlyTotals | exists | | | Monthly totals table |
| 2 | Sales by Order | OrdersReport | exists | | | Titled "Sales by Order" + status filter |
| 3 | Dispatched Orders | DispatchedOrders | exists | | | Shipped/Delivered table |
| 4 | Sales Summary | SalesSummary | partial→built | done | 81c0d0f | KPI row + revenue-by-channel bar chart + channel table (edit-in-place, user exception) |
| 5 | eRFM Report | ERFMReport | partial→built | done | 1f448ef | RFM summary KPIs + distribution bar + 9 segment cards w/ actions (edit-in-place, user exception) |
| 6 | Campaign Reports | CampaignReports | exists | | | Sent/opens/clicks table |
| 7 | Recurring Campaign Reports | RecurringCampaignReports | exists | | | Frequency filter |
| 8 | A/B Campaign Reports | ABCampaignReports | exists | | | Winning variant, lift |
| 9 | Test Campaign Reports | TestCampaignReports | exists | | | Inbox placement, spam score |
| 10 | Website Reports | WebsiteReports | exists | | | Page-level traffic table |
| 11 | Journey Reports | JourneyReports | exists | | | Journeys list w/ active contacts |
| 12 | Custom Reports | CustomReports | partial→built | done | 6c58fa5 | Saved-reports card grid + working MpFormDrawer builder (edit-in-place, user exception) |
| 13 | Transactional Email Reports | TransactionalReports | exists | | | Delivery-rate table |
| 14 | Log Inspector | LogInspector | exists | | | Level filter + export |

### B-A03 — CDP
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | All Contacts | AllContacts | exists | | | Full table + filters + detail route |
| 2 | Contact Lists | ContactLists | exists | | | Lists table |
| 3 | Segments | Segments | exists | | | Segments list |
| 4 | Contact Fields | ContactFields | exists | | | Custom Fields table |
| 5 | Contact Tags | ContactTags | exists | | | Tags + counts |
| 6 | Relational Tables | RelationalTables | exists | | | Tables list |
| 7 | SQL Queries | SQLQueries | exists | | | Saved queries + editor |
| 8 | Secure Lists | SecureLists | exists | | | Secure lists table |
| 9 | Web Tracking | WebTracking | partial ⚑ | pending | | Static single-domain snippet; UAT `/websites` list/manage flow absent |

### B-A04 — Products
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Product Recommendations | ProductRecommendations | exists | | | Rules table |
| 2 | Products | Products | exists | | | Full product list |
| 3 | Product Tax Category | ProductTaxCategory | exists | | | Tax categories table |
| 4 | Collections | MerchandisingCollections | exists | | | Full page under Merchandising (Products route is placeholder) |
| 5 | Inventory | Inventory | exists | | | Stock table + adjust/transfer |
| 6 | Reservations | Reservations | exists | | | Holds table + release |

### B-A05 — Marketing
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Email Campaigns | EmailCampaigns | exists | | | List + KPIs + folders + bulk |
| 2 | Transactional Email | TransactionalEmail | exists | | | Flows table (shared w/ SMS routes) |
| 3 | Campaign Tags | CampaignTags | exists | | | Tags + assigned counts |
| 4 | Acquisition Forms | AcquisitionForms | exists | | | KPI cards + form grid |
| 5 | Landing Pages | LandingPages | exists | | | Pages table + status filter |
| 6 | Signup Forms (Old) | SignupForms | exists | | | Legacy deprecation placeholder |
| 7 | Surveys | Surveys | exists | | | Surveys table |
| 8 | Journeys | Journeys | exists | | | Status tabs + toggle |
| 9 | Data Journeys | DataJourneys | exists | done | 5ade1df…4104bfb | List rebuild + template create drawer (parity build) |
| 10 | Email Content | EmailContent | exists | | | Template card grid |
| 11 | Dynamic Content | DynamicContent | exists | | | Content blocks table |
| 12 | Image Library | ImageLibrary | exists | | | Image grid + upload + bulk delete |
| 13 | Footer Management | FooterManagement | exists | | | Footers table |
| 14 | Optimise on Open | OptimizeOnOpen | exists | | | Image groups table |
| 15 | Content Feeds | ContentFeeds | exists | | | Feeds table |
| 16 | Coupon Banks | CouponBanks | exists | | | Bank cards + availability bars |
| 17 | Preference Management | PreferencePages | exists | | | Preference page list |
| 18 | Countdown Timer | CountdownTimer | exists | | | Timer card + embed code |
| 19 | Journeys — template gallery | CreateJourney | exists | done | 6b3264e…fadc14e | Step 1 gallery + Da Vinci mode (parity redesign, user-directed) |
| 20 | Journeys — settings form | CreateJourney | exists | done | 6b3264e…fadc14e | Step 2 name/schedule/enable/retrigger |
| 21 | Journeys — builder canvas | JourneyBuilder | exists | done | 6b3264e…fadc14e | Palette matches 14/10/4/2/end |
| 22 | Journeys — node config | JourneyBuilder | exists | done | 6b3264e…fadc14e | Schema-driven side panel (not modal) |
| 23 | Journey Reports | JourneyReports | exists | | | Journey reports list table |
| 24 | Email Campaigns — create wizard | CreateCampaign | exists | done | 19f31e3 | 5-step wizard: Setup/Template/Audience/Schedule/Review |
| 25 | Email Campaign — report (Dashboard/Overlay/ISP/Details tabs) | CampaignReport | missing→built | done | aea9f25, b421e37 | New /campaigns/:id/report; Dashboard/Overlay/ISP/Details tabs from campaigns store. Entry wired: list "View report" → per-campaign report |
| 26 | Transactional Email — create form | CreateTransactional | missing→built | done | 071cd46, b421e37 | New /transactional_campaigns/new full-page form. Entry wired: list "New Flow" |
| 27 | Campaign Tag — create modal | CreateCampaignTag | partial→built | done | 071cd46, b421e37 | New /campaign_tags/new full-page create (colour picker + preview). Built as page vs in-list modal. Entry wired: list "Create Tag" |
| 28 | Survey — create modal | CreateSurvey | partial→built | done | 071cd46, b421e37 | New /surveys/new full-page create (close date/quota/branding). Built as page vs in-list modal. Entry wired: list "Create Survey" |
| 29 | Acquisition Forms — template picker | AcquisitionForms | exists | | | Template dialog, 10 templates |
| 30 | Acquisition Forms — 5-step builder | FormBuilder | exists | | | Multi-step wizard (4 steps vs 5; minor variance) |
| 31 | Landing Pages — template library | LandingPageTemplates | missing→built | done | 6438e8e, b421e37 | New /landing_pages/templates; category filters + Library/My-Templates tabs + nav item. Entry wired: list "Create Page" |
| 32 | Email Content — drag & drop editor | EmailContentEditor | missing→built | done | 9422b99, b421e37 | New /contents/editor/:id; palette + live canvas + settings panel. Entry wired: list "Edit" (+ "Create Content" → blank starter); list now sources useContentStore |
| 33 | Data Journeys — builder canvas | DataJourneyBuilder | exists | done | 5ade1df…4104bfb | Shared builder, data domain (8 triggers/6 actions) |

### B-A06 — Commerce
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Sales Orders | SalesOrders | exists | | | Full orders table + tabs |
| 2 | Draft Orders | DraftOrders | exists | | | Draft list + create drawer |
| 3 | Fulfillment | Fulfillments | exists | | | Fulfillment queue |
| 4 | Promotions | Promotions (Coupons.vue) | exists | | | Coupons & Discounts + create wizard |
| 5 | Custom Gift Cards | CustomGiftCards | missing→built | done | d2d836f | New /custom_gift_cards; issued store-credit cards (balance/status/recipient) + Issue drawer. Replaces the shared Coupons.vue placeholder |
| 6 | Purchasable Gift Cards | PurchasableGiftCards | partial→built | done | d2d836f | New /purchasable_gift_cards; gift-card products (denominations/custom amount/sold/revenue) + Create drawer. Replaces the shared Coupons.vue placeholder |
| 7 | Sales Channels | SalesChannels | exists | | | StoreSetup redirects to list |

### B-A06b — Commerce — Store Editor
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Store editor shell (per-store 9-section sidebar) | StoreEditorLayout | partial→built | done | 0956786 | Redesigned as a section RAIL beside the global sidebar (not legacy's sidebar swap) — user-approved UX decision w/ refs (GitLab Pajamas, NN/g local nav, Shopify). Store switcher included; POS channels rail-less |
| 2 | General (profile, business identity, contact, favicon, addresses) | SalesChannelDetail | partial | pending | | Settings tab covers some identity fields; favicon + address blocks absent |
| 3 | Themes (installed table + gallery + upload) | StoreThemeBuilder | partial | pending | | Section/theme editor exists; no installed-themes list, gallery, or upload management |
| 4 | Pages (list + WYSIWYG create) | StorePages | missing→built | done | 1581330 | Shared content list/editor views (meta contentKind); dependency-free rich-text surface |
| 5 | Blogs (list + SEO modal + WYSIWYG create) | StoreBlogs | missing→built | done | 1581330 | Same shared views; blog SEO settings as MpFormDrawer |
| 6 | Navigation (menu list + create/edit menu) | StoreNavigation | missing→built | done | dadefd9 | Redesigned menu manager: list + single-screen editor + live preview; flat items per crawl (no nesting = no new feature) |
| 7 | Campaigns (storefront campaign settings) | StoreCampaigns | missing→built | done | b287b00 | List + MpFormDrawer create/edit; status derived from schedule window. ASSUMPTION: targets modeled as collections (legacy Targets options not enumerable in crawl — re-confirm) |
| 8 | Assets (per-store image grid) | StoreAssets | partial→built | done | b287b00 | Per-store grid + sort + mock upload + pagination; per-asset actions not crawled, none invented |
| 9 | Integrations (GA / HCaptcha / Places cards) | AppStore | partial | pending | | Global Apps directory exists; no per-store integration cards |
| 10 | Store Settings (Website Config / Abandoned Cart / Payments) | SalesChannelDetail | partial | pending | | Settings tab has some store config; cookie banner, homepage SEO, sitemap, abandoned cart, payments absent. Payments crawl blocked (credential-bearing) |

### B-A06c — Merchandising Cloud
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Online sales-channel selector | MerchandisingHome | exists | done | b2066e9 | Global Merchandise now opens a selector backed by `useSalesChannels`, with provider/domain/status/health/activity metadata and offline-channel exclusion |
| 2 | Channel-scoped workspace + Merchandise section rail | MerchandisingLayout | exists | done | b2066e9 | Canonical nested workspace uses `MpSectionRail`, auto-minimizes the global sidebar, and exposes the planned Search/Collections/Recommendations/Analytics/Setup groups |
| 3 | Channel overview | MerchandisingChannelOverview | partial | done | b2066e9 | Channel-scoped overview and KPIs are live; underlying merchandising records remain shared until the ownership slice |
| 4 | Merchandise connection and sync health | SalesChannelDetail / MerchandisingChannelSetup | partial | done | b2066e9 | Provider/capability status, setup state, sync-health banner, last-sync context, and recovery action are represented; real integration actions remain mocked |
| 5 | Invalid, removed, offline, or cross-account recovery | MerchandisingLayout | exists | done | b2066e9 | Missing or cross-account channel IDs render a recovery state; offline channels are excluded from selector and workspace entry |
| 6 | Search preview | MerchandisingSearchPreview | missing | pending | | Route exists but page is a coming-soon empty state; live reference shows query results with ranking context |
| 7 | Search pinning | — | missing | pending | | Collection pinning is a different target model and is not functional parity for query-scoped Search pinning |
| 8 | Search merchandising rules | — | missing | pending | | Collection rules cannot represent query targeting, Search rule ownership, or Search rule lists |
| 9 | Search promo cards | — | missing | pending | | No Search promo-card model, list, editor, schedule, or preview |
| 10 | Search banners | — | missing | pending | | No Search banner model, list, editor, schedule, or responsive asset state |
| 11 | Search blacklisting / inclusion-exclusion | — | missing | pending | | No suggestion blacklist or query-scoped product-match exclusion flow |
| 12 | Search synonyms | MerchandisingSynonyms | partial | pending | | List/status/delete work in memory; create, edit, duplicate, and upload are toast-only |
| 13 | Search page redirects | MerchandisingPageRedirects | partial | pending | | Create/delete work in memory; edit/duplicate and stronger URL/collision validation are absent |
| 14 | Search content | — | missing | pending | | No content source/list/editor; live Content BETA currently redirects to Collections |
| 15 | Smart Collections — list/create/import/membership | MerchandisingCollections | partial | pending | | List search/status filter and basic create exist; no edit, filter-definition/product membership, platform import, or real delete/duplicate |
| 16 | Smart Collections — pinning | MerchandisingPinning | partial | pending | | Product search/sort, individual/bulk pinning, drag reorder, save/delete exist; not channel-owned and no guarded switching |
| 17 | Smart Collections — merchandising rules | MerchandisingRuleEdit | partial | pending | | Conditions, collection selection, popularity weight, preview, and not-found handling exist; no channel ownership or async save/deployment failures |
| 18 | Smart Collections — promo cards and banners | MerchandisingDefaults | missing | pending | | Promo tab is a placeholder and banners are absent, while live reference has separate legacy list/wizard flows for both |
| 19 | Recommendation engine lifecycle | MerchandisingRecommendations / MerchandisingEngineEdit | partial | pending | | List + four-step editor + filters/fallbacks/product preview work; missing shopper-visible title/presentation controls, draft/publish semantics, storefront preview, and channel ownership |
| 20 | Merchandising analytics | MerchandisingHome / DashboardDetail | partial | pending | | Aggregate KPIs plus date/comparison controls exist, but no channel-specific Search, Collections, Recommendations dashboards or drill-down |
| 21 | Channel setup / integrations / product sync | MerchandisingChannelSetup | partial | done | b2066e9 | Channel-scoped setup and sync diagnostics shell is live; provider actions and product sync remain prototype-only |
| 22 | Canonical provider and Merchandise connection model | useSalesChannels | partial | done | b2066e9 | Typed provider plus Merchandise connection status/health/last-sync fields now live; duplicate `MerchStore` data still remains in the existing merchandising store |
| 23 | `accountId + channelId` data isolation | — | missing | pending | | All merchandising arrays and mutations are singleton/global and entities have no owner key |
| 24 | Same-section channel switching + editor fallback | MerchandisingSidebar | partial | done | b2066e9 | Rail switcher preserves supported list sections across channels and routes editor-like sections to a safe root; entity ownership and dirty guards remain pending |
| 25 | Dirty editor protection | — | missing | pending | | Editors compute dirty state but do not guard channel switching, rail/browser navigation, or module exit |
| 26 | Canonical Products entry points | ProductRecommendations / MerchandisingCollections | missing | pending | | Products recommendations remains a separate static surface and collections/recommendations do not resolve through canonical channel context |

### B-A07 — Retail  _(provisional — deep crawl pending)_
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Retail | RetailHome | exists | | | Full Retail section (RetailHome + registers/txns/associates/POS preview/stock/pricing/hardware/settings). UAT deep crawl pending — re-confirm sub-pages then. |

### B-A08 — Service
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Tickets | Tickets | exists | | | List + thread + reply + create drawer |
| 2 | Chatbots | ChatbotList/ChatbotBuilder | partial→built | done | e0a982d, cc84946, cf63ef1, 94ab034 | Full flow: Chatbots management list (per-store, filter/status/archive + quick-create) + Archived view + per-:id "Customize your widget" builder (8 sections incl. Shopping Assistant + Order Tracking) + Publish modal + redesigned live preview with scenario switcher (welcome/shopping/order-tracking/open-chat intent routing/pre-chat). useChatbot multi-chatbot store |

### B-A09 — Da Vinci AI
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Da Vinci AI | DaVinciAI | exists | | | Get-started landing tab |
| 2 | Dashboard | DaVinciDashboard | exists | | | AI metric cards tab |
| 3 | Conversations | DaVinciCopilot | exists | | | Chat + history rail + new chat |

### B-A10 — Apps
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Apps | AppStore | exists | | | App directory grid + connect/manage |

### B-A11 — Settings  _(provisional — deep crawl pending; sensitive cards judged by title only, never opened)_
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Settings landing | Settings | exists | | | SettingsLayout + sidebar nav |
| 2 | API Keys | SettingsConnections | exists | | | API Keys section (generate/copy/revoke) |
| 3 | JSON Web Token | — | missing | pending | | No JWT representation |
| 4 | Relational Tables | RelationalTables | exists | | | Dedicated list (under Contacts) |
| 5 | SFTP Access | — | missing | pending | | No SFTP credentials surface |
| 6 | SFTP Import and Export | — | missing | pending | | No SFTP import/export surface |
| 7 | HTTP Post URL | SettingsConnections | exists | | | "HTTP Post URLs" webhooks section |
| 8 | Conversion Attribution | — | missing | pending | | Tracking page is placeholder |
| 9 | Sending Domains | SettingsDnsSetup | exists | | | DKIM/SPF/DMARC section |
| 10 | Link Tracking Domains | SettingsDnsSetup | exists | | | Link-tracking section + SSL |
| 11 | Brand Management | — | missing | pending | | No brand-management section |
| 12 | Global Suppression Lists | — | missing | pending | | No suppression-list surface |
| 13 | Bulk Delete Contacts | AllContacts | exists ⚑ | | | AllContacts bulk bar has Delete action |
| 14 | Cleansing Rules | — | missing | pending | | No cleansing-rules surface |
| 15 | Test Campaign Subject Line | CreateCampaign | partial ⚑ | pending | | Subject-line field exists in create wizard; no dedicated test-subject config |
| 16 | Region | SettingsAccountDefaults | partial | pending | | Locale present; market Region not exact |
| 17 | Account Config | SettingsAccountDefaults | exists | | | Identity/locale/address |
| 18 | Manage Reasons | — | missing | pending | | No reasons management |
| 19 | Locations | SalesChannelLocations | exists | | | Full locations mgmt |
| 20 | Product Categories | — | missing ⚑ | pending | | Products/Collections is coming-soon placeholder, different concept |
| 21 | Taxes | ProductTaxCategory | exists | | | Tax categories + rate maps (under Products) |
| 22 | Packages | — | missing | pending | | No shipping-packages surface |
| 23 | Fulfillment Agent | — | missing | pending | | No fulfillment-agent config |
| 24 | Shipping Settings | — | missing | pending | | No shipping settings area |
| 25 | Email Templates | — | missing | pending | | No store email-templates config (EmailContent is Marketing) |
| 26 | 301 Redirects | — | missing | pending | | Merch PageRedirects ≠ URL 301s |
| 27 | Custom Domains | SettingsDnsSetup | partial | pending | | DNS domains present; storefront custom domain absent |
| 28 | Custom Fields | ContactFields | exists | | | Contact custom fields list |
| 29 | Archives | — | missing | pending | | No archives surface |
| 30 | Reply Templates | SettingsService | exists | | | Reply Templates section |
| 31 | Ticket Types | SettingsService | partial | pending | | Service page present; no ticket-types config |
| 32 | Ticket Tags | SettingsService | partial | pending | | Service page present; no ticket-tags config |
| 33 | Ticket Assignment | SettingsService | exists | | | Auto-Assign Tickets toggle |
| 34 | SLA | SettingsService | exists | | | Default SLA (hours) field |
| 35 | Support Email | SettingsService | exists | | | Support Email Address field |

## Part C — Merchandising Deep Parity

<!-- Interaction/state audit for A06c. Dashboard evidence is explicitly separated from public documentation and prototype code evidence. -->
<!-- Functional verdict: exists | partial | missing | blocked-live. Review: verified-code | docs-only | needs-authenticated-review. -->

| # | Area | State / wizard step | Trigger | Sanitized Findify pathname | Redacted screenshot | Prototype route / component | Functional verdict | IA placement | UX / accessibility verdict | Severity | Resolution | Review status |
|---|------|---------------------|---------|-----------------------------|---------------------|-----------------------------|-------------------|--------------|----------------------------|----------|------------|---------------|
| 1 | Entry | Global Merchandise navigation | Open module | — | — | `MerchandisingChannelSelector` | partial | Selector before workspace | Selector is live with provider/status/health/activity metadata; it still uses prototype channel mocks | critical | Scope all downstream entities and add richer selector filtering/status detail | verified-code |
| 2 | Entry | Sales Channel detail handoff | Manage Merchandise | — | — | `SalesChannelDetail.openConnectedProduct` | exists | Direct to channel overview | Connected-channel action now lands on the canonical channel overview without a discarded query context | critical | Keep canonical handoff and add setup/error telemetry in later slice | verified-code |
| 3 | Workspace | Channel identity and section navigation | Enter connected channel | — | — | `MerchandisingLayout` / `MerchandisingSidebar` | exists | Persistent Merchandise rail | Rail is keyboard-addressable, grouped, and visually consistent with Store Editor; capability pages remain staged | high | Implement capability pages behind the new shell | verified-code |
| 4 | Switching | Switch channel from list/overview | Choose rail identity option | — | — | `MerchandisingSidebar` | partial | Rail identity switcher | Route context and same-section switching work; entity data is still shared | critical | Add channel ownership to all merchandising records and mutations | verified-code |
| 5 | Switching | Switch channel from editor | Choose destination channel | — | — | `PinningEditor` / `RuleEditor` / `EngineEditor` | missing | Editor-to-section-list fallback | Reusing entity IDs would risk cross-channel edits; current drafts do not rebind on route ID changes | critical | Map editor routes to destination list roots and reload drafts by owner key | verified-code |
| 6 | Switching | Dirty editor | Rail, browser, or module exit | — | — | Local `isDirty` only | missing | Shared guarded editor session | No confirmation or focus-safe recovery; unsaved work can be lost | high | Reuse `MpConfirmDialog` + `onBeforeRouteLeave` contract for every editor and switch action | verified-code |
| 7 | Recovery | Invalid, removed, offline, or cross-account channel | Open deep link | — | — | `MerchandisingLayout` | exists | Workspace recovery state | Missing/cross-account IDs show recovery; offline channels are excluded from the Merchandise selector | high | Add explicit recovery telemetry and server-backed capability validation | verified-code |
| 8 | Health | Disconnected or setup-required channel | Select channel | — | — | `MerchandisingLayout` / `MerchandisingChannelSetup` | partial | Channel Setup | Setup state and CTA are live, but connection action is mocked | high | Wire provider setup and post-connect refresh | verified-code |
| 9 | Health | Sync issue | Open affected channel | — | — | `MerchandisingLayout` / `MerchandisingChannelSetup` | partial | Overview health banner | Banner, health label, last-sync context, and recovery action are visible; diagnostics remain coarse | high | Add per-capability sync diagnostics and retry result states | verified-code |
| 10 | Overview | Connected channel KPIs and activity | Land on overview | — | — | `MerchandisingChannelOverview` | partial | Overview | Channel identity and health are clear; KPI values still come from shared mock data | high | Scope KPIs/activity and route actual create flows | verified-code |
| 11 | Search | Preview | Open Search Preview | — | — | `MerchandisingSearchPreview` | missing | Search > Preview | Coming-soon empty state; no query input, result grid, ranking explanation, or state handling | high | Build query preview with loading/error/empty/results and ranking context | verified-code |
| 12 | Search | Query pinning | Enter query, choose products, position, save | — | — | Collection-only `PinningEditor` | partial | Search > Pinning | Core product manipulation exists, but query context and top/bottom/position semantics are absent | high | Reuse product panels with query ownership and explicit placement actions | docs-only |
| 13 | Search | Query merchandising rule | Name, queries, conditions, weight, preview, save | — | — | Collection-only `RuleEditor` | partial | Search > Rules | Condition UI is strong; query targeting/list ownership is missing | high | Generalize target type to search queries or collections and preserve live preview | docs-only |
| 14 | Search | Promo cards and banners | Create campaign | — | — | No route/component | missing | Search > Promo Cards / Banners | No discoverable workflow, preview, schedule, responsive asset, or validation state | medium | Add separate list/editor flows sharing campaign scheduling and preview primitives | docs-only |
| 15 | Search | Blacklisting | Include/exclude products for query | — | — | No route/component | missing | Search > Blacklisting | No safe bulk selection, feedback, or result-count impact | high | Add query-scoped exclusion list with undo/confirmation and live result preview | docs-only |
| 16 | Search | Synonym lifecycle | Create/edit/import/duplicate/toggle/delete | — | — | `MerchandisingSynonyms` | partial | Search > Synonyms | Table and bulk status/delete work; create/edit/import/duplicate are toast-only | high | Implement drawer/editor, validation, duplicate detection, import result summary, and real duplicate | verified-code |
| 17 | Search | Page redirect lifecycle | Create/edit/duplicate/delete | — | — | `MerchandisingPageRedirects` | partial | Search > Redirects | Create/delete work; edit/duplicate are toast-only and URL validation is weak | medium | Complete edit/duplicate, normalize destinations, and add collision/error states | verified-code |
| 18 | Search | Content sources/results | Add or manage searchable content | — | — | No route/component | missing | Search > Content | No source status, sync feedback, result preview, or empty/error state | medium | Add channel-scoped content source list and preview workflow | docs-only |
| 19 | Smart Collections | List, create, import, edit, membership | Open Collections | /solutions/smart-collections/collections | — | `MerchandisingCollections` | partial | Smart Collections > Collections | Basic list/create/status is clear; delete/duplicate are fake and membership/filter/import flows are absent | critical | Add real CRUD, filters, product membership, platform import, sync status, and confirmations | verified-code |
| 20 | Smart Collections | Pinning editor | Select collection, pin, reorder, bulk edit, save | — | — | `MerchandisingPinning` | partial | Smart Collections > Pinning | Core desktop flow is functional; no channel ownership, route guard, touch reorder, or live deployment context | high | Scope records, add guarded drafts, keyboard/touch reorder, and live announcements | verified-code |
| 21 | Smart Collections | Rules editor | Collections, conditions, popularity, preview | — | — | `MerchandisingRuleEdit` | partial | Smart Collections > Rules | Strong in-memory rule editor; lacks channel ownership and server/error/deployment states | high | Preserve editor, add owner keys, async states, validation summary, and guarded navigation | verified-code |
| 22 | Smart Collections | Promo cards and banners | Create/manage campaign | — | — | Promo tab placeholder / no banner route | missing | Smart Collections > Promo Cards / Banners | Promo Cards is explicitly coming soon; banners absent | medium | Build collection-targeted campaign list/editor and asset preview | verified-code |
| 23 | Recommendations | Engine lifecycle | Page, strategy, display, fallback, filters, preview | — | — | `MerchandisingRecommendations` / `MerchandisingEngineEdit` | partial | Recommendations | Four-step editor and product preview work; no storefront-context visual preview or channel isolation | high | Add channel ownership, responsive storefront preview, publish lifecycle, and analytics handoff | verified-code |
| 24 | Analytics | Search, Collections, Recommendations performance | Open analytics and filter period | — | — | Global `MerchandisingHome` analytics | partial | Analytics | Aggregate KPIs exist, but no channel/product-area drill-down, loading/error state, or comparison context | high | Add channel-scoped tabs, date/filter state, drill-down tables, and empty/error handling | docs-only |
| 25 | Setup | Provider integration and product sync | Connect or recover channel | — | — | `useSalesChannels` + `MerchandisingChannelSetup` | partial | Channel Setup | Typed provider/status/health and setup surface are live; connect/sync actions are still mocked | critical | Wire provider integrations and product-sync lifecycle | verified-code |
| 26 | Data | Owner isolation | Read or mutate any entity | — | — | `useMerchandising` | missing | Cross-cutting | Every entity and mutation is global; switching labels can expose/mutate another channel's data | critical | Require `accountId + channelId` on every selector, lookup, mutation, and relationship | verified-code |
| 27 | Consolidation | Products collections/recommendations entry | Open Products shortcuts | — | — | `ProductRecommendations` / `MerchandisingCollections` | partial | Canonical Merchandise routes | Duplicate static recommendations surface and account-level links fragment the workflow | medium | Redirect Products shortcuts into the selected channel or selector, then retire duplicate behavior | verified-code |
| 28 | Live crawl | Authenticated dashboard route/interaction verification | Open supplied dashboard URL | /solutions/smart-collections/collections | — | — | blocked-live | Audit gate | Authentication handoff is prohibited in this browser session; no screenshots or live state verdicts captured | high | Resume in a permitted user-authenticated tab, sequentially verify every provisional row, and save redacted screenshots locally | needs-authenticated-review |

### Part C audit summary

- Foundation slice verified in code: selector, canonical route family, rail shell, channel switcher, setup/recovery states, typed provider metadata, and sync-health banner. Capability-level parity remains pending, and authenticated live verification remains blocked for all reference-app states.
- 2026-07-10 — **Merchandising foundation slice BUILT** (`b2066e9`): added typed Sales Channel provider/Merchandise connection metadata, global online-channel selector, canonical `/accounts/:accountId/sales_channels/:channelId/merchandising/...` route family, `MpSectionRail` workspace shell with channel switching, setup/sync/recovery states, channel overview, and compatibility redirects. Verified with `npm run type-check`, `npm run build`, browser route checks at desktop and 375px, same-section Maropost→Shopify switching, disconnected setup, invalid-channel recovery, legacy redirect, and zero browser console errors. Remaining capability parity and entity isolation stay queued for the next merchandising slice.
- Critical implementation prerequisites: canonical Sales Channel provider/capability model, `accountId + channelId` ownership, canonical route family, selector, rail shell, and guarded editor sessions.
- Existing work worth preserving: `MpSectionRail`, Store Editor invalid-channel/switch-root patterns, collection pinning, merchandising-rule preview, recommendation engine editor, synonym bulk actions, and redirect create/delete.
- Accessibility verification still required in implementation: keyboard and touch reordering, focus restoration after switch/confirm, live announcements for ranking changes, validation summaries, contrast, 1280px and 375px layouts, and loading/error/empty states.

### B-A12 — Merchandise Cloud (Findify) _(full-parity build directive, 2026-07-10)_
| # | Findify page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Channel workspace shell + selector | MerchandisingLayout/MerchandisingHome | exists | | | b2066e9 foundation; broken nav/chrome fixed this slice |
| 2 | Search ▸ Pinning | — | missing | pending | | Query pins: search + pin grid + pins table |
| 3 | Search ▸ Merchandising Rules | MerchandisingChannelDefaults (rules tab) | partial | pending | | Rules exist collection-oriented; needs search-scoped rules list |
| 4 | Search ▸ Promo Cards | — | missing | pending | | Card gallery + status toggles |
| 5 | Search ▸ Banners | — | missing | pending | | Card gallery + target URL |
| 6 | Search ▸ Blacklisting (suggestions + product matches) | — | missing | pending | | Two tabs |
| 7 | Search ▸ Synonyms | MerchandisingChannelSynonyms | exists | | | Aligns with new-dashboard table incl. type/status filters |
| 8 | Search ▸ Page Redirects | MerchandisingChannelRedirects | exists | | | |
| 9 | Search ▸ Preview | MerchandisingChannelSearchPreview | exists | | | |
| 10 | Search ▸ Content (BETA) | — | missing | pending | | Light list per BETA scope |
| 11 | Smart Collections ▸ Collections (+ edit tabs) | MerchandisingChannelCollections | partial | pending | | List exists; edit tabs (filters/activation/sorting) light |
| 12 | Smart Collections ▸ Pinning (collection-scoped) | MerchandisingChannelDefaults (pinning tab) | exists | | | PinningEditor covers; channel-scoped links fixed this slice |
| 13 | Smart Collections ▸ Promo Cards / Banners | — | missing | pending | | Reuse Search views w/ collection scope |
| 14 | Recommendations | MerchandisingChannelRecommendations | exists | | | Engine types align w/ crawl (7 types) |
| 15 | Analytics ▸ Snapshot | — | missing | pending | | KPIs + revenue chart |
| 16 | Analytics ▸ Search | — | missing | pending | | Top searches / zero results tables |
| 17 | Analytics ▸ Smart Collections | — | missing | pending | | Top collections table |
| 18 | Analytics ▸ Recommendations | — | missing | pending | | Widget performance table |
| 19 | Settings ▸ Status & usage | MerchandisingChannelSetup | partial | pending | | Setup page exists; needs status cards + [REDACTED] snippet/key blocks |
| 20 | Settings ▸ Product Sync | — | missing | pending | | Sync overview + indexed counts |
| 21 | Settings ▸ Integrations | — | missing | pending | | Rating & Reviews cards |
| 22 | Settings ▸ Primary/Advanced Setup | MerchandisingChannelFields | partial | pending | | Field transformations ≈ primary setup slice; rest recorded, build light |

## Phase 3 — Proposed build order (awaiting user approval, 2026-07-07)

Modules with `pending` (partial/missing) Part B rows, ordered by user value; gated-commerce kept as its own cohesive slice. **No code built yet — this is the queue for Phase 4.**

1. **A05 Marketing — 6 rows (2 partial, 4 missing). ✅ BUILT 2026-07-08.** Delivered as additive new pages: Campaign Report detail (#25, aea9f25), Landing Page Templates (#31, 6438e8e), Transactional/Survey/Campaign-Tag create forms (#26/#27/#28, 071cd46), Email Content editor (#32, 9422b99). NOTE: create/detail/editor sub-flows are reachable by route (+nav item for #31); their natural entry buttons live on existing list views which additive-only forbids editing — **entry-wiring is deferred** and needs an explicit additive-exception to wire (a small `@click`/`:to` on each existing list's create button).
2. **A06 Commerce — Gift Cards — 2 rows (1 missing, 1 partial). ✅ BUILT 2026-07-08 (d2d836f).** Cohesive gated-commerce pair (Custom #5 + Purchasable #6) that completes the Coupons/Promotions/Gift-Cards family. Delivered as 2 additive commerce-gated views + additive useCommerce mock data + repointed routes; the shared Coupons.vue was NOT edited.
3. **A02 Analytics — 3 partial. ✅ BUILT 2026-07-08** (user granted an edit-in-place exception, since these were stubs inside existing views). Sales Summary channel chart (#4, 81c0d0f), eRFM Report body (#5, 1f448ef), Custom Reports builder (#12, 6c58fa5). These EDITED existing view templates — the only sanctioned exception to additive-only besides the journeys redesign.
4. **A08 Service — Chatbots — 1 partial (#2). ✅ BUILT 2026-07-08 (e0a982d).** Full-page "Customize your widget" builder (6 sections + live preview) replacing the Tickets.vue reuse.
5. **A03 CDP — Web Tracking — 1 partial (#9).** Add the websites list/manage flow alongside the existing embed snippet; single page, lower urgency.
6. **A11 Settings — 20 rows — DEFER until after the logged-in A11 crawl.** Verdicts are provisional (title-only) and the set includes sensitive credential cards (JWT #3, SFTP Access #5, SFTP Import/Export #6) that must not be built blind. After the crawl: split into (a) safe store-setup/service settings (Region, Custom Domains, Ticket Types/Tags, Packages, Shipping Settings, etc.) and (b) sensitive cards under an explicit redaction scope. Several legacy cards (301 Redirects #26, Archives #29) are low value — reassess then.

Note #2 vs #3 are close on value; reorder if Analytics polish matters more than gift cards for the current stakeholder demo.

## Progress log

- 2026-07-03 — Scaffolding created (tracker + playbook + phase-prompts + skill). Part A module sections seeded from the read-only UAT nav pass; row-level crawl and Part B remain pending. `<UAT_URL>` not yet filled.
- 2026-07-03 — URL-only UAT inventory filled from the authenticated sidebar/settings pass: 97 rows total, including 63 concrete UAT paths and 34 Settings card placeholders. Current live browser recheck redirected to Maropost Identity, so Settings card URLs, Retail deep links, screenshots, and primary CTA/detail flows remain pending for a logged-in follow-up.
- 2026-07-05 — Build-with-AI journeys + Data Journeys rebuilt (user-directed slice). Legacy AI-path crawl findings: journey created before the AI interview, 6+ turn interrogation, output = table in chat + separate "Generate Journey" button (crawled "www" journey shows Items: 0 — output never stitched to canvas), generic placeholder copy. Prototype redesign: draft-before-create Da Vinci wizard path (brief chips → live flow preview + sequence table → refine chips → create), copilot 'journey' intent with wizard deep-link, Ask-Da-Vinci in the builder (copilot drawer now mounts on fullPage routes, docking beside the canvas). Data journeys: legacy node palette (8 triggers/6 actions) + 3 templates + store, builder gains a data domain via route meta, list rebuilt to journeys pattern with a create drawer incl. describe-to-draft parsing. Commits 5ade1df…4104bfb.
- 2026-07-05 — Email campaign create flow fixed (Phase 2, first slice): the list's "New Campaign" CTA now routes to the full-page CreateCampaign wizard and the cramped drawer-stepper in EmailCampaigns.vue was removed; wizard dead-end navigation ('/campaigns' pushes) fixed to named routes; review-step edit pencils now map to the correct steps; the legacy four suppress dropdowns consolidated into one multi-select on the Audience step; invisible white-on-white text on non-selected template/list cards fixed.
- 2026-07-05 — Marketing module deep crawl completed via delegated read-only browser agents (journeys flow + campaign, acquisition, and content stacks); 15 deep-flow rows appended to A05 and a flow-observations digest added. Journey Reports blocked by a UAT 500. Journeys create flow rebuilt in the prototype (create wizard w/ template previews, branch-rendering builder, full node catalog, schema config, activation validation — commits 6b3264e…fadc14e). NOTE: the playbook's additive-only rule was overridden for the journey views by explicit user instruction ("redesign the best flow"); JourneyBuilder.vue and the Journeys CTA were intentionally modified. Screenshots were not captured (crawl ran without disk capture); URL-only rows per existing convention.
- 2026-07-07 — Handover brief created at docs/uat-parity/HANDOVER.md (verified current-state + remaining roadmap + guardrails + paste-ready kickoff prompt) so a fresh Claude session can continue the effort. Next pending slices: finish A07 Retail + A11 Settings crawl, then build the empty Part B gap matrix. Scaffolding docs (playbook, phase-prompts, skill) committed alongside the handover.
- 2026-07-07 — A07/A11 crawl attempted but BLOCKED: live UAT redirected to Maropost Identity (Keycloak, `keycloak-staging.maropost.com`) — no logged-in session available this session, and login credentials are out of scope for the agent. A07 Retail + A11 Settings remain `[crawl-status: pending]`; sensitive Settings cards (API Keys, JWT, SFTP Access, SFTP Import/Export) never opened.
- 2026-07-07 — **Part B gap matrix BUILT** (Phase 2 complete) from Part A × `src/router/index.ts`, feature-intent matched via a multi-agent workflow (11 matcher agents + one adversarial verifier per row, ~157 agents total). 112 rows → **79 exists / 13 partial / 20 missing**. Adversarial pass corrected 9 verdicts (marked ⚑): A03 Web Tracking→partial, A05 Campaign-Tag-create & Survey-create→partial, A06 Custom Gift Cards→missing & Purchasable Gift Cards→partial, A08 Chatbots→partial, A11 Bulk-Delete-Contacts→exists, A11 Test-Subject→partial, A11 Product-Categories→missing. Already-built Marketing rows back-filled as `done`: Journeys create/builder (6b3264e…fadc14e, user-directed redesign), Data Journeys list+builder (5ade1df…4104bfb), Email campaign create wizard (19f31e3). A07 (1 row) + A11 (35 rows) verdicts are PROVISIONAL — matched from card/nav titles only; re-confirm after the logged-in deep crawl. Build queue = 33 pending partial/missing rows.
- 2026-07-07 — Build-phase style directive from user (for Phase 4, not yet started): new parity pages should feel clean + modern, shadcn-like flat cards + Material-style form fields — implemented with the EXISTING Vuetify + `Mp*` components and design tokens (NO new UI dependency; CLAUDE.md design-system rules stand). Mobbin MCP now connected (search_screens / search_flows / search_sections) for reference-pattern lookups during build slices.
- 2026-07-07 — Corrected build-queue count 31→33 (all partial+missing rows; the 7 `done` rows are `exists`, not part of the queue). **Phase 3 (prioritize) DONE** — proposed build order added above: A05 Marketing → A06 Gift Cards → A02 Analytics → A08 Chatbots → A03 Web Tracking; A11 Settings deferred until the logged-in crawl. STOP at gate — awaiting user approval/reorder before Phase 4 build.
- 2026-07-08 — **Phase 4 slice 1 — A05 Marketing BUILT** (user-approved). 6 new additive pages, one commit each, all type-checked + preview-verified at 1280px: Campaign Report detail (#25 aea9f25), Landing Page Templates (#31 6438e8e, + nav item), Transactional/Survey/Campaign-Tag create forms (#26/#27/#28 071cd46), Email Content drag-&-drop editor (#32 9422b99). Only additive touches to existing files: routes appended to router/index.ts, one nav item in AppSidebar buildNavGroups; no existing view template/styles edited. Fixed a theme-collision in the tag colour picker (Da Vinci brand overrides secondary→near-black & primary==info; switched to Vuetify named Material colours). KNOWN LIMITATION: create/detail/editor entry buttons on the existing list views (EmailCampaigns, TransactionalEmail, CampaignTags, Surveys, LandingPages, EmailContent) are still inert — wiring them is an existing-template edit, deferred pending an explicit additive-exception. New pages reachable by route (and nav for #31). Build queue now 27 remaining. STOP at module boundary — next slice A06 Gift Cards.
- 2026-07-08 — **Phase 4 slice 2 — A06 Commerce Gift Cards BUILT** (user-approved; next in Phase 3 order). 2 additive commerce-gated pages in one cohesive commit (d2d836f): Custom Gift Cards (#5 — issued store-credit cards: balance progress / status / recipient + Issue Gift Card drawer) and Purchasable Gift Cards (#6 — gift-card products: denomination chips / custom-amount range / sold / revenue + Create Product drawer). Both replace the shared Coupons.vue placeholder the routes previously pointed to; nav items already existed under Commerce → Promotions. Additive touches only: 2 new views + additive mock data in useCommerce (customGiftCards, purchasableGiftCards) + repointed 2 existing route records — no existing view templates/styles edited. type-check + production build pass; 0 console errors; screenshot-verified at 1280px. Build queue now 25 remaining. STOP at module boundary — next slice A02 Analytics (3 partial: Sales Summary #4, eRFM #5, Custom Reports #12).
- 2026-07-08 — **Phase 4 slice 3 — A02 Analytics BUILT** (user-approved; **user granted an explicit edit-in-place exception** — these 3 partials are stubs INSIDE existing view files, so completing them EDITED existing templates, unlike the additive A05/A06 slices). One commit per page, all type-checked + preview-verified at 1280px, 0 console errors: Sales Summary (#4, 81c0d0f — KPI row + token-styled revenue-by-channel bar chart + detail table), eRFM Report (#5, 1f448ef — summary KPIs + segment distribution bar + 9 RFM segment cards with recommended actions), Custom Reports (#12, 6c58fa5 — saved-reports card grid + working MpFormDrawer builder that creates reports live). Additive mock data added to useAnalytics (salesChannels, rfmSegments, customReports). Style per user directive: clean/modern flat cards + Material fields, existing Vuetify + Mp* + tokens, no new dependency. This is the 2nd sanctioned additive-only exception (after the journeys redesign). Build queue now 22 remaining. STOP at module boundary — next slice A08 Service — Chatbots (#2, partial; buildable additively as a new Chatbot page replacing the Tickets.vue reuse).
- 2026-07-08 — **A05 entry-wiring RESOLVED** (user-approved edit-exception — 3rd sanctioned exception). The deferred limitation from the A05 build slice is closed: the create/detail/editor pages are now reachable by click, not just by URL. Commit b421e37 wired 6 existing Marketing list views: EmailCampaigns "View report"→CampaignReport (passes row id; the handler previously mispointed to the analytics CampaignReports list), TransactionalEmail "New Flow"→CreateTransactional, CampaignTags "Create Tag"→CreateCampaignTag, Surveys "Create Survey"→CreateSurvey, LandingPages "Create Page"→LandingPageTemplates, EmailContent "Edit"→EmailContentEditor(item.id) + "Create Content"→blank-canvas starter. Most wired via a one-attribute `:to` using `$route.params.accountId` (no script changes); EmailContent switched its list to useContentStore (so Edit has a real id) and Clone now calls the store. All 6 verified navigating in preview; type-check clean; 0 console errors. Build queue unchanged at 22 (this was closing a limitation on already-`done` rows, not new queue rows).
- 2026-07-08 — **Marketing UX pass (user-directed design review, 4th sanctioned edit-exception)** — separate from the parity build queue; polishes already-shipped pages after a screenshot review. Six commits: (1) **Email Campaign wizard aligned** to the design system — custom header/v-stepper/red Discard → MpPageHeader + MpWizardSteps + MpConfirmDialog discard + shared footer (26ce5e2). (2) **Transactional SMS** — the nav item reused the email view; added a real useSms store + TransactionalSms list + CreateTransactionalSms flow with a GSM-7 segment counter, routes repointed (fff75fe). (3) **SMS Campaigns** — real marketing SMS list + compose drawer, route repointed (b4206c2). (4) **Acquisition Forms list** deeper redesign — useForms store, real mini form-preview thumbnails, segmented toggle, grid search, selection + MpFloatingBulkBar, empty states, de-duplicated kebab (91b2ff1; also improves the shared Lead Ads route). (5) **Form Builder** deeper redesign — MpWizardSteps with click-to-jump, real field palette (add/remove/reorder/required) + live preview of actual fields, working v-color-picker, dirty tracking + unsaved-changes guard (04f4798); MpWizardSteps gained an optional backward-compatible `clickable`/`maxStep` + `select` emit. All type-checked + preview-verified; 0 console errors. NOTE: user pasted UAT reference URLs (/acquisition/forms/select, /social_leads) but UAT is behind Keycloak login (not crawlable here) — redesign followed the prototype's own design system. Parity build queue unchanged at 22 (A03 Web Tracking, A08 Chatbots, A11 Settings ×20).
- 2026-07-08 — **Phase 4 slice — A08 Service Chatbots BUILT** (user-approved; user shared legacy UAT reference screenshots of the "Customize your widget" chatbot flow). Commit e0a982d: the `/chatbot` route reused Tickets.vue (partial ⚑); replaced with a real full-page **Chatbot widget builder** in the prototype design system — new useChatbot store + ChatbotBuilder.vue, 3-pane layout (section nav · settings panel · live widget preview) with six sections (General, Appearance incl. preset + custom v-color-picker + launcher position + welcome msg, Business hours, Quick prompts reorder/toggle, Knowledge base sources + add-source, Pre-chat form settings + editable fields). Live preview reflects brand color / welcome / quick-prompt chips and swaps to the pre-chat form on that section. Route repointed to fullPage; nav item pre-existed. Fixed a real bug found in preview: `swatches`/`storeTypes` were plain const arrays in the store (storeToRefs drops non-refs → undefined) — moved to local component consts. type-check clean; all 6 sections verified; 0 console errors. **Build queue now 21 remaining** (A03 Web Tracking ×1, A11 Settings ×20). Next additive slice: A03 Web Tracking. A11 still deferred pending the logged-in crawl.
- 2026-07-10 — **MpSectionRail design-system component + Settings auto-minimize** (user-directed follow-up). Commit 382f293: the rail pattern extracted into MpSectionRail (23rd top-level Mp component, CLAUDE.md inventory updated) with all elements — back link, identity + switcher (emits switch), search filter, grouped icon links w/ counts/external/active accent, #footer action slot — and 4 Storybook stories (StoreEditor / SettingsFlavor / WithFooterAction / AllElements, render-verified incl. search). StoreEditorSidebar refactored to compose it (verified pixel/behavior-equivalent). Settings parent route gained `railShell` meta → main sidebar now auto-minimizes in Settings too (App.vue inRailShell generalized). Future rails (Merchandising after its crawl, Retail) should compose MpSectionRail.
- 2026-07-10 — **Main sidebar AUTO-MINIMIZE in store editor** (user-approved plan; follow-up to the rail). Commit 0c62f6e: `storeEditor` meta flag on the StoreEditorLayout parent + App.vue edge-triggered watcher w/ saved-state restore (immediate for deep links; POS channels excluded; manual toggles inside the shell respected; narrow-viewport rule preserved). **NEXT-SLICE DIRECTIVE (user):** convert Merchandising to this rail pattern AFTER a proper crawl of the Merchandise cloud — key product fact from user: real Merchandising is ENTITY-SCOPED like the store editor (select a sales channel first → merchandise overview + sections), unlike the prototype's current account-level module pages — so it gets the entity-flavor rail (identity + channel switcher). Pattern survey (same session): Retail is the other strong rail candidate (~10 pages in a 4-subgroup accordion, module-flavor); Chatbots builder / Contact detail / Campaign report / Dashboards should keep their current tabs/3-pane patterns. Settings auto-collapse NOT approved (store editor only for now; mechanism is generic).
- 2026-07-10 — **A06b Store-editor SHELL BUILT as a section rail** (user asked whether to keep legacy's sidebar-swap navigation; UX review recommended against it — silent identical-sidebar swap, destroyed global nav, sticky hidden mode; refs: GitLab Pajamas navigation-sidebar spec, NN/g Local Navigation, Shopify admin's single-sidebar nesting. User picked "Store section rail" from 3 options via approved plan). Commit 0956786: StoreEditorLayout parent route (clones the Settings shell) + StoreEditorSidebar (260px rail: user-worded exit, store identity + section-preserving store switcher, icon links w/ active accent) + storeEditorMenu.ts (data-driven, live sections only — General/Integrations/Store-Settings rail items appear when those pages get built). The 12 store-editor routes nested as children with URLs/names UNCHANGED; 4 list views dropped redundant back-links; editors keep back-to-list; AppSidebar untouched; POS channels render rail-less. Verified: rail hops + active states, editor section-highlight retention, switcher lands on same section, theme fullPage exit, hub tiles, mobile top-bar collapse; type-check + 0 console errors. B-A06b row 1 → done. **Build queue now 25** (A06b: General #2, Themes #3, Integrations #9, Store Settings #10 + A03 Web Tracking + A11 ×20).
- 2026-07-10 — **A06b Campaigns & Assets BUILT** (user said "continue"; next per queue). Commit b287b00: StoreCampaigns (list w/ derived Scheduled/Active/Ended status + MpFormDrawer create/edit replacing the legacy modal; targets = collections from useStoreNavigation catalog — ASSUMPTION, legacy Targets dropdown wasn't enumerable in the crawl, re-confirm on a future pass) + StoreAssets (extension-badged grid, sort by uploaded/name/size, mock multi-file upload, pagination; no per-asset actions invented since the crawl didn't expose any) + useStoreCampaigns/useStoreAssets stores + 2 commerce-gated routes + Campaigns/Assets quick-action tiles (9 tiles wrap 4+4+1). Verified 1280 + mobile; type-check clean; 0 console errors. B-A06b rows 7+8 → done. **Build queue now 26** (A06b remaining: shell #1, General #2, Themes #3, Integrations #9, Store Settings #10 — all `partial` + A03 Web Tracking + A11 ×20). STOP at slice boundary — remaining A06b partials all touch EXISTING views (SalesChannelDetail settings tab, StoreThemeBuilder) or need scope decisions; next clean additive candidate: A03 Web Tracking.
- 2026-07-10 — **A06b Pages & Blogs BUILT** (user said "continue" after reviewing the Navigation slice). Commit 1581330: shared StoreContentList/StoreContentEditor views parameterized by route meta `contentKind` (legacy uses one identical form for both), useStoreContent store (ContentEntry model, per-channel blog SEO, seeds matching the crawl's Terms/Privacy pages), 6 commerce-gated routes, and Pages+Blogs quick-action tiles on SalesChannelDetail (script-only, extends the sanctioned entry exception; 7 tiles wrap 4+3). Rich text = contenteditable + toolbar (undo/redo, H2/¶, B/I/U/S, lists) — dependency-free stand-in for the legacy WYSIWYG; feature image = filename-only mock upload. Status logic: create defaults Inactive, first activation stamps publishedAt (matches legacy Published At "—" for never-published). Verified at 1280+375; type-check clean; 0 console errors. B-A06b rows 4+5 → done. **Build queue now 28** (A06b remaining: shell #1, General #2, Themes #3, Campaigns #7, Assets #8, Integrations #9, Store Settings #10 + A03 Web Tracking + A11 ×20). STOP at slice boundary — next candidates: A06b Campaigns+Assets, or A03 Web Tracking.
- 2026-07-10 — **A06b Store Editor CRAWLED + Navigation BUILT** (user-directed slice via /uat-parity, approved plan). Deep crawl of the legacy store editor on the SANDBOX env (`sandbox.maropost.com/commerce/112201/stores/4/…`, logged-in claude-in-chrome session; the uat.maropost.com base remains Keycloak-blocked): 18 Part A rows (A06b) + observations digest + 10 new Part B rows (B-A06b: 5 partial, 4 missing remaining, 1 built). KEY CRAWL FACT: legacy storefront menus are FLAT (name + link rows, drag reorder) — the planned nesting/indent UI was dropped as it would be a new feature; the plan's recursive MenuItemTree.vue was simplified to inline flat rows for the same reason. Built the redesigned Navigation manager (commit dadefd9): useStoreNavigation store + StoreNavigation list + StoreNavigationMenuEditor (single-screen master-detail: details/items left, status + live MenuPreviewCard right; link-type select + resource autocomplete replaces legacy's full-width drill-in panel; accurate discard-guard replaces the misleading "Cancel Navigation Creation" modal) + 3 commerce-gated section-style routes + script-only SalesChannelDetail quick-action entry (5th sanctioned edit-exception, user-approved in plan). type-check clean, verified at 1280+375, 0 console errors. Build queue: A06b adds 9 pending rows (Pages, Blogs, Campaigns, Assets ×missing; shell/General/Themes/Assets/Integrations/Store-Settings ×partial) → queue now 30. STOP at slice boundary — next candidates: A06b Pages/Blogs (cohesive WYSIWYG pair) or A03 Web Tracking.
- 2026-07-08 — **A08 Chatbots REDESIGNED into a full flow** (user-directed; shared legacy reference screens for the chatbot list/archive/publish + shopping/order-tracking conversation flows). Supersedes the single-page builder. 4 commits: (1) restructure — useChatbot → multi-chatbot store (per-store config + shopping/orderTracking blocks + prompt intents + preview catalog + CRUD), ChatbotList (filter/status/archive/quick-create), ChatbotArchived (restore), builder per-:id, routes ChatbotList//archived//:id + Service nav sub-group (cc84946); (2) Shopping Assistant + Order Tracking sections + Publish modal with install-script/copy/steps (cf63ef1); (3) redesigned live preview — scenario switcher (Welcome/Shopping/Order tracking/Open chat/Pre-chat) with chat bubbles, product carousel + add-to-cart, order-status card, and open-chat **intent routing** demonstrating "shows both shopping + support prompts; free-text routes by intent" (94ab034). Per user spec: one chatbot per store, many per user; clicking a chatbot opens its builder. No product images exist → product cards use icon thumbnails. type-check clean; all views + scenarios verified in preview; 0 console errors. Parity build queue unchanged at 21.
