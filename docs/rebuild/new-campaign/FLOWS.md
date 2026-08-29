# FLOWS — New Campaign (`/campaigns/new`)

One entry per action reachable from the audited pages. States noted inline.
**Legend:** ✅ walked end-to-end · ⚠️ walked up to the last safe step · ⛔ not executed (irreversible).

---

## F1 · Index → `NEW CAMPAIGN` ✅
1. `/campaigns` → click `NEW CAMPAIGN` → `/campaigns/new` chooser.
2. Chooser exits: `Email Campaign` tile → F2 · `A/B Email Campaign` tile → F3 ·
   `CANCEL` / `← Back To Campaign Index` → back to `/campaigns`.

## F2 · Email Campaign wizard ✅ (through Review; terminal sends ⛔)

**F2.1 Details → Contacts**
- NEXT disabled until Campaign Name + Subject present (no inline error shown for empty — the
  button gate is the validation).
- BACK returns to the chooser (fields kept in memory until leave).

**F2.2 Contacts → Content (auto-save)**
- NEXT/SAVE disabled until ≥1 of List/Segment/Table selected.
- Selecting a list auto-fills From Name/Email/Reply To/Address/Language from list settings.
- NEXT **saves the draft**: stepper dots 1–2 → checks, breadcrumb gains `"<name>"`, campaign row
  appears in index with status `Draft`.
- State: selecting only 0-contact lists → yellow info toast (dismissible ✕): "You have selected
  list(s) having 0 contacts… will not be send unless you have at least 1 contact selected."
  Wizard still proceeds; send is blocked at delivery, not navigation.

**F2.3 Content step**
- Select content → inline render of the email appears (auto), RENDER PREVIEW re-renders.
- `Show email preview link` toggle → adds "having trouble viewing" link (Review shows YES/NO).
- `Dynamic content preview` toggle → preview uses a real contact from the audience (tooltip warns
  complex segments may time out). With a 0-contact audience this is effectively untestable — ⚠️.
- Pencil → **Edit Content full-screen overlay** ("Edit Content · Editor Type: DnD", ✕ to close):
  third-party drag-and-drop builder; hosts the **device-preview generator**. ⚠️ Unverified: the
  overlay froze the tab (main-thread lock >60s) during load; internals not captured. Per product
  owner: third-party — to be represented as a static mockup in the sandbox, not rebuilt.
- `SPAM CHECK` (only way forward) → F2.4. `SAVE` persists step. `BACK` → Contacts.

**F2.4 Spam Check**
- Loading spinner (~5–10s) → score gauge. Pass: green ring `Spam Score 0` + "Fantastic! Your spam
  score is all clear!" · Fail state ⚠️ not reproducible with clean content (DOM copy: "Please
  contact Maropost Deliverability team…").
- `Next` → Schedule · `Back` → Content.

**F2.5 Schedule**
- `Schedule with` = Send Now → date/time hidden. Priority Send / Time Zone Optimization →
  Date (DD/MM/YYYY picker) + Time picker + Pre-Send Calculation toggle. Recurring → radio panels
  (Day-of-week Mon–Sun + time · Repeat Every Day/Week/Month/Year + time).
- **Send Test Email**: needs ≥1 email chip or list; `SEND TEST` ⛔ not executed (sends real mail).
  Cap copy: max 10 emails / 20 contacts in lists.
- `REVIEW` → F2.6 · `SAVE` persists · `BACK` → Spam Check result.

**F2.6 Review**
- Sections Content / Campaign Details / Contacts / Schedule, each pencil ✅ jumps to its step
  (verified Content pencil → step 3 with state intact).
- Terminal actions ⛔ NOT EXECUTED: `SEND NOW` (method Send Now) / `Schedule` (dated methods).
  Expected post-state (from index rows): status becomes `Scheduled`/`Recurring`/sent; not verified.

**F2.7 Draft re-entry ✅**
- Index row kebab → `Edit Campaign` reopens the wizard with saved state; `Delete Campaign
  Permanently` ⛔ not executed (permanent).
- Duplicate icon on row: ⚠️ not executed (creates a copy).

## F3 · A/B Email Campaign wizard ✅ (through Split Groups; terminals ⛔)

**F3.1 Campaign Information + Contacts**
- NEXT gated on Name / From Email / Reply To / (List or Segment).
- No auto-fill of sender fields from list (unlike F2.2).
- NEXT saves draft (breadcrumb gains quoted name; 0-contact toast shown same as F2.2).

**F3.2 Split Groups**
- Winning Criteria select (6 options; Manual = decide later from reports).
- 2 group cards by default; group checkbox + toolbar trash/duplicate to manage groups (⚠️ add-group
  affordance = duplicate icon; a plain "add" control was not observed).
- Every group field required; groups' Size (%) must sum ≤100, remainder auto-allocated to the
  winner group (per inline alert).
- Send Test: ⛔ not executed.
- Terminals ⛔: `SAVE` (draft persists — implicitly exercised by step-1 NEXT), `SEND NOW`,
  `SCHEDULE CAMPAIGN`.

## F4 · Header/utility actions on these pages ✅/⚠️
- Breadcrumb `Campaign`/`Email Campaigns` link → index ✅.
- Chooser `CANCEL`, `← Back To Campaign Index` ✅.
- Emoji picker buttons (Subject/Preheader/test subject) ⚠️ not opened (standard picker popover).
- `Brands` dropdown options ⚠️ not enumerated (opens list of brand records; same combobox pattern).

## Unverified inventory (with reasons)
| Item | Reason |
|---|---|
| SEND NOW / Schedule / SCHEDULE CAMPAIGN / SEND TEST | irreversible sends |
| Delete Campaign Permanently / row duplicate | destructive / record-creating |
| DnD Edit Content overlay internals + device previews | third-party editor; tab froze on load; owner says mock it |
| Spam-check failure visual | needs spammy content in shared UAT |
| Dynamic content preview render | needs non-empty audience |
| STO / Conversion-Time Optimization schedule methods | not enabled on this account (tooltip-only) |
| Validation error visuals (red states) | gates are button-disabling; forcing server errors risked junk records |
