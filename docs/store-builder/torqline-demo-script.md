# Torqline demo: the walkthrough script

For a sales person showing the Torqline Auto Parts (demo) store to a prospect. About 10 minutes
live. There is no film of this store.

Torqline is a made-up online auto parts store, selling in US dollars: brakes, filters, oil,
batteries, bulbs, wipers, spark plugs and a few accessories. Every part lists the vehicles it fits.
It has no subscriptions. Nothing is charged and nothing leaves your browser.

## Before you start

1. Open the store's page: **Sales channels › Torqline Auto Parts (demo)**.
2. In its **Settings** tab, press **Restore original store**. This puts back the parts and their
   fitment, campaigns, chatbot and search rules, reconnects Merchandise Cloud and forgets the
   shopper's vehicle, so the demo starts the same way every time. Orders you placed before stay in
   Commerce.
3. Press **View store**. Keep the store in one tab and the admin in another.
4. If the page was open while a new version went out, reload it once.

## The story in one line

A parts store only sells what fits. The shopper picks their vehicle once and every page answers
"will it fit?"; they find a part by its number and buy it with a code. The merchant adds a vehicle
to a part, and the store follows at once.

## Steps

| # | Where | Do | Say |
|---|---|---|---|
| 1 | Store, home | Scroll the home page: the vehicle finder, **Shop by category**, **Popular parts**, the trust strip. | "Charcoal and safety yellow, condensed headings. Every section on this page is one the merchant can move or edit." |
| 2 | Store, vehicle | Press **Select vehicle** in the header. Pick Year **2019**, Make **Ford**, Model **F-150**, press **Save vehicle**. | "One vehicle, chosen once. The header now says 2019 Ford F-150, and the home page row reads **Popular parts for your 2019 Ford F-150**: the parts that fit it first, then the ones that fit anything." |
| 3 | Store, Brakes | Open **Brakes** in the menu. | "**Showing parts for 2019 Ford F-150**, and **Only show parts that fit** is on: 2 of 4 brake parts. Each card has its part number (or what it comes in: **Front or rear**), a fit badge, the stock and **Add to cart**." |
| 4 | Store, Brakes | Turn **Only show parts that fit** off. | "Now the car pads and rotors show too, marked **Doesn't fit your 2019 Ford F-150**. Always an icon and words, never colour alone." |
| 5 | Store, filters | Open **Deals**. Point at **Category**, **Brand** and **Price** in the filters. | "Filters for what parts are bought by: category, brand and price. Four brands, each the maker of its own parts." |
| 6 | Store, product | Open **Brakes** again, then **Ceramic Brake Pads, Truck & SUV**. Pick **Front**. Open **Specifications**, **Vehicle fit** and **Warranty**. | "Green: it fits. The part number follows the position you pick. **Vehicle fit** lists every vehicle it fits, with yours highlighted. Limited lifetime warranty." |
| 7 | Store, search | Press the search icon. Type `tqbrk4472` and press Enter. | "A part number, typed any way, goes straight to the part, with that variant chosen: the rear pads." |
| 8 | Store, cart | Pick **Front** and press **Add to cart**, then **View cart**. Type `BRAKES15` in **Discount code**, press **Apply**. | "The line says **Front · Part # TQ-BRK-4471 · Fits 2019 Ford F-150**. Brake week is on: 15% off brakes, so $64.99 becomes $55.24." |
| 9 | Store, checkout | Press **Checkout**, then **Pay**. On the confirmation press **Track your order**. | "Checkout in dollars, by card, Apple Pay or Google Pay. Delivery is free, in 3 to 5 business days. The order page keeps the part number and the vehicle it was bought for." |
| 10 | Store, no fit | Press the vehicle in the header, choose **2015 Honda Civic**, press **Save vehicle**, then open **Brakes**. | "**No parts fit your 2015 Honda Civic in Brakes**. Two ways on: **Show all brake parts**, or **Change vehicle**. Change it back to the 2019 Ford F-150." |
| 11 | Store, chat | Open **Need a hand?**. Type "Will the front brake pads fit my 2019 F-150?", then "Can I fit brake pads myself?". | "The assistant checks the fit against the same table, looks up part numbers and orders, and sends brake work to a qualified mechanic." |
| 12 | Admin, Commerce | **Orders**: open the newest order. | "The line has the part number and the vehicle, and the code and discount are on it." |
| 13 | Admin, Products | Open **Standard Battery**. In the **Vehicle fitment** card press **Add vehicle**, pick **Ford**, **F-150**, years **2015** to **2020**, press **Add vehicle**, then **Save** at the top of the page. Back in the store tab, open **Batteries**. | "The base F-150 without start-stop takes the standard battery too. Add it once, and the store says **Fits your 2019 Ford F-150**, in the tab that was already open. A vehicle that is already listed is refused." |
| 14 | Admin, store › Campaigns | Show **Brake week**: its code, orders and revenue. Open its menu, **Announce by email**. | "A campaign is a message on the store, a code, and its results. One click writes the email to this store's customers." |
| 15 | Admin, Merchandising | Open **Merchandising** for the store: **Synonyms**, **Redirects**, **Pinning**. | "The rules behind search: 'disc' finds the rotors, 'returns' opens the refund policy, and an oil change search leads with oil and filters." |
| 16 | Admin, store | In the **Settings** tab press **Restore original store**. | "Everything back as it was for the next demo: the battery's fitment, the campaign, the rules. The shopper's vehicle is forgotten too." |

## More to show if they ask

- **Universal fit:** motor oil, brake fluid, the tire gauge and the jump starter fit any vehicle, and
  say **Universal fit** whatever vehicle is chosen.
- **Wiper lengths:** with the F-150 chosen, the **All-Season Beam Wiper Blade** says "Fits your 2019
  Ford F-150 · Driver 22 in, passenger 22 in". Pick **16 in** and it turns amber: that length
  doesn't fit, and the cart line won't claim it does.
- **Only a few left:** Ceramic Brake Pads, Car & Crossover, **Rear**, says "Only 2 left"; Iridium
  Spark Plugs, **Set of 8**, "Only 1 left".
- **Sold out:** Coated Brake Rotor, Car & Crossover, **Rear**.
- **A sale price:** **Deals** has the AGM Battery at $219.99 instead of $249.99, the brighter bulbs
  and the jump starter.
- **No vehicle:** press **Clear vehicle** in the vehicle drawer. The cards drop their fit badges (universal parts keep **Universal fit**), the list asks for a vehicle, and a product page says **Check fit** with **Select vehicle**.
- **Search rules:** search **car battery** (a synonym finds both batteries), **disc** (the rotors),
  **shipping** (the shipping page).
- **Fitment guarantee:** the footer's **Fitment guarantee** page explains the badges and what
  happens when a part doesn't fit.
- **Phone:** make the store's tab narrow. Filters open as a sheet; the menu has every category.

## What not to promise

These are not part of this demo. If asked, say so.

- More than one vehicle at a time (a garage), or finding a vehicle by VIN or license plate.
- Fit by engine, trim or drive: fitment is by year, make and model.
- Theme edits are kept for the tab you make them in: a store tab opened before, or after a
  reload, shows the store's theme as it was. Show theme edits in the editor.
- Click & collect, subscriptions, reviews, battery core charges and "Notify me when it's back".
- Search suggestions while typing, and spelling correction.
- Email opens and clicks: a sent campaign reads "Sending".

## If something looks wrong

- **The numbers differ from this script:** someone used the demo before you. Restore the store.
- **No discount code field in the cart:** no campaign with a code is running. Restore the store.
- **No search icon on the store:** Merchandise Cloud was disconnected. Restore the store, or
  connect it again in Merchandising.
- **A part says Check fit:** no vehicle is chosen. Press **Select vehicle** in the header.
