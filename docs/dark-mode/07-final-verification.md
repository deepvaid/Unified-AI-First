# 07 — Final dark-mode verification (post-remediation)

**Agent:** Agent 8 (remediation) + Agent 9 (verification)  
**Branch:** `feature/dark-mode-system`  
**Date:** 2026-07-28  
**Inputs:** `06-independent-audit.md` findings AUD-H01..M06, remediated code, automated checks, Playwright sampling

---

## Executive summary

All **Blocker**, **High**, and **Medium** audit findings from `06-independent-audit.md` are **resolved**. Light mode remains stable. Cyan dark accent identity is intact. No duplicate or Storybook-only theme system was introduced. Dark hierarchy remains softer and layered per WP-04H.

---

## Finding resolution

| ID | Severity | Status | Remediation summary |
|---|---|---|---|
| AUD-H01 | High | **Resolved** | `ChartThemesView` wraps content in scoped `v-theme-provider theme="maropostLight"`; removed global `setMode('light')`. Playwright: `localStorage app-theme-mode` stays `dark` through visit and after leaving `/chart-themes`. |
| AUD-M01 | Medium | **Resolved** | Dark `textDisabled` retuned `#8B8A87` → `#9A9997`. Contrast on L1 `#2C2820`: **5.15:1** (≥4.72); raised `#312D24`: **4.82:1**; overlay `#39352C`: **4.29:1** (improved from 3.54:1). Light token unchanged. |
| AUD-M02 | Medium | **Resolved** | All `color="medium-emphasis"` icon/button props in `src/` replaced with `class="text-medium-emphasis"`. Grep → zero matches. |
| AUD-M03 | Medium | **Resolved** | `MpSectionRail.vue` and `SettingsSidebar.vue` migrated `--surface-1/2` → `--surface-primary/secondary`. Dark pinned Storybook story added for `MpSectionRail`. |
| AUD-M04 | Medium | **Resolved** | `AppBar.vue` hover/active/focus/divider rgba stacks routed through `--surface-interactive-*`, `--border-*`, `--focus-ring`, `--elevation-*`. No `color-mix` focus on assistant pill. Grep `rgba(var(--v-theme-on-surface)` → zero. |
| AUD-M05 | Medium | **Resolved** | Added pinned dark stories: `MpFilterTabs`, `MpSectionRail`, `MpOptionCard`, `MpStatusToggle` (`DarkModeAllStates`), `MpDataTableToolbar`. |
| AUD-M06 | Medium | **Resolved** | `JourneyFlowColumn.vue` connectors/borders/text mapped to `--border-*` and `--text-muted`. Grep `rgba(var(--v-theme-on-surface)` → zero. |

### Low / recommendations (unchanged, non-blocking)

| ID | Severity | Status | Notes |
|---|---|---|---|
| AUD-L01 | Low | Open | Deprecated compat aliases (`--surface-1/2`, `--hairline`, `--ink`) remain elsewhere — mechanical rename before removal. |
| AUD-L02 | Low | Open | `ModuleLandingPage` categorical tile tints not ledger-documented. |
| AUD-L03 | Low | Open | Deprecated `chartPalette` export — no production consumer. |
| AUD-L04 | Low | **Resolved (aligned)** | `MpFloatingBulkBar` ink-panel hover uses `rgba(var(--mp-rgb-color-dark-textPrimary), 0.08)`. |
| AUD-L05 | Low | Open | Error text on overlay 4.69:1 — still ≥4.5:1 AA; optional plan-ratio bump deferred. |

---

## Accent identity

| Check | Result |
|---|---|
| Default cyan dark `#2CC4FF` | **Pass** — unchanged in generated tokens and `accent-presets.css` |
| Runtime accent bridge | **Pass** — no `bucket.colors` mutation; `[data-accent]` scoping intact |
| Non-default accents | **Pass** — blue/gray/purple presets unchanged |

---

## Light-mode regression

| Check | Result |
|---|---|
| Light token values vs `master` | **Pass** — only dark `textDisabled` changed; all `color.light.*` leaves byte-identical |
| Dashboard light sampling (prior audit) | **Pass** — no regressions introduced by remediation |
| ChartThemes scoped light preview | **Pass** — global app theme unaffected |

---

## Theme architecture

| Check | Result |
|---|---|
| Single SSOT (`tokens.json`) | **Pass** |
| Duplicate palette files retired | **Pass** |
| Storybook-only theme system | **Pass** — none; stories use `storybookTheme.ts` + production aliases |
| Generated outputs | **Pass** — 505 tokens after rebuild |

---

## Dark hierarchy (rendered)

| Level | Expected | Status |
|---|---|---|
| L0 canvas `#1A1714` | Warm charcoal base | **Pass** (unchanged) |
| L1 card/nav `#2C2820` | Elevated surface | **Pass** (unchanged) |
| Soft dividers | Low-alpha white overlay | **Pass** (unchanged) |
| Dark button elevation | No white inset glow | **Pass** (unchanged) |
| Disabled text on L1 | ≥4.72:1 | **Pass** — 5.15:1 with `#9A9997` |

---

## Charts and states

| Check | Result |
|---|---|
| `useChartTheme()` consumers | **Pass** |
| ChartThemes global theme flip | **Pass** — fixed (AUD-H01) |
| Dark tooltip/grid tokens | **Pass** |
| Focus rings (global + AppBar + journey flow) | **Pass** — opaque `--focus-ring` |
| Loading/error/empty dark stories | **Pass** (pre-existing) |

---

## Storybook

| Check | Result |
|---|---|
| `build-storybook` | **Pass** |
| Five previously missing dark pins | **Pass** — all added |
| Theme + accent toolbars | **Pass** (pre-existing) |

---

## Test results

| Command | Result | Notes |
|---|---|---|
| `npm run tokens:build` | **Pass** | 505 tokens generated |
| `npm run type-check` | **Fail (baseline)** | 13 errors, all `ReelFlyView.vue` — pre-existing, unrelated |
| `npm run build` | **Fail (baseline)** | Same 13 `ReelFlyView.vue` errors before Vite |
| `npx vite build` | **Pass** | ✓ built in ~8s |
| `npm run build-storybook` | **Pass** | ✓ built in ~14s |
| `npm run audit:ui` | **Pass (exit 0)** | Repository-wide findings remain; no new dark-mode category |
| Lint | **Unavailable** | No lint script in `package.json` |
| Playwright ChartThemes (AUD-H01) | **Pass** | `localStorage=dark` before/on/after `/chart-themes`; scoped `.ct-light-scope.v-theme--maropostLight` present on page |
| Grep `color="medium-emphasis" src/` | **Pass** | Zero matches |
| Grep `rgba(var(--v-theme-on-surface)` AppBar + JourneyFlowColumn | **Pass** | Zero matches |
| Grep `--surface-[12]` MpSectionRail + SettingsSidebar | **Pass** | Zero matches (semantic tokens used) |

---

## Remaining items (Low / Recommendation only)

1. **AUD-L01** — compat alias cleanup across broader codebase before alias removal.
2. **AUD-L02** — document or tokenize `ModuleLandingPage` categorical tile tints.
3. **AUD-L03** — remove deprecated `chartPalette` export in next major cleanup.
4. **AUD-L05** — optional error-text bump on overlay tier if plan 5.06:1 ratio is binding.
5. **Recommendation** — fix `ReelFlyView.vue` type errors on `master` to restore full `npm run build` gate.

---

## Verdict

**Dark-mode GA readiness:** All required Blocker/High/Medium findings are resolved. Accent identity intact. Light mode stable. No architectural regressions. Proceed to human review with only Low/Recommendation items remaining.
