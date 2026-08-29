# Email Content — parity checklist

Rebuild of UAT `/contents` and the eight surfaces its header actions reach.
Source of truth: [AUDIT.md](AUDIT.md) · [FLOWS.md](FLOWS.md).

Legend: ✅ parity · ✳️ parity with a deliberate improvement · ➕ added · ⛔ deliberately dropped ·
🚫 unverifiable on UAT, so the rebuild's behaviour is inferred.

---

## 1. List — `/accounts/:accountId/contents`

| Feature | Status | Note |
|---|---|---|
| Breadcrumb / title | ✳️ | Real `h1`; the source's is an `h2` with `word-break: break-all`, which splits it mid-word inside a folder (`Email Content - Bre` / `ndan`). |
| `NEW CONTENT` → template gallery | ✅ | |
| `MY TEMPLATES` → same gallery, other tab | ✳️ | Now visibly secondary. The source styles both CTAs identically, giving no hierarchy between "start new" and "start from a template". |
| `VIEW ARCHIVES` | ✳️ | Moved to a quiet text button and re-parented under Email Content. The source lands on a page breadcrumbed `Settings > Archives` with no route back. |
| Column `Name`, sortable, opens the editor | ✅ | |
| Column `Editor type` | ✳️ | `MpStatusChip` instead of plain text that wraps to two lines in a too-narrow column. |
| Column `Updated At` / `Created At`, sortable | ✅ | |
| Column `Used by` | ➕ | How many campaigns point at this body. The source gives no way to know whether deleting one breaks a live campaign. |
| Row `⋮` — 6 items | ✅ | `Preview` · `Create a campaign` · `Edit` · `Duplicate` · `Archive` · `Delete` |
| — order and destructive treatment | ✳️ | `Archive` and `Delete` moved last, behind a divider, `Delete` in the danger style. The source buries `Delete Content Permanently` fifth of six with a non-destructive item after it and no divider. |
| — keyboard reachability | ✳️ | All six reachable. In the source `Archive Content` and `Delete Content Permanently` are `<div tabindex="-1">` with no role — literally unusable by keyboard. |
| Row selection + select-all | ✅ | Both checkboxes named; the source's have no accessible name. |
| Bulk bar | ✳️ | Floats; does not unmount the header actions the way the source does. |
| — Bulk delete | ✅ | Now labelled and behind a confirm. |
| — Bulk archive | ➕ | |
| — Bulk move to folder | ➕ | The source's only move path is dragging a row onto a folder — impossible by keyboard or touch. |
| Folder filtering | ✳️ | `MpFolderSelect` + `?folder=`. The source hides folders behind an unlabelled 24px icon and collapses the whole app sidebar when it opens. |
| Folder create / rename / delete | ✅ | `MpManageFoldersDrawer`. |
| Editor-type filter | ✳️ | A toolbar pill. The source's select renders its menu *on top of its own field* and never closes on selection, so the field reads `Allrag & Drop (Legacy)` and `All` becomes unreachable — the filter cannot be cleared. |
| Pagination 5/10/25/50/100 | ✅ | |
| Empty state | ✳️ | `MpEmptyState`; the source shows the bare string `No data available` with a `–` range label. |
| Loading / error state | ➕ | The source has neither. |
| Search | ➕ | **The headline fix.** The source has no search across 489 records. |
| Filter + folder state in the URL | ➕ | |
| Drag a row onto a folder | ⛔ | 🚫 Never exercised on UAT. Replaced by an explicit move action that works for everyone. |

## 2. Select Template — `/contents/template`

| Feature | Status | Note |
|---|---|---|
| `LIBRARY` / `MY TEMPLATES` tabs | ✅ | |
| Tab reflected in the URL | ✳️ | The source's `activeTab` is a load-time seed only — clicking a tab never updates it, so a tab cannot be linked to. |
| Library gallery | ✅ | 18 stock designs plus a leading `Blank template` card. |
| Template names | ✳️ | **Always visible.** The source shows them only on hover, so its cards carry no text at all — unreadable by keyboard, touch or screen reader. |
| Card thumbnails | ✳️ | Drawn from tokens at a fixed 3:4 ratio. The source's range from 300px to 1660px tall and 10 of 30 stay blank for 5–13 s. |
| Category facets (`INDUSTRY` · `AUTOMATED` · `SEASONAL` · `USAGE`) | ✅ | With per-value counts, in the toolbar's filter drawer. |
| Facets combine with OR | ✅ | Kept — but now stated in the drawer, because ticking more boxes *widening* the results is genuinely surprising. |
| `Clear All` | ✅ | |
| Library search | ➕ | |
| MY TEMPLATES table (`Name` · `Editor Type` · `Created By` · `Updated At` · `Created At`) | ✅ | |
| MY TEMPLATES folder filter | ✅ | Own `content_templates` scope, as in the source. |
| `NEW TEMPLATE` / `START FROM SCRATCH` | ✅ | |
| `BACK` | ✅ | `MpPageHeader` `backTo`. |
| Column header casing | ✳️ | Consistent. The source uses `Editor type` here and `Editor Type` on the sibling page. |

## 3. Editor choosers — `/contents/select` (4) and `/content_templates/select_editor` (2)

| Feature | Status | Note |
|---|---|---|
| Both choosers exist | ✅ | One component, told apart by route meta. |
| 4 content options | ✅ | `Drag & Drop` · `WYSIWYG` · `HTML Code Editor` · `Pull from URL` |
| 2 template options | ✅ | `Drag & Drop` · `WYSIWYG` |
| Option descriptions | ➕ | The source explains nothing — `Pull from URL` in particular is a bare label. |
| Keyboard-operable options | ✳️ | `MpOptionCard` is focusable and activates on Enter/Space. |
| Titles distinguish the two | ✳️ | `Create email content` vs `Create an email template`, and the template page says what a template *is*. The source's titles differ by one word (`… Content` vs `… Content Template`) with nothing else to tell them apart. |
| `BACK` | ✅ | |

## 4. Layout step — `/content_templates/layouts`

| Feature | Status | Note |
|---|---|---|
| Reached only from the Drag & Drop template path | ✅ | WYSIWYG still goes straight to the editor, as in the source. |
| 6 layouts | ✅ | Single column · Two columns · Three columns · Sidebar · Hero · Blank |
| Layout previews | ✳️ | Drawn row/column diagrams rather than images. |
| Layout descriptions | ➕ | |
| `BACK` | ✅ | |

## 5. Archives — `/archive`

| Feature | Status | Note |
|---|---|---|
| Record-type filter (5 types) | ✅ | `Content` · `Dynamic Content` · `Campaign Tag` · `Contact List` · `Segment` |
| Empty-state copy | ✅ | The source's is one of the few well-written strings in the module; kept almost verbatim. |
| Breadcrumb parent | ✳️ | Under **Email Content**, with a back link. The source breadcrumbs it `Settings > Archives` and offers no route back. |
| Archived list with restore | ➕ | The source's archive is empty in the crawled account, so its populated state was never seen — table, restore and bulk actions are inferred. 🚫 |
| Search | ➕ | |

## 6. Preview — `/contents/:id/preview`

| Feature | Status | Note |
|---|---|---|
| Read-only render of the body | ✅ | |
| Desktop / mobile toggle | ➕ | Matches the editor's, so the two agree. |
| `Edit content` / `Create a campaign` | ➕ | The source's preview is a dead end. |
| Missing-record state | ➕ | |

## 7. Create a campaign from content — `/campaigns/content/:id`

| Feature | Status | Note |
|---|---|---|
| Row menu → campaign wizard, carrying the content | ✅ | Routes to the existing `CreateEmailCampaign` wizard with `?contentId=`. |
| Wizard steps 2–4 | 🚫 | Never walked on UAT. The existing sandbox wizard is used unchanged. |

---

## Verification

- `npm run type-check` — passes.
- axe-core 4.12.1, WCAG 2.0/2.1 A + AA, scoped to `main` — **0 violations** on the list, the
  gallery, both choosers, the layout step, Archives and Preview.
- No horizontal overflow at 375px.
- Walked: list → gallery (both tabs) → both choosers → layout step → editor · list → Archives ·
  list → preview · folder filter · search · bulk archive with undo.

## Deliberate data choice

The store seeds 120 content records, not the source's 489. The volume exists to make the missing
search felt; 120 is enough to demonstrate it without bloating the prototype's memory. Records are
generated deterministically, so the list is identical on every reload.

## Still inferred

Every save, publish, delete, archive and duplicate outcome; all toasts and redirects; the
populated Archives state; and every error/network-failure state.
