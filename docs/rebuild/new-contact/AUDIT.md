# AUDIT — New Contact

**Source:** `https://uat.maropost.com/accounts/116000/contact/new`
**Crawled:** 2026-08-28 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session
**Legacy stack:** Vue 2 + Vuetify 2 (`v-input`, `v-select`, `v-autocomplete`, `theme--light`)

> Crawl method: full interaction sweep (every control operated), plus DOM/ARIA inspection via the
> page's own accessibility tree. **No record was created** — SAVE was never clicked, so the
> success/toast state is inferred, not observed. See "Unverified" at the bottom.

---

## 1. Page purpose and primary user task

Create a single contact by hand. This is the manual counterpart to CSV import and API ingestion —
used for one-off adds (a lead from a phone call, a VIP added by a CSR, a test contact).

The **primary task** is: enter an email or phone, optionally subscribe the contact to a list with
the right opt-in statuses, optionally tag them, optionally fill any of the account's custom fields,
and save.

**Critical domain rule discovered:** a contact is identified by **email OR phone** — at least one
is required. Neither is individually mandatory, and first/last name are entirely optional. This is
the page's whole validation model and it drives every gate below.

---

## 2. Layout structure and hierarchy

```
AppBar (global)                    — logo, search, account switcher, AI, settings, help, notifications, user
AppSidebar (global, dark)          — Dashboard / Analytics / CDP / Products / Marketing / Commerce /
                                     Retail / Service / Da Vinci AI / Dashboard / Conversations / Apps
                                     + "Get Started 10/16 Completed" progress block pinned at top
└── Content column (centred, ~770px fixed, generous left/right gutters)
    ├── Breadcrumb        "Contacts › New Contact"        (Contacts is a link)
    ├── Page title        "New Contact"                    (H2 — no H1 on the page)
    ├── Info banner       "Email or Phone Number is required to create a contact"  ✕ dismissible
    │                     ⚠ floats over the breadcrumb/title row, appears on load
    ├── Card 1  Contact Details
    ├── Card 2  List Subscription
    ├── Card 3  Contact Tags
    ├── Card 4  Custom Fields (108)          ← internal scroll region, fixed max-height
    ├── Toggle  Trigger Journey Campaigns ⓘ  (bare, outside any card)
    └── Footer  [CANCEL]  [SAVE]             (inline at end of document — not sticky)
```

Cards are white, ~4px radius, 1px hairline border, on a very light grey page background. Section
titles sit inside each card at ~20px semibold.

---

## 3. Component inventory → design-system mapping

| # | Legacy element | Observed behaviour | Marobase equivalent |
|---|---|---|---|
| 1 | Breadcrumb `Contacts › New Contact` | Static; first crumb links to list | `MpPageHeader` `backTo` |
| 2 | Page title (H2 div) | Plain text | `MpPageHeader` `title` |
| 3 | Info banner (dismissible) | Persistent standing hint, not a validation result | `v-alert` type="info" (see GAPS — no `MpInlineAlert`) |
| 4 | `v-card` × 4 with `v-card__title` | Section container | `v-card flat border rounded="lg"` + `MpFormSection` |
| 5 | 2-col field grid | Fixed 2-up, no collapse | `MpFormGrid :cols="2"` |
| 6 | `v-text-field` outlined × 4 | First/Last/Email/Phone | bare Vuetify `v-text-field` (theme default) |
| 7 | Phone hint text | "Please include country code with Phone Number" | field `hint` |
| 8 | Inline error | "Invalid Email." red, below field | field `:error-messages` |
| 9 | `v-autocomplete` "Select List" | Single-select, searchable, clearable (✕), **disabled until email/phone entered** | `v-autocomplete` + `:disabled` |
| 10 | `v-checkbox` × 2 opt-in | Auto-checked on list select; each gated on its own channel | `v-checkbox` |
| 11 | `v-autocomplete` "Tags" | **Multi**-select, checkbox menu, removable chips, clear-all | `v-autocomplete multiple chips` |
| 12 | Custom Fields card w/ live count | Title count reflects filter: "(108)" → "(5)" → "(0)" | `v-card` + `MpFormSection` w/ count in title |
| 13 | Custom-field search | Client-side filter, instant, no debounce needed | `v-text-field prepend-inner-icon="search"` |
| 14 | Custom-field controls | Per type: text / number / date / **checkbox** for Boolean | `MpFormGrid` children, type-driven |
| 15 | "No field available" | Bare grey centred line | `MpEmptyState` |
| 16 | `ADD FIELD` button (dark, uppercase) | Opens right drawer | `v-btn` + `MpFormDrawer` |
| 17 | "Add Custom Field" drawer | Field Name*, Field Type* (locked-after-create), Default Value, Display Name, Description, "Add to the Edit Profile Page" toggle, SAVE | `MpFormDrawer size="sm"` |
| 18 | `v-switch` Trigger Journey Campaigns | Default **ON**; 3-paragraph tooltip | `v-switch` + `MpFormField` |
| 19 | Tooltips (dark, ⓘ trigger) | Hover-only | `v-tooltip` |
| 20 | CANCEL / SAVE | SAVE disabled until email-or-phone present | `v-btn` pair in page footer |
| 21 | Full-screen loading overlay | Dimmed page + centred blue spinner during route load | `MpTableSkeleton` is table-only → see GAPS |

**Rebuild shell:** no full-page create form exists in Contacts today (the module is 100% drawer-based).
The pattern to lift is `src/views/Marketing/CreateTransactional.vue` — sticky head (`MpPageHeader` +
`backTo`), scrollable card-stack body, sticky footer, `useDirtyLeaveGuard` + `MpConfirmDialog`.

---

## 4. Data fields, labels and copy (verbatim)

### Card 1 — Contact Details
| Label | Control | Required | Hint / error |
|---|---|---|---|
| First Name | text | no | — |
| Last Name | text | no | — |
| Email | text (`type="text"`, not `email`) | conditional | error: `Invalid Email.` |
| Phone Number | text | conditional | hint: `Please include country code with Phone Number` |

### Card 2 — List Subscription
- Section title: `List Subscription`
- Sub-label: `Select List Name and Opt In Statuses`
- `Select List` — single autocomplete. Live options seen: `contact-tz-1`, `UDAY_Control`,
  `yg_send_test`, `journey test yg`, … (account-scoped, long list, searchable)
- `Opted in for Email notifications` — checkbox
- `Opted in for SMS notifications` — checkbox

### Card 3 — Contact Tags
- Section title: `Contact Tags`
- Sub-label: `Select Tags for New Contact`
- `Tags` — multi autocomplete. Options seen: `Tag18`, `Tag19`, `Tag20`, `Tag15`, `Tag17`, `Tag13`, …

### Card 4 — Custom Fields
- Title: `Custom Fields (108)` — count is **filtered count**, not total
- Sub-label: `Select Custom Fields for New Contact`
- Search placeholder: `Search`
- Empty result: `No field available`
- Button: `ADD FIELD`
- 108 account-defined fields. Types observed in the wild: String (`aad` = "ADAAD"),
  Integer (`ab_field` = 0), Date (`adda` = "2025-04-25"), Float (`auto_float` = 0),
  Boolean (`boolean_field` = checked checkbox), Text.
- Real field names are messy production data: `fashion50_*`, `skylink_*`, `har_*`,
  `custom_field_test_automation1_1758094485870`, `ub_date123`, `u_y`, `test5`.

### Add Custom Field drawer
- Title: `Add Custom Field`
- `Field Name*` · `Field Type*` (String / Integer / Boolean / Datetime / Text / Float)
  — helper: `You cannot change Field Type once this custom field is created.`
- `Default Value` · `Display Name` (helper: `This will be shown as the field's name`) · `Description`
- `Add to the Edit Profile Page` ⓘ toggle —
  `Enabling this feature will display this Custom Field data on the Edit Profile page, visible to your contacts.`
- `SAVE`

### Journey toggle
- Label: `Trigger Journey Campaigns` · default **ON**
- Tooltip (verbatim, 3 paragraphs):
  > This option only applies to the condition when you are adding contacts to the list that is
  > defined in the 'New Subscription' trigger of a journey.
  >
  > If checked, the contacts that are added to the list will enter the journeys as usual. If
  > unchecked, these contacts will not enter the journeys where the list is defined in the
  > 'New Subscription' trigger.
  >
  > NOTE:This option does not apply to any other journey trigger. added to the list will enter
  > those journeys depending upon the journey triggers as they are defined.

### Footer
- `CANCEL` (outlined) · `SAVE` (filled, disabled until valid)
- Standing banner: `Email or Phone Number is required to create a contact`

---

## 5. Interactions and behaviours

### The gating rules (verified by DOM inspection at each step)

| State | Select List | Opt-in Email | Opt-in SMS | SAVE |
|---|---|---|---|---|
| Empty form | disabled | disabled | disabled | disabled |
| Email **or** phone non-empty | **enabled** | disabled | disabled | enabled |
| + list selected, email present | enabled | **auto-checked** | disabled | enabled |
| + phone also present | enabled | checked | **auto-checked** | enabled |

- The Select List gate keys on **non-empty**, not *valid* — typing `not-an-email` enables it while
  the field still shows `Invalid Email.`
- Opt-in checkboxes are **never** independently enabled: each requires *both* a selected list and a
  value in its own channel field. Selecting a list auto-checks every eligible channel.
- Custom fields and Tags are **never** gated — editable from load.

### Other behaviours
- **Email validation:** on blur. Red outline + `Invalid Email.` below. Does not block SAVE
  (phone alone satisfies the rule).
- **Custom-field search:** instant client-side substring filter on field name. Card title count
  updates live. `birth` → 5 results (`birthday`, `fashion50_birthday_club`, `fashion50_date_of_birth`,
  `skylink_date_of_birth`, `skylink_month_of_birth`).
- **Tags:** menu is a checkbox list; picks render as removable chips in the field; ✕ clears all.
- **Select List:** ✕ clears; menu is scrollable/filterable.
- **Custom Fields card** has its own internal scrollbar with a fixed max-height — the outer page
  does not scroll while the cursor is over it.
- **Add Field drawer** overlays from the right, dims the page, ✕ to close.
- **Loading:** full-viewport dim + centred spinner on route entry (~4–8s on UAT).
- **Cancel:** returns to the contacts list. **No unsaved-changes guard was observed.**

---

## 6. Accessibility findings

Verified against the live DOM.

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | High | **No `<h1>`.** Page title is `H2`; nothing above it. | 1.3.1 / 2.4.6 |
| A2 | High | **The four section titles are not headings** — `Contact Details` and `List Subscription` are `<div class="v-card__title">`, `Contact Tags` and `Custom Fields` are `<span>`. A screen-reader user gets *one* landmark heading for a 4-section, 110-field form. | 1.3.1 |
| A3 | High | **Error not programmatically associated.** The Email input has `aria-invalid=null`, `aria-describedby=null`, `aria-required=null`, `required=false`. `Invalid Email.` is visual-only. | 3.3.1, 4.1.2 |
| A4 | Medium | **Wrong input type.** Email is `type="text"` — no mobile keyboard hint, no native semantics. Phone likewise not `type="tel"`. | 1.3.5 |
| A5 | Medium | **Phone hint not associated** — `Please include country code…` is not wired via `aria-describedby`. | 3.3.2 |
| A6 | Medium | **Disabled controls give no reason.** Select List and both opt-ins are disabled with no accessible explanation of what unlocks them. The standing banner is a separate, dismissible node not linked to the controls. | 3.3.2 |
| A7 | Medium | **Tooltips are hover-only** on ⓘ icons with no accessible name — the Journey-toggle tooltip carries three paragraphs of rules a keyboard user cannot reach. | 1.4.13, 2.1.1 |
| A8 | Medium | **Breadcrumb is not in a `<nav>`.** The only `<nav>` on the page is the sidebar drawer. | 1.3.1 |
| A9 | Medium | **Info banner overlaps the breadcrumb and title** at 1321px, obscuring "New Contact". It is not `role="status"`/`role="alert"`. | 1.4.10, 4.1.3 |
| A10 | Low | **Empty state is a bare `<div>`** — `No field available` has no `role="status"`, so filtering to zero is silent. | 4.1.3 |
| A11 | Low | Uppercase button labels (`ADD FIELD`, `CANCEL`, `SAVE`) are CSS-transformed; accessible names are correctly `Add Field`/`Cancel`/`Save`. Cosmetic only. | — |

---

## 7. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| F1 | **108 custom fields rendered as a flat scrolling wall.** The card has an inner scrollbar inside an already-scrolling page — a nested scroll trap. Nothing groups or prioritises them. | The single worst thing on the page. Most users need 0–2 of these. |
| F2 | **Custom fields carry pre-filled default values** (`ADAAD`, `0`, `2025-04-25`, a *checked* `boolean_field`). A user who never scrolls there silently saves data they never entered. | Data integrity, not just UX. |
| F3 | **The email-or-phone rule is announced by a dismissible banner** that overlaps the title. Dismiss it and the rule is invisible; nothing on the fields themselves says either is required. | The page's central rule is the least discoverable thing on it. |
| F4 | **Disabled List Subscription with no explanation.** Three greyed controls, no hint of what unlocks them. | Classic dead-end. |
| F5 | **Opt-in checkboxes auto-check on list select.** Silently opting a contact into email/SMS marketing is a consent decision made by the UI, not the operator. | Compliance risk (GDPR/CASL/SPAM Act). |
| F6 | **Footer is not sticky.** With 108 fields the SAVE button sits thousands of pixels down. | Users must scroll the whole wall to submit. |
| F7 | **No unsaved-changes guard.** CANCEL or a nav click discards everything silently. | |
| F8 | **Field names are raw database identifiers** — `fashion50_credit_blocked`, `ub_date123`. Display Name exists in the create-field drawer but is not used for rendering. | |
| F9 | **Completely broken below ~900px.** At 420px the sidebar holds full width, the content column collapses to a sliver, and headings wrap one character per line. Verified. | No mobile support at all. |
| F10 | **Two different "Search" inputs** on screen (global app search, custom-field search) with identical placeholder and no visible scoping. | |
| F11 | **Copy inconsistency:** "Select Custom Fields for New Contact" describes *selecting*, but the UI *fills values*. | |
| F12 | **Title count is the filtered count** but reads as a total — "Custom Fields (5)" after a search looks like the account has 5 fields. | |

---

## 8. Realistic mock-data shape for the rebuild

Sandbox stores already cover most of this:
- `useCdpEntities.lists` (6 `CdpList`) → Select List
- `useCdpEntities.tags` (5) → Tags. **Too few** to exercise the multi-select; extend toward ~20.
- `useCdpEntities.fields` (5 `CdpField`, types String/Integer/Boolean/Datetime/Text/Float — an exact
  match for the legacy type list) → Custom Fields. **Far too few** — needs ~40+ to reproduce F1.
- `useContacts.addContact` accepts only 7 keys and drops lists, custom fields, opt-ins and the
  journey flag. **Needs widening** for parity.

---

## 9. Unverified — carried into Phase 2 questions

1. **Success state.** SAVE was never clicked (it writes a real UAT record). Toast vs redirect vs
   inline confirmation is unknown.
2. **Server-side error state** (duplicate email, network failure).
3. **Permission-restricted state** — no low-privilege account was available.
4. **Phone-format validation** — `+61412345678` was accepted; no invalid phone was tested.
5. **"Breakup"/pagination of the custom-field list** — whether 108 is the full set or a page.
6. **Whether `Display Name` is used anywhere** on this form once set.
