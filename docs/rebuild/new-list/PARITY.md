# PARITY — New List

**Source:** `uat.maropost.com/accounts/116000/create_list?folder_id=`
**Rebuild:** [`src/views/Contacts/CreateList.vue`](../../../src/views/Contacts/CreateList.vue)
**Routes:** `/accounts/:accountId/lists/new` · `/accounts/:accountId/lists/:id/edit`

Every audited feature and state, checked against the rebuild.

---

## Layout

| # | Source | Rebuilt | Notes |
|---|---|---|---|
| 1 | Breadcrumb `Contact Lists › New List` | ✅ | `MpPageHeader` `backTo` |
| 2 | Page title `New List` | ✅ | Promoted from `h4` to the page `h1` |
| 3 | Subtitle `Enter details for New List` | ✅ | Rewritten — see IMPROVEMENTS |
| 4 | Unnamed first block (7 fields, no border) | ✅ | Split into two titled cards |
| 5 | Card `Email Campaign Fields` | ✅ | Retitled `Sender identity` |
| 6 | Card `Carts` + sub-label | ✅ | Retitled `Cart integrations` |
| 7 | Footer `CANCEL` / `SAVE` | ✅ | Made sticky |

## Fields — list identity

| # | Field | Control | Required | Rebuilt |
|---|---|---|---|---|
| 8 | `List Name *` | text, max 150, live counter | yes | ✅ counter + maxlength preserved |
| 9 | `List Type` | select `normal` / `suppressed` | no | ✅ cased consistently as Normal / Suppressed |
| 10 | `Add to Manage Subscription Page` | Yes/No select, default No | no | ✅ as a switch — see deviations |
| 11 | `Brand` | typeable autocomplete, 10 options | no | ✅ all 10 seeded, clearable |
| 12 | `Display Name` | text | no | ✅ |
| 13 | `Description` | **single-line** text | no | ✅ as a textarea — see deviations |
| 14 | `Post URL` | text | no | ✅ `type="url"` |

## Fields — sender identity

| # | Field | Control | Rebuilt |
|---|---|---|---|
| 15 | `From Name` | text | ✅ |
| 16 | `From Email` | text | ✅ `type="email"` |
| 17 | `Reply To` | text | ✅ `type="email"` |
| 18 | `Language` | select, 11 options, default English | ✅ all 11 in source order |
| 19 | `Address *` | **single-line** text, prefilled | ✅ as a textarea, prefilled — see deviations |

## Carts

| # | Source | Rebuilt |
|---|---|---|
| 20 | 5 cart integrations (`maropost1`, `UM-Ultratesting`, `UB-ultra`, `UB-nana`, `sd`) | ✅ all 5 seeded |
| 21 | Checkbox per cart, default unchecked | ✅ |
| 22 | `Item / Product / LDS` text per cart | ✅ label kept verbatim |
| 23 | Cart field enabled while its checkbox is off | ⚠️ **changed** — now gated. See deviations |

## Option sets (verbatim)

| # | Set | Count | Rebuilt |
|---|---|---|---|
| 24 | List Type | 2 | ✅ |
| 25 | Add to Manage Subscription | 2 | ✅ |
| 26 | Brand | 10 | ✅ |
| 27 | Language | 11 | ✅ in source order |

## Tooltip copy

| # | Attached to | Rebuilt |
|---|---|---|
| 28 | Add to Manage Subscription Page | ✅ as an always-visible hint |
| 29 | Display Name | ✅ as an always-visible hint |
| 30 | Description | ✅ as an always-visible hint |
| 31 | Post URL | ✅ as an always-visible hint |

## Behaviours and states

| # | Source behaviour | Rebuilt |
|---|---|---|
| 32 | Save disabled until List Name non-empty | ✅ (also gated on Address — see deviations) |
| 33 | `List Name is required` on blur | ✅ as `Enter a list name` |
| 34 | Red outline on the invalid field | ✅ |
| 35 | Character counter `0 / 150` | ✅ |
| 36 | Cancel returns to Contact Lists | ✅ |
| 37 | No unsaved-changes guard | ⚠️ **added** — see deviations |
| 38 | Full-page loading overlay | ➖ not applicable — the sandbox has no route latency |
| 39 | Edit an existing list | ✅ same page at `/lists/:id/edit`, prefilled |
| 40 | Success feedback | ⚠️ **inferred** — toast + redirect. Never observed on UAT |
| 41 | Server-side error state | ❌ **not built** — never observed. See open items |
| 42 | Permission-restricted state | ❌ **not built** — no low-privilege account available |

## Verification

| # | Check | Result |
|---|---|---|
| 43 | `npm run type-check` | ✅ passes |
| 44 | axe-core WCAG 2.0/2.1 A + AA, page content | ✅ **0 violations** |
| 45 | No horizontal overflow at 375 px | ✅ measured `scrollWidth === clientWidth === 375` |
| 46 | Renders with no console errors from this page | ✅ |
| 47 | Zero non-system styles | ✅ tokens and Vuetify utilities only |

---

## Deliberate deviations

Each one is a fix to an audited defect, per the agreed "fix defects, replicate features" rule.

1. **The first section was given a name and a card.** The source floats seven fields — the list's
   identity and its entire public presentation — above two titled cards with no heading and no
   border (audit F1). Split into `List details` and `Manage Subscription page`, which also groups
   the four fields that only exist to serve that page (audit F3).

2. **`Address *` now gates Save.** In the source the asterisk means two different things: List Name
   blocks Save, Address does not (audit F2). Both are now required, and the footer says why Save is
   disabled.

3. **`Description` and `Address` are textareas.** Both are single-line inputs in the source; a
   description shown on a public page and a long postal address both truncate and scroll out of
   view (audit F5, F6).

4. **Cart fields are disabled until their cart is selected.** The source leaves them editable with
   no indication whether a value against an unchecked cart is kept (audit F7).

5. **Tooltips became always-visible hints.** All four were hover-only on unnamed icons, unreachable
   by keyboard, and rendered detached from their trigger (audit A7, F12).

6. **`Add to Manage Subscription Page` is a switch, not a Yes/No dropdown.** Same binary, more
   direct, and it keeps its explanation permanently visible.

7. **An unsaved-changes guard was added.** The source discards everything silently on Cancel or a
   nav click (audit F10).

8. **The footer is sticky** (audit F9), and section titles are real `h2`s under a page `h1`
   (audit A1, A2, A4).

9. **List Type is cased consistently** as `Normal` / `Suppressed`. The source shows `Normal` in the
   closed control and lowercase `normal` in the open menu (audit F4).

## Open items carried forward

- **Success and error states are inferred.** Save was never pressed on UAT (it writes a real list),
  so the toast, any server-side duplicate-name handling, and network-failure behaviour are guesses.
- **`Item / Product / LDS` is still unexplained.** The label is kept verbatim because no source
  copy, tooltip or hint defines "LDS". It needs a subject-matter answer before it can be improved.
- **`List Type = suppressed`** may change the rest of the form in the source; not testable without
  committing a selection. The rebuild keeps every field visible for both types.
- **The `folder_id` parameter** has no matching control on the source form and is not modelled.
