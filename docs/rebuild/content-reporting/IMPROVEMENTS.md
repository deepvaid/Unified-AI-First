# Content & Reporting slice — improvements over the UAT source

Every deviation from strict 1:1 parity, with a one-line rationale. Scope-limited to
hierarchy/spacing, labels/microcopy, interaction feedback, and accessibility — no new features.

## Slice-wide

1. **Search on every list** — UAT's Email Content has 489 records with no search; the
   "MpDataTableToolbar everywhere" rule is a locked decision from the Products/Marketing slices.
2. **Real feedback everywhere** — every mutate (save, archive, delete, set-default, copy,
   upload) ends in a toast; UAT mostly navigates silently.
3. **Keyboard-reachable row menus** — UAT's kebabs leave all but one item out of the tab order
   (defect family); `MpRowActionsMenu`/`MpMenuItem` give every item `role="menuitem"`.
4. **Named icon buttons** — expanders, kebabs, copy-link, preview eyes and device toggles all
   carry aria-labels; UAT's are unnamed.
5. **Empty states on every list/table** (`MpEmptyState`) — UAT renders bare empty tables.
6. **Confirm dialogs on destructive actions** (`MpConfirmDialog`, danger where irreversible) —
   UAT's confirmations were unverifiable, so the copy is ours.
7. **Copy normalization** — "Drag & Drop" one way; "Key"/"URL" instead of "Enter Key"/"Enter
   URL"; one spelling of "Optimize On Open"; hint and error use the same words
   ("lowercase letters, numbers or underscores").

## Recurring Campaign Reports

8. Occurrence rows keep the "↳" cue but sit on a distinct surface tint, so hierarchy isn't
   carried by one glyph alone.

## A/B Campaign Reports

9. UAT's two bare Start/End date fields → the app's shared `MpDateRangeSelect` (presets +
   custom range, one labelled control).
10. The winner column gets a "Decided by TopChoice" chip **and** tint — UAT uses tint alone
    (fails non-color-cue accessibility).
11. The wide comparison table scrolls inside its card (`overflow-x: auto`) instead of the page.

## Dynamic Content

12. Archive gets a confirmation + toast and a labelled "View Archives" button (icon + text);
    each rule is grouped under a visible "Rule N" section heading with its remove button.

## Image Library

13. View toggle is a labelled two-segment control instead of an unlabeled swapping icon.
14. Tile/row controls (checkbox, kebab, copy link) are always rendered, not hover-only.
15. "Move to folder…" action replaces drag-as-the-only-way; copy-link confirms via toast.
16. Preview is a centred dialog rather than a bottom sheet (consistent with `MpDialog`-only
    modal rule).

## Footer Management

17. The editor-type filter is labelled ("Editor type") — UAT shows an anonymous "All" combobox
    whose menu opens on top of itself.
18. Footer names in the list link to the detail (UAT's names are dead text).

## Optimize On Open

19. The phantom "Image Group name is required" under a *filled* field is not reproduced — the
    message appears only when the field is actually empty (source defect family).
20. CHANGE IMAGE opens an in-context Image Library picker dialog instead of UAT's
    `?return_url` round-trip that abandons unsaved form state.
21. Native date/time inputs for expiration (UAT: two unlabeled pickers, no keyboard support).

## Preference Management

22. Page Type promoted to a quick-filter pill (the higher-traffic cut); Editor Type stays in
    the filter drawer.
23. "Delete Preference Page Permanently" confirmation states the irreversibility explicitly.

## Content Feeds

24. Feed-type chip (Single/Merge) in the Name column — invisible in UAT until you open a row.
25. NEW FEED gets a Single/Merge choice and a correct title — UAT titles the create modal
    "Edit Merge Feed" and offers no visible single-feed create path (flagged as an open
    finding, not silently "fixed").
