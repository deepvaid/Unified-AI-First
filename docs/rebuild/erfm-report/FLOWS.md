# FLOWS — eRFM Report (`/accounts/:accountId/erfm_report`)

One entry per action reachable from the audited page. States noted inline.

**Legend:** ✅ walked end-to-end · ⚠️ walked up to the last safe step · ⛔ not executed (write /
irreversible) · 🚫 blocked by tooling

**Crawl constraint:** no screenshots were possible (the page never reaches `document_idle`), so
every step below was verified through the live DOM and the live Vue component tree rather than
visually. Drawer opens were driven through the page's own `openGroupDrawer()` /
`openSettingsDrawer()` handlers; validation was verified by mutating the real form model and
invoking the real rules.

---

## F1 · Header → `GROUPS` ⚠️ (walked to the last safe step; SAVE not executed)

**Trigger:** `v-btn variant="outlined"` `[mdi-format-list-bulleted]` `GROUPS` in the page header
→ `ErfmReportPage.openGroupDrawer()` → `groupDrawerOpen = true` → `ErfmGroupDrawer`.

1. **Open.** Right-side temporary `v-navigation-drawer` (`AppDrawerWrapper`).
   - Title `Groups`, description `Rename the groups here.`
   - Body: five text fields, labelled with the **default** group names —
     `Champions`, `Loyal`, `Recent`, `Need Attention`, `Inactive` — prefilled with the account's
     current aliases (`Champ Value`, `Loyal Value`, `Recent Value`, `Attention Value`,
     `Inactive Value`).
   - Footer: `CANCEL` · `RESET` · `SAVE`.
   - **Initial state:** `valid: true`, `SAVE` **disabled** (pristine). `preGroupData` snapshots the
     values on open, so the drawer knows what "changed" means.
   - No `<label>` element on any of the five inputs; no `maxlength`, no character counter.

2. **Decision point — edit a name.**
   - **Valid edit** → `SAVE` enables.
   - **Empty** → field error `Group name is required`; `valid: false`; `SAVE` stays disabled.
   - **Duplicate of another group's current value** → field error `Group name already exists`.
   - **Contains an emoji** → field error `You cannot use emojis in this field.`
   - Confirmed live by setting `loyal: 'Champ Value'`, `recent: ''`, `inactive: 'Sleepy 😴'` and
     validating: fields 1, 2 and 4 went to `v-input--error` with exactly those three messages,
     `valid` went `false`, `SAVE` remained disabled.
   - Rules are per-field and evaluate on change; there is no cross-field summary and no error
     banner at the top of the drawer.

3. **Decision point — `RESET`.** ✅ Confirmed: `onReset()` sets the model to the **system default
   names** (`Champions` / `Loyal` / `Recent` / `Need Attention` / `Inactive`) — **not** the values
   present when the drawer opened. There is no confirmation prompt. This is the flow's sharpest
   trap: a merchant using RESET to undo typing loses their saved vocabulary instead.

4. **Decision point — `CANCEL`.** ✅ Confirmed: `onCloseDrawer()` closes the drawer and
   `groupDrawerOpen` returns to `false`. No unsaved-changes prompt was observed — but the drawer
   *does* track dirtiness (`isChanged`, `preGroupData`), so a guard may exist behind a path not
   reached. Treated as unconfirmed.

5. **Terminal step — `SAVE`.** ⛔ **Not executed.** `saveGroupAliases()` writes new aliases for
   account 116000; every group label across this report (and the heatmap axis, Sankey nodes, both
   table header sets) is derived from it. Renaming a live UAT account's segment vocabulary is an
   outward-facing write with no in-page undo, so the crawl stopped here.
   - **Unknown:** success feedback (toast? drawer auto-close? in-place refresh of the five
     sections via `onGroupUpdated`?), the failure path, and whether `loading` renders a button
     spinner or a drawer-wide overlay.
   - **Known:** the page exposes `onGroupUpdated`, so a successful save is expected to push new
     labels into all five sections without a page reload.

**Exit:** drawer closes; user is back on the report at the same scroll position.

---

## F2 · Header → `SETTINGS` ⚠️ (opened; form never populated; APPLY not executed)

**Trigger:** `v-btn variant="outlined"` `[mdi-cog]` `SETTINGS` → `openSettingsDrawer()` →
`settingsDrawerOpen = true` → `ErfmSettingsDrawer`.

1. **Open.** Right-side temporary drawer.
   - Title `RFM Settings`, description `Configuration / setup the RFM module.`
   - Three collapsible sections, **all collapsed on open**:
     `Recency Definitions` · `Frequency Definitions` · `Monetary Definitions`.
   - An acknowledgement checkbox whose label is the full recalculation warning:
     *"If you change the RFM definitions, the chart will be recalculated for the current 90-day
     period based on your updated definitions. Historical RFM data is stored with the definitions
     that was active at that time. Therefore, data saved under different criteria cannot be
     combined or viewed together in a single chart."*
     Observed **disabled** (`readyToEdit: false`).
   - Footer: `CANCEL` · `APPLY`.

2. **Loading state.** 🚫 `fetchERFMSettings()` never resolved during the crawl — the UAT backend
   was degraded and every `erfm_reports/*` request issued from the page hung. All nine values
   stayed `null` and the three expanded sections rendered **empty**. `loading` was `false`, so the
   drawer showed neither data nor a spinner nor an error — an unhandled third state.
   - Expanding all three sections manually (`showRecency` / `showFrequency` / `showMonetary` →
     `true`) produced no fields, confirming the sections are gated on loaded data
     (`showComponent`).

3. **Decision points — the definition fields.** Model shape confirmed from live state; **field
   labels, order, units/suffixes and section grouping are unverified** (see AUDIT §9 #2):
   - `recency: { highestScoreDays, averageScoreDays, lowestScoreDays }`
   - `frequency: { mostFrequent, averagelyFrequent }`
   - `monetary: { highestSpender, averageSpender }`

4. **Validation** ✅ (rules invoked directly; messages verbatim):
   - empty → `Value is required.`
   - non-numeric (`abc`) → `Please enter a valid number.`
   - `0` → `Please enter a value greater than 0.`
   - negative → `Only positive numbers are allowed.`
   - `> 1000` → `Recency days cannot exceed 1000`
   - decimals (`1.5`) → **pass**
   - ordering rules (each compares against its siblings, arity 2 for the first two):
     - `highestScoreRule` → `value must be greater value of score of 2`
     - `averageScoreRule` → `value must be less than value of scores of 3`
     - `lowestScoreRule` → `value must be greater than the values of score of 2 and score of 3`
   - So the three recency bands must be strictly ordered; the messages name "score of 2 / 3",
     which appears nowhere in the UI.

5. **Gate — the acknowledgement checkbox.** `readyToEdit`, `formInteracted`, `rfmCheckbox` and
   `enableCheckbox` all exist and were all `false`. The precise gating chain (which flag unlocks
   the fields vs. which unlocks `APPLY`) could not be exercised without loaded data. Unverified.

6. **`CANCEL`.** ✅ Confirmed: `onCloseDrawer()` closes; `settingsDrawerOpen` → `false`.

7. **Terminal step — `APPLY`.** ⛔ **Not executed.** `onSubmit()` rewrites the account's RFM
   scoring definitions. By the drawer's own warning this **recalculates the model for the current
   90-day period** and permanently splits historical data across two definition sets that "cannot
   be combined or viewed together in a single chart". That is an irreversible, account-wide
   analytics mutation, so the crawl stopped here.
   - **Unknown:** confirmation step (the warning checkbox may be the only one), success feedback,
     failure handling, and whether the report refetches in place.

**Exit:** drawer closes; report unchanged.

---

## F3 · §A `Base Date` / `Comparison Date` ⚠️ (opened; dates not changed)

**Trigger:** either readonly text field (`mdi-calendar` append) → `v-menu` → `AppDatePicker`.

1. Field is `readonly`, so typing is impossible; the menu is the only input path.
2. Constraints, read live from `ErfmReportPage`:
   - `minimumBaseDate` `2025-07-29` (~13 months back)
   - `maximumBaseDate` `2026-08-29` — exactly comparison date − 1 day
   - so **base must strictly precede comparison**, enforced by picker bounds rather than by a
     validation message.
3. `onBaseDateChange` re-derives the bounds when either date moves.
4. **Committing a date** refetches all five section endpoints for the new window
   (`erfm_insights`, `contact_distribution`, `group_split_metrics`,
   `check_backdated_orders`, `average_performance_metrics`) plus `group_aliases` per section.
5. ⚠️ **Not exercised.** Changing the window would have fired five requests against the degraded
   backend and lost the populated state the rest of the crawl depended on. Bounds, wiring and
   refetch set are confirmed from state and from the observed request list; the picker's rendered
   UI, its disabled-day treatment, and the loading transition are **unverified**.
6. **Unknown:** whether an invalid pair is reachable at all, and what the page shows between
   request start and render (per-section `loading` refs exist; no skeleton observed).

**Exit:** menu closes, dates update, sections refetch in place. No route change.

---

## F4 · §B Heatmap cell → `Create Segment` → `CREATE` ⚠️ (form walked; CREATE not executed)

This is the page's primary task.

1. **Entry A — click a heatmap cell.** `HeatmapChart.onClick` → `EngagementInsight.setSegment` →
   populates `segment = { group, engagement }`, which is bound to the two selects.
   - 🚫 Not clickable during the crawl: the heatmap is an ECharts **canvas** and cell hit-testing
     needs a real pointer event at computed coordinates, which requires the screenshot path that
     was unavailable. Wiring confirmed from the component tree; the click was not performed.
   - Note: there is **no keyboard equivalent** for this entry point.
2. **Entry B — the dropdowns.** ✅ Both confirmed populated and required:
   - `Select RFM Attribute *` — 5 items, `{ id, name }` over the group keys.
   - `Select Engagement Attribute *` — 6 items, the engagement strings including `Total`.
3. **State — pristine.** `segment = { group: '', engagement: '' }`; `CREATE` **disabled**
   (confirmed `disabled: true` in the DOM); `RESET` enabled.
4. **Decision point — partial selection.** One select filled → `isFormValid` false → `CREATE`
   stays disabled. Each select carries exactly one rule (required).
5. **Decision point — `RESET`.** `resetSegment()` clears both selects and re-disables `CREATE`.
6. **Terminal step — `CREATE`.** ⛔ **Not executed** (it navigates away and would have ended the
   crawl). Behaviour confirmed by reading `createSegment`:
   - Builds a segment definition: a `Contact Attributes` group containing an `RFM Group` condition
     and an `Engagement Level` condition, pinned to a `specific date`.
   - Segment name is templated `Segment <group> and <engagement> on <date>`.
   - `router.push` → **`Next_gen_segments`** (the next-gen segment builder). No `window.open`.
   - **It does not save a segment** — it hands a prefilled draft to the builder. So the flow is
     non-destructive, but it is a route change out of the report.
7. **Exit / return path.** User lands in the segment builder with the definition prefilled. There
   is **no back link to the report** in the pushed payload; returning means browser-back or
   re-navigating via Analytics → eRFM Report. Worth fixing in the rebuild.

**Unknown:** whether the builder's prefill survives a reload, and whether an
already-existing same-name segment is handled.

---

## F5 · §B `Revenue` switch ⚠️

1. **Trigger:** `v-switch` labelled `Revenue`, default **off**, in the §B section header.
2. Swaps the metric the heatmap cells present. Each cell already carries a contacts count and a
   second numeric (percentage change), and `visualMap.max` is a contacts figure (`491354`), so the
   switch is expected to re-key both cell labels and the colour scale to revenue.
3. ⚠️ **Toggled but not read back** — the tab's renderer went unresponsive before the re-render
   could be captured, and the tab was then recycled. Effect is inferred, not observed.
4. **Unknown:** whether it refetches or re-projects client-side, what the cell label format becomes,
   and whether `visualMap.max` rescales.

---

## F6 · §C Distribution metric select ⚠️

1. **Trigger:** unlabelled `v-select` in the §C header, default `Contacts`.
2. Items ✅ confirmed: `Contacts` · `Added or Dropped` · `Percentage Change`.
3. Each maps to its own component — `ContactsChart` · `AddedOrDroppedChart` ·
   `PercentChangeChart` — all fed from the same `distribution[]` / `item[]` models, so switching is
   a client-side re-projection with **no refetch**.
4. `Contacts` mode ✅ fully captured: Chart.js grouped bar, labels = 5 group names, two datasets
   (base `#35C5FD`, comparison `#006BAF`), `data` log-scaled, `originalValue` holding the true
   counts, `minBarLength: 1` so a zero group still shows a sliver.
5. ⚠️ The other two modes were **not rendered** during the crawl — axes, sign handling for negative
   "dropped" values, and whether they also log-scale are unverified.

---

## F7 · §D `Table Mode` switch + Sankey interaction ⚠️

1. **Trigger:** `v-switch` labelled `Table Mode`, default **off** → `SankeyChart` shown
   (`showSankey: true`).
2. **Sankey (default)** ✅ data fully captured: two columns, depth 0 = base date, depth 1 =
   comparison date; comparison-side node names suffixed `1` for uniqueness; node `value` log-scaled
   with `realVal` carrying truth; five group colours; depth-0 labels left, depth-1 right.
3. **Sankey node click** — `handleClick` → `updateHighlight` / `isConnected` + the
   `activeNode` / `inactiveNode` option groups: selecting a node highlights it and its connected
   links and dims the rest. `selectedNode` holds the selection; `handleResize` re-lays out.
   ⚠️ Wiring confirmed from state; the click itself needs canvas hit-testing and was not performed.
4. **Switching on `Table Mode`** → `GroupChangeTable`, a 5 × 5 From/To transition matrix.
   Headers and row model ✅ captured (`From / To` + one column per target group, `width: 185`,
   `sortable: false`, `schema: { type: 'number' }`); the rendered table ⚠️ was not seen.
5. `chartKey` is toggled to force a chart remount on switch-back — an implementation detail worth
   preserving as "the chart re-lays out correctly after being hidden".
6. **No refetch** on toggle; both views read the same model.

---

## F8 · §E `BASE DATE` / `COMPARISON DATE` toggle ✅

1. **Trigger:** two `v-btn variant="text"` inside a `v-slide-group`, driving a `v-window` with two
   `v-window-item`s. `activeTab` observed as `'base'`.
2. `BASE DATE` shows `baseItems`, `COMPARISON DATE` shows `comparisonItems` — both prefetched from
   `average_performance_metrics.json`, so switching is **instant with no refetch**.
3. Both tables share one header set (7 columns, all `sortable: false`, `missingIndicator: '0'`).
4. ✅ Both models captured. The base table's rendered values are recorded verbatim in AUDIT §4.
5. **Accessibility note carried into the rebuild:** this is a tab pattern built from buttons, so it
   most likely lacks `role="tab"` / `aria-selected` / arrow-key navigation.

---

## F9 · Stale-data / refresh signal ⛔🚫

1. The page owns `isDataOld` and `disableRefresh`, and fetches
   `check_backdated_orders.json?base_date&comparison_date` on load — i.e. it detects that orders
   were **backdated into the selected window** after the RFM snapshot was computed, which would
   make the displayed figures stale.
2. Both flags were `false` for the whole session, so the associated UI never rendered. Forcing them
   client-side was reverted by the owning effects before a render could be captured.
3. **Unknown and material:** whether this surfaces as a banner, an inline alert, or a refresh
   button; its copy; and what `disableRefresh` gates. No refresh control was visible in the
   default state — the header contains only `GROUPS` and `SETTINGS`.
4. This is the one whole feature of the page that the crawl could not characterise at all.

---

## F10 · Empty and error states ⛔🚫

1. `EngagementInsight` owns `dataNotFound`; each of the four data sections owns its own `loading`.
2. Neither was reachable: the account has data, and forcing the flags was reverted by the owning
   effects.
3. The one **error-shaped state actually observed** was unhandled: with `fetchERFMSettings` hung,
   the SETTINGS drawer showed empty sections with `loading: false` and no error message — so a
   failed settings load is silently indistinguishable from "no settings configured".
4. **Unknown:** empty-state copy and illustration, per-section skeletons, and any error/retry
   affordance.

---

## Unverified inventory (with reasons)

| Flow | Step | Reason |
|---|---|---|
| F1 | `SAVE` outcome | ⛔ Write — renames a live UAT account's segment vocabulary, no in-page undo |
| F1 | Unsaved-changes guard on `CANCEL` | Dirty tracking exists but the guard path was not triggered |
| F2 | Entire populated form | 🚫 Backend hung; `fetchERFMSettings` never resolved |
| F2 | `APPLY` outcome | ⛔ Irreversible — recalculates the account's RFM model and splits history across definition sets |
| F2 | Acknowledgement gating chain | Untestable without loaded data |
| F3 | Picker UI, disabled days, refetch transition | ⚠️ Would have fired 5 requests at a degraded backend and destroyed crawl state |
| F4 | Heatmap cell click | 🚫 Canvas hit-test requires the screenshot path, which was unavailable all session |
| F4 | `CREATE` landing screen | ⛔ Navigates away; would have ended the crawl |
| F5 | `Revenue` switch result | ⚠️ Renderer went unresponsive before read-back |
| F6 | `Added or Dropped`, `Percentage Change` | ⚠️ Not rendered during the crawl |
| F7 | Sankey node highlight; rendered table | 🚫 Canvas hit-test / ⚠️ not rendered |
| F9 | Stale-data UI entirely | Flags never true; forcing was reverted |
| F10 | Empty state, loading skeletons | Flags never true; forcing was reverted |
| all | Screenshots, a11y tree, responsive breakpoints | 🚫 Page never reaches `document_idle`; all three tools timed out |
