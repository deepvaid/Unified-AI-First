# 05 — Execution Log (UI System Consolidation, Phase 3)

Append-only. One section per WP, in execution order.

---

## WP-F1 — Light-mode token corrections

**Status:** Done

**Work completed:**
1. **A11Y-003** — darkened `color.light.onSurfaceVariant` from `#737373` to `#5C6066` (the plan's suggested cool-neutral family).
2. **Light overlay tokens** — added `color.light.surfaceOverlay = #FFFFFF` and `color.light.scrim = rgba(26, 24, 20, 0.32)`, matching exactly what `mp-theme-aliases.css` previously synthesized (`var(--mp-color-light-surfaceBright)` → `#ffffff`; `rgba(var(--mp-rgb-color-light-textPrimary), 0.32)` → `textPrimary #1a1814` = `rgb(26,24,20)`). Rewired the light branch of `--surface-overlay`/`--scrim-overlay` in `mp-theme-aliases.css` to reference the new explicit tokens instead of synthesizing them. Pure refactor — no visual change (verified below).
3. **AUD-L05** — the dark-mode program's cool-neutral palette correction (commit `139516d`, already on this branch's ancestry) moved dark `surfaceBright`/`surfaceOverlay` from `#39352C` to `#32373E` without revisiting the danger-text token, leaving `color.dark.error` (`#EF8176`) at 4.61:1 on the new overlay tier (below the plan's 5.06:1 target, still ≥4.5 AA — this is the audit's exact Low finding). Lightened `color.dark.error` one step to `#F18E84` (HLS lightness +0.03, same hue/saturation) to clear the plan ratio.

**Files changed:**
- `src/design-tokens/tokens.json` (3 leaves: `color.light.onSurfaceVariant`, new `color.light.surfaceOverlay`, new `color.light.scrim`, `color.dark.error`)
- `src/design-tokens/generated/{variables.css,_variables.scss,tokens.ts}` (regenerated via `npm run tokens:build`, 515 tokens)
- `src/styles/mp-theme-aliases.css` (light-branch `--surface-overlay`/`--scrim-overlay` now reference the new explicit tokens)

**Computed contrast numbers:**
| Pair | Ratio | Target | Result |
|---|---|---|---|
| `#5C6066` on `surfaceVariant #ececec` | 5.354:1 | ≥4.5:1 | Pass |
| `#5C6066` on `background #f4f6fa` | 5.846:1 | ≥4.5:1 | Pass |
| `#5C6066` on `surface #ffffff` | 6.325:1 | ≥4.5:1 | Pass |
| (prior) `#737373` on `surfaceVariant` | 4.014:1 | — | was failing |
| (prior) `#737373` on `background` | 4.383:1 | — | was failing |
| dark `error #F18E84` on `surfaceOverlay #32373E` | 5.105:1 | ≥5.06:1 (plan) / ≥4.5:1 (AA) | Pass |
| (prior) dark `error #EF8176` on `surfaceOverlay #32373E` | 4.608:1 | — | AA pass, plan-ratio fail (AUD-L05) |
| dark `error #F18E84` on `surface #1F2226` | 6.8:1 | — | Pass |
| dark `error #F18E84` on `surfaceVariant #272B30` | 6.065:1 | — | Pass |

**Token diff scope check:** `git diff -- src/design-tokens/tokens.json` touches exactly the 4 leaves listed above; `git diff --stat` on `generated/` shows only the expected knock-on lines (no other light or dark value moved). Confirmed via manual diff read.

**Tests run:**
- `npm run tokens:build` — pass, 515 tokens generated.
- `npm run type-check` — fails with the same 13 pre-existing `src/views/Reel/ReelFlyView.vue` TS2532/TS2345 errors documented as a baseline exception in `docs/dark-mode/06-independent-audit.md`. Confirmed via `git show master:src/views/Reel/ReelFlyView.vue` diffed against the working tree — byte-identical, so this file is untouched by this WP and the failure predates the branch.
- `npm run build` — same baseline `vue-tsc` failure (build script runs `vue-tsc -b && vite build`).
- `npx vite build` — pass (used as the build-gate proxy per the same baseline-exception precedent), `✓ built in 11.09s`.
- Dev-server visual pass (`preview_start "Main App"`, port 5173→60344 autoport):
  - Light dashboard (`/accounts/2000290/dashboard`): renders normally; `getComputedStyle` confirms `--mp-color-light-onSurfaceVariant: #5C6066`, `--text-secondary: #5C6066`, `--surface-overlay: #FFFFFF`, `--scrim-overlay: rgba(26, 24, 20, 0.32)`.
  - Dark dashboard: renders unaffected (KPI values differ only because mock data is randomized per load, not a token regression); `--mp-color-dark-error: #F18E84` confirmed live.
  - Light contacts table (`/accounts/2000290/contacts`): renders normally, no perceptible shift beyond secondary-text darkening.
  - Console: zero errors in either theme.

**Deviations from plan:** None. `npm run type-check`/`npm run build` gate substituted with `npx vite build` only due to the pre-existing, branch-unrelated `ReelFlyView.vue` baseline failure (precedented in the dark-mode program's own execution/verification logs).

**Known issues:** None introduced. Baseline `ReelFlyView.vue` type errors remain open (pre-existing, out of this program's scope per the dark-mode audit's own recommendation to track it separately).

---
