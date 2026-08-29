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

## Landing Pages

Covers `/landing_pages` (list), `/landing_pages/template` (Select Template) and
`/landing_pages/create` (Select Builder). Source: `docs/rebuild/landing-pages/AUDIT.md`.

### List — `LandingPages.vue`

| # | Improvement | Why |
|---|---|---|
| P1 | **`EditorType` is a three-value union** (`Drag & Drop` · `WYSIWYG` · `Drag & Drop (Legacy)`), and the quick filter offers all three in UAT's order. | The sandbox modelled only two, so a third of a real account's pages had no representable type (AUDIT §1 column 2). |
| P2 | **Search over name and URL**, plus the editor-type filter promoted to a labelled pill. | The source's only filter is an *unlabelled* `All` select, and there is no search at all across 37 pages (AUDIT friction 1, 5). |
| P3 | **The editor-type filter is a checkbox pill that closes and clears cleanly.** | The source's Vuetify-2 menu paints its selected item *over* the activator, so the field reads `Allrag & Drop (Legacy)` and the `All` option becomes unreachable — the filter cannot be cleared (AUDIT D3). |
| P4 | **Folder filtering via `MpFolderSelect` with per-folder counts**, and the selection in `?folder=`. | The source's folder panel has no counts and never changes the URL, so a folder view cannot be bookmarked, shared or restored, and Back does not leave it (AUDIT D11). |
| P5 | **`?q=`, `?type=`, `?folder=` all restore on load**, written with `router.replace` so filtering does not flood the back stack. | Nothing in the source reaches the URL. |
| P6 | **Selection keeps `New page` mounted**; the bulk bar floats. | The source removes `NEW PAGE` from the DOM the moment one row is ticked (AUDIT friction 2). |
| P7 | **Bulk move-to-folder alongside bulk delete**, both behind labelled buttons; delete behind a `danger` confirm. | Delete was the source's only bulk action, and its trigger is an unlabelled trash icon carrying `theme--dark` on a white header (AUDIT friction 3, D10). |
| P8 | **Real empty states** — filtered, empty-folder and first-run variants — plus `MpTableSkeleton` and an `MpErrorState` branch. | The source shows the bare Vuetify default `No data available` in disabled grey, with a footer range that degrades to a bare en-dash (AUDIT D4, D5). The rebuild reads `0-0 of 0`. |
| P9 | **Row checkboxes are always visible and named** (`Select <page name>`), and there is no drag grip. | The source's checkbox and grip are `opacity: 0` until hover — invisible to keyboard and touch while staying in the tab order — and the grip's two vertical-dot icons sit beside a kebab built from one, so the same glyph means "reorder" and "actions" in adjacent columns (AUDIT D12, friction 7). |
| P10 | **Every row-menu item is a real `menuitem`**, delete last, behind a divider, in the danger style. | The source gives `role="menuitem"`/`tabindex=0` to exactly one of four items: Verify Domain, Duplicate and Delete cannot be invoked from a keyboard at all, and `Delete Landing Page Permanently` renders in the same black as Duplicate (AUDIT D6, a11y 10). |
| P11 | **`Verify domain` stays disabled on a verified row but now says why** — a tooltip wired through `aria-describedby`, plus `aria-disabled`. | The source greys it out with no tooltip and no explanation (AUDIT a11y 12). Logged as GAPS §1: `MpMenuItem` should own this. |
| P12 | **`Preview` opens the page's preview** (`?preview=1` on the editor). | The source's `Preview Landing Page` anchor points at `/landing_pages/{id}` — byte-identical to the row's own name link. Preview does not preview (AUDIT D1). |
| P13 | **`Verify domain`, `Duplicate` and `Delete` all report their outcome** via a toast; Duplicate's carries an `Open copy` action. | None of the three gives any feedback in the source (all unverified there, but nothing in the DOM suggests a toast). |
| P14 | **Dates are ISO in the store and formatted in the view**, so `Publish At` / `Expire At` / `Updated At` sort correctly and unset dates render `—` with an `sr-only` "Not scheduled" / "No expiry". | The store previously held pre-formatted strings, which sort lexicographically by month name. |
| P15 | **Row height does not jitter**, because `Drag & Drop (Legacy)` no longer wraps. | Mixed lists in the source alternate 70px and 88px rows (AUDIT friction 11). |
| P16 | **The name cell is a real `RouterLink`.** | Middle-click and open-in-new-tab work; the source's is an anchor too, but the sandbox's previous version was a `<button>`. |

### Select Template — `LandingPageTemplates.vue`

| # | Improvement | Why |
|---|---|---|
| P17 | **Template names and category tags are persistent card content.** | The source's cards contain *no text at all* — the name exists only inside a hover scrim, so a keyboard user tabs through 17 stops a screen reader announces as nothing, and two cards can show their name at once because the scrim goes stale (AUDIT a11y 1, D13, D18). This is the single most serious defect in the flow. |
| P18 | **Every card is an `MpOptionCard`** — `role="button"`, `tabindex=0`, Enter/Space operable, with a visible focus ring. | The source's cards are bare `<div tabindex="0">` with no role, no label and no focus-visible style. |
| P19 | **Previews are a fixed 16:10 ratio**, drawn from tokens so they paint instantly. | The source's cards measure 300px to **1660px** tall in a five-column masonry, and every thumbnail re-downloads with no placeholder each time you return to the tab (AUDIT D20, D22). |
| P20 | **The tab is in the URL** (`?tab=mine`), and so are the library search and facets. | The source's tabs carry `href="#library"` / `#mytemplate` and never write them, so the tab is not deep-linkable and Back does not undo a switch (AUDIT D21). |
| P21 | **All four facet groups are visible at once** in one `MpDataTableToolbar` filter drawer, each option carrying its count, with `Clear all`. | The source's accordions are mutually exclusive, so `USAGE` collapses the instant `INDUSTRY` opens and two groups can never be seen together (AUDIT friction 6). |
| P22 | **The OR semantics are stated in the drawer.** | The source combines facets with OR — ticking two categories *widens* the result — and says nothing, which reads as a bug. Behaviour kept, explanation added. |
| P23 | **A result count and a zero-result empty state.** | The source shows neither (AUDIT friction 9, 10). |
| P24 | **`Clear all` is a real button.** | The source's is a `<span class="button disabled-cursor">` — not focusable, not announced (AUDIT a11y 4). |
| P25 | **MY TEMPLATES gets search, a folder filter, and rows that can be managed** — `Create new page`, `Move to folder…`, `Delete`. | The source's only row action is `Create New Page`, and it is `tabindex="-1"` with no role, so the row's one action is keyboard-unreachable. A merchant cannot rename, move or delete a template they saved (AUDIT a11y 5, friction 13). |
| P26 | **The first cell is not a pair of empty rectangles.** | The source renders the list page's grip/checkbox slot as two blank white boxes (AUDIT D17). |
| P27 | **Tabs switch cleanly.** | In the source the outgoing pane keeps painting over the incoming one for several seconds, clamped to a 179px window (AUDIT D15, D16). |

### Select Builder — `LandingPageBuilderChooser.vue`

| # | Improvement | Why |
|---|---|---|
| P28 | **Both builder options are real, focusable, keyboard-operable `MpOptionCard`s with text labels.** | The source's are `<div>`s whose only content is a PNG background-image: no role, no tabindex, no aria-label, no alt, no text. A full interactive read of the page returns only two breadcrumb links and `BACK` — a keyboard user cannot choose a builder at all (AUDIT D23, D24). |
| P29 | **Each option explains what it is for.** | The source has zero explanatory copy: two illustrations, no descriptions, no recommendation (AUDIT friction 2). |
| P30 | **`Drag & Drop (Legacy)` is named and its status stated.** | A third of the pages in the list use it, and the picker never mentions it exists or that it is being retired (AUDIT friction 3). |
| P31 | **Picking a builder selects; a `Create page` button commits.** | In the source clicking a picture *is* the commit — no confirmation, no `Continue`, no way to change your mind (AUDIT friction 5). |
| P32 | **`MpWizardSteps` shows "Select template → Select builder".** | The flow has three breadcrumb levels and no step indicator (AUDIT friction 5). |
| P33 | **The choice group is a labelled `role="group"`** via `MpFormField`. | The source's subtitle is not programmatically associated with the choice, and there is no radiogroup/fieldset semantics for what is a two-option single choice (AUDIT a11y 6). |
| P34 | **Direct arrival with no template is handled**, and says so ("Starting from a blank page."). | The source renders the picker unguarded and says nothing about the missing template context (AUDIT friction 8). |
| P35 | **One back affordance** — `MpPageHeader`'s `backTo`, plus a `Back` button beside the commit on the builder step. | The source has a breadcrumb *and* a `BACK` button below the content; on the Library tab that button sits thousands of pixels down the page (AUDIT friction 11). |

### 🔤 Copy changes — Landing Pages

| # | Before (source) | After | Why |
|---|---|---|---|
| PC1 | `NEW PAGE` | **`New page`** | Sentence case, matching the sandbox. |
| PC2 | `Landing Pages` (H2, no subtitle) | `Landing Pages` (H1) + *"Standalone pages on your own domain that capture sign-ups from campaigns, ads and social posts"* | The page never says what a landing page is or why domain status matters. |
| PC3 | `Verify Domain` | **`Verify domain`** | Sentence case. |
| PC4 | `Preview Landing Page` | **`Preview`** | The menu is already scoped to the row; "Landing Page" is noise repeated four times. |
| PC5 | `Duplicate Landing Page` | **`Duplicate`** | Same. |
| PC6 | `Delete Landing Page Permanently` | **`Delete`**, plus a confirm reading *"The page and its published URL go away immediately. Anyone who follows a link to it will get a 404."* | "Permanently" in a menu label is a warning in the wrong place — it belongs where the decision is made. |
| PC7 | *(none)* | Tooltip on a disabled Verify domain: **`Already verified — nothing to check.`** | The source disables it silently. |
| PC8 | `No data available` | **`No landing pages match your filters`** / **`No landing pages yet`**, each with a description and a recovery action | The default gives no reason and no route out. |
| PC9 | `Select Template` (H2) | **`Select template`** (H1) + *"Pick a starting point for your new landing page — you choose the builder next"* | Sentence case; the subtitle tells you there is a second step. |
| PC10 | `START DESIGNING` (Library) **and** `START FROM SCRATCH` (My Templates) | one **`Start from scratch`** in the page header on both tabs | Two labels, two sizes and two positions for one action. |
| PC11 | `LIBRARY` / `MY TEMPLATES` | **`Library`** / **`My templates`** | Sentence case; the uppercase was CSS over title-case DOM text anyway. |
| PC12 | `Categories` + `Clear All` | **`Categories`** / *"Filters apply as you tick them"* / **`Clear all`** | Sentence case, and the drawer says when filtering happens. |
| PC13 | `Newsletter` `Events` `Product-Promotion` `Service-Promotion` `Dark-Mode-Optimized` | `Newsletter` · `Events` · **`Product promotion`** · **`Service promotion`** · **`Dark-mode optimised`** | The source's labels are raw database slugs rendered through `text-transform: capitalize` (AUDIT D19). |
| PC14 | `E-Commerce` `Beauty-Cosmetics` `Computer-Internet` `Home_garden` `Financial-Money` `Pets-And-Animal-Care` `Small-Business` | **`E-commerce`** · **`Beauty & cosmetics`** · **`Computer & internet`** · **`Home & garden`** · **`Financial services`** · **`Pets & animal care`** · **`Small business`** | Same. `Home_garden` in particular is a database value that escaped into the UI. |
| PC15 | *(none)* | *"Templates matching **any** ticked category are shown. Ticking more categories widens the results rather than narrowing them."* | Makes the OR behaviour legible instead of looking broken. |
| PC16 | `Blank Template` / `Start from scratch` / `START DESIGNING` | **`Blank template`** / *"Start from scratch on an empty page."* | Sentence case; the description replaces a broken-image glyph as the card's explanation. |
| PC17 | `Create New Page` (My Templates kebab) | **`Create new page`** | Sentence case. |
| PC18 | `Create New Landing Page` (H4) | **`Create new landing page`** (H1) | Sentence case, and a real heading level — the source's H4 has no H1/H2/H3 above it (AUDIT D26). |
| PC19 | `Select builder type for your new landing page.` | *"Choose the builder for this page. You can't switch builders afterwards, so pick the one that fits how you work."* | The original restates the page title. The replacement says the choice is one-way. |
| PC20 | *(none)* | `Drag & Drop` — *"Assemble the page from blocks — headings, images, buttons and forms. No code, and it stays responsive on its own."* · `WYSIWYG` — *"Edit one rich-text canvas with full HTML access. Best when you are pasting in markup you already have."* | The source explains nothing about either option. |
| PC21 | *(none)* | *"Older pages in your account show **Drag & Drop (Legacy)**. That builder is being retired and can't be chosen for a new page — recreate those pages in Drag & Drop when you next edit them."* | The third editor type is invisible on this screen despite appearing throughout the list. |
| PC22 | `BACK` | **`Back`** | Sentence case. |

### Deliberate behaviour changes — Landing Pages

| # | Change | Note |
|---|---|---|
| PB1 | **No `Details` step between template and builder.** The page is created with the template's name and an empty URL, both editable in the editor, which already blocks publishing until the URL is valid. | The sandbox's previous `LandingPageTemplates.vue` collected name / URL / schedule before creating. UAT collects nothing before the editor, and the locked decision is to match UAT. |
| PB2 | **Template picks route to Select Builder, not straight to the editor.** | UAT's flow map is `template → /landing_pages/create → builder → editor`. Routing a template pick past the builder step would leave `/landing_pages/create` reachable only by typing the URL. |
| PB3 | **No drag-to-reorder and no drag-a-row-onto-a-folder.** Move-to-folder is an explicit dialog. | Both are unverified in the source, mouse-only, and unreachable by keyboard. |
| PB4 | **`Domain / URL` and a derived `Status` column were dropped** from the sandbox's version of the list. | Neither exists in UAT; the locked decision removes invented columns. Domain verification is still the `Domain Status` column, and publish state still lives in the editor. |

## Design-system fixes made along the way

| # | Fix | Why |
|---|---|---|
| D1 | **`MpFormField` no longer sets `aria-required` on `role="group"`.** Required-ness now reaches screen readers through the accessible name. | ARIA does not allow `aria-required` on `role="group"`; it was a WCAG 4.1.2 failure inherited by every consumer of the component. Caught by axe on the form builder. |
| D2 | **`useFolders` gained an ownership + privacy model** (`owner`, `privacy`, `canDelete`, `canSetPrivacy`, `setPrivacy`) and a 36-character name cap. | The source's folder panel gates Privacy / Rename / Delete per folder owner, and the store had no way to express that. |
| D3 | **`MpStatusChip`'s `general` map gained `verified` → success and `unverified` → warning.** | The Landing Pages list needs the green/amber Domain Status pill the source renders; both values previously fell through to neutral grey. Two keys in the existing extension point — no new `type`. |
