# Demo stores and the theme library

For developers working on the demo stores, the theme library, Apply, Restore, Start from a theme
and Delete store. It says where each piece lives, what the browser keeps, and how to add a store.
QA checks are in [demo-stores-qa.md](demo-stores-qa.md). The walkthroughs for sales are the six
demo scripts listed below.

## The six demo stores

Each demo store is a web store on account `2000290`, seeded when the app starts. Each one is also a
theme in the library, named after the store.

| Store | Channel id | Store # | Theme | Sells | Currency | Script |
|---|---|---|---|---|---|---|
| Vitaheal (demo) | `vitaheal-demo` | 12 | Vitaheal | Supplements, on subscription plans | SEK (`sv-SE`) | [vitaheal-demo-script.md](vitaheal-demo-script.md) |
| Northfold (demo) | `northfold-demo` | 13 | Northfold | Women's and men's clothing in sizes and colors | USD | [northfold-demo-script.md](northfold-demo-script.md) |
| Torqline Auto Parts (demo) | `torqline-demo` | 14 | Torqline | Auto parts with vehicle fitment | USD | [torqline-demo-script.md](torqline-demo-script.md) |
| Lumos Home (demo) | `lumos-demo` | 15 | Lumos | Furniture, lighting and decor, in fabrics and finishes | USD | [lumos-demo-script.md](lumos-demo-script.md) |
| Aurora Outdoor (demo) | `aurora-demo` | 16 | Aurora | Outdoor clothing and footwear for women and men, packs and accessories | USD | [aurora-demo-script.md](aurora-demo-script.md) |
| Daybloom (demo) | `daybloom-demo` | 17 | Daybloom | Supplements by goal and format, on a plan with delivery options | USD | [daybloom-demo-script.md](daybloom-demo-script.md) |

| Store | Blueprint id | Slot | Products (home ids) | Photos | Fonts | Drawing | Chatbot profile |
|---|---|---|---|---|---|---|---|
| Vitaheal | `vitaheal` | 2 | 16 (2001-2016) | `public/storefront/vitaheal/` | Inter | sections | `wellness` |
| Northfold | `northfold` | 3 | 20 (3001-3020) | `public/storefront/northfold/` | Instrument Serif, DM Sans | sections | `apparel` |
| Torqline | `torqline` | 4 | 21 (4001-4021) | `public/storefront/torqline/` | Barlow Condensed, Barlow | sections | `auto-parts` |
| Lumos | `lumos` | 5 | 20 (5001-5020) | `public/storefront/lumos/` | Inter | sections | `home` |
| Aurora | `aurora` | 6 | 20 (6001-6020) | `public/storefront/aurora/` | Source Serif 4, system-ui | sections | `apparel` |
| Daybloom | `daybloom` | 7 | 10 (7001-7010) | `public/storefront/daybloom/` | system-ui (Aurora's) | classic | `supplements` |

"Drawing" is how the storefront draws the theme. A theme whose styles say `drawing: 'sections'`
gets the richer storefront: header and footer settings, page templates, filters, quick add, the
variant picker and size guide, the vehicle selector on a store that sells parts, and the wishlist
when the header has its tool
([storefrontContext.ts](../../src/views/Storefront/storefrontContext.ts)). Daybloom is on the classic
drawing; Vitaheal moved to the sections drawing on 2026-11-25 (below).

Daybloom is the Aurora look: the classic drawing in Aurora's own colours and type. The classic
drawing draws three things for a theme that asks for them, so Atlas and Neelam, which do not,
look as before:

- **a mega menu**: a header link that carries a `menu` (`StorefrontNavLink` in
  [useStorefront.ts](../../src/stores/useStorefront.ts)) opens a panel of link columns with a picture
  tile ([StorefrontHeader.vue](../../src/views/Storefront/StorefrontHeader.vue)); in the phone menu it
  opens in place;
- **an icon row** on the home page (the `icon-row` section, drawn by the sections drawing's own
  component);
- **collapsible rows** on the product page (the `collapsible-row` block), among them a **Product
  facts table** filled from the product's `detail.specs` (a supplement's facts). The product editor
  shows a **Product facts** card on a product that has facts, or whose store's products do.

Daybloom also seeds what the subscriptions part of the feedback round added: a plan with delivery
options, and the product page's **Purchase options** block.

**Vitaheal has the same features since 2026-11-24**, in its own colours and type: a mega menu
("Shop" and "About"), a strip of four promises on the home page, facts on every product with
four rows under the description, a line under each collection's title, the subscription terms as
a policy page, and the Purchase options block. Its two plans of one fixed delivery, its prices
and its eight subscribers are as they were, and the 3-month supply is still chosen first.
Vitaheal's `seedVersion` was not raised for this (raising it writes a key in every browser on
the next start): a browser that had saved an edited Vitaheal theme kept that theme, without the
strip and the rows, until **Restore original store**, which every script starts with. Since
2026-11-25 the seed version is 2, so such a browser is seeded again on its next start
([Sixteen products](#sixteen-products-rubbeccas-second-review-2026-11-25)).

### Vitaheal on the Lumos look (feedback round, 2026-11-25)

**Why.** Rubbecca, who owns the PRD, asked on 20 November that the sales demo not lead with the
Aurora-like look, and suggested "Lumos style bare minimum". So Vitaheal moved from the classic
drawing to the sections drawing, in the Lumos theme's look, while Daybloom keeps the Aurora look on
the classic drawing.

**What changed** (all in [vitahealDemo.ts](../../src/storefront/vitahealDemo.ts)):

- **Styles:** `drawing: 'sections'`, Inter for headings and text, uppercase headings at weight
  500 and uppercase buttons, corners of 4, white cards of radius 8 with a soft shadow, a near-white
  surface and a pale navy tint, a 1328px page with 56px gutters, 64px hero and 32px section titles,
  and form fields edged at 3:1. The contrast pairs are checked in
  [vitahealDemo.test.ts](../../tests/storefront/vitahealDemo.test.ts).
- **Header and footer:** Inline, sticky and light in every template; a search field
  (`headerSearch: 'field'`, "Search supplements") that shows once the store is connected to
  Merchandise Cloud; a tagline, the newsletter as a footer column, and the legal links (privacy,
  terms, cookies) in the footer's bottom row. The Shop column gained **All products**, because the
  sections footer's column headings are not links. The mega menu ("Shop" and "About") is drawn by
  the sections header too, and opens in place in its phone drawer.
- **Home:** a hero with a **Made in Sweden** badge, a second button (**Subscribe and save**) and
  three figures that are the store's own facts (what a plan saves, free shipping over
  549 kr, 30 days to try Unwind); the goals as a carousel on the tint; the range as a carousel; the
  two stories; the promises as centred cards. The home page's rich text and newsletter sections
  were dropped: the footer column carries the sign-up on every page. The hero has Lumos's words on
  the left: navy on a white wash, with **one job well** in the brand colour. White words over the
  photo's bright mist read at 1.4:1 to 2.6:1, so `hero.jpg` was re-cropped from the same Unsplash
  photo with the runner three-quarters across, past the wash.
- **Product page:** the Purchase options block first, then a **Description** row (open), then the
  four rows as before. The product detail opens on the lowest-priced choice and shows a quantity
  selector and a stock line (`preselectVariant`, `quantity`, `stockLine`), and draws no reviews.
- **Collection page:** boxed cards four to a row, with quick add (it offers the plans), sort and a
  price filter (every product is the same brand and kind, so price is the filter that helps).
- **Theme library:** the theme is version 2.0 ("Vitaheal 2.0" in the admin), with a new card
  text. `capabilities.variantPicker` is now true: the sections product page lets the shopper pick
  a format or flavour.

**What stays:** the navy, the badge colours (violet sale, lime **Subscribe available**, black sold
out) and the wordmark; the products, plans, prices (whole kronor on the pages, "585,90 kr" where an
amount is charged), campaigns (the WINTER15 bar), search rules, chatbot, pages, subscribers and
every section and block id; checkout's consent and terms, the account with subscriptions and
orders, and chat.

**Seed version.** It stayed 1 for the move, so a browser that saved an edited Vitaheal theme
before it kept the classic look until **Restore original store**. The Themes page and Settings ›
Store data say so when a demo store runs an older edited copy of its own theme. Later the same day
the seed version went to 2 for the sixteen products (below): such a browser is seeded again on its
next start, so it gets the new look too, and that note has nothing left to show for Vitaheal.

**Added with it, for any store:** a theme row can be shown only on products sold on a plan
(`plansOnly` on a collapsible row); a subscription keeps the price of the format it was bought
on when the shopper changes plan (`contractUnitPrice` in `src/subscriptions/contracts.ts`); and
whether a store can be searched is one rule (`canSearch` in `src/storefront/storeSearch.ts`) that
the storefront and the admin's previews share.

### Sixteen products (Rubbecca's second review, 2026-11-25)

**Why.** Rubbecca reviewed the demo again on 25 November. She asked for more products ("a few
refill bags or general supplements"), and found that a product or collection opened scrolled to
the bottom of its page.

**The products** (in [vitahealDemo.ts](../../src/storefront/vitahealDemo.ts)). Eight more, after
Balance. Their variants number from the product, as the first eight's do (`productId * 10 + n`).

| Id | Product | Choice (Format) | Price (kr) | Goals |
|---|---|---|---|---|
| 2009 | Plant Protein | Can / Refill bag | 399 / 369 | Sport, Subscription |
| 2010 | Daily Greens | Can / Refill bag | 449 / 429 | Longevity, Subscription |
| 2011 | Vitamin D3 + K2 | none | 199 | Immunity |
| 2012 | Omega-3 | none | 329 | Longevity |
| 2013 | Magnesium | none | 229 | Sleep, Sport |
| 2014 | Creatine | Can / Refill bag | 299 / 279 | Sport, Subscription |
| 2015 | Vitamin C + Zinc | none | 179 | Immunity |
| 2016 | Daily Multi | none | 249 | Immunity |

- **Plans.** The plans read the Subscription collection, so both now take eight products
  (2001, 2002, 2003, 2005, 2006 and the three powders, 2009, 2010, 2014). Their cards say
  **Subscribe available**. The capsules and tablets are bought once.
- **Refill bags.** The bag is the cheaper format, so the card reads "From" its price and the page
  opens on it (`preselectVariant`). A shopper who links to the can still gets the can.
- **A sixth goal, Immunity** (collection 28, with a line under its title): last in the Shop panel's
  "Shop by goal", before Subscription in the footer's Shop column, and a fifth **Shop by goal** tile
  (`tile-immunity.jpg`). The goals now hold Subscription 8, Sport 6, Longevity 6, Sleep 3, Hydrate 1
  and Immunity 3 products.
- **Our range** shows twelve: the first eight, then Plant Protein, Daily Greens, Vitamin D3 + K2
  and Omega-3. The featured products section's **Products** slider now runs 2 to 12 for every
  store ([themeSections.ts](../../src/storefront/themeSections.ts)), and
  [FeaturedProducts.vue](../../src/views/Storefront/sections/FeaturedProducts.vue) stops at 12. Every
  other store asks for 8 or fewer, so nothing else moves.
- **Search.** A one-way synonym (`vh-syn-immune`): immune, cold, flu and winter lead to immunity.
  Magnesium's copy talks about tiredness, so "tired" now finds it without a synonym, and "sleep"
  finds it after Unwind and Nasal Strips.
- **Photos.** Two per product and the tile, in `public/storefront/vitaheal/`, each with a
  `CREDITS.md` row. `theme.jpg` stays: the store's first screen did not change.

**The chat** ([assistantProfiles.ts](../../src/chatbot/assistantProfiles.ts),
[storeAssistant.ts](../../src/chatbot/storeAssistant.ts)). The wellness profile has five more
needs:

| Need | Asked as | Suggests |
|---|---|---|
| immune support | "I keep catching colds", flu, "for the winter", zinc, vitamin D | Vitamin C + Zinc, Vitamin D3 + K2, Daily Multi |
| muscle and strength | protein, creatine, "build muscle", lifting weights | Plant Protein, Creatine |
| heart and brain | heart, omega-3, fish oil | Omega-3 |
| everyday vitamins | multivitamin, "vitamins and minerals" | Daily Multi, Vitamin D3 + K2, Vitamin C + Zinc |
| greens and fibre | greens, superfoods, vegetables, fibre | Daily Greens |

- A cold drink, a winter delivery or "What strength is Magnesium?" is no need: those words count
  only in a phrase like the ones above.
- "Protein after the gym" asks for muscle and strength only. The gym is when, not what. "I run and
  lift weights" asks for both needs.
- "Something for women" now matches Balance by its own word, "blend" (it read "month", which
  Vitamin D3 + K2's "For the dark months" also has). It still answers Balance, then Balance Refill.
- "I can't sleep" answers Unwind and Magnesium, because Magnesium is in the Sleep goal.
- **Refills.** A question about whether there is a refill (`refills.says` and `refills.asks` on
  the profile) is answered from each product's own choices (Refill, Refill bag, Bag) and from a
  product named "… Refill". "Do you sell refills?" names the eight that come in one, the newest
  first, with three cards. "Is there a refill bag for the protein?" names Plant Protein and its
  Refill bag. A product without one gets "No" and the names of those that have one, as text. A
  sold-out refill is said to be sold out. Any other refill question ("Are the refill bags
  recyclable?", "How do I refill the can?"), and returning or subscribing to a refill, goes to the
  store's pages, as before.
- A request that names no need ("What should I buy?", "What would you recommend I buy?") is
  matched without the words that ask for a suggestion and the words around them
  (`requestWordsIgnored`). So it asks what the shopper needs instead of matching product copy.
- Immune support takes a cold the shopper has or wants to avoid ("anything for a cold?", "I keep
  catching colds"), not a cold drink or cold hands, and winter, but not a delivery over the winter
  holidays. "Tired" now leads to steady energy, where Magnesium's "tiredness" puts it first.
- **Medical caution.** A shopper who names a condition or a medicine (a heart condition, blood
  thinners, warfarin, chemo, kidney problems, being immunocompromised…) gets the "I can’t give
  medical advice" answer before any need is matched. This caution is shared with Daybloom, so
  Daybloom gets it for those messages too.
- The help line now names protein and immune support.
- Daybloom's profile turns `refills` and `requestWordsIgnored` off. Apart from the wider medical
  caution, its answers and the other stores' are unchanged.

**Seed 2.** Vitaheal's `seedVersion` is 2
([demoStores/vitaheal.ts](../../src/storefront/demoStores/vitaheal.ts)), the first blueprint to
raise it. The others stay at 1. On the next start, every store that runs the Vitaheal theme and
recorded seed 1, or no seed, is seeded again and records seed 2 (`reseedStale`). That is the home
store in a browser that used it before, a store that had Vitaheal applied, and a store made from
it. So a reviewer who opened the store before gets the sixteen products on their next visit.

| Dropped | Kept |
|---|---|
| Changes to products, plans and store campaigns. | Orders, and each fulfilment's progress (`mp.commerce.fulfillments.v1`). |
| Search rules added or changed (a `knackered` synonym). | Subscribers, new ones included. |
| Chatbot settings. | Chats. |
| Changes to the store's own theme. | Campaign announcement emails. |
| Products a merchant added to this store only. | Whether the chatbot is on. |
| | The Merchandise Cloud connection. |
| | The cart, with no "store changed" notice. |
| | Theme copies. |

Worth knowing:

- A copy of the theme that was published goes back to a Draft, and the store runs Vitaheal 2.0
  again.
- Winter wellness week forgets the email it was announced with. The email stays in Marketing.
- A store that applied the Vitaheal theme at seed 1 loses its changes the same way.
- A tab that was already open when another tab ran the reseed follows it when the saved slots go,
  but from its own code. A tab still running the build from before the new range seeds the eight
  products again, and anything it then saves (a product, a plan, the theme, a search rule) is saved
  over seed 2: every tab follows it, and a reload does not seed it again. Only **Restore original
  store** does. So close every tab of the old build before restoring.

So the first start in any browser, an empty one too, now writes one key:
`mp.vitaheal-demo.installed.v1`, `{ "blueprintId": "vitaheal", "seedVersion": 2, "appliedAt": … }`.
It names the store's own theme, so no theme counts as applied (the Themes page shows no "Copied
from"). A restore clears it and writes it again at once. A browser at seed 2 is not seeded again:
what it saved is read back.

**Fixed with it, for every store: a page opens at its top**
([src/router/scroll.ts](../../src/router/scroll.ts), the router's `scrollBehavior`). The router had
no scroll rule, so a page opened where the last one was scrolled to. Now:

- A storefront page opened from another page starts at its top: a route named `Storefront…`, on a
  new path.
- Back and Forward return to where the page was, on every page.
- A filter, a sort or a product's choice changes only the address's query, so the page keeps its
  place.
- Admin pages are unchanged: a link in the admin leaves the window where it is.

## What a theme is

A theme in the library is a whole store, not only a look. It is a **blueprint**: plain data that
builds everything a store holds. Applying a theme to a store makes that store a copy of the theme's
seed (not of the showcase store as it is now):

- its look: theme styles and the home, product, collection and cart templates;
- its products (with variants, fitment and size chart links), collections, menus, pages and blog
  settings, header and footer;
- its campaigns, search rules (synonyms, redirects, pinned results) and recommendation engines;
- its chatbot settings and the assistant profile the chatbot answers with;
- its subscription plans, size charts and checkout profile;
- its currency and locale.

Do not confuse the library with the store's own themes. The **Themes installed** table on a
store's Themes page lists `StoreTheme` records
([useStoreThemes.ts](../../src/stores/useStoreThemes.ts)): the theme the store runs, published, and
any drafts or copies made from it.

## Where the code is

| File | What it holds |
|---|---|
| [demoStores/types.ts](../../src/storefront/demoStores/types.ts) | The types: `DemoStoreId`, `DemoStoreBlueprint`, `StoreSnapshot`, `StoreHistory`, `StoreBlueprintRef`, `InstallContext`, `ThemeCard`, `StoreCapabilities`, `AdminFacts`, `SizeChart`. |
| [demoStores/index.ts](../../src/storefront/demoStores/index.ts) | `DEMO_STORES` (the library, in order), `isDemoStoreId`, `demoStoreFor(id)`, `homeBlueprintOf(channelId)`, `isDemoChannelId`, `canApplyTheme(channel)`. |
| [demoStores/install.ts](../../src/storefront/demoStores/install.ts) | The id blocks (`contextFor`, `INSTALL_ID_FLOOR`, `MERCHANT_PRODUCT_ID_FLOOR`, `nextMerchantProductId`), `snapshotFor(channel, blueprintId, today)`, `historyFor`, the `installed` record (`installedSlot`, `readInstalled`, `writeInstalled`, `clearInstalled`), `currentBlueprintId` and `isSeedStale`. |
| [demoStores/summary.ts](../../src/storefront/demoStores/summary.ts) | The words every screen uses: `applySummary`, `restoreSummary`, `restoreParts`, `startSummary`, `themeFacts`, `currencyName`, `countWord`. |
| [demoStores/vitaheal.ts](../../src/storefront/demoStores/vitaheal.ts), [northfold.ts](../../src/storefront/demoStores/northfold.ts), [torqline.ts](../../src/storefront/demoStores/torqline.ts), [daybloom.ts](../../src/storefront/demoStores/daybloom.ts) | The four blueprints. Their data is in [vitahealDemo.ts](../../src/storefront/vitahealDemo.ts), [northfoldDemo.ts](../../src/storefront/northfoldDemo.ts), [torqlineDemo.ts](../../src/storefront/torqlineDemo.ts) and [daybloomDemo.ts](../../src/storefront/daybloomDemo.ts). |
| [createdStores.ts](../../src/storefront/createdStores.ts) | Stores made with Create sales channel: `CREATED_STORES_KEY`, `FIRST_CREATED_SLOT`, `MAX_STORE_SLOT`, `readCreatedStores`, `writeCreatedStores`, `nextStoreSlot`, `storeKeys`. |
| [demoStorage.ts](../../src/storefront/demoStorage.ts) | Storage keys: `DEMO_STORAGE_PREFIX`, `channelStoragePrefix`, `demoSlot`, `demoSlotFor`, `StorageLike`. |
| [demoKeep.ts](../../src/stores/demoKeep.ts) | How a Pinia store keeps its part in the browser: `browserStorage`, `keepInBrowser`, `keepPerChannel`. |
| [useDemoStores.ts](../../src/stores/useDemoStores.ts) | The orchestrator: `blueprintOf`, `snapshotOf`, `canApply`, `attach`, `apply`, `restore`, `isCreated`, `create`, `remove`, `applyPreview`, `restoreFacts`, `restorePreview`. |
| [StoreRestoreDialog.vue](../../src/components/saleschannels/StoreRestoreDialog.vue) | The one "Restore original store" confirm and toast, used by the Settings tab and the Themes page. |
| [theme-thumbnails.mjs](../../scripts/theme-thumbnails.mjs) | Captures each theme's thumbnail (see [Thumbnails](#thumbnails)). |

Everything under `src/storefront/` is pure TypeScript with relative `.ts` imports, so
`npm run test:storefront` runs it in Node.

## A blueprint's fields

| Field | What it is |
|---|---|
| `id` | `'vitaheal'`, `'northfold'`, `'torqline'` or `'daybloom'` (`DemoStoreId`). |
| `slot` | The home channel's slot (2-9). It is also the blueprint's digit in installed ids. |
| `seedVersion` | Bump it when the seed changes. A browser that saved data from an older seed then reseeds that store on the next start (`isSeedStale`, `reseedStale`). |
| `homeChannel` | The showcase store: the seeded `SalesChannel`, with `webStore.blueprint` set. |
| `admin` | What the store's own admin page says: revenue, the theme name, business facts, the audience list and email a campaign is announced with, the time zone. Never cloned. |
| `photoDir` | Where the photos are, as the browser asks for them: `/storefront/<slug>`. |
| `capabilities` | `subscriptions`, `variantPicker`, `sizeGuide`, `vehicleFitment`. For docs, tests and the theme card: features switch on from the data itself. |
| `card` | How the theme shows in the library: `name`, `version`, `kind`, `description`, `thumbnail` (`<photoDir>/theme.jpg`). |
| `packShot` | The drawing a product saved without photos gets (`garment`, `box`). Absent: a can. |
| `legacyHomeIds` | Vitaheal only: the variant and collection ids it had before the id blocks existed. |
| `build(ctx)` | Returns the `StoreSnapshot` for one store: theme, market, products, collections, chrome, menus, content, blog settings, campaigns, merchandising, chatbot, plans, size charts and checkout. |
| `history(ctx)` | What happened before the demo: subscriptions and earlier chats. Seeded on the home channel only, never cloned. |

`snapshotFor(channel, blueprintId, today)` builds a snapshot once per store, blueprint and day and
hands every caller its own deep copy, so a caller may put it straight into reactive state.

## Which stores can take a theme

A store can take a theme when its record has `webStore.blueprint = { original, slot }`
(`canApplyTheme`). `original` is the blueprint it started from, or `null` for a store that started
blank. `slot` numbers the store in the id blocks.

| Slot | Store |
|---|---|
| 2, 3, 4, 5, 6, 7 | Vitaheal, Northfold, Torqline, Lumos, Aurora, Daybloom (their home channels) |
| 8-9 | Kept free for the demo stores added later |
| 10-99 | Stores made with Create sales channel and Store Builder on (`FIRST_CREATED_SLOT` to `MAX_STORE_SLOT`, given by `nextStoreSlot`) |

Every other store has no `webStore.blueprint` and never gets one. These must never change, whatever
is applied or restored elsewhere:

| Store | Channel id | What it is |
|---|---|---|
| Neelam-Store (#9) | `neelam-store` | Mirrors the real UAT store #9. |
| Atlas Outfitters | `retest-sales-notification` | Maropay's primary store in its scenarios, and the Merchandising default. |
| Beta Sales Channel | `beta-sales-channel` | A seeded Store Builder store. |
| Max Test Store | `max-test-store` | A seeded web store without Store Builder. |
| Fashion Boutique | `shopify-fashion` | A Shopify store. |
| Home & Living Shopify | `shopify-home-sync` | A Shopify store. |
| POS Store, Mall Kiosk POS | `pos-store`, `mall-kiosk-pos` | Offline stores (POS). |

The demo stores' home channels sit last in the seeded list, and created stores are appended after
them, so earlier positions (Atlas first) keep deciding the "primary store" in Maropay. The tests
"the other stores are no demo store" in
[demoStoresApp.test.ts](../../tests/storefront/demoStoresApp.test.ts) and "no other store can take a
theme" in [themeSwap.test.ts](../../tests/storefront/themeSwap.test.ts) check that none of them can
be applied to or restored, and that nothing of theirs changes.

## Id blocks

Ids are unique by construction: one block per store and blueprint
([install.ts](../../src/storefront/demoStores/install.ts)).

| Where | Products | Variants | Collections |
|---|---|---|---|
| Vitaheal on its home channel | 2001-2016 | `productId * 10 + n` (20011...) | 23-28 |
| Northfold, Torqline, Lumos, Aurora, Daybloom on their home channel | `slot * 1000 + n` (3001..., 4001..., 5001..., 6001..., 7001...) | `productId * 100 + n` | `slot * 1000 + 900 + n` (3901..., 4901..., 5901..., 6901..., 7901...) |
| A blueprint installed on store slot 2-9 | `storeSlot * 10000 + blueprintSlot * 1000 + n` (Torqline on Vitaheal: 42001...) | `productId * 100 + n` | product base `+ 900 + n` |
| A blueprint installed on store slot 10-99 | the same, plus 1,000,000 | `productId * 100 + n` | the same, plus 1,000,000 |
| A product a merchant creates | 100001 and up (`nextMerchantProductId`) | | |

Every installed id is at least `INSTALL_ID_FLOOR` (20000). The first store made from Torqline (slot
10) has products 1104001-1104021. String ids (sections, menus, pages, campaigns, rules, plans) take
`ctx.prefix`: the blueprint id at home, `<channelId>--<blueprintId>` elsewhere (the theme of
`test-garage` running Torqline is `theme-test-garage--torqline`).

An id kept by history (a subscription to product 2001) points at nothing after another theme is
applied, never at another store's product. Every link inside a blueprint (theme sections, menus,
chrome, pages, chatbot, search pins) is built from the products that blueprint creates, so links
follow the ids. [demoStores.test.ts](../../tests/storefront/demoStores.test.ts) checks that every
link resolves on every install.

## What the browser keeps

### Per store, in localStorage

Each store keeps its parts under its own prefix (`channelStoragePrefix`):

- Vitaheal: `mp.vitaheal-demo.` (the prefix it always had, so older saved data stays readable).
- Every other store, created ones too: `mp.demo-store.<channelId>.` (a bare `mp.<id>.` could land
  on an app key such as `mp.maropay.`).

The key is `<prefix><name>.v<version>`. A part saves only a real change: a store nobody has touched
writes nothing and keeps following its seed.

| Key name | Kept by | What it holds | Apply | Restore |
|---|---|---|---|---|
| `installed.v1` | [install.ts](../../src/storefront/demoStores/install.ts) | The theme applied: `{ blueprintId, seedVersion, appliedAt }`. Absent: the store runs what it started with. On Vitaheal it is there from the first start and names Vitaheal itself: it records the seed the store holds (2). | Written first | Cleared first (on Vitaheal, written again at once) |
| `products.v1` | [useCommerce.ts](../../src/stores/useCommerce.ts) | The store's products. | Replaced | Replaced |
| `size-charts.v1` | [useSizeCharts.ts](../../src/stores/useSizeCharts.ts) | Size charts. | Replaced | Replaced |
| `themes.v1` | [useStoreThemes.ts](../../src/stores/useStoreThemes.ts) | The store's themes: edits, copies and drafts. | Theme replaced, drafts kept | Drafts and copies removed |
| `campaigns.v1` | [useStoreCampaigns.ts](../../src/stores/useStoreCampaigns.ts) | Store campaigns and their codes. | Replaced | Replaced |
| `merchandising.v1` | [useMerchandising.ts](../../src/stores/useMerchandising.ts) | Synonyms, redirects, pinned results, recommendation engines. | Replaced | Replaced |
| `merchandise.v1` | [useSalesChannels.ts](../../src/stores/useSalesChannels.ts) | The Merchandise Cloud connection (`connectedAt`). | Kept | Back as seeded |
| `chatbot.v1` | [useChatbot.ts](../../src/stores/useChatbot.ts) | The chatbot's settings and whether it is on. | Settings replaced, on/off kept | Back as seeded |
| `conversations.v1` | [useChatbot.ts](../../src/stores/useChatbot.ts) | Chats shoppers had on the storefront. | Kept | Removed |
| `plans.v1` | [useSubscriptions.ts](../../src/stores/useSubscriptions.ts) | Subscription plans. | The theme's come in, the store's own are paused | Back as seeded |
| `subscriptions.v1` | [useSubscriptions.ts](../../src/stores/useSubscriptions.ts) | Subscriptions shoppers hold. | Kept | Back as seeded |
| `launch.v1` | [useStoreLaunch.ts](../../src/stores/useStoreLaunch.ts) | A created store's launch steps marked done by hand: `["shipping", "taxes"]`. | Kept | Removed |

Not kept at all: collections ([useProductExtras.ts](../../src/stores/useProductExtras.ts)), pages and
blog settings ([useStoreContent.ts](../../src/stores/useStoreContent.ts)), menus
([useStoreNavigation.ts](../../src/stores/useStoreNavigation.ts)) and the header and footer
([useStorefront.ts](../../src/stores/useStorefront.ts)). Each load builds them from the theme the
store runs, so edits to them last for the tab only.

### Shared keys

| Key | Where | What it holds |
|---|---|---|
| `mp.vitaheal-demo.emails.v1` | [useCampaigns.ts](../../src/stores/useCampaigns.ts) | Every store's campaign announcement emails, in one slot (the key it always had). Each email names its store (`storeChannelId`), so a restore removes only that store's emails. |
| `mp.store-builder.created-stores.v1` | [createdStores.ts](../../src/storefront/createdStores.ts) | `{ stores, retired }`: the stores made with Create sales channel, as made, and the id and slot of each one deleted, which are never used again (what the app keeps by store id, such as Maropay sessions and orders, stays with the deleted store). |
| `mp.maropay.v1:<accountId>` | [useMaropay.ts](../../src/stores/useMaropay.ts) | Payments and checkout sessions. Orders placed on a storefront are rebuilt from it after a reload, so they outlive Apply, Restore and Delete store. |

### Per tab, in sessionStorage

The shopper's side lives for the browser tab, like a guest session. Each key holds one entry per
store.

| Key | What it holds | Apply and Restore |
|---|---|---|
| `mp.storefront.cart.v1` | The cart's lines. | Emptied. Every storefront page names what was taken out until the shopper dismisses it or adds something (`noticeFor`, `StorefrontStoreChanged`, kept in memory only). |
| `mp.storefront.code.v1` | The discount code applied in the cart. | Emptied with the cart. |
| `mp.storefront.shopper.v1` | The signed-in shopper's email. | Kept. |
| `mp.storefront.vehicle.v1` | The shopper's vehicle on an auto parts store. | Forgotten. |

### Other tabs, seed fixes, full storage

- **Another tab follows.** Each kept part listens for `storage` events on its own key and takes the
  new value (`keepInBrowser`). [useDemoStores.ts](../../src/stores/useDemoStores.ts) also listens to
  each store's `installed` key, so a tab reseeds the whole store when another tab applies or
  restores (a removed record is a restore, so its history goes back too), and to
  `mp.store-builder.created-stores.v1`, so a store made or deleted in another tab comes in or leaves.
- **A seed fix reaches every browser.** When a blueprint's `seedVersion` passes the one a store was
  seeded at (a store without an `installed` record counts as version 1), the store is reseeded on
  the next start and the new version is recorded. Vitaheal is at 2 since 2026-11-25 (see
  [Sixteen products](#sixteen-products-rubbeccas-second-review-2026-11-25) for what that keeps and
  drops); the other blueprints are at 1.
- **Storage full.** When the browser refuses a save, one warning toast says changes will be gone
  after a reload. Apply returns false if it cannot write the `installed` record.

## Apply

`useDemoStores().apply(channelId, blueprintId)`:

1. Returns false for a store that cannot take a theme.
2. Applying the theme the store started from is a restore (`restore(channelId)`).
3. Writes the store's `installed` record first, so another tab that sees a part cleared already
   reseeds it from the new theme. False if the browser refused it.
4. Asks every part to follow the blueprint the store now runs (`reseed`: each Pinia store's
   `reseedDemo`).
5. Empties the cart (and remembers what it held, so the storefront can say so) and forgets the
   shopper's vehicle.

| Replaced | Kept | Cleared |
|---|---|---|
| The published theme (the merchant's other themes stay, as drafts). Currency and locale. Products, collections, menus, pages, header and footer. Campaigns, search rules and recommendation engines. Chatbot settings and assistant profile. Size charts. Plans: the theme's come in, plans an earlier theme brought go, and the store's own plans (seeded or made in it) stay listed, paused and no longer preselected. | Orders. Subscribers. Chats. The chatbot's id and whether it is on. The Merchandise Cloud connection. Theme drafts and copies. Campaign announcement emails. | The cart, with a notice naming what was taken out. The shopper's vehicle. |

`applyPreview(channelId, blueprintId)` lists what Apply does, for the confirm dialog
(`applySummary`). Applying Northfold to Vitaheal reads:

- 20 products replace the 16 in this store.
- Northfold’s look, 6 collections, 8 pages and menus replace this store’s.
- 3 campaigns, 9 search rules and 5 size charts replace this store’s.
- The chatbot answers as a clothing store.
- Prices change to US dollars.
- Search works once this store connects to Merchandise Cloud.
- This store’s two subscription plans are paused, so no one new can subscribe; its eight subscribers keep their subscriptions.
- Changes you made to this store’s products and campaigns are not kept: a restore brings back the original store, not your changes.
- Orders already placed stay. The cart is emptied.
- Restore original store puts this store back as it started.

On a store that runs no theme (made blank) the lines say what is added instead. They also say when
the store's size charts go, when plans an earlier theme brought are removed, and when search needs
Merchandise Cloud (part numbers included, on a parts theme). Restore's dialog (`restorePreview`,
`restoreSummary` and `restoreMessage`) names the theme it goes back to, a currency that changes back,
plans an applied theme brought, and a Merchandise Cloud connection that goes back.

## Restore

`useDemoStores().restore(channelId)` puts the store back as it started: it clears the `installed`
record, reseeds every part, then puts back what only a restore touches (`restoreHistory`):

- the Merchandise Cloud connection as seeded (Vitaheal disconnected; Northfold, Torqline and
  Daybloom connected; a created store as it was made);
- the theme as seeded, with its drafts and copies removed;
- the chatbot's settings, with its storefront chats removed;
- the subscribers as seeded;
- the store's campaign announcement emails removed.

The cart is emptied and the vehicle forgotten. Orders stay. Every key the store kept is gone
afterwards, apart from the shared emails key, which keeps the other stores' emails. On Vitaheal
the `installed` record is written again at once, to record seed 2.

A store that started blank goes back to blank: no theme, products, pages, plans or rules, and its
chatbot's settings back to none.

`restorePreview(channelId)` returns the dialog's lines (`restoreSummary`) and the wording of the
restore card and toast (`restoreParts`). `restoreFacts(channelId)` gives the counts behind them,
plus `original` (the theme the store started with) and `applied` (the theme it runs now, when that
is another one). The UI offers Restore in three places, all through `StoreRestoreDialog`:

- the store's **Settings** tab, **Store data** card;
- the **Current theme** card on the Themes page, while another theme is applied;
- the original theme's card in the library, while another theme is applied.

## The Themes page

Store editor › **Themes** ([StoreThemes.vue](../../src/views/SalesChannels/StoreThemes.vue)), top to
bottom:

1. **Current theme**: the theme the store runs. While another theme is applied it says when it was
   copied (`readInstalled(...).appliedAt`) and offers **Restore original store**.
2. **Theme library**: one card per `DEMO_STORES` entry
   ([ThemeLibraryCard.vue](../../src/components/saleschannels/ThemeLibraryCard.vue)) with its
   thumbnail, name and version, kind, description and showcase store. A card is **Current**, or
   offers **Restore original store** (the store's original theme while another runs), or **Apply**.
   **Preview** opens the showcase store's storefront in a new tab; it is unavailable while the
   showcase store itself runs another theme. On a store that cannot take a theme, one info alert
   explains why and the cards offer Preview only.
3. **Themes installed**: Edit theme, Duplicate (a Draft "Copy of X" right after it), and Delete
   draft for drafts only.

## Start from a theme

Create sales channel ([CreateSalesChannel.vue](../../src/views/SalesChannels/CreateSalesChannel.vue))
adds a **Theme** step when the type is Web Store and **Enable Store Builder** is on: Blank
(preselected) or one card per theme. The Review step says what the store starts with
(`startSummary`), for example "A copy of Torqline: 21 products, 9 collections, 7 pages and 3
campaigns, priced in US dollars".

`useDemoStores().create(accountId, payload)` calls `createChannel` in
[useSalesChannels.ts](../../src/stores/useSalesChannels.ts), then `attach`es the new store, so every
part is seeded before its page opens. For a web store with Store Builder on:

- the id comes from the name (`Test Garage` → `test-garage`, with `-2` and so on when taken), and
  the domain is `<id>.maropost.store` unless one was typed;
- it takes the next slot (`nextStoreSlot`) and gets `webStore.demo = true` and
  `webStore.blueprint = { original: payload.theme ?? null, slot }`;
- from a theme it comes up published, with the status Connected, priced in the theme's currency;
  blank, it needs setup and has no currency of its own (it prices in the account's Maropay
  settlement currency), and a restore puts it back to that;
- it is saved in `mp.store-builder.created-stores.v1` and added at the end of the list, so the store
  tab that **Show store** opens has it too;
- shoppers see the theme's brand (wordmark, footer, tab title), as on any store a theme is applied
  to: the copy is complete. The store's own name is what the admin shows.

A web store without Store Builder, an offline store, or a Store Builder store when no slot is left
(all of 10-99 taken) is made as before: at the top of the list, not kept in the browser, and it can
never take a theme.

### A new store's first minutes

A store made here opens on its own page in two stages
([storeLaunch.ts](../../src/storefront/storeLaunch.ts), pure):

1. **Setting up.** The page shows the store's setup steps and nothing else
   ([StoreSetupProgress.vue](../../src/components/saleschannels/StoreSetupProgress.vue)): its Commerce
   Cloud account, search (only when connected to Merchandise Cloud), the storefront (naming the
   theme), checkout, and its address. Each takes `SETUP_STEP_MS`. Where it stands is read from the
   store's `createdAt` (`setupProgress`), so nothing is stored: a reload or another tab shows the
   same step, and a store made earlier is simply ready. When the last step is done the page says
   "… is ready" and shows the overview. Nothing waits on it: the store's parts are seeded before
   the page opens, so the storefront already works.
2. **Launch your store.** The overview has the launch checklist where other stores have "Finish
   setup" ([StoreLaunchChecklist.vue](../../src/components/saleschannels/StoreLaunchChecklist.vue)):
   eight steps (`launchChecklist`). Five are read from the store (a stock location, a product, a
   published theme, a way to pay, its address). Three have nothing to read (name and logo, shipping,
   taxes): the merchant marks them done, and [useStoreLaunch.ts](../../src/stores/useStoreLaunch.ts)
   keeps that under the store's `launch.v1` key. Restore and Delete store forget it.

The seeded demo stores are not "made here": they never show the setup steps, and keep "Finish setup".
The account's own **Get started** guide ([GetStarted.vue](../../src/views/GetStarted.vue),
`useOnboarding.ts`) is a different thing: it is per account, and was left as it is.

## Delete store

Only a store made with Create sales channel can be deleted (`isCreated`). The store's Settings tab
offers **Delete store** next to Restore. `useDemoStores().remove(channelId)`:

1. empties every part, as if the store had started blank (`empty`: the record's `original` becomes
   `null`, then a reseed and `restoreHistory`), and empties its cart and vehicle;
2. removes every key under `mp.demo-store.<channelId>.` (`storeKeys`);
3. takes the store out of the list and moves it to the record's `retired` list
   (`deleteCreatedStore`): its id and slot are never given to another store in this browser, so a
   new store with the same name gets `<name>-2`.

Orders placed on it stay in Commerce. Another tab empties the store and drops it when it sees the
created-stores key change.

## Thumbnails

The library cards show `public/storefront/<slug>/theme.jpg`: the first screen of each showcase
store's home page at 1280 x 800 (16:10), JPEG quality 80. To capture them again after a theme
change:

```sh
npm run build
npm run themes:thumbnails                  # all four, from dist/
npm run themes:thumbnails -- --only=torqline
npm run themes:thumbnails -- --dist=<dir>  # another build
```

The script serves the build on a free port, opens each storefront in a fresh Chrome context (so
it shows the seeded store), waits for the photos and fonts, hides the chat launcher and any toast,
and saves the picture. Open every JPG afterwards and check: photos fully loaded, the right fonts,
no chat panel, drawer or toast, the header and hero in view. Each store's `CREDITS.md` says that
`theme.jpg` is a screenshot, not a photo. Tests in
[demoStores.test.ts](../../tests/storefront/demoStores.test.ts) check that every card names its
thumbnail and that the file exists.

## Tests

`npm run test:storefront` runs these with the rest of the storefront rules:

| File | What it checks |
|---|---|
| [demoStores.test.ts](../../tests/storefront/demoStores.test.ts) | Every blueprint: ids, SKUs, options and swatches, links on every install, photos and credits, the thumbnail, fonts, no real brand names, no subscription data on a store without subscriptions. |
| [demoStoresInstall.test.ts](../../tests/storefront/demoStoresInstall.test.ts) | The registry, slots, `canApplyTheme`, the id blocks and the `installed` record. |
| [demoStoresVitaheal.test.ts](../../tests/storefront/demoStoresVitaheal.test.ts) | Vitaheal's home build deep-equals its seed from before the registry (recaptured on 2026-11-24, then twice on 2026-11-25: the look, then the sixteen products). |
| [vitahealDemo.test.ts](../../tests/storefront/vitahealDemo.test.ts), [vitahealRange.test.ts](../../tests/storefront/vitahealRange.test.ts), [vitahealReseed.test.ts](../../tests/storefront/vitahealReseed.test.ts) | Vitaheal's reference tables and look; the eight products added on 2026-11-25, the Immunity goal and Our range; seed 2: who is seeded again, and what that keeps and drops. |
| [scroll.test.ts](../../tests/storefront/scroll.test.ts) | Where a page scrolls after a navigation: storefront pages at their top, Back to the saved place, admin pages as before. |
| [demoStoresApp.test.ts](../../tests/storefront/demoStoresApp.test.ts) | The Pinia stores together: seeding, browser keys, Restore, the stores that must not change. |
| [themeSwap.test.ts](../../tests/storefront/themeSwap.test.ts) | Apply, Restore, created stores, Delete store, theme copies, plans and the cart, across tabs and reloads. |
| [themeSummary.test.ts](../../tests/storefront/themeSummary.test.ts) | The words of the Apply and Restore dialogs and the Review step. |
| [createdStores.test.ts](../../tests/storefront/createdStores.test.ts) | The created-stores key, slots and `storeKeys`. |
| [storeLaunch.test.ts](../../tests/storefront/storeLaunch.test.ts), [storeLaunchApp.test.ts](../../tests/storefront/storeLaunchApp.test.ts) | A new store's setup steps and launch checklist; marked steps kept, and forgotten on restore and delete. |
| [northfoldDemo.test.ts](../../tests/storefront/northfoldDemo.test.ts), [torqlineDemo.test.ts](../../tests/storefront/torqlineDemo.test.ts), [daybloomDemo.test.ts](../../tests/storefront/daybloomDemo.test.ts) | Each store's reference tables: prices, sold-out sizes, size charts, fitment; Daybloom's plan with delivery options, supplement facts and mega menu. |

## Add another store in six steps

1. **Write its data and blueprint.** Copy [northfoldDemo.ts](../../src/storefront/northfoldDemo.ts)
   and [demoStores/northfold.ts](../../src/storefront/demoStores/northfold.ts). Build every id from
   `ctx.ids`, every string id from `ctx.prefix` and every link from the products the blueprint
   creates, so it installs cleanly on any store. Give it the next free slot (7; blueprint slots
   run 2-9, 5 is the stand-in store the tests install into, and created stores start at 10, so
   they never clash) and a `seedVersion` of 1. A store with subscribers numbers them clear of the
   others (Vitaheal S-1001..., Daybloom S-1101...): subscriptions of every store share one list.
2. **Add photos and credits.** Put them in `public/storefront/<slug>/` with a `CREDITS.md` that
   names every file (File | Used for | Photographer | Source). Free licenses only, no real brand
   names or logos in shot.
3. **Register it.** Add its id to `DemoStoreId` in [types.ts](../../src/storefront/demoStores/types.ts)
   and append the blueprint to `DEMO_STORES` in [index.ts](../../src/storefront/demoStores/index.ts)
   (append, never insert: the order is the library's). If its chatbot needs other answers, add a
   profile to `AssistantProfileId`, [assistantProfiles.ts](../../src/chatbot/assistantProfiles.ts)
   and `ASSISTANT_KINDS` in [summary.ts](../../src/storefront/demoStores/summary.ts). For "Announce
   by email", add its customer list in [useCdpEntities.ts](../../src/stores/useCdpEntities.ts) and its
   email in [useContent.ts](../../src/stores/useContent.ts), and name both in `admin`. Its chatbot's
   listing goes in `SEEDED_LISTING` in [useChatbot.ts](../../src/stores/useChatbot.ts).
4. **Load its fonts.** Add each to `themeFonts` in
   [themeSections.ts](../../src/storefront/themeSections.ts) and to the Google Fonts import in
   [global.scss](../../src/styles/global.scss).
5. **Test it and capture its thumbnail.** The shared suites pick the new blueprint up from
   `DEMO_STORES`. Add a `<slug>Demo.test.ts` for its own reference tables. Add the store to `STORES`
   in [theme-thumbnails.mjs](../../scripts/theme-thumbnails.mjs), then `npm run build` and
   `npm run themes:thumbnails -- --only=<slug>`, and look at the picture.
6. **Write its script.** Add `docs/store-builder/<slug>-demo-script.md` in the Steps-table format of
   the other four, with a theme-swap step, then add the store to the tables in this guide and a
   section to [demo-stores-qa.md](demo-stores-qa.md).

## Lumos: what it added to the sections drawing

Lumos is the first store rebuilt from a live UAT theme (Lumos v1.1.9, UAT account 1400, store #34) with the look of a
Figma style guide (Lumos-Design-Style-Guide). The look follows Figma; the sections, their order and settings follow UAT.
Everything it added is optional and only the sections drawing reads it, so the stores before it draw as they did:

- **Theme styles** ([themeSections.ts](../../src/storefront/themeSections.ts) `ThemeStyles`): `headingWeight`,
  `cardColor`, `cardRadius`, `cardShadow`, `buttonBorderColor`, `buttonHoverColor`, `buttonCase`, `tintColor`,
  `measure`, `gutter`, `heroTitleSize`, `sectionTitleSize`, each emitted as an `--sf-*` variable only when set. The
  builder's Styles panel does not edit them yet; a theme seeds them.
- **Sections:** the image banner's `badge`, `accentWords`, `contentPosition` and `stat` blocks; the collection grid's
  `Carousel` layout (looping, dots), `Label over photo` tiles, `Tint` background and per-tile `accent`; a new
  `logo-strip` kind with `logo` blocks; `eyebrow` and `accentWords` on featured products (with arrows on its carousel);
  `eyebrow`, `subtitle`, `alignment` and `Card` tiles on the icon row; specifications and warranty rows for any store
  whose products carry them.
- **Chrome** ([useStorefront.ts](../../src/stores/useStorefront.ts) `StorefrontChrome`): `headerSearch: 'field'`,
  `tagline`, `newsletterColumn`, `bottomLinks`.
- **Cards:** the `Boxed` card style ([listing.ts](../../src/storefront/listing.ts)), the Figma product card with a badge,
  a wishlist heart and a full-width Add to cart.
- **Wishlist:** rules in [wishlist.ts](../../src/storefront/wishlist.ts), the shopper's list in
  [useStorefrontWishlist.ts](../../src/stores/useStorefrontWishlist.ts) (`mp.storefront.wishlist.v1`, per store; cleared
  by Apply, Restore and Delete like the cart), the page `/wishlist`. Only a sections-drawing store whose header lists the
  `wishlist` tool has it.
- **Chat:** the `home` profile ([homeAnswers.ts](../../src/chatbot/homeAnswers.ts)) reads the product's specification
  rows Width, Depth, Height, Seat height, Weight, Materials, Care and Assembly, and its warranty.
- **Admin:** the product editor's Specifications card shows for any product with specifications (suggested labels as
  chips), and a store without photos draws a sofa (`packShot` shape `furniture`).

## Aurora: what it added

Aurora is rebuilt from the live UAT theme Aurora v1.8.9 (UAT account 1400, store #34). Decided with the user: its own
header and footer on every page (UAT draws a second, generic set on most pages), a real web serif for headings (Source
Serif 4; UAT's serif is the browser's Times, shown only because its font setting breaks), outdoor clothing and footwear
with sizes, colours and size charts, and UAT's two home sections plus a few more. What it added, all optional and read only
by the sections drawing:

- **Header** `menuStyle: 'Stacked'` with `social`: social icons left, wordmark centred, a pill search
  (`chrome.headerSearch: 'pill'`) and filled account, wishlist and cart icons right, the menu centred on a second row.
- **Footer** `layout: 'Menus and newsletter'`: menu columns with small uppercase heads, the "Stay in touch" newsletter with
  a consent checkbox, and a copyright bar; the columns fold into accordions on a phone.
- **Image banner** `contentPosition: 'Middle left'`: white words on a dark shade over a full-bleed photo.
- **Card** `Framed` ([listing.ts](../../src/storefront/listing.ts)): Aurora's product card scheme, a thick light border,
  large corners and an inset photo, with a full-width Add to cart.
- **Size charts:** a column whose name says it is a size (a sock chart's "Women's shoe size") is never converted between
  inches and centimeters, in the size guide, the chat or the admin's Unit switch; a chart with no measurement column hides
  the size guide's in/cm switch, and the admin drawer disables its Unit ("This chart has sizes only")
  ([sizeCharts.ts](../../src/storefront/sizeCharts.ts) `isMeasurementColumn`, `hasMeasurements`; the admin's
  [sizeChartForm.ts](../../src/storefront/sizeChartForm.ts) `convertRows`, `hasValuesToConvert`). A foot length converts to
  the nearest half centimeter (half a shoe size is about 0.4 cm); other lengths to the whole one, as before. A dash (—) in a
  cell marks a size a column doesn't have (the women's Boots column has no 11 or 12): the admin accepts and saves it, and a
  piece's size guide leaves out a size that is blank in every column it shows ([audience.ts](../../src/storefront/audience.ts)
  `chartForAudience`).
- **Chat:** the apparel profile answers outdoor wear too: waterproofing, warmth for a temperature, layering, and boot, sock
  and hat sizes, from the product's own rows and charts.

