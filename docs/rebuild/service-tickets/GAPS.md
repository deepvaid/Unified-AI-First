# Service Tickets — design-system gaps & out-of-scope notes

1. **Rich-text composer / CKEditor** — UAT's reply composer and ticket description are a
   CKEditor surface (bold/italic/link/quote/lists/paragraph styles, inline images in
   signatures). Out of scope per the standing editor boundary (same call as the content
   slices). The sandbox composer is plain text with an inert toolbar row explaining so.
   *Suggested spec:* an `MpRichTextArea` molecule wrapping one sanctioned editor with the
   field-label contract and a `component.field.*`-aligned toolbar.

2. **Grouped "views" menu** — ✅ closed 2026-11-06 by `TicketViewSwitcher`
   (src/components/service): search, collapsible inbox groups, open counts, Spam + Trash
   pinned. Kept at the Product tier; promote to an `Mp*` molecule if a second screen needs
   a grouped picker.

3. **Resizable split layout** — ✅ closed 2026-11-06 by `MpSplitPane` (window-splitter
   separator, keyboard + pointer, clamped to `layout.inboxListMinWidth` … 50%, width
   remembered by the page).

4. **Red-dot row marker** — one UAT row showed a red dot in the chip slot; meaning
   undiscoverable and unverified. Deliberately not reproduced rather than inventing
   semantics.

5. **Infinite scroll** — UAT pages the list on scroll with a bottom spinner. The mock
   dataset renders fully; if real volumes arrive, the system needs a sanctioned
   list-virtualization/paging pattern for non-table lists.

6. **Canned responses** — the composer's template icon in UAT (canned replies) was not
   crawled deeply enough to reproduce; omitted rather than guessed.

7. **`?ticket=true` contact round-trip** — UAT's Add New Contact leaves the create form and
   its return behavior is unverified; the sandbox routes to the CDP Create Contact page
   the same way. If the round-trip matters, the create form needs draft persistence.
