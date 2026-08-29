# Acquisition Forms — UAT audit

Crawled read-only 2026-08-30 on `uat.maropost.com`, account **116000**, as an authenticated user.
No record was created, saved, published, deleted or toggled. Sensitive values are not recorded.

| Surface | UAT path |
|---|---|
| List | `/accounts/116000/acquisition/forms` |
| Template picker | `/accounts/116000/acquisition/forms/select` |
| Builder (create) | `/accounts/116000/acquisition/forms/create` |
| Builder (edit) | `/accounts/116000/acquisition/forms/:id/modify` |

Sidebar location: **Marketing ▸ Acquisition ▸ Acquisition Forms** (siblings: Landing Pages, Lead Ads).

---

## 1. Page purpose & primary user task

Build and manage **opt-in capture forms** (popup or embedded) that a merchant pastes onto their own
website via a `<script>` tag. Each form writes subscribers into one or more contact lists.

Primary task: *create a form from a template, style it, edit its content, publish it, and copy the
embed script.* Secondary: find an existing form, toggle it live/paused, or grab its script again.

---

## 2. Layout structure and hierarchy

### 2.1 List page

```
Breadcrumb: "My Acquisition Forms"   (becomes "My Acquisition Forms > <Folder>" inside a folder)
H1:         "Acquisition Forms"      (becomes "Acquisition Forms - <Folder>")
                                     Right: NEW FORM  (dark, → /acquisition/forms/select)
Folder overlay (toggled by an icon button at the top-left of the content area)
Card
  └── table (no toolbar, no search, no filters, no tabs)
  └── pagination footer
```

There is **no search box, no filter control, no status tabs and no view toggle** on this page. The
only way to narrow the list is the folder tree.

### 2.2 Folder panel

Opened by a small folder icon button pinned at the top-left of the content area. It slides in as a
**~290px overlay that collapses the entire global app sidebar down to a 52px icon rail** — the
whole app nav loses its labels for as long as the folder panel is open.

Contents, top to bottom:
- `Always Open` switch (default off) — pins the panel
- `+ New Folder` button → replaces the button with an inline create form:
  input placeholder `New Folder Name`, helper `36 characters maximum`, buttons `CREATE` / `Close`
- Tree: root `My Acquisition Forms` (expand caret) → flat list of child folders
  (observed: `BN`, `Harpreet_QA`, `Manny`, `test`, `test`, `uday`, `yash` — note two identical names)
- Close `✕` on the panel edge, tooltip `Close Folders`

Each folder row reveals a `···` button on hover → menu **Privacy · Rename · Delete**. Items are
disabled per ownership; the row tooltip explains it:
`You can view and rename the folder, only owner can delete it`, and on Privacy:
`Only folder owner can set the permissions for other users.`

Selecting a folder filters the table and rewrites both the breadcrumb and the H1.

### 2.3 Builder (create and edit)

```
Breadcrumb: create → "My Acquisition Forms > Form Selection > New Form"
            edit   → "My Acquisition Forms > Edit Form \"<name>\""
Stepper:    5 circles, connected. Only the ACTIVE step shows a text label.
Step body
Footer:     BACK / NEXT   (steps 1–4)      EXIT / BACK / PUBLISH   (step 5)
```

Step labels (revealed one at a time): 1 = *(unlabelled — "New Form" / "Edit Form")* ·
2 = **Settings** · 3 = **Design** · 4 = **Content** · 5 = **Finished**.

---

## 3. Components used → design-system mapping

| UAT element | Design-system equivalent |
|---|---|
| H1 + breadcrumb + NEW FORM | `MpPageHeader` (`backTo`, `#actions`) |
| Table | `v-data-table` + `MpDataTableToolbar` (UAT has no toolbar — see friction #1) |
| Status column switch | `MpStatusToggle` |
| Form Type cell (`Drag and Drop` / `Legacy`) | `MpStatusChip` `type="general"` |
| Row `⋮` menu | `MpRowActionsMenu` + `MpMenuItem` (`Delete Permanently` → `danger`) |
| Selection bar (`🗑 ✕ 1 selected`) | `MpFloatingBulkBar` |
| `No data available` | `MpEmptyState` |
| Folder tree overlay | `MpSectionRail` (+ `MpFolderSelect` / `MpManageFoldersDrawer` for CRUD) |
| Inline "New Folder" form | `MpFormDrawer` or inline `MpFormField` |
| `Acquisition Form Script` modal | `MpDialog` size `md` |
| Delete confirm | `MpConfirmDialog` `danger` |
| Template gallery cards | `MpOptionCard` in a grid |
| 5-step stepper | `MpWizardSteps` (`clickable`, `maxStep`) |
| Step-1 form | `MpFormSection` + `MpFormGrid` + Vuetify fields |
| Popup/Embedded radio cards | `MpOptionCard` |
| `Display and Behaviour Options` / `Optional functions` accordions | `v-expansion-panels` inside `MpFormSection` |
| Design accordions (8) | `v-expansion-panels` |
| Content block palette | **GAP** — no palette component exists (see GAPS) |
| Step-5 detail card + script blocks | `v-card` + `MpFormField` (readonly) + copy button |

---

## 4. All data fields, labels and copy

### 4.1 List table

| Column | Sortable | Content |
|---|---|---|
| *(checkbox)* | — | row select; header checkbox supports indeterminate |
| `Name` | yes | link → `/accounts/:acct/acquisition/forms/:id/modify` |
| `Form Type` | no | `Drag and Drop` or `Legacy` |
| `Status` | no | switch (on = live) |
| `Updated At` | yes | `MMM DD, YYYY at hh:mm A` — e.g. `Aug 04, 2026 at 02:45 AM` |
| `Created At` | yes | same format |
| `Actions` | no | `⋮` |

Pagination footer: `Rows per page:` select **5 / 10 / 25 / 50 / 100** (default 10) ·
range label `1-10 of 43` (`–` when empty) · prev/next chevrons.

Row `⋮` menu, in order: `Show Script Link` · `Edit` · `Preview Form` · `Delete Permanently`.

Selection: selecting ≥1 row **replaces the `NEW FORM` button** with `🗑` + `✕` + `<n> selected`.
Delete is the only bulk action.

Empty folder: the table body renders the bare string `No data available`.

**Loading state:** a thin indeterminate progress bar sits under the header row and the table body
renders the centred string `Loading... Please wait`. The pagination range simultaneously reads
`1-0 of 10` — a nonsense range built from the page size before any data has arrived (defect D12).

### 4.2 `Acquisition Form Script` modal (row ⋮ → Show Script Link)

- Title `Acquisition Form Script`
- `Use the following script tag to call the form.` → single-line input + copy icon
  Value shape: `<script type="text/javascript" async src="https://optin-staging.chd01.com/uploads/<accountId>/acquisition/builder_<formId>/script.js"></script>`
- `Use the following script content to call the form.` → textarea + copy icon — **empty** (defect)
- Footer: `CANCEL` only

### 4.3 Form Selection page (`/select`)

- H1 `Form Selection`, subtitle `Select your creation experience.`
- 7 cards in a 2-up grid, footer `CANCEL`:

| Card | Tags |
|---|---|
| `Create from scratch` | *(none — title renders at the TOP of the card, unlike the rest)* |
| `First order discount` | `Popup` `Center` |
| `Neutral modern` | `Popup` `Center` |
| `Looking for something?` | `Popup` `Center` |
| `Be the first to know` | `Embedded` |
| `Join the club` | `Embedded` |
| `Welcome coupon` | `Embedded` |

Cards carry real rendered previews, but they arrive several seconds after the page paints; until
then every card is an empty ~370px white box with no skeleton. The 7th card is orphaned and
centred on its own row.

### 4.4 Step 1 — details

| Field | Type | Required | Copy |
|---|---|---|---|
| `Name *` | text | yes | — |
| `List * (n)` | multi-select w/ typeahead | yes | section `Subscription Lists`, help `Select the lists that you want to add your subscribers to.` |
| `Domain Name` | text + `ADD DOMAIN` button | no | section `Domains`, help `Domain names validate forms and protect them from being used elsewhere. You can add as many domain names as you want.` |

The list picker opens `Select All` followed by lists with contact counts, e.g. `contact-tz-1 (2)`,
`UDAY_Control (42)`, `yg_send_test (0)`, `journey test yg (133)`. Selected lists render as
removable chips; the field has a clear-all `✕`. The selected count is embedded in the label itself.

`NEXT` is disabled until Name and at least one List are set.

### 4.5 Step 2 — `Form Settings`

Subtitle `Form Type is predefined for the selected template.`

- Radio cards (each with a thumbnail): **Popup** — `Appears as a light box on websites. Once users
  close it, they cannot access it again during their session. Settings can be adjusted from Display
  Options below.` · **Embedded** — `This form type will be embedded within the page. Typically seen
  in the footer of a website.` Both render dimmed/unselectable because the template predefines it.
- Accordion **`Display and Behaviour Options`** — `Set your form display preferences including the
  list of specific URLs`
  - toggle `Don't show form again after submission` (on)
  - `Display On` radios: `Entry` / `Exit` / `Percentage Scrolled` (values `page_entered`,
    `page_exited`, `page_scrolled`)
  - `Page URL` checkbox `Only show on these URLs`
  - `Hide` checkbox `Don't show pop-up for [ 1 ] days after closing.` + ⓘ
- Accordion **`Optional functions`** — `Use these settings to add functionality to your forms.`
  - toggle `Redirect to URL after form submission`
  - toggle `Send an email to this address when a subscriber is added` ⓘ
  - toggle `Enable ReCaptcha` ⓘ
  - toggle `Enable double opt-in` ⓘ

The two accordions are mutually exclusive.

### 4.6 Step 3 — `Form Design` / `Design layout of form`

Left rail of 8 accordions; right pane is a live preview inside a laptop frame with
desktop / mobile / fullscreen toggles.

| Accordion | Copy | Controls |
|---|---|---|
| `Builder Background` | `Choose an image to set as the background behind your form while building it. This will help you match the layout of the form to your current webpage.` / `You can choose an image from the Image Library or upload a new image to the Image Library from here.` | checkboxes `Desktop`, `Mobile` |
| `Popup Position` | `Adjust the position of where the pop-up will show up on your webpage` | `Position` select — `Classic center` (default), `Classic top right`, `Classic top left`, `Classic bottom right`, `Classic bottom left`, `Drawer left`, `Drawer right`, `Bar bottom`, `Bar top` |
| `Drop Shadow` | `Adjust the drop shadow under the form.` / `Reduce opacity for the best effect.` | `Shadow Colour` swatch · `Shadow Blur` 5 · `Horizontal offset (shadow position)` 4 · `Vertical offset (shadow position)` 4 |
| `Overlay Colour` | `Adjust the colour and opacity of the overlay in place on top of your website when your form popup.` | colour + opacity |
| `Dimensions` | `Adjust form parameters` | `Width *` px · `Height` + `Fit height to form elements` |
| `Padding` | `Adjust whitespace around form` | `Top *` `Bottom *` `Left *` `Right *` px |
| `Border` | `Adjust colour and thickness of the form border.` | colour · `Border Thickness *` px · `Border Radius *` px |
| `Background` | `Change the colour of the form or choose image to appear as a background of the form.` | `Colour` / `Image` tabs |

There is **no field editor here** — the form's inputs come from the template and are edited in step 4.

### 4.7 Step 4 — `Form Content`

- Segmented tabs `Main Form` / `Thank You`
- Left: editable canvas with desktop/mobile toggle, showing the live form
- Right: tabs `CONTENT` / `ROWS` / `SETTINGS`; the `CONTENT` palette is a 3-up grid of blocks —
  `TITLE`, `PARAGRAPH`, `LIST`, `IMAGE`, `DIVIDER`, `SPACER`, `SOCIAL`, `HTML`, `VIDEO`, plus two
  more below the fold
- `NEXT` first advances `Main Form` → `Thank You`, and only then moves to step 5

The whole editor is a **cross-origin iframe** (1531×569, third-party block builder).

### 4.8 Step 5 — `Form Preview` (stepper label `Finished`)

- Tabs `DETAILS` / `PREVIEW`
- Left card: form name + ✏️ edit icon + form-type chip (`Popup`), then
  `Created At`, `Modified At`, `Published At` (`Not Published Yet` when unpublished)
- Right card `Script for Your Website`:
  `Copy and paste this script tag at the end of the <head> tag, on the pages you want it to appear.
  If you want the form to appear on all pages, paste it somewhere recurring like a footer.` +
  link `If you want to learn more about how to place this form in your website, please click here.`
  - `Script Tag` — readonly block + copy icon, populated
  - `Script for manual form integration` — readonly block + copy icon, **empty** (defect)
- Footer: `EXIT` · `BACK` · `PUBLISH`

---

## 5. All interactions and behaviours

- **Row click** on the name → edit builder at step 1.
- **Status switch** toggles the form live/paused inline. *Not exercised* — it publishes/unpublishes
  a form on a live site.
- **Row select** swaps the page CTA for a delete-only bulk bar; `✕` clears.
- **Folder select** filters the table + rewrites breadcrumb and H1.
- **Folder `···`** → Privacy / Rename / Delete, gated by folder ownership.
- **Rows are drag-reorderable** — a drag grip appears at the left of a row on hover. *Not exercised.*
- **Sorting** on Name, Updated At, Created At (`Activate to sort ascending`).
- **Stepper** — completed steps are clickable, except step 5, which is `cursor-not-allowed` and only
  reachable via `NEXT`.
- **Accordions** — mutually exclusive in step 2, independent in step 3.
- Full page loads sit behind a *"Preparing an optimised workspace"* splash for 8–18 s.

---

## 6. Accessibility issues observed

1. **Stepper conveys state by colour and shape only** and labels only the active step. A screen
   reader gets five unlabelled circles; a sighted user cannot see what steps 1–5 are.
2. **Script fields have no labels or `aria-label`** — the descriptive sentence is a sibling
   paragraph, not a `<label>`, in both the modal and step 5.
3. **Script inputs are not `readOnly`** despite being copy-only, so they are editable by keyboard
   for no reason and announce as editable.
4. **Thank-you template renders dark-green text on a mid-red background** — well under 4.5:1.
5. **Copy buttons are icon-only with no accessible name** (`content_copy` glyph only).
6. **Bulk delete is an unlabelled trash icon**; the count text `1 selected` is not associated with it.
7. **Status switches have no accessible name** — a column of anonymous switches.
8. **Folder `···` buttons appear on hover only**, so they are effectively mouse-only.
9. **Persistent "…is required" helper text sits under valid, filled fields** — a screen reader
   announces every filled field as failing.
10. **Empty state is a bare text node** inside the table body, with no `role="status"`.
11. **Folder tooltips are clipped** by the panel's overflow and render as an illegible sliver.
12. **Two sibling folders are both named `test`** — indistinguishable by name alone.
13. The whole content editor is a **cross-origin iframe** of fixed 569px height; its palette is cut
    off and cannot be scrolled from the host page at a 756px viewport.

---

## 7. UX friction points worth fixing

1. **No search, no filters, no status tabs on a 43-row list.** Folders are the only affordance.
2. **The primary CTA disappears on selection.** Selecting a row removes `NEW FORM` entirely.
3. **Delete is the only bulk action** — no bulk move-to-folder, no bulk enable/disable, despite
   folders and status both being first-class.
4. **Opening the folder panel collapses the entire app nav to an icon rail** — a huge context cost
   for a filter.
5. **`Delete Permanently` in a row menu with no visible guard.** (Confirmation not verified — not
   clicked.)
6. **Template cards are blank for several seconds** with no skeleton, and `Create from scratch`
   places its title at the top while every other card places it at the bottom.
7. **The stepper hides its own map.** Numbered circles with one visible label.
8. **Touching step 3 invalidates completion of steps 4–5**, silently removing forward jumps.
9. **`NEXT` overloads two meanings in step 4** — first an inner tab change, then a step change.
10. **The Form Type radio cards in step 2 look interactive but are not**, and the reason
    (`predefined for the selected template`) is a subtitle, not a state on the control.
11. **The `List * (n)` count is baked into the field label**, which fights the static-label pattern.
12. **`Modified At` on the record does not match `Updated At` in the list** (see defects).
13. **Step-1 `NEXT` is disabled with no explanation** of what is missing.
14. **8–18 s cold loads** behind a splash on every full navigation.

---

## 8. Source defects

| # | Defect |
|---|---|
| D1 | **`Script for manual form integration` is empty** — in both the row-menu modal and step 5. The feature appears broken: two labelled fields, one of which is never populated. |
| D2 | **Persistent `Form Name is required.` / `List is required.` helper text under valid, filled fields.** Same defect family as the Products slice feed drawer. |
| D3 | **`Updated At` in the list disagrees with `Modified At` on the record** (`Jul 12, 2026` vs `Aug 29, 2026` for the same form). |
| D4 | **Interacting with step 3 resets steps 4–5 to incomplete**, disabling forward navigation until you walk the wizard again. |
| D5 | **Folder row menus render off-viewport** on first open (visible only after re-opening). |
| D6 | **Folder tooltips are clipped to an unreadable sliver** by the panel's overflow. |
| D7 | **Step transitions render the incoming panel clipped off-screen right** for ~2–4 s before settling. |
| D8 | **Copy grammar**: `…the overlay in place on top of your website when your form popup.` (Step 3, Overlay Colour). |
| D9 | **Two folders share the name `test`** — the UI permits duplicate sibling folder names. |
| D10 | **Thank-you template ships failing colour contrast** (dark green on red). |
| D11 | Script inputs are editable (`readOnly` false) although they exist only to be copied. |
| D12 | **The pagination range reads `1-0 of 10` while the table is loading** — a range computed from the page size before any row exists. |

---

## 9. Unverified

| Item | Reason |
|---|---|
| Status toggle on/off behaviour, and any toast | Publishes/unpublishes a live form — not executed. |
| `Delete Permanently` confirmation dialog and its copy | Destructive — not executed. |
| Bulk delete confirmation and result | Destructive — not executed. |
| `PUBLISH` on step 5: success state, toast, redirect, and how `Published At` fills | Publishes to a live site — not executed. |
| Folder `Privacy` dialog contents, `Rename` inline behaviour, folder `Delete` | Privacy/Rename were opened only as menu items; Delete is destructive. |
| Folder creation result (`CREATE`) | Creates a record — not executed. |
| `ROWS` and `SETTINGS` tabs of the content editor | Cross-origin iframe; synthetic clicks do not pass through. Same limitation as the Legacy segment builder in the CDP slice. |
| The final two blocks in the `CONTENT` palette | Below the fold in a fixed-height iframe that will not scroll from the host page. |
| Drag-to-reorder rows, and drag-a-form-into-a-folder | Mutates ordering/placement — not executed. |
| Conditional fields revealed by `Percentage Scrolled`, `Only show on these URLs`, and each `Optional functions` toggle | Would have altered an existing record's form state; deferred rather than risk a stray save. |
| Validation messages and error states on submit | No submission was made. |
| `Legacy` form type editor | Only observed as a `Form Type` value in two folders; its editor was not opened. |
| Network-failure / error states | Not reproducible read-only. |

Loading is **no longer unverified** — see §4.1: `Loading... Please wait` + an indeterminate bar.
