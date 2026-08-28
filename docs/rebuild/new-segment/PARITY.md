# PARITY — New Segment

**Sources:** `/segments/types` (chooser) · `/segments/next-gen` (builder)
**Rebuilds:**
[`SegmentBuilderChooser.vue`](../../../src/views/Contacts/SegmentBuilderChooser.vue) ·
[`CreateSegmentNextGen.vue`](../../../src/views/Contacts/CreateSegmentNextGen.vue) ·
[`segmentCatalog.ts`](../../../src/views/Contacts/segmentCatalog.ts)
**Routes:** `/accounts/:accountId/segments/types` · `/accounts/:accountId/segments/next-gen`

---

# Part 1 — Builder chooser

| # | Source | Rebuilt | Notes |
|---|---|---|---|
| 1 | Breadcrumb `My Segments › Segment Builder Selection` | ✅ | `MpPageHeader` `backTo` |
| 2 | Heading `Create New Segment` (`h4`, no `h1`) | ✅ | `Create a segment` as the page `h1` |
| 3 | Subtitle `Select the segment builder.` | ✅ | reworded |
| 4 | Two tiles | ✅ | Next-Gen listed first and marked recommended |
| 5 | Tile titles | ✅ | real `h2`s, not dead links |
| 6 | Tile descriptions | ⚠️ rewritten — see deviations |
| 7 | `New!` badge on Next-Gen | ✅ | as a text chip, not an image |
| 8 | Legacy tile → legacy builder | ⚠️ stands in — see open items |
| 9 | Next-Gen tile → `/segments/next-gen` | ✅ |
| 10 | `CANCEL` → `/segments` | ✅ | as the header back link |
| 11 | Tiles focusable but **not** keyboard-operable | ✅ **fixed** — real links |

# Part 2 — Next-Gen builder

## Segment level

| # | Field | Source | Rebuilt |
|---|---|---|---|
| 12 | `Segment Name *` | text, **no maxlength** | ✅ + 150 cap and counter |
| 13 | `AND (Match all)` switch, default on | ✅ | label now states the current mode |
| 14 | `Include all active contacts`, default off | ✅ | + its full explainer as a hint |
| 15 | Tooltip copy (Do Not Mail explainer) | ✅ | always visible, associated |
| 16 | `Total criteria count: 1/100` | ✅ | corrected — see deviations |
| 17 | Performance note | ✅ |
| 18 | ET calculation note | ✅ |

## Criterion cascade

| # | Control | Source options | Rebuilt |
|---|---|---|---|
| 19 | `Select the category *` | 6 | ✅ all 6, source order |
| 20 | Contact Attributes → `Select field*` | Standard (9) + Custom, grouped | ✅ + **searchable** |
| 21 | Purchase Activity → rule | 5 | ✅ |
| 22 | Membership → rule | 5 | ✅ |
| 23 | Relational Data → rule | 2 | ✅ |
| 24 | Site Visits → rule | 2 | ✅ |
| 25 | Campaign Activity → rule | 8, grouped Email/SMS | ✅ grouped |
| 26 | string operators | 12 | ✅ |
| 27 | datetime operators | 14 | ✅ |
| 28 | float/integer operators | 9 | ✅ |
| 29 | boolean operators | 2 | ✅ |
| 30 | Engagement Level values | 5 | ✅ |
| 31 | Operator label generated from data type | ✅ |

## Value controls

| # | Case | Source | Rebuilt |
|---|---|---|---|
| 32 | string | text + "alphanumeric" hint, **not enforced** | ✅ text (hint dropped — see deviations) |
| 33 | datetime | date picker + `INCLUDE DATE` switch | ✅ `type=date` |
| 34 | number range (`Is Between`) | **two unlabelled inputs** + `INCLUDING` | ✅ labelled `From` / `To` |
| 35 | boolean | `YES (True)` / `NO (False)` | ✅ |
| 36 | enum + `as of` selector | 6 options | ✅ |
| 37 | `Is Null` / `Is Not Null` take no value | ✅ |

## Category-specific extras

| # | Case | Source | Rebuilt |
|---|---|---|---|
| 38 | Purchase/Campaign → `Frequency*` (9) + `Recency*` (9) | ✅ both, with source defaults |
| 39 | Membership → Lists → 4 extra selects | ✅ all 4, with source defaults |
| 40 | `SHOW MORE OPTIONS` → `Optional filters` (3) | ✅ as a toggle that also collapses |

## Rule and criterion mechanics

| # | Behaviour | Source | Rebuilt |
|---|---|---|---|
| 41 | Add criterion | ⚠️ **broken after confirm** | ✅ **fixed** — verified: card count and counter both go to 2 |
| 42 | Add rule | ✅ | ✅ |
| 43 | Confirm collapses to a summary | ✅ | ✅ plain-language summary |
| 44 | Edit re-expands | ✅ | ✅ |
| 45 | Delete criterion, no confirm | ✅ | ✅ matched |
| 46 | Deleting the last criterion silently deletes the rule | ⚠️ **changed** — the rule stays with an empty state |
| 47 | **No rule-level delete** | ⚠️ **added** |
| 48 | AND/OR between criteria, default OR | ✅ | default AND — see deviations |
| 49 | AND/OR chips **swap position on click** | ⚠️ **fixed** — stable `v-btn-toggle` |
| 50 | Read-only connector between rules, driven by the master switch | ✅ |
| 51 | 100-criteria cap | ✅ enforced, with Add disabled at the cap |

## AI panel

| # | Item | Source | Rebuilt |
|---|---|---|---|
| 52 | Opens **automatically on every load** | ⚠️ **changed** — opens from `Build with AI` |
| 53 | Title + explainer copy | ✅ |
| 54 | 9 canned prompts | ✅ all 9 (one typo fixed) |
| 55 | `Segment Rule*` textarea, 1000 max + counter | ✅ |
| 56 | `PREVIEW RULE` | ⚠️ **hangs forever in source** — ✅ always resolves here |
| 57 | `GENERATE` | ✅ as `Add as rule` |
| 58 | Preview panel | ✅ + a real error state |

## States

| # | State | Rebuilt |
|---|---|---|
| 59 | Default | ✅ one rule, one empty criterion, counter 1 |
| 60 | Validation — name | ✅ `Enter a segment name`, not visually clipped |
| 61 | Validation — incomplete criterion | ✅ Save gated, with a stated reason |
| 62 | `Optional filters` showing a required error | ✅ **fixed** — it is optional |
| 63 | Disabled Save | ✅ + reason |
| 64 | AI loading / ready / error | ✅ all three |
| 65 | Rule empty state | ✅ `MpEmptyState` |
| 66 | Unsaved-changes guard | ⚠️ **added** |
| 67 | Success feedback | ⚠️ **inferred** — toast + redirect |

## Verification

| # | Check | Result |
|---|---|---|
| 68 | `npm run type-check` | ✅ passes |
| 69 | axe-core WCAG 2.0/2.1 A + AA, builder content | ✅ **0 violations** |
| 70 | Add-criterion-after-confirm | ✅ verified in the browser |
| 71 | Zero non-system styles | ✅ |

---

## Deliberate deviations

1. **The Add-criterion blocker is fixed.** In the source, once you confirm a criterion, `ADD
   CRITERIA` increments the counter but adds no row, and Save stays disabled forever — multi-criteria
   segments cannot be built at all (audit F3). Verified fixed: card count and counter both advance.

2. **Every control is keyboard operable.** In the source, `ADD CRITERIA`, `BUILD WITH AI`,
   `ADD RULE`, confirm, edit, delete, the AND/OR connector and the drag handles are all
   `<span>`/`<div>` with no role or tabindex — a keyboard user can set the first cascade and then
   do nothing else, including save (audit A3, A4, A11).

3. **The match-logic switch says what it does.** The source's label reads `AND (Match all)` whether
   it is on or off (audit F4).

4. **AND/OR is a stable toggle.** The source's two chips reorder on click, so the chip under the
   cursor changes meaning (audit F5). It also had no role, no `aria-pressed`, and the unselected
   chip measured **1.3:1** contrast (audit A6).

5. **Both AND/OR levels default to AND.** The source defaults the segment to AND and criteria
   within a rule to OR (audit F6).

6. **Rules have real headings and a delete control.** `Rule 1` is a `<span>` in the source, and
   there is no way to delete a rule except emptying it one criterion at a time (audit A2, F16).

7. **The AI panel no longer hijacks arrival**, and its preview always resolves — the source's spins
   indefinitely with no result, error or timeout (audit F1, F2).

8. **Range inputs are labelled** `From` / `To`. The source's have no label, no `aria-label` and no
   placeholder (audit A7).

9. **The criteria counter is accurate.** The source reads `1/100` on an empty segment (audit F10).

10. **`Optional filters` is optional.** The source shows a required-field error on it (audit F7).

11. **The field picker is searchable** over 60+ lazy-loaded options (audit F8).

12. **The "alphanumeric" hint was dropped** rather than kept unenforced. The source promises
    "uppercase and lowercase letters and numbers" and then accepts `!!!@@@`. Enforcing it would
    reject legitimate values like `@gmail.com`; keeping an unenforced promise is worse than
    silence, so the hint went and the field accepts free text.

13. **Tile descriptions were rewritten** to say what each builder is *for*, not how it works, and
    Next-Gen is marked recommended. The source gives no steer at all (chooser friction #1).

## Open items carried forward

- **The Legacy builder could not be crawled.** It renders in a cross-origin iframe whose
  `contentDocument` is null, so no field, label or behaviour could be extracted. The chooser's
  Legacy tile routes to the pre-existing sandbox Segments drawer as a stand-in, flagged in GAPS.md.
- **`GENERATE` was never run** on UAT (it rewrites the whole rule set), so whether it replaces or
  appends is unknown. The rebuild appends.
- **`PREVIEW RULE` never completed**, so the real preview panel's structure is unknown.
- **12 of the 20 segment rules** were never expanded on UAT — only `Placed Orders`, `Lists` and
  `Opened Emails`. The others render the cascade but not their own second-level controls.
- **Less common operators** (`Is In`, `Anniversary Of`, `Day Is In The Past`, `x days ago`,
  `specific date`) have no bespoke value control.
- **Drag-to-reorder** is not built. The source's is mouse-only with no keyboard equivalent, so
  rebuilding it as-is would reintroduce an accessibility failure; a keyboard-accessible reorder is
  a design question, not a parity one.
- **Save's server behaviour** — duplicate names, validation — never observed.
- **Whether the Add-criterion defect is UAT-only or shipped.**
