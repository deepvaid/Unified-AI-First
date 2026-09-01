# Preference Management (Preference Pages) — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/preference_pages`, 2026-09-01.
No records mutated.

## Page purpose & primary user task

Manage the hosted **preference pages** contacts land on from footer links: Manage
Subscriptions, One Click Unsubscribe, Confirm Subscription. Footers reference these pages
(see Footer Management's page mappings). Tasks: create (pick type + editor), edit content,
preview, delete.

## Layout structure — `/accounts/:id/preference_pages`

```
Breadcrumb: "My Preference Pages"
H1: "Preference Management"   [All Editor Types ▾] [All Page Types ▾]   [NEW PAGE]
└── Table card
      ├── columns: Name · Editor Type ("Drag & Drop" | "WYSIWYG" | "HTML Code Editor") ·
      │            Page Type ("Manage Subscriptions" | "One Click Unsubscribe" |
      │            "Confirm Subscription") · Updated At · Created At · Actions (kebab)
      ├── kebab (3): Preview Preference Page · Edit Preference Page ·
      │             Delete Preference Page Permanently
      └── footer: Rows per page (10) · "1-10 of 44"
```

No search. Two filter selects (editor type, page type).

## NEW PAGE — "New Page" modal

```
├── Name *
├── Page Type * ▾  (default "Manage Subscriptions"; options = the three page types,
│                   inferred from table values — menu options not captured)
├── Redirect * ▾  (default "Default") + 👁 preview icon
│     helper: "The page where user will be redirected after successfully submitting the form."
├── "Select Editor *" radios: Drag & Drop (default) · WYSIWYG · HTML Code Editor
└── [CANCEL] [CREATE]   (CREATE disabled until Name)
```

CREATE presumably opens the chosen editor (same builder class as footers/content — cross-origin,
unverifiable). NOT executed.

## Data shape

```ts
{ id, name,
  editorType: 'dragdrop' | 'wysiwyg' | 'html',
  pageType: 'manage_subscriptions' | 'one_click_unsubscribe' | 'confirm_subscription',
  redirect: string, // 'Default' or another page
  createdAt, updatedAt, html: string }
```

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| List | `MpPageHeader`, `MpDataTableToolbar` (page-type quickFilter + editor filter in drawer, or two quick selects), `v-data-table`, `MpRowActionsMenu` |
| Type/editor chips | plain text per parity; `MpStatusChip type="general"` if we upgrade (flag) |
| New Page modal | `MpDialog` size sm: fields + `MpFormField` radio group |
| Preview | full-screen preview route (same pattern as Footer preview) |
| Delete | `MpConfirmDialog` `danger` ("Permanently" in the source copy) |

## Accessibility issues observed

- Legacy table throws a Vue resize-directive TypeError on load
  (`resizeDateColumn: Cannot read properties of undefined (reading 'type')`) — console noise
  baseline for this page.
- Kebab single-menuitem defect family.
- Filter selects show only their value ("All Editor Types") — no visible label element.
- Radio group "Select Editor *" has no fieldset/legend semantics.

## UX friction worth fixing

- Page title ("Preference Management") vs breadcrumb ("My Preference Pages") vs nav
  ("Preference Management") — minor, but the list is of "pages".
- "Delete … Permanently" with no archive alternative, unlike Dynamic Content (inconsistent
  lifecycle affordances across the module).
- No search on 44 rows.
- Redirect field's 👁 preview unlabeled; helper text truncates at narrow widths (observed
  clipping in modal).

## Sandbox divergence

`src/views/Marketing/PreferencePages.vue` (277 lines) exists at the same route; pre-crawl
build, needs verification against this audit (three editor types, three page types, New Page
modal shape, preview flow).
