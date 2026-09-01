# Data Journeys — improvements over UAT

Each change stays inside the allowed lanes (hierarchy, labels, feedback, a11y); no features added.

1. **Kebab menu contrast fixed** — menu items render at full emphasis (UAT's grey-on-white looked disabled); Delete is separated by a divider and styled destructive (`MpMenuItem danger`).
2. **Validation message un-clipped** — "Name is required" renders fully below the field (UAT cuts it off mid-glyph).
3. **Destructive actions always confirm** — row delete, bulk delete and builder Clear get `MpConfirmDialog` with consequences copy (UAT's delete confirm was unverified; Clear had none).
4. **Status toggle feedback** — enabling/disabling shows a success toast naming the journey (UAT flips silently); the switch carries a per-row `aria-label`.
5. **Instances page is no longer a dead end** — page header with back link, journey name, run-count context, real pagination and an empty state (UAT: no title, no back, broken scrolling).
6. **Timestamp labels above values** — instances table uses normal column headers instead of UAT's label-under-value pattern (screen readers read them in the right order).
7. **Send Campaign config consolidated** — the legacy 3-tab modal is one sectioned panel (Campaign / Recipients / Campaign tags) in the builder's standard config surface; every field kept.
8. **Overlay discipline** — menus close before dialogs open; dialogs trap focus and return it (UAT left the kebab open behind the Edit dialog).
9. **Toolbar not obscured** — builder actions live in the shell header, not a floating bottom-right cluster that the chat widget covered in UAT.
10. **Label casing normalized** — "Journey status", "Updated at", "New data journey" (sentence case per design-system copy rules; UAT mixes Title Case and ALL CAPS).
11. **Empty states everywhere** — filtered-empty, journey-not-found and no-runs all render `MpEmptyState` instead of a bare table.
