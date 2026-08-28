# PARITY — Product Recommendations

Rebuild: [`ProductRecommendations.vue`](../../../src/views/Products/ProductRecommendations.vue) ·
[`FeedTemplateEditor.vue`](../../../src/views/Products/FeedTemplateEditor.vue) ·
store [`useProductExtras.ts`](../../../src/stores/useProductExtras.ts)

## Page shell
- [x] Breadcrumb "My Product Recommendations" (as `MpPageHeader` eyebrow) + H1
- [x] Three tabs, each route-backed (`/product_recommendations`, `…/product_feeds`, `…/product_feed_templates`)

## Product Catalog tab
- [x] Info banner incl. mandatory-fields warning + Learn-more link (improved: live incomplete count)
- [x] Source filter (All + 10 sources), instant apply
- [x] Table: Item ID · image · Name · Price · Created at · Updated at · kebab
- [x] Data oddities preserved: empty names, $0.00, negative Trade In price
- [x] Row kebab → Edit product drawer (warning banner, read-only Item ID/Source, Name*, Price*,
      Image URL, Store URL*, Category multi-select w/ checkboxes, Description)
- [x] Validation: required errors inline, Save disabled while invalid
- [x] Import Product Catalog dialog: file (.csv/.txt/.zip), example download, Comma/Semi-colon
      delimiter radios, Continue disabled until file
- [x] Import step 2 + completion (⚠ *inferred* — UAT's post-Continue flow was unreachable; mocked
      as a summary step with success toast + rows appended)
- [x] Pagination (10/page)
- 🔤 Copy: banner reworded ("Importing a catalog creates or updates products…"); Category hint now
      matches multi-select ("Choose one or more categories from the list.")
- ✚ Deviations (logged): unsaved-changes guard on drawer close (UAT discards silently); search box
      added (UAT has none on a 207k-row table); incomplete rows badged inline

## Product Feeds tab
- [x] Info banner ("recommendations are only generated once a catalog has been imported")
- [x] Table: Name · Metric · Created at · Updated at · kebab; legacy metrics (Bought Together /
      Similar Products / Trending) render with an explanation tooltip (⚠ UAT shows them unexplained)
- [x] Row kebab → Edit product feed
- [x] New/Edit feed drawer: name*, 3 include-only toggles (default on), Source* (10 options),
      conditional Store name* for store-backed sources, Brand multi-select, category scope radios
      (all/limit/exclude) + conditional category picker, type (Best Sellers/New Arrivals/Top
      Trending), period (Last 5/10/15/30/45/60 days), sort radios (Random/Price Low→High/High→Low)
- [x] Save validation + disabled state; unsaved-changes guard
- ✚ Fixed source defect: persistent "Name is required"/"Source is required" hints under valid
      fields no longer render (errors appear only when invalid)

## Product Feed Templates tab
- [x] Active/Archived scope select; table Name · Block layout (R×C) · Created at · Updated at · kebab
- [x] Kebab: Edit + Archive (with confirm — ⚠ UAT confirm unverified) + Restore on archived rows
- [x] New/Edit → full-page editor: live preview (merge tags ⇄ real products toggle, desktop/mobile),
      name*, Product feed / Manual selection method, feed select, manual product picker modal
      (search + source/category filters + selection count), Rows/Columns steppers (max 3),
      include image/name/price/button checkboxes, button text + text/background colour
- [x] Editor cancel guard (only when dirty — UAT fires it even on pristine forms)
- [x] "Unlock the full power of Merchandising Cloud" upsell panel kept below the preview,
      restyled with tokens (screenshots and BOOK A DEMO funnel replaced by copy + outlined button)

## Unverified on UAT → mocked as inferred
- Import mapping step, save/success toasts everywhere, archive confirm copy, per-source store lists
