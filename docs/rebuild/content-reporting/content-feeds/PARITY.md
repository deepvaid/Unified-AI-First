# Content Feeds — parity checklist

Rebuild: [`ContentFeeds.vue`](../../../../src/views/Marketing/ContentFeeds.vue) at
`/accounts/:accountId/content_feeds`. Store: `useMarketingAssets.feeds`
(+ `content_feeds` folder scope in `useFolders`).

| # | Audited item | Status |
|---|---|---|
| 1 | Breadcrumb "My Content Feeds" context + H1 "Content Feeds" + NEW FEED CTA | ✅ |
| 2 | Table: Name · Updated At · Created At · Action (pencil only, no kebab) | ✅ pencil icon button with aria-label |
| 3 | Folder panel | ✅ `MpFolderSelect` + `MpManageFoldersDrawer` (locked slice pattern; drag-to-folder → Folder field in the drawer) |
| 4 | Edit Single Feed: Name*, Day of the Week ▾, Hour of the Day ▾ (12-hour), URL* + 👁 preview | ✅ preview opens a mock `MpDialog` (production fetches live) |
| 5 | Edit Merge Feed: Name*, schedule, Key*+URL* rows, row remove, + ADD FEED | ✅ remove disabled at one row |
| 6 | ⓘ journey/transactional schedule note | ✅ `MpAlert tone="info"`, copy lightly edited |
| 7 | NEW FEED flow | ✅ one drawer titled "New Feed" (UAT mislabels it "Edit Merge Feed") with a Single/Merge type choice — UAT's single-create path was undiscoverable (flagged) |
| 8 | SAVE disabled until valid; success feedback | ✅ + toast |
| 9 | Pagination 10/page | ✅ |
| 10 | Empty state | ✅ `MpEmptyState` |

Deviations (../IMPROVEMENTS.md): feed-type chip in the Name column; explicit type choice on
create; "Key"/"URL" labels instead of "Enter Key"/"Enter URL"; no delete action added (UAT has
none — the previous sandbox build's delete was removed for parity).
