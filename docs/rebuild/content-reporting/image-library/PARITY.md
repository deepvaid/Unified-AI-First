# Image Library — parity checklist

Rebuild: [`ImageLibrary.vue`](../../../../src/views/Marketing/ImageLibrary.vue) at
`/accounts/:accountId/folders` (production path; old `/images` redirects).
Store: `useImages` (now the single source — the previous build used inline mock data).

| # | Audited item | Status |
|---|---|---|
| 1 | H1 "Image Library" + view toggle + ADD NEW | ✅ toggle is a labelled `MpSegmentedControl` (UAT: unlabeled swap icon) |
| 2 | List view: thumbnail · Name · Created At · Updated At · Actions + select checkboxes | ✅ `v-data-table` `show-select` |
| 3 | Grid view: tiles, filename caption, per-tile checkbox / kebab / copy link | ✅ controls always reachable (UAT: hover-only) |
| 4 | Folder panel (tree, Always Open, New Folder, drag rows onto folders) | ✅ as `MpFolderSelect` + `MpManageFoldersDrawer` + "Move to folder…" action (locked slice pattern replacing drag) |
| 5 | Kebab: Edit Image · Delete Image | ✅ + Move to folder (the drag replacement) |
| 6 | Copy-link icon → CDN URL | ✅ clipboard + toast confirmation (UAT gives no feedback) |
| 7 | Selection → bulk bar: select-all context, preview 👁, delete 🗑, clear ✕, "n selected" | ✅ `MpFloatingBulkBar`; preview shown for single selection |
| 8 | Preview surface: filename, URL line, Updated at, delete, full image | ✅ `MpDialog size="lg"` (UAT bottom sheet — flagged) |
| 9 | ADD NEW modal: 2MB / PNG-JPG-GIF-JPEG copy, dropzone + browse, CANCEL/SAVE gated | ✅ real file picker (names only — no binary stored), removable chips |
| 10 | Edit Image dialog: "Image Name *", CANCEL/CONFIRM | ✅ |
| 11 | Picker mode (`/folders?return_url=…` from Optimize on Open) | ⚠️ replaced by an in-context picker dialog in the group editor (IMPROVEMENTS.md) — the round-trip lost form state in UAT |
| 12 | Search (UAT has none — 489-record friction) | ✅ added per slice rule |
| 13 | Empty states in both views | ✅ |

Deviations logged in ../IMPROVEMENTS.md (segmented view toggle, always-visible controls,
move-to-folder action, dialog preview, copy feedback, search).
