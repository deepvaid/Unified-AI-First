# Demo stores: QA checklist

A check per line, with the result to expect. It covers the parts of the demo stores work:
the groundwork (Vitaheal unchanged), Northfold, Torqline, and the theme library with Apply,
Restore, Start from a theme and Delete store; Lumos (Part 5) and Aurora (Part 6); and Daybloom, added in the
feedback round, with Vitaheal's move to the Lumos look (D.22 to D.37), and Rubbecca's second review:
Vitaheal's sixteen products and pages that open at their top (D.38 to D.65). The click-by-click flows are in the demo scripts:
[Vitaheal](vitaheal-demo-script.md), [Northfold](northfold-demo-script.md),
[Torqline](torqline-demo-script.md), [Lumos](lumos-demo-script.md), [Aurora](aurora-demo-script.md) and
[Daybloom](daybloom-demo-script.md). How it works is in
[demo-stores.md](demo-stores.md).

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
| 1.1 | Open the app in a fresh browser and list the keys. | One key only: `mp.vitaheal-demo.installed.v1`, holding `"blueprintId":"vitaheal"` and `"seedVersion":2` (since 2026-11-25 it records the seed Vitaheal holds). No other `mp.vitaheal-demo.`, `mp.demo-store.` or `mp.store-builder.` key exists until something is changed. Reload: nothing more is written. |
| 1.2 | Walk the Vitaheal script, steps 1 to 13. | Every step behaves as the script says: kronor prices, `WINTER15` takes 15% off the first order, Skip next delivery works, the assistant answers, the order and Linnea Berg show in Commerce, the plan with delivery options is created and Balance offers its three frequencies, Connect Merchandising syncs sixteen products, `tired` finds Magnesium and, through a synonym, energy and focus, `knackered` works after the synonym is added. |
| 1.3 | Compare the Vitaheal storefront home with `public/storefront/vitaheal/theme.jpg`. | Same look: the Lumos look in navy on white (Inter, uppercase headings), the menu with **Shop**, **Subscription** and **About**, the hero with its badge and three figures, the announcement bar with `WINTER15`. The picture is made by `npm run themes:thumbnails` after a build. It shows the first screen, which the sixteen products did not change. |
| 1.4 | Look at a charged amount (checkout total, receipt). | Kronor with decimals, such as "585,90 kr". Product pages and the cart show whole kronor. |
| 1.5 | Products: open a Vitaheal product. | Product ids 2001 to 2016: the first eight as before, then the eight added on 2026-11-25. |
| 1.6 | Change a Vitaheal product's price, then reload. | The change stays. The key `mp.vitaheal-demo.products.v1` exists. |
| 1.7 | In a browser that used Vitaheal before this work, open the store. | Until 2026-11-25 its earlier changes were still there (same `mp.vitaheal-demo.*` keys). Since Vitaheal's seed 2 such a browser is seeded again on its next start: see D.60. |
| 1.8 | Store › Settings › Store data › **Restore original store**, then **Restore store**. | Toast "Vitaheal (demo) is back to how it started". The product change is gone. The only `mp.vitaheal-demo.*` keys left are `mp.vitaheal-demo.installed.v1` (seed 2, written again at once) and `mp.vitaheal-demo.emails.v1` if another store has an announcement email. |
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
| 4.11 | Restore Vitaheal first. Put Unwind in the cart on the Vitaheal storefront tab. Then, in the admin, **Apply** on the Northfold card. | Dialog "Apply Northfold to Vitaheal (demo)?", "Vitaheal (demo) becomes a copy of the Northfold store.", danger button **Apply theme**, and these lines: 20 products replace the 16 in this store; Northfold’s look, 6 collections, 8 pages and menus replace this store’s; 3 campaigns, 9 search rules and 5 size charts replace this store’s; The chatbot answers as a clothing store; Prices change to US dollars; Search works once this store connects to Merchandise Cloud; This store’s two subscription plans are paused, so no one new can subscribe; its eight subscribers keep their subscriptions; Changes you made to this store’s products and campaigns are not kept: a restore brings back the original store, not your changes; Orders already placed stay. The cart is emptied; Restore original store puts this store back as it started. |
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
| 4.23 | Press **Restore store**. | Toast "Vitaheal (demo) is back to how it started". Vitaheal's look, sixteen products, kronor, two active plans, eight subscribers. Theme copies are gone. |
| 4.24 | The order placed in 4.17. | Still in Commerce › Orders. |
| 4.25 | **Restore original store** on the Vitaheal card in the library, and in the Settings tab. | Both open the same dialog and do the same thing. |
| 4.26 | Apply a theme, then restore Northfold and Torqline the same way. | Each comes back as seeded, connected to Merchandise Cloud. |

### Start from a theme

| # | Check | Expected |
|---|---|---|
| 4.27 | Sales channels › Create sales channel › Web Store, **Enable Store Builder** on. | Four steps: Choose type, Configure, Theme, Review. |
| 4.28 | The Theme step. | "Start from a theme". **Blank** is selected. One card per theme with its thumbnail, kind and "Prices in …". Tab reaches each card and Space selects it. |
| 4.29 | Name it "Test Garage", pick **Torqline**, go to Review. | "Starts with": "A copy of Torqline: 21 products, 9 collections, 7 pages and 3 campaigns, priced in US dollars". |
| 4.30 | **Create sales channel**. | The store page opens on "Setting up Test Garage": four steps (five with Merchandise Cloud on), one running at a time, each saying Done, In progress or Waiting. The chip beside the name reads "Setting up", and there are no tabs, Preview or Edit theme yet. |
| 4.30a | Reload while it is setting up. | The same step is running: setup did not start again. |
| 4.30b | Wait a few seconds. | Toast "Test Garage is ready" with **Show store**. The overview appears with **Launch your store**, "5 of 8 steps done": a location, the first product, the theme, payments and the address are done. |
| 4.30c | Press **Mark as done** on **Check your shipping**. Reload. | Toast "Marked as done: check your shipping". "6 of 8 steps done", also after the reload. |
| 4.30d | **Open tax categories**, then Back. **Manage** on payments, then Back. | Each opens its page; nothing is a dead end. |
| 4.30e | Mark the last two steps done. | "Every step is done" and a green "Your store is ready to launch" with **View store**, which opens the storefront in a new tab. |
| 4.30f | At 375 px. | The checklist is one column, each step's buttons under its words. No sideways scroll. |
| 4.31 | **Show store**. | Torqline's storefront at `/accounts/2000290/sales_channels/test-garage/storefront`, with the vehicle finder. |
| 4.32 | Sales channels list. | Test Garage is last. Atlas Outfitters is still first among web stores. |
| 4.33 | Reload, and open the store in a new tab. | Test Garage is still there (`mp.store-builder.created-stores.v1`). |
| 4.34 | Apply Northfold to Test Garage, then Restore. | It runs Northfold, then Torqline again. |
| 4.35 | Create another store, **Blank**. | Review says "A blank store: no products, pages or campaigns yet". The store needs setup, has no products and no current theme. Any theme can be applied; a restore makes it blank again, in its own currency. |
| 4.35a | The blank store's **Launch your store**. | "3 of 8 steps done". **Add your first product** has **Add product**; **Choose a theme** has **Choose theme**, which opens the theme library. The "ready" toast has no Show store. |
| 4.36 | Create a web store with Store Builder off. | Three steps, no Theme step. Its Themes page shows the info alert and Preview only. It cannot be deleted. |

### Restore and the launch checklist

| # | Check | Expected |
|---|---|---|
| 4.36a | On Test Garage with steps marked done: Settings › **Restore original store**. | The checklist is back to "5 of 8 steps done": nothing is marked by hand. No `…test-garage.launch.v1` key is left. |
| 4.36b | Open Vitaheal, Northfold, Torqline or Daybloom (demo). | No setup steps. The overview still says **Finish setup**, as before. |

### Delete store

| # | Check | Expected |
|---|---|---|
| 4.37 | Settings tab of Vitaheal, Northfold, Torqline and Neelam-Store. | No **Delete store** button. |
| 4.38 | Place an order on Test Garage. Then its Settings tab › **Delete store**. | Dialog "Delete Test Garage?", "The store is deleted from this browser.", saying its products, theme, pages, campaigns, search rules and chatbot are deleted, orders stay, and it can't be undone. |
| 4.39 | Confirm. | Back on the sales channels list, toast "Test Garage deleted". The store is gone from the list. |
| 4.40 | List the keys. | No `mp.demo-store.test-garage.*` key. `mp.store-builder.created-stores.v1` lists it only under `retired`. A new store named Test Garage becomes `test-garage-2`. |
| 4.41 | Commerce › Orders. | The order placed on Test Garage is still there. |
| 4.42 | Open Test Garage's old storefront address. | "Storefront not found". |

## Part 5: Lumos

| # | Check | Expected |
|---|---|---|
| 5.1 | Sales channels list. | **Lumos Home (demo)**, store #15, after Torqline. |
| 5.2 | Storefront home at 1280. | Matches `public/storefront/lumos/theme.jpg`: indigo bar, LUMOS wordmark, a search field in the header, the uppercase Inter hero with "PERFECT PLACE" in indigo, a New arrivals badge, two buttons and a stats strip. |
| 5.3 | Scroll the home page. | "Shop by room" carousel on a pale tint (labels over photos, one dot per room, it loops); "Brands we carry" with six made-up logos; "Featured products" with Boxed cards and Previous/Next arrows; "The Lumos difference" with four cards. |
| 5.4 | The same at 375. | Hero 48px headline, buttons stacked, stats in one row; one room at a time; logos three to a row; the header search sits in its own row; nothing scrolls sideways. |
| 5.5 | Living Room. | Boxed cards (badge, heart, bold name, price, full-width ADD TO CART). Filters are Category, Color, Brand and Price (no Size). Stone Side Table shows $219 and the struck $269. |
| 5.6 | Arlo 3-Seat Sofa: pick Slate. | The gallery keeps the Oat photos and says "Shown in Oat". The rows include "Dimensions and materials" and "Warranty". |
| 5.7 | Hearts on two cards and on a product page; open the header heart. | Each heart is pressed (filled indigo); the header says "Wishlist, 3 items"; `/wishlist` lists the three, newest first. Removing one moves focus to the next heart. |
| 5.8 | Add the sofa (Oat), apply COZY20, pay. | 20% off the living room at checkout; the order page and Commerce › Orders show "Fabric: Oat". |
| 5.9 | Chat: "How wide is the Arlo sofa?", "Will the Ledger desk fit a 60 inch wall?", "Do you assemble it?". | Answers from the product's own Width, from comparing 60 in with the desk, and from the Assembly row and the delivery page (no promise the pages don't make). |
| 5.10 | Admin › the Arlo sofa's product page. | The Specifications card lists its rows; unused suggested labels show as chips. Northfold's products show no Specifications card. |
| 5.11 | Themes page of Vitaheal: apply Lumos, then restore. | Four library cards. The dialog names Lumos's look and its 20 products; Vitaheal becomes the furniture store in dollars, then comes back as it was, and the wishlist is empty again. |

## Part 6: Aurora

| # | Check | Expected |
|---|---|---|
| 6.1 | Sales channels list. | **Aurora Outdoor (demo)**, store #16, after Lumos Home. |
| 6.2 | Storefront home at 1280. | Matches `public/storefront/aurora/theme.jpg`: the TRAIL20 bar, social icons left, the Aurora wordmark centred, a pill search and filled icons right, the menu centred below; a full-bleed trail photo with "Keep the world adventurous forever" in a serif, white, on the left. |
| 6.3 | Scroll the home page. | "Featured Collections" slider (three tiles, labels over photos, dots); New arrivals (the two fleeces, the headlamp and the beanie) and Best sellers (the trail bottle at $32 with $40 struck through) in Framed cards, with no "New" badge in the New arrivals row; a "Made for the trail" story; the footer with three menu columns and "Stay in touch". |
| 6.4 | The same at 375. | Burger, wordmark and icons in one row, a full-width search under it, one collection tile at a time, the footer columns as accordions; nothing scrolls sideways. |
| 6.5 | Women › Women’s Ridgeline Rain Shell: pick Slate and a size; open the size guide. | "Shown in Moss" under the photos; swatches and sizes as on Northfold; the guide shows the women's chart in inches and centimeters. |
| 6.6 | Trail Merino Socks: open the size guide. | Shoe sizes as written, with no in/cm switch. |
| 6.7 | Chat: "Is the rain shell waterproof?", "Is the down jacket warm enough for 20°F?", "I'm between sizes in boots". | Answers from the product's own rows and the boots chart; "I can't promise" where the store says nothing. |
| 6.8 | Buy a jacket with TRAIL20 and pay; Track your order. | 20% off the jacket; the order page names the size and colour. |
| 6.9 | Jackets, Footwear, Products in the admin, the cart and an order. | Each women's and men's piece says whose it is in its name (Women’s Summit Down Jacket, Men’s Summit Down Jacket); no two cards, admin rows, cart lines or order lines read the same. |
| 6.10 | Men’s Canyon Hiking Boot › Size guide, then cm. | Sizes 8 to 12 only (the women's boot 6 to 10), no "—" rows; foot lengths in cm to the half centimeter. |
| 6.11 | Admin › Aurora's chatbot › preview: press each quick prompt. | Each answers from the knowledge base or says it needs the live store; "How warm is the down jacket?" gives 14°F (−10°C); no sample product cards. |
| 6.12 | Admin › the store › Campaigns. | Trail season Active, started four days ago, 18 orders; Layer up Ended; Boot week Scheduled. |
| 6.13 | Themes page of Northfold: apply Aurora, then restore. | Six library cards; Northfold becomes Aurora with its header and footer, then comes back as it was. |

## Feedback round: Daybloom

| # | Check | Expected |
|---|---|---|
| D.1 | Sales channels list. | **Daybloom (demo)**, store #17, after Aurora Outdoor. |
| D.2 | Storefront home. | Matches `public/storefront/daybloom/theme.jpg`: the Aurora look (white page, dark grey bar and buttons, system font), the `SLEEP15` bar, four promises in a row, **Shop by goal**, four **Bestsellers** with a "Subscribe available" badge. |
| D.3 | Press **Shop** in the header. | A panel opens under the header: **Shop by goal** (5 links), **Shop by format** (3), **More ways to shop** (4) and a picture tile "Subscribe and save up to 20%". The button says it is expanded. |
| D.4 | With the panel open: press **Escape**; open it again and press outside it; open it and Tab through it and on. | Escape closes it and focus is back on **Shop**. A press outside closes it. Tab walks the panel's links, and it closes when focus leaves it. |
| D.5 | Hover **Learn** with a mouse, then move away. | The panel opens on hover and closes when the pointer leaves the link and the panel. |
| D.6 | At 375 px: open the menu, press **Shop**. | The three columns open in place under **Shop**, headings and links. No sideways scroll. |
| D.7 | Open **Sleep**. | "Wind down in the evening and wake up rested." under the title. Three products. |
| D.8 | Magnesium Glycinate. | **Subscribe and save** is chosen first, on **Deliver every month**: $23.20, was $29.00, "Save 20%". Every 2 months $24.65 (15%), every 3 months $26.10 (10%), one-time $29.00. Under them: "Pause, skip or cancel any time. · Subscription terms · My subscriptions". |
| D.9 | Open **Supplement facts**, then **Warnings**. | A table: Size, Serving size, Servings per bottle, Magnesium 200 mg (48% DV), Other ingredients, Suggested use, Free from. The warnings name the suggested use, a varied diet, children and a doctor. |
| D.10 | Sleep Well Bundle. | $47.00, no purchase options (sold once only). Its facts say what is in the bundle. |
| D.11 | Add the monthly subscription, apply `SLEEP15` in the cart. | "Subscribe and save · every month". Discount −$3.48, total $19.72, "Then every month $23.20", and a line that the code lowers this order only. |
| D.12 | Checkout. | Countries: United States, Canada, Australia, New Zealand, United Kingdom. No Click & collect. The consent names $23.20 every month; under it "Pause, skip or cancel any time." and **Subscription terms**, which opens in a new tab. Pay is refused until the box is ticked. |
| D.13 | Pay, then **Manage your subscription**. | The confirmation says the next charge the US way ("December 24, 2026"). The account lists the subscription with "Next delivery Dec 24, 2026" and the order. |
| D.14 | Account: **Change plan** to every 2 months. | "Per delivery" becomes $24.65. The admin's subscriber shows "Delivery changed from every month to every 2 months". |
| D.15 | Chat: "When is my next delivery?" with the shopper's email; "Are your products vegan?"; "Is it safe with my medication?". | The next delivery with its price and "your Subscribe and save plan"; the store's own answer on vegan products; "I can't give medical advice". |
| D.16 | Search **tired**, then **refund**. | Daily Greens, Electrolyte Mix and the Daily Essentials Bundle; then the refund policy page. |
| D.17 | Admin › Commerce › Subscriptions › Plans. | **Subscribe and save**, "Every 1, 2 or 3 months", 10–20%, 8 products, Daybloom (demo). Subscribers lists six seeded ones, S-1101 to S-1106: one paused, one failed payment, one cancelled. |
| D.18 | Admin › Products › Magnesium Glycinate. | A **Product facts** card with seven rows. Change **Serving size** and save: the open storefront's Supplement facts row shows it. A Vitaheal product has the card too; a Northfold product has none. |
| D.19 | Edit theme › Product › Product detail. | Blocks: Purchase options, Supplement facts, How Subscribe and save works, Shipping and returns, Warnings. **Supplement facts** has Content "Product facts table" and no text field. Home has an **Icon row** with four features, drawn side by side. |
| D.20 | Footer. | Ends with the statement that the products are not intended to diagnose, treat, cure or prevent any disease. Every footer link opens a page. |
| D.21 | Restore the store from the Settings tab. | Toast "Daybloom (demo) is back to how it started". The changed fact and plan are as seeded. Orders and subscriptions made in the demo stay in Commerce. |
| D.22 | Vitaheal storefront, after a restore: header, home, a product page, a collection, the checkout. Since 2026-11-25 it is on the Lumos look (the sections drawing). | The VITAHEAL wordmark and uppercase Inter headings in navy on white. **Shop** and **About** open a panel (goals, more ways to shop, a picture tile); **Subscription** is a plain link. No search field until Merchandise Cloud is connected. The hero has a **Made in Sweden** badge, the headline in navy on the left over a white wash, **one job well** in the brand colour, the runner on the right of the photo, **Shop all products** and **Subscribe and save**, and three figures: 20–30% saved on a plan, 549 kr free shipping over, 30 days money back on Unwind. Then **Shop by goal** as a carousel on a pale tint, **Our range** as a carousel, the two stories and four promise cards. Unwind opens on **Bag** (the lower price) with a quantity and "In stock, ready to ship", and on **3-month supply**, with "Skip, pause or cancel anytime. · Subscription terms · My subscriptions" under the options; the button reads **Add subscription to cart** and there is no Buy now while a plan is chosen. Under the buy box **Description** is open, then four rows; **Product facts** is a table with amounts in % NRV. **Sleep** has a line under its title. The checkout's consent has **Subscription terms** under it. The footer has the tagline, three link columns, a newsletter column, and Privacy policy, Terms of service and Cookies beside the copyright. |
| D.23 | Vitaheal's plans and prices. | Two plans as before (3-month supply 30%, Monthly subscription 20%). Electrolytes opens on Lemon & Ginger; on the 3-month supply it is still 585,90 kr at checkout, and product pages and the cart show whole kronor. `WINTER15` still takes 15% off the first order. |
| D.24 | Atlas Outfitters and Neelam-Store storefronts. | No panel in the header, no promises strip, no rows, no Lumos look: these themes do not ask for them. |
| D.25 | Vitaheal at 1280: hover **Shop**, move away; press **Shop**, then **Escape**; press **About** and press outside it. Then at 375 open the menu. | The panel hangs right under the menu row and opens on hover; a press keeps it open and the button says it is expanded; Escape closes it with focus back on **Shop**; a press outside closes it. At 375 **Shop** and **About** are rows in the menu that open in place, with their headings and links and no picture tile. Nothing scrolls sideways. |
| D.26 | Vitaheal › **Shop** › **All products**. | Sixteen boxed cards, four to a row, with sort and a Price filter. The eight products on a plan say **Subscribe available** on the lime badge, in dark text: Unwind, Clear Focus, Daily NAD+, Vitaheal Electrolytes, Collagen+, Plant Protein, Daily Greens and Creatine. The other eight have none: Nasal Strips, Balance Refill, Balance, Vitamin D3 + K2, Omega-3, Magnesium, Vitamin C + Zinc and Daily Multi. A sale or sold-out badge would take its place. |
| D.27 | Quick add on Unwind's card. | The drawer has **Format** and the purchase options, on the 3-month supply; its button reads **Add subscription to cart**, and the cart line names the plan. With **One-time purchase** chosen it adds the product without a plan. |
| D.28 | Balance, after step 8 of the Vitaheal script (the plan with delivery options). | **One-time purchase** 419 kr is chosen first. A **Subscribe and save** group, "Save up to 20%": every month 335 kr, every 2 months 356 kr, every 3 months 377 kr, each with 419 kr struck. Pick every 2 months: the button reads **Add subscription to cart**. Restoring the store removes the plan. |
| D.29 | Daybloom storefront: home, **Shop**, Magnesium Glycinate, a card, the checkout. | Exactly as D.2 to D.12: the classic drawing in the Aurora look, the same panel, Purchase options, facts, promises and card badges. Vitaheal's move changed nothing here. |
| D.30 | Vitaheal › Themes. | The library card reads **Vitaheal 2.0** with "A supplements store on subscription, in kronor: Inter, uppercase headings, boxed product cards and a mega menu by goal." The store's page names the theme **Vitaheal 2.0**. |
| D.31 | A browser that saved an edited Vitaheal theme before 2026-11-25. | Since Vitaheal's seed 2 the store is seeded again on the next start: it shows D.22, with sixteen products, and the Themes page and Settings › Store data show no note about an older look. `mp.vitaheal-demo.installed.v1` records seed 2. What else the reseed drops and keeps is D.60. |
| D.32 | Vitaheal: buy Electrolytes **Starter Pack** on the 3-month supply, pay, then **Manage your subscription** › **Change plan** › Monthly. | The form and the result say 399,20 kr per delivery (the Starter Pack's price at 20% off), not the cheapest flavour's. The card's line starts "Starter Pack (both flavours) ·"; the admin subscriber names it too. |
| D.33 | Vitaheal store page and **Themes**, before Merchandise Cloud is connected; then connect it. | The previews show no header search field, as the storefront; after connecting, both show **Search supplements**. The builder canvas always shows the field. |
| D.34 | Plans › New plan › Plan with delivery options, store Vitaheal. | The shopper preview opens on **One-time purchase**, as Vitaheal's product pages do (Daybloom's preview opens on the subscription). The fields read "Discount, every month", "Discount, every 2 months" and so on. |
| D.35 | Nasal Strips, then Balance after D.28. | No "How subscriptions work" row on Nasal Strips; Balance shows it once a plan offers it. In the builder the row's **Only on products sold on a plan** is on. |
| D.36 | Commerce › Fulfillment after a Vitaheal checkout. | The fulfilment and the order say **Stockholm warehouse**; the order's fulfilment chip matches the fulfilment's status. |
| D.37 | Vitaheal at 320 and 360: home, a quick add on Daily NAD+, **Manage your subscription**. | The headline fits the screen; the figures stay on one line; quick add's button stays inside the drawer with the price on its own line; the subscription's name sits clear of its status chip. |

## Second review: Vitaheal's sixteen products, and pages that open at their top

Rubbecca reviewed the Vitaheal demo again on 2026-11-25. She asked for more products, and found
that a product or collection opened scrolled to the bottom of its page. Restore Vitaheal first,
unless a check says otherwise.

### A page opens at its top

| # | Check | Expected |
|---|---|---|
| D.38 | Vitaheal home at 1280: scroll down to **Our range** and press a product's name. | The product page opens at its top: the header, the photos and the name are in view. It used to open scrolled to the bottom. |
| D.39 | Press the browser's **Back**, then **Forward**. | Back: the home page is where you left it, at **Our range**. Forward: the product is where you left it. |
| D.40 | Scroll to the bottom of the home page and press **Immunity** in the footer. Then scroll to the bottom of a product page and press a product in the row there. | Each page opens at its top. |
| D.41 | **Shop** › **All products**: scroll down, change the sort, then pick a range in the Price filter. Then press **Back**. | The page stays where it was each time, and the address follows. Back takes the filter off and keeps the place. |
| D.42 | **Plant Protein**: scroll down a little, then pick **Can**. | The page stays where it was. The choice goes in the address. |
| D.43 | Home › **Unwind**, Back, **Unwind** again. Scroll to **You may also like** and press a product there, then Back. Then: read Unwind to the bottom, Back, open Unwind again, press **Sleep** in its breadcrumb at the top, Back. | The first Back returns Unwind at **You may also like**; the second returns it at its top. Neither returns to where an earlier visit was left. |
| D.44 | Search **sleep**, scroll to the bottom of the results, then search **protein** from the header. | The new results open at their top. Sorting the results keeps the place. |
| D.45 | Fill the checkout from the bottom of the page and press **Pay**. Then try the declined card (4000 0000 0000 0002). | The receipt opens at its top. A declined card stays at **Pay**, with its message beside it. |
| D.46 | On Northfold and Lumos: open a product from low on the home page, press Back, then sort and filter a collection. On Daybloom (the classic drawing): open a product and a collection from low on a page. | The same as on Vitaheal: a new page opens at its top, Back returns to the place, a sort or filter keeps it. |
| D.47 | Admin › **Commerce** › **Orders**: scroll down the list, open an order, press **Back**. | The list is where it was. Admin pages are otherwise as before. |

### Sixteen products

| # | Check | Expected |
|---|---|---|
| D.48 | Vitaheal home. | **Shop by goal** has five tiles: Sleep, Sport, Immunity, Longevity and Hydrate. Immunity, new for winter, has its own photo and is in view at 1280 without paging the carousel. **Our range** has twelve cards: Unwind, Clear Focus, Daily NAD+, Nasal Strips, Vitaheal Electrolytes, Collagen+, Balance Refill, Balance, Plant Protein, Daily Greens, Vitamin D3 + K2 and Omega-3. |
| D.49 | Hover **Shop**. Look at the footer's Shop column. At 375 open the menu and press **Shop**. | **Shop by goal** lists Sleep, Sport, Longevity, Hydrate and Immunity, in the panel and in the menu. The footer's Shop column reads All products, Sleep, Sport, Longevity, Hydrate, Immunity, Subscription. |
| D.50 | **Shop** › **Immunity**. | "Vitamins C and D and zinc, for the dark Swedish winter." under the title. Three products: Vitamin D3 + K2, Vitamin C + Zinc and Daily Multi. |
| D.51 | **Plant Protein**: its card, then its page. | The card reads "From 369 kr" with **Subscribe available**. The page opens on **Refill bag** (the cheaper format; **Can** is 399 kr) and on the 3-month supply, and the button reads **Add subscription to cart**. **Product facts** starts with a serving of 1 scoop (30 g) and 21 g of protein. Daily Greens (429 kr / 449 kr) and Creatine (279 kr / 299 kr) work the same way. |
| D.52 | **Creatine**, then **Omega-3**. | Creatine has the **How subscriptions work** row. Omega-3 has no plans and no such row, and its button reads **Add to cart**. |
| D.53 | Quick add on Plant Protein's card, then on Vitamin D3 + K2's. | Plant Protein opens the drawer with **Format** and the purchase options. Vitamin D3 + K2 goes straight into the cart, with no drawer. |
| D.54 | Admin › **Products** › **Collections**: search **Vitaheal** and open **Immunity**. Then **Commerce** › **Subscriptions** › **Plans**. | The Store column says which store each collection belongs to (below 1280 it is under the title). Six Vitaheal collections: Subscription 8, Sport 6, Longevity 6, Sleep 3, Hydrate 1, Immunity 3 products; Daybloom's Immunity is its own row. Immunity lists Vitamin D3 + K2, Vitamin C + Zinc and Daily Multi in kronor, says a product joins from its own page, and its title cannot be changed. Save keeps the count. Both Vitaheal plans say 8 products. |
| D.55 | Merchandising for Vitaheal, before connecting. Connect it, then on the store search **flu**, **cold**, **winter**, **protein**, **tired** and **sleep**. | The card says connecting syncs the store's 16 published products; the toast says "16 products are synced". Flu, cold and winter find the three Immunity products, through the synonym. Protein finds Plant Protein. Tired finds Clear Focus, Magnesium, Daily NAD+ and Balance. Sleep finds Unwind first, then Nasal Strips and Magnesium. |
| D.56 | Chat (**Need help?**): "Hi", then "Do you sell refills?", "Is there a refill bag for the protein?" and "Is there a refill for the electrolytes?". | The greeting offers a product "for sleep, focus, hydration, protein, immune support, skin or healthy ageing". Refills: "Yes. Creatine, Daily Greens, Plant Protein, Balance Refill, Collagen+, Daily NAD+, Clear Focus and Unwind come in a refill. Choose the refill on a product’s page:" with three cards, the newest first (Creatine, Daily Greens, Plant Protein). Protein: "Yes. Plant Protein comes in a refill bag as well as the can. Choose Refill bag on its page:" with its card. Electrolytes: "No, Vitaheal Electrolytes doesn’t come in a refill.", then the eight names, with no cards. "Are the refill bags recyclable?" gets the About page's answer, not a "Yes". |
| D.57 | Chat: "I keep catching colds", "Protein after the gym", "Something for my heart", "I need a multivitamin", "Greens powder", "I can't sleep". | Colds: "For immune support", Vitamin C + Zinc, Vitamin D3 + K2 and Daily Multi. Gym: "For muscle and strength", Plant Protein and Creatine, no Electrolytes. Heart: Omega-3. Multivitamin: Daily Multi first, then Vitamin D3 + K2 and Vitamin C + Zinc. Greens: Daily Greens. Sleep: Unwind and Magnesium. |
| D.58 | Chat: "Can I mix it with cold water?", "What strength is Magnesium?", "What should I buy?", "What would you recommend I buy?", "Something for women", "I'm looking for something vegan", "Can I return a refill?", "Do you ship over the winter holidays?". | No product cards for the first two. Both "buy" questions ask what you would like help with. Women: Balance, then Balance Refill. Vegan: Omega-3. Returning a refill: the refund policy's answer. Winter holidays: the delivery answer, no cards. |
| D.59 | Chat: "I take blood thinners, is omega-3 ok?", "I have a heart condition", "I'm on chemo, what helps my immune system?". Then "Do you have anything for a cold?" and "I am always tired in the afternoon". | The first three get "I can’t give medical advice…" with no product cards. A cold: the three Immunity products. Tired: Magnesium, Clear Focus and Daily NAD+. |

### A browser that used Vitaheal before

| # | Check | Expected |
|---|---|---|
| D.60 | Make a browser from before 2026-11-25: change a product, a plan, a store campaign, a synonym (`knackered`), the chatbot's welcome and the theme; place an order and **Pack** it; subscribe on the store; chat; leave something in the cart. Then delete `mp.vitaheal-demo.installed.v1` and reload. | The store sells sixteen products. Gone: the changes to products, plans, campaigns, search rules, chatbot settings and the theme. A copy of the theme that was published is a Draft, and the store runs Vitaheal 2.0. Still there: the order and its packed step, the subscribers with the new one, the chat, any announcement email in Marketing, the chatbot on or off as it was, the Merchandise Cloud connection, and the cart, with no "store changed" notice. A campaign that was announced no longer links to its email. `mp.vitaheal-demo.installed.v1` holds seed 2. |
| D.61 | Change a product again, then reload. | The change stays: a browser at seed 2 is not seeded again. |
| D.62 | Before D.60's reload, change a Northfold product too. | After the reload the Northfold change is still there: only Vitaheal moved to seed 2. |
| D.63 | Apply Vitaheal to Northfold and change a product there. In `mp.demo-store.northfold-demo.installed.v1` set `seedVersion` to 1, then reload. | Northfold, running Vitaheal, sells the sixteen products, and the change is gone. The record says seed 2. |
| D.64 | Create sales channel from the **Vitaheal** theme. Rename a product of the new store, then reload. | The new name stays. |
| D.65 | Vitaheal › Edit theme › Home › **Featured products** (its title is Our range; pressing Our range in the preview selects it too). | The **Products** slider sits at its right end; focused, it reads 12, and Home / End take it to 2 / 12. Northfold, Torqline, Lumos, Aurora and Daybloom show the same featured rows as before. |

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
| B.7 | Apply a theme, then look at the store's keys. | `<prefix>installed.v1` holds `{ blueprintId, seedVersion, appliedAt }`. Restore removes it. On Vitaheal, Restore writes it again at once, naming Vitaheal and seed 2. |
| B.8 | Choose a vehicle and fill a cart, then paste the store's address into a new tab. | The new tab has an empty cart and no vehicle (they live in sessionStorage, per tab). |
| B.9 | Fill the browser's storage, then change a product. | One warning toast, "Changes not kept". The app keeps working. |
