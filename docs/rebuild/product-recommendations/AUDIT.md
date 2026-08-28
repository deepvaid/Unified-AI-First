# AUDIT — Product Recommendations

Source: `https://uat.maropost.com/accounts/116000/product_recommendations` · crawled 2026-08-28
(Products → Product Recommendations in the sidebar. Legacy Vuetify 2 app in the Vuetify 3 shell.)

## Purpose & primary task

Manage the product data that powers recommendation blocks in emails: import/maintain a **product
catalog**, define **product feeds** (rule-driven product sets), and design **product feed
templates** (the rendered e-mail block). Primary tasks: import a catalog, create a feed, create a
template.

## Layout

```
Breadcrumb "My Product Recommendations"
H1 "Product Recommendations"
Tabs: PRODUCT CATALOG · PRODUCT FEEDS · PRODUCT FEED TEMPLATES   (each is a route)
  /product_recommendations                     → catalog
  /product_recommendations/product_feeds      → feeds
  /product_recommendations/product_feed_templates → templates
Per-tab: info banner · toolbar (filter select + primary CTA) · data table · pagination
```

No search box on any of the three tables. No bulk selection anywhere. Pagination is
"Rows per page: 10 ▾ · 1-10 of N · ‹ ›" (Vuetify data-table footer).

## Tab 1 — PRODUCT CATALOG

- Info banner (yellow, ⓘ): "Import Product Catalog to create or update existing products.
  Products with incomplete information will not be included in product recommendations.
  **Learn more about Product Catalog.**" (link → galaxy.maropost.com KB article)
- Toolbar: `Select Source` select (label below the control, 11 options: All · Default · Sk Test ·
  Keap · Amazon · Woocommerce · Magento · Retail Express · Commerce Cloud · Shopify · Unified) +
  black `IMPORT PRODUCT CATALOG` button. Filter applies instantly on select.
- Table: Item ID · (image thumb) · Name (link) · Price (right-aligned) · Created At · Updated At ·
  Actions (kebab).
  - 207,535 products under All; name links go to the product's Store URL (external).
  - Data oddities seen: empty Name cells, `$0.00` and negative prices (`$-250.00` Trade In).
  - Dates formatted "Aug 11, 2025 at 08:12 AM".
- Row kebab: single item **Edit Product** → right drawer (see FLOWS).

## Tab 2 — PRODUCT FEEDS

- Info banner: "Without importing a product catalog, product recommendations will not be generated."
- CTA: `NEW PRODUCT FEED` (black, right-aligned; no filter select on this tab).
- Table: Name · Metric · Created At · Updated At · Actions. 54 feeds.
  - Metric values observed: Best Sellers, Bought Together, New Arrivals, Trending,
    Similar Products — but the current form only offers Best Sellers / New Arrivals /
    Top Trending, so Bought Together / Similar Products / Trending rows are legacy types that can
    no longer be created (⚠ discrepancy).
- Row kebab: single item **Edit Product Feed** → right drawer.

## Tab 3 — PRODUCT FEED TEMPLATES

- No banner. Toolbar: status select `Active Product Feed Templates` / `Archived Product Feed
  Templates` + `NEW PRODUCT FEED TEMPLATE` CTA.
- Table: Name · Block Layout (ⓘ tooltip on header) · Created At · Updated At · Actions. 40 active.
  - Block Layout values: `1x3`, `2x3`, `3x3` (rows×columns).
- Row kebab: **Edit Product Feed Template** · **Archive Product Feed Template** (archive not
  executed — unverified whether it confirms first).

## Component mapping (→ design system)

| UAT element | Rebuild with |
|---|---|
| Breadcrumb + H1 | `MpPageHeader` (`backTo` not needed; breadcrumb text becomes eyebrow) |
| 3 route tabs | `MpPageHeader` `#tabs` → `v-tabs` (route-driven), or `MpFilterTabs` if kept stateful |
| Yellow info banners | `v-alert` (tonal, info) — token colors |
| Select Source + CTA row | `MpDataTableToolbar` `#actions` (select + button) |
| Tables | `v-data-table` per Data Table Pattern |
| Row kebab | `MpRowActionsMenu` |
| Edit Product / Edit Feed drawers | `MpFormDrawer` |
| Import Product Catalog modal | `MpDialog` (size md) |
| Select Products picker | `MpDialog` (size lg) + toolbar + card grid |
| Template editor | full-page view with preview pane + config rail (`MpSectionRail`-like split not needed; two-column layout) |
| Status select (templates) | `v-select` in `MpDataTableToolbar` |
| Steppers (Rows/Columns) | no Mp equivalent → GAPS (number stepper) |
| Color swatch inputs | no Mp equivalent → GAPS (color field) |

## Copy inventory (verbatim)

- Catalog banner: "Import Product Catalog to create or update existing products. Products with
  incomplete information will not be included in product recommendations. Learn more about Product Catalog."
- Feeds banner: "Without importing a product catalog, product recommendations will not be generated."
- Import modal body: "Your catalog's data will be used to create product feeds. Without the
  mandatory fields: **Item ID, Name, Price, Image URL & Store URL** your product will not be
  included in any product recommendations."
- Import file hint: "Select .csv, .txt, .zip file. The file size limit is 128 MB. / The ZIP file
  must contain only one file which can only be of .txt or .csv type."
- Edit Product warning: "You are about to edit your product catalog. If you make any changes, then
  be aware that any edits you make will be overwritten at the next catalog sync."
- Manual-selection banner (template editor): "Products selected manually will remain static while
  sending the email, irrespective of change in availability or other attributes."
- Category field hint: "Choose a category from the list."
- Feed drawer link: "Want to learn more about Product Feeds?"

## Accessibility issues observed

- Legacy app double-`<main>` landmark (shell + embedded app) — every page.
- Table row kebab buttons have no accessible name (bare `<button>` with icon).
- The three-tab bar uses `tab` elements with hrefs but the active tab is only color-coded
  (light-blue tint); contrast of active tab label on tint is low.
- "Select Source" label is *below* the select (unconventional; floats nowhere).
- Persistent hint texts that read as errors: "Name is required" / "Source is required" visible
  under filled fields in the feed drawer (looks like a validation bug, reads as an error to SR/eyes).
- Catalog product images: decorative thumbs with no alt strategy; broken-image placeholders shown.
- Info tooltips (Block Layout ⓘ, Preview Products ⓘ) hover-only; not keyboard reachable.

## UX friction worth fixing (within improvement scope)

1. No search on any of the three tables (catalog is 207k rows — filter by source only).
2. Kebab menus with a single item (catalog, feeds) — could be a direct icon action.
3. Legacy metric values (Bought Together / Similar Products / Trending) render in the list but
   can't be created; no explanation.
4. "Select Source" label below control; inconsistent with every other form control.
5. Persistent "X is required" hints under valid fields in feed drawer.
6. Edit drawers discard on Cancel/X without an unsaved-changes guard.
7. Import modal CONTINUE gives no context on what step 2 is.
8. Negative/zero prices and empty names surface unvalidated in the catalog table.
9. Feeds tab has no status/filter toolbar at all; templates tab's filter has no label.
10. Template editor upsell panel ("Unlock the full power of Merchandising Cloud", BOOK A DEMO)
    mixed into a working editor page.
