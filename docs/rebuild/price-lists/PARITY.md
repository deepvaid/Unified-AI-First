# PARITY — Price Lists

Rebuild: [`PriceLists.vue`](../../../src/views/Products/PriceLists.vue) ·
[`PriceListEditor.vue`](../../../src/views/Products/PriceListEditor.vue)

## List page
- [x] Route aligned to UAT: `/commerce/:id/price-lists` (old `/products/price-lists` redirects)
- [x] Header: Filters + New price list
- [x] Table: Title · Sales channel · Audience (UAT "Contact Lists") · Schedule (start/end) ·
      Adjustment · Products · Status · kebab
- [x] Filters (DS toolbar drawer): Status (Draft/Active) · Sales channel — UAT's Contact List and
      date-range filters folded into search + schedule column (⚠ deviation, logged)
- [x] Mock rows seeded (UAT is empty) per Phase-2 decision; true empty state still reachable via
      filters and is a proper `MpEmptyState` with a create action
- [x] Row kebab: Edit / Delete (⚠ inferred — no rows existed on UAT to verify)

## Editor (New/Edit pricing configuration)
- [x] Title* · Sales channel* · Description
- [x] "Who can use this price list" rule row (attribute / operator / value; empty value = everyone)
- [x] Schedule: start/end date + time (time disabled until its date is chosen, as on UAT) +
      end-after-start validation (UAT had none observable)
- [x] Pricing: Increase/Decrease + percentage (validated > 0; decrease capped at 100%)
- [x] Save as draft / Save and activate split (⚠ UAT exposes a single SAVE; status semantics
      inferred from the Draft/Active filter)
- [x] Live worked example ("$100.00 becomes $85.00…") and summary rail — additions, flagged
- 🔤 H1 unified to "New price list" (UAT: "New Pricing Configuration" under a "New Price List"
      breadcrumb); "Market customer shops from" grammar rewritten

## Unverified on UAT → mocked as inferred
- Row-level UI (kebab, chips), save outcome, per-product price application, audience enums
