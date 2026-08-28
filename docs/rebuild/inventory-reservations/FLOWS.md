# FLOWS — Inventory Reservations (Commerce)

Crawled 2026-08-29, UAT account 116000. No writes executed.

## 1. NEW RESERVATION → modal

1. `NEW RESERVATION` → centered modal **New Reservation** with `Item to Reserve *`, `Location *`,
   `Description`; SAVE disabled.
2. Type ≥1 char in Item → async variant search (inventory-managed variants only). Verified:
   "table" → results (variant-level, duplicates per variant); "rest" / "Blue" → "No record found".
3. Select item + location → modal expands with summary table (Item / SKU / In-Stock / Available)
   and `Reserve Quantity *`.
4. `SAVE RESERVATION` enabled once quantity entered (assumed — not tested past disabled state).
5. `CANCEL` closes without confirm.

- **Unverified:** save outcome (toast/refresh); quantity validation bounds (e.g. > Available);
  behaviour when Available = 0.

## 2. Edit reservation (row kebab → Edit)

Same modal prefilled ("Edit Reservation"). CANCEL discards silently. SAVE not pressed.

## 3. Delete reservation (row kebab)

**Not executed.** Confirm dialog unverified.

## 4. Location filter

Header select: All Locations / Testing / Oxford Warehouse — instant filter (not URL-reflected).

## 5. Order Number link

Row link "#N" → commerce order detail (not followed; target route unverified).

## 6. Pagination

Standard footer (1-7 of 7; chevrons disabled on single page).
