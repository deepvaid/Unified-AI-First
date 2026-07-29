# 06 — Dark-mode theme architecture

**Audience:** contributors, design-system maintainers, Storybook authors  
**Source of truth:** `src/design-tokens/tokens.json` → `npm run tokens:build` → generated outputs  
**Date:** 2026-07-28 (WP-13 / WP-14)

## Ownership

| Layer | Role |
|---|---|
| `tokens.json` | Only authored color/spacing/radius/shadow values |
| `build.mjs` | Flattens tokens; emits hex, SCSS (`$mp-*`), CSS (`--mp-*`), TS constants, and derived `--mp-rgb-*` for every hex color |
| `generated/variables.css` | Flat custom properties (light + dark names coexist; theme scoping happens in aliases) |
| `mp-theme-aliases.css` | Public semantic aliases (`--surface-*`, `--text-*`, `--border-*`, `--accent-*`, `--elevation-*`) scoped per theme |
| `maropostTheme.ts` | Vuetify `maropostLight` / `maropostDark` color maps from generated tokens |
| `accent-presets.css` | Non-default accent bridge only — separate light/dark selectors, no cyan block |
| `useAppTheme.ts` | Sets `data-theme` + `data-accent` + storage; **never mutates** Vuetify theme buckets |
| Storybook `.storybook/preview.ts` | Same `data-theme` / `data-accent` bridge as the app — no Storybook-only colors |

Do **not** add component-level dark hexes, Storybook-only tokens, or duplicate palette files.

## Light-mode protection

- Default light palette values in `tokens.json` remain byte-identical except documented focus/purple accent corrections.
- Dark values live only under `color.dark.*` and `.v-theme--maropostDark` / `[data-theme='dark']`.
- Default cyan has **no** `data-accent` attribute — removing it restores canonical theme colours.
- Light chart arrays moved into tokens unchanged; only dark chart palettes were retuned.

## Surface hierarchy (L0–L4)

| Level | Alias | Typical use |
|---|---|---|
| L0 | `--surface-canvas`, `--surface-sunken` | Route background, wells |
| L1 | `--surface-primary` | Cards, tables, AppBar |
| L1 nested | `--surface-secondary` | Inset groups, table headers |
| L2 | `--surface-raised` | Sticky toolbars, floating bulk bar + `--elevation-raised` |
| L3 | `--surface-overlay` | Menus, popovers, tooltips + `--elevation-overlay` |
| L4 | `--surface-overlay` over `--scrim-overlay` | Modals, drawers + `--elevation-modal` |

Navigation: `AppSidebar` skins (`white` / `gray` / `dark`) are **independent** of app theme in light mode. In dark app mode the nav cluster auto-resolves to the warm-charcoal ramp (see execution log WP-04 deviation).

AI surfaces use `--dv-*` aliases from `dv-tokens.css` (orthogonal blue/violet family).

## Accent bridge

Structure: `color.<mode>.accent.<key>.<role>` → `--accent-*` aliases.

Runtime:

- `setAccent()` updates reactive state, `data-accent`, and storage only.
- `setMode()` updates state, `data-theme`, storage, and Vuetify theme name only.
- `accent-presets.css` maps non-default accents per mode via generated RGB/hex properties.

Compatibility aliases (one release — **do not use in new code**):

| Deprecated | Replacement |
|---|---|
| `--surface-0` | `--surface-canvas` |
| `--surface-1` | `--surface-primary` |
| `--surface-2` | `--surface-secondary` |
| `--ink` | `--text-primary` |
| `--muted` | `--text-muted` |
| `--hairline` | `--border-subtle` |
| `--accent` | `--accent-default` |
| `--accent-fg` | `--accent-on` |
| `--accent-ink` | `--accent-active` |
| `--accent-soft` | `--accent-subtle-bg` |
| `color.*.daVinci.*` | `color.*.aiAccent.*` (alias only) |

Remove compatibility aliases in the release after dark-mode GA.

## Removed duplicate systems (WP-03 / WP-14)

These files must **not** return:

- `src/styles/mb-foundation.tokens.css` — migrated to semantic aliases
- `src/styles/marobase-tokens.css` — Vuetify owns `--v-theme-*`
- `src/styles/tokens.scss` — replaced by `generated/_variables.scss` in Vite + Storybook `additionalData`

## Charts

- `useChartTheme()` composable selects palette + chrome by Vuetify theme mode.
- Dark series/axis/grid/tooltip tokens live under `color.chart.dark.*`.
- Legends, dashes, and markers remain mandatory — series identity must not depend on hue alone.

## Fixed-look exceptions (no app-theme adaptation)

Documented in plan §5.9 — do not migrate silently:

1. `Retail/PosPreview.vue` terminal screen
2. `Deck/*` presentation artboards
3. `Showcase/*` branded composition
4. `Reel/*` motion/title cards
5. OpenStreetMap tiles in `LiveView` (controls adapt; tiles stay light)
6. Customer preview content in storefront/email/landing editors (`--sf-*` scoped)
7. WebGL orb/ring literal stops in `dv-tokens.css`
8. Sidebar skin tokens (orthogonal chrome)

## Storybook contract (WP-13)

- **Theme** toolbar → `data-theme` + `maropostLight` / `maropostDark`
- **Accent** toolbar → `data-accent` (cyan omits attribute)
- Canvas background → `var(--surface-canvas)`
- Pinned dark stories exist for navigation, forms, feedback, overlays, charts, storefront preview, and AI/voice surfaces
- Foundation → **Colors** and **Radius & Shadows** document semantic roles

Verify with `npm run build-storybook`.
