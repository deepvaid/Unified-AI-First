# IMPROVEMENTS

Every UX/UI change made during the rebuild, with the reason. Scope was limited to visual hierarchy,
labels/microcopy, interaction feedback, accessibility and responsive behaviour — no new features.

**Copy changes are marked 🔤 and need your sign-off.**

---

## New Contact

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| 1 | **Sticky footer** holding Cancel / Save | The source's footer sat below ~2,600 px of custom fields; saving meant scrolling the entire wall (audit F6) |
| 2 | **Custom-field defaults are no longer pre-filled**, and only fields the operator actually typed into are saved | The source ships pre-populated values (`ADAAD`, `0`, a *checked* boolean) that save silently for anyone who never scrolls there (audit F2). Same fields, same order, same types — different default. **This is the one behavioural change in this page; flagging it explicitly** |
| 3 | **Removed the nested scroll region** around custom fields | The source put a fixed-height inner scrollbar inside an already-scrolling page — a scroll trap (audit F1). Per your Phase-2 decision all fields stay visible; only the container changed |
| 4 | **Standing "email or phone required" notice moved out of a floating dismissible banner** into the page subtitle, the section description and the footer hint | The source's banner overlapped the breadcrumb and page title, and dismissing it made the page's central rule invisible (audit F3, A9) |
| 5 | Field-count moved from the card title to the search hint (`42 of 42 fields`) | The source's title count was the *filtered* count but read as a total — "Custom Fields (5)" after a search looks like the account has 5 fields (audit F12) |
| 6 | **Display Name used as the visible label**, falling back to the raw field name | The source collects Display Name in the create-field drawer but renders the raw database identifier (`fashion50_credit_blocked`) (audit F8) |

### Interaction feedback

| # | Change | Rationale |
|---|---|---|
| 7 | **Unsaved-changes guard** (`useDirtyLeaveGuard` + `MpConfirmDialog`) | The source discards a filled 110-field form silently on Cancel or a nav click (audit F7) |
| 8 | **Search-miss renders `MpEmptyState`** with a Clear-search action | The source shows a bare grey "No field available" with no recovery path (audit A10) |
| 9 | **Success state**: toast + redirect to the contacts list | The source's was never observed (SAVE writes a real record). Follows the sandbox convention set by `CreateTransactional.vue`, per your Phase-2 decision |
| 10 | Save button shows a loading state | No feedback in the source between click and outcome |

### Accessibility

| # | Change | Rationale |
|---|---|---|
| 11 | **`<h1>` added; the four section titles are now real `<h2>`s** via `MpFormSection` | The source had no `h1`, and all four section titles were styled `div`/`span` — one heading for a 4-section, 110-field form (audit A1, A2) |
| 12 | **Email is `type="email"`, phone is `type="tel"`**, both with `inputmode` and `autocomplete` | The source used `type="text"` for both — no mobile keyboard hint, no autofill (audit A4) |
| 13 | **Validation messages are programmatically associated** via Vuetify `error-messages` | The source's `Invalid Email.` had no `aria-invalid`, no `aria-describedby`, no `aria-required` (audit A3) |
| 14 | Phone hint wired via `aria-describedby` | Not associated in the source (audit A5) |
| 15 | **Every disabled control now says what unlocks it** | The source greys out three controls with no explanation (audit A6, F4) |
| 16 | **Hover-only tooltips replaced with always-visible text** | The Journey-toggle rules were three paragraphs reachable only by mouse hover (audit A7) |
| 17 | Checkbox groups wrapped in `role="group"` + `aria-labelledby` | Caught by axe during the build: `aria-labelledby` on a bare `div` is a prohibited attribute |

### Responsive

| # | Change | Rationale |
|---|---|---|
| 18 | Page works at 375 px | The source is **completely broken** below ~900 px: sidebar holds full width, content collapses to a sliver, headings wrap one character per line (audit F9) |
| 19 | Footer hint gets its own line below 640 px | Otherwise it crushed into a one-word-per-line column beside the buttons |

### 🔤 Copy changes — New Contact

| # | Before (source) | After | Why |
|---|---|---|---|
| C1 | `Invalid Email.` | `Enter a valid email address, for example name@company.com` | Names the fix, not just the fault |
| C2 | `Please include country code with Phone Number` | `Include the country code.` | Shorter; the field already says "Phone number" |
| C3 | `Select List Name and Opt In Statuses` | `Add an email address or phone number above to subscribe this contact to a list.` → (once unlocked) `Choosing a list opts this contact in to every channel you have a value for. Uncheck any you do not have consent for.` | The original describes the widgets; the replacement explains the gate and discloses the auto-opt-in — a consent decision the source makes silently (audit F5) |
| C4 | `Select Tags for New Contact` | `Tags group contacts for segments and campaign targeting.` | The original restates the label; the replacement says what tags are for (audit F11) |
| C5 | `Select Custom Fields for New Contact` | `Optional. Only the fields you fill in are saved to this contact.` | The original says "select" but the UI fills values (audit F11) |
| C6 | `No field available` | `No matching fields` + `Nothing matches "…". Try a different search, or add a new custom field.` | Says why the list is empty and what to do |
| C7 | Journey tooltip, 3 paragraphs incl. the malformed `NOTE:This option does not apply to any other journey trigger. added to the list will enter those journeys…` | `When on, contacts added to the list above enter any journey whose New Subscription trigger uses that list. This does not affect other journey triggers.` | The source's third paragraph has a dropped clause and is ungrammatical. Condensed to two sentences |
| C8 | `New Contact` | `New contact` | Sentence case, matching the sandbox |

---

## New Custom Report

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| 1 | **Step count shown on each chooser card** (`3 steps` / `2 steps`) | The source gives no hint that some flows are 2 steps and others 3 — a big commitment made to feel small (audit G1) |
| 2 | **`Preview of selections` moved directly under the filters** it describes, and given a live match count | The source buries it at the very bottom of the longest step, far from the controls (audit G6). It is the single best idea on the page |
| 3 | **Step 2 no longer opens in an error state** | The source defaults to all campaign types, which exceeds the 500 cap, so every user is greeted by a red banner and a dead Continue before touching anything (audit G2). The cap is still enforced — it just fires when actually exceeded |
| 4 | **`All Campaign Types` removed as a selectable value** | It was both a value and a select-all, and it was the default that triggered #3 (audit G4). An empty selection now means "not chosen yet", which the summary states plainly |
| 5 | **Three stacked explanations collapsed into one** | The source stacks a red banner, a grey helper panel and a body paragraph all describing the same selection rules (audit G5) |
| 6 | **OR/AND control appears at 2 tags** instead of sitting permanently disabled | Progressive disclosure; a permanently greyed control with no reason is a dead end (audit G7, B7) |
| 7 | **Optional-fields button stays a labelled button** when fields are selected | The source swaps it for a bare pencil icon with no accessible name (audit B9) |
| 8 | **Dropped the full-bleed cyan brand canvas** on the chooser | It looks like a different product from every other screen (audit G13). See GAPS.md |

### Interaction feedback

| # | Change | Rationale |
|---|---|---|
| 9 | **Zero-match warning** — "this report would come back empty" | The source lets you build a report matching nothing with no feedback at all |
| 10 | **Picker drawers gained Cancel / Apply** | The source binds live with no way to back out of an exploratory selection (audit G10) |
| 11 | **Deep-linking a wizard slug now works** | The source renders the breadcrumb and stepper but **no step content** on a cold load — a permanently blank wizard (audit §4b) |
| 12 | **Unknown slug renders `MpErrorState`** with a route back | The source shows a full-page 404 (audit §4b) |
| 13 | **Unsaved-changes guard** | The source has none (audit G15) |
| 14 | From-date-after-To-date validation | The source has none |
| 15 | Completed steps are clickable in the stepper | The source's stepper is passive; going back is Back-only (audit G7) |
| 16 | **Success state**: toast + redirect | Never observed on UAT; sandbox convention, per your Phase-2 decision |

### Accessibility

| # | Change | Rationale |
|---|---|---|
| 17 | **`<h1>` added; heading order is now h1 → h2 with no skips** | The source jumps `H2` → `H4` with no `h1` at all (audit B1) |
| 18 | **Stepper carries `aria-current="step"`** and visible step labels | The source conveys progress by colour and a ✓ glyph alone (audit B2) |
| 19 | **Live summary given `role="status"` / `aria-live="polite"`** | It updated silently in the source (audit B5) |
| 20 | Error and warning alerts use semantic `v-alert` types | The source's cap banner has no `role="alert"` and no association with the field it constrains (audit B3) |
| 21 | **Chooser cards are keyboard-operable** and selection is separate from navigation | The source's cards navigate immediately on click with no radio semantics (audit B4) |
| 22 | Hover-only tooltips replaced with visible section descriptions and field hints | Load-bearing rules were mouse-only (audit B8) |
| 23 | Checkbox/chip groups wrapped in `role="group"` | Same axe finding as the contact page |

### Responsive

| # | Change | Rationale |
|---|---|---|
| 24 | Verified at 375 px; footer wraps, card inset tightens below 640 px | The wizard footer overflowed its card at 375 px in the first cut |

### 🔤 Copy changes — New Custom Report

| # | Before (source) | After | Why |
|---|---|---|---|
| C9 | `Enter details for whom the report will be sent too.` | `Optional. Leave blank to download the report from the reports list instead.` / `A recurring report has to be emailed to someone.` | **Fixes the shipped typo** ("too" → "to") and states the actual rule, which changes with schedule mode (audit G8) |
| C10 | `Please select optional metrics based on which you want to create all report.` | `Add extra fields for more detail. Everything here is optional.` | **Fixes the shipped grammar error** ("create all report") (audit G8) |
| C11 | `Enter the details of your report ISPs/Metrics.` shown on the **Email campaign** flow | Per-type description; ISPs are mentioned only on Deliverability | The source shows ISP copy where ISPs do not apply (audit G8) |
| C12 | `Report Type` (meaning file format) | `File format` | The source uses "report type" for both the chooser types *and* the export format — two meanings, one label, two screens apart (audit G9) |
| C13 | `Mandatory Fields` / `Optional Fields` | `Always included` / `Optional` | Plainer; the tooltip explaining "mandatory" becomes unnecessary |
| C14 | `OR` / `AND` radio labels | `Any of these tags` / `All of these tags` | Boolean operators as UI labels assume the reader thinks in SQL |
| C15 | `Only campaigns sent inside this range are available to select on the next step.` | Same on campaign/SMS types; `The report covers activity inside this range.` elsewhere | The original is only true where a campaign picker follows |
| C16 | `A maximum of 500 email campaigns only may be selected` / `Please refine your selections.` | `N campaigns match — a report can cover at most 500. Narrow the date range or the filters above.` | Says how far over you are and what to do |
| C17 | `SUBMIT` | `Create report` | Names the outcome |
| C18 | Card titles `Email Campaign`, `SMS Campaign`, … | Sentence case | Sandbox convention |

---

---

## Custom Reports (list)

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| 1 | **Record count and a removable active-filter chip** in the toolbar | The source shows the filter's effect only in the pagination range at the bottom of the table; nothing near the controls says a filter is on |
| 2 | **Delete separated by a divider and rendered in the error colour** | The source stacks Delete directly under Download with no separation or emphasis — one slip between adjacent items is unrecoverable (audit F10) |
| 3 | **Overlays render opaque** | Every menu in the source (type filter, row actions, rows-per-page) is semi-transparent, so table text shows through the options (audit F8, A8) |
| 4 | **Filter menu closes on selection** | The source's stays open, covering the results it just changed (audit F7) |

### Interaction feedback

| # | Change | Rationale |
|---|---|---|
| 5 | **Search by name** | 210 reports with a type filter as the only narrowing tool means paging through 21 pages to find one (audit F2). Your Phase-2 decision; it is the one feature not in the source |
| 6 | **`MpTableSkeleton` on first load** | The source shows a single `Loading... Please wait` table cell |
| 7 | **Two distinct empty states** — filtered-to-zero (with Clear filters) and no-reports-at-all (with New report) | Neither is reachable in the source, so neither could be observed; both are required states for a list view |
| 8 | **Delete confirmation dialog** naming the report and its consequences | The source's behaviour is unverified. Destructive-action convention in this sandbox |
| 9 | **Toasts on duplicate, download and delete** | The source gives no confirmation that any of the three did anything |

### Accessibility

| # | Change | Rationale |
|---|---|---|
| 10 | **Row-action kebabs have accessible names** (`Report actions for <name>`) via `MpRowActionsMenu` | The source ships ten identical unnamed buttons — a screen reader announces "button" ten times with nothing to distinguish them (audit A1) |
| 11 | **The type filter has a visible label** (`Report type`) | The source's filter has no `<label>` and no `aria-label`; its only clue is the current value (audit A2) |
| 12 | **No leaked i18n keys.** The rows-per-page control is properly labelled | The source exposes the raw string `$vuetify.dataTable.itemsPerPageText` as an accessible name — a shipped bug read aloud verbatim (audit A3) |
| 13 | **`<h1>` added** | The source's visible title is a styled `<span>` (audit A4) |
| 14 | **`aria-sort` tracks the active sort** | Vuetify 3 emits none, so sort state is conveyed by an icon alone — the same gap the source has (audit A5). Mirrored by a local watcher; belongs upstream, see GAPS.md §6 |
| 15 | **Table scrolls inside its own container** at narrow widths, so the page body never scrolls horizontally | |

### 🔤 Copy changes — Custom Reports (list)

| # | Before (source) | After | Why |
|---|---|---|---|
| C19 | *(no subtitle)* | `Saved report exports for this account.` | Says what the page is. The source's title stands alone, and "Custom Reports" does not convey that every one of these is a scheduled file export |
| C20 | `NEW REPORT` | `New report` | Sentence case, matching the sandbox |
| C21 | `Updated At` | `Updated at` | Sentence case |
| C22 | `Duplicate Report` / `Download Report` / `Delete Report` | `Duplicate report` / `Download report` / `Delete report` | Sentence case |
| C23 | `Rows per page:` | `Items per page:` | Vuetify 3's default string; not worth overriding |
| C24 | — | `No reports match your filters` / `No custom reports yet` | New empty states |

> **Not changed, deliberately:** the `Status` column keeps its name even though its values
> (`Scheduled` / `Recurring`) are the schedule mode, not an execution state (audit F3). Your
> Phase-2 decision was to match UAT exactly. Renaming it to `Schedule` would be a one-word fix
> that makes the column mean what it says — **worth considering upstream.**

## New List

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| L1 | **The untitled first block became two titled cards** — `List details` and `Manage Subscription page` | Seven fields, including the list's entire public presentation, floated above two titled cards with no heading and no border. The page read as if it started mid-thought (audit F1) |
| L2 | **Grouped the Manage-Subscription fields together** | Display Name, Description, Post URL and the toggle itself all exist to serve one page, but the relationship was visible only in hover tooltips (audit F3). Structure now carries it |
| L3 | **Sticky footer** | The form runs past a viewport once Carts is included (audit F9) |
| L4 | **`Email Campaign Fields` → `Sender identity`** 🔤 | The card *is* the sender identity; the old title described where the values are used, not what they are |
| L5 | **`Carts` → `Cart integrations`** 🔤 | "Carts" alone reads as a list of shopping carts |

### Labels & microcopy

| # | Change | Rationale |
|---|---|---|
| L6 | **`Add to Manage Subscription Page` → `Show this list to contacts`** 🔤 | Inside a card already titled "Manage Subscription page", the old label repeated its container. The new one says what the toggle does |
| L7 | **List Type cased consistently** as `Normal` / `Suppressed` 🔤 | The source shows `Normal` closed and lowercase `normal` open — two casings for one value (audit F4) |
| L8 | **All four tooltips became always-visible field hints** 🔤 (wording preserved, lightly tightened) | Hover-only, on unnamed icons, and rendered ~45 px away from their trigger (audit A7, F12) |
| L9 | **Subtitle rewritten** to "A list groups contacts and carries the sender identity used when you email them." 🔤 | The source's "Enter details for New List" restates the page title |
| L10 | **`Item / Product / LDS` kept verbatim, with no hint added** | "LDS" is undefined anywhere in the source and inventing a meaning would be worse than leaving it. **Needs a subject-matter answer** — see PARITY open items |

### Interaction feedback

| # | Change | Rationale |
|---|---|---|
| L11 | **`Address *` now gates Save** | The asterisk meant two different things: List Name blocked Save, Address did not (audit F2) |
| L12 | **The disabled Save states its reason** in the footer | The source disables it silently |
| L13 | **Cart fields are disabled until their cart is selected** | The source leaves them editable with no indication whether the value is kept (audit F7) |
| L14 | **Unsaved-changes guard** on Cancel and navigation | The source discards everything silently (audit F10) |
| L15 | **`Description` and `Address` became textareas** | Both were single-line; a public-facing description and a long postal address each truncated out of view (audit F5, F6) |

### Accessibility

| # | Change | Rationale |
|---|---|---|
| L16 | One `h1`, section titles as `h2` | The source's only heading is an `h4` (audit A1, A2, A4) |
| L17 | Hints associated via `aria-describedby` (Vuetify wiring) | The source's are loose text (audit A5) |
| L18 | `type="email"` / `type="url"` on the sender and webhook fields | All were `type="text"` (audit A8) |
| L19 | Each cart pair wrapped in `role="group"` with an accessible name | Their pairing was visual only (audit A10) |

---

## Import Contacts

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| I1 | **`MpDialog` replaced the sandbox's drawer** | The source is a centred modal; `MpDialog` is the design system's one modal shell |
| I2 | **`MpWizardSteps` added** | `CONTINUE` implies more steps but nothing said how many or what they were (audit F5) |
| I3 | **The Automated jobs table is seeded non-empty** | The source account's is empty — the worst case to design against |

### Labels & microcopy

| # | Change | Rationale |
|---|---|---|
| I4 | **File constraints merged into one associated hint** 🔤 | The source splits formats, the zip rule and the 128 MB cap across three separate lines, and drops them entirely on the FTP branch (audit F4) |
| I5 | **Sentence case throughout** (`File import`, not `File Import`) 🔤 | House convention |
| I6 | **`Import` → `Start import`** on the final step 🔤 | Names the outcome at the point of commitment |

### Interaction feedback

| # | Change | Rationale |
|---|---|---|
| I7 | **The disabled Continue states its reason** | The source disables it silently (audit A6) |
| I8 | **The chosen filename is shown** after picking | The source shows nothing until Continue |
| I9 | **`Select file` loses its asterisk on the Automated branch** | Matches the source, where the same label is required in two branches and optional in the third — kept, but the label itself now changes too rather than only a parenthetical (audit F3) |

### Accessibility

| # | Change | Rationale |
|---|---|---|
| I10 | **Every radio carries its own label**, and each group has a group name | In the source all three Import Method radios report `File Import` and all four Delimiter radios report `Comma` — only the first option in each group is labelled. **This was the single worst finding in the crawl** (audit A1) |
| I11 | The file input is labelled | The source's has none at all (audit A2) |

---

## Custom Fields

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| F1 | **Tabs carry counts** and the ET note appears once, on the tab where datetime fields can exist | The source repeats the note on both tabs, including the one where no datetime field is possible (audit F10) |
| F2 | **`Add field` shows only on the Custom tab** | The source reuses one button for `Add Field` and `Edit Default Field`, relabelled by tab and detached from the masthead (audit F12) |
| F3 | **One page name** | The source calls it `My Fields`, `Fields`, `Custom fields` and `custom_fields` on one screen (audit F13) |

### Interaction feedback

| # | Change | Rationale |
|---|---|---|
| F4 | **Search added** | 108 fields, no search, 11 pages of scanning to check for a duplicate. The source component even carries an unused `searchString` (audit F1 — highest-value gap on the page) |
| F5 | **Save is gated** on a valid name and default value | The source's Save is never disabled — pressable on an empty required field and on invalid input (audit F6) |
| F6 | **Float is validated** | The source validates Integer only; its own data has a float field defaulting to `"ADAAD"` (audit F5) |
| F7 | **Renaming an existing field warns** about downstream references | The source lets you rename a live machine key silently (audit F9) |
| F8 | **Duplicate names are rejected** | No client rule existed |
| F9 | **Cancel added** to the drawer | It had only `SAVE` (audit F7) |
| F10 | **The delete dialog states consequences** and styles Delete as destructive | The source warns only "You cannot undo this action" with two identical plain buttons |
| F11 | **Empty state gained a CTA** | The source's is a bare `No data available` (audit — states table) |

### Labels & microcopy

| # | Change | Rationale |
|---|---|---|
| F12 | **`Add to the Edit Profile Page` → `Show on the Edit Profile page`** 🔤 | Describes the outcome; sentence case |
| F13 | **Type hint reworded** to "Choose carefully — the type can't be changed once the field is created." 🔤 | The source states the rule but not that it is a decision to make now (audit F8) |
| F14 | **`Description` became a textarea** | Single-line in the source |

---

## New Segment

### Correctness

| # | Change | Rationale |
|---|---|---|
| S1 | **Add-criterion works after confirming a criterion** | In the source it increments the counter and adds no row, and Save stays disabled — **multi-criteria segments cannot be built at all** (audit F3). The most serious defect found anywhere in this crawl |
| S2 | **The AI preview always resolves** | The source's spins indefinitely with no result, error or timeout (audit F2) |
| S3 | **`Optional filters` no longer shows a required error** | Directly self-contradictory in the source (audit F7) |
| S4 | **The criteria counter is accurate** | The source reads `1/100` on an empty segment (audit F10) |

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| S5 | **The AI panel opens on request, not on arrival** | The source opens it over the builder on every load, scrim and all, before the user has expressed any intent (audit F1) |
| S6 | **Rules have real headings and a delete control** | `Rule 1` is a `<span>`, and the only way to remove a rule is to empty it one criterion at a time (audit A2, F16) |
| S7 | **A rule with no criteria keeps an empty state** instead of vanishing | The source silently deletes the whole rule when its last criterion goes |
| S8 | **Confirmed criteria collapse to a plain-language summary** | Matches the source's chip collapse, but reads as a sentence |

### Labels & microcopy

| # | Change | Rationale |
|---|---|---|
| S9 | **The match-logic switch states its current mode** — `Match ALL rules (AND)` / `Match ANY rule (OR)` 🔤 | The source's label reads `AND (Match all)` whether on or off, so with one rule nothing tells you the segment became OR (audit F4) |
| S10 | **Chooser tile descriptions rewritten** to say what each builder is *for*, with Next-Gen marked recommended 🔤 | The source describes mechanism and gives no steer on which to pick |
| S11 | **Range inputs labelled `From` / `To`** 🔤 | The source's have no label, no `aria-label` and no placeholder (audit A7) |
| S12 | **One canned AI prompt's typo fixed** 🔤 | Source ships "Contacts who have received atleast 5 emails on the month of May" |
| S13 | **The "alphanumeric" hint was dropped, not kept** 🔤 | The source promises "letters and numbers" then accepts `!!!@@@`. Enforcing it would reject `@gmail.com`; an unenforced promise is worse than silence |

### Accessibility

| # | Change | Rationale |
|---|---|---|
| S14 | **Every control is keyboard operable** | In the source, add-criterion, add-rule, build-with-AI, confirm, edit, delete, the AND/OR connector and drag handles are all `<span>`/`<div>` with no role or tabindex — a keyboard user can set the first cascade and then cannot add, confirm, delete or save (audit A3, A4, A11) |
| S15 | **AND/OR is a stable `v-btn-toggle`** | The source's chips reorder on click, so the chip under the cursor changes meaning (audit F5), and the unselected chip measured **1.3:1** contrast against its background (audit A6) |
| S16 | **The chooser tiles are real links** | The source's are focusable but Enter does nothing, and their titles are dead `<a href="#">` (audit A2, A3) |
| S17 | **The `New!` badge is text, not an image** | The status never reached assistive tech (audit A6) |
| S18 | **The field picker is searchable** | 60+ lazy-loaded options, several rendering identically truncated (audit F8) |

---

## Things deliberately **not** changed

| Item | Why it was left alone |
|---|---|
| All 42 custom fields render at once on New Contact | Your Phase-2 decision — container fixed, behaviour untouched |
| Selecting a list auto-checks eligible opt-in channels | Real behaviour with compliance implications (audit F5). Preserved exactly; the rebuild only *discloses* it. **Worth a product decision** |
| Picker drawer regroups Selected/Unselected on every click, shifting rows under the cursor | Matches the source. Mildly annoying, but changing it would change the drawer's information architecture |
| `Breakup report by days` collects a flag with no visible effect | Its effect was not observable on UAT either |
| **No way to open or edit a saved report** on the Custom Reports list | Matches the source exactly (audit F1). This is the one place parity costs real capability — the previous sandbox page could edit a report and this cannot. **Worth deciding whether the source's limitation is one to keep** |
| `Status` column name on the Custom Reports list | Your Phase-2 decision: match UAT. The values are schedule modes, not statuses |
| Default page size of 10 against 42 rows | Matches the source, despite audit F11 suggesting 25 would suit the volume |
| No bulk selection or bulk delete on the reports list | The source has none (audit F9), and adding it would be a new feature |
| The pre-existing quick-add Contact drawer on `AllContacts.vue` | Out of scope. The page's primary CTA now routes to the new full page (matching UAT); the drawer is still reachable from the table's empty state. **You may want to retire one of the two** |
| Delimiter is asked before the file exists, on every import branch | Fixing it properly means auto-detecting the delimiter from the uploaded file — a new feature. Recorded as audit friction F2 |
| No bulk selection on Custom Fields | The source has none, and adding it would be a new feature |
| No usage counts on Custom Fields ("used by N contacts", "referenced in N segments") | The audit flags their absence (F16) but the data does not exist in the sandbox, and inventing it would be speculative |
| `String` vs `Text` left undocumented on Custom Fields | The source never explains the difference (audit F4); guessing would be worse than silence. **Needs a subject-matter answer** |
| Drag-to-reorder rules and criteria on the segment builder | The source's is mouse-only with no keyboard equivalent (audit A9). Rebuilding it as-is would reintroduce an accessibility failure, and a keyboard-accessible reorder is a design question rather than a parity one |
| No contact-count preview on the segment builder | The source has none either (audit F12). Real capability, but a new feature |
| SQL is authored in a plain textarea | Matches the source. Flagged as GAPS §10 because it is the highest-risk surface audited — `Overwrite` truncates a target table |

## Products / Commerce slice (2026-08-29)

Covers Product Recommendations, Products, Price Lists, Collections and Inventory Reservations.

### Visual hierarchy & layout

| # | Change | Rationale |
|---|---|---|
| 1 | Every table sits under the standard `MpDataTableToolbar` (title, record count, pill search, Filter drawer, column toggle, filter chips) | The five UAT pages hand-roll three different toolbar layouts; one component keeps them consistent with the rest of the app |
| 2 | Bulk actions render in `MpFloatingBulkBar` instead of UAT's "Choose an action" select in the tab row | The select hides destructive Delete behind a neutral dropdown and vanishes mid-scroll; the bar keeps count, actions and Clear visible |
| 3 | UAT's Custom Views popover (ADD FILTER +) became saved-view tabs (`MpFilterTabs`) fed by the filter drawer's "Save as view" | Two overlapping surfaces (popover + drawer) collapsed into the tab idiom the app already uses |
| 4 | Recommendations page: per-tab primary CTA moved into the page header | UAT floats each CTA inside the tab body at a different position per tab |
| 5 | Collections list shows the first rule inline under automated titles | Replaces UAT's unexplained funnel icon |
| 6 | Reservation dialog keeps UAT's progressive disclosure but explains it ("Choose an item and a location to see stock levels…") | UAT's form simply grows with no cue |
| 7 | Product edit page: SEO fields grouped under a live listing preview, matching the product editor's own preview card | UAT renders the preview above unrelated fields with no connection |

### Interaction feedback & states

| # | Change | Rationale |
|---|---|---|
| 8 | Unsaved-changes guards on every drawer/editor, firing **only when dirty** | Legacy drawers discard silently; the modern app fires "cannot be undone" confirms even on pristine forms — both normalized (Phase-2 "fix defects") |
| 9 | Guard copy is "Discard changes?" with a danger action | UAT's CANCEL / CONFIRM pair on "Cancel Collection Creation" is a double negative |
| 10 | Save/Continue disabled until valid, inline errors on the offending field, success toasts everywhere | UAT save outcomes were unverifiable; the audit's validation behaviours are reproduced and extended |
| 11 | Export default filename fixed (`Product_Export_2026-08-29`) | UAT emits `Product_Export_2026-55-28` — minutes in the month slot |
| 12 | FTP import page titled "Import products (FTP)" | UAT keeps the "(CSV)" H1 on the FTP flow |
| 13 | Reservation quantity validated against Available, and deleting a hold returns stock | UAT accepts any number silently (bound unverified) |
| 14 | Price-list schedule validates end-after-start; percentage must be > 0 (decrease ≤ 100%) | UAT ships 0.00% as a valid default |
| 15 | Quick search added on Products (name/SKU), catalog, feeds, templates, collections, price lists, reservations | UAT's only narrowing tool on a 207k-row catalog is the Filters drawer 🔤 |

### Copy 🔤 (needs sign-off)

| # | Change |
|---|---|
| 16 | "Kitted Product: True/False" → "Include kits and products / Kits only / Exclude kits" |
| 17 | Collection operators: "Does Not Contains / Start With String / End With String" → "Does not contain / Starts with / Ends with" |
| 18 | "New Pricing Configuration" H1 → "New price list" (matches the CTA and breadcrumb) |
| 19 | Catalog banner reworded and now includes a live incomplete-product count |
| 20 | Legacy feed metrics (Bought Together, Similar Products, Trending) get a tooltip: kept on existing feeds, not creatable |
| 21 | Reservation item search explains its scope ("Only products with inventory tracking turned on can be reserved.") |
| 22 | Media hint "upto 20MB" → "up to 20 MB each" |

### Accessibility

| # | Change | Rationale |
|---|---|---|
| 23 | Every kebab menu is `MpRowActionsMenu` with `ariaLabel` + per-row `itemLabel` | UAT kebabs are unnamed icon buttons |
| 24 | Selection uses always-visible checkboxes | UAT reveals them only on pointer hover — invisible to keyboard/touch |
| 25 | Steppers, colour swatches, remove buttons and info tooltips carry explicit labels; tooltips are keyboard-focusable | UAT's are hover-only and unnamed |
| 26 | Composite controls (radio groups, toggles, checkbox groups, steppers) wired through `MpFormField`'s `labelId`/`descriptionId` | UAT labels them visually only |
| 27 | Order-number links get discernible text; manual holds say "Manual hold" instead of an empty cell | Screen-reader landmarks |

### Data corrections in mocks (flagged, not silent)

| # | Change |
|---|---|
| 28 | Reservation rows: description now matches the order number (UAT shows "#6" with "order #7") and duplicated variant titles de-duplicated |
| 29 | Collections list shows real product counts (UAT renders "--" on all 26 rows) |
| 30 | Price Lists seeded with three realistic configurations (UAT table is empty) per your Phase-2 decision |

---

## Pre-existing issues found but not touched

Noted rather than fixed, since they are outside the two audited pages:

- **The collapsed `AppSidebar` has 7 axe violations**, 4 of them critical: `aria-allowed-attr`,
  `aria-required-attr`, `aria-required-children`, `aria-required-parent` (nav items carry
  `role="option"` without a `listbox` parent), plus `aria-toggle-field-name`, `aria-tooltip-name`
  and one unnamed link (the App Store item). Surfaced when a full-document axe scan pulled in the
  shell. Worth its own ticket.

- **An app-wide Vue render error fires on every page:**
  `TypeError: Cannot destructure property 'labelId' of 'undefined' as it is undefined`, reported
  against `MpFormGrid.vue:22`.

  Confirmed **pre-existing and unrelated to this rebuild**: it reproduces after a hard reload on
  `/relational_tables` and `/campaigns`, neither of which this slice touched, and `git status`
  shows both files and every globally-mounted component unmodified. Nothing renders incorrectly —
  Vue logs it and recovers — which is probably why it has gone unnoticed.

  A full static scan of every `.vue` file found **no** `<template #default="{ labelId }">` whose
  parent is anything other than `MpFormField`, so the bad call is dynamic rather than written in a
  template — most likely a scoped slot invoked with no argument through a `v-menu` / `v-tooltip`
  activator chain. The reported line number is inside `MpFormGrid`'s type-only `defineSlots` block,
  which generates no runtime code, so the stack frame is misattributed and should not be trusted as
  the location. Needs its own ticket and a proper bisect.

- **`CustomReports.vue` throws** `tableEl.value?.querySelectorAll is not a function` from a watcher
  (three times on load). This one *is* in the previous session's uncommitted Analytics work, so it
  belongs to that slice rather than this one.
