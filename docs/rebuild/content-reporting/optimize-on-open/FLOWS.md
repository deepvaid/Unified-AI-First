# Optimize On Open — flows

## Flow 1 — NEW GROUP (header CTA)

- Opens the group editor empty (`/image_groups/new` presumed — not navigated; Edit form
  verified instead and NEW is the same form per the picker's "Back to New Image Group" label).
  Flagged: /new not directly loaded.

## Flow 2 — Edit Image Group (kebab)

1. Kebab → Edit Image Group → `/image_groups/:id/edit`.
2. Form: name, Default Image card (image, CHANGE IMAGE, click-through URL, expiration
   date+time), Expiry Image card (image, CHANGE IMAGE, click-through URL, "no expiry" note),
   ➕ between cards.
3. CHANGE IMAGE → Image Library in picker mode (`/folders?return_url=…`) with back link.
   Selecting an image returns it to the slot — NOT executed (would modify the form via
   navigation; selection semantics unverified).
4. CANCEL → back to list. SAVE — NOT executed.

## Flow 3 — ➕ add timed slot

- NOT executed (form mutation risk was low, but slot insertion semantics + extra expiration
  fields unverified). Expected: inserts another image card with its own expiration between
  default and expiry.

## Flow 4 — Delete Image Group (kebab)

- NOT executed (destructive). Confirmation unverified.

## Flow 5 — folders & bulk

- Folder panel identical to Image Library (toggle, Always Open, New Folder, drag rows onto
  folders). Bulk select checkboxes present; bulk bar assumed same pattern as Image Library —
  unverified here.

## Unverified

- /new direct load; ➕ slot behavior; picker return; save/delete outcomes; bulk bar actions.
