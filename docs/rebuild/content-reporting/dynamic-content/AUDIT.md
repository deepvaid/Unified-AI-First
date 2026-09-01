# Dynamic Content — UAT audit

Read-only crawl of `uat.maropost.com/accounts/116000/dynamic_contents` (+ `/new`,
`/:id/edit`, VIEW ARCHIVES), 2026-09-01. No records mutated.

## Page purpose & primary user task

Manage **dynamic content blocks**: a named piece of email content with a default body plus
per-segment rule bodies. Campaigns reference the block; each contact sees the body whose
segment rule they match, else the default.

## 1. List — `/accounts/:id/dynamic_contents`

```
Breadcrumb: "My Dynamic Content"
H1: "Dynamic Content"  [VIEW ARCHIVES]                     [NEW DYNAMIC CONTENT]
└── Table card
      ├── columns: Name · Number of Segments · Created At · Updated At · Actions (kebab)
      └── footer: Rows per page (10) · "1-10 of 19"
```

- Kebab menu (2 items): **Archive Dynamic Content** · **Edit Dynamic Content**.
- No search, no filters, no bulk select, no folders.
- VIEW ARCHIVES → `/archive?filter=dynamic_contents` — the shared Archives page
  (breadcrumb "Settings > Archives") pre-filtered via a "Dynamic Content" select; empty state:
  "You have no archived items." / "Archive outdated content or campaigns to keep your
  workspace up-to-date."

## 2. Editor — `/dynamic_contents/new` and `/dynamic_contents/:id/edit`

```
Breadcrumb: Dynamic Content > <name | "New Dynamic Content">
H1: "New Dynamic Content" | "Edit Dynamic Content"
├── Name*  (hint: "Must only contain lowercase alphabets, numbers or underscores.")
├── Section "Original Content Preview"
│     copy: "This content will be displayed to the contacts who do not fall into any of the
│            below segment groups (under rules)."
│     ├── Content Feed [select, clearable]
│     ├── CKEditor (full toolbar + Maropost dropdowns: Campaign Tags · Contact Tags ·
│     │   Other Tags · Dynamic Areas · Table Tags · Coupon Tags · Product Feeds)
│     └── [PREVIEW] → "Content Preview" modal rendering the HTML
├── Rule N (repeats; new form starts with Rule 1)
│     ├── Segment* [select, clearable] · Content Feed [select] · 🗑 (remove rule)
│     ├── CKEditor (same toolbar)
│     └── [PREVIEW] → same modal
├── [+ ADD NEW RULE]
└── footer: [CANCEL] [SAVE]   (SAVE disabled until valid)
```

Validation observed: typing `Invalid Name!` + blur → field error border + message
"Must only contain lowercase **letters**, numbers or underscores." (hint says "alphabets",
error says "letters" — copy inconsistency in the source).

## Data shape

```ts
{ id, name, // lowercase_snake
  createdAt, updatedAt,
  original: { contentFeedId?: string, html: string },
  rules: [{ segmentId: string /* required */, contentFeedId?: string, html: string }] }
// list column "Number of Segments" = rules.length (min 1 in practice)
```

## Component mapping (rebuild)

| UAT element | Design system |
|---|---|
| List | `MpPageHeader` (+ View archives secondary action), `v-data-table`, `MpRowActionsMenu` + `MpMenuItem` |
| Editor page | full-page form: `MpPageHeader` `backTo`, `MpFormSection` per block |
| Rich text | textarea/simple editor stand-in (sandbox has no CKEditor) → GAPS.md |
| Tag dropdowns | menu buttons inserting `{{merge_tags}}` into the body (mock) |
| Preview modal | `MpDialog` rendering the html |
| Archive confirm | `MpConfirmDialog` (archive is reversible; not `danger`) |
| Archives page | existing `ContentArchives.vue` + `?filter=` deep link |

## Accessibility issues observed

- Kebab menu items: only first item keyboard-reachable (same one-menuitem defect family as
  Landing Pages / Email Content).
- CKEditor toolbars are icon-grids with title attrs only; the custom tag dropdowns are
  `<select>`-styled buttons without labels.
- Name error not `aria-live`; error only changes color/border.

## UX friction worth fixing

- No search on a 19-row list; no folder support unlike other content types.
- Two identical-looking CKEditor stacks (original + each rule) with no visual grouping —
  rule boundaries blur once 2+ rules exist.
- "Number of Segments" counts rules, not segments — label is misleading.
- Archive has no undo affordance visible from the list (must visit Archives page).
