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

**Summary: 112 rows → 79 exists · 13 partial · 20 missing.** Build queue (all partial + missing rows) = 33; **6 built in A05 Marketing + 2 in A06 Commerce + 3 in A02 Analytics (2026-07-08)**, 22 remaining. Rows with `done` build status = 18 (7 earlier Marketing back-fills + 6 Marketing slice + 2 gift-cards slice + 3 Analytics slice).

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

### B-A07 — Retail  _(provisional — deep crawl pending)_
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Retail | RetailHome | exists | | | Full Retail section (RetailHome + registers/txns/associates/POS preview/stock/pricing/hardware/settings). UAT deep crawl pending — re-confirm sub-pages then. |

### B-A08 — Service
| # | UAT page/flow | Prototype route | Verdict | Build | Commit | Notes |
|---|---|---|---|---|---|---|
| 1 | Tickets | Tickets | exists | | | List + thread + reply + create drawer |
| 2 | Chatbots | Chatbot | partial ⚑ | pending | | `/chatbot` routes to Tickets.vue; no chatbot-specific UI |

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

## Phase 3 — Proposed build order (awaiting user approval, 2026-07-07)

Modules with `pending` (partial/missing) Part B rows, ordered by user value; gated-commerce kept as its own cohesive slice. **No code built yet — this is the queue for Phase 4.**

1. **A05 Marketing — 6 rows (2 partial, 4 missing). ✅ BUILT 2026-07-08.** Delivered as additive new pages: Campaign Report detail (#25, aea9f25), Landing Page Templates (#31, 6438e8e), Transactional/Survey/Campaign-Tag create forms (#26/#27/#28, 071cd46), Email Content editor (#32, 9422b99). NOTE: create/detail/editor sub-flows are reachable by route (+nav item for #31); their natural entry buttons live on existing list views which additive-only forbids editing — **entry-wiring is deferred** and needs an explicit additive-exception to wire (a small `@click`/`:to` on each existing list's create button).
2. **A06 Commerce — Gift Cards — 2 rows (1 missing, 1 partial). ✅ BUILT 2026-07-08 (d2d836f).** Cohesive gated-commerce pair (Custom #5 + Purchasable #6) that completes the Coupons/Promotions/Gift-Cards family. Delivered as 2 additive commerce-gated views + additive useCommerce mock data + repointed routes; the shared Coupons.vue was NOT edited.
3. **A02 Analytics — 3 partial. ✅ BUILT 2026-07-08** (user granted an edit-in-place exception, since these were stubs inside existing views). Sales Summary channel chart (#4, 81c0d0f), eRFM Report body (#5, 1f448ef), Custom Reports builder (#12, 6c58fa5). These EDITED existing view templates — the only sanctioned exception to additive-only besides the journeys redesign.
4. **A08 Service — Chatbots — 1 partial (#2).** Replace the current Tickets.vue reuse with a real chatbot-management page; distinct feature, medium value.
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
