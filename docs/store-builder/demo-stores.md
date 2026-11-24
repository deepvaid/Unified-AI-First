# Demo stores and the theme library

For developers working on the demo stores, the theme library, Apply, Restore, Start from a theme
and Delete store. It says where each piece lives, what the browser keeps, and how to add a store.
QA checks are in [demo-stores-qa.md](demo-stores-qa.md). The walkthroughs for sales are the four
demo scripts listed below.

## The four demo stores

Each demo store is a web store on account `2000290`, seeded when the app starts. Each one is also a
theme in the library, named after the store.

| Store | Channel id | Store # | Theme | Sells | Currency | Script |
|---|---|---|---|---|---|---|
| Vitaheal (demo) | `vitaheal-demo` | 12 | Vitaheal | Supplements, on subscription plans | SEK (`sv-SE`) | [vitaheal-demo-script.md](vitaheal-demo-script.md) |
| Northfold (demo) | `northfold-demo` | 13 | Northfold | Women's and men's clothing in sizes and colors | USD | [northfold-demo-script.md](northfold-demo-script.md) |
| Torqline Auto Parts (demo) | `torqline-demo` | 14 | Torqline | Auto parts with vehicle fitment | USD | [torqline-demo-script.md](torqline-demo-script.md) |
| Lumos Home (demo) | `lumos-demo` | 15 | Lumos | Furniture, lighting and decor, in fabrics and finishes | USD | [lumos-demo-script.md](lumos-demo-script.md) |

| Store | Blueprint id | Slot | Products (home ids) | Photos | Fonts | Drawing | Chatbot profile |
|---|---|---|---|---|---|---|---|
| Vitaheal | `vitaheal` | 2 | 8 (2001-2008) | `public/storefront/vitaheal/` | Figtree | classic | `wellness` |
| Northfold | `northfold` | 3 | 20 (3001-3020) | `public/storefront/northfold/` | Instrument Serif, DM Sans | sections | `apparel` |
| Torqline | `torqline` | 4 | 21 (4001-4021) | `public/storefront/torqline/` | Barlow Condensed, Barlow | sections | `auto-parts` |
| Lumos | `lumos` | 5 | 20 (5001-5020) | `public/storefront/lumos/` | Inter | sections | `home` |

"Drawing" is how the storefront draws the theme. A theme whose styles say `drawing: 'sections'`
gets the richer storefront: header and footer settings, page templates, filters, quick add, the
variant picker and size guide, the vehicle selector on a store that sells parts, and the wishlist
when the header has its tool
([storefrontContext.ts](../../src/views/Storefront/storefrontContext.ts)). Vitaheal keeps the classic
drawing it always had.

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
| [demoStores/vitaheal.ts](../../src/storefront/demoStores/vitaheal.ts), [northfold.ts](../../src/storefront/demoStores/northfold.ts), [torqline.ts](../../src/storefront/demoStores/torqline.ts) | The three blueprints. Their data is in [vitahealDemo.ts](../../src/storefront/vitahealDemo.ts), [northfoldDemo.ts](../../src/storefront/northfoldDemo.ts) and [torqlineDemo.ts](../../src/storefront/torqlineDemo.ts). |
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
| `id` | `'vitaheal'`, `'northfold'` or `'torqline'` (`DemoStoreId`). |
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
| 2, 3, 4, 5 | Vitaheal, Northfold, Torqline, Lumos (their home channels) |
| 6-9 | Kept free for the demo stores added later (6 is planned for Aurora) |
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
| Vitaheal on its home channel | 2001-2008 | `productId * 10 + n` (20011...) | 23-27 |
| Northfold, Torqline, Lumos on their home channel | `slot * 1000 + n` (3001..., 4001..., 5001...) | `productId * 100 + n` | `slot * 1000 + 900 + n` (3901..., 4901..., 5901...) |
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
| `installed.v1` | [install.ts](../../src/storefront/demoStores/install.ts) | The theme applied: `{ blueprintId, seedVersion, appliedAt }`. Absent: the store runs what it started with. | Written first | Cleared first |
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
  the next start and the new version is recorded.
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

- 20 products replace the 8 in this store.
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

- the Merchandise Cloud connection as seeded (Vitaheal disconnected, Northfold and Torqline
  connected, a created store as it was made);
- the theme as seeded, with its drafts and copies removed;
- the chatbot's settings, with its storefront chats removed;
- the subscribers as seeded;
- the store's campaign announcement emails removed.

The cart is emptied and the vehicle forgotten. Orders stay. Every key the store kept is gone
afterwards, apart from the shared emails key, which keeps the other stores' emails.

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
npm run themes:thumbnails                  # all three, from dist/
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
| [demoStoresVitaheal.test.ts](../../tests/storefront/demoStoresVitaheal.test.ts) | Vitaheal's home build deep-equals its seed from before the registry. |
| [demoStoresApp.test.ts](../../tests/storefront/demoStoresApp.test.ts) | The Pinia stores together: seeding, browser keys, Restore, the stores that must not change. |
| [themeSwap.test.ts](../../tests/storefront/themeSwap.test.ts) | Apply, Restore, created stores, Delete store, theme copies, plans and the cart, across tabs and reloads. |
| [themeSummary.test.ts](../../tests/storefront/themeSummary.test.ts) | The words of the Apply and Restore dialogs and the Review step. |
| [createdStores.test.ts](../../tests/storefront/createdStores.test.ts) | The created-stores key, slots and `storeKeys`. |
| [northfoldDemo.test.ts](../../tests/storefront/northfoldDemo.test.ts), [torqlineDemo.test.ts](../../tests/storefront/torqlineDemo.test.ts) | Each store's reference tables: prices, sold-out sizes, size charts, fitment. |

## Add a fourth store in six steps

1. **Write its data and blueprint.** Copy [northfoldDemo.ts](../../src/storefront/northfoldDemo.ts)
   and [demoStores/northfold.ts](../../src/storefront/demoStores/northfold.ts). Build every id from
   `ctx.ids`, every string id from `ctx.prefix` and every link from the products the blueprint
   creates, so it installs cleanly on any store. Give it the next free slot (5; blueprint slots
   run 2-9, and created stores start at 10, so they never clash) and a `seedVersion` of 1.
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
   the other three, with a theme-swap step, then add the store to the tables in this guide and a
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

