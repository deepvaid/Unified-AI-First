# AUDIT — New Campaign (type chooser + Email wizard + A/B wizard)

**Sources:**
- `https://uat.maropost.com/accounts/116000/campaigns/new` — campaign-type chooser
- `https://uat.maropost.com/accounts/116000/campaigns/new/email` — Email Campaign wizard (4 steps + spam check + review)
- `https://uat.maropost.com/accounts/116000/campaigns/new_ab_test` — A/B Email Campaign wizard (2 steps)
- `https://uat.maropost.com/accounts/116000/campaigns` — Email Campaigns index (entry/exit context)

**Crawled:** 2026-08-29 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session · viewport 1568px
**Stack:** legacy MMC app (Vuetify 2) inside the Vuetify 3 shell — same two-`<main>` landmark
situation as the CDP/Products slices. `mdi-`/Material icon names in DOM (`event`, `watch_later`).

> Crawl method: full walkthrough of both wizards using throwaway drafts pointed at **0-contact
> lists** (`yg_send_test (0)`, `12Aug-neto (0)`). Every step reached, every dropdown enumerated,
> every ⓘ tooltip captured via two-step hover. Spam check executed (read-only analysis). **Nothing
> was sent, scheduled, or test-mailed.** Two draft campaigns remain on UAT and need manual cleanup:
> `ZZ Parity Crawl Draft - DO NOT SEND` and `ZZ Parity AB Draft - DO NOT SEND` (row kebab → Delete
> Campaign Permanently — deliberately not executed by the crawl).

---

# Part 1 — `/campaigns/new` (campaign-type chooser)

## Purpose
One-step chooser between the two campaign types. Reached from Email Campaigns index →
`NEW CAMPAIGN`. Same pattern as the Segments builder chooser (docs/rebuild/new-segment).

## Layout & copy (verbatim)
```
"← Back To Campaign Index" link  (top-left, above content)
H  "Create New Campaign"   (centred display heading)
p  "Select your campaign type."
Two outlined tiles: [envelope illustration] "Email Campaign" · [split illustration] "A/B Email Campaign"
[CANCEL]  centred outlined button → /accounts/116000/campaigns
```
- Email tile → `/campaigns/new/email`; A/B tile → `/campaigns/new_ab_test`.
- No h1; centred layout; tiles are plain outlined cards.

**DS mapping:** `MpPageHeader` (or centred chooser layout as built for New Segment),
`MpOptionCard` for the tiles, back link = `backTo`.

---

# Part 2 — `/campaigns/new/email` (Email Campaign wizard)

## Structure
A 4-dot progress stepper (plain numbered circles joined by rules; completed = check in filled
circle). The 4 dots hide **6 actual screens**:

| Dot | Screen | Advance control |
|---|---|---|
| 1 | Campaign Details | NEXT (disabled until valid) |
| 2 | Contacts (+ Suppress) | NEXT (auto-saves draft) / SAVE |
| 3 | Content | **SPAM CHECK** (no NEXT on this screen) |
| 3 | Spam Check result | Next |
| 4 | Schedule (+ Send Test) | REVIEW / SAVE |
| 4 | Review | Schedule / SEND NOW |

Breadcrumb: `Campaign › New Email Campaign` — gains the draft name in quotes once saved
(`New Email Campaign "ZZ Parity Crawl Draft - DO NOT SEND"`).

## Step 1 — Campaign Details
Copy: H "Campaign Details" · "Enter the details of your campaign."

| Field | Type | Notes |
|---|---|---|
| Campaign Name * | text | persistent hint below: "You cannot use emojis in this field." |
| Subject * | text | emoji-picker button inside field (right) |
| Preheader | text | emoji button · counter `0 / 100` · ⓘ "Enter a short summary text that is to follows the subject line when the email is viewed from the inbox." **[sic — source grammar defect]** |
| Select Campaign tag | multi-select | checkbox list, `Select All (40)`, hierarchical tags expandable with child counts (`Test5 (1)`), typeahead. ⓘ "You can assign multiple tags to your campaign. Tags are useful for custom reporting." |

Inline alert: `ⓘ Campaign is in draft mode, please Save on Step 2.`
Footer: `BACK` (→ chooser) · `NEXT` (disabled until Name + Subject filled).

## Step 2 — Contacts
Copy: H "Contacts" · "Select the contacts to which the campaign must be sent."

**Audience** (all are checkbox multi-selects with counts + Select All + typeahead):
- Brands (no *, optional filter)
- Select Segment * (0)
- Select Table * (0)
- Select List * (0) — options like `contact-tz-1 (2)`, `UDAY_Control (42)`, `yg_send_test (0)` (recent-first ordering)
- Alert between: `ⓘ Please select either List, Segment or Table.` — the * on all three actually means "at least one of these".

**Sender block** (2-col grid): From Name * (hint "You can not use special characters or emojis in
this field."), From Email *, Reply To *, Language * (select, default English), Address * (full-width).

**Key behavior:** picking a list **auto-fills From Name / From Email / Reply To / Address /
Language from the list's settings**. Alert: `ⓘ In case of multiple lists, "From Name", "From
Email", "Reply To" & "Address" will be autofilled based …` (truncated in a11y capture).

**Add Suppress Contacts** — H + "Select the contacts to which the campaign must not be sent.":
Select Suppress List (0) ⓘ · Select Suppress Journey (0) · Select Suppress Segment (0) ·
Select Suppress Secure List (0) ⓘ.

Alert: `ⓘ To avoid losing the progress, click save before proceeding to the next step.`
Footer: `BACK` · `NEXT` · `SAVE` (disk icon; NEXT + SAVE disabled until an audience is picked).
**NEXT implicitly saves the draft** (stepper dots 1–2 become checks; campaign appears in index as Draft).

**Zero-contact guard:** after proceeding with a 0-contact list, a yellow toast appears top-centre:
`ⓘ You have selected list(s) having 0 contacts for this campaign. The campaign will not be send
unless you have at least 1 contact selected.` **[sic "be send" — source grammar defect]**. Send is
blocked server-side, not in the UI.

## Step 3 — Content
Copy: H "Content" · "Select the content for your campaign."

- **Content Name *** — single-select typeahead over existing Email Content records
  (`Email Content for abandoned_cart - Sales Channel 8`, `STO test content`, …). **No inline
  "create new content"** — content must already exist under Marketing → Content → Email Content.
- Toggle **Show email preview link** ⓘ "If you are having trouble viewing this email, click here."
  (that is the literal link text injected into the email header).
- Toggle **Dynamic content preview** ⓘ "The content previewed will be from a contact selected from
  your targeted audience. If you are targeting to a very complex segment, then the screen may timeout."
- **RENDER PREVIEW** button (top-right of preview card; disabled until content chosen). Selecting a
  content auto-renders the full email inline (merge tags visible: `{{contact.first_name}}`,
  `{{campaign.from_email}}`, `{{campaign.address}}`, `{{campaign.unsubscribe_link}}`).
- **Pencil icon** beside the preview → full-screen overlay `Edit Content — Editor Type: DnD` with
  close ✕: the embedded third-party drag-and-drop email builder (device previews live in there).
  **Unverified beyond its header** — the editor hard-froze the tab for 60s+ while loading (source
  performance defect; documented in FLOWS).
- Empty state before selection: grey placeholder illustration card.

Footer: `BACK` · `SPAM CHECK` · `SAVE`. There is **no NEXT** — SPAM CHECK is the only way forward
(forced spam gate).

## Spam Check (shares dot 3)
Copy: H "Spam Check" · "Identify deliverability issues that could impact campaign performance."
- Loading: centred spinner between the footer and heading.
- Pass state: large green ring gauge, centre label `Spam Score` + `0`, below:
  **"Fantastic! Your spam score is all clear!"**
- Fail-state copy exists in DOM: "Please contact Maropost Deliverability team to provide assistance
  for optimal campaign performance." (not triggered — unverified visual).
- Footer: `Back` · `Next`.

## Step 4 — Schedule
Copy: H "Schedule" · "Select a method for scheduling your campaign."

**Schedule with *** select — options in this account: `Send Now`, `Priority Send`,
`Time Zone Optimization`, `Recurring`. Its ⓘ tooltip documents six methods (verbatim):
- **Send Now:** Send the campaign now.
- **Priority Send:** Send the campaign to your most engaged contacts first.
- **One-Time/Time Zone Optimization:** Send the campaign to your contacts as per their time zone.
- **Send-Time Optimization:** Send the campaign at your contacts' best time or best day or both based on their email opening habits. In absence of prior history, the campaign is sent at the date and time selected in the date picker.
- **Conversion-Time Optimization:** Send the campaign at your contacts' best time or best day or both based on their online purchase habits. In absence of prior history, the campaign is sent at the date and time selected in the date picker.
- **Recurring:** Send the recurring campaign by creating a schedule.

(STO / CTO are tooltip-documented but **absent from this account's dropdown** — entitlement-gated.)

Per-method fields:
- **Send Now** → date/time row hidden entirely.
- **Priority Send / Time Zone Optimization** (and default un-picked state) → `Select Date *`
  (hint "DD/MM/YYYY format", calendar icon+picker) · `Select Time *` (clock icon+picker) ·
  **Pre-Send Calculation** toggle ⓘ "Enabling early pre-send calculation will start calculating
  audience 3 hours ahead of scheduled send time to ensure campaigns are not delayed."
- **Recurring** → two mutually-exclusive radio panels (grey cards):
  1. `Select Day Of Week` — Mon…Sun checkboxes + `Select Time *` (default 00:00)
  2. `Repeat Every` — interval select `Day | Week | Month | Year` + `Select Time *`
  Panel ⓘ present on the right of panel 1.

**Send Test Email** section: "Select contacts to send test email. You can send test email to a
maximum 10 emails and a total of 20 contacts in the list(s) added."
- Subject * — prefilled `Test bkjhkj knlj - Parity crawl draft subject` i.e.
  `Test {from name?} - {campaign subject}` — the junk token comes from source data. Emoji button.
- Enter Email (0) — chips combobox (type + enter)
- Select List (0) — multi-select ⓘ
- `SEND TEST` (disabled until a recipient exists). **Not executed.**

Footer: `BACK` · `REVIEW` · `SAVE` (SAVE disabled when clean).

## Review (shares dot 4)
Copy: H "Review" · "Final review for your campaign." Sections divided by rules, each with a
**pencil icon** that jumps back to its step:

| Section | Fields shown |
|---|---|
| Content | Content Name · `Email Preview Link` YES/NO · **full inline email render** |
| Campaign Details | Campaign Name · Subject |
| Contacts | Select Lists (chips) · From Name · From Email · Reply to · Language (**shows raw code `en`**) · Address |
| Schedule | Schedule with · `Day and Time` (for Send Now shows current time, e.g. `29/08/2026 09:44`) |

Footer: `BACK` + **`SEND NOW`** (when method = Send Now) or **`Schedule`** (dated methods — both
buttons exist in DOM, one is shown). **Not clicked.**

---

# Part 3 — `/campaigns/new_ab_test` (A/B Email Campaign wizard)

## Structure
2-dot stepper. Breadcrumb `Email Campaigns › New A/B Campaign` (→ gains quoted draft name).
**A completely different layout system from the email wizard** — wide single page per step,
denser 4-column group cards.

## Step 1 — Campaign Information + Contacts
- H "Campaign Information": Campaign Name * (same emoji hint) · From Email * · Reply To *
  (side-by-side).
- H "Contacts": Brand select · alert `ⓘ Please select either List or Segment.` ·
  Select Lists (0) (checkbox multi, **alphabetical** ordering with counts) · Select Segments (0) ·
  Select Suppress Lists (0) · Select Suppress Secure Lists (0) · Select Suppress Segments (0) ·
  Select Suppress Journeys (0) · Select Campaign Tags · Address · Language (default English) ·
  **Show email preview link** toggle ⓘ.
- Footer: `BACK` · `NEXT` (disabled until name/from/reply/audience valid).
- **No auto-fill from list here** (From Email/Reply To are typed before audience; no From Name at
  this step — it's per split group). No Table source, no preheader, no per-campaign Subject.

## Step 2 — Split Groups
- H "Split Groups".
- **Winning Criteria *** select + ⓘ. Options: `Top Choices`, `Highest Open Rate`,
  `Highest Click Rate`, `Manual Selection`, `Highest Click-to-Open Rate`,
  `Highest Conversion Rate`. Tooltip definitions (verbatim):
  - **Top Choices:** Selects the Subject Line and From Name based on the highest open rate. Content is selected on the highest click rate for the final campaign.
  - **Highest Open Rate:** Selects everything based on the highest open rate for the final campaign.
  - **Highest Click Rate:** Selects everything based on the highest click rate for the final campaign.
  - **Manual:** Lets you select everything at a later stage after viewing reports for the final campaign.
  - **Highest Click-to-Open Rate:** Selects everything based on the highest click-to-open rate for the final campaign.
  - **Highest Conversion Rate:** Selects everything based on the highest conversion rate for the final campaign.
- Toolbar above cards: **delete** (trash) and **duplicate** icons, enabled per selected group
  checkboxes.
- **Group cards** (2 by default; each = leading checkbox + 2×4 field grid + trailing ⓘ):
  Name * · Content Name * (select) · Subject * (emoji) · Pre-header (emoji) //
  From Name * · Size (%) * · Select Date * (calendar) · Select Time * (clock).
- **Send Test** card: same copy as email wizard; Enter Email (0) ⓘ · Select List (0) ⓘ ·
  `SEND TEST` disabled.
- **Pre-Send Calculation** toggle ⓘ.
- Alert: `ⓘ All the fields are required for split groups and two or more groups are required for
  A/B split test. The percentage you don't allocate to split groups will be automatically allocated
  to the winner group. The sum of allocations should not exceed 100%.`
- Footer: `BACK` · `SAVE` · `SEND NOW` · `SCHEDULE CAMPAIGN`. **None of the last three executed.**
- Same 0-contact toast as the email wizard.

---

# Part 4 — Index context (`/campaigns`)

- Header: folder icon · "Email Campaigns" (breadcrumb "My Campaigns") · right: `All` filter select ·
  `NEW CAMPAIGN` (black filled).
- Table: Name · Contacts · Status (outlined chips: `Draft` grey, `Recurring` blue w/ sub-caption
  "6 days to go") · Sent At · Updated At · Actions (kebab + duplicate icon).
- Row hover reveals drag handle + checkbox. Draft kebab: `Edit Campaign` · `Delete Campaign
  Permanently`.
- (The sandbox already has EmailCampaigns.vue — index is context only, not in rebuild scope unless
  asked.)

---

# Source defects observed (to fix in rebuild, log in PARITY)

1. **Grammar:** preheader tooltip "…that is to follows the subject line…".
2. **Grammar:** zero-contact toast "The campaign will not be send…".
3. **Test-email subject junk prefix** `Test bkjhkj knlj - …` leaking data into a default.
4. **Review shows raw language code** (`en`) where every other surface says "English".
5. **Casing/labels inconsistent between steps:** `BACK/NEXT` vs `Back/Next` vs `SPAM CHECK`/`Save`;
   step-3 footer has no NEXT (SPAM CHECK doubles as it) while every other step does.
6. **Preheader label vs tooltip:** field says "Preheader", A/B says "Pre-header".
7. **DnD content editor freeze:** opening Edit Content locked the tab (main thread) for 60s+.
8. **A11y:** two `<main>` landmarks; stepper dots are unlabeled; ⓘ tooltips are hover-only tiny
   targets; heading levels skip; required-ness conveyed only by `*`; the "either List, Segment or
   Table" rule contradicts three fields each marked `*`.
9. **Inconsistent list ordering** between wizards (recent-first vs alphabetical).
10. **The chooser page** has no h1 and no keyboard focus styles evident on tiles (same as segment
    chooser findings).

# UX friction worth fixing (improvement candidates)

- The "please Save on Step 2" / "click save before proceeding" alerts push a manual-save burden on
  the user even though NEXT auto-saves — one clear autosave affordance would remove both alerts.
- Required-vs-alternative audience selects (`*` on all three of Segment/Table/List) misleads.
- Spam check as a forced modal step with no skip; result page wastes a whole step for a score.
- Send Now on Review renders a "Day and Time" row that just shows "now", implying a schedule.
- Sender fields silently overwritten when a list is picked (no undo/notice).
- 4-field × 2-row split-group cards are dense and unlabeled as "Variant A/B".
- Footer button order/casing varies per step; primary action is sometimes outlined (`SPAM CHECK`).
