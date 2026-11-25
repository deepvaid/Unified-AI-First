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
| S5 | Product buy box and product card | pending | | | | The variant picker is built for Northfold (demo); see "S5 notes" below |
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

- ~~**No store persists anything.** Every store re-seeds on page load, so there was no storage key to bump. Only the storefront cart (`sessionStorage`, already per store) and Maropay state persist.~~ No longer true since the demo pass, part 2: a demo store's products, plans, subscribers, campaigns, chatbot and merchandising are kept in this browser (`mp.vitaheal-demo.*`; another demo store uses `mp.demo-store.<channelId>.*`), and Restore original store puts the seed back.
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
- ~~The product editor's variant grid shows "$" prices; the Products list shows the store's currency. S9.~~ The variant grid shows the store's currency ("419 kr") since store themes, part 2.
- The sale and custom badge colours are theme settings but nothing draws those badges yet (S5). The sold-out tag uses its setting.
- ~~The storefront still shows a search box (the reference site has none) and a single product image without a gallery (S2, S5).~~ The search box shows only once Merchandise Cloud is connected, and the product page has a gallery (demo pass, part 1).

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

- **Part 5, managing a subscription (done, 2026-11-18).** Asked for by the human after part 4
  ("where user will manage subscription", then "also for merchant"). A demo-sized piece of S8.
  - **Rules** in `src/subscriptions/contracts.ts` (15 tests in `tests/subscriptions/`, with S8's
    acceptance cases: skipping moves the next charge one interval; cancelling gives Cancelled and
    no next charge; a renewal records its order). A checkout line bought on a plan starts one
    subscription ("S-1009"). Each action returns a changed copy with a dated history line that
    says who did it, so the shopper's page and the admin tell the same story.
  - **Shopper:** `/account` on the storefront (`StorefrontAccount.vue`). Their subscriptions, each
    with photo, plan, next delivery, price per delivery, payment method and status, and the
    actions: skip next delivery, pause, resume, change plan, cancel with a reason, and pay again
    after a failed payment. Every action asks first and answers in a status line. Linked from the
    confirmation ("Manage your subscription"), the header's account icon, the phone menu and the
    footer ("My subscription").
  - **Sign-in is mocked:** an email, then a code, and any six digits work. A checkout that buys a
    subscription signs its shopper in, so the confirmation's link goes straight in.
  - **Merchant:** Commerce › Subscriptions › Subscribers
    (`/commerce/:accountId/subscriptions/subscribers`): a list with tabs All, Active, Paused,
    Cancelled, Payment failed, search, and quick row actions. Each subscription has its own page
    with the customer and address, the payment method, the plan and item, the next charge and
    the history with links to its orders. Actions: skip next delivery, pause, resume, change the
    next charge date, change plan, cancel with a reason, and "Charge now" or "Retry payment".
  - **Renewals:** "Charge now" runs a payment through the store's provider like a checkout and
    places a renewal order: tagged `Subscription` and `Renewal`, with "Renewal of subscription
    S-1009" in its timeline and a link back to the subscription. The first order links to it too.
  - **Seeded subscribers:** eight made-up Swedish subscribers (five Active, one Paused, one
    Cancelled, one Payment failed), with dates that count back from the day the store is opened.
    Kept in the browser (`mp.vitaheal-demo.subscriptions.v1`) and put back by "Restore original
    store" with the products and plans.
  - **The walk** (desktop 1280px, then phone 375px; no page scrolled sideways, console clean):
    1. Bought Electrolytes on the 3-month supply → confirmation → "Manage your subscription" →
       `/account`, signed in, subscription S-1009, next delivery 18 Feb 2027.
    2. Skip next delivery → "Your next … delivery is now 18 May 2027."
    3. Admin › Subscribers: Linnea Berg first, 18 May 2027; her page's history shows the skip
       "By the customer".
    4. Paused in the admin → the shopper's page shows Paused → resumed there.
    5. Charge now → order #20008, tagged Subscription and Renewal, paid with Visa •••• 4242;
       next charge 18 Aug 2027; still there after a reload.
    6. Admin: next charge moved to 1 Sept 2027 (a past date is refused with a message), plan
       changed to Monthly subscription (223,20 kr).
    7. Cancelled on the shopper's page with "I have too much left" → Cancelled in the admin with
       the reason.
    8. Lucas Andersson (Payment failed) → Retry payment → Active, order #20009.
    9. Phone: account icon → email (a wrong one is refused) → code (too short is refused) →
       Erik Johansson's subscription; an unknown email gets an empty page with a link to the
       Subscription collection.
    10. Restore original store → eight subscribers again.
    11. Neelam-Store: its account icon still leads to its own sign-in path, no "My subscription".
  - **Known limits.** Nothing renews by itself: there is no scheduler, no "Run renewals due
    today" and no retry schedule; a failed payment exists only on the seeded subscriber. The
    shopper cannot move the date, swap flavour or change the payment method. The account has no
    orders or addresses page. No messages are sent (P05). Step 4 was checked by reloading one
    tab, not with two tabs side by side. A restore leaves an order's "View subscription" link out
    for subscriptions it removed.

- **Part 6, a chatbot on the store (done, 2026-11-18).** Asked for by the human: a chatbot demo
  on the Vitaheal store that answers order and subscription questions and suggests products for
  a wellness need. Not a slice of the build prompt.
  - **Scripted, by the human's choice.** `src/chatbot/storeAssistant.ts` recognises a question
    by its wording and answers from the store's real orders, subscriptions, products and pages.
    No language model, nothing leaves the browser, the same question always gets the same
    answer. 26 tests in `tests/chatbot/storeAssistant.test.ts`, against the demo store's seed.
  - **What it answers:** an order (number, date, items, total, whether it has shipped); a
    subscription (next delivery, price, plan; paused, failed and cancelled each say so); a
    wellness need (sleep, calm, focus, energy, hydration and training, skin, healthy ageing,
    breathing, women's balance) with product cards; store questions from its knowledge base
    (delivery, countries, returns, guarantee, how subscriptions work, contact), with the page
    they come from. A greeting or an unknown question says what it can do.
  - **Wellness matching reads the products.** The shopper's words are widened by a small
    vocabulary and scored against each product's name, subtitle, description and collections,
    so a product added in the admin can be suggested. A question about pregnancy, medication,
    illness or a child gets "ask your doctor or pharmacist", never a product.
  - **Who is asking:** the shopper signed in on the store (the account page, or any checkout
    there). Otherwise an email, then a code (mocked: any six digits). An order number with its
    email needs no code.
  - **It acts:** "Add to cart" on a suggestion, and "Skip next delivery" on a subscription, in
    the chat. Pause, change plan and cancel link to the account page.
  - **Widget:** `StorefrontChat.vue`, mounted by the layout for a demo store with an Active
    linked chatbot. Launcher, panel (full screen on a phone), quick prompts, typing pause. It
    takes its name, colour, corner, welcome message and prompts from the chatbot's settings.
    Hidden, not removed, on the checkout, so the conversation is still there afterwards.
  - **Admin:** a seeded chatbot "Vitaheal (demo)" (id 101) under Service › Chatbots, linked to
    the store, so the store's Chatbot page shows it connected. Its settings and the chats
    shoppers have on the store are kept in the browser (`mp.vitaheal-demo.chatbot.v1`,
    `mp.vitaheal-demo.conversations.v1`): a change in the builder reaches the store's tab, a
    chat shows under Conversations, and "Restore original store" puts both back.
  - **The walk** (desktop 1280px, then phone 375px; no page scrolled sideways, console clean):
    1. Store home: navy launcher "Need help?"; the panel opens on the welcome message and five
       prompts, with focus in the message field.
    2. "I can't sleep" → Unwind, "Add to cart" → the cart shows 1.
    3. "I need more focus at work", "I get cramps when I train", "something for my skin" →
       Clear Focus, Vitaheal Electrolytes, Collagen+.
    4. "Can I take this while pregnant?" → the doctor answer.
    5. "Where is my order?" → asks for an email → a code → "I can't find an order for
       nobody@example.com", with a link to the contact page.
    6. Bought Electrolytes on the 3-month supply → "Where is my order?" → order #20010 with
       its items and total.
    7. "When is my next delivery?" → the subscription card, 18 Feb 2027 → "Skip next delivery"
       → 18 May 2027 on the card and in the admin's Subscribers.
    8. "What is your return policy?", "Do you ship to Norway?", "How do subscriptions work?" →
       the store's own answers, each with its page.
    9. "asdf" → what it can help with, and the prompts again.
    10. Admin: Store › Chatbot shows it Active; Conversations lists the two chats just had,
        above four earlier ones. A new welcome message typed in the builder showed on the store
        after a reload.
    11. Phone: the panel fills the screen; a link out of the chat closes it; Esc closes it and
        focus returns to the launcher.
    12. Restore original store → the welcome message and the chats are back as seeded.
    13. Neelam-Store: no widget on its storefront; its Chatbot page and chatbot id unchanged.
  - **Fixed on the way (a part 4 mistake):** "Continue shopping" on the confirmation led to the
    store's not-found page. Part 4 turned the countdown off on the demo store, which made that
    link always show, and its address was resolved twice. It now opens the store's home.
  - **Changed from part 5:** any checkout on a store with an account page signs its shopper in,
    not only a subscription checkout, so the chat can find the order just placed.
  - **Known limits.** It understands the wordings it was written for, not every phrasing. A
    typed email with a typo is not caught. The chat is lost on a page reload (the saved copy in
    the admin stays). The builder's own preview still uses its older stand-in answers. The
    pre-chat form and business hours from the builder are not applied on the store. Only
    Vitaheal's storefront has the widget.

- **Part 7, a campaign for one store (done, 2026-11-18).** Asked for by the human ("how run
  storewise campaign"), who chose both kinds: a promotion on the store and an email to that
  store's customers, working in the demo.
  - **Rules** in `src/storefront/campaigns.ts` (9 tests in `tests/storefront/campaigns.test.ts`).
    A store campaign may carry an **offer**: a message for the store, a code and a percentage
    off. With no targets the code covers the whole order; with collections, only products in
    them. Each covered line loses its own percentage, rounded, so the lines add up.
  - **Store editor › Campaigns** (`StoreCampaigns.vue`): the drawer gains an Offer section
    (message, code, percent off) with its checks; the table gains Offer, Orders (count and
    revenue) and Email; the table picks and folds its columns by its own width. A store with
    products of its own targets its own collections by name.
  - **On the store:** a running campaign's message takes the announcement bar. The cart and the
    checkout ask for a discount code only while the store has one running. A wrong, ended or
    not-yet-active code says why. The discount shows as its own line; the total, the pay button
    and what is charged follow.
  - **Subscriptions:** the code lowers the first order only. Later deliveries stay at the plan's
    price, and the cart and checkout say so.
  - **Order:** each covered line carries the code and percentage (the order page already had the
    columns), with a timeline line. The campaign counts the order and its revenue.
  - **Email:** "Announce by email" writes a draft in Marketing (subject, preheader, the list
    "Vitaheal customers", sender Vitaheal, an email content written for it) and opens the
    existing email wizard on it. After sending, the campaign row shows the email's status with a
    link to its report. Two contact lists and one email content are seeded for the store.
  - **Chatbot:** "Do you have a discount code?" answers with the running campaign.
  - **Seeded and kept:** three Vitaheal campaigns (running, scheduled, ended), with dates
    counted from today, kept in the browser (`mp.vitaheal-demo.campaigns.v1`), and the
    announcement emails (`mp.vitaheal-demo.emails.v1`). "Restore original store" puts the
    campaigns back and removes the emails.
  - **The walk** (desktop 1280px and phone 375px, console clean):
    1. Store: the bar reads "Winter wellness week: 15% off everything with code WINTER15".
    2. Cart with Unwind and Electrolytes on the 3-month supply: an empty code, NOPE, SLEEP20
       (not active yet) and BLACK25 (ended) each get their own message; winter15 applies:
       "Discount · 15% off −148 kr", total 837 kr, "Then every 3 months 586 kr".
    3. Checkout: "Discount · WINTER15, 15% off −147,74 kr", "Pay 837,16 kr".
    4. Order: both lines show WINTER15 and 15%, 339.15 + 498.01 = 837.16, with "Discount code
       WINTER15 applied" in the timeline. The subscription it started stays 585,90 kr.
    5. Campaigns page: Winter wellness week went from 37 to 38 orders.
    6. New campaign: an end before the start, and a code another campaign uses, are refused.
       "Spring reset" saves as Scheduled and the store does not change.
    7. Announce by email → the wizard opens filled in → Send now (4,812 contacts) → the row
       reads "Sending" and links to the report; still there after a reload.
    8. Deleting the running campaign: the bar goes back to the theme's text and the code field
       leaves the cart.
    9. Restore: the bar and the three campaigns are back, the emails are gone.
    10. Neelam-Store: no code field in cart or checkout, no announcement change. Atlas
        Outfitters' Campaigns page still lists its three campaigns with their targets.
  - **Known limits.** One code per order, percentage only. No automatic discounts, no fixed
    amounts, no usage limits. A sent email reads "Sending" with no opens or clicks, as any new
    Marketing campaign does. Opening the email wizard's first step is the merchant's review:
    nothing is sent until they press Send. Campaign targets on stores without their own
    products still come from the shared link catalogue.

- **Part 8, Merchandise Cloud on the store (done, 2026-11-18).** Asked for by the human
  ("integrate merchandise cloud"), working in the demo. Before this, the Connect button led back
  to its own card, nothing marked a store as connected, Vitaheal's lists would have shown another
  store's rules, and no storefront used any of it.
  - **Connecting:** `useSalesChannels.connectMerchandising` / `disconnectMerchandising` set the
    three fields the admin reads together, so the store page's checklist, quick action and cloud
    card agree. The connect card (`MerchandisingLayout.vue`) syncs the store's published products
    with a short progress line, then opens the workspace. Connection & sync has "Check product
    sync" and "Disconnect" (with a confirm that says what shoppers lose).
  - **The store's own data** (`useMerchandising.ts`): a store with products of its own has its own
    rows and never borrows another store's, so an empty list shows its empty state. Its
    merchandising products are its Commerce products, with photos and prices in kronor. Product
    sync shows its real count and sync time. Analytics says "Nothing to report yet" rather than
    another store's numbers.
  - **Rules** in `src/storefront/search.ts` (10 tests in `tests/storefront/search.test.ts`):
    a redirect sends the whole query to a page; synonyms widen it; results are scored on name,
    collections, subtitle and description; pinned products lead; a blacklisted product is never
    found; sort by relevance or price. `recommendFor` picks the row under a product by the
    engine's strategy.
  - **On the store:** a search box in the header (a Search link in the phone menu) and a search
    page at `/search`, only once the store is connected. The row under a product is chosen and
    named by the store's active product-page engine ("Goes well with Unwind").
  - **Admin:** Merchandising › Search › Preview runs the same search as the store. "Add new" on
    Synonyms works (it said "coming soon"). A redirect's link opens the page in the demo store.
  - **Seeded and kept:** four synonyms, two redirects, two search pins, two engines (one on, one
    off). Everything made for Vitaheal in the workspace is kept in the browser
    (`mp.vitaheal-demo.merchandising.v1`), and so is the connection
    (`mp.vitaheal-demo.merchandise.v1`). "Restore original store" disconnects the store and puts
    the seeded rules back.
  - **The walk** (desktop 1280px and phone 375px, store and admin in two tabs, console clean):
    1. Before connecting: the store has no search box and `/search` is its not-found page.
    2. Merchandising › Connect: "Syncing products: 3 of 8", then the workspace opens with
       "8 products are synced". Overview: 1 active engine, 4 synonyms, 2 redirects, 0 collections.
    3. Store: "sleep" lists Unwind (pinned) then Nasal Strips; "tired" lists Clear Focus first,
       "including results for energy and focus"; "returns" opens the refund policy; "blorp" gets
       "Nothing matches" with links to the five collections and all products.
    4. Unwind's page: "Goes well with Unwind", led by Nasal Strips. Switching the engines in the
       admin changes the row to "New in"; with none on it is "You may also like" again.
    5. Search preview in the admin gives the same lists, with prices in kronor, and says when a
       query is redirected.
    6. Adding the synonym knackered → energy in the admin: the open store tab's search for
       "knackered" fills in without a reload.
    7. Disconnect: the store tab loses the search box and `/search` is the not-found page again.
    8. Restore: disconnected, four synonyms again, nothing left in the browser.
    9. Neelam-Store: its header search still leads to its not-found page. Atlas Outfitters still
       lists its 16 synonyms, its pins, its analytics and the "coming soon" Search preview.
  - **Known limits.** Search has no filters, no suggestions while typing and no typo tolerance.
    Search rules (boost, bury), promo cards, banners, smart collections and field
    transformations are not applied on the store. Only product-page engines show on the store,
    and an engine's include and exclude filters are not applied. Recommendations use what the
    store knows (shared collections, newest, the store's own order), not shopper behaviour. A
    store on the shared catalogue can now be connected, but its storefront gets no search.

- **Part 9, full review, fixes and the sales film (done, 2026-11-19).** Asked for by the human:
  review every flow as QA and as product design manager, fix what is wrong, and make a video of
  the working demo for sales. Their choices: the Vitaheal demo end to end; issues on shared pages
  fixed for the demo store only; one film of about four minutes with captions and no voice.
  - **Covered:** all 28 store pages at 1280px and 375px (no broken picture, wrong word or
    sideways scroll); the 23 Merchandising pages and the 10 store editor pages of the demo store;
    campaign codes (whole store, one collection, a code that stops applying, a deleted campaign);
    13 odd searches (markup, one letter, a very long query, sentences); the pin and engine
    editors; orders and subscribers; restore; Neelam-Store and Atlas Outfitters before and after.
  - **Findings**

    | # | What | Where | Severity | Result |
    |---|---|---|---|---|
    | 1 | A sentence ("something for sleep") found nothing | Store search | Medium | Fixed: filler words are ignored, and the pin still applies |
    | 2 | A code for one collection did not say what it covers | Cart, checkout | Medium | Fixed: "20% off Sleep" |
    | 3 | A code that stopped applying vanished without a word | Cart, checkout | Medium | Fixed: "Code X doesn't apply to anything in your cart now" |
    | 4 | The pin editor's "Results" listed products the query does not find | Merchandising › Pinning | Medium | Fixed: the store's real results; the filter box reaches every product |
    | 5 | Engines for other pages show nothing on the store, with no hint | Merchandising › Recommendations | Medium | Fixed: a note says which engine the store uses |
    | 6 | Pages whose only button said "coming soon" or "prototype only" | Merchandising rail | Medium | Fixed: Content, Integrations and Field transformations are not listed for the demo store |
    | 7 | "Upload" (coming soon) on Synonyms; a "coming soon" tab and menu item | Synonyms, Default merchandising | Medium | Fixed: not offered on the demo store |
    | 8 | The header search box showed no keyboard focus | Store header | Medium | Fixed for a store with search |
    | 9 | A page left open across a new release did nothing on the next click | Whole app | Medium | Fixed: it reloads the wanted page once |
    | 10 | "Channel-scoped workspace" | Merchandising overview | Low | Fixed for the demo store |
    | 11 | "in this prototype" wording | Product sync, promo card and banner forms | Low | Fixed for the demo store |
    | 12 | "Sorry, This Page Not Found!" / "GO TO HOMEPAGE" | Store not-found page | Low | Fixed for the demo store |
    | 13 | A Swedish order "Fulfilled from Main Warehouse - FL" | Order page | Low | Fixed: where the product is stocked |
    | 14 | The header search box kept the old query after a search | Store header | Low | Fixed for a store with search |
    | 15 | An engine's filter values come from another store's sample list, and filters do not reach the store | Engine editor, step 4 | Low | Left: needs its own piece of work |
    | 16 | The store's address reads `…uat.maropost.store` | Admin, several pages | Low | Left: every store's address has this form |
    | 17 | Search rules, promo cards, banners and smart collections work in the admin but do not change the store | Merchandising | Limit | Left, and listed in the sales script under "What not to promise" |

  - **The film:** `npm run demo:video` builds the app, drives the real demo in Chrome from a
    browser with nothing stored, and writes `output/demo-video/vitaheal-demo.mp4` (1080p,
    3 min 34 s, about 12 MB, captions drawn in the page, not committed). `scripts/demo-video/record.mjs`
    holds the twelve scenes in order; `--fast` and `--only=3,4` are for checking a change. It
    films the browser's own frames and assembles them with the installed ffmpeg, so it needs no
    download.
  - **The live script:** `docs/store-builder/vitaheal-demo-script.md` (what to do and say, what
    else to show, what not to promise).

- **Preview test pass (2026-11-18).** Asked for by the human: test every flow on the deployed
  Vercel preview, as a shopper and as a merchant, and fix what breaks. Run on the branch's
  preview (commit `0ab0631c`) in a browser with nothing stored, at 1280px and 375px, with the
  store and the admin open in two tabs. Console clean throughout.
  - **Shopper, all passed:** all 25 store pages (home, six collections, eight products, pages,
    policies, account, cart) with no dead link, broken picture or sideways scroll; gallery,
    purchase options and quantity; the not-found page; the newsletter form; a cart with a
    subscription line and a one-time line of the same product; every checkout error message;
    the three sample cards (paid, bank check, declined); cancelling the bank check; a reload in
    the middle of a payment; Apple Pay and Google Pay; Click & collect; every link on the
    confirmation; the account page (wrong and right sign-in, skip, pause, resume, change plan,
    cancel, pay again after a failed payment); the chatbot (five suggested questions, seven
    wellness needs, the health caution, order by number, an unknown order, a person, nonsense);
    and the keyboard alone on the purchase options and the chat.
  - **Merchant, all passed:** every button on the store's page; add a product from the store
    page, see it in the store, delete it; a plan's discount edited and a plan paused; the
    Subscribers tabs, search and empty result; skip, pause, resume and "Charge now" on a seeded
    subscriber; the orders list and four order pages (first order, renewal, Google Pay, Click &
    collect); the store's Chatbot page, Conversations, and order tracking switched off in the
    builder; photos on the Themes page and the theme builder; "Restore original store".
  - **Across tabs, all passed without a reload:** a new product, a deleted product (its open
    page became the store's not-found page), a plan's discount, a paused plan, order tracking
    switched off, and the restore.
  - **Neelam-Store, unchanged:** no widget, its own account link, dollars, five countries, its
    prototype notes and countdown.
  - **Bugs found and fixed:**
    1. Card number, expiry and security code filled in the same instant, as a browser does with
       a saved card, kept only the last of the three. (`StorefrontCardFields.vue`; all stores.)
    2. Two cart lines of one product (once, and on a plan) had the same button names for a
       screen reader. They now name the plan. (`StorefrontCart.vue`.)
    3. The admin's drawing of the store showed a "Shop sale" link in the announcement that the
       store does not have.
    4. The store page's checklist said "Merchandising connected. Search and recommendations are
       active" for a store where it is still to do. It now says "Connect merchandising". (All
       web stores that have not connected it.)
  - **Seen and left alone** (shared with other stores, or outside this work): page titles are
    capitalised word by word ("Terms Of Service") and the not-found page reads "Sorry, This Page
    Not Found!", both from the shared storefront theme; an order is "Fulfilled from" a US
    location; the Maropay pages show the account's own name; Vercel's own toolbar button floats
    on the preview's pages (a setting in the Vercel project, not in this code).
  - **Not covered:** Safari and Firefox; a screen reader; a real uploaded product picture (the
    test product used the drawn pack shot); creating a new plan through the drawer (checked up
    to its error messages).
- **Feedback round, part 1: order fulfilment (done, 2026-11-24).** Asked for by Jaspreet after
  the demo was shared ("a view of order fulfillments", so merchants see how orders are
  processed). Branch `feature/demo-feedback-round`. It follows the live Fulfillment pages (UAT,
  account 2000290): a queue, and a page per fulfillment with the steps Pick, Pack, Pick carrier,
  Shipped.
  - **What a merchant does.** An order placed at a store's checkout gets a fulfillment at the
    top of Commerce › Fulfillment (order #20001 is FF-20001), in the order's own currency. Its
    page shows the products, the address and one next step: **Pack**, **Pick carrier** (carrier,
    service, tracking number, optional package size), **Mark shipped**, **Mark delivered**. The
    order page links to it, and "Mark fulfilled" on the orders list ships through it.
  - **What the shopper sees.** The order page on the store goes from Preparing to Shipped, with
    the carrier and tracking number, to Delivered. A label alone does not say Shipped.
  - **Two tabs.** The admin tab gets a new store order without a reload, and the store tab
    follows each step. What was done to a fulfillment is kept in the browser
    (`mp.commerce.fulfillments.v1`, by account and order) and cleared by a payments reset.
  - **Rules and tests.** `src/commerce/fulfillment.ts`; `npm run test:commerce` (21 tests: the
    steps, what the order and the shopper show, a reload, two tabs, a reset).
  - **On the live page's menu, not built here:** Print picklist, Put on hold, Split
    fulfillment, Change location, Cancel fulfillment, and notes on a fulfillment. "Print Packing
    Slips" on the queue is still only a message. Delivery is marked by hand: no carrier is called.
  - **Seen and left alone:** the 18 seeded fulfillments do not agree with their seeded orders (a
    Shipped fulfillment on a Cancelled order). On a phone the subscription page's columns run
    past the edge, as this page's did before its fix: `min-width-0` is not a class in this app.
- **Feedback round, part 2: subscription plans with delivery options (done, 2026-11-24).** Asked
  for by Rubbecca: her prototype (recording "Introducing Subscription Plans Prototype") and her
  PRD "Recurring product purchase - subscription management". Decided by the human: her plan
  model is for the new health store only (part 3), Vitaheal's plans stay as they are, and one
  plans page lists both.
  - **Two kinds of plan, one list.** A plan with delivery options ("Subscribe and save": every
    1, 2 or 3 months, each with its own discount, one selected first) beside the plan of one
    fixed delivery Vitaheal sells ("3-month supply"). Commerce › Subscriptions › Plans lists
    both, with their options, discount range and active subscribers; **New plan** offers both.
  - **The plan's own page.** Plan details (a name only the merchant sees, the label shoppers
    read, active or paused), plan options (a row per frequency: deliver every, discount,
    default, up to six), the store's products to tick (a product can be on three plans), and
    beside it the shopper preview with real prices. Leaving with changes asks first.
  - **The theme builder.** Product template › Product detail › Add block › **Purchase options**,
    offered to a store that has plans, one per product page: style (cards, radio buttons,
    dropdown), default selection (buying once, or the subscription), policy text, a
    subscription terms link, and a "Subscribe available" badge on product cards. The canvas
    draws the block with the store's own plans and prices. It applies when the theme is published.
  - **The store.** The product page reads buying once first, then the plan's label with the
    most it saves and a row per frequency; under it the policy line with "Subscription terms"
    and "My subscriptions". Cart, checkout, the order and the subscription read "Subscribe and
    save · every 2 months". On the account page the shopper changes how often it comes.
  - **How it is kept.** A plan's options are on the plan (`options`, `shopperLabel`), in the same
    list and the same browser slot as the store's other plans, so applying a theme and
    restoring a store treat it like any plan. A shopper is offered one row per option
    (`offeredRows`), which a cart line, an order and a subscription hold like any plan.
  - **Vitaheal is as it was.** Its two plans, its product pages and its film are unchanged: no
    block is seeded in its theme, and without the block a store shows cards with no policy line
    or badge. "Restore original store" removes a plan or a block added while trying this.
  - **Rules and tests.** `src/subscriptions/plans.ts`, `purchaseOptionsSettings` in
    `src/storefront/themeSections.ts`; `npm run test:subscriptions` (54) and
    `npm run test:storefront` (390). Story: Product › Storefront › StorefrontPurchaseOptions.
  - **To try it before part 3's store exists:** Plans › New plan › Plan with delivery options,
    for Vitaheal; tick Balance, Balance Refill or Nasal Strips (they are on no other plan). Then
    Vitaheal's theme builder › Product › Product detail › Add block › Purchase options › Publish.
  - **From the PRD, not built:** plans per variant and bulk assignment by collection; a
    "Subscription only" product; the subscription tag in the product list; the settings for
    what shoppers may do (skip, pause, cut-off days); cancellation reasons; the subscription
    panel on an order; the dashboard numbers; analytics events. Her status "Inactive" is
    "Paused" here, as on the rest of the page.
  - **Seen and left alone:** the richer theme drawing (Northfold, Torqline) has no purchase
    options on its product page, so the block does nothing there; those stores have no plans.
- **Feedback round, part 3: Daybloom, a health store on the Aurora look (done, 2026-11-24).**
  Asked for by Rubbecca: the demo store runs Aurora, and a health-and-supplements store needs
  its own home page, product page, collection page, mega-menu header and checkout (her
  "Health & Supplements Industry - Theme Requirements"). Decided by the human: a new store
  beside Vitaheal, on the Aurora look, named Daybloom, in US dollars; Vitaheal stays as it is.
  - **The store.** Sales channel `daybloom-demo` ("Daybloom (demo)", store #17), the fifth demo
    store and a theme in the library (store #15 and slot 5 went to Lumos, #16 and slot 6 to Aurora, in
    the theme library's parts 5 and 6). Ten made-up products by goal (Sleep, Energy, Gut health,
    Immunity, Daily wellness) and format (Capsules, Powders, Gummies), two of them bundles, at
    $19 to $75; eleven collections, each with one line under its title; seven pages (Our story,
    Quality and testing, Subscribe and save, FAQ, Shipping and returns, Contact, Accessibility)
    and four policies (with Subscription terms); three campaigns (`SLEEP15` runs); search rules
    and "Goes well with"; six subscribers; a chatbot on a profile of its own (`supplements`).
    Seeded connected to Merchandise Cloud, so search works on the first visit.
  - **The Aurora look.** Aurora's own colours, system font and 6px corners on the classic
    drawing (whose sizes are Aurora's). The classic drawing gained three things, each drawn only
    where a theme asks for it, so Vitaheal, Atlas and Neelam look as before:
    - **A mega menu.** A header link that carries a menu ("Shop", "Learn") is a button that
      opens a panel under the header: columns of links (shop by goal, by format, more ways to
      shop) and a picture tile. Opens on hover or a press; Escape, a press outside or the
      keyboard moving on closes it. In the phone menu the link opens in place.
    - **An icon row** on the home page: four promises with icons (tested, subscribe and save,
      free shipping, guarantee).
    - **Collapsible rows on the product page:** Supplement facts (the product's own table),
      How Subscribe and save works, Shipping and returns, Warnings. A collection page shows the
      collection's description under its title when it has one.
  - **Supplement facts.** A product carries a list of names and values (`detail.specs`, as a
    part's specifications do). The product editor shows them in a **Product facts** card on a
    product that has facts, or whose store's products do; the theme's row "Product facts table"
    draws them. Each Daybloom product has its size, serving size, each ingredient with its
    amount, suggested use and what it is free from; fish is named where it is.
  - **Subscribe and save, her way, seeded.** One plan with delivery options (every month 20%
    off, every 2 months 15%, every 3 months 10%) on the eight single products; the product
    template's Purchase options block opens the page on the subscription, with "Pause, skip or
    cancel any time." and the subscription terms; product cards say "Subscribe available".
  - **Checkout.** US-dollar checkout to five countries, delivery only, the address kept on the
    order. Under the consent to repeat charges: the plan's promise and **Subscription terms**
    (a new tab). The confirmation and the account page write dates the US way on this store.
  - **What a US supplements store must say.** The footer carries the statement that the
    products are not intended to diagnose, treat, cure or prevent any disease; the product
    page has the warnings; no product copy claims to treat anything; the assistant gives no
    medical advice. All of it is merchant-editable text.
  - **Rules and tests.** `src/storefront/daybloomDemo.ts`, `demoStores/daybloom.ts` (slot 7;
    the tests install into slots 10 and 11); `tests/storefront/daybloomDemo.test.ts` (18) and
    `tests/chatbot/supplementsAssistant.test.ts` (9), with the shared demo-store suite. Story:
    Product › Storefront › StorefrontHeader › ClassicWithMegaMenu. Script:
    `daybloom-demo-script.md`; QA: part 5 of `demo-stores-qa.md`.
  - **From her requirements, not built:** reviews and ratings; variant chips, quantity tiers
    and a sticky add-to-cart on the classic product page (every Daybloom product is sold in one
    size); a cart drawer and free-shipping bar; filters on the classic collection page; a
    build-your-own bundle; ingredient pages, a quiz and comparison; market switcher, languages
    and local payment marks; structured data. The mega menu's columns and picture are the
    theme's: the store's Navigation page lists only the header's five links.
  - **Seen and left alone:** the classic product page still has no variant picker, so a store
    on it should sell single-size products (Vitaheal's "From" prices are that gap).
- **Feedback round, part 4: a new store's first minutes in the back office (done, 2026-11-24).**
  Asked for by Jaspreet: the demo is "theme and storefront heavy" and leaves out onboarding in the
  back office. Decided by the human: both pieces the live product has, the store's "setup in
  progress" page and the "Launch your store" checklist.
  - **Setting up.** A store made with Create sales channel opens on its setup steps: connecting
    the Commerce Cloud account, setting up search and recommendations (when Merchandise Cloud is
    connected), building the storefront (it names the theme), setting up checkout, and putting
    the store online at its address. One step runs at a time, each saying Done, In progress or
    Waiting; the page shows nothing else, and its chip reads "Setting up". About two seconds a
    step, then "… is ready" with Show store. A reload, or another tab, shows the same step.
  - **Launch your store.** On the new store's overview, where other stores have "Finish setup":
    a location, the first product, the store's name and logo, a theme, shipping, taxes,
    payments, the store's address. Five are read from the store and say what is true now ("10
    products in this store", "Daybloom 1.0 is published", "Shoppers can pay with Stripe"), each
    with a button to where it is done. Three have nothing to read, so the merchant presses
    **Mark as done**; taxes also opens the tax categories. With all eight done: "Your store is
    ready to launch" and View store. A blank store has its first product and theme to do.
  - **What is kept.** Setup keeps nothing: it is read from when the store was made. Steps marked
    by hand are kept in this browser with the store's other data (`launch.v1`); Restore
    original store and Delete store forget them.
  - **Left as they were.** The seeded demo stores show no setup steps and keep "Finish setup"
    (Vitaheal's "Connect merchandising" starts there, as its script says). The account's own Get
    started guide is unchanged.
  - **Rules and tests.** `src/storefront/storeLaunch.ts`, `src/stores/useStoreLaunch.ts`;
    `tests/storefront/storeLaunch.test.ts` (14) and `storeLaunchApp.test.ts` (3). Stories:
    Product › Sales Channels › StoreSetupProgress and StoreLaunchChecklist. Script: "To start from
    the very beginning" in `daybloom-demo-script.md`; QA: 4.30 to 4.36b in `demo-stores-qa.md`.
  - **From the live product, not built:** shipping zones and rates, tax rates by region, a logo
    upload and a custom domain (the checklist names the steps; three are ticked by hand); the
    live setup page's failure and retry states; the checklist on the account's Get started page.
  - **Seen and left alone:** a store made from a theme shows the theme's brand to shoppers, so
    the name step says "the name your theme came with". Renaming the storefront is not built.
- **Feedback round, follow-up: Vitaheal gets the health-store features too (done, 2026-11-24).**
  Decided by the human after part 4 ("add Rubbecca's suggested missing features in Vitaheal
  also"), with two choices: everything in the look, and keep Vitaheal's two plans with her
  Purchase options block added. This replaces the earlier "Vitaheal stays exactly as it is".
  - **Header.** "Shop" opens a panel: shop by goal (Sleep, Sport, Longevity, Hydrate), more ways
    to shop, and a picture tile for the subscription. "About" opens the story, ambassadors and
    the help pages. "Subscription" is a plain link. The phone menu opens both in place.
  - **Home.** A strip of four promises under the hero: tested in Sweden, subscribe and save,
    free shipping over 549 kr, the 30-day guarantee on Unwind.
  - **Product page.** Every product has its facts (serving size, each ingredient with its
    amount in % NRV, how to take it, what it is free from, made in Sweden; the nasal strips say
    what is in the box), shown as the first of four rows under the description: Product facts,
    How subscriptions work, Shipping and returns, Warnings. Under the purchase options: "Skip,
    pause or cancel anytime.", Subscription terms and My subscriptions. Product cards on a plan
    say "Subscribe available".
  - **Collections and checkout.** Each collection says what it is for under its title. A new
    policy page, Subscription terms, is linked from the product page, the checkout's consent
    and the footer.
  - **As it was.** The two plans, their prices and discounts, the 3-month supply chosen first,
    the eight subscribers, the campaigns, search rules, chatbot, colours and type. Every number
    in the script still holds (585,90 kr; `WINTER15`).
  - **Reference files.** The tests that pinned Vitaheal's seed from before the registry were
    re-captured for this one deliberate change (`vitaheal-seed.json`: products, header, menus,
    pages, theme, collection descriptions; `vitaheal-app-head.json`: only the products' facts,
    checked). `vitahealDemo.test.ts` has four new checks.
  - **Script and film.** Steps 1, 2 and 4 of `vitaheal-demo-script.md` name the new menu, the
    line under the options and Product facts. The film's first scene opens Shop, then Sleep; all
    twelve scenes run, and the film was recorded again. `theme.jpg` was re-captured.
  - **Not raised:** Vitaheal's seed version. A browser that saved an edited Vitaheal theme keeps
    it until Restore original store, which the script starts with.
- **Feedback round, second follow-up: Vitaheal on the Lumos look (built, 2026-11-25).** Rubbecca,
  who owns the PRD, asked on 20 November that the sales demo not lead with the Aurora-like look
  ("Lumos style bare minimum"); the human chose to move Vitaheal. Daybloom keeps the Aurora look.
  - **Look.** Vitaheal is drawn on the sections drawing in the Lumos theme's look and its own
    navy: Inter, uppercase headings and buttons, corners of 4, white cards with a soft shadow, a
    pale navy tint, a 1328px page. Its badge colours and wordmark stay. Every colour pair passes
    WCAG 2.1 AA, and form fields are edged at 3:1 (checked in `vitahealDemo.test.ts`).
  - **Home.** A hero with a "Made in Sweden" badge, a second button (Subscribe and save) and
    three true figures: 20–30% saved on a plan, free shipping over 549 kr, 30 days money back on
    Unwind. The goals as a carousel, the range as a carousel, the two stories, and the promises
    as cards. The newsletter moved to a footer column; the legal links to the footer's bottom row.
  - **Kept on the new drawing.** The mega menu (Shop and About, in place on a phone), the plans
    and Purchase options with "Add subscription to cart", the facts and rows (with the
    description now an open row first), the collection lines, the WINTER15 bar, whole kronor on
    pages and "585,90 kr" when charged, checkout consent and terms, the account, chat, and
    Merchandise Cloud search as a header field once connected.
  - **New on the product page and cards.** It opens on the lowest-priced choice, with a quantity
    and a stock line. Boxed cards say "Subscribe available", and quick add offers the plans.
  - **Theme library.** Version 2.0, "Vitaheal 2.0" in the admin, with a new card text.
  - **Reference files.** `vitaheal-seed.json` was recaptured a second time, for its look only
    (`themeStyles`, `theme`, `chrome`, and `admin` for the theme's name); a script checked that
    products, plans, campaigns, search rules, chatbot, pages and subscribers stayed byte-identical.
    `themeVars.test.ts` moved Vitaheal off the classic list.
  - **Script and film.** The plan with delivery options is now step 8 of
    `vitaheal-demo-script.md`, after the subscriber, and a scene of its own in the film: the film
    shows every step but the theme library. Steps 1 and 12 name the new home and the header's
    search field.
  - **Not raised:** the seed version, again. A browser that saved an edited Vitaheal theme keeps
    the classic look until Restore original store; the Themes page and Settings now say so, with
    the Restore action. `theme.jpg` was captured again from the new look.
  - **Reviews (2026-11-25).** Three reviewers (shopper, merchant, code), each serious finding
    re-checked by a skeptic; every confirmed one is fixed:
    - a subscription's price follows the format it was bought on, so Change plan on a dearer
      format no longer drops to the cheapest one (`contractUnitPrice`), and the account and admin
      name the format;
    - the store page and Themes previews show the header search only once the store can search
      (`canSearch` in `src/storefront/storeSearch.ts`, shared with the storefront);
    - the plan editor's shopper preview follows the theme's default selection, and every plan
      option field is named after its row;
    - a theme row can be shown only on products sold on a plan (`plansOnly`); Vitaheal's "How
      subscriptions work" uses it;
    - Vitaheal's orders ship from a Swedish warehouse, and the order's fulfilment chip follows its
      fulfilment;
    - phones: the hero headline below 375px, quick add's subscription button, the account
      card's name; the canvas's "From" price and stats; hints on the three new toggles; and
      accessible names for the search page's own field and "View all".

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

### S5 notes

S5 has not started for the Vitaheal store. Its variant picker was built ahead of the slice for the
Northfold (demo) clothing store (store themes, part 2, branch `feature/demo-stores-themes`, 2026-11-20).
It draws only on themes with `drawing: 'sections'`, so Vitaheal's product page is unchanged.

- **Already there when S5 starts:** `StorefrontVariantPicker` (one fieldset per option, real
  radios, colour swatches with the chosen name in the legend, size buttons, sold-out values struck
  through but selectable with "Sorry, L is sold out", "Only 2 left in M", `validate()` for
  "Select a size"); the choice in the URL (`?color=sand&size=m`); a gallery that follows the colour
  (`detail.imagesByColor`); "Size M · Sand" on cart, checkout and order lines; product cards with
  colour dots, the sale price and quick add; Buy now.
- **Still open for Vitaheal (T37):** its product page still sells the lowest-priced variant, and its
  plans price from it.

## Requirements

| ID | Requirement | Slice | Prototype status | Note |
|---|---|---|---|---|
| T01 | Announcement bar | S2 | partial | Single-message bar, above the header on every page of the Vitaheal store (demo pass). Open: rotating messages, link, dismiss |
| T02 | Header over hero | S2 | not started | |
| T03 | Dropdown navigation | S2 | partial | A mega menu on the classic drawing: a header link with a panel of link columns and a picture tile, on Daybloom (feedback round, part 3); on Vitaheal since its follow-up, and on the sections drawing since 2026-11-25. Open: the panel's links edited in Navigation (menus are still flat) |
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
| T19 | Collection page | S1 | partial | The classic page shows the collection's description under its title (feedback round, part 3); filters, sort and quick add on the sections drawing. Open: a goal banner with a photo, filters on the classic page, a buying guide under the grid |
| T20 | Account pages | S8 | partial | The subscriptions page only (demo pass, part 5) |
| T21 | Theme settings | S0 | partial | Figtree and Inconsolata, navy scheme, 8px buttons and the three badge colours are theme settings, with a Badges group in the Styles tab. Open: custom hex colours, border colour, accent font |
| T22 | Video hero | S3 | partial | A photo hero with headline, subheadline and button (demo pass). Open: video, poster, overlay setting |
| T23 | Image with text | S3 | partial | Section drawn on the storefront with a seeded photo, placeholder in the builder (demo pass). Open: image picker, registry (S1) |
| T24 | Tabbed collections | S3 | not started | |
| T25 | Logo slider | S3 | not started | |
| T26 | Overlapping images story | S3 | not started | |
| T27 | Page hero banner | S1 | not started | |
| T28 | Text and divider | S3 | not started | |
| T29 | Icons row | S3 | partial | The icon row section on both drawings: up to four promises with an icon, a title, a line and a link (Northfold, Torqline; Daybloom on the classic drawing, feedback round part 3). Open: certification badge images |
| T30 | FAQ accordion | S3 | not started | |
| T31 | Mosaic and quote grid | S3 | not started | |
| T32 | Instagram feed | S3 | not started | |
| T33 | Newsletter signup | S1 | not started | Section seeded on the Vitaheal home; the storefront does not draw it yet |
| T34 | Media gallery | S5 | partial | Large photo with a thumbnail strip, two photos per product (demo pass). Open: zoom lightbox, badge over the image, video |
| T35 | Rating stars | S5 | not started | |
| T36 | Subtitle, badges, chips | S5 | partial | Subtitle shows on the card and the product page (S0) |
| T37 | Button variant picker | S5 | partial | Built for Northfold (demo) on the sections drawing (store themes, part 2): colour swatches and size buttons as real radios, sold-out sizes struck through, "Only 2 left in M", the choice in the URL. Vitaheal's page still sells the lowest-priced variant |
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
| P01 | Subscription plans | S7 | partial | Plans with interval, units per delivery and discount, edited in Commerce › Subscriptions › Plans; bought through checkout with consent; order tagged (demo pass, part 3). Plans with delivery options, each with its own discount, on a page of their own, and a Purchase options block in the theme builder (feedback round, part 2). Open: per-variant attachment, contracts (S8) |
| P02 | Recurring billing | S8 | partial | A subscription per plan line, charged by hand ("Charge now") into a renewal order (demo pass, part 5). Open: a scheduler, "Run renewals due today", the 1, 3, 7 day retry schedule |
| P03 | Subscriber portal | S8 | partial | `/account`: skip, pause, resume, change plan, cancel with a reason, pay again (demo pass, part 5). Open: reschedule, swap flavour, update payment method |
| P04 | Subscription pricing rules | S7 | partial | Percentage discount per plan and a free-shipping flag shown as a badge (demo pass, part 3). Open: the flag changing a shipping charge (needs rates, S10) |
| P05 | Subscription messages | S8 | not started | |
| P06 | Market currencies and prices | S9 | not started | Groundwork in S0: one currency and locale per store |
| P07 | Market URLs | S9 | not started | |
| P08 | Languages | S9 | not started | |
| P09 | Shipping zones and rates | S10 | not started | |
| P10 | VAT per country | S9 | not started | |
| P11 | Payment methods | S9 | not started | |
| P12 | Checkout | S9 | not started | Groundwork in the demo pass, part 4: countries, sample shopper and money format follow the store's currency (`checkoutProfile.ts`) |
| P13 | Structured product content | S4 | partial | A table of facts per product (names and values), edited on the product and shown in a collapsible row ("Supplement facts"), with theme rows for warnings, delivery and the subscription (feedback round, part 3). Open: %NRV columns, allergens in bold, ingredient cards, certificates |
| P14 | Catalog basics | S0 | done | A product can be added to the store from the admin, with pictures, and is kept across reloads (demo pass, part 2). Eight products, 14 variants with SKU, weight and one compare-at price, five collections, all in the admin and on the Vitaheal storefront only |
| P15 | Add-on discount | S5 | not started | |
| P16 | Returns and guarantee | S14 | not started | Guarantee terms page seeded |
| P17 | Reviews | S11 | not started | |
| P18 | Customer accounts | S8 | partial | Mocked passwordless sign-in (email, then any 6-digit code) and a subscriptions page (demo pass, part 5). Open: orders, order detail, addresses |
| P19 | Back-in-stock alerts | S14 | not started | |
| P20 | Email, SMS and signup forms | S14 | not started | |
| P21 | Pixels and attribution | S12 | not started | |
| P22 | Consent management | S12 | not started | |
| P23 | Helpdesk | S14 | not started | |
| P24 | SEO and structured data | S13 | not started | SEO title and description seeded on products, pages and posts |
| P25 | Order tracking and dispatch | S10 | partial | A fulfillment per store order, worked step by step (pack, carrier and tracking number, shipped, delivered); the shopper's order page follows (feedback round, part 1). Open: carrier rates and labels from a real carrier, tracking events, emails, returns |
| P26 | Agentic commerce endpoints | S16 | not started | To be recorded as out of scope in S16 |
| P27 | Migration | S15 | not started | |
| P28 | Pre-orders | S14 | not started | |
