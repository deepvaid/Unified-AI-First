# PARITY — SQL Queries (Relational Queries)

**Source:** `uat.maropost.com/accounts/116000/relational_queries`
**Rebuild:** [`src/views/Contacts/SQLQueries.vue`](../../../src/views/Contacts/SQLQueries.vue)
**Route:** `/accounts/:accountId/sql_queries` (rebuilt in place)

---

## Layout

| # | Source | Rebuilt | Notes |
|---|---|---|---|
| 1 | Breadcrumb `My SQL Queries` | ➖ dropped | The source uses five names for one object; the heading is now the single name |
| 2 | `h2 "SQL Queries"`, no `h1` | ✅ | promoted to the page `h1` |
| 3 | `NEW QUERY` top-right | ✅ | as `New query` |
| 4 | **No toolbar** — no search, no filters | ⚠️ **search added** — see deviations |
| 5 | Folder drawer + drag-to-move | ❌ **not built** — out of scope for this slice |
| 6 | Selection replaces the masthead action | ⚠️ `MpFloatingBulkBar` instead — the primary action stays reachable |

## Table

| # | Column | Sortable | Rebuilt |
|---|---|---|---|
| 7 | `Name` | yes | ✅ + now opens Edit |
| 8 | **`Status`** | — | ⚠️ **added** — see deviations |
| 9 | `Records` (right, thousands separator) | yes | ✅ `—` when null |
| 10 | `Created At` | yes | ✅ |
| 11 | `Updated At` | yes | ✅ |
| 12 | Actions | no | ✅ `MpRowActionsMenu` |
| 13 | Date format `MMM DD, YYYY at HH:MM AM/PM` | ✅ verified `Jan 05, 2026 at 02:42 AM` |
| 14 | Row actions: Execute / Export / Edit / Delete | ✅ all four, source order |
| 15 | Bulk selection + bulk delete | ✅ |
| 16 | Page sizes 5/10/25/50/100, default 10 | ✅ |
| 17 | Server-side sort and pagination | ⚠️ client-side — no backend in the sandbox |

## Create / edit dialog

| # | Item | Source | Rebuilt |
|---|---|---|---|
| 18 | Centred modal, 670px | ✅ `MpDialog size="md"` |
| 19 | Title `New Query` / `Edit Query` | ✅ |
| 20 | Intro copy + support link | ✅ copy kept; the link is inert in the sandbox |
| 21 | `Name *` | text, no maxlength | ✅ |
| 22 | `Targets * (n)` multi-autocomplete with live count and chips | ✅ 21 targets seeded |
| 23 | `Update type *` | 2 options, verbatim | ✅ both verbatim |
| 24 | `Query *` textarea | ✅ + monospace — see deviations |
| 25 | Update-type help | hover tooltip | ✅ always-visible associated hint |
| 26 | `CANCEL` / `CREATE` \| `CONFIRM` | ✅ as `Cancel` / `Create` \| `Save changes` |
| 27 | Primary disabled until all four valid | ✅ + dirty check on edit |

## Validation

| # | Rule | Source | Rebuilt |
|---|---|---|---|
| 28 | Name required | `Query name is required` | ✅ |
| 29 | Name whitespace-only | `Name cannot be blank` | ✅ |
| 30 | Target required | `Target is required` | ✅ |
| 31 | Update type required | `Update Type is required` | ✅ |
| 32 | Query required | `Query is required` | ✅ |
| 33 | **Blue "required" hints shown before touch, never clearing** | ⚠️ **fixed** — touched-gated, clears when satisfied |

## States

| # | State | Rebuilt |
|---|---|---|
| 34 | Loading | ✅ `MpTableSkeleton` |
| 35 | Empty | ✅ `MpEmptyState` + "Create query" CTA (the source shows bare `No data available`) |
| 36 | Search-empty | ✅ distinct copy + "Clear search" |
| 37 | Validation errors | ✅ |
| 38 | Disabled primary | ✅ |
| 39 | Delete confirm (single + bulk) | ✅ `MpConfirmDialog danger` |
| 40 | **Execute confirm** | ⚠️ **added** — names the target table and states consequences |
| 41 | Discard-changes guard | ✅ kept from the previous sandbox implementation |
| 42 | Success toasts | ⚠️ **inferred** — never observed on UAT |
| 43 | Query status badges | ⚠️ **added** — the source has none at all |

## Verification

| # | Check | Result |
|---|---|---|
| 44 | `npm run type-check` | ✅ passes |
| 45 | `npm run build` | ✅ passes |
| 46 | axe-core WCAG 2.0/2.1 A + AA, `main` | ✅ **0 violations** |
| 47 | Execute guard fires and names the target | ✅ verified — "Running it empties av_test" |
| 48 | Zero non-system styles | ✅ |

---

## Deliberate deviations

1. **A `Status` column was added.** The source's API returns `failed_at` on every record and the UI
   never shows it, so `Records: 0` is ambiguous between "ran and returned nothing" and "never ran"
   (audit F2). Values are `Success` / `Failed` / `Never run`.

2. **Search was added.** The source has none — the only way to narrow the list is the folder tree,
   and its own component carries an unused `searchString` (audit F1). Search covers name, SQL text
   and target names.

3. **The row name opens Edit.** In the source it is an `<a href=null>` with no handler: users click
   it expecting to open the query and nothing happens (audit F3).

4. **Execute is guarded.** An `Overwrite` query **truncates its target table**, and the source
   offers no preview, test or dry-run before running it (audit F4). The confirmation names the
   target table and lists the consequences. This mitigates the risk; it does not remove it — see
   GAPS §10.

5. **Validation appears on touch and clears when satisfied.** The source renders the same
   "… is required" strings in brand blue *before* a field is touched and leaves them visible after
   it is filled, so a valid form looks like it has outstanding errors — and colour alone
   distinguishes hint from error (audit F9, A6, A7).

6. **`Delete query` is separated and styled destructive.** The source places it directly under
   `Edit query` with no divider and no destructive styling (audit F13).

7. **Row checkboxes are labelled.** The source's are `opacity: 0` at rest yet still focusable and
   unnamed, so a keyboard user tabs into an invisible, unnamed control on every row (audit A3).
   Vuetify's own `show-select` slots were overridden to give them accessible names.

8. **The query textarea is monospace with spellcheck off.** The source uses a 16px sans-serif face
   with spellcheck on, so SQL keywords get red squiggles (audit F7). This is a style fix only — it
   is still a plain textarea, not an editor.

9. **`MpFloatingBulkBar` replaces the masthead takeover.** The source removes `NEW QUERY` from the
   masthead whenever anything is selected (audit F11).

10. **The Targets menu shows all options at full height.** The source clips it to roughly three rows
    despite a ~1000px content box, and does not reset scroll after filtering (audit F5, F6).

11. **`Export query` writes a CSV of the query definition.** The source's export was never
    exercised (it triggers a download), so the format is a reasoned guess from its
    `mdi-application-export` icon.

## Not built, deliberately

- **Folders, the folder drawer and drag-to-move.** Out of scope for this slice. This means search
  *replaces* the source's only narrowing mechanism rather than supplementing it — worth revisiting
  if folders matter to real accounts.
- **A SQL editor.** Filed as GAPS §10. The source has no highlighting, line numbers, autocomplete,
  schema browser or dry-run either, so building one would be a new feature — but this is the
  highest-risk surface in the whole crawl.
- **Server-side sort and pagination.** No backend exists in the sandbox.
- **`All Targets` select-all.** Its semantics were never verified on UAT — whether it stores an
  "all" flag or expands to every id is unknown.

## Open items carried forward

- **Execute, Export and Delete were never run on UAT**, so the real confirmation copy, export
  format and success/failure feedback are all inferred.
- **`failed_at` rendering** — every row in the source account is `null`, so a genuinely failed
  query was never seen. The Status column's failed state is a reasoned construction.
- **Folder `Privacy`** was disabled for this user; its option set is unknown.
- **Query-name uniqueness** and **server-side length limits** — the client enforces neither and no
  submission was ever made.
