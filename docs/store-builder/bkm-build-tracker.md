# BKM build tracker

<!-- STATE FILE for docs/store-builder/bkm-build-prompt.md. The only memory between slice sessions. -->
<!-- Update it at the start (slice → in progress) and at the end of every slice. Keep the table formats intact. -->
<!-- Slice status: pending | in progress | done. Requirement status: not started | partial | done | out of scope. -->
<!-- Statuses here describe THIS PROTOTYPE. The requirements report describes the real MCC and is never edited. -->

Requirement IDs and titles come from [bkm-health-requirements.md](bkm-health-requirements.md).
The slices and their rules are in [bkm-build-prompt.md](bkm-build-prompt.md).

## Slices

| Slice | Name | Status | Branch | Commit | Date | Notes |
|---|---|---|---|---|---|---|
| S0 | Tracker and demo store seed | done | `feature/bkm-s0-demo-seed` | `9257609f` | 2026-11-16 | See "S0 notes" below |
| S1 | Section engine and named templates | pending | | | | |
| S2 | Global chrome | pending | | | | |
| S3 | Content sections | pending | | | | |
| S4 | Product content fields and bindings | pending | | | | |
| S5 | Product buy box and product card | pending | | | | |
| S6 | Product storytelling sections | pending | | | | |
| S7 | Subscriptions I: plans, purchase options, checkout | pending | | | | |
| S8 | Subscriptions II: contracts, renewals, portal, messages | pending | | | | |
| S9 | Markets, VAT, payments, checkout | pending | | | | |
| S10 | Shipping, delivery estimate, cart drawer | pending | | | | |
| S11 | Reviews | pending | | | | |
| S12 | Consent, pixels, app embeds, custom code | pending | | | | |
| S13 | Search, blog, pages, landing pages, contact, SEO | pending | | | | |
| S14 | Retention and service | pending | | | | |
| S15 | Import from Shopify | pending | | | | |
| S16 | Assemble the BKM demo and walkthrough | pending | | | | |

### S0 notes

**Plan (as built).**

1. One typed seed module, `src/storefront/vitahealDemo.ts`, holds everything for the `vitaheal-demo` channel; each Pinia store spreads its part into its own seed. No new store.
2. Pure rules under `src/storefront/` with tests (`npm run test:storefront`): which products a store sells (`catalog.ts`), how a store formats a price (`price.ts`), the generated pack shots (`packShot.ts`). The test also checks the seed against the reference tables in the prompt and that every seeded link leads somewhere.
3. Products can be assigned to stores (`Product.channelIds`). A store with assigned products sells only those; the others keep the shared catalogue exactly as before.
4. A web store can have its own currency and locale (`webStore.currency`, `webStore.locale`). Vitaheal (demo) is SEK / `sv-SE`, so prices read "399 kr".
5. `ThemeStyles` gains the three badge colours; Figtree and Inconsolata join the theme fonts and load through the existing Google Fonts import.
6. The storefront card and product page show a product's picture, subtitle and a "From" price when it has them. Products without them look as they did.
7. The "Vitaheal" theme is seeded from the section kinds that exist today.

**Where the prompt and the code disagreed** (the code won, as the prompt says):

- **No store persists anything.** Every store re-seeds on page load, so there was no storage key to bump. Only the storefront cart (`sessionStorage`, already per store) and Maropay state persist.
- **Section 6 lists no menu items.** The header and footer links were read from the live site's structure on 2026-11-16 and mapped onto the collections in section 6. The live "Shop by Category" dropdown has seven links (Sleep & Recovery, Performance, Woman, Repair, Longevity, Accessories, Hydrate); the seed uses the prompt's five collections. Worth reconciling before S2.
- **The storefront header and footer do not read the Navigation menus.** They come from `CHROME_BY_CHANNEL` in `useStorefront.ts`. The seeded menus (store editor › Navigation) mirror that chrome; S2 should make the storefront read the menus and delete the duplicate.
- **There is no blog container or storefront blog route.** A "blog with three articles" is three `kind: 'blog'` entries plus the blog SEO settings. They show in the store editor; the storefront gets them in S13.
- **There is no admin Policies page.** Policies are served at `/policies/:handle` and linked from the footer, but a merchant cannot edit them yet.
- **The build prompt is not on `master`.** It lives on `docs/bkm-build-prompt`; this slice branched from there.

**Done ahead of its slice** (small, and needed for a believable store now):

- Product card subtitle and "From" price (S5 owns the rest of the card: hover image, rating, badges).
- One currency and price format per store (S9 owns markets, per-market prices and the checkout).
- Links written inside a page or policy body stay inside the storefront.

**Left for later slices, on purpose:**

- The pay button, payment sheets and receipt still format money the Maropay way ("Pay SEK 399.00"); checkout countries do not include Sweden. Both are S9.
- The product editor's variant grid shows "$" prices; the Products list shows the store's currency. S9.
- The sale and custom badge colours are theme settings but nothing draws those badges yet (S5). The sold-out tag uses its setting.
- The storefront still shows a search box (the reference site has none) and a single product image without a gallery (S2, S5).

**Sales-demo pass (added 2026-11-16, after the audience was confirmed as sales people showing prospects):**

- The header's search, account and wishlist are hidden on Vitaheal (demo) until their pages exist (`headerTools` on the store's chrome). S13 turns search on, S8 the account.
- The footer signup now confirms ("Thank you. You are on the list.").
- The store's description in Sales channels no longer uses internal wording.
- Still visible to a prospect, and owned by later slices: the checkout's "Test cards for this prototype" helper and "Pay SEK 399.00" button, and no Sweden in the checkout's country list (S9); the product editor's "$" variant prices (S9); the eight preset swatches in the Styles tab, none of which is BKM's navy (see decisions).

**Fictional brand (2026-11-17, decided by the human: "Use a fictional brand").**

- The store is now **Vitaheal (demo)**, channel `vitaheal-demo`, theme "Vitaheal", seeded from
  `src/storefront/vitahealDemo.ts`. BKM's name, product names and flavour names no longer appear on
  screen, in a URL, in a SKU or in the seed. The mapping from BKM's names to the demo names is in
  section 6 of the build prompt.
- Kept, because the requirements test them: the shape of the catalogue, the SEK prices, the five
  collections, and the theme's fonts and colours.
- `npm run test:storefront` fails if a real name comes back into the seed.
- **Branches.** The rename is on `feature/bkm-s0-vitaheal-brand`, on top of S0.
  `feature/bkm-s0-demo-seed` keeps the BKM-named store. **Decided by the human (2026-11-17): later
  slices build on the Vitaheal store.** Until that branch is on `master`, S1 branches from
  `feature/bkm-s0-vitaheal-brand`, not from `master` as the build prompt says.
- The name "Vitaheal" was chosen by the human (2026-11-17; the first pick, "Tallvik", was replaced).
  A web search found real supplement sellers with this name or one close to it: "VitaHeal"
  (vitaheals.com) and "VitaHealth" (Vita Life Sciences, sold across Southeast Asia). So the name is
  not clearly fictional. **Decided by the human (2026-11-17): keep Vitaheal**, knowing this. No
  trademark check has been done.

**Decisions for the human:**

- **Custom colours.** The Styles tab only offers eight preset swatches, so a merchant cannot pick BKM's navy or badge colours by hand; the seed sets them. A hex field is needed before S16 can "rebuild the theme through the builder UI". Which slice should own it?
- **Border colour and accent font.** BKM's `#d3d3d3` border and Inconsolata accent face are not in `ThemeStyles`. S2 (chrome) is the natural place to add them.
- **Collections.** Keep the prompt's five, or switch to the live site's seven categories?

## Requirements

| ID | Requirement | Slice | Prototype status | Note |
|---|---|---|---|---|
| T01 | Announcement bar | S2 | not started | Existing single-message bar is used by the Vitaheal theme |
| T02 | Header over hero | S2 | not started | |
| T03 | Dropdown navigation | S2 | not started | Menus seeded flat |
| T04 | Cart drawer | S10 | not started | |
| T05 | Footer | S2 | not started | Three link columns and a newsletter block seeded in the existing footer |
| T06 | Country and currency selector | S9 | not started | |
| T07 | Cookie consent banner | S12 | not started | Cookies page seeded |
| T08 | Chat bubble and help centre | S14 | not started | |
| T09 | Motion | S2 | not started | |
| T10 | Search | S13 | not started | |
| T11 | Template per product | S1 | not started | |
| T12 | Custom sections in code | S12 | not started | |
| T13 | Script and embed surface | S12 | not started | |
| T14 | Landing pages with commerce | S13 | not started | |
| T15 | Embedded tool pages | S12 | not started | |
| T16 | Blog | S13 | not started | Three posts seeded; no storefront route yet |
| T17 | Contact page | S13 | not started | Contact page seeded as plain content |
| T18 | Policy pages | S0 | partial | Refund, privacy and terms served at `/policies/:handle` and linked in the footer. No admin page to edit them, and no `policy` template (S1) |
| T19 | Collection page | S1 | not started | |
| T20 | Account pages | S8 | not started | |
| T21 | Theme settings | S0 | partial | Figtree and Inconsolata, navy scheme, 8px buttons and the three badge colours are theme settings, with a Badges group in the Styles tab. Open: custom hex colours, border colour, accent font |
| T22 | Video hero | S3 | not started | |
| T23 | Image with text | S3 | not started | |
| T24 | Tabbed collections | S3 | not started | |
| T25 | Logo slider | S3 | not started | |
| T26 | Overlapping images story | S3 | not started | |
| T27 | Page hero banner | S1 | not started | |
| T28 | Text and divider | S3 | not started | |
| T29 | Icons row | S3 | not started | |
| T30 | FAQ accordion | S3 | not started | |
| T31 | Mosaic and quote grid | S3 | not started | |
| T32 | Instagram feed | S3 | not started | |
| T33 | Newsletter signup | S1 | not started | Section seeded on the Vitaheal home; the storefront does not draw it yet |
| T34 | Media gallery | S5 | not started | One generated image shows; two are seeded per product |
| T35 | Rating stars | S5 | not started | |
| T36 | Subtitle, badges, chips | S5 | partial | Subtitle shows on the card and the product page (S0) |
| T37 | Button variant picker | S5 | not started | Variants seeded; the page sells the lowest-priced one |
| T38 | Purchase options | S7 | not started | |
| T39 | Add to cart and express pay | S5 | not started | Existing add to cart and express buttons work for the demo store |
| T40 | Payment icons | S5 | not started | |
| T41 | Delivery estimator | S10 | not started | |
| T42 | Guarantee callout | S5 | not started | |
| T43 | Buy-box accordions | S5 | not started | |
| T44 | Add-on offer | S5 | not started | |
| T45 | Sticky add-to-cart bar | S6 | not started | |
| T46 | USP marquee | S3 | not started | |
| T47 | Benefit pillars | S6 | not started | |
| T48 | Comparison table | S6 | not started | |
| T49 | Ingredient cards | S6 | not started | |
| T50 | Steps and persona stats | S6 | not started | |
| T51 | Athlete grid | S6 | not started | |
| T52 | Curated reviews grid | S6 | not started | |
| T53 | Related products | S6 | not started | |
| T54 | Product card | S5 | partial | Picture, subtitle and "From" price (S0). Open: hover image, rating, badge |
| P01 | Subscription plans | S7 | not started | |
| P02 | Recurring billing | S8 | not started | |
| P03 | Subscriber portal | S8 | not started | |
| P04 | Subscription pricing rules | S7 | not started | |
| P05 | Subscription messages | S8 | not started | |
| P06 | Market currencies and prices | S9 | not started | Groundwork in S0: one currency and locale per store |
| P07 | Market URLs | S9 | not started | |
| P08 | Languages | S9 | not started | |
| P09 | Shipping zones and rates | S10 | not started | |
| P10 | VAT per country | S9 | not started | |
| P11 | Payment methods | S9 | not started | |
| P12 | Checkout | S9 | not started | |
| P13 | Structured product content | S4 | not started | |
| P14 | Catalog basics | S0 | done | Eight products, 14 variants with SKU, weight and one compare-at price, five collections, all in the admin and on the Vitaheal storefront only |
| P15 | Add-on discount | S5 | not started | |
| P16 | Returns and guarantee | S14 | not started | Guarantee terms page seeded |
| P17 | Reviews | S11 | not started | |
| P18 | Customer accounts | S8 | not started | |
| P19 | Back-in-stock alerts | S14 | not started | |
| P20 | Email, SMS and signup forms | S14 | not started | |
| P21 | Pixels and attribution | S12 | not started | |
| P22 | Consent management | S12 | not started | |
| P23 | Helpdesk | S14 | not started | |
| P24 | SEO and structured data | S13 | not started | SEO title and description seeded on products, pages and posts |
| P25 | Order tracking and dispatch | S10 | not started | |
| P26 | Agentic commerce endpoints | S16 | not started | To be recorded as out of scope in S16 |
| P27 | Migration | S15 | not started | |
| P28 | Pre-orders | S14 | not started | |
