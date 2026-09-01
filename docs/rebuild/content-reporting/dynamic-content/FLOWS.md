# Dynamic Content — flows

## Flow 1 — NEW DYNAMIC CONTENT (header CTA)

1. Click → route `/dynamic_contents/new`, full-page form, one empty Rule 1 pre-added,
   SAVE disabled.
2. Name validation fires on blur (lowercase/numbers/underscores).
3. Fill original body (+ optional Content Feed), pick Segment* per rule, add rules via
   + ADD NEW RULE, remove via trash.
4. PREVIEW (per block) → "Content Preview" modal (close X).
5. SAVE → creates + returns to list (NOT executed — create mutation; flagged).
   CANCEL → returns to list without saving (verified).

States: SAVE disabled/enabled; field error; preview modal.

## Flow 2 — Edit Dynamic Content (row kebab)

1. Kebab → Edit Dynamic Content → `/dynamic_contents/:id/edit`, form pre-filled
   (name, feed select value, rule segment values, bodies).
2. Same behavior as Flow 1. SAVE not executed.

## Flow 3 — Archive Dynamic Content (row kebab)

- NOT executed (mutates the record). Expected: row moves to the shared Archives page
  (`/archive?filter=dynamic_contents`), where it can presumably be restored. Flagged unverified
  (confirmation dialog presence unknown).

## Flow 4 — VIEW ARCHIVES (header, secondary)

1. Click → `/archive?filter=dynamic_contents` (shared Archives page, breadcrumb
   "Settings > Archives", type select pre-set to "Dynamic Content").
2. Empty state verified ("You have no archived items.").
3. Back via breadcrumb/sidebar (no explicit back link to Dynamic Content — friction).

## Unverified

- SAVE success toast/redirect; server-side validation errors.
- Archive confirmation + restore flow (no archived records, and archiving mutates).
- Content Feed select's option list (options load from Content Feeds; not expanded).
