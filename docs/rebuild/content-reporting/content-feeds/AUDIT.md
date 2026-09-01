# Content Feeds — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/content_feeds`, 2026-09-01.
No records mutated.

## Page purpose & primary user task

Manage **content feeds**: named external URLs (RSS/JSON product/content feeds) that campaign
content can merge at send/open time. Two kinds: **Single Feed** (one URL) and **Merge Feed**
(multiple key→URL pairs). Tasks: create, edit (schedule + URLs), organise in folders.

## Layout structure — `/accounts/:id/content_feeds`

```
Breadcrumb: "My Content Feeds"
H1: "Content Feeds"                                     [NEW FEED]
[📁] folder-panel toggle (same panel family as Image Library)
└── Table card
      ├── columns: [☑ select-all] · Name · Updated At · Created At · Action (✏ pencil only,
      │            no kebab)
      └── footer: Rows per page (10) · "1-10 of 19"
```

No search, no filters. Row action is a single pencil.

## Edit modals (pencil)

**Edit Merge Feed** (e.g. `sk-uni-mergefeed`):
```
├── Name *
├── "Update Content Feed On:"  Day of the Week ▾ · Hour of the Day ▾ (12:00 AM)
├── feed rows: Enter Key * · Enter URL * · ⋮ (row menu — delete row, unverified)
├── [+ ADD FEED]
├── ⓘ "For Journey campaigns and Transactional campaigns only —
│      The content feed will be pulled from the specified URL according to the defined update
│      schedule. For normal, batch and recurring campaigns, the content feed will be pulled at
│      the time of the campaign's scheduled send date and time."
└── [CANCEL] [SAVE]
```

**Edit Single Feed** (e.g. `sk-uni-singlefeed`):
```
├── Name *
├── "Update Content Feed On:"  Day of the Week ▾ · Hour of the Day ▾
├── URL *  (single, with 👁 preview icon)
├── same ⓘ note
└── [CANCEL] [SAVE]
```

**NEW FEED** opens the merge-feed layout but titled **"Edit Merge Feed"** (copy bug: "Edit" on
a create) with empty fields and SAVE disabled. How a *single* feed is created was not
discoverable from this modal — no type toggle seen. Open question.

## Data shape

```ts
{ id, name, kind: 'single' | 'merge', folderId: string | null,
  schedule: { dayOfWeek: string | null, hourOfDay: string }, // "12:00 AM" style
  // single:
  url?: string,
  // merge:
  feeds?: { key: string, url: string }[],
  createdAt, updatedAt }
```

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| List | `MpPageHeader`, `v-data-table`, pencil = icon `v-btn` (or promote to `MpRowActionsMenu` if we add actions — parity says pencil only) |
| Edit/create | `MpDialog` (short centred form) or `MpFormDrawer` — form: `MpFormGrid` cols=2 for schedule, repeatable key/URL rows with `.mp-form-grid__trailing` |
| Add feed row | text `v-btn` prepend-icon="plus" |
| Info note | `MpAlert` tone="info" (replaces the grey ⓘ block) |
| Folders | `MpFolderSelect` + `useFolders` |

## Accessibility issues observed

- Feed-row ⋮ menu unlabeled; row purpose (key vs URL) communicated by placeholder-as-label
  ("Enter Key *", "Enter URL *" are floating labels with instruction-style text).
- Modal titled "Edit Merge Feed" on create misleads assistive tech users as much as sighted.
- 👁 preview icon (single feed URL) unlabeled.

## UX friction worth fixing

- "Enter Key"/"Enter URL" labels are instructions, not names (should be "Key", "URL").
- No feed-type indicator column in the list — single vs merge invisible until you open it.
- No search on 19 rows.
- Create path for single feeds unclear (see open question).

## Sandbox divergence

`src/views/Marketing/ContentFeeds.vue` (198 lines) exists at the same route; pre-crawl build,
needs verification against this audit (two modal kinds, schedule selects, key/URL rows).
