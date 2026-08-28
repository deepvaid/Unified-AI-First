# DESIGN_AUDIT.md — Marobase / Maropost Design System

> Read-only Storybook consistency audit, 2026-08-27. Source of truth for design-system findings
> (per CLAUDE.md → "Token discipline"). Check items off as they are fixed. No code was modified
> during this audit.
>
> Method: Glob/Grep-first crawl over `src/components/**`, `src/stories/**`, `src/styles/**`,
> `src/design-tokens/**`, `src/plugins/**`, `.storybook/**`. node_modules/dist/lockfiles untouched.

---

## Section 1 — Component inventory

113 components / 123 story files (`MpListRow` added in Phase 3, `MpDialog` in Phase 4,
`SettingsSidebar` deleted in Phase 4). Every component has a co-located story **except
`DtRingDonut.vue`** (see finding P5-4). Check off each component as its findings are cleared.

### Top-level design system (`src/components/`)

- [x] ModuleLandingPage (story ✓ · `Patterns/ModuleLandingPage`)
- [x] MpBuilderPreviewDialog (story ✓)
- [ ] MpBuilderShell (story ✓)
- [x] MpComingSoonTiles (story ✓)
- [x] MpConfirmDialog (story ✓)
- [x] MpDaVinciBot (story ✓ · lone `AI/` category)
- [x] MpDataTableToolbar (story ✓)
- [ ] MpDateRangeSelect (story ✓)
- [x] MpDialog (story ✓ · **new in Phase 4** — the shared modal shell)
- [x] MpEmptyState (story ✓)
- [x] MpErrorState (story ✓)
- [x] MpFilterTabs (story ✓)
- [x] MpFloatingBulkBar (story ✓)
- [x] MpFolderSelect (story ✓)
- [x] MpFormDrawer (story ✓)
- [ ] MpIllustration (story ✓)
- [x] MpKpiCard (story ✓)
- [x] MpListRow (story ✓ · **new in Phase 3** — shared list-row primitive)
- [x] MpManageFoldersDrawer (story ✓)
- [x] MpMoveToFolderDialog (story ✓)
- [x] MpOptionCard (story ✓)
- [x] MpPageHeader (story ✓)
- [x] MpRowActionsMenu (story ✓)
- [x] MpSectionHeader (story ✓)
- [x] MpSectionRail (story ✓)
- [x] MpSourceCloudChip (story ✓)
- [x] MpStatusChip (story ✓)
- [ ] MpStatusToggle (story ✓)
- [x] MpTableSkeleton (story ✓)
- [ ] MpToastStack (story ✓)
- [ ] MpUsageMeter (story ✓)
- [x] MpWizardSteps (story ✓)

### Layout (`src/components/layout/`)

- [x] AppBar (story ✓)
- [x] AppSidebar (story ✓)

### Copilot (`src/components/copilot/` + `voice/`)

- [ ] DvCampaignCard · DvCampaignOnboardingCard · DvChartCard · DvContentCard · DvDocsAssistant
- [x] DvDraftPreview · DvExpandDialog · DvHistoryDrawer · DvInsightCard · DvKpiRow
- [x] DvLandingHero · DvOnboardingCardShell · DvRefineDialog · DvSegmentCard · DvSetupOnboardingCard
- [ ] DvToastStack · DvToolSteps · DvWidgetDraftCard (18 components, stories ✓)
- [x] voice/: DvIntentCardList · DvOrbCanvas · DvOrbitMicBar · DvOrbitOrb · DvOrbitStatusPill · DvOrbitVoiceSurface · DvOrbitWaveBars (7 components, stories ✓)

### Dashboards (`src/components/dashboards/` + `widgets/`, `wizard/`, `dotted/`)

- [x] DashboardFormDialog · DashboardGrid · DashboardSetupGuide · DashboardWidgetActionMenu · DashboardWidgetCard · WidgetWizardDrawer (stories ✓)
- [x] widgets/: Activity · Attention · BarList · Breakdown · Chart · Donut · Funnel · Gauge · Heatmap · Insights · Kpi · MetricExplorer · Palette · Pie · StackedBar · Table · Tabs (17 components, stories ✓)
- [x] wizard/: WidgetEditStep · WidgetLibraryStep (stories ✓)
- [ ] dotted/: DtDottedBar · DtGauge · DtLegendList (stories ✓) · **DtRingDonut (NO STORY)**

### Marketing (`src/components/marketing/` + `landing/`)

- [ ] JourneyAddStepMenu · JourneyFlowColumn · JourneyMiniPreview (stories ✓)
- [ ] landing/: LandingBlockPalette · LandingBlockSettings · LandingBlockView · LandingInsertionPoint · LandingLayersPanel · LandingPageStylePanel (stories ✓)

### Merchandising / Settings / PLG / RBAC / Sales Channels

- [x] MerchProductCard (story ✓)
- [ ] settings/: SettingsPlaceholder · SettingsSection (~~SettingsSidebar~~ — **deleted in Phase 4**, folded into `MpSectionRail`)
- [x] plg/: Plg3dsDialog · PlgTalkToSalesDialog · PlgTrialBanner · PlgTrialChip (stories ✓)
- [ ] rbac/: InviteUsersDrawer · PermissionMatrix · RolePicker · UserAccessDrawer (stories ✓)
- [x] saleschannels/: AddSectionDialog · MenuPreviewCard · StoreEditorSidebar · StorefrontPreview (exempt, P4-8) · ThemeDaVinciPanel (stories ✓)

### Non-component stories (`src/stories/`)

- [ ] Introduction · DataTablePattern · FormFields · Layering
- [ ] Foundation/: Buttons · Colors · Icons · RadiusShadows · Spacing · Tooltips · Typography

---

## Section 2 — Foundation findings

**Canonical scales — rebuilt in Phase 1, 2026-08-28** (`src/design-tokens/tokens.json` → `generated/`
as `--mp-*` / `$mp-*` / `mp_*`). Naming rule: **primitives are named by their value, roles by their job.**

- `space.*` — 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64, 80 (4px grid ≥16px, 2px half-steps below)
- `radius.*` — 4, 8, 10, 12, 16, 20, full. **One scale** (was two); concentric: 16 outer / 12 nested / 10 controls / 8 chips
- `fontSize.*` — 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40, 48. **Body = 14px** (one canonical body size)
- `text.*` — named roles, every fontSize aliased into the ramp · `display.*` — separate hero ramp (32/44/60/80)
- `component.*` — role aliases: `control.height` 40 · `button.radius` full · `chip` 8 · `input` 10 · `menu` 12 · `card` 16 · `dialog` 16
- Shadows sm/md/lg (+ dark + `buttonInset`) · zIndex ladder · **`motion.*` is the one motion system** (`transition.*` deleted) · layout constants (sidebar 248, rail 72, appbar 60, drawer 480, content 1280)

<details><summary>Pre-Phase-1 state (kept for reference)</summary>

- Spacing (4px base, index-named): `spacing.1`=4 … `spacing.32`=128
- Radius: `borderRadius` sm=4 · md=12 · lg=14 · xl=28 · 2xl=36 · full · chip=8, **plus** a second scale `component.card.radius` sm=10 · md=12 · lg=16 · xl=20
- Type: xs=11 · sm=12 · body=14 · md=16 · lg=18 · xl=24 · 2xl=32 · 3xl=40, **plus** `typography.semantic.body`=13.5

</details>

**State of adoption:** only **5 of 112** components reference `--mp-spacing-*`; **93 of 112** components
contain raw px in style blocks — **1,252** hardcoded padding/margin/gap/radius/font-size declarations total.
The most-used off-scale values are 10px (144×), 6px (113×), 2px (72×), 14px (95×) — a de facto 2px sub-grid
the official scale doesn't include. Fractional font sizes 12.5px (49×), 11.5px (35×), 10.5px (16×) exist in
no scale. An alias layer (`src/styles/mp-theme-aliases.css`, 147 vars) and `global.scss` (64 `!important`s)
sit between tokens and components.

---

## Section 3 — Findings by phase

Format: `[ ] file:line — issue → fix (severity)`

### Phase 1 — Foundations (tokens, global styles, story decorators)

**Status: closed 2026-08-28** — 11 of 13 fixed, 2 scoped out with reasons (P1-8, P1-11).
See the Phase 1 changelog at the end of this file for every rename.

- [x] P1-1 `tokens.json` — two competing radius scales → merged into one value-named `radius.*`
  (4/8/10/12/16/20/full); `component.{button,chip,input,menu,card,dialog}.radius` are now pure
  aliases into it. Every existing reference kept its rendered value except `borderRadius.lg` (14→12,
  2 nested elements in LiveView) and `borderRadius.xl` (28→`full` on a ~56px pill bar — same render).
- [x] P1-2 `tokens.json` — **body is 14px.** `text.body.fontSize` now aliases `{fontSize.14}` instead
  of carrying a 13.5px literal; the 13.5px stop no longer exists anywhere in the system.
- [x] P1-3 `tokens.json` — `component.button.radius.{pill,medium,square}` deleted (all three resolved
  to 9999px, `square` unused); collapsed to a single `component.button.radius` → `{radius.full}`.
- [x] P1-4 unused tokens — **deleted:** `spacing.24`/`spacing.32` (96/128px), `borderRadius.2xl`,
  `zIndex.base`, `transition.*` (duplicated `motion.*`), `color.{light,dark}.daVinci.*`.
  **Kept deliberately:** colour ramp steps (`blue.300`, `neutral.500`, `chart.*.series1-9` — a ramp
  with holes isn't a ramp), `zIndex.dropdown`/`modal` (documentation-only by design), and `layout.*`
  (hardcoded in shell components today; P4-7 adopts them).
- [x] P1-5 **DECISION: 2px half-steps below 16px.** `space.*` gains 2, 6, 10, 14; strict 4px grid at
  16 and above. This legitimizes ~340 of the 455 off-scale declarations, so the Phase 2–4 migration
  is a mechanical rename with no visual change. Values still off even the sub-grid (3px ×21, 5px ×20,
  7px ×18, 9px ×8, 18px ×11, 22px ×9) snap to the nearest stop during those phases.
- [x] P1-6 **DECISION: no fractional font sizes.** `fontSize.*` gains the missing 10, 13, 15, 20, 28,
  48 stops. Phase 2–4 mapping: 10.5→10 · 11.5→11 or 12 · 12.5→12 or 13 · 13.5→13 or 14.
- [x] P1-7 `src/styles/mp-theme-aliases.css` — every alias resolves through tokens.json now:
  `--r-pill`→`--mp-radius-full`, `--r-chip`→`--mp-component-chip-radius`, and `--btn-flat-shadow`'s
  hardcoded `rgba(255,255,255,0.16)` sheen → the new `shadow.buttonInset` token. The one literal
  left (`0 1px 3px` lift geometry) is commented: its colour is the live accent preset, which
  tokens.json cannot express as a single shadow value.
- [ ] P1-8 `src/styles/global.scss` — **scoped out, reason recorded in-file.** All 5 radius overrides
  are now token-driven (`--mp-radius-12`, `--mp-component-chip-radius`, `--mp-component-card-radius`,
  `--mp-component-dialog-radius`, `--r-pill`), but the `!important`s stay: Vuetify emits its own
  `.rounded-*` utilities with `!important`, so specificity never wins, and `.mp-btn--icon` is beating
  an inline style. Retiring them means removing `rounded="lg"` from **631 template sites across 188
  components** — component internals, i.e. Phase 2–4 work, not a foundations pass. The Vuetify SASS
  `$rounded`-map route was rejected: it would retire at most 2 of the 5 while globally redefining
  `.rounded-*` for every element type.
- [x] P1-9 `CLAUDE.md` + `docs/design-system.md` — Key values, the Spacing table and the Border Radius
  table regenerated from tokens.json (radius was documented as 4/8/12/16 vs an actual 4/12/14/28;
  sidebar 260/appbar 56 vs an actual 248/60).
- [x] P1-10 `src/plugins/maropostTheme.ts` — new `component.control.height` (40px) is now shared by
  the VBtn default *and* `settings-form.scss:43`, which duplicated the literal; the off-scale
  `padding-inline: 14px` became `component.button.paddingInline` → `{space.14}` (on-grid under P1-5).
- [ ] P1-11 raw-px migration — **policy recorded, migration is Phases 2–4 by design.** The rule from
  now on: Vuetify utilities in templates, `var(--mp-*)` in CSS, never a raw px literal (documented in
  CLAUDE.md → Styling Rules). Phase 1 built the scale to migrate *onto*; this box closes when P2–P4 do.
- [x] P1-12 `.storybook/` — one decorator owns the canvas. Token padding (`--mp-space-32`), calm
  `--surface-canvas` background, content clamped to `--mp-layout-contentMaxWidth` and centred. The
  imperatively-injected `<style>` block and its magic `calc(100vh - 48px)` are gone, replaced by
  `.storybook/preview.css`. Per-story escape hatch `parameters: { canvas: 'full' }`; the 7 stories
  that redundantly restated the global `layout: 'fullscreen'` now use it.
- [x] P1-13 mechanism split — documented in `CLAUDE.md` → Styling Rules: utilities in templates,
  tokens in CSS, never both for the same property on the same element.

### Phase 2 — Atoms (chips, toggles, buttons, inputs)

**Status: closed 2026-08-28** — all 7 fixed. See the Phase 2 + 3 changelog at the end of this file.

- [x] P2-1 size vocabulary — **one ramp, `sm | md | lg`, default `md`**, across `MpStatusChip`
  and `MpSourceCloudChip`. `MpStatusChip` maps it onto Vuetify's own size names internally
  (`sm→x-small`, `md→small`, `lg→default`), so the public API never leaks Vuetify's vocabulary.
  Swept 50 call-site files; `MpSourceCloudChip` gained the missing `lg` stop.
- [x] P2-2 `MpStatusChip` — `font-size: 11.5px` → `--mp-fontSize-12`; weight and radius moved
  onto tokens at the same time.
- [x] P2-3 `MpSourceCloudChip` — `0 9px` inset → `--mp-component-chip-paddingInline` (8px),
  `10.5px` → `--mp-fontSize-11`, `gap: 5px` → `--mp-space-4`. Zero raw px left in the file.
- [x] P2-4 chip height ramp — new `component.chip.height.{sm,md,lg}` (20 / 24 / 32).
  `MpSourceCloudChip` (was 20/22), `MpStatusChip` (was Vuetify's implicit map) and
  `PlgTrialChip` (was 34) now all resolve to it. The ramp is asserted in each component's
  scoped CSS rather than inherited, so a Vuetify default change cannot silently break it.
- [x] P2-5 `PlgTrialChip` — `padding: 5px 12px` → `--mp-space-12` inline with the ramp height
  supplying the block axis; `13px` → `--mp-fontSize-13`; the popover's insets tokenized too.
- [x] P2-6 shape language — **confirmed intentional and documented**, not reduced. The four
  families are one concentric system: 16 outer surfaces / 12 nested / 10 controls / 8 chips
  and menu items / full pills for buttons. Written up in `CLAUDE.md` → Design Tokens and in
  `docs/design-system.md` → Border radius.
- [x] P2-7 emphasis vocabulary — **`emphasis: 'default' | 'prominent'` is now the one
  visual-weight prop system-wide.** `MpPageHeader.variant='display'` → `emphasis='prominent'`;
  `MpEmptyState.variant='expressive'` → `emphasis='prominent'`; `ModuleLandingPage`'s
  `PrimaryAction.variant` → `PrimaryAction.emphasis`. `variant` is now reserved for genuinely
  different *structures*, named after the structure — `MpEmptyState` became
  `variant: 'stack' | 'launcher'`. Full convention recorded in `CLAUDE.md` → Coding Conventions.

### Phase 3 — Molecules (cards, headers, states, list items)

**Status: closed 2026-08-28** — all 6 fixed, plus the tier-wide inset standard they depend on.

> **Correction to the findings below.** This audit was written 2026-08-27; P1-5 added the 2px
> half-steps (`space.{2,6,10,14}`) on 2026-08-28. So `10px` and `14px` — called out as
> off-scale in P3-1, P3-3 and P3-4 — became legal stops before these fixes ran. Those items
> were therefore literal→token swaps with **no visual change**, not re-spacing. Do not re-open
> them as violations.

- [x] P3-1 `MpEmptyState` — `32px` / `48px` / `gap: 10px` → `component.state.*`. The component
  was rebuilt on a `state` token group (`padding`, `paddingProminent`, `gap`, `minHeight`,
  `minHeightProminent`, `measure`, `measureWide`, `iconDisc`) that `MpErrorState` now shares.
  Also dropped `font-weight: 750` (not on the 5-stop weight scale) and stopped mixing an
  `mt-5` utility with token CSS on the same element (P1-13).
- [x] P3-2 `ModuleLandingPage` — all three `translateY(-1px)` hover nudges and the
  `margin-top: 1px` optical nudge **deleted**. The label/description pair now separates on
  `line-height: 1.4`, so it aligns at any font size; hover reads through the border-colour
  change alone, which is calmer and costs no pixel.
- [x] P3-3 `ModuleLandingPage` — 86 raw-px declarations → 0. Off-scale outliers snapped:
  `11.5px`→`fontSize.12`, `19px`→`fontSize.20`, `12.5px`→`fontSize.13`, `13.5px`→`fontSize.14`,
  `9px 16px`→`space.8`/`space.16`. The magic `min-height: 110px` on `.child-card` was deleted
  outright — grid rows already stretch to equal height, so it was doing nothing.
- [x] P3-4 `MpTableSkeleton` — `14px` row padding → `--mp-space-14`. On-scale since P1-5, so
  this is a literal→token swap and the skeleton still matches the real table row it stands in for.
- [x] P3-5 `MpPageHeader` — raw `4px` margins → `--mp-space-4`; the back-button box, its radius
  and its transition moved onto tokens in the same pass.
- [x] P3-6 `MerchProductCard` + `DvDraftPreview` — both aligned to the new card inset standard
  (below). `MerchProductCard`'s body took `card.paddingCompact` (replacing a `pa-3` utility) and
  its root radius moved 12 → `component.card.radius` (16) to join every other card in the tier.
  `DvDraftPreview` lost its `11.5px` / `22px` / `3px 7px 3px 5px` outliers.

**The card inset standard (the thing P4-1 should inherit).** `component.card` gained
`padding` (20), `paddingCompact` (12), `paddingSpacious` (32), `gap` (16) and `gapCompact` (8).
20px was chosen because it is what `MpKpiCard` and the Phase-4 widget family already use, so
P4-1 adopts this rather than contradicting it. Applied across the tier, replacing the ad-hoc
`pa-1 … pa-8` utilities that previously covered every step of the ramp.

**Two new shared primitives.** Molecules were re-implementing atoms, so:

- **`MpListRow`** (new, `src/components/MpListRow.vue`) — one row geometry for every list.
  Replaces three hand-rolled rows in `ModuleLandingPage` (`.activity-row`, `.davinci-list__item`,
  `.setup-list__item`, at three different heights) and is available to the fourth in
  `DvDraftPreview`. `minHeight` reuses `component.control.height`, so a list row, a button and
  a form field share one 40px baseline. It also resolves its own tag from whichever target prop
  is set, which removes the three-branch link workaround the old code needed.
- **`MpErrorState` now composes `MpEmptyState`** instead of duplicating its centred shape at a
  different inset and type scale. It contributes only what is actually different: `role="alert"`,
  the error tone, and retry-flavoured defaults.

**Corrections to the plan, found while doing the work:**

- `SettingsPlaceholder` was expected to be a third copy of the centred-state shape. It is not —
  it is a left-aligned inline notice, and composing it onto `MpEmptyState` would have been a
  regression. Tokenized in place instead, and the reason is recorded in its story.
- `ModuleLandingPage`'s per-tile accent tints, count pills and focus rings all survived the
  recompose onto `v-card` / `MpListRow` / `v-btn`; verified in Storybook at light and dark.
- `vue-tsc -b --noEmit` passes on a template that does not parse. A missing `</v-card>` in the
  recompose type-checked clean and only surfaced in the Vite/Storybook render. Type-check is
  not a sufficient gate for template work.

### Phase 4 — Complex (tables, dialogs, nav, dashboards/data-viz)

**Status: closed 2026-08-28** — all 9 fixed. See the Phase 4 changelog at the end of this file.
The brief also covered table cell padding / row heights / header alignment, modal header-body-footer
rhythm, and nav item heights / active states; those are recorded under P4-4, P4-6 and P4-7
respectively rather than as new finding numbers.

- [x] P4-1 widget family — one inset across all 17 widgets, **inherited from `component.card.*`**
  rather than a second widget-only pair (per the Phase 3 follow-up). Header
  `card.padding card.padding card.gapCompact`, body `0 card.padding card.padding`; the three
  bespoke-header widgets state the same role token directly. `DashboardKpiWidget` is the
  deliberately dense member and takes a uniform `card.paddingCompact` (12) — from the scale's
  compact tier, not an ad-hoc `14px 16px 12px`.
- [x] P4-2 `DashboardWidgetCard` — the `76px` / `60px` clearances are now `calc()`ed from the
  overlay's own `component.widget.{actionInset,actionSize,actionGap}`, so moving the buttons or
  their gap moves the clearance with them.
- [x] P4-3 `DashboardKpiWidget` — `gap: 3px` → `space.4`, `padding: 0 7px` →
  `chip.paddingInline`, `22px`/`26px` → `fontSize.24`/`28`. Its hand-rolled "Da Vinci" chip and
  the second copy in `DashboardWidgetCard` both moved onto the shared `component.chip.*` ramp
  (they were 18/10px/`0 7px` and 20/10.5px/`0 8px`).
- [x] P4-4 `MpDataTableToolbar` — every control in the row resolves to
  `component.control.height`; the `min-height: 38px` that landed on 40 only by arithmetic is
  gone. Extended to the table itself: `global.scss`'s cell padding, row heights and header
  alignment now come from a new `component.table.*` group, and `MpTableSkeleton` is pinned to
  the same tokens so a table does not shift between loading and loaded.
- [x] P4-5 `MpDataTableToolbar` — new `component.toolbar.minHeight`; table toolbars are no
  longer coupled to `layout.appbarHeight`.
- [x] P4-6 `AddSectionDialog` — five micro-insets down to two. Every repeating row is an
  `MpListRow` (so the row inset is `component.listItem.*`), the frame is the new `MpDialog`,
  and only the variant thumbnail's compact card inset remains. The schematic mini-mocks are
  marked in-file as illustration geometry, out of the spacing system.
- [x] P4-7 `AppBar` (204 raw px) + `AppSidebar` (86) — tokenized. Both adopt `layout.*`, which
  P1-4 had deferred to this phase: the tokens documented 248 / 72 while the component rendered
  240 / 64. Nav rows across `AppSidebar`, `MpSectionRail`, `AppBar`'s menus and
  `MpRowActionsMenu` all sit on `component.listItem.*` now (they ran at 10 / 8 / 7px block
  padding). `SettingsSidebar.vue` was deleted — it was a near-verbatim copy of `MpSectionRail`.
- [x] P4-8 `StorefrontPreview` — **decided: exempt, and documented.** It draws a simulated
  *merchant* storefront, not Marobase chrome, so its raw px values are the thing being previewed
  rather than system drift. Recorded in a file-header comment and in the changelog below; the
  builder chrome around it is fully tokenized.
- [x] P4-9 `MpDaVinciBot` (78 raw px) + `DvOrbitVoiceSurface` (63) + `MpSectionRail` (54) —
  tokenized. Orb canvas geometry stays exempt on the same grounds as the chart canvases, marked
  in-file.

### Phase 5 — Storybook shell (hierarchy, docs, intro)

**Status: 5 of 7 fixed 2026-08-28** — P5-2 half-closed (docs half done, story-shape half open),
P5-4 flagged not resolved, P5-5 partially closed, P5-7 untouched. See the Phase 5 changelog at the
end of this file.

- [x] P5-1 hierarchy — 16 top-level categories collapsed to **five**: `Foundations / Atoms /
  Molecules / Patterns / Product`. All 123 story `title:`s rewritten and `storySort`
  (`.storybook/preview.ts`) reordered in one pass. The fifth bucket is a deliberate amendment to
  the four-bucket rule, recorded in `CLAUDE.md` → Story hierarchy and in the changelog below.
- [~] P5-2 story template — **docs half closed, story-shape half open.** Every one of the 123 story
  files now carries `tags: ['autodocs']`, a `docs.description.component` and `argTypes` in which
  **every prop has a description** (84 filled this phase; 12 components got their first `argTypes`
  block; the 7 store-driven components got an explicit "no props, here is what drives it" Controls
  note instead of fabricated arg types). The `Default / Variants / Sizes / States` **export shape**
  still exists only where Phases 2–4 applied it — the untouched Product tier does not have it.
- [x] P5-3 dark-mode duplication — **72 `DarkMode*` clone exports deleted across 65 files**, plus
  their 61 now-unused `darkModeGlobals` imports and `src/stories/storybookTheme.ts` itself (its
  `lightModeGlobals` / `accentGlobals` exports had zero consumers). 831 story exports → 756. Four
  dark-named stories were **kept deliberately**: `Foundations/Colors` `DarkTheme` and
  `LightDarkSurfaceComparison` (the dark palette *is* that page's content), and `AppSidebar/SkinDark`
  + `AppBar/SeamDarkSkin` (the `data-sidebar` skin axis, not the theme axis).
- [ ] P5-4 `src/components/dashboards/dotted/DtRingDonut.vue` — **flagged, not resolved.** Still the
  only component without a story, and it now has **no consumer at all** — the sole reference in the
  repo is a comment in `src/plugins/chartPalette.ts:171`. It is dead code; deleting it is a call for
  the repo owner, so Phase 5 left it in place per instruction.
- [~] P5-5 ad-hoc decorators — **partially closed.** New `src/stories/decorators.ts` supplies the
  shared presets (`measure` scale, `constrain`, `surfaceFrame`, `railFrame`, `sidebarSkin`), and all
  6 files that carried local decorators now compose it — which also retired two off-scale
  `border-radius: 18px` widget frames onto `component.card.radius`. 11 per-story
  `layout: 'fullscreen'` parameters that merely restated the global were removed (8) or converted to
  the `canvas: 'full'` escape hatch they actually meant (3). **Still open:** 43 story files carry
  inline `max-width` clamps at 30 distinct pixel values; only the exact-match ones have a named
  preset to move to, and snapping the other 26 measures would change specimen widths, so they were
  left rather than churned.
- [x] P5-6 `AI/MpDaVinciBot` — the lone one-entry `AI/` category is gone. `MpDaVinciBot` and all 25
  `Dv*` surfaces (18 copilot + 7 voice) now sit together under `Product/Da Vinci/`.
- [ ] P5-7 viewport coverage — untouched. `mobile375` stories exist on 7 files
  (`ModuleLandingPage`, `MpWizardSteps`, `MpBuilderPreviewDialog`, `MpFormDrawer`,
  `MpComingSoonTiles`, `AppBar`, `AppSidebar`) and there is still no policy for which components
  need one.

### Phase 5.5 — Colour contrast and dark-surface text visibility

**Status: closed 2026-08-28** — 14 of 15 fixed. P5.5-12 was flagged, then fixed on the design
owner's instruction; that fix surfaced P5.5-15 (outlined buttons), which is the one open item.
See the Phase 5.5 changelog at the end of this file.

**The diagnosis (Step 1).** The system had *partial* semantic pairing. Status colours, containers,
accents and the ink panel were all correctly paired (`primary`/`onPrimary`,
`*Container`/`on*Container`, `inkPanel.bg`/`fg`). But **all 12 `--surface-*` aliases had no
foreground counterpart**, so anything painting a surface reached for the unrelated `--text-*`
family or fell through to Vuetify's `--v-theme-on-surface`. That is the root cause, and it is why
the offender list below is long. Three independent failures compounded it.

- [x] P5.5-1 **root cause — surface ladder unpaired.** `color.{light,dark}.onSurface` /
  `onSurfaceMuted` added as the declared ink for the whole ladder, plus `--on-surface` /
  `--on-surface-muted` aliases. Convention: **Material-style `on<Surface>`**, which the file
  already used — no third vocabulary invented.
- [x] P5.5-2 **light/dark asymmetry.** The dark theme defined `textSecondary`, `textDisabled`,
  `iconPrimary/Secondary/Disabled`, `surfaceRaised/Sunken` and `interactive*`; the light theme
  defined none of them, so `mp-theme-aliases.css` papered over the gap — which made **disabled and
  muted text identical in light mode**. All 11 roles now exist in both themes and the alias layer
  is a 1:1 map.
- [x] P5.5-3 **`scripts/check-contrast.mjs` + `npm run contrast:check`.** Zero-dep; resolves
  aliases, composites translucent values over their host, computes WCAG 2.1 ratios for every pair
  in the new `$contrastPairs` manifest (241 pairs). Exit 1 on failure. `$`-prefixed keys are
  skipped by `build.mjs` and the Tokens Studio exporter, so the manifest never reaches generated
  output or Figma.
- [x] P5.5-4 **Storybook decorator — the dark-canvas root cause.** The decorator rendered
  `v-app` (always `maropostLight`) → nested `v-theme-provider` → canvas. `global.scss:252`
  (`.v-application { color: rgb(var(--v-theme-on-background)) }`) resolved at the *light* v-app and
  **inherited dark ink into the dark canvas**; `preview.css` set the canvas background but never its
  colour. `<v-app :theme>` now puts the theme class on `.v-application` itself. Verified: v-app's
  computed colour is `#ececec` in dark, was `#1a1814`.
- [x] P5.5-5 `DashboardHeatmapWidget` — `tintHex()` mixes toward white in **both** themes, so every
  cell fill is light; the ink was `var(--text-primary)`, which flips near-white in dark →
  light-on-light for every cell below the ramp threshold. Ink now comes from `readableInkOn(fill)`
  (new, `chartPalette.ts`), chosen by the fill's own luminance, so it holds for every palette preset
  rather than only the default.
- [x] P5.5-6 `AppBar` on the dark sidebar skin — `.appbar-mobile-search-btn` and
  `.appbar-create-kbd` were missing from the `[data-sidebar="dark"]` override block, leaving a dark
  icon and a near-white ⌘K chip on the dark bar. Verified fixed: `#ececec` on `#1F2226`.
- [x] P5.5-7 `retail-widgets.scss` — the warning variant hardcoded `#f59e0b`/`#b45309` with **zero
  theme scoping** while every sibling used tokens. Root cause: the semantic trio was incomplete —
  `--pos`/`--neg` existed, `--warn` did not. Added `--warn`/`--warn-soft`/`--warn-ink`/`--on-warn`.
- [x] P5.5-8 `DvToastStack` — an inverse slab built from `on-surface`/`surface`, whose action link
  used brand cyan; in dark theme that is cyan on a near-white slab (~2.5:1). Recomposed onto the
  `--ink-panel-*` family, which exists for exactly this branded inverted surface. Its `opacity: 0.75`
  subtitle became `--ink-panel-muted-fg`.
- [x] P5.5-9 fills with no ink — `.dv-composer__send` (gradient, `--dv-on-accent` existed and was
  simply not applied), the `--neg` notification badge, `.dv-docs__orb`, and six
  `<v-icon color="white">` sites on `primary`/category avatars (now `on-primary` and a new
  `categoryOnColor` map in `flowTheme.ts`).
- [x] P5.5-10 desyncing fallbacks — `DvHistoryDrawer` / `DvRefineDialog` used
  `rgb(var(--v-theme-primary-container, var(--v-theme-primary)))` paired with an independently
  falling-back ink. CSS resolves the two separately, so a theme defining one but not the other
  paints a container fill with on-primary ink. Both themes define the pair; the fallbacks only
  added a way to desync.
- [x] P5.5-11 **three off-pipeline palettes migrated** (~160 values) — `dv-tokens.css` (84),
  `source-cloud-colors.css` (28) and `sidebar-white/gray.css` + `shell-variants.css` (~50) defined
  colour outside `tokens.json`. All now live under `color.{light,dark}.{dv,cloud}` /
  `navSurfaceGray` / `navIconStudio`, and those files are alias layers. **Migrating the Orbit
  palette surfaced 6 contrast failures that had been invisible** (P5.5-13). Also fixed
  `source-cloud-colors.css`'s dark selector, which was `.v-application.v-theme--maropostDark` — a
  form that can never match in Storybook.
- [x] P5.5-12 **`outline` as a control boundary — FIXED 2026-08-28** (was flagged; the design owner
  said fix it). `color.light.outline` `#d4d4d4` → **`#8a8a8a`**, `color.dark.borderStrong`
  `#4D535B` → **`#7C848F`** — the *lightest* values clearing 3:1 on the backgrounds outlined fields
  actually sit on (light 3.45:1 surface / 3.19:1 canvas; dark 4.22:1 surface / **3.17:1
  surfaceOverlay**, the drawer-and-dialog case the original A11Y-001 finding never measured and
  which the manifest was missing — two pairs added). This **reverses a recorded accepted-risk
  decision** (A11Y-001, "the lighter Flowbite look"), whose stated mitigation — focus and error draw
  a 2px border — was rejected on review: 1.4.11 governs whether a field can be *found* at rest, and
  a focus affordance only helps once it already has been.
  **The blast radius was smaller than this item originally claimed.** It said "every field and card
  edge"; verified, `outline`/`borderStrong` drives only the outlined-field border,
  `.dv-composer__pill:hover` and the journey flow arrowhead. Cards, dividers and outlined *buttons*
  use `outlineVariant` / `border` / `borderSubtle` / `--mp-border-subtle` and did not move, so the
  "fewer borders, calm" bar is intact. `controlBoundary` is now an **enforced** level rather than a
  reported one, so this cannot regress silently; the `FLAGGED` set in `check-contrast.mjs` is empty.
  Stale accepted-risk comments updated in `settings-form.scss`, `global.scss`,
  `MpDataTableToolbar.vue` and `docs/ui-system-audit/03-accessibility-audit.md`.
- [ ] P5.5-15 **NEW, flagged — outlined *buttons* (A11Y-002).** `.v-btn--variant-outlined`
  (`global.scss:274`) and the toolbar search that is deliberately pinned to match it both sit at
  `--mp-border-subtle`, ~1.23:1. Fixing P5.5-12 did not touch them, and the toolbar row is still
  internally consistent (both compute `#e2e8f0` — verified). But an outlined button's border is its
  only affordance as a button, so 1.4.11 arguably applies. Moving it darkens **every outlined button
  app-wide**, which is a deliberate visual decision and was not bundled into P5.5-12.
- [x] P5.5-13 six latent Orbit failures, found only once the palette was in the manifest:
  `dv.orbit.mist` (2.73:1 — it colours 12–13px hint/message/echo text), `dv.orbit.muted`
  light + dark (the orb's dim/error state mark), and `dv.orbit.blue` (2.76:1 — it fills the typing
  caret and the chip hover border, both 1.4.11 indicators). All adjusted at the token level with the
  hue preserved.
- [x] P5.5-14 Storybook layer — `.mp-story-canvas` states its ink; `surfaceFrame`/`railFrame`
  decorators pair their backgrounds; `sidebarSkin` restores `data-sidebar` on unmount (it only ever
  *set* it, so a `dark`-skin story leaked dark chrome into every story after it, despite its JSDoc
  claiming otherwise); `FormFields.stories.ts` no longer nests a second canvas in 16 stories;
  **`@storybook/addon-a11y` configured** — it was installed and registered but had zero
  `parameters.a11y`, so no rules ran. Now `test: 'todo'` with `color-contrast` enabled and the three
  document-level rules that always fire on a story iframe disabled.

### Phase 6 — Modal and form layout consistency

**Status: closed 2026-08-28** — all 16 fixed. See the Phase 6 changelog at the end of this file.
The brief also covered required marks, textarea heights, leading-icon alignment and footer button
sizing; those are recorded under P6-13, P6-12 and P6-15 rather than as new finding numbers.

- [x] P6-1 one overlay header — `component.dialog.headerGap` split out of `footerGap` (they were
  both 8, but one is a header rhythm and the other an action-row rhythm), and a new
  `headerMinHeight` (88) floor. The band measured **72 / 87 / 109px** depending on which optional
  lines were present, so no two modals in a flow started their body at the same place. The header
  is now a **grid**: eyebrow, title and subtitle each own a row and the lead and trailing controls
  are placed on the *title's* row, so the close button sits on the title's optical centre by
  construction rather than drifting ~10px below it whenever a subtitle appeared. Measured after:
  88 / 88 / 100 (the third grows for a real eyebrow row — a floor, not a cap), close-to-title
  delta **0** in all three. `MpFormDrawer` title 18 → 16, so the system has **one** overlay title
  size instead of three (16 dialog / 18 drawer / 15 raw `v-card-title`).
- [x] P6-2 scroll affordance — new `useScrollEdges` composable (scroll listener + ResizeObserver,
  because content that grows past the fold never fires a scroll event) and a `shadow.scrollUp`
  token. The header and footer cast an edge shadow only while content is hidden beneath them. The
  dividers are structure and never changed, so a long body previously gave no signal at all that
  it continued.
- [x] P6-3 shell literals tokenized — `line-height: 1.3 / 1.4` → `lineHeight.snug / compact`,
  `letter-spacing: -0.01em / 0.08em` → `letterSpacing.snug / eyebrow`, and the hardcoded `640px`
  media queries → `layout.breakpointCompact` consumed as the generated Sass variable (media
  queries cannot read CSS custom properties, so both shells moved to `lang="scss"`).
- [x] P6-4 drawer size ramp — `MpFormDrawer`'s free-form `width: number` had reached **eight**
  values between 420 and 680. Replaced by `size: 'sm' | 'md' | 'lg'` on a new
  `component.drawer.width` group (440 / 480 / 640, default md). Snapped 420,460→sm · 480,520→md ·
  560,600,640,680→lg across 63 openings, so every previously-unset drawer is pixel-identical.
  `layout.drawerWidth` was an orphan token — it is now an alias for the md stop.
- [x] P6-5 guarded parity + `#footerStart` — `MpDialog` adopts the drawer's `guarded` / `close`
  contract, so the two shells have one vocabulary for "the host confirms before discarding".
  Both gained a `#footerStart` slot for a left-aligned Back / Clear-all, which deleted **five**
  hand-rolled `<div class="w-100 d-flex justify-end">` wrappers that each re-derived the footer
  layout the shell already had.
- [x] P6-6 `flush` body — a `flush` prop replaces the two `:deep(.mp-dialog__body){padding:0}`
  overrides that reached into the shell's internals (`AddSectionDialog`, `MpBuilderPreviewDialog`).
  Expressing it as a prop is the difference between a supported variation and a shell-piercing hack.
- [x] P6-7 raw `v-dialog` eliminated — **13 openings in 10 files** converted to `MpDialog` /
  `MpConfirmDialog`. They ran to eight off-ramp widths (340 · 360 · 440 · 480 · 520 · 560 · 820 ·
  1040 · 1120), five card insets, three hand-rolled `border-bottom`s instead of `v-divider`, four
  with no close button at all, and footers aligned right / centre / space-between by file. The
  byte-identical 1120px expanded-widget dialog in `DashboardView` and `DashboardGradientView`
  became one `MpDialog size="lg" flush` in each. `global.scss`'s third title size (the 15px
  `.v-dialog .v-card-title` block) is deleted. `AppBar.vue:782`'s mobile full-screen search stays
  the **one** recorded exemption — its header *is* the search field, so the shell's header
  contract does not fit; its in-file comment (which wrongly claimed every other dialog already
  composed `MpDialog`) is corrected.
- [x] P6-8 `MpFormGrid` — the one form layout container. 1 or 2 columns gapped on
  `component.field.groupGap`, with `mp-form-grid__full` and `mp-form-grid__trailing` replacing the
  **six** different techniques in use for a field-plus-delete-button row (CSS grid, four flex
  variants at three different gaps, and `v-row`/`v-col`). The trailing action gets its own fixed
  `control.height` track, so the button lands on the form's right edge and the inputs above and
  below it share one left *and* right edge. Two follow-on defects were found and fixed while
  proving it: grid's default `align-items: stretch` was letting a persistent hint under one column
  inflate the control beside it (52 and 62 where both should be 44), and the action was rendering
  at Vuetify's 28px rather than filling its 40px track.
- [x] P6-9 `MpFormSection` — the one in-form section heading. **Seven** hand-rolled patterns across
  ~260 sites (`text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis`,
  `text-caption … font-weight-bold text-uppercase mb-2`, `text-subtitle-2 font-weight-bold mb-2`
  with no uppercase, `.mp-meta-label`, and four bespoke scoped classes) collapsed into one
  component that owns its own space via a new `component.field.sectionGap` (24), expressed as the
  delta over the ambient field gap so it stays correct if either token moves.
- [x] P6-10 `MpFormField` — label, hint/error and aria wiring for **composite** controls only
  (chip groups, radio groups, tile pickers). It renders nothing when there is no message, so it
  never reserves empty height. A Vuetify input is deliberately never wrapped: it already owns its
  label and aria, and the floating label is the one label language. The dead `.mp-field-label`
  class in `settings-form.scss` — zero consumers in its whole lifetime — is deleted; this is the
  job it described, done properly.
- [x] P6-11 margin sweep — **592 field-level `mb-*` / `mt-*` utilities deleted** (471 in
  `src/views`, 121 in `src/components`). 117 of them sat inside an overlay body that already
  applied a 16px gap, so the rendered distance between two fields was 24 / 28 / 32 / 36 / 40px
  depending on which utility the author reached for. **This is a deliberate rhythm change** — see
  the changelog.
- [x] P6-12 field affix alignment — the "select rendered at 3× height with the chevron floating in
  empty space" defect. Cause: `multiple` + `chips` wraps the input onto several rows while
  Vuetify's `center-affix` (the default for outlined fields) parks the chevron halfway down the
  resulting box. The affix is now pinned to a box exactly one input row tall, offset by the field's
  own outline padding, so it lands on the first chip row *by construction*. Verified at a wrapped
  select: field 74px over two chip rows, chevron-to-first-chip delta **0**, where centre-affix put
  it 15px below. An unwrapped select is pixel-identical to before (icon-to-field-centre delta 0).
  The app-level rule this replaced was a byte-for-byte restatement of Vuetify's own default that
  changed nothing on a normal field while collapsing `v-number-input`'s stacked stepper.
- [x] P6-13 one control height — every control at the default density now renders a **44px** box
  (`control.height` 40 plus the field's own `boxPadding` top and bottom, which is itself a new
  token replacing a raw `2px`). Four separate causes were found and fixed: a chip standing in for a
  selected value rendered at Vuetify's 26px instead of the 24px chip ramp (select 46 vs 44); a
  prefix or suffix was padded from a different variable than the input (52 vs 44); a stacked
  number-input's two steppers each inherited the theme's `VBtn min-height: 40`, stacking to 81; and
  the grid stretch above. Textarea height is `rows` (3 normal, 5 long-form), never CSS.
- [x] P6-14 selection controls — `VCheckbox`, `VRadio`, `VRadioGroup`, `VSwitch`, `VSlider`,
  `VNumberInput`, `VBtnToggle` and `VChipGroup` had **no theme defaults at all**, so they fell
  through to raw Vuetify (`hideDetails: false`, `density: 'default'`) — which is why a checkbox
  group and the fields above it sat on different rhythms, and why 417 call sites had each written
  `hide-details` by hand. All eight now carry the same behavioural defaults as the text fields.
  `v-btn-toggle`'s three competing conventions collapse to one; amount-preset chip rows (three
  different heights, no keyboard model) become `MpFormField` + `v-chip-group filter`.
- [x] P6-15 footer actions and disabled contrast — one pattern everywhere: secondary then primary,
  right-aligned on `footerGap`, with `#footerStart` for anything that belongs at the other end.
  Vuetify styles disabled buttons with **hardcoded alphas** rather than theme colours
  (`opacity: .26`, and for flat an `rgba(on-surface, .26)` label over a 46%-opacity overlay), so no
  token could reach them and a disabled primary in a modal footer measured ~2.1:1 against the
  surface it sat on. New `buttonDisabled` / `onButtonDisabled` pair, machine-checked at 3:1 against
  both the button fill and `surfaceOverlay` in both themes.
- [x] P6-16 stories — `MpDialog` and `MpFormDrawer` gained per-size, short-form,
  long-scrolling-form (which is how the scroll shadows are checked), error-states and
  two-column-with-trailing-row stories, plus **`SideBySideRegression`**: three shells rendered at
  once so header heights and left/right edges can be compared without opening anything. New
  stories for the three primitives; `Patterns/Form Fields` rewritten with the spacing, label,
  required-mark and `hide-details` rules, and its own off-scale `gap: 14px` story markup — which
  contradicted the text right beside it — replaced with `MpFormGrid`.

---

## Summary

| Phase | Findings | high | med | low |
|---|---|---|---|---|
| Phase 1 — Foundations | 13 ✅ 11 fixed, 2 scoped out | 4 | 6 | 3 |
| Phase 2 — Atoms | 7 ✅ all fixed | 2 | 3 | 2 |
| Phase 3 — Molecules | 6 ✅ all fixed | 0 | 4 | 2 |
| Phase 4 — Complex | 9 ✅ all fixed | 1 | 5 | 3 |
| Phase 5 — Storybook shell | 7 ✅ 3 fixed, 2 partial, 2 open | 2 | 4 | 1 |
| Phase 5.5 — Colour contrast | 15 ✅ 14 fixed, 1 flagged | 5 | 8 | 2 |
| Phase 6 — Modals and forms | 16 ✅ all fixed | 6 | 8 | 2 |
| **Total** | **73 — 66 closed, 2 partial, 5 open** | **20** | **38** | **15** |

**Remaining after Phase 6** (5 items, unchanged — none is a modal or form finding, and none
blocks a shared build):

1. **P5-2 (half)** — the `Default / Variants / Sizes / States` export shape across the Product tier.
2. **P5-4** — `DtRingDonut.vue`: dead component, no story, no consumer. Flagged for a delete decision.
3. **P5-5 (half)** — 43 story files with inline `max-width` clamps at 26 measures with no named preset.
4. **P5-7** — the responsive-story policy (which components need a `mobile375` story) and its gaps.
5. **P5.5-15** — outlined *buttons* (`.v-btn--variant-outlined`) and the toolbar search pinned to
   match them sit at ~1.23:1. Raising them darkens every outlined button app-wide, so it is a
   design decision rather than a token bug. Supersedes P5.5-12, which is now fixed.

Two Phase 1 items also remain scoped out with reasons recorded in-file: **P1-8** (the 5 `!important`
radius overrides in `global.scss`, which need `rounded="lg"` removed from 631 template sites) and
**P1-11** (the raw-px migration policy, which closed with Phases 2–4 for every tier those phases
touched).

Cross-cutting stats at the original audit: 1,252 raw px declarations across 93/112 components,
5/112 consuming spacing tokens. After Phases 1–3 the molecule tier is clean — `ModuleLandingPage`
86→0, `DvDraftPreview` 61→0 spacing declarations. Phase 4 cleared the complex tier: `AppBar`
204→0, `AppSidebar` 86→0, `MpDaVinciBot` 78→0, `DvOrbitVoiceSurface` 63→0,
`DashboardWidgetCard` 61→0, `MpSectionRail` 54→0, `AddSectionDialog` 45→0, plus ~290
declarations across the 17 widgets. Four categories stay off the scale **by decision**, each
marked in-file: chart and orb canvas geometry, 1px hairlines / 2px focus rings, panel and
popover *measures* (a menu's 280px width sizes a surface to its content — it is not a step on
the spacing rhythm), and `StorefrontPreview` in full (P4-8).

---

## Phase 1 changelog — 2026-08-28

Per CLAUDE.md → "Log every rename or breaking change in the session changelog". Marobase has zero
consumers, so these are renames, not deprecations — no compatibility aliases were kept.

### Token renames

| Was | Now | Note |
|---|---|---|
| `spacing.1 … spacing.20` | `space.4 … space.80` | index-named → value-named; `space.{2,6,10,14}` added |
| `spacing.24`, `spacing.32` | — | deleted (96/128px, zero references) |
| `borderRadius.{sm,md,full}` | `radius.{4,12,full}` | same values |
| `borderRadius.lg` (14px) | `radius.12` | **2px change** on 2 nested elements (`LiveView.vue`) |
| `borderRadius.xl` (28px) | `radius.full` | `.mp-floating-bulk-bar`; 28px *was* the pill radius at that height |
| `borderRadius.2xl` | — | deleted (zero references) |
| `borderRadius.chip` | `component.chip.radius` → `{radius.8}` | promoted to a role token |
| `component.card.radius.{sm,md,xl}` | `radius.{10,12,20}` | second scale absorbed |
| `component.card.radius.lg` | `component.card.radius` → `{radius.16}` | |
| `component.{input,dialog}.radius.default` | `component.{input,dialog}.radius` | leaf, not a group |
| `component.button.radius.{pill,medium,square,default}` | `component.button.radius` | 4 → 1 (P1-3) |
| `typography.fontSize.{xs,sm,body,md,lg,xl,2xl,3xl}` | `fontSize.{11,12,14,16,18,24,32,40}` | flattened + value-named; `{10,13,15,20,28,48}` added |
| `typography.{fontFamily,fontWeight,lineHeight,letterSpacing,display}` | top-level `fontFamily`, `fontWeight`, `lineHeight`, `letterSpacing`, `display` | flattened |
| `typography.semantic.*` | `text.*` | every `fontSize` now aliases the ramp; `body` 13.5px → `{fontSize.14}` |
| `transition.{fast,base}` | — | deleted; `motion.*` is the one motion system |
| `zIndex.base` | — | deleted (0 = "no explicit layering", nothing to reference) |
| `color.dark.blue50 … blue900` | `color.dark.blue.{50…900}` | matches `color.blue.*` ramp shape |
| `color.dark.neutral100/200` | `color.dark.neutral.{100,200}` | matches `color.neutral.*` |
| `color.{light,dark}.daVinci.*` | — | deleted (6 tokens, zero references) |

### Tokens added

`space.{2,6,10,14}` · `radius.{4,8,10,12,16,20,full}` (as one scale) ·
`fontSize.{10,13,15,20,28,48}` · `component.control.height` (40px) ·
`component.button.paddingInline` → `{space.14}` · `component.{chip,menu}.radius` ·
`shadow.buttonInset`

### Behaviour changes (deliberate, 6 declarations total)

- `LiveView.vue:705,761` — nested funnel step + map radius 14px → 12px.
- `AcquisitionForms.vue:514,615,630` — `$mp-transition-base` (`0.2s ease`) →
  `var(--mp-motion-duration-base) var(--mp-motion-easing-standard)`; same 200ms, system easing curve.
- Storybook canvas padding 24px → 32px (`--mp-space-32`), per the CLAUDE.md aesthetic bar.

Everything else kept its rendered value: the radius merge was designed so each old name maps to a
new name of identical pixel value.

### Follow-ups this opens

- `design-kit/figma-export/tokens-studio.json` is only rewritten under `npm run tokens:build --push-figma`.
  The next push renames the Figma variables (`spacing.6` → `space.24`, etc.), which will orphan the
  existing bindings in the Maropost Design Kit file. Worth a deliberate re-link session.
- `--r-pill` / `--r-chip` / `--r-card` / `--r-section` (82 uses) now resolve through tokens but are
  still an extra hop. Collapsing the `--r-*` alias layer into direct token use is a Phase 5 candidate.

---

## Phase 2 + 3 changelog — 2026-08-28

Per CLAUDE.md → "Log every rename or breaking change in the session changelog". Marobase has zero
external consumers, so these are renames, not deprecations — no compatibility aliases were kept.
In-repo call sites were swept in the same pass and `npm run build` passes.

### Tokens added

All under `component.*` in `tokens.json`, because a role token is a design decision and these
were previously decided ad hoc in 30+ component files.

| Group | Tokens | Resolves to |
|---|---|---|
| `component.card` | `padding` · `paddingCompact` · `paddingSpacious` · `gap` · `gapCompact` | 20 · 12 · 32 · 16 · 8 |
| `component.listItem` | `minHeight` · `paddingBlock` · `paddingInline` · `gap` | `{component.control.height}` (40) · 8 · 12 · 12 |
| `component.field` | `labelGap` · `groupGap` · `hintGap` | 6 · 16 · 4 |
| `component.state` | `padding` · `paddingProminent` · `gap` · `minHeight` · `minHeightProminent` · `measure` · `measureWide` · `iconDisc` | 32 · 48 · 8 · 240 · 320 · 420 · 480 · `{space.80}` |
| `component.chip` | `height.{sm,md,lg}` · `paddingInline` | 20 / 24 / 32 · 8 |

**Why `card.padding` is 20px:** the existing set was 12(×5) / 16(×6) / 20(×2) / 24 / 32. 16 was
the raw mode, but CLAUDE.md's aesthetic bar says pick the more generous of two paddings, and 20 is
already what `MpKpiCard` and the Phase-4 widget family use — so P4-1 inherits this standard rather
than contradicting it.

### API renames

| Component | Was | Now |
|---|---|---|
| `MpStatusChip` | `size: 'x-small' \| 'small' \| 'default'` | `size: 'sm' \| 'md' \| 'lg'` (default `md`) |
| `MpSourceCloudChip` | `size: 'sm' \| 'md'` | `size: 'sm' \| 'md' \| 'lg'` |
| `MpPageHeader` | `variant: 'default' \| 'display'` | `emphasis: 'default' \| 'prominent'` |
| `MpEmptyState` | `variant: 'default' \| 'expressive' \| 'launcher'` | `variant: 'stack' \| 'launcher'` **+** `emphasis: 'default' \| 'prominent'` |
| `MpEmptyState` | — | new `tone: 'neutral' \| 'error'` (what `MpErrorState` composes) |
| `ModuleLandingPage` | `PrimaryAction.variant: 'primary' \| 'secondary'` | `PrimaryAction.emphasis: 'default' \| 'prominent'` |

**The convention these settle on:** `emphasis` is the one visual-weight prop; `variant` is
reserved for genuinely different structures and is named after the structure; `size` is always
`sm | md | lg`. Recorded in `CLAUDE.md` → Coding Conventions.

### Components added

- **`MpListRow`** — the one list-row geometry. Replaces four hand-rolled rows at four different
  heights. Renders as `div` / `RouterLink` / `a` / `button` depending on which target prop is set.

### Components restructured

- **`MpErrorState`** now composes `MpEmptyState` (was a near-duplicate at a different inset and
  type scale). Its public API is unchanged.
- **`ModuleLandingPage`** recomposed onto real atoms: `.quick-action`, `.child-card` and
  `.side-card` → `v-card`; `.activity-row`, `.davinci-list__item`, `.setup-list__item` →
  `MpListRow`; `.ink-cta` → `v-btn`. Roughly 200 lines of re-implemented atom CSS deleted.

### Deliberate visual changes

Everything else kept its rendered value. These did not:

| Where | Change | Why |
|---|---|---|
| Card insets across the tier | `pa-3/4/5/6/8` → `card.padding` (20) or `paddingCompact` (12) | the point of the standard; per-card values were ad hoc |
| `MerchProductCard` root radius | 12 → 16 | joins the one card radius (concentric: 16 outer / 8 chips) |
| `PlgTrialChip` height | 34 → 32 | joins `chip.height.lg` |
| `MpSourceCloudChip` md height | 22 → 24 | joins `chip.height.md` |
| `MpWizardSteps` step dot | 22 → 20 | joins `chip.height.sm` |
| `MpComingSoonTiles` icon disc | 56 → 48 | 56 is not a scale stop; nearest is 48 |
| `MpKpiCard` sparkline | 96 → 80 | 96 is not a scale stop; nearest is 80 |
| `MpPageHeader` level-2 weight | 650 → 700 | 650 is not on the 5-stop weight scale |
| `MpEmptyState` prominent title | 22 → 24, weight 750 → 700 | 22 and 750 are on no scale |
| `ModuleLandingPage` hover | `translateY(-1px)` removed | P3-2 |
| `ModuleLandingPage` `.child-card` | `min-height: 110px` deleted | grid rows already stretch to equal height |

**Fractional-font mapping.** P1-6 offered a choice for most stops; Phase 2/3 applies one uniform
rule — **round up** — so 10.5→11, 11.5→12, 12.5→13, 13.5→14. This refines P1-6's `10.5→10`
suggestion in favour of a single rule and better legibility. Applied everywhere in one pass.

### Deliberate exemptions (recorded so they are not ambiguous)

- **Chart canvas geometry** in `DvDraftPreview` (svg heights and widths) stays off the spacing
  scale — it is plotting-area size driven by the data, not a spacing decision. Marked in-file.
- **`letter-spacing`** values are a typographic axis with no scale in `tokens.json`; untouched.
- **1px hairlines, 2px underlines and focus-ring spreads** are geometry, not spacing; untouched.

### Stories

Every touched component's stories were rewritten to the template — `Default` → `Variants` →
`Sizes` → `States` → scenarios → `DarkMode` — with existing scenario stories and per-story dark
clones kept, per the brief. `Sizes` is omitted where a component genuinely has no size axis
(e.g. `MpEmptyState` fills its container); each such story says so rather than being left absent
without explanation. A shared `src/stories/storyTemplate.ts` provides the grid render helper so
~30 files do not paste the same wrapper — this overlaps P5-5 (shared decorators) and closes part
of it early.

**Story gap found and fixed:** `ModuleLandingPage`'s `InkDaVinciCard` story had no `ctaTo` in its
fixture, so the ink panel's CTA button had never rendered in any screenshot of that story. The
fixture now carries `headline`, `ctaLabel` and `ctaTo`.

### Follow-ups this opens

- **P4-1 should adopt `component.card.*`** rather than defining a second widget inset pair. The
  20px value was chosen to match what the widget family already uses.
- `.gap-2` / `.gap-3` shims in `global.scss:389` duplicate Vuetify's `ga-*` utilities — 352 uses
  of `gap-N` against 182 of `ga-N`. Two mechanisms for one property; on no phase list. The
  molecules touched here were moved to `ga-*`, but the shim and its other consumers remain.
- `component.field.*` is applied in `settings-form.scss` and consumed by the settings `.stack`.
  Drawer and dialog form bodies (`MpFormDrawer`) still space their fields ad hoc — Phase 4.

---

## Phase 4 changelog — 2026-08-28

Per CLAUDE.md → "Log every rename or breaking change in the session changelog". Marobase has
zero consumers, so these are renames and deletions, not deprecations — no compatibility aliases
were kept. In-repo call sites were swept in the same pass; `npm run build` and
`npm run build-storybook` both pass.

### Tokens added

All under `component.*` / `layout.*` in `tokens.json`, because each one is a design decision
that was previously being made ad hoc in component files.

| Group | Tokens | Resolves to |
|---|---|---|
| `component.table` | `rowMinHeight` · `headerMinHeight` · `cellPaddingBlock` · `cellPaddingInline` · `cellPaddingInlineCompact` · `headerPaddingBlock` | 48 · `{component.control.height}` (40) · 14 · 16 · 8 · 8 |
| `component.dialog` | `padding` · `paddingCompact` · `gap` · `footerGap` · `width.{sm,md,lg}` | 20 · 16 · 16 · 8 · 440 / 640 / 880 |
| `component.toolbar` | `minHeight` · `searchWidth` · `searchMinWidth` | 64 · 300px · 240px |
| `component.nav` | `itemRadius` · `groupGap` · `activeBarInset` | `{radius.8}` · 16 · 6 |
| `component.widget` | `actionSize` · `actionGap` · `actionInset` | 32 · 2 · 12 |
| `layout` | `sectionRailWidth` | 260px |

**Why `component.table.headerMinHeight` is 40 and not 48.** The header's height was never
decided — it fell out of Vuetify's own `--v-table-header-height`. Putting it on
`component.control.height` makes a table header, a button, a form field, a list row and a nav
item share one baseline, and gives a table a label band that is tighter than its data rows.

**Why there is no `component.widget` inset pair.** P4-1 asked for one, but the Phase 3
follow-up asked P4-1 to adopt `component.card.*` instead — 20px was chosen there *because* this
family already used it. Defining a widget pair would have re-created the second scale Phase 1
spent its effort merging. `component.widget.*` therefore holds only the action-overlay geometry
that P4-2's magic numbers were hand-derived from.

**Why `component.nav` is only three tokens.** Nav item height, block/inline padding and gap all
come from the existing `component.listItem.*`. `nav` adds only what a row primitive has no
opinion about: the item's corner, the gap between groups, and how far the active accent bar is
held off the row's ends.

### Components added

- **`MpDialog`** (`src/components/MpDialog.vue`) — the one modal shell, and the dialog analogue
  of `MpFormDrawer`. Eight components built dialogs from a raw `v-dialog` +
  `v-card-title/text/actions` at five different rhythms, while CLAUDE.md already said "never raw
  `v-dialog`" — there was simply nothing to compose. Props `title` · `subtitle?` · `eyebrow?` ·
  `icon?` · `tone?` · `size?` · `fullscreen?` · `persistent?`; slots default / `#lead` /
  `#headerActions` / `#footer`. `eyebrow` and `#lead` deliberately reuse `MpPageHeader`'s and
  `MpListRow`'s existing names rather than inventing a third vocabulary.

### Components deleted

- **`SettingsSidebar.vue`** (+ its story) — a near-verbatim reimplementation of `MpSectionRail`:
  same 260px width, same title + search + grouped `router-link`s, same active accent bar, same
  900/640px breakpoints, differing only in item height (7px block padding vs 8). The rail
  already carried `title` and `searchable` for exactly this "Settings flavor", and Retail and
  Merchandising were already using it. `SettingsLayout.vue` (its one consumer) now composes the
  rail via a new `settingsRailGroups()` adapter in `settingsMenu.ts`.

### Components restructured

- **Nine dialogs now compose `MpDialog`**: `MpConfirmDialog`, `MpMoveToFolderDialog`,
  `DashboardFormDialog`, `AddSectionDialog`, `PlgTalkToSalesDialog`, `Plg3dsDialog`,
  `DvExpandDialog`, `DvRefineDialog` and `MpBuilderPreviewDialog` (fullscreen). Each lost its
  hand-rolled header/body/footer CSS.
- **`AddSectionDialog`** — its two repeating row types became `MpListRow` (P4-6).
- **`MpFormDrawer`** — joined the same `component.dialog.*` rhythm; its body is now a flex
  column on `component.dialog.gap`, which closes the Phase 3 follow-up "drawer and dialog form
  bodies still space their fields ad hoc". `MpManageFoldersDrawer` inherits this for free.

### Deliberate visual changes

Everything else kept its rendered value. These did not:

| Where | Change | Why |
|---|---|---|
| App-bar controls (search, create, utilities, assistant pill, user avatar, theme track) | 36 → 40 | 36 is on no scale stop; every control in the bar is `component.control.height` now, which also makes the app-bar search and the table-toolbar search the same height for the first time |
| App-bar theme segment | 36 track / 30 thumbs → 40 / 32 | 40 = 32 + 4 padding either side; all three on scale stops |
| App-bar menu panels | radius 14 → 12 | 14 is on no scale; menus are `component.menu.radius` |
| `AppSidebar` / `App.vue` widths | 240 / 64 → 248 / 72 | adopts `layout.sidebarWidth` / `sidebarRailWidth`, which P1-4 deferred to P4-7; the tokens and CLAUDE.md already documented 248 / 72 while nothing rendered them |
| Nav item block padding | 10 (`AppSidebar`) / 7 (`SettingsSidebar`) → 8 | one `component.listItem.paddingBlock` across every rail |
| `MpSectionRail` item radius | 6 → 8 | joins the chips-and-menu-items step of the concentric scale |
| `MpSectionRail` / rail search height | 34 → 40 | a search field is a control |
| Table header row (no select column) | 48 → 40 | see "Why headerMinHeight is 40" above |
| Table header padding-block | `5px !important` → 8 | 5 is on no scale stop |
| Table `td:first-child` weight | 550 → `medium` (500) | 550 is on no stop of the 5-step scale; matched to `MpListRow`'s title weight so a table's identity cell and a list row's title read the same |
| `MpTableSkeleton` inline inset | 20 (card) → 16 (table) | it now matches the table it stands in for; it was 4px wider |
| `MpFormDrawer` footer | `py-4` (16) → 20 | one inset on all three bands |
| `MpFormDrawer` title | 17 → 18 | 17 is on no scale stop (round-up rule) |
| `DashboardKpiWidget` inset | `14px 16px 12px` → 12 uniform | the dense tier, stated once from the scale |
| `DashboardKpiWidget` Da Vinci chip | h18 / 10px / `0 7px` → h20 / 11px / `0 8px` | joins the shared chip ramp, matching the copy in `DashboardWidgetCard` |
| `DashboardWidgetCard` empty-state disc | 44 → 40 | 44 is on no scale stop |
| Active nav weight (`AppSidebar`) | 650 → `semibold` (600) | 650 is on no stop; 600 is what `MpSectionRail`'s active row already used |

### Deliberate exemptions (recorded so they are not ambiguous)

Extending the Phase 2/3 list, and each marked in the file it applies to:

- **`StorefrontPreview.vue` in full (P4-8)** — it draws a simulated *merchant's* storefront, not
  Marobase chrome. Its px values are the thing being previewed; forcing the Marobase scale onto
  them would make the preview less honest, not more consistent. The builder chrome around it
  (`StoreEditorSidebar`, `AddSectionDialog`, `ThemeDaVinciPanel`) is fully tokenized — the line
  is drawn at the preview frame.
- **Orb canvas geometry** in `DvOrbitVoiceSurface` — wave-bar dimensions, the 2.5px stroke,
  glyph baseline nudges. Same grounds as the chart canvases.
- **`AddSectionDialog`'s schematic mini-mocks** — miniature illustrations of storefront layouts,
  not spacing.
- **Panel and popover *measures*** — a menu card's 280px width, a scroll cap of 380px, a
  truncation measure of 160px. These size a surface to its content; they are not steps on the
  spacing rhythm, and the same distinction already licensed `component.state.measure`.
- **The app bar's mobile full-screen search** is the one `v-dialog` that does **not** compose
  `MpDialog`: its header *is* the search field rather than a title bar, so the shell's header
  contract does not fit it. Recorded in the file.

### Stories

Every Phase 4 component's stories were brought to the template — `Default` → `Variants` →
`Sizes` → `States` → **one realistic composed example** → existing scenarios → `DarkMode` — with
existing scenario stories and per-story dark clones kept, per the brief. Where an axis genuinely
does not exist the story says so and explains what stands in for it, rather than being absent
without explanation (e.g. most of these components have no `size` prop, and their `Sizes` story
demonstrates the token that governs their one sizing decision instead).

**New `src/stories/fixtures.ts`** — shared realistic rows (orders, campaigns, activity, folders)
for the composed examples, so ~45 story files do not each invent a different-looking product.
Same rationale as `storyTemplate.ts`; it overlaps P5-5 and closes part of it early.

Notable composed examples: `MpDataTableToolbar/InContextSalesOrdersTable` (the full documented
Data Table Pattern on real orders), `MpTableSkeleton/InContextLoadingAnOrdersTable` (the
skeleton directly above the table it stands in for, so the alignment fix is checkable),
`MpSectionRail/InContextSettingsWorkspace` (the flavor that replaced `SettingsSidebar`), and
`AppBar` / `AppSidebar` `InContextAppShell`.

`src/stories/DataTablePattern.stories.ts` documents the new `component.table.*` geometry,
including that the height tokens are **floors, not caps** — a row whose tallest cell holds a
real control still grows past them.

### Corrections to the plan, found while doing the work

- **The table header was not ~22px.** The plan predicted the header row would go from ~22px to
  40. Measured, it was already 48 (Vuetify's own `--v-table-header-height`), because the header
  content element carries its own height — the `5px` padding was never what set the row. The
  real change is 48 → 40 on tables without a selection column, and no change (~52) on tables
  with one, where the checkbox drives the row past the floor. Corrected in `global.scss` and in
  the pattern story rather than left overstated.
- **`AppSidebar`'s nav-item `padding-inline` was silently losing** to Vuetify's
  `.v-list-item--density-compact…{padding-inline:16px}` — a (0,3,0) tie decided by source order,
  exactly the trap `global.scss`'s table-padding comment documents. It is stated on a two-class
  descendant now so it wins deterministically. It stays at **16**, not `listItem.paddingInline`
  (12), and that is deliberate: this drawer insets its scroller by 8 and the section rail insets
  its own by 12, so 8 + 16 and 12 + 12 both put the label 24px from the panel edge. Matching the
  raw number would have misaligned them by 4px.
- **`MpOptionCard` was not used for `AddSectionDialog`'s variant tiles**, though the plan
  considered it. Its inset is `card.padding` (20), designed for a full-width wizard tile; in a
  120px thumbnail that leaves ~80px of content. Adding a `density` axis to `MpOptionCard` would
  have meant reopening a component Phase 2 closed, so the tiles were tokenized in place and the
  reason recorded in the file.
- **Storybook's indexer caches partial reads.** Writing ~45 story files in quick succession left
  the running dev server reporting "Could not parse import/exports with acorn" on files that
  `esbuild` and `vue-tsc` both parse cleanly. A restart cleared it; `npm run build-storybook`
  indexes all 953 entries without error. Worth knowing before chasing a phantom syntax error.

### Follow-ups this opens

- **`MpBuilderShell`** (17 builders) was not in any Phase 4 finding and still carries its own
  chrome geometry. It is the last large untokenized shell component.
- The `--r-*` alias layer (`--r-pill`, `--r-chip`, `--r-card`, `--r-section`) is still an extra
  hop in front of the radius tokens; several Phase 4 files now use the `--mp-*` token directly
  while their neighbours use the alias. Collapsing the layer remains a Phase 5 candidate.
- `component.dialog.width.*` currently has three stops. `MpBuilderPreviewDialog` bypasses them
  via `fullscreen`; if a fourth measure appears, that is a signal the ramp is wrong rather than
  a reason to add a stop.

---

## Phase 5 changelog — 2026-08-28

Per CLAUDE.md → "Log every rename or breaking change in the session changelog". Marobase has zero
consumers, so these are renames and deletions, not deprecations. `npm run build-storybook` indexes
all entries cleanly and `npm run build` passes.

### The hierarchy decision

The stated rule was four buckets — `Foundations / Atoms / Molecules / Patterns`. **A fifth,
`Product/`, was added.** 77 of the 123 stories are feature surfaces (Da Vinci 26, Dashboards 28,
Marketing 9, Sales Channels 5, RBAC 4, PLG 4, Merchandising 1) that are not reusable design-system
patterns; filing them under `Patterns/` would have buried the 10 that are, and calling them patterns
would have been untrue. `Product/` reads as "reference, not API". Recorded in `CLAUDE.md` → Story
hierarchy, which now also states the tiering rule the mapping was derived from.

The rule, applied to the real import graph (`MpErrorState → MpEmptyState → MpIllustration`;
`MpConfirmDialog` / `MpMoveToFolderDialog` / `MpBuilderPreviewDialog → MpDialog`;
`MpManageFoldersDrawer → MpFormDrawer + MpConfirmDialog`; `MpDataTableToolbar → MpFormDrawer`):

> **Atom** — a single control or mark: no internal regions, no `Mp*` dependency.
> **Molecule** — has internal regions, or composes another `Mp*`.
> **Pattern** — a reusable multi-component composition or app shell.
> **Product** — a surface specific to one Maropost feature area.

### Story title renames

All 123 story `title:`s were rewritten; 113 changed. The 10 unchanged are `Introduction`, the seven
`Foundations/*` pages, `Patterns/Data Table` and `Patterns/Layering`.

| Was | Now | Count |
|---|---|---|
| `Data Display/{MpStatusChip, MpSourceCloudChip, MpListRow, MpUsageMeter}` | `Atoms/…` | 4 |
| `Forms/MpStatusToggle` · `Feedback/{MpIllustration, MpTableSkeleton}` | `Atoms/…` | 3 |
| `Navigation/{MpFilterTabs, MpWizardSteps}` · `Layout/MpSectionHeader` | `Atoms/…` | 3 |
| `Layout/MpPageHeader` · `Data Display/{MpKpiCard, MpFolderSelect, MpDateRangeSelect, MpDataTableToolbar}` | `Molecules/…` | 5 |
| `Feedback/{MpEmptyState, MpErrorState, MpComingSoonTiles, MpFloatingBulkBar, MpToastStack}` | `Molecules/…` | 5 |
| `Forms/{MpOptionCard, MpMoveToFolderDialog, MpManageFoldersDrawer}` | `Molecules/…` | 3 |
| `Overlays/{MpDialog, MpConfirmDialog, MpFormDrawer, MpRowActionsMenu}` · `Navigation/MpSectionRail` | `Molecules/…` | 5 |
| `Forms/Form Fields` | `Patterns/Form Fields` | 1 |
| `Patterns/ModuleLandingPage` | `Patterns/Module Landing Page` | 1 |
| `Layout/{AppBar, AppSidebar}` | `Patterns/App Shell/…` | 2 |
| `Layout/MpBuilderShell` · `Overlays/MpBuilderPreviewDialog` | `Patterns/Builder Shell/…` | 2 |
| `Settings/{SettingsSection, SettingsPlaceholder}` | `Patterns/Settings/…` | 2 |
| **`AI/MpDaVinciBot`** + `Copilot/*` + `Copilot/Voice/*` | `Product/Da Vinci/…` (+ `/Voice/…`) | 26 |
| `Dashboards/*` (+ `Widgets/`, `Wizard/`, `Dotted/`) | `Product/Dashboards/…` | 28 |
| `Marketing/Journey*` | `Product/Marketing/Journeys/…` | 3 |
| `Marketing/Landing*` | `Product/Marketing/Landing Pages/…` | 6 |
| `Merchandising/*` · `PLG/*` · `RBAC/*` · `Sales Channels/*` | `Product/…` (shape unchanged) | 14 |

`Patterns/Settings/SettingsSection` and `…/SettingsPlaceholder` stayed out of `Product/`
deliberately: they are page-composition scaffolding used across many settings screens, not a
feature surface.

### Files added

- **`src/stories/Introduction.mdx`** — replaces `Introduction.stories.ts`, whose entire body was one
  `docs.description.component` string. Covers what Marobase is in three sentences, the sidebar map,
  the token scale at a glance, local setup, the conventions this Storybook assumes, and a
  **placeholder** Figma library link (with the warning that the first `tokens:push-figma` will orphan
  the existing Design Kit bindings — a Phase 1 follow-up that is still open).
- **`src/stories/Foundation/Overview.mdx`** — the single at-a-glance foundations page. Spacing bars,
  radius specimens and colour swatches, all rendered from `tokensByPrefix()` against
  `design-tokens/generated/tokens.ts`, so a bar's width and a swatch's fill **are** the token values.
  It reuses the existing `foundationTokens.ts` helper rather than duplicating the seven deep pages.
- **`src/stories/decorators.ts`** — shared story frames, sibling to `storyTemplate.ts` and
  `fixtures.ts`. Exports a named `measure` scale (`narrow` · `compact` · `drawer` · `dialog` ·
  `section` · `wide`, resolving to tokens where one exists), plus `constrain()`, `surfaceFrame()`,
  `railFrame()` and `sidebarSkin`.
- **`.storybook/main.ts`** now globs `../src/**/*.mdx`. No new dependencies — `@mdx-js/react`,
  `react`, `react-dom` and `@storybook/react-dom-shim` were already installed.

### Files deleted

- **`src/stories/Introduction.stories.ts`** — superseded by the MDX page.
- **`src/stories/storybookTheme.ts`** — `darkModeGlobals` lost all 61 consumers with P5-3, and
  `lightModeGlobals` / `accentGlobals` had never had any.

### Story exports removed

**72 `DarkMode*` clones across 65 files** (831 exports → 756). Every one was a globals clone —
`globals: darkModeGlobals` or `globals: { theme: 'dark' }` spread over an existing story — so no
scenario coverage was lost, only sidebar duplication. The global Theme toolbar renders any story in
either theme.

### Docs coverage

| | Before | After |
|---|---|---|
| Files with `tags: ['autodocs']` | 122 / 123 | **123 / 123** |
| Files with `docs.description.component` | 123 | 123 |
| Components with `argTypes` | 93 (19 real components had none) | **105** — every component that has props |
| `argTypes` props with a `description` | ~215 of 299 | **all of them** (84 written this phase) |

`MenuPreviewCard` was the one story file with no `autodocs` tag, so it had never produced a Docs
page at all. Now tagged.

**The seven propless components** — `MpToastStack`, `DvToastStack`, `DvDocsAssistant`,
`WidgetLibraryStep`, `AppBar`, `PlgTrialBanner`, `PlgTrialChip` — take no props; they read a store or
composable. Rather than fabricate `argTypes` for them, each Docs page now carries a **Controls**
section naming exactly what drives it (`useToast()`, `useDaVinciToasts()`,
`useDesignSystemKnowledge()`, the emit pair, the seven app-bar stores, `usePlgStore()`), so an empty
Controls panel reads as a decision rather than an omission.

### Deliberate visual changes

Everything else kept its rendered value. These did not:

| Where | Change | Why |
|---|---|---|
| `DashboardTabsWidget` / `DashboardMetricExplorerWidget` story frames | `border-radius: 18px` → `component.card.radius` (16) | 18 is on no stop of the 4/8/10/12/16/20 scale |
| `MpSectionRail` story frame | radius 8 → 16 | it frames an outer surface, not a chip |
| `ThemeDaVinciPanel` story frame | radius 12 → 16, `outline-variant` → `--border-subtle` | same, and it now uses the same border token as every other frame |
| `DashboardGrid` (3 stories) | `layout: 'fullscreen'` → `canvas: 'full'` | the parameter they wanted; `layout` merely restated the global and did nothing |

### Corrections to the plan, found while doing the work

- **A naive `` `,\n `` regex is not a safe anchor for the end of a `docs.description.component`
  template literal.** These descriptions contain escaped backticks in inline code spans, and a
  non-greedy match stops at the first `` \`, `` at end of line — inside a code span — splicing text
  into the middle of the description. It corrupted `DvToastStack` and `PlgTrialChip` before it was
  caught. Walk forward to the first backtick **not preceded by a backslash** instead.
- **`esbuild.transformSync` over every story file is a much cheaper gate than `build-storybook`**
  for the bulk-edit passes — it catches every syntax error in about a second, and both files above
  failed it immediately. Reserve the full build for the final check.
- **The 43 inline `max-width` clamps were not a mechanical swap.** They run to 30 distinct pixel
  values (220 · 240 · 300 · 320 · 340 · 360 · 380 · 420 · 460 · 480 · 520 · 560 · 600 · 620 · 640 ·
  700 · 720 · 880 · 900 · 960 · 1180 · 1240 …). Only four coincide with a named measure; snapping
  the rest would have resized carefully-sized specimens for tidiness. Left in place, and P5-5 is
  recorded as partially closed rather than claimed.
- **`AppBar` and `AppSidebar` carried a `SidebarSkin` type each** used only by their local
  decorators. Both are gone with the move to the shared `sidebarSkin` decorator; the skin is read
  from `parameters.sidebarSkin` as a plain string.

### Components flagged as too rough to show

Not deleted, not excluded from the build — listed so the call can be made deliberately. Ranked by
raw-px declarations in `<style>` blocks (the metric Phases 1–4 used), excluding the four categories
already exempt by recorded decision (`StorefrontPreview` in full per P4-8, `AddSectionDialog`'s
schematic mini-mocks, chart and orb canvas geometry, hairlines and focus rings).

| Component | Raw px | Note |
|---|---|---|
| `marketing/landing/LandingBlockView.vue` | 29 | Largest untokenized component outside the exempt set |
| `rbac/RolePicker.vue` | 20 | |
| `rbac/PermissionMatrix.vue` | 13 | |
| `rbac/UserAccessDrawer.vue` | 11 | |
| `marketing/JourneyFlowColumn.vue` | 11 | |
| `copilot/DvToastStack.vue` | 10 | |
| `marketing/landing/LandingBlockSettings.vue` | 7 | |
| `marketing/landing/LandingLayersPanel.vue` | 6 | |
| `copilot/DvDocsAssistant.vue` | 6 | |
| `marketing/JourneyMiniPreview.vue` | 5 | |
| `rbac/InviteUsersDrawer.vue` | 4 | |
| `MpToastStack.vue` | 4 | Design-system tier — the only `Mp*` on this list besides the shell |
| `MpBuilderShell.vue` | 4 | The last large untokenized shell; already a Phase 4 follow-up |
| `dashboards/dotted/DtRingDonut.vue` | 2 | **Dead**: no story, no consumer (P5-4) |

The whole `Product/Marketing` and `Product/RBAC` groups are the weak spots — every Landing Pages and
RBAC component is on this list. They were never in a Phase 1–4 finding, so they have not had a
tokenization pass.

### Follow-ups this opens

- The `Product/` bucket is a **hierarchy** decision, not a quality one. Nothing in it has been
  through a Phase 1–4 sweep, and the flagged list above is drawn almost entirely from it. A "Phase 6
  — Product tier" would be the honest next pass.
- `src/stories/decorators.ts` exists but is consumed by only 6 files. The `measure` scale needs
  either adoption across the 43 clamp sites or a decision that story-canvas widths stay ad hoc.
- The `--r-*` alias layer (`--r-pill`, `--r-chip`, `--r-card`, `--r-section`) is still an extra hop
  in front of the radius tokens — carried over unresolved from the Phase 4 follow-ups.

---

## Phase 5.5 changelog — 2026-08-28

Per CLAUDE.md → "Log every rename or breaking change in the session changelog". Marobase has zero
consumers, so these are changes, not deprecations. `npm run build`, `npm run type-check`,
`npm run build-storybook` and `npm run contrast:check` all pass.

### The naming convention this settles

**`on<Surface>`** — Material-style, and the convention `tokens.json` already used
(`onPrimary`, `onSurfaceVariant`, `on*Container`, `accent.*.onAccent`). Phase 5.5 extends it to the
surface ladder rather than inventing a second vocabulary such as `text-on-*`. Every token that
*hosts* text, an icon or a border now has a declared partner, and the partnership is machine-checked.

### Tokens added

| Group | Tokens | Why |
|---|---|---|
| `color.{light,dark}` | `onSurface` · `onSurfaceMuted` | the declared ink for the whole surface ladder |
| `color.light` | `textSecondary` · `textDisabled` · `iconPrimary` · `iconSecondary` · `iconDisabled` · `surfaceRaised` · `surfaceSunken` · `interactiveDefault` · `interactiveHover` · `interactiveActive` · `interactiveDisabled` | mirrors the dark set so the alias layer is a 1:1 map |
| `color.light` | `navSurfaceGray` · `navIconStudio` | from `shell-variants.css` / `sidebar-gray.css` |
| `color.{light,dark}.cloud.*` | 6 clouds × `accent`/`text` (+ retail `link`/`linkHover`) | from `source-cloud-colors.css` |
| `color.{light,dark}.dv.*` | accent/ink/gradient/orb/ring + a 22-value `orbit.*` sub-palette + `fogTint` | from `dv-tokens.css` / `dv-diffusion.css` |
| `color.chart` | `heatmapInk` · `heatmapInkStrong` | theme-independent, because the fill they sit on is |
| `shadow` | `dvOrbitMic` · `dvOrbitInput` (+ `shadow.dark.*`) | from `dv-tokens.css` |
| `$contrastPairs` | 241-entry manifest | the pairing contract, read by `check-contrast.mjs` |

### Aliases added (`mp-theme-aliases.css`, both themes)

`--on-surface` · `--on-surface-muted` · `--on-pos` · `--on-neg` · `--warn` · `--warn-soft` ·
`--warn-ink` · `--on-warn`. The `--warn` trio's absence is why `retail-widgets.scss` hardcoded its
amber: `--pos` and `--neg` existed and warning did not.

### Deliberate value changes

Everything else kept its rendered value. These did not — each is a contrast fix, and each keeps its
hue:

| Token | Was → Now | Why |
|---|---|---|
| `light.aiAccent.gradientTo` | `#0E8FA8` → `#0B7E95` | its own `$description` claimed 4.6:1 with `onAccent`; measured 3.81:1. Now 4.74:1 |
| `chart.light.axisLabel` | `α 0.55` → `α 0.65` | axis labels are text: 3.95:1 → 5.49:1 |
| `light.moduleTile.amber.accent` | `#f59e0b` → `#d97706` | icon glyph at 2.15:1 → 3.19:1 |
| `sidebar.textMuted` | `#737373` → `#5f5f5f` | 4.16:1 → 5.60:1 |
| `sidebar.textFaint` | `rgba(115,115,115,0.62)` → `#6b6b6b` | 2.23:1 → 4.68:1; "faint" is still text |
| `light.dv.orbit.mist` | `#8499AF` → `#5F7285` | colours 12–13px hint/message/echo text: 2.73:1 → 4.62:1 |
| `light.dv.orbit.muted` | `#94A3B8` → `#78899F` | orb dim/error mark: 2.34:1 → 3.26:1 |
| `dark.dv.orbit.muted` | `#64748B` → `#71829A` | same, dark: 2.90:1 → 3.53:1 |
| `light.dv.orbit.blue` | `#1B9FE0` → `#1A96D3` | typing caret + chip hover border: 2.76:1 → 3.08:1 |
| `light.outline` | `#d4d4d4` → `#8a8a8a` | P5.5-12: outlined-field boundary, 1.37:1 → 3.19:1 on canvas |
| `dark.borderStrong` | `#4D535B` → `#7C848F` | P5.5-12: same, 1.54:1 → 3.17:1 on surfaceOverlay |

### What the checker deliberately does not enforce

Recorded so the exemptions are not ambiguous, extending the Phase 2–4 exemption list:

- **`decorative`** — hairlines and dividers (`border`, `borderSubtle`, `outlineVariant`,
  `tooltipBorder`, `inkPanel.border`, `aiAccent.border`, `sidebar.border`). WCAG 1.4.11 scopes
  non-text contrast to what is *required to identify a component or state* and to *essential*
  graphics; a separator repeating structure that layout and spacing already convey is neither.
  Measured and printed, never failed.
- **`disabled`** — 1.4.3 exempts disabled controls.
- **`controlBoundary`** — **enforced** (3:1). It was introduced as a report-only FLAG level for
  `outline`; once the design owner approved raising it (P5.5-12) the level was promoted to enforced
  so the fix cannot regress, and the `FLAGGED` set in `check-contrast.mjs` is now empty. Re-add a
  level there only for a pair that is genuinely a pending design decision.
- **Chart series ramps, brand gradients, orb canvas colour** — data-viz and brand colour, not text
  or essential UI. The Da Vinci gradient is checked at 3:1 rather than 4.5:1 because its verified
  consumers host an icon and the orb mark, never body text. Chart axis/legend/tooltip pairs *are*
  checked: they carry text.
- **Mask-image `#000` stops** (`dv-diffusion.css`, `DvOrbitOrb`) — in a mask, black is opacity, not
  colour. Marked in-file.
- **Merchant brand fixtures** in `StorefrontPreview`, `LandingPageStylePanel` and
  `LandingBlockSettings` stories — the merchant's own colours are the *content* being previewed.
  Same line Phase 4 drew for `StorefrontPreview` (P4-8); now annotated in each story file.
- **`.storybook/theme.ts`** — 16 hex values for the Storybook *manager* chrome (sidebar, toolbar).
  Not product UI, and Storybook's manager takes a static theme object, not CSS vars. It stays light
  even when the canvas is dark; cosmetic, and noted rather than changed.

### Corrections to the plan, found while doing the work

- **The Storybook fix was one line, not a stylesheet.** The plan expected to pair colours on
  `.mp-story-canvas`. That helps, but the actual root cause was structural: `<v-app>` sat *outside*
  the `<v-theme-provider>`, so `global.scss`'s `.v-application { color: … }` resolved against the
  light theme and inherited downward. `<v-app :theme>` fixes it at the source and additionally makes
  `.v-application.v-theme--maropostDark`-qualified selectors match in Storybook the way they do in
  the app — which `source-cloud-colors.css` had been silently relying on the `[data-theme]` half of
  its selector to survive.
- **The heatmap needed a luminance function, not a token swap.** The plan proposed theme-scoped ink
  tokens. But `tintHex()` mixes toward white in *both* themes, so the fill is light regardless of
  theme and any theme-following ink is wrong by construction. Choosing the ink from the fill's own
  luminance (`readableInkOn`) is the only form that holds across the palette presets a user can
  switch to with `?chart=`.
- **Migrating a palette is a contrast audit.** Moving the Orbit values into `$contrastPairs` exposed
  6 failures (P5.5-13) that no amount of reading the CSS would have surfaced, because nothing had
  ever computed a ratio for them. The migration was scoped as bookkeeping and paid for itself.
- **`--warn` was the real bug behind `retail-widgets.scss`.** The hardcoded amber looked like
  laziness; it was a missing token. `--pos` and `--neg` existed, warning did not, so the one variant
  that needed it had nowhere to go.
- **`color.sidebar.*` has no light-theme consumer.** `--mp-color-sidebar-*` is defined only in the
  dark block of `mp-theme-aliases.css`; in light theme `AppSidebar` falls through to its
  `var(…, --surface-primary)` defaults and the skins own the appearance. Its two text failures were
  fixed anyway — the group is live the moment anything binds it — but nothing rendered them today.

### Follow-ups this opens

- **`src/views/**` was out of scope and holds ~420 colour literals**, 187 of them in
  `PosPreview.vue` alone. `src/components` and `src/styles` are now clean (the 22 remaining matches
  are prose in comments plus the 7 documented mask stops). A views pass is the honest next step and
  pairs naturally with the "Phase 6 — Product tier" already proposed.
- **`npm run contrast:check` is not wired into anything.** The repo has no test runner and no CI, so
  the checker and `addon-a11y`'s `test: 'todo'` are both manual gates today.
- **`scripts/ui-visibility-audit.mjs` still does not scan `src/stories` or `.storybook`**, and its
  `contrast:hardcoded-color` rule counts hex values inside comments — which is why its "remaining"
  number reads higher than the real one.

---

## Phase 6 changelog — 2026-08-28

Per CLAUDE.md → "Log every rename or breaking change in the session changelog". Marobase has zero
consumers, so these are renames and deletions, not deprecations — no compatibility aliases were
kept. In-repo call sites were swept in the same pass. `npm run build`, `npm run type-check`,
`npm run build-storybook` and `npm run contrast:check` all pass.

### Tokens added

| Group | Tokens | Resolves to |
|---|---|---|
| `component.dialog` | `headerGap` · `headerMinHeight` | `{space.8}` · 88px |
| `component.drawer` | `width.{sm,md,lg}` | 440 / 480 / 640 |
| `component.field` | `sectionGap` · `boxPadding` | `{space.24}` · `{space.2}` |
| `lineHeight` | `snug` · `compact` | 1.3 · 1.4 |
| `shadow` | `scrollUp` (+ `shadow.dark.scrollUp`) | `shadow.sm` mirrored upward |
| `layout` | `breakpointCompact` | 640px |
| `color.{light,dark}` | `buttonDisabled` · `onButtonDisabled` | `{interactiveDisabled}` · `#828282` / `#8A9199` |
| `$contrastPairs` | 4 entries | disabled button fill and overlay surface, both themes, at `ui` (3:1) |

`layout.drawerWidth` was an orphan (declared 480, consumed by nothing — `MpFormDrawer` hardcoded
the number). It is now an alias for `component.drawer.width.md`.

**Why `headerMinHeight` is 88 and not a scale stop.** It is a measure, like the dialog widths and
`state.minHeight`, not a step on the spacing rhythm: it is the height a title-plus-subtitle header
actually needs (20 padding × 2 + a 20.8px title + 2 + an 18.2px subtitle), rounded up to the 4px
grid. Confirmed by measurement in `SideBySideRegression` before anything downstream depended on it.

**Why `field.boxPadding` exists.** `component.control.height` says 40, but every field paints a
44px box, because `settings-form.scss` adds 2px of padding inside the outline. That 2px was a raw
literal, and it is the exact offset anything aligning to a field's box needs — the trailing action
button in `MpFormGrid` derives its vertical offset from it rather than hardcoding 2.

### API renames

| Component | Was | Now |
|---|---|---|
| `MpFormDrawer` | `width: number` (default 480) | `size: 'sm' \| 'md' \| 'lg'` (default `md`) — **breaking** |
| `MpDialog` | — | new `flush`, `guarded` props · new `close` emit · new `#footerStart` slot |
| `MpFormDrawer` | — | new `#footerStart` slot |

### Components added

- **`MpFormGrid`** — the one form layout container. `cols: 1 | 2`, plus the `mp-form-grid__full`
  and `mp-form-grid__trailing` child classes.
- **`MpFormSection`** — the one in-form section heading.
- **`MpFormField`** — label / hint / error / aria for composite controls only.
- **`useScrollEdges`** (`src/composables/`) — the scroll-edge state both shells read.

### Components deleted

None. The dead `.mp-field-label` **class** in `settings-form.scss` was deleted (zero consumers
since it was written; `MpFormField` is the job it described).

### Deliberate visual changes

Everything else kept its rendered value. These did not:

| Where | Change | Why |
|---|---|---|
| **Field rhythm, everywhere** | field-level `mb-*` deleted; the container's gap is the whole distance | 592 margins were stacking on top of a shell or grid gap, rendering 24–40px where 16 was intended. **This is the point of the phase** — the tighter spacing is correct, not a regression to undo |
| Overlay header height | 72 / 87 / 109 → 88 / 88 / grows | one floor, so a confirm and a form modal start their body in the same place. 103 `MpConfirmDialog` call sites get a ~16px taller header |
| `MpFormDrawer` title | 18 → 16 | one overlay title size |
| Raw-dialog titles | 15 → 16 | same, via the shell |
| Eyebrow tracking | `0.08em` → `letterSpacing.eyebrow` (0.06em) | joins the one eyebrow spec |
| Drawer widths | 8 values (420–680) → 440 / 480 / 640 | 560/600 and 680 move to 640; every unset drawer is unchanged |
| `SalesChannelDetail` preview dialog | 1040 → 880 (`lg`) | joins the ramp |
| Expanded-widget dialog (×2) | 1120 → 880 (`lg`, `flush`) | same, and the two files stop being byte-identical copies |
| `RolesPermissionsPage` upsell footer | centred → right-aligned | one footer pattern |
| Multi-chip select chevron | centred in the box → pinned to the first chip row | the reported defect; 25 sites |
| In-field chips | 26 → 24 (`chip.height.md`) | a select with chips is now the same height as one without |
| Prefixed / suffixed fields | 52 → 44 | the affix was padded from a different variable than the input |
| Stacked number input | 81 → 44 | its two steppers were each inheriting the theme's `VBtn min-height: 40` |
| Two-column rows | a hint under one column no longer grows the control beside it | grid `align-items: start` |
| Trailing action buttons | 28px, short of the edge → 40px, on the form's right edge | fills its own track; also a proper tap target |
| Disabled buttons | Vuetify's hardcoded 26% alphas → the `buttonDisabled` token pair | ~2.1:1 → ≥3:1 against the modal surface |
| Selection controls | raw Vuetify defaults → the field defaults | a checkbox group and the fields above it now share one rhythm |

### Deliberate exemptions (recorded so they are not ambiguous)

- **`AppBar.vue:782`'s mobile full-screen search** stays a raw `v-dialog`. Its header *is* the
  search field rather than a title bar, so the shell's header contract does not fit. It is the only
  one, and the grep gate is written to allow exactly it.
- **Toolbar searches, table-cell editors and chat composers** keep `placeholder` + `aria-label`
  instead of a floating label, and keep their deliberate `hide-details`. A floating label would
  break the pill geometry `MpDataTableToolbar` pins, and a details row would grow every table row.
  Each site carries a one-line comment saying it is chrome, not a form field.
- **`MpFormDrawer` did not gain `eyebrow` / `icon` / `lead` / `tone` / `headerActions`.** No drawer
  consumer needs them; adding them "for parity" would be speculative API.
- **The disabled *fill* is not raised to 3:1**, only the label. A disabled button whose fill cleared
  3:1 against the surface would read heavier than an enabled secondary button.
- **Demo and presentation canvases** (`Deck/`, `Showcase/`, `Reel/`, `ChartLab/`, `EvilDashboard/`,
  `ShadcnDashboard/`, `DesignSystem/`) were not swept. Their raw Vuetify fields are the *subject* of
  before/after comparisons.
- **`PosPreview.vue`'s two dialogs were converted; the rest of the file was not.** It simulates a
  merchant POS UI, which is the same line P4-8 drew for `StorefrontPreview` — but a dialog is
  Marobase chrome even inside a simulation. Worth a formal exemption note like P4-8's.
- **The 736 remaining `mb-*` / `mt-*` utilities** are card, dashboard and page-shell internals, not
  form fields. A final attribute-aware audit found 9 field-level margins left, all of them chrome
  (a tab strip, a preview-panel select) or in demo canvases.

### Corrections to the plan, found while doing the work

- **`vue-tsc` does not catch a removed prop.** The plan assumed deleting `MpFormDrawer.width` would
  make the codemod compile-forced. It does not: an unknown attribute on a component is a legal
  fall-through attr in Vue, so all 27 `:width="520"` call sites type-checked clean. The sweep had to
  be grep-driven and grep-verified. Same lesson as the Phase 3 note about templates, one level up.
- **`MpConfirmDialog` could not take `Fulfillments.vue`'s confirm.** The old audit listed it as a
  raw confirm to convert, but its body carries a tracking-number field, and `MpConfirmDialog` has no
  body slot — converting it would have silently dropped the field. It is `MpDialog size="sm"` with
  the same two-button footer instead.
- **The Tickets affix hand-patch was not the one this phase deletes.** It looks identical to the
  outlined-affix override that P6-12 removed, but it is on a `variant="plain"` control, which
  Vuetify top-aligns by design and which no app-level outlined rule ever touched. It stays,
  tokenized, with a comment saying why.
- **Chips inside a field are not on the chip ramp by inheritance.** Phase 2 asserted the ramp in
  each chip component's own scoped CSS, so a bare `v-chip` — which is what a select renders for a
  selected value — still gets Vuetify's 26px. Field chrome has to pin it.
- **`!important` is unavoidable for the stacked stepper.** `maropostTheme` applies the `VBtn` ramp
  as an inline `style` attribute, which no stylesheet rule can outrank. Recorded in-file so it does
  not read as sloppiness.
- **A subagent over-reached on `StoreNavigationMenuEditor` and it was reverted.** It had replaced a
  row's three inline actions with a kebab menu because three buttons do not fit
  `mp-form-grid__trailing`'s single track — an interaction change the brief forbade. The bordered
  row, its animation and its three one-click buttons were restored; the Phase 6 fixes landed around
  them, and a comment records why the trailing class is not used there.

### Follow-ups this opens

- **`.settings-grid` / `.settings-field` are now unused by any view** — the settings pages moved to
  `MpFormGrid`. The rules survive only because `FormFields.stories.ts` still demonstrates them.
  Deleting them, and the `.settings-page .stack` rule beside them, is a small clean-up.
- **`docs/overlay-audit/01-overlay-component-audit.md` is stale in a dozen specifics** (it predates
  `MpDialog` and still describes nine components as raw `v-dialog`s). It is a Phase-1 audit
  document, so the honest fix is a dated note at its head rather than a rewrite.
- **`component.dialog.width` and `component.drawer.width` are two ramps at three stops each.** They
  differ only at md and lg. If a fourth stop is ever proposed for either, that is a signal the two
  should merge rather than grow.
- **The 736 non-field margins** are the next spacing pass, and they are concentrated in the Da Vinci
  display cards and `ModuleLandingPage` — the same Product tier the Phase 5 changelog already
  flagged as never having had a tokenization sweep.
