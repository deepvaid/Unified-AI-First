# Content & Reporting slice — design-system gaps

Missing components (or out-of-scope surfaces) hit during the rebuild, with the stand-in used
and a suggested spec. Nothing here was invented as a one-off component; stand-ins compose
existing `Mp*` pieces.

## 1. Rich text editor (CKEditor class)

- **Where**: Dynamic Content bodies (original + rules); the step-2 editors behind Footer
  NEXT, Preference Page CREATE, and footer/preference EDIT CONTENT pencils.
- **UAT**: CKEditor 4 with Maropost dropdowns (Campaign/Contact/Other Tags, Dynamic Areas,
  Table Tags, Coupon Tags, Product Feeds); the builder-class editors are cross-origin iframes
  (unverifiable — same limitation as the marketing slice).
- **Stand-in**: `DynamicContentBlockEditor` (textarea + seven tag-insert menus + preview);
  editors behind wizards resolve to an explanatory toast and the created record.
- **Suggested spec**: `MpRichTextEditor` — model `v-model` (html string), `tagMenus?:
  Array<{ label, tags }>`, `rows?`, slots for toolbar extensions; until then, this stays the
  documented boundary of the sandbox.

## 2. File dropzone

- **Where**: Image Library "New Images".
- **Stand-in**: styled button + hidden `<input type="file" multiple>`; chosen names render as
  removable chips (no binary stored).
- **Suggested spec**: `MpFileDropzone` — `accept`, `multiple?`, `maxSizeMb?`, drag-over state,
  `v-model:files`, error slot for rejected files.

## 3. Media tile

- **Where**: Image Library grid; Optimize On Open picker.
- **Stand-in**: `v-card flat border rounded="lg"` with overlay controls (this slice's local
  CSS is contained to the two views).
- **Suggested spec**: `MpMediaTile` — `src`, `title`, `selected?`, `selectable?`, slots
  `#actions` (top-right) and `#footer`; keyboard-operable per `MpOptionCard`'s pattern.

## 4. Legacy campaign sub-reports

- **Where**: A/B comparison detail — UAT links every metric cell to
  `delivered_report` / `open_report` / `link_report` / `bounce_report`.
- **Status**: pages were never crawled (outside the slice's 10 URLs); cells render as text.
  If those reports get a slice of their own, re-link the cells.

## 5. Archive listing for non-Content record types

- **Where**: Dynamic Content → View Archives.
- **Status**: the shared Archives page pre-selects "Dynamic Content" from
  `?filter=dynamic_contents` but lists only archived Email Content (its store); archived
  dynamic-content records keep an `archived` flag in `useMarketingAssets`. Wiring the shared
  Archives table to multiple stores is a cross-slice change — flagged, not smuggled in.
