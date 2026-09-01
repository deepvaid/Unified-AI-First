# Dynamic Content — parity checklist

Rebuild: [`DynamicContent.vue`](../../../../src/views/Marketing/DynamicContent.vue) (list) +
[`DynamicContentEditor.vue`](../../../../src/views/Marketing/DynamicContentEditor.vue)
(`/dynamic_contents/new`, `/:id/edit`) + shared
[`DynamicContentBlockEditor.vue`](../../../../src/components/marketing/DynamicContentBlockEditor.vue).
Store: `useMarketingAssets.dynamicContents` (+ `archived`, `contentFeedId` per block).

## List

| # | Audited item | Status |
|---|---|---|
| 1 | H1 "Dynamic Content" + VIEW ARCHIVES + NEW DYNAMIC CONTENT | ✅ |
| 2 | Columns: Name · Number of Segments · Created At · Updated At · Actions | ✅ |
| 3 | Kebab: Archive Dynamic Content · Edit Dynamic Content (2 items only) | ✅ (previous build's Duplicate/Delete removed for parity) |
| 4 | Archive flow | ✅ confirm → row leaves list → toast; reversible via the archived flag |
| 5 | VIEW ARCHIVES → shared Archives page pre-filtered to Dynamic Content | ✅ `?filter=dynamic_contents` deep link; `ContentArchives` now pre-selects the type from the query (script-only change) |
| 6 | Pagination; empty state | ✅ |

## Editor (`/dynamic_contents/new`, `/:id/edit`)

| # | Audited item | Status |
|---|---|---|
| 1 | Name* + hint, lowercase/numbers/underscores validation on blur | ✅ one copy used for hint and error (UAT says "alphabets" vs "letters") |
| 2 | "Original Content Preview" section + UAT description copy | ✅ |
| 3 | Content Feed select (clearable) per block | ✅ options from Content Feeds store |
| 4 | CKEditor + Maropost tag dropdowns (Campaign/Contact/Other Tags, Dynamic Areas, Table Tags, Coupon Tags, Product Feeds) | ⚠️ CKEditor out of scope (GAPS.md) — textarea stand-in with the seven tag-insert menus |
| 5 | PREVIEW per block → "Content Preview" modal | ✅ `MpDialog` |
| 6 | Rule N: Segment* (clearable) + Content Feed + 🗑 remove + body + preview | ✅ remove disabled at one rule |
| 7 | + ADD NEW RULE | ✅ |
| 8 | New form starts with one empty Rule 1; SAVE disabled until valid | ✅ |
| 9 | CANCEL → list; SAVE → list + toast | ✅ |

Deviations (../IMPROVEMENTS.md): search on the list; full-page editor keeps UAT's layout but
groups each rule under an `MpFormSection`; archive confirm dialog added (UAT confirmation
unverified).
