# PARITY — Custom Fields

**Source:** `uat.maropost.com/accounts/116000/custom_fields`
**Rebuild:** [`src/views/Contacts/ContactFields.vue`](../../../src/views/Contacts/ContactFields.vue)
**Route:** `/accounts/:accountId/contact_fields` (rebuilt in place)

---

## Layout

| # | Source | Rebuilt | Notes |
|---|---|---|---|
| 1 | Breadcrumb `My Fields` | ➖ dropped | Three names for one page; the heading is now the single name |
| 2 | Page title `Fields` (`h2`, no `h1`) | ✅ `Contact fields` as the page `h1` |
| 3 | Tabs `Custom fields` / `Default fields` | ✅ `MpFilterTabs` with counts |
| 4 | Primary action relabels per tab | ⚠️ **changed** — `Add field` shows only on the Custom tab |
| 5 | ET note, right-aligned, duplicated on both tabs | ✅ shown once, on the tab where datetime fields exist |
| 6 | Footer | ➖ none in source |

## Custom fields table

| # | Column | Sortable in source | Rebuilt |
|---|---|---|---|
| 7 | `Field Name` | yes | ✅ |
| 8 | `Field Type` | no | ✅ with a type icon |
| 9 | `Default Value` | no | ✅ em-dash when empty |
| 10 | `Display Name` | no | ✅ |
| 11 | `Actions` | no | ✅ `MpRowActionsMenu` |
| 12 | Row actions: `Edit Custom Field`, `Delete Custom Field` | ✅ both, with a divider and destructive styling |
| 13 | No bulk selection | ✅ matched — none added |
| 14 | Pagination 5/10/25/50/100 | ✅ via `v-data-table` |
| 15 | **No search** | ⚠️ **added** — see deviations |

## Default fields table

| # | Source | Rebuilt |
|---|---|---|
| 16 | 3 columns, no actions, no sorting | ✅ |
| 17 | `First Name` / `Last Name`, type `string` | ✅ seeded |
| 18 | Only the default value is editable | ✅ inline cell editor |

## Create / edit drawer

| # | Field | Source | Rebuilt |
|---|---|---|---|
| 19 | `Field Name*` | text, required | ✅ + duplicate-name check |
| 20 | `Field Type*` | 6 options, locked on edit | ✅ all 6, disabled on edit |
| 21 | Type hint | `You cannot change Field Type once this custom field is created.` | ✅ reworded |
| 22 | `Default Value` | varies by type | ✅ all six branches — see below |
| 23 | `Display Name` + helper | ✅ |
| 24 | `Description` | **single-line** in source | ✅ as a textarea |
| 25 | `Add to the Edit Profile Page` + explainer | ✅ as `MpFormField` + switch |
| 26 | `SAVE` only, **no Cancel** | ⚠️ **Cancel added** |

### Type-conditional default value

| # | Type | Source control | Rebuilt |
|---|---|---|---|
| 27 | String | text | ✅ |
| 28 | Text | text (identical to String) | ✅ as a textarea |
| 29 | Integer | text, validated on blur | ✅ `type=number`, validated |
| 30 | Float | text, **no validation** | ✅ validated — see deviations |
| 31 | Boolean | select `True` / `False`, default True | ✅ |
| 32 | Datetime | date picker, **date only** | ✅ `type=date` + ET hint |
| 33 | Switching type wipes the value | ✅ matched, deliberately |

## States

| # | State | Source | Rebuilt |
|---|---|---|---|
| 34 | Loading | thin progress bar | ✅ `MpTableSkeleton` |
| 35 | Empty | bare `No data available`, no CTA | ✅ `MpEmptyState` with a CTA |
| 36 | Search-empty | unreachable (no search) | ✅ distinct copy |
| 37 | Required error | `Name is required`, **Save stays enabled** | ✅ Save gated — see deviations |
| 38 | Type error | grey, not red, not associated | ✅ real error styling and association |
| 39 | Disabled | Field Type on edit | ✅ |
| 40 | Delete confirm | title, warning, CANCEL/DELETE | ✅ `MpConfirmDialog danger` + consequences |
| 41 | Success toast | never observed | ⚠️ **inferred** |

## Verification

| # | Check | Result |
|---|---|---|
| 42 | `npm run type-check` | ✅ passes |
| 43 | Both tabs render | ✅ screenshot-verified |
| 44 | Type-conditional control switches | ✅ verified for Boolean |
| 45 | Zero non-system styles | ✅ |

---

## Deliberate deviations

1. **Search was added.** The source has none across **108 fields** — 11 pages of manual scanning to
   check whether a field already exists. Its own component even carries an unused `searchString`
   (audit F1, the highest-value gap on the page).

2. **`SAVE` is now gated.** The source's Save is *never* disabled — pressable with an empty required
   name and with invalid input (audit F6).

3. **Float is validated.** The source validates Integer but lets Float accept any string; its own
   data contains a float field defaulting to `"ADAAD"` (audit F5). Both are validated.

4. **Renaming a field warns.** The source lets you rename a live machine key with no warning that
   segments, imports, templates and API callers reference it (audit F9).

5. **Duplicate names are rejected.** Untested on the source; the client imposed no rule.

6. **A Cancel button was added** to the drawer, which had only `SAVE` (audit F7).

7. **`Description` is a textarea**, not a single-line input.

8. **The delete dialog states consequences** — data loss, broken references, irreversibility. The
   source warns only "You cannot undo this action" and does not style Delete as destructive.

9. **The primary action no longer changes meaning per tab.** The source reuses one button for
   `Add Field` and `Edit Default Field` (audit F12).

10. **Page structure got real headings** — one `h1`, section headings, no skipped levels
    (audit A1, A2).

## Not changed, deliberately

- **No bulk selection or bulk delete.** The source has none, and adding one would be a new feature.
- **No usage counts** ("used by N contacts", "referenced in N segments"). The audit flags their
  absence (F16) but the data does not exist in the sandbox, and inventing it would be speculative.
- **`String` vs `Text`** remains undocumented, because the source never explains the difference and
  guessing would be worse than silence.

## Open items carried forward

- **Success/error feedback** on save is inferred; no write was ever performed on UAT.
- **Field-name character rules** — the source accepted spaces with no client error; server
  behaviour unknown, so no format rule is enforced.
- **Whether delete is blocked** when a field is referenced by a segment or journey.
- **`String` vs `Text` semantics** — likely `varchar` vs `text`, unconfirmed.
- **Permission-restricted state** — no low-privilege account was available.
