# AUDIT — New List

**Source:** `https://uat.maropost.com/accounts/116000/create_list?folder_id=`
**Crawled:** 2026-08-28 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session
**Legacy stack:** Vue 2 + Vuetify 2 (`v-tooltip__content`, `menuable__content__active`, `v-messages`)

> Crawl method: full interaction sweep — every select opened and its options enumerated, every
> tooltip forced open and transcribed, validation exercised by typing then clearing the required
> field. **No record was created** — SAVE was never clicked, so the success/toast state is inferred,
> not observed. See "Unverified" at the bottom.

---

## 1. Page purpose and primary user task

Create a contact list — the container contacts are subscribed to. A list is not just a bucket: it
carries the **sender identity** used when a campaign goes out to it (From Name / From Email /
Reply To / Address / Language), its **public presentation** on the hosted Manage Subscription page
(Display Name, Description), a **webhook** for subscription changes (Post URL), and optional
**cart integration** bindings.

The **primary task** is: name the list, and — if it will ever be mailed — set the sender identity.

The `folder_id` query param is present but empty on this entry point; the page shows no folder
picker, so folder assignment appears to come from the launching context rather than the form.

---

## 2. Layout structure and hierarchy

```
AppBar (global)                    — logo, search, account switcher, AI, settings, help, notifications, user
AppSidebar (global, dark, 242px)   — Dashboard / Analytics / CDP / Products / Marketing / Commerce /
                                     Retail / Service / Da Vinci AI / Dashboard / Conversations / Apps
                                     + "Get Started 10/16 Completed" progress block pinned at top
└── Content column (left-aligned, ~1015px, large right gutter)
    ├── Breadcrumb   "Contact Lists › New List"     (Contact Lists is a link)
    ├── Page title   "New List"                      (H4 — no H1 on the page)
    ├── Subtitle     "Enter details for New List"
    ├── Block 1  (unnamed, no card border)  — list identity + subscription presentation
    ├── Card 2   "Email Campaign Fields"
    ├── Card 3   "Carts"  + sub-label "Enter details for cart integration"
    └── Footer   [CANCEL]  [SAVE]                    (inline at end of document — not sticky)
```

**The first block has no title and no card border**, while blocks 2 and 3 are bordered cards with
titles. Seven of the page's twelve fields live in that unnamed, unbounded region.

Field widths are inconsistent by row: List Name is full-width, List Type / Add to Manage
Subscription Page are a 2-up, Brand is full-width, Display Name / Description / Post URL are
full-width, then From Name / From Email and Reply To / Language are 2-ups again.

---

## 3. Component inventory → design-system mapping

| # | Legacy element | Observed behaviour | Marobase equivalent |
|---|---|---|---|
| 1 | Breadcrumb `Contact Lists › New List` | Static; first crumb links to list | `MpPageHeader` `backTo` |
| 2 | Page title (H4) + subtitle | Plain text | `MpPageHeader` `title` + `subtitle` |
| 3 | Unnamed first block | No border, no heading | `MpFormSection` (give it a real title) |
| 4 | `v-card` × 2 with title + sub-label | Section container | `v-card flat border rounded="lg"` + `MpFormSection` |
| 5 | 2-col field grid (inconsistent) | Fixed 2-up, no collapse | `MpFormGrid :cols="2"` + `.mp-form-grid__full` |
| 6 | `v-text-field` outlined × 8 | Name/Display/Desc/PostURL/FromName/FromEmail/ReplyTo/Address | bare Vuetify `v-text-field` |
| 7 | Character counter `0 / 150` | Live, right-aligned, shares row with error | field `counter` + `maxlength` |
| 8 | `v-select` List Type | 2 options, readonly input | `v-select` |
| 9 | `v-select` Add to Manage Subscription Page | Yes/No, default No | `v-select` |
| 10 | `v-autocomplete` Brand | Typeable, 10 options, clearable | `v-autocomplete` |
| 11 | `v-select` Language | 11 options, default English | `v-select` |
| 12 | ⓘ tooltip icons × 4 | Hover-only, no accessible name | `v-tooltip` |
| 13 | `v-checkbox` × 5 (Carts) | One per cart integration | `v-checkbox` |
| 14 | Cart `Item / Product / LDS` text × 5 | Always enabled, even when its cart is unchecked | `v-text-field` |
| 15 | Inline error `List Name is required` | Red outline + message on blur | field `:error-messages` |
| 16 | CANCEL / SAVE | SAVE disabled until List Name non-empty | `v-btn` pair in page footer |
| 17 | Full-screen loading overlay | "Just a moment / Preparing an optimised workspace for you" + progress bar, ~5–8s | see GAPS (no full-page loading shell) |

**Rebuild shell:** the sandbox already owns this pattern —
`src/views/Contacts/CreateContact.vue` (built in the previous rebuild slice) is the reference:
`MpPageHeader` + `backTo`, card-stack body, footer, `useDirtyLeaveGuard` + `MpConfirmDialog`.

---

## 4. Data fields, labels and copy (verbatim)

### Block 1 — list identity (unnamed section)

| Label | Control | Required | Default | Notes |
|---|---|---|---|---|
| `List Name *` | text | **yes** | — | `maxlength=150`, live counter `0 / 150` |
| `List Type` | select | no | `Normal` | options render as `normal`, `suppressed` |
| `Add to Manage Subscription Page` | select | no | `No` | options `Yes`, `No` · ⓘ |
| `Brand` | autocomplete | no | *(empty)* | typeable |
| `Display Name` | text | no | — | ⓘ |
| `Description` | text | no | — | ⓘ · single-line input, not a textarea |
| `Post URL` | text | no | — | ⓘ |

**Brand options (10, verbatim and in order):**
`BSLN- SMS` · `Airpel- SMS` · `Acer` · `benQ` · `yg` · `Test-Adidas` · `Calvin Klein` · `Uniqlo` ·
`Cockatoo` · `H&M`

### Card 2 — `Email Campaign Fields`

| Label | Control | Required | Default |
|---|---|---|---|
| `From Name` | text | no | — |
| `From Email` | text | no | — |
| `Reply To` | text | no | — |
| `Language` | select | no | `English` |
| `Address *` | text | **marked required** | pre-filled from account |

**Language options (11, verbatim and in order):**
`English` · `Spanish` · `German` · `Italian` · `French` · `Portuguese` · `Polish` · `Danish` ·
`Dutch` · `Swedish` · `Norwegian`

**Address default value (verbatim, as found):**
`cp67, mohali, mohali, CH 160062 IN, mohali, mohali, CH 160062 IN, mohali, mohali, CH 160062 IN, mohali, mohali, CH 160062 IN, m…`
— the account's physical address, stored duplicated many times over, rendered in a single-line
input that truncates. This is UAT data rot, but it exposes a real design flaw (see F6).

### Card 3 — `Carts`
- Sub-label: `Enter details for cart integration`
- Five cart integrations, each a checkbox + one text field labelled `Item / Product / LDS`:
  `maropost1` · `UM-Ultratesting` · `UB-ultra` · `UB-nana` · `sd`
- All checkboxes default unchecked; all five text fields are enabled regardless.

### Tooltips (all four, verbatim)

| Attached to | Text |
|---|---|
| `Add to Manage Subscription Page` | "Manage Subscription allows the subscribers to customize their experience by selecting the lists they want to subscribe to or unsubscribe from." |
| `Display Name` | "The name of the list that is shown on the Manage Subscription page." |
| `Description` | "The description of the list as it appears in the Manage Subscription page." |
| `Post URL` | "A web hook that will fire each time a contact's subscription status to the list changes." |

### Footer
- `CANCEL` (outlined) · `SAVE` (filled, disabled until List Name non-empty)

---

## 5. Interactions and behaviours

### Validation (verified by exercising the field)

| State | `List Name` | Error shown | SAVE |
|---|---|---|---|
| On load | empty | none | **disabled** |
| Typed (`est`) | non-empty | none | **enabled** |
| Cleared, then blurred | empty | `List Name is required` + red outline | **disabled** |

- **SAVE gates on List Name alone.** `Address *` is marked required with an asterisk but does not
  gate SAVE — it is pre-filled from the account, and was not tested empty (clearing it would risk
  the account default). Flagged as unverified.
- The error message appears **on blur**, not on keypress.
- The error text and the `0 / 150` counter render on the **same line**, error left, counter right.
- The error string is present **twice** in the DOM (two `.v-messages` nodes with identical text) —
  a screen reader may announce it twice.

### Other behaviours
- **Loading:** full-viewport white screen — "Just a moment" over "Preparing an optimised workspace
  for you" with an indeterminate progress bar — for roughly 5–8 seconds on route entry.
- **List Type** displays `Normal` in the closed control but its menu renders lowercase `normal` /
  `suppressed`. The closed and open states disagree.
- **Brand** is a typeable autocomplete; the other three selects are readonly.
- **Cart text fields never disable** — you can type an Item/Product/LDS value against a cart whose
  checkbox is unchecked, with no indication whether it will be saved.
- **Cancel:** returns to Contact Lists. **No unsaved-changes guard was observed.**
- **Tooltips** render visually **detached from their trigger** — hovering the Display Name ⓘ pops
  the bubble up beside the Brand row, roughly 45px above the icon. Reproducible.

---

## 6. Accessibility findings

Verified against the live DOM.

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | High | **No `<h1>`.** The page title "New List" is an `H4`, and it is the *only* heading in `<main>`. | 1.3.1 / 2.4.6 |
| A2 | High | **Section titles are not headings.** `Email Campaign Fields` and `Carts` render as styled non-heading elements — a DOM query for `h1…h6` returns only "New List". A screen-reader user gets one heading for a 3-section, 22-control form. | 1.3.1 |
| A3 | High | **Select options carry no listbox semantics.** The `Add to Manage Subscription Page` menu renders `Yes`/`No` with no `role="option"` on the items — only `List Type` exposed them. Options are not reliably reachable as a listbox. | 4.1.2 |
| A4 | High | **The first section is unlabelled and unbounded** — seven fields sit in a region with no heading, no border and no group semantics. | 1.3.1 |
| A5 | Medium | **Error not programmatically associated.** `List Name is required` is a sibling `.v-messages` node; the input carries no `aria-describedby` / `aria-invalid`. | 3.3.1, 4.1.2 |
| A6 | Medium | **Duplicate error node** — the same message exists twice in the DOM, risking a double announcement. | 4.1.3 |
| A7 | Medium | **Tooltips are hover-only** on ⓘ icons with **no accessible name**, and the bubble renders detached from its trigger. Four pieces of explanatory copy are unreachable by keyboard. | 1.4.13, 2.1.1 |
| A8 | Medium | **`From Email` and `Reply To` are `type="text"`**, not `type="email"` — no native semantics, no mobile keyboard hint. `Post URL` is not `type="url"`. | 1.3.5 |
| A9 | Medium | **Breadcrumb is not in a `<nav>`.** The only `<nav>` on the page is the sidebar drawer. | 1.3.1 |
| A10 | Medium | **Cart checkboxes and their text fields are not grouped.** Each pair is visually associated but has no `fieldset`/`role="group"`, so the field's relationship to its cart is visual only. | 1.3.1 |
| A11 | Low | Uppercase button labels (`CANCEL`, `SAVE`) are CSS-transformed; accessible names are correctly `Cancel` / `Save`. Cosmetic only. | — |

---

## 7. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| F1 | **The first and largest section has no title.** Seven fields — the list's identity and its entire public presentation — float above the two titled cards with no name and no container. The page reads as if it starts mid-thought. | The worst structural problem on the page. |
| F2 | **`Address *` is marked required but doesn't gate SAVE**, while `List Name *` (same asterisk) does. The asterisk means two different things on one form. | Users can't trust the required marker. |
| F3 | **Four of seven fields in block 1 exist only to serve the Manage Subscription page** — Display Name, Description, and the Add-to-Manage-Subscription toggle itself — but that relationship is buried in hover-only tooltips. Set "Add to Manage Subscription Page" to No and three fields below it become pointless, with no visual change. | Conditional relevance is invisible. |
| F4 | **List Type shows `Normal` closed and `normal` open.** Two casings for one value. | Small, but it reads as a bug. |
| F5 | **`Description` is a single-line text input.** A field explicitly for prose shown on a public page gives one line with no wrapping. | Guarantees truncated public copy. |
| F6 | **`Address` is a single-line input holding a long, comma-heavy postal address** that scrolls horizontally and cannot be read or verified in place. In this account it also contains obviously corrupt duplicated data that the UI gives no way to notice. | Users cannot review the legal footer address they are about to mail with. |
| F7 | **Cart text fields are enabled while their checkbox is off.** No gating, no hint about whether the typed value persists. | Silent data loss or silent data retention — the user can't tell which. |
| F8 | **`Item / Product / LDS` is an unexplained label** repeated five times with no tooltip and no hint. "LDS" is undefined anywhere on the page. | Pure jargon at the point of entry. |
| F9 | **Footer is not sticky.** With the Carts card the form runs well past a viewport; SAVE sits at the bottom of the document. | |
| F10 | **No unsaved-changes guard.** CANCEL or a nav click discards everything silently. | |
| F11 | **Error and character counter share one line.** `List Name is required` sits immediately left of `0 / 150`, competing for the same strip. | Validation reads as part of the counter. |
| F12 | **Tooltip renders detached from its trigger**, appearing beside a different field's row. | Users may attribute the copy to the wrong field. |
| F13 | **The whole "Email Campaign Fields" card is sender identity** but is never called that; and nothing indicates it is only needed if the list will be mailed. | |

---

## 8. Realistic mock-data shape for the rebuild

The sandbox store `useCdpEntities.ts` already has `CdpList` + `addList/updateList`, but the shape
is much narrower than the source. Parity needs:

```ts
interface CdpList {
  id: string
  name: string                    // required, max 150
  type: 'normal' | 'suppressed'   // default 'normal'
  addToManageSubscription: boolean // default false
  brand?: string
  displayName?: string
  description?: string
  postUrl?: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
  language: string                // default 'English'
  address: string
  carts: { id: string; name: string; enabled: boolean; itemProductLds?: string }[]
}
```

- **Brands** — seed the 10 observed values.
- **Languages** — seed all 11 observed values in source order.
- **Carts** — seed 5 (`maropost1`, `UM-Ultratesting`, `UB-ultra`, `UB-nana`, `sd`).
- The existing sandbox `Create/Edit List` drawer in `ContactLists.vue` covers only
  "List details" + "Sender" — roughly half these fields. See PARITY.

---

## 9. Unverified — carried into Phase 2 questions

1. **Success state.** SAVE was never clicked (it writes a real UAT list). Toast vs redirect vs
   inline confirmation is unknown.
2. **Server-side error state** (duplicate list name, network failure).
3. **Whether `Address` empty blocks SAVE.** Clearing the account's pre-filled address on UAT was
   judged too invasive. The asterisk claims required; the observed gate is List Name only.
4. **Whether cart Item/Product/LDS values persist when the cart checkbox is off.**
5. **What `LDS` stands for**, and what the Item/Product/LDS field actually binds to.
6. **The `folder_id` parameter** — no folder control appears on the form; entry from a folder
   context was not tested.
7. **`List Type = suppressed` behaviour** — whether choosing it changes the rest of the form
   (e.g. hides the campaign/sender card). Not tested, as it required committing a selection.
8. **Permission-restricted state** — no low-privilege account was available.
9. **Responsive behaviour** — not measured on this page; the sibling New Contact page was verified
   broken below ~900px and this page uses the same shell.
