# Social Leads / Lead Ads — UAT UI Audit

> Read-only crawl of the live Maropost UAT app, account `116000`, 2026-08-30.
> Sidebar path: **Marketing ▸ Acquisition ▸ Lead Ads**.
> Legacy Vuetify 2 views mounted inside the Vuetify 3 app shell.
>
> URLs crawled:
> - `/accounts/116000/social_leads` — list
> - `/accounts/116000/social_leads/new` — create
>
> Nothing was saved, deleted, activated, connected or authorized. See **Unverified** for
> everything deliberately left untouched.

---

## 1. Page purpose & primary user task

**What this feature is.** A bridge between Meta (Facebook) Lead Ads and Maropost CDP. A merchant
picks a Facebook Page they have already connected, picks one of that Page's *instant forms* (the
Meta-side lead form), picks the Maropost Contact List(s) that should receive the leads, and gives
the connection a name. From then on, people who submit that Facebook lead form get written into
those contact lists.

**Primary user task (list page):** "Which of my Facebook lead forms are piped into Maropost, and is
each one on or off?"

**Primary user task (create page):** "Wire one Facebook lead form to one or more contact lists."

**Mental model mismatch worth naming up front.** The object is called a "Lead Ad" everywhere in the
UI, but it is not an ad — it is a *sync rule / connection*. Nothing here creates, edits, budgets or
publishes an advertisement. The list is a list of integrations. Every piece of the copy inherits
this confusion (`New Meta Lead Ad`, `Activate Lead Ad`, `Facebook Lead Ad*` for what is actually a
lead *form*).

---

## 2. Layout structure and hierarchy

### 2.1 `/social_leads` — list

```
AppBar (global, Vuetify 3 shell)
AppSidebar (global, Vuetify 3 shell)
└── content column (no in-content rail)
    ├── breadcrumb strip      "My Lead Ads"           ← single crumb, plain text, not a link
    ├── header band
    │   ├── h2 "Lead Ads"  (class display-1)          ← no h1 anywhere on the page
    │   └── primary CTA (right-aligned)  "NEW META LEAD AD"  → /social_leads/new
    └── card
        ├── v-data-table (7 columns, no toolbar above it)
        └── footer  "Rows per page: 10"  ·  "1-1 of 1"  ·  ‹  ›
```

There is **no toolbar** — no search, no filter, no status tabs, no folder select, no bulk-selection
column, no column chooser, no export. The card starts straight at the `<thead>`.

Vertical rhythm is set by the legacy view, not the shell: the breadcrumb sits ~20px under the
AppBar, the header band has no bottom border, and the card is full-bleed to the content max-width.

### 2.2 `/social_leads/new` — create

```
AppBar + AppSidebar
└── centred single content column (~1065px wide, left-aligned inside it)
    ├── breadcrumb  "My Lead Ads" (link)  ›  "New Lead Ad" (current, plain text)
    ├── h2 "New Lead Ad"  (class display-1)
    ├── p  "Enter details of your new lead ad"
    ├── §  h2 "Lead Ad Name"     + helper  + 1 field
    ├── §  h2 "Facebook Page"  ⓘ + helper  + 1 field
    ├── §  h2 "Facebook Lead Ad" + helper  + 1 field
    ├── §  h2 "Contact Lists"    + helper  + 1 field
    └── footer row (inline, left-aligned, not sticky)   [ CANCEL ]  [ SAVE ]
```

**It is a single-page long-scroll form.** Not a wizard, not a modal, not a drawer. There are no
steps, no progress indicator, no save-and-continue. The whole form is ~1 viewport plus a little; on
a 1686×757 window the CANCEL/SAVE row is reachable after one scroll.

Every one of the four sections is a `<h2>` + a one-line description + exactly one control. Four
`<h2>` section headings sit under a fifth `<h2>` page title (see accessibility).

---

## 3. Components used → design-system mapping

| UAT surface | Legacy implementation | Rebuild with |
|---|---|---|
| List breadcrumb + `Lead Ads` title + `NEW META LEAD AD` | bespoke banner div + `v-btn` | **MpPageHeader** (`title="Lead Ads"`, `#actions` slot) |
| Create breadcrumb + `New Lead Ad` + `Enter details of your new lead ad` | bespoke `h2.display-1` + `p` | **MpPageHeader** (`title`, `subtitle`, `backTo="/social_leads"`) |
| The 7-column table | Vuetify 2 `v-data-table` | **v-data-table** + **MpDataTableToolbar** above it (currently missing entirely) |
| `Inactive` pill in Status column | `v-chip--outlined v-size--small` | **MpStatusChip** (`type="general"` or a new `type="leadad"`, `size="sm"`) |
| `Connected` pill inside the Page dropdown options | `v-chip--outlined success--text` | **MpStatusChip** (`type="general"`, `size="sm"`) inside an **MpListRow** option row |
| Row kebab (`⋮`) | `v-btn--icon` + attached `v-menu` | **MpRowActionsMenu** |
| `Edit` / `Delete` / `Activate Lead Ad` menu rows | `div.v-list-item[role=menuitem]` | **MpMenuItem** (`Delete` → `danger`, moved last, behind a divider) |
| `Activate Lead Ad` menu row | menu item that flips status | **MpStatusToggle** in the Status cell (see friction #4) |
| Rows-per-page + `1-1 of 1` + ‹ › | `v-data-footer` | v-data-table's own footer |
| The four `h2` + description section blocks | bespoke `h2` + `p` | **MpFormSection** (`title`, `description`) |
| The four controls, one per section | 4 × `v-input` at full width | **MpFormGrid** `:cols="1"` (or `cols=2` with `.mp-form-grid__full`) |
| `Lead Ad Name*` | `v-text-field` outlined | bare Vuetify field with `label="Lead Ad Name *"` |
| `Facebook Page*` | `v-autocomplete` | Vuetify autocomplete; option row = **MpListRow** + **MpStatusChip** |
| `Facebook Lead Ad*` | `v-autocomplete`, disabled until Page set | same, `:disabled` |
| `Contact List * (n)` | `v-autocomplete multiple` + chips + `Select All` | same; the `Select All` row is a **MpMenuItem**-style header row |
| ⓘ next to `Facebook Page` | bare `<i class="mdi-information-outline">` + `v-tooltip` | a real focusable icon button + tooltip |
| `CANCEL` / `SAVE` footer row | two `v-btn` inline | **MpPageHeader** `#actions`, or a sticky footer bar |
| The confirm that *should* exist on Cancel-when-dirty | **absent** | **MpConfirmDialog** (`guarded` drawer/dialog pattern) |
| The confirm that *should* exist on Delete | **UNVERIFIED — not clicked** | **MpConfirmDialog** (`danger`) |
| Empty list state | **UNVERIFIED — not reachable** | **MpEmptyState** (`variant="launcher"`) |
| Loading state | see §5.6 | **MpTableSkeleton** |

**Components that have no counterpart in the source and should be added in the rebuild:**
`MpDataTableToolbar` (search + filter), `MpFilterTabs` (All / Active / Inactive),
`MpEmptyState`, `MpErrorState`, `MpTableSkeleton`, `MpConfirmDialog`, `MpFloatingBulkBar`.

---

## 4. All data fields, labels and copy

### 4.1 List page — exact strings

| Element | Exact copy |
|---|---|
| Breadcrumb (single) | `My Lead Ads` |
| Page heading (`h2.display-1`) | `Lead Ads` |
| Primary CTA | `New Meta Lead Ad` (rendered uppercase by `v-btn`; DOM text is title case) |
| Rows-per-page label | `Rows per page:` |
| Range label | `1-1 of 1` |
| Pager buttons | `aria-label="Previous page"`, `aria-label="Next page"` (both disabled at 1 page) |

**Table columns, in order:**

| # | Header | Sortable | Align | Cell content |
|---|---|---|---|---|
| 1 | `Lead Ad Name` | **yes** (`sortable`, `aria-sort="none"`, "Not sorted. Activate to sort ascending.") | start | plain text in a tooltip-wrapped `div` — **not a link** |
| 2 | `Facebook Page` | no | start | external `<a target="_blank" rel="noopener noreferrer">` to the Facebook page profile; text is `Maropost Integrations (74)` — name + a numeric suffix that is never explained |
| 3 | `Contact Lists` | no | start | `<a class="text--primary">` with **no `href`** — looks tappable, does nothing |
| 4 | `Created At` | **yes** | start | `Jul 03, 2026 at 03:25 AM` — absolute, no timezone, no relative form |
| 5 | `Updated At` | **yes** | start | `Jul 03, 2026 at 03:27 AM` |
| 6 | `Status` | no | start | `v-chip--outlined v-size--small` reading `Inactive` |
| 7 | `Action` | no | **center** (only centred header) | kebab `⋮` icon button |

Observed row data (single row): `demo_session` · `Maropost Integrations (74)` ·
`shopify-2Jul` · `Jul 03, 2026 at 03:25 AM` · `Jul 03, 2026 at 03:27 AM` · `Inactive`.

**Selection & bulk actions:** none. Zero `input[type=checkbox]` in the table.

**Row link target:** none. The row itself is not a link, and the name cell is not a link. The only
way into a record is the kebab → `Edit`.

**Row kebab menu — exact items, in order:**

1. `Edit`  (icon `mdi-pencil`)
2. `Delete`  (icon `mdi-delete`)
3. `Activate Lead Ad`  (icon `mdi-autorenew`) — label is state-dependent; on an `Inactive` row it
   offers Activate. The Deactivate wording on an Active row is **UNVERIFIED** (no active row exists
   and toggling is out of scope).

No divider. No danger styling — `Delete` renders at `rgba(0,0,0,0.87)`, identical to `Edit`.
`Delete` is second of three, not last.

### 4.2 Create page — exact strings

| Element | Exact copy |
|---|---|
| Breadcrumb | `My Lead Ads` (link → `/accounts/116000/social_leads`) `›` `New Lead Ad` |
| Page heading (`h2.display-1`) | `New Lead Ad` |
| Page subtitle | `Enter details of your new lead ad` |
| Section 1 heading | `Lead Ad Name` |
| Section 1 description | `How we'll reference the lead ad in MMC` |
| Section 2 heading | `Facebook Page` + ⓘ |
| Section 2 description | `Select the Facebook Page that will display the Lead Ad` |
| Section 2 tooltip | `This is the list of your Facebook Pages which are in 'Active' status with the app.` |
| Section 3 heading | `Facebook Lead Ad` |
| Section 3 description | `Select the Lead Ad` |
| Section 4 heading | `Contact Lists` |
| Section 4 description | `Select the Contact list(s) that will receive the Lead Ad` |
| Footer buttons, in order | `CANCEL` (outlined) · `SAVE` (contained, black, disabled until valid) |

**Fields, in DOM order:**

| # | Label (floating) | Type | Required | Default | Placeholder | Helper | Gating |
|---|---|---|---|---|---|---|---|
| 1 | `Lead Ad Name*` | `v-text-field`, `type=text`, **no `maxlength`** | yes | empty | none | none on the field (the section description carries it) | gates SAVE |
| 2 | `Facebook Page*` | `v-autocomplete` (single) | yes | empty | none | none | gates SAVE **and** enables field 3 |
| 3 | `Facebook Lead Ad*` | `v-autocomplete` (single) | yes | empty | none | none | **disabled until field 2 is set**; gates SAVE |
| 4 | `Contact List * (n)` | `v-autocomplete` **multiple**, chips + clear | yes | `(0)` | none | none | gates SAVE |

The required marker is a literal `*` baked into the label string. Field 4's label doubles as a live
counter: `Contact List * (0)` → `Contact List * (1)`. There is no separate count display.

**Dropdown option sets (expanded and enumerated):**

`Facebook Page*` — 2 options, each `role="option"` with a green outlined `Connected` chip:

1. `Deleted page` — `Connected`
2. `Maropost Integrations` — `Connected`

`Facebook Lead Ad*` (after selecting `Maropost Integrations`) — 11 options, `role="listbox"`,
`max-height: 304px`, no per-option metadata:

```
 0  yash_production_launch
 1  Maropost Integrations's form created on Tuesday, 31 March 2026 14:16
 2  RS Sandbox Verification Form
 3  RS Sandbox Verification Form          ← byte-identical duplicate of #2
 4  yg
 5  functionality 25-march
 6  Maropost Integrations's form created on Wednesday, 25 March 2026 13:38
 7  10 March_functional forms
 8  functional_flow
 9  Untitled form 08/10/2025, 13:38
10  Maropost Integrations's form created on Monday, 29 September 2025 12:58
```

`Contact List * (n)` — a `Select All` row (`role="menuitem"`, real `input[type=checkbox]`) followed
by exactly **10** list options (`role="option"`, icon-checkbox, no real input), each
`name (contact-count)`:

```
Select All
contact-tz-1 (2)
UDAY_Control (42)
yg_send_test (0)
journey test yg (133)
Shopify-jatin-24Aug (0)
Testing Contact List- Do Not Use Har_qa (13)
Neto-24Aug (0)
manwinder-0308 (5)
trigger jrny (5)
cb-21-nov (37)
```

Typing `test` into the same field returns a **different** 10, including lists absent from the
initial set (`NG new sub test list (4)`, `STO_QA_Test_List -19th AUg 2026 (1)`,
`STO_QA_Test_List - Copy - Copy (1)`, `Mani Test (2)`, `STO_QA_Test_List - Copy (1)`,
`sms test 12aug (4)`, `STO_QA_Test_List (5)`). The list is therefore **server-searched and capped at
10**, not the account's full set. `Select All` disappears from the filtered result set.

**Validation messages (exact):**

- `Lead Ad Name is required.`  (trailing period)
- `Facebook Page is required`  (**no** trailing period)
- `Facebook Lead Ad is required`  (**no** trailing period)
- `List is required.`  (trailing period, and calls field 4 "List", not "Contact List")

### 4.3 The edit route — `/social_leads/53/edit`

Reached from the row kebab → `Edit`. **It is the same four-field page**, prefilled, with three
strings changed:

| Element | Create | Edit |
|---|---|---|
| Breadcrumb 2nd crumb | `New Lead Ad` | `Edit Lead Ad "demo_session"` (record name quoted) |
| Heading | `New Lead Ad` | `Edit Lead Ad` |
| Subtitle | `Enter details of your new lead ad` | `Update details of your lead ad` |

Everything else is identical — same four `h2` sections, same helper copy, same
`CANCEL` / `SAVE` footer.

Behaviours specific to edit:

- **Nothing is locked.** `Facebook Page` and `Facebook Lead Ad` remain fully editable and clearable
  on an existing connection, with no warning that re-pointing a live lead ad changes where
  in-flight leads land.
- **`SAVE` is enabled on load, on an untouched form.** There is no dirty tracking, so the button
  gives no signal about whether anything has changed.
- **There is no Status control on the edit form.** Active/Inactive can only be changed from the list
  row's kebab. The edit page never shows the record's current status at all.
- **Prefilled values render inconsistently with the list.** The list's Facebook Page cell reads
  `Maropost Integrations (74)`; the edit form's field reads `Maropost Integrations`. The list's
  Contact Lists cell reads `shopify-2Jul`; the edit form's chip reads `shopify-2Jul (41)`. The same
  two values, four renderings.
- **Defect D1 is at its most visible here** — see §8.

### 4.4 Social-account connection step

**There is no connection step inside this flow.** The create form assumes Facebook Pages are already
connected; the `Facebook Page*` dropdown simply lists them with a green `Connected` chip. There is no
"Connect Facebook", "Add a Page", "Log in with Facebook" button, link, or empty-state anywhere on the
list, create or edit pages, and no OAuth affordance was presented at any point. The only pointer at
the connection concept is the ⓘ tooltip
(`This is the list of your Facebook Pages which are in 'Active' status with the app.`), which names
an "app" the UI never otherwise mentions and never links to.

Connection lives one module away, under **Apps ▸ Integrations** (`/accounts/116000/integrations`),
as one tile in a grid of integrations. Confirmed read-only; **nothing on that page was clicked**:

- Tile heading: `Meta`
- Tile body: `Integrate your leads and segmented contacts with your Meta account.`
- The tile carries **no `Active` badge**, while sibling tiles do (`Retail Express Active`,
  `Keap Active`, `UltraCart Active`, `ClickBank Active`, `Abandoned Cart REST API Active`) — even
  though two Facebook Pages report `Connected` inside the Lead Ads form. The two surfaces disagree
  about whether Meta is connected.
- The tile exposes no `<button>` or `<a>` of its own; the card itself is the target. **It was not
  activated** — clicking it could begin a Meta OAuth flow, which is out of scope.

Everything past that tile — the consent screen, the page-picker, the permission scopes, the
disconnect path — is **UNVERIFIED** by design. No account was authorized and no credentials were
entered anywhere during this crawl.

---

## 5. All interactions and behaviours

### 5.1 List page

- **`NEW META LEAD AD`** is a `router-link` `v-btn` to `/accounts/116000/social_leads/new`. On hover
  a Meta (∞) glyph fades in to the left of the label — the icon is hover-only, so at rest the button
  is a plain black pill.
- **Column sort** is available on `Lead Ad Name`, `Created At`, `Updated At` only. `Facebook Page`,
  `Contact Lists`, `Status` and `Action` carry no `sortable` class. With one row, sort direction
  changes were not observable.
- **Row hover** paints a light grey row background. There is no row-level click handler.
- **Facebook Page cell** opens the public Facebook page in a new tab.
- **Contact Lists cell** renders as a link (`<a class="text--primary">`) but has no `href` — clicking
  it does nothing and it is not in the tab order.
- **Kebab** toggles an *attached* `v-menu` (`role="menu"`) with three `role="menuitem"` rows; clicking
  the trigger again closes it. Each item is `tabindex="0"`.
- **Pagination**: fixed footer, `Rows per page: 10`, range `1-1 of 1`, both pager buttons disabled.
  The rows-per-page control is a combobox; its option set was not expanded.
- **No search, no filters, no tabs, no bulk bar, no export, no refresh.**
- **Menu placement.** The kebab menu is an *attached* `v-menu`, so it is positioned off the row, not
  teleported to the body. It renders fully on-screen (measured `169×120` at `top:282 left:1451` in a
  `1686×757` viewport) but **spills past the card's bottom and right edges and covers the table
  footer**, obscuring the `1-1 of 1` range and the `Next page` control while open. On the last row of
  a full page this puts the menu over the pagination the user may be reaching for.
- **Rows-per-page options** are `5`, `10`, `25`, `50`, `100`, defaulting to `10`.

### 5.2 Create — progression gating

```
(load)              SAVE disabled · field 3 disabled
set Facebook Page → field 3 enabled (options fetched for that page)
set fields 1–4    → SAVE enabled
clear any field   → SAVE disabled again
```

SAVE is enabled the moment all four fields hold a value; there is no async/server validation gate
and no duplicate-name check surfaced in the UI.

### 5.3 Create — field behaviours

- Fields 2, 3, 4 are **autocompletes**: focusing turns the box into a text input and typing filters
  server-side. The matched substring is highlighted in the option text.
- Once a value is set, fields 2, 3 and 4 grow a `✕` clear affordance next to the caret.
- Field 4 renders each selection as a deletable chip inside the box; the label counter increments.
- Field 1 briefly enters `v-input--is-loading` (an indeterminate bar under the box) while typing —
  a loading indicator on a plain text field with no visible async rule attached to it.
- The floating-label pattern is Vuetify 2's: the label sits inside the box at 16px and animates up
  into the outline notch on focus. This is **not** the static top label the design system uses.
- Focus is signalled by border + label recolouring to `#006BAF`; `outline` is explicitly `none` on
  the inputs.

### 5.4 Create — CANCEL

`CANCEL` was clicked with the form dirty (name typed, Page set, Lead Ad set, one contact list
chipped). **No confirmation appeared.** The router navigated straight back to
`/accounts/116000/social_leads` and all input was discarded. No toast, no undo.

### 5.5 Create — SAVE

**Not clicked** (out of scope). Success path, failure path, toast copy and landing destination are
all **UNVERIFIED**.

### 5.6 Loading / skeleton behaviour

Both routes render behind the shell's *"Preparing an optimised workspace"* splash for roughly
8–16 seconds on a cold navigation. Within the page there is:

- an indeterminate `progressbar` in the AppBar (`ref_1`, `ref_5`) that stays mounted;
- **no table skeleton** — the list card appears fully populated or not at all;
- **no field-level skeleton** — the create form's dropdowns simply hold no options until their fetch
  resolves. Opening `Facebook Lead Ad` immediately after choosing a Page shows an empty panel with no
  "Loading…" copy.

### 5.7 Error states

No error state was reproduced. No console errors or exceptions were captured on either route.
Network failure behaviour is **UNVERIFIED**.

---

## 6. Accessibility issues observed

**Headings**

1. **No `<h1>` on either page.** The page title is `<h2 class="display-1">` on both routes.
2. **Flat heading hierarchy on the create page.** `New Lead Ad`, `Lead Ad Name`, `Facebook Page`,
   `Facebook Lead Ad` and `Contact Lists` are *all* `<h2>`. The four section headings are children of
   the page title conceptually but siblings structurally, so a screen-reader outline reads five peer
   sections with no page title.

**Names and labels**

3. **The row kebab has no accessible name.** `<button>` with an `mdi-dots-vertical` icon and no text,
   no `aria-label`, no `title`. It announces as "button".
4. **The kebab trigger declares no popup.** No `aria-haspopup`, no `aria-expanded`, so the menu's
   open/closed state is invisible to AT even though the panel itself is correctly `role="menu"`.
5. **The rows-per-page control's accessible name is an untranslated i18n key** —
   `aria-label="$vuetify.dataTable.itemsPerPageText"`. A screen reader literally reads the token.
6. **The ⓘ tooltip is keyboard-unreachable.** It hangs off a bare `<i>` with no `tabindex`, no
   `role`, no `aria-label`, no `title` — hover-only. The content
   (`This is the list of your Facebook Pages which are in 'Active' status with the app.`) is
   unavailable to keyboard and screen-reader users, and on touch.
7. **The `Contact Lists` cell is an `<a>` with no `href`.** Not focusable, not activatable, but
   announced/styled as a link.

**Roles**

8. **Mixed roles in one popup.** The Contact List panel is a `role="listbox"` whose first row is
   `role="menuitem"` (`Select All`) and whose remaining rows are `role="option"`. A listbox may not
   contain a menuitem.
9. **The option checkboxes are not checkboxes.** Only `Select All` has a real
   `input[type=checkbox]`; the 10 option rows draw an icon-only checkbox and rely on
   `aria-selected` on the option. Checked state is conveyed twice, inconsistently.
10. **Validation messages are not announced.** The `.v-messages` wrapper carries no `role="alert"`,
    no `aria-live`, and the inputs carry no `aria-describedby` / `aria-invalid` / `aria-required`.
    An error appears visually with nothing announced.

**Focus**

11. **`outline: none` on the inputs.** Focus is carried solely by a 2px border + label colour change
    from grey to `#006BAF`. Adequate for the boxed fields; the icon buttons (kebab, clear `✕`,
    caret) and the menu rows have no observed focus treatment at all.
12. No focus-trap issue found — the attached `v-menu` and the autocomplete panels close on `Escape`
    and return focus to the field. No keyboard trap observed.

**Colour / contrast**

13. Body helper text `#616161` on `#FFFFFF` ≈ **5.9:1** — passes.
14. The primary/valid-state message `#006BAF` on `#FFFFFF` at 12px ≈ **5.6:1** — passes. The problem
    with this text is semantic, not contrast (see §8, defect D1).
15. The error state `#B00020` on `#FFFFFF` ≈ **7.4:1** — passes.
16. The `Inactive` status chip is `v-chip--outlined theme--dark` inside a light table. A dark-theme
    chip in a light context is exactly the paired-token violation the design system forbids: the
    chip sets a surface and inherits its foreground. The amber-on-white outline chip is the weakest
    text on the page and should be re-derived from a declared `--pos/--neg/--warn` pair.
17. Status is communicated by **colour + word** in the chip, which is fine — but the Facebook Page
    dropdown's `Connected` chip is green-only reinforcement of a word that never varies (every
    option says `Connected`), so the colour carries no information at all.

**Other**

18. The list page's single breadcrumb `My Lead Ads` is not a `<nav>`/`aria-label`-ed breadcrumb — it
    is a bare `<ul><li>` with plain text, duplicating the `h2` immediately below it.

---

## 7. UX friction points worth fixing

1. **The list has no way to find anything.** No search, no status filter, no tabs, no sort on Status,
   no folder/tag grouping. With one record it is invisible; at 40 lead ads across 6 pages the only
   tool is 10-row pagination. → `MpDataTableToolbar` + `MpFilterTabs` (All / Active / Inactive).

2. **There is no detail view and no row link.** The name cell is inert text. A user must find the
   kebab in the last column and choose `Edit` — three interactions to open a record they can see.
   → make the name cell the link, keep the kebab for secondary actions.

3. **`Delete` sits in the middle of the kebab, styled identically to `Edit`.** It is one mis-click
   from `Edit` and carries no visual warning. → `MpMenuItem danger`, moved last, behind a divider,
   guarded by `MpConfirmDialog`.

4. **Status is read-only in the table but editable in the kebab.** The `Inactive` chip is inert; the
   toggle hides inside the overflow menu as `Activate Lead Ad`. A user scanning statuses has to open
   a menu per row to change one. → `MpStatusToggle` in the Status cell.

5. **`Cancel` destroys a filled-in form silently.** Four fields, three of them requiring server
   round-trips to populate, discarded by one click with no confirm and no undo.
   → guarded form + `MpConfirmDialog`.

6. **The lead-form picker is unusable at scale.** Eleven options, two of them byte-identical
   (`RS Sandbox Verification Form` twice), several auto-generated
   (`Maropost Integrations's form created on Tuesday, 31 March 2026 14:16`,
   `Untitled form 08/10/2025, 13:38`), and **no** secondary line to tell them apart — no form ID, no
   created date on the named ones, no status, no lead volume, no preview. Choosing correctly is
   guesswork. → `MpListRow` options with `eyebrow` (form ID) and `meta` (created date + lead count),
   and a link out to the form on Facebook.

7. **`Select All` on a server-capped list is a trap.** The panel only ever holds 10 results, and
   typing changes which 10. `Select All` therefore means "select the ten currently visible", which
   almost never matches the user's intent, and there is no indication of how many lists exist. → drop
   `Select All`, or label it `Select all 10 shown` and add a total count.

8. **The Contact List picker gives no way to create a list.** If the destination list does not exist
   yet, the user must abandon the form (losing everything — see #5), go to CDP ▸ Contact Lists,
   create it, and start over. → an inline "Create new list" row in the panel.

9. **No field mapping, and no acknowledgement that mapping exists.** The Facebook form's questions
   are never shown, previewed, or mapped to Maropost contact fields. The user connects a form
   without ever seeing what data it collects or where it lands. This is the single biggest gap in
   the flow. → a fifth section showing the selected form's fields and their contact-field targets.

10. **`MMC` is internal jargon in user-facing copy.** `How we'll reference the lead ad in MMC` —
    the acronym appears exactly once in the whole flow and is never expanded.

11. **The whole flow calls a lead *form* a lead *ad*.** `Facebook Lead Ad*` selects an instant form.
    The section description `Select the Lead Ad` restates the label without adding meaning.

12. **The section descriptions are mostly restatements.** `Select the Lead Ad` under a heading that
    says `Facebook Lead Ad`; `Select the Facebook Page that will display the Lead Ad` under
    `Facebook Page`. None explains consequence (what happens to leads already collected? does this
    backfill? how often does it sync?). That is the copy the user actually needs.

13. **Four sections of one field each is a lot of scroll for four inputs.** The form is one viewport
    plus a scroll for what fits comfortably in a `MpFormDrawer` at `size="lg"` or a single
    `MpFormGrid`. The `h2` per field inflates a 4-field form into a 5-heading page.

14. **The footer is not sticky.** On a short window the user fills field 4, then must scroll to find
    SAVE. → sticky action bar, or move the actions into `MpPageHeader #actions`.

15. **Dates are absolute-only, with no timezone.** `Jul 03, 2026 at 03:25 AM` — no `UTC`/local
    marker, and `Created At` / `Updated At` two minutes apart both take a full column.

16. **`Maropost Integrations (74)` — the `(74)` is unexplained.** It appears in the table cell and in
    the row data but nowhere in the dropdown (which shows `Maropost Integrations` alone), so the same
    entity is rendered two different ways in two places.

17. **Editing a live connection is unguarded and unexplained.** On the edit form, `Facebook Page` and
    `Facebook Lead Ad` are freely clearable and re-pointable on a connection that may be actively
    ingesting leads, with no warning about what happens to leads in flight. Combined with
    `SAVE` being enabled on load and `CANCEL` discarding silently, all three buttons are unguarded.

18. **"Turn it off" and "change what it does" live in different places.** Status is only togglable
    from the list kebab; the edit form neither shows nor sets it. A user who opens a record to
    pause it has to back out to the list to find the control.

19. **The same two values render four different ways.** The list shows
    `Maropost Integrations (74)` / `shopify-2Jul`; the edit form shows
    `Maropost Integrations` / `shopify-2Jul (41)`. Whatever the `(n)` suffixes mean, they should be
    the same in both places or in neither.

20. **The connect-your-account dead end.** A first-run user with no connected Page hits a `Facebook
    Page*` dropdown that is simply empty, on a page that never mentions connecting an account and
    never links to Apps ▸ Integrations. The single most likely first-run state has no route out of
    it.

21. **No empty state and no zero-data guidance.** With no lead ads *and* no connected Facebook Page,
    a first-run user would land on a table with headers and nothing else, and a create form whose
    first dropdown is empty with no explanation of why or what to do. (Both states are UNVERIFIED —
    but no empty-state component exists in the DOM to render them.)

---

## 8. Source defects

| ID | Severity | Defect |
|---|---|---|
| **D1** | **High** | **A field that is correctly filled displays its own "is required" validation message.** Reproduced on all four fields, on both routes. On create: `Lead Ad Name is required.` persists under the box while it contains `audit probe do not save` **and** SAVE is enabled; `Facebook Page is required`, `Facebook Lead Ad is required` and `List is required.` each appear under their field immediately after a *valid* selection. **On the edit route it is worst** — opening the existing `demo_session` record shows `Lead Ad Name is required.` and `Facebook Page is required` under two correctly-populated fields on load, with no user interaction at all, before fading out. The message is bound as a permanent message rather than gated on validity, so it renders in the focused/primary colour (`#006BAF`, `primary--text`, `error--text` absent) instead of red. The *identical string* therefore means "you're fine" in blue/grey and "this is broken" in red (`#B00020`, `error--text` present, red border). A user opening an existing record is told it is invalid. |
| **D1b** | Medium | **`SAVE` is enabled on load on the edit form, with no changes made.** No dirty tracking, so the primary action cannot tell the user whether there is anything to save — and `CANCEL` cannot tell them whether they are about to lose anything. |
| **D1c** | Medium | **The Integrations page and the Lead Ads form disagree about Meta's connection state.** The `Meta` tile at `/accounts/116000/integrations` carries no `Active` badge while five sibling tiles do, yet the Lead Ads `Facebook Page*` dropdown reports two Pages as `Connected`. |
| **D2** | **High** | **A Facebook Page named `Deleted page` is offered as a selectable, `Connected` option.** It sits first in the `Facebook Page*` dropdown with a green `Connected` chip, directly contradicting the field's own tooltip (`…Pages which are in 'Active' status with the app.`). `Deleted page` is plainly a fallback string for a page that no longer resolves; it should be filtered out or shown disabled with an explanation, never presented as connected and first in the list. |
| **D3** | Medium | **The `Contact Lists` table cell is an `<a>` with no `href`.** `<a class="text--primary">shopify-2Jul</a>` — styled and announced as a link, does nothing on click, not keyboard-focusable. Either link it to the contact list or render it as text. |
| **D4** | Medium | **An untranslated i18n key is exposed as an accessible name.** The rows-per-page control carries `aria-label="$vuetify.dataTable.itemsPerPageText"`. The literal token is read aloud by screen readers. |
| **D5** | Medium | **Byte-identical duplicate options in the `Facebook Lead Ad*` dropdown.** `RS Sandbox Verification Form` appears at index 2 and index 3 with no distinguishing text. Whether these are two real Meta forms or one form returned twice is indeterminable from the UI — which is itself the defect. |
| **D6** | Medium | **Validation copy is inconsistent across four adjacent fields.** Two end in a period, two do not; field 4 is labelled `Contact List` but its error says `List is required.`. |
| **D7** | Low | **A plain text field shows an indeterminate loading bar.** `Lead Ad Name` enters `v-input--is-loading` while typing, with no async rule the UI ever surfaces (no duplicate-name warning appears). |
| **D8** | Low | **The `Inactive` status chip renders with `theme--dark` inside the light table** (`v-chip v-chip--outlined theme--dark v-size--small`), so it inherits dark-theme foregrounds on a light surface. |
| **D9** | Low | **The `Action` column header is centre-aligned while all six others are start-aligned**, and it is the only header whose label (`Action`, singular) does not describe its contents (three actions). |
| **D10** | Low | **The list-page breadcrumb duplicates the page title.** `My Lead Ads` sits directly above `Lead Ads` — two names for the same page, neither a link, one crumb deep. |
| **D11** | Low | **`MMC` appears in user-facing helper copy** without expansion (`How we'll reference the lead ad in MMC`). |
| **D12** | Low | **No `<h1>` on either route**; the page title is an `<h2>` and the section headings are also `<h2>`. |

No JavaScript console errors or exceptions were captured on either route during the crawl.

---

## 9. Unverified

Everything below was deliberately not exercised, with the reason.

| Item | Reason |
|---|---|
| `SAVE` on the create form | Out of scope — would persist a new record. Success toast, redirect target, and server-side validation are all unknown. |
| Server-side / duplicate-name validation | Only reachable by submitting. |
| Failure path on save (network error, Meta API error) | Only reachable by submitting. |
| `Delete` in the row kebab | Destructive. The confirm dialog (if any), its title/body/footer copy, and the post-delete landing are unknown. |
| `Activate Lead Ad` in the row kebab | Status-changing toggle. Whether it confirms, what the Active-row label reads (`Deactivate Lead Ad`?), and whether it starts a Meta-side subscription are unknown. |
| The Facebook / Meta account **connection** flow past the Integrations tile | Explicitly out of scope — no OAuth started, no account authorized, no credentials entered. The `Meta` tile at `/accounts/116000/integrations` was read but **not clicked**, because activating it may begin a Meta OAuth consent flow. Consent screen, scopes, page-picker and disconnect path are all unknown. |
| The `Deleted page` option | Not selected — selecting it would fire a lead-form fetch against a page that appears to no longer exist, and the resulting error state is not worth provoking against a shared UAT account. |
| Empty state (zero lead ads) | Not reachable — the account holds exactly one record and deleting it is prohibited. No empty-state markup exists in the DOM to inspect. |
| Empty state (zero connected Pages) | Not reachable — two pages are connected and disconnecting is prohibited. |
| Error state (network / API failure) | Not provoked. |
| Sort direction behaviour | One row — ascending/descending is unobservable. |
| Pagination behaviour | One page — both pager buttons are disabled. |
| Rows-per-page option set | Combobox not expanded. |
| Bulk actions | No selection mechanism exists to trigger them. |
| `Contact List` picker's true total | Only 10 results are ever returned; the account's full list count is not exposed anywhere in the UI. |
| Whether `Select All` selects all lists or only the visible 10 | Not activated — it would have been an unrecoverable multi-select on a shared account, and the answer is inferable from the 10-result cap. |
| Responsive / mobile behaviour | Not tested; window fixed at 1686×757. |
| Dark theme | Not toggled. |
