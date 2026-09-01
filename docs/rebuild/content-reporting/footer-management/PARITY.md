# Footer Management — parity checklist

Rebuild: [`FooterManagement.vue`](../../../../src/views/Marketing/FooterManagement.vue) (list) +
[`FooterDetail.vue`](../../../../src/views/Marketing/FooterDetail.vue) (`/footers/:id`) +
[`FooterPreview.vue`](../../../../src/views/Marketing/FooterPreview.vue) (`/footers/:id/preview`) +
[`FooterCreate.vue`](../../../../src/views/Marketing/FooterCreate.vue) (`/footers/new`) +
shared [`FooterRender.vue`](../../../../src/components/marketing/FooterRender.vue).
Store: `useMarketingAssets.footers` (cross-linked to `preferencePages`).

## List

| # | Audited item | Status |
|---|---|---|
| 1 | H1 + editor-type filter (All / Drag & Drop / WYSIWYG) + NEW FOOTER | ✅ filter as exclusive quick-filter pill |
| 2 | Columns: Name (+ Default chip) · Editor Type · Updated At · Created At · Actions | ✅ chip inline beside the name, as UAT |
| 3 | Kebab: Set as Default · Preview Footer · Edit Footer · Delete Footer | ✅ Set as Default hidden on the default row; delete disabled on it (UAT unverified — safe default) |
| 4 | Set as Default outcome | ✅ chip moves + toast |
| 5 | Delete + confirmation | ✅ `MpConfirmDialog` `danger` |
| 6 | Pagination 10/page; empty state | ✅ |

## Preview (`/footers/:id/preview`)

| # | Audited item | Status |
|---|---|---|
| 1 | Full-screen: name + EDIT CONTENT + device toggles (🖥/📱/full) + ✕ | ✅ `MpSegmentedControl`; EDIT CONTENT → explanatory toast (editor out of scope, GAPS.md) |
| 2 | Rendered footer: sent-to line, `{{campaign.address}}`, 1-Click Unsubscribe / Report Spam / Manage Subscriptions links | ✅ `FooterRender` |
| 3 | ✕ lands on the footer detail (observed UAT behavior) | ✅ |

## Detail (`/footers/:id`)

| # | Audited item | Status |
|---|---|---|
| 1 | Breadcrumb + device toggles + ↗ open + EXIT | ✅ ↗ routes to the full preview |
| 2 | Left card: name + rename ✏ · editor-type chip · 4 preference-page mappings ("Default"/"Not Required" fallbacks) | ✅ rename dialog implemented |
| 3 | Right card: framed preview + content ✏ | ✅ pencil → explanatory toast (GAPS.md) |

## New (`/footers/new` — "Fill out Details")

| # | Audited item | Status |
|---|---|---|
| 1 | Name* · 4 "Select … Page" selects defaulting "Default", each with 👁 · editor radios (Drag & Drop default / WYSIWYG) · CANCEL / NEXT gated on Name | ✅ selects filter preference pages by matching page type |
| 2 | NEXT → step-2 editor | ⚠️ editor is a cross-origin builder — NEXT creates the footer and lands on its detail with an explanatory toast (GAPS.md) |

Deviations (../IMPROVEMENTS.md): search added; filter labelled "Editor type" (UAT shows a bare
"All" combobox); previous build's drawer-based edit + Duplicate action removed for parity;
"Drag & Drop" spelled one way everywhere.
