# UAT page rebuilds

Production Maropost pages replicated in the sandbox using only design-system components.
Crawled from `uat.maropost.com` account 116000 on 2026-08-28.

| Page | Source | Rebuild | Docs |
|---|---|---|---|
| New Contact | `/contact/new` | [`views/Contacts/CreateContact.vue`](../../src/views/Contacts/CreateContact.vue) | [AUDIT](new-contact/AUDIT.md) · [PARITY](new-contact/PARITY.md) |
| Import Contacts | All Contacts → `IMPORT` (modal) | dialog in [`views/Contacts/AllContacts.vue`](../../src/views/Contacts/AllContacts.vue) | [AUDIT](import-contacts/AUDIT.md) · [PARITY](import-contacts/PARITY.md) |
| New List | `/create_list?folder_id=` | [`views/Contacts/CreateList.vue`](../../src/views/Contacts/CreateList.vue) | [AUDIT](new-list/AUDIT.md) · [PARITY](new-list/PARITY.md) |
| New Segment | `/segments/types` + `/segments/next-gen` | [`SegmentBuilderChooser.vue`](../../src/views/Contacts/SegmentBuilderChooser.vue) · [`CreateSegmentNextGen.vue`](../../src/views/Contacts/CreateSegmentNextGen.vue) | [AUDIT](new-segment/AUDIT.md) · [PARITY](new-segment/PARITY.md) |
| Custom Fields | `/custom_fields` | [`views/Contacts/ContactFields.vue`](../../src/views/Contacts/ContactFields.vue) | [AUDIT](custom-fields/AUDIT.md) · [PARITY](custom-fields/PARITY.md) |
| SQL Queries | `/relational_queries` | [`views/Contacts/SQLQueries.vue`](../../src/views/Contacts/SQLQueries.vue) | [AUDIT](relational-queries/AUDIT.md) · [PARITY](relational-queries/PARITY.md) |
| Custom Reports (list) | `/analytics/custom_reports` | [`views/Analytics/CustomReports.vue`](../../src/views/Analytics/CustomReports.vue) | [AUDIT](custom-reports-list/AUDIT.md) · [PARITY](custom-reports-list/PARITY.md) |
| New Custom Report | `/analytics/custom_reports/new` | [`CreateCustomReport.vue`](../../src/views/Analytics/CreateCustomReport.vue) + [`CreateCustomReportWizard.vue`](../../src/views/Analytics/CreateCustomReportWizard.vue) | [AUDIT](custom-report-new/AUDIT.md) · [PARITY](custom-report-new/PARITY.md) |
| Product Recommendations | `/product_recommendations` (+ feeds, templates) | [`ProductRecommendations.vue`](../../src/views/Products/ProductRecommendations.vue) + [`FeedTemplateEditor.vue`](../../src/views/Products/FeedTemplateEditor.vue) | [AUDIT](product-recommendations/AUDIT.md) · [FLOWS](product-recommendations/FLOWS.md) · [PARITY](product-recommendations/PARITY.md) |
| Products | `/commerce/:id/products` | [`ProductsList.vue`](../../src/views/Products/ProductsList.vue) + [`ProductEditor.vue`](../../src/views/Products/ProductEditor.vue) + [`ProductImportLogs.vue`](../../src/views/Products/ProductImportLogs.vue) | [AUDIT](products-list/AUDIT.md) · [FLOWS](products-list/FLOWS.md) · [PARITY](products-list/PARITY.md) |
| Price Lists | `/commerce/:id/price-lists` | [`PriceLists.vue`](../../src/views/Products/PriceLists.vue) + [`PriceListEditor.vue`](../../src/views/Products/PriceListEditor.vue) | [AUDIT](price-lists/AUDIT.md) · [FLOWS](price-lists/FLOWS.md) · [PARITY](price-lists/PARITY.md) |
| Collections | `/commerce/:id/products/collections` | [`Collections.vue`](../../src/views/Products/Collections.vue) + [`CollectionEditor.vue`](../../src/views/Products/CollectionEditor.vue) | [AUDIT](collections/AUDIT.md) · [FLOWS](collections/FLOWS.md) · [PARITY](collections/PARITY.md) |
| Reservations | `/commerce/:id/inventory/reservations` | [`Reservations.vue`](../../src/views/Products/Reservations.vue) | [AUDIT](inventory-reservations/AUDIT.md) · [FLOWS](inventory-reservations/FLOWS.md) · [PARITY](inventory-reservations/PARITY.md) |

Shared: [IMPROVEMENTS.md](IMPROVEMENTS.md) · [GAPS.md](GAPS.md)

## Routes added

```
/accounts/:accountId/contacts/new                        CreateContact
/accounts/:accountId/lists/new                           CreateList
/accounts/:accountId/lists/:id/edit                      EditList
/accounts/:accountId/segments/types                      SegmentBuilderChooser
/accounts/:accountId/segments/next-gen                   CreateSegmentNextGen
/accounts/:accountId/analytics/custom_reports            CustomReports              (rebuilt in place)
/accounts/:accountId/analytics/custom_reports/new        CreateCustomReport         (type chooser)
/accounts/:accountId/analytics/custom_reports/new/:type  CreateCustomReportWizard   (5 types)
```

`contact_fields` and `sql_queries` were rebuilt in place on their existing routes.

Report type slugs: `campaign` · `sms` · `message` · `deliverability` · `growth_attrition`.

## Routes added / aligned (Products slice, 2026-08-29)

```
/commerce/:id/product_recommendations                          catalog tab
/commerce/:id/product_recommendations/product_feeds            feeds tab
/commerce/:id/product_recommendations/product_feed_templates   templates tab
/commerce/:id/product_recommendations/product_feed_templates/new|:id   FeedTemplateEditor
/commerce/:id/products/import                                  ProductImportLogs
/commerce/:id/products/:id/edit                                ProductEditor (single page)
/commerce/:id/products/:id/edit/wizard                         ProductWizard (options/variants rework)
/commerce/:id/products/collections/new|:id                     CollectionEditor
/commerce/:id/price-lists (+ /new, /:id)                       PriceLists / PriceListEditor
/commerce/:id/inventory/reservations                           Reservations
```

Old sandbox paths `/products/price-lists` and `/products/reservations` redirect to the aligned ones.

## Surfaces replaced

Per the Phase-2 decision *"match UAT surfaces, replace existing"*, four pre-existing sandbox
drawers were retired so there is one path per task:

| Task | Was | Now |
|---|---|---|
| Create / edit list | `MpFormDrawer` in `ContactLists.vue` | full page `CreateList.vue` |
| Import contacts | `MpFormDrawer` in `AllContacts.vue` | `MpDialog` in `AllContacts.vue` |
| Create segment | `MpFormDrawer` in `Segments.vue` | chooser page → `CreateSegmentNextGen.vue` |
| Create / edit query | `MpFormDrawer` in `SQLQueries.vue` | `MpDialog` in `SQLQueries.vue` |

The Segments drawer is **kept** as the stand-in for the Legacy builder (reached via
`/segments?create=legacy`), because the real legacy builder could not be crawled.

## Verification status

- `npm run type-check` — passes
- axe-core 4.12.1, WCAG 2.0/2.1 A + AA — **0 violations** in rebuilt page content across
  New List, Import Contacts and the Next-Gen segment builder
- No horizontal overflow at 375 px (measured on New List)
- The app shell's own **7 pre-existing `AppSidebar` violations** (4 critical) are unrelated and
  untouched — see the end of IMPROVEMENTS.md

## Things needing your decision

1. **Success and error states are inferred across every page.** Nothing was ever submitted on UAT —
   all of these write real records. Toasts, duplicate-name handling and network-failure behaviour
   are all guesses.
2. **Copy changes** are marked 🔤 in IMPROVEMENTS.md and need sign-off — including fixes to typos
   live in production (`atleast`, `sent too`, `create all report`).
3. **Two create paths for contacts still exist** — the full page (primary CTA) and the pre-existing
   quick-add drawer (table empty state). You may want to retire one.
4. **`Item / Product / LDS`** (New List, Carts) is undefined anywhere in the source. Kept verbatim;
   needs a subject-matter answer before the label can be improved.
5. **`String` vs `Text`** (Custom Fields) is undocumented and behaves identically in the source UI.
6. **The Legacy segment builder was never crawled** — it renders in a cross-origin iframe. Its tile
   currently routes to the old sandbox drawer as a stand-in.
7. **`Overwrite` SQL queries truncate their target table.** The source offers no preview, test or
   dry-run before executing. The rebuild adds a confirmation naming the targets, but the underlying
   risk is a product question — see GAPS §10.
8. **Auto-opt-in on list selection** (New Contact) was preserved exactly but has consent
   implications. Worth a product decision rather than a UI one.
9. **The Custom Reports list can no longer edit a report** — strict parity with UAT, which has no
   edit path. The previous sandbox page could.
10. **Two source defects were reproduced as fixes, not features** — the Next-Gen Add-criterion
    blocker and the hanging AI preview. If either is intentional upstream behaviour rather than a
    bug, tell me and I will re-align.
