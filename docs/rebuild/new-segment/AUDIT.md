# AUDIT — New Segment (builder chooser + Next-Gen builder)

**Sources:**
- `https://uat.maropost.com/accounts/116000/segments/types` — builder chooser
- `https://uat.maropost.com/accounts/116000/segments/next-gen` — Next-Gen builder

**Crawled:** 2026-08-28 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session · viewport 1568px
**Legacy stack:** a **Vuetify 3 shell** (`v-theme--maropost`) with the **legacy MMC app (Vuetify 2,
`theme--light`) mounted inside it**; assets resolve from `/legacymmc/…`. Both pages render Vuetify 2
markup in the main document (not iframed) — but the **legacy builder at `/segments/new` *is*
iframed** (`#legacyMainIframe`, `contentDocument` inaccessible), so its internals could not be
extracted. **Two `<main>` landmarks exist on every page** (`main.v-main` from the shell,
`main.v-content` from the legacy app).

> Crawl method: full read-only sweep — every category and its dependent selects opened and
> enumerated, operator sets captured per data type, the criterion lifecycle exercised
> (add → fill → confirm → collapse → edit → delete), Save gating tested by typing then clearing,
> and the AI drawer opened and driven up to but not including generation. **Nothing was saved.**
> A throwaway name and throwaway values were typed, then abandoned via Cancel.

---

# Part 1 — `/segments/types` (builder chooser)

## 1. Purpose

A one-step chooser asking which of two builders to use before creating a segment. Reached from
`/segments` → `NEW SEGMENT`. **Primary task:** pick Legacy or Next-Gen and land in that builder.

## 2. Layout and hierarchy

```
AppBar (shell)
├ Breadcrumb   "My Segments" (link) › "Segment Builder Selection" (current)
├ h4.display-1  "Create New Segment"          ← centred, ~40px
├ p             "Select the segment builder."
├ Two tiles side by side   v-card--outlined, tabindex=0
└ [CANCEL]      single centred outlined button → /accounts/116000/segments
```

**Heading tags used: `H4` only. There is no `<h1>`** — the document starts at h4.

## 3. Copy (verbatim)

| Element | Copy |
|---|---|
| Breadcrumb | `My Segments` › `Segment Builder Selection` |
| Heading | `Create New Segment` |
| Subtitle | `Select the segment builder.` |
| Tile 1 title | `Legacy Segment Builder` |
| Tile 1 description | `Create segments with multiple sets of rules.` |
| Tile 2 title | `Next-Gen Segment Builder` |
| Tile 2 description | `Create segments using Contact Attributes, with Standard Fields e.g. First Name, Email or Custom Fields.` |
| Tile 2 badge | `New!` — an **SVG image**, not a chip or text |
| Button | `CANCEL` |

Both tiles use the same `segment_builder.svg` illustration — dark grey at rest, magenta-and-blue on
hover/focus.

## 4. Interactions

- **Both tile titles are `<a href="#">` and do nothing on click.** Navigation is bound to the tile
  body / illustration only. Clicking the title text produced no navigation; clicking the
  illustration did.
- Legacy → `/accounts/116000/segments/new?folder_id=` (iframed legacy builder).
- Next-Gen → `/accounts/116000/segments/next-gen`.
- Hover/focus = 1px blue border + colour illustration. **There is no persistent selected state** —
  no class change, no `aria-selected`. The blue outline is just the focus ring.
- Cold load is **~13–18s**; the content column stays blank white for most of it, and tile
  illustrations lazy-load several seconds after the text.

## 5. Accessibility findings

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | High | **No `<h1>`; the page starts at `<h4>`.** `document.querySelectorAll('h1').length === 0`. | 1.3.1 / 2.4.6 |
| A2 | **Critical** | **Tiles are focusable but not operable by keyboard.** `tabindex="0"` is set but there is no `role="button"`/`role="radio"`, and pressing **Enter** on the focused Legacy tile did not navigate — verified: after `card.focus()` + `Enter`, `location.pathname` was unchanged. **A keyboard-only user cannot choose a builder.** | 2.1.1 |
| A3 | High | **Dead links in the accessible name** — both tile titles are `<a href="#">`, so a screen-reader user tabs to a link that goes nowhere. | 2.4.4 |
| A4 | Medium | **Two `<main>` landmarks.** Landmark scan returned `HEADER, MAIN, NAV, NAV, MAIN`. | 1.3.1 |
| A5 | Low | Illustration is decorative but unmarked — a CSS `background-image` with no `alt`, `role="img"` or `aria-hidden`. | 1.1.1 |
| A6 | Medium | **The "New!" badge is image-only** — the status is not exposed as text to assistive tech. | 1.1.1 |

## 6. UX friction

1. **The choice comes with no decision aid.** Both descriptions are feature blurbs; neither says
   which a merchant should pick, whether Legacy is deprecated, or what Next-Gen cannot do.
   "multiple sets of rules" vs "using Contact Attributes" describes mechanism, not outcome.
2. **The click target is inconsistent** — the title *looks* like the primary link and is inert.
3. **No Continue/Next affordance**; the only footer control is Cancel, so a one-step page reads
   like a two-step wizard.
4. **Enormous dead space** — tiles are ~250px wide in a ~1300px column.
5. **~15s cold load** with an unstyled blank area and no skeleton.

## 7. Data shape

```ts
type SegmentBuilderChoice = {
  id: 'legacy' | 'next-gen'
  title: string
  description: string
  icon: string            // segment_builder.svg
  badge?: 'New!'          // next-gen only
  to: string
}
```

---

# Part 2 — `/segments/next-gen` (Next-Gen builder)

## 1. Purpose

Create a Next-Gen segment: name it, choose global match logic, and compose one or more **Rules**,
each holding one or more **Criteria**, optionally generated from natural language by an AI panel.
**Primary task:** build a saveable contact-selection query.

## 2. Layout and hierarchy

```
AppBar (shell)
├ Breadcrumb  "My Segments" › "Segment Builder Selection" › "New Next Gen Segment"
├ h2          "New Next Gen Segment"
├ Row         [Segment Name *  ~1060px]              [switch "AND (Match all)"  ON]
├ Switch      "Include all active contacts"  OFF  + (i) tooltip
├ Rule card   #f7f8fa, rounded
│   ├ drag handle (6-dot) + span.rule-name "Rule 1"      ← a SPAN, not a heading
│   ├ criterion card (white, bordered) — cascading selects
│   ├ AND / OR pill pair between criteria
│   └ "+ ADD CRITERIA"      "BUILD WITH AI" (green pill)
├ "+ ADD RULE"
├ "Total criteria count: 1/100"  + two helper lines
├ [CANCEL] [SAVE]                                    SAVE disabled by default
└ Right drawer "Build Segments with AI"  ~850px, over a scrim
      ⚠ OPENS AUTOMATICALLY ON EVERY FRESH PAGE LOAD
```

**Headings:** `H2 "New Next Gen Segment"` · `H2 "Build Segments with AI"` ·
`H4 "Describe Segment Rule or Select Prompt*"` · `H4 "Preview Segment Rule"`.
**No `<h1>`; h2 → h4 skips a level; "Rule 1"/"Rule 2" are `<span>`s**, so the rule structure is
invisible to screen-reader heading navigation.

## 3. Component inventory → design-system mapping

| Legacy element | Marobase equivalent |
|---|---|
| `h2` + breadcrumb | `MpPageHeader` |
| `v-text-field` outlined | Segment Name |
| `input[role=switch]` × 4 | `v-switch` (Match-all, Include-all, INCLUDE DATE, INCLUDING) |
| `v-icon` + `v-tooltip` | hover-only info |
| Rule card `.rule-name` / `.rule-drag` | needs a real container + heading |
| Criterion card `.parent-filter` | cascading select row, up to 5 controls |
| `span.filter-type` AND/OR pill pair | **reorders on click** — see F5 |
| `.filter-condition.rule-condition` | read-only dark pill between rules, mirrors the master switch |
| `div.v-image.delete-icon` (✓/✎) + `i.mdi-delete` | criterion confirm/edit/delete — see A4 |
| `span.new-criteria-btn` / `new-ai-btn` / `new-rule-btn` | **spans, not buttons** |
| `v-date-picker` month grid | date value |
| `v-navigation-drawer--fixed` + scrim | AI drawer — **no dialog semantics** |
| `v-expansion-panel` × 2 | AI accordions |
| 4 grey skeleton pills | AI preview loading |

## 4. Fields, labels and copy (verbatim)

### Segment level

| Label (exact) | Control | Default | Required | Notes |
|---|---|---|---|---|
| `Segment Name *` | text `#input-18` | empty | gates Save | **no `maxlength`**, no `required` attr, no `aria-required` |
| `AND (Match all)` | switch `#input-21` | **on** | — | **label never changes when toggled off** |
| `Include all active contacts` | switch `#input-25` | off | — | `(i)` icon inside the label |

**Info tooltip, verbatim:**
> "By default, segments only include contacts subscribed to at least one list. Checking this option
> will also include contacts that are not subscribed to any list and those that are unsubscribed
> from all lists. This still excludes contacts in the Do Not Mail list."

**Footer meta, verbatim:**
- `Total criteria count: 1/100`
- `You can select nested segments with a maximum total of 100 filters. Having a high filter count affects the performance of the segment negatively.`
- `Note: Segments are calculated using Eastern Time (ET)`

**Buttons:** `+ ADD CRITERIA` · `BUILD WITH AI` · `+ ADD RULE` · `SHOW MORE OPTIONS` · `CANCEL` · `SAVE`

### Criterion — cascading selects

**Control 1 — `Select the category *`** (placeholder identical to the label). Complete option set
(6, verbatim; Title Case in the menu, **UPPERCASED once selected**):

`Contact Attributes` · `Purchase Activity` · `Membership` · `Relational Data` · `Site Visits` · `Campaign Activity`

**Control 2 — depends on category:**

| Category | Label | Complete option set |
|---|---|---|
| Contact Attributes | `Select field*` | grouped **Standard Fields** (`created_at`, `domain name`, `email`, `Engagement Level`, `first_name`, `last_name`, `Phone Number`, `RFM Group`, `UID`) + **Custom Fields** (lazy-loaded, 60+ seen, **no search box**) |
| Purchase Activity | `Select segment rule*` | `Purchased Product` · `Converted Campaigns` · `Placed Orders` · `Lifetime Value` · `Received Coupon` |
| Membership | `Select segment rule*` | `Lists` · `Journeys` · `Segments` · `Contact tags` · `Opted-in from forms` |
| Relational Data | `Select segment rule*` | `Relational Tables` · `SQL Queries` |
| Site Visits | `Select segment rule*` | `Visited Site` · `Entered Funnel` |
| Campaign Activity | `Select segment rule*` | grouped `── Email Activities ──` `Was Sent Emails` · `Received Emails` · `Opened Emails` · `Clicked Emails` / `── SMS Activities ──` `Was Sent SMS` · `Delivered SMS` · `Clicked SMS` · `Replied SMS` |

**Control 3 — operator; the label is generated from the field's data type:**

| Field type | Label (exact) | Complete option set |
|---|---|---|
| string (`email`) | `Select string attribute*` | Contains · Does Not Contain · Equals · Does Not Equal · Begins With · Does Not Begin With · Ends With · Does Not End With · Is Null · Is Not Null · Is In · Is Not In |
| datetime (`created_at`) | `Select datetime attribute*` | Is · Is Not · Before · After · Between · More Than · Less Than · Is Null · Is Not Null · In The Past · In The Next · Anniversary Of · Day Is In The Past · Day Is In The Next |
| float (`auto_float`) | `Select float attribute*` | Equals · Does Not Equal · Is Less Than · Is At Most · Is Greater Than · Is At Least · Is Null · Is Not Null · Is Between |
| boolean (`boolean_field`) | `Select boolean operator*` | `YES (True)` · `NO (False)` |
| enum (`Engagement Level`) | `Select Engagement level*` | Most Engaged · Highly Engaged · Engaged · Lightly Engaged · Not Engaged |

Underlying DOM text is lowercase (`"does not contain"`); Title Case is applied purely by CSS
`text-transform`.

**Control 4+ — value, varies by operator:**
- string `Contains` → `Enter alphanumeric characters*` text input, hint
  `A string which consists of uppercase and lowercase letters and numbers`
- datetime `Before` → switch `INCLUDE DATE` (off) + `Select date*` month-grid picker
  (`‹ August 2026 ›`, weekday row `S M T W T F S`, today ringed; **no month/year jump, no Today/Clear**)
- float `Is Between` → **two unlabelled text inputs** separated by literal `AND`, plus switch `INCLUDING` (off)
- enum `Engagement Level` → value select + literal `as of` + `Date/Time*` select, default `Today`,
  options `today · specific date · 7 days ago · 30 days ago · 90 days ago · x days ago`

**Purchase Activity → Placed Orders** adds:
- `Frequency*` default **`At Least Once`** — At Least Once · Nothing · Equal To · Not Equal To ·
  Less Than · At Most · Greater Than · At Least · Between
- `Recency*` default **`At Anytime`** — At Anytime · Today · Before · After · Between · More Than ·
  Less Than · In The Past · On
- `SHOW MORE OPTIONS` reveals `Optional filters` — `Monetary Value` · `Products Purchased` · `Order Status`

**Membership → Lists** adds:
- `Subscription type*` default `Both` — Both · Email · SMS
- `Subscription status*` default `Subscribed To` — Subscribed To · Unsubscribed From · Never Subscribed To
- `List type*` default `Any List Type` — Any List Type · Branded List
- `Select list name*` default `Any List` — `Any List` + every account list (server-side search
  autocomplete, 20 at a time)

**Campaign Activity → Opened Emails** reuses the same `Frequency*` / `Recency*` pair and defaults.

### AI drawer (verbatim)
- Title `H2`: `Build Segments with AI`
- Body: `This feature uses natural language processing to build segments using human readable sentence structure.`
- `This currently supports a limited set of records - ` + link `Learn More`
  → `galaxy.maropost.com/s/article/Segment-Rules-in-Next-Gen-Segment-Builder` (`target=_blank`)
- Accordion 1 `H4`: `Describe Segment Rule or Select Prompt*`
- Button `SEGMENT PROMPTS` (refresh icon) → menu of 9 canned prompts:
  1. `New subscribers within the last 30 days`
  2. `Subscribers who have not clicked or opened an email in the last 30 days`
  3. `Subscribers who have not purchased in the last 30 days`
  4. `Contacts whose domain is gmail.com`
  5. `Subscribers who have purchased at least 3 times in the last 90 days`
  6. `Contacts who have received atleast 5 emails on the month of May`
  7. `Subscribers who have made more than $1000 in purchases over the last 120 days`
  8. `Subscribers whose Lifetime value is more than $1000`
  9. `Subscribers who have clicked more than once in the last 30 days`
- Textarea `Segment Rule*`, `maxlength="1000"`, counter `0/1000`, trailing decorative magnifier
- Buttons `PREVIEW RULE` / `GENERATE` — both disabled while the textarea is empty
- Accordion 2 `H4`: `Preview Segment Rule`

## 5. Interactions and behaviours

**Save gating (tested).** Save is disabled on load. Typing a name with one complete criterion
enabled it. Clearing the name disabled it again and put the field in a red error state with
`Name is required`. **Save requires a name AND every criterion complete.**

**Criterion lifecycle.** Fill the cascade → a **✓ check-circle** appears beside the trash →
clicking ✓ collapses the criterion into three read-only light-blue chips, e.g.
`Contact Attributes | email | contains "!!!@@@"`, and ✓ becomes a **✎ pencil** (re-expands).
No confirmation on either.

**Deleting.** The trash removes a criterion **with no confirm and no undo**. Deleting a rule's
*only* criterion silently deletes the whole rule and its connector (verified: Rule 2 vanished,
count 3 → 2). **There is no rule-level delete control at all** — the only way to remove a rule is
to delete its criteria one by one.

**Match logic operates at two independent levels:**
- *Within a rule:* an AND/OR pill pair between adjacent criteria. **Defaults to OR.**
- *Between rules:* a dark read-only pill driven entirely by the top `AND (Match all)` switch.
  **The segment defaults to AND.** The two defaults are opposites.

**AI panel.** Auto-opens on every load. Typing enables both buttons. **`PREVIEW RULE` never
returned** — a 4-pill skeleton appeared after ~10s and was still spinning after 25+s, with no
result, no timeout and no error. `GENERATE` was not run.

**Cancel** navigates straight to `/segments` — **no unsaved-changes prompt**, all work discarded.

## 6. States observed

| State | Detail |
|---|---|
| Default | one empty Rule 1 with one empty criterion; counter already reads `1/100`; Save disabled; **AI drawer open over the form** |
| Loading (page) | ~18s; splash then a blank content column |
| Loading (AI preview) | 4 grey skeleton pills; both AI buttons re-disable while pending |
| Loading (list autocomplete) | menu shows literal `Loading...` then server results |
| Validation error | Segment Name empty after touch → red outline + `Name is required`. **The message is visually clipped — only the top ~4px renders** |
| Error (select) | an untouched-then-blurred required select gets a red outline with **no message at all** — observed on `Select float attribute*` and, absurdly, on the field labelled `Optional filters` |
| Validation NOT enforced | `!!!@@@` was accepted in `Enter alphanumeric characters*` despite the hint |
| Collapsed / read-only | three-chip summary |
| Disabled | Save (no name / incomplete criterion); PREVIEW RULE + GENERATE (empty prompt) |
| Toasts | **none appeared at any point** |

## 7. Accessibility findings

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | High | **No `<h1>`; heading order skips h2 → h4.** | 1.3.1 / 2.4.6 |
| A2 | High | **Rules are not headings** — `Rule 1` is `<span class="pl-2 rule-name">`. The whole rule/criterion structure is invisible to heading navigation. | 1.3.1 |
| A3 | **Critical** | **Primary actions are not buttons and are not focusable.** `ADD CRITERIA`, `BUILD WITH AI` and `ADD RULE` are all `<span>` with `role: null, tabindex: null, aria-label: null`. | 2.1.1, 4.1.2 |
| A4 | **Critical** | **Confirm / edit / delete are unnamed and unfocusable.** ✓/✎ is `div.v-responsive.v-image.delete-icon` (no role, no tabindex, no name); delete is `i.v-icon.mdi-delete` with `role="button"` but **no tabindex and no accessible name**. | 2.1.1, 4.1.2 |
| A5 | High | **The AND/OR connector has no semantics** — `span.filter-type` with no `role`, `tabindex` or `aria-pressed`. State is conveyed by colour *and by reordering the two chips*. | 1.4.1, 4.1.2 |
| A6 | High | **The unselected connector chip fails contrast badly.** Measured `rgb(255,255,255)` on `rgb(229,234,239)` ≈ **1.3:1** (needs 4.5:1). | 1.4.3 |
| A7 | High | **Range inputs are completely unlabelled** — `#input-730` / `#input-737` (float min/max) have `label: null, aria-label: null, placeholder: ""`, and are `type="text"`, not `number`. | 1.3.1, 3.3.2 |
| A8 | High | **Errors and hints are never associated.** Every input returned `aria-describedby: null`; the errored Segment Name returned `aria-invalid: null` and `aria-required: null`, and the `.v-messages__message` carrying `Name is required` has no `id`. *(Labels themselves are correctly wired via `label[for]`.)* | 3.3.1, 4.1.2 |
| A9 | High | **Drag handles are mouse-only** — `span.rule-drag` / `span.filter-drag` with no `tabindex`, `role` or `aria-label`. Reordering is unreachable by keyboard. | 2.1.1 |
| A10 | **Critical** | **The AI drawer has no dialog semantics and does not contain focus.** It renders a scrim but has `role: null`, `aria-modal: null`; on open `document.activeElement` is `BODY`; and the obscured Segment Name input is still reachable (`segmentNameAriaHidden: false`, `inertAttr: false`, `focusableWhileDrawerOpen: true`). **Focus falls behind the overlay** — the inverse of a focus trap. | 2.4.3, 4.1.2 |
| A11 | **Critical** | **Measured focus order proves the builder is unusable by keyboard.** Visible + enabled, in DOM order: `Segment Name → AND switch → Include-all switch → category → field → operator → [UNNAMED] → [UNNAMED] → INCLUDING → (criterion 2) category → Cancel`. **Absent entirely: ADD CRITERIA, BUILD WITH AI, ADD RULE, ✓ confirm, ✎ edit, 🗑 delete, AND/OR, drag handles, and SAVE.** A keyboard-only user can type a name and set the first cascade, then cannot add, confirm, delete or save anything. | 2.1.1 |
| A12 | Medium | **Two `<main>` landmarks.** | 1.3.1 |
| A13 | Low | **Ambiguous date-picker weekday headers** — `S M T W T F S`, two `T`s and two `S`s, no `abbr`/`aria-label`. | 1.3.1 |
| A14 | Medium | **Tooltip content is hover-only** — the `(i)` sits inside the switch's `<label>` but its tooltip is not exposed via `aria-describedby`. | 1.4.13, 2.1.1 |

## 8. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| **F1** | **The AI drawer hijacks every arrival.** It opens over the builder on every load, before the user has expressed any intent, and its scrim blocks the form they came to fill in. | |
| **F2** | **The AI feature appears broken in this build.** `PREVIEW RULE` spins indefinitely — no result, no error, no timeout. | The worst possible failure mode. |
| **F3** | **Reproducible blocker: `ADD CRITERIA` stops working once a criterion has been confirmed.** From the initial state it adds correctly. But after collapsing criterion 1 with ✓, three consecutive clicks pushed the counter `1/100 → 2 → 3 → 4` while **only one criterion row remained in the DOM** (`document.querySelectorAll('.parent-filter').length === 1`). Save stayed disabled with no explanation, because the form now believes phantom incomplete criteria exist. | **Multi-criteria segments cannot be built once you use the confirm control.** The most serious defect found anywhere in this crawl. |
| F4 | **The match-logic switch never says what it does.** Toggled off, `checked === false` but the label still reads `AND (Match all)`. With one rule there is *zero* feedback that the segment is now OR. | |
| F5 | **The AND/OR pills swap position when clicked** — selected always renders first, so the chip under the cursor changes meaning after every click. | Classic mis-click generator. |
| F6 | **Two competing AND/OR mechanisms with opposite defaults** — a switch at the top (defaults AND) and pills between criteria (default OR). | |
| F7 | **`Optional filters` shows a required-field error when left empty.** | Directly self-contradictory. |
| F8 | **The field picker has no search** for a list that lazy-loads 60+ entries, several rendering identically truncated (`custom_field_test_auto…` × 4). | Selecting the right custom field is guesswork. |
| F9 | **Autocomplete concatenates the query onto the selection.** Typing `june` into `Select list name*` (value `Any List`) left the field reading **`Any Listjune`**. | |
| F10 | **Off-by-one counter** — an empty new segment already reads `Total criteria count: 1/100`. | |
| F11 | **Cancel destroys work with no confirmation.** | |
| F12 | **No result preview and no contact count anywhere** — you cannot see how many contacts a rule matches before saving. | You save a query you have never seen the output of. |
| F13 | **Selected values are UPPERCASED** while menu options are Title Case; long values truncate inside ~200px controls. | |
| F14 | **Copy defects in shipped strings:** `Contacts who have received atleast 5 emails on the month of May` (missing space, wrong preposition) · `Select Engagement level*` (inconsistent capitalisation vs siblings) · `Select the category *` has a space before the asterisk while every other label uses `label*` · `INCLUDE DATE` / `INCLUDING` are uppercase while every other label is sentence case. | |
| F15 | **`SHOW MORE OPTIONS` never becomes "show fewer"** and gives no hint how many more there are. | |
| F16 | **No rule delete and no rule rename** — `Rule 1` / `Rule 2` are fixed auto-numbers. | |
| F17 | **Inconsistent overlay behaviour** — the `Select field*` menu measured `scrollHeight === clientHeight === 960px`, overflowing the viewport with no internal scroll, while the list autocomplete correctly capped at 304px. | |
| F18 | **No `maxlength` on Segment Name** — the destination list already contains a 200+ character name wrapping to four lines. | |
| F19 | **~18s cold load** with a blank content column. | |

## 9. Data shapes

```ts
type Segment = {
  name: string                      // required, no max length enforced
  matchAll: boolean                 // true = AND, false = OR (label always reads "AND (Match all)")
  includeAllActiveContacts: boolean // default false
  rules: Rule[]                     // ordered, drag-reorderable; auto-named "Rule N"
  criteriaCount: number             // 1..100 (starts at 1 when empty)
}

type Rule = {
  id: string
  criteria: Criterion[]
  connector: 'AND' | 'OR'           // between criteria within this rule; default 'OR'
}

type FieldType = 'string' | 'datetime' | 'float' | 'integer' | 'boolean' | 'enum'
type FieldRef = { group: 'Standard Fields' | 'Custom Fields'; name: string; type: FieldType }

type Frequency = 'At Least Once'|'Nothing'|'Equal To'|'Not Equal To'|'Less Than'|'At Most'
               | 'Greater Than'|'At Least'|'Between'
type Recency   = 'At Anytime'|'Today'|'Before'|'After'|'Between'|'More Than'|'Less Than'
               | 'In The Past'|'On'

type Value =
  | { kind: 'string'; text: string }                        // "alphanumeric" hint, NOT enforced
  | { kind: 'date'; date: string; includeDate: boolean }
  | { kind: 'numberRange'; min: string; max: string; including: boolean }
  | { kind: 'boolean'; value: 'YES (True)' | 'NO (False)' }
  | { kind: 'engagement'
      level: 'Most Engaged'|'Highly Engaged'|'Engaged'|'Lightly Engaged'|'Not Engaged'
      asOf: 'today'|'specific date'|'7 days ago'|'30 days ago'|'90 days ago'|'x days ago' }

type Criterion =
  | { category: 'Contact Attributes'; field: FieldRef; operator: string; value: Value; confirmed: boolean }
  | { category: 'Purchase Activity'
      rule: 'Purchased Product'|'Converted Campaigns'|'Placed Orders'|'Lifetime Value'|'Received Coupon'
      frequency: Frequency; recency: Recency
      optionalFilters?: ('Monetary Value'|'Products Purchased'|'Order Status')[] }
  | { category: 'Membership'
      rule: 'Lists'|'Journeys'|'Segments'|'Contact tags'|'Opted-in from forms'
      subscriptionType: 'Both'|'Email'|'SMS'
      subscriptionStatus: 'Subscribed To'|'Unsubscribed From'|'Never Subscribed To'
      listType: 'Any List Type'|'Branded List'
      listName: string }
  | { category: 'Relational Data'; rule: 'Relational Tables'|'SQL Queries' }
  | { category: 'Site Visits';     rule: 'Visited Site'|'Entered Funnel' }
  | { category: 'Campaign Activity'
      rule: 'Was Sent Emails'|'Received Emails'|'Opened Emails'|'Clicked Emails'
          | 'Was Sent SMS'|'Delivered SMS'|'Clicked SMS'|'Replied SMS'
      frequency: Frequency; recency: Recency }

type AiPrompt = { text: string }    // max 1000 chars, 9 canned suggestions
```

**Round-trip context:** the list page `/segments` (the Cancel destination) is a table with columns
**Name · Builder (`Next Gen` | `Legacy`) · Contacts · Created At · Updated At · Action (kebab)**,
plus a folder chip, `VIEW ARCHIVES`, an `All` filter select and a `NEW SEGMENT` button.

## 10. Unverified — carried into Phase 2 questions

1. **What `GENERATE` actually does** — not run, since it rewrites the whole rule set. Whether it
   replaces or appends, and whether it can be undone, is unknown.
2. **What `PREVIEW RULE` renders on success** — it never completed. The "Preview Segment Rule"
   panel's structure is unknown beyond its 4-pill skeleton.
3. **Whether the ADD CRITERIA defect (F3) is UAT-only or shipped**, and whether phantom criteria
   are submitted to the API.
4. **What `SAVE` produces** — success toast/redirect, duplicate-name handling and server-side
   validation are all unverified.
5. **Second-level controls for 12 of the 20 segment rules** — only `Placed Orders`, `Lists` and
   `Opened Emails` were expanded. Missing: `Purchased Product`, `Converted Campaigns`,
   `Lifetime Value`, `Received Coupon`, `Journeys`, `Segments`, `Contact tags`,
   `Opted-in from forms`, `Relational Tables`, `SQL Queries`, `Visited Site`, `Entered Funnel`,
   and all four SMS activities.
6. **Value controls for the less common operators** — `Is In` / `Is Not In` (multi-value?),
   `Anniversary Of`, `Day Is In The Past` / `Day Is In The Next`, `In The Next`, `x days ago`,
   `specific date`.
7. **What `SHOW MORE OPTIONS` yields on a second and third click**, and its per-rule ceiling.
8. **Full custom-field inventory** — the picker lazy-loads; the crawl stopped at 60 options.
9. **Drag-and-drop reorder semantics** — not exercised.
10. **Edit mode** — only the create flow was seen. Pre-populated state, dirty-tracking, and any
    archive/duplicate actions are unknown.
11. **Whether the `AND (Match all)` label is dynamic in any other build** — hard-coded here.
12. **Responsive** — audited at 1568px only. The 5-control criterion row plus action icons already
    consumes ~1150px, so narrower viewports are likely to break.
13. **Legacy builder internals** (`/segments/new`) — sandboxed iframe, `contentDocument` returned
    null, so **no DOM extraction was possible at all**.
14. **Entitlement gating** — whether an account without Next-Gen sees only one tile on `/segments/types`.
