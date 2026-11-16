# Master prompt: build a BKM-ready store in the Commerce Cloud prototype

**What this is.** A prompt for an AI coding agent (Claude Code) working in this repo. It builds,
one reviewed slice at a time, everything the Commerce Cloud prototype needs so a merchant can
create a store like [bkm.health](https://bkm.health/) with the Store Builder and the Commerce back office.

**How to use it.**

1. Open a fresh Claude Code session at the repo root, on an up-to-date `master`.
2. Paste the kick-off line:

   ```text
   Read docs/store-builder/bkm-build-prompt.md and run the next pending slice.
   ```

   To run a specific slice instead: `… and run slice S7.`
3. The agent builds one slice, verifies it, commits it on its own branch, and stops with a report.
   Review it, merge it if you are happy, then start a new session for the next slice.

Everything below the line is the prompt.

---

## 1. Mission

Maropost Commerce Cloud (MCC) is being built around a few named brands. Every feature a brand's
store needs gets built in Commerce Cloud and the Commerce Cloud Store Builder. BKM Health is the first.
It is a Swedish supplements brand on Shopify: 8 products, mostly sold on subscription, three markets,
and a product page made of about 20 storytelling sections.

Your job is to make **this prototype** able to run a BKM-like store end to end:

- a merchant builds the theme in the Store Builder, section by section, with one template per product;
- the back office has what the store depends on (subscriptions, markets, shipping, reviews, product
  content, consent and tracking, migration);
- a shopper can browse, subscribe, pay in their market's currency, and manage the subscription.

This is a Vue 3 + Vuetify prototype with mock data and no backend. "Build" means a believable,
working, demo-able prototype with real interactions and deterministic mock data. It does not mean
production services.

You work in **slices**. Each run of this prompt does exactly one slice (section 7), then stops.

## 2. Read first, every run

1. `CLAUDE.md`, the design-system rules. They are binding for every admin screen.
2. `.claude/rules/global-styles.md`.
3. This file, completely.
4. `docs/store-builder/bkm-build-tracker.md`, the progress tracker. Slice S0 creates it; if it is missing, you are on S0.
5. `docs/store-builder/bkm-health-requirements.md`, the requirements and gap report. Each slice
   lists requirement IDs (`T01`–`T54` theme, `P01`–`P28` platform). Read those rows before building.
   The report's statuses describe the **real** MCC as seen in a UAT capture, not this prototype.
   **Never edit that report's statuses.** Record prototype progress in the tracker.
6. The page archetypes at `/templates` (`src/views/Templates/`) before building any admin page.

The same report, rendered: https://ai-first-maropost.vercel.app/bkm-health-requirements.html

## 3. Ground rules

**Process**

- **One slice per run.** Never start the next slice. If a slice is too big for one run, split it in
  the tracker (for example `S7a`, `S7b`), finish the first part properly, and stop.
- **Branch per slice** from the latest `master`: `feature/bkm-s<N>-<slug>`, for example
  `feature/bkm-s3-content-sections`. Commit format: `[feat]: …` (see CLAUDE.md, Git Conventions).
- **Do not push, open a PR or merge** unless the human asks in this session.
- **Explore before you build.** Find and reuse what exists (section 5) before adding a store,
  component or helper. Don't create a parallel store for data an existing store already owns.
- **If this prompt conflicts with the code,** trust the code. Note the conflict in the tracker and
  name it in your report.
- **Ask the human first** before:
  - adding an npm dependency;
  - changing anything recorded as locked in `docs/maropay/decisions.md`;
  - deleting or renaming an existing route;
  - changing how existing stores (Neelam-Store, Max Test Store, POS Store) look or behave.

**Building**

- **Admin screens follow the design system exactly.** That means:
  - `Mp*` components and tokens only; no raw `v-dialog`; forms in `MpFormDrawer` or `MpDialog`;
  - list pages use `MpPageHeader` → `MpFilterTabs` → card with `MpDataTableToolbar` + `v-data-table` + `MpEmptyState`;
  - statuses use `MpStatusChip`. Add a new `type` (for example `subscription`) rather than hand-rolling chips;
  - icons are Lucide names;
  - a new reusable admin component gets a story and an entry in CLAUDE.md's Component Inventory;
  - renames and breaking changes are logged in `DESIGN_AUDIT.md`'s changelog.
- **The shopper storefront is outside the design system.** It is styled by the theme's settings
  (`ThemeStyles` in `src/stores/themeBuilderData.ts`), exposed as `--sf-*` custom properties.
  Never style storefront sections with Maropost admin tokens. Never hardcode a brand colour or
  font in a section: read it from theme settings.
- **Domain logic is pure TypeScript with tests.** Follow the `src/maropay/` pattern:
  - modules under `src/<area>/` with no Vue, no Pinia and no `@/` imports (relative `.ts` paths), so Node can run them;
  - tests under `tests/<area>/*.test.ts`;
  - an npm script like `"test:subscriptions": "node --experimental-strip-types --test 'tests/subscriptions/*.test.ts'"`;
  - dates come from an injectable clock, never `new Date()` inside logic;
  - money uses the helpers in `src/maropay/money.ts`.
- **Mock data is deterministic.** Seeds are fixed. Follow each store's existing persistence pattern
  and bump its storage-key version when you change a seed's shape.
- **Nothing leaves the browser.** No network calls, no real payments, no real email or SMS, and no
  third-party scripts in the storefront. Pixels and chat are simulated: log what would fire.
- **Accessibility.** Every interactive element works from the keyboard and has a name. Storefront
  motion respects `prefers-reduced-motion`. Builder-only UI never leaks into the live storefront.
- **BKM content.** BKM is the reference customer:
  - its catalog structure is fine as seed data (product names, variants, prices, plan rules, markets);
  - write your own short copy;
  - never copy BKM's long-form text, and never hotlink or download its images;
  - product imagery is generated placeholder art in the theme palette, for example SVG pack shots.
- **npm only** (no pnpm). Keep `npm run type-check` clean.

## 4. Locked architecture decisions

These are settled. Do not reopen them in a slice; if one blocks you, stop and ask.

1. **Extend the AI-first Store Builder on `master`.** That is `StoreThemeBuilder.vue`,
   `themeBuilderData.ts` and `useStoreThemes.ts`. The 1:1 UAT re-skin on branch
   `feature/store-builder-reskin` is a naming reference only (real Lumos section and template
   names). Read it with `git show`; never merge it.
2. **One section engine.** Today the builder canvas (`src/components/saleschannels/StorefrontPreview.vue`)
   and the live storefront (`src/views/Storefront/StorefrontHome.vue` and siblings) render sections
   with two separate `v-if` chains. Slice S1 replaces both with:
   - a **section registry**: one definition per section kind holding its schema (settings fields,
     block kinds, defaults, category, thumbnail, which template types allow it);
   - **one component per section kind**, under `src/components/storefront/sections/`, rendered by
     a single dispatcher that both the canvas and the live storefront use.

   From S1 on, a section exists once and looks identical in the builder and on the storefront.
3. **Templates are named and per type.** Each template type (home, product, collection, page, blog,
   article, search, cart, account) can hold several named templates (`product.default`,
   `product.tranquil`). Products and pages pick one. The builder edits one at a time.
4. **Sections read product data through bindings.** A section or block setting is either a static
   value or bound to a product field or product content field (S4). On a product template, bound
   values come from the product being viewed. In the builder they come from a chosen preview product.
5. **Admin homes for new back-office features.** Use these unless the code shows a better existing home:

   | Feature | Where it lives |
   |---|---|
   | Subscriptions (plans, contracts) | Commerce nav, next to Orders |
   | Reviews and content fields | Products nav |
   | Markets, Shipping & delivery | Settings › Store Setup group (`src/components/settings/settingsMenu.ts`) |
   | Privacy & Consent, Tracking & Analytics | Fill the existing placeholder pages in `src/views/Settings/pages/` |
   | Redirects, Import from Shopify | Store editor menu (`storeEditorMenu.ts`) |
6. **Other Maropost clouds do their own jobs.** Email, SMS, signup forms and journeys go to Marketing
   (`src/views/Marketing/*`, `useForms`, the journey builder). Chat, help centre and tickets go to
   Service (`src/views/Service/*`, `TicketOrdersPanel`) and the store's Chatbot page. Add triggers
   and links into those modules; don't rebuild them inside Commerce.

## 5. Code map (verified on `master`, 2026-11-16)

| Area | Files |
|---|---|
| Store Builder | `src/views/SalesChannels/StoreThemeBuilder.vue`, `src/stores/themeBuilderData.ts` (section kinds, block kinds, `ThemeStyles`, `TemplateType = 'home' \| 'product' \| 'collection' \| 'cart'`), `src/stores/useStoreThemes.ts`, `src/components/saleschannels/AddSectionDialog.vue`, `StorefrontPreview.vue` (canvas), `ThemeDaVinciPanel.vue`, `src/composables/useThemeGenerator.ts` (Da Vinci keyword → section kind) |
| Theme code view | `src/views/SalesChannels/StoreThemeCode.vue`, `src/stores/themeCodeData.ts`, `useThemeCode.ts` |
| Store editor | `src/views/SalesChannels/StoreEditorLayout.vue`, `src/components/saleschannels/storeEditorMenu.ts` (Overview, Themes, Navigation, Pages, Blogs, Campaigns, Assets, Payments, Chatbot) |
| Navigation and content | `src/stores/useStoreNavigation.ts` (menus are flat today), `src/stores/useStoreContent.ts` (pages, blogs, policies) |
| Live storefront | `src/views/Storefront/*` under `/accounts/:accountId/sales_channels/:channelId/storefront`. Routes: home, `page/:handle`, `policies/:handle`, `collections/:handle`, `products/:handle`, `cart-page`, `checkout`, 404. Stores: `useStorefront.ts` (chrome), `useStorefrontCart.ts`; payments: `src/maropay/storefront.ts`, `src/maropay/money.ts`. **Missing today:** variant picker, search, blog, account, cart drawer, discount code, shipping rates (shipping is hard-coded "Free"), more than one currency |
| Catalog and orders | `src/stores/useCommerce.ts` (`Product`, `ProductVariant`, `Promotion`, `Order`), `src/views/Products/*` (`ProductEditor.vue`, `ProductWizard.vue`, `Collections.vue`, `PriceLists.vue`, `TaxCategories.vue`, …), `src/views/Commerce/*` |
| Sales channels | `src/stores/useSalesChannels.ts` (seeds: `max-test-store`, `neelam-store`, `pos-store`) |
| Settings | `src/components/settings/settingsMenu.ts`, `src/views/Settings/pages/*` (`PrivacyConsentPage.vue` and `TrackingAnalyticsPage.vue` are placeholders) |
| Admin navigation | `src/components/layout/AppSidebar.vue` |
| Shared admin parts | `MpWizardShell`, `MpFormDrawer`, `MpDialog`, `MpDataTableToolbar`, `MpStatusChip`, `MpEmptyState`, `MpOptionCard`, `MpSegmentedControl`, `MpRichTextArea`, `MpListRow` (all in `src/components/`) |
| Stories | `src/stories/storyTemplate.ts`, `fixtures.ts`, `decorators.ts`. Store Builder stories live under `Product/Sales Channels/…` |
| Domain-module pattern | `src/maropay/` + `tests/maropay/` + `npm run test:maropay` |

## 6. The demo store, and the end state

S0 seeds a new sales channel **"BKM (demo)"**, id `bkm-demo`, with a theme called **"BKM"**.
Use this reference data; it was crawled from bkm.health on 2026-11-13.

**Catalog (SEK, prices include VAT).** Every variant has a SKU and a weight; none has a barcode.

| Product | Variants | Price (SEK) | Notes |
|---|---|---|---|
| BKM Electrolytes | Elderflower & Lime · Swedish Berries · Starter Pack (both flavours) | 279 · 279 · 499 | Starter Pack compare-at 558 |
| Tranquil | Can · Bag | 419 · 399 | Covered by the 30-day money-back guarantee |
| Ultra Focused | Original · Refill | 409 · 389 | |
| Glow+ | Original · Refill | 429 · 409 | |
| Life NAD+ | Original · Refill | 669 · 649 | |
| Harmonized | single variant | 419 | "Specially made for women" |
| Harmonized Refill | single variant | 419 | Separate product |
| Nasal Strips | single variant | 199 | Used as the discounted add-on |

**Collections:** All, Subscription (5 products), Sport, Longevity, Sleep, Hydrate.

**Subscription plans:**

| Plan | Delivery | Units per delivery | Discount | Other |
|---|---|---|---|---|
| Monthly Subscription | every 1 month | 1 | 20% | |
| 3-month supply | every 3 months | 3 | 30% | free shipping |
| One-time purchase | once | 1 | none | |

On Tranquil the 3-month plan ships 1 can + 2 refills. Tranquil also has a "Preorder" plan with no discount.

**Markets:**

| Market | URL prefix | Currency | Tranquil Can | Tranquil Bag |
|---|---|---|---|---|
| Sweden | none | SEK | 419 | 399 |
| United Kingdom | `/en-gb` | GBP | 33.99 | 33.99 |
| Poland | `/en-pl` | PLN | 159.00 | 159.00 |

Prices are fixed per market, not converted. PLN for Poland is inferred: the crawl saw 159.00 but not
the currency label. Delivery goes to 33 countries (EU, UK, NO, CH, IS, US, AE).

**Offers:**

- free shipping over 549 kr;
- dispatch the same day for orders before 10:00 CET on weekdays;
- delivery estimate of 3 to 7 working days, with "Duties and taxes may apply" outside the EU;
- the 30-day money-back guarantee applies to Tranquil only.

**Theme "BKM":** Figtree for headings and body, Inconsolata as an accent face; navy `#0a2240`
primary on white; black text; border `#d3d3d3`; 8px button radius, solid buttons; sale badge
`#6d52ff`; custom badge `#e4ff52`; sections fade in on scroll; product cards swap to a second image on hover.

**End state: the demo that must work after S16.** In about 10 minutes, without touching code:

1. In the Store Builder, a merchant composes the BKM home page from the Add Section dialog:
   - announcement bar;
   - transparent header;
   - video hero;
   - image with text;
   - tabbed collections;
   - logo marquee;
   - two overlapping-image story sections.
2. They open the `product.tranquil` template and arrange the full storytelling stack: buy box, USP
   marquee, benefit pillars, comparison, curated reviews, ingredient cards, dosing steps, athlete
   grid, FAQ, reviews, related products, sticky bar. The ingredient cards fill themselves from Tranquil's content fields.
3. A shopper on `/en-gb` adds Electrolytes as a 3-month supply, sees the free-shipping bar, accepts
   cookies, and checks out in GBP with a local payment method.
4. In the admin, the merchant sees the order tagged as a subscription and the new subscription
   contract, and runs a renewal.
5. The shopper signs in with an emailed code and skips the next delivery. The next charge date moves
   in both the portal and the admin.
6. The merchant moderates a review, and the stars update on the storefront.

## 7. Slices

Run them in order. S11 to S15 depend only on S0 to S6, so the human may reorder those.
"Acceptance" lists what you must demonstrate in the browser before you stop.

| Slice | Name | Requirement IDs |
|---|---|---|
| S0 | Tracker and demo store seed | P14, T18, T21 |
| S1 | Section engine and named templates | T11, T19, T27, T33 |
| S2 | Global chrome | T01, T02, T03, T05, T09 |
| S3 | Content sections | T22, T23, T24, T25, T26, T28, T29, T30, T31, T32, T46 |
| S4 | Product content fields and bindings | P13 |
| S5 | Product buy box and product card | T34, T35, T36, T37, T39, T40, T42, T43, T44, T54, P15 |
| S6 | Product storytelling sections | T45, T47, T48, T49, T50, T51, T52, T53 |
| S7 | Subscriptions I: plans, purchase options, checkout | P01, P04, T38 |
| S8 | Subscriptions II: contracts, renewals, portal, messages | P02, P03, P05, P18, T20 |
| S9 | Markets, VAT, payments, checkout | P06, P07, P08, P10, P11, P12, T06 |
| S10 | Shipping, delivery estimate, cart drawer | P09, P25, T04, T41 |
| S11 | Reviews | P17 (and the data behind T35, T52) |
| S12 | Consent, pixels, app embeds, custom code | P21, P22, T07, T12, T13, T15 |
| S13 | Search, blog, pages, landing pages, contact, SEO | P24, T10, T14, T16, T17 |
| S14 | Retention and service | P16, P19, P20, P23, P28, T08 |
| S15 | Import from Shopify | P27 |
| S16 | Assemble the BKM demo and walkthrough | all; P26 recorded as out of scope |

### S0. Tracker and demo store seed

- Create `docs/store-builder/bkm-build-tracker.md` with two tables:
  - **Slices:** slice, status (`pending` / `in progress` / `done`), branch, commit, date, notes.
  - **Requirements:** one row per requirement ID (all 82), with slice, prototype status (`not started` / `partial` / `done` / `out of scope`) and a note.
- Seed the `bkm-demo` sales channel with the catalog, collections, menus and theme from section 6:
  - pages: About, Contact, Ambassadors, Money-back guarantee terms, Cookies;
  - policies: refund, privacy, terms;
  - one blog with three short original articles.
- Product imagery: generated placeholder art (an SVG pack shot per product in the theme palette), at least two images per product so the card hover works later.
- Products assigned only to this channel appear only in its storefront. Other stores keep their catalogs.
- Add Figtree and Inconsolata to the theme font options. Add badge colours (sale, custom, sold out) to `ThemeStyles`.
- **Acceptance:**
  - the channel appears in Sales channels;
  - its storefront opens with the BKM fonts and colours and lists the 8 products;
  - the other stores look exactly as before.

### S1. Section engine and named templates

- Build the section registry and the single renderer (decision 2). Migrate all existing section kinds
  with **no visual change**: compare screenshots of Neelam-Store's home before and after, in both the canvas and the storefront.
- The storefront home, collection and product pages render from templates through the engine.
  The collection page becomes a `collection` template with a product-grid section (T19). The
  newsletter and testimonials sections, which the storefront skips today, now render (T33).
- Named templates (decision 3):
  - a template switcher in the builder with "Create template" (duplicates an existing one) and rename;
  - a "Theme template" select in the product editor and the page editor.
- Extend `TemplateType` to: home, product, collection, page, blog, article, search, cart, account.
- The Add Section dialog lists only the sections allowed in the current template type.
- **Acceptance:**
  - create `product.tranquil`, assign it to Tranquil, and add a section only there;
  - Tranquil shows the section and other products don't;
  - canvas and storefront render identically;
  - existing stores are unchanged.

### S2. Global chrome

- **Announcement bar:** one or more rotating messages, each with an optional link.
- **Header:** transparent over the first section, sticky with a shrink on scroll, a centred-logo layout, account and cart icons.
- **Navigation:** menus nest two levels. Indent and outdent in `StoreNavigationMenuEditor`. Desktop shows a dropdown; mobile shows a drawer. Store the hierarchy in `useStoreNavigation`.
- **Footer:** link columns from menus, a newsletter block, social links, payment icons.
- **Motion** (theme setting): scroll-reveal on or off, and a second image on card hover. Both are off under `prefers-reduced-motion`.
- **Acceptance:** the BKM header and the "Shop by Category" dropdown work on desktop and at 375px, keyboard included.

### S3. Content sections

Add each as a registry section with a settings schema, blocks, defaults, an Add Section thumbnail
and a story. Where a section fits a Da Vinci phrasing, add it to `useThemeGenerator.ts`.

- **Video hero:** autoplay muted loop, poster image, overlay, text position, height.
- **Image with text:** media left or right, text blocks, button.
- **Tabbed collections:** one tab per collection; each tab is a product carousel.
- **Marquee:** an auto-scrolling strip of text items or logos; this covers both the logo slider and the USP strip; pauses on hover; static under reduced motion.
- **Overlapping images:** two layered images, copy with bullets, button, optional parallax.
- **Divider and spacer** sections.
- **Icons row.**
- **FAQ accordion:** question and answer blocks.
- **Mosaic** and **quote grid:** photo, name, role, quote.
- **Social feed:** placeholder tiles that link out; no live API.
- **Acceptance:** recreate the BKM home section order through the builder UI only.

### S4. Product content fields and bindings

- **Products › Content fields:** define fields with key, label and type. Types:
  - text, rich text, list of text, image;
  - table (rows and columns);
  - FAQ list (question, answer);
  - ingredient list (name, amount, role);
  - steps (title, body);
  - comparison rows (feature, us, them).
- A "Content" card in the product editor to fill values.
- Seed values for Tranquil and Electrolytes: subtitle, chips (No added sugar, Vegan, Made in Sweden, Gut-friendly), ingredients, supplement facts, FAQs, comparison rows, steps.
- **Bindings (decision 4):**
  - a "Connect to product data" control in the inspector for compatible settings;
  - a preview-product picker in the builder for product templates;
  - on the storefront, a bound section with no value hides itself; in the builder it shows a hint instead.
- **Acceptance:** one ingredient-list section on `product.default` shows different ingredients for Tranquil and Electrolytes.

### S5. Product buy box and product card

- Turn `product-detail` into a buy-box section made of ordered, reorderable blocks:
  1. rating (stars and count; placeholder data until S11);
  2. subtitle (bound);
  3. title;
  4. price (compare-at, "From" when variants differ);
  5. badges and chips (bound);
  6. short description;
  7. variant picker (buttons, dropdown or swatches);
  8. purchase options (an empty slot, filled in S7);
  9. quantity;
  10. add to cart;
  11. express buttons;
  12. payment icons;
  13. guarantee callout;
  14. accordions (each bound to a content field);
  15. add-on offer.
- **Gallery:** thumbnails, zoom lightbox, a badge over the image, an optional video.
- **Variants on the storefront:** selecting a variant changes price, compare-at, SKU and availability, and the URL (`?variant=`). Cart lines carry the variant.
- **Add-on offer and promotion:** a new "Bought with" promotion condition in `CreatePromotion`. The add-on block offers Nasal Strips at the discounted price, and the cart shows the discount line.
- **Product card:** second image on hover, subtitle, "From" price, rating, badge.
- **Acceptance:**
  - Electrolytes switches between three flavour variants;
  - the Starter Pack shows 558 struck through and 499;
  - adding the Nasal Strips add-on puts both lines in the cart with the discount.

### S6. Product storytelling sections

- Benefit pillars.
- Comparison table (bound to comparison rows).
- Ingredient cards (bound).
- Steps / dosing ritual (bound).
- Persona stats.
- People grid (athletes: photo, name, sport, title).
- Curated reviews grid (static quotes for now; bound to real reviews in S11).
- Related products: source is same collection, manual pick, or a Merchandising recommendation engine.
- Sticky add-to-cart bar: appears once the buy box scrolls out of view, with title, USPs and the button.
- **Acceptance:** build `product.tranquil` and `product.electrolytes` in BKM's section order (see the report's "Section order by template"). They differ, and both work at desktop and 375px.

### S7. Subscriptions I: plans, purchase options, checkout

- Domain module `src/subscriptions/` with tests and `npm run test:subscriptions`. It covers:
  - plan groups (interval, units per delivery, percentage discount, free-shipping flag);
  - price per delivery for a variant;
  - first and next charge dates;
  - a rounding rule for display.
- **Admin:** Commerce › Subscriptions › Plans (list, plus create and edit in `MpFormDrawer`), and a "Purchase options" card in the product editor to attach plans to products and variants.
- **Storefront:**
  - the purchase-options block shows option cards with plan name, savings badge, price per delivery and a benefit list, and has a default-selection setting;
  - cart lines show the plan and the delivery interval;
  - checkout asks for subscription consent, mocks storing the payment method, and shows the recurring line in the summary.
- The resulting order is tagged `Subscription`. The plan's free shipping applies (P04).
- **Test cases** (must pass):

  | Electrolytes, 279 kr | Expected |
  |---|---|
  | Monthly | 223.20 per delivery |
  | 3-month supply | 3 × 195.30 = 585.90 per delivery |

  SEK is shown without decimals, so these display as 223 kr and 586 kr, as on bkm.health.
- **Acceptance:** buy a 3-month supply on the storefront; the admin order shows the subscription line and the plan.

### S8. Subscriptions II: contracts, renewals, portal, messages

- **Contracts:** a checkout from S7 creates a contract. Commerce › Subscriptions list:
  - filter tabs Active / Paused / Cancelled / Payment failed;
  - a new `subscription` type on `MpStatusChip`.
- **Contract detail page:**
  - shows customer, plan, items, next charge, payment method and history;
  - actions: skip next, change date, pause, resume, swap variant, cancel with a reason.
- **Renewals:**
  - a demo control, "Run renewals due today", creates renewal orders;
  - a failed payment follows a retry schedule (1, 3, 7 days), then lands in Payment failed.
- **Storefront account** (T20, P18):
  - passwordless sign-in: enter email, get a code (mocked; show the demo code in a dev hint), enter the code;
  - account pages for orders, order detail, addresses and subscriptions;
  - the shopper can skip, reschedule, swap flavour, cancel with a reason, and update the payment method (mock).
- **Messages (P05):** add journey triggers to the Marketing journey builder: subscription created, renewal upcoming, payment failed, cancelled. Seed one journey that uses them.
- **Acceptance:**
  - skipping in the portal moves the next charge date by one interval in both the portal and the admin;
  - cancelling shows Cancelled in both;
  - a renewal run creates an order.

### S9. Markets, VAT, payments, checkout

- Domain module `src/markets/` with tests. It covers:
  - market resolution from URL prefix or country;
  - price per market: a fixed price per variant, otherwise converted and rounded by a rounding rule;
  - VAT-inclusive display by destination country, with a rates table;
  - subscription prices per market.
- **Admin:** Settings › Store Setup › Markets: list, plus a detail page with countries, currency, prices (reuse Price Lists with a currency where it fits), URL prefix, language and tax display. The product editor shows per-market prices.
- **Storefront:**
  - an optional market prefix in storefront routes (`/en-gb`, `/en-pl`);
  - hreflang `link` tags;
  - a country and currency selector in the header or footer (T06);
  - every price, the cart and checkout in the market currency;
  - switching market re-prices the cart.
- **Payments:**
  - methods per market, including local ones: Klarna, iDEAL, Bancontact, BLIK, MobilePay, MB WAY, Bizum, Satispay;
  - extend `src/maropay/storefront.ts` through its existing structure and keep `npm run test:maropay` green;
  - Maropay's settlement currencies are a locked decision: ask before changing them.
- **Checkout (P12):** discount code field, terms checkbox, marketing opt-in, an "incl. VAT" line.
- **Acceptance:**
  - Tranquil Can shows 419 kr on `/`, £33.99 on `/en-gb` and 159.00 PLN on `/en-pl`;
  - the cart re-prices when the country changes;
  - a UK checkout offers the UK method set.

### S10. Shipping, delivery estimate, cart drawer

- Domain module `src/shipping/` with tests. It covers:
  - zones (country lists) and rates: flat, free over a threshold per market currency, free for a subscription plan;
  - dispatch cut-off (10:00 CET, weekdays) and a delivery-date estimate in working days.
- **Admin:** Settings › Store Setup › Shipping & delivery: zones, rates, thresholds, processing time and cut-off.
- **Storefront:**
  - **Delivery estimate block** in the buy box: a country picker, the estimate, and the duties note outside the EU.
  - **Cart drawer:**
    - a theme setting picks drawer or page;
    - the drawer opens on add to cart;
    - it shows lines with their plans, a free-shipping progress bar, the add-on upsell, a terms checkbox and express checkout.
  - **Checkout** picks a real shipping rate instead of the hard-coded "Free".
  - **Order status page** with a tracking link (P25).
- **Acceptance:**
  - a 399 kr cart shows "150 kr away from free shipping";
  - adding Nasal Strips (199 kr) reaches 598 kr and shows free shipping;
  - a 3-month plan line ships free regardless.

### S11. Reviews

- Domain helpers with tests: average, histogram, statuses (pending / published / hidden), verified buyer.
- **Admin:** Products › Reviews:
  - a list with rating, status and product filters;
  - moderation: publish, hide, reply;
  - CSV import (mock wizard);
  - a "request a review N days after fulfilment" setting that links to a Marketing journey.
- **Storefront:**
  - stars and count on product cards and in the buy box;
  - a reviews section with summary histogram, list, pagination, and a write-a-review form for verified buyers (mock);
  - the curated reviews grid (S6) binds to chosen published reviews;
  - product pages carry AggregateRating JSON-LD.
- **Seed:** sample reviews with clearly fictional names and original text, for example 36 on Tranquil averaging 4.6.
- **Acceptance:** hiding a 1-star review changes the average on the storefront.

### S12. Consent, pixels, app embeds, custom code

- **Settings › Privacy & Consent** (replace the placeholder):
  - banner on or off;
  - regional behaviour: opt-in for EU and UK, notice elsewhere;
  - categories: necessary, preferences, analytics, marketing;
  - copy, position, policy link.
  - Storefront: banner plus a preferences modal; consent state is kept per visitor.
- **Settings › Tracking & Analytics** (replace the placeholder):
  - pixels for Meta, TikTok, Google Analytics 4, Microsoft Clarity and a custom script, each with an ID and a consent category;
  - an event map: page_view, view_item, add_to_cart, begin_checkout, purchase;
  - a storefront debug drawer lists the events that would fire and those blocked by consent. **Never load real pixel scripts.**
- **Theme settings › App embeds** (T13): toggles for chat widget, consent banner, review stars and the pixel loader.
- **Custom code section** (T12, T15):
  - from the theme code view, a developer adds a section with HTML/CSS and a settings schema;
  - it appears in Add Section under "Custom";
  - it renders in a sandboxed iframe (`srcdoc`, `sandbox="allow-scripts"`) with its settings interpolated;
  - an "Embed" variant renders a full-page tool.
- **Acceptance:** with marketing cookies declined, add to cart logs the event as blocked for Meta and allowed for GA4 if analytics was accepted.

### S13. Search, blog, pages, landing pages, contact, SEO

- **Storefront routes and templates:**
  - `search`, with sort plus availability and price filters;
  - `blogs/:blog` (hero and a paginated grid);
  - `blogs/:blog/:article` (author, date, share links, recommended posts, related products).
- Page templates per page: `page.ambassadors`, `page.landing`.
- **Landing-page buy-box section:** a product picker plus purchase options. Add a sticky shop-now bar.
- **Contact form section:** fields and a topic dropdown. A submission creates a Service ticket, or a Marketing form entry if configured.
- **SEO:**
  - JSON-LD for Product, Organization, WebSite (with SearchAction), Article and BreadcrumbList;
  - canonical links;
  - a sitemap preview;
  - a store editor **Redirects** page (from path, to path, type).
- **Acceptance:** a contact-form submission appears as a Service ticket; old-style URLs redirect.

### S14. Retention and service

- **Back in stock (P19):** "Notify me" on sold-out variants feeds a Marketing journey trigger; the admin can see requests per variant.
- **Pre-orders (P28):** a variant setting "Pre-order" with a ship-date message; Tranquil's no-discount "Preorder" plan.
- **Storefront events into Marketing (P20):** viewed product, added to cart, started checkout and placed order feed a seeded abandoned-cart journey. The footer signup adds a contact to a list with its consent.
- **Chat and help (T08, P23):**
  - a storefront chat bubble backed by the store's Chatbot page;
  - Service tickets show the customer's orders and subscriptions (extend `TicketOrdersPanel`).
- **Returns and guarantee (P16):**
  - a "Start return / money-back refund" flow on the order;
  - eligibility rule: Tranquil only, within 30 days of delivery.

### S15. Import from Shopify

- A store editor "Import from Shopify" wizard on `MpWizardShell`. Mock CSV steps:
  - products;
  - customers with marketing consent;
  - subscriptions from a Recharge export, with an explanation of the payment-method transfer between processors;
  - reviews;
  - redirects auto-generated from Shopify paths, including the `/en-gb` and `/en-pl` prefixes.
- A dry run with a validation report (counts, errors, warnings) before the import.

### S16. Assemble the BKM demo and walkthrough

- Rebuild the BKM theme through the builder UI so the seed matches what a merchant would produce. Fix whatever the walk-through exposes.
- Write `docs/store-builder/bkm-demo-script.md`: the 10-minute walkthrough from section 6, with the exact clicks and URLs.
- Run every test script and `npm run type-check`, and do a full browser pass at desktop and 375px.
- Mark agentic-commerce endpoints (P26) and anything else not built as `out of scope` in the tracker, with a reason.

## 8. The loop for every slice

1. **Orient.**
   - `git status` must be clean; update `master`; create the slice branch.
   - Read section 2's files and the requirement rows for this slice.
   - Set the slice to `in progress` in the tracker.
2. **Explore.** Find the code you will extend and what you can reuse. Write a 5-to-10-line plan in the tracker's notes for the slice.
3. **Build** in this order:
   1. domain module and its tests;
   2. stores and seed;
   3. admin screens;
   4. builder: registry entries and inspector;
   5. storefront.
4. **Verify.**
   - `npm run type-check`, the slice's test script, and any existing test script whose module you touched.
   - Start the "Main App" preview server.
   - Walk the slice's acceptance steps in the browser; check the console for errors.
   - Check desktop and 375px.
   - For every new section, compare the builder canvas against the live storefront.
   - Check keyboard use and focus on new controls.
5. **Document.**
   - Stories for new reusable components and new storefront sections.
   - Update the tracker: slice status, branch, commit, and the per-requirement status for every ID in the slice.
   - CLAUDE.md inventory and the DESIGN_AUDIT.md changelog where the rules in section 3 require it.
6. **Commit** on the slice branch. Do not push.
7. **Stop and report** (section 9).

## 9. Report when you stop

- **Built:** what changed, grouped by requirement ID.
- **Verified:** the commands you ran with their results, and the acceptance steps you walked.
- **Not done or changed:** anything skipped, split or done differently, and why.
- **Decisions for the human:** questions that block or shape later slices.
- **Next:** the next pending slice.

Keep it short and factual. Name failures plainly. Don't claim anything you didn't check.
