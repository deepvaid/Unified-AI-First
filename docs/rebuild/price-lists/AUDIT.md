# AUDIT — Price Lists (Commerce)

Source: `https://uat.maropost.com/commerce/116000/price-lists` · crawled 2026-08-29
(Modern commerce app, same shell as Products.)

## Purpose & primary task

Create scheduled, audience-scoped price adjustments per sales channel ("pricing configurations"):
e.g. +10% for everyone on channel X between two dates, or a discount for a contact list.
Primary task: create/activate a price list.

## Layout

```
Breadcrumb "Price Lists" · H1 "Price Lists"
Header actions: FILTERS (text btn) · NEW PRICE LIST (black)
v-data-table: Title · Sales Channels · Contact Lists · Start Date · End Date · Products · Status · Actions
Footer: Rows per page 10 ▾ · 0-0 of 0 · ‹ ›
```

- **The account has zero price lists** → the page renders its true empty state: a plain
  "No records found" row inside the table. No illustration, no CTA, no guidance.
- Because of that, row-level UI (status chip colours, kebab actions, Products count cell,
  date formats) is **unverified** — inferred from the create form + column names only.
- No search. No ADD FILTER / custom-views tab row on this page (unlike Products).

## Filters drawer

Title "Filters", ✕. Fields: `Status` (Draft | Active) · `Sales Channel` (data list) ·
`Contact List` (data list) · `Start Date` / `End Date` (date pickers).
Footer: `CANCEL` / `APPLY` — **no SAVE FILTER** here (inconsistent with Products).

## Component mapping

| UAT element | Rebuild with |
|---|---|
| Header | `MpPageHeader` + `#actions` |
| Filters drawer | `MpDataTableToolbar` `#filter-content` |
| Table | `v-data-table` per pattern |
| Empty state | `MpEmptyState` (improvement over bare "No records found") |
| Status | `MpStatusChip` (Draft/Active) |
| New Price List page | full-page form view (`MpPageHeader backTo` + `MpFormSection`/`MpFormGrid`) |
| Rule row (attribute/operator/value) | 3-select row (same builder idiom as segments) |
| Date+time pairs | date picker + time picker pair (see GAPS if no Mp equivalent) |

## New Pricing Configuration (`/price-lists/new`)

Breadcrumb "Price Lists › New Price List", H1 **"New Pricing Configuration"** (🔤 title mismatch
vs CTA "New Price List"), header `CANCEL` / `SAVE` (disabled until valid).

Sections:
1. **General Information** — `Title *`, `Sales Channel *` (select), `Description` (rich-text).
2. **Who can use this price list?** — hint "Price list prices will be applied to this contact
   list. If left untouched, they will apply to everyone." Rule row: `Select Attribute`
   (default **Contact Lists**) · `Select Operator` (default **Equal**) · `Select Value`
   (data list). (Other attribute/operator options unverified — menus not enumerated.)
3. **Time Configuration** — "Schedule the price list to activate in the future."
   `Start Date` 📅 + `Select Time` 🕐 · `End Date` 📅 + `Select Time` 🕐 (time fields disabled
   until a date is chosen).
4. **Pricing** — "Customer will see price in Australian Dollar ($AUD). This is based on Market
   customer shops from." `Overall price adjustment` (**Increase | Decrease**) +
   `Percentage %` (default 0.00, % suffix) + ⓘ tooltip.

No product-level price grid on this form — per-product prices appear later as the extra
"Price AUD" columns in the product wizard's variant grid (observed on Products step 3).

## Copy inventory

All strings above verbatim; noteworthy: "This is based on Market customer shops from." (🔤 broken
grammar), "If left untouched, they will apply to everyone." (🔤 "left untouched" → "left empty").

## Accessibility issues observed

- Empty state is a bare table row — no heading/guidance, not announced as a region.
- "Select Attribute/Operator/Value" labels are placeholder-style; rule row has no group label.
- Time inputs disabled with no explanation of why.
- ⓘ tooltip hover-only.

## UX friction worth fixing

1. Empty table with no CTA/education — first-run users get "No records found" and must find the
   header button (rebuild: proper `MpEmptyState` with create action).
2. H1 "New Pricing Configuration" vs everywhere else "Price List".
3. Filters drawer inconsistency (no Save Filter, unlike Products).
4. Percentage-only adjustment with no preview of effect.
5. Rule row defaults look pre-filled (Contact Lists / Equal) but Value empty — reads half-configured.
