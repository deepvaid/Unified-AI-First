# FLOWS — Products (Commerce)

Crawled 2026-08-28/29, UAT account 116000. No writes executed.

## 1. NEW PRODUCT ▾ → New Product (3-step wizard, `/products/new`)

**Step 1 — Details:** General Information ("all you need is a name and a price"):
`Product Title *`, `SKU`, `Subtitle`, `Product URL`, `Description` (rich-text editor: undo/redo,
paragraph style, B/I/U/S, highlight, quote, link, paste-formatting, image, table, font family/size,
color, align, lists, indent/outdent, hr, code, template). **Media** (drag-drop / ADD MEDIA;
≤20MB; PNG, JPG, GIF, JPEG, WEBP). **Variants** toggle "Yes, this is a product with variants" —
OFF: "we will create a default variant for you"; ON: **Product options** rows (`Option title`
combobox with suggestions Default · Color · Material · Finish + free text; `Variations (comma
separated)` chips input, required — "Variations are required"; trash per row; `ADD OPTION`).
Footer: `CANCEL` · `SAVE AS DRAFT` · `CONTINUE` — draft/continue disabled until Title present.

**Step 2 — Organise:** selects `Tax Category`, `Material`, `Brand`, `Tag`, `Collection`,
`Categories`; **Attributes** (weight-affects-shipping copy): `Width/Length/Height` (cm, default
0.00), `Weight` (kg, hint "Missing weight may affect checkout rates."), `MID Code`, `HS Code`,
`Country of Origin`; **Discountable** toggle; **Sales Channels** toggle ("If no sales channels are
selected, this product will be assigned to the default sales channel." — ON presumably reveals a
channel picker, unverified). Footer: CANCEL · SAVE AS DRAFT · CONTINUE.

**Step 3 — Variants:** editable grid — Option · Manage Inventory (checkbox) · Allow Backorder
(checkbox) · Cost Price AUD · Price AUD · Price AUD (per price list; header doesn't name the list)
· In Stock (testing) · In Stock (Oxford warehouse) — one "Default Variant" row when variants off;
grid toolbar has undo/redo/filter icons. Footer: `CANCEL` · `SAVE AS DRAFT` · **`PUBLISH`**.

**Cancel guard:** modal "Cancel Product Creation — Are you sure you want to cancel creating this
product? Warning: This action cannot be undone." CANCEL / YES → YES returns to list.
Stepper is clickable to revisit completed steps.

- **Unverified:** SAVE AS DRAFT and PUBLISH outcomes (toast/redirect); Sales-Channels-ON picker;
  media upload; variant-grid generation from options (needs valid options + continue).

## 2. NEW PRODUCT ▾ → New Kit

Menu item present; **not followed** (kit wizard exists in sandbox as `KitWizard.vue`). Unverified
this slice.

## 3. Edit product (row kebab → Edit, or Name link → `/products/:id`)

Single-page editor, breadcrumb "Products › Product Details", H1 = title, header `CANCEL` / `SAVE`.
Left column: General Information (same fields, filled), `Discountable` toggle, **Media** (thumb
grid: drag-handle, order badge, EDIT overlay, `+` add tile), **Variants** (Product options rows as
chips, e.g. Finish: Matte Black/Natural Oak/Walnut; Material: Engineered Wood/Solid Wood; ADD
OPTION) + **Product variants (N)** grid (Images · Variant (combo + SKU) · Price AUD · Available
Stock), **SEO Settings** (Google-style preview card: store name, `Storefront-Product-URL/<handle>`,
blue title; fields Title, Meta Description, URL handle (prefixed "/"), OG Title, OG Description),
**Custom Fields** card ("Edit to add more custom fields to this product", ✎).
Right rail cards: **Product Status** (Draft/Published select), **Sales channels & templates**
("No sales channels selected. Click edit to assign channels and templates.", + icon),
**Attributes** (Height/Width/Length/Weight + weight warning, MID Code, HS Code=94036000,
Country of Origin, ✎), **Organise** (Tax Category, Material, Brand=StudioForm, Tags, Collections,
Categories chips with ✕, ✎).

- **Unverified:** SAVE outcome; the ✎ edit dialogs for Attributes/Organise/Custom Fields/Sales
  channels; media EDIT overlay.

## 4. FILTERS (header) → filter drawer

Open → set any of Status / Collection / Type / Brand / Sales Channel / Min-Max Price / Kitted →
`APPLY` filters the table; `CANCEL` closes; `SAVE FILTER` saves as a custom view (see 5).
Closing via ✕ keeps prior state. (Applied-filter chip display: not observed — appears the tab/view
carries the state.)

## 5. ADD FILTER + → Custom Views

Popover lists saved views ("All" locked default) → `APPLY` switches view (`viewId` in URL);
`+ NEW` opens the Filters drawer to define + `SAVE FILTER` (naming step **unverified** — not
executed to avoid persisting config).

## 6. EXPORT → Export Products modal

Radios: **Current Page** (default) · All Products · Selected: N Products (disabled at 0) ·
"N Products matching your search" (disabled at 0). File name input prefilled
`Product_Export_<garbled date>` + fixed `.csv` suffix. `CANCEL` / `EXPORT`.
- **Not executed** (queues an export/download). Post-export behaviour unverified.

## 7. IMPORT ▾ → Upload File (`/products/import/new/csv`)

4-step wizard: **Upload File → Mapping → Update Option → Import**. Step 1: drag-drop zone /
`ADD FILE`, 150MB max, CSV only; sample template download link; `CANCEL` / `NEXT` (disabled until
file). Steps 2–4 **unverified** (require a real file → real import).

## 8. IMPORT ▾ → Import FTP (`/products/import/new/ftp`)

Same stepper, step 1 "Import with FTP": grey banner "No SFTP connection found. Please set up an
SFTP connection before proceeding." + `SETUP SFTP` (→ SFTP settings — **not followed**, sensitive).
H1 still reads "Import Products (CSV)" (source defect).

## 9. Import Logs (icon button → `/products/import`)

Breadcrumb Products › Import Logs, H1 "Import Logs", `+ NEW IMPORT ▾` (same two import options).
Table: #ID · File Reference · Status (Completed | Partial) · Total Jobs · Completed Jobs ·
Created At (sortable, desc) · Error Report (download icon per row). Pagination standard.
- **Unverified:** error-report download; live/processing status.

## 10. Bulk selection → Choose an action ▾

Hover row → checkbox; select → "N Selected" + dropdown: Set as Draft / Set as Published /
Edit Category / Edit Collection / Add Sales Channel / Delete Products. **None executed** — all
mutate data; their dialogs/confirms unverified.

## 11. Row kebab → Delete

Present with trash icon. **Not executed.** Confirm dialog unverified.

## 12. Table mechanics

Column sort (URL-reflected), rows-per-page, ‹ › paging, "+N more" categories expander (behaviour
unverified — likely tooltip/popover), name/thumb link → edit page.
