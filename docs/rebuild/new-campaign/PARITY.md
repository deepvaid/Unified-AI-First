# PARITY — New Campaign (chooser + Email wizard + A/B wizard)

Checked against `AUDIT.md` / `FLOWS.md` (crawled 2026-08-29). ✅ = built and verified in the
sandbox · 🔀 = deliberate deviation (user-approved "fix flow friction" license, rationale in
IMPROVEMENTS.md) · 🧩 = mocked (GAPS.md).

## Chooser (`/accounts/:id/campaigns/new` → CampaignTypeChooser.vue)
- [x] ✅ Reached from Email Campaigns → New Campaign; back link + tiles route correctly
- [x] ✅ Two tiles: Email Campaign → `/campaigns/new/email`, A/B → `/campaigns/new_ab_test`
- [x] 🔀 Copy sentence-cased ("Create a campaign / Choose the campaign type."); tile
      descriptions added; CANCEL replaced by the standard back affordance
- [x] ✅ Deep links with `?id` / `?source=davinci` forward to the wizard owning the draft's kind

## Email wizard (`CreateCampaign.vue`)
**Step 1 — Details**
- [x] ✅ Campaign name* (no-emoji hint) · Subject* · Preheader (100-char counter + hint) ·
      Campaign tags (from the tags store — closes the old hard-coded TAG_OPTIONS gap)
- [x] 🔀 Emoji-picker buttons not reproduced (niche control; hint copy covers the constraint)
- [x] ✅ Next gated on name+subject; "draft mode" nag alert removed (autosave chip instead) 🔀

**Step 2 — Contacts**
- [x] ✅ Brands · Select list/segment/table multi-selects with counts + Select all
- [x] ✅ "Either list, segment or table" rule — as one info alert, not three misleading `*` 🔀
- [x] ✅ List selection autofills From name/email, Reply to, Language, Address — announced via
      dismissible alert (UAT does it silently) 🔀
- [x] ✅ Suppress list/journey/segment/secure list
- [x] ✅ 0-contact audience warning (grammar fixed; shown inline on Contacts + Review, not a toast) 🔀
- [x] ✅ Next auto-saves the draft (Draft row appears in index); explicit SAVE nag removed 🔀

**Step 3 — Content + spam check**
- [x] ✅ Content name* single-select from the content library (no inline create, matching UAT)
- [x] ✅ Show email preview link + Dynamic content preview toggles (tooltip copy → visible caption)
- [x] ✅ Auto-rendered inline email preview with verbatim merge tags · Render preview button
- [x] 🧩 Edit content pencil → mocked third-party DnD editor overlay with **device previews**
      (desktop / tablet / mobile / mobile-dark, generate + regenerate) — GAPS §1
- [x] 🔀 Spam check is an on-demand section inside Content (gauge + "all clear"), not a forced
      blocking screen; result stored on the draft
- [ ] Spam-check failure state — not reproducible in source; sandbox always returns 0 (flagged)

**Step 4 — Schedule**
- [x] ✅ Schedule with*: all six methods incl. entitlement-gated STO/CTO (per-method description
      shown as the field hint; UAT hides them in one giant ⓘ tooltip)
- [x] ✅ Send now hides date/time · dated methods show Select date*/Select time* + Pre-send
      calculation toggle (3-hours copy) · Recurring shows day-of-week chips + time / repeat-every
      Day-Week-Month-Year + time radio panels
- [x] ✅ Send test email: prefilled test subject (junk-prefix defect fixed), email chips, list
      select, 10-address/20-contact cap copy; Send test mocked with a success toast

**Step 5 — Review**
- [x] ✅ Sections Campaign details / Contacts / Content / Schedule, each with a pencil that jumps
      to its step; audience chips; full email preview; preview-link + spam values
- [x] ✅ Language shows the readable name, not the raw code (source shows `en`)
- [x] ✅ Send now / Schedule campaign / Start schedule primary + Save draft; confirm dialog with
      audience count + consequences before finalizing 🔀 (UAT sends without confirming)
- [x] ✅ Finalize → status Sending / Scheduled / **Recurring** (new MpStatusChip mapping) →
      success toast → back to index with the new row on top

**Draft re-entry**
- [x] ✅ Index row edit routes by kind; hydration restores every field incl. recurring pattern
      and split groups; Da Vinci `?source=davinci` handoff preserved

## A/B wizard (`CreateAbCampaign.vue`)
- [x] ✅ Step 1: Campaign name* / From email* / Reply to*; Brand; lists+segments (either-rule
      alert); 4 suppress selects; tags, address, language, Show email preview link
- [x] ✅ No sender autofill from lists (matches UAT's A/B behavior)
- [x] ✅ Step 2: Winning criteria* — all 6 options with the UAT tooltip definitions as live hint
- [x] ✅ Group cards with Name*/Content*/Subject*/Pre-header/From name*/Size%*/Date*/Time*;
      per-card duplicate + delete; Add group (up to 4) 🔀 (UAT's toolbar icons acted on checked
      rows; per-card controls are more direct — group checkboxes dropped)
- [x] ✅ Allocation meter: sum ≤ 100 enforced with error alert; remainder-to-winner copy
- [x] ✅ "All fields required, two or more groups" rule enforced by validation + Complete chips
- [x] ✅ Send test (mock toast) · Pre-send calculation
- [x] ✅ Footer: Save draft / Send now / Schedule campaign, both terminals behind confirm dialogs
- [x] ✅ 0-contact warning inline

## Source defects fixed (all logged in IMPROVEMENTS.md)
- [x] "that is to follows" preheader tooltip → rewritten caption
- [x] "will not be send" toast → rewritten inline warning
- [x] `Test bkjhkj knlj -` junk test-subject prefix → `Test — {subject}`
- [x] Review `Language: en` → readable label
- [x] BACK/NEXT vs Back/Next casing and per-step footer inconsistencies → one footer pattern
- [x] "Preheader" vs "Pre-header" — Pre-header kept only in the A/B group card per UAT field name

## Known deviations not listed above
- Stepper is 5 honest steps (email) instead of 4 dots hiding 6 screens.
- Timezone is not user-editable (UAT has no timezone field either; stored default retained).
- UAT's per-campaign "Brands" filter options are mocked (3 brands).
