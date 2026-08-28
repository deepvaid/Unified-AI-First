# AUDIT — Products (Commerce)

Source: `https://uat.maropost.com/commerce/116000/products?page=1` · crawled 2026-08-28/29
(Modern commerce app — Vuetify 3 (`v-theme--maropost`), unlike the legacy Product Recommendations app.)

## Purpose & primary task

The commerce product catalog: browse/filter products, create/edit/publish products (with variants,
pricing per price list, per-warehouse stock), import/export, bulk-manage status/categories/
collections/channels.

## Layout

```
Breadcrumb "Products" · H1 "Products"
Header actions (right): FILTERS (text btn) · EXPORT (outlined) · IMPORT ▾ (outlined menu) ·
                        [icon] → /products/import (Import Logs) · NEW PRODUCT ▾ (black menu)
View tabs row: ALL · ADD FILTER +          (right side when rows selected: "N Selected" + Choose an action ▾)
v-data-table: [hover checkbox] · Name (thumb, link, "N variants") · SKU · Stock chip · Price ·
              Categories (+N more) · Status chip · Actions kebab
Footer pagination: Rows per page 10 ▾ · 1-10 of 45 · ‹ ›
```

- **No search input** — filtering is entirely via the FILTERS drawer. (The prior sandbox page has
  a search; UAT does not.)
- Columns are **sortable** (click header; URL gains `sortBy.key`/`sortBy.order`; sort arrow in header).
- Pagination + view reflected in URL (`page`, `itemsPerPage`, `viewId`).
- Stock chip: green outlined "In Stock". Status chips: outlined "Draft" (grey/black) / "Published" (green).
- Categories cell: first category + "+N more" (blue text; expander).
- Row selection: checkbox appears on hover; header checkbox selects page; selection swaps the tab
  row's right side to "N Selected · Choose an action ▾".

## Filters drawer (right side, title "Filters", ✕)

Fields: `Product Status` (Draft | Published) · `Product Collection` (data list) · `Product Type`
(data list) · `Brand` (data list) · `Sales Channel` (multi-select checkboxes: Neelam-Store,
Test- SC, Gayfywdew, Sales Channel Testing, Testing Sales Channel, Demo-Store30-Sep) ·
`Min Price` / `Max Price` · `Kitted Product` (True | False).
Footer: `CANCEL` / `APPLY` / `SAVE FILTER`.

## Custom views (ADD FILTER +)

Popover **"Custom Views"** — "Customise your view by selecting the sections you need most." —
checkbox list of saved views (default "All", checked+locked) with `APPLY` / `CANCEL` / `+ NEW`.
`+ NEW` opens the Filters drawer; SAVE FILTER persists a named view that appears as a tab next to
ALL (tab activation adds `viewId` to the URL).

## Bulk actions ("Choose an action" ▾)

Set as Draft · Set as Published · Edit Category · Edit Collection · Add Sales Channel ·
Delete Products. (All writes — none executed; their follow-up dialogs unverified.)

## Row kebab

Edit (→ `/products/:id`) · Delete (not executed; confirm unverified).

## Component mapping

| UAT element | Rebuild with |
|---|---|
| Header + actions | `MpPageHeader` `#actions` |
| FILTERS drawer | `MpDataTableToolbar` `#filter-content` (or keep drawer semantics via toolbar filter drawer) |
| ALL / custom views tabs | `MpFilterTabs` |
| Choose an action | `MpFloatingBulkBar` (improvement over inline dropdown) |
| Stock/Status chips | `MpStatusChip` (`type="general"` stock; `type="campaign"`-like map for Draft/Published — needs product map, see GAPS) |
| Row kebab | `MpRowActionsMenu` |
| Export modal | `MpDialog` size sm/md |
| Import wizard | existing `ProductImportWizard.vue` pattern (`MpWizardSteps`) |
| New Product wizard | existing `ProductWizard.vue` (3 steps) |
| Edit page | product editor two-column layout |
| Variants editable grid | `v-data-table` + inline inputs (no Mp editable-grid — GAPS) |

## Copy inventory (key strings)

- General Information subtitle: "To start selling, all you need is a name and a price."
- Media hint: "Please note the suggested file size is upto 20MB and the expected extensions are:
  PNG, JPG, GIF, JPEG, WEBP." (🔤 "upto")
- Variants toggle: "Yes, this is a product with variants" / "When unchecked, we will create a
  default variant for you"
- Product options hint: "Enter in your product options and variations, will pre-populate your
  product variants." (🔤 grammar)
- Attributes hint: "Enter a weight so shipping can be calculated accurately. If weight is missing,
  we may rely on default package details and custom shipping, which can affect the rate you see at
  checkout." + "Missing weight may affect checkout rates."
- Discountable: "When unchecked discounts will not be applied to this product."
- Sales Channels: "If no sales channels are selected, this product will be assigned to the default
  sales channel."
- Export modal: "Note : Your items and all their data will be downloaded as a CSV file." radios
  Current Page / All Products / Selected: N Products / N Products matching your search.
- CSV import step 1: "To add new files, upload from your computer or drag and drop them into the
  box below. Please note the maximum file size is 150MB and the expected extension is CSV." +
  "Make your import easy, download our product import template **Product Sample Template.CSV** ⬇"
- FTP import empty state: "No SFTP connection found. Please set up an SFTP connection before
  proceeding." + SETUP SFTP.
- Cancel guard: "Cancel Product Creation" / "Are you sure you want to cancel creating this
  product?" / "Warning: This action cannot be undone." CANCEL / YES.

## Data shapes seen

Product: name, sku, thumbnail, variantCount, stock ('In Stock'), price, categories[],
status Draft|Published, discountable, media[], options[{title, values[]}],
variants[{optionCombo, sku, priceAUD, availableStock}], seo{title, metaDescription, urlHandle,
ogTitle, ogDescription}, customFields, attributes{height,width,length,weight,midCode,
hsCode,countryOfOrigin}, organise{taxCategory, material, brand, tags, collections, categories[]},
salesChannels[]. Import log: id, fileReference, status Completed|Partial, totalJobs,
completedJobs, createdAt, errorReport(download).

## Accessibility issues observed

- Kebab and icon-only header button (Import Logs) rely on `title` only; no aria-label.
- Hover-revealed row checkboxes are invisible until pointer hover — keyboard/touch discoverability.
- "Choose an action" dropdown appears/disappears with selection; no live-region announcement.
- Filter drawer fields have no Apply-on-Enter; focus not trapped (background scrolls).
- Sort state only shown by tiny arrow; active view tab color-only.
- Rich-text toolbar buttons unlabeled for SR (icon-only).

## UX friction worth fixing

1. No quick search by name/SKU — heaviest daily task requires opening the Filters drawer.
2. Kitted Product filter values "True/False" (raw booleans).
3. Export default filename garbles the date (`Product_Export_2026-55-28` — minutes in month slot).
4. FTP import page keeps the "(CSV)" H1.
5. "+N more" categories requires interaction; no tooltip on hover shown.
6. Two identical "Price AUD" columns in the variant grid (price-list name not shown in header).
7. Bulk "Choose an action" is a plain select — no destructive separation for Delete Products.
8. Legacy drawers (recs page) vs this app's guard: inconsistent cancel semantics across module.
9. Import Logs reachable only via unlabeled icon button.
