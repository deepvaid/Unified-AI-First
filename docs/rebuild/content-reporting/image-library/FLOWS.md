# Image Library — flows

## Flow 1 — ADD NEW (header CTA)

1. Click ADD NEW → "New Images" modal (copy: 2MB suggested, PNG/JPG/GIF/JPEG).
2. Drag-drop or UPLOAD → file chooser. (NOT executed past this point — upload mutates.)
3. SAVE enabled once files queued → uploads, list refreshes. CANCEL verified.

## Flow 2 — view toggle

1. ⊞ toggles list → grid (6-col tiles). Icon swaps to ☰; click returns to list.

## Flow 3 — folder panel

1. 📁 edge toggle opens the panel (Always Open switch, + New Folder, tree with root
   "My Images" + folders).
2. Click a folder → filters the visible images (verified switching highlights; contents
   change per folder).
3. + New Folder → NOT executed (creates a record); expected inline name input/dialog —
   flagged unverified.
4. Drag a row/tile onto a folder to move it — NOT executed (mutates); drag handles verified
   present.

## Flow 4 — row/tile actions

1. Kebab → Edit Image → "Edit Image" dialog (Image Name *, CANCEL/CONFIRM). CONFIRM not
   executed.
2. Kebab → Delete Image → NOT executed (destructive). Confirmation dialog presence unverified.
3. 🔗 copy link → copies CDN URL (not executed — clipboard side effect only; safe but
   unverified feedback).

## Flow 5 — select & bulk actions

1. Check an item (hover checkbox in list; tile checkbox in grid).
2. Header swaps to bulk bar: select-all ▣ · 👁 · 🗑 · ✕ · "1 selected".
3. 👁 preview → bottom sheet with filename, CDN URL, updated-at, 🗑, ✕, full image (verified).
4. 🗑 bulk delete — NOT executed (destructive).
5. ✕ clears selection.

## Flow 6 — picker mode (cross-feature)

- Other pages open `/folders?return_url=<path>`; the page then shows a
  "← Back to New Image Group"-style link and clicking an image returns it to the caller.
  Entered from Optimize on Open's CHANGE IMAGE; selection-return not executed (would edit the
  group). Note: the back label said "New Image Group" even when the caller was an Edit page.

## Unverified

- Upload success/error states; per-file progress.
- Delete confirmations (single + bulk); folder create/rename/delete; drag-move.
- Grid pagination/infinite scroll (grid showed ~3 rows of 6 with no visible footer).
