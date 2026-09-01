# Image Library — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/folders`, 2026-09-01. No records mutated.
(Yes — the Image Library's legacy route is literally `/folders`.)

## Page purpose & primary user task

The account's image asset library: upload images, organise them into folders, copy CDN URLs
for use in content, rename/delete. Reused as an **image picker** by other pages via
`/folders?return_url=…` (seen from Optimize on Open's CHANGE IMAGE).

## Layout structure

```
Breadcrumb: "My Images"
H1: "Image Library"        [⊞/☰ view toggle] [ADD NEW]
[📁] folder-panel toggle on the content's left edge
└── List view (default): table
      ├── columns: [☑ select-all] · thumbnail · Name · Created At · Updated At · Actions (kebab)
      ├── row hover reveals: drag handle (⋮⋮), checkbox, copy-link icon (🔗) next to kebab
      └── kebab: Edit Image · Delete Image
└── Grid view: 6-col tile grid, filename caption under each tile
      └── tile hover reveals: checkbox (top-left), kebab (top-right), copy-link (bottom-right)
└── Folder panel (collapsible, own column):
      ├── "Always Open" toggle switch
      ├── [+ New Folder]
      └── tree: "My Images" root ▸ folders (Harpreet_QA, Manny, uday_sqa) — click to filter;
          rows are drag targets (drag handle on rows)
```

**Selection mode:** checking any item swaps the header-action row for a bulk bar:
[▣ select-all] [👁 preview] [🗑 delete] [✕] "1 selected".

**Preview (👁):** bottom sheet slides up: filename · "URL: https://cdn-…/uploads/account_…/…"
· "Updated at: …" · 🗑 · ✕, with the full-size image rendered below.

## ADD NEW — "New Images" modal

- Copy: "To add new images, upload from your computer or drag and drop them into the box
  below. Please note the suggested file size is upto 2MB and the expected extensions are:
  PNG, JPG, GIF, JPEG."
- Dashed dropzone: "Drag and Drop / or / [UPLOAD]" (file chooser)
- Footer: CANCEL · SAVE (disabled until files chosen)

## Edit Image (kebab) — small dialog

- Title "Edit Image", field "Image Name *" pre-filled with filename, CANCEL · CONFIRM.

## Data shape

```ts
{ id, name /* filename */, url /* CDN */, thumbnailUrl, folderId: string | null,
  createdAt, updatedAt }
folders: { id, name }[]  // flat, one level under "My Images"
```

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| Header | `MpPageHeader` + `#actions` (view toggle + ADD NEW) |
| View toggle | `MpSegmentedControl` (icon-only sm segments) |
| List | `v-data-table` with thumbnail cell + `MpRowActionsMenu` |
| Grid | card grid composing `v-card` tiles (see GAPS: media-tile) |
| Folder panel | `MpFolderSelect` + `useFolders` (the EmailCampaigns pattern) — NOT a tree panel |
| Bulk bar | `MpFloatingBulkBar` (count + Preview + Delete) |
| Upload modal | `MpDialog` + dropzone stand-in (see GAPS: file dropzone) |
| Rename dialog | `MpDialog` size sm, single field |
| Preview sheet | `MpDialog` `size="lg"` with image + meta (UAT uses a bottom sheet) |
| Copy link | icon `v-btn` + `useToast` confirmation |

## Accessibility issues observed

- Hover-only controls (drag handle, checkbox, copy link, tile kebab) are invisible to keyboard
  users; tiles aren't focusable.
- Copy-link button has no accessible name and no success feedback.
- Bulk-bar icon buttons (preview/delete) are unlabeled.
- Grid images: alt = filename at best (unverified); folder tree has no ARIA tree semantics.

## UX friction worth fixing

- **No search and no pagination visible in grid view** — long libraries mean endless scroll.
- Drag-to-folder is the only way to move an image (no "Move to folder" action).
- Copy-link gives no visible confirmation.
- "My Images" breadcrumb vs "Image Library" title vs `/folders` route — three names for one thing.

## Sandbox divergence

`src/views/Marketing/ImageLibrary.vue` (133 lines) exists at route `/images` (UAT: `/folders`).
Built pre-crawl; needs verification against this audit (folders, grid/list toggle, bulk bar,
preview sheet, upload copy).
