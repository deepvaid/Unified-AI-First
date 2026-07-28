# 06 — Independent dark-mode audit

**Auditor:** Agent 7 (independent reviewer)  
**Branch:** `feature/dark-mode-system`  
**Base:** `master`  
**Date:** 2026-07-28  
**Inputs reviewed:** `04-implementation-plan.md`, `05-execution-log.md`, `06-theme-architecture.md`, branch commits, token/theme sources, automated checks, Playwright rendered sampling

This audit reports findings only. No production code was modified.

---

## Executive summary

The dark-mode program delivers a coherent token-first architecture: duplicate palette files are retired, `useAppTheme` no longer mutates Vuetify buckets, semantic aliases and chart theming are wired, and rendered dark routes show the intended warm-charcoal ladder (canvas `#1A1714` → L1 `#2C2820`), soft dividers, and dark button elevation without white glow.

**One High defect remains:** visiting `/chart-themes` calls `setMode('light')`, which persists light mode globally and breaks the user's dark preference.

**No Blockers** were found for dark-mode acceptance. `npm run build` / `npm run type-check` fail only on 13 pre-existing `ReelFlyView.vue` strict-null errors (confirmed unrelated to this branch). `npx vite build` and `npm run build-storybook` pass.

---

## What passes

| Area | Evidence |
|---|---|
| Token SSOT | `tokens.json` → `npm run tokens:build` → 505 generated tokens; no hand-edits in `generated/` |
| Light palette protection | Byte-identical light token values vs `master` (Python diff of all `color.light.*` leaves — zero drift) |
| Duplicate retirement | `mb-foundation.tokens.css`, `marobase-tokens.css`, `tokens.scss` absent; zero `--mb-*` references in `src/` |
| Accent runtime (WP-02) | `ACCENT_DEFS` imports generated tokens only; no `bucket.colors` mutation; `accent-presets.css` has no hex literals and separate light/dark selectors |
| Semantic aliases (WP-03) | `mp-theme-aliases.css` exposes `--surface-*`, `--text-*`, `--border-*`, `--accent-*`, `--elevation-*` per theme |
| Vuetify dark parity (WP-02) | `maropostDark.colors` includes `on-success`, `on-error`, `on-warning`, `on-info`, `on-secondary`, `surface-tint`, blue/neutral parity keys |
| Surface hierarchy (rendered) | Playwright dark: canvas `rgb(26,23,20)`, card/nav `rgb(44,40,32)`, flat-btn shadow `rgba(0,0,0,0.32)` (no white inset) |
| Dividers (rendered) | In-card dividers compute `rgba(255,255,255,0.12)` at 0.08 opacity on Sales Orders |
| Card borders (rendered) | Dashboard `.v-card--border` computes `rgb(126,123,117)` (`#7E7B75` / `--border-subtle`) |
| Charts (WP-09) | `useChartTheme()` composable; dark tooltip chrome via `charts.css`; no `tooltip.theme: 'light'` in consumers |
| AI surfaces (WP-11) | AppBar gradients and voice on-fill routed through `--dv-*` tokens |
| Storybook (WP-13) | Theme + accent toolbars mirror app bridge; foundation Colors/Radius stories; 18+ pinned dark co-located stories |
| Documentation (WP-14) | `06-theme-architecture.md`, design-system/development updates, Vite + Storybook inject `generated/_variables.scss` |
| Fixed-look ledger | Deck, Showcase, Reel, PosPreview terminal, OSM tiles, customer preview scopes confirmed untouched |

---

## Plan deviations (documented / approved)

| Deviation | Plan reference | Actual | Status |
|---|---|---|---|
| Sidebar auto-follows app dark | §3: six skin×mode combinations; skins independent in dark | `html[data-theme="dark"]` union in `sidebar-dark.css`; skins differentiate light only | **User-approved** (WP-04) |
| Surface ladder re-spacing | §2.2/§3: keep `#222019` L1, `#333028` overlay | WP-04H: L1 `#2C2820`, raised `#312D24`, nested `#353128`, overlay `#39352C` | **Rendered corrective** — improves card/canvas separation; re-validated contrast floors |
| Material divider overlays | §2.4: opaque `#7E7B75` for divider roles | `borderDividerMuted` / table row/footer use `rgba(255,255,255,0.08–0.12)` | **Rendered corrective** — fixes hard HR defect; essential `borderSubtle` unchanged |
| Chart duplicate series | §2.7: legends/dashes mandatory | Synthetic "Previous" overlay removed; multi-series uses dashArray | **User-approved** (WP-09) |
| ChartThemes page light preview | WP-09: zero hex, both-mode surfaces | Page forces light via `setMode('light')` for palette review | **Product decision** — but see **AUD-H01** (implementation overreach) |
| Storybook sidebar matrix | WP-13: six skin×mode stories | Three light skin stories + unified `DarkMode` story | **Follows WP-04 deviation** |
| `npm run build` gate | Plan §5.8 | Blocked by pre-existing `ReelFlyView.vue` TS errors | **Baseline exception** — `npx vite build` succeeds |

---

## Work-package acceptance (WP-01..14)

| WP | Verdict | Notes |
|---|---|---|
| WP-01 Foundation | **Pass** | Semantic tokens, RGB derivation, dark shadows present; light values unchanged |
| WP-02 Vuetify/accent | **Pass** | Generated-backed accents; no runtime mutation; cyan dark `#2CC4FF` verified in app scope |
| WP-03 Aliases/retirement | **Pass** | Duplicate CSS deleted; Commerce Cloud migrated; aliases teleported via Vuetify theme class |
| WP-04 Navigation | **Partial** | Nav chrome unified and studio-shell fix landed; **MpSectionRail**, **SettingsSidebar**, **StoreEditorSidebar** still on deprecated `--surface-1/2` (see AUD-M03) |
| WP-04H Rendered fixes | **Pass (deviated)** | Surface ladder, soft dividers, dark btn shadow — verified rendered |
| WP-05 Typography/icons | **Partial** | Mp* components fixed; **~50 view-level `color="medium-emphasis"` props remain** (AUD-M02) |
| WP-06 Borders/interaction | **Partial** | Global focus rings centralized; AppBar/JourneyFlowColumn rgba stacks remain (AUD-M04, AUD-M06) |
| WP-07 Forms | **Pass** | Outlined baseline + pickers migrated; overlay forms inherit WP-10 globals |
| WP-08 Cards/widgets | **Pass** | KPI trends via `--pos`/`--neg`; widget elevation tokens applied |
| WP-09 Charts | **Pass (deviated)** | Mode-aware palettes; grid/tooltip tokens; ChartThemesView hex-free but forces global light (AUD-H01) |
| WP-10 Overlays | **Pass** | Global teleported overlay rules + MpFormDrawer L4 surfaces |
| WP-11 AI surfaces | **Pass** | Gradients and orbit on-fill tokenized; WebGL literals retained per §5.9 |
| WP-12 Route sweep | **Partial** | Scrollbars, StorefrontPreview, Commerce Cloud hero migrated; residual view icons + ChartThemes global flip |
| WP-13 Storybook | **Partial** | Strong coverage for nav/forms/feedback/charts/AI; gaps for MpFilterTabs, MpSectionRail, MpOptionCard, MpStatusToggle, MpDataTableToolbar (AUD-M05) |
| WP-14 Docs/cleanup | **Pass** | Architecture documented; legacy SCSS injection retired |

---

## Test results

| Command | Result | Notes |
|---|---|---|
| `npm run tokens:build` | **Pass** | 505 tokens generated |
| `npm run type-check` | **Fail (baseline)** | 13 errors, all `src/views/Reel/ReelFlyView.vue` TS2532/TS2345 |
| `npm run build` | **Fail (baseline)** | Same 13 `ReelFlyView.vue` errors before Vite |
| `npx vite build` | **Pass** | `✓ built in ~9s` |
| `npm run build-storybook` | **Pass** | `✓ built in ~28s` |
| `npm run audit:ui` | **Pass (exit 0)** | 1,040 findings (high: 3, medium: 379, low: 658) — overwhelmingly pre-existing typography/layout; 525 hardcoded-color hits include fixed-look exceptions |
| Lint | **Unavailable** | No lint script in `package.json` |
| Playwright dark sampling | **Pass** | Routes at 375/768/1440: dashboard, sales-orders, settings — dark tokens applied; nav/card hierarchy correct |
| Playwright light regression | **Pass** | Dashboard light: canvas `244,246,250`, surface `255,255,255`, btn sheen unchanged |
| Playwright ChartThemes | **Fail** | `/chart-themes` flips stored theme to `light` (AUD-H01) |

---

## Findings

### Blocker

None.

---

### High

#### AUD-H01 — ChartThemesView persists global light mode

| Field | Detail |
|---|---|
| **Severity** | High |
| **Evidence** | `src/views/ChartThemes/ChartThemesView.vue:22` — `onMounted(() => setMode('light'))`. Playwright: visit `/chart-themes` with `localStorage app-theme-mode=dark` → after load `dataset.theme=light`, `localStorage=light`, `.v-theme--maropostDark` absent |
| **Expected** | Palette review page may render charts on a light surface without mutating the user's stored app theme (WP-12: "product decision to force light chart preview" scoped to preview widgets, not global preference) |
| **Actual** | Global `setMode('light')` writes `localStorage` and removes dark from the entire app until the user toggles back |
| **Required correction** | Scope light rendering to the page/widgets only (e.g. local wrapper class, chart override injection, or restore previous mode on unmount) — do not call `setMode('light')` on a routed page |
| **Validation** | Playwright: dark preference survives navigation to/from `/chart-themes`; `localStorage app-theme-mode` unchanged |

---

### Medium

#### AUD-M01 — Disabled text contrast regression on re-spaced surfaces

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | WP-04H surface ladder; `#8B8A87` disabled text computed ratios: L1 `#2C2820` **4.25:1** (plan §2.3: **4.72:1** on `#222019`); raised `#312D24` **3.97:1**; overlay `#39352C` **3.54:1** |
| **Expected** | Plan §2.3 / WP-06: disabled text ≥4.72:1 on primary surface; essential boundaries ≥3:1 |
| **Actual** | WP-04H trade-off documented 4.25:1 on L1; raised/overlay tiers fall further |
| **Required correction** | Retune `textDisabled` for darker surfaces or restrict disabled controls to L1; re-derive against `#2C2820`/`#39352C` |
| **Validation** | WCAG contrast script on all surface tiers |

#### AUD-M02 — Residual broken `color="medium-emphasis"` icon props

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `rg 'color="medium-emphasis"' src/` → ~50 matches across views (e.g. `ProductsList.vue:395`, `SalesOrders.vue:368`, `JourneyBuilder` adjacency). WP-05 fixed Mp* components; WP-12 logged residual |
| **Expected** | WP-05: no `color="medium-emphasis"` prop where intent is semantic secondary icon color |
| **Actual** | Vuetify 3 treats unknown color strings literally — icons render with wrong/missing emphasis in dark mode |
| **Required correction** | Replace with `class="text-medium-emphasis"` or `--icon-secondary` scoped styles |
| **Validation** | `rg 'color="medium-emphasis"' src/` → zero; rendered icon color uses `--icon-secondary` in dark |

#### AUD-M03 — MpSectionRail / settings rails not on semantic surfaces (WP-04 gap)

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `MpSectionRail.vue:172,190,209` — `var(--surface-1)` / `var(--surface-2)` (deprecated compat aliases). `SettingsSidebar.vue:82,102` — same. Execution log WP-04: "MpSectionRail, SettingsSidebar … out of scope for this partial slice" |
| **Expected** | WP-04: in-content rails use app semantic surfaces (`--surface-primary`, `--surface-secondary`) |
| **Actual** | Deprecated numbered aliases — functional via compat layer but not plan-complete |
| **Required correction** | Migrate to `--surface-primary` / `--surface-secondary`; add dark pinned Storybook story |
| **Validation** | Grep `--surface-[12]` in rail components → zero; Storybook dark story renders correctly |

#### AUD-M04 — AppBar interaction states still use rgba compositing

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `AppBar.vue` — 20+ `rgba(var(--v-theme-on-surface), …)` hover/focus/shadow rules (e.g. `:855-977`, `:1323-1771`); assistant pill focus uses `color-mix(in srgb, var(--focus-ring) 40%, transparent)` at `:918-920` instead of opaque `--focus-ring` |
| **Expected** | WP-06: focus rings use opaque accent `focusRing`; no 0.12/0.18/0.36 focus mixes |
| **Actual** | Partial centralization — global/forms fixed; AppBar retains ad-hoc alpha stacks |
| **Required correction** | Route AppBar hover/active/focus through `--surface-interactive-*` and `--focus-ring` |
| **Validation** | Computed focus outline ≥3:1 on nav surface; no `color-mix` focus on assistant pill |

#### AUD-M05 — Storybook dark coverage gaps (WP-13)

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | No `DarkMode` export in: `MpFilterTabs.stories.ts`, `MpSectionRail.stories.ts`, `MpOptionCard.stories.ts`, `MpStatusToggle.stories.ts`, `MpDataTableToolbar.stories.ts`. Plan WP-13 lists these categories as required pinned dark stories |
| **Expected** | Pinned dark stories for every critical component category |
| **Actual** | 18+ dark stories exist (AppBar, forms, KPI, charts, overlays, AI) but five plan-listed components lack dark pins |
| **Required correction** | Add `DarkMode`/`DarkModeAllStates` stories using `storybookTheme.ts` helper |
| **Validation** | Storybook build; visual check at `globals.theme=dark` |

#### AUD-M06 — JourneyFlowColumn decorative rgba stacks deferred

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Evidence** | `JourneyFlowColumn.vue` — 30+ `rgba(var(--v-theme-on-surface), …)` literals for flow connectors, nodes, branches (e.g. `:30-35`, `:175-329`). WP-06 execution log: "remains for WP-12" |
| **Expected** | WP-06: centralized state styling; no component re-authoring alpha values |
| **Actual** | Functional but bypasses semantic border/text tokens; contrast varies with surface |
| **Required correction** | Map connectors/borders to `--border-subtle` / `--text-muted`; node accents to semantic feedback colors |
| **Validation** | `rg 'rgba\(var\(--v-theme-on-surface\)' JourneyFlowColumn.vue` → zero |

---

### Low

#### AUD-L01 — Deprecated compat aliases still used in new-adjacent code

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `--surface-1/2`, `--hairline`, `--ink` still referenced in rails and widget footers despite one-release deprecation in `06-theme-architecture.md` |
| **Expected** | New code uses `--surface-primary`, `--border-subtle`, `--text-primary` |
| **Actual** | Compat aliases resolve correctly — maintainability debt only |
| **Required correction** | Mechanical rename before compat alias removal |
| **Validation** | Grep deprecated names in `src/` → zero |

#### AUD-L02 — ModuleLandingPage categorical tile tints

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `ModuleLandingPage.vue:297+` — `.tint-blue`, `.tint-violet`, etc. with raw hex accents; `audit:ui` flags 16+ tile colors |
| **Expected** | WP-12: either migrate to tokens or annotate in fixed-look ledger |
| **Actual** | Execution log notes "categorical accents, not theme surfaces" — not documented in §5.9 ledger |
| **Required correction** | Add explicit ledger entry or migrate tints to accent container tokens |
| **Validation** | Ledger entry in `06-theme-architecture.md` or zero hex in component |

#### AUD-L03 — Back-compat `chartPalette` export remains light-only

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `chartPalette.ts:349` — `export const chartPalette = CHART_THEMES.blue.light.series` marked deprecated |
| **Expected** | All consumers use `useChartTheme()` |
| **Actual** | No production consumer imports the deprecated export; dead compat surface |
| **Required correction** | Remove export in next major cleanup |
| **Validation** | `rg "import.*chartPalette[^I]" src/` → zero |

#### AUD-L04 — MpFloatingBulkBar ink-panel hover hardcode

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `MpFloatingBulkBar.vue:86` — `background: rgba(255, 255, 255, 0.08)` on `--ink-panel-*` surface |
| **Expected** | Ink panel interactions use semantic overlay/hover tokens |
| **Actual** | Isolated literal on intentional dark editorial surface — visually acceptable |
| **Required correction** | Replace with `rgba(var(--mp-rgb-color-dark-textPrimary), 0.08)` or `--surface-interactive-hover` equivalent |
| **Validation** | No raw rgba white in component |

#### AUD-L05 — Error text on overlay slightly below plan target

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Evidence** | `#EF8176` on overlay `#39352C` = **4.69:1** (plan §2.6 / WP-07: **5.06:1** on `#333028`) — still ≥4.5:1 AA |
| **Expected** | Plan ratio on overlay tier |
| **Actual** | WP-04H overlay re-spacing reduced margin |
| **Required correction** | Optional: bump error token or cap overlay lightness |
| **Validation** | Contrast ≥5.0:1 on `#39352C` if plan ratio is binding |

---

### Recommendations (non-blocking)

1. **Fix AUD-H01 before GA** — a single routed page must not destroy the user's theme preference.
2. **Close WP-04/05/06 residual slices** in one focused sweep (rails, view icons, AppBar, JourneyFlowColumn) rather than leaving partial packages indefinitely.
3. **Add the five missing Storybook dark pins** to make WP-13 acceptance fully auditable without manual grep.
4. **Document ModuleLandingPage tile tints** in the fixed-look ledger or migrate them.
5. **Track `ReelFlyView.vue` type errors separately** — they block `npm run build` but are unrelated to dark mode; consider fixing on `master` to restore the plan's required build gate.

---

## Token architecture review

| Check | Result |
|---|---|
| Single authored source | **Pass** — `tokens.json` only |
| Duplicate palette files | **Pass** — deleted, not re-imported |
| Generated RGB properties | **Pass** — `--mp-rgb-*` emitted for hex colors |
| Storybook-only tokens | **Pass** — none found; stories consume production aliases |
| Unused token bloat | **Low risk** — dormant parity keys (`blue50`, `neutral100`) authored per plan §2.6; no harm |
| Light drift | **Pass** — zero light value changes vs `master` |
| Accent bridge isolation | **Pass** — non-default accents scoped to `[data-accent]` + theme class; cyan has no block |

---

## Hard-coded dark-mode colour bypass audit

| Location | Severity | Notes |
|---|---|---|
| ChartThemesView global `setMode('light')` | **High** | AUD-H01 |
| AppBar rgba stacks | **Medium** | AUD-M04 |
| JourneyFlowColumn rgba stacks | **Medium** | AUD-M06 |
| MpFloatingBulkBar hover | **Low** | AUD-L04 |
| ModuleLandingPage tile tints | **Low** | AUD-L02 |
| Fixed-look exceptions (Deck, Reel, PosPreview, Showcase, WebGL) | **OK** | Per §5.9 ledger |
| `dv-tokens.css` WebGL literals | **OK** | Declared exception |

---

## Light-mode regression check

Playwright baseline at 1440px dashboard:

| Token / element | Value | Status |
|---|---|---|
| `--v-theme-background` | `244,246,250` | Unchanged |
| `--v-theme-surface` | `255,255,255` | Unchanged |
| Card fill | `rgb(255,255,255)` | Unchanged |
| Flat primary btn shadow | white inset + blue tint | Unchanged |

No light-mode regressions observed in sampled routes.

---

## Dark hierarchy check (rendered)

| Level | Expected (post WP-04H) | Measured (Playwright) | Status |
|---|---|---|---|
| L0 canvas | `#1A1714` | `rgb(26,23,20)` | **Pass** |
| L1 card / nav | `#2C2820` | `rgb(44,40,32)` | **Pass** |
| Canvas < card | strict inequality | 26,23,20 vs 44,40,32 | **Pass** |
| Dividers | soft white overlay | `rgba(255,255,255,0.12)` | **Pass** |
| Button elevation | dark shadow, no white glow | `rgba(0,0,0,0.32) 0 1px 2px` | **Pass** |
| Card borders | `--border-subtle` | `rgb(126,123,117)` | **Pass** |

---

## Interaction states check

| State | Status | Gap |
|---|---|---|
| Focus (global) | **Pass** | `global.scss` uses `var(--focus-ring)` |
| Focus (AppBar) | **Partial** | color-mix / rgba stacks (AUD-M04) |
| Hover/active (forms) | **Pass** | `settings-form.scss` tokenized |
| Disabled text | **Partial** | L1 4.25:1, overlay 3.54:1 (AUD-M01) |
| Loading/error/empty | **Pass** | MpEmptyState/ErrorState/TableSkeleton dark stories exist |
| Selected | **Pass** | Accent keylines via `--accent-selected-bg` bridge |

---

## Charts check

| Check | Status |
|---|---|
| `useChartTheme()` in widget consumers | **Pass** (6 call sites) |
| Dark tooltip theme | **Pass** — `charts.css` + `chrome.tooltipTheme` |
| Dark grid | **Pass** — `rgba(255,255,255,0.08)` token |
| Duplicate series overlay | **Pass** — removed per WP-09 |
| ChartThemesView hex literals | **Pass** — zero `#` in view file |
| ChartThemesView dark app chrome | **Fail** — forces global light (AUD-H01) |

---

## Sidebar auto-follow check

| Check | Status |
|---|---|
| Dark app → dark nav chrome | **Pass** — `sidebar-dark.css` `:is(html[data-theme="dark"], …)` |
| Nav surface = L1 not canvas | **Pass** — studio-shell fix (`559e2c5`); Playwright `rgb(44,40,32)` |
| Light gray skin in light mode | **Pass** — unchanged per WP-04 verification |
| Six skin×mode Storybook matrix | **Collapsed** — user-approved; three light skins + unified dark story |

---

## Storybook check

| Check | Status |
|---|---|
| Production token path only | **Pass** |
| Theme + accent toolbars | **Pass** — `.storybook/preview.ts` |
| Canvas background | **Pass** — `var(--surface-canvas)` |
| Foundation dark coverage | **Pass** — Colors, RadiusShadows, Buttons |
| Pinned dark stories (critical categories) | **Partial** — 5 component gaps (AUD-M05) |
| Default cyan dark `#2CC4FF` | **Pass** — matches app scope |

---

## Remaining defect summary

| Severity | Count | IDs |
|---|---|---|
| Blocker | 0 | — |
| High | 1 | AUD-H01 |
| Medium | 6 | AUD-M01..M06 |
| Low | 5 | AUD-L01..L05 |

**Medium/High remain:** yes — 1 High + 6 Medium require remediation or explicit acceptance before dark-mode GA.

---

## Audit metadata

- **Commits reviewed:** 19 commits `da0693f..494afca` on `feature/dark-mode-system`
- **Browser sampling:** Playwright (Chromium), `localStorage app-theme-mode=dark`, viewports 375 / 768 / 1440
- **Routes sampled:** `/accounts/2000290/dashboard`, `/commerce/2000290/orders`, `/accounts/2000290/settings/account-defaults`, `/chart-themes`
- **Lint:** unavailable (no script)
