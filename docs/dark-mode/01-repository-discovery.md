# 01 — Repository Discovery (Dark Mode)

**Agent:** Repository Discovery Agent (model: `composer-2.5-fast`, read-only)
**Method:** Static source/config inspection only. No servers started, no rendered screenshots. Verified via direct file reads and targeted `rg` searches; counts are static occurrence counts, not runtime confirmation.
**Scope:** `/Users/0619mpind/Documents/mb 2/MB_Option2`

---

## 1. Stack & styling architecture

| Layer | Package | Version |
|---|---|---|
| Framework | `vue` | ^3.5.25 |
| UI | `vuetify` | ^3.12.2 |
| Build | `vite` | ^7.3.1 |
| Language | `typescript` | ~5.9.3 |
| State | `pinia` | ^3.0.4 |
| Router | `vue-router` | ^5.0.3 |
| Icons | `lucide-vue-next` | ^1.0.0 |
| Charts | `apexcharts` / `vue3-apexcharts` | ^5.10.6 / ^1.8.0 |
| Maps | `leaflet` | ^1.9.4 |
| AI orb (WebGL) | `three` | ^0.184.0 |
| Docs | `storybook` / `@storybook/vue3-vite` | 9.1.20 |
| CSS | `sass` | ^1.97.3 |

Single style-load manifest, imported by **both** `src/main.ts` and `.storybook/preview.ts` (intentional app/Storybook parity) — [`src/styles/app-styles.ts`](../../src/styles/app-styles.ts):

```
mb-foundation.tokens.css → design-tokens/generated/variables.css → dv-tokens.css → dv-orbit.css
→ mp-theme-aliases.css → source-cloud-colors.css → marobase-tokens.css → global.scss
→ settings-form.scss → accent-presets.css → sidebar-dark.css → sidebar-white.css
→ sidebar-gray.css → shell-variants.css → retail-widgets.scss
```

## 2. Design tokens & generator

- **Source of truth:** [`src/design-tokens/tokens.json`](../../src/design-tokens/tokens.json) — Tokens Studio / Style Dictionary compatible. Contains `color.light`, `color.dark`, `color.sidebar`, `color.chart.{light,dark}`, primitives (`blue`, `neutral`), semantic sub-groups `aiAccent`, `aiMetric`, `flowLogic`, `daVinci` (marked `"Legacy alias — prefer aiAccent"`), `inkPanel`; plus `spacing`, `borderRadius`, `shadow`, `motion`, `typography`, `component`, `layout`.
- **Generator:** [`src/design-tokens/build.mjs`](../../src/design-tokens/build.mjs) → `npm run tokens:build` / `tokens:watch`. Emits `generated/_variables.scss`, `generated/variables.css` (flat `:root` — **not theme-scoped**, light+dark names coexist as separate custom properties), `generated/tokens.ts` (JS/TS constants, e.g. `mp_color_dark_primary`).
- **External sync:** `design-kit/scripts/{sync-from-figma,push-variables,export-figma}.mjs`, `scripts/supernova-sync.mjs`, CI `.github/workflows/tokens-sync.yml`. Separate `design-kit/` Vite app exists as a light-only token gallery — out of scope for app dark mode but shares the same `tokens.json`.

## 3. Vuetify theme mapping & runtime bridge

- [`src/plugins/vuetify.ts`](../../src/plugins/vuetify.ts) — `defaultTheme: 'maropostLight'`, registers `maropostLight`/`maropostDark`, Lucide icon set.
- [`src/plugins/maropostTheme.ts`](../../src/plugins/maropostTheme.ts) — maps generated token constants into Vuetify `colors` maps. **Verified: `maropostDark.colors` (lines 136-169) is missing 15 keys present in `maropostLight.colors`** (lines 82-133): `surface-tint`, `on-secondary`, `on-success`, `on-error`, `on-warning`, `success-darken-1`, `warning-darken-1`, `error-darken-1`, `blue-50/100/200/700/900`, `neutral-100/200`. Vuetify auto-synthesizes missing `on-*` keys via luminance (`genOnColors` in `vuetify/lib/composables/theme.js`); the rest are simply absent with no fallback.
- [`src/composables/useAppTheme.ts`](../../src/composables/useAppTheme.ts) — `setMode()`/`setAccent()` toggle `vuetifyTheme.global.name.value` and `document.documentElement.dataset.theme`. **Verified (lines 25-54, 177-207):** `ACCENT_DEFS` hardcodes one hex/rgb triplet per accent (`cyan #0073AB`, `blue #2D63E8`, `gray #4B5563`, `purple #8B5CF6`) with **no light/dark variants**. Both `setAccent` and `setMode` patch `bucket.colors.primary`/`info` (and `setAccent` also patches `primary-container`/`on-primary-container`) directly onto whichever theme bucket is currently active, using this single hex — overwriting whatever `maropostLight`/`maropostDark` originally defined for `primary`.
- [`src/App.vue`](../../src/App.vue) lines 26-29: `setAccent(accent.value); setMode(mode.value)` run unconditionally on every app boot, for every stored mode/accent combination.
- [`src/styles/accent-presets.css`](../../src/styles/accent-presets.css) — independently duplicates the same 3 non-default accents' hex values as `[data-accent]` CSS overrides, applying **identical `--v-theme-primary` RGB triplets to both `.v-theme--maropostLight` and `.v-theme--maropostDark`** (e.g. blue: `45, 99, 232` in both selectors, lines 17-25).
- [`src/styles/mp-theme-aliases.css`](../../src/styles/mp-theme-aliases.css) — semantic aliases (`--surface-0/1/2`, `--ink`, `--muted`, `--accent`, `--accent-fg`, `--pos`/`--neg`, `--ink-panel-*`) mapped from generated tokens; dark values live under `.v-theme--maropostDark, .v-application.v-theme--maropostDark` (lines 73-112). **`--pos`/`--neg`/`--pos-soft`/`--neg-soft` (lines 40-43) have no dark override anywhere in the codebase** — verified via `rg` — yet are consumed in 9 files (see §8).

## 4. Parallel/legacy CSS-variable layers (verified drift)

| Layer | File | Dark background/surface | Scoping |
|---|---|---|---|
| Canonical | `tokens.json` → `maropostTheme.ts` | `#1a1714` / `#222019` (warm charcoal) | Vuetify `.v-theme--maropostDark` |
| Legacy Vuetify mirror | [`src/styles/marobase-tokens.css`](../../src/styles/marobase-tokens.css) | `#1a1714` / `#222019` (matches tokens) | `[data-theme="dark"]` — duplicates `--v-theme-*` in parallel with Vuetify's own injected stylesheet |
| Unrelated "foundation" kit | [`src/styles/mb-foundation.tokens.css`](../../src/styles/mb-foundation.tokens.css) | `#0c1a2b` / `#12253d` (cool navy) — **different hue family, different primary `#59c2ff`** | `[data-theme='dark']`, `.v-theme--maropostDark` (same selectors as canonical) |

`mb-foundation.tokens.css` variables (`--mb-color-*`) are consumed by exactly one production file: [`src/views/Commerce/CommerceCloudLanding.vue`](../../src/views/Commerce/CommerceCloudLanding.vue) (34 references, verified via `rg` count) — a routed, reachable Commerce landing page rendered entirely from the navy system while every surrounding page uses the warm-charcoal system.

## 5. Theme switching & persistence

| Concern | Storage key | DOM signal |
|---|---|---|
| Light/dark | `localStorage['app-theme-mode']` (migrates from legacy `mp-theme-mode`) | `html[data-theme]` |
| Accent | `localStorage['app-accent']` | `html[data-accent]` (cyan = no attribute) |
| Shell | `localStorage['app-shell']` | `html[data-shell]` |
| Sidebar skin | not persisted — derived from account / `?nav=` | `html[data-sidebar]` = `white`\|`gray`\|`dark`, **orthogonal to app light/dark** |

Dark mode is explicit opt-in; `prefers-color-scheme` is intentionally not honored (documented in `marobase-tokens.css:129-132` — host iframes would otherwise mis-theme). UI toggle: [`src/components/layout/AppBar.vue`](../../src/components/layout/AppBar.vue) sun/moon segmented control (lines ~691-700) → `setMode`.

## 6. Storybook

- [`.storybook/main.ts`](../../.storybook/main.ts) — stories glob `src/**/*.stories.ts` (86 files, verified count), `@storybook/addon-a11y` + `addon-docs` registered, injects legacy `src/styles/tokens.scss` into every SCSS file.
- [`.storybook/preview.ts`](../../.storybook/preview.ts) — imports the same `app-styles` manifest as the app; `theme` toolbar (`light`/`dark`, default `light`); decorator wraps stories in `<v-theme-provider>` and calls `syncDocumentTheme()` (sets `data-theme`, `.v-theme--dark`/`.theme-dark` classes). **Verified: it does NOT call `useAppTheme`'s `setAccent`/`setMode`** — Storybook's dark stories get the *unpatched* `maropostDark` primary (`#2CC4FF`), while the running app's dark mode gets the accent-overwritten value (see §3). This is a real behavioral divergence between Storybook and the app today.
- `data-visual-root` attribute exists on the Storybook preview wrapper (`.storybook/preview.ts:121`) for visual-test targeting.
- [`.storybook/theme.ts`](../../.storybook/theme.ts) — the **manager UI chrome** (not story content) is light-only (cream `#f7f3ec`); cosmetic only, does not affect story rendering.
- [`src/stories/Foundation/Colors.stories.ts`](../../src/stories/Foundation/Colors.stories.ts) has an explicit `DarkTheme` story rendering `mp_color_dark_*` swatches (lines ~129-167).

## 7. Charts

- Single chart library: ApexCharts via `vue3-apexcharts`. Consumers: `DashboardChartWidget.vue`, `DashboardPieWidget.vue`, `LiveView.vue`, `DvChartCard.vue`, `ChartThemesView.vue`.
- Palette system: [`src/plugins/chartPalette.ts`](../../src/plugins/chartPalette.ts). `CHART_THEMES` (`blue`/`indigo`/`ocean`/`aurora`) — **verified: `blue` sources only `mp_color_chart_light_series*` tokens (lines 4-11, 40-51); `indigo`/`ocean`/`aurora` are hardcoded hex arrays (lines 54-71) with no dark variants at all.**
- **`chartTooltipTheme = 'light' as const`** (line 125), fed straight into ApexCharts' `tooltip.theme` (line 173) — never switches with the app theme.
- `chartGridColor`/`chartLabelColor` (lines 119-122) **are** theme-reactive (`rgb(var(--v-theme-on-surface))`), so grid/label color itself is not hardcoded — only series/axis color and tooltip chrome are frozen to light.
- `tokens.json` defines a full `color.chart.dark.*` set (9 series) that is generated into `tokens.ts` but **has zero runtime consumers** outside `Colors.stories.ts` — verified via `rg` across `src/`.
- Leaflet (`LiveView.vue`) renders an external OpenStreetMap tile basemap — tiles are not theme-aware by nature of the service; not something token changes can fix.

## 8. Hard-coded colors / duplicated or unused dark values (verified)

| Finding | Evidence |
|---|---|
| `ChartThemesView.vue` fully hardcoded, zero theme adaptation | 14 hex literals in `<style>` (`#ffffff`, `#e5e7eb`, `#1a56db`, `#4b5563`, `#6b7280`); routed at `/chart-themes` with `meta:{fullPage:true}` — reachable, not gated |
| `--pos`/`--neg`/`--pos-soft`/`--neg-soft` defined once, no dark override | Definition: `mp-theme-aliases.css:40-43`. Consumers (9 files, verified): `AppBar.vue`, `DashboardKpiWidget.vue`, `DashboardSetupGuide.vue`, `DashboardView.vue`, `retail-widgets.scss`, `Retail/Transactions.vue`, `Retail/Locations.vue`, `Retail/PosPreview.vue`, `SalesChannels/SalesChannelDetail.vue` |
| Accent bridge duplicated in two independent places | `useAppTheme.ts` `ACCENT_DEFS` (JS) vs `accent-presets.css` `[data-accent]` (CSS) — same hex values, two maintenance points, both light-only |
| Global scrollbar thumb fixed to black | `src/styles/global.scss:596-599` — `rgba(0,0,0,0.15)`/`rgba(0,0,0,0.28)` hover, no theme branch |
| `CommerceCloudLanding.vue` on an unrelated navy palette | 34 `var(--mb-color-*)` references (see §4) |
| Dormant/unused dark theme keys | `mp_color_chart_dark_*` (chart), `maropostDark`'s missing 15 keys (see §3) — no confirmed live consumers found, flagged for backfill-or-deprecate decision rather than active bugs |
| Fixed-hex demo/presentation surfaces (likely intentional) | `Retail/PosPreview.vue` (69 hex, simulated POS terminal, routed `fullPage:true`), `Deck/slides/*` (presentation deck, routed `fullPage:true`), `Showcase/*` — need explicit design confirmation of intent, not treated as defects by default |
| Legacy sidebar SCSS independent of `tokens.json` | `src/styles/tokens.scss` hardcodes sidebar grays separately from `color.sidebar` in `tokens.json` |

Approximate hex-literal density (static grep, informational only): ~257 occurrences across 12 files under `src/styles/**`; ~15 `.vue` files under `src/components/**` and ~19 under `src/views/**` contain raw `#hex` in `<style>` blocks, concentrated in marketing/copilot/orb/retail/deck surfaces rather than core `Mp*` components.

## 9. AI assistant (Da Vinci / copilot) surfaces

- Components: `src/components/copilot/` (14 `Dv*` files) + `src/components/copilot/voice/` (7 files) + `src/components/MpDaVinciBot.vue`. Hosted in `App.vue` lines 213-229 as a right-hand navigation drawer.
- Token layer: `tokens.json` `color.{light,dark}.aiAccent.*` (has full light **and** dark variants, verified lines 334-347 / 538-550) plus `src/styles/dv-tokens.css` (`--dv-*`, dark overrides lines 78-146) and `src/styles/dv-orbit.css`.
- `AppBar.vue`'s "assistant pill" hover state and the command-menu "Ask" icon use their own hardcoded gradients rather than the `--dv-*`/`aiAccent` tokens (see `02-design-system-audit.md`).
- Orb/ring gradient stops in `dv-tokens.css` are literal hex — plausibly intentional brand-identity constants for the WebGL orb (three.js), not an oversight; flagged for confirmation, not auto-migrated.

## 10. Available checks / tooling capability

| Capability | Status | Evidence |
|---|---|---|
| `npm run build` (type-check + Vite build) | Present | `package.json` |
| `npm run type-check` (`vue-tsc -b --noEmit`) | Present | `package.json` |
| `npm run storybook` / `build-storybook` | Present | `package.json` |
| `npm run tokens:build` / `tokens:watch` | Present | `package.json` |
| `npm run audit:ui` (`scripts/ui-visibility-audit.mjs`) | Present — zero-dep regex scanner for tiny fonts, low-opacity text, hardcoded colors, missing aria/focus | Read directly, lines 1-27 |
| ESLint / Prettier / Stylelint | **Absent** | Not in `package.json` devDependencies or scripts |
| Unit test runner (Vitest/Jest) | **Absent** | Not in `package.json` |
| Playwright | Installed (`devDependencies`), config at `playwright.visual.config.ts` | `package.json` |
| Visual regression suite | **Broken/stale** — `tests/visual/capture-storybook.spec.ts` imports `../../scripts/visual/manifest`; **`scripts/visual/` does not exist in the repository** (verified via glob, 0 files) | Direct read + glob |
| CI visual-parity workflow | **Broken/stale** — `.github/workflows/visual-parity.yml` references `pnpm visual:test`/`visual:baseline`/`visual:report` and `packages/marobase-ui/**`; neither the scripts nor `packages/` exist in this repo (verified via glob, 0 files) | Glob checks |
| `@storybook/addon-a11y` | Installed and registered | `.storybook/main.ts`, `package.json` |

**Practical implication:** the only currently-runnable automated gates are `type-check`, `build`, `build-storybook`, and `audit:ui`. Any Playwright-based visual check must be run ad hoc (manual `playwright` invocation against `dev`/`storybook` servers), not via the existing broken `visual:*` scripts, unless that infrastructure is separately repaired.

## 11. Initial risks & dependencies for the planning phase

1. **Runtime accent bridge overwrites the tuned dark primary — including for the default cyan accent** (verified: `ACCENT_DEFS.cyan.hex = '#0073AB'`, the *light*-tuned value, gets written into `maropostDark.colors.primary`/`info` on every boot via `App.vue:27-29`). This is likely the single highest-impact fix and should be an early work package.
2. Three competing dark-background philosophies (`tokens.json` charcoal, `mb-foundation` navy, sidebar-dark's own navy `#22304b`) — needs one canonical decision.
3. Chart series/axis colors and tooltip chrome never adapt to dark; dark chart tokens exist but are unused.
4. `maropostDark` is missing 15 color keys that `maropostLight` defines, including four `on-*` semantic pairs that Vuetify silently auto-synthesizes rather than having authored/reviewed values.
5. Storybook and the running app currently diverge in dark mode (see §6) — fixing §1 will also fix this divergence, but the plan should account for it explicitly rather than assume Storybook dark parity implies app dark parity.
6. Visual-regression tooling (`scripts/visual/`, CI workflow, `packages/marobase-ui`) is stale/broken and should not be relied upon or claimed as coverage until separately repaired.
7. Sidebar skin (`white`/`gray`/`dark`) is orthogonal to app light/dark, multiplying the combinations that need visual review.
8. A handful of full-page routed surfaces (`ChartThemesView`, `PosPreview`, `Deck/*`, `Showcase/*`) may be intentionally fixed-look demo/presentation pages rather than admin-shell surfaces — the architecture plan should decide per-surface, not assume all reachable routes must be dark-adapted.

## Out of scope / not verified

- Actual rendered appearance, computed cascade winner between `marobase-tokens.css` and Vuetify's injected `<style>` tag, and real keyboard/focus behavior — all require a rendered browser pass (see `03-accessibility-audit.md` and the later independent audit).
- `design-kit/` app and Figma/Supernova sync scripts were located but not deeply inspected — they read from the same `tokens.json` and are not required for the dark-mode work packages.
