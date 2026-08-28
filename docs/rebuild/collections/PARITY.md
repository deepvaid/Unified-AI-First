# PARITY — Collections

Rebuild: [`Collections.vue`](../../../src/views/Products/Collections.vue) ·
[`CollectionEditor.vue`](../../../src/views/Products/CollectionEditor.vue)

## List page
- [x] Header: Filters + New collection ▾ (Manual / Automated — with explanatory subtitles UAT lacks)
- [x] Table: Title (+ parent subtitle; automated rows also show their first rule — replaces UAT's
      unlabeled funnel icon) · Handle · Type chip · Products count (UAT shows "--" on every row;
      real counts seeded) · Status chip · Updated at · kebab
- [x] Sortable columns; hover-select checkboxes → bulk bar: Set active / Set inactive / Delete
      (as `MpFloatingBulkBar`, replacing "Choose an action")
- [x] Row kebab: Edit / Delete (confirm added; UAT confirm unverified)
- [x] Filters (DS toolbar drawer): Status (Active/Inactive) · Type (Manual/Automated) · Parent
- [x] 22 mock collections mirroring UAT's titles/handles/timestamps

## Editor
- [x] Automated (`?type=automated`; UAT `?type=dynamic`): General (Title*, Parent, Description) ·
      Conditions (All/Any radios; rule rows Field(Title/Category/Tags/Brand/Product Type/Price) ×
      Operator × Value; Price gets numeric operators — UAT numeric operators unverified) ·
      Add condition · per-rule delete + validation
- [x] Manual (`?type=manual`): Products section with Add products picker (search + source filter,
      checkbox rows, selection count, Add disabled at 0) and row removal; Parent field also
      present (UAT drops it on manual — normalized, flagged)
- [x] Shared: SEO section with live listing preview + URL handle auto-follows title until edited ·
      Status rail (Active/Inactive) · Collection image (JPG/PNG/GIF/WebP ≤ 20 MB) · Sales
      channels placeholder card ("assigned once the collection exists")
- [x] Cancel guard — fires only when dirty (UAT fires on pristine forms) and says "Discard
      changes" instead of UAT's CANCEL/CONFIRM double negative
- 🔤 Operators reworded: "Does not contain" / "Starts with" / "Ends with"

## Unverified on UAT → mocked as inferred
- Edit-collection surface (UAT edit not opened), Price-field operators, sales-channel assignment,
  image upload handling, bulk/delete confirms
