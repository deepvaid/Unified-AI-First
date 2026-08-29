# Component gaps — Marketing Acquisition + Content slice

Components the rebuild wanted and the library does not have. Nothing here was invented; each entry
names the stand-in actually used.

## G1 — `MpOptionCard` cannot put its media first

**Use case.** Template galleries (Form Selection, Landing Page templates, the Email Content library)
are picked by *look*. The thumbnail is the primary content and should lead the card.

**Today.** `MpOptionCard` renders body-then-media with `mt-auto` pinning media to the bottom, so a
gallery card reads name → description → picture.

**Stand-in used.** `MpOptionCard` as-is, media last. It is consistent and keeps the heading before
the image, which is defensible for screen readers — but it is not what a gallery wants.

**Proposed spec.** Add `mediaPosition?: 'top' | 'bottom'` (default `'bottom'`, preserving today's
behaviour). `'top'` moves the media block above the body and drops the `mt-auto`. No other API change.

## G2 — No faceted filter rail

**Use case.** The Email Content library and the Landing Page template gallery both filter by four
checkbox facet groups (`INDUSTRY` · `AUTOMATED` · `SEASONAL` · `USAGE`) with per-facet counts and a
`Clear All`.

**Today.** `MpDataTableToolbar`'s `#filter-content` drawer holds arbitrary content, but there is no
component for a facet group with counts, and `MpSectionRail` is route-driven.

**Stand-in used.** `MpFormField` wrapping a checkbox group inside the toolbar's filter drawer.

**Proposed spec.** `MpFacetGroup` — `title`, `options: { label, value, count? }[]`, `v-model`
(string[]), `collapsible?`, and a badge showing the active count on the group header. Several
`MpFacetGroup`s stack inside the existing filter drawer; no new overlay.

## G3 — No block palette component

**Use case.** Three separate editors (form content, landing page, email content) each present a grid
of draggable content blocks with an icon and a label.

**Today.** `FormBuilder.vue`, `LandingPageEditor.vue` and `EmailContentEditor.vue` each hand-roll one.

**Stand-in used.** The existing hand-rolled palettes, left in place.

**Proposed spec.** `MpBlockPalette` — `blocks: { type, label, icon }[]`, `columns?` (default 3),
emits `add(type)`. Purely presentational; the editor still owns what an "add" means.
