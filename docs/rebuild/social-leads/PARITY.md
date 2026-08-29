# Lead Ads — parity checklist

Rebuild of UAT `/social_leads`, `/social_leads/new` and `/social_leads/:id/edit`.
Source of truth: [AUDIT.md](AUDIT.md) · [FLOWS.md](FLOWS.md).

Before this slice the sandbox's `/lead_ads` route pointed at `AcquisitionForms.vue` — a completely
different feature. This is the first real implementation.

Legend: ✅ parity · ✳️ parity with a deliberate improvement · ➕ added · ⛔ deliberately dropped ·
🚫 unverifiable on UAT, so the rebuild's behaviour is inferred.

---

## 1. List — `/accounts/:accountId/lead_ads`

| Feature | Status | Note |
|---|---|---|
| Breadcrumb / title | ✳️ | Real `h1`; the source's is an `h2` and the page has no `h1` at all. |
| Subtitle explaining what a "lead ad" is | ➕ | The record is a sync rule, not an advertisement. The source's naming makes this actively confusing and never corrects it. |
| `NEW META LEAD AD` CTA | ✅ | Sentence case. |
| Column `Lead Ad Name`, sortable | ✳️ | Now a link into the record. The source's name cell is not a link — the only way in is the kebab. |
| Column `Facebook Page` w/ external link + page number | ✅ | Opens Facebook in a new tab, with a screen-reader note saying so. |
| Column `Contact Lists` | ✳️ | Renders as chips. The source uses an `<a>` with **no `href`** — it looks tappable and does nothing. |
| Column `Lead form` | ➕ | The source shows the Page but never which form is wired up, which is the actual subject of the record. |
| Column `Created At` / `Updated At`, sortable | ✅ | |
| Column `Status` | ✳️ | A labelled switch. The source shows a static chip and hides the control in the kebab. |
| Row `⋮` — Edit · Delete · Activate | ✳️ | `Edit` · `Pause/Start syncing` · divider · `Delete` (danger, last). The source puts `Delete` second of three, undifferentiated from `Edit`. |
| Pagination | ✅ | |
| Empty state | ➕ | The source's account has one record, so its empty state was never reachable. 🚫 |
| Loading / error state | ➕ | The source has neither. |
| Search | ➕ | The source has no toolbar at all. |
| Status filter | ➕ | |
| Bulk selection | ⛔ | The source has no selection column, and a four-row list of integrations does not need one. Not added, to avoid inventing UI. |

## 2. Create — `/accounts/:accountId/lead_ads/new`

| Feature | Status | Note |
|---|---|---|
| Single-page long-scroll form (not a wizard or modal) | ✅ | The source's shape is kept exactly. |
| Four sections, one field each | ✅ | Lead ad name · Facebook page · Lead form · Contact lists |
| Section headings + descriptions | ✅ | `MpFormSection` with the source's own helper copy, lightly reworded. |
| `Lead Ad Name *` | ✳️ | Gains a `maxlength` and a counter; the source's has neither. |
| `Facebook Page *` autocomplete with `Connected` chips | ✅ | |
| ⓘ tooltip explaining which Pages appear | ✳️ | Now the field's own hint text rather than a hover-only bare `<i>`. |
| `Lead form *`, disabled until a Page is chosen | ✅ | |
| — options carry a creation date | ➕ | The source offers byte-identical duplicate names with no metadata, making the field unpickable. |
| — hint explaining why it is disabled | ➕ | |
| `Contact lists *` multi-select with counts | ✅ | |
| All four gate Save | ✅ | |
| `CANCEL` / `SAVE` | ✅ | |
| Validation waits for blur or submit | ✳️ | The source shows every `… is required` permanently, against valid values (D1). |
| Validation copy actionable + consistently punctuated | ✳️ | The source ships four differently-punctuated strings and calls the Contact Lists field "List". |
| Cancel on a dirty form confirms | ✳️ | The source silently destroys a filled form. |
| Route-leave guard | ➕ | |
| Empty state when Meta is not connected | ➕ | The source renders four dead dropdowns and offers no way to connect anything. |
| A Page named `Deleted page` offered as `Connected` | ⛔ | Source defect D2 — not reproduced. |
| Field-mapping step | ⛔ | 🚫 Does not exist anywhere in the source; not invented. |

## 3. Edit — `/accounts/:accountId/lead_ads/:id/edit`

| Feature | Status | Note |
|---|---|---|
| Same form, prefilled | ✅ | |
| Heading / subtitle / breadcrumb differ from create | ✅ | |
| Page and Lead form remain editable | ✅ | |
| `Save` disabled until something changes | ✳️ | The source ships it enabled on an untouched form, with no dirty tracking. |
| No permanent "is required" on load | ✳️ | Defect D1 is at its most visible on this route in the source. |
| Status shown on the edit form | ➕ | Not on the form itself — status stays on the list, where the switch lives. The source shows it in neither place. |
| Prefilled values render consistently with the list | ✳️ | The source renders the same two values four different ways (`Maropost Integrations` vs `Maropost Integrations (74)`, `shopify-2Jul` vs `shopify-2Jul (41)`). |

## 4. Meta connection

| Feature | Status | Note |
|---|---|---|
| Connection lives under Apps ▸ Integrations | ✅ | Unchanged; this slice does not touch it. |
| A route to it from the create form | ➕ | The empty state links to Apps. The source's only pointer is a tooltip naming an "app" it never links to. |
| OAuth flow | 🚫 | Never executed — the Meta tile was read, never clicked. Entirely out of scope. |

---

## Verification

- `npm run type-check` and `npm run build` — both pass.
- axe-core 4.12.1, WCAG 2.0/2.1 A + AA, scoped to `main` — **0 violations** on the list and the form.
- No horizontal overflow at 375px.
- Walked end to end: list → edit → change → save → toast → redirect → updated row; the Page →
  Lead form gating chain; validation firing on blur; the status switch.

## Still inferred

Every save, delete and status-toggle outcome on UAT; the empty list state; all error and
network-failure states; and everything beyond the Meta integration tile.
