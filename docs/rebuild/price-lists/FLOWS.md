# FLOWS — Price Lists (Commerce)

Crawled 2026-08-29, UAT account 116000. No writes executed. The list is empty on UAT, so all
row-level flows are unverified.

## 1. NEW PRICE LIST → `/price-lists/new`

1. Full-page form "New Pricing Configuration" (sections per AUDIT).
2. `SAVE` disabled until required fields valid (Title*, Sales Channel*).
3. `CANCEL` → returns to list **without any confirm** (verified with untouched form; with dirty
   form unverified).

- **Unverified:** SAVE outcome (toast/redirect/status Draft vs Active); attribute/operator option
  enums in the audience rule; Sales Channel option list (assumed same channel list as Products
  filter); per-product price assignment after creation.

## 2. FILTERS → drawer

Status (Draft|Active), Sales Channel, Contact List, Start/End Date → `APPLY` / `CANCEL`.
Applied against an empty dataset — result state unverified beyond "No records found".

## 3. Row actions (kebab)

Column exists; **no rows exist** → kebab contents unverified. Expected Edit/Delete per module
convention; flag for Phase-2 decision on what to mock.

## 4. Pagination

Standard footer; 0-0 of 0 with disabled chevrons (verified disabled state).
