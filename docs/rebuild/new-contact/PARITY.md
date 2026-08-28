# PARITY — New Contact

**Source:** `uat.maropost.com/accounts/116000/contact/new`
**Rebuild:** [`src/views/Contacts/CreateContact.vue`](../../../src/views/Contacts/CreateContact.vue)
**Route:** `/accounts/:accountId/contacts/new` (name `CreateContact`, `meta.builderShell`)
**Audit:** [AUDIT.md](AUDIT.md)

Every audited field, action and state, checked against the rebuild.

---

## Layout & chrome

| # | Audited | Status | Notes |
|---|---|---|---|
| 1 | Breadcrumb `Contacts › New Contact` | ✅ | `MpPageHeader` `backTo` — a labelled back link rather than a crumb trail, matching every other detail page in the sandbox |
| 2 | Page title "New Contact" | ✅ | Now an `<h1>` (source had none) |
| 3 | Four stacked section cards | ✅ | `v-card flat border rounded="lg"` ×4 + a fifth for the journey toggle |
| 4 | Standing "Email or Phone Number is required" notice | ✅ | Moved into the page subtitle **and** the Contact-details section description **and** the footer hint — no longer a dismissible overlay |
| 5 | Cancel / Save footer | ✅ | Now sticky (source's sat below ~2,600px of fields) |
| 6 | Loading state | ✅ | Route-level; no full-screen blocking overlay needed |

## Card 1 — Contact details

| # | Audited | Status | Notes |
|---|---|---|---|
| 7 | First Name (text, optional) | ✅ | |
| 8 | Last Name (text, optional) | ✅ | |
| 9 | Email (conditional) | ✅ | Now `type="email"` + `inputmode` + `autocomplete` |
| 10 | Phone Number (conditional) | ✅ | Now `type="tel"` + `inputmode` + `autocomplete` |
| 11 | Phone hint "include country code" | ✅ | Reworded; wired via `aria-describedby` |
| 12 | Email validation `Invalid Email.` | ✅ | Reworded to name the fix; fires on blur; `error-messages` gives real ARIA association |
| 13 | Email-or-phone rule | ✅ | `canSave = hasIdentifier && !emailError` |

## Card 2 — List subscription

| # | Audited | Status | Notes |
|---|---|---|---|
| 14 | Sub-label "Select List Name and Opt In Statuses" | ✅ | Rewritten as a section description that changes with state |
| 15 | `Select List` single-select, searchable, clearable | ✅ | `v-select` + `clearable`; options render `name (count)` exactly as the source |
| 16 | Disabled until email **or** phone non-empty | ✅ | Same gate — keys on non-empty, not valid, matching the source |
| 17 | `Opted in for Email notifications` | ✅ | |
| 18 | `Opted in for SMS notifications` | ✅ | |
| 19 | Opt-ins gated on list + own channel | ✅ | `canOptInEmail` / `canOptInSms` |
| 20 | List selection auto-checks eligible channels | ✅ | `onListChange()` — behaviour preserved, now disclosed in the section description |

## Card 3 — Tags

| # | Audited | Status | Notes |
|---|---|---|---|
| 21 | Multi-select tag picker | ✅ | `v-select multiple chips closable-chips` — the house pattern |
| 22 | Removable chips + clear-all | ✅ | Native to `closable-chips` + `clearable` |
| 23 | Never gated | ✅ | |

## Card 4 — Custom fields

| # | Audited | Status | Notes |
|---|---|---|---|
| 24 | Title with live count | ✅ | Count moved to the search hint (`42 of 42 fields`) so the heading stays stable |
| 25 | Search filters by field name | ✅ | Also matches display name |
| 26 | Empty result | ✅ | `MpEmptyState` with a Clear-search action, replacing the bare "No field available" |
| 27 | Every account field rendered | ✅ | All 42 seeded fields; **kept visible per your Phase-2 decision** |
| 28 | Type-appropriate control | ✅ | String→text · Integer/Float→number · Datetime→date · Boolean→checkbox · Text→textarea |
| 29 | `ADD FIELD` button | ✅ | |
| 30 | Add Custom Field drawer | ✅ | `MpFormDrawer size="sm"` |
| 31 | — Field Name * | ✅ | Validated |
| 32 | — Field Type * (String/Integer/Boolean/Datetime/Text/Float) | ✅ | Exact six, in source order |
| 33 | — "cannot change Field Type once created" | ✅ | As a persistent hint |
| 34 | — Default Value | ✅ | |
| 35 | — Display Name + its helper | ✅ | |
| 36 | — Description | ✅ | |
| 37 | — "Add to the Edit Profile Page" toggle + explanation | ✅ | Explanation now always visible, not hover-only |
| 38 | — SAVE | ✅ | Adds to `useCdpEntities`, toasts, closes |

## Card 5 — Journey trigger

| # | Audited | Status | Notes |
|---|---|---|---|
| 39 | `Trigger Journey Campaigns` switch, default ON | ✅ | |
| 40 | Three-paragraph tooltip | ✅ | **Condensed to two sentences and always visible.** Flagged in IMPROVEMENTS.md |

## States

| # | State | Status | Notes |
|---|---|---|---|
| 41 | Default / empty | ✅ | |
| 42 | Loading | ✅ | Route transition |
| 43 | Validation (invalid email) | ✅ | |
| 44 | Disabled (gated list + opt-ins) | ✅ | Each now says what unlocks it |
| 45 | Empty (custom-field search miss) | ✅ | `MpEmptyState` |
| 46 | Focus | ✅ | Vuetify theme focus rings; verified keyboard-reachable |
| 47 | Success | ⚠️ **Inferred** | Toast + redirect to the contacts list, per your Phase-2 decision. **Never observed on UAT** — SAVE was not clicked |
| 48 | Server error | ➖ **Not built** | No backend in the sandbox; not observable on UAT without writing a record |
| 49 | Permission-restricted | ➖ **Not built** | No low-privilege account was available to audit |
| 50 | Unsaved-changes guard | ➕ **Added** | `useDirtyLeaveGuard` + `MpConfirmDialog`. The source has none — logged in IMPROVEMENTS.md |

## Data persistence

| # | Field | Source | Rebuild |
|---|---|---|---|
| 51 | Name / email / phone | saved | ✅ saved |
| 52 | Tags | saved | ✅ saved |
| 53 | List + opt-in statuses | saved | ✅ saved (`addContact` widened) |
| 54 | Custom field values | saved | ✅ saved — **only fields actually filled**, see IMPROVEMENTS #2 |
| 55 | Journey trigger flag | saved | ✅ saved |

---

## Verification

- `npm run type-check` — passes
- `npm run build` — passes
- **axe-core 4.12.1, WCAG 2.0/2.1 A + AA: 0 violations, 19 passes.**
  Remaining `incomplete` results are `pseudoContent` colour-contrast checks the app shell's dotted
  background blocks axe from computing; measured manually at **5.85 – 16.38 : 1**, all above AA.
- Responsive: verified at 375 px — no horizontal overflow anywhere, fields stack to one column.
- Interaction sweep in-browser: gating, auto-opt-in, tag chips, field search + empty state,
  add-field drawer, save → toast → redirect.

## Deliberate deviations

1. **Section titles are real headings.** The source used styled `div`/`span`; the rebuild uses
   `MpFormSection` (`h2`). Fixes audit finding A2 and is a hard requirement of the brief.
2. **Custom-field defaults are not pre-filled.** The source ships pre-populated values that save
   silently (audit F2). The rebuild renders every field empty and saves only what was typed.
   Same fields, same order, same types — different default. Logged as IMPROVEMENTS #2.
3. **`Display Name` is used as the visible label**, falling back to the raw field name. The source
   collects Display Name but renders the raw identifier (audit F8).
