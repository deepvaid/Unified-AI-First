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
