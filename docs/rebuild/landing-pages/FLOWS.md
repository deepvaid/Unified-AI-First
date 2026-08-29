# Landing Pages — header-action flows

> Companion to `AUDIT.md`. One entry per header action across the three audited URLs.
> Every step marked **UNVERIFIED** was deliberately not executed; the reason is given inline.
> Read-only crawl of `uat.maropost.com`, account `116000`, 2026-08-30. No records were mutated.

**Legend** — `→` a step the crawl actually performed and observed. `⊘` a step that was not
executed. Copy in `backticks` is exact.

---

## Flow map

```
/landing_pages ──NEW PAGE──► /landing_pages/template ──pick a template──► /landing_pages/create ──pick a builder──► editor
      │                              │      │                                    │
      │                              │      └──MY TEMPLATES tab──► Create New Page ─┘
      │                              └──BACK──► /landing_pages
      │                                                                          └──BACK──► /landing_pages/template
      ├──row name──► /landing_pages/{id}  (the editor)
      ├──row kebab──► Verify Domain · Preview · Duplicate · Delete
      ├──selection──► bulk Delete
      └──folder panel──► New Folder · folder ••• (Privacy · Rename · Delete)
```

---

## 1. `NEW PAGE` — the primary create flow

**Trigger:** `NEW PAGE` button, top right of `/accounts/116000/landing_pages`.
It is an `<a href="/accounts/116000/landing_pages/template">`, so it is a real navigation.

### Screens, in order

1. → **`/landing_pages`** — the list. `NEW PAGE` is present only while **no row is selected**;
   ticking any row removes it from the DOM entirely.
2. → **`/landing_pages/template` — `Select Template`.** Loads behind the
   "Preparing an optimised workspace" splash for 8–18 s, then paints the chrome (breadcrumb,
   `H2 Select Template`, `LIBRARY` / `MY TEMPLATES` tabs, the `Categories` facet column and a
   5-column grid of blank white cards). Thumbnails lazy-load over the next several seconds; the
   grid is a wall of empty cards until then.
3. ⊘ **Pick a template** — **UNVERIFIED.** Template cards are `<div class="v-card--link">` with a
   JS `click` listener and no inspectable `href`, so the destination could not be read without
   clicking. Not clicked because it may create a live landing-page record.
4. → **`/landing_pages/create` — `Select Builder`.** Reached directly by URL. Breadcrumb becomes
   `My Landing Pages > Select Template > Select Builder`. `H4 Create New Landing Page` and
   `Select builder type for your new landing page.` paint immediately; **the two builder tiles
   take a further ~10 s (≈24 s total) to appear.**
5. ⊘ **Pick a builder** — **UNVERIFIED.** `div.editor-img` with a JS click handler; not clicked
   because it presumably opens an editor session and may create a record.
6. ⊘ **The editor** — out of scope (`/landing_pages/{id}`) and would risk an autosave.

### Decision points

| # | Decision | Options | Default | Reversible? |
|---|---|---|---|---|
| 1 | Which tab | `LIBRARY` · `MY TEMPLATES` | `LIBRARY` | yes, but not via browser back — the tab is never written to the URL |
| 2 | Narrow the library | `USAGE` (5) · `INDUSTRY` (12) · `SEASONAL` (⊘ not expanded) | none selected | yes — `Clear All` |
| 3 | Starting point | a stock template · a saved template · `Blank Template` / `START FROM SCRATCH` | none | yes, until step 3 is committed |
| 4 | Builder | `WYSIWYG` · `Drag & Drop` | none | ⊘ unknown — nothing on the page says whether this can be changed later |

Decision 4 is presented with **zero explanatory copy**: two 256×234 illustrations with the labels
baked into the PNGs, no descriptions, no recommendation, and no mention of the
`Drag & Drop (Legacy)` editor that a third of the existing pages use.

### Validation

None anywhere in this flow. There are no form fields on `/template` or `/create`; picking a tile
is itself the commit, with no `Continue` button and no confirmation.

### Success path

⊘ **UNVERIFIED past step 3.** Inferred from the breadcrumb chain and the list page's `Editor Type`
column: template → builder → editor → the new page appears in the list with the chosen
`Editor Type` and `Domain Status: Unverified`.

### Failure path

⊘ **UNVERIFIED.** No error state was reachable. Notably, reaching `/create` directly by URL with
no template chosen is **not** guarded — the builder picker renders normally, so a builder can be
selected with no template context, and what happens then is unknown.

### Where the user lands / how they get back

- → `BACK` on `/create` → `/landing_pages/template`, **LIBRARY tab, all facet filters reset**,
  thumbnails blank again while they re-lazy-load. Verified.
- → `BACK` on `/template` → `/landing_pages`. Verified.
- → Breadcrumb `My Landing Pages` (`/accounts/116000/landing_pages`) and `Select Template`
  (`/accounts/116000/landing_pages/template`) are real links on every step. Verified.
- Browser back works between the three URLs but does **not** undo a tab switch, a facet filter or
  a folder selection, because none of them are in the URL.
- On `/template` the `BACK` button sits **below the whole template grid** — on the `LIBRARY` tab
  that is thousands of pixels down the page, so in practice only the breadcrumb is reachable.

---

## 2. `START DESIGNING` — blank landing page (LIBRARY tab)

**Trigger:** `START DESIGNING` button on the `Blank Template` card, first tile of the `LIBRARY`
grid. `<button>`, black `rgb(33,33,33)`, `v-size--small`, pencil icon, JS `click` handler, no href.

1. → `/landing_pages/template`, `LIBRARY` tab. Card copy: `Blank Template` (H3) /
   `Start from scratch` / `START DESIGNING`. The card's thumbnail slot renders a **broken-image
   placeholder glyph** rather than an empty-canvas illustration.
2. ⊘ Click — **UNVERIFIED**, may create a record.
3. ⊘ Presumed `/landing_pages/create` (`Select Builder`), then the editor.

- **Decision points:** builder type, as in flow 1.
- **Validation:** none.
- **Failure path:** ⊘ unverified.
- **Back:** breadcrumb, or the `BACK` button below the grid → `/landing_pages`.

---

## 3. `START FROM SCRATCH` — blank landing page (MY TEMPLATES tab)

**Trigger:** `START FROM SCRATCH`, a black contained button that appears in the **page header**,
top right, **only while the `MY TEMPLATES` tab is active**. `<button>` with a JS click handler.

This is the same action as flow 2 with a different label, a different size, and a different
location. Two names for one job.

1. → `/landing_pages/template` → click `MY TEMPLATES`.
   **Observed defect:** for several seconds after the tab switch the `LIBRARY` grid is still
   painted over the new pane (all 18 cards remain in the DOM at `0×0` with their images
   rendering) and the tab window is clamped to `179px`, clipping everything mid-content. The pane
   settles into a normal full-width table only after the transition completes.
2. ⊘ Click `START FROM SCRATCH` — **UNVERIFIED**, may create a record.

- **Decision points / validation / failure path:** as flow 2, all ⊘.
- **Back:** `BACK` button (immediately below the short table on this tab, so here it *is*
  reachable) → `/landing_pages`.

---

## 4. `Create New Page` — start from a saved template (MY TEMPLATES row kebab)

**Trigger:** the `⋮` kebab in the `Actions` column of the `MY TEMPLATES` table.

1. → `/landing_pages/template` → `MY TEMPLATES` tab. One row: `Rails-8-DnD`,
   `Updated At Aug 21, 2025 at 02:58 AM`, `Created At Jul 07, 2025 at 04:52 AM`.
2. → Open the kebab. The menu has exactly **one** item: `Create New Page` (icon `mdi-pencil`).
   It carries `tabindex="-1"` and **no `role="menuitem"`**, so it is keyboard-unreachable — the
   row's only action cannot be invoked without a mouse.
3. ⊘ Click `Create New Page` — **UNVERIFIED**, creates a live record.

- **Decision points:** none beyond which saved template.
- **Validation:** none.
- **Notable gap:** there is no `Rename`, `Duplicate`, `Delete` or `Preview` for a saved template.
  A merchant cannot manage their own template library from here at all.
- **Back:** `BACK` → `/landing_pages`.

---

## 5. Row name link — open an existing landing page

**Trigger:** the page name in the `Name` column, an `<a href="/accounts/116000/landing_pages/{id}">`.

1. → `/landing_pages`, hover a row: the background greys and a 6-dot drag grip plus a checkbox
   fade in from `opacity: 0` at the left.
2. ⊘ Click the name — **UNVERIFIED.** Not followed: `/landing_pages/{id}` is the editor and
   opening it risks an autosave on a live record.

- **This is the only route to editing.** The row kebab has no `Edit` item.
- **Back:** ⊘ unverified; presumed the editor's own back/close.

---

## 6. Row kebab — `Verify Domain`

**Trigger:** row `⋮` → first item, icon `mdi-refresh`.

1. → Open the kebab on a row where `Domain Status = Verified` → the item is **disabled**
   (`rgba(0,0,0,0.38)`, `tabindex="-1"`), with no tooltip explaining why.
2. → Open the kebab on a row where `Domain Status = Unverified` (`landing page test`) → the item
   is **enabled**.
3. ⊘ Click — **UNVERIFIED.** It triggers a real DNS verification against the account's sending
   domain, which is a side-effectful operation.

- **Decision points:** none.
- **Validation / success / failure:** ⊘ all unverified. Nothing on the list page explains what
  "Domain Status" means, what verification does, or what a merchant should do about an
  `Unverified` page — and every `Drag & Drop (Legacy)` page in the account is `Unverified`.
- **Back:** the menu closes; the user stays on the list.

---

## 7. Row kebab — `Preview Landing Page`

**Trigger:** row `⋮` → second item, icon `mdi-eye`. The only item that is an `<a>` with
`role="menuitem"` and `tabindex="0"`.

1. → Open the kebab and read the anchor. **Its `href` is `/accounts/116000/landing_pages/70` —
   byte-identical to the row's Name link, i.e. the editor, not a preview.** No `target="_blank"`,
   no `rel`.
2. ⊘ Click — **UNVERIFIED.** Not clicked, because if a JS handler does *not* intercept the anchor
   this navigates straight into the editor on a live record.

- **Likely defect** (recorded as D1 in `AUDIT.md`): either the href is wrong, or the item is
  mislabelled and should say `Edit`.
- **Back:** ⊘ unverified.

---

## 8. Row kebab — `Duplicate Landing Page`

**Trigger:** row `⋮` → third item, icon `mdi-file-multiple`. A plain `<div>` with `tabindex="-1"`
and no role — **keyboard-unreachable**.

1. → Menu opens and the item is enabled on every row observed.
2. ⊘ Click — **UNVERIFIED.** Creates a live duplicate record.

- **Decision points:** ⊘ unknown whether a name/folder prompt follows or the copy is created
  silently. The list contains rows named `test-dnd-dupl` and `test-dnd-dupl copy`, which suggests
  a silent copy with a ` copy` suffix, but this was not confirmed.
- **Validation / success / failure:** ⊘ all unverified.

---

## 9. Row kebab — `Delete Landing Page Permanently`

**Trigger:** row `⋮` → fourth item, icon `mdi-delete`. A plain `<div>`, `tabindex="-1"`, no role,
and rendered in the **same `rgba(0,0,0,0.87)` as every other item** — no red, no divider, no
danger styling despite the word "Permanently" in the label.

1. → Menu opens; the item is enabled.
2. ⊘ Click — **UNVERIFIED.** Irreversible destruction of a live record.

- **Decision points:** ⊘ unknown whether a confirmation dialog follows. Given the copy says
  "Permanently", a `MpConfirmDialog` with `danger` and `consequences` is mandatory in the rebuild
  regardless of what the legacy app does.
- **Validation / success / failure:** ⊘ all unverified.

---

## 10. Selection → bulk delete

**Trigger:** tick a row checkbox (visible only on hover).

1. → Tick one row. Observed, in the same instant:
   - the row highlights and its checkbox stays visible;
   - the header select-all checkbox goes **indeterminate**;
   - the `NEW PAGE` link is **removed from the DOM**;
   - in its place appear a `🗑` icon button (`mdi-delete`, **no accessible name**, and carrying a
     `theme--dark` class on a white header) and `✕ 1 selected` rendered as an underlined blue
     text button.
2. → Click `✕`. Selection clears and `NEW PAGE` returns. Verified.
3. ⊘ Click `🗑` — **UNVERIFIED.** Bulk-destroys live records.

- **Decision points:** which rows. There is a select-all in the header
  (`id="landing-pages-select-all"`); whether it selects the page or the whole result set was not
  tested.
- **Validation / confirmation:** ⊘ unverified.
- **Only one bulk action exists.** No bulk move-to-folder, duplicate, or expire — even though
  foldering is a first-class concept on this page.
- **Back:** `✕` clears the selection. There is no undo after a delete (⊘ unverified).

---

## 11. Folder panel toggle

**Trigger:** an **unnamed** icon button immediately left of the `Landing Pages` title.

1. → Click. The folder panel slides in on the left **and the global 248px sidebar collapses to a
   52px icon rail**. A grey blob with no icon appears in the collapsed rail at roughly `y = 396`
   (rendering glitch).
2. → Panel contents, top to bottom: `Always Open` toggle (off), `+ New Folder` outlined button,
   then the tree — `My Landing Pages` (root, expanded, active), `Harpreet_QA Landing pages`,
   `Manny`. No item counts.
3. → Click a folder (`Manny`). Verified:
   - table filters to that folder's pages (`1-2 of 2`);
   - `H2` becomes `Landing Pages - Manny`;
   - breadcrumb becomes `My Landing Pages > Manny` with the root as a link;
   - **the URL stays `/accounts/116000/landing_pages`** — the folder view cannot be bookmarked,
     shared, or restored, and browser back does not leave it.
4. → Click the panel's `✕` to close.

- ⊘ `Always Open` toggle — **UNVERIFIED.** Not toggled; it appears to persist a user preference.
- ⊘ Drag-to-reorder via the 6-dot grip — **UNVERIFIED.** A drop would persist an order change.

---

## 12. `+ New Folder`

**Trigger:** `+ New Folder` in the folder panel. **Not a dialog** — the button is replaced
in place by an inline form.

1. → Click. The button is replaced by:
   - a text field, floating label `New Folder Name`, persistent hint `36 characters maximum`,
     no `maxlength` attribute, no required marker, empty default;
   - `CREATE` (contained, slate `rgb(76,84,99)`, carrying a leftover `custom-login` class);
   - `Close` (outlined).
2. → **Validation, verified.** Typing 41 characters turns the label and the 2px border red and
   **replaces** the hint with `You've exceeded maximum character count`. The rule the user needs
   (`36`) disappears exactly when they need it, there is no live counter, and **`CREATE` stays
   enabled** (`disabled: false`).
3. ⊘ Click `CREATE` — **UNVERIFIED.** Creates a live folder.
4. → Click `Close`. The form collapses back to the `+ New Folder` button, the typed value is
   discarded, and **no unsaved-changes confirmation is shown**. Verified.

- **Decision points:** folder name only. No parent-folder picker, no privacy setting at creation
  time (even though `Privacy` exists on the folder menu afterwards).
- **Success path:** ⊘ unverified.
- **Failure path:** ⊘ unverified — duplicate-name and empty-name behaviour were not tested; the
  empty field was never submitted.
- ⊘ The exact 36/37-character boundary was not bisected; only 41 characters was tested.

---

## 13. Folder `•••` menu

**Trigger:** hover a folder row in the panel → a `•••` (horizontal dots) button appears at its
right edge. Note this is a *different* glyph from the row kebab's vertical dots, while the list's
drag grip is built from *two* vertical-dot icons — three dot patterns, three meanings.

1. → Click `•••` on `Manny`. The menu contains exactly three items:

| Item | Icon | State on the folder tested |
|---|---|---|
| `Privacy` | `mdi-account` | **disabled**, `rgba(0,0,0,0.38)`, `tabindex="-1"`, no role |
| `Rename` | `mdi-folder-edit` | enabled, `role="menuitem"`, `tabindex="0"` |
| `Delete` | `mdi-delete` | **disabled**, `rgba(0,0,0,0.38)`, `tabindex="-1"`, no role |

2. ⊘ `Rename` — **UNVERIFIED.** Not opened; it mutates a live folder.
3. ⊘ `Privacy` and `Delete` — **UNVERIFIED.** Both were disabled on the folder tested, and no
   tooltip, helper text or `aria-disabled` description explains why. `Delete` is plausibly
   disabled because the folder is non-empty, but nothing in the UI says so.

- **Validation / success / failure:** ⊘ all unverified.
- **Back:** the menu closes; the user stays where they were. While open, the menu renders over
  the table with a visible render artifact at the panel's right edge.

---

## 14. `Editor Type` filter (unlabelled `All` select)

**Trigger:** the select in the page header showing `All`. It has **no `label`, no `placeholder`
and no `aria-label`**, so nothing identifies what it filters.

1. → Open. Options: `All` (`all`) · `WYSIWYG` (`0`) · `Drag & Drop (Legacy)` (`1`) ·
   `Drag & Drop` (`5`).
2. → Select `Drag & Drop (Legacy)`. The table refilters (`1-10 of 13`). **Two defects fire at
   once, both verified:** the menu does **not close** on selection, and Vuetify 2 positions the
   selected item over the activator, so the `All` option sits exactly on top of the field's own
   text (measured: item centre `y = 120`, the field's own `y`). The field reads `Allrag & Drop
   (Legacy)`, and `All` is no longer visible in the list — **so clearing the filter back to `All`
   is effectively hidden**.
3. → Empty state, verified. Filtering the `Harpreet_QA Landing pages` folder (1 page, Legacy) to
   `WYSIWYG` gives 0 results. Exact copy: **`No data available`** — a bare Vuetify default,
   centred in a table row, low-contrast grey, no icon, no explanation, no CTA. The footer range
   label degrades to a bare en-dash `–` instead of `0-0 of 0`.
4. → Reset by reloading the page (the filter does not survive a reload).

- **Decision points:** one, single-select.
- **Validation:** n/a.
- **Failure path:** none observed.
- **Back:** no clear affordance other than reselecting `All`, which the overlap defect hides.

---

## 15. Sorting and pagination

**Trigger:** click a sortable column header, or the footer controls.

1. → Click `Name`. Verified: the table re-sorts ascending
   (`28feb_new_page`, `avtest`, `bb`, …) and an `↑` glyph appears beside the header.
   **`aria-sort` stays `"none"` on every header**, so the sort state is never announced.
2. → Sortable headers are `Name`, `Publish At`, `Expire At`, `Updated At`.
   `Editor Type`, `Domain Status` and `Actions` are not sortable.
3. → Footer: `Rows per page:` (`5 · 10 · 25 · 50 · 100`, default `10`), the range label
   `1-10 of 37`, and `Previous page` / `Next page` icon buttons — both correctly `aria-label`led,
   prev `disabled` on page 1. The `Next page` button's right edge is exactly the table card's
   right edge (both `1658`), so it reads as clipped.
4. ⊘ Descending sort, multi-column sort, and paging to page 2 were not exercised — they are safe,
   but nothing new would be learned beyond the range label format already captured.

- **The list has no search field at all.** With 37 pages in the root folder and only an
  editor-type filter, finding a page by name means paging or raising rows-per-page to 100.

---

## Unverified — consolidated

Everything below was deliberately left unexecuted, with the reason:

| Action | Where | Reason not executed |
|---|---|---|
| Click a template card | `/template` LIBRARY | may create a live record; JS handler, no readable href |
| `START DESIGNING` | `/template` LIBRARY | same |
| `START FROM SCRATCH` | `/template` MY TEMPLATES | same |
| `Create New Page` | MY TEMPLATES row kebab | creates a live record |
| Click a builder tile | `/create` | opens an editor session; may create a record |
| Row name link | list | opens the editor on a live record; autosave risk |
| `Preview Landing Page` | row kebab | its `href` is the editor, so clicking may edit a live record |
| `Duplicate Landing Page` | row kebab | creates a live record |
| `Delete Landing Page Permanently` | row kebab | irreversible destruction |
| `Verify Domain` | row kebab | triggers real DNS verification |
| Bulk `🗑` | selection bar | irreversible destruction |
| `CREATE` | New Folder inline form | creates a live folder |
| `Rename` | folder `•••` | mutates a live folder |
| `Privacy` / `Delete` | folder `•••` | disabled on the folder tested; enabled behaviour unknown |
| `Always Open` toggle | folder panel | appears to persist a user preference |
| Drag-to-reorder (6-dot grip) | list rows | a drop would persist an order change |
| `SEASONAL` accordion contents | `/template` | the exclusive accordion kept closing it; stopped rather than keep clicking |
| Select-all checkbox scope | list header | page vs whole result set not determined |
| MY TEMPLATES sorting / selection | `/template` | not exercised |
| Empty-folder empty state | list | no genuinely empty folder exists in this account |
| Template-library zero-result state | `/template` | no facet combination tried returned zero |
| Table error state | all three | never observed |
| 36 vs 37 character boundary | New Folder form | only 41 characters was tested |
