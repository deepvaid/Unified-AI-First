# Optimize On Open (Image Groups) — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/image_groups` (+ `/:id/edit`), 2026-09-01.
No records mutated.

## Page purpose & primary user task

Manage **image groups** for open-time optimization: an email `<img>` that swaps at open time —
a Default Image until its expiration datetime, then the Expiry Image (optionally more timed
slots via "+"). Tasks: create/edit groups (images + click-through URLs + expiry schedule).

Naming: the sidebar nav says "Optimise on Open" (UK), the page H1 says "Optimize On Open" (US),
the breadcrumb says "My Image Groups", the route is `image_groups`. Four names, one feature.

## 1. List — `/accounts/:id/image_groups`

```
Breadcrumb: "My Image Groups"
H1: "Optimize On Open"                                   [NEW GROUP]
[📁] folder-panel toggle on the content's left edge (same panel as Image Library)
└── Table card
      ├── columns: [☑ select-all] · Name · Created At · Updated At · Actions (kebab)
      ├── row hover: drag handle + checkbox (folder drag targets, bulk select)
      ├── kebab (2): Edit Image Group · Delete Image Group
      └── footer: Rows per page (10) · "1-5 of 5"
```

## 2. Editor — `/image_groups/:id/edit` (and `/new`)

```
Breadcrumb: My Image Groups > Edit Group
H1: "Edit Group"
├── Image Group Name *   (helper "Image Group name is required" ALWAYS visible, even filled —
│                          source defect: hint styled as error text)
├── Two cards side by side, joined by a circular ➕ button between them:
│   ├── "Default Image" ⓘ
│   │     image preview · [CHANGE IMAGE] · Click-through URL * ·
│   │     Expiration Date * (date picker) · Expiration Time * (time picker)
│   └── "Expiry Image" ⓘ
│         image preview · [CHANGE IMAGE] · Click-through URL * ·
│         info banner: "There is no expiry date and time for this image."
│   └── ➕ = insert an additional timed image slot between default and expiry (unverified)
└── footer: [CANCEL] [SAVE]
```

- CHANGE IMAGE → navigates to the Image Library **as picker**:
  `/folders?return_url=%2F116000%2Fimage_groups%2F6%2Fedit` with a
  "← Back to New Image Group" link (label wrong when coming from Edit — copy bug).

## Data shape

```ts
{ id, name, folderId: string | null, createdAt, updatedAt,
  slots: [
    { kind: 'default', imageUrl, clickThroughUrl, expiresAtDate, expiresAtTime },
    // 0..n additional timed slots (via ➕)
    { kind: 'expiry',  imageUrl, clickThroughUrl } // no expiry fields
  ] }
```

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| List | `MpPageHeader`, `v-data-table`, `MpRowActionsMenu`, `MpFolderSelect` for folders |
| Editor | full-page form; each slot = `v-card flat border` with `MpFormGrid` |
| ➕ add slot | `v-btn` icon between cards; slots rendered from array |
| Image pick | route to Image Library picker w/ `return_url`, or an `MpDialog` picker (decide) |
| Date/time | `v-date-picker`/text fields per settled form pattern |
| Delete | `MpConfirmDialog` `danger` |

## Accessibility issues observed

- "Image Group name is required" rendered under a **filled, valid** field (reads as error).
- ➕ button unlabeled; ⓘ tooltips hover-only.
- Kebab single-menuitem defect family again.
- CHANGE IMAGE navigation loses unsaved form state (unverified but likely — full navigation).

## UX friction worth fixing

- Editing an image group round-trips through a different page (Image Library) to change one
  image; a picker dialog would keep context.
- Expiration Date + Time as two separate fields with no timezone hint.
- Naming chaos (Optimise/Optimize/Image Groups) — pick one label, note the change.

## Sandbox divergence

`src/views/Marketing/OptimizeOnOpen.vue` (190 lines) exists at the same route; pre-crawl build,
needs verification against this audit (slot cards, picker flow, folders).
