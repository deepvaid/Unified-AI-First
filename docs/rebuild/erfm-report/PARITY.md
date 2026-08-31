# PARITY — eRFM Report

Checked against `AUDIT.md` / `FLOWS.md` (crawled 2026-08-31).

✅ = built and verified in the sandbox · 🔀 = deliberate deviation (rationale in IMPROVEMENTS.md) ·
🧩 = mocked (GAPS.md) · 🔎 = reconstructed from state/rules because the live UI was unreachable ·
⚠️ = known limitation

**Route:** `/accounts/:accountId/erfm_report` → `ERFMReport` (path corrected from
`/analytics/erfm_report` to match production; nav item in `AppSidebar.vue` updated to match).

**Verification:** `npm run type-check` clean · `npm run build` succeeds ·
`npm run contrast:check` 244/244 enforced pairs pass · page mounts with **zero console errors**
(verified via in-app routing; the `backgroundBarColors` error seen when loading `/` is a
pre-existing dashboard bug — see IMPROVEMENTS.md "Not changed").

---

## Header

- [x] ✅ Title. 🔀 `eRFM Report` + subtitle `Engagement, Recency, Frequency and Monetary`, instead of
      upstream's single run-on `eRFM Report (Engagement, Recency, Frequency, and Monetary)`
- [x] ✅ `GROUPS` action → group-rename drawer (`v-btn variant="outlined"`, `list` icon)
- [x] ✅ `SETTINGS` action → RFM-settings drawer (`v-btn variant="outlined"`, `settings` icon)
- [x] ✅ Both render in `MpPageHeader`'s `#actions`
- [x] ✅ No export action (upstream has none — deliberately not added)

## §A Date window

- [x] ✅ `Compare RFM groups as of` heading
- [x] ✅ Base date + comparison date, both readonly fields opening a `v-menu` + `v-date-picker`
- [x] ✅ Seeded to the crawled pair (`2026-06-02` / `2026-08-30`)
- [x] ✅ Base date capped at comparison − 1 day (`maximumBaseDate` behaviour)
- [x] ✅ Base date floored 13 months back (`minimumBaseDate` behaviour, `ERFM_MAX_HISTORY_MONTHS`)
- [x] ✅ Comparison date floored at base + 1 day, capped at today
- [x] ✅ Changing either date drives every section (single store pair, no per-section state)
- [x] ✅ Helper copy. 🔀 rewritten and now states the 13-month limit, which upstream leaves invisible
- [x] ✅ `89 days apart` window readout (addition of information already implied by the two dates)
- [x] 🔀 Decorative `vs` separator hidden below 600px, `aria-hidden` throughout

## §B RFM & engagement insights

- [x] ✅ Section heading `RFM & engagement insights`
- [x] ✅ 5 groups × 5 engagement levels, plus a Total column and a Total row (6 × 6 as upstream)
- [x] ✅ Group order: champions, loyal, recent, need_attention, inactive
- [x] ✅ Engagement order: Most Engaged → Highly Engaged → Engaged → Lightly Engaged → Not Engaged
- [x] ✅ Cells carry a primary figure **and** a percentage change vs the base date
- [x] ✅ Colour ramp encodes magnitude
- [x] ✅ Cell click selects the cohort and fills the Create-segment form
- [x] ✅ Selected cell is visibly marked
- [x] ✅ Hover/focus readout gives exact figures + share of total
- [x] ✅ `Revenue` metric toggle — cells switch to currency (verified: `$521k`, aria `$520,800`)
- [x] 🔀 Metric toggle is `MpSegmentedControl` (`Contacts` / `Revenue`), not a bare switch labelled
      "Revenue"
- [x] 🔀 Total **row** is not selectable — "all groups" is not one of the five values the RFM
      attribute select accepts, so upstream's clickable Total row offers a cohort that cannot be
      built. Total **column** stays selectable, because `Total` *is* an engagement option
- [x] 🔀 Colour scale legend (`Fewer` → `More`) added; upstream sets `visualMap.show: false`
- [x] 🔀 Rendered as a semantic `<table>` of `<button>` cells rather than an ECharts canvas —
      keyboard-operable, per-cell accessible names, `aria-pressed` on selection
- [ ] ⚠️ Axis-label tooltips (`handleAxisTooltip` / `hideAxisTooltip`) **not reproduced** — they
      exist upstream only because canvas axis labels truncate at `width: 84.3`. Real table headers
      wrap instead, so the tooltip has nothing to reveal

### Create segment

- [x] ✅ Heading `Create segment` + instruction copy
- [x] ✅ `RFM group *` select — the 5 groups, required
- [x] ✅ `Engagement level *` select — 5 levels **plus `Total`**, required
- [x] ✅ `Create segment` disabled until both are chosen
- [x] ✅ `Reset` clears both selects and the matrix selection
- [x] ✅ Either entry path works: matrix cell, or the selects directly
- [x] ✅ Segment name templated `Segment <group> and <engagement> on <date>`
- [x] ✅ Routes to `CreateSegmentNextGen` carrying `rfmGroup`, `engagement`, `onDate`, `name`
- [x] ✅ Does **not** save a segment (upstream hands a draft to the builder)
- [x] ✅ Toast confirms the prefilled definition
- [ ] ⚠️ **The builder does not consume the prefill.** The handoff is made and the query carries the
      full definition, but `src/views/Contacts/CreateSegmentNextGen.vue` ignores it, so the builder
      opens empty. Applying it requires editing that view, which is outside this page's scope
      (playbook §4: never edit an existing view's template). Logged in GAPS.md with the change needed

## §C Compare distribution of contacts

- [x] ✅ Section heading
- [x] ✅ Three modes: `Contacts` · `Added or dropped` · `Percentage change` (upstream's three
      chart components)
- [x] ✅ `Contacts` — grouped bar, one pair per group, base vs comparison
- [x] ✅ `Added or dropped` — net change per group, diverging (negatives in the error colour)
- [x] ✅ `Percentage change` — per-group % change, diverging
- [x] ✅ Mode switch re-projects client-side, no refetch
- [x] ✅ Legend on the two-series mode only
- [x] ✅ Totals line: `46,120 contacts at 2026-06-02 → 48,250 at 2026-08-30`
- [x] 🔀 Mode selector is `MpSegmentedControl`, not an unlabelled `v-select`
- [x] 🔀 **Linear axis, not upstream's log scale.** Upstream pre-log-transforms the data (keeping
      truth in `originalValue`) because its live account is 68,000× skewed — Inactive 476,879 vs
      Loyal 7 — which makes a linear axis unreadable. The seeded data has a realistic ~10× skew, so
      a linear axis is both readable and honest; keeping the log transform would misrepresent it.
      Tied to the mock-data decision below
- [x] 🔀 Comparison date takes the palette's lead colour and the base date the muted one, so the
      later snapshot is the emphasised series
- [x] ✅ Chart keyed per mode (Apex drops function options on `updateOptions`; upstream keeps its
      own `chartKey` for the same class of problem)

## §D Group change over time

- [x] ✅ Section heading
- [x] ✅ 5 × 5 base-group → comparison-group transition data, all 25 values
- [x] ✅ Two views toggled by one control
- [x] ✅ Table view: `From / To` + one column per target group, unsorted, right-aligned numerics
- [x] ✅ Toggle re-projects the same model, no refetch
- [x] ✅ Explains the 2,130 acquired contacts that make the columns not sum to the comparison totals
- [x] 🔀 **Chart view is a From/To matrix, not a Sankey.** ApexCharts cannot render a Sankey; per
      the agreed decision the chart half reuses the same matrix primitive as §B, so the page has one
      charting vocabulary and no second chart dependency. All 25 transition values are present in
      both views. `MpSankeyChart` logged in GAPS.md
- [x] 🔀 View toggle is `MpSegmentedControl` (`Matrix` / `Table`), not a switch labelled "Table Mode"
- [ ] ⚠️ Sankey-specific interactions not reproduced (no Sankey): node click → highlight connected
      links + dim the rest (`updateHighlight` / `isConnected`), and the log-scaled node/link
      thicknesses. The matrix's hover readout is the equivalent affordance
- [ ] ⚠️ The five per-group brand colours (`#03B6FC`, `#F53BAD`, `#29993E`, `#3D40C6`, `#F2B500`)
      are **not used** — they existed to identify Sankey nodes. Recorded in AUDIT §4 for whoever
      builds the Sankey; deliberately not added to `tokens.json` while nothing consumes them

## §E Average performance

- [x] ✅ Section heading
- [x] ✅ All 7 columns: Group · Days since purchase · Total orders · Placed order revenue ·
      Abandoned carts · Site visits · Click rate
- [x] ✅ 5 rows, one per group
- [x] ✅ Base-date / comparison-date snapshots, both prefetched, switching with no refetch
- [x] ✅ Every column unsorted (`sortable: false`), as upstream
- [x] ✅ `Days since purchase` preserves upstream's mixed type — `'180+'` for Inactive alongside
      numbers
- [x] 🔀 Snapshot switch is `MpSegmentedControl` (`Base date` / `Comparison date`) instead of two
      `v-btn`s in a `v-slide-group` driving a `v-window` — fixes the missing tab semantics
- [x] 🔀 Column renamed `Site visit` → `Site visits` (it is an average count, not one visit)
- [x] 🔀 Revenue rendered as currency via the shared `formatCurrency`; upstream prints a bare float
- [x] 🔀 Caption names which date is shown, which upstream's toggle does not

## GROUPS drawer (F1)

- [x] ✅ Opens from the header action; right-side drawer via `MpFormDrawer` (`size="sm"`, `guarded`)
- [x] ✅ Title `Groups` + description
- [x] ✅ Five fields labelled with the **default** group names, prefilled with current aliases
- [x] ✅ Snapshots on open, so Cancel and dirty-tracking are correct across visits
- [x] ✅ Required → `Group name is required`
- [x] ✅ Duplicate → `Group name already exists` (case-insensitive; flags **both** clashing fields,
      where upstream flagged one)
- [x] ✅ Emoji → 🔀 `Emojis aren’t supported in group names`
- [x] ✅ Save disabled while pristine or invalid
- [x] ✅ Save shows a pending state, then closes with a success toast
- [x] ✅ Saved names propagate to both matrices, §C, §D headers and §E (verified live)
- [x] 🔀 `RESET` → `Restore defaults`, behind a confirm dialog, and disabled when already at
      defaults. Upstream's button restores shipped defaults — not the last-saved values — with no
      confirmation, so it silently destroys a merchant's saved vocabulary
- [x] 🔀 Dirty close (X / Esc / scrim / Cancel) raises a discard confirmation. Upstream tracks
      dirtiness but no guard was observed
- [x] 🔀 `maxlength` + counter of 40 added (upstream has neither, so a name could be any length)
- [ ] 🧩 Save is mocked (600 ms). Upstream's `saveGroupAliases` success/error handling was
      **never executed** during the crawl — a live account rename — so there is nothing to match
- [ ] ⚠️ No error/retry path, because upstream's failure behaviour is unknown

## SETTINGS drawer (F2)

- [x] ✅ Opens from the header action; `MpFormDrawer` (`size="md"`, `guarded`)
- [x] ✅ Title 🔀 `RFM settings` + description
- [x] ✅ Three sections: `Recency definitions` · `Frequency definitions` · `Monetary definitions`
- [x] ✅ Full model: recency highest/average/lowest score days; frequency most/averagely frequent;
      monetary highest/average spender
- [x] ✅ `Value is required`, `Enter a valid number`, `Enter a value greater than 0`,
      `Only positive numbers are allowed` (🔀 trailing periods dropped for consistency)
- [x] ✅ `Recency days can’t exceed 1000` (`ERFM_MAX_RECENCY_DAYS`)
- [x] ✅ Decimals accepted, matching upstream's `isNumberRule`
- [x] ✅ Cross-field ordering rules on all three groups
- [x] ✅ Acknowledgement checkbox gates Apply (verified: valid + unacknowledged → Apply disabled)
- [x] ✅ Apply shows a pending state, then closes with a success toast
- [x] ✅ Dirty close raises a discard confirmation
- [x] 🔀 The recalculation warning is an `MpAlert tone="warning"`; the checkbox gets the short name
      `I understand the report will be recalculated`. Upstream uses the entire 60-word paragraph as
      the checkbox's label — i.e. as its accessible name
- [x] 🔀 Grammar fixed in that warning: "definitions that **was** active" → "**were** active"
- [x] 🔀 The three ordering messages rewritten. Upstream reads `value must be greater value of
      score of 2`, `value must be less than value of scores of 3`, `value must be greater than the
      values of score of 2 and score of 3`; nothing in the UI is labelled "score of 2". Now each
      names its sibling field, e.g. `Must be fewer days than the average-score band`
- [x] 🔀 Sections open by default. Upstream opens all three collapsed, so the drawer greets you
      with three closed rows and no visible settings
- [ ] 🔎 **Field labels, order, and units are reconstructed, not observed.** Upstream's
      `fetchERFMSettings` never resolved during the crawl, so the live form was never rendered.
      Labels are derived from the confirmed state keys; `days` / `orders` / `$` affixes are inferred
      from those names. Cheap to correct once the backend is reachable
- [ ] 🔎 **The ordering direction is inferred.** Upstream's messages are too garbled to recover it,
      so the bands run highest < average < lowest in days (fewer days = better recency score), and
      most-frequent > averagely-frequent, highest-spender > average-spender. This matches the field
      names and a standard RFM model but was not confirmed against upstream
- [ ] 🔎 The exact gating chain (`readyToEdit` / `formInteracted` / `rfmCheckbox` /
      `enableCheckbox` — four flags upstream) is collapsed to one acknowledgement gate; the real
      interaction between them was untestable without loaded data
- [ ] 🧩 Apply is mocked (700 ms) and does **not** recalculate the matrices. Upstream's `onSubmit`
      was never executed — it is an irreversible, account-wide recalculation
- [ ] ⚠️ Upstream's own unhandled third state (settings fail to load → empty sections, no error) is
      deliberately **not** reproduced; the sandbox always has settings

## States

- [x] ✅ Loading — `MpTableSkeleton` in all four data sections, driven by `useInitialLoad`
- [x] ✅ Empty — `MpEmptyState` when the comparison window has no contacts (verified by zeroing the
      store). §A stays visible so the dates can be changed to recover
- [x] ✅ Pending — both drawer submits show a button spinner and disable their forms
- [x] ✅ Success — toast on group save, settings apply, and segment prefill
- [x] ✅ Validation — every rule in both drawers fires and blocks submission (all verified live)
- [x] ✅ Disabled — Create segment, Save, Apply, Restore defaults, Reset all gate correctly
- [x] ✅ Focus — `MpFormDrawer` traps focus, returns it to the trigger, Esc routes through the guard
- [ ] ⚠️ Error states are **not** built. Nothing upstream's error handling could be copied from: the
      two write paths were never executed, and the report's own fetch-failure UI was never seen
- [ ] ⚠️ Stale-data signal (`isDataOld` / `disableRefresh`, fed by `check_backdated_orders.json`)
      **not built** — the flags were false all session and forcing them was reverted before any UI
      rendered, so its shape, copy and refresh affordance are entirely unknown. This is the one
      whole upstream feature the rebuild omits. See FLOWS.md F9
- [ ] ⚠️ Permission-restricted variant not built (only one role was available)

## Accessibility

- [x] ✅ Both canvases replaced by keyboard-operable, screen-reader-readable markup — the audit's
      largest defect
- [x] ✅ Matrix is a `<table>` with `<th scope="col">` / `<th scope="row">`, so every cell announces
      its group and engagement level
- [x] ✅ Per-cell accessible names, e.g. *"Recent, Engaged: 2,240, up 19.1%. Select this cohort"*
- [x] ✅ `aria-pressed` reflects matrix selection
- [x] ✅ Visually-hidden `<caption>` names each matrix
- [x] ✅ Colour is never the only encoding — every cell prints its figure, and a scale legend exists
- [x] ✅ Every input has a real `<label>` (verified: 5/5 in the groups drawer, 7/7 in settings)
- [x] ✅ Segmented controls carry a required `ariaLabel`; they replace three button/switch patterns
      that had no group semantics
- [x] ✅ Drawers are `role="dialog"` + `aria-modal="true"` with a focus trap
- [x] ✅ `MpSectionHeader` emits `role="heading"` with a correct `aria-level`; Create segment nests
      at level 3
- [x] ✅ Visible focus rings on matrix cells (`:focus-visible`, 2px `--accent`, offset)
- [x] ✅ `npm run contrast:check` — 244/244 enforced pairs pass, no new tokens introduced
- [x] ✅ Zero hardcoded colours, spacing or radii; cell fills come from the shipped
      `tintHex` / `readableInkOn` mechanism, which is theme-correct in light and dark

## Responsive

- [x] ✅ No horizontal page overflow at 375px (verified `scrollWidth === clientWidth === 375`)
- [x] ✅ Both matrices scroll inside their own `overflow-x: auto` containers
- [x] ✅ In-cell percentage deltas drop below 560px via a container query; the readout still gives
      exact figures
- [x] ✅ Section headers wrap their controls (🔀 local fix — `MpSectionHeader` has no `flex-wrap`
      and a `flex-shrink-0` actions slot, so wide actions overflow for every consumer; logged in
      GAPS.md rather than changed)
- [x] ✅ The three-segment control scrolls in place below ~480px, where it is wider than the card
- [x] ✅ Date fields stack; the decorative `vs` is hidden once they do
- [x] ✅ Verified at 375px and desktop

## Mock data

- [x] ✅ Lives in `useAnalytics` as typed refs, no inline literals in the view (playbook §6)
- [x] ✅ Shapes, group keys, engagement levels, column sets and per-section models all match
      upstream
- [x] ✅ **Internally consistent**: every `erfmTransitions` row sums to that group's base total;
      every column sums to its comparison total except `inactive`, which falls short by exactly the
      2,130 contacts acquired between the dates — the same pattern the live data shows, and why
      upstream needs an "Added or dropped" view
- [x] 🔀 **Plausible figures, not the live account's.** UAT account 116000 is pathological — 99.99%
      Inactive, Champions empty, a 213,726,411.91 revenue figure, and `'180+'` in a numeric column.
      Reproducing it would render the page as one saturated cell and hide the design. The rebuild
      keeps the shape and the skew's *direction* (Inactive largest) at a realistic magnitude.
      Stated as an assumption in AUDIT §8 and not overridden
- [x] ✅ `'180+'` retained for Inactive, so the mixed-type column is still exercised
- [x] ✅ `rfmSegments` / `rfmAnalyzed` **kept** in the store — `src/composables/useWidgetData.ts`
      still consumes them for a dashboard widget, so they are not orphaned by this change
