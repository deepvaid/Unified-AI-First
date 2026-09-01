# Preference Management — parity checklist

Rebuild: [`PreferencePages.vue`](../../../../src/views/Marketing/PreferencePages.vue) at
`/accounts/:accountId/preference_pages`. Store: `useMarketingAssets.preferencePages`.

| # | Audited item | Status |
|---|---|---|
| 1 | H1 "Preference Management" | ✅ (was "Preference Pages") |
| 2 | Editor Types filter + Page Types filter | ✅ Page Type = quick-filter pill, Editor Type in the filter drawer |
| 3 | Columns: Name · Editor Type · Page Type · Updated At · Created At · Actions | ✅ "HTML Code Editor" label matches UAT |
| 4 | Kebab: Preview Preference Page · Edit Preference Page · Delete Preference Page Permanently | ✅ (previous build's invented Duplicate removed) |
| 5 | New Page modal: Name*, Page Type*, Redirect* select + 👁 + helper copy, Select Editor* radios (Drag & Drop default / WYSIWYG / HTML Code Editor), CANCEL/CREATE gated on Name | ✅ `MpDialog size="sm"`; redirect 👁 shows a toast (production previews the target) |
| 6 | CREATE → editor | ⚠️ editors are cross-origin builders — create lands back on the list with an explanatory toast (GAPS.md) |
| 7 | Preview | ✅ mock hosted-page render in `MpDialog` (UAT preview surface was inferred by analogy — FLOWS.md) |
| 8 | Delete permanently + confirmation | ✅ `MpConfirmDialog` `danger`, copy states irreversibility |
| 9 | Pagination 10/page; 3 editor types × 5 page types seeded | ✅ (Edit Profile / Report Spam types kept — footers reference them) |
| 10 | Empty state | ✅ |

Deviations (../IMPROVEMENTS.md): search added; page-type filter promoted to a pill; radio
group properly labelled via `MpFormField` (UAT's has no fieldset semantics).
