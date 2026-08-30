# Landing Pages — UI audit (live UAT crawl)

> Read-only crawl of `uat.maropost.com`, account `116000`, 2026-08-30.
> Legacy Vuetify 2 app mounted inside the Vuetify 3 shell. No records were mutated.
> Scope: `/landing_pages`, `/landing_pages/template`, `/landing_pages/create`.

---

## 1. `/accounts/116000/landing_pages` — Landing Pages list

### Page purpose & primary user task

The index of every landing page in the account, organised into a folder tree. The merchant's
primary task is **find an existing landing page and open it in its editor**; the secondary task
is **start a new page** (`NEW PAGE`). Everything else on the page — verify domain, preview,
duplicate, delete, foldering — is maintenance.

Reached from the global left nav: `Marketing › Acquisition › Landing Pages`.

### Layout structure and hierarchy

```
AppBar (global; account switcher "Regular UID Cloud…", Da Vinci spark, Settings, Help, notifications 99+, user menu)
└── Global left sidebar (248px; auto-collapses to a 52px icon rail when the folder panel opens)
└── Folder panel (optional left panel, ~236px, toggled by an unnamed folder icon button)
      ├── "Always Open" toggle switch (off by default)
      ├── "+ New Folder" outlined button  → becomes an INLINE form in place
      └── Folder tree:  My Landing Pages (root, expanded)
                          ├── Harpreet_QA Landing pages
                          └── Manny
└── Content column
      ├── Breadcrumb            "My Landing Pages"   (in a folder: "My Landing Pages > Manny")
      ├── H2 title              "Landing Pages"      (in a folder: "Landing Pages - Manny")
      ├── Header right          [Editor Type select "All"]  [NEW PAGE]
      ├── v-data-table (card, elevation-1)
      └── v-data-footer         Rows per page · range · prev/next
```

There is **no H1 on the page**; the title renders as `H2`.

### Components used → design-system mapping

| Live UI | Design-system component |
|---|---|
| Breadcrumb + `Landing Pages` title + right-hand actions | `MpPageHeader` (`title`, `backTo` for the folder case, `#actions`) |
| `All` editor-type select | `MpDataTableToolbar` `quickFilter` (`{ key:'editorType', label:'Editor type', multiple:false }`) |
| `NEW PAGE` button | `MpPageHeader` `#actions` → `v-btn color="primary"` |
| The table itself | `v-data-table` inside a `v-card flat border rounded="lg"` |
| `Verified` / `Unverified` pill | `MpStatusChip` — needs a new `type="domain"` map (Verified → success, Unverified → warning) |
| Row kebab (`⋮`) + its 4 items | `MpRowActionsMenu` + `MpMenuItem` (delete → `danger`, last, behind a divider) |
| `No data available` row | `MpEmptyState` (currently a bare Vuetify default — see defects) |
| Selection bar (`🗑  ✕ 1 selected`) | `MpFloatingBulkBar` (`count`, `total`, `#default` actions, `clear`) |
| Folder panel tree + Always Open + New Folder | `MpSectionRail` (tree) or `MpFolderSelect` + `MpManageFoldersDrawer` |
| Inline "New Folder Name" form | `MpFormDrawer` or `MpDialog` + `MpFormGrid` + a labelled `v-text-field` |
| Folder `•••` menu (Privacy / Rename / Delete) | `MpRowActionsMenu` + `MpMenuItem` |
| Table loading | `MpTableSkeleton` (none exists today — see defects) |

### All data fields, labels and copy

**Table columns** (left → right):

| # | Header | Sortable | Cell type | Notes |
|---|---|---|---|---|
| 0 | *(no header text)* | header holds the select-all checkbox (`id="landing-pages-select-all"`) | drag grip (6-dot) + row checkbox | both are `opacity: 0` until row hover |
| 1 | `Name` | **yes** (`.sortable`) | link → `/accounts/116000/landing_pages/{id}` | truncates with `.text-ellipsis`; has a `v-tooltip` for the full name |
| 2 | `Editor Type` | no | plain text | `Drag & Drop` · `WYSIWYG` · `Drag & Drop (Legacy)` — the Legacy value wraps to two lines and grows the row |
| 3 | `Domain Status` | no | outlined `v-chip` | `Verified` (green) · `Unverified` (amber) |
| 4 | `Publish At` | **yes** | date text | format `MMM DD, YYYY at hh:mm A` — e.g. `Mar 26, 2026 at 02:30 PM` |
| 5 | `Expire At` | **yes** | date text | same format |
| 6 | `Updated At` | **yes** | date text | same format |
| 7 | `Actions` | no | kebab `⋮` icon button | opens the row menu |

Only `Name`, `Publish At`, `Expire At`, `Updated At` carry `.sortable`. Sorting works (clicking
`Name` re-sorted to `28feb_new_page, avtest, bb …`) and renders an `↑` glyph beside the header,
but `aria-sort` stays `"none"` on every header in every state.

**Row kebab menu** — exact items, in order:

1. `Verify Domain` — icon `mdi-refresh`. **Disabled** when `Domain Status = Verified`; enabled when `Unverified`.
2. `Preview Landing Page` — icon `mdi-eye`. The only item that is an `<a>` with `role="menuitem"`.
3. `Duplicate Landing Page` — icon `mdi-file-multiple`.
4. `Delete Landing Page Permanently` — icon `mdi-delete`. Rendered in the **same black** as the other items, no divider, no danger colour.

There is **no `Edit` item** — editing is only reachable by clicking the row's Name link.

**Editor Type filter** (the unlabelled `All` select, top right):

| Label | Underlying value |
|---|---|
| `All` | `all` |
| `WYSIWYG` | `0` |
| `Drag & Drop (Legacy)` | `1` |
| `Drag & Drop` | `5` |

**Pagination footer:** `Rows per page:` · select (`5 · 10 · 25 · 50 · 100`, default `10`) ·
range label `1-10 of 37` · `Previous page` / `Next page` icon buttons (both correctly
`aria-label`led; prev is `disabled` on page 1).

**Empty state** (reached by filtering a folder to an editor type it has none of):
exact copy `No data available`, centred, low-contrast grey, inside a table row. No icon, no
explanation, no CTA. The range label degrades to a bare en-dash `–`.

**Folder panel copy:** `Always Open` (toggle) · `New Folder` (button) · `My Landing Pages` ·
`Harpreet_QA Landing pages` · `Manny`. No item counts anywhere.

**Folder `•••` menu:** `Privacy` (disabled) · `Rename` (enabled) · `Delete` (disabled).
No tooltip or copy explains why two of the three are disabled.

**Inline "New Folder" form** (replaces the `+ New Folder` button in place):

| Field | Type | Label | Helper | Required marker | Default |
|---|---|---|---|---|---|
| Folder name | `text` | `New Folder Name` (floating label) | `36 characters maximum` (persistent hint) | none | empty |

Buttons, in order: `CREATE` (contained, `rgb(76,84,99)` slate) then `Close` (outlined).
Validation observed by typing 41 characters: label + border turn red and the hint is **replaced**
by `You've exceeded maximum character count`. `CREATE` stays enabled in the error state.

### All interactions and behaviours

- **Row hover** — background greys, and the drag grip + checkbox fade in from `opacity: 0`.
- **Row click (Name)** — navigates to `/accounts/116000/landing_pages/{id}` (the editor).
- **Row selection** — clicking the checkbox highlights the row, the header select-all goes
  indeterminate, and the header-right control set **swaps**: the `NEW PAGE` link is removed from
  the DOM entirely and is replaced by `🗑` (a `mdi-delete` icon button, no accessible name) and
  `✕ 1 selected` (an underlined blue text button). `✕` clears the selection and `NEW PAGE`
  returns. Delete is the **only** bulk action.
- **Kebab** — opens a `role="menu"` panel anchored under the trigger, overlapping the rows below.
- **Editor Type filter** — client/server filter; re-queries and resets the range label.
- **Folder click** — filters the table, swaps the title to `Landing Pages - {folder}` and pushes
  a breadcrumb crumb, **without changing the URL** (stays `/landing_pages`).
- **Folder panel open** — collapses the global 248px sidebar to a 52px icon rail.
- **Drag grip** — a 6-dot grip appears per row on hover, implying drag-to-reorder. Not exercised
  (see Unverified).
- **Loading** — the whole app is gated behind a "Preparing an optimised workspace" splash for
  8–18 s. Inside the table there is no skeleton and no spinner; rows simply appear.

### Accessibility issues observed

1. **No `H1`.** The page title is an `H2`; the document has no level-1 heading. Heading order
   starts at 2 and there are no other headings at all.
2. **Duplicate, unlabelled landmarks.** The DOM contains two `<main>`, two `<header>` and two
   `<nav>` elements (the V2 app nested inside the V3 shell), none with `aria-label`.
3. **Leaked i18n key as an accessible name.** The rows-per-page select carries
   `aria-label="$vuetify.dataTable.itemsPerPageText"`. A screen reader announces that literal
   string. Confirmed twice, on the list and inside a folder.
4. **Broken menu semantics.** In the row kebab only `Preview Landing Page` has
   `role="menuitem"` and `tabindex="0"`. `Verify Domain`, `Duplicate Landing Page` and
   `Delete Landing Page Permanently` are plain `<div>`s with `tabindex="-1"` and no role — so a
   keyboard user **cannot reach Duplicate or Delete at all**, and a screen reader is told the
   menu has one item. The folder `•••` menu has the same shape (only `Rename` is a menuitem).
5. **Unlabelled controls everywhere.** The folder-panel toggle, the row kebabs, the bulk-delete
   trash, the folder `•••` triggers and the `Editor Type` select all have no accessible name —
   the select has no `label`, no `placeholder` and no `aria-label`, so it announces only its
   current value (`All`).
6. **Row checkboxes have no accessible name** (`aria-label` is `null`), so a screen reader
   cannot tell which row a checkbox selects.
7. **Hover-only affordances.** The row checkbox and drag grip are `opacity: 0` until hover.
   They are invisible to keyboard and touch users, and there is no `:focus-visible` equivalent.
8. **Sort state is never exposed.** `aria-sort` remains `"none"` after sorting; only a visual
   `↑` glyph changes.
9. **Table has no `<caption>`, no `aria-label` and no `role`.**
10. **Destructive action has no distinguishing affordance.**
    `Delete Landing Page Permanently` renders in `rgba(0,0,0,0.87)`, identical to `Duplicate`,
    with no divider, no red, and no `aria-describedby` warning.
11. **`No data available` contrast.** The empty message is rendered in Vuetify's default
    disabled grey on white — below 4.5:1.
12. **Disabled items give no reason.** `Verify Domain`, folder `Privacy` and folder `Delete`
    are rendered at `rgba(0,0,0,0.38)` with no tooltip and no `aria-disabled` explanation.

### UX friction points worth fixing

1. **No search.** 37 pages in the root folder and the only filter is editor type. There is no
   name search anywhere on the page — finding a page means paging through 4 pages of 10 or
   switching rows-per-page to 100 and using the browser's own find. This is the single biggest
   gap; `MpDataTableToolbar`'s search should be mandatory here.
2. **Selecting a row hides the primary CTA.** `NEW PAGE` is unmounted the moment one row is
   ticked. The user loses the page's main action to reveal a single bulk action.
3. **Delete is the only bulk action.** No bulk move-to-folder, no bulk duplicate, no bulk
   expire — even though foldering is a first-class concept on this page.
4. **Folders are not addressable.** Opening `Manny` never changes the URL, so a folder view
   cannot be bookmarked, shared, or restored after a refresh; the back button does not undo it.
5. **The filter is unlabelled.** A bare `All` in the header gives no clue that it filters by
   editor type until it is opened.
6. **The filter menu covers its own field.** Vuetify 2's "auto" menu positions the selected item
   over the activator, so after picking `Drag & Drop (Legacy)` the field reads `Allrag & Drop
   (Legacy)` and the `All` option is no longer visible in the list — clearing the filter back to
   `All` is effectively hidden.
7. **Two different meanings for the same glyph.** The drag grip is built from two
   `mdi-dots-vertical` icons sitting side by side, immediately beside a column whose action
   trigger is a single `mdi-dots-vertical`. The same dots mean "reorder" on the left and
   "actions" on the right.
8. **No `Edit` in the row menu.** The most common action is only available by clicking the name,
   while four rarer actions get a menu.
9. **`Preview` does not preview** (see defects) — it points at the editor.
10. **Editor Type is shown but never explained.** `Drag & Drop (Legacy)` rows are all
    `Unverified` and years old; nothing tells the merchant the legacy editor is deprecated or
    offers a migration path.
11. **Row height jitter.** `Drag & Drop (Legacy)` wraps onto two lines, so rows in a mixed list
    are 70 px and 88 px alternately.
12. **Disabled actions with no reason.** `Verify Domain` greys out on verified rows (fine) but
    folder `Privacy` and `Delete` grey out with no explanation at all.
13. **Inconsistent CTA styling.** `NEW PAGE` is black and all-caps; `CREATE` in the folder form
    is slate `rgb(76,84,99)`; `Close` beside it is title-case outlined. Three button languages on
    one screen.
14. **Error copy replaces the rule.** Typing 41 characters swaps `36 characters maximum` for
    `You've exceeded maximum character count`, removing the number the user needs, and there is
    no live counter.
15. **`CREATE` stays enabled while the field is invalid.**
16. **No loading skeleton.** Behind an 8–18 s splash the table has no intermediate state.
17. **Pagination sits flush against the table's right edge** — the `Next page` chevron's right
    edge is exactly the card's right edge (both `1658`), so it reads as clipped.

### Source defects

| # | Defect | Evidence |
|---|---|---|
| D1 | **`Preview Landing Page` links to the editor, not a preview.** The menu anchor's `href` is `/accounts/116000/landing_pages/70` — byte-identical to the row's Name link. | read from the live anchor for row `yg LP test` |
| D2 | **Leaked i18n key in the DOM.** `aria-label="$vuetify.dataTable.itemsPerPageText"` on the rows-per-page input; the `find` tool surfaces the control as button `"$vuetify.dataTable.itemsPerPageText"`. | present on every landing-pages table |
| D3 | **The editor-type menu renders on top of its own field.** After selecting a value the open menu's active `All` item sits at the activator's exact centre (`cy = 120`, the field's own y), so the field reads `AllSIWYG` / `Allrag & Drop (Legacy)`. The menu also does not close on selection. | screenshotted twice |
| D4 | **Empty range label is a bare en-dash.** With 0 results the footer shows `Rows per page: 10   –` instead of `0-0 of 0`. | filtered folder view |
| D5 | **Empty state is an unstyled Vuetify default.** `No data available` with no icon, copy or CTA — the only "empty" surface in the whole flow. | filtered folder view |
| D6 | **Keyboard-unreachable menu items.** `tabindex` on the four kebab items is `-1, 0, -1, -1`; three of four have no `role`. Duplicate and Delete cannot be invoked from the keyboard. | DOM read |
| D7 | **Leftover `custom-login` class on the folder `CREATE` button** (`class="text-capitalize custom-login v-btn …"`), which is also why it is slate rather than brand primary. | DOM read |
| D8 | **No `maxlength` on the folder-name input.** The stated 36-character limit is advisory; the field accepted 41 characters and only then errored. | typed 41 chars |
| D9 | **`CREATE` remains enabled while the folder-name field is in an error state** (`disabled: false`). | DOM read |
| D10 | **Bulk-delete icon carries `theme--dark`** (`class="v-icon … mdi-delete theme--dark"`) while sitting on the white page header — a theme-token mismatch of exactly the kind the colour-pairing rule forbids. | DOM read |
| D11 | **Folder selection is not reflected in the URL**, so folder views cannot be linked, bookmarked or restored. | `/landing_pages` unchanged inside `Manny` |
| D12 | **Row checkbox and drag grip are `opacity: 0`** rather than hidden — they remain in the tab order and the accessibility tree while being invisible. | computed style read |
| D13 | **Icon-rail rendering glitch.** With the folder panel open, the collapsed 52px global rail shows a grey blob with no icon at roughly `y = 396`. | screenshot |
| D14 | **Stray render artifact beside the folder panel.** A small garbled grey element appears at the folder panel's right edge (~`x = 300–335`) over the table in several states. | screenshots (Manny + Harpreet folder views) |

No JavaScript console errors were captured, but console tracking only began after the page had
loaded, so page-load errors were not observed.

### Unverified

- **Bulk delete** — never clicked. Destructive and irreversible.
- **`Delete Landing Page Permanently`** in the row kebab — never clicked, same reason.
- **`Duplicate Landing Page`** — never clicked; it creates a live record.
- **`Verify Domain`** — never clicked; it triggers a real DNS verification against the account.
- **`Rename` / `Privacy`** on a folder — never opened; `Rename` mutates a live folder and
  `Privacy` was disabled on the folder tested.
- **Folder `Delete`** — disabled on the tested folder; the enabled behaviour is unknown.
- **`CREATE` on the New Folder form** — never clicked; it would create a live folder. The form
  was closed with `Close`, which discarded cleanly with no confirm prompt.
- **Drag-to-reorder** — the 6-dot grip was never dragged; a drop would persist an order change.
- **`Always Open` toggle** — never toggled; it looks like a persisted user preference.
- **Whether `Preview Landing Page` is intercepted by a JS click handler** that opens a real
  preview despite the editor `href` (D1). Only the `href` was read; the item was not clicked.
- **Empty-folder empty state** — no genuinely empty folder exists in this account; the empty
  state was reached via a filter instead, so a "this folder has no pages" variant (if any) was
  not seen.
- **Row-checkbox keyboard reachability** — not tested with a real tab sweep.
- **Error state of the table** (failed load) — never observed.
- **`36 characters maximum` boundary** — 36 vs 37 characters was not bisected; only 41 was tested.

---

## 2. `/accounts/116000/landing_pages/template` — Select Template

### Page purpose & primary user task

Step 1 of "create a landing page": **pick a starting point**. Either a stock template from the
`LIBRARY`, a previously saved template from `MY TEMPLATES`, or `Blank Template` / `START FROM
SCRATCH`. Reached from the list page's `NEW PAGE` button.

### Layout structure and hierarchy

```
Breadcrumb   "My Landing Pages > Select Template"   (first crumb is a link back to the list)
H2           "Select Template"
             [header right: START FROM SCRATCH  — only on the MY TEMPLATES tab]
Tabs         LIBRARY (default) | MY TEMPLATES        role="tab", href="#library" / "#mytemplate"

── LIBRARY tab ────────────────────────────────────────────────
  Left column (~325px)                Right column (5-up masonry grid)
    H3 "Categories"   "Clear All"       card 1: Blank Template / Start from scratch / START DESIGNING
    H5 accordion USAGE                  cards 2–18: full-bleed template screenshots, no labels
    H5 accordion INDUSTRY
    H5 accordion SEASONAL

── MY TEMPLATES tab ───────────────────────────────────────────
  v-data-table: (blank) | Name | Updated At | Created At | Actions
  footer: Rows per page 10 · 1-1 of 1 · prev/next

BACK   (outlined button, bottom-left, below the content)
```

The global left sidebar is already collapsed to the 52px icon rail on this route.

### Components used → design-system mapping

| Live UI | Design-system component |
|---|---|
| Breadcrumb + `Select Template` + `START FROM SCRATCH` | `MpPageHeader` (`backTo="/landing_pages"`, `#actions`) |
| `LIBRARY` / `MY TEMPLATES` | `MpFilterTabs` (`tabs`, `v-model`) |
| `Categories` + `Clear All` + three accordions | `MpDataTableToolbar` `#filter-content`, or `MpSectionRail` for a persistent facet column |
| Each accordion's checkbox group | `MpFormField` wrapping a checkbox group (composite control, needs the label + aria wiring) |
| Template card | `MpOptionCard` (`selected`, `title`, `description`, `#media`) — this is exactly the keyboard-operable selectable card the system already has |
| `Blank Template` card | `MpOptionCard` with `emphasis="prominent"` or `MpEmptyState variant="launcher"` |
| `MY TEMPLATES` table | `v-data-table` + `MpDataTableToolbar` |
| Its row kebab (`Create New Page`) | `MpRowActionsMenu` + `MpMenuItem` |
| `BACK` | `MpPageHeader` `backTo` (the link belongs in the header, not as a stray button below the fold) |

### All data fields, labels and copy

**Tabs:** `LIBRARY` · `MY TEMPLATES`. Rendered uppercase by CSS; DOM text is title case.

**Left facet column:** heading `Categories`, action `Clear All`.

| Accordion | Options (as rendered) |
|---|---|
| `USAGE` | `Newsletter` · `Events` · `Product-Promotion` · `Service-Promotion` · `Dark-Mode-Optimized` |
| `INDUSTRY` | `E-Commerce` · `Fashion` · `Beauty-Cosmetics` · `Manufacturing` · `Computer-Internet` · `Business-Services` · `Music` · `Luxury` · `Home_garden` · `Financial-Money` · `Pets-And-Animal-Care` · `Small-Business` |
| `SEASONAL` | `Fashion-Week` · `Christmas` · `Fathers-Day` · `Seasonal-Promotion` · `Spring` · `Labor-Day` · `Fall` · `Cyber-Monday` · `Mothers-Day` · `Valentines-Day` · `Memorial-Day` *(verified 2026-08-30 — opened alone via DOM click; slugs raw, same D19 treatment as the other groups)* |

The underlying DOM values are raw lowercase slugs (`newsletter`, `product-promotion`,
`dark-mode-optimized`) that CSS `text-transform: capitalize` turns into the labels above; the
hyphens and the underscore in `Home_garden` are shown to the merchant verbatim.

**Blank Template card:** `Blank Template` (H3) · `Start from scratch` · `START DESIGNING`
(black `rgb(33,33,33)`, `v-size--small`, pencil icon).

**Header CTA on MY TEMPLATES:** `START FROM SCRATCH` (black contained). Same job as
`START DESIGNING`, different words, different place, different size.

**Template cards:** 17 stock templates, each a `v-card--link` whose only child is a `v-image`.
The template **name exists only inside the hover overlay** (dark scrim + centred white text),
e.g. `Fathers Day Photography`, `Love Your Mother 2022`. With no card hovered the DOM text of
every card is the empty string. Thumbnails come from
`https://uat-web.maropost.com/assets/landing_pages/{slug}-{digest}.jpg` — observed slugs include
`brand-awareness-page`, `cyber-monday-shop`, `easter-home-decor-sale-2022`.

**MY TEMPLATES table:**

| Header | Cell |
|---|---|
| *(blank)* | drag grip / checkbox slot — renders as two empty white rectangles (broken) |
| `Name` | `Rails-8-DnD` |
| `Updated At` | `Aug 21, 2025 at 02:58 AM` |
| `Created At` | `Jul 07, 2025 at 04:52 AM` |
| `Actions` | kebab → single item `Create New Page` (icon `mdi-pencil`) |

Footer: `Rows per page: 10` · `1-1 of 1` · prev/next.

**Bottom action:** `BACK` (outlined, `<button>` with a JS click handler, no href).

### All interactions and behaviours

- **Category checkbox** — filters the grid live. The accordion header gains a blue count badge
  (`INDUSTRY  ①`); ticking `E-Commerce` cut the grid from 18 cards to 8. `Clear All` goes from
  disabled grey to active blue.
- **`Clear All`** — unchecks every facet and restores all 18 cards. It does **not** collapse the
  expanded accordions.
- **Accordions** — expanding `INDUSTRY` auto-collapsed `USAGE`: the group is exclusive, so two
  facet groups can never be seen at once.
- **Card hover** — a dark scrim fades in with the template name centred in white. Nothing else.
  No preview, no "use this template" button, no category badge.
- **Card click** — a JS click handler (no `href`); destination not verified (see Unverified).
- **Tab switch** — `role="tab"` / `aria-selected` update correctly, but the URL never receives
  the `#library` / `#mytemplate` hash, so the tab is not deep-linkable and the browser back
  button does not undo a tab switch.
- **Image loading** — thumbnails are lazy-loaded `background-image`s with no placeholder, so the
  grid is a wall of blank white cards for several seconds on first paint *and again* every time
  the user returns from `MY TEMPLATES`.

### Accessibility issues observed

1. **Template cards are unlabelled focus targets.** Each is `<div tabindex="0">` with **no
   `role`, no `aria-label`, and empty text content**. A keyboard user tabs through 17 stops that
   a screen reader announces as nothing at all. The name is rendered only on `:hover`, which
   never fires for keyboard or screen-reader navigation. This is the most serious a11y defect
   found in the whole flow.
2. **No `alt` on any template image** — every `.v-image` returns `NO ALT`.
3. **No `H1`, and the heading order skips a level:** `H2 Select Template` → `H3 Categories` →
   `H5 USAGE / INDUSTRY / SEASONAL`. `H3 Blank Template` (a card title) sits at the same level as
   the sidebar's section heading.
4. **`Clear All` is a `<span class="button disabled-cursor text--disabled">`** — not a button,
   not focusable, not announced, and grey `rgba(0,0,0,0.38)` in its resting state.
5. **`Create New Page` in the MY TEMPLATES kebab has `tabindex="-1"` and no `role="menuitem"`**,
   so the row's only action is keyboard-unreachable.
6. **The facet checkbox groups have no group label in the accessibility tree** — the `USAGE` /
   `INDUSTRY` headings are visual `H5`s, not `fieldset`/`legend` or `role="group"` + `aria-label`.
7. **No focus-visible styling** was observed on the template cards.

### UX friction points worth fixing

1. **The library has no search.** 17+ templates, and the only way to narrow is three facet
   accordions. There is no text search by template name.
2. **Template names are hover-only.** A merchant scanning the grid sees 17 unlabelled pictures.
   Names should be persistent captions.
3. **Cards have no fixed aspect ratio.** Measured card heights: `300, 659, 656, 300, 856, 998,
   398, 1075, 808, 426, 1660, 1425, 1208, 1221, 1249, 806, 410, 874` px. One card is **1660 px
   tall** — more than two viewports — so the grid is a ragged masonry the eye cannot scan, and
   comparing two templates means scrolling past a full page render of each.
4. **No preview.** The only way to see a template at readable size is to select it.
5. **Two labels for one action.** `START DESIGNING` (on the Blank card, LIBRARY tab) vs
   `START FROM SCRATCH` (header button, MY TEMPLATES tab) do the same thing.
6. **Facet accordions are mutually exclusive**, so filtering by usage *and* industry means
   losing sight of the first group's selections.
7. **Raw slugs as user-facing labels.** `Product-Promotion`, `Beauty-Cosmetics`, `Home_garden`,
   `Pets-And-Animal-Care`, `Dark-Mode-Optimized`, `Financial-Money`, `Computer-Internet`.
   `Home_garden` in particular is a database value that escaped into the UI.
8. **`Dark-Mode-Optimized` is filed under `USAGE`** — it is a rendering property, not a use case.
9. **No result count.** After filtering, nothing says "7 templates".
10. **No empty state for a filter that matches nothing** (not reachable to test — see Unverified).
11. **`BACK` sits below the grid**, so on the LIBRARY tab it is thousands of pixels down the page,
    while the breadcrumb at the top does the same job. Two back affordances, one unreachable.
12. **The blank-card thumbnail is a broken-image glyph**, which reads as an error rather than as
    "empty canvas".
13. **`MY TEMPLATES` cannot manage templates.** The only row action is `Create New Page` — there
    is no rename, duplicate, delete, or preview for a template the merchant saved themselves.
14. **`MY TEMPLATES` and the landing-pages list use different column sets** for the same kind of
    object (`Name/Updated At/Created At` vs `Name/Editor Type/Domain Status/Publish At/Expire
    At/Updated At`).

### Source defects

| # | Defect | Evidence |
|---|---|---|
| D15 | **Tab switch leaves the previous tab's content painted over the new one.** Five seconds after clicking `MY TEMPLATES`, all 18 LIBRARY cards were still in the DOM at `width: 0, height: 0` with their images painting over the MY TEMPLATES pane, and the whole `v-tabs-items` window was clamped to `179px`, clipping the cards mid-content. The pane settles correctly only after the transition finally completes. | measured card rects + screenshot |
| D16 | **`v-tabs-items` height is driven by the inactive tab.** The window reports `h: 179` while the active pane's real content is a full-width table; the LIBRARY window-item reports `h: 0` but its children still paint. | measured |
| D17 | **The MY TEMPLATES row's first cell renders two empty white rectangles** where the list page draws a drag grip and checkbox. | screenshot |
| D18 | **Hover names go stale.** After hovering two different cards, both card 5 (`Fathers Day Photography`) and card 11 (`Love Your Mother 2022`) simultaneously reported non-empty text — the first card never cleared its overlay. | DOM read |
| D19 | **Category labels are raw slugs.** The DOM content of the `USAGE` panel is the literal string `newslettereventsproduct-promotionservice-promotiondark-mode-optimized`; the display labels are produced only by `text-transform: capitalize`, and `Home_garden` shows an underscore. | DOM read |
| D20 | **Template thumbnails have no aspect-ratio constraint**, producing cards up to `1660px` tall in a 5-column grid. | measured |
| D21 | **Tab state is not written to the URL** despite the tabs using `href="#library"` / `href="#mytemplate"`. | URL unchanged after switching |
| D22 | **Every template image reloads on return to the LIBRARY tab**, with no cached paint and no placeholder — the grid goes fully blank again. | observed twice |

### Unverified

- **Clicking a template card** — not clicked. The handler is JS-only with no inspectable `href`,
  so it could either route to a naming step or immediately create a landing-page record.
- **`START DESIGNING` / `START FROM SCRATCH`** — not clicked, same reason. Both are `<button>`
  elements with a `click` listener and no `href`.
- **`Create New Page`** in the MY TEMPLATES kebab — not clicked; it creates a record.
- ~~**`SEASONAL` accordion contents** — never expanded~~ **Resolved 2026-08-30:** opened each
  accordion alone on a re-crawl and read the panel from the DOM. The 11 options are now in the
  facet table above. The re-crawl also confirmed the group set is exactly `USAGE` / `INDUSTRY` /
  `SEASONAL` — there is **no fourth (`AUTOMATED`) group** on account 116000.
- **`BACK` button destination** — not clicked; inferred to be the landing-pages list.
- **Template-library empty state** — no facet combination was tried that returns zero templates.
- **Whether the `MY TEMPLATES` table supports selection / bulk actions** — the header cell is
  blank and no checkbox was observed, but hover on that row was not tested.
- **Sorting on the MY TEMPLATES table** — not tested.

---

## 3. `/accounts/116000/landing_pages/create` — Select Builder

### Page purpose & primary user task

Step 2 of "create a landing page": **choose the editor** — `WYSIWYG` or `Drag & Drop`. One
decision, two options, nothing else. Despite the URL saying `create`, the page creates nothing
and collects no data.

### Layout structure and hierarchy

```
Breadcrumb  "My Landing Pages > Select Template > Select Builder"
            ├── My Landing Pages  → /accounts/116000/landing_pages
            ├── Select Template   → /accounts/116000/landing_pages/template
            └── Select Builder    (plain text, current)

            centred column, ~1280 max-width
              H4      "Create New Landing Page"
              <p>     "Select builder type for your new landing page."
              row (justify-center)
                ├── div.editor-img  256×234   background-image: WYSIWYG.png
                └── div.editor-img  256×234   background-image: DnD.png
              BACK    (outlined button)
```

The page has **no form, no fields and no primary CTA** — picking a tile *is* the submit.
Total body text: 403 characters.

### Components used → design-system mapping

| Live UI | Design-system component |
|---|---|
| Breadcrumb + title + subtitle | `MpPageHeader` (`title`, `subtitle`, `backTo`) — or `MpEmptyState variant="launcher"` for the centred treatment |
| `WYSIWYG` / `Drag & Drop` tiles | **`MpOptionCard`** (`selected`, `title`, `description`, `#media`) — exactly the keyboard-operable selectable card this page is missing |
| Step position in the flow | `MpWizardSteps` (`steps: ['Select template','Select builder']`, `current: 2`) — the flow has three breadcrumb levels but no step indicator |
| `BACK` | `MpPageHeader` `backTo` |

### All data fields, labels and copy

| Element | Exact copy |
|---|---|
| Breadcrumb | `My Landing Pages` › `Select Template` › `Select Builder` |
| Title (`H4`) | `Create New Landing Page` |
| Subtitle | `Select builder type for your new landing page.` |
| Option 1 | `WYSIWYG` — **rendered inside a PNG**, not as text |
| Option 2 | `Drag & Drop` — **rendered inside a PNG**, not as text |
| Bottom action | `BACK` |

Option assets (`background-image`, no `<img>`, no `alt`):

- `https://uat.maropost.com/legacymmc/img/WYSIWYG.b7e2e0c2.png` (+ `WYSIWYG-hover.4574b47c.png`)
- `https://uat.maropost.com/legacymmc/img/DnD.19de6331.png` (+ `DnD-hover.886428bd.png`)

Neither option carries a description. Nothing on the page explains what the difference between
the two builders is, which one the merchant should pick, or that `Drag & Drop (Legacy)` (seen
throughout the list) is a third, deprecated thing.

### All interactions and behaviours

- **Hover a tile** — the background image swaps to its `-hover` variant: a blue 2px border and a
  blue-tinted illustration. This is the **only** state feedback; there is no persistent selected
  state, no focus state, and no "continue" step.
- **Click a tile** — a JS handler on `div.editor-img` (`cursor: pointer`). Destination not
  verified (see Unverified) — presumed to open the chosen editor.
- **`BACK`** — verified: returns to `/accounts/116000/landing_pages/template`, LIBRARY tab, with
  all facet filters reset and the thumbnail grid blank again while it re-lazy-loads.
- **Breadcrumb links** — verified as real `<a href>`s to the list and the template gallery.
- **Rendering** — the title, subtitle and `BACK` paint first; **the two option tiles took
  roughly 24 seconds to appear** after navigation. For that whole window the page reads as a
  finished, broken screen: a heading, a subtitle telling you to select a builder type, and no
  builder types.

### Accessibility issues observed

1. **The page's entire purpose is absent from the accessibility tree.** A full interactive
   `read_page` of the content area returns only the two breadcrumb links and the `BACK` button.
   Both builder tiles are plain `<div>`s with **no `role`, no `tabindex`, no `aria-label`, no
   text content and no `alt`** — so a keyboard user cannot select a builder at all, and a screen
   reader is told the page has nothing to choose from. This is a complete blocker, not a polish
   item.
2. **The only labels are pixels.** `WYSIWYG` and `Drag & Drop` are baked into raster PNGs — not
   selectable, not translatable, not searchable, not resizable with text zoom, and blurry at
   >1× device pixel ratio.
3. **`H4` is the page's only heading**, with no `H1`, `H2` or `H3` above it. The sibling page
   `/landing_pages/template` uses `H2` for the same slot, so heading levels are inconsistent
   across two steps of one flow.
4. **No focus-visible state** on either tile (they cannot receive focus at all).
5. **The hover affordance is colour-only** (blue border + blue tint) with no non-colour cue.
6. **The subtitle is not programmatically associated** with the choice group; there is no
   `role="radiogroup"` / `fieldset` semantics for what is a two-option single choice.

### UX friction points worth fixing

1. **~24 seconds of "finished but empty".** The heading and subtitle render immediately and the
   options do not. There is no skeleton, spinner or "loading builders…" copy, so the page looks
   broken for as long as it takes.
2. **No explanation of the choice.** Two illustrations and no body copy. A merchant who does not
   already know what WYSIWYG means has nothing to go on — no "best for…", no feature list, no
   comparison, no "recommended" mark.
3. **`Drag & Drop (Legacy)` is invisible here** even though a third of the pages in the list use
   it. Nothing warns that Legacy is deprecated or that this choice is effectively permanent.
4. **The URL lies.** `/landing_pages/create` creates nothing; it is a builder picker. The
   breadcrumb correctly calls it `Select Builder`, so the route name and the UI disagree.
5. **No wizard affordance.** The flow is list → `Select Template` → `Select Builder` → editor,
   but there is no step indicator, no "Step 2 of 2", and no `Continue`/`Next`. Clicking a picture
   is the commit, with no confirmation.
6. **Two back affordances again** — the breadcrumb and a `BACK` button doing the same job.
7. **The tile is enormous relative to its information.** 256×234 px each to convey one word.
8. **Direct navigation is not guarded.** Reaching `/create` by URL with no template selected
   still renders the picker, so a builder can be chosen with no template context. What happens
   on click in that state is unknown.

### Source defects

| # | Defect | Evidence |
|---|---|---|
| D23 | **Builder options are absent from the accessibility tree.** `read_page filter=interactive` on the content area returns only 2 breadcrumb links + `BACK`. | read_page |
| D24 | **Option labels are rasterised into PNGs** served from `/legacymmc/img/`, with no text equivalent anywhere in the DOM. | computed `background-image` |
| D25 | **~24 s to render the two options.** Title/subtitle/BACK paint at ~14 s; the tiles only appeared after a further ~10 s wait. | two screenshots, same page load |
| D26 | **Heading level is `H4` with nothing above it**, and differs from the `H2` used on the previous step of the same flow. | DOM read |
| D27 | **Legacy Vue bundle is served in development mode.** Console: `You are running Vue in development mode. Make sure to turn on production mode when deploying for production.` from `legacymmc/js/src_routeAccessMap_js.js`. | console |
| D28 | **Amplitude Engagement SDK blocks for 10 s on every load.** Console: `Engagement SDK failed to load within 10000ms. Resolving pending calls gracefully.` followed by `boot resolved as no-op due to script loading failure`. This is a large, fixable share of the 8–18 s splash. | console, repeated on every navigation |
| D29 | **Vue 2/3 interop lifecycle bug.** Console: `[Vue warn]: onMounted is called when there is no active component instance to be associated with…` and the same for `onUnmounted`, on every load. | console |
| D30 | **Eleven duplicate named vue-router routes**, including `Error_404`, `Email_content_wysiwyg`, `Email_content_wysiwyg_edit`, `Custom_reports_edit`, `Custom_reports_campaign`, `New_link_tracking_domain`, `Forms_html_code`, `Recurring_campaign_report`, `Resend_campaign`, `SMS_campaign_opt_outs`, `New_contacts`. | console |
| D31 | **Named routes with default child routes render nothing** when navigated to by name — `campaign_dashboard`, `Mobile_keyword_click_report`, `SMS_campaign_click_report`. | console |
| D32 | **The whole app bootstraps twice per navigation** — the full boot log (service-worker registration, Amplitude boot, Vue dev-mode banner, router warnings) repeats verbatim ~8 s apart on a single navigation. | console timestamps `01:05:05` then `01:05:13` |

No uncaught exceptions or console `error`s were recorded — every finding above is a warning or
an info log.

---

## Cross-cutting notes for the rebuild

- **One flow, three heading levels.** `H2 Landing Pages` → `H2 Select Template` → `H4 Create New
  Landing Page`, with no `H1` on any of the three pages. `MpPageHeader` with `level` fixes all of
  it in one place.
- **Three back affordances competing.** Breadcrumb, a `BACK` button below the fold, and the
  browser back button (which does not undo tab or folder changes because neither is in the URL).
  `MpPageHeader backTo` should be the only one.
- **Nothing in this flow is addressable.** Folder selection, template-tab selection and facet
  filters are all client state that never reaches the URL — no bookmarking, no sharing, no
  restore on refresh, and the back button behaves unpredictably.
- **Selection semantics are hand-rolled three different ways**: hover-only checkboxes in the
  list, hover-only name overlays on template cards, and hover-only image swaps on builder tiles.
  `MpOptionCard` already solves the second and third correctly.
- **Two CTA vocabularies for one action**: `NEW PAGE` / `START DESIGNING` / `START FROM SCRATCH`
  / `Create New Page` all begin the same flow.
- **Every menu in the flow is keyboard-broken the same way** — one item gets
  `role="menuitem"`/`tabindex="0"` and the rest get `tabindex="-1"` and no role. `MpMenuItem`
  bakes the role in, so migrating the four menus fixes it structurally.
- **Performance is dominated by two fixable things**: a 10-second Amplitude SDK timeout on every
  navigation, and a legacy Vue bundle shipped in development mode.
