# Acquisition Forms — flow maps

One entry per header / row action. Crawled read-only 2026-08-30 on UAT account 116000.
Steps marked **UNVERIFIED** were not executed; the reason is given inline.

---

## F1 — `NEW FORM` (page header, primary CTA)

**Trigger** `NEW FORM` (dark button, top right) — a link to `/acquisition/forms/select`.

| # | State | Detail |
|---|---|---|
| 1 | **Form Selection page** | Full route (not a modal). Breadcrumb `My Acquisition Forms > Form Selection`. H1 `Form Selection`, subtitle `Select your creation experience.` |
| 1a | *loading* | Cards paint as empty ~370px boxes for several seconds; previews arrive late, with no skeleton. |
| 2 | **Decision point — pick a creation experience** | `Create from scratch`, or one of 6 templates: `First order discount` / `Neutral modern` / `Looking for something?` (each `Popup` `Center`), `Be the first to know` / `Join the club` / `Welcome coupon` (each `Embedded`). |
| 2x | **Exit** | `CANCEL` at the bottom → back to the list. |
| 3 | **Builder step 1** | Navigates to `/acquisition/forms/create`, breadcrumb gains `> New Form`. Continues at **F2**. |

Templates determine the form type, which then renders **read-only** in step 2
(`Form Type is predefined for the selected template.`).

---

## F2 — The 5-step builder

Same component for create (`/create`) and edit (`/:id/modify`); only the breadcrumb and H2 differ
(`New Form` / `Enter the details of your form.` vs `Edit Form` and the record's name).

### Step 1 — details *(stepper label: none)*

| # | State | Detail |
|---|---|---|
| 1 | Fields | `Name *` · `List * (n)` multi-select · `Domain Name` + `ADD DOMAIN` |
| 2 | **Validation gate** | `NEXT` is **disabled** until Name and ≥1 List are set. No message explains what is missing. |
| 3 | *(defect)* | In edit mode, `Form Name is required.` and `List is required.` render permanently under the already-valid fields. |
| 4 | Exit | `BACK` → previous step / Form Selection. |

### Step 2 — `Settings`

`Form Settings` · `Form Type is predefined for the selected template.`
Popup / Embedded radio cards (inert) → accordion `Display and Behaviour Options` → accordion
`Optional functions`. The two accordions are mutually exclusive. `BACK` / `NEXT`.

**UNVERIFIED** — the conditional fields behind `Percentage Scrolled`, `Only show on these URLs`, and
each of the four `Optional functions` toggles. Toggling them would have dirtied a live record.

### Step 3 — `Design`

`Form Design` · `Design layout of form`. Eight style accordions on the left
(Builder Background · Popup Position · Drop Shadow · Overlay Colour · Dimensions · Padding ·
Border · Background); a live preview in a laptop frame on the right with desktop / mobile /
fullscreen toggles.

| # | Detail |
|---|---|
| 1 | Every control is styling only — no field editing here. |
| 2 | **Defect D4**: interacting with this step marks steps 4–5 incomplete, so the stepper can no longer jump forward. Recovery = walk forward with `NEXT`, or reload the page. |

### Step 4 — `Content`

`Form Content`. Segmented tabs `Main Form` / `Thank You`; editable canvas + right panel with
`CONTENT` / `ROWS` / `SETTINGS`. `CONTENT` palette: TITLE, PARAGRAPH, LIST, IMAGE, DIVIDER, SPACER,
SOCIAL, HTML, VIDEO (+2 below the fold).

| # | Detail |
|---|---|
| 1 | `NEXT` **first** switches `Main Form` → `Thank You`. |
| 2 | `NEXT` **again** advances to step 5. |

**UNVERIFIED** — `ROWS` and `SETTINGS` tab contents, drag-and-drop of a block onto the canvas, and
per-block settings. The editor is a cross-origin iframe; synthetic clicks do not reach it.

### Step 5 — `Finished` → `Form Preview`

| # | State | Detail |
|---|---|---|
| 1 | Tabs | `DETAILS` (default) / `PREVIEW` |
| 2 | Details card | name + ✏️ + type chip; `Created At`, `Modified At`, `Published At` (`Not Published Yet`) |
| 3 | Script card | `Script for Your Website` + guidance + help link. `Script Tag` populated; `Script for manual form integration` **empty** (defect D1). |
| 4 | Footer | `EXIT` · `BACK` · `PUBLISH` |
| 5 | **UNVERIFIED — `PUBLISH`** | Publishes the form to a live website. Not executed. Success state, toast, redirect target, and how `Published At` is filled are all unknown. |
| 6 | **UNVERIFIED — `EXIT`** | Presumably returns to the list; whether it warns about unsaved changes is unknown (not clicked, to avoid a possible save-on-exit). |

Step 5 is `cursor-not-allowed` in the stepper — reachable only by `NEXT` from step 4.

---

## F3 — Row `⋮` → `Show Script Link`

| # | State | Detail |
|---|---|---|
| 1 | Trigger | Row `⋮` → `Show Script Link` |
| 2 | **Modal** `Acquisition Form Script` | `Use the following script tag to call the form.` → input + copy icon, populated with `<script type="text/javascript" async src="https://optin-staging.chd01.com/uploads/<accountId>/acquisition/builder_<formId>/script.js"></script>` |
| 3 | Second field | `Use the following script content to call the form.` → textarea + copy icon, **empty** (defect D1) |
| 4 | Exit | `CANCEL` — the only footer button. No `Done`. |

Both fields lack labels and `aria-label`, and neither is `readOnly`.

---

## F4 — Row `⋮` → `Edit`

Same destination as clicking the row name: `/acquisition/forms/:id/modify`, opening **F2** at step 1
with all five steps marked complete. Breadcrumb `My Acquisition Forms > Edit Form "<name>"`.

---

## F5 — Row `⋮` → `Preview Form`

**UNVERIFIED.** Not opened. Expected to render the form standalone (a new tab or an overlay), but
neither the surface nor the return path was confirmed.

---

## F6 — Row `⋮` → `Delete Permanently`

**UNVERIFIED — destructive.** Stopped at the menu item. Whether a confirmation dialog appears, what
it says, and what the success state looks like are all unknown. The label itself is the only signal
that the action is irreversible.

---

## F7 — Row selection → bulk bar

| # | State | Detail |
|---|---|---|
| 1 | Select ≥1 row | The header's `NEW FORM` button is **replaced** by `🗑` + `✕` + `<n> selected`. |
| 2 | Header checkbox | Supports an indeterminate state. |
| 3 | `✕` | Clears the selection and restores `NEW FORM`. |
| 4 | **UNVERIFIED — `🗑`** | Bulk delete. Destructive; not executed. Confirmation copy and result unknown. |

Delete is the **only** bulk action.

---

## F8 — Folder panel (icon button, top-left of content)

| # | State | Detail |
|---|---|---|
| 1 | Open | Panel slides in; **the global app sidebar collapses to an icon rail**. Tooltip on `✕` is `Close Folders`. |
| 2 | `Always Open` switch | Default off. Pins the panel. |
| 3 | Select a folder | Filters the table; breadcrumb → `My Acquisition Forms > <Folder>`; H1 → `Acquisition Forms - <Folder>`. |
| 3a | Empty folder | Table body renders the bare string `No data available`; pagination range shows `–`. |
| 4 | `+ New Folder` | Button is replaced in place by: input `New Folder Name`, helper `36 characters maximum`, `CREATE` / `Close`. |
| 4a | **UNVERIFIED — `CREATE`** | Creates a record; not executed. Validation, duplicate-name handling and success state unknown. Note the UI already contains two folders named `test`, so duplicates are evidently allowed. |
| 5 | Folder `···` (hover) | `Privacy` · `Rename` · `Delete`, individually disabled by ownership. |
| 5a | Ownership copy | Row tooltip `You can view and rename the folder, only owner can delete it`; Privacy tooltip `Only folder owner can set the permissions for other users.` |
| 5b | **UNVERIFIED — `Privacy`** | Dialog contents and the permission model it exposes were not opened. |
| 5c | **UNVERIFIED — `Rename`** | Not executed (mutates). |
| 5d | **UNVERIFIED — `Delete`** | Destructive; not executed. |

---

## F9 — Status switch (per row)

**UNVERIFIED.** Toggling makes a form live or takes it down on a merchant's real website. Stopped
before clicking. Whether it confirms, toasts, or optimistically updates is unknown.

---

## F10 — Sorting and pagination

| Control | Behaviour |
|---|---|
| `Name`, `Updated At`, `Created At` headers | Tri-state sort; announced as `Not sorted. Activate to sort ascending.` |
| `Rows per page` | 5 / 10 / 25 / 50 / 100, default 10 |
| Range label | `1-10 of 43`; `–` when the folder is empty |
| Prev / next | Chevrons, disabled at the ends |

---

## Cross-cutting

- Every full navigation sits behind a *"Preparing an optimised workspace"* splash for 8–18 s.
- Step transitions render the incoming panel clipped off-screen right for 2–4 s.
- There is **no unsaved-changes guard** observed anywhere in the builder; leaving mid-wizard was not
  tested against a dirty state (**UNVERIFIED**).
