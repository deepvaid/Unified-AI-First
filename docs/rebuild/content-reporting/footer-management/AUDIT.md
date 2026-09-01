# Footer Management — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/footers` (+ `/footers/:id`,
`/footers/:id/preview`, `/footers/new`), 2026-09-01. No records mutated.

## Page purpose & primary user task

Manage reusable **email footers** (the compliance block: unsubscribe / report spam / manage
subscriptions links + address). One footer is the account **Default**. Tasks: create, edit,
preview, set default, delete.

## 1. List — `/accounts/:id/footers`

```
Breadcrumb: "My Footers"
H1: "Footer Management"        [All ▾ editor-type filter]  [NEW FOOTER]
└── Table card
      ├── columns: Name (+ blue "Default" chip on the default row) · Editor Type
      │            ("Drag & Drop" | "WYSIWYG") · Updated At · Created At · Actions (kebab)
      ├── kebab (4): Set as Default · Preview Footer · Edit Footer · Delete Footer
      └── footer: Rows per page (10) · "1-10 of 85"
```

- Filter combobox options: All · Drag & Drop · WYSIWYG. Its open menu renders on top of its
  own field (existing defect family).
- No search on an 85-row list.

## 2. Preview — `/footers/:id/preview?index=true` (full-screen overlay)

```
[<name>] [EDIT CONTENT]                 [🖥][📱][⬜ full-width] [✕]
rendered footer: "This email was sent to {{contact.email}} by {{campaign.from_email}}" /
"{{campaign.address}}" / links: 1-Click Unsubscribe · Report Spam · Manage Subscriptions
```

## 3. Detail — `/footers/:id`

```
Breadcrumb: My Footers > <name>
H1: <name>            [🖥][📱][⬜] [↗ open] [EXIT]
├── Left card: name + ✏ (rename) · "Drag and Drop" outlined chip ·
│     1-Click Unsubscribe Page: Default
│     Report Spam Page: Default
│     Manage Subscriptions Page: saksham         ← names a Preference Page
│     Edit Profile Page: Not Required
└── Right card: laptop-framed footer preview + ✏ (edit content)
```

## 4. New — `/footers/new` ("Fill out Details", wizard step 1)

```
H1: "Fill out Details"
├── Name *
├── Section "Preference Page Type": 4 selects, each defaulted "Default", each with a 👁
│   preview icon: Select 1-Click Unsubscribe Page · Select Report Spam Page ·
│   Select Manage Subscription Page · Select Edit Profile Page
├── Section "Select Editor Type": radios — Drag & Drop (default) · WYSIWYG
└── [CANCEL] [NEXT]   (NEXT disabled until Name)
```

NEXT → step 2 = the chosen editor (NOT executed — would create a record). The editors
themselves are the same builder class as the content editors (cross-origin iframes,
unverifiable — same limitation as the marketing slice).

## Data shape

```ts
{ id, name, editorType: 'dragdrop' | 'wysiwyg', isDefault: boolean,
  createdAt, updatedAt,
  pages: { oneClickUnsubscribe: string, reportSpam: string,
           manageSubscriptions: string, editProfile: string | 'Not Required' }, // preference-page names
  html: string }
```

The `pages` values cross-link to **Preference Management** records (e.g. "saksham").

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| List | `MpPageHeader`, `MpDataTableToolbar` (quickFilter = editor type), `v-data-table`, `MpStatusChip`-style Default chip (or plain `v-chip`), `MpRowActionsMenu` |
| Preview | full-page route with `MpSegmentedControl` device toggle (like existing EmailContentPreview) |
| Detail | two-card layout, `MpListRow`s for the page mappings |
| New step 1 | full-page form: `MpFormSection` ×2, `MpFormGrid` cols=2, `MpFormField` for the radio group |
| Set as Default / Delete | `MpConfirmDialog` (delete → `danger`) |

## Accessibility issues observed

- Kebab: same single-`role=menuitem`/tabindex defect family (only one item keyboard-focusable).
- Device-toggle icon buttons in preview/detail have no accessible names.
- The "Default" chip is the only marker of default state — no text for screen readers beyond
  the chip label (acceptable) but Set-as-Default rows offer no feedback location (unverified).
- Eye-preview icon buttons on `/footers/new` are unlabeled.

## UX friction worth fixing

- No search on 85 rows; only an editor-type filter.
- The filter is an unlabeled combobox showing just "All" — unclear what it filters.
- Preview overlay's EDIT CONTENT vs detail page's two pencils — three entry points to the same
  editor with different labels.
- Editor Type displays "Drag & Drop" in the table but the detail chip says "Drag and Drop".
