# Vitaheal demo: the walkthrough script

For a sales person showing the Vitaheal (demo) store to a prospect. It follows the film
(`npm run demo:video` makes `output/demo-video/vitaheal-demo.mp4`), so you can play the film or
do the same steps live. About 8 minutes live, three and a half minutes as a film. Step 12, the
theme library, is live only: the film does not show it.

Vitaheal is a made-up Swedish supplements brand. Nothing is charged and nothing leaves your
browser.

## Before you start

1. Open the store's page: **Sales channels › Vitaheal (demo)**.
2. In its **Settings** tab, press **Restore original store**, then **Restore store**. This puts
   back the theme (its drafts and copies are removed), products, plans, subscribers, campaigns,
   chatbot and merchandising, and disconnects Merchandise Cloud, so the demo starts the same way
   every time. Orders you placed before stay in Commerce.
3. Press **View store**. Keep the store in one tab and the admin in another.
4. If the page was open while a new version went out, reload it once.

## The story in one line

A brand sells on subscription. The shopper buys, manages the subscription and gets help on the
store; the merchant sees it all, runs a campaign, and switches on search and recommendations.

## Steps

| # | Where | Do | Say |
|---|---|---|---|
| 1 | Store, home | Scroll the home page. Open **Sleep**, then **Unwind**. | "This is the brand's own store: its photos, its type, prices in kronor." |
| 2 | Store, product | Point at the three purchase options. Keep **3-month supply**. Press **Add subscription to cart**, then **View cart**. | "Most of their orders are subscriptions, so the plan is the first choice, with what the shopper saves." |
| 3 | Store, cart | Type `WINTER15` in **Discount code**, press **Apply**. | "The code is from the campaign in the bar at the top. It lowers the first order; later deliveries stay at the plan's price, and the cart says so." |
| 4 | Store, checkout | Press **Checkout**. Tick the agreement. Press **Pay**. | "Checkout is in kronor, with card, Apple Pay and Google Pay. The details are filled in for the demo." |
| 5 | Store, account | On the confirmation press **Manage your subscription**. Press **Skip next delivery**, then **Skip this delivery**. | "Shoppers skip, pause, change plan or cancel on their own. No support ticket." |
| 6 | Store, chat | Open **Need help?**. Press **Where is my order?**. Then type "I am always tired in the afternoon". | "The assistant knows this shopper's order, and suggests products for a need. It does not give medical advice." |
| 7 | Admin, Commerce | **Orders**: open the newest order. Then **Subscriptions › Subscribers**: open Linnea Berg. | "The order has the code and the discount on its line. The subscriber page has the same actions the shopper has, plus charge now." |
| 8 | Admin, store › Campaigns | Show **Winter wellness week**: its code, orders and revenue. Open its menu, **Announce by email**. | "A campaign is a message on the store, a code, and its results. One click writes the email to this store's customers." |
| 9 | Admin, Merchandising | Open **Merchandising** for the store. Press **Connect Merchandising**. | "Eight products sync, and search and recommendations are on." |
| 10 | Store | Search **sleep**, then **tired**. Open Unwind and scroll to **Goes well with Unwind**. | "Unwind is pinned first for sleep. 'Tired' has no product, but a synonym leads to energy and focus. The row is chosen by the store's recommendation engine." |
| 11 | Admin, then store | **Merchandising › Synonyms › Add new**: `knackered` leads to `energy`. Search **knackered** on the store. | "Change a rule, and the store follows at once." |
| 12 | Admin, store › Themes | Open **Themes**. In **Theme library** press **Apply** on **Northfold**, read the list, press **Apply theme**. Press **Show store** in the message. Back on **Themes**, press **Restore original store**, then **Restore store**. | "A theme here is a whole store: its look, products, pages and campaigns. One click makes Vitaheal a copy of Northfold, in dollars. Its plans are paused, its subscribers keep their subscriptions, and orders stay. Restore puts Vitaheal back, theme included. It is in the Settings tab too." |

## More to show if they ask

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
- **Phone:** make the store's tab narrow. Search is in the menu.

## What not to promise

These work in the admin but do not change the store yet. If asked, say they are not part of
this demo.

- Search rules (boost and bury), promo cards and banners.
- Smart collections and collection merchandising.
- Recommendation engines on pages other than the product page, and an engine's filters.
- Search filters, suggestions while typing, and spelling correction.
- Email opens and clicks: a sent campaign reads "Sending".
- A second discount code on one order, or a discount on later deliveries.

## If something looks wrong

- **No search box on the store:** Merchandise Cloud is not connected yet (step 9).
- **No discount code field in the cart:** no campaign with a code is running. Restore the store.
- **Numbers differ from the film:** someone used the demo before you. Restore the store.
- **The store looks like Northfold or Torqline:** another theme is applied. Restore the store.
