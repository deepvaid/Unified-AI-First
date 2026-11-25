# Vitaheal demo: the walkthrough script

For a sales person showing the Vitaheal (demo) store to a prospect. It follows the film
(`npm run demo:video` makes `output/demo-video/vitaheal-demo.mp4`), so you can play the film or
do the same steps live. About 10 minutes live, less as a film. The film shows every step but
the last: step 14, the theme library, is live only. Since 25 November the plan with delivery
options is step 8, so the steps after it moved down by one.

Vitaheal is a made-up Swedish supplements brand. Nothing is charged and nothing leaves your
browser.

## Before you start

1. Open the store's page: **Sales channels › Vitaheal (demo)**.
2. In its **Settings** tab, press **Restore original store**, then **Restore store**. This puts
   back the theme (its drafts and copies are removed), products, plans, subscribers, campaigns,
   chatbot and merchandising, removes plans you made in it, and disconnects Merchandise Cloud, so
   the demo starts the same way every time. Orders you placed before stay in Commerce.
3. Press **View store**. Keep the store in one tab and the admin in another. An order placed on
   the store is in the admin at once, and what you do to it in the admin shows on the store.
4. If the page was open while a new version went out, reload it once.

## The story in one line

A brand sells on subscription. The shopper buys, manages the subscription and gets help on the
store; the merchant sees it all, sends the order, runs a campaign, and switches on search and
recommendations.

## Steps

| # | Where | Do | Say |
|---|---|---|---|
| 1 | Store, home | Scroll the home page: the hero with its **Made in Sweden** badge and three figures, the **Shop by goal** carousel, the range, and the promise cards. Press **Shop** in the menu, then **Sleep**, then **Unwind**. | "This is the brand's own store: its colours, its photos, prices in kronor. The hero gives three facts a shopper cares about: what a plan saves, free shipping over 549 kr, and 30 days to try Unwind. The menu opens by goal." |
| 2 | Store, product | Point at the three purchase options and the line under them (**Subscription terms**, **My subscriptions**). Scroll down and open **Product facts**. Scroll back up, keep **3-month supply**, press **Add subscription to cart**, then **View cart**. | "Most of their orders are subscriptions, so the plan is the first choice, with what the shopper saves and the terms one press away. Product facts is the product's own table: serving size, each ingredient with its amount, how to take it." |
| 3 | Store, cart | Type `WINTER15` in **Discount code**, press **Apply**. | "The code is from the campaign in the bar at the top. It lowers the first order; later deliveries stay at the plan's price, and the cart says so." |
| 4 | Store, checkout | Press **Checkout**. Tick the agreement, which has the **Subscription terms** under it. Press **Pay**. | "Checkout is in kronor, with card, Apple Pay and Google Pay. The details are filled in for the demo." |
| 5 | Store, account | On the confirmation press **Manage your subscription**. Press **Skip next delivery**, then **Skip this delivery**. | "Shoppers skip, pause, change plan or cancel on their own. No support ticket." |
| 6 | Store, chat | Open **Need help?**. Press **Where is my order?**. Then type "I am always tired in the afternoon". | "The assistant knows this shopper's order, and suggests products for a need. It does not give medical advice." |
| 7 | Admin, Commerce | **Orders**: open the newest order. Then **Subscriptions › Subscribers**: open Linnea Berg. | "The order has the code and the discount on its line. The subscriber page has the same actions the shopper has, plus charge now." |
| 8 | Admin, then store | **Commerce › Subscriptions › Plans**: press **New plan**, then **Plan with delivery options**. Plan name `Balance subscribe and save`, shopper label `Subscribe and save`. Type `20` in the first row's **Discount**, press **Add plan option** twice and type `15` and `10`: every 1, 2 and 3 months. Tick **Sell Balance on this plan**, point at the **Shopper preview**, press **Create plan**. On the store open **Balance** and pick **Deliver every 2 months**. | "This is an early version of where subscriptions are heading: one plan, and the shopper chooses how often, each with its own discount. The product page offers the three at once, and the button reads Add subscription to cart." |
| 9 | Admin, then store | **Commerce › Fulfillment**: open the newest one. Press **Pack**, then **Pick carrier** and **Create label**, then **Mark shipped**. On the store, open **Account**, then the order. | "The order is packed, labelled and handed to PostNord in a few clicks. The shopper sees it is on its way, with the tracking number, without asking." |
| 10 | Admin, store › Campaigns | Show **Winter wellness week**: its code, orders and revenue. Open its menu, **Announce by email**. | "A campaign is a message on the store, a code, and its results. One click writes the email to this store's customers." |
| 11 | Admin, Merchandising | Open **Merchandising** for the store. Press **Connect Merchandising**. | "Eight products sync, and search and recommendations are on." |
| 12 | Store | Type **sleep** in the search field in the header, then **tired** on the results page. Open Unwind and scroll to **Goes well with Unwind**. | "Unwind is pinned first for sleep. 'Tired' has no product, but a synonym leads to energy and focus. The row is chosen by the store's recommendation engine." |
| 13 | Admin, then store | **Merchandising › Synonyms › Add new**: `knackered` leads to `energy`. Search **knackered** on the store. | "Change a rule, and the store follows at once." |
| 14 | Admin, store › Themes | Open **Themes**. In **Theme library** press **Apply** on **Northfold**, read the list, press **Apply theme**. Press **Show store** in the message. Back on **Themes**, press **Restore original store**, then **Restore store**. | "A theme here is a whole store: its look, products, pages and campaigns. One click makes Vitaheal a copy of Northfold, in dollars. Its plans are paused, its subscribers keep their subscriptions, and orders stay. Restore puts Vitaheal back, theme included. It is in the Settings tab too." |

## More to show if they ask

- **How a store is made:** Sales channels › **Create sales channel**. The new store shows its setup
  steps, then a **Launch your store** checklist. The click-by-click is in
  [daybloom-demo-script.md](daybloom-demo-script.md), "To start from the very beginning".
- **A wrong code:** type `NOPE`, or `BLACK25` (ended). Each says why.
- **A redirect:** search **returns** on the store: it opens the refund policy.
- **A search with no result:** it offers the collections instead of a dead end.
- **Search preview:** Merchandising › Search › Preview shows what shoppers get, before they do.
- **Pinning:** Merchandising › Search › Pinning: open **energy**. Electrolytes leads although it
  never says "energy".
- **Another engine:** in Recommendation engines switch **Goes well with** off and **New in** on.
  The row under a product changes.
- **Add a product:** Products › Create product, assign it to Vitaheal. It is in the store, and
  in its search, at once.
- **Charge now:** on a subscriber, to place a renewal order.
- **Delivered:** on a shipped fulfillment press **Mark delivered**. The order is complete and the
  shopper's order page says Delivered.
- **How the options look:** the store's **Themes** › edit the theme › **Product** › Product detail ›
  **Purchase options**. Choose radio buttons or a dropdown, change the line under the options,
  press **Publish**. Restore the store afterwards.
- **The product's facts:** Products › **Unwind** › **Product facts**. Change a value, press
  **Save**: the store's Product facts row shows it.
- **A goal's own line:** open **Shop** › **Sleep**: the collection says what it is for under its
  title. The menu's **About** has the story, the guarantee and the help pages.
- **A bigger menu and a plan with delivery options, seeded:** the Daybloom (demo) store
  ([daybloom-demo-script.md](daybloom-demo-script.md)).
- **Phone:** make the store's tab narrow and press the menu button. **Shop** and **About** open in
  place inside the menu. Once Merchandise Cloud is connected, the search field has a row of its own
  under the header.

## What not to promise

These work in the admin but do not change the store yet. If asked, say they are not part of
this demo.

- Search rules (boost and bury), promo cards and banners.
- Smart collections and collection merchandising.
- Recommendation engines on pages other than the product page, and an engine's filters.
- Search filters, suggestions while typing, and spelling correction.
- Email opens and clicks: a sent campaign reads "Sending".
- Printed pick lists and packing slips, carrier rates, and a parcel split over two locations.
- A second discount code on one order, or a discount on later deliveries.

## If something looks wrong

- **No search field on the store:** Merchandise Cloud is not connected yet (step 11).
- **No discount code field in the cart:** no campaign with a code is running. Restore the store.
- **Numbers differ from the film:** someone used the demo before you. Restore the store.
- **The store looks like another store (Northfold, Torqline, Lumos or Daybloom):** another theme is
  applied. Restore the store.
- **The store still has the older look (Figtree, the menu centred under the logo):** this browser
  kept an edited Vitaheal theme from before 25 November. Restore the store.
- **Create plan says the name is taken, or Balance cannot take another plan:** the plan from step 8
  is still there. Restore the store.
