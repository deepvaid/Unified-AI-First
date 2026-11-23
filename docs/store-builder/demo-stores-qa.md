# Demo stores: QA checklist

A check per line, with the result to expect. It covers the four parts of the demo stores work:
the groundwork (Vitaheal unchanged), Northfold, Torqline, and the theme library with Apply,
Restore, Start from a theme and Delete store. The click-by-click flows are in the demo scripts:
[Vitaheal](vitaheal-demo-script.md), [Northfold](northfold-demo-script.md) and
[Torqline](torqline-demo-script.md). How it works is in [demo-stores.md](demo-stores.md).

## Before you start

- Use a fresh browser profile, or clear the demo keys: in DevTools › Application › Local Storage,
  remove every key that starts with `mp.vitaheal-demo.`, `mp.demo-store.` or `mp.store-builder.`.
  Session storage keys start with `mp.storefront.`.
- Keep the admin in one tab and the storefront in another. Most checks need both.
- Run each part at 1280 px wide and again at 375 px. Watch the console: it should stay clean.
- To list the keys a store holds, paste this in the console:
  `Object.keys(localStorage).filter((k) => /^mp\.(vitaheal-demo|demo-store|store-builder)\./.test(k)).sort()`

## Part 1: groundwork (Vitaheal works exactly as before)

| # | Check | Expected |
|---|---|---|
| 1.1 | Open the app in a fresh browser and list the keys. | No `mp.vitaheal-demo.`, `mp.demo-store.` or `mp.store-builder.` key exists until something is changed. |
| 1.2 | Walk the Vitaheal script, steps 1 to 11. | Every step behaves as the script says: kronor prices, `WINTER15` takes 15% off the first order, Skip next delivery works, the assistant answers, the order and Linnea Berg show in Commerce, Connect Merchandising syncs eight products, `tired` finds energy and focus, `knackered` works after the synonym is added. |
| 1.3 | Compare the Vitaheal storefront home with `public/storefront/vitaheal/theme.jpg`. | Same look: navy on white, Figtree, the hero, the announcement bar with `WINTER15`. |
| 1.4 | Look at a charged amount (checkout total, receipt). | Kronor with decimals, such as "585,90 kr". Product pages and the cart show whole kronor. |
| 1.5 | Products: open a Vitaheal product. | Product ids 2001 to 2008, as before. |
| 1.6 | Change a Vitaheal product's price, then reload. | The change stays. The key `mp.vitaheal-demo.products.v1` exists. |
| 1.7 | In a browser that used Vitaheal before this work, open the store. | Its earlier changes are still there (same `mp.vitaheal-demo.*` keys). |
| 1.8 | Store › Settings › Store data › **Restore original store**, then **Restore store**. | Toast "Vitaheal (demo) is back to how it started". The product change is gone. No `mp.vitaheal-demo.*` key is left (apart from `mp.vitaheal-demo.emails.v1` if another store has an announcement email). |
| 1.9 | Account page on the Vitaheal storefront, after an order. | It lists the shopper's subscriptions and their orders. |

## Part 2: Northfold

| # | Check | Expected |
|---|---|---|
| 2.1 | Sales channels list. | **Northfold (demo)**, store #13, after the other stores. |
| 2.2 | Storefront home. | Matches `public/storefront/northfold/theme.jpg`: off-white page, Instrument Serif headings, square corners, black buttons, the `LAYERS20` bar. |
| 2.3 | Women: filter **Size M** and **Color Black**. | 5 of 12 styles. The filters are in the address; Back and a shared link keep them. On a phone they open as a sheet. |
| 2.4 | Linen Overshirt: pick **Sand**, press **Add to cart** without a size. | The photos follow the color. A message asks for a size; the button is not greyed out. |
| 2.5 | Linen Overshirt in Sand: look at **L**. | Struck through, still visible. Picking it says L is sold out. |
| 2.6 | **Size guide**, switch to **cm**. | The chart from the admin, in centimeters, with how to measure. Esc closes it. |
| 2.7 | Add M / Sand, apply `LAYERS20` in the cart. | The line reads "Size M · Sand" with the Sand photo. $98.00 becomes $78.40. |
| 2.8 | Checkout, Pay, **Track your order**. | Checkout in dollars, delivery only. The order page shows the line, the discount and the address. The account lists the order. |
| 2.9 | Knitwear: **+** on Merino Crewneck Sweater, pick **M**. | A sheet with size and color; Add to cart adds it without leaving the page. |
| 2.10 | Search `jumper`, then `returns`. | `jumper` finds the three sweaters. `returns` opens the refund policy. |
| 2.11 | Chat: "What size merino sweater for a 38 inch chest?", then "I'm allergic to wool". | A size from the piece's chart and fit note. Pieces without wool, with no medical advice. |
| 2.12 | Admin › Orders: the newest order. | The line says "M · Sand" with the right photo, and the code and discount. |
| 2.13 | Admin › Products › Linen Overshirt. | A variant grid grouped by color: 15 variants with swatch, SKU, price, stock. |
| 2.14 | Change the Sand swatch and publish, with the storefront open in the other tab. | The open storefront shows the new swatch without a reload. |
| 2.15 | Products › Size charts › Women's tops: change **Bust** for **M**, save. | The size guide on every women's top shows the new value. |
| 2.16 | Store › Campaigns › Fall layers › **Announce by email**. | An email to "Northfold customers" is written. |
| 2.17 | Restore the store from the Settings tab. | Toast "Northfold (demo) is back to how it started". The swatch and chart changes are gone. Merchandise Cloud is connected. Vitaheal is unchanged. |

## Part 3: Torqline

| # | Check | Expected |
|---|---|---|
| 3.1 | Sales channels list. | **Torqline Auto Parts (demo)**, store #14, after Northfold. |
| 3.2 | Storefront home. | Matches `public/storefront/torqline/theme.jpg`: charcoal header, safety-yellow buttons, Barlow Condensed headings, the vehicle finder, the `BRAKES15` bar. |
| 3.3 | **Select vehicle**: 2019, Ford, F-150, **Save vehicle**. | The header says "2019 Ford F-150". Home shows "Popular parts for your 2019 Ford F-150". |
| 3.4 | Brakes. | "Showing parts for 2019 Ford F-150", **Only show parts that fit** on: 2 of 4 brake parts. Every card has a part number, a fit badge, stock and Add to cart. |
| 3.5 | Turn **Only show parts that fit** off. | The car parts show, badged "Doesn't fit your 2019 Ford F-150": an icon and words, never color alone. |
| 3.6 | Ceramic Brake Pads, Truck & SUV: pick **Front**. | A green fit banner. The part number follows the position. **Vehicle fit** highlights your vehicle. |
| 3.7 | Search `tqbrk4472`. | Goes straight to the part with the rear pads chosen. |
| 3.8 | Add Front pads, apply `BRAKES15`. | The line reads "Front · Part # TQ-BRK-4471 · Fits 2019 Ford F-150". $64.99 becomes $55.24. |
| 3.9 | Checkout, Pay, **Track your order**. | The order page keeps the part number and the vehicle. |
| 3.10 | Change the vehicle to 2015 Honda Civic, open Brakes. | "No parts fit your 2015 Honda Civic in Brakes", with **Show all brake parts** and **Change vehicle**. |
| 3.11 | **Clear vehicle** in the vehicle drawer. | Cards drop their fit badges (universal parts keep "Universal fit"). A product page says **Check fit**. |
| 3.12 | Chat: "Will the front brake pads fit my 2019 F-150?", then "Can I fit brake pads myself?". | A fit answer from the same table. Brake work is sent to a qualified mechanic. |
| 3.13 | Admin › Products › Standard Battery › Vehicle fitment › **Add vehicle**: Ford F-150 2015-2020, Save. | The open storefront says "Fits your 2019 Ford F-150" on the battery. Adding the same vehicle again is refused. |
| 3.14 | Reload the storefront tab, then paste its address into a new tab. | After the reload the vehicle is still chosen. The new tab has no vehicle: it lives for the tab. |
| 3.15 | Restore the store from the Settings tab. | Toast "Torqline Auto Parts (demo) is back to how it started". The battery's added fitment is gone and the vehicle is forgotten. |

## Part 4: theme library, Apply, Restore, Start from a theme, Delete store

### The Themes page

| # | Check | Expected |
|---|---|---|
| 4.1 | Vitaheal (demo) › **Themes**. | Current theme Vitaheal, then **Theme library**, then **Themes installed**. |
| 4.2 | The library cards. | Three cards in this order: Vitaheal, Northfold, Torqline. Each has its thumbnail (16:10, alt "Storefront of the {name} theme"), "v1.0", its kind, a description, "Showcase: {store}", and its actions. |
| 4.3 | The Vitaheal card on Vitaheal's page. | A "Current theme" chip, no Apply. Preview opens the store. |
| 4.4 | **Preview** on the Northfold card. | Northfold's storefront opens in a new tab. The link's name says it opens a new tab. |
| 4.5 | Make the window 375 px, then 768 px, then 1280 px. | One column, then two, then three. |
| 4.6 | Neelam-Store › Themes. | One info alert says library themes can be applied only to the demo stores and stores made with Create sales channel. Every card offers Preview only. The current theme is still Aurora, with the Lumos draft. |
| 4.7 | Themes installed: the row menu on a published theme. | "Actions for {name}": Edit theme and Duplicate, no Delete. |
| 4.8 | **Duplicate**. | Toast "Copy of Vitaheal added as a draft". The copy is a Draft, right after the original. |
| 4.9 | Reload. | The copy is still there (`mp.vitaheal-demo.themes.v1`). |
| 4.10 | The copy's menu › **Delete draft**, confirm. | Dialog "Delete Copy of Vitaheal?", "The draft is removed from this store. The published theme stays." The copy is gone, with a toast. |

### Apply

| # | Check | Expected |
|---|---|---|
| 4.11 | Restore Vitaheal first. Put Unwind in the cart on the Vitaheal storefront tab. Then, in the admin, **Apply** on the Northfold card. | Dialog "Apply Northfold to Vitaheal (demo)?", "Vitaheal (demo) becomes a copy of the Northfold store.", danger button **Apply theme**, and these lines: 20 products replace the 8 in this store; Northfold’s look, 6 collections, 8 pages and menus replace this store’s; 3 campaigns, 9 search rules and 5 size charts replace this store’s; The chatbot answers as a clothing store; Prices change to US dollars; Search works once this store connects to Merchandise Cloud; This store’s two subscription plans are paused, so no one new can subscribe; its eight subscribers keep their subscriptions; Changes you made to this store’s products and campaigns are not kept: a restore brings back the original store, not your changes; Orders already placed stay. The cart is emptied; Restore original store puts this store back as it started. |
| 4.12 | Press **Apply theme**. | Toast "Vitaheal (demo) is now a copy of Northfold" with **Show store**, which opens the storefront in a new tab. |
| 4.13 | The storefront tab that was already open. | It shows Northfold's look, products and dollar prices without a reload. The cart says "This store changed while you were shopping, so your cart was emptied: Unwind." with **Got it**. |
| 4.14 | The Themes page now. | Current theme Northfold, "Copied from Northfold on {today}", **Restore original store**. The Northfold card says Current theme. The Vitaheal card offers **Restore original store** and says its showcase store runs Northfold right now, so it can't be previewed. |
| 4.15 | Northfold (demo) › Themes. | Its Vitaheal card's Preview is unavailable, with the same line. |
| 4.16 | Commerce › Subscriptions. | Vitaheal's two plans are listed as Paused. The eight subscribers are still listed. |
| 4.17 | Place an order on the Vitaheal storefront (now Northfold). | It shows in Commerce › Orders, in dollars. |
| 4.18 | Reload both tabs. | Still Northfold, still dollars. |
| 4.19 | In Themes installed, **Duplicate** Northfold. Then apply **Torqline** to the same store. | No "Prices change" line (dollars to dollars). The store runs Torqline. Copy of Northfold is still listed, as a Draft. |
| 4.20 | Apply **Vitaheal** to Northfold (demo). | The dialog says prices change to Swedish kronor and "Vitaheal’s two subscription plans are added". The storefront sells on plans, in kronor, with Vitaheal's look. |
| 4.21 | Fill storage first (or block it), then Apply. | Error toast "The theme could not be applied. This browser has no room left to keep it." Nothing changes. |

### Restore

| # | Check | Expected |
|---|---|---|
| 4.22 | On Vitaheal (running Torqline), **Restore original store** on the Current theme card. | Dialog "Restore the original store?", "Vitaheal (demo) goes back to the products it started with.", danger button **Restore store**. Its first line says the theme goes back to Vitaheal, the next that prices go back to Swedish kronor; it also says theme drafts and copies are removed. |
| 4.23 | Press **Restore store**. | Toast "Vitaheal (demo) is back to how it started". Vitaheal's look, eight products, kronor, two active plans, eight subscribers. Theme copies are gone. |
| 4.24 | The order placed in 4.17. | Still in Commerce › Orders. |
| 4.25 | **Restore original store** on the Vitaheal card in the library, and in the Settings tab. | Both open the same dialog and do the same thing. |
| 4.26 | Apply a theme, then restore Northfold and Torqline the same way. | Each comes back as seeded, connected to Merchandise Cloud. |

### Start from a theme

| # | Check | Expected |
|---|---|---|
| 4.27 | Sales channels › Create sales channel › Web Store, **Enable Store Builder** on. | Four steps: Choose type, Configure, Theme, Review. |
| 4.28 | The Theme step. | "Start from a theme". **Blank** is selected. One card per theme with its thumbnail, kind and "Prices in …". Tab reaches each card and Space selects it. |
| 4.29 | Name it "Test Garage", pick **Torqline**, go to Review. | "Starts with": "A copy of Torqline: 21 products, 9 collections, 7 pages and 3 campaigns, priced in US dollars". |
| 4.30 | **Create sales channel**. | The store page opens. Toast "Test Garage is ready, as a copy of Torqline" with **Show store**. |
| 4.31 | **Show store**. | Torqline's storefront at `/accounts/2000290/sales_channels/test-garage/storefront`, with the vehicle finder. |
| 4.32 | Sales channels list. | Test Garage is last. Atlas Outfitters is still first among web stores. |
| 4.33 | Reload, and open the store in a new tab. | Test Garage is still there (`mp.store-builder.created-stores.v1`). |
| 4.34 | Apply Northfold to Test Garage, then Restore. | It runs Northfold, then Torqline again. |
| 4.35 | Create another store, **Blank**. | Review says "A blank store: no products, pages or campaigns yet". The store needs setup, has no products and no current theme. Any theme can be applied; a restore makes it blank again, in its own currency. |
| 4.36 | Create a web store with Store Builder off. | Three steps, no Theme step. Its Themes page shows the info alert and Preview only. It cannot be deleted. |

### Delete store

| # | Check | Expected |
|---|---|---|
| 4.37 | Settings tab of Vitaheal, Northfold, Torqline and Neelam-Store. | No **Delete store** button. |
| 4.38 | Place an order on Test Garage. Then its Settings tab › **Delete store**. | Dialog "Delete Test Garage?", "The store is deleted from this browser.", saying its products, theme, pages, campaigns, search rules and chatbot are deleted, orders stay, and it can't be undone. |
| 4.39 | Confirm. | Back on the sales channels list, toast "Test Garage deleted". The store is gone from the list. |
| 4.40 | List the keys. | No `mp.demo-store.test-garage.*` key. `mp.store-builder.created-stores.v1` lists it only under `retired`. A new store named Test Garage becomes `test-garage-2`. |
| 4.41 | Commerce › Orders. | The order placed on Test Garage is still there. |
| 4.42 | Open Test Garage's old storefront address. | "Storefront not found". |

## Regression stores

These stores can never take a theme. They must look and work exactly as before, whatever is applied
or restored elsewhere.

| # | Check | Expected |
|---|---|---|
| R.1 | Neelam-Store storefront. | The "AUTO CAR" header and the Aurora theme, as crawled from UAT. |
| R.2 | Neelam-Store › Themes. | Aurora published, Lumos draft, the library with the info alert and Preview only. |
| R.3 | Atlas Outfitters storefront and Merchandising. | Atlas Fall 26 theme. Merchandising opens on Atlas by default. |
| R.4 | Maropay overview. | Atlas Outfitters is still the primary store. |
| R.5 | Fashion Boutique, Beta Sales Channel, Max Test Store store pages. | As before. Their Settings tab has no Store data card. |
| R.6 | POS. | Opens and sells as before. |
| R.7 | After applying and restoring every demo store. | None of the stores above has changed, and none has a key under `mp.demo-store.`. |

## Browser data

| # | Check | Expected |
|---|---|---|
| B.1 | Change a product, a size chart, a campaign, a search rule, the chatbot and a theme section on a demo store, then reload. | Every change stays. |
| B.2 | Edit a menu or a page, then reload. | The edit is gone: menus, pages, collections and the header and footer are not kept in the browser. |
| B.3 | With the storefront open in a second tab, change a product in the admin. | The second tab follows without a reload. |
| B.4 | With the storefront open in a second tab, apply a theme, then restore. | The second tab switches theme and back without a reload. Its cart is emptied each time. |
| B.5 | With the sales channels list open in a second tab, create a store, then delete it. | The second tab's list gains it, then loses it. |
| B.6 | Restore Northfold while Vitaheal and Torqline have saved changes. | Only `mp.demo-store.northfold-demo.*` keys go. The other stores' keys stay. `mp.vitaheal-demo.emails.v1` loses only Northfold's announcement emails. |
| B.7 | Apply a theme, then look at the store's keys. | `<prefix>installed.v1` holds `{ blueprintId, seedVersion, appliedAt }`. Restore removes it. |
| B.8 | Choose a vehicle and fill a cart, then paste the store's address into a new tab. | The new tab has an empty cart and no vehicle (they live in sessionStorage, per tab). |
| B.9 | Fill the browser's storage, then change a product. | One warning toast, "Changes not kept". The app keeps working. |
