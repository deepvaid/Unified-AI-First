# Landing Pages — parity checklist

Every feature, flow step and state recorded in `AUDIT.md` / `FLOWS.md`, ticked against the rebuild.

- ✅ built, verified in the browser at `localhost:5173`, account `2000290`
- ♻️ built differently on purpose — the reason is given
- ❌ deliberately dropped — the reason is given
- ⬜ out of this slice's scope

Files: `src/views/Marketing/LandingPages.vue` · `LandingPageTemplates.vue` ·
`LandingPageBuilderChooser.vue` · `src/stores/useLandingPages.ts`.
Copy and UX rationale: `docs/rebuild/marketing-acquisition/IMPROVEMENTS.md` §Landing Pages.

---

## 1. `/landing_pages` — the list

### Columns

| Audited | Status | Note |
|---|---|---|
| Select-all checkbox column | ✅ | Always visible (source is `opacity: 0` until hover) and named `Select all landing pages on this page`. |
| Drag grip (6-dot) | ❌ | Mouse-only, keyboard-invisible, and its glyph collides with the kebab's. Reordering was never verified in the source. |
| `Name`, sortable, links to the editor | ✅ | Real `RouterLink` to `LandingPageEditor`. |
| `Editor Type` (`Drag & Drop` · `WYSIWYG` · `Drag & Drop (Legacy)`) | ✅ | Three-value union added to `useLandingPages.ts`; 20 seeded rows span all three. |
| `Domain Status` (`Verified` green / `Unverified` amber) | ✅ | `MpStatusChip` — `verified`/`unverified` added to the `general` tone map. |
| `Publish At`, sortable | ✅ | `MMM DD, YYYY at hh:mm A`, `—` + sr-only "Not scheduled" when unset. |
| `Expire At`, sortable | ✅ | Same, sr-only "No expiry". |
| `Updated At`, sortable | ✅ | |
| `Actions` kebab | ✅ | `MpRowActionsMenu`. |
| `Domain / URL` + derived `Status` (sandbox-only, pre-rebuild) | ❌ | Not in UAT. Removed per the locked "remove the invented UI" decision. |

### Row menu

| Audited | Status | Note |
|---|---|---|
| `Verify Domain`, disabled when `Verified` | ✅ | Still disabled, now with `aria-disabled` and a tooltip reason (`Already verified — nothing to check.`). Click is guarded, so the restored hover cannot fire it. |
| `Preview Landing Page` | ♻️ | Renamed `Preview` and pointed at the editor's preview dialog (`?preview=1`). The source's href is the editor itself — D1. |
| `Duplicate Landing Page` | ✅ | Renamed `Duplicate`. Creates a `(Copy)`, resets it to Unverified/draft, toasts with an `Open copy` action. |
| `Delete Landing Page Permanently` | ✅ | Renamed `Delete`, `danger`, last, behind a divider, behind `MpConfirmDialog danger`. |
| No `Edit` item | ✅ | Kept as-is — the name link is the edit affordance, per the brief's kebab spec. |
| All four keyboard-reachable | ✅ | `MpMenuItem` bakes in `role="menuitem"`; verified all four are reachable. |

### Filters, search, folders

| Audited | Status | Note |
|---|---|---|
| Editor-type select (`All` / `WYSIWYG` / `Drag & Drop (Legacy)` / `Drag & Drop`) | ♻️ | A **labelled** `MpDataTableToolbar` quick filter with checkboxes. "All" is the empty selection, cleared from the chip row or the panel's `Clear`. Fixes D3 (menu painting over its own field, never closing, `All` unreachable). |
| Name search | ✅ | Added — searches name and URL. The source has none. |
| Folder tree panel | ♻️ | `MpFolderSelect` + `MpManageFoldersDrawer` + `MpMoveToFolderDialog`, per the locked Phase-2 decision. Per-folder counts added. |
| Folder panel collapses the global sidebar to a 52px rail | ❌ | A defect, not a feature (and D13: the rail renders a blank grey blob). |
| Folder `•••` → `Privacy` / `Rename` / `Delete`, gated by ownership | ✅ | Lives in `MpManageFoldersDrawer`, backed by `useFolders`' owner/privacy model. |
| `+ New Folder` inline form, 36-char cap | ✅ | In the manage-folders drawer. `useFolders` enforces the cap (the source's is advisory — D8). |
| `Always Open` folder-panel toggle | ❌ | A persisted preference for a panel that no longer exists. |
| Filter / folder state in the URL | ✅ | `?q=`, `?type=`, `?folder=` — set, restored on load, written with `router.replace`. Fixes D11. |

### Selection and bulk actions

| Audited | Status | Note |
|---|---|---|
| Row selection, indeterminate select-all | ✅ | |
| `NEW PAGE` unmounted on selection | ♻️ | **Fixed.** The CTA stays; `MpFloatingBulkBar` floats over the table. Verified: `New page` still in the DOM with rows selected. |
| Bulk delete | ✅ | Labelled button → `MpConfirmDialog danger` naming the count. |
| Bulk move-to-folder | ✅ | Added — the source has none despite foldering being first-class. |
| `✕ n selected` clear | ✅ | `Clear selection`, plus `Select all (n)`. |

### States

| Audited | Status | Note |
|---|---|---|
| Empty: `No data available` | ✅ | Three real variants: filtered, empty-folder, and first-run launcher. |
| Range label degrades to `–` when empty (D4) | ✅ | Reads `0-0 of 0`. |
| Loading (none in the source) | ✅ | `MpTableSkeleton` via `useInitialLoad`. |
| Error (never observed) | ♻️ | `MpErrorState` branch wired to a `loadError` ref with a Retry action. Not reachable from the UI — there is no backend to fail, matching the `LeadAds.vue` precedent. |
| Pagination `5/10/25/50/100`, default 10 | ♻️ | Vuetify's own footer, default 10. Its options are `10/25/50/100/All`; the source's `5` is dropped. |
| Leaked i18n key on rows-per-page (D2) | ✅ | Not reproduced. |

---

## 2. `/landing_pages/template` — Select Template

| Audited | Status | Note |
|---|---|---|
| `LIBRARY` / `MY TEMPLATES` tabs | ✅ | `MpFilterTabs`, with counts, `aria-controls` wired to the panel. |
| Tab in the URL | ✅ | `?tab=mine`. Fixes D21. |
| 17 stock templates + a Blank card first | ✅ | 17 in `LANDING_TEMPLATES`, Blank leads the grid. |
| Template name visible | ♻️ | **Persistent card title**, not a hover scrim. Fixes the flow's worst a11y defect and D18 (stale scrims). |
| Category tags on cards | ✅ | Up to three chips per card; the rest are searchable. |
| Fixed aspect ratio | ✅ | 16:10 token-drawn preview. Fixes D20 (300px–1660px cards) and D22 (re-downloading thumbnails). |
| Cards keyboard-operable | ✅ | `MpOptionCard`: `role="button"`, `tabindex=0`, Enter/Space, focus ring. Verified Enter activates. |
| `Categories` facets: `USAGE`, `INDUSTRY`, `SEASONAL` | ✅ | All three, in `MpDataTableToolbar`'s `#filter-content` drawer, each option with a count. An earlier revision of this checklist listed a fourth `AUTOMATED` group — the 2026-08-30 re-crawl confirmed it does not exist in UAT (`AUDIT.md` records three), and the rebuild's invented group was removed. |
| Facet counts / badge | ✅ | Per-option counts, plus the Filter button's own active badge. |
| Facets combine with OR | ✅ | Behaviour kept, and stated in the drawer. |
| Accordions mutually exclusive | ❌ | All four groups are visible at once — the exclusivity is friction 6, not a feature. |
| `Clear All` | ✅ | A real button (`Clear all`), in the drawer footer and on the chip row. |
| Zero-result state | ✅ | `MpEmptyState` + `Clear filters`. Not reachable in the source. |
| Library search | ✅ | Added — name, description and category labels. |
| `SEASONAL` option list | ✅ | **Confirmed against UAT 2026-08-30** and the seeds corrected: Fashion Week · Christmas · Father's Day · Seasonal promotion · Spring · Labor Day · Fall · Cyber Monday · Mother's Day · Valentine's Day · Memorial Day (UAT's order, labels humanised per the D19 fix). The previously inferred `AUTOMATED` group and its options were removed; `INDUSTRY` gained UAT's `Manufacturing`, `Music` and `Luxury`, which the first build had dropped. |
| `MY TEMPLATES` table: `Name` · `Updated At` · `Created At` · Actions | ✅ | All four, all three date columns sortable. |
| `MY TEMPLATES` first cell renders two blank rectangles (D17) | ✅ | Not reproduced — no selection column on this table. |
| Row kebab `Create New Page` | ✅ | Renamed `Create new page`, keyboard-reachable. |
| `MY TEMPLATES` folder filter | ✅ | `MpFolderSelect`, scope `landing_pages` (`content_templates` is the email-content scope). |
| `MY TEMPLATES` row management | ♻️ | Added `Move to folder…` and `Delete` (danger, confirmed). The source has neither — friction 13. |
| `START DESIGNING` / `START FROM SCRATCH` | ♻️ | One `Start from scratch` in the header on both tabs. |
| `BACK` below the grid | ♻️ | `MpPageHeader backTo` only. |
| Tab-switch paint bleed (D15/D16) | ✅ | Not reproduced — one card per tab, `v-if`-switched. |
| Selection / bulk actions on `MY TEMPLATES` | ⬜ | Never observed in the source; not built. |

---

## 3. `/landing_pages/create` — Select Builder

| Audited | Status | Note |
|---|---|---|
| Title `Create New Landing Page` | ✅ | Sentence case, real `h1`. Fixes D26. |
| Subtitle | ♻️ | Replaced — the source's restates the title. |
| Two options: `Drag & Drop`, `WYSIWYG` | ✅ | Both `MpOptionCard`s with a Lucide icon, a name and a one-line description. |
| Options in the accessibility tree | ✅ | **Fixes D23/D24** — the source's are PNG-only `<div>`s. Verified: `role="button"`, `tabindex=0`, `aria-pressed`, Enter activates. |
| Option descriptions | ✅ | Added — the source has none. |
| `Drag & Drop (Legacy)` mentioned | ✅ | Named, with its retirement stated. Not offered for new pages. |
| Hover-only state feedback | ♻️ | Real selected state (`aria-pressed`, ring) plus a `Create page` commit. |
| Step indicator | ✅ | `MpWizardSteps` — "Select template → Select builder". |
| `BACK` | ✅ | `MpPageHeader backTo`, plus a `Back` button beside the commit. |
| Unguarded direct arrival | ✅ | Handled — "Starting from a blank page." |
| ~24 s to paint the options | ✅ | Instant. |
| Breadcrumb `My Landing Pages > Select Template > Select Builder` | ♻️ | `MpPageHeader` eyebrow + `backTo` chevron. The design system has no breadcrumb component and none was invented. |

---

## 4. Flows (`FLOWS.md`)

| Flow | Status | Verified path |
|---|---|---|
| 1. `NEW PAGE` → template → builder → editor | ✅ | `New page` → `/landing_pages/templates` → pick `Holiday Wishlist` → `/landing_pages/create?template=holiday-wishlist` → `Drag & Drop` → `Create page` → `/landing_pages/editor/21/edit`, seeded with the template's blocks. |
| 2. `START DESIGNING` (blank) | ✅ | `Start from scratch` → `/landing_pages/create` → "Starting from a blank page." |
| 3. `START FROM SCRATCH` (My Templates) | ♻️ | Merged into flow 2 — one label, present on both tabs. |
| 4. `Create New Page` from a saved template | ✅ | My templates → `Campaign Hero — Brand Base` → `/landing_pages/create?template=saved-2`. |
| 5. Row name → editor | ✅ | Real link to `LandingPageEditor`. |
| 6. `Verify Domain` | ✅ | Unverified row → status flips to `Verified` + toast. Verified row → inert, tooltip explains. |
| 7. `Preview` | ✅ | Opens the editor's preview dialog. |
| 8. `Duplicate` | ✅ | New `(Copy)` row + toast with `Open copy`. |
| 9. `Delete` | ✅ | `MpConfirmDialog danger` → row removed, count drops, toast. |
| 10. Selection → bulk delete | ✅ | Bulk bar with the CTA still mounted; confirm names the count. |
| 10b. Selection → bulk move to folder | ✅ | Added. `MpMoveToFolderDialog`, toast names the destination. |
| 11. Folder panel | ♻️ | `MpFolderSelect` + manage drawer; folder in `?folder=`. |
| 12. `+ New Folder` | ✅ | In the manage drawer, 36-char cap enforced. |
| 13. Folder `•••` (Privacy / Rename / Delete) | ✅ | In the manage drawer, gated by `useFolders` ownership. |
| 14. Editor-type filter incl. its empty state | ✅ | `?type=dnd_legacy` → 6 rows; `?q=zzzz&folder=lp-manny` → empty state, `0-0 of 0`. |
| 15. Sorting and pagination | ✅ | Name/Publish/Expire/Updated sortable; Vuetify exposes `aria-sort` (the source never does). |

---

## 5. Verification run

| Check | Result |
|---|---|
| `npm run type-check` | Passes for all four files touched here. (Two unrelated failures exist in `ContentLanding.vue` / `ContentTemplates.vue` from a parallel slice.) |
| Console errors | None from these pages. The pre-existing `ReferenceError: watch is not defined` from `DashboardGradientView` fires on every load and is not from this slice. |
| axe (wcag2a/2aa/21a/21aa, scoped to `main`) — list | **0 violations** |
| axe — Select Template, Library tab | **0 violations** |
| axe — Select Template, My templates tab | **0 violations** |
| axe — Select Builder | **0 violations** |
| axe — facet filter drawer | **0 violations** |
| axe — delete confirm dialog | **0 violations** |
| axe — move-to-folder dialog | **0 violations** |
| axe — list at 375px | **0 violations** |
| Horizontal overflow at 375px | None: `scrollWidth === innerWidth === 375` on all four states. |

---

## 6. Known deltas to confirm with the product team

> **Re-verified against live UAT (account 116000) on 2026-08-30.** All three pages were
> re-crawled read-only. Structure, copy, flows and every documented source defect (D1 preview
> href, D2 leaked i18n key, D3 unclosable filter menu, hover-only template names, keyboard-
> unreachable row-menu items, PNG-only builder tiles) were confirmed unchanged. Item 1 below is
> resolved; items 2–4 stand as written.

1. ~~**`SEASONAL` and `AUTOMATED` facet options are inferred**~~ **Resolved 2026-08-30.** The
   re-crawl opened each accordion alone: `SEASONAL` has 11 options (now in `AUDIT.md` and seeded
   verbatim), and **`AUTOMATED` does not exist** — the group set is `USAGE` / `INDUSTRY` /
   `SEASONAL`. The rebuild's invented `Automated` group was removed and the three Industry
   options it had dropped (`Manufacturing`, `Music`, `Luxury`) were restored.
2. **No `Details` step** between template and builder: the page is created with the template's name
   and an empty URL, both editable in the editor, which already blocks publishing until the URL is
   valid. UAT collects nothing before the editor either.
3. **`Drag & Drop (Legacy)` is filterable and displayable but not creatable.** UAT's builder picker
   also offers only two options, so this matches — but nothing in UAT states the intent.
4. **Every success and failure state is inferred.** Nothing mutating was executed during the crawl
   (see `AUDIT.md` → Unverified), so toasts, redirects and error copy are the sandbox's convention,
   not observed UAT behaviour.
5. **Design-system gaps logged** rather than solved locally, in
   `docs/rebuild/marketing-acquisition/GAPS.md`: **G4** (new — `MpMenuItem` cannot explain a
   disabled item, and restoring pointer events for a tooltip silently re-enables the click),
   plus the existing **G1** (`MpOptionCard`'s `#media` cannot lead a gallery card) and **G2**
   (no facet-group component), both of which this slice hit again.
