# GAPS

Design-system components the rebuild needed and could not find. Each entry records the use case,
what was used instead, and a proposed spec.

Nothing here was invented as a new `Mp*` component — every stand-in composes existing primitives,
and each is flagged in code with a comment pointing back here.

---

## 1. `MpFieldPicker` — grouped multi-select picker drawer

**Status:** built as a feature-scoped stand-in, not promoted to the library.

**Use case.** The Custom Report wizards need this exact shape **four times**: Optional fields (28
items), ISPs (25), Deliverability performance metrics (11), Growth & attrition metrics (10). The
source uses one drawer for all four. It is a searchable, select-all, two-group (Selected /
Unselected) multi-select that returns a `string[]`.

`v-select multiple chips` does not cover it: at 25–28 options with a search requirement and a
selected/unselected split, an inline menu is the wrong container.

**Stand-in used:** [`src/components/analytics/ReportFieldPicker.vue`](../../src/components/analytics/ReportFieldPicker.vue)
— composes `MpFormDrawer` + `v-checkbox` + `MpEmptyState`. Feature-scoped under
`components/analytics/`, matching the `components/rbac/InviteUsersDrawer.vue` precedent.

**Proposed spec** if promoted:

```ts
defineProps<{
  title: string
  subtitle?: string
  /** Every selectable option. Strings, or objects with a value + label. */
  items: string[] | { value: string; label: string; hint?: string }[]
  /** Noun for the group headings: "Selected fields (2)". Default 'items'. */
  noun?: string
  /** 'sm' | 'md' | 'lg', forwarded to MpFormDrawer. Default 'md'. */
  size?: 'sm' | 'md' | 'lg'
  /** Hide the Selected/Unselected split for short lists. Default false. */
  flat?: boolean
}>()

const model = defineModel<boolean>()                       // open state
const selected = defineModel<string[]>('selected')         // committed selection
```

Behaviour: search filters both groups · `Select all` acts on the *filtered* set and shows an
indeterminate state · edits are held in a local draft until Apply · `MpEmptyState` on a search miss.

**Why it is a real library candidate:** four uses inside one feature, and the same shape recurs in
column pickers, permission pickers and segment-field pickers elsewhere in the product.

---

## 2. `MpInlineAlert` — in-page status / error / warning banner

**Status:** used raw `v-alert`.

**Use case.** Both pages need in-page banners that are not toasts and not empty states:
- the 500-campaign cap error, which blocks Continue,
- the zero-match warning,
- the live "N campaigns match" summary.

The design system has `MpEmptyState` and `MpErrorState` (whole-surface states) and `useToast`
(transient), but nothing for a persistent banner attached to a form region.

**Stand-in used:** `v-alert` with `type` / `variant="tonal"` / `density="comfortable"`, plus
explicit `role="status"` and `aria-live="polite"` where the content updates. This works, but it is
the one place in these two pages where a raw Vuetify component carries semantics the design system
should own — in particular nothing forces the `role`/`aria-live` pairing, which is exactly the
accessibility gap the audit found in the source (finding B3).

**Proposed spec:**

```ts
withDefaults(defineProps<{
  tone?: 'info' | 'success' | 'warning' | 'error'   // default 'info'
  title?: string
  /** Announce changes to assistive tech. 'polite' for live counts, 'assertive' for blocking errors. */
  live?: 'off' | 'polite' | 'assertive'             // default: 'polite' when tone is info/success,
                                                    //          'assertive' when warning/error
  /** Renders a dismiss affordance. Omit for banners that must stay. */
  dismissible?: boolean
  icon?: string
}>(), { tone: 'info' })
// slots: default (body), actions
```

The value over raw `v-alert` is the enforced `role` + `aria-live` pairing and one tone vocabulary.

---

## 3. Brand-illustrated full-bleed page canvas

**Status:** dropped, not replaced.

**Use case.** The source's report-type chooser is a full-bleed white→cyan diagonal-wedge canvas with
line-art illustrations on each card. Nothing in the design system produces this, and
`docs/design-system` has no full-bleed brand surface.

**What was done:** the chooser was rebuilt as a standard `MpPageHeader` + `v-card` + `MpOptionCard`
grid using Lucide icons. This is a deliberate deviation, logged as PARITY #7 and IMPROVEMENTS #8:
the source's canvas is used on exactly one screen in the whole product and reads as a different
application.

**Recommendation:** do not build this. If a branded "choose a starting point" surface is genuinely
wanted, it should be a design-system decision applied consistently across every create-flow entry
point (journeys, campaigns, sales channels, reports), not a one-off. `MpEmptyState`
`variant="launcher" emphasis="prominent"` with `MpIllustration` is the closest existing idea and may
already be the right answer.

---

## 4. Per-type illustrations for `MpOptionCard`

**Status:** substituted Lucide icons.

**Use case.** The source's five chooser cards each carry a distinct line-art illustration.
`MpOptionCard` supports `icon` (a Lucide name in a tonal avatar) and a `#media` slot, but the
sandbox has no illustration set for report types.

**Stand-in used:** `icon` with `megaphone` / `message-square` / `smartphone` / `mail-check` /
`trending-up`. Legible and consistent, but flatter than the source.

**Proposed:** extend `MpIllustration` (already used by `MpEmptyState` `emphasis="prominent"`) with a
named set for create-flow entry points, then pass them through `MpOptionCard`'s `#media` slot. No
new component — just new illustration names.

---

## 5. Sticky page head/foot shell

**Status:** copied local CSS, as the codebase already requires.

**Use case.** Full-page create forms need a sticky header, a scrollable body and a sticky action
footer. `CreateContact.vue` needs exactly this.

**Stand-in used:** the `.page-head` / `.page-foot` rules plus the global `.mp-frame-fill`, copied
from `CreateTransactional.vue` — which is what `CreateTransactionalSms.vue` already does.

**Note, not a request:** this is now the **third** view carrying an identical copy of those two
border rules. `MpBuilderShell` exists for builder chrome but does not cover the
head/scroll-body/foot form shell. A small `MpFormPage` wrapper (slots: `#header`, default, `#footer`)
would collapse three copies into one. Low priority — the duplication is 6 lines of CSS — but it will
keep growing as more full-page create forms land.

---

## 6. `aria-sort` on `v-data-table` — design-system-level gap

**Status:** patched locally on one page; belongs upstream.

**Use case.** Every sortable table in the app. Vuetify 3's `v-data-table` marks the sorted column
with a CSS class (`v-data-table__th--sorted`) and a direction icon, but emits **no `aria-sort`
attribute**. Sort state is therefore conveyed visually only — a WCAG 1.3.1 / 4.1.2 failure.

This is not a rebuild artefact: the legacy UAT table has the identical gap (audit A5 in
`custom-reports-list/AUDIT.md`), and so does every other `v-data-table` in this sandbox.

**Stand-in used:** a local watcher in
[`CustomReports.vue`](../../src/views/Analytics/CustomReports.vue) mirrors the `sortBy` model onto
the header cells after each change. ~15 lines, no new component, verified working
(`Updated at: descending` by default, flipping to `Name: ascending` on click).

**Proposed:** this belongs in one place, not in every view. Either
- a `useAriaSort(tableRef, sortBy, headers)` composable in `src/composables/`, or
- an `MpDataTable` wrapper around `v-data-table` that owns the toolbar, the skeleton, the empty
  state and this attribute — which the codebase is arguably already converging on, given how many
  views hand-assemble `MpDataTableToolbar` + `v-data-table` + `MpTableSkeleton` + `MpEmptyState` in
  the same order.

The wrapper is the better answer if someone is doing a sweep; the composable is the cheap fix.

---

## 7. `MpStatusChip` — `report` type map (resolved, not a gap)

Recorded because it was a change to a shared component rather than a view.

The Custom Reports list needs `Scheduled` (amber) and `Recurring` (blue) chips. `MpStatusChip`'s
`campaign` map had `scheduled` but no `recurring`, and a saved report is not a campaign. A `report`
entry was added to the `type` union and `toneMap`:

```ts
report: {
  // A saved report's Status column shows its schedule mode, not an execution state.
  scheduled: 'warning', recurring: 'brand',
},
```

This is the component's documented extension point (`type` maps status → tone per domain), so it is
an extension rather than an invention — noted here only so the change is not invisible.

---

## 8. `MpOptionCard` has no navigational variant

**Status:** ✅ **CLOSED (wizard pass, 2026-08-30)** — the proposed spec below was adopted verbatim:
`selected` became optional, `to`/`href` render the card as a real anchor with no `aria-pressed`,
plus a `#title-append` slot and `headingLevel` for landmark tiles. `SegmentBuilderChooser` and
`CampaignTypeChooser` now compose it.

**Use case.** The segment builder chooser (`/segments/types`) offers two tiles that **navigate**.
`MpOptionCard` is a *selection* control: it hardcodes `role="button"` and `aria-pressed`, so using
it here would announce two links as unpressed toggles, and it takes no `to` / `href`.

**Stand-in used:** `v-card flat border rounded="lg" :to="…"` in
[`SegmentBuilderChooser.vue`](../../src/views/Contacts/SegmentBuilderChooser.vue) — Vuetify renders
a real anchor, which is keyboard operable natively and correct for assistive tech.

**Proposed spec** if the library adopts it — add an optional target to `MpOptionCard` and derive
its semantics from it:

```ts
defineProps<{
  selected?: boolean          // becomes optional
  title: string
  description?: string
  icon?: string
  /** When set, the card renders as a link and drops role/aria-pressed. */
  to?: RouteLocationRaw
  href?: string
}>()
```

Behaviour: with `to`/`href` the root becomes an anchor with no `aria-pressed`; without one it keeps
today's `role="button"` + `aria-pressed`. This is the same "resolve your own tag from whichever
target prop is set" rule `MpListRow` already follows, so it is a consistency fix, not a new idea.

**Why it is a real candidate:** chooser galleries recur — the Custom Report type chooser hit the
same shape, and any "pick a starting point" screen will.

---

## 9. No file-upload control

**Status:** hand-rolled a hidden `<input type="file">` + `v-btn` trigger.

**Use case.** Import Contacts needs a file picker with an `accept` list, a visible chosen-filename,
and constraints (formats, 128 MB cap) that are *programmatically associated* with the control.
The source's own input has no label at all, which is exactly the failure a component would prevent.

There is no `MpFileInput`, and Vuetify's `v-file-input` is not used anywhere in this codebase.
Three other views (`GeneralPage`, `StoreAssets`, `StoreContentEditor`) each hand-roll their own.

**Stand-in used:** hidden native input + `v-btn` + `MpFormField` for the label and hint, inside
[`AllContacts.vue`](../../src/views/Contacts/AllContacts.vue).

**Proposed spec:**

```ts
defineProps<{
  label: string
  accept?: string             // forwarded to the native input
  maxSizeMb?: number          // rendered into the hint and validated
  hint?: string
  error?: string
  required?: boolean
  buttonLabel?: string        // default 'Select file'
}>()
const file = defineModel<File | null>()
```

Behaviour: renders `MpFormField` + trigger button + chosen-filename (or "No file chosen") ·
associates `accept`/size copy via `aria-describedby` · validates size and extension on pick.

**Why it is a real candidate:** four hand-rolled implementations already exist in this repo, and
every one of them re-solves labelling and constraint association differently.

---

## 10. No SQL / code editor

**Status:** used a plain `v-textarea`, matching the source.

**Use case.** The SQL Queries page asks users to author SQL that, on `Overwrite`, **truncates a
target table**. The source gives them a 4-row sans-serif textarea with spellcheck on — no
monospace, no syntax highlighting, no line numbers, no schema browser, and no validate/test/run.

The rebuild keeps a textarea, because adding an editor is a new feature rather than parity. But
this is the highest-risk surface audited: users author destructive SQL blind.

**Proposed direction** (needs a product decision before any spec): either adopt a small editor
dependency (CodeMirror 6) behind an `MpCodeEditor` wrapper with `language`, `readonly` and
`lineNumbers` props, or at minimum render the textarea in the monospace stack with
`spellcheck="false"`. The second is a token/style fix and could ship immediately.

**Why it matters:** no other surface in the product asks a user to write executable code.

---

## 11. `MpFormSection` gap collapses against a floated field label

**Status:** observed, not worked around.

**Symptom.** When the first control after an `MpFormSection` is a field that already has a value,
its floating label rises into the section's bottom gap. Measured on `CreateList.vue` at 375px:
`component.field.sectionGap` is 24, but the rendered distance from the section description to the
label was **10px**. Not overlapping, but visibly tighter than the token intends.

Not patched locally, because "a field never sets its own margin" — the container owns the rhythm,
so the fix belongs in `MpFormSection` (or in the field's label offset), not in the page.

**Suggested fix:** add the floated-label offset (~14px) to `MpFormSection`'s bottom spacing, or
have `MpFormGrid` reserve it on its first row. Either way it is a one-place change that benefits
every form whose first field is pre-filled.

---

## `MpDataTableToolbar` always renders search (minor)

Not filed as a numbered gap because it has a clean workaround, but worth recording:
`MpDataTableToolbar` has no way to suppress its search field. On the Custom Fields "Default fields"
tab — two rows, no search — it rendered a dead input. `MpSectionHeader` was used instead, which is
the right component for a heading inside a card. A `searchable?: boolean` prop would let the
toolbar cover both cases.

---

## Not gaps

Recorded so the next person does not re-litigate them:

- **Multi-select with chips** — `v-select multiple chips closable-chips` is the established house
  pattern (`CreatePromotion.vue`, `OrderDetail.vue`). No `Mp*` wrapper needed or wanted.
- **Wizard stepper** — `MpWizardSteps` covers it exactly, including `clickable` / `maxStep` and
  `aria-current="step"`.
- **Form sections, grids, labelled composite controls** — `MpFormSection`, `MpFormGrid`,
  `MpFormField` covered every case in both pages with no stretching.
- **Right-side create/edit form** — `MpFormDrawer` covered the Add Custom Field drawer directly.
- **Centred modal** — `MpDialog` covered the Import Contacts modal and the SQL Queries create
  dialog directly, including the footer and `#footerStart` hint slot.
- **Two-state tab filter** — `MpFilterTabs` covered the Custom fields / Default fields split,
  counts included.
- **Segment rule / criterion cards** — plain `v-card flat border rounded="lg"` nested inside the
  rule card. Considered `MpListRow` and rejected: a criterion is a row of four-to-five form
  controls, not a list row, and `MpListRow`'s geometry (`minHeight` 40, lead/trailing slots) is
  wrong for it.
- **The legacy segment builder** — not a component gap. It could not be crawled at all (see the
  segment PARITY open items), so nothing about it is known well enough to file.


---

## Products / Commerce slice (2026-08-29)

Missing components hit during this slice, with the stand-in used:

1. **Number stepper field** (`MpNumberStepper`?) — Rows/Columns in the feed-template editor use a
   hand-assembled −/value/+ group on `control.height`. Suggested API: `v-model:number`, `min`,
   `max`, `label`, sizes from `component.control.*`. Also wanted by quantity fields.
2. **Colour field** (`MpColorField`?) — button text/background colour uses a native
   `<input type="color">` + hex readout. Suggested API: `v-model` (hex), `label`, swatch on
   `radius.8`, mono hex text; validates 6-digit hex.
3. **Upload drop-zone** (`MpUploadZone`?) — catalog import, collection image and product media all
   need "drag and drop or browse" with type/size hints. `v-file-input` used as the stand-in; a
   dashed-border drop target with progress would close the gap (third slice in a row to want it —
   the CDP import modal hit this too).
4. **Key-value summary table** — the reservation dialog and import summary render bordered
   label/value rows by hand. `MpListRow` is close but its lead/trailing geometry fights the
   two-column label/value shape. Could be a `variant` on MpListRow or a tiny `MpKeyValue` list.
5. **Status-chip maps for commerce publish/stock states** — `MpStatusChip type="general"` guesses
   colours for Draft/Published/Partial/Active Hold. A `type="product"` map (Draft=neutral,
   Published=positive) and a `type="import"` map (Completed/Partial/Failed) would remove the
   guesswork.
6. **Custom Fields editor** (product edit page) — UAT shows a "Custom Fields — Edit to add more
   custom fields to this product" card whose editor was unreachable in the crawl; not rebuilt.
   Needs a UAT session that can open it before it can be specced.
