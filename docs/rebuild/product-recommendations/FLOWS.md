# FLOWS — Product Recommendations

All flows crawled 2026-08-28 on UAT account 116000. **No writes were executed** — every flow was
walked to the last safe step and cancelled.

## 1. IMPORT PRODUCT CATALOG (catalog tab, primary CTA)

1. Click `IMPORT PRODUCT CATALOG` → centered modal **Import Product Catalog**.
2. Modal: intro copy (mandatory fields Item ID, Name, Price, Image URL & Store URL), section
   "Select File *" with hint (.csv/.txt/.zip, 128 MB limit, ZIP = exactly one .txt/.csv),
   `SELECT FILE` outlined button (opens OS file picker), `⬇ EXAMPLE` download link,
   "Delimiter" radio group: **Comma (default)** / Semi-Colon.
3. Footer: `CANCEL` / `CONTINUE` — CONTINUE **disabled** until a file is selected.
4. Cancel → returns to catalog, no confirmation.

- **Unverified:** everything past CONTINUE (needs a real file upload → real import). Likely a
  mapping/confirmation step. Success toast / failure state unknown. EXAMPLE link download not
  executed (browser download).

## 2. Edit Product (catalog tab, row kebab → only item)

1. Kebab → `Edit Product` → **right drawer "Edit Product"** (≈600px).
2. Content: warning banner ("edits overwritten at next catalog sync"), read-only Item ID + Source,
   fields: `Name *`, `Price *`, `Image URL`, `Store URL *`, `Category` (searchable multi-select
   with checkboxes; options from Settings → Product Categories: Balls, Cosmetic-Test,
   Cosmetics-Test, Men's, …; persistent hint "Choose a category from the list."),
   `Description` (textarea).
3. Validation: clearing Name → immediate red outline + "Name is required"; `SAVE` becomes
   **disabled** while any required field is invalid.
4. Footer: `CANCEL` / `SAVE` (black). Cancel and the header ✕ both discard **without** an
   unsaved-changes confirm.

- **Unverified:** SAVE success behaviour (toast? row refresh?) — never saved.

## 3. Source filter (catalog tab)

Select any of the 11 sources → table refetches immediately (no Apply button). "All" restores.
Filter is not reflected in the URL.

## 4. NEW PRODUCT FEED (feeds tab, primary CTA)

1. Click → **right drawer "New Product Feed"**.
2. Content, top→bottom:
   - Link "Want to learn more about Product Feeds?"
   - `Product Feed Name *`
   - Toggles (default ON): `Active products only` · `In Stock products only` ·
     `Approved for Webstore products only`
   - `Source *` select (Default · Sk Test · Keap · Amazon · Woocommerce · Magento ·
     Retail Express · Commerce Cloud · Shopify · Unified)
   - `Store Name *` select — **conditional**: present initially, disappears when Source=Default
     (store-backed sources presumably populate it; exact option lists unverified)
   - `Brand` multi-select with checkboxes (Apple, brand-29jul, brand-vishal1, john, Max Factor, …)
     + clear-all ✕; disabled until a source is picked
   - Section FILTER CATEGORIES: radios `Show all categories` (default) / `Limit to specific
     categories` / `Exclude specific categories` (choosing limit/exclude presumably reveals a
     category picker — unverified)
   - Section RECOMMENDATIONS TYPE: type select (**Best Sellers** default · New Arrivals ·
     Top Trending) + period select (**Last 5 days** default · Last 10 · 15 · 30 · 45 · 60 days)
   - Section SORT BY: radios **Random** (default) / Price Low to High / Price High to Low
3. Footer: `CANCEL` / `SAVE`.

- **Unverified:** Store Name option lists per source; category-limit picker UI; save success/error.
- **Defect observed:** hints "Name is required" / "Source is required" render persistently under
  the fields even when filled (Edit drawer shows the same).

## 5. Edit Product Feed (feeds tab, row kebab → only item)

Same drawer as New, titled "Edit Product Feed", prefilled (feed "product rec for mcc":
Source=Default so no Store Name field; Brand chips Apple/brand-29jul/brand-vishal1). Footer
CANCEL / SAVE. Cancel discards silently.

## 6. NEW PRODUCT FEED TEMPLATE (templates tab, primary CTA)

1. Click → **full-page editor** at `/product_recommendations/product_feed_templates/new`.
   Breadcrumb "My Product Recommendations › New Product Feed Template"; header `CANCEL` / `SAVE`.
2. Left pane (preview): `Preview Products` toggle + ⓘ; desktop/mobile segmented device toggle;
   live block preview rendering placeholders `{{products[N].name}}` / `${{products[N].price}}` /
   BUY NOW buttons per configured grid. Below: marketing upsell panel "Unlock the full power of
   Merchandising Cloud" with BOOK A DEMO (external funnel — not followed).
3. Right rail (config):
   - `Product Feed Template Name *`
   - "Choose a method of adding products:" segmented: **Product Feed** (default) / Manual Selection
     - Product Feed mode → `Product Feed *` select (the 54 feeds)
     - Manual Selection mode → dismissible info banner ("Products selected manually will remain
       static while sending the email…") + `ADD PRODUCTS` button → **Select Products modal**:
       search (Product Name or Item ID) + `Within Product Feed` select + the same three toggles +
       filters (Source, Brands, All Categories, price From/To $) + `CLEAR` / `APPLY FILTERS`;
       3-column card grid (checkbox, image, name, ID, price, updated-at), items per page 9,
       1-9 of 1774; footer `CANCEL` / `ADD` (disabled until ≥1 selected).
   - BLOCK LAYOUT: `Rows` stepper (− 1 +; min 1) · `Columns` stepper (− 3 +; max 3) → drives the
     N×M "Block Layout" shown in the list (1x3, 2x3, 3x3).
   - PRODUCT LAYOUT checkboxes (all default ON): Include Product Image / Product Name /
     Product Price / Button.
   - BUTTON STYLING: `Text` ("Buy Now"), `Text Color` (swatch + hex, #FFFFFFFF),
     `Background Color` (swatch + hex, #000000FF).
4. `CANCEL` returns to the list **without** a leave-guard, even with edits.

- **Unverified:** SAVE (never pressed) — success toast/redirect unknown; color-picker popover UI;
  Preview Products toggle with a real feed selected (needs data wired); mobile preview rendering.

## 7. Edit Product Feed Template (templates tab, kebab)

Not opened (same editor prefilled, per Edit pattern elsewhere). **Unverified.**

## 8. Archive Product Feed Template (templates tab, kebab)

**Not executed** (destructive). Presence + label documented; whether it confirms first is
**unverified**. Archived items are viewable via the status filter (Active/Archived).

## 9. Status filter (templates tab)

Select toggles between Active and Archived template lists. Not URL-reflected.

## 10. Pagination (all three tables)

`Rows per page` select (10 default) + `1-10 of N` + ‹ › chevrons. Standard Vuetify footer;
next/prev verified working on catalog.
