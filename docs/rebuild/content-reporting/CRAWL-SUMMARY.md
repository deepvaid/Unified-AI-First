# Content & Reporting slice — crawl summary

Read-only crawl of `uat.maropost.com` account **116000**, 2026-09-01, via the claude-in-chrome
extension pathway (logged-in session; no domain re-approval needed). No records were created,
mutated, sent, or deleted. Screenshots were taken in-session; none were saved to disk (rows in
the parity tracker keep `—`, consistent with prior slices).

## 1. Scope — the brief's 10 URLs → 8 new surfaces + 2 already done

| # | URL | Status |
|---|---|---|
| 1 | `/reports/recurring_campaign_report` | crawled → [recurring-campaign-report/](recurring-campaign-report/AUDIT.md) |
| 2 | `/ab_reports` (+ `/campaigns/:id/ab_report` detail) | crawled → [ab-reports/](ab-reports/AUDIT.md) |
| 3 | `/contents` | **already audited + rebuilt** in the 2026-08-30 marketing-acquisition slice (`docs/rebuild/email-content/`) — not re-crawled |
| 4 | `/dynamic_contents` (+ `/new`, `/:id/edit`, archives) | crawled → [dynamic-content/](dynamic-content/AUDIT.md) |
| 5 | `/folders` = Image Library (+ upload/rename/preview/picker) | crawled → [image-library/](image-library/AUDIT.md) |
| 6 | `/footers` (+ `/:id`, `/:id/preview`, `/new`) | crawled → [footer-management/](footer-management/AUDIT.md) |
| 7 | `/image_groups` = Optimize on Open (+ `/:id/edit`) | crawled → [optimize-on-open/](optimize-on-open/AUDIT.md) |
| 8 | `/content_feeds` (+ single/merge edit modals) | crawled → [content-feeds/](content-feeds/AUDIT.md) |
| 9 | `/preference_pages` (+ New Page modal) | crawled → [preference-pages/](preference-pages/AUDIT.md) |
| 10 | `/contents/template?folder` | **already audited + rebuilt** (marketing-acquisition slice, `ContentTemplates.vue`) — not re-crawled |

## 2. Cross-cutting facts

- All 8 are legacy Vuetify 2 surfaces in the Vuetify 3 shell; every list uses the legacy
  data-table footer (`Rows per page · x-y of N`), default 10.
- **Folder panel family**: Image Library, Optimize on Open, and Content Feeds share the same
  collapsible left folder panel (edge toggle, "Always Open" switch, + New Folder, drag rows
  onto folders). Locked decision #3 from the marketing slice applies: rebuild as
  `MpFolderSelect` + `useFolders` + `?folder=` URL state, NOT a tree panel.
- **Cross-links between features**: footers reference preference pages (page mappings);
  dynamic content references content feeds and segments; Optimize on Open picks images from
  the Image Library via `/folders?return_url=…` picker mode; dynamic-content archives land on
  the shared `/archive` page (already rebuilt as `ContentArchives.vue`).
- **No metrics/KPIs anywhere** in the content pages — same as the marketing slice finding.
  The two report pages have exactly the columns documented, nothing more.
- Builder/editor step 2+ (footer editors, preference-page editors, CKEditor internals) are the
  same cross-origin-iframe class as before: permanently unverifiable by synthetic crawl.

## 3. Existing sandbox pages are pre-crawl builds (invented-page risk)

All 8 surfaces already have sandbox views + routes + nav items — built earlier from URL-only
tracker rows (117–277 lines each). Verified divergence:

- `RecurringCampaignReports.vue` — **fully invented** (Frequency / Next Run / Avg Opens
  columns, frequency quick-filter, date-range select; none exist in UAT; misses expandable
  occurrence rows + real columns). Route also wrong: `/analytics/recurring_campaign_reports`
  vs UAT `/reports/recurring_campaign_report`.
- `ABCampaignReports.vue` — same family; no variant child rows, no `/campaigns/:id/ab_report`
  comparison detail. Route wrong: `/analytics/ab_campaign_reports` vs UAT `/ab_reports`.
- `ImageLibrary.vue` route wrong: `/images` vs UAT `/folders`.
- The five Marketing content views (DynamicContent, FooterManagement, OptimizeOnOpen,
  ContentFeeds, PreferencePages) sit on correct routes but predate the crawl — each needs a
  parity diff against its AUDIT before deciding rebuild-vs-patch.

## 4. Source defect families observed (candidates to fix in the rebuild)

1. **Required-message under valid fields** — Optimize on Open's group-name shows
   "Image Group name is required" while filled (same family as Products feed drawer & Lead Ads).
2. **Single-keyboard-item row menus** — kebabs across Dynamic Content, Footers, Optimize on
   Open, Preference Pages (same family as Landing Pages / Email Content).
3. **Filter menu renders over its own field** — Footers editor-type combobox.
4. **Copy inconsistencies** — "lowercase alphabets" (hint) vs "lowercase letters" (error);
   NEW FEED modal titled "Edit Merge Feed"; picker back-link "Back to New Image Group" from an
   Edit context; "Optimise" (nav) vs "Optimize" (H1); "Drag & Drop" vs "Drag and Drop".
5. **Hover-only affordances** — Image Library drag handles, checkboxes, copy-link, tile
   actions unreachable by keyboard.
6. **Console noise**: preference-pages table throws a Vue resize-directive TypeError
   (`resizeDateColumn`) on load — legacy shell noise, not to be reproduced.

## 5. Open questions for the human gate (Phase 2)

See the session's question list: overlap handling for `/contents` + `/contents/template`;
replace-vs-patch for the 8 pre-crawl sandbox views; route corrections (3 wrong routes);
single-feed creation path; wizard step-2 editors (chooser-only stand-in?); naming decisions
(Optimize on Open label, "Enter Key/URL" labels).
