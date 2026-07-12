# Commerce action-flow specs — UAT deep crawl (2026-07-12)

Source: uat.maropost.com/commerce/116000, live crawl (agents + main-loop deep-dives). Excludes Products/* and Reports/* (previously crawled) and Retail/Merchandising (separate modules).

## Commerce nav (complete, verified)
Orders → **Sales Orders** `/orders` · **Draft Orders** `/orders/draft` · **Fulfillment** `/fulfillment`
Promos & Coupons → **Promotions** `/promotions` · **Custom Gift Cards** `/gift-cards` · **Purchasable Gift Cards** `/gift-cards/Purchasable`
**Sales Channels** `/sales-channel`
**Do NOT exist:** Returns (`/returns` → 404), commerce Customers, standalone Shipping/Payments/Store-Settings sections (config lives inside each sales channel — our SalesChannels/store-editor module already models this).

## 1. Sales Orders
- **List** `/orders`: header "Sales Orders" + **NEW DRAFT ORDER** + FILTERS dropdown; tab "ALL" + "+ ADD FILTER". Columns: Order | Contact | Fulfillment Status | Payment Status | Status | Sales Channel | Tags | Net Payable | Date Added. Status chips: Fulfilled (green), Paid, Processing (orange), Shipped (blue), Completed, Cancelled (red). Pagination 10/pg. **No row kebabs, no bulk bar, no search box** — row click opens detail.
- **Detail** `/orders/:id`: header = order # + placed date + **CANCEL ORDER**. Left 2/3: Customer card (avatar/name/email) · info grid (Currency, Region, Payment method, Country, Email, Sales Channel, Phone) · Shipping + Billing addresses (editable) · Summary items table (Product, SKU, status badge, Price, Qty, Coupon, Discount %, Total) · Totals (Subtotal/Total/Net Payable) · Payment section (Paid; details: Reference, Method, Captured At, Amount, Pending) · Shipping (method/fee/address) · Fulfillment (status, linked fulfillment #, step indicators **Picked → Pack → Carrier → Shipped**, fulfilled-from location, products). Right 1/3 sidebar: Order Status badge · Payment Status badge · Fulfillment Status badge · Net Payable · **Tags** (autocomplete) · **Timeline**: "Write Internal Notes" textarea + auto-logged history ("Order placed via Draft Order 2mo ago").

## 2. Draft Orders
- **List** `/orders/draft`: NEW DRAFT ORDER; columns Draft (#) | Contact | Sales Channel | Total | Date Added | Actions (kebab).
- **Create** `/orders/draft/new` — full-page composer (NOT a wizard/drawer):
  - **Contact**: "Search existing contact" OR **CREATE NEW CONTACT**; info grid autofills (Currency AUD, Region, Sales Channel, Email, Phone, Country); Shipping Address + Billing Address ("Add Address" affordances).
  - **Order Line**: "Search existing products" OR **ADD CUSTOM ITEMS**.
  - Conversion rule (verbatim): "To convert this draft order into a sales order, please ensure a customer, shipping method, sales channel, and at least one item are selected."
  - Footer: BACK · **MARK AS PAID** · **GENERATE PAYMENT LINK**.

## 3. Fulfillment
- **List** `/fulfillment`: FILTERS + "All Locations" select. Columns: ID | Order | Customer | Location | Fulfillment Status | Payment Status | Product QTY | Order Status | Sales Channel | Total | Created At | Actions. Fulfillment statuses observed: **Picked, Label Created, Shipped** (order-detail steps add Pack/Carrier). Locations e.g. "Oxford warehouse".

## 4. Promotions
- **List** `/promotions`: NEW PROMOTION; tabs All / Active / Inactive. Columns: Name | **Discount Code / Automatic** | Discount Method | Discount Type | Sales Channels | Start Date | End Date | Status | Actions.
- **Create** `/promotions/new` — full-page: **General** (Title*, Description) · **Choose Discount Method** (Discount Method* select: **Order | Product**; Discount Status default Active) · **Sales Channels*** multi ("applicable only for those sales channels") · **Details** section (method-dependent: discount type/value, code vs automatic, start/end dates — evidenced by list columns). CANCEL / SAVE PROMOTION.

## 5. Custom Gift Cards (merchant-issued)
- **List** `/gift-cards`: NEW CUSTOM GIFT CARD; columns Code | Contact | Recipient | Status | Initial Balance | Current Balance | Date Added.
- **Create** `/gift-cards/create`: General (Initial Value*, Email, Gift Card Message) · Expiration Date radio (**No Expiration Date** default / Set Expiration Date) + legal note ("Countries have different laws for gift card expiry dates…") · Status (Active) · **Image** upload (drag-drop, JPG/PNG/GIF/WebP ≤20MB). CANCEL / SAVE. Leaving with edits triggers an "Unsaved Changes — Stay on Page / Leave Page" dialog.

## 6. Purchasable Gift Cards (storefront products)
- **List** `/gift-cards/Purchasable`: NEW PURCHASABLE GIFT CARD; columns Name | Denominations | Status | Date Added | Action.
- **Create** `/gift-cards/Purchasable/create`: General (Name, URL, Gift Card Message) · **Denominations*** repeater (Amount + AUD + ADD DENOMINATIONS) · Status (default **Draft**) · Media (drag-drop / ADD MEDIA, Show More) · **Organise** (Tax Category, Material, Brand, Tags, Collections, Categories — mirrors product organise). CANCEL / SAVE.

## 7. Sales Channels
- **List** `/sales-channel`: "Control which products are available in which channels" + NEW SALES CHANNEL; columns Store (#) | Title | Type (Web Store | Mcc Integration) | Description | Date Added | Actions. Matches the prototype's rebuilt SalesChannels module — no rework needed beyond copy alignment.

## Legacy UX pain points (fair game to fix)
1. Orders list has no search, no bulk actions, no row menu — detail page is the only path; slow full-page loads everywhere ("Preparing optimised workspace").
2. Aggressive unsaved-changes modal fires even on untouched forms.
3. Promotions "Details" section is invisible until a method is chosen — no preview of required fields.
4. Draft-order composer gives no running total panel; conversion requirements shown as a wall of text.
5. Empty states are bare "No records found" text.
