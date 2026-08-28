# AUDIT — Collections (Commerce)

Source: `https://uat.maropost.com/commerce/116000/products/collections?page=1` · crawled 2026-08-29
(Modern commerce app.)

## Purpose & primary task

Group products into storefront collections — **Automated** (rule-driven) or **Manual** (hand-picked)
— with hierarchy (parent/Root), SEO metadata, image, and channel/template assignment. Primary
task: create an automated collection.

## Layout

```
Breadcrumb "Products › Collections" · H1 "Collections"
Header actions: FILTERS (text) · NEW COLLECTION ▾ (black menu: Manual Collection | Automated Collection)
v-data-table: [hover checkbox] · Title (link + funnel icon + parent subtitle "Root") · Handle ·
              Type (chip: Automated/Manual) · Products (count; "--" everywhere on UAT) ·
              Status (chip Active/Inactive) · Updated at · Actions kebab
Footer: Rows per page 10 ▾ · 1-10 of 26 · ‹ ›
```

- Columns sortable (verified on Updated at; URL-reflected `sortBy.*`).
- Row selection via hover checkboxes → "N Selected · Choose an action ▾":
  **Set as Active · Set as Inactive · Delete Collections** (not executed).
- Row kebab: **Edit · Delete** (not executed).
- Title cell: funnel icon after name (automated-rules indicator; tooltip not captured), second
  line = parent collection ("Root" for all).
- Products column shows `--` for every row (products-per-collection count broken or lazy on UAT).
- No search input.

## Filters drawer

`Status` (Active | Inactive) · `Type` (Manual | Automated) · `Parent Collection` (data list).
`CANCEL` / `APPLY`. No Save Filter.

## New Automated Collection (`/products/collections/new?type=dynamic`)

Breadcrumb "Products › Collections › New Collection", H1 "New Automated Collection",
header `CANCEL` / `SAVE` (disabled until valid).

Left column:
1. **General Information** — `Title *`, `Parent Collection` (select), `Primary Description` (RTE).
2. **SEO Settings** — Title, Meta Description, URL handle ("/" prefix), OG Title, OG Description.
   (No search-preview card here, unlike the product editor.)
3. **Conditions** — header + `+ ADD RULE`; "Products must match:" radios **All conditions** /
   Any conditions; rule rows: `Field` (Category · Tags · Brand · Product Type · Price · **Title**
   default) · `Operator` (text fields: Contains · Does Not Contains · Start With String ·
   End With String; numeric/price operators unverified) · `Text` value · trash.
   Validation: red outline when incomplete.

Right rail cards: **Status** (Active default; Active/Inactive), **Sales channels & templates**
("No templates assigned. Click edit to assign channels and templates.", `+`),
**Collection Image** (drag-drop / `CHOOSE FILE` — "JPG, PNG, GIF, WebP up to 20MB each").

**Cancel guard:** modal "Cancel Collection Creation — Are you sure you want to cancel creating
this collection? Warning: This action cannot be undone." `CANCEL` / `CONFIRM` — fires even with an
untouched form.

## New Manual Collection (`/products/collections/new?type=manual`)

Same layout, H1 "New Manual Collection", differences:
- **No Parent Collection** field (⚠ inconsistent with Automated).
- No Conditions; instead **Products** section: `Search` input + `ADD PRODUCTS` button + table
  (checkbox · Name · SKU · Status · Action) with empty state "No data available" and its own
  pagination.
- `ADD PRODUCTS` → **Add Products modal**: title + search icon + filter icon; row list (hover
  checkbox, thumb, name + variants, SKU, status chip); items per page 10, 1-10 of 45; `ADD`
  button (footer; disabled until selection). Filter icon's panel unverified.

## Component mapping

| UAT element | Rebuild with |
|---|---|
| Header + split CTA | `MpPageHeader` `#actions` (menu button) |
| Filters drawer | `MpDataTableToolbar` `#filter-content` |
| Type/Status chips | `MpStatusChip` |
| Bulk bar | `MpFloatingBulkBar` |
| Row kebab | `MpRowActionsMenu` |
| Editors | full-page two-column form views |
| Conditions builder | rule-row idiom (Field/Operator/Value) as in segments builder |
| Add Products modal | `MpDialog` size lg + list rows (`MpListRow`) |
| Cancel guard | `MpConfirmDialog` (danger) |
| Image upload card | upload drop-zone (GAPS if no Mp equivalent) |

## Copy inventory (key strings)

- "Products must match: All conditions / Any conditions"
- Operators: "Does Not Contains", "Start With String", "End With String" (🔤 grammar)
- Cancel guard: "Cancel Collection Creation … Warning: This action cannot be undone." (double
  negative CANCEL/CONFIRM pair 🔤)
- "No templates assigned. Click edit to assign channels and templates."
- "JPG, PNG, GIF, WebP up to 20MB each"

## Accessibility issues observed

- Funnel icon in Title cell: no label/tooltip surfaced; meaning opaque.
- Hover-only row checkboxes (same as Products).
- Cancel-guard dialog: CANCEL/CONFIRM double negative; focus not visibly trapped.
- "--" placeholder in Products column read literally by SR.

## UX friction worth fixing

1. Products count is "--" on every row — no way to see collection size from the list.
2. NEW COLLECTION menu items don't explain Manual vs Automated (first-run choice unexplained).
3. Cancel guard fires on pristine forms ("cannot be undone" for nothing).
4. Manual editor drops Parent Collection (hierarchy only settable on automated?).
5. Operator/grammar copy ("Does Not Contains").
6. Filters drawer lacks parent-collection search; long lists unwieldy.
