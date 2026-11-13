# BKM Health on Commerce Cloud: requirements and gaps

> Crawled 2026-11-13 · Reference store: https://bkm.health/ · Baseline: the UAT capture in this repo (Sept to Oct 2026)
>
> **How to read this.** Everything said about BKM was observed on the live site unless marked *(inferred)*.
> Everything said about Commerce Cloud comes from this repo's capture of UAT, which holds real file and
> section *names* but stand-in contents. So `Missing` means "not found in the capture", not "confirmed
> absent". Section 8 lists what engineering should confirm. Sizes are rough, from the outside.

## 1. Summary

BKM is a Swedish supplements brand selling 8 products, mostly on subscription, to 33 countries from a
Shopify store. The storefront is the Palo Alto theme with about 20 custom-coded sections on top, and
it leans on 11 third-party apps.

This report lists **82 requirements** (54 theme, 28 platform). Against the capture:

| Status | Theme | Platform | Total |
|---|---|---|---|
| Have | 11 | 3 | 14 |
| Partial | 22 | 12 | 34 |
| WIP | 1 | 0 | 1 |
| Missing | 17 | 12 | 29 |
| Unverified | 3 | 1 | 4 |

**What blocks a launch**

1. **Subscriptions.** Plans, prepaid supplies, recurring billing and a self-service portal. Nothing exists. This is the largest item and BKM's core revenue model (P01 to P05, T38).
2. **Selling across markets.** Per-market currency and prices, market URLs, shipping zones and rates, VAT, and European payment methods (P06, P07, P09 to P11, T06).
3. **Structured product content.** Subtitle, chips, ingredients, supplement facts and FAQs have nowhere to live on a product (P13). Several product-page sections depend on it.
4. **A template per product, and custom sections in code.** Each BKM product page is its own composition; Commerce Cloud has one template per type (T11). Whether a developer can add a coded section to the builder is unconfirmed (T12) and decides how much of the section list below must be built natively.
5. **A handful of universal sections.** Video hero, tabbed collections, accordion, comparison table, announcement bar (T22, T24, T30, T43, T48, T01).
6. **Reviews.** Only a rating snippet exists; BKM shows stars on every card and a review list on each product (P17, T35).
7. **Consent, pixels and a place to load scripts.** Required to trade in the EU and to keep BKM's ad attribution (T07, T13, P21, P22).
8. **Migration.** Live subscriptions with their payment methods are the risky part (P27).

**What is already covered.** Catalog basics, collections, promotions, customer accounts, blog, search, policy
pages and most plain content sections exist. Email and SMS, popups, chat and helpdesk can come from
Marketing Cloud and Service Cloud instead of Klaviyo and Gorgias.

## 2. Store profile

| | |
|---|---|
| Platform | Shopify. Theme "Palo Alto" 5.6.0 by Presidio Creative, with custom sections prefixed `shopdev_` and `bkm-` |
| Catalog | 8 products, 12 collections (4 empty), 10 content pages, 5 blogs, 6 articles |
| Markets | Sweden (default, SEK) · `/en-gb` (GBP) · `/en-pl` · English only · ships to 33 countries |
| Revenue model | One-time purchase or subscription on the same product page |
| Offers | Free shipping over 549 kr · 30-day money-back guarantee on Tranquil · same-day dispatch before 10:00 CET |

### Catalog

| Product | Variants | Option | Price (SEK) | Notes |
|---|---|---|---|---|
| BKM Electrolytes | 3 | Flavour: Elderflower & Lime, Swedish Berries, Starter Pack | 279 to 499 | Starter Pack has a compare-at price of 558 |
| Tranquil | 2 | Can / Bag | 399 to 419 | Flagship; covered by the money-back guarantee |
| Ultra Focused | 2 | Original / Refill | 389 to 409 | |
| Glow+ | 2 | Original / Refill | 409 to 429 | |
| Life NAD+ | 2 | Original / Refill | 649 to 669 | |
| Harmonized | 1 | none | 419 | Tagged "Specially made for women" |
| Harmonized Refill | 1 | none | 419 | Separate product, not a variant |
| Nasal Strips | 1 | none | 199 | Accessory; used as the discounted add-on |

Every variant has a SKU and a weight; none has a barcode. Product type is empty on all eight.
Collections: All, Home page, Subscription (5), Sport (4), Longevity (3), Sleep (2), Hydrate (1), "25% tax" (1),
and four empty ones (Energy, Repair, Woman, a duplicate Longevity).

### Subscription plans (from the product data)

| Plan | Ships | Quantity | Discount | Electrolytes price |
|---|---|---|---|---|
| 3-month supply | Every 3 months | 3 units per shipment | 30% | 586 kr per shipment, free shipping |
| Monthly Subscription | Every month | 1 unit | 20% | 223 kr |
| One-time purchase | once | 1 | none | 279 kr |

On Tranquil the 3-month plan ships one can and two refills. Tranquil also carries a Preorder plan with no
discount, which probably comes from the back-in-stock app *(inferred)*.

The shopper-facing promises are "Skip or cancel anytime" and the 30-day money-back guarantee. The
"Manage my subscription" link and the account icon both lead to Recharge's portal, which signs the
customer in with a code sent by SMS and email. The theme's own password login page still exists but
a script redirects it to the portal.

### Markets

| Market | URL | Currency | Tranquil, one-time |
|---|---|---|---|
| Sweden | `/` | SEK | 419 (Can), 399 (Bag) |
| United Kingdom | `/en-gb` | GBP | £33.99 |
| Poland | `/en-pl` | PLN *(inferred)* | 159.00 |

Prices are set per market, not converted. The product page offers delivery to 33 countries: the EU,
the UK, Norway, Switzerland, Iceland, the United States and the United Arab Emirates, with
the note "Duties and taxes may apply on delivery".

### Apps the store depends on

| App | What it does for BKM | Commerce Cloud route |
|---|---|---|
| Recharge | Subscription plans, recurring billing, customer portal and login | Build in platform |
| Klaviyo | Email and SMS, onsite signup forms | Marketing Cloud |
| Klaviyo Reviews | Review requests, star ratings, review list | Build, or keep a third party at launch |
| Gorgias | Live chat, help centre, proactive chat campaigns, tickets | Service Cloud and Chatbot |
| Instant | Visual page builder, used for two landing pages | Store Builder |
| Restock Rocket (STOQ) | Back-in-stock alerts, and probably the Preorder plan on Tranquil *(inferred)* | Marketing Cloud journey on stock change; pre-orders in platform |
| Transcy | Currency and language switcher | Build in theme, on top of markets |
| Cookiebot | Cookie consent | Third party through a script surface |
| Triple Whale | Ad attribution pixel | Third party through a pixel surface |
| Meta pixel, TikTok pixel *(inferred)* | Ad tracking | Pixel surface |
| Microsoft Clarity | Session recording and heatmaps | Pixel surface |

Shop Pay and the Shop app are Shopify-only and have no equivalent to build.

## 3. Theme requirements

### Design tokens

| Token | Value |
|---|---|
| Typeface | Figtree for headings and body (weights 300 to 900); Inconsolata as an accent |
| Type scale | Body 16px on 25px; section headings 48px, weight 600 |
| Colour | Navy `#0a2240` (buttons, accent, announcement bar) on white; black text; border `#d3d3d3` |
| Badges | Sale and saving `#6d52ff`; custom badge `#e4ff52`; sold out `#d3d3d3` |
| Buttons | Solid navy, 8px radius, 12.8px label; outline variants in navy, white and black |
| Motion | Sections fade in on scroll; product cards swap to a second image on hover |

### Section order by template

| Template | Sections, top to bottom |
|---|---|
| Home | Announcement bar · header · video hero · image with text · tabbed collections · logo slider · overlapping images ×2 · divider · currency selector · footer |
| Collection | Text heading · (icons row on Subscription) · 3-column product grid. No filters, sort or pagination |
| Product: Electrolytes | Buy box · benefit pillars · dosing · comparison · ingredient science · how to use · athlete grid · reviews · FAQ · related products · sticky bar |
| Product: Tranquil | Buy box · USP marquee · benefit pillars · persona stats · comparison · curated reviews grid · ingredient cards · dosing ritual · athlete grid · FAQ · reviews · related products · guarantee footnote · sticky bar |
| Cart | Cart page; the drawer is the main cart |
| Search | Results with sort, availability and price filters (no search entry in the header) |
| Blog | Page hero · post grid, 6 per page, paginated |
| Article | Article (author, date, share) · recommended posts |
| About | Page hero · text |
| Contact | Page hero · contact form with a topic dropdown · FAQ accordion |
| Ambassadors | Mosaic · quote grid · text · Instagram feed |
| Landing: Tranquil 1 and 2 | A body built in Instant · sticky shop-now bar |
| Landing: 7 reasons | Promo · comparison · landing-page buy box · sticky bar |
| Sleep debt, Breathwork | A full-page embedded interactive tool |
| Account | The theme's login page exists, but in a browser it redirects to the Recharge portal login |
| Money-back terms | 11 text sections and a link to the refund policy |
| Collections list | Collection tiles |

The other six product pages were not opened, so the number of distinct product templates is at least two.

### Where each section comes from

- **Stock theme (23):** announcement bar, header, footer, video hero, image with text, tabbed collections, overlapping images, divider, text, icons row, collection grid, product buy box, accordions, related products, page hero ("promotion row"), blog posts, article, recommended posts, contact form, mosaic, cart, search, page.
- **Custom-coded for BKM (about 20):** logo slider, currency selector slot, benefit pillars, dosing, comparison (two versions), ingredient science, ingredient cards, how to use, athlete grid, sticky bar (two versions), USP marquee, persona stats, curated reviews grid, quote grid, Instagram feed, landing promo, landing buy box, embedded tool. In the buy box: button variant picker, delivery estimator, add-on offer, payment icons.
- **Injected by apps:** subscription purchase options (Recharge), rating stars and review list (Klaviyo), chat bubble (Gorgias), cookie banner (Cookiebot), one landing-page body (Instant), switcher (Transcy).

That split matters: about half of what a shopper sees was written by an agency, not shipped by the theme.
If Commerce Cloud lets a developer add a coded section with settings (T12), most of the custom list can be
built per brand the same way. If it cannot, each one becomes a native section to build.

### Product buy box, top to bottom

Rating stars · subtitle · title and price · badges · short description · attribute chips · variant buttons ·
purchase options (subscription) · add to cart · payment icons · guarantee callout · delivery estimator ·
accordions · add-on offer.

### Product card

Image with a second image on hover · subtitle · title · "From" price · star rating with average.

## 4. Backend requirements

- **Subscriptions.** Plan groups attached to products, with frequency, units per shipment and a percentage discount; prices per variant and per market. Recurring charges against a stored payment method, with retries. Renewal orders in the order list. A portal to skip, reschedule, cancel and update payment, behind passwordless login. Plan-aware promotions (free shipping on the 3-month plan). Renewal and failed-payment messages.
- **Markets.** A market holds a currency, a price set, a URL prefix and the countries it serves. Hreflang between markets. A country selector. Shipping zones and rates per country, with a free-shipping threshold. VAT-inclusive pricing by destination.
- **Payments.** Cards and wallets plus the local methods BKM shows (Klarna, iDEAL, Bancontact, BLIK, MobilePay, MB WAY, Bizum, Satispay). Settlement in SEK, GBP and PLN at least.
- **Product content.** Structured fields on a product that sections can read: subtitle, chips, ingredient list (name, dose, role), supplement facts, FAQs, comparison rows, steps.
- **Reviews.** Request after delivery, moderate, show stars on cards and the buy box, list on the product page, expose in structured data. Import the existing reviews.
- **Promotions.** Compare-at pricing, codes and automatic discounts exist. Missing: a discounted add-on when bought with another product.
- **Pre-orders.** Take an order before stock arrives, with clear messaging on the product page and in the cart.
- **Returns and guarantee.** A refund flow that supports the 30-day guarantee and statutory withdrawal.
- **Accounts.** Register, login and order history exist as templates. Passwordless login is unconfirmed.
- **Retention.** Back-in-stock alerts. Email and SMS flows fed by storefront events (viewed product, added to cart, started checkout, ordered).
- **Compliance and tracking.** A consent manager that gates tags. A way to install pixels and third-party scripts without editing theme code.
- **Support.** Chat on the storefront, a help centre, and tickets that show the customer's orders and subscriptions.
- **SEO.** Product, Organization, WebSite and Article structured data, canonical URLs, sitemap, and redirects from the old Shopify URLs.
- **Not needed for BKM.** Gift cards, wishlist, loyalty, B2B, store locator, product filters. Agentic-commerce endpoints (UCP, MCP) are a Shopify default, not something BKM configured.

## 5. Gap matrix

Status: **Have** exists in the capture · **Partial** something exists but not what BKM uses · **WIP** named as work in progress ·
**Missing** not found in the capture · **Unverified** the capture cannot tell.
Route: where the work would land. Size: S days · M weeks · L a quarter-scale project · XL a multi-quarter programme.
Phase: 0 launch · 1 parity · 2 beyond.

### Theme and Store Builder

| ID | Area | Requirement | BKM today | Status | Commerce Cloud capture | Route | Size | Phase |
|---|---|---|---|---|---|---|---|---|
| T01 | Global chrome | **Announcement bar** | Navy strip with three certifications | Missing | Not in the Lumos section list | Theme | S | 0 |
| T02 | Global chrome | **Header over hero** | Transparent sticky header, centred logo, account and cart icons | Partial | `header` section exists; transparent and sticky options not captured | Theme | S | 0 |
| T03 | Global chrome | **Dropdown navigation** | One dropdown with 7 links; drawer menu on mobile | Partial | Menus are flat lists with no nesting; `nav-drawer.js` exists | Platform | M | 0 |
| T04 | Global chrome | **Cart drawer** | Slide-in cart: free-shipping progress, pair-with upsell, terms checkbox, express checkout | Missing | Cart page only (`cart` section, `cart.js`) | Theme | L | 1 |
| T05 | Global chrome | **Footer** | Two link columns, newsletter signup, Instagram, payment icons | Have | `footer`, `newsletter`, `social-icons`, payment mark images | Configure | S | 0 |
| T06 | Global chrome | **Country and currency selector** | Transcy switcher slot in the footer; three market URLs | Missing | No selector section or snippet | Theme | M | 0 |
| T07 | Global chrome | **Cookie consent banner** | Cookiebot banner | Missing | Privacy & Consent settings page is a placeholder | Third party | M | 0 |
| T08 | Global chrome | **Chat bubble and help centre** | Gorgias chat, help centre and proactive campaigns | Partial | Store editor has a Chatbot page; Service Cloud handles tickets | Maropost cloud | M | 1 |
| T09 | Global chrome | **Motion** | Scroll-reveal on sections, second image on card hover | Unverified | Not visible in file names | Theme | S | 1 |
| T10 | Global chrome | **Search** | No search in the header; results page with sort, availability and price filters | Have | `search` layout and section, `autocomplete.js`, `filters.js`, `sorting.js` | Configure | S | 0 |
| T11 | Builder | **Template per product** | Electrolytes and Tranquil use different section stacks; landing pages have their own | Missing | One `default.json` per template type; the builder dropdown shows only Default | Platform | L | 0 |
| T12 | Builder | **Custom sections in code** | About 20 section types were custom-coded by BKM's agency (`shopdev_*`, `bkm-*`) | Unverified | Code editor exposes `sections/*.html` + `.json`; unknown whether a new file shows up in Add Section | Platform | L | 0 |
| T13 | Builder | **Script and embed surface** | Chat, consent, pixels and review widgets load as app embeds | Missing | No app-block or app-embed concept in the theme | Platform | M | 0 |
| T21 | Builder | **Theme settings** | Figtree + Inconsolata, navy scheme, 8px buttons, badge colours | Partial | Logo, Theme Colors, Typography, Buttons, Product Card groups; font list and badge colours not captured | Theme | S | 0 |
| T14 | Page templates | **Landing pages with commerce** | Five landing pages: two built in Instant, one with its own buy box and sticky shop-now bar, two embedded tools | Partial | Store Pages (Default / Full width) and Marketing landing pages; product sections on pages not captured | Theme | M | 1 |
| T15 | Page templates | **Embedded tool pages** | Sleep-debt and breathwork pages are full-page custom embeds | Partial | No custom HTML section; the code editor can edit templates | Custom code | S | 1 |
| T16 | Page templates | **Blog** | 5 blogs; index with hero and paginated grid; article with author, date, share, recommended posts | Partial | `blog` and `blogpost` sections, Blogs admin; share and recommended posts not captured | Theme | S | 1 |
| T17 | Page templates | **Contact page** | Form with a topic dropdown, plus FAQ accordion | Missing | No contact-form section; forms live in Marketing (acquisition forms) | Maropost cloud | M | 1 |
| T18 | Page templates | **Policy pages** | Refund, terms, privacy | Have | `policy` template and section | Configure | S | 0 |
| T19 | Page templates | **Collection page** | Heading, optional icons row, 3-column grid; no filters or sort | Have | `collection` section; filter and sorting scripts exist | Configure | S | 0 |
| T20 | Page templates | **Account pages** | Login, register, order history | Have | Templates for login, signup, orders, order, profile, addresses | Configure | S | 0 |
| T22 | Content sections | **Video hero** | Autoplay background video with headline | WIP | `hero-video` under `sections_wip` | Theme | M | 0 |
| T23 | Content sections | **Image with text** | Split media and copy with a button | Partial | `image-banner-with-cta`, `multi-column-horizontal-items`; no split layout by name | Theme | S | 0 |
| T24 | Content sections | **Tabbed collections** | Tabs switch between product carousels | Partial | `featured-collections-slider`, `featured-products`; no tabs | Theme | M | 0 |
| T25 | Content sections | **Logo slider** | Auto-scrolling partner logos | Partial | `brands` is a static logo row; Swiper is bundled | Theme | S | 1 |
| T26 | Content sections | **Overlapping images story** | Two layered images with copy and Buy now | Missing | No equivalent | Theme | S | 1 |
| T27 | Content sections | **Page hero banner** | Image band with page title (About, Contact, Blog) | Have | `image-banner`, `hero` | Configure | S | 0 |
| T28 | Content sections | **Text and divider** | Rich text blocks, thin dividers | Partial | `rich-content`; no divider or spacer | Theme | S | 0 |
| T29 | Content sections | **Icons row** | USP icons above the subscription grid | Have | `benefits`, `info-card` with icon | Configure | S | 0 |
| T30 | Content sections | **FAQ accordion** | On product pages and Contact | Missing | No accordion or collapsible section or block | Theme | S | 0 |
| T31 | Content sections | **Mosaic and quote grid** | Ambassadors page: mosaic header, cards with photo, role and quote | Partial | `multi-column`, `testimonial-card`, `category-grid` | Theme | S | 1 |
| T32 | Content sections | **Instagram feed** | Nine embedded posts | Missing | No social feed section | Third party | S | 2 |
| T33 | Content sections | **Newsletter signup** | Footer form | Have | `newsletter` section and block | Configure | S | 0 |
| T34 | Product page | **Media gallery** | Thumbnail strip, zoom lightbox, badge over the image | Partial | `product` section, `magnify.js`; gallery options not captured | Theme | M | 0 |
| T35 | Product page | **Rating stars** | On cards and in the buy box, with the average | Partial | `rating` snippet and Show rating option; no review data behind it | Theme | S | 0 |
| T36 | Product page | **Subtitle, badges, chips** | Tagline, NEW and Try for 30 nights badges, No added sugar and Vegan chips | Partial | `product-badge` snippet; needs product content fields | Theme | S | 0 |
| T37 | Product page | **Button variant picker** | Flavour, or Can / Bag, as labelled buttons | Unverified | `product.js` exists; picker style not captured | Theme | S | 0 |
| T38 | Product page | **Purchase options** | Three cards: 3-month supply, monthly, one-time, with savings badges and a benefit list | Missing | No subscription widget | Theme | M | 0 |
| T39 | Product page | **Add to cart and express pay** | Add to cart; wallets at checkout | Partial | Add to cart exists; express buttons on the product page not captured | Theme | S | 0 |
| T40 | Product page | **Payment icons** | 16 method icons under the button | Partial | Visa, Mastercard, PayPal, Afterpay, Zip images in assets | Theme | S | 1 |
| T41 | Product page | **Delivery estimator** | Country picker (33), same-day cut-off, 3 to 7 day estimate, duties note | Missing | No equivalent | Theme | M | 1 |
| T42 | Product page | **Guarantee callout** | 30-day money-back block | Have | `info-banner-block`, `info-card` | Configure | S | 0 |
| T43 | Product page | **Buy-box accordions** | What is it, How to use, Key ingredients, Why subscribe, Supplement Facts | Missing | No accordion block | Theme | S | 0 |
| T44 | Product page | **Add-on offer** | Pair with Nasal Strips at a special price, added from the product page | Partial | `recommendation` block; no discounted add-on | Theme | M | 1 |
| T45 | Product page | **Sticky add-to-cart bar** | Appears on scroll with title, USPs and button | Missing | No equivalent | Theme | S | 1 |
| T46 | Product page | **USP marquee** | Scrolling certification strip | Missing | No equivalent | Theme | S | 1 |
| T47 | Product page | **Benefit pillars** | Five benefit cards | Have | `benefits`, `multi-column` | Configure | S | 0 |
| T48 | Product page | **Comparison table** | Us vs them, in two versions | Missing | No table section | Theme | M | 0 |
| T49 | Product page | **Ingredient cards** | 11 active ingredients rendered from structured data | Missing | No structured product content to drive it | Theme | M | 0 |
| T50 | Product page | **Steps and persona stats** | How to use steps, dosing ritual, Which sleeper are you | Partial | `multi-column-horizontal-items`, `hero-stat`, `info-list` | Theme | S | 1 |
| T51 | Product page | **Athlete grid** | Athletes with sport and title | Partial | `multi-column`, `testimonial-card` | Theme | S | 1 |
| T52 | Product page | **Curated reviews grid** | Hand-picked quotes with the product's average | Partial | `testimonial-card`; no link to review data | Theme | S | 1 |
| T53 | Product page | **Related products** | You may also like | Have | `recommendation` block, `featured-products` | Configure | S | 0 |
| T54 | Product page | **Product card** | Second image on hover, subtitle, From price, stars | Partial | `product-card`, `price`, `rating`, `product-badge`; hover image and subtitle not captured | Theme | S | 0 |

### Platform

| ID | Area | Requirement | BKM today | Status | Commerce Cloud capture | Route | Size | Phase |
|---|---|---|---|---|---|---|---|---|
| P01 | Subscriptions | **Subscription plans** | Recharge: monthly (20% off) and 3-month prepaid of 3 units (30% off), per variant | Missing | No selling-plan concept in products or promotions | Platform | XL | 0 |
| P02 | Subscriptions | **Recurring billing** | Stored payment method, scheduled renewals, retries on failure | Missing | Maropay mentions saved cards only as a migration risk | Platform | XL | 0 |
| P03 | Subscriptions | **Subscriber portal** | Passwordless login by SMS and email code; skip, cancel, manage | Missing | Account templates exist; no subscription management | Platform | L | 0 |
| P04 | Subscriptions | **Subscription pricing rules** | Free shipping on the 3-month plan; a subscription collection | Missing | Promotions have no plan condition | Platform | M | 0 |
| P05 | Subscriptions | **Subscription messages** | Renewal, failed payment and cancellation emails | Partial | Marketing Cloud journeys can send; no subscription triggers | Maropost cloud | M | 0 |
| P06 | Markets | **Market currencies and prices** | SEK, GBP and a Polish price set per market, not converted | Partial | Price lists adjust by channel and audience; no currency per market | Platform | XL | 0 |
| P07 | Markets | **Market URLs** | `/en-gb`, `/en-pl`, hreflang tags, country detection | Missing | No market or locale routing | Platform | L | 0 |
| P08 | Markets | **Languages** | English only | Have | Lumos ships locale files (en, ru, uk) | Configure | S | 2 |
| P09 | Markets | **Shipping zones and rates** | 33 countries, free over 549 kr, same-day dispatch | Missing | Rates are hard-coded in the prototype; no zones or rates screen captured | Platform | L | 0 |
| P10 | Markets | **VAT per country** | VAT-inclusive prices; a 25% tax collection | Partial | Tax categories exist; country VAT rules not captured | Platform | M | 0 |
| P11 | Markets | **Payment methods** | Cards, Apple Pay, Google Pay, Klarna, iDEAL, Bancontact, BLIK, MobilePay and more | Partial | Maropay, PayPal, Stripe, Afterpay, Zip; Maropay currencies exclude SEK and PLN | Third party | L | 0 |
| P12 | Markets | **Checkout** | Express wallets, discount code, terms, marketing opt-in | Unverified | Real checkout is a 3-step flow; discount field seen on the Neto storefront reference only | Platform | M | 0 |
| P13 | Catalog and content | **Structured product content** | Subtitle, chips, ingredients, supplement facts, FAQs, comparison rows per product | Missing | Products have fixed fields, attributes and tags; custom fields exist for Contacts only | Platform | L | 0 |
| P14 | Catalog and content | **Catalog basics** | 8 products, single option, SKUs, compare-at, refill and starter-pack variants | Have | Options, variants, compare-at, kits, collections, inventory by location | Configure | S | 0 |
| P15 | Catalog and content | **Add-on discount** | Special price when bought with another product | Partial | Product and order promotions; no buy-with condition captured | Platform | M | 1 |
| P16 | Catalog and content | **Returns and guarantee** | 30-day money-back on Tranquil; withdrawal rights | Partial | Refund on an order; no returns flow | Platform | M | 1 |
| P17 | Catalog and content | **Reviews** | Klaviyo Reviews: request, moderate, stars, list; 36 Tranquil reviews | Missing | Rating snippet only | Platform | L | 0 |
| P18 | Catalog and content | **Customer accounts** | Register, login, orders | Have | Account templates in Lumos; passwordless login not captured | Configure | S | 0 |
| P19 | Catalog and content | **Back-in-stock alerts** | Restock Rocket (STOQ) | Missing | No stock alert feature | Maropost cloud | M | 1 |
| P28 | Catalog and content | **Pre-orders** | Tranquil carries a Preorder purchase plan with no discount | Partial | Variants have an allow-backorder switch; no pre-order plan or shopper messaging | Platform | M | 1 |
| P20 | Growth and operations | **Email, SMS and signup forms** | Klaviyo flows, onsite forms, footer signup | Partial | Marketing Cloud has campaigns, journeys, SMS and popup forms; storefront event feed not captured | Maropost cloud | M | 0 |
| P21 | Growth and operations | **Pixels and attribution** | Meta, TikTok (inferred), Triple Whale, Microsoft Clarity | Missing | Tracking & Analytics settings page is a placeholder | Platform | L | 0 |
| P22 | Growth and operations | **Consent management** | Cookiebot gates tags by consent | Missing | Privacy & Consent is a placeholder | Third party | M | 0 |
| P23 | Growth and operations | **Helpdesk** | Gorgias tickets tied to orders and subscriptions | Partial | Service Cloud tickets with order context | Maropost cloud | M | 1 |
| P24 | Growth and operations | **SEO and structured data** | Product, Organization, WebSite and Article JSON-LD; canonical, sitemap | Partial | SEO fields on products, collections, pages; JSON-LD, sitemap and redirects not captured | Platform | M | 0 |
| P25 | Growth and operations | **Order tracking and dispatch** | Ships from Sweden; tracking FAQ | Partial | Orders and fulfilment exist; shopper tracking page not captured | Platform | S | 1 |
| P26 | Growth and operations | **Agentic commerce endpoints** | UCP / MCP and agents.md (a Shopify default) | Missing | No equivalent | Platform | L | 2 |
| P27 | Growth and operations | **Migration** | Products, customers, live subscriptions and payment tokens, reviews, redirects, blog | Partial | Product CSV import; nothing captured for the rest | Platform | L | 0 |

Sources for the Commerce Cloud column: `src/stores/themeEditorLumosFiles.ts` and `src/stores/themeEditorData.ts`
on branch `feature/store-builder-reskin` (Lumos file tree and builder catalog), `docs/uat-parity/parity-tracker.md`
(store editor, navigation), `src/stores/useCommerce.ts` and `src/views/Commerce/*` (products, promotions, orders),
`src/maropay/model.ts` (payment currencies), `src/views/Settings/pages/*` (placeholder settings pages),
`docs/maropay/storefront-reference-2026-10.md` (the live Neto storefront).

## 6. Build list by phase

**Phase 0, launch BKM.** The store can trade on Commerce Cloud without losing subscribers, markets or its product story.

*Theme and Store Builder* (24 items)

- **Global chrome:** T01 Announcement bar (S) · T02 Header over hero (S) · T03 Dropdown navigation (M) · T06 Country and currency selector (M) · T07 Cookie consent banner (M)
- **Builder:** T11 Template per product (L) · T12 Custom sections in code (L) · T13 Script and embed surface (M) · T21 Theme settings (S)
- **Content sections:** T22 Video hero (M) · T23 Image with text (S) · T24 Tabbed collections (M) · T28 Text and divider (S) · T30 FAQ accordion (S)
- **Product page:** T34 Media gallery (M) · T35 Rating stars (S) · T36 Subtitle, badges, chips (S) · T37 Button variant picker (S) · T38 Purchase options (M) · T39 Add to cart and express pay (S) · T43 Buy-box accordions (S) · T48 Comparison table (M) · T49 Ingredient cards (M) · T54 Product card (S)

*Platform* (18 items)

- **Subscriptions:** P01 Subscription plans (XL) · P02 Recurring billing (XL) · P03 Subscriber portal (L) · P04 Subscription pricing rules (M) · P05 Subscription messages (M)
- **Markets:** P06 Market currencies and prices (XL) · P07 Market URLs (L) · P09 Shipping zones and rates (L) · P10 VAT per country (M) · P11 Payment methods (L) · P12 Checkout (M)
- **Catalog and content:** P13 Structured product content (L) · P17 Reviews (L)
- **Growth and operations:** P20 Email, SMS and signup forms (M) · P21 Pixels and attribution (L) · P22 Consent management (M) · P24 SEO and structured data (M) · P27 Migration (L)

**Phase 1, parity.** Everything a BKM shopper sees today.

*Theme and Store Builder* (18 items)

- **Global chrome:** T04 Cart drawer (L) · T08 Chat bubble and help centre (M) · T09 Motion (S)
- **Page templates:** T14 Landing pages with commerce (M) · T15 Embedded tool pages (S) · T16 Blog (S) · T17 Contact page (M)
- **Content sections:** T25 Logo slider (S) · T26 Overlapping images story (S) · T31 Mosaic and quote grid (S)
- **Product page:** T40 Payment icons (S) · T41 Delivery estimator (M) · T44 Add-on offer (M) · T45 Sticky add-to-cart bar (S) · T46 USP marquee (S) · T50 Steps and persona stats (S) · T51 Athlete grid (S) · T52 Curated reviews grid (S)

*Platform* (6 items)

- **Catalog and content:** P15 Add-on discount (M) · P16 Returns and guarantee (M) · P19 Back-in-stock alerts (M) · P28 Pre-orders (M)
- **Growth and operations:** P23 Helpdesk (M) · P25 Order tracking and dispatch (S)

**Phase 2, beyond.** Useful, not BKM-critical.

*Theme and Store Builder* (1 items)

- **Content sections:** T32 Instagram feed (S)

*Platform* (1 items)

- **Growth and operations:** P26 Agentic commerce endpoints (L)

## 7. Migration notes

- **Products and collections.** Small: 8 products, 14 variants. Import, then rebuild collections.
- **Subscriptions.** The hard part. Each active Recharge subscription has a plan, next charge date, address and a payment method stored with the payment processor. Moving them needs a processor-to-processor transfer of stored payment methods and a cut-over date agreed with BKM, so that no renewal is missed or charged twice. *(Inferred from how such migrations normally run; confirm with the payments team.)*
- **Customers and order history.** Import customers with marketing consent status. Order history is optional but helps support.
- **Reviews.** Export from Klaviyo and import with dates, ratings and product links, or stars reset to zero on launch day.
- **URLs.** Shopify paths (`/products/…`, `/collections/…`, `/blogs/…`, `/pages/…`, plus the `/en-gb` and `/en-pl` prefixes) need redirects or identical routes to keep search ranking and ad links working.
- **Email flows.** Klaviyo flows and lists move to Marketing Cloud; subscription and stock events must exist there first.
- **Content.** 10 pages, 6 articles, and the two embedded tools, which are custom code and move as they are.

## 8. Verify with engineering

The capture cannot answer these. Each one changes a status in the matrix.

- [ ] **T02 Header over hero.** `header` section exists; transparent and sticky options not captured
- [ ] **T09 Motion.** Not visible in file names
- [ ] **T12 Custom sections in code.** Code editor exposes `sections/*.html` + `.json`; unknown whether a new file shows up in Add Section
- [ ] **T21 Theme settings.** Logo, Theme Colors, Typography, Buttons, Product Card groups; font list and badge colours not captured
- [ ] **T14 Landing pages with commerce.** Store Pages (Default / Full width) and Marketing landing pages; product sections on pages not captured
- [ ] **T16 Blog.** `blog` and `blogpost` sections, Blogs admin; share and recommended posts not captured
- [ ] **T34 Media gallery.** `product` section, `magnify.js`; gallery options not captured
- [ ] **T37 Button variant picker.** `product.js` exists; picker style not captured
- [ ] **T39 Add to cart and express pay.** Add to cart exists; express buttons on the product page not captured
- [ ] **T54 Product card.** `product-card`, `price`, `rating`, `product-badge`; hover image and subtitle not captured
- [ ] **P10 VAT per country.** Tax categories exist; country VAT rules not captured
- [ ] **P12 Checkout.** Real checkout is a 3-step flow; discount field seen on the Neto storefront reference only
- [ ] **P18 Customer accounts.** Account templates in Lumos; passwordless login not captured
- [ ] **P20 Email, SMS and signup forms.** Marketing Cloud has campaigns, journeys, SMS and popup forms; storefront event feed not captured
- [ ] **P24 SEO and structured data.** SEO fields on products, collections, pages; JSON-LD, sitemap and redirects not captured
- [ ] **P25 Order tracking and dispatch.** Orders and fulfilment exist; shopper tracking page not captured

Also confirm every `Missing` row, Phase 0 first, and whether the three work-in-progress sections
(`hero-video`, `lookbook`, `product-bundle`) are scheduled.

## 9. Appendix: method and limits

- **Site crawl.** Public pages only, read-only GET requests, no login, nothing added to the cart, no checkout started. Product, collection and sitemap data came from the store's public JSON endpoints. JavaScript-rendered parts (subscription options, reviews, cart drawer, UK prices) were read in a browser.
- **Pages read.** Home; collections All and Subscription; products Electrolytes and Tranquil (default and UK); cart; search; blog index and two articles; all 10 content pages; policies; account login; a 404.
- **Not seen.** Checkout, the logged-in account and subscription portal, transactional emails, the other six product pages, mobile layouts beyond the navigation drawer, and the Polish market's currency label.
- **Site limits.** The store rate-limits scripted requests, so some breadth checks were done through the browser instead.
- **Agent-directed text.** The site's `robots.txt` and `agents.md` contain instructions aimed at AI agents (a Shopify default). They were read as data and not followed.
- **Commerce Cloud baseline.** This repo's capture of UAT, not the live product. The Lumos theme's file and section names are real; its file contents and most section settings are stand-ins.
