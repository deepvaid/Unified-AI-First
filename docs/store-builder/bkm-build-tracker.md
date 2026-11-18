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

- ~~The pay button, payment sheets and receipt still format money the Maropay way ("Pay SEK 399.00"); checkout countries do not include Sweden.~~ Fixed in the demo pass, part 4: the checkout follows the store's currency. Markets and VAT are still S9.
- The product editor's variant grid shows "$" prices; the Products list shows the store's currency. S9.
- The sale and custom badge colours are theme settings but nothing draws those badges yet (S5). The sold-out tag uses its setting.
- The storefront still shows a search box (the reference site has none) and a single product image without a gallery (S2, S5).

**Demo pass (2026-11-17, asked for by the human; branch `feature/vitaheal-demo-pass`).** Not a
slice: the human asked for four things so sales people can show the store now, delivered in parts
with a review after each. Each part pulls small pieces forward from later slices; what is listed
here already exists when those slices start.

- **Part 1, the look with photos (done).** The human chose free stock photos over drawn or
  AI-made pictures.
  - 23 Unsplash photos in `public/storefront/vitaheal/` (2 MB), credited in its `CREDITS.md`;
    `VITAHEAL_PHOTOS` and each product's two pictures name them, and a test checks every file exists.
  - From S2: the announcement bar sits above the header on every page of a store that asks for it
    (`announcementAboveHeader` on the store's chrome); the logo is centred and the cart at the end
    for a store with no social links; a product card shows its second photo on hover and focus.
  - From S3: `image-banner` and `hero` draw a photo from an `image` setting, and `image-banner`
    has a subheadline; the `collection` block draws a photo; new section kind `image-with-text`
    (storefront, plus a placeholder in the builder canvas). There is no image picker in the
    builder yet: the `image` setting is seeded. S3 adds the picker, and S1 still has to move these
    into the section registry.
  - From S5: the product page has a gallery with thumbnails (no zoom yet).
  - Cart and checkout summary lines show the product photo.
  - Other stores: Neelam-Store's home and "All" collection measured identical before and after
    (position, size, colour and font size of every element).
- **Part 2, add a product and keep changes with a restore (done).**
  - **Kept in the browser.** The demo store's products are saved in this browser's `localStorage`
    (key `mp.vitaheal-demo.products.v1`, `src/storefront/demoStorage.ts`), so an added or edited
    product is still there after a reload and in the storefront tab that "View store" opens. Other
    open tabs follow a change at once. Only a real change is saved: a store nobody has touched
    keeps following the seed. If the browser runs out of room, a warning says changes will not be
    kept. No other store's data is kept.
  - **Restore.** The store's Settings tab has a "Store data" card with "Restore original store":
    it removes added products, undoes edits and empties the cart. Orders already placed stay.
    Part 3 adds the subscription plans to what is kept and restored.
  - **A product goes to a store.** On the product forms, Sales channels also offers each store
    that has products of its own (today: Vitaheal). Picking one assigns the product to it
    (`channelIds`), shows prices in the store's currency ("kr"), and offers that store's
    collections. "Add product" on the store's overview opens the form with the store picked.
    From the Products page the default stays "Online Store" (the shared catalogue).
  - **Pictures.** `ProductMediaField` replaces the two upload mock-ups: up to four PNG, JPG or
    WEBP pictures, shrunk in the browser to 720px. Nothing is uploaded. A store product saved
    without a picture gets a drawn pack shot in the store's colours (`packShot.ts`).
  - **Collections.** The single "Collection" field is now "Collections" (several), so a product
    can be in "Sleep" and "Subscription", and an edit no longer drops the others.
  - **After saving.** The message says where shoppers find the product, with "View in store"; the
    Products list's row menu and the product editor's header have the same link.
  - **Product form bugs fixed for every store:** an edit no longer zeroes the stock (the form used
    different location names from the rest of the admin); a variant keeps its compare-at price
    and weight; the product's price is its lowest variant's; the last step warns when there is no
    price or no stock. On the storefront, a product with no brand shows no brand line and no
    made-up description, and a variant sold without stock tracking or on backorder counts as
    in stock.
  - **Known limits.** If every product of the demo store is deleted, the store has none of its
    own and falls back to the shared catalogue until it is restored. A new product without a
    category has no "You may also like" row. The wizard's footer is cramped at phone width
    (as before this pass). The ProductMediaField story was type-checked, not opened in Storybook.
- **Part 3, subscription plans (done).** This is the plans half of S7, pulled forward. Contracts,
  renewals, skip and cancel, and the subscriber's own page stay with S8.
  - **Rules** in `src/subscriptions/plans.ts`, tested by `npm run test:subscriptions` (17 tests,
    including the build prompt's cases: Electrolytes at 279 kr is 223,20 kr monthly and
    3 × 195,30 = 585,90 kr as a 3-month supply, shown as "223 kr" and "586 kr").
  - **Seed:** "3-month supply" (3 units every 3 months, 30% off, free shipping, preselected) and
    "Monthly subscription" (20% off), on the five products of the Subscription collection.
  - **Admin:** Commerce › Subscriptions › Plans (`/commerce/:accountId/subscriptions/plans`):
    list, create and edit in a drawer with a live example price, pause, delete. The product editor
    has a read-only "Purchase options" card with a link to the plans. Plans are attached to
    products in the plan's drawer, not per variant.
  - **Storefront:** the product page offers each plan and "One-time purchase" as cards with
    "Save 30%" and "Free shipping" badges in the theme's badge colours, the price per delivery and
    the benefits. Cart lines carry their plan; the same product bought once and on a plan are two
    lines. Checkout shows the plan, a "Then every 3 months" row, and a consent box the shopper
    must tick. Express pay buttons are hidden for a subscription, because they skip that box.
    The confirmation says when the next charge is.
  - **Order:** tagged `Subscription`; the line names the plan and the timeline records that the
    payment method was saved and when the next charge is due.
  - **Kept and restored** with the store's products (`mp.vitaheal-demo.plans.v1`).
  - **Display rule:** a store in kronor shows whole kronor everywhere on its storefront
    ("586 kr"). The order and the payment keep the exact amount (585,90).
  - **Known limits.** Shipping is free on every order until rates exist (S10), so a plan's free
    shipping is a badge only. There is no variant picker yet (S5), so plan prices are based on the
    lowest-priced variant. Nothing renews: the next charge is a date in the order's timeline.
    "Skip or cancel anytime" is a seeded benefit line; the place to do it comes with S8. A total
    of rounded lines can differ from the rounded total by one krona.
- **Part 4, the shopper journey end to end (done, 2026-11-18).** Small pieces of S9 (the
  checkout's countries and money format), pulled forward. Markets, VAT and per-market prices stay
  with S9.
  - **The walk** (account 2000290, "Main App" preview; desktop 1280px, then phone 375px; no page
    scrolled sideways, the console was clean on the last pass, and no shopper page showed "prototype", "Maropost",
    "Maropay", "SEK" or a dollar price):
    1. Admin `/accounts/2000290/sales_channels/vitaheal-demo`: revenue "1.9M kr", the company is
       Vitaheal AB in Stockholm, 4 of 5 setup items done. "View store" opens the storefront in a
       new tab.
    2. Home `…/storefront`: the tab reads "Vitaheal". "Shop all products" opens the "All" collection.
    3. Collection `…/collections/all`: eight products with photos. On the phone the menu button
       opens the same links, and "Sleep" opens `…/collections/sleep`.
    4. Product `…/products/vitaheal-electrolytes-2005`: "3-month supply" is preselected; "Add
       subscription to cart" answers "Added to your cart" with a "View cart (1)" link.
    5. Cart `…/cart-page`: the plan under the line, "586 kr", "Then every 3 months".
    6. Checkout `…/checkout`: Linnea Berg, Storgatan 12, Stockholm, Sweden first of 15 countries,
       no State field. Total, repeat charge, consent text and pay button all read "585,90 kr".
       Paying without the consent box is stopped with a message and focus on the box.
    7. Bank check (sample card ending 3155): "This is a demo store, so any 6 digits work."
    8. Confirmation: "585,90 kr", order number, "18 Nov 2026", the next charge date, and
       "What the merchant sees: the order in Commerce". The page stays until the presenter leaves it.
    9. Admin order `/commerce/2000290/orders/900003`: channel "Vitaheal (demo)", the Stockholm
       address, the product photo on the line, "SEK 585.90", the Subscription tag and the timeline.
       The orders list shows "SEK 585.90" too.
    10. Phone, one-time purchase: Unwind at "399 kr" → Apple Pay from the cart → "Deliver to
        Storgatan 12, Stockholm" → confirmation "399 kr" → order #20004.
    11. Click & collect: the address fields go, and the order's address reads "Collect in store".
  - **Checkout follows the store** (`src/storefront/checkoutProfile.ts`, 4 tests): a store that
    sells in kronor delivers to Sweden, the Nordics and ten EU countries, has no State field, and
    is filled in with a Swedish sample shopper. Other stores keep the checkout they had.
  - **What is charged is never rounded.** Product pages and the cart show whole kronor
    ("586 kr"). The checkout, pay button, payment sheets and confirmation show the exact amount
    the store's way ("585,90 kr"), so the shopper agrees to the amount that is taken. This
    replaces part 3's "whole kronor everywhere on the storefront".
  - **A store flag, `webStore.demo`,** set on Vitaheal only. With it: "Sample cards" instead of
    "Test cards for this prototype"; the bank and provider sheets say "demo store"; the
    confirmation says "What the merchant sees" and links to Maropay only for a payment Maropay
    took; the confirmation does not count down and leave; the browser tab reads "Vitaheal"; and
    the store's Settings tab has no "Edit" or "Upload" button that only answers "not built yet".
  - **The order matches the checkout.** An order from a store with its own checkout profile
    keeps the address the shopper typed (a pickup shows "Collect in store"). An order from a
    store with products of its own names that store as its sales channel.
  - **Admin money.** The order page's subtotal and shipping, and every amount on the orders list,
    are in the order's currency (they had a fixed "$"). A currency shown as its code keeps its
    space ("SEK 585.90", was "SEK585.90") on Commerce and Maropay pages.
  - **Store page.** Vitaheal's own company details, revenue in kronor and recent activity
    (`VITAHEAL_ADMIN` in the seed). Its "Legal pages" setup item is done and opens Pages.
  - **The admin's drawing of the store shows the store** (added after review, 2026-11-18: the
    human looked at the grey drawing and saw none of the changes). `StorefrontPreview` on the
    store's overview, its Preview dialog, the Themes page and the theme builder's canvas now
    draws the photo named in a banner's, hero's, image-with-text section's or collection
    block's `image` setting, the banner's subheadline, and the store's own products (photo,
    name, price) in a featured-products section. A store on the shared catalogue keeps the
    drawn stand-ins: Neelam-Store's drawing is unchanged. This supersedes "the theme builder's
    own preview stays as it is" from the plan.
  - **Other stores, checked:** Neelam-Store's checkout still offers the five original countries,
    Ava Brown in San Francisco, "Pay $119.33", "Total USD $119.33", its prototype notes and the
    countdown; its order still reads "Online Store" with a made-up US address.
  - **Known limits.** The cart says "586 kr" and the checkout "585,90 kr" for the same line.
    "Click & collect" is offered though the store has no shop. Shipping is free on every order,
    so "Free shipping over 549 kr" is not enforced (S10). The order is "Fulfilled from" a US
    location, because locations belong to the account. The Maropay pages still show the
    account's own name ("Atlas Outfitters LLC") and a "Demo controls" panel; the order page's
    "View in Maropay" leads there. The walk's test orders (#20001 to #20006, one of them Neelam-Store's) stay in this browser's Maropay data.

**Sales-demo pass (added 2026-11-16, after the audience was confirmed as sales people showing prospects):**

- The header's search, account and wishlist are hidden on Vitaheal (demo) until their pages exist (`headerTools` on the store's chrome). S13 turns search on, S8 the account.
- The footer signup now confirms ("Thank you. You are on the list.").
- The store's description in Sales channels no longer uses internal wording.
- Still visible to a prospect, and owned by later slices: the eight preset swatches in the Styles tab, none of which is BKM's navy (see decisions).

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
| T01 | Announcement bar | S2 | partial | Single-message bar, above the header on every page of the Vitaheal store (demo pass). Open: rotating messages, link, dismiss |
| T02 | Header over hero | S2 | not started | |
| T03 | Dropdown navigation | S2 | not started | Menus seeded flat |
| T04 | Cart drawer | S10 | not started | |
| T05 | Footer | S2 | not started | Three link columns and a newsletter block seeded in the existing footer |
| T06 | Country and currency selector | S9 | not started | |
| T07 | Cookie consent banner | S12 | not started | Cookies page seeded |
| T08 | Chat bubble and help centre | S14 | not started | |
| T09 | Motion | S2 | partial | Second photo on card hover and focus, off for reduced motion (demo pass). Open: scroll reveal, the motion setting |
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
| T22 | Video hero | S3 | partial | A photo hero with headline, subheadline and button (demo pass). Open: video, poster, overlay setting |
| T23 | Image with text | S3 | partial | Section drawn on the storefront with a seeded photo, placeholder in the builder (demo pass). Open: image picker, registry (S1) |
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
| T34 | Media gallery | S5 | partial | Large photo with a thumbnail strip, two photos per product (demo pass). Open: zoom lightbox, badge over the image, video |
| T35 | Rating stars | S5 | not started | |
| T36 | Subtitle, badges, chips | S5 | partial | Subtitle shows on the card and the product page (S0) |
| T37 | Button variant picker | S5 | not started | Variants seeded; the page sells the lowest-priced one |
| T38 | Purchase options | S7 | partial | Plan and one-time cards with savings and free-shipping badges, price per delivery, benefits, a preselected plan (demo pass, part 3). Open: per-variant prices (S5) |
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
| T54 | Product card | S5 | partial | Photo, second photo on hover, subtitle and "From" price. Open: rating, badge |
| P01 | Subscription plans | S7 | partial | Plans with interval, units per delivery and discount, edited in Commerce › Subscriptions › Plans; bought through checkout with consent; order tagged (demo pass, part 3). Open: per-variant attachment, contracts (S8) |
| P02 | Recurring billing | S8 | not started | |
| P03 | Subscriber portal | S8 | not started | |
| P04 | Subscription pricing rules | S7 | partial | Percentage discount per plan and a free-shipping flag shown as a badge (demo pass, part 3). Open: the flag changing a shipping charge (needs rates, S10) |
| P05 | Subscription messages | S8 | not started | |
| P06 | Market currencies and prices | S9 | not started | Groundwork in S0: one currency and locale per store |
| P07 | Market URLs | S9 | not started | |
| P08 | Languages | S9 | not started | |
| P09 | Shipping zones and rates | S10 | not started | |
| P10 | VAT per country | S9 | not started | |
| P11 | Payment methods | S9 | not started | |
| P12 | Checkout | S9 | not started | Groundwork in the demo pass, part 4: countries, sample shopper and money format follow the store's currency (`checkoutProfile.ts`) |
| P13 | Structured product content | S4 | not started | |
| P14 | Catalog basics | S0 | done | A product can be added to the store from the admin, with pictures, and is kept across reloads (demo pass, part 2). Eight products, 14 variants with SKU, weight and one compare-at price, five collections, all in the admin and on the Vitaheal storefront only |
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
