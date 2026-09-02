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

### eRFM Report (2026-08-31)

Crawled from `uat.maropost.com` account 116000. Screenshots were impossible for the whole session
(the page never reaches `document_idle`), so the crawl was taken from the live DOM **and the live
Vue component tree** — component names, `setupState`, chart option objects, and validation-rule
return values. The pre-existing sandbox page turned out to be an invented design built from a
URL-only tracker row and was replaced.

| Page | Source | Rebuild | Docs |
|---|---|---|---|
| eRFM Report | `/erfm_report` (+ Groups & Settings drawers) | [`ERFMReport.vue`](../../src/views/Analytics/ERFMReport.vue) + [`ErfmMatrix.vue`](../../src/components/analytics/ErfmMatrix.vue) + [`ErfmGroupDrawer.vue`](../../src/components/analytics/ErfmGroupDrawer.vue) + [`ErfmSettingsDrawer.vue`](../../src/components/analytics/ErfmSettingsDrawer.vue) | [AUDIT](erfm-report/AUDIT.md) · [FLOWS](erfm-report/FLOWS.md) · [PARITY](erfm-report/PARITY.md) · [IMPROVEMENTS](erfm-report/IMPROVEMENTS.md) · [GAPS](erfm-report/GAPS.md) |

Route corrected from `/accounts/:accountId/analytics/erfm_report` to `/accounts/:accountId/erfm_report`
to match production; `AppSidebar` nav item updated to match.

### Marketing Acquisition + Content slice (2026-08-30)

Crawled from `uat.maropost.com` account 116000. Overview and the locked decisions:
[marketing-acquisition/CRAWL-SUMMARY.md](marketing-acquisition/CRAWL-SUMMARY.md).

| Page | Source | Rebuild | Docs |
|---|---|---|---|
| Acquisition Forms | `/acquisition/forms` (+ `/select`, `/create`, `/:id/modify`) | [`AcquisitionForms.vue`](../../src/views/Marketing/AcquisitionForms.vue) + [`FormSelection.vue`](../../src/views/Marketing/FormSelection.vue) + [`FormBuilder.vue`](../../src/views/Marketing/FormBuilder.vue) | [AUDIT](acquisition-forms/AUDIT.md) · [FLOWS](acquisition-forms/FLOWS.md) · [PARITY](acquisition-forms/PARITY.md) |
| Landing Pages | `/landing_pages` (+ `/template`, `/create`) | [`LandingPages.vue`](../../src/views/Marketing/LandingPages.vue) + [`LandingPageTemplates.vue`](../../src/views/Marketing/LandingPageTemplates.vue) + [`LandingPageBuilderChooser.vue`](../../src/views/Marketing/LandingPageBuilderChooser.vue) | [AUDIT](landing-pages/AUDIT.md) · [FLOWS](landing-pages/FLOWS.md) · [PARITY](landing-pages/PARITY.md) |
| Lead Ads | `/social_leads` (+ `/new`, `/:id/edit`) | [`LeadAds.vue`](../../src/views/Marketing/LeadAds.vue) + [`LeadAdForm.vue`](../../src/views/Marketing/LeadAdForm.vue) | [AUDIT](social-leads/AUDIT.md) · [FLOWS](social-leads/FLOWS.md) · [PARITY](social-leads/PARITY.md) |
| Email Content | `/contents` (+ 8 more) | [`EmailContent.vue`](../../src/views/Marketing/EmailContent.vue) + [`ContentTemplates.vue`](../../src/views/Marketing/ContentTemplates.vue) + [`ContentEditorChooser.vue`](../../src/views/Marketing/ContentEditorChooser.vue) + [`TemplateLayouts.vue`](../../src/views/Marketing/TemplateLayouts.vue) + [`ContentArchives.vue`](../../src/views/Marketing/ContentArchives.vue) + [`EmailContentPreview.vue`](../../src/views/Marketing/EmailContentPreview.vue) | [AUDIT](email-content/AUDIT.md) · [FLOWS](email-content/FLOWS.md) · [PARITY](email-content/PARITY.md) |

Slice-shared: [marketing-acquisition/IMPROVEMENTS.md](marketing-acquisition/IMPROVEMENTS.md) ·
[marketing-acquisition/GAPS.md](marketing-acquisition/GAPS.md)

```
/accounts/:accountId/acquisition/forms                    AcquisitionForms   (/acquisition redirects here)
/accounts/:accountId/acquisition/forms/select             FormSelection
/accounts/:accountId/landing_pages/template               LandingPageTemplates  (/templates redirects here)
/accounts/:accountId/landing_pages/create                 LandingPageBuilderChooser
/accounts/:accountId/lead_ads (+ /new, /:id/edit)         LeadAds / LeadAdForm
/accounts/:accountId/contents/template                    ContentTemplates
/accounts/:accountId/contents/select                      ContentEditorChooser   (4 options)
/accounts/:accountId/content_templates/select_editor      ContentEditorChooser   (2 options)
/accounts/:accountId/content_templates/layouts            TemplateLayouts
/accounts/:accountId/contents/:id/preview                 EmailContentPreview
/accounts/:accountId/archive                              ContentArchives
```

### Journey Builder (2026-09-02)

Crawled from `uat.maropost.com` account 116000 (`/journeys/612/journey-builder`). The live builder is a
Vue 3 + Vue Flow micro-frontend; the tab rendered at 0×0 so the crawl was taken from the live component
tree, DOM and handler source (no screenshots). The existing sandbox builder was extended, not replaced:
production's 18-step palette, every node form, the compact/card face switch at 75 % zoom, Save / Save
as draft / Clear canvas / Exit, contact search and Flip Yes/No were added on top of the tree canvas.

| Page | Source | Rebuild | Docs |
|---|---|---|---|
| Journey Builder | `/journeys/:id/journey-builder` (+ node details drawer, confirmations) | [`JourneyBuilder.vue`](../../src/views/Marketing/JourneyBuilder.vue) + [`JourneyFlowColumn.vue`](../../src/components/marketing/JourneyFlowColumn.vue) + catalog in [`journeyFlowData.ts`](../../src/stores/journeyFlowData.ts) | [AUDIT](journey-builder/AUDIT.md) · [FLOWS](journey-builder/FLOWS.md) · [PARITY](journey-builder/PARITY.md) · [IMPROVEMENTS](journey-builder/IMPROVEMENTS.md) · [GAPS](journey-builder/GAPS.md) |

```
/accounts/:accountId/journeys/:id/journey-builder → JourneyBuilder   (production path; /builder redirects)
```

### New Journey slice (2026-09-02)

Crawled and rebuilt from `uat.maropost.com` account 116000. Journey Selection, the two-step template
wizard and the from-scratch settings form (where both "Create from scratch" and "Build with AI"
land). The previous `CreateJourney.vue` — a gallery plus Da Vinci draft generator — was an invented
design and was replaced.

| Page | Source | Rebuild | Docs |
|---|---|---|---|
| Journey Selection | `/journeys/new` (+ template dialog) | [`JourneySelection.vue`](../../src/views/Marketing/JourneySelection.vue) + [`JourneyTemplateDialog.vue`](../../src/components/marketing/JourneyTemplateDialog.vue) | [AUDIT](new-journey/AUDIT.md) · [FLOWS](new-journey/FLOWS.md) · [PARITY](new-journey/PARITY.md) · [IMPROVEMENTS](new-journey/IMPROVEMENTS.md) · [GAPS](new-journey/GAPS.md) |
| Journey Templates wizard | `/journeys/new/template` | [`JourneyTemplateWizard.vue`](../../src/views/Marketing/JourneyTemplateWizard.vue) + [`JourneySettingsForm.vue`](../../src/components/marketing/JourneySettingsForm.vue) + [`JourneyTemplateSetup.vue`](../../src/components/marketing/JourneyTemplateSetup.vue) + [`journeyTemplateSetup.ts`](../../src/stores/journeyTemplateSetup.ts) | same set |
| Journey Settings (scratch / Build with AI) | `/journeys/new/scratch` (+ `?buildWithAI=true`) | [`CreateJourneyScratch.vue`](../../src/views/Marketing/CreateJourneyScratch.vue) | same set |

```
/accounts/:accountId/journeys/new                          JourneySelection      (route name CreateJourney kept; ?ai=1 → AI path)
/accounts/:accountId/journeys/new/scratch                  CreateJourneyScratch
/accounts/:accountId/journeys/new/template?template=<id>   JourneyTemplateWizard
```

### Content & Reporting slice (2026-09-01)

Crawled and rebuilt from `uat.maropost.com` account 116000. Overview, cross-cutting facts, and
defect families: [content-reporting/CRAWL-SUMMARY.md](content-reporting/CRAWL-SUMMARY.md).
`/contents` and `/contents/template` were already covered by the Marketing Acquisition slice.

| Page | Source | Rebuild | Docs |
|---|---|---|---|
| Recurring Campaign Reports | `/reports/recurring_campaign_report` | [`RecurringCampaignReports.vue`](../../src/views/Analytics/RecurringCampaignReports.vue) | [AUDIT](content-reporting/recurring-campaign-report/AUDIT.md) · [FLOWS](content-reporting/recurring-campaign-report/FLOWS.md) · [PARITY](content-reporting/recurring-campaign-report/PARITY.md) |
| A/B Campaign Reports | `/ab_reports` (+ `/campaigns/:id/ab_report`) | [`ABCampaignReports.vue`](../../src/views/Analytics/ABCampaignReports.vue) + [`ABCampaignReportDetail.vue`](../../src/views/Analytics/ABCampaignReportDetail.vue) | [AUDIT](content-reporting/ab-reports/AUDIT.md) · [FLOWS](content-reporting/ab-reports/FLOWS.md) · [PARITY](content-reporting/ab-reports/PARITY.md) |
| Dynamic Content | `/dynamic_contents` (+ `/new`, `/:id/edit`) | [`DynamicContent.vue`](../../src/views/Marketing/DynamicContent.vue) + [`DynamicContentEditor.vue`](../../src/views/Marketing/DynamicContentEditor.vue) | [AUDIT](content-reporting/dynamic-content/AUDIT.md) · [FLOWS](content-reporting/dynamic-content/FLOWS.md) · [PARITY](content-reporting/dynamic-content/PARITY.md) |
| Image Library | `/folders` | [`ImageLibrary.vue`](../../src/views/Marketing/ImageLibrary.vue) | [AUDIT](content-reporting/image-library/AUDIT.md) · [FLOWS](content-reporting/image-library/FLOWS.md) · [PARITY](content-reporting/image-library/PARITY.md) |
| Footer Management | `/footers` (+ `/:id`, `/:id/preview`, `/new`) | [`FooterManagement.vue`](../../src/views/Marketing/FooterManagement.vue) + [`FooterDetail.vue`](../../src/views/Marketing/FooterDetail.vue) + [`FooterPreview.vue`](../../src/views/Marketing/FooterPreview.vue) + [`FooterCreate.vue`](../../src/views/Marketing/FooterCreate.vue) | [AUDIT](content-reporting/footer-management/AUDIT.md) · [FLOWS](content-reporting/footer-management/FLOWS.md) · [PARITY](content-reporting/footer-management/PARITY.md) |
| Optimize On Open | `/image_groups` (+ `/new`, `/:id/edit`) | [`OptimizeOnOpen.vue`](../../src/views/Marketing/OptimizeOnOpen.vue) + [`ImageGroupEditor.vue`](../../src/views/Marketing/ImageGroupEditor.vue) | [AUDIT](content-reporting/optimize-on-open/AUDIT.md) · [FLOWS](content-reporting/optimize-on-open/FLOWS.md) · [PARITY](content-reporting/optimize-on-open/PARITY.md) |
| Content Feeds | `/content_feeds` | [`ContentFeeds.vue`](../../src/views/Marketing/ContentFeeds.vue) | [AUDIT](content-reporting/content-feeds/AUDIT.md) · [FLOWS](content-reporting/content-feeds/FLOWS.md) · [PARITY](content-reporting/content-feeds/PARITY.md) |
| Preference Management | `/preference_pages` | [`PreferencePages.vue`](../../src/views/Marketing/PreferencePages.vue) | [AUDIT](content-reporting/preference-pages/AUDIT.md) · [FLOWS](content-reporting/preference-pages/FLOWS.md) · [PARITY](content-reporting/preference-pages/PARITY.md) |

Slice-shared: [content-reporting/IMPROVEMENTS.md](content-reporting/IMPROVEMENTS.md) ·
[content-reporting/GAPS.md](content-reporting/GAPS.md)

Routes corrected to production paths (old paths redirect):

```
/accounts/:accountId/reports/recurring_campaign_report   (was /analytics/recurring_campaign_reports)
/accounts/:accountId/ab_reports                          (was /analytics/ab_campaign_reports)
/accounts/:accountId/campaigns/:id/ab_report             ABCampaignReportDetail (new)
/accounts/:accountId/folders                             ImageLibrary (was /images)
/accounts/:accountId/footers/new | /:id | /:id/preview   FooterCreate / FooterDetail / FooterPreview (new)
/accounts/:accountId/image_groups/new | /:id/edit        ImageGroupEditor (new)
/accounts/:accountId/dynamic_contents/new | /:id/edit    DynamicContentEditor (new)
```

### Data Journeys + Service Tickets slice (2026-09-01)

Crawled from `uat.maropost.com` account 116000. `/contents/template` from the brief was already
at parity (email-content slice) and was verified, not re-crawled. Both pre-existing sandbox
views were invented designs and were replaced.

| Page | Source | Rebuild | Docs |
|---|---|---|---|
| Data Journeys | `/data_journeys` (+ New/Edit modals) | [`DataJourneys.vue`](../../src/views/Marketing/DataJourneys.vue) | [AUDIT](data-journeys/AUDIT.md) · [FLOWS](data-journeys/FLOWS.md) · [PARITY](data-journeys/PARITY.md) · [IMPROVEMENTS](data-journeys/IMPROVEMENTS.md) · [GAPS](data-journeys/GAPS.md) |
| Data Journey Builder | `/data_journeys/:id/builder` (legacy iframe) | [`JourneyBuilder.vue`](../../src/views/Marketing/JourneyBuilder.vue) (`flowDomain: 'data'`) | same slice docs |
| Journey Instances | `/data_journeys/:id/instances` (legacy iframe) | [`DataJourneyInstances.vue`](../../src/views/Marketing/DataJourneyInstances.vue) — new route | same slice docs |
| Tickets inbox | `/service/:id/tickets` | [`Tickets.vue`](../../src/views/Service/Tickets.vue) + [`TicketWorkspace.vue`](../../src/components/service/TicketWorkspace.vue) | [AUDIT](service-tickets/AUDIT.md) · [FLOWS](service-tickets/FLOWS.md) · [PARITY](service-tickets/PARITY.md) · [IMPROVEMENTS](service-tickets/IMPROVEMENTS.md) · [GAPS](service-tickets/GAPS.md) |
| Ticket Details | `/service/:id/tickets/:ticketId` | [`TicketDetail.vue`](../../src/views/Service/TicketDetail.vue) — new route | same slice docs |
| New Ticket | `/service/:id/tickets/create-new` | [`TicketCreate.vue`](../../src/views/Service/TicketCreate.vue) — new route | same slice docs |

Tickets routes moved from `/accounts/:accountId/service` to the production `/service/:accountId/tickets`
family (old path redirects; `AppSidebar` updated). Ticket vocabulary is now the production set
(new/open/pending/on hold/closed · low/medium/high · email/webstore/inbound call/walk in).

---

Shared (CDP + Products slices): [IMPROVEMENTS.md](IMPROVEMENTS.md) · [GAPS.md](GAPS.md)

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
