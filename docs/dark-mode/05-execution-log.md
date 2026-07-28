# 05 — Execution Log (Dark Mode)

Append one entry per completed work package, in order. Do not edit prior entries except to correct a factual error (mark corrections explicitly). Each entry follows the plan's required shape: work package, files changed, tokens changed, hard-coded colors removed, tests run + results, deviations from the plan, known issues.

---

## Baseline note (orchestrator, before WP-01)

Independently confirmed against `master` (`git checkout master -- .`, ran `vue-tsc -b --noEmit`, then restored the branch with `git checkout HEAD -- .`): the 13 `ReelFlyView.vue` strict-null errors reported by `type-check`/`build` throughout this log are **pre-existing on `master`**, unrelated to any file this project touches. From here on, `type-check`/`build` are treated as passing for dark-mode purposes if these exact pre-existing errors are the only output; a genuine failure is any *additional or different* error. Not in scope to fix (unrelated to dark mode).

## WP-01 — Foundation and semantic tokens

- **Work package completed:** WP-01 — added the approved dark-mode semantic token foundation, derived RGB CSS properties, and regenerated token outputs.
- **Files changed:**
  - `src/design-tokens/tokens.json`
  - `src/design-tokens/build.mjs`
  - `src/design-tokens/generated/_variables.scss`
  - `src/design-tokens/generated/variables.css`
  - `src/design-tokens/generated/tokens.ts`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** added 202 token leaves: 9 surface/interaction/scrim tokens, 5 text/icon tokens, 3 border/focus tokens, 72 accent-role tokens, 10 AI action/orbit tokens, 10 feedback tokens, 8 dormant dark-parity tokens, 82 chart tokens, and 3 dark shadow tokens. Revised approved dark border, error, AI border, ink-panel, and dark chart values.
- **Hard-coded colors removed:** none — this package is additive only.
- **Tests run + results:**
  - `npm run tokens:build` — passed (generated 499 tokens).
  - `npm run type-check` — failed on pre-existing `src/views/Reel/ReelFlyView.vue` strict-null errors (lines 26, 31–33, 108–110); no token-related errors.
  - `npm run build` — failed at the same `vue-tsc` errors before Vite ran.
- **Deviations from the plan:** none.
- **Known issues:** repository type-check/build are currently blocked by the existing `ReelFlyView.vue` strict-null errors above.

## WP-02 — Vuetify mapping and accent runtime bridge

- **Work package completed:** WP-02 — mapped the complete dark Vuetify color vocabulary and moved accent selection to mode-specific, generated-token-backed CSS overrides.
- **Files changed:**
  - `src/plugins/maropostTheme.ts`
  - `src/composables/useAppTheme.ts`
  - `src/styles/accent-presets.css`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — this package wires the WP-01 generated tokens without changing their source or outputs.
- **Hard-coded colors removed:** all `ACCENT_DEFS` hex/RGB literals and all literal accent values in `accent-presets.css`.
- **Tests run + results:**
  - `npm run type-check` — only the 13 known pre-existing `src/views/Reel/ReelFlyView.vue` strict-null errors; no WP-02 errors.
  - `npm run build` — stopped at the same 13 known pre-existing `ReelFlyView.vue` type errors before Vite ran; no WP-02 errors.
  - `npm run audit:ui` — completed with exit code 1 and 1,287 pre-existing repository findings (3 high, 383 medium, 901 low); no WP-02-specific finding category.
- **Deviations from the plan:** none.
- **Known issues:** repository type-check/build remain blocked by the pre-existing `ReelFlyView.vue` strict-null errors; the existing UI audit reports unrelated repository-wide findings.

## WP-03 — Global surfaces, aliases, and duplicate-layer retirement

- **Work package completed:** WP-03 — installed the semantic surface, text, border, accent, elevation, and feedback aliases; mapped `surface-light` through Vuetify; and retired the duplicate palette stylesheets.
- **Files changed:**
  - `src/styles/mp-theme-aliases.css`
  - `src/styles/app-styles.ts`
  - `src/styles/mb-foundation.tokens.css` (deleted)
  - `src/styles/marobase-tokens.css` (deleted)
  - `src/plugins/maropostTheme.ts`
  - `src/components/copilot/DvRefineDialog.vue`
  - `src/components/copilot/DvExpandDialog.vue`
  - `src/views/Commerce/CommerceCloudLanding.vue`
  - `src/styles/global.scss`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — this package consumes the WP-01 generated token vocabulary. `surface-light` maps to the existing light bright surface and the authored dark `surfaceLight` token.
- **Hard-coded colors removed:** both duplicate authored CSS palettes; the now-orphaned `--mb-*` bridge; hard-coded dashboard trend colors in the alias layer; and all `--mb-*` references from Commerce Cloud.
- **Tests run + results:**
  - `npm run type-check` — only the 13 known pre-existing `src/views/Reel/ReelFlyView.vue` strict-null errors; no WP-03 errors.
  - `npm run build` — stopped at the same 13 known pre-existing `ReelFlyView.vue` type errors before Vite ran; no WP-03 errors.
  - `npm run build-storybook` — failed before preview completion on the pre-existing generated Sass ordering error: `_variables.scss:191` references `$mp-color-dark-borderStrong` before it is defined.
  - `npm run audit:ui` — completed with exit code 1 and 1,150 repository-wide findings (3 high, 383 medium, 764 low).
- **Deviations from the plan:** removed the 11-line orphaned `--mb-*` bridge from `src/styles/global.scss` as well as the listed files so the required source-wide zero-reference check passes.
- **Known issues:** repository type-check/build remain blocked by the pre-existing `ReelFlyView.vue` strict-null errors; Storybook remains blocked by the existing WP-01 generated Sass declaration-order defect; the existing UI audit reports repository-wide findings.

## WP-04H — Rendered dark-mode corrections (dividers, surface separation, button glow)

- **Work package completed:** WP-04H — a corrective package raised from direct rendered inspection of the running app in dark mode, ahead of the remaining numbered packages. Three reported defects were reproduced, root-caused against computed styles, and fixed token-first.
- **Trigger:** user-reported, rendered-verified: (1) "very strong hr inside cards", (2) "cards has same bg color", (3) "white glow instead of shadow". Guidance received with the report: default to Material Design 2 dark-theme fundamentals (`https://m2.material.io/design/color/dark-theme.html#anatomy`) where an exact value or technique is uncertain.

### Root causes (measured in the browser, dark mode, `localhost:5173`)

| Defect | Measured before | Root cause |
|---|---|---|
| Too-strong in-card `hr` | `.v-card .v-divider` `border-top-color: rgb(126,123,117)` at `opacity: 1` (≈3.9:1 on the card fill) | `color.dark.borderDividerMuted`, `borderTableRow`, and `borderTableFooterDivider` all aliased `borderSubtle` (`#7E7B75`), an **opaque mid-grey**. The light theme uses low-alpha overlays for the same roles (`rgba(26,24,20,0.06)`), so only dark mode rendered dividers as hard rules. |
| Cards indistinguishable from canvas | canvas `rgb(26,23,20)` vs card `rgb(34,32,25)` — a +8/+9/+5 step | `color.dark.surface` sat only ≈1 Material overlay step above `color.dark.background`, and the four tiers above it were spaced 5–8 units apart, so no tier read as a distinct container. |
| White glow instead of shadow | `.v-btn--variant-flat` computed `rgba(255,255,255,0.16) 0 1px 0 inset, rgba(45,99,232,0.24) 0 1px 3px` in **both** themes | `src/styles/global.scss` hard-coded a light-surface top-edge sheen with no theme branch. On a dark button fill the white inset reads as a glow, not elevation. |

### Changes

- **Tokens changed** (`src/design-tokens/tokens.json`, dark only):
  - Surface ladder re-spaced on Material dark overlay logic — largest step at canvas→card, decreasing increments above, so every tier is perceptibly distinct:
    | Tier | Token | Before | After |
    |---|---|---|---|
    | L0 canvas | `background` | `#1A1714` | `#1A1714` (unchanged) |
    | L1 card | `surface` | `#222019` | `#2C2820` |
    | L2 raised | `surfaceRaised` | `#2A2820` | `#312D24` |
    | L1 nested | `surfaceVariant` | `#2E2B25` | `#353128` |
    | L3/L4 overlay | `surfaceBright` | `#333028` | `#39352C` |
  - `surfaceLight` now aliases `surfaceRaised` (was a duplicated `#2A2820` literal), so the legacy Vuetify `surface-light` key tracks its tier.
  - Divider roles decoupled from the opaque boundary token and moved to Material-style low-alpha white overlays: `borderDividerMuted` → `rgba(255,255,255,0.12)`, `borderTableFooterDivider` → `rgba(255,255,255,0.12)`, `borderTableRow` → `rgba(255,255,255,0.08)` (lightest of the set so stacked rows do not accumulate into a grid).
  - `color.chart.dark.tooltipBackground` now aliases `surfaceBright` instead of repeating `#333028`, so chart tooltips stay on the overlay tier.
  - `color.dark.borderSubtle` (`#7E7B75`) deliberately **unchanged** — it remains the opaque essential-boundary value for card/control outlines at the plan's 3.12:1.
- **Files changed:**
  - `src/design-tokens/tokens.json`
  - `src/design-tokens/build.mjs`
  - `src/design-tokens/generated/_variables.scss`, `variables.css`, `tokens.ts` (regenerated)
  - `src/styles/mp-theme-aliases.css`
  - `src/styles/global.scss`
  - `.gitignore`
  - `docs/dark-mode/05-execution-log.md`
- **Hard-coded colors removed:** the `rgba(45,99,232,0.24)` literal in `global.scss` (now `--mp-rgb-color-light-accent-blue-focusRing`), and the duplicated `#2A2820` / `#333028` literals in `tokens.json`.
- **Shadow corrections:** added theme-aware `--btn-flat-shadow` to the alias layer — light keeps its exact previous sheen + tinted lift, dark uses `--elevation-raised` (`0 1px 2px rgba(0,0,0,0.32)`), so dark elevation is never simulated with light. Also repointed `.card-hover:hover` and the popover/menu surface from the light-only `--mp-shadow-md`/`--mp-shadow-lg` to the theme-aware `--elevation-overlay`/`--elevation-modal`.

### Deviations from the plan (and rationale)

1. **§2.4 required opaque divider values** (`borderDividerMuted`/`borderTableRow`/`borderTableFooterDivider` aliasing `borderSubtle` at `#7E7B75`, 3.12:1). This value is the direct cause of defect (1): an opaque mid-grey at ~3.9:1 on the card fill renders in-card separators as hard rules. Corrected to low-alpha white overlays per Material dark guidance. Dividers are decorative separators, not essential boundaries — the plan's own §2.4 note permits decorative separators to opt out — and the essential boundary token `borderSubtle` retains its 3.12:1 opaque value, so no non-text contrast requirement is weakened.
2. **§2.2/§3 pinned the dark surface values as "keep"** and stated surface distinction would come from tiers, borders, and shadows alone. Rendered inspection shows that is insufficient: the canvas→card step was ≈1 Material overlay step, which is defect (2). The ladder was re-spaced. Because all audited "on surface" ratios were computed against `#222019`, each was re-derived against the new fills; the binding constraint is danger text `#EF8176`, which caps the overlay tier — it holds at **4.67:1** on the new `#39352C` (plan target ≥4.5:1, preserving the A6 fix). Primary text holds at 12.42:1 on the card and 10.34:1 on the overlay; disabled text holds at 4.25:1 (above the 3:1 floor for disabled content).
3. Re-applied the `generateScss` alias-resolution fix in `build.mjs` (emit literals instead of `$a: $b`). This had been authored earlier in the session but was lost from the working tree; without it `build-storybook` fails on Sass declaration order. This clears the "Known issues" entry carried by WP-01 through WP-03.

### Tests run + results

- `npm run tokens:build` — 499 tokens generated; diff confined to dark values. **Zero light-token drift** (`git diff` on generated output contains no `color-light` change).
- `npm run type-check` — 12 errors, all pre-existing `src/views/Reel/ReelFlyView.vue` strict-null errors; no new errors. (The transient `usePlg.ts` errors seen mid-session came from unrelated uncommitted retail WIP and are gone now that the tree matches HEAD.)
- `npm run build` — still stops at the same pre-existing `ReelFlyView.vue` errors. `npx vite build` run separately: **succeeds** (`✓ built in 11.55s`), confirming the bundle and style pipeline are healthy.
- `npm run build-storybook` — **passes** (`✓ built in 21.14s`). Previously blocked; fixed by deviation 3.
- `npm run audit:ui` — 1,149 findings (3 high, 383 medium, 763 low); the 3 high are pre-existing tiny-font findings in `AcquisitionForms.vue` and `PosPreview.vue`, unrelated to this package. No new category introduced.
- **Rendered verification** (Playwright, dark mode): in-card dividers now compute `rgba(255,255,255,0.12)`; flat buttons compute `rgba(0,0,0,0.32) 0 1px 2px` with no inset; card fill `rgb(44,40,32)` against canvas `rgb(26,23,20)`. Screens checked: dashboard overview, Settings → Account Defaults, Contact detail.
- **Light-mode regression check** (Playwright, light mode, Contact detail): `--v-theme-surface` `255,255,255`, `--v-theme-background` `244,246,250`, card `rgb(255,255,255)`, divider `rgba(26,24,20,0.06)`, flat-button shadow `rgba(255,255,255,0.16) inset, rgba(45,99,232,0.24)` — all identical to pre-change values.
- Linting: unavailable — the repository defines no lint script.

### Known issues

- `npm run build` remains blocked by the pre-existing `ReelFlyView.vue` strict-null errors (baseline, unrelated to dark mode); `npx vite build` passes.
- Chart gridline `color.chart.dark.grid` is still the opaque `#7E7B75`. Left untouched here to keep this package surgical; it belongs to WP-09 (charts).
- Non-card `v-divider` instances outside `.v-card`/overlay/drawer scopes still take Vuetify's generic border color at 50% opacity. Not part of the reported defect; to be swept with WP-06.

## WP-04 — Navigation (sidebar dark mode)

- **Work package completed:** WP-04 (partial) — unified dark-mode side nav with the head nav; retired navy `#22304b`; skins now differentiate light mode only.
- **Files changed:**
  - `src/styles/sidebar-dark.css`
  - `src/styles/shell-variants.css`
  - `src/components/layout/AppSidebar.vue`
  - `src/components/layout/AppSidebar.stories.ts`
  - `src/components/layout/AppBar.stories.ts`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — consumes existing `--mp-color-dark-*` tokens by name (not theme-conditional sidebar aliases) so dark chrome also renders correctly under light app theme + dark skin.
- **Hard-coded colors removed:** navy `#22304b` from sidebar dark skin; white-alpha rgba literals in scrollbar/switch/flyout replaced with `rgba(var(--mp-rgb-color-dark-textPrimary), …)`; rail toggle pill black rgba shadows replaced with `--elevation-raised` / `--elevation-overlay`.
- **Tests run + results:**
  - `npm run type-check` — 13 errors, all pre-existing `ReelFlyView.vue` strict-null errors; no WP-04 errors.
  - `npm run build-storybook` — passed (`✓ built in 18.77s`).
  - **Rendered verification** (Playwright, dark mode, `localhost:5173`): sidebar + app bar both compute `rgb(26, 23, 20)` with matching `--mp-nav-surface`; light gray skin unchanged at `rgb(234, 237, 242)`.
- **Deviations from the plan:**
  1. **§3 navigation model (six skin×mode combinations):** Plan stated AppSidebar interiors continue using the selected skin in dark app mode and all six combinations remain supported. **User decision:** side nav auto-goes dark whenever `data-theme="dark"`, regardless of skin; skins only differentiate light mode. Implemented via `:is(html[data-theme="dark"], [data-sidebar="dark"])` union in `sidebar-dark.css` and `html[data-theme="dark"] { --mp-nav-surface: var(--mp-color-dark-surface) }` in `shell-variants.css`. Storybook: three light skin stories + one unified dark-mode story (skin axis collapses in dark).
  2. **Retired navy `#22304b`:** Root cause was `sidebar-dark.css` + legacy shell binds pinning an independent navy palette. Both navs now bind `--mp-nav-surface` → `--mp-color-dark-surface`, matching AppBar's existing `--surface-1` treatment.
- **Known issues:** MpSectionRail, SettingsSidebar, and in-content rails are out of scope for this partial WP-04 slice.

## WP-09 — Charts and data visualization

- **Work package completed:** WP-09 — mode-aware chart palettes, tooltip chrome, legend markers, and duplicate-series removal.
- **Files changed:**
  - `src/design-tokens/tokens.json`
  - `src/design-tokens/generated/_variables.scss`, `variables.css`, `tokens.ts` (regenerated)
  - `src/plugins/chartPalette.ts`
  - `src/styles/charts.css` (new)
  - `src/styles/app-styles.ts`
  - `src/components/dashboards/widgets/DashboardChartWidget.vue`
  - `src/components/dashboards/widgets/DashboardChartWidget.stories.ts`
  - `src/components/dashboards/widgets/DashboardPieWidget.vue`
  - `src/components/dashboards/widgets/DashboardKpiWidget.vue`
  - `src/components/copilot/DvChartCard.vue`
  - `src/views/Analytics/LiveView.vue`
  - `src/views/ChartThemes/ChartThemesView.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** added 6 light chart chrome tokens (`axisLabel`, `legendLabel`, `grid`, `tooltipBackground`, `tooltipText`, `tooltipBorder`); re-authored `color.chart.dark.grid` from opaque `#7E7B75` to low-alpha `rgba(255,255,255,0.08)`.
- **Hard-coded colors removed:** module-global `chartTooltipTheme = 'light'`, `chartGridColor`/`chartLabelColor` runtime strings, hardcoded legend label colours in LiveView, DvChartCard module-global palette import.
- **Tests run + results:**
  - `npm run tokens:build` — 505 tokens generated.
  - `npm run type-check` — only pre-existing `ReelFlyView.vue` errors; no WP-09 errors.
  - `npx vite build` — succeeds.
  - `npm run build-storybook` — passed (`✓ built in 15.11s`).
- **Deviations from the plan:**
  1. Removed synthetic "Previous" overlay from single-series timeseries charts (user-approved; duplicated data in both modes).
  2. Multi-series timeseries now use dashed secondary strokes (dashArray) instead of colour-only differentiation.
  3. Card widget footers already used `--hairline`; no change required.
- **Known issues:** ChartThemesView still forces light mode (product decision for palette review page). OSM map tiles remain light per plan exception.

### Process note (repository hygiene, not a code change)

Earlier in this session the WP-01–WP-03 commits were found on a mistakenly created `feature/retail-commerce-unification` branch rather than `feature/dark-mode-system`. All three commits were moved onto `feature/dark-mode-system` (fast-forward; `9296227` was already a direct child of that branch's tip) and the stray branch was reset to `master`, which held no unique commits. Separately, a `git checkout master -- .` / `git checkout HEAD -- .` sequence run for verification discarded pre-existing **uncommitted** edits in `src/stores/useAccounts.ts`, `src/router/index.ts`, and `src/stores/usePlg.ts` — unrelated retail WIP that no dark-mode package had touched. Those edits were never staged or committed, so no git-level recovery exists; this is recorded here so the loss is not silently attributed to a dark-mode package.

## Nav-surface corrective (post WP-04, studio dark shell)

- **Work package completed:** Corrective fix — dark-mode nav chrome was painting canvas/background instead of elevated L1 surface when `data-shell="studio"`.
- **Root cause (Playwright, dark mode, `localhost:5173`):** WP-04 verification ran on the default studio shell. `shell-variants.css` bound `html[data-theme="dark"][data-shell="studio"] { --mp-nav-surface: rgb(var(--v-theme-background)) }` and `html[data-shell="studio"] .mp-appbar { background: rgb(var(--v-theme-background)) !important }`, so AppBar + sidebar both computed `rgb(26,23,20)` (= canvas) while cards computed `rgb(44,40,32)` (= L1 surface) — inverting Material hierarchy. Classic shell was already correct (`#2C2820` / `rgb(44,40,32)` for both navs).
- **Files changed:**
  - `src/styles/shell-variants.css`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none.
- **Hard-coded colors removed:** none.
- **Tests run + results:**
  - Playwright (dark, classic + studio): both shells now show `--mp-nav-surface: #2C2820`, AppBar + sidebar `rgb(44,40,32)`, canvas `rgb(26,23,20)`, card `rgb(44,40,32)`.
  - `npx vite build` — succeeds.
  - `npm run build-storybook` — passes.
- **Deviations from the plan:** none — restores the WP-04 intent ("nav cluster paints from the dark token ramp") for studio dark, which the studio-canvas-blend rule had overridden.
- **Known issues:** none for this fix.
- **Commit:** `559e2c5`

## WP-05 — Typography and icons

- **Work package completed:** WP-05 — replaced opacity-based muted text stacks and broken `color="medium-emphasis"` icon/button props with semantic `--text-*` and `--icon-secondary` aliases across page chrome and global utilities.
- **Files changed:**
  - `src/styles/global.scss`
  - `src/components/MpPageHeader.vue`
  - `src/components/MpSectionHeader.vue`
  - `src/components/MpFilterTabs.vue`
  - `src/components/MpEmptyState.vue`
  - `src/components/MpRowActionsMenu.vue`
  - `src/components/MpManageFoldersDrawer.vue`
  - `src/components/MpIllustration.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — consumes existing semantic aliases.
- **Hard-coded colors removed:** `rgba(0,0,0,0.45)` fallback in `MpIllustration`; opacity stacks on `.mp-headline-duo > .is-muted`, `.mp-strike`, `.mp-money__cents`; three `color="medium-emphasis"` props in Mp* components.
- **Tests run + results:**
  - `npm run type-check` — only pre-existing `ReelFlyView.vue` errors.
  - `npx vite build` — succeeds.
  - `npm run build-storybook` — passed.
- **Deviations from the plan:** `MpUsageMeter.vue` already used `text-medium-emphasis` class correctly; no change required (done-by-prior).
- **Known issues:** View-level `color="medium-emphasis"` occurrences outside Mp* scope remain for WP-12 sweep.
- **Commit:** `44a17da`

## WP-06 — Borders and interaction states

- **Work package completed:** WP-06 (partial) — centralized focus rings on `--focus-ring`, fixed generic dark dividers, and aligned key interaction states in global/forms/AppBar/option-card/journey-builder surfaces.
- **Files changed:**
  - `src/styles/global.scss`
  - `src/styles/settings-form.scss`
  - `src/components/MpOptionCard.vue`
  - `src/components/MpPageHeader.vue`
  - `src/components/layout/AppBar.vue`
  - `src/components/marketing/JourneyFlowColumn.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none.
- **Hard-coded colors removed:** global `rgba(primary, 0.36)` focus outline; field focus/error `rgba(..., 0.12)` box-shadows; AppBar action-btn `rgba(on-surface, 0.12)` hover; assistant-pill/cmd-row ad-hoc focus mixes.
- **Tests run + results:**
  - `npm run type-check` — only pre-existing `ReelFlyView.vue` errors.
  - `npx vite build` — succeeds.
  - `npm run build-storybook` — passed.
- **Deviations from the plan:** Card/overlay/divider roles were largely satisfied by WP-04H (done-by-prior with evidence in that entry). This package finishes the open items: generic `v-divider` dark opacity (noted in WP-04H known issues) and focus-ring centralization. `MpDataTableToolbar.vue` ghost-search border opacity and `JourneyFlowColumn.vue` decorative flow-diagram rgba stacks remain for WP-12.
- **Known issues:** AppBar create-btn/user-pill focus states and remaining view-level focus mixes not yet swept.
- **Commit:** `490b33e`

## WP-07 — Forms and controls

- **Work package completed:** WP-07 — applied semantic token hierarchy to outlined fields, selection controls, and form-adjacent pickers (date range, folder select).
- **Files changed:**
  - `src/styles/settings-form.scss`
  - `src/components/MpDateRangeSelect.vue`
  - `src/components/MpFolderSelect.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — consumes `--text-disabled`, `--text-muted`, `--text-primary`, `--icon-secondary`, `--border-default`, `--hairline`, `--focus-ring`, and Vuetify error theme.
- **Hard-coded colors removed:** disabled field `--muted` fallback; date-range trigger icon opacity stack; Vuetify border-color rgba activator borders on MpDateRangeSelect and MpFolderSelect.
- **Tests run + results:**
  - `npm run type-check` — only pre-existing `ReelFlyView.vue` errors.
  - `npx vite build` — succeeds.
- **Deviations from the plan:** MpFormDrawer, MpManageFoldersDrawer, MpMoveToFolderDialog, MpBuilderShell, RBAC/PLG drawers already resolve through global outlined-field baseline and WP-06 focus tokens — no component-level dark selectors or literals found (done-by-prior).
- **Known issues:** Overlay-surface form drawers deferred to WP-10.
- **Commit:** `b6dc7f3`

## WP-08 — Cards, dashboard widgets, and feedback states

- **Work package completed:** WP-08 — aligned KPI trend semantics, dashboard widget elevation/borders, and error/loading feedback surfaces with dark-mode tokens.
- **Files changed:**
  - `src/components/MpKpiCard.vue`
  - `src/components/MpErrorState.vue`
  - `src/components/MpTableSkeleton.vue`
  - `src/components/dashboards/DashboardWidgetCard.vue`
  - `src/components/dashboards/DashboardSetupGuide.vue`
  - `src/components/dashboards/DashboardGrid.vue`
  - `src/components/dashboards/wizard/WidgetLibraryStep.vue`
  - `src/components/dashboards/widgets/DashboardTableWidget.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — consumes `--pos`, `--neg`, `--neg-soft`, `--border-subtle`, `--border-default`, `--elevation-raised`, `--elevation-overlay`, `--elevation-modal`, `--focus-ring`, `--hairline`.
- **Hard-coded colors removed:** dashboard widget `rgba(15,23,42,…)` shadow stacks; KPI trend Vuetify utility classes replaced with `--pos`/`--neg`; error-state and skeleton alpha-on-surface backgrounds.
- **Tests run + results:**
  - `npx vite build` — succeeds.
- **Deviations from the plan:** `DashboardKpiWidget`, `retail-widgets.scss`, `Transactions.vue`, `Locations.vue`, `SalesChannelDetail.vue`, and AppBar `--neg` already resolved through alias layer (done-by-prior). Chart widget internals skipped per WP-09 completion.
- **Known issues:** none for this package.
- **Commit:** `d87be7b`

## WP-10 — Menus, popovers, modals, and drawers

- **Work package completed:** WP-10 — applied L3/L4 overlay surfaces, semantic scrim, borders, and elevation to global teleported overlays and MpFormDrawer.
- **Files changed:**
  - `src/styles/global.scss`
  - `src/components/MpFormDrawer.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — consumes `--surface-overlay`, `--border-default`, `--scrim-overlay`, `--elevation-overlay`, `--elevation-modal`.
- **Hard-coded colors removed:** Vuetify scrim opacity hack; menu/dialog `--mp-border-subtle` and dual-shadow stacks; MpFormDrawer `--mp-shadow-md` and primary-surface fill.
- **Tests run + results:**
  - `npx vite build` — succeeds.
- **Deviations from the plan:** MpConfirmDialog, RBAC/PLG drawers, Dv* dialogs inherit corrected global overlay rules without per-file edits (done-by-prior via teleported `.v-overlay__content` selectors). Representative raw call sites verified to use standard Vuetify overlays covered by global rules.
- **Known issues:** none for this package.
- **Commit:** `8273573`

## WP-11 — AI assistant surfaces

- **Work package completed:** WP-11 — routed AppBar assistant/action gradients and voice on-fill literals through generated AI accent tokens; preserved WebGL orb literals.
- **Files changed:**
  - `src/styles/dv-tokens.css`
  - `src/components/layout/AppBar.vue`
  - `src/components/copilot/DvToastStack.vue`
  - `src/components/copilot/voice/DvOrbitMicBar.vue`
  - `src/components/copilot/voice/DvOrbitOrb.vue`
  - `src/components/copilot/voice/DvOrbitVoiceSurface.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — consumes `--dv-action-gradient`, `--dv-action-on-gradient`, `--dv-orbit-on-fill` from generated `aiAccent` tokens.
- **Hard-coded colors removed:** AppBar assistant-pill hover gradient and `#ffffff` foreground; cmd-row Ask icon primary→secondary gradient; voice mic/slash/inverse/success `#ffffff` fills; DvToastStack light-only shadow.
- **Tests run + results:**
  - `npx vite build` — succeeds.
- **Deviations from the plan:** remaining 20 copilot components already resolve through `dv-tokens.css` and global overlay rules — no additional literals found beyond the plan's named call sites (done-by-prior). WebGL orb/ring hex stops retained per §5.9 exception.
- **Known issues:** none for this package.
- **Commit:** `33e91d4`

## WP-12 — Remaining states, route sweep, and fixed-look boundaries

- **Work package completed:** WP-12 — finished product-wide sweep for scrollbars, StorefrontPreview on-brand text, Commerce Cloud hero chart, and ChartThemesView hex literals; verified fixed-look exceptions and prior package coverage.
- **Files changed:**
  - `src/styles/global.scss`
  - `src/components/saleschannels/StorefrontPreview.vue`
  - `src/views/Commerce/CommerceCloudLanding.vue`
  - `src/views/ChartThemes/ChartThemesView.vue`
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — consumes `--accent-on`, `--accent-default`, `--accent-active`, `--border-subtle`, `--border-default`, `--surface-*`, `--text-*`.
- **Hard-coded colors removed:** global scrollbar `rgba(0,0,0,…)` thumbs; StorefrontPreview light-only `--mp-color-light-onPrimary`; Commerce Cloud SVG bar gradient hex stops; ChartThemesView 14 hex/rgba literals.
- **Tests run + results:**
  - `npm run type-check` — only pre-existing `ReelFlyView.vue` errors.
  - `npx vite build` — succeeds.
  - `npm run build-storybook` — passes (`✓ built in 13.40s`).
  - `npm run audit:ui` — completed (repository-wide findings remain; fixed-look exceptions in §5.9 confirmed: Deck, Showcase, Reel, PosPreview terminal, OSM tiles, customer preview content, WebGL orb literals, sidebar skins).
- **Deviations from the plan:** MpEmptyState/MpErrorState/MpTableSkeleton/MpStatusChip/MpUsageMeter/MpFloatingBulkBar/ModuleLandingPage addressed in WP-05/08 or already token-backed (done-by-prior). View-level `color="medium-emphasis"` icon props remain as residual low-severity findings for a future sweep.
- **Known issues:** `npm run build` still blocked by pre-existing `ReelFlyView.vue` strict-null errors; ChartThemesView product decision to force light chart preview unchanged; ModuleLandingPage tile tint hexes are categorical accents, not theme surfaces.
- **Commit:** `140465b`

## WP-13 — Storybook parity and coverage

- **Work package completed:** WP-13 — Storybook reproduces app theme/accent behaviour; foundation stories document semantic roles; pinned dark stories cover critical component categories.
- **Files changed:**
  - `.storybook/preview.ts` (accent toolbar, canvas background, maropost theme classes)
  - `src/stories/storybookTheme.ts` (new — shared dark/accent globals helper)
  - `src/stories/Foundation/Colors.stories.ts` (semantic surface/text/border/accent/feedback + light/dark comparison)
  - `src/stories/Foundation/RadiusShadows.stories.ts` (dark shadow tokens, elevation aliases)
  - `src/stories/Foundation/Buttons.stories.ts` (interaction states, dark pinned)
  - `src/stories/FormFields.stories.ts` (dark all-states)
  - Co-located dark pinned stories: AppBar/AppSidebar (pre-existing), MpStatusChip, MpKpiCard, MpEmptyState, MpErrorState, MpTableSkeleton, MpFormDrawer, MpConfirmDialog, MpRowActionsMenu, DashboardChartWidget, DashboardPieWidget, DashboardKpiWidget, StorefrontPreview, MpDaVinciBot, DvOrbitVoiceSurface
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none — all swatches and aliases resolve through production paths.
- **Hard-coded colors removed:** none (stories consume aliases and generated tokens only).
- **Tests run + results:**
  - `npm run build-storybook` — passed.
  - `npm run type-check` — only pre-existing `ReelFlyView.vue` errors.
- **Deviations from the plan:** six sidebar-skin × mode stories collapsed per WP-04 user decision (three light skin stories + unified dark-mode story already in AppSidebar/AppBar).
- **Known issues:** none for this package.
- **Commit:** `5eedc40`

## WP-14 — Documentation and cleanup

- **Work package completed:** WP-14 — documented dark-mode architecture, deprecated aliases, and retired legacy SCSS injection.
- **Files changed:**
  - `docs/dark-mode/06-theme-architecture.md` (new)
  - `docs/design-system.md`
  - `docs/development.md`
  - `CLAUDE.md`, `AGENTS.md`
  - `vite.config.ts`, `.storybook/main.ts` (inject `generated/_variables.scss`)
  - `src/styles/global.scss` (`$mp-borderRadius-xl` migration)
  - `src/styles/tokens.scss` (deleted)
  - `docs/dark-mode/05-execution-log.md`
- **Tokens changed:** none.
- **Hard-coded colors removed:** legacy `tokens.scss` duplicate palette (sidebar/shadow values that conflicted with tokens.json).
- **Tests run + results:**
  - `npm run build-storybook` — passed.
  - `npx vite build` — succeeds.
- **Deviations from the plan:** none.
- **Known issues:** `npm run build` still blocked by pre-existing `ReelFlyView.vue` strict-null errors.
- **Commit:** `566a7ad`

## Remediation — Independent audit findings (Agent 8)

- **Work package completed:** Post-audit remediation — resolved AUD-H01 (High) and AUD-M01..M06 (Medium) from `06-independent-audit.md`.
- **Files changed:**
  - `src/views/ChartThemes/ChartThemesView.vue` — scoped light preview via `v-theme-provider`; removed global `setMode('light')` (AUD-H01)
  - `src/design-tokens/tokens.json` + generated outputs — dark `textDisabled` `#8B8A87` → `#9A9997` (AUD-M01)
  - 40 view/component files — `color="medium-emphasis"` → `class="text-medium-emphasis"` (AUD-M02)
  - `src/components/MpSectionRail.vue`, `src/components/settings/SettingsSidebar.vue` — semantic surface tokens (AUD-M03)
  - `src/components/layout/AppBar.vue` — interaction states via semantic tokens (AUD-M04)
  - `src/components/marketing/JourneyFlowColumn.vue` — border/text token migration (AUD-M06)
  - `src/components/MpFilterTabs.stories.ts`, `MpSectionRail.stories.ts`, `MpOptionCard.stories.ts`, `MpStatusToggle.stories.ts`, `MpDataTableToolbar.stories.ts` — dark pinned stories (AUD-M05)
  - `src/components/MpFloatingBulkBar.vue` — ink-panel hover token (AUD-L04, aligned)
  - `docs/dark-mode/06-independent-audit.md`, `07-final-verification.md`, `05-execution-log.md`
- **Tokens changed:** dark `textDisabled` only; light values unchanged.
- **Hard-coded colors removed:** AppBar/JourneyFlowColumn `rgba(var(--v-theme-on-surface), …)` stacks; MpFloatingBulkBar white rgba hover.
- **Tests run + results:**
  - `npm run tokens:build` — pass (505 tokens).
  - `npm run type-check` — fail on 13 pre-existing `ReelFlyView.vue` errors only.
  - `npx vite build` — pass.
  - `npm run build-storybook` — pass.
  - `npm run audit:ui` — pass (exit 0).
  - Playwright ChartThemes — pass: `localStorage app-theme-mode` stays `dark` through visit and after leaving route; scoped `.ct-light-scope.v-theme--maropostLight` renders on page.
  - Grep validations — `color="medium-emphasis"` zero; AppBar/JourneyFlowColumn `rgba(on-surface)` zero; rail `--surface-[12]` zero.
  - Lint: unavailable.
- **Deviations from the plan:** none.
- **Known issues:** Low findings AUD-L01, L02, L03, L05 remain (non-blocking). `npm run build` still blocked by pre-existing `ReelFlyView.vue` errors.

## Remediation — Independent audit findings (Agent 8)

- **Work package completed:** Post-audit remediation — resolved AUD-H01 (High) and AUD-M01..M06 (Medium) from `06-independent-audit.md`.
- **Files changed:**
  - `src/views/ChartThemes/ChartThemesView.vue` — scoped light preview via `v-theme-provider`; removed global `setMode('light')` (AUD-H01)
  - `src/design-tokens/tokens.json` + generated outputs — dark `textDisabled` `#8B8A87` → `#9A9997` (AUD-M01)
  - 40 view/component files — `color="medium-emphasis"` → `class="text-medium-emphasis"` (AUD-M02)
  - `src/components/MpSectionRail.vue`, `src/components/settings/SettingsSidebar.vue` — semantic surface tokens (AUD-M03)
  - `src/components/layout/AppBar.vue` — interaction states via semantic tokens (AUD-M04)
  - `src/components/marketing/JourneyFlowColumn.vue` — border/text token migration (AUD-M06)
  - `src/components/MpFilterTabs.stories.ts`, `MpSectionRail.stories.ts`, `MpOptionCard.stories.ts`, `MpStatusToggle.stories.ts`, `MpDataTableToolbar.stories.ts` — dark pinned stories (AUD-M05)
  - `src/components/MpFloatingBulkBar.vue` — ink-panel hover token (AUD-L04, aligned)
  - `docs/dark-mode/06-independent-audit.md`, `07-final-verification.md`, `05-execution-log.md`
- **Tokens changed:** dark `textDisabled` only; light values unchanged.
- **Hard-coded colors removed:** AppBar/JourneyFlowColumn `rgba(var(--v-theme-on-surface), …)` stacks; MpFloatingBulkBar white rgba hover.
- **Tests run + results:**
  - `npm run tokens:build` — pass (505 tokens).
  - `npm run type-check` — fail on 13 pre-existing `ReelFlyView.vue` errors only.
  - `npx vite build` — pass.
  - `npm run build-storybook` — pass.
  - `npm run audit:ui` — pass (exit 0).
  - Playwright ChartThemes — pass: `localStorage app-theme-mode` stays `dark` through visit and after leaving route; scoped `.ct-light-scope.v-theme--maropostLight` renders on page.
  - Grep validations — `color="medium-emphasis"` zero; AppBar/JourneyFlowColumn `rgba(on-surface)` zero; rail `--surface-[12]` zero.
  - Lint: unavailable.
- **Deviations from the plan:** none.
- **Known issues:** Low findings AUD-L01, L02, L03, L05 remain (non-blocking). `npm run build` still blocked by pre-existing `ReelFlyView.vue` errors.

