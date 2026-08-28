# PARITY — Inventory Reservations

Rebuild: [`Reservations.vue`](../../../src/views/Products/Reservations.vue)

- [x] Route aligned to UAT: `/commerce/:id/inventory/reservations` (old `/products/reservations`
      redirects)
- [x] Header: location select (All locations / Testing / Oxford Warehouse) + New reservation;
      breadcrumb kept as "Multi-location inventory" eyebrow
- [x] Table: Item · SKU · Order (link; manual holds show "Manual hold") · Location · Description ·
      Qty · kebab — order links resolve to the sandbox orders list (UAT's exact order-detail
      target unverified)
- [x] UAT's 7 seeded reservations, with the order-number/description mismatches corrected
      (flagged data fix) and the duplicated variant titles de-duplicated
- [x] Row kebab: Edit / Delete (delete returns stock to available, confirm added)
- [x] New/Edit dialog with progressive disclosure: Item to reserve* (async-style autocomplete over
      inventory-tracked variants only, with a hint saying so — UAT's silent "No record found"
      explained) · Location* (disabled until item picked) · summary table (Item / SKU / In stock /
      Available) appears once both chosen · Reserve quantity* (validated against Available —
      UAT bound unverified) · Description
- [x] Save disabled until valid; unsaved-changes guard; search across item/SKU/description added
- [x] Empty state via `MpEmptyState` (filters vs. true-empty variants)

## Unverified on UAT → mocked as inferred
- Save/delete outcomes, quantity upper bound, order-detail link target
