# Email Content — flows

One entry per header action across the three surfaces in scope, plus the row-level actions the header
actions feed into. Crawled read-only on `uat.maropost.com` account `116000`, 2026-08-30.
Every step marked **UNVERIFIED** was deliberately not executed; the reason is given inline.

Shorthand used below:

- `[list]` = `/accounts/116000/contents`
- `[gallery]` = `/accounts/116000/contents/template`
- `[tpl-chooser]` = `/accounts/116000/content_templates/select_editor`
- `[content-chooser]` = `/accounts/116000/contents/select`

A cross-cutting behaviour that affects **every** flow below: **the first click on a header CTA after
a page load is swallowed** and the control only responds to the second click. Reproduced on
`MY TEMPLATES`, `NEW CONTENT`, `START FROM SCRATCH` and the editor-type select. Assume "click twice"
everywhere a header button appears.

---

## Page 1 — `[list]` Email Content

### F1 · `NEW CONTENT`

**Trigger** `NEW CONTENT` (dark filled, top right of `[list]`). It is a `<button>`, not a link, so
there is no middle-click / open-in-new-tab and no visible destination.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | `[list]` | Click `NEW CONTENT` (twice — first click swallowed) |
| 2 | `[gallery]?folder` | `Select Template`, opened on the **LIBRARY** tab. `Categories` rail on the left, masonry grid on the right, `Blank Template` card first. The header actions (`All`, `NEW TEMPLATE`, `START FROM SCRATCH`) are **not rendered** on this tab. Cards are blank white rectangles for the first 5–13s. |
| 3a | *Path A — pick a stock template* | Hover a card to reveal its name, click it |
| 4a | `/contents/drag_and_drop_beta?template_id=<slug>&is_new_content=true` | Drag & Drop editor, pre-filled with the template. `Name *` empty; `SAVE` and `SAVE AND CLOSE` disabled; `BACK` enabled. Tabs `CONTENT` / `FOOTER` / `PREVIEW` / `ADVANCED` / `CUSTOM ROW CATEGORIES`. |
| 3b | *Path B — start blank* | Click `START DESIGNING` on the `Blank Template` card |
| 4b | `[content-chooser]` | `Create New Email Content` · `Select editor type for your new email content.` · 4 cards: `Drag & Drop` · `WYSIWYG` · `HTML Code Editor` · `Pull from URL` · `BACK` |
| 5b | editor | **UNVERIFIED** — each card opens an editor for a brand-new content record. The two equivalent editors were reached from the template side instead (F5). |

**Decision points**

1. Library vs My Templates (tab). The tab click does not update `activeTab`, so the choice is not
   in the URL.
2. Which of 30+ unnamed thumbnails. The name shows only on hover, so this is a mouse-only decision.
3. Blank vs template. `START DESIGNING` diverts into a second decision (which editor) that the
   template path never asks.

**Validation** `SAVE` / `SAVE AND CLOSE` stay disabled until `Name *` has a value. There is no
inline error message — the buttons are simply greyed. The `Name` input carries no `required`
attribute, so this is JS-only.

**Success path** **UNVERIFIED** — saving would create a live record. Expected: `SAVE AND CLOSE`
returns to `[list]` with the new row at the top of the `Updated At` sort.

**Failure path** **UNVERIFIED** — no server-side validation or error state was triggered.
Client-side failure is expressed only as a disabled button.

**Where the user lands / how they get back**

- `BACK` from the Drag & Drop editor → **`Save Changes?` guard fires even on an untouched template**
  (title `Save Changes?`, body `Changes you have made have not been saved. Would you like to save
  changes.`, buttons `CLOSE WITHOUT SAVING` · `SAVE AND CLOSE`).
- `CLOSE WITHOUT SAVING` → `[gallery]?folder=` on the **LIBRARY** tab, with every category filter
  reset and `activeTab` dropped.
- `BACK` at the bottom of `[gallery]` → `[list]`.
- Browser Back from `[gallery]` also returns to `[list]`, but any folder or filter that was applied
  on `[list]` is gone, because none of it was ever in the URL.

---

### F2 · `MY TEMPLATES`

**Trigger** `MY TEMPLATES` (dark filled, immediately left of `NEW CONTENT`, visually identical).

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | `[list]` | Click `MY TEMPLATES` (twice) |
| 2 | `[gallery]?activeTab=mytemplate&folder` | Same `Select Template` page as F1, opened on the **MY TEMPLATES** tab instead. Data table of 60 saved templates + folder panel + `All` filter + `NEW TEMPLATE` + `START FROM SCRATCH`. |
| 3 | row `⋮` | `Preview Template` · `Create New Content` · `Edit Template` *(disabled)* · `Delete Template` *(disabled)* |
| 4a | `Preview Template` → `/contents/template/<id>/preview` | Full-page preview: template name as `<h3>`, four unlabelled viewport icon buttons (desktop / mobile / tablet / `×`). Merge tags render raw. |
| 4b | `Create New Content` | **UNVERIFIED** — would create a live content record. |

**Decision points** Which folder (`My Content Templates` / `Harpreet_QA` / `rimzim`) · which editor
type (`All` / `Drag & Drop` / `WYSIWYG` / `Drag & Drop (Legacy)`) · which of 60 rows.

**Validation** None on this screen.

**Success path** `Preview Template` → preview → `×` → back to `[gallery]` with `activeTab=mytemplate`
correctly restored. This is the **only** back-navigation in the module that preserves its state.

**Failure path** Filter + folder combinations that match nothing show `No data available` in a grey
table row with a `–` pagination label. No icon, no explanation, no "clear filter".

**Where the user lands / how they get back** `BACK` at the bottom of `[gallery]` → `[list]`.
The breadcrumb `My Email Contents` also returns to `[list]`.

**Note** F1 and F2 are the *same page*. The two CTAs differ only in which tab is preselected.

---

### F3 · `VIEW ARCHIVES`

**Trigger** `VIEW ARCHIVES` (outlined, sitting inline with the `Email Content` H2).

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | `[list]` | Click `VIEW ARCHIVES` |
| 2 | `/accounts/116000/archive?filter=contents` | Breadcrumb **`Settings > Archives`** — the wrong parent. Title `Archives` (`<h2>`). One control top right: a select showing `Content`, options `Campaign Tag` · `Contact List` · `Segment` · `Content` · `Dynamic Content`. |
| 3 | empty | Heading `You have no archived items.` (also an `<h2>`), body `Archive outdated content or campaigns to keep your workspace up-to-date.` No icon, no CTA. |

**Decision points** Which archive type (the `Content` select).

**Validation / success / failure** None — this is a read-only list. The populated state was not
observable because this account has nothing archived (the only way to populate it is
`Archive Content`, which is destructive — see F7).

**Where the user lands / how they get back** **There is no route back to Email Content.** The
breadcrumb points at `Settings`. The user must use browser Back or the global left nav
(`Marketing > Content > Email Content`). Also, if the folder panel had been opened on `[list]`, the
global sidebar arrives here still collapsed to an icon rail.

---

### F4 · Editor-type filter (`All`)

**Trigger** The unlabelled `v-select` showing `All`, between the H2 and `MY TEMPLATES`.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | `[list]` | Click the select (twice) |
| 2 | menu | `All` · `Drag & Drop` · `WYSIWYG` · `HTML Code Editor` · `Pull from URL` |
| 3 | filtered table | Row count and pagination update — e.g. `Pull from URL` → `1-10 of 15`. Composes with the folder selection. |

**Decision points** One value at a time; there is no multi-select and no "clear" other than
re-picking `All`.

**Validation** None.

**Success path** Table refreshes in place. **Nothing is written to the URL**, so the filtered view
cannot be bookmarked, shared, or restored with browser Back.

**Failure path** No match → `No data available`, pagination label `–`. Reproduced with folder
`Harsh` + `Pull from URL`.

**Where the user lands / how they get back** Same page. To clear, re-open the select and pick `All`;
browser Back does not undo it.

---

### F5 · Folder panel — `+ New Folder`

**Trigger** The unlabelled 24px folder icon on the outer edge of the global sidebar (no tooltip,
easily missed), then `+ New Folder`.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | `[list]` | Click the folder icon. The panel slides in **and the global sidebar collapses to an icon rail**. Panel shows `Always Open` switch (off), `+ New Folder`, and the tree `My Contents` → `Brendan` · `Harpreet_QA` · `Harsh` · `Manny` · `sonakshi` · `yash`. |
| 2 | inline form | `+ New Folder` is *replaced in place* by a `New Folder Name` field with the hint `36 characters maximum`, plus `CREATE` (dark) and `Close` (outlined). Not a drawer, not a dialog. |
| 3 | `CREATE` | **UNVERIFIED** — creates a live folder. |
| 3′ | `Close` | Reverts to the `+ New Folder` button. Verified. |

**Decision points** Folder name only. There is no parent picker, so the tree is one level deep by
construction.

**Validation** The 36-character limit is stated in a hint but **not enforced by the input** (no
`maxlength`), so it can only fail after submit. **UNVERIFIED** — the error copy was never seen.

**Success path** **UNVERIFIED.**

**Failure path** **UNVERIFIED.**

**Where the user lands / how they get back** Stays on `[list]`. `Close` cancels. The panel itself is
dismissed with the `×` at its top-right edge, but the global sidebar stays collapsed.

---

### F6 · Folder actions (`•••` on a folder)

**Trigger** Hover a folder in the panel → a `•••` appears at its right edge.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | menu | `Privacy` (`mdi-account`) · `Rename` (`mdi-folder-edit`) · divider · `Delete` (`mdi-delete`) |
| 2 | state | `Privacy` and `Delete` are `v-list-item--disabled` with `pointer-events: none` — they cannot even be focused or hovered for an explanation. Only `Rename` is live. |

**Decision points / validation / success / failure** All **UNVERIFIED** — `Rename` mutates a live
folder; `Privacy` and `Delete` are disabled for this user with no message saying why.

**Where the user lands / how they get back** Escape does **not** close this menu; clicking elsewhere
does.

---

### F7 · Row `⋮` actions

**Trigger** The always-visible `⋮` in the `Actions` column.

Menu, in order:

| # | Label | Destination | Status |
|---|---|---|---|
| 1 | `Preview Content` | `/contents/<id>/preview` → **redirects to** `/contents/<id>` | verified |
| 2 | `Create a Campaign` | `/campaigns/content/<id>` | verified |
| 3 | `Edit Content` | `/contents/<editorSlug>/<id>` | verified (destination read) |
| 4 | `Archive Content` | JS action | **UNVERIFIED — destructive** |
| 5 | `Delete Content Permanently` | JS action | **UNVERIFIED — destructive** |
| 6 | `Create a Duplicate Content` | `/contents/<editorSlug>?content_id=<id>&copy=true&rename=<original name>` | verified (destination read) |

`<editorSlug>` observed: `drag_and_drop_beta`, `wysiwyg`, `pull_from_url`.

**F7a · `Preview Content` →** `/contents/695`:
Breadcrumb `My Email Contents > STO test content 🔗`; H2 the content name; header buttons `EDIT`
(outlined) and `SEND CAMPAIGN` (outlined); tabs `PREVIEW` | `STATISTICS`. Left column: a
`Select User` card (radio `Contact` / `List` + a `Search by Email/UID` field) and a
`Content Size & Score` card (`Score:` `Excellent` green chip, `Size:` `5.37 KB`, and a green box
reading `Your email content size is excellent! It is well within the optimal limit, ensuring
fast…`). Right column: `Preview` + a `RENDER PREVIEW` button and the rendered body with merge tags
unresolved (`{{contact.email}}`). **Clicking a row's `Name` link goes to this same page** — the
`/preview` suffix is redundant.
Back: breadcrumb `My Email Contents` → `[list]`.

**F7b · `Create a Campaign` →** `/campaigns/content/695`:
Breadcrumb **`Campaign > New Email Campaign`** — the Email Content context is dropped entirely.
A proper 4-step stepper (`1` `2` `3` `4`) with step 1 `Campaign Details`, subtitle
`Enter the details of your campaign.` Fields: `Campaign Name *` (hint
`You cannot use emojis in this field.`), `Subject *` (emoji picker), `Preheader` (emoji picker,
counter `0 / 100`), `Select Campaign tag`. Info banner:
`Campaign is in draft mode, please Save on Step 2.` Steps 2–4 are `Contacts` /
`Add Suppress Contacts` / `Content`, then `Spam Check` / `Schedule` / `Send Test Email`, then
`Review`. **UNVERIFIED beyond step 1** — every forward action creates or sends a campaign.
Back: no `BACK` on step 1; the breadcrumb `Campaign` leaves the flow.

**F7c · `Edit Content`** opens the editor matching the row's type. **UNVERIFIED as an execution** —
the destination was read from the menu's `href` rather than followed, to avoid touching a live
record. The equivalent editor shells were captured via the new-content paths (F1, F9).

**F7d · `Create a Duplicate Content`** opens the same editor with
`?content_id=<id>&copy=true&rename=<original name>`. Note the `rename` value is the **unmodified
original name** — there is no ` copy` suffix, so the duplicate arrives pre-named identically to its
source. **UNVERIFIED as an execution.**

**F7e / F7f · `Archive Content` / `Delete Content Permanently`** — **UNVERIFIED, destructive.**
Both are `<div tabindex="-1">` with no `role`, so they are also unreachable by keyboard. Whether
either shows a confirmation dialog was not established.

---

### F8 · Selection and bulk delete

**Trigger** Hover a row to reveal its checkbox (invisible otherwise), then click it.

| # | State | What the user sees |
|---|---|---|
| 1 | 1 selected | The entire right-hand header cluster (`All`, `MY TEMPLATES`, `NEW CONTENT`) is **replaced** by `🗑` (icon-only, unlabelled) · `1 selected` (a text button) · `×`. The header select-all checkbox goes indeterminate. |
| 2 | select all | Clicking the header checkbox selects **only the 10 rows on the current page** of 489. Label reads `10 selected`. There is no "select all 489". |
| 3 | clear | `1 selected` / `×` clears the selection and restores the header. Verified. |
| 4 | `🗑` | **UNVERIFIED — permanently deletes the selected records.** Whether it confirms first was not established. |

**Decision points** Which rows. Delete is the **only** bulk action — no bulk archive, no bulk
move-to-folder, no bulk duplicate.

**Where the user lands / how they get back** Same page. Selection does not survive a page change.

---

## Page 2 — `[gallery]` Select Template

### F9 · `NEW TEMPLATE`

**Trigger** `NEW TEMPLATE` (dark filled). Rendered **only on the MY TEMPLATES tab**.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | `[gallery]` MY TEMPLATES | Click `NEW TEMPLATE` (twice) |
| 2 | `[tpl-chooser]` | Breadcrumb `My Email Contents > My Templates > Select Builder`. `Create New Email Content Template` (`<h4>`) · `Select editor type for your new email content template.` · **2** cards: `Drag & Drop` · `WYSIWYG` · `BACK`. Cards show a blue border + a particle burst on hover. |
| 3a | *Drag & Drop* → `/content_templates/layouts` | Breadcrumb gains `> Layout`. `Choose Layout` (`<h4>`) · `Choose a preferred layout for your new email content template` (no full stop) · 6 cards: `Basic Template` · `Template Image Left` · `Template Image Right` · `Template With Header` · `Grid Template` · `Blank Template`. All six thumbnails are blank for ~10s. |
| 4a | pick a layout | **UNVERIFIED** — opens the Drag & Drop template editor with that layout; the next action would be a save. |
| 3b | *WYSIWYG* → `/content_templates/new?is_new_content=true` | Straight to the CKEditor 4 WYSIWYG template editor. Breadcrumb `My Email Contents > My Templates > New Email Template`. `Name *` · `BACK` · `SAVE` (disabled) · `SAVE AND CLOSE` (disabled). Tabs `CONTENT` \| `HTML SOURCE CODE` \| `PERMISSIONS`. Left panel: `Tag Name`, `Images`, `Search Image`, an image folder tree. Toolbar merge-tag menus: `Campaign Tags` · `Contact Tags` · `Other Tags` · `Dynamic Content` · `Dynamic Areas` · `Table Tags` · `Template Tags` · `Web Funnel T…` · `Coupon Tags` · `Product Feed …` · `Abandoned C…`. |

**Decision points** Editor (2 options, no descriptions) → for Drag & Drop only, layout (6 options,
blank thumbnails for the first ~10s). **The two branches are different depths** and nothing warns
you: Drag & Drop is a 3-step wizard, WYSIWYG is 2, and there is no step indicator on any of them.

**Validation** `SAVE` / `SAVE AND CLOSE` disabled until `Name *` is filled. No inline error copy.

**Success path** **UNVERIFIED** — saving creates a live template.

**Failure path** **UNVERIFIED.**

**Where the user lands / how they get back**

- `BACK` on `[tpl-chooser]` and on `/content_templates/layouts` → the previous step, with
  `activeTab=mytemplate&folder=` restored on the gallery. Verified.
- `BACK` in the **WYSIWYG template editor** → straight to `[tpl-chooser]` with **no unsaved-changes
  guard at all**. Verified — and inconsistent with the Drag & Drop editor, which always guards.

---

### F10 · `START FROM SCRATCH`

**Trigger** `START FROM SCRATCH` (dark filled, immediately right of `NEW TEMPLATE`, identical
styling). Rendered only on the MY TEMPLATES tab.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | `[gallery]` MY TEMPLATES | Click `START FROM SCRATCH` (twice) |
| 2 | `[content-chooser]` | `Create New Email Content` (`<h4>`) · `Select editor type for your new email content.` · **4** cards: `Drag & Drop` · `WYSIWYG` · `HTML Code Editor` · `Pull from URL` · `BACK` |
| 3 | pick an editor | **UNVERIFIED** — opens an editor for a new content record. |

**The critical decision point is invisible.** `NEW TEMPLATE` creates a **template**;
`START FROM SCRATCH`, sitting beside it in identical styling on the *template* gallery, creates a
**content**. The only signal is one word in the next page's title. `START DESIGNING` on the
`Blank Template` card in the LIBRARY tab reaches the same `[content-chooser]`.

**Validation / success / failure** As F1 step 5b — **UNVERIFIED**.

**Where the user lands / how they get back** `BACK` → the gallery with `activeTab` and `folder`
restored.

---

### F11 · Tab switch (`LIBRARY` / `MY TEMPLATES`)

**Trigger** The tab strip under the H2.

| # | State | Behaviour |
|---|---|---|
| 1 | click a tab | `v-window` slide animation; the panel swaps |
| 2 | header | The `All` filter, `NEW TEMPLATE` and `START FROM SCRATCH` **appear on MY TEMPLATES and vanish on LIBRARY** |
| 3 | URL | **Unchanged.** `activeTab` keeps its load-time value; after a round trip through an editor it is dropped entirely and the page defaults to LIBRARY |
| 4 | filters | Category selections and the editor-type filter are per-tab and are **lost** on a round trip through an editor |

**Decision points** None beyond the tab itself.
**Validation / failure** None.
**How they get back** The tab strip. Browser Back does not switch tabs, because the tab was never in
the URL.

---

### F12 · `Categories` facet filter (LIBRARY tab)

**Trigger** Expand one of `INDUSTRY` · `AUTOMATED` · `SEASONAL` · `USAGE` and tick checkboxes.

| # | State | Behaviour |
|---|---|---|
| 1 | tick one | Grid filters; a blue count chip (`1`) appears on that facet's header; `Clear All` turns blue |
| 2 | tick another, in a *different* facet | **The result count goes UP, not down** — facets are combined with **OR**. `AUTOMATED > Abandoned Cart` = 3 results; adding `INDUSTRY > Automotive` = 4. |
| 3 | `Clear All` | Every facet resets at once; count chips disappear; grid returns to the unfiltered set. Verified. |

**Decision points** Any number of ticks across four facets, with semantics that are the opposite of
the conventional faceted filter and are never explained on screen.

**Validation** None.

**Failure path** **UNREACHABLE.** Because facets OR together, adding a filter can only increase the
result count, so no combination of category ticks can produce an empty grid. The library's empty
state — if it has one — could not be observed.

**How they get back** `Clear All`, or leaving the tab (which also clears it).

---

### F13 · `BACK` (bottom of `[gallery]`, both tabs)

**Trigger** `BACK` (outlined), bottom-left of the content area.
**Result** → `/accounts/116000/contents`, the Email Content list. Verified.
No confirmation, no state carried back. Any folder or filter that had been set on `[list]` before
leaving is gone, because none of it is in the URL.

---

## Page 3 — `[tpl-chooser]` Editor chooser

### F14 · `Drag & Drop`

**Trigger** The `Drag & Drop` card. It is a `<div tabindex="0">` with no `role` and no accessible
name; the visible label is a sibling `<h5>`.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | hover / focus | 2px blue border + a particle burst behind the icon |
| 2 | click | Immediate navigation. **No selected state, no `Continue` button** — the choice commits on the first click. |
| 3 | `/content_templates/layouts` | `Choose Layout`, 6 cards, `BACK`. Thumbnails blank for ~10s. |
| 4 | pick a layout | **UNVERIFIED** — opens the Drag & Drop template editor pre-filled with the layout. |

**Decision points** Layout (6 options, no descriptions, opaque names, blank thumbnails on arrival).
**Validation** Downstream only (`Name *`).
**Success / failure** **UNVERIFIED.**
**How they get back** `BACK` on the layout page → `[tpl-chooser]`; `BACK` there → `[gallery]` with
`activeTab=mytemplate&folder=`. Both verified.

---

### F15 · `WYSIWYG`

**Trigger** The `WYSIWYG` card.

| # | Screen / state | What the user sees |
|---|---|---|
| 1 | click | Immediate navigation — **no layout step**, unlike `Drag & Drop` |
| 2 | `/content_templates/new?is_new_content=true` | CKEditor 4 template editor (see F9 step 3b for the full shell) |
| 3 | `Name *` | `SAVE` and `SAVE AND CLOSE` unlock once it has a value. **UNVERIFIED** — not typed, not saved. |

**Decision points** None after the card click.
**Validation** `Name *` required, enforced by disabling the save buttons. No inline error copy was
reachable without submitting.
**Success path** **UNVERIFIED.**
**Failure path** **UNVERIFIED.**
**How they get back** `BACK` → `[tpl-chooser]`, **with no unsaved-changes guard**. Verified, and
inconsistent with the Drag & Drop editor.

---

### F16 · `BACK`

**Trigger** `BACK` (outlined, centred below the cards).
**Result** → `[gallery]` with `activeTab=mytemplate&folder=` intact. Verified.
This is the only exit; there is no `Cancel`, and the breadcrumb links
(`My Email Contents`, `My Templates`) go one and two levels further back respectively.

---

## Cross-flow observations

1. **`NEW CONTENT` and `MY TEMPLATES` open the same page.** F1 and F2 differ only in the preselected
   tab.
2. **`NEW TEMPLATE` and `START FROM SCRATCH` sit side by side and create different object types**
   (template vs content). F9 vs F10.
3. **`START DESIGNING`, `START FROM SCRATCH`, and `NEW CONTENT` → blank all converge on
   `[content-chooser]`.** Three entry labels, one destination.
4. **Two editor choosers exist** — `[tpl-chooser]` (2 options) and `[content-chooser]`
   (4 options) — visually identical, titles differing by one word.
5. **The unsaved-changes guard is inconsistent**: always in the Drag & Drop editor (even untouched),
   never in the WYSIWYG template editor.
6. **The campaign wizard has a proper 4-step stepper (F7b); the content/template creation wizard has
   none**, despite being 2–3 steps deep with an asymmetric branch.
7. **Only one back-navigation preserves state** — the `×` from the template preview (F2). Every other
   return path resets the tab, the filters, or both.
8. **No flow writes its state to the URL**, so no flow can be resumed, bookmarked, or shared, and
   browser Back is never a reliable undo.

## Complete list of UNVERIFIED steps

| Flow | Step not executed | Reason |
|---|---|---|
| F1 / F9 / F10 / F14 / F15 | `SAVE`, `SAVE AND CLOSE`, `Save as Template` | Creates a live record |
| F1 step 5b, F10 step 3 | Any card on `[content-chooser]` | Opens a new-content editor; the same two editors were reached from the template side |
| F3 | Populated Archives list | Nothing archived in this account; the only way to populate it is destructive |
| F5 | `CREATE` on New Folder; the 36-character validation message | Creates a live folder |
| F6 | `Rename`, `Privacy`, `Delete` on a folder | `Rename` mutates; the other two are disabled for this user |
| F7c | `Edit Content` executed | Would open a live record for editing; destination read from the menu `href` |
| F7d | `Create a Duplicate Content` executed | Would create a record |
| F7e / F7f | `Archive Content`, `Delete Content Permanently`, and any confirmation they show | Destructive |
| F7b | Campaign wizard steps 2–4 | Every forward action creates or sends a campaign |
| F8 | Bulk `🗑` and any confirmation it shows | Permanently deletes records |
| F9 step 4a, F14 step 4 | Picking a layout | Opens the template editor; the next action is a save |
| F2 step 4b | `Create New Content` from a template row | Creates a record |
| F2 | `Edit Template`, `Delete Template` | Disabled for this user on every row observed |
| F12 | The LIBRARY empty state | Unreachable — facets combine with OR, so filters can only add results |
| F15 | `PERMISSIONS` tab in the WYSIWYG template editor | A permission-granting surface; out of bounds |
| all | `Always Open` switch in the folder panel | A persisted preference toggle |
| all | Drag-a-row-onto-a-folder | Would move a live record |
| all | Column sort click behaviour | Not exercised; sortability read from the `sortable` class |
