# Footer Management — flows

## Flow 1 — NEW FOOTER (header CTA)

1. Click → `/footers/new` "Fill out Details".
2. Name* + 4 preference-page selects (each with 👁 preview) + editor-type radios.
3. NEXT disabled until Name filled. CANCEL → back to list (verified).
4. NEXT → opens the chosen editor (Drag & Drop builder or WYSIWYG) — NOT executed
   (creates a record). Step 2 flagged unverified; editors are cross-origin builders.

## Flow 2 — editor-type filter

1. "All" combobox → options All / Drag & Drop / WYSIWYG; picking one filters the table.
   (Menu renders over its own field — source defect.)

## Flow 3 — Preview Footer (kebab)

1. Kebab → Preview Footer → full-screen `/footers/:id/preview?index=true`.
2. Device toggles (desktop/mobile/full-width); EDIT CONTENT → editor (not followed).
3. ✕ closes → lands on the footer detail `/footers/:id` (NOT back to the list — observed).

## Flow 4 — footer detail `/footers/:id`

1. Left card: rename ✏ (dialog unverified), preference-page mappings list.
2. Right card: framed preview, ✏ → content editor (not followed).
3. EXIT → back to list; ↗ opens the rendered footer in a new tab (not followed).

## Flow 5 — Set as Default (kebab)

- NOT executed (mutates account state). Expected: Default chip moves to the row. Unverified.

## Flow 6 — Edit Footer (kebab)

1. → footer detail (same surface as Flow 4). Content editing itself is inside the builder
   (cross-origin; unverifiable).

## Flow 7 — Delete Footer (kebab)

- NOT executed (destructive). Confirmation dialog presence unverified. Note: the Default
  footer presumably cannot be deleted — unverified.

## Unverified

- NEXT (step 2 editor), rename dialog, Set as Default behavior + feedback, delete
  confirmation, ↗ external preview, behavior when deleting the default footer.
