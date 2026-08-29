# Improvements — Marketing Acquisition + Content slice

Every deliberate deviation from the source. 🔤 marks a copy change that needs sign-off.

## Cross-cutting

| # | Improvement | Why |
|---|---|---|
| X1 | **Search on every list.** | The source has none — on 43 forms, 37 landing pages and **489 email contents**. Finding a known record meant paging through 49 pages of 10. The single biggest friction in all four audits. |
| X2 | **Selection no longer destroys the primary CTA.** `MpFloatingBulkBar` floats over the table instead of replacing the header. | Ticking one row in the source unmounts `NEW FORM` / `NEW PAGE` / `NEW CONTENT` entirely, trading the page's main action for one bulk action. |
| X3 | **Bulk actions beyond delete** — move to folder, set live / pause. | Delete was the source's only bulk action, despite folders and status both being first-class concepts. |
| X4 | **Bulk delete is a labelled button behind a confirm** that names what is lost. | The source's is an unlabelled trash icon with no accessible name — the most destructive control in the module, unnamed. |
| X5 | **Filter, folder and tab state live in the URL.** | Nothing in the source reaches the URL, so no view can be bookmarked, shared or restored, and Back exits the page rather than undoing a filter. |
| X6 | **Real empty, loading and error states** (`MpEmptyState`, `MpTableSkeleton`, `MpErrorState`). | The source renders the bare Vuetify default `No data available`, a `Loading... Please wait` row with a nonsense `1-0 of 10` range, and has no error state at all. |
| X7 | **Every row-menu item is keyboard-reachable**, destructive items last, behind a divider, in the danger style. | In the source only one item per menu carries `role="menuitem"`/`tabindex=0` — Duplicate, Archive and Delete literally cannot be invoked from a keyboard. |
| X8 | **Every checkbox, switch and icon button has an accessible name.** | The source's row checkboxes, status switches, kebabs and copy buttons have none. |
| X9 | **Folders are a toolbar filter, not an overlay panel.** | Opening the source's folder panel collapses the entire global app sidebar to a 52px icon rail, and the rail then persists after navigating away. |
| X10 | **Validation waits for blur or submit.** | The source renders `… is required` permanently, including against valid, filled values — on the Lead Ads edit form it fires on load against a valid record. |
| X11 | **A real `h1` on every page.** | The source has no `h1` anywhere in this slice; heading levels run H2/H2/H4 within a single flow. |

## Acquisition Forms

| # | Improvement | Why |
|---|---|---|
| F1 | **The manual-integration snippet is populated.** | The source ships two labelled script fields and never fills the second — in both the row-menu dialog and the builder's final step (AUDIT D1). |
| F2 | **Both script fields are labelled**, and the copy buttons named. | The source's have no `<label>`, no `aria-label`, and are editable despite existing only to be copied. |
| F3 | **Every wizard step is labelled**, and completed steps stay clickable when editing. | The source labels only the active step, and un-completes steps 4–5 as soon as you touch step 3, silently removing forward navigation (AUDIT D4). |
| F4 | **Template cards paint instantly** from tokens, at a fixed 4:3 ratio, each with a description. | The source's cards are blank ~370px boxes for several seconds with no skeleton, carry no descriptions, and orphan the seventh card on its own row. |
| F5 | **Card structure is uniform.** | The source puts `Create from scratch`'s title at the top of the card and every other card's at the bottom. |
| F6 | **The status switch carries a visible `Live` / `Paused` label.** | The source's switch has no label and no accessible name — a column of anonymous switches. |
| F7 | **KPI cards, `Views` / `Conversions` / `Rate` columns and the card-grid view were removed.** | They were invented in a July redesign; UAT has no metrics anywhere in this module and no data source for them. Per the locked "match UAT, replace existing" decision. |
| F8 | 🔤 `NEW FORM` → **`New form`**; `Delete Permanently` → **`Delete`** (the confirm carries the permanence); `Show Script Link` → **`Show script link`**. | Sentence case matches the design system; SHOUTING CAPS were a legacy Vuetify 2 default. |
| F9 | 🔤 Script guidance rewritten: *"Paste this inside the `<head>` of every page the form should appear on. To show it everywhere, add it to a shared layout such as your footer template."* | The source says "paste it somewhere recurring like a footer", which is vague about what "recurring" means. |
| F10 | 🔤 Step 1 heading reads **`Edit form`** when editing. | The source's body heading says `New Form` even on the edit route. |

## Lead Ads

| # | Improvement | Why |
|---|---|---|
| L1 | **`Save` is disabled on an untouched edit form.** | The source ships it enabled with no dirty tracking, so the button says nothing about whether anything changed. |
| L2 | **Cancel on a dirty form confirms before discarding.** | The source silently destroys a filled form. |
| L3 | **Lead-form options carry their Meta creation date.** | The source offers byte-identical duplicate form names with no metadata to tell them apart, making the field unpickable. |
| L4 | **Status is a labelled switch in its own column.** | The source hides it behind a kebab item whose label flips between `Activate Lead Ad` and an unseen deactivate twin, and the edit form never shows the record's status at all. |
| L5 | **A launcher empty state when Meta is not connected**, linking to Apps. | The source renders four dead dropdowns and offers no route to connect anything. |
| L6 | 🔤 Page subtitle: *"Send leads from your Meta instant forms straight into contact lists"*. | The object is a sync rule, not an advertisement. Every string in the source inherits the "Lead Ad" confusion; the name is kept for recognisability but the subtitle says what it does. |
| L7 | 🔤 Field labels: `Facebook Lead Ad *` → **`Lead form *`**. | It selects a Meta *instant form*, not an ad. |
| L8 | 🔤 Validation copy made actionable and consistently punctuated — e.g. *"Choose the Facebook Page that runs the lead form."* | The source ships four differently-punctuated strings (`… is required.` vs `… is required`) and calls the Contact Lists field "List". |

## Design-system fixes made along the way

| # | Fix | Why |
|---|---|---|
| D1 | **`MpFormField` no longer sets `aria-required` on `role="group"`.** Required-ness now reaches screen readers through the accessible name. | ARIA does not allow `aria-required` on `role="group"`; it was a WCAG 4.1.2 failure inherited by every consumer of the component. Caught by axe on the form builder. |
| D2 | **`useFolders` gained an ownership + privacy model** (`owner`, `privacy`, `canDelete`, `canSetPrivacy`, `setPrivacy`) and a 36-character name cap. | The source's folder panel gates Privacy / Rename / Delete per folder owner, and the store had no way to express that. |
