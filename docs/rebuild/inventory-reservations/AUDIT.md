# AUDIT — Inventory Reservations (Commerce)

Source: `https://uat.maropost.com/commerce/116000/inventory/reservations?page=1` · crawled 2026-08-29
(Modern commerce app. Note: breadcrumb parent is **"Multi-Location"**, not Products/Inventory.)

## Purpose & primary task

View and manage per-location inventory reservations — units held back from available stock,
either automatically for orders ("Items reserved for order #N") or manually. Primary task:
create/edit a manual reservation.

## Layout

```
Breadcrumb "Multi-Location › Reservations" · H1 "Reservations"
Header actions: `All Locations` select (All Locations · Testing · Oxford Warehouse) ·
                NEW RESERVATION (black)
v-data-table: Title · SKU · Order Number (link → order) · Location · Description · QTY · Actions
Footer: Rows per page 10 ▾ · 1-7 of 7 · ‹ ›
```

- 7 reservations on UAT; all created from orders (Description "Items reserved for order #N").
- Order Number is a link (presumably to the Commerce order detail — not followed).
- Row kebab: **Edit · Delete** (delete not executed).
- No search, no status column, no bulk selection on this page.
- Data oddities: Description "order #7" on rows whose Order Number reads "#6" (mismatch);
  duplicated product title text ("Plymor… Glass Plymor… Glass") — variant title concatenation.

## Location filter

Instant-apply select, right-aligned in header (not a drawer). Options = All Locations + the
account's locations (Testing, Oxford Warehouse) — same locations that appear as In Stock columns
in the product wizard's variant grid.

## New Reservation (modal, progressive disclosure)

1. Opens with: `Item to Reserve *` (async autocomplete), `Location *` (select), `Description`
   (textarea). `SAVE RESERVATION` disabled.
2. Item autocomplete queries **inventory-managed variants only**
   (`/admin/variants?q=…&manage_inventory=true`); label format "Product - Variant". Products
   without managed inventory return "No record found" with no explanation (⚠ friction — looks
   broken for e.g. "rest98"/"Blue Eyeliner" which are visible in the table).
3. After item + location are chosen the modal grows: read-only summary table
   (`Item` / `SKU` / `In-Stock` / `Available`) + `Reserve Quantity *` + Description.
4. Footer: `CANCEL` / `SAVE RESERVATION` (stays disabled until quantity valid).

## Edit Reservation (row kebab → Edit)

Same modal, titled "Edit Reservation", fully expanded and prefilled (item + location editable,
summary table, Reserve Quantity=1, Description). Footer CANCEL / SAVE RESERVATION.
Observed: In-Stock 0 / Available 0 while a reservation of 1 exists (numbers post-reservation).

## Component mapping

| UAT element | Rebuild with |
|---|---|
| Header + location select + CTA | `MpPageHeader` `#actions` |
| Table | `v-data-table` per pattern |
| Order link | router-link to order detail |
| Row kebab | `MpRowActionsMenu` |
| New/Edit modal | `MpDialog` (size sm/md) — form dialog |
| Item autocomplete | `v-autocomplete` (async) |
| Summary table | `MpListRow`-style key-value rows or simple table |
| Empty state (if 0) | `MpEmptyState` |

## Copy inventory

- "Items reserved for order #N" (auto description)
- "No record found" (autocomplete empty)
- Buttons: NEW RESERVATION · SAVE RESERVATION · CANCEL

## Accessibility issues observed

- Location filter select has no visible label ("All Locations" doubles as value+label).
- Autocomplete's "No record found" gives no guidance (why/what to do).
- Modal: no visible focus trap test; kebab unlabeled (as elsewhere).
- QTY header abbreviation unexpanded.

## UX friction worth fixing

1. Item search silently excludes non-inventory-managed products — needs a hint.
2. Order-number/description mismatch (#6 vs "order #7") — data or join bug upstream.
3. Duplicated title strings ("X Plymor… X") in Title column and autocomplete labels.
4. Location values inconsistent case ("testing" vs "Testing" in filter).
5. Breadcrumb "Multi-Location" doesn't match sidebar entry ("Inventory › Reservations").
6. No search/filter beyond location; description column unqueryable.
