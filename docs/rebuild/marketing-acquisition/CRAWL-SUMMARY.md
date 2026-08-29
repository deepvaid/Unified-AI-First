# Marketing Acquisition + Content — crawl summary (Phase 1 complete)

Read-only crawl of `uat.maropost.com` account **116000**, 2026-08-30. Nothing was created, saved,
published, deleted, activated or toggled. Per-group detail lives in:

> ## Locked Phase-2 decisions (user-approved 2026-08-30 — do not re-litigate)
>
> 1. **Scope: build everything found (~20 surfaces)** — including Archives, the standalone preview
>    screens, the layout step, both editor choosers, and the create-campaign-from-content handoff.
> 2. **Remove the invented UI.** The July redesign's KPI row, `views`/`conversions`/`rate` columns
>    and card-grid view come out — UAT has no metrics anywhere in this module.
> 3. **Folders = `MpFolderSelect` + URL state.** Reuse `useFolders` + `MpFolderSelect` +
>    `MpManageFoldersDrawer` + `MpMoveToFolderDialog` (the `EmailCampaigns.vue` pattern), add a
>    `?folder=` query param, and keep UAT's ownership/privacy model. No new folder-tree component.
> 4. **Add search to every list** via `MpDataTableToolbar`, plus the missing empty / loading / error
>    states, and put filter state in the URL. Logged in IMPROVEMENTS as deliberate additions.
>
> Carried forward from earlier slices: match UAT surfaces and replace existing ones; fix source
> defects rather than reproduce them; flag every copy change 🔤 in IMPROVEMENTS.

| Group | Docs |
|---|---|
| Acquisition Forms | [AUDIT](../acquisition-forms/AUDIT.md) · [FLOWS](../acquisition-forms/FLOWS.md) |
| Landing Pages | [AUDIT](../landing-pages/AUDIT.md) · [FLOWS](../landing-pages/FLOWS.md) |
| Social Leads / Lead Ads | [AUDIT](../social-leads/AUDIT.md) · [FLOWS](../social-leads/FLOWS.md) |
| Email Content | [AUDIT](../email-content/AUDIT.md) · [FLOWS](../email-content/FLOWS.md) |

---

## 1. The 10 URLs expanded to ~20 surfaces

The brief named 10 URLs. Following every header action one level deep surfaced these:

### Acquisition Forms (4)
| Surface | Path | In brief? |
|---|---|---|
| List | `/acquisition/forms` | ✅ |
| Form Selection (7 template cards) | `/acquisition/forms/select` | ✅ |
| 5-step builder — create | `/acquisition/forms/create` | ✅ |
| 5-step builder — edit | `/acquisition/forms/:id/modify` | ➕ found |

### Landing Pages (4)
| Surface | Path | In brief? |
|---|---|---|
| List | `/landing_pages` | ✅ |
| Select Template — `LIBRARY` / `MY TEMPLATES` tabs | `/landing_pages/template` | ✅ |
| Select Builder — 2 tiles, no form | `/landing_pages/create` | ✅ |
| Page editor | `/landing_pages/:id` | ➕ found |

### Social Leads / Lead Ads (3)
| Surface | Path | In brief? |
|---|---|---|
| Create — single-page form, **not** a wizard | `/social_leads/new` | ✅ |
| List | `/social_leads` | ➕ found (nav calls it "Lead Ads") |
| Edit — same form, prefilled | `/social_leads/:id/edit` | ➕ found |

### Email Content (9)
| Surface | Path | In brief? |
|---|---|---|
| List (489 records) | `/contents` | ✅ |
| Select Template — `LIBRARY` / `MY TEMPLATES` | `/contents/template?activeTab=…` | ✅ |
| Editor chooser — **2 options** (templates) | `/content_templates/select_editor` | ✅ |
| Editor chooser — **4 options** (content) | `/contents/select` | ➕ found |
| Layout step (Drag & Drop templates only) | `/content_templates/layouts` | ➕ found |
| Archives | `/archive?filter=contents` | ➕ found |
| Content editor | `/contents/:editorSlug/:id` | ➕ found |
| Content preview | `/contents/:id/preview` | ➕ found |
| Create-campaign-from-content | `/campaigns/content/:id` | ➕ found |

---

## 2. What the four lists actually look like

Every list is the **same legacy shape**: breadcrumb → `h2` → CTA cluster → bare `v-data-table` →
pagination. None of them has an `h1`.

| | Forms | Landing Pages | Email Content | Lead Ads |
|---|---|---|---|---|
| Records | 43 | 37 | **489** | 1 |
| Search | ❌ | ❌ | ❌ | ❌ |
| Filters | ❌ | editor type only | editor type only | ❌ |
| Status tabs | ❌ | ❌ | ❌ | ❌ |
| Folder panel | ✅ | ✅ | ✅ | ❌ |
| Row selection | ✅ | ✅ | ✅ | ❌ |
| Bulk actions | delete only | delete only | delete only | — |
| Rows per page | 5/10/25/50/100 | same | same | same |
| Empty state | `No data available` | `No data available` | `No data available` | not reachable |

**Three findings repeat on every single list:**

1. **No search.** 489 email-content records behind 49 pages of 10, with no name search anywhere.
2. **Selecting a row unmounts the primary CTA.** `NEW FORM` / `NEW PAGE` / `NEW CONTENT` are removed
   from the DOM and replaced in the same slot by an unlabelled trash icon + `n selected`.
3. **Nothing is in the URL.** Folder, filter, sort, page and page size are all component state, so
   no view is bookmarkable, shareable, or restorable — and Back exits the page instead of undoing.

---

## 3. The folder panel (Forms, Landing Pages, Email Content)

One shared widget, opened by an unlabelled icon button:

- `Always Open` switch (off by default) · `+ New Folder` → inline field
  (`New Folder Name`, hint `36 characters maximum`, `CREATE` / `Close`)
- One-level tree under a root (`My Acquisition Forms` / `My Landing Pages` / `My Contents`)
- Per-folder `•••` on hover → **`Privacy` · `Rename` · `Delete`**, individually disabled by
  ownership. Tooltips: `You can view and rename the folder, only owner can delete it` and
  `Only folder owner can set the permissions for other users.`
- Move-to-folder is **drag-a-row-onto-a-folder only** — no menu item, no bulk move
- **Opening it collapses the entire global app sidebar to a 52px icon rail**, and that rail persists
  after navigating away

---

## 4. Source defects worth reproducing as fixes

Ranked by how much they hurt.

| # | Defect | Where |
|---|---|---|
| 1 | **Correctly-filled fields display their own `… is required` message.** On the Lead Ads *edit* form it fires on load against a valid record. Same family as the Products-slice feed drawer. | Forms step 1, Lead Ads create + edit |
| 2 | **Keyboard-unreachable menu items.** In every row menu only one item gets `role="menuitem"`/`tabindex=0`; the rest are `<div tabindex="-1">`. **Duplicate, Archive and Delete cannot be invoked from a keyboard at all.** | Landing Pages, Email Content |
| 3 | **`Preview Landing Page` links to the editor**, byte-identical to the row's own name link. Preview does not preview. | Landing Pages |
| 4 | **`Script for manual form integration` is always empty** — in both the row-menu modal and the builder's final step. | Forms |
| 5 | **The `/landing_pages/create` builder tiles are absent from the accessibility tree** — no role, no tabindex, labels baked into PNGs. Keyboard users cannot choose a builder. | Landing Pages |
| 6 | **A Facebook Page literally named `Deleted page` is offered as `Connected`**, contradicting the field's own tooltip. | Lead Ads |
| 7 | **The editor-type menu renders on top of its own field** and does not close on select, so the field reads `Allrag & Drop (Legacy)` and `All` becomes unreachable — the filter cannot be cleared. | Landing Pages, Email Content |
| 8 | **Leaked i18n key as an accessible name**: `aria-label="$vuetify.dataTable.itemsPerPageText"`. | all lists |
| 9 | **Bulk delete is an icon with no accessible name** — the most destructive control in the module is unnamed. | all lists |
| 10 | **The page `h2` breaks mid-word** (`Email Content - Bre` / `ndan`) via `word-break: break-all`. | Email Content |
| 11 | **`VIEW ARCHIVES` lands on a page breadcrumbed `Settings > Archives`** — wrong parent, no route back. | Email Content |
| 12 | **Touching builder step 3 resets steps 4–5 to incomplete**, silently killing forward jumps. | Forms |
| 13 | **Template names are hover-only**; cards carry no text at all and no aspect ratio (300px → 1660px tall). | Landing Pages, Email Content |
| 14 | **Two near-identical editor choosers** whose titles differ by one word (`Create New Email Content` vs `Create New Email Content **Template**`), one with 2 options and one with 4. | Email Content |
| 15 | **Empty range label is a bare en-dash `–`**; the loading range reads `1-0 of 10`. | all lists |
| 16 | **Legacy Vue is served in development mode**; the app boots twice per navigation; Amplitude SDK times out after 10s on every load. | app-wide |
| 17 | **No `h1` on any page** in the entire slice; heading levels run H2/H2/H4 within one flow. | all |
| 18 | **`36 characters maximum` is advisory** — no `maxlength`; the field accepted 41 characters, then errored while leaving `CREATE` enabled. | folder panel |

---

## 5. What the sandbox already has, and where it diverges

| Surface | Sandbox today | Divergence from UAT |
|---|---|---|
| `AcquisitionForms.vue` | KPI row, grid/list toggle, mini form previews, search, status + type filters | **UAT has none of these.** No metrics exist anywhere in UAT. Missing: folders, `Created At`, `Drag and Drop`/`Legacy` form type, Show Script Link, Preview Form |
| `FormBuilder.vue` | 5 steps `Setup · Content · Display · Style · Review & Publish`, labelled + click-to-jump | Right concerns, **different order** — UAT is `Details · Settings · Design · Content · Finished`. Sandbox labelling is *better* and should be kept |
| `useForms.ts` | `FormDisplayRules`, `FormDesign`, `FormOptionalFunctions`, 9 popup positions, main/thank-you blocks | **~85% already matches UAT.** Extra: `views`/`conversions`/`rate` (invented). Missing: folder id, editor type, script fields |
| `LandingPages.vue` | search + domain-status quick filter, 9 columns | Extra: `Domain / URL`, `Status`. Missing: folders, the 3-value editor type (`Drag & Drop (Legacy)`), the 4-item row menu |
| `LandingPageTemplates.vue` | at `/landing_pages/templates` (plural) | UAT is `/landing_pages/template` (singular); missing the LIBRARY/MY TEMPLATES tab split and the 4-facet category rail |
| `EmailContent.vue` | template card grid | UAT is a 489-row table with folders, archives, and a 6-item row menu |
| **Lead Ads** | `/lead_ads` **reuses `AcquisitionForms.vue`** | Completely wrong surface. Needs its own list + single-page create/edit form |

Existing infrastructure that fits: `useFolders.ts` (scopes `campaigns`/`contents`/`images`),
`MpFolderSelect`, `MpManageFoldersDrawer`, `MpMoveToFolderDialog` — already wired together in
`EmailCampaigns.vue` with counts, active-filter chips and move-to-folder.

---

## 6. Component gaps

| Gap | Use case | Closest stand-in |
|---|---|---|
| **Folder tree panel** | UAT's collapsible tree with per-folder ownership, privacy, rename, delete and drag-to-move | `MpSectionRail` is route-driven and has no per-item menu; `MpFolderSelect` is a dropdown and loses the tree. Neither fits as-is |
| **Template gallery card** | Thumbnail-led card with a hover/persistent name and category tags | `MpOptionCard` has a `#media` slot — probably sufficient |
| **Block palette** | The drag-and-drop editor's 11-block palette (TITLE/PARAGRAPH/LIST/IMAGE/DIVIDER/SPACER/SOCIAL/HTML/VIDEO/+2) | `EmailContentEditor.vue` already hand-rolls one; no shared component |
| **Faceted filter rail** | LIBRARY tab's `INDUSTRY` / `AUTOMATED` / `SEASONAL` / `USAGE` checkbox facets with counts and `Clear All` | `MpDataTableToolbar` `#filter-content` drawer, or a new rail |

---

## 7. Unverified across the slice

Everything mutating was stopped at the last safe step:

- **Every** create, save, publish, duplicate, delete, archive, activate and domain-verify
- All folder mutations (`CREATE`, `Rename`, `Delete`, `Privacy`)
- Every bulk delete
- All Meta/Facebook OAuth (the `Meta` tile at Apps ▸ Integrations was read, never clicked)
- Drag-to-reorder rows and drag-a-row-into-a-folder
- `Always Open` (a persisted preference)
- The `ROWS` and `SETTINGS` tabs of the form content editor — a cross-origin iframe that synthetic
  clicks cannot reach (same limitation as the Legacy segment builder in the CDP slice)
- All success toasts, redirects, validation-on-submit messages and error/network-failure states

**Consequence for the rebuild:** every success and failure state will be *inferred*, exactly as in
the CDP and Products slices.
