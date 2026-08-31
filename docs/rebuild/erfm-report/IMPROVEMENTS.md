# IMPROVEMENTS — eRFM Report rebuild

Every change beyond straight replication, with why. Copy changes are marked 🔤 for review.

---

## Accessibility

1. **Both canvas visualisations became real markup.** Upstream renders the 36-cell matrix and the
   Sankey as ECharts canvases: no accessible name, no text alternative, no tab stops. Every figure
   on the page's primary visual — including the grand total — was unavailable to a screen reader
   and unreachable by keyboard. The matrix is now a `<table>` of `<button>` cells with
   `<th scope="col">` / `<th scope="row">`, so each cell announces its group and engagement level.
2. **The page's primary action became keyboard-reachable.** "Click a cell … to create a segment"
   was a canvas hit-test with no keyboard path — the dropdowns were the only accessible route, and
   the instruction pointed at the inaccessible one first. Cells are now buttons with
   `aria-pressed`, and the copy names both paths.
3. **Per-cell accessible names carry the whole reading**, e.g. *"Recent, Engaged: 2,240, up 19.1%.
   Select this cohort"* — so a screen-reader user gets the value, the change and the affordance
   without seeing colour.
4. **A colour-scale legend was added.** Upstream sets `visualMap.show: false`, so its heat ramp had
   no key at all. Colour is also never the sole encoding now — every cell prints its figure.
5. **The 60-word warning stopped being a checkbox label.** In upstream's settings drawer the entire
   recalculation paragraph *is* the checkbox's accessible name. Split into an `MpAlert
   tone="warning"` plus a short checkbox name, so the control is nameable and the warning is
   readable as prose.
6. **`BASE DATE` / `COMPARISON DATE` gained real semantics.** Upstream builds that tab pattern from
   two `v-btn`s in a `v-slide-group` driving a `v-window` — no `role="tab"`, no `aria-selected`, no
   arrow keys. Now an `MpSegmentedControl`, which owns those semantics.
7. **Every input has a real `<label>`.** Upstream's five group fields and two date fields had no
   `<label>` element — the names were adjacent text. Verified 5/5 and 7/7 in the rebuild.
8. **Section headings are real headings** (`MpSectionHeader` → `role="heading"` with `aria-level`),
   where upstream used `text-h5` / `text-h6` spans and had no heading outline.
9. **Visible focus rings** on every matrix cell, and focus is trapped in both drawers and returned
   to the trigger on close (`MpFormDrawer`).

## Flow

10. **`RESET` → `Restore defaults`, with a confirm.** 🔤 The most consequential fix here. Upstream's
    button restores Maropost's *shipped* names, not the values the merchant last saved, with no
    confirmation — so a merchant clicking it to undo their typing silently loses the vocabulary
    they saved months ago. Now honestly labelled, gated behind `MpConfirmDialog`, and disabled when
    already at defaults.
11. **Dirty-close guards on both drawers.** Upstream's group drawer tracks dirtiness
    (`isChanged`, `preGroupData`) but no discard guard was observed, so an accidental Esc dropped
    edits. Both drawers now confirm before discarding.
12. **The Total row is no longer selectable.** Upstream's matrix lets you click a "Total × Total"
    cell, but "all groups" is not one of the five values the RFM attribute select accepts — so it
    offered a cohort that cannot be built. The Total *column* stays selectable, because `Total` is
    a genuine engagement option. Totals still show their figures.
13. **Settings sections open by default.** Upstream opens all three collapsed, so the drawer greets
    you with three closed rows and nothing to act on.
14. **Save/Apply gate on validity *and* dirtiness**, with a pending state on the button, so the
    mocked round-trip is visible rather than instantaneous.
15. **Both group fields flag a duplicate**, not just the one being edited — the clash is symmetric,
    so showing it on one field made the other look fine.
16. **A `maxlength` of 40 and a character counter** on group names. Upstream has neither, so a
    group name could be arbitrarily long and silently break the matrix axis it labels.

## Copy 🔤

17. **Title split into title + subtitle.** `eRFM Report (Engagement, Recency, Frequency, and
    Monetary)` is a definition wearing a title's clothes; the parenthetical is now the subtitle.
18. **Three scoring messages rewritten.** Upstream: `value must be greater value of score of 2`,
    `value must be less than value of scores of 3`, `value must be greater than the values of score
    of 2 and score of 3` — broken grammar, lowercase, and referring to a "score of 2" that appears
    nowhere on screen. Each now names its sibling field, e.g. `Must be fewer days than the
    average-score band`.
19. **Grammar fixed in the warning the merchant is asked to accept**: "the definitions that **was**
    active" → "**were** active".
20. **Message punctuation made consistent.** Upstream mixes `Group name is required` (no period)
    with `You cannot use emojis in this field.` (period), and `Recency days cannot exceed 1000`
    (none) with `Value is required.` (period), inside the same two forms. All field messages now
    run without a trailing period.
21. **`Emojis aren’t supported in group names`** replaces `You cannot use emojis in this field.` —
    says which field and which rule.
22. **Date-window helper states the limit.** Upstream's *"Use these specific dates to see the
    number of contacts in segment groups and compare changes"* describes the mechanism; the rebuild
    says what it's for and adds the 13-month history bound, which upstream leaves invisible until a
    date is refused.
23. **`Site visit` → `Site visits`** — it is an average count, not a single visit.
24. **Switch labels became mode labels.** "Revenue" and "Table Mode" are nouns that never say which
    state is active; now `Contacts / Revenue` and `Matrix / Table` segmented controls.
25. **Each section says what it is showing** — which date the performance table is for, what the
    matrix's figures and deltas mean, and where the acquired contacts in §D come from. Upstream
    leaves all of this to be inferred.
26. **Empty state is actionable**: *"Pick an earlier base date, or check back once this account has
    orders in the window"* — and §A stays on screen so the dates can actually be changed.

## Visual / consistency

27. **One charting vocabulary.** §B and §D share the same matrix primitive, so the page reads as one
    system. (Also the agreed consequence of using ApexCharts, which has no Sankey.)
28. **Linear axis in §C instead of upstream's log transform.** Upstream pre-log-transforms the bars
    (keeping truth in `originalValue`) because its live account is 68,000× skewed. With realistic
    data that transform actively misleads — a 10× difference would render as ~2×. Tied to the
    mock-data decision; if pathological data ever loads, the log scale should come back **with a
    label**, which upstream also lacks.
29. **The comparison date is the emphasised series.** The theme's palette pairs a blue with a grey;
    upstream's ordering left the *older* date coloured and the newer one grey. Swapped, so the
    snapshot the whole report is about reads as the subject.
30. **Currency is formatted.** Upstream prints `1136.4` and `213726411.91` raw in a revenue column;
    the rebuild uses the shared `formatCurrency`, and numerics are right-aligned with tabular
    figures throughout.
31. **Card insets, gaps and radii come from `component.card.*` / `component.field.*` tokens** — no
    `pa-*` utility on a card root, no px literal anywhere in the page or its components.
32. **Section headers wrap their controls.** `MpSectionHeader`'s root has no `flex-wrap` and its
    actions slot is `flex-shrink-0`, so a wide action overflows its card below ~480px. Fixed locally
    with a wrapping row rather than changing a component every page shares — logged in GAPS.md.

## Interaction feedback

33. **Loading skeletons in all four data sections** (`MpTableSkeleton`, which is row×column shaped
    and so fits the matrices as well as the tables). Upstream has per-section `loading` refs but no
    skeleton was ever observed.
34. **Hover/focus readout under each matrix** giving the exact figure, its share of the total and
    its change — replacing a canvas tooltip that keyboard users could not summon.
35. **Zero reads as an em dash, not `0`.** A matrix with many zeroes drowns in printed zeroes; the
    same call the shipped `DashboardHeatmapWidget` already made.
36. **Success toasts** on group save, settings apply and segment prefill, so a mocked write is still
    legible as having happened.

## Correctness fixes made during verification

37. **§C chart threw on mount** — `plotOptions.bar.colors` set to `undefined` defeats Apex's default
    merge, and it reads `colors.backgroundBarColors` unconditionally. Both keys are now always
    present.
38. **The axis formatter was silently dropped on mode switch** — Apex's `updateOptions` does not
    replace function properties, so a switched mode kept the previous formatter (percentages
    rendered as `20.00`). The chart is now keyed per mode; upstream keeps a `chartKey` for the same
    class of problem.
39. **The legend markers rendered black** — `chartLegendOptions(palette, chrome, position)` takes a
    palette, and series *names* were being passed as colours.
40. **The settings sections rendered empty** — panel `value`s are strings, and the open-panels model
    was seeded with numbers, so nothing matched.

---

## Things deliberately **not** changed

- **No export action.** Upstream has none on this page, and every other Analytics report does — but
  adding one is a new feature, so it stays out. Recorded as an observation in AUDIT §7.
- **`Days since purchase` still mixes `'180+'` with numbers.** It is upstream's real data shape and
  the column is typed for it; normalising it would hide a genuine data-model issue.
- **`sortable: false` on every column**, matching upstream. These are fixed 5-row matrices, not
  lists.
- **The log-scale labelling improvement was offered and declined**, so no "log scale" annotation was
  added. Moot in §C, which is now linear.
- **The five per-group brand colours are not added to `tokens.json`.** They existed to identify
  Sankey nodes; with no Sankey nothing consumes them. Recorded in AUDIT §4 instead.
- **`formatCompactValue` renders large currency as `$1,117k` rather than `$1.1M`.** That is the
  shared utility's existing behaviour, used by the shipped heatmap widget too; changing it would
  affect other consumers.
- **Upstream's silent settings-load failure is not reproduced** (empty sections, `loading: false`,
  no error) — reproducing a bug is not parity.

## Pre-existing issues found but not touched

- **The dashboard at `/` throws `Cannot read properties of undefined (reading
  'backgroundBarColors')` on every load** — four unhandled promise rejections, from its own Apex
  widgets, before this work existed. It is the same Apex quirk fixed in §C (item 37), so the fix is
  likely a one-line change in the dashboard widget options. Reproduce by loading any route: the
  errors appear even on `monthly_totals`. Out of scope here; worth its own fix.
- **`MpSectionHeader` overflows with any wide action below ~480px** — affects every consumer, not
  just this page. Worked around locally; logged in GAPS.md.
- **`group_aliases.json` is fetched four times per page load upstream** (once per section, since
  each owns its own `groupNames`). Not applicable to the rebuild, which reads one store ref, but
  worth reporting to the platform team.
- **Upstream's date parameter format is inconsistent** — `DD-MM-YYYY` on every eRFM endpoint except
  `average_performance_metrics.json`, which takes `YYYY-MM-DD`. A backend inconsistency, recorded
  in AUDIT §4.
- **Upstream's own data is internally inconsistent** — base Inactive reads 476,886 in
  `contact_distribution` but 476,879 in the Sankey nodes, a 7-contact discrepancy from the same
  request pair.
