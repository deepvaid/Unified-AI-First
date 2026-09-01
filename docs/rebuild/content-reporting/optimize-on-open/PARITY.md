# Optimize On Open — parity checklist

Rebuild: [`OptimizeOnOpen.vue`](../../../../src/views/Marketing/OptimizeOnOpen.vue) (list) +
[`ImageGroupEditor.vue`](../../../../src/views/Marketing/ImageGroupEditor.vue)
(`/image_groups/new`, `/image_groups/:id/edit`). Store: `useMarketingAssets.imageGroups`
(reshaped to the crawled slots model) + `image_groups` folder scope.

## List

| # | Audited item | Status |
|---|---|---|
| 1 | H1 "Optimize On Open" + NEW GROUP | ✅ one spelling used everywhere (UAT mixes Optimise/Optimize — flagged) |
| 2 | Folder panel | ✅ `MpFolderSelect` + manage drawer (locked slice pattern) |
| 3 | Columns: select ☑ · Name · Created At · Updated At · Actions | ✅ |
| 4 | Kebab: Edit Image Group · Delete Image Group | ✅ |
| 5 | Bulk select → delete | ✅ `MpFloatingBulkBar` (UAT bulk actions unverified — modeled on the Image Library pattern) |
| 6 | Pagination; empty state | ✅ |

## Editor ("Edit Group" / "New Group")

| # | Audited item | Status |
|---|---|---|
| 1 | Image Group Name * | ✅ required message only when actually empty (UAT shows it under a filled field — source defect not reproduced) |
| 2 | Default Image card: preview · CHANGE IMAGE · Click-through URL* · Expiration Date* + Time* · ⓘ | ✅ tooltip on ⓘ |
| 3 | Expiry Image card: preview · CHANGE IMAGE · Click-through URL* · "There is no expiry date and time for this image." | ✅ `MpAlert tone="info"` |
| 4 | ➕ between cards inserts a timed slot | ✅ timed slots carry their own expiration + remove |
| 5 | CHANGE IMAGE → Image Library picker | ✅ in-context `MpDialog` picker over `useImages` (UAT's `?return_url` round-trip lost form state — IMPROVEMENTS.md) |
| 6 | CANCEL / SAVE, gated on name + image + URL + expiration per slot | ✅ + toasts |
| 7 | New group starts with Default + Expiry slots | ✅ |

Deviations (../IMPROVEMENTS.md): search added; picker dialog replaces the cross-page trip;
native date/time inputs; the phantom "required" helper removed.
