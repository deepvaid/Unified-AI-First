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

_Populated by Prompt 2._ Table template:

<!--
| # | UAT page/flow | Prototype route (or —) | Verdict | Build status | Commit | Notes |
|---|---------------|------------------------|---------|--------------|--------|-------|
| 1 | <title> | RouteName / — | missing | pending | | |
-->

## Progress log

- 2026-07-03 — Scaffolding created (tracker + playbook + phase-prompts + skill). Part A module sections seeded from the read-only UAT nav pass; row-level crawl and Part B remain pending. `<UAT_URL>` not yet filled.
- 2026-07-03 — URL-only UAT inventory filled from the authenticated sidebar/settings pass: 97 rows total, including 63 concrete UAT paths and 34 Settings card placeholders. Current live browser recheck redirected to Maropost Identity, so Settings card URLs, Retail deep links, screenshots, and primary CTA/detail flows remain pending for a logged-in follow-up.
- 2026-07-05 — Build-with-AI journeys + Data Journeys rebuilt (user-directed slice). Legacy AI-path crawl findings: journey created before the AI interview, 6+ turn interrogation, output = table in chat + separate "Generate Journey" button (crawled "www" journey shows Items: 0 — output never stitched to canvas), generic placeholder copy. Prototype redesign: draft-before-create Da Vinci wizard path (brief chips → live flow preview + sequence table → refine chips → create), copilot 'journey' intent with wizard deep-link, Ask-Da-Vinci in the builder (copilot drawer now mounts on fullPage routes, docking beside the canvas). Data journeys: legacy node palette (8 triggers/6 actions) + 3 templates + store, builder gains a data domain via route meta, list rebuilt to journeys pattern with a create drawer incl. describe-to-draft parsing. Commits 5ade1df…4104bfb.
- 2026-07-05 — Email campaign create flow fixed (Phase 2, first slice): the list's "New Campaign" CTA now routes to the full-page CreateCampaign wizard and the cramped drawer-stepper in EmailCampaigns.vue was removed; wizard dead-end navigation ('/campaigns' pushes) fixed to named routes; review-step edit pencils now map to the correct steps; the legacy four suppress dropdowns consolidated into one multi-select on the Audience step; invisible white-on-white text on non-selected template/list cards fixed.
- 2026-07-05 — Marketing module deep crawl completed via delegated read-only browser agents (journeys flow + campaign, acquisition, and content stacks); 15 deep-flow rows appended to A05 and a flow-observations digest added. Journey Reports blocked by a UAT 500. Journeys create flow rebuilt in the prototype (create wizard w/ template previews, branch-rendering builder, full node catalog, schema config, activation validation — commits 6b3264e…fadc14e). NOTE: the playbook's additive-only rule was overridden for the journey views by explicit user instruction ("redesign the best flow"); JourneyBuilder.vue and the Journeys CTA were intentionally modified. Screenshots were not captured (crawl ran without disk capture); URL-only rows per existing convention.
- 2026-07-07 — Handover brief created at docs/uat-parity/HANDOVER.md (verified current-state + remaining roadmap + guardrails + paste-ready kickoff prompt) so a fresh Claude session can continue the effort. Next pending slices: finish A07 Retail + A11 Settings crawl, then build the empty Part B gap matrix. Scaffolding docs (playbook, phase-prompts, skill) committed alongside the handover.
