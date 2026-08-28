# PARITY — Products (Commerce)

Rebuild: [`ProductsList.vue`](../../../src/views/Products/ProductsList.vue) ·
[`ProductEditor.vue`](../../../src/views/Products/ProductEditor.vue) ·
[`ProductImportLogs.vue`](../../../src/views/Products/ProductImportLogs.vue) ·
wizards [`ProductWizard.vue`](../../../src/views/Products/ProductWizard.vue) /
[`ProductImportWizard.vue`](../../../src/views/Products/ProductImportWizard.vue) /
[`KitWizard.vue`](../../../src/views/Products/KitWizard.vue)

## List page
- [x] Header actions: Filters (drawer trigger, DS toolbar) · Export · Import ▾ (Upload file /
      Import FTP / Import logs) · New product ▾ (New product / New kit)
- [x] View tabs: All + saved custom views (create via filter drawer "Save as view"; manage/delete
      via kebab next to the tabs) — UAT's Custom Views popover became `MpFilterTabs`, its APPLY
      became tab-click, `+ NEW` became "Save as view"
- [x] Table: hover-select checkboxes → bulk bar · Name (thumb, link, variants count) · SKU ·
      Stock chip · Price · Categories (+N more with tooltip) · Status chip · kebab
- [x] Sortable columns; 10/page pagination; column visibility toggle (DS toolbar)
- [x] Row kebab: Edit / Delete (delete confirms; UAT confirm was unverified)
- [x] Bulk actions (as `MpFloatingBulkBar`, replacing "Choose an action" select): Set as draft /
      Publish / Category / Collection / Sales channel / Delete — the three edit actions open a
      small dialog (⚠ UAT dialogs unverified; inferred single-select apply)
- [x] Filters drawer: Product status (Draft/Published) · Product collection · Product type ·
      Brand · Sales channel · Min/Max price (with range validation) · Kitted products (labelled
      radios instead of UAT's raw True/False)
- [x] Applied filters render as removable chips ("Filter by:" row, DS toolbar)
- [x] Export dialog: Current page / All / Selected: N (disabled at 0) / Matching filters
      (disabled when none) + file name with .csv suffix — default name's date bug fixed
- [x] Search added (name/SKU) — UAT has no quick search (flagged improvement)

## Create wizard (3 steps — pre-existing, verified against the audit)
- [x] Details: Title*, SKU, Subtitle, Product URL, Description, Media panel, variants toggle
- [x] Organise: Tax category, Material, Brand, Tag, Collection, Categories; W/L/H (cm), Weight (kg)
      + checkout-rate warning; MID/HS code; Country of origin; Discountable; Sales channels
- [x] Variants: options (title + comma values) → generated combinations; default-variant grid with
      Manage inventory / Allow backorder / Cost price / Price / per-location stock
- [x] Footer per step: Cancel · Save as draft · Continue/Publish; cancel guard on dirty forms
- △ Delta: one Price column per variant (UAT shows a second per-price-list column; price lists are
      percentage adjustments in this build, so a per-list column has no data to show)

## Edit page (single-page, new)
- [x] Two-column editor: General information (+Discountable), Media, Variants (option chips +
      read-only variant grid incl. per-location stock, "Edit options and variants" → wizard),
      Search engine listing (URL/title/description preview + SEO/OG fields)
- [x] Rail: Product status · Sales channels · Attributes (dims/weight/MID/HS/country) · Organise
      (tax category, material, brand, tags, collection, categories)
- [x] Cancel guard when dirty; Save disabled until changed and valid; flash toast on return
- △ Delta: Custom Fields card not rebuilt (its editor was unverified on UAT) — see GAPS

## Import
- [x] CSV wizard: Upload (150 MB, sample template) → Mapping → Update option → Import (pre-existing)
- [x] FTP wizard: no-SFTP-connection state with setup CTA; H1 fixed (UAT keeps "(CSV)")
- [x] Import logs page: ID · File reference · Status (Completed/Partial) · Total/Completed jobs ·
      Created at · per-row error-report download (disabled when clean); New import ▾

## Unverified on UAT → mocked as inferred
- Bulk-edit dialogs, delete confirms, import mapping data, export completion, SFTP setup
