# Email Content — UAT audit

Read-only crawl of `uat.maropost.com`, account `116000`, 2026-08-30.
Legacy Vuetify 2 app mounted inside the Vuetify 3 shell. No records were mutated.

Three surfaces in scope:

| # | URL | Working title |
|---|---|---|
| 1 | `/accounts/116000/contents` | Email Content list |
| 2 | `/accounts/116000/contents/template?activeTab=mytemplate&folder` | Select Template (gallery) |
| 3 | `/accounts/116000/content_templates/select_editor` | Editor chooser |

---

# 1. `/accounts/116000/contents` — Email Content list

## Page purpose & primary user task

The library of reusable **email bodies** ("content"). A content record is not a campaign — it is the
creative that a campaign later points at. The list is where a marketer finds an existing email body
to edit, preview, duplicate, or push straight into a new campaign, and where they start a new one.

Primary tasks, in observed order of prominence:

1. Start a new email body — `NEW CONTENT`.
2. Start from a saved/library template — `MY TEMPLATES`.
3. Find an existing body and act on it (edit / preview / duplicate / campaign / archive / delete).
4. Organise bodies into folders (drag a row onto a folder in the left panel).

489 records live in this account, so **find** is by far the dominant real task — and it is the task
the page supports worst (see UX friction).

## Layout structure and hierarchy

```
AppBar (global, Vuetify 3 shell)          ← global Search, cloud switcher, Da Vinci, settings, help, notifications, user
AppSidebar (global, dark, 248px)          ← Dashboard / Analytics / CDP / Products / Marketing / Commerce / Retail / Service / Da Vinci AI / Dashboard / Conversations / Apps
│
├── Folder panel (collapsed by default; toggled by a small folder icon that sits ON the sidebar edge)
│     ├── `Always Open` switch (off)
│     ├── `+ New Folder` button  → becomes an inline field + `CREATE` / `Close`
│     └── Folder tree: `My Contents` (root, caret-expandable, selected by default)
│           └── `Brendan` · `Harpreet_QA` · `Harsh` · `Manny` · `sonakshi` · `yash`
│                 └── per-folder `•••` on hover → `Privacy` (disabled) · `Rename` · `Delete` (disabled)
│
└── Content area
      ├── Breadcrumb: `My Email Contents`  (plain text at root; becomes `My Email Contents > <Folder>` with a link when a folder is picked)
      ├── Title row:  H2 `Email Content`   +  `VIEW ARCHIVES` (outlined)      ……      `All` (editor-type select) · `MY TEMPLATES` (dark) · `NEW CONTENT` (dark)
      └── Card (flat, thin border)
            ├── v-data-table  — header row + 10 rows
            └── Footer: `Rows per page:` `10 ▾` · `1-10 of 489` · `‹` `›`
```

There is **no search field, no filter tabs, no KPI row and no bulk-action bar of any kind** on this
page. When rows are selected the header actions are *replaced* in place (see Interactions).

Opening the folder panel **collapses the global AppSidebar to an icon rail**. The rail state then
persists after navigating away (observed on `/archive`).

## Components used (mapped to the design system)

| Live element | Design-system component | Notes for the rebuild |
|---|---|---|
| Breadcrumb + `Email Content` + `VIEW ARCHIVES` + right-hand action cluster | `MpPageHeader` (`backTo` for the folder case, `#actions` slot) | Title is `H2` with **no `H1` on the page** — rebuild with `level` set correctly |
| `All` editor-type select | `MpDataTableToolbar` `quickFilter` (`key: 'editorType'`, `multiple: false`) | It is the page's only filter; promote it into the toolbar control row, not the header |
| The table | `v-data-table` under `MpDataTableToolbar` | Columns below |
| Row status/type cell (`Drag & Drop` etc.) | `MpStatusChip` `type="general"` `size="sm"` | Currently plain grey text that wraps to two lines |
| Row `⋮` | `MpRowActionsMenu` + `MpMenuItem` | Exact items below |
| Selection header cluster (`🗑` + `1 selected` + `×`) | `MpFloatingBulkBar` | Today it *destroys* the primary actions instead of floating |
| `No data available` | `MpEmptyState` | Today it is bare default Vuetify text |
| Folder panel | `MpSectionRail` (groups) + `MpFolderSelect` | A tree with one level; a rail or a `MpFolderSelect` both fit |
| `+ New Folder` inline field + `CREATE`/`Close` | `MpFormDrawer` **or** an inline `MpFormField` | Today it is an inline swap inside the panel |
| Folder `•••` | `MpRowActionsMenu` + `MpMenuItem` (`danger` on Delete) | |
| Pagination footer | `v-data-table` footer | Keep the `1-10 of 489` label format |
| `VIEW ARCHIVES` destination page | `MpPageHeader` + `MpEmptyState` (`emphasis="prominent"`) | See Archives below |

## All data fields, labels and copy

### Header

| Element | Exact copy | Type |
|---|---|---|
| Breadcrumb (root) | `My Email Contents` | plain text, not a link |
| Breadcrumb (in folder) | `My Email Contents > Brendan` | `My Email Contents` is a link back to the root list |
| Page title (root) | `Email Content` | `<h2>` |
| Page title (in folder) | `Email Content - Brendan` | `<h2>` — **wraps mid-word**, see defects |
| Secondary button | `VIEW ARCHIVES` | outlined, uppercase, `<button>` (JS nav) |
| Editor-type filter | `All` (the value; **no label**) | `v-select`, options: `All` · `Drag & Drop` · `WYSIWYG` · `HTML Code Editor` · `Pull from URL` |
| Secondary CTA | `MY TEMPLATES` | dark filled, `<button>` |
| Primary CTA | `NEW CONTENT` | dark filled, `<button>` |

Note the two CTAs are visually identical (same dark fill, same size) — there is no primary /
secondary distinction between "start from a template" and "start a new one".

### Table columns

| # | Header | Sortable | Cell content | Notes |
|---|---|---|---|---|
| 1 | *(none)* | no | drag handle (`⠿`, `.multi-drag-drop-icon`, two `mdi-dots-vertical`) + selection checkbox | **Both are invisible until the row is hovered.** Header cell holds the select-all checkbox, which *is* always visible |
| 2 | `Name` | yes (`aria-sort="none"`) | link → `/accounts/116000/contents/<id>` | `.text-ellipsis` is applied but does not truncate; long names wrap to 2+ lines and break mid-word |
| 3 | `Editor type` | **no** | plain text: `Drag & Drop` · `WYSIWYG` · `HTML Code Editor` · `Pull from URL` | Column is too narrow — every value wraps to two lines |
| 4 | `Updated At` | yes | `Aug 28, 2026 at 06:40 AM` | absolute only, no relative time, no timezone shown |
| 5 | `Created At` | yes | `Aug 26, 2026 at 04:17 AM` | same format |
| 6 | `Actions` | no | `⋮` kebab | right-aligned header text is `text-left` in the DOM |

Row link target confirmed on three rows: `/accounts/116000/contents/714`, `/695`, `/248`.

### Row kebab menu — exact items, in order

| # | Label | Icon | Element | Destination |
|---|---|---|---|---|
| 1 | `Preview Content` | `mdi-eye` | `<a role="menuitem" tabindex="0">` | `/accounts/116000/contents/<id>/preview` |
| 2 | `Create a Campaign` | `mdi-send` | `<a role="menuitem" tabindex="0">` | `/accounts/116000/campaigns/content/<id>` |
| 3 | `Edit Content` | `mdi-pencil` | `<a role="menuitem" tabindex="0">` | `/accounts/116000/contents/<editorSlug>/<id>` |
| 4 | `Archive Content` | `mdi-package-down` | `<div tabindex="-1">` **no role** | JS action, no href |
| 5 | `Delete Content Permanently` | `mdi-delete` | `<div tabindex="-1">` **no role** | JS action, no href |
| 6 | `Create a Duplicate Content` | `mdi-file-multiple` | `<a role="menuitem" tabindex="0">` | `/accounts/116000/contents/<editorSlug>?content_id=<id>&copy=true&rename=<original name>` |

`<editorSlug>` is derived from the row's editor type and is the same slug used by the editor chooser:
`drag_and_drop_beta` · `wysiwyg` · `pull_from_url` (and, by inference, `html` — see page 3).

The destructive item is **fifth of six**, has no divider above it, and is followed by a
non-destructive action. `Create a Duplicate Content` is also ungrammatical (should be
`Duplicate` or `Create a duplicate`).

### Folder panel

| Element | Exact copy |
|---|---|
| Switch | `Always Open` (off) |
| Button | `+ New Folder` |
| Inline field label | `New Folder Name` (a floating `<label>`) |
| Inline field hint | `36 characters maximum` |
| Inline buttons | `CREATE` (dark filled) · `Close` (outlined) |
| Root node | `My Contents` |
| Child folders (this account) | `Brendan` · `Harpreet_QA` · `Harsh` · `Manny` · `sonakshi` · `yash` |
| Folder `•••` menu | `Privacy` (`mdi-account`, **disabled**) · `Rename` (`mdi-folder-edit`) · divider · `Delete` (`mdi-delete`, **disabled**) |

Observed folder contents: `Brendan` 2 · `Harpreet_QA` 20 · `Harsh` 1 · `Manny` 10 · `sonakshi` 27 ·
`yash` 4. No folder was empty, so the "empty folder" state was not reachable.

### Footer / pagination

| Element | Exact copy |
|---|---|
| Label | `Rows per page:` |
| Options | `5` · `10` · `25` · `50` · `100` (default `10`) |
| Range label | `1-10 of 489` — in a folder: `1-2 of 2`, `1-1 of 1`, `1-10 of 15` |
| Range label when empty | `–` (a bare en dash) |
| Nav | `‹` `›` icon buttons, disabled at the ends, no page numbers, no jump-to-page |

### Empty state

Reached by combining a folder with a filter that matches nothing (`Harsh` + `Pull from URL`):

> `No data available`

Grey, centred, inside a single table row. No icon, no description, no "clear filter" action, no
`role="status"`. This is the stock Vuetify 2 `no-data-text` — it has never been customised.

## All interactions and behaviours

**Row hover.** The row background greys, and the drag handle + checkbox fade *in* in column 1. Nothing
else changes. The kebab is always visible.

**Row click (Name).** Navigates to `/contents/<id>`. The rest of the row is not clickable.

**Drag to folder.** Column 1's handle implies drag-a-row-onto-a-folder as the move-to-folder mechanism.
Not executed (would mutate a record) — see Unverified.

**Selection.** Clicking a row checkbox swaps the whole right-hand header cluster: the `All` filter,
`MY TEMPLATES` and `NEW CONTENT` all disappear and are replaced, in the same slot, by

`🗑` (icon-only, `mdi-delete`, **no label/tooltip**) · `1 selected` (a text `<button>`) · `×` (`mdi-close`)

Clicking the header checkbox selects the **10 rows on the current page only** and the label reads
`10 selected` — there is no "select all 489" affordance and no indication that selection is page-scoped.
Partial selection puts the header checkbox in the indeterminate (dash) state. Clicking `1 selected` /
`×` clears the selection and restores the header. **Delete is the only bulk action** — no bulk archive,
no bulk move-to-folder, no bulk duplicate.

**Editor-type filter.** Client-facing filter that composes with the folder selection
(`Harsh` + `Pull from URL` → `No data available`). It does not write to the URL.

**Folder selection.** Filters the table, rewrites the breadcrumb and the H2, and resets pagination.
`location` stays `/accounts/116000/contents` with **no query string at any point** — folder, filter,
sort, page size and page number are all invisible to the URL.

**Sorting.** `Name`, `Updated At`, `Created At` carry the `sortable` class. Default order appears to
be `Updated At` descending, but no header shows a sort indicator on load (`aria-sort="none"`
everywhere).

**Loading.** The whole app sits behind a "Preparing an optimised workspace" splash for 8–18s on a cold
load. Inside the app there is no per-table skeleton — the table simply appears.

**`VIEW ARCHIVES`.** Navigates to `/accounts/116000/archive?filter=contents`:

- Breadcrumb `Settings > Archives` (`Settings` is the link) — **the wrong parent**; there is no path
  back to Email Content.
- Title `<h2>Archives</h2>`.
- One control top-right: a select showing `Content`, options
  `Campaign Tag` · `Contact List` · `Segment` · `Content` · `Dynamic Content`.
- Empty state, properly written for once:
  - heading `You have no archived items.` (also an `<h2>`)
  - body `Archive outdated content or campaigns to keep your workspace up-to-date.`
  - no icon, no CTA.

## Accessibility issues observed

1. **No `<h1>` on the page.** The title is `<h2>`; on `/archive` both the page title and the empty-state
   heading are `<h2>`, so two sibling `h2`s and no `h1`.
2. **`Archive Content` and `Delete Content Permanently` are `<div tabindex="-1">` with no `role`.**
   They are unreachable by keyboard and invisible to a screen reader's menu model. The other four
   items in the same menu are correct `<a role="menuitem" tabindex="0">`. A keyboard-only user
   literally cannot archive or delete content from the list.
3. **The bulk-delete button has no accessible name** — icon-only `mdi-delete`, no `aria-label`, no
   `title`, no tooltip. The single most destructive control on the page is unnamed.
4. **The editor-type select has no label** — no `<label>`, no `aria-label`. Its accessible name is just
   its current value, `All`, which tells a screen-reader user nothing.
5. **Row checkbox and drag handle only exist on hover**, so they are effectively unreachable by touch
   and confusing under keyboard focus (focus lands on an invisible control).
6. **Row checkboxes have no accessible name** — `<input type="checkbox" id="input-136">` with no label
   and no `aria-label`, so every row reads as an unnamed checkbox.
7. **`No data available` is not announced** — no `role="status"`, no `aria-live`.
8. **Disabled folder actions give no reason.** `Privacy` and `Delete` are
   `v-list-item--disabled` with `pointer-events: none`, so they cannot even receive focus or show a
   tooltip explaining why.
9. **Disabled text contrast.** Disabled menu items are `rgba(0,0,0,0.38)` on white ≈ 2.8:1. Below 4.5:1.
   (Disabled text is exempt from WCAG SC 1.4.3, but here it is the *only* signal that the action is
   unavailable, so it fails in practice.)
10. **Sort state is never exposed** — `aria-sort` stays `none` on all three sortable headers even
    though the table is clearly sorted by `Updated At` on load.
11. **The `Actions` header is `text-left`** while its cells are right-aligned, so the header and the
    control it names do not line up.
12. **Every header action is a `<button>`, not an `<a>`** (`VIEW ARCHIVES`, `MY TEMPLATES`,
    `NEW CONTENT`), even though all three are pure navigation. No middle-click, no open-in-new-tab,
    no status-bar preview of the destination.

## UX friction points worth fixing

1. **No search over 489 records.** There is no way to search, and no filter other than editor type.
   Finding a known content by name means paging through 49 pages of 10 or eyeballing 100 rows at a
   time. This is the single biggest problem on the page. The global AppBar search is a different,
   app-wide search and does not scope to content.
2. **The primary actions vanish on selection.** Ticking one row hides `NEW CONTENT`, `MY TEMPLATES`
   and the filter. Selection should be additive — `MpFloatingBulkBar` exists precisely for this.
3. **Delete is the only bulk action, and it is unlabelled.** A bare trash icon with no name that
   permanently deletes N records is the most dangerous control in the module. Bulk *archive* and bulk
   *move to folder* are the ones users actually want, and neither exists.
4. **Nothing is in the URL.** Folder, filter, sort, page and page size are all component state.
   A user cannot bookmark "sonakshi's WYSIWYG content", cannot share it, and browser Back from a
   filtered view exits the page entirely rather than undoing the filter.
5. **The folder panel is hidden behind an unlabelled 24px icon** stuck to the outer edge of the global
   sidebar, with no tooltip and no visual connection to the table it filters. Most users will never
   find it. `Always Open` exists specifically because the default is wrong.
6. **Move-to-folder is drag-only.** There is no `Move to folder` item in the row kebab and no bulk
   move. Drag-and-drop across a 489-row paginated table into a panel that is closed by default is not
   a viable primary path, and it is impossible on touch or keyboard.
7. **Editor type is data, not a decision the user should have to carry.** It is shown as a plain
   wrapping text column, is not sortable, and is the only filter — yet it is exactly the thing a user
   least often searches by.
8. **Destructive item buried mid-menu.** `Delete Content Permanently` sits fifth of six with a
   non-destructive item after it and no divider, so a mis-click lands on permanent deletion.
9. **`Archive` and `Delete Content Permanently` sit side by side** with no visual distinction between
   "reversible" and "gone forever".
10. **`VIEW ARCHIVES` is a one-way door.** It navigates to a Settings-parented page with no route back
    to Email Content, and it takes a top-slot header button to do it — a rarely used view occupying
    prime real estate next to the H2.
11. **Two identical dark CTAs** (`MY TEMPLATES`, `NEW CONTENT`) give no hierarchy. One of them should
    be secondary, or they should collapse into one "New content" flow that offers templates as step 1
    (which is exactly what `select_editor` already does — see page 3).
12. **No last-modified-by / owner column** on the list, even though the template gallery has
    `Created By`. With six shared folders and 489 records, "who made this" is a real question.
13. **Dates are absolute-only and ambiguous** (`Aug 28, 2026 at 06:40 AM` — whose timezone?).
14. **Long names are not truncated.** The `.text-ellipsis` class is present but ineffective; a
    90-character name wraps and breaks mid-word, blowing up row height.
15. **No row-level "in use by N campaigns"** signal, so a user has no way to know whether deleting a
    content record will break a live campaign.

## Source defects

| # | Defect | Evidence |
|---|---|---|
| D1 | **The page H2 breaks mid-word.** `word-break: break-all` on the title renders `Email Content - Bre` / `ndan` and `Email Content - yas` / `h`. | computed `word-break: break-all` on `h2`; screenshots of the `Brendan`, `yash` and `Harsh` folders |
| D2 | **`Archive Content` and `Delete Content Permanently` are `<div tabindex="-1">` with no `role`** while their four siblings are `<a role="menuitem" tabindex="0">`. Keyboard-inaccessible. | DOM read of the open row menu |
| D3 | **The bulk-delete button has no accessible name** (no `aria-label`, `title` or tooltip). | DOM read of the selection header |
| D4 | **The editor-type select has no label or `aria-label`.** | DOM read |
| D5 | **The `Name` cell contains a duplicate anchor with an empty `href`** wrapping the same text as the real link — a stray tooltip/clone element that is focusable and goes nowhere. | `links: [{path:"/accounts/116000/contents/714"}, {path:""}]` |
| D6 | **`.text-ellipsis` on the name cell does not truncate.** Long names wrap and break mid-word. | row `akjhfdlkhq2opiwhjreopqasdnzmxcna…` renders on two lines |
| D7 | **The `36 characters maximum` hint on New Folder Name is not enforced by the input** — no `maxlength` attribute, so it can only fail on submit. | DOM read of the field |
| D8 | **`VIEW ARCHIVES` lands on a page breadcrumbed `Settings > Archives`**, the wrong parent, with no link back to Email Content. | `/accounts/116000/archive?filter=contents` |
| D9 | **Opening the folder panel permanently collapses the global sidebar to an icon rail**, and the rail persists after navigating to an unrelated page. | observed on `/archive` after the panel had been opened |
| D10 | **No page state is reflected in the URL.** `location.search` is empty for every folder, filter, sort and page. | `location.pathname + location.search` read after each interaction |
| D11 | **`aria-sort` is `none` on every header** including the column the table is actually sorted by. | DOM read |
| D12 | **The empty range label is a bare en dash `–`** rather than `0 of 0` or a suppressed footer. | `Harsh` + `Pull from URL` |
| D13 | **`Editor type` here vs `Editor Type` on the template gallery** — inconsistent column-header casing between two sibling pages. | screenshots of both |
| D14 | **The `Actions` column header is `text-left`** while its cells are right-aligned. | `th.className === "text-left"` |

No JavaScript console errors were captured on this page.

## Unverified

| Item | Reason |
|---|---|
| `CREATE` on New Folder | Creates a live folder. Form was opened and closed via `Close` only. |
| `Rename` on a folder | Mutates a live folder. Menu was opened and read only. |
| `Delete` on a folder | Disabled for this user *and* destructive. |
| `Privacy` on a folder | Disabled for this user; no tooltip explains why, and it cannot receive focus, so its dialog was never seen. |
| `Archive Content` / `Delete Content Permanently` (row) | Destructive. Menu read from the DOM; the confirmation dialog (if any) was never seen. |
| Bulk `🗑` delete | Destructive. |
| Drag-a-row-onto-a-folder | Would move a live record. |
| `Always Open` switch | It is a persisted preference toggle; the brief forbids clicking toggles. |
| Empty **folder** state | No folder in this account is empty. The empty state was instead reached via a filter that matches nothing (`No data available`), which is likely the same component. |
| Sort click behaviour (asc/desc/none cycle) | Not exercised; sortability read from the `sortable` class only. |
| Column-header sort indicator styling | Never observed, because `aria-sort` never leaves `none`. |
| Server-side error state | Never encountered; no request was made to fail. |

---

# 2. `/accounts/116000/contents/template?activeTab=mytemplate&folder` — Select Template

## Page purpose & primary user task

The starting gallery for a new email body. It is reached from **both** header CTAs on the Email
Content list, and it is the only place a saved template can be previewed or turned into content.
Two very different collections share one page:

- **LIBRARY** — ~30+ Maropost-supplied stock designs, presented as a masonry of thumbnails, filtered
  by a four-facet category panel.
- **MY TEMPLATES** — 60 account-authored templates, presented as a *data table* with folders.

Primary tasks: pick a stock design and start editing · find one of our own saved templates and start
content from it · preview a saved template · start from a blank canvas.

## The `activeTab` and `folder` query params

`activeTab` accepts exactly two values:

| Value | Effect |
|---|---|
| `mytemplate` | opens on the **MY TEMPLATES** tab |
| *(absent / anything else)* | opens on the **LIBRARY** tab (the default) |

The tab strip's own hrefs are `#library` and `#mytemplate`, but clicking a tab **does not update the
URL** — `activeTab` stays at whatever it was on load, and after a round-trip through an editor it is
dropped entirely. It is a load-time seed only, not routable state.

`folder` is present as a bare, valueless key (`&folder`, later `&folder=`) on every URL the app
generates. Selecting a folder in the panel does **not** write an id into it. Across the whole crawl
it never carried a value — it appears to be a vestigial parameter.

Entry points observed:

| From | Lands on |
|---|---|
| Email Content list → `NEW CONTENT` | `/contents/template?folder` → **LIBRARY** tab |
| Email Content list → `MY TEMPLATES` | `/contents/template?activeTab=mytemplate&folder` → **MY TEMPLATES** tab |

**Both header CTAs on the Email Content list open the same page.** They differ only in which tab is
preselected.

## Layout structure and hierarchy

```
Breadcrumb: `My Email Contents` (link) `>` `Templates`      — in a folder: `… > Templates > rimzim`
H2 `Select Template`                                        — in a folder: `Select Template - rimzim`
                                          right-aligned:  `All` (editor-type select) · `NEW TEMPLATE` · `START FROM SCRATCH`
Tab strip: `LIBRARY` | `MY TEMPLATES`
│
├── LIBRARY tab
│     ├── left rail (NOT sticky, scrolls away): H3 `Categories` + `Clear All`
│     │     └── 4 expansion panels: `INDUSTRY` · `AUTOMATED` · `SEASONAL` · `USAGE`
│     │           └── checkbox lists; an active panel shows a blue count chip on its header
│     └── masonry grid (CSS flex columns) of template cards
│           ├── card 1 is always `Blank Template` / `Start from scratch` / `START DESIGNING`
│           └── template cards: thumbnail only; the name appears as a hover overlay
└── MY TEMPLATES tab
      ├── folder panel (same widget as the content list; root is `My Content Templates`)
      └── v-data-table + `Rows per page` footer

`BACK` button (bottom-left of the content area, both tabs) → `/accounts/116000/contents`
```

The header actions (`All`, `NEW TEMPLATE`, `START FROM SCRATCH`) are **rendered only on the
MY TEMPLATES tab**. They disappear on LIBRARY.

## Components used (mapped to the design system)

| Live element | Design-system component | Notes |
|---|---|---|
| Breadcrumb + `Select Template` + right actions | `MpPageHeader` (`backTo`, `#actions`, `#tabs`) | The tab strip belongs in `#tabs` |
| `LIBRARY` / `MY TEMPLATES` | `MpFilterTabs` | Values must go in the URL |
| `Categories` rail | `MpSectionRail` **or** `MpDataTableToolbar` `#filter-content` | Today it is a bare `v-expansion-panels` |
| Category checkbox group | `MpFormField` wrapping a checkbox group | Needs a real group label |
| Template card (thumbnail + hover name) | `MpOptionCard` (`#media` slot) | Today a roleless `<div tabindex="0">` with **no text at all** |
| `Blank Template` card | `MpOptionCard` with a `START DESIGNING` action | |
| MY TEMPLATES table | `v-data-table` under `MpDataTableToolbar` | |
| Row `⋮` | `MpRowActionsMenu` + `MpMenuItem` | |
| `No data available` | `MpEmptyState` | |
| Folder panel | `MpFolderSelect` / `MpSectionRail` + `MpManageFoldersDrawer` | Same widget as page 1 |
| Preview screen | `MpDialog` `fullscreen` | Today a full page navigation |
| `Save Changes?` guard | `MpConfirmDialog` | Copy below |

## All data fields, labels and copy

### Header

| Element | Exact copy |
|---|---|
| Breadcrumb | `My Email Contents` `>` `Templates` (first is a link) |
| Title | `Select Template` (`<h2>`) — with a folder: `Select Template - rimzim` |
| Editor-type filter (MY TEMPLATES only) | value `All`; options `All` · `Drag & Drop` · `WYSIWYG` · `Drag & Drop (Legacy)` |
| Button | `NEW TEMPLATE` (dark filled) → `/content_templates/select_editor` |
| Button | `START FROM SCRATCH` (dark filled) → `/contents/select` |
| Tabs | `LIBRARY` · `MY TEMPLATES` |
| Bottom button | `BACK` (outlined) → `/accounts/116000/contents` |

Note the filter's option list differs from the content list's: it has `Drag & Drop (Legacy)`
(1 template in this account, `test_97`) but not `HTML Code Editor` or `Pull from URL`.

### LIBRARY tab

| Element | Exact copy |
|---|---|
| Rail heading | `Categories` (`<h3>`) |
| Rail action | `Clear All` (grey when nothing is ticked, blue when something is) |
| Facet headers | `INDUSTRY` · `AUTOMATED` · `SEASONAL` · `USAGE` (all `<h5>`) |
| First card | `Blank Template` (`<h3>`) / `Start from scratch` / `START DESIGNING` (dark filled, pencil icon) |
| Template card | *(no text on the card; the name shows only as a hover overlay, e.g. `Easter Home Decor Sale`)* |

**`INDUSTRY` — 25 options, in the order shown:**
`Automotive` · `Beauty & Personal Care` · `Culture` · `E-Commerce` · `Education` ·
`Computer Internet` · `Electronics` · `Fashion` · `Food And Beverage` · `Health And Wellness` ·
`Home Garden` · `Luxury` · `Marketing & Design` · `Media & Entertainment` ·
`News, Blog & Magazines` · `Non Profit` · `Others` · `Pets And Animal Care` · `Photography` ·
`Publishing` · `Manufacturing` · `Small Business` · `Sports` · `Travel` · `Transportation Storage`

**`AUTOMATED` — 8 options:**
`Abandoned Cart` · `Activation` · `Confirmation` · `Notification` · `Discovery` · `Thank You` ·
`Transactional` · `Welcome`

**`SEASONAL` — 20 options:**
`April Fool's Day` · `Back To School` · `Black Friday` · `Christmas` · `Cyber Monday` · `Earth Day` ·
`Easter` · `Fall` · `Fashion Week` · `Father's Day` · `Global Observances & Celebrations` ·
`Holiday` · `Labor Day` · `Mother's Day` · `New Year` · `Seasonal Promotion` · `Spring` ·
`St. Patrick's Day` · `Valentine's Day` · `Winter`

**`USAGE` — 15 options:**
`Animated` · `Business Services` · `Dark Mode` · `Delivery` · `Events` · `Instagram Bio` ·
`Mystery` · `Newsletter` · `Product Launch` · `Product Promotion` · `Re-Engagement` ·
`Service Promotion` · `Survey` · `Teaser` · `Tutorial`

### MY TEMPLATES tab — table columns

| # | Header | Sortable | Cell content |
|---|---|---|---|
| 1 | *(none)* | no | thumbnail image (blank for many rows) |
| 2 | `Name` | yes | text inside an `<a>` **with no `href`** — looks like a link, is not one |
| 3 | `Created By` | **no** | `Yash Gite`, `Avileinnn Kour`, and the malformed `maibam -` |
| 4 | `Editor Type` | **no** | `Drag & Drop` · `WYSIWYG` · `Drag & Drop (Legacy)` |
| 5 | `Updated At` | yes | `Aug 26, 2026 at 04:36 AM` |
| 6 | `Created At` | yes | same format |
| 7 | `Actions` | no | `⋮` |

There is **no selection checkbox column and no bulk bar** on this table — unlike the content list.
Zebra striping is applied to alternate rows (it is not on the content list).

Footer: `Rows per page:` `10 ▾` (5/10/25/50/100) · `1-10 of 60` · `‹` `›`.

### MY TEMPLATES row kebab — exact items, in order

| # | Label | Icon | State | Destination |
|---|---|---|---|---|
| 1 | `Preview Template` | `mdi-eye` | enabled | `/accounts/116000/contents/template/<id>/preview` |
| 2 | `Create New Content` | `mdi-file-document` | enabled | *(JS)* |
| 3 | `Edit Template` | `mdi-pencil` | **disabled on every row observed** | — |
| 4 | `Delete Template` | `mdi-delete` | **disabled on every row observed** | — |

Every item is a `<div tabindex="-1">` with **no `role`** — the entire menu is keyboard-inaccessible.
`Edit Template` and `Delete Template` were disabled on rows owned by `maibam -` **and** by
`Yash Gite`, i.e. on all of them, with no tooltip or message explaining why.

### Folder panel (MY TEMPLATES)

Same widget as page 1: `Always Open` · `+ New Folder` · root `My Content Templates` (wraps to two
lines) · folders `Harpreet_QA` and `rimzim` · per-folder `•••` → `Privacy` (disabled) / `Rename` /
`Delete` (disabled). This is a **second, separate folder tree** from the Email Content one.

### Preview screen

`Preview Template` navigates full-page to `/accounts/116000/contents/template/<id>/preview`:

- Template name as an `<h3>` on the left of a bar.
- Four unlabelled icon buttons on the right: desktop (active), mobile, tablet, and a dark-filled `×`
  that returns to the gallery with `activeTab=mytemplate` correctly restored.
- Renders inside iframes. Merge tags render raw — e.g. `{{contact.first_name }}` (note the stray
  space before `}}`), `{{tracking_link}}`, and bracket placeholders `[Order Number]`, `[Order Date]`,
  `[Your Company Name]`, `support@example.com`.
- No breadcrumb, no `BACK`, no "use this template" action from the preview.

### Unsaved-changes guard (Drag & Drop editor only)

| Element | Exact copy |
|---|---|
| Title | `Save Changes?` |
| Body | `Changes you have made have not been saved. Would you like to save changes.` |
| Footer buttons, in order | `CLOSE WITHOUT SAVING` (outlined) · `SAVE AND CLOSE` (dark filled) |

600 × 184px, no `Cancel` / "keep editing" option.

### Empty state

Same as the content list: `No data available` in a grey centred table row, with `–` as the pagination
label. Reproduced with folder `rimzim` + filter `Drag & Drop (Legacy)`.

## All interactions and behaviours

**Tab switch.** Animated `v-window` slide. The URL does not change. Header actions appear/disappear
with the tab. Filter state is per-tab and is lost on a round trip through an editor.

**Category filter.** Checkboxes, multi-select, and **facets combine with OR, not AND** — ticking
`AUTOMATED > Abandoned Cart` gave 3 results; adding `INDUSTRY > Automotive` gave 4. There is no
explanation of the semantics anywhere on screen. Each facet header gains a blue count chip
(`1`) when it has selections. `Clear All` resets every facet at once.

**Template card click (LIBRARY).** Goes **straight into the Drag & Drop editor** at
`/contents/drag_and_drop_beta?template_id=<slug>&is_new_content=true` (observed slug
`easter-home-decor-sale`). No preview step, no confirmation, no editor choice.

**Template card hover (LIBRARY).** A translucent overlay fades in showing the template name in white
text. That is the only place the name exists — it is not in the DOM as text.

**Grid loading.** ~10 cards render immediately as **blank white rectangles**; thumbnails resolve over
the following 5–13 seconds. More cards load as you scroll (10 → 20 → 30). There is no skeleton, no
placeholder and no aspect-ratio box, so the first impression is a wall of empty boxes.

**Header CTA first-click swallow.** `MY TEMPLATES`, `NEW CONTENT`, `START FROM SCRATCH` and the
editor-type select **all ignore the first click after a page load** and only respond to the second.
Reproduced four separate times on three different controls.

**Drag & Drop editor (reached from a library card).** Breadcrumb
`My Email Contents > Templates > New Email Content`; a `Name *` field; `BACK` · `SAVE` (disabled) ·
`SAVE AND CLOSE` (disabled); tabs `CONTENT` | `FOOTER` | `PREVIEW` | `ADVANCED` |
`CUSTOM ROW CATEGORIES`; a dark strip with `Save as Template` and `👁 Show Structure`; a
desktop/mobile viewport toggle; a right panel with `CONTENT` / `ROWS` / `SETTINGS` and blocks
`TITLE` `PARAGRAPH` `LIST` `IMAGE` `BUTTON` `DIVIDER` (+ more). `SAVE` and `SAVE AND CLOSE` unlock
only once `Name` is filled.

**`BACK` from the Drag & Drop editor** fires the `Save Changes?` guard **even when nothing has been
touched**. `CLOSE WITHOUT SAVING` returns to `/contents/template?folder=` — on the **LIBRARY** tab,
with every category filter reset.

## Accessibility issues observed

1. **Library template cards have no accessible name and no role.** Each is `<div tabindex="0">` with
   no `role`, no `aria-label`, no `title`, and **no text node** — the visible name is painted by a
   hover overlay outside the accessible tree. A screen-reader user tabs through 30 unnamed generics.
2. **Thumbnails are `v-image` background layers, not `<img>`**, so there is no `alt` anywhere in the
   gallery, the layout chooser, or the table's thumbnail column.
3. **The whole MY TEMPLATES row menu is keyboard-inaccessible** — all four items are
   `<div tabindex="-1">` with no `role`. Worse than the content list, where four of six were correct.
4. **Heading order is broken.** `h2 Select Template` → `h3 Categories` → `h5 INDUSTRY`, skipping `h4`;
   `h3 Blank Template` sits as a peer of `h3 Categories`; there is no `h1`.
5. **The `Categories` facets have no group semantics** — four `v-expansion-panel`s of loose
   checkboxes, no `fieldset`/`legend`, no `role="group"`, no `aria-label` naming the facet.
6. **The editor-type select is unlabelled** (same defect as page 1).
7. **The four preview-screen viewport buttons are unlabelled** — no `aria-label`, no `title`.
8. **The hover-overlay name is low contrast** — white text on a pale translucent scrim over a light
   thumbnail; on light templates it is effectively unreadable.
9. **The name in the MY TEMPLATES `Name` cell is an `<a>` with no `href`**, so it is announced as a
   link but is not focusable and does nothing.
10. **Nothing announces the filtered result count.** Applying a category silently changes the grid.
11. **The `Save Changes?` dialog has no "keep editing" escape** — both buttons leave the editor.
12. **First-click swallow is a keyboard problem too** — the same controls need two activations.

## UX friction points worth fixing

1. **Two header CTAs that open the same page.** `NEW CONTENT` and `MY TEMPLATES` both land on
   `/contents/template`, differing only by tab. One control with the gallery as step 1 would do.
2. **`START FROM SCRATCH` on the *template* gallery creates a *content*, not a template.**
   It sits inches from `NEW TEMPLATE`, is styled identically, and produces a different object type.
   The `Blank Template` card's `START DESIGNING` goes to the same place.
3. **Facets combine with OR.** Every tick can only *add* results, so the panel cannot narrow. This is
   the opposite of what a faceted filter is for and is the single most surprising behaviour on the page.
4. **The library has no search and no names.** 30+ designs, identified only by a thumbnail and a
   hover-only title. On touch there is no way to read a name at all.
5. **Clicking a library template drops you straight into the editor.** No full-size preview, no
   "use this template" confirmation. Evaluating three designs means three editor loads and three
   `Save Changes?` dialogs.
6. **The `Categories` rail is not sticky.** Once you scroll to template 20 you have ~2000px of
   scrolling to get back to the filters.
7. **A wall of blank white boxes on load.** No skeleton, no placeholder; the grid looks broken for
   the first 5–13 seconds, and after a category change it looks broken again.
8. **The rightmost grid column is clipped.** The masonry's last column extends ~92px past the
   viewport with no horizontal scroll, so those templates are permanently half-visible.
9. **`Edit Template` and `Delete Template` are dead on every row.** Two of four menu items are
   permanently disabled with no explanation, so the menu is effectively two items.
10. **Two parallel taxonomies.** The library organises by `Categories`; MY TEMPLATES organises by
    folders — and the folder panel stays mounted while you are on the library tab, where it means
    nothing.
11. **Two disconnected folder trees.** `My Contents` (page 1) and `My Content Templates` (page 2) are
    separate, both reached through the same unlabelled edge icon.
12. **`Created By` exists here but not on the content list.** The column users would want in both
    places is in only one.
13. **The guard fires on an untouched template**, teaching users to ignore it — the classic
    cry-wolf dialog. It also offers `SAVE AND CLOSE` when the required `Name` is empty and the
    editor's own `SAVE AND CLOSE` is disabled.
14. **Long template names wrap and break mid-word** in the `Name` column, just as on page 1.
15. **`Editor Type` here vs `Editor type` on page 1**; `Preview Content` vs `Preview Template`;
    `Delete Content Permanently` vs `Delete Template` — near-identical menus with drifting labels.

## Source defects

| # | Defect | Evidence |
|---|---|---|
| D15 | **`Created By` renders as `maibam -`** — a malformed name concatenation leaving a trailing hyphen where the second name part is empty. Three rows. | MY TEMPLATES table |
| D16 | **The masonry grid overflows the viewport with no horizontal scroll.** Last card's right edge is 1778px against a 1686px viewport and a 1686px `document.scrollWidth`. | measured |
| D17 | **10 of 30 library cards render blank for 5–13s**, and at least one never resolved within 13s. No skeleton or placeholder. | measured twice |
| D18 | **All six layout cards on `/content_templates/layouts` render blank for ~10s** before their thumbnails appear. | screenshots |
| D19 | **The `Name` cell in MY TEMPLATES is an `<a>` with no `href`.** | DOM read |
| D20 | **The whole MY TEMPLATES row menu is `<div tabindex="-1">` with no `role`.** | DOM read |
| D21 | **Header CTAs and the editor-type select ignore the first click after page load.** Reproduced on `MY TEMPLATES`, `NEW CONTENT`, `START FROM SCRATCH` and the `All` select. | 4 occurrences |
| D22 | **Tab clicks do not update `activeTab`.** It stays at its load-time value, and a round trip through the editor drops it entirely. | `URLSearchParams` read after each switch |
| D23 | **`folder` is a valueless query key** on every generated URL and never receives an id, even with a folder selected. | `URLSearchParams` read |
| D24 | **The unsaved-changes guard fires on a template that was only opened**, never edited. | `BACK` immediately after load |
| D25 | **The guard's `SAVE AND CLOSE` is enabled while the editor's own `SAVE AND CLOSE` is disabled** (required `Name` empty). | both measured in the same state |
| D26 | **Guard body copy ends in a full stop where it asks a question**: `Would you like to save changes.` | exact string |
| D27 | **`BACK` in the WYSIWYG *template* editor shows no guard at all**, while `BACK` in the Drag & Drop editor always does. Two guard behaviours in one module. | both exercised |
| D28 | **The `Dark Mode` usage facet returns light-background templates** (a white "Easter Sale", a white "Quartz", a white "Father's Day Sale"). Category tagging is wrong. | screenshot of the filtered grid |
| D29 | **`INDUSTRY` option list is neither alphabetical nor consistently styled** — `Manufacturing` sits between `Publishing` and `Small Business`; `Beauty & Personal Care` and `Marketing & Design` use `&` while `Food And Beverage` and `Pets And Animal Care` spell out a capitalised `And`; `Home Garden`, `Computer Internet` and `Transportation Storage` are missing their conjunction entirely; `Non Profit` is unhyphenated. | full option list |
| D30 | **Escape does not close the row action menu** — repeated Escape + open left two `.v-menu__content` panels active at once. | DOM read |
| D31 | **Preview merge tags render with a stray space**: `{{contact.first_name }}`. | preview screen |
| D32 | **Editor merge-tag dropdown labels are truncated** in the WYSIWYG toolbar: `Web Funnel T…`, `Product Feed …`, `Abandoned C…`. | screenshot |

No JavaScript console errors were captured on this page.

## Unverified

| Item | Reason |
|---|---|
| `Edit Template` / `Delete Template` | Disabled for this user on every row. |
| `Create New Content` (row kebab) | Would create a live record. |
| `NEW TEMPLATE` full flow past the layout chooser | Picking a layout opens the template editor; saving would create a record. The chooser itself was fully captured. |
| `SAVE`, `SAVE AND CLOSE`, `Save as Template` in either editor | Destructive/creating. |
| `CREATE` on the template folder panel | Creates a live folder. |
| `Always Open` switch | Persisted preference toggle; the brief forbids toggles. |
| **LIBRARY empty state** | **Unreachable.** Facets are OR-combined, so adding filters can only increase the result count; no combination of category ticks can produce zero. The table empty state (`No data available`) was captured on the MY TEMPLATES tab instead. |
| Whether the library grid paginates or is pure infinite scroll | Card count grew 10 → 20 → 30 on scroll; no footer or "load more" was seen, but the end of the list was not reached. |
| Sort click behaviour on `Name` / `Updated At` / `Created At` | Not exercised. |
| What `Privacy` on a folder does | Disabled and unfocusable. |

---

# 3. `/accounts/116000/content_templates/select_editor` — Editor chooser

## Page purpose & primary user task

A single-question gate: *which builder do you want to author this template in?* It is the first step
of `NEW TEMPLATE` and does nothing else.

**There are two near-identical choosers in this module, and only one of them is this URL:**

| URL | Title | Options | Reached from |
|---|---|---|---|
| `/accounts/116000/content_templates/select_editor` | `Create New Email Content Template` | **2** | `NEW TEMPLATE` on the gallery |
| `/accounts/116000/contents/select` | `Create New Email Content` | **4** | `START FROM SCRATCH` on the gallery · `START DESIGNING` on the Blank Template card |

They are visually identical — same layout, same card design, same `BACK` — and their titles differ by
one word. Nothing on either page tells you which object you are about to create.

## Layout structure and hierarchy

```
Breadcrumb: `My Email Contents` (link) `>` `My Templates` (link) `>` `Select Builder`
            (the 4-option sibling reads `My Email Contents > Templates > Select Builder`)
H4 (centred)  `Create New Email Content Template`
subtitle      `Select editor type for your new email content template.`
centred card row — 2 cards (4 in a 2×2 grid on the sibling page)
`BACK` (outlined, centred)
```

No sidebar rail, no toolbar, no filters, no table. The whole page is one centred column.

## Components used

| Live element | Design-system component |
|---|---|
| Breadcrumb + title + subtitle | `MpPageHeader` (`backTo`, `subtitle`, `emphasis="prominent"`) |
| Editor cards | `MpOptionCard` (`title`, `icon`; `description` is missing today) |
| The step itself | `MpWizardSteps` — this is step 1 of a 2–3 step wizard and never says so |
| `BACK` | `MpPageHeader` `backTo` / a `#footerStart` action |

## All data fields, labels and copy

### `/content_templates/select_editor` — the template chooser (2 options)

| Element | Exact copy |
|---|---|
| Breadcrumb | `My Email Contents` `>` `My Templates` `>` `Select Builder` |
| Title | `Create New Email Content Template` (`<h4>`) |
| Subtitle | `Select editor type for your new email content template.` |
| Card 1 | `Drag & Drop` (`<h5>`) — icon: a wireframe layout with an image block and a cursor |
| Card 2 | `WYSIWYG` (`<h5>`) — icon: a browser window with a formatting toolbar and text lines |
| Button | `BACK` |

### `/contents/select` — the content chooser (4 options)

| Element | Exact copy |
|---|---|
| Breadcrumb | `My Email Contents` `>` `Templates` `>` `Select Builder` |
| Title | `Create New Email Content` (`<h4>`) |
| Subtitle | `Select editor type for your new email content.` |
| Card 1 | `Drag & Drop` — wireframe layout + image block + cursor |
| Card 2 | `WYSIWYG` — browser window + formatting toolbar + text lines |
| Card 3 | `HTML Code Editor` — browser window containing `</>` |
| Card 4 | `Pull from URL` — browser window containing a chain-link |
| Button | `BACK` |

**No card carries a description.** `Pull from URL` in particular is unexplained.

### Where each option leads

| Chooser | Option | Destination |
|---|---|---|
| `select_editor` (template) | `Drag & Drop` | `/accounts/116000/content_templates/layouts` — **an extra layout step** |
| `select_editor` (template) | `WYSIWYG` | `/accounts/116000/content_templates/new?is_new_content=true` — **straight to the editor** |
| `contents/select` (content) | `Drag & Drop` | *(not executed — see Unverified)* |
| `contents/select` | `WYSIWYG` / `HTML Code Editor` / `Pull from URL` | *(not executed)* |
| `select_editor` / `contents/select` | `BACK` | back to the gallery, `activeTab` and `folder` restored |

### `/content_templates/layouts` — the layout step (Drag & Drop only)

| Element | Exact copy |
|---|---|
| Breadcrumb | `My Email Contents` `>` `My Templates` `>` `Select Builder` `>` `Layout` |
| Title | `Choose Layout` (`<h4>`) |
| Subtitle | `Choose a preferred layout for your new email content template` *(no full stop — the previous step's subtitle has one)* |
| Cards (`<h5>`, in order) | `Basic Template` · `Template Image Left` · `Template Image Right` · `Template With Header` · `Grid Template` · `Blank Template` |
| Button | `BACK` |

All six cards are `<div tabindex="0">` with no `role` and no `aria-label`. Thumbnails render blank
for ~10 seconds.

### The WYSIWYG template editor (the end of the WYSIWYG branch)

`/accounts/116000/content_templates/new?is_new_content=true`

- Breadcrumb `My Email Contents > My Templates > New Email Template`.
- `Name *` field; `BACK` · `SAVE` (disabled) · `SAVE AND CLOSE` (disabled).
- Tabs `CONTENT` | `HTML SOURCE CODE` | `PERMISSIONS` — a **different tab set** from the Drag & Drop
  editor (`CONTENT` | `FOOTER` | `PREVIEW` | `ADVANCED` | `CUSTOM ROW CATEGORIES`).
- Left panel: a `Tag Name` field, an `Images` heading, a `Search Image` field, and an image folder
  tree (`Harpreet_QA`, `Manny`, `uday_sqa`) with files such as `136-200x300.jpg`.
- Right: CKEditor 4 with merge-tag dropdowns `Campaign Tags` · `Contact Tags` · `Other Tags` ·
  `Dynamic Content` · `Dynamic Areas` · `Table Tags` · `Template Tags` · `Web Funnel T…` ·
  `Coupon Tags` · `Product Feed …` · `Abandoned C…`.

## All interactions and behaviours

**Card hover / focus.** A 2px blue border appears around the card and a small blue particle burst
animates behind the icon. It is a clear, well-executed affordance — the best interaction detail in
the module.

**Card click.** Immediate navigation; there is no "selected" state and no `Continue` button, so the
choice is committed on the first click with no way to change your mind except `BACK`.

**`BACK`.** Returns to the gallery with `activeTab` and `folder` restored.

**Branch depth is asymmetric.** `Drag & Drop` inserts a layout step; `WYSIWYG` does not. Neither the
breadcrumb nor any step indicator warns you that one path is longer than the other.

## Accessibility issues observed

1. **No `h1`, and the page starts at `h4`.** `h4` title, `h5` card titles.
2. **The option cards are `<div tabindex="0">` with no `role` and no accessible name.** A screen
   reader announces a focusable generic; the visible label is a sibling `<h5>` that is never
   associated with it. They should be `role="radio"` in a `radiogroup`, or real buttons/links.
3. **The icons are CSS background images**, so there is no `alt` and no decorative marking either.
4. **No `aria-current` / step semantics.** This is step 1 of 2–3 and nothing says so.
5. **No card descriptions**, so the accessible name is a bare product term (`WYSIWYG`,
   `Pull from URL`) with no explanation for anyone.
6. **The layout chooser repeats every one of these problems.**

## UX friction points worth fixing

1. **Two indistinguishable choosers.** `Create New Email Content Template` and
   `Create New Email Content` differ by one word, look identical, and produce different object types.
2. **The two choosers offer different option sets** — 2 vs 4 — with no explanation of why a template
   cannot be an `HTML Code Editor` or `Pull from URL` type even though content records of both types
   exist and appear in the content list's own filter.
3. **No descriptions on the cards.** `Pull from URL` and `WYSIWYG` are jargon; a first-time user has
   to click to find out, and clicking is a one-way navigation.
4. **No step indicator.** `Select Builder` → `Layout` → editor is a 3-step wizard presented as three
   unrelated pages. `MpWizardSteps` would fix it outright.
5. **Asymmetric branch depth** (Drag & Drop gets a layout step, WYSIWYG does not) with no warning.
6. **The choice is committed on click.** No select-then-continue, no visible selected state.
7. **The layout names are opaque.** `Basic Template` vs `Grid Template` vs `Template With Header`
   means nothing without the thumbnail, and the thumbnail is blank for the first ~10 seconds.
8. **Three words for one concept** — the URL says `select_editor`, the breadcrumb says
   `Select Builder`, the subtitle says `editor type`. Pick one.
9. **A whole page for a two-option question.** This could be a step inside the gallery, or an
   `MpDialog`, instead of a full navigation the user must `BACK` out of.

## Source defects

| # | Defect | Evidence |
|---|---|---|
| D33 | **Heading hierarchy starts at `h4`**; no `h1`, `h2` or `h3` on the page. | DOM read of both choosers |
| D34 | **Option cards are roleless `<div tabindex="0">` with no accessible name.** | DOM read |
| D35 | **Subtitle punctuation is inconsistent between consecutive wizard steps** — `Select editor type for your new email content template.` (full stop) then `Choose a preferred layout for your new email content template` (none). | exact strings |
| D36 | **`Select Builder` (breadcrumb) vs `select_editor` (URL) vs `editor type` (subtitle)** for the same concept. | all three |
| D37 | **The layout chooser's six thumbnails render blank for ~10 seconds** with no placeholder. | screenshots |
| D38 | **The template chooser omits `HTML Code Editor` and `Pull from URL`**, which the content chooser offers and which existing content records use. | both option lists |
| D39 | **The Drag & Drop and WYSIWYG editors expose different tab sets** for the same object type (`FOOTER`/`PREVIEW`/`ADVANCED`/`CUSTOM ROW CATEGORIES` vs `HTML SOURCE CODE`/`PERMISSIONS`), so `PERMISSIONS` is unreachable for a Drag & Drop template and `PREVIEW` is unreachable for a WYSIWYG one. | both editors |

No JavaScript console errors were captured on this page.

## Unverified

| Item | Reason |
|---|---|
| Any option on `/contents/select` | Each opens an editor for a **new content** record; the two template-side branches were followed instead, which cover the same two editors. |
| Picking a layout on `/content_templates/layouts` | Opens the template editor with that layout; the next action would be a save. |
| `SAVE` / `SAVE AND CLOSE` / `Save as Template` in either editor | Creating/destructive. |
| `PERMISSIONS` tab contents in the WYSIWYG template editor | Not opened — it is a permission-granting surface and toggling anything there is out of bounds. |
| Whether the `Drag & Drop` card on `/contents/select` also inserts a layout step | Not executed; the template-side equivalent does. |
| Validation messaging on an empty `Name` | `SAVE` is disabled rather than validated, so no error copy was reachable without typing and submitting. |

---

# Appendix A — adjacent surfaces the header actions lead into

These are outside the three URLs in scope but are the immediate destinations of in-scope actions, so
the rebuild needs their shapes.

## `/accounts/116000/contents/<id>` — content detail

Reached by **clicking a row's `Name`** *and* by `Preview Content` in the row kebab
(`/contents/<id>/preview` **redirects** here — the `/preview` suffix is redundant).

| Element | Exact copy |
|---|---|
| Breadcrumb | `My Email Contents` (link) `>` `STO test content` + a chain/link icon |
| Title | `STO test content` (`<h2>`) |
| Header buttons | `EDIT` (outlined) · `SEND CAMPAIGN` (outlined) |
| Tabs | `PREVIEW` (active) · `STATISTICS` |
| Left card 1 | `Select User` (`<h4>`) + ⓘ · radios `Contact` / `List` · field `Search by Email/UID` with a magnifier |
| Left card 2 | `Content Size & Score` (`<h4>`) · `Score:` + a green `Excellent` chip · `Size:` `5.37 KB` · green box: `Your email content size is excellent! It is well within the optimal limit, ensuring fast…` |
| Right | `Preview` (`<h4>`) + `RENDER PREVIEW` (dark filled) + the rendered body |

Merge tags render unresolved in the preview until `RENDER PREVIEW` is used with a selected contact
(e.g. `Hi {{contact.email}}  test test` — note the double space).

Map to: `MpPageHeader` + `MpFilterTabs` + two `MpKpiCard`-adjacent panels (`MpSectionHeader` +
content) + `MpStatusChip` for the score.

## `/accounts/116000/campaigns/content/<id>` — campaign from content

Reached by `Create a Campaign` in the row kebab.

| Element | Exact copy |
|---|---|
| Breadcrumb | `Campaign` (link) `>` `New Email Campaign` — **the Email Content context is dropped** |
| Stepper | `1` `2` `3` `4` (a real, visible step indicator) |
| Step 1 title | `Campaign Details` (`<h2>`) · `Enter the details of your campaign.` |
| Fields | `Campaign Name *` (hint `You cannot use emojis in this field.`) · `Subject *` (emoji picker) · `Preheader` (emoji picker + ⓘ, counter `0 / 100`) · `Select Campaign tag` (+ ⓘ) |
| Banner | ⓘ `Campaign is in draft mode, please Save on Step 2.` |
| Remaining step headings | `Contacts` · `Add Suppress Contacts` · `Content` · `Spam Check` · `Schedule` · `Send Test Email` · `Review` |

Worth noting for the rebuild: **this wizard has a proper stepper while the content/template creation
wizard has none**, despite the latter being 2–3 steps deep with an asymmetric branch. The pattern
already exists in the product; Email Content just does not use it.

## `/accounts/116000/archive?filter=contents` — Archives

See §1, `VIEW ARCHIVES`. Breadcrumb `Settings > Archives`, title `Archives` (`<h2>`), an archive-type
select (`Campaign Tag` · `Contact List` · `Segment` · `Content` · `Dynamic Content`), and the empty
state `You have no archived items.` / `Archive outdated content or campaigns to keep your workspace
up-to-date.`

---

# Appendix B — console output

No JavaScript **errors** or uncaught exceptions were captured on any of the three pages across a full
crawl. Two things in the log are still worth recording:

| # | Observation | Message |
|---|---|---|
| D40 | **The legacy app ships to UAT in Vue development mode.** | `You are running Vue in development mode.` `Make sure to turn on production mode when deploying for production.` (from `legacymmc/js/src_routeAccessMap_js.js`) |
| D41 | **Lifecycle hooks are registered outside a component instance**, twice on every page load. | `[Vue warn]: onMounted is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.` — and the identical warning for `onUnmounted` (from `chunk-vendors.js`) |

A service worker is registered on load (`Service Worker registered: ServiceWorkerRegistration`),
which is likely part of why the first click on a freshly loaded header CTA is swallowed (D21) —
though the exact cause was not traced.

---

# Appendix C — defect index

| ID | Page | One-line summary |
|---|---|---|
| D1 | list | Page `<h2>` uses `word-break: break-all` and splits folder names mid-word |
| D2 | list | `Archive Content` / `Delete Content Permanently` are roleless `<div tabindex="-1">` — keyboard-inaccessible |
| D3 | list | Bulk-delete button has no accessible name |
| D4 | list | Editor-type select has no label |
| D5 | list | Duplicate anchor with empty `href` in the `Name` cell |
| D6 | list | `.text-ellipsis` does not truncate; long names wrap and break mid-word |
| D7 | list | `36 characters maximum` hint not enforced by the input |
| D8 | list | `VIEW ARCHIVES` lands on a `Settings`-parented page with no way back |
| D9 | list | Opening the folder panel permanently collapses the global sidebar to a rail |
| D10 | list | No page state (folder / filter / sort / page) is in the URL |
| D11 | list | `aria-sort` is `none` on every header including the sorted one |
| D12 | list | Empty pagination label is a bare en dash `–` |
| D13 | both | `Editor type` vs `Editor Type` — inconsistent header casing |
| D14 | list | `Actions` header is `text-left` while its cells are right-aligned |
| D15 | gallery | `Created By` renders as `maibam -` |
| D16 | gallery | Masonry grid overflows the viewport by ~92px with no horizontal scroll |
| D17 | gallery | 10 of 30 library cards blank for 5–13s; at least one never resolved |
| D18 | chooser | All six layout thumbnails blank for ~10s |
| D19 | gallery | `Name` cell is an `<a>` with no `href` |
| D20 | gallery | The whole MY TEMPLATES row menu is roleless `<div tabindex="-1">` |
| D21 | all | Header CTAs and selects ignore the first click after page load |
| D22 | gallery | Tab clicks do not update `activeTab`; a round trip drops it |
| D23 | gallery | `folder` is a valueless query key that never receives an id |
| D24 | gallery | Unsaved-changes guard fires on an untouched template |
| D25 | gallery | Guard's `SAVE AND CLOSE` is enabled while the editor's own is disabled |
| D26 | gallery | Guard body copy ends in a full stop where it asks a question |
| D27 | gallery | `BACK` guards in the D&D editor but never in the WYSIWYG template editor |
| D28 | gallery | `Dark Mode` facet returns light-background templates |
| D29 | gallery | `INDUSTRY` list is unsorted and inconsistently styled |
| D30 | gallery | Escape does not close the row action menu; menus stack |
| D31 | gallery | Preview merge tags render with a stray space: `{{contact.first_name }}` |
| D32 | gallery | WYSIWYG merge-tag dropdown labels are truncated |
| D33 | chooser | Heading hierarchy starts at `<h4>`; no `h1`/`h2`/`h3` |
| D34 | chooser | Option cards are roleless `<div tabindex="0">` with no accessible name |
| D35 | chooser | Subtitle punctuation differs between consecutive wizard steps |
| D36 | chooser | `Select Builder` vs `select_editor` vs `editor type` for one concept |
| D37 | chooser | Layout thumbnails blank for ~10s with no placeholder |
| D38 | chooser | Template chooser omits `HTML Code Editor` and `Pull from URL` |
| D39 | chooser | D&D and WYSIWYG editors expose different tab sets for the same object |
| D40 | all | Legacy app ships to UAT in Vue development mode |
| D41 | all | `onMounted` / `onUnmounted` registered outside a component instance |
