# Acquisition Forms — parity checklist

Rebuild of UAT `/acquisition/forms`, `/forms/select` and the 5-step builder.
Source of truth: [AUDIT.md](AUDIT.md) · [FLOWS.md](FLOWS.md).

| Legend | |
|---|---|
| ✅ | at parity |
| ✳️ | at parity, with a deliberate improvement (see IMPROVEMENTS) |
| ➕ | added — not in the source |
| ⛔ | deliberately not carried over |
| 🚫 | could not be verified on UAT, so the rebuild's behaviour is inferred |

---

## 1. List — `/accounts/:accountId/acquisition/forms`

| Feature | Status | Note |
|---|---|---|
| Breadcrumb / page title | ✳️ | `MpPageHeader` with an `Acquisition` eyebrow and a real `h1`. The source has no `h1` on any page. |
| `NEW FORM` CTA → template picker | ✅ | Routes to `FormSelection`. |
| Column `Name`, sortable, links to the builder | ✅ | |
| Column `Form Type` (`Drag and Drop` / `Legacy`) | ✅ | Rendered as `MpStatusChip` rather than bare wrapping text. |
| Column `Status` switch | ✳️ | Switch now carries a visible `Live` / `Paused` label and an accessible name. |
| Column `Updated At`, sortable | ✅ | |
| Column `Created At`, sortable | ✅ | |
| Row `⋮` menu | ✳️ | All five items keyboard-reachable; `Delete` moved last, behind a divider, in the danger style. |
| — `Show Script Link` | ✅ | |
| — `Edit` | ✅ | |
| — `Preview Form` | ✅ | Opens a real preview dialog. |
| — `Delete Permanently` | ✳️ | Now behind `MpConfirmDialog`, which names what is lost. |
| — `Duplicate` | ➕ | The source has no duplicate on this list, though its sibling lists do. |
| Row selection + select-all (indeterminate) | ✅ | Both checkboxes carry accessible names; the source's have none. |
| Bulk bar | ✳️ | `MpFloatingBulkBar` — it no longer **replaces** the page's primary CTA. |
| — Bulk delete | ✅ | |
| — Bulk move to folder | ➕ | |
| — Bulk set live / pause | ➕ | |
| Pagination 5/10/25/50/100, default 10 | ✅ | |
| Range label `1-10 of 43` | ✅ | Vuetify's own footer. |
| Folder filtering | ✳️ | `MpFolderSelect` in the toolbar + `?folder=` in the URL, instead of an overlay panel that collapses the whole app nav. |
| Folder create / rename / delete | ✅ | `MpManageFoldersDrawer`. |
| Folder ownership + privacy model | ✅ | Modelled in `useFolders`: a folder you don't own can be renamed but not deleted, and only the owner sets privacy. |
| Move a form to a folder | ✳️ | A real bulk action. The source only supports drag-a-row-onto-a-folder, which is impossible by keyboard or touch. |
| Empty state | ✳️ | `MpEmptyState`, with distinct filtered and genuinely-empty copy. The source renders the bare string `No data available`. |
| Loading state | ✳️ | `MpTableSkeleton`. The source shows `Loading... Please wait` with a nonsense `1-0 of 10` range. |
| Error state | ➕ | `MpErrorState` with retry. The source has none. |
| Search | ➕ | The source has no search on a 43-row list. |
| Filter by form type / builder | ➕ | |
| Filter + folder state in the URL | ➕ | Nothing in the source reaches the URL. |
| Drag-to-reorder rows | ⛔ | 🚫 Never exercised on UAT (it persists an order change). Row order is sort-driven here. |

## 2. `Show script link` dialog

| Feature | Status | Note |
|---|---|---|
| Dialog titled `Acquisition Form Script` | ✳️ | Now also names the form in the subtitle. |
| Script-tag field + copy button | ✅ | Same URL shape: `…/uploads/<accountId>/acquisition/builder_<formId>/script.js` |
| Manual-integration field + copy button | ✳️ | **Populated.** The source's is permanently empty — see AUDIT D1. |
| Field labels | ✳️ | Both fields are labelled via `MpFormField`; the source's have no label and no `aria-label`. |
| Copy buttons named | ✳️ | The source's are icon-only with no accessible name. |
| Footer | ✳️ | `Done` rather than `CANCEL` — nothing here is cancellable. |

## 3. Form Selection — `/acquisition/forms/select`

| Feature | Status | Note |
|---|---|---|
| Full route (not a dialog) | ✅ | The pre-existing sandbox version was a dialog; now it matches the source. |
| Title + subtitle | ✅ | |
| `Create from scratch` card | ✅ | |
| 6 named templates | ✅ | `First order discount` · `Neutral modern` · `Looking for something?` · `Be the first to know` · `Join the club` · `Welcome coupon` |
| `Popup` / `Center` / `Embedded` tags | ✅ | |
| `CANCEL` / back | ✅ | `MpPageHeader` `backTo`. |
| Card previews | ✳️ | Drawn from tokens, so they paint instantly. The source's are blank ~370px boxes for several seconds with no skeleton. |
| Consistent card structure | ✳️ | Every card places its title identically. The source puts `Create from scratch`'s title at the top and every other card's at the bottom. |
| Template descriptions | ➕ | The source names templates but never explains them. |
| Uniform grid | ✳️ | Fixed 4:3 preview ratio; the source orphans its seventh card. |

## 4. Builder — `/acquisition/forms/create` and `?formId=`

| Feature | Status | Note |
|---|---|---|
| 5 steps in UAT's order | ✅ | `Details · Settings · Design · Content · Finished` — reordered from the sandbox's previous sequence. |
| Step labels | ✳️ | Every step labelled. The source labels only the active one, leaving four unlabelled circles. |
| Completed steps clickable | ✳️ | Editing an existing form makes all five reachable. The source un-completes steps 4–5 the moment you touch step 3 (AUDIT D4). |
| **Step 1** `Name *` | ✅ | |
| **Step 1** `List * (n)` multi-select w/ counts + Select All | ✅ | |
| **Step 1** Domains + `ADD DOMAIN` | ✅ | |
| **Step 1** `NEXT` gated on name + ≥1 list | ✅ | |
| **Step 1** persistent "is required" under valid fields | ⛔ | Source defect D2 — deliberately not reproduced. |
| **Step 2** Popup / Embedded cards | ✅ | |
| **Step 2** `Don't show form again after submission` | ✅ | |
| **Step 2** Display On: Entry / Exit / Percentage Scrolled | ✅ | |
| **Step 2** Page URL targeting | ✅ | |
| **Step 2** `Don't show pop-up for N days after closing` | ✅ | |
| **Step 2** Optional functions ×4 | ✅ | Redirect · notify email · ReCaptcha · double opt-in. |
| **Step 3** Position (9 options) | ✅ | |
| **Step 3** Dimensions / Padding / Border / Shadow / Overlay / Background | ✅ | |
| **Step 3** Builder background (Desktop / Mobile) | ⛔ | A build-time convenience with no effect on the published form; dropped as noise. |
| **Step 3** Live device preview + desktop/mobile toggle | ✅ | |
| **Step 4** Main Form / Thank You tabs | ✅ | |
| **Step 4** Block palette | ✅ | 11 blocks matching the source's. |
| **Step 4** `ROWS` / `SETTINGS` panels | 🚫 | Not reachable on UAT — a cross-origin iframe. Per-block settings are offered instead. |
| **Step 5** `DETAILS` / `PREVIEW` tabs | ✅ | |
| **Step 5** Created / Modified / Published At | ✅ | `Published: Not yet published` when unpublished. |
| **Step 5** Script tag + manual integration | ✳️ | Manual snippet populated (D1). |
| **Step 5** `EXIT` / `BACK` / `PUBLISH` | ✅ | |
| Unsaved-changes guard | ➕ | `useDirtyLeaveGuard`. No guard was observed anywhere in the source's builder. |
| Publish success state | 🚫 | Never executed on UAT — toast + list update are inferred. |

---

## Verification

- `npm run type-check` — passes.
- axe-core 4.12.1, WCAG 2.0/2.1 A + AA, scoped to `main` — **0 violations** on the list, Form
  Selection, and the builder.
- Fixed along the way: `MpFormField` set `aria-required` on `role="group"`, which ARIA disallows —
  a WCAG 4.1.2 failure inherited by **every** consumer of the component. Required-ness now reaches
  screen readers through the accessible name instead.
- No horizontal overflow at 375px.
- Walked end to end: list → row menu → script dialog · list → New form → Form Selection → builder ·
  builder step jumps 1→5 · status switch · folder filter.

## Still inferred

Everything the crawl could not execute stays inferred, exactly as in the CDP and Products slices:
every save, publish, delete and duplicate outcome; all toasts and redirects; validation-on-submit
messages; and every error/network-failure state.
