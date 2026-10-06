# Storefront and checkout reference — rohan.uat.mymaropost.net

Read on 2026-10-06 as the feature reference for the prototype's shopper side (product page, cart,
checkout), replacing the earlier neto-checkout-integration store. The owner approved one Add to
Cart click so the checkout would open. Nothing was typed into any field and no order was placed.

It's a Maropost store on the Neto "skeletal" theme, using the current hosted checkout at
`/checkout/`. Prices are in AUD and include GST.

## Product page (`/gst-680625-in`)

- Breadcrumb: Home / TAX / product.
- Title, share menu, price ($680.62).
- Instalment line under the price: "or 4 interest-free payments of $170.16 with [afterpay mark]
  Learn More".
- "In Stock" badge.
- Quantity field, **Add to Cart** (primary) and **Wishlist**.
- **Calculate Shipping** panel: quantity, country (default Australia), postcode, Calculate. It lists
  the store's rates under the panel: FREE SHIP – FREE · qa – kps – $1.10 · Flat – $10.00 ·
  ROUND-SHIP-10 – $11.00 (ETA: 3 days).
- Description / Specifications / Reviews tabs.
- "More From This Category" product grid.

## Add to cart

A modal, "Item has been added to your cart", with the line ("1 x GST-680625-IN added to cart") and
three buttons: Continue Shopping · View My Cart · **Checkout Now**.

## Cart (`/_mycart`)

- Title "Shopping Cart", **Create Quote From Cart**, **Checkout Now** (top and bottom).
- Table: Item Description (with an edit pencil) · Quantity · Price · remove.
- Continue Shopping · Update My Changes.
- Shipping Calculator (country, post code) · Discount Code (coupon field, Apply Coupon Code).
- Totals: Sub Total · shipping options as radios (with "Estimated arrival of 3 days") · Shipping
  cost to Australia · **Discounts Applied** (an automatic "15off" −$102.09) · Discount Total ·
  **Tax Inc.** $52.59 · Shopping Cart Total $578.53.

## Checkout (`/checkout/`)

From top to bottom:

- The store's checkout logo.
- A **store notice** banner ("test checkout 12345").
- **Express Checkout**, showing "Loading payment options…" while Stripe's express checkout element
  loads, then a Google Pay button. Then an **OR** rule.
- A three-step **stepper**: 1 Contact Details → 2 Delivery Method → 3 Payment Method.
- **Contact Details** with a **Sign-in** button.
- **Delivery Options** cards: Home Delivery ("Delivered to you in 3-5 business days", Delivery) ·
  Click & Collect ("Collect from your nearest store", Free).
- Email\*, then two opt-ins: the newsletter (**pre-ticked**) and "Yes, I'd like to receive SMS
  updates about offers and promotions".
- **Delivery Address**: First Name\* · Last Name\* · Company Name (Optional) · Mobile Number\* with
  the hint "FOR DELIVERY PURPOSE" · Country\* · Address Line 1\* · "+ Address Line 2 (Optional)" ·
  Postcode\* · Suburb\* · State\* · "Billing address same as Shipping address." · **Continue**.
- Delivery Method and Payment Method open in turn after Continue. They weren't opened, because
  that needs contact details.
- **Order Summary** (right column): Edit Cart; the line with its **original price struck through**
  ($680.62) above the discounted price ($578.53); Discount Code + Apply; **Active Discounts**
  ("15off (15off)" −$102.09 with a remove ×); Items $680.62 · Shipping $0.00 · Discount −$102.09 ·
  **Tax** $52.59 · **Total "AUD $578.53"**.

## The payment model (from the checkout's own script)

The checkout tracks a payment on **two axes**:

| Axis | Values |
|---|---|
| Method type | card, zip, affirm, link, apple_pay, google_pay, wallet, afterpay_clearpay, klarna, deposit, cheque, cod, other, voucher, pay_in_4, venmo |
| Provider | account, stripe, paypal, eway, reward, offline, voucher |

One checkout therefore offers **several providers at once**: Stripe-rail methods next to PayPal,
offline methods (bank deposit, cheque, cash on delivery), store vouchers, reward points and account
credit. Its analytics events are Checkout Page Viewed, Checkout Started, Checkout Step, Checkout
Coupon Applied, Checkout Payment Initiated, Checkout Cart Created.

## Footer payment marks

Afterpay · Bank Deposit · Credit & Debit Cards · Credit or Debit Card – paypal · Diners Club ·
zipMoney · PayPal Checkout · Afterpay · Visa – STRIPE · MasterCard.

## What it means for the prototype

The prototype adopts these in the storefront wave (Wave 4 of the Maropay aesthetic pass). The plan
and the owner's scope check happen before that wave starts.

- **Maropay sits beside other providers.** Today a live store's checkout offers only Maropay's
  methods. A method kept with the previous provider (PayPal Checkout) disappears, and there are no
  offline methods. The reference shows Maropay should be one provider among several.
- **Checkout:** store notice, sign-in, Company (optional), "+ Address line 2", the newsletter
  opt-in, discount code and active discounts, per-line strike-through, a tax line, and the total
  with its currency code.
- **Product page:** "Learn more" on the instalment line, and a shipping estimate.
- **Add to cart:** a confirmation with Continue shopping / View cart / Checkout.
- **Deliberate differences:** the prototype keeps a one-page checkout rather than the three-step
  stepper, and leaves out Create Quote From Cart (B2B, not payments).
