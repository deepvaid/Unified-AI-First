# Token & Theme Audit (2026-07-05)

<!-- Artifact of the Token & Theme Audit agent (design-system program, Phase 1). -->

## 1. Token pipeline health
**Status: Healthy with minor drift**

The pipeline flows cleanly: `tokens.json` → `build.mjs` → `generated/{tokens.ts, variables.css, _variables.scss}` → `vuetify.ts` and `global.scss`. No circular references detected. The `build.mjs` script resolves alias references (`{color.light.primary}`) correctly and generates all three output formats.

**Drift found (3 values not in tokens.json):**
- `src/plugins/maropostTheme.ts:171` — `min-height: 40px` (VBtn style)
- `src/plugins/maropostTheme.ts:172` — `padding-inline: 14px` (VBtn style)
- `src/styles/global.scss:143` — `rgba(255, 255, 255, 0.16)` (inset button shadow)

**Recommendation:** Extract button padding + min-height into `component.button.sizing` tokens in tokens.json; codify the inset shadow as a reusable token.

## 2. Legacy tokens.scss
**Status: Live but unused**

`src/styles/tokens.scss` is still wired into Vite + Storybook via `additionalData` (provides SCSS variable scope to all components). However, no `@import` or direct usage found in Vue/style blocks — it's purely for mixins + local SCSS files.

**Conflict:** Shadow values differ. `tokens.scss` has `$mp-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08)`, but `tokens.json` specifies spread/blur separately for resolution independence.

**Recommendation:** Deprecate. Regenerate `_variables.scss` from tokens.json; update Vite config to import generated vars instead.

## 3. Vuetify global defaults
All 12 essential component types configured in `maropostDefaults` (VBtn, VCard, VTextField, VAlert, VChip, VDataTable, VNavigationDrawer, VDialog, VDivider, VList, + input variants). Button typography fully specified (font-weight, letter-spacing, font-size); card radius standardized on `lg` (14px). Input fields use `density: comfortable` + explicit radius token.

**Coverage:** Stores **cannot** be globally defaulted (Pinia not coupled to Vuetify), but preview.ts correctly registers Pinia for story-level use. Critical for dashboard components rendering with live data.

## 4. Storybook config
Stories glob matches `src/**/*.stories.ts` + marobase-ui packages. Preview registers Vuetify + Pinia + Router with correct theme sync. Light/dark toolbar present with `globalTypes.theme` + decorator that sets `v-theme--dark/light` classes on document root.

**Addons installed:** docs, themes. **Missing:** `@storybook/addon-a11y` (for WCAG contrast audits). Recommend installing for pre-commit CI.

**Theme sync issue:** Decorator reads `context.globals.theme` but does NOT re-render Vuetify's actual theme object — it only syncs the class. Stories must explicitly read `vuetifyTheme` from the setup return. This works but is implicit.

## 5. Hardcoded-value violations
**Font-size literals:** 33 components (48% of 69 Vue files) use `font-size: Npx` in `<style>` blocks instead of tokens. Worst offenders: ModuleLandingPage (14), DvDataTable (8), DvHistoryDrawer (6), DvRefineDialog (5). Breakpoints: 10.5px, 11px, 13px, 14px, 15px — none in typography.fontSize (which defines xs/sm/body/md/lg/xl/2xl/3xl).

**Hex colors:** ~27 hardcoded hex values across 10 files. Mostly in SVG gradients (MpOverviewChart: `#2CC4FF`, `#00608D`) and copilot voice components (DvOrbitMicBar, DvOrbitStatusPill). These are intentional design flourishes but not token-traceable.

**Scrollbar:** global.scss uses raw `rgba(0, 0, 0, 0.15)` for webkit scrollbar — invisible on light theme, risky in overlay contexts.

## 6. Dark-mode risk list
**Critical:** Scrollbar thumb uses hard black (rgba 0,0,0). In dark mode, this is invisible.

**Warning:** Inset button shadow (global.scss:143) is light-mode only — breaks visual feedback on dark surfaces.

**Safe:** Text uses `rgb(var(--v-theme-on-surface))` pattern throughout. Shadows from tokens.json are theme-separated. No `white` literals found in component styles (only icon `color="white"` prop on 5 elements, which is Vuetify-safe).

## 7. Top 5 recommended fixes (by impact)
1. **Scrollbar token:** Convert `rgba(0,0,0,...)` → CSS variable scoped to light/dark themes; test in dark overlays.
2. **Font-size scale:** Migrate 33 components to typography.fontSize tokens; define missing 10.5px, 13px, 15px stops or enforce rounding to existing scale.
3. **Component sizing:** Extract VBtn padding/min-height + input radius into `component.*` tokens; remove inline px from maropostTheme.ts style props.
4. **A11y audit:** Install @storybook/addon-a11y; gate CI on contrast ≥4.5:1 WCAG AA.
5. **Deprecate tokens.scss:** Delete; update vite.config.ts to import only `generated/_variables.scss`.
