# AUDIT — Custom Fields

**Source:** `https://uat.maropost.com/accounts/116000/custom_fields`
**Crawled:** 2026-08-28 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session · viewport 1686×757
**Legacy stack:** **Vuetify 2** legacy app mounted inside the Vuetify 3 shell (visible as double
`.v-application` nesting). Icons are `mdi-*`.

> Crawl method: full interaction sweep — both tabs, sorting, pagination, the row menu, the create
> drawer with **every one of the six field types exercised**, the edit drawer on two real records,
> and the delete dialog rendered read-only via its local flag. **Nothing was written** — SAVE and
> DELETE were never clicked. See "Unverified" at the bottom.

---

## 1. Page purpose and primary user task

Account-level **schema editor for contact attributes**. The merchant defines extra data slots that
hang off every contact record (`account_id: 116000` is stamped on each), gives each a machine name,
a data type, an optional default, an optional human-facing display name, and optionally exposes it
on the public Edit Profile Page so contacts can self-update it.

**Primary task:** *add a new contact attribute* — low-frequency, high-consequence, admin-only.
Field type is permanent once created; deleting a field destroys its data. **Secondary task:** scan
the existing 108 fields to check whether an attribute already exists before creating a duplicate —
and the page provides no search to do it with.

**Three names for one thing:** breadcrumb `My Fields` · heading `Fields` · tab `Custom fields` ·
URL `custom_fields`.

---

## 2. Layout structure and hierarchy

```
main.v-main
└ .content-area › .legacy-app (Vue 2 / Vuetify 2)
  └ .container.fields-wrapper                    w=1426, padding 0 44px 44px
    ├ ul.v-breadcrumbs › li › span  "My Fields"  ← plain <ul>, not <nav>, not a link
    ├ header › h2  "Fields"                       24px / 600
    └ .v-tabs.fields-tabs
      ├ [role=tablist]   "Custom fields" (active) · "Default fields"
      └ .v-tabs-items
        ├ Custom fields
        │   ├ button "Add Field"                  ← black, right-aligned, BELOW the tabs
        │   ├ p.caption "Note: Datetime fields are processed using Eastern Time (ET)"
        │   └ v-data-table (5 cols) + v-data-footer
        └ Default fields
            ├ button "Edit Default Field"
            ├ p.caption (same ET note, duplicated)
            └ v-data-table (3 cols) + v-data-footer
```

**Every heading in the document:** exactly one — `H2 "Fields"`. **There is no `<h1>`.** Overlays add
`H2 "Add Custom Field"` / `H2 "Edit Custom Field"` / `H2 "Edit Default Field"`, and the delete
confirm adds `H4 "Delete '<name>'"` — **h3 is skipped entirely**.

No page toolbar, no search, no filters, no page footer.

---

## 3. Component inventory → design-system mapping

| Region | Legacy | Marobase equivalent |
|---|---|---|
| Breadcrumb | `ul.v-breadcrumbs`, single non-link item | `MpPageHeader` `eyebrow`, or drop it |
| Masthead | `h2` only, no subtitle, no action slot | `MpPageHeader` (promote to `h1`) |
| Tabs | `v-tabs`, 2 tabs, **no URL sync** | `MpFilterTabs` (add counts) |
| Primary action | One `v-btn` whose **label swaps per tab** (`Add Field` ⇄ `Edit Default Field`), floated right *below* the tabs | move into `MpPageHeader #actions` |
| Helper note | `p.caption` 12px, right-aligned, duplicated in both panels | one note, left-aligned, under the header |
| Table | `v-data-table`, **server-side** (`serverItemsLength: 108`), no selection | `v-data-table` + `MpDataTableToolbar` |
| Row actions | icon-only kebab → `v-menu`, 2 items | `MpRowActionsMenu` |
| Create / Edit | right `v-navigation-drawer`, **500px**, `temporary` | `MpFormDrawer` (`md`=480 / `lg`=640; 500 is bespoke) |
| Delete confirm | `v-dialog` 520px, `h4` title | `MpConfirmDialog` `danger` |
| Loading | `v-progress-linear` indeterminate under `<thead>` | `MpTableSkeleton` |
| Empty | Vuetify default → `No data available` | `MpEmptyState` |

---

## 4. List / table spec

### Tab 1 — `Custom fields` (default)

| # | Header | `value` | Sortable | Width |
|---|---|---|---|---|
| 1 | `Field Name` | `name` | **yes** | 30% |
| 2 | `Field Type` | `field_type` | no | 20% |
| 3 | `Default Value` | `default_value` | no | 20% |
| 4 | `Display Name` | `display_name` | no | 20% |
| 5 | `Actions` | `action` | no | 3% |

- **Sorting:** only *Field Name*. Sets `aria-sort="ascending"` + ↑ glyph. Default state is
  **unsorted** — rows arrive in creation order, which reads as random.
- **Row shape:** plain text throughout — no chips, no type icons, no dates, no usage counts.
  Boolean defaults render as the strings `True` / `False`; datetime as `YYYY-MM-DD`.
  `description` and `add_to_profile_page` exist on the record but appear in **no column**.
  Rows hover-highlight but are **not clickable**.
- **Row actions** (verbatim, exactly two): `Edit Custom Field` (`mdi-pencil`) ·
  `Delete Custom Field` (`mdi-delete`). No View, no Duplicate, no "where is this used?".
- **Bulk selection:** none. `showSelect: false`.
- **Search / filters:** **none rendered** — though the component holds a `searchString: ""` in its
  data. The state exists; the input was never built.
- **Pagination:** `Rows per page:` **5 / 10 / 25 / 50 / 100** (default 10) · range readout
  `1-10 of 108` · icon-only `‹` `›` (`aria-label` present, correctly disabled at each end).
  No first/last, no page jump.
- **Total count** appears *only* in the footer range string.

### Tab 2 — `Default fields`

A different table: **3 columns, none sortable, no Actions column, no row menu.**

| `Field Name` | `Field Type` | `Default Value` |
|---|---|---|
| `First Name` | `string` | `1` |
| `Last Name` | `string` | *(empty)* |

Footer `1-2 of 2`, both arrows disabled. The ET note repeats here even though no datetime field can
exist in this tab.

---

## 5. Create flow (verbatim)

Trigger `Add Field` (renders `ADD FIELD` — uppercase via CSS).
**Surface:** right drawer, **500px**, `temporary`, dark scrim. Heading `H2 "Add Custom Field"`,
icon-only ✕. **The whole drawer scrolls, including its header** — scroll down and the title leaves.

| # | Label | Control | Required | Default | Helper (verbatim) |
|---|---|---|---|---|---|
| 1 | `Field Name*` | text | `required` attr set; asterisk baked into the label string | empty | — |
| 2 | `Field Type*` | select | **not** marked `required` in DOM | `String` | `You cannot change Field Type once this custom field is created.` |
| 3 | `Default Value` / `Select Date` | varies by type | no | varies | — |
| 4 | `Display Name` | text | no | empty | `This will be shown as the field's name` |
| 5 | `Description` | text — **single line, not a textarea** | no | empty | — |
| 6 | `Add to the Edit Profile Page` | `role=switch` | no | **off** | `Enabling this feature will display this Custom Field data on the Edit Profile page, visible to your contacts.` |

Footer: a single **`SAVE`**, left-aligned, at the bottom of the scrolling body.
**There is no Cancel button.**

### Field Type — complete option set, verbatim and in order

`String` · `Integer` · `Boolean` · `Datetime` · `Text` · `Float`

Six options. **No picklist / select / multi-select / URL / email / phone type exists**, so there is
no options-editor to reveal. Confirmed against data: all 108 fields use exactly these six.

### Conditional behaviour per type (each exercised)

| Type | Field 3 becomes |
|---|---|
| `String` | `Default Value` — plain text |
| `Text` | `Default Value` — **identical to String**; no textarea, no rows |
| `Integer` | plain text (`type=text`, no spinner). Validates on blur: **`Default value is not an integer`** |
| `Float` | plain text. **No validation at all** — `abc` produces no error |
| `Boolean` | becomes a select, options exactly `True` / `False`, prefilled `True` |
| `Datetime` | label changes to **`Select Date`**; readonly input prefilled with today, ✕ clear + 📅 month-grid picker. **Date only — no time picker**, despite the type name |

**Switching type wipes the Default Value silently** (verified).

### Button gating
- **`SAVE` is never disabled** — verified enabled with an empty required Field Name *and* an active
  `Name is required` error, and with `abc!!` in an Integer default. Nothing gates it client-side.
- ✕ always enabled, **no unsaved-changes guard**. Scrim click closes; **`Escape` does not.**
- Reopening resets to defaults.

---

## 6. Edit flow

Same 500px drawer, `H2 "Edit Custom Field"`. Captured on `ab_field` and `adda`.

| Field | Create | Edit |
|---|---|---|
| `Field Name*` | empty, editable | prefilled, **still editable** — renaming a live machine key is permitted |
| `Field Type*` | editable, default String | **`disabled`** — enforces the hint |
| `Default Value` | empty / today | prefilled |
| `Display Name` | empty | prefilled |
| `Description` | empty | prefilled — **the only place this field is ever visible** |
| `Add to the Edit Profile Page` | off | reflects stored value |
| Footer | `SAVE` | `SAVE` — no Cancel, no Delete-from-edit |

**No read-only metadata is shown** — `id`, `created_at`, `updated_at` all exist and none are displayed.

**Bug — flash of false validation.** On open, the Edit drawer momentarily renders
`Default value is not an integer` beneath a Default Value of `0`, then clears. `0` is a valid integer.

**Bug — the row menu stays open on top of the drawer** after choosing "Edit Custom Field"
(captured twice).

---

## 7. Delete flow

`v-dialog`, 520px. Copy verbatim:

> **Delete 'EXAMPLE_FIELD'**  *(h4; name single-quoted inside the title)*
> This Custom Field is about to be permanently deleted.
> **Warning: You cannot undo this action.**
> `CANCEL`   `DELETE`

`DELETE` is not typed-confirmation-gated and is **not styled as destructive** in the DOM — both are
plain text buttons.

---

## 8. States observed

| State | Evidence / copy |
|---|---|
| Default | 108 rows, 10 per page, unsorted |
| Sorted | `aria-sort="ascending"` + ↑ on Field Name only |
| Loading | thin indeterminate bar under `<thead>`; rows stay visible. `loadingText: "Loading... Please wait"` only shows when the row set is empty |
| Empty | `No data available` — a bare grey text row. No illustration, no explanation, **no CTA**. Unreachable by the merchant since there is no search |
| Validation — required | `Name is required`, red outline. **SAVE stays enabled** |
| Validation — type | `Default value is not an integer`, rendered **grey** (no `error--text`), clipped behind the next field until layout settles. Float: no error at all |
| Disabled | `Field Type*` in Edit; pagination arrows at each end |
| Tooltip | on the ⓘ beside the profile-page switch — renders **detached**, ~60px above its trigger, over the Description field |
| Toast | **not observed** — requires a write |

Cold load shows a blank content area for **~10–14s** behind the "Preparing an optimised workspace
for you" splash.

**Tooltip copy (verbatim):**
> `Your Edit Profile Page allows contacts to update the custom fields, this page can be linked from your footer or an email content.`

---

## 9. Accessibility findings

Verified against the live DOM.

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | High | **No `<h1>`.** `document.querySelectorAll('h1')` → `[]`. | 1.3.1 / 2.4.6 |
| A2 | High | **Heading order skips h3** — `h2 "Fields"` → `h4 "Delete '…'"`. | 1.3.1 |
| A3 | **Critical** | **Every row kebab has no accessible name** — `aria-label`, `title` and `textContent` all empty. Ten identical unlabelled buttons per page, and no `aria-haspopup` / `aria-expanded`. | 4.1.2 |
| A4 | **Critical** | **The profile-page switch has no accessible name** — `role=switch` + `aria-checked` are present but `aria-label` is null and there is no `<label for>`; the visible text is an unassociated sibling `div`. | 4.1.2 |
| A5 | **Critical** | **The drawer is not a dialog.** `role=null`, `aria-modal=null`, no `aria-labelledby`. Focus is **not moved into it** (`activeElement === BODY`) and **not trapped** — two Tabs land on app-shell buttons behind the scrim. `Escape` does not close it. | 2.4.3, 4.1.2 |
| A6 | High | **`aria-sort` lies on four columns.** All five `th` carry it; only `Field Name` is sortable. AT announces four non-sortable columns as sortable. | 4.1.2 |
| A7 | High | **Sorting is mouse-only** — the sortable `th` has no `tabindex` and no inner button. | 2.1.1 |
| A8 | Medium | **Tabs are half-wired** — `role=tablist`/`tab`/`aria-selected` are right, but there is no `aria-controls`, no `id`, no `role=tabpanel`, and no `aria-label` on the tablist. | 4.1.2 |
| A9 | Medium | **Neither table has a name** — no `<caption>`, no `aria-label`. The two tables are indistinguishable to AT. (`scope="col"` is correct.) | 1.3.1 |
| A10 | Medium | **Breadcrumb is not a landmark** — bare `<ul>`, no `<nav>`, no `aria-label`. | 1.3.1 |
| A11 | Medium | **Error text is not programmatically linked** — `.v-messages` with no `error--text`, and no `aria-describedby` / `aria-invalid` on the input. Neither red nor announced. | 3.3.1, 4.1.2 |
| A12 | Medium | Drawer close ✕ is icon-only with no accessible name. | 4.1.2 |

*Correct already:* drawer text inputs use proper `<label for=id>`; `th` uses `scope="col"`;
`role=switch` + `aria-checked` are present.

---

## 10. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| F1 | **No search across 108 fields.** 11 pages of manual scanning to check whether a field already exists. `searchString` state is already in the component — only the input is missing. | The single biggest issue on the page, and the cheapest to fix. |
| F2 | **No filter by type and no type counts.** Actual mix: string 44 · text 24 · integer 11 · boolean 10 · float 6 · datetime 5. | |
| F3 | **Default sort is creation order**, so the list opens looking unsorted. | |
| F4 | **`String` vs `Text` is undocumented and identical in the UI** — same control, same validation, no hint. 44 + 24 fields exist, so the account can't tell them apart either. | |
| F5 | **`Float` accepts any string.** Live proof: field `aad` is `float` with `default_value: "ADAAD"` — the server accepted it. Integer validates, Float doesn't. | Data integrity, not just UX. |
| F6 | **`SAVE` is never gated** — pressable on an empty required field and on invalid input. | |
| F7 | **No Cancel in either drawer, `Escape` doesn't close, no unsaved-changes guard.** | |
| F8 | **Field Type is irreversible but chosen with one click** — the warning is a grey hint, not a confirmation, and no copy states the consequence (delete and recreate). | |
| F9 | **Field Name is freely renamable after creation** with no warning that segments, templates, imports and API callers key off it. Spaces accepted with no error. | Silent downstream breakage. |
| F10 | **Datetime is date-only** despite the name; the ET note is a right-aligned 12px caption that reads as decoration. | |
| F11 | **`Description` and `add_to_profile_page` are invisible from the list.** You must open each of 108 rows to learn which fields are exposed to contacts — a privacy-relevant flag hidden behind a click. | |
| F12 | **"Add Field" and "Edit Default Field" are the same button** relabelled by tab, sitting below the tabs, disconnected from the masthead. | |
| F13 | **Three names for one page** (My Fields / Fields / Custom fields). | |
| F14 | **The drawer header scrolls away**, and the tooltip renders in the wrong place. | |
| F15 | **The row menu doesn't dismiss** when it opens the edit drawer. | |
| F16 | **No usage or impact information anywhere** — no "used by N contacts", no "referenced in N segments" — yet Delete is permanent. | Deleting blind. |

---

## 11. Data shape + example rows

```ts
interface CustomField {
  id: number                     // 16 … 219, not sequential with display order
  name: string                   // machine key, snake_case by convention (not enforced)
  field_type: 'string' | 'text' | 'integer' | 'float' | 'boolean' | 'datetime'
  account_id: number             // 116000
  default_value: string | null   // ALWAYS a string, even for integer/float/boolean.
                                 // boolean → "True" | "False"; datetime → "YYYY-MM-DD".
                                 // "" and null both occur.
  add_to_profile_page: boolean
  display_name: string | null    // "" and null both occur
  description: string | null     // "" and null both occur
  created_at: string             // "2025-07-16T02:11:13.000-04:00" (ISO + ET offset)
  updated_at: string
}

interface DefaultField { name: string; value: string; field_type: 'string' }
```

Paged server-side: `totalItems: 108`, `itemsPerPage ∈ {5,10,25,50,100}`, `sortBy: ["name"]`.

### Real rows (verbatim) — covers all six types and every null/empty permutation

| id | name | type | default_value | display_name | description | profile |
|---|---|---|---|---|---|---|
| 95 | `aad` | float | `"ADAAD"` ⚠ | `""` | `""` | false |
| 152 | `auto_float` | float | `"0"` | `""` | `""` | false |
| 139 | `ab_field` | integer | `"0"` | `"urgency"` | `"to indicate urgency"` | **true** |
| 165 | `fashion50_credit_limit` | integer | `"0"` | `"Credit Limit"` | `null` | **true** |
| 94 | `adda` | datetime | `"2025-04-25"` | `""` | `""` | false |
| 19 | `birthday` | datetime | `null` | `"Birthday"` | `""` | false |
| 219 | `boolean_field` | boolean | `"True"` | `""` | `""` | false |
| 188 | `custom_field_test_automation1_1758094485870` | boolean | `"False"` | `null` | `null` | false |
| 16 | `cust_feld_uday` | string | `""` | `"name"` | `""` | **true** |
| 156 | `fashion50_billing_address` | string | `null` | `"Billing Address"` | `null` | **true** |
| 175 | `fashion50_age` | text | `null` | `"Age"` | `null` | **true** |

**Roughly two-thirds of the 108 fields are test debris.** Realistic mock data should mirror that
mess, not a tidy list: a merchant-branded prefixed set (`fashion50_*`), a QA-junk set
(`test1`, `ub_date123`, `yg_float`, `rofl`, `skkkksd`), and machine-generated names
(`custom_field_test_automation_1758094299654`). The sandbox store already seeds 42 fields in this
spirit.

---

## 12. Unverified — carried into Phase 2 questions

1. **Toast / success feedback on save** — never observed (write action, out of scope).
2. **Server-side validation and error surfacing** — whether SAVE on a blank name is rejected
   client-side or round-trips to a server error, and how that error is displayed.
3. **Field Name character rules** — spaces were accepted with no client error. Whether the server
   normalises, rejects, or stores verbatim is unknown. No `maxlength` on any input.
4. **Duplicate-name handling** — untested.
5. **The actual delete outcome** — whether deletion is blocked when the field is referenced by a
   segment or journey, and what error appears.
6. **The genuine empty state** — unreachable (108 fields, no search). Copy inferred from Vuetify's
   resolved `noDataText`.
7. **`String` vs `Text` semantics** — likely `varchar` vs `text`, unconfirmed.
8. **Edit Default Field save behaviour** — this account shows exactly 2 default fields.
9. **Responsive** — the component holds an `isMobile` flag (false at 1686px); narrow layout not captured.
10. **Permissions** — whether a non-admin sees this page, or sees it read-only.
11. **Where these fields surface downstream** (segment builder, import mapping, personalisation
    tokens, the public Edit Profile Page) — relevant if the rebuild wants usage counts.
