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

## G4 — A disabled `MpMenuItem` cannot explain itself

**Use case.** The Landing Pages list disables `Verify domain` on a row whose domain is already
`Verified`, exactly as UAT does — but UAT never says why (AUDIT §1 a11y 12, friction 12). The
rebuild has to keep the disabled state *and* carry the reason.

**Today.** `MpMenuItem` forwards `disabled` to `v-list-item`, and Vuetify's
`.v-list-item--disabled { pointer-events: none }` means a `v-tooltip` on the item can never open.
There is no prop for a reason, and Vuetify sets no `aria-disabled` either.

**Stand-in used.** Four coordinated lines at the call site in
`src/views/Marketing/LandingPages.vue`: `:disabled`, `:aria-disabled`, a scoped class restoring
`pointer-events: auto`, a `v-tooltip activator="parent"`, **and** an explicit click guard. That
last one is the trap — `MpMenuItem`'s `@click` lands in `$attrs` and is attached as a native DOM
listener on the `v-list-item` root, which Vuetify does *not* suppress when `disabled`. Restoring
pointer events silently re-enables the action; the first version of this page fired
`verifyDomain` from a greyed-out item.

**Proposed spec.** Add `disabledReason?: string`. It implies `disabled`, and the component owns the
pointer-events reset, the click guard, `aria-disabled`, and the tooltip with its `aria-describedby`
— so no consumer can half-implement it.

```ts
withDefaults(defineProps<{
  title: string
  icon?: string
  danger?: boolean
  /** Disables the item AND states why: tooltip + aria-describedby + aria-disabled + click guard. */
  disabledReason?: string
}>(), { danger: false })
```

**Why it is a real library candidate.** Every list view has at least one conditionally unavailable
row action, and the audits keep finding the same defect — a greyed control with no reason — across
Landing Pages, Email Content and the folder panel.
