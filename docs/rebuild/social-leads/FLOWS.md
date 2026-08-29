# Social Leads / Lead Ads — Flow Map

> Companion to `AUDIT.md`. One entry per action reachable from the two crawled routes.
> Read-only crawl of Maropost UAT, account `116000`, 2026-08-30.
>
> **Nothing was saved, deleted, activated, connected or authorized.** Every step that would have
> persisted, destroyed, toggled or authorized something is marked **UNVERIFIED** with the reason.

**Routes discovered**

| Route | Purpose |
|---|---|
| `/accounts/116000/social_leads` | list |
| `/accounts/116000/social_leads/new` | create |
| `/accounts/116000/social_leads/:id/edit` | edit (observed at `:id = 53`) |
| `/accounts/116000/integrations` | where the Meta connection actually lives (adjacent, not in-flow) |

---

## Flow 1 — `New Meta Lead Ad` (the primary create flow)

**Trigger** — `NEW META LEAD AD`, the only header action on the list page. A `router-link` `v-btn`,
black pill, right-aligned. On hover a Meta (∞) glyph fades in to the left of the label; at rest the
button is text-only.

### Screens and states, in order

**State 1 — navigation**
`/social_leads` → `/social_leads/new`. Client-side route change. The shell's *"Preparing an optimised
workspace"* splash covers roughly 8–16 s on a cold load. No skeleton for the form itself; the page
paints complete.

**State 2 — empty form at rest**

```
breadcrumb   My Lead Ads  ›  New Lead Ad
h2           New Lead Ad
p            Enter details of your new lead ad

§ Lead Ad Name      How we'll reference the lead ad in MMC
  [ Lead Ad Name* ..................................... ]    empty, enabled

§ Facebook Page ⓘ   Select the Facebook Page that will display the Lead Ad
  [ Facebook Page* ................................. ▾ ]     empty, enabled

§ Facebook Lead Ad  Select the Lead Ad
  [ Facebook Lead Ad* .............................. ▾ ]     empty, DISABLED (greyed)

§ Contact Lists     Select the Contact list(s) that will receive the Lead Ad
  [ Contact List * (0) ............................. ▾ ]     empty, enabled

  [ CANCEL ]   [ SAVE ]                                       SAVE = DISABLED
```

Single page, no wizard, no steps, no modal, no drawer. The footer is inline and not sticky.

**Decision point A — the ⓘ affordance.** Hovering the icon beside `Facebook Page` reveals
`This is the list of your Facebook Pages which are in 'Active' status with the app.` It is
hover-only — a bare `<i>` with no `tabindex`, `role`, `aria-label` or `title` — so keyboard and
touch users never reach this state.

**State 3 — `Facebook Page*` open**

Panel is a `role="listbox"`, two `role="option"` rows, each with a green outlined `Connected` chip:

```
Deleted page           [Connected]
Maropost Integrations  [Connected]
```

**Decision point B — which Page.** No metadata beyond the name and an always-green chip. One of the
two options is literally named `Deleted page` and is still offered as `Connected` (audit defect D2).
`Deleted page` was **not** selected — UNVERIFIED, because selecting it would fire a lead-form fetch
against a page that appears not to exist and provoke an error state on a shared UAT account.

**State 4 — Page chosen (`Maropost Integrations`)**

Three things happen at once:

1. The field takes the value and grows a `✕` clear button.
2. `Facebook Lead Ad*` becomes **enabled**; its options are fetched for that Page. No loading copy,
   no spinner — opening it too early shows an empty panel.
3. **`Facebook Page is required` appears under the now-valid field**, in `#006BAF` (audit defect D1).

**State 5 — `Facebook Lead Ad*` open**

`role="listbox"`, `max-height: 304px`, 11 options, no secondary line on any of them:

```
yash_production_launch
Maropost Integrations's form created on Tuesday, 31 March 2026 14:16
RS Sandbox Verification Form
RS Sandbox Verification Form          ← byte-identical to the row above
yg
functionality 25-march
Maropost Integrations's form created on Wednesday, 25 March 2026 13:38
10 March_functional forms
functional_flow
Untitled form 08/10/2025, 13:38
Maropost Integrations's form created on Monday, 29 September 2025 12:58
```

**Decision point C — which lead form.** This is the flow's hardest decision and the UI gives the
user nothing to make it with: no form ID, no created date on the named entries, no status, no lead
volume, no preview, no link out to the form on Facebook. Two options are indistinguishable.

**State 6 — Lead Ad chosen (`yash_production_launch`)** → same pattern as State 4:
value set, `✕` appears, and `Facebook Lead Ad is required` renders under the valid field.

**State 7 — `Contact List * (0)` open**

A `Select All` row (`role="menuitem"`, real checkbox) above exactly **10** `role="option"` rows, each
`name (contact-count)`:

```
Select All
contact-tz-1 (2)              Shopify-jatin-24Aug (0)
UDAY_Control (42)             Testing Contact List- Do Not Use Har_qa (13)
yg_send_test (0)              Neto-24Aug (0)
journey test yg (133)         manwinder-0308 (5)
                              trigger jrny (5)
                              cb-21-nov (37)
```

**State 7a — typing filters server-side.** Typing `test` returns a *different* ten, including lists
absent from the default set (`NG new sub test list (4)`, `STO_QA_Test_List -19th AUg 2026 (1)`,
`STO_QA_Test_List - Copy - Copy (1)`, `Mani Test (2)`, `STO_QA_Test_List - Copy (1)`,
`sms test 12aug (4)`, `STO_QA_Test_List (5)`). The matched substring is highlighted. `Select All`
is absent from filtered results.

**Decision point D — `Select All` is a trap.** Because the panel only ever holds 10 server-returned
results, `Select All` can only mean "the ten currently visible", and the account's true list count is
never shown. **UNVERIFIED — not activated**, because it would have been an unrecoverable bulk
multi-select on a shared account; the 10-result cap makes the behaviour inferable without firing it.

**State 8 — list chosen** → chip renders inside the box (`yg_send_test (0)` with a `✕`), label
counter goes `(0)` → `(1)`, and `List is required.` renders under the valid field.

**State 9 — name typed** → `SAVE` flips to **ENABLED**, while
`Lead Ad Name is required.` *stays visible* under the filled field in `#006BAF`.

### Validation

| Rule | Behaviour |
|---|---|
| All four fields required | Enforced client-side; `SAVE` stays disabled until all four hold a value |
| `Facebook Lead Ad` depends on `Facebook Page` | Field is `disabled` until a Page is set |
| Field emptied and blurred | **True error state**: red border + message `#B00020`, `error--text` on the input, `SAVE` disabled again |
| Field filled | **False error copy**: same string in `#006BAF`, no `error--text` (defect D1) |
| Name length / character set | No `maxlength`, no pattern, no client rule observed |
| Duplicate name | No client-side check surfaced. The name field briefly enters `v-input--is-loading` while typing but never produces a message — **UNVERIFIED** whether a server-side uniqueness rule exists |
| Announcement | None. No `role="alert"`, no `aria-live`, no `aria-invalid`, no `aria-describedby` |

### Success path — **UNVERIFIED**

`SAVE` was **not clicked**; submitting would have persisted a new lead-ad connection on a shared
UAT account. Unknown: whether it shows a spinner or blocks the button, the success toast copy, the
landing route (list vs. the new record's edit page), the created record's initial status, and
whether Maropost immediately subscribes to the Meta form.

### Failure path — **UNVERIFIED**

Only reachable by submitting. Unknown: server-side validation copy, duplicate-name handling, Meta
API error surfacing, and whether the form retains its values on failure. No `MpErrorState`-equivalent
markup exists in the DOM to render one.

### Where the user lands, and how they get back

| Exit | Behaviour | Verified |
|---|---|---|
| `CANCEL` | Navigates straight to `/social_leads`. **With three of four fields filled, no confirmation appeared** — no dialog, no toast, no undo. All input silently discarded. | ✅ executed |
| Breadcrumb `My Lead Ads` | Same — direct navigation to `/social_leads`, no guard. | ✅ executed |
| Browser back | **UNVERIFIED** — not exercised |
| Sidebar navigation away while dirty | **UNVERIFIED** — not exercised; given `CANCEL` is unguarded, a guard here is unlikely |
| `SAVE` | **UNVERIFIED** — see above |

---

## Flow 2 — Row kebab ▸ `Edit`

**Trigger** — `⋮` in the `Action` column (last column, centre-aligned) → menu item 1 of 3, icon
`mdi-pencil`. The kebab button has no accessible name and declares no popup.

### Screens and states

**State 1 — menu opens.** Attached `v-menu`, `role="menu"`, 169×120, opening down-and-right of the
trigger. It overlaps the table footer and spills past the card edge, covering the `1-1 of 1` range
and the `Next page` button while open. Three `role="menuitem"` rows, `tabindex="0"`, no divider:

```
✏  Edit
🗑  Delete
🔄 Activate Lead Ad
```

**State 2 — navigation** to `/accounts/116000/social_leads/53/edit`. Same 8–16 s splash.

**State 3 — prefilled form.** Structurally identical to Flow 1's State 2, with three strings changed
and every field populated:

```
breadcrumb   My Lead Ads  ›  Edit Lead Ad "demo_session"
h2           Edit Lead Ad
p            Update details of your lead ad

  Lead Ad Name*        demo_session
  Facebook Page*       Maropost Integrations              ✕ ▾
  Facebook Lead Ad*    yash_production_launch             ✕ ▾
  Contact List * (1)   [ shopify-2Jul (41) ✕ ]            ✕ ▾

  [ CANCEL ]   [ SAVE ]                                    SAVE = ENABLED on load
```

**Observed on arrival, before any interaction:** `Lead Ad Name is required.` and
`Facebook Page is required` both render under correctly-populated fields, then fade. The user's first
impression of an existing, working record is that it is invalid (defect D1).

### Decision points

- **Nothing is locked.** `Facebook Page` and `Facebook Lead Ad` are fully editable and clearable on a
  live connection, with no warning about what re-pointing does to leads already flowing.
- **Status is absent.** The edit form never shows or sets Active/Inactive. That control exists only
  in the list row's kebab, so "turn this off" and "change where it points" live in two different
  places.
- **`SAVE` is enabled with nothing changed** — no dirty tracking, so neither button carries a signal.

### Validation / success / failure

Same client rules as Flow 1. `SAVE` **not clicked** — success toast, landing route, and failure
handling are **UNVERIFIED** for the same reason (it would mutate a live record).

### Where the user lands, and how they get back

| Exit | Behaviour | Verified |
|---|---|---|
| Breadcrumb `My Lead Ads` | Direct navigation to `/social_leads`, no guard, no confirmation | ✅ executed |
| `CANCEL` | **UNVERIFIED** on this route — but identical component and unguarded on create, so almost certainly the same silent discard |
| `SAVE` | **UNVERIFIED** |

---

## Flow 3 — Row kebab ▸ `Delete`

**Trigger** — `⋮` → menu item **2 of 3** (not last), icon `mdi-delete`, rendered at
`rgba(0,0,0,0.87)` — visually identical to `Edit` directly above it, no divider between them, no
danger colour.

**Every step below is UNVERIFIED. Reason: destructive.** The menu item was located and its exact
label, icon, position and styling recorded from the DOM; it was **not clicked**.

Unknown:
- whether a confirmation dialog appears at all;
- if it does, its title, body copy, consequence text and footer button labels/order;
- whether it warns that in-flight Meta leads will stop being ingested;
- whether contacts already imported are affected;
- the success toast copy;
- where the user lands afterwards (presumably the list) and whether there is an undo.

**Rebuild note:** this must become `MpMenuItem danger`, last in the menu, behind
`<v-divider class="my-1" />`, opening an `MpConfirmDialog` with `danger` and a `consequences` line.

---

## Flow 4 — Row kebab ▸ `Activate Lead Ad`

**Trigger** — `⋮` → menu item 3 of 3, icon `mdi-autorenew`. The label is state-dependent; the only
record in the account is `Inactive`, so only the Activate wording was observable.

**Every step below is UNVERIFIED. Reason: it is a status/enable toggle.** The item was located and
recorded from the DOM; it was **not** clicked.

Unknown:
- whether it toggles immediately or confirms first;
- the Active-row label (`Deactivate Lead Ad`? `Pause`?);
- whether activation subscribes Maropost to the Meta form server-side (i.e. whether this is a local
  flag or a real webhook subscription);
- the success/failure feedback;
- whether the row's `Status` chip and `Updated At` refresh in place or require a reload.

**Rebuild note:** this belongs in the `Status` cell as `MpStatusToggle`, not buried in an overflow
menu — see AUDIT friction #4.

---

## Flow 5 — Table cell links

**Trigger A — `Facebook Page` cell** (`Maropost Integrations (74)`).
`<a target="_blank" rel="noopener noreferrer">` to the public Facebook page profile. Opens a new tab
outside the app. Return path is the browser tab, not the app. ✅ target confirmed from the DOM; the
link was **not followed** (leaving the app adds nothing to this audit).

**Trigger B — `Contact Lists` cell** (`shopify-2Jul`).
`<a class="text--primary">` with **no `href`**. Styled and announced as a link, does nothing on
click, not in the tab order. There is no path from the list page to the contact list it names.
✅ confirmed from the DOM (audit defect D3).

**Trigger C — the `Lead Ad Name` cell.** Not a link, no row click handler. The record cannot be
opened from the cell that names it. ✅ confirmed.

---

## Flow 6 — Sort and pagination

**Sort** — `Lead Ad Name`, `Created At` and `Updated At` carry `sortable` and
`aria-sort="none"` ("Not sorted. Activate to sort ascending."). `Facebook Page`, `Contact Lists`,
`Status` and `Action` are not sortable — notably **Status cannot be sorted**, which is the one column
a user scanning this table most wants to group by.
**Direction behaviour UNVERIFIED** — with a single row, ascending vs. descending is unobservable.

**Pagination** — footer reads `Rows per page: 10` · `1-1 of 1` · ‹ ›, both pager buttons `disabled`.
The rows-per-page combobox offers `5 / 10 / 25 / 50 / 100`, default `10`.
**Page-turn behaviour UNVERIFIED** — one page of data exists.

The rows-per-page control's accessible name is the untranslated token
`$vuetify.dataTable.itemsPerPageText` (audit defect D4).

---

## Flow 7 — Connecting a Meta account

**There is no trigger for this anywhere in the Lead Ads feature.** No "Connect Facebook", no
"Add a Page", no empty-state CTA, on the list, the create form or the edit form. The `Facebook Page*`
dropdown presents already-connected Pages and offers no way to add one.

The connection lives one module away, at **Apps ▸ Integrations**
(`/accounts/116000/integrations`), as a tile in a grid:

```
Meta
Integrate your leads and segmented contacts with your Meta account.
```

The tile exposes no `<button>` or `<a>` of its own — the card itself is the target. It carries
**no `Active` badge**, unlike `Retail Express`, `Keap`, `UltraCart`, `ClickBank` and
`Abandoned Cart REST API`, despite the Lead Ads form reporting two Pages as `Connected`.

**The tile was read but NOT clicked, and everything past it is UNVERIFIED.**
Reason: activating it may begin a Meta OAuth consent flow. Per the crawl's safety rules, no social
account was connected or authorized, no consent screen was reached, and no credentials were entered
at any point.

Unknown: the consent screen, the permission scopes requested, the page-picker, what "Active status
with the app" means operationally, the disconnect path, and what happens to existing lead ads when a
Page is disconnected.

**Rebuild note:** the create flow's hardest failure mode — a first-run user with no connected Page —
has no route out of it today. The `Facebook Page*` field should render an `MpEmptyState`
(`variant="launcher"`) inside the panel with a `Connect a Meta account` action that deep-links to
the Integrations tile and returns.

---

## Flow 8 — Empty and error states

| State | Status |
|---|---|
| List with zero lead ads | **UNVERIFIED — not reachable.** The account holds exactly one record and deleting it is prohibited. No empty-state markup exists in the DOM to inspect, and `.v-data-table__empty-wrapper` is absent, so it is not clear the view even has one. |
| Create form with zero connected Pages | **UNVERIFIED — not reachable.** Two Pages are connected and disconnecting is prohibited. |
| Create form with a Page that has zero lead forms | **UNVERIFIED.** The only untried Page is `Deleted page`, deliberately not selected. |
| Contact List picker with zero lists | **UNVERIFIED — not reachable.** |
| Network / API error on any route | **UNVERIFIED — not provoked.** No console errors or exceptions were captured on any route during the crawl. |
| Loading | ✅ observed: an 8–16 s shell splash, an indeterminate `progressbar` in the AppBar, and **no table skeleton and no field skeleton** — dropdowns simply hold no options until their fetch resolves, with no "Loading…" copy. |
