# AUDIT — SQL Queries (Relational Queries)

**Source:** `https://uat.maropost.com/accounts/116000/relational_queries`
**Crawled:** 2026-08-28 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session
**Legacy stack:** **Vuetify 2** (`v-menu__content`, `theme--light`, `v-input--selection-controls`),
MDI icons, Roboto body / Montserrat headings.

> Crawl method: full read-only interaction sweep — sorting (all six headers), pagination, row hover,
> the kebab menu, bulk selection, the folder drawer including its inline New Folder form, and the
> create **and** edit dialogs with every field and both option sets exercised. **Nothing was
> created, executed, exported or deleted.** See "Unverified" at the bottom — it is long, because
> every remaining path is a write.

---

## 1. Page purpose and primary user task

A **manager for saved SQL statements that move data between relational tables inside the CDP.**
The product's own definition, verbatim from the create dialog:

> "SQL Queries are used for moving data out from relational tables and into other relational tables.
> To learn more, see **SQL Queries**"

A "relational query" is therefore **a named, saved SQL statement + one or more destination
("Target") relational tables + a load mode (Overwrite / Append)**. Executing it runs the SQL and
pushes the resulting rows into the target table(s). The `Records` column is the row count produced
by the last run.

**Primary task:** find a saved query and run it. **Secondary:** create/edit one; organise into folders.

**IA position:** CDP → SQL Queries (siblings: All Contacts, Contact Lists, Segments, Contact Fields,
Contact Tags, **Relational Tables**, SQL Queries, Secure Lists). Note this maps to the sandbox's
`SQLQueries.vue`, **not** `RelationalTables.vue`.

**Nomenclature drift — five names for one object on one screen:** URL and `<title>` say
*Relational Queries* · left nav and `H2` say *SQL Queries* · breadcrumb says *My SQL Queries* ·
folder-tree root says *My Sql Queries* · the internal model says `relational_query` with
`multipleQueries: "relational_querie"` (a pluralisation bug in the source string).

---

## 2. Layout structure and hierarchy

```
AppBar (global) + dark left nav
└ Content column
  ├ Folder-drawer toggle    icon-only, floating far-left above the masthead   tooltip "Open Folders"
  │                         → opening it collapses the global nav to an icon rail + 250px folder panel
  ├ Breadcrumb   ul.v-breadcrumbs   "My SQL Queries"            ← not a <nav>, no aria-label
  │              in a folder: "My SQL Queries › Harpreet_qa queries" (first crumb is a link)
  ├ Masthead     h2 "SQL Queries"                    [NEW QUERY]
  │              in a folder the h2 becomes "SQL Queries - Harpreet_qa queries"
  ├ Table sheet  white, no visible border/shadow, full-bleed right
  │              ⚠ NO TOOLBAR — no search, no filters, no tabs, no column chooser
  ├ <table>      real thead / th[scope=col] semantics
  └ Footer       Rows per page: [10 ▾]   1-10 of 10   ‹  ›
```

**Every heading in the document: exactly one — `H2 "SQL Queries"`. There is no `<h1>`.** The
create/edit modal introduces an `H4`, so document order is h2 → h4.

**Selection mode swaps the masthead:** `NEW QUERY` is *replaced* by a circular trash icon-button
(tooltip "Delete") + `✕ 1 selected`.

---

## 3. Component inventory → design-system mapping

| Legacy element | Marobase equivalent |
|---|---|
| Breadcrumb + H2 + right-hand action | `MpPageHeader` |
| Folder drawer (toggle, "Always Open" switch, inline New Folder form, tree with per-node `•••`) | `MpFolderSelect` + `MpManageFoldersDrawer` — but this is a **left slide-in that squeezes the global nav to a rail**, closer to `MpSectionRail` |
| Data table w/ hover-revealed select + drag grip | `v-data-table` + `MpDataTableToolbar` (**which this page lacks entirely**) |
| Row kebab (4 items) | `MpRowActionsMenu` |
| Selection bar (count + trash + clear) | `MpFloatingBulkBar` — here inline in the masthead, not floating |
| "No data available" row | should be `MpEmptyState`; currently a bare `<td colspan>` |
| Create/Edit modal, **670px, 4px radius** | `MpDialog` `size="md"` — **not** a drawer |
| 4 stacked form controls | `MpFormGrid :cols="1"` + Vuetify fields |
| 2px blue linear progress under `<thead>` | loading state; `MpTableSkeleton` not used |

**Sandbox divergence:** the existing `SQLQueries.vue` renders this as an `MpFormDrawer size="lg"`.
The source is a centred 670px dialog. The sandbox also has no folders, no drag-to-move, no
Execute, and no Export. See PARITY.

---

## 4. List / table spec

**Columns, verbatim and in order** (from the live `headers` model):

| # | Header | `value` | Align | Width | Sortable |
|---|---|---|---|---|---|
| 0 | *(empty)* | `none` | left | 60px | no — select-all checkbox + drag grip |
| 1 | `Name` | `name` | left | 610px | yes |
| 2 | `Records` | `rows_count` | **right** | 120px | yes — `currency` filter (thousands separator) |
| 3 | `Created At` | `created_at` | left | 230px | yes — `dateTime` |
| 4 | `Updated At` | `updated_at` | left | 230px | yes — `dateTime` |
| 5 | `Actions` | `action` | left | 85px | no |

- **Sorting is server-side and correctly wired for a11y.** `aria-sort` is present on every `<th>`
  and cycles `none → ascending → descending → none` (3-state; the third click returns to API
  default). Verified request:
  `GET …/v2/116000/relational_queries.json?page=1&per_page=10&method=name&sort_by=asc`.
  During the ~1–3s round-trip a 2px blue bar appears under the header, labels dim, and **stale rows
  stay on screen** — both the old and new sort arrows are briefly visible at once.
- **Row shape:** Name (an `<a>` with **`href=null` and no click handler** — clicking does nothing),
  right-aligned integer Records (blank when null), two absolute datetimes formatted
  `MMM DD, YYYY at HH:MM AM/PM`, kebab.
- **Row hover reveals two controls** that are `opacity: 0` at rest: a 6-dot **drag grip**
  (`cursor: grab`) and a **selection checkbox**. Rows drag onto folders; the drag label reads
  `Move Relational Query <name>`.
- **Row actions** (verbatim, 4): `Execute Query` (`mdi-play-circle`) · `Export Query`
  (`mdi-application-export`) · `Edit Query` (`mdi-pencil`) · `Delete Query` (`mdi-delete`).
- **Bulk selection:** header checkbox with an indeterminate state. On selection the masthead shows
  `1 selected` + `✕` + **one** bulk action: trash. No bulk move-to-folder, execute, or export.
- **Pagination:** `Rows per page:` **5 / 10 / 25 / 50 / 100** (default 10) · `1-10 of 10`
  (renders `–` when empty) · `‹` `›` correctly `aria-label`led and disabled on a single page.
  **Total count exists only in that range label.**
- **Search / filters: none.** No search box, no status filter, no date filter, no tabs. The
  component carries an unused `searchString: ""`. The only narrowing mechanism is the folder tree.

### Folder drawer
- `Always Open` — a switch (off by default) that pins the drawer.
- `+ New Folder` — swaps the button for an **inline** form (not a modal): text field labelled
  `New Folder Name`, hint `36 characters maximum`, buttons `CREATE` (filled) / `Close` (outlined).
- Tree: root `My Sql Queries` → child `Harpreet_qa queries`.
- Per-folder `•••` (hover-revealed): `Privacy` *(disabled)* · `Rename` *(enabled)* ·
  `Delete` *(disabled)*. Tooltip explains why:
  **"You can view and rename the folder, only owner can delete it"**.

---

## 5. Create flow (verbatim)

`NEW QUERY` → **centred modal, 670px, 4px radius.** Not a page, not a drawer.

- Title: `H4 "New Query"`
- Body copy: *"SQL Queries are used for moving data out from relational tables and into other
  relational tables. To learn more, see SQL Queries"* (last two words link to
  `support.maropost.com/hc/en-us/articles/360015582794-SQL-Queries-`, `target=_blank`)

Four controls, all outlined, stacked single-column, floating labels, required marked by a trailing ` *`:

| # | Label | Control | Maxlength | Default |
|---|---|---|---|---|
| 1 | `Name *` | text | **none** — 300 chars accepted | empty |
| 2 | `Targets * (0)` | multi-select autocomplete w/ checkboxes + chips | — | empty — count updates live → `Targets * (1)`; `✕` clear-all appears once dirty |
| 3 | `Update Type *` | single select, readonly | — | **renders blank** though the model default is `overwrite`. An `(i)` icon sits *outside* the field |
| 4 | `Query *` | `<textarea rows=4>` | **none** — 5000 chars accepted | empty |

Footer, right-aligned: `CANCEL` then `CREATE` (**disabled** until all four are valid).

### `Update Type` — complete option set, verbatim (2)
- `Overwrite - Overwrites the existing data present in the target table.` → `overwrite`
- `Append - Appends the existing data present in the target table.` → `append`

**`(i)` tooltip, verbatim:**
> "Overwrite: Truncates the data in the table before loading the data from this SQL Query.
> Append: Leaves existing data in the table and adds the data from this SQL Query."

### `Targets` picker
First option is `All Targets` (select-all), then every relational table alphabetically.
**Lazily paged 20 at a time on scroll** (21 → 41 → 61 → 81 → 101…). Typing filters as a
case-insensitive substring with the match highlighted. **The menu is clipped to roughly three
visible rows** even though its content box is ~1000px tall — a real layout bug. 101 options were
loaded before the crawl stopped; the API exposes no total. Representative names:
`api_event_table_testing`, `aug_sktable`, `av_test`, `benchmark_contacts`, `customer_database`,
`email_table`, `har_table1`, `maropost_users`, `rt11754996906544`, `r_table1751525262863`,
`sendabletable`, `sk_table`, `table_multi_columns`, `uid_uat_testing_116000_email`, `ub1_copy1`,
`uday_test_copy`.

### Validation rules (extracted from the live rule functions)

| Field | Empty → | Whitespace-only → | Long value → |
|---|---|---|---|
| Name | `Query name is required` | `Name cannot be blank` | no limit (300 chars pass) |
| Targets | `Target is required` | — | — |
| Update Type | `Update Type is required` | — | — |
| Query | `Query is required` | `Query cannot be blank` | no limit (5000 chars pass) |

Error styling: border + message in `#B00020`.

**Bug — the same strings render in brand blue as "hints" before a field is touched, and stay
visible after it is filled.** `Query is required` sat, in `rgb(0,107,175)`, beneath a Query field
already containing `SELECT email, first_name FROM contacts LIMIT 10`. A valid field looks like it
has an outstanding requirement, and **colour alone** distinguishes hint from error.

**Gating (tested by typing then clearing):** `CREATE` enables only when Name, ≥1 Target, Update Type
and Query are all non-blank; blanking Name or Query disables it again.

`Escape` closes the dialog immediately with **no unsaved-changes guard.**

**Submitted model:** `{ name, target_ids: number[], update_type: 'overwrite'|'append', query }`

---

## 6. Query editor spec

**There is no query editor — it is a bare `<textarea>`.**

- `rows=4`, rendered 87px tall, `resize: vertical` is the only way to get more space
- font `Roboto, sans-serif` **16px — not monospace**
- `spellcheck` is **on**, so SQL keywords get red squiggles
- **zero** CodeMirror / Monaco / Ace / CM6 instances on the page (verified by DOM query)
- no line numbers, no syntax highlighting, no bracket matching, no autocomplete, no formatter
- **no schema or table browser** — the author must already know table and column names. The Targets
  picker lists table names but only as *destinations*, and is unreachable from inside the query field
- **no Validate / Test / Run / Preview / Explain affordance in the dialog** — you save blind, then
  run from the list's kebab
- no row-limit control, no scheduling, no join builder, no visual query builder

---

## 7. Edit flow

Kebab → `Edit Query` opens **the identical dialog**, with three differences:

1. Title is `Edit Query`.
2. Primary button reads `CONFIRM`, not `CREATE`.
3. **`CONFIRM` is enabled on open** — there is no dirty check, so an untouched record can be re-submitted.

Everything else is shared. Prefilled example (`testsq`): Name `testsq`, `Targets * (1)` with chip
`av_test`, Update Type `Overwrite - …`, Query `Select * from dev_test`.

**There is no read-only detail view — Edit is the only way to see a query's SQL**, and the row name
is a dead link.

---

## 8. States observed

| State | How reached | Copy / appearance |
|---|---|---|
| Default | load | 10 rows, `1-10 of 10` |
| Loading | click a sortable header | 2px blue bar under `<thead>`, labels dimmed, **previous rows still rendered** |
| Empty | select the `Harpreet_qa queries` folder | one full-width row, centred grey **"No data available"**. No icon, no description, **no CTA**. (Unreachable via search — there is no search) |
| Validation error | clear Name / Targets / Query | red border + `#B00020` message; primary button disabled |
| Validation error (folder) | 41 chars in New Folder Name | red border, **"You've exceeded maximum character count"** replacing the hint — but `CREATE` stays **enabled** |
| Disabled | `CREATE` on empty form · pagination arrows on a single page · folder `Privacy` and `Delete` | greyed |
| Selection | tick a row | `🗑 ✕ 1 selected` replaces `NEW QUERY` |
| Tooltips | hover | `Open Folders` · `Delete` · `You can view and rename the folder, only owner can delete it` · the Update Type `(i)` copy · full-name tooltip on truncated names |
| **Query status badges** | — | **none exist.** The API returns `failed_at` on every record (null for all 10 here) but the table renders no Success / Failed / Running indicator |
| Toasts | — | not observed — every path to one is a write |

---

## 9. Accessibility findings

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | High | **No `<h1>`.** The document contains exactly one heading, `H2 "SQL Queries"`; the modal then jumps to `H4`. | 1.3.1 / 2.4.6 |
| A2 | **Critical** | **Every icon-only button in the content area has no accessible name** — the folder toggle and all ten row kebabs return `aria-label=NONE, title=none`. Only the pagination arrows are labelled; the bulk trash relies on a visual-only tooltip. | 4.1.2 |
| A3 | **Critical** | **Row checkboxes are focusable but invisible and unlabelled.** The wrapper computes `opacity: 0` at rest, yet the `<input type=checkbox>` has `tabIndex: 0` and no `aria-label`. A keyboard user tabs into an invisible, unnamed control on every row. Same for the drag grip. | 2.4.7, 4.1.2 |
| A4 | **Critical** | **The modal is not a dialog.** `.v-dialog` has `role=null`, `aria-modal=null`, `aria-labelledby=null`, `tabindex=null`; the overlay carries `role="document"`. No modal boundary, no accessible name. | 4.1.2 |
| A5 | Medium | **No breadcrumb landmark** — bare `<ul>`, no `<nav>`, no `aria-label`. | 1.3.1 |
| A6 | Medium | **Required state is colour + a trailing `*` only.** No `aria-required` on the Targets or Update Type composites, and the "… is required" strings render blue-as-hint / red-as-error — **colour alone** carries the distinction. | 1.4.1, 3.3.2 |
| A7 | Medium | **Stale messaging** — `Query is required` remained rendered under a populated field. A screen-reader user hears a requirement that no longer applies. | 3.3.1 |
| A8 | Medium | **Drag-to-move has no keyboard equivalent.** Moving a query between folders is drag-only; the kebab has no "Move to folder". | 2.1.1 |
| A9 | Medium | **Loading is announced only visually** — the table is not `aria-busy` and rows silently swap. | 4.1.3 |

**Worth keeping:** real `<table>` / `<thead>` / `<th scope="col">` semantics, **correct `aria-sort`
on all six headers** (the best a11y behaviour found on any page in this crawl), `<html lang="en">`,
and `role="combobox"` / `role="option"` on the Targets picker.

---

## 10. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| F1 | **No search.** Ten rows is fine; 200 saved queries is not. The component even ships an unused `searchString`. | Highest-value gap. |
| F2 | **No status column.** `failed_at` is in the payload and never shown. `Records: 0` is ambiguous between "ran, returned nothing" and "never ran". | You cannot tell a broken query from an empty one. |
| F3 | **The row name is a dead link.** Users click it expecting to open the query; nothing happens. The only way in is kebab → Edit. | |
| F4 | **No preview / test / dry-run.** You author SQL blind in a 4-row textarea, save, then `Execute Query` — which, on `Overwrite`, **truncates the target table**. | Destructive by default with zero rehearsal path. The most serious issue on the page. |
| F5 | **The Targets dropdown is clipped to ~3 rows** while its content box is ~1000px tall, and it does not reset scroll after filtering. | |
| F6 | **Targets loads 20 at a time on scroll with no total**, so "is my table in here?" needs many scrolls or an exact name. | |
| F7 | **Plain textarea for SQL** — sans-serif 16px, spellcheck on, no highlighting, no line numbers, 4 rows. | |
| F8 | **Hover-only selection and drag affordances.** Nothing hints rows are selectable or draggable until the pointer lands; touch and keyboard users get no discovery path. | |
| F9 | **Blue "required" hints that never clear** read as unresolved errors on a valid form. | |
| F10 | **`CREATE` stays enabled on an invalid folder name.** The folder form and the query form use two different gating rules. | |
| F11 | **The selection bar hijacks the masthead**, removing `NEW QUERY` while anything is selected. | |
| F12 | **Five names for one object** (Relational Queries / SQL Queries / My SQL Queries / My Sql Queries / `relational_querie`). | |
| F13 | **`Delete Query` sits directly under `Edit Query`** in a 4-item menu with no separator and no destructive styling. | Misclick risk on an irreversible action. |
| F14 | **Empty state is a bare "No data available"** — no explanation, no "Create your first query" CTA, no "Move queries here" hint for an empty folder. | |

---

## 11. Data shapes + example rows

```ts
interface RelationalQuery {
  id: number
  account_id: number                        // 116000
  name: string
  update_type: 'overwrite' | 'append'
  query: string                             // raw SQL
  rows_count: number | null                 // rendered as "Records"; null renders blank
  created_at: string                        // "2026-01-05T02:42:46.000-05:00"
  updated_at: string
  folder_id: number | null
  failed_at: string | null                  // NEVER surfaced in the UI
  targets: Target[]
}

interface Target {                          // also the shape behind the Targets picker
  id: number
  account_id: number
  name: string                              // relational table name
  synced_at: string | null
  refreshed_at: string | null
  contacts_count: number | null
  folder_id: number | null
  contact_sync_type: string                 // observed: "do_not_sync"
  first_name_column_name: string | null
  last_name_column_name: string | null
  created_at: string
  updated_at: string
}

interface QueryFolder { id: number; name: string; parent_id: number | null }
```

### All 10 real rows — the complete account dataset

| id | name | update_type | query | rows_count | created_at | targets |
|---|---|---|---|---|---|---|
| 15 | `testsq` | overwrite | `Select * from dev_test` | 1 | 2026-01-05 | `av_test` |
| 14 | `query-test` | overwrite | `Select * From av_test` | 0 | 2026-01-02 | `aug_sktable` |
| 12 | `cy_sql_qry1759302244211` | append | `Select * from rt11759302244211` | 0 | 2025-10-01 | `rt21759302244211` |
| 8 | `cy_sql_qry1754996906544` | append | `Select * from rt11754996906544` | 0 | 2025-08-12 | `rt21754996906544` |
| 7 | `cy_sql_qry1752578912307` | append | `Select * from rt11752578912307` | 0 | 2025-07-15 | *(none)* |
| 5 | `cy_sql_qry1751527063992` | append | `Select * from rt11751527063992` | 0 | 2025-07-03 | *(none)* |
| 4 | `cy_sql_qry1751526107325` | append | `Select * from rt11751526107325` | 0 | 2025-07-03 | *(none)* |
| 3 | `ubquery` | overwrite | `SELECT * FROM ub1;` | 3 | 2025-06-17 | `ub1_copy1` |
| 2 | `har_query1` | append | `select * from har_table2` | 0 | 2022-05-16 | `har_table1` |
| 1 | `uday_sql_query` | append | `select * from uday_test` | **null** | 2022-05-16 | `uday_test_copy` |

Display format for both timestamps: `Jan 05, 2026 at 02:42 AM`.

**API:** `GET …/v2/116000/relational_queries.json?page={n}&per_page={n}&method={column}&sort_by={asc|desc}`
— pagination, page size and sort are all server-side; `method` carries the column `value`.

**Visual tokens measured** (for fidelity comparison, not for copying): H2 Montserrat 600/24px
`rgba(0,0,0,.87)`; primary button `#212121` / white / 4px radius / 36px / 14px 700 uppercase;
dialog 670px, 4px radius; error `#B00020`; hint/primary `rgb(0,107,175)`.

---

## 12. Unverified — carried into Phase 2 questions

Every remaining path is a write, so this list is long.

1. **`Execute Query`** — never clicked (it runs the SQL and, on Overwrite, truncates the target
   table). The model contains `executeDialog: false` and `executeQueryName: ""`, strongly implying a
   confirmation dialog fires first, but **its copy, buttons and any success/failure toast are
   unknown.** An attempt to render it by flipping the flag was blocked by the tool's safety classifier.
2. **`Export Query`** — never clicked; it triggers a download. Format (CSV / SQL / JSON), filename
   convention, and whether it exports the *definition* or the *result set* are unknown. The icon
   (`mdi-application-export`) hints at the definition.
3. **`Delete Query` and the bulk trash** — confirmation copy unknown; the model has
   `newPrompt` / `promptAction` booleans suggesting a shared prompt component.
4. **Folder `Rename`** — enabled but not opened; inline vs dialog, and its validation, unverified.
5. **Folder `Privacy`** — disabled for this user. Its option set is unknown.
6. **Drag-and-drop into a folder** — the grip, `grab` cursor and drag label were observed, but no
   drop was completed. Drop-target highlighting and any confirmation are unverified.
7. **Query-name uniqueness** — no client rule enforces it; server behaviour unknown.
8. **Server-side length limits** on `name` and `query` — the client imposes none.
9. **`failed_at` rendering** — every row is `null`, so a failed query was never seen.
10. **Pagination beyond page 1** — only 10 records exist; whether selection survives a page change
    is unverified.
11. **`All Targets`** — never ticked; whether it stores an "all" flag or expands to every id, and
    how the `Targets * (N)` counter renders it, are unknown.
12. **Complete Targets option set** — 101 of an unknown total loaded via infinite scroll.
13. **Responsive** — `isMobile` flag was `false` at 1568px; narrow viewport not tested.
14. **Toasts / success feedback** — never triggered.
