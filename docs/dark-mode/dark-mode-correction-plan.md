# Dark-mode correction plan — warm-brown → cool-neutral

**Branch:** `feature/dark-mode-system`
**Status:** WP-0 (this doc) + WP-1 (token swap) in progress; WP-2 through WP-7 planned
**Scope:** Value-only correction of the dark palette shipped by the prior dark-mode program. No architecture changes.

---

## Problem

The dark mode shipped on this branch reads warm brown/olive and muddy rather than the intended neutral/cool-grey, ChatGPT-dark-style direction:

- Cards visually blend into the canvas instead of floating above it.
- Menus and popovers appear to merge with (or sit behind) the cards beneath them.
- Borders read as loud, opaque mid-grey outlines rather than soft hairlines.
- Secondary/muted text reads tan rather than neutral grey.
- A handful of components carry light-only or hard-coded colors that don't survive the theme switch.

The user rejected the shipped look and asked for a correction pass, keeping the Maropost cyan accent and making no light-mode changes.

## Root causes

1. **The warm palette is authored in exactly one place**: `src/design-tokens/tokens.json` → `color.dark.*`. Every surface token (`background`, `surface`, `surfaceRaised`, `surfaceVariant`, `surfaceBright`) carries a red-over-blue channel spread of roughly 12–24 points — an olive/brown cast baked into the source values, not introduced by any component. `textMuted`/`textSecondary` are tan for the same reason.
2. **Borders are opaque mid-greys** (`borderSubtle`, `border`, `borderStrong` all sit around 50% lightness on a ~17% surface), producing the "outlined boxes everywhere" look instead of subtle separation.
3. **Menu-over-card contrast is too low to read as floating.** The overlay surface sat only ~1.2:1 above the card surface, and the dark shadow's tight negative spread kept the drop shadow inside the menu's own box — so a correctly z-stacked menu still visually reads as flush with, or behind, the card.
4. **A short list of genuine component defects** carry light-only or hard-coded values that don't route through the dark palette (see Components affected, below). These are separate from the palette problem and are scheduled for later work packages, not this pass.

The underlying architecture is sound: components consume semantic token aliases, not raw hex values. This is a **value swap at the source**, propagated through the existing alias graph — not a new theming system.

## Proposed system

No new token architecture. Every token **name** in `color.dark.*` stays exactly as it is; only leaf **values** change. Aliases (`surfaceOverlay → surfaceBright`, `surfaceSunken → background`, `surfaceLight → surfaceRaised`, `iconSecondary → textMuted`, `outline`/`outlineVariant` → border roles, `chart.dark.tooltipBackground → surfaceBright`, etc.) are untouched and pick up the new values automatically once `tokens.json` is rebuilt.

Pipeline: `tokens.json` → `npm run tokens:build` → `src/design-tokens/generated/{_variables.scss, variables.css, tokens.ts}`. Generated files are never hand-edited.

## Token values replaced (WP-1)

All values 6-digit hex unless already `rgba(...)`. Only `color.dark.*` (plus `color.chart.dark.tooltipBorder` and `shadow.dark.{md,lg}`) changes — `color.light.*` and everything outside these paths is untouched.

### Surfaces

| Token | Old (warm) | New (cool-neutral) |
|---|---|---|
| `background` (canvas) | `#1a1714` | `#17191C` |
| `surface` (card) | `#2C2820` | `#1F2226` |
| `surfaceRaised` | `#312D24` | `#24272C` |
| `surfaceVariant` | `#353128` | `#272B30` |
| `surfaceBright` (menus/popovers/modals) | `#39352C` | `#32373E` |
| `neutral100` | `#2E2B25` | `#24272C` |
| `neutral200` | `#4A443A` | `#3A4047` |
| `inkPanel.bg` | `#3A352D` | `#343A41` |
| `inkPanel.border` | `#878683` | `#3D4249` |

`surfaceOverlay`, `surfaceSunken`, `surfaceLight` are alias references (to `surfaceBright`, `background`, `surfaceRaised` respectively) and follow automatically — confirmed no literal hex needed manual updates.

### Text / icons

| Token | Old | New |
|---|---|---|
| `textPrimary` | `#ececec` | unchanged |
| `textSecondary` / `secondary` | `#C9C4BA` / `#c9c4ba` | `#C2C7CD` |
| `textMuted` / `onSurfaceVariant` / `secondaryDarken` | `#b3aa97` | `#9BA3AC` |
| `textDisabled` | `#9A9997` | `#8A9199` |

`iconPrimary`/`iconSecondary`/`iconDisabled` are aliases to the text tokens above and follow automatically.

### Borders

| Token | Old | New |
|---|---|---|
| `border` | `#878683` | `#3D4249` |
| `borderSubtle` | `#7E7B75` | `#33373D` |
| `borderStrong` | `#9B9A98` | `#4D535B` |

`borderHover`/`outline`/`outlineVariant`/`borderTableHeader` are aliases and follow automatically. `borderTableRow`/`borderTableFooterDivider`/`borderDividerMuted` are already low-alpha `rgba(255,255,255,…)` overlays and are unchanged.

### Accent selected/subtle backgrounds

| Role | Old | New |
|---|---|---|
| `accent.cyan.selectedBackground` | `#243A3E` | `#213A47` |
| `accent.cyan.subtleBackground` | `#233030` | `#202F37` |
| `accent.blue.selectedBackground` | `#2C353D` | `#293646` |
| `accent.blue.subtleBackground` | `#282D30` | `#242C37` |
| `accent.gray.selectedBackground` | `#343532` | `#31353C` |
| `accent.gray.subtleBackground` | `#2D2D29` | `#282C32` |
| `accent.purple.selectedBackground` | `#3B303D` | `#373146` |
| `accent.purple.subtleBackground` | `#322A30` | `#2C2A37` |

All other accent roles (`default`/`hover`/`active`/`focusRing`/`onAccent`/`container`/`onContainer`) are unchanged — they were already cool and legible.

### Chart & shadow

| Token | Old | New |
|---|---|---|
| `chart.dark.tooltipBorder` | `#878683` | `#3D4249` |
| `shadow.dark.md` | `0 8px 24px -10px rgba(0,0,0,0.48)` | `0 8px 24px -6px rgba(0,0,0,0.55)` |
| `shadow.dark.lg` | `0 18px 48px -16px rgba(0,0,0,0.56)` | `0 18px 48px -12px rgba(0,0,0,0.6)` |

The shallower negative spread + slightly higher opacity lets the shadow escape the overlay's own box, so menus/popovers read as floating above cards rather than flush with them.

### Untouched (explicitly out of scope for this pass)

`color.light.*`, `color.sidebar.*`, `color.neutral.*`, `color.chart.dark.series*`/`axis*`/`axisLabel`/`legendLabel`/`grid`/`tooltipText`, `color.dark.aiAccent.*`, `color.dark.daVinci.*`, `color.dark.scrim`, `color.dark.success/warning/error/info/primary` and their containers, `color.dark.flowLogic.*`, `color.chart.dark.indigo/ocean/aurora`.

## Components affected

The palette swap alone fixes surface/border/text muddiness everywhere it's consumed via alias. A short list of components carry independent defects that don't route through the palette and need targeted fixes in a later work package:

| Component | Defect |
|---|---|
| `DashboardWidgetCard.vue` | Da Vinci chip hard-codes a light purple gradient instead of `--dv-*` tokens |
| `source-cloud-colors.css` | Dark block only overrides `--cloud-*-text`; `--cloud-*-accent` (KPI icon-chip backgrounds) stays light-mode saturated |
| `MpStatusChip.vue` | Tonal underlay fixed at 0.072 opacity — nearly invisible on dark surfaces |
| `ModuleLandingPage.vue` | Eight `.tint-*` raw-hex accent pairs are light-only |
| `BillingView.vue` | `v-btn color="white"` hard-coded instead of token-driven |

Also noted but lower priority: an ApexCharts tooltip clipping bug (`overflow:hidden` ancestor chain) and `var()` color resolution inside inline SVG presentation attributes — both independent of palette values.

## Overlay / z-index strategy

Layering today works because Vuetify's own defaults (2000 for menus, 2400 for dialogs) fill the gaps implicitly; there is no explicit z-index token scale, and 44 hand-written z-index literals exist across the codebase spanning five orders of magnitude. Introducing a documented `zIndex` token group (dropdown/modal marked as Vuetify-owned, explicit values for drawer/toast/sidebar-flyout/bulk-bar) is **planned for a later work package (WP-5)** and is zero-behavior-change — it documents and names existing computed values, it does not change them. Not part of this pass.

## Storybook updates

Storybook currently has its own hard-coded warm-cream manager chrome (`.storybook/theme.ts`) and a preview-theme sync helper that over-satisfies dark-mode selectors the app itself never produces. Bringing Storybook's manager palette and theme sync in line with the corrected app palette, plus adding/refreshing dark stories for surface hierarchy, text/icon hierarchy, borders, overlay layering, and feedback states, is **planned for a later work package (WP-4)**. This pass only requires that `npm run build-storybook` continues to succeed after the token swap.

## Accessibility requirements

Every text/icon tier must meet WCAG AA (≥4.5:1 for text, ≥3:1 for large text/graphical objects) against the surface it's actually rendered on.

| Pair | Requirement | Computed (new palette) |
|---|---|---|
| `textPrimary` on `surface` (L1) | ≥ 4.5:1 | 13.5:1 |
| `textSecondary` on `surface` | ≥ 4.5:1 | 9.4:1 |
| `textMuted` on `surface` | ≥ 4.5:1 | 6.3:1 |
| `textMuted` on `surfaceBright` (overlay) | ≥ 4.5:1 | 4.7:1 |
| `textDisabled` on `surface` | ≥ 4.5:1 (disabled text is still read, not decorative) | 5.0:1 |
| `accent.cyan.default` (brand cyan) on `surface` | ≥ 4.5:1 | 7.9:1 |
| Feedback colors (success/warning/error/info) on `surfaceBright` | ≥ 4.5:1 | ≥ 4.6:1 (unchanged — not part of this swap) |
| `border`/`borderSubtle` on adjacent surfaces | No AA requirement (non-text) but must visibly separate without being a loud outline | 1.3–1.6:1 (down from ~2.4:1) |
| Menu (`surfaceBright`) over card (`surface`) | Visible separation step | 1.33:1 (up from 1.20:1), plus strengthened shadow |

## Implementation order

- **WP-0 — Plan doc.** This document. No code changes.
- **WP-1 — Token value swap.** Edit `color.dark.*` (+ `chart.dark.tooltipBorder`, `shadow.dark.{md,lg}`) in `tokens.json` only, regenerate via `npm run tokens:build`, verify no light-token or Figma-export drift.
- **WP-2 — Apex tooltip clipping + `var()` in SVG.** Fix chart tooltip overflow clipping and resolve theme colors to hex before handing them to inline SVG presentation attributes.
- **WP-3 — Component dark defects.** Fix the five components listed above (Da Vinci chip, source-cloud accent colors, status chip underlay opacity, ModuleLandingPage tints, BillingView button color).
- **WP-4 — Dead rules + Storybook hygiene.** Remove inert/dead CSS rules; align Storybook manager chrome and preview theme sync with the corrected palette; add/refresh dark stories.
- **WP-5 — Z-index layer tokens.** Document a `zIndex` token scale and migrate hand-rolled literals to it, with zero computed-value change.
- **WP-6 — Independent audit.** A different model reviews the rendered app (light + dark, multiple viewports) against the acceptance criteria below and writes up findings by severity.
- **WP-7 — Remediation.** Fix all Blocker/High/Medium audit findings and loop until the re-audit is clean.

## Acceptance criteria

- No warm/brown/olive cast on any chrome surface (red − blue channel spread ≤ 0 on all dark surface tokens).
- Menus/popovers visibly float above cards (surface step + shadow), never clipped; chart tooltips fully visible near card edges.
- Text meets AA at every tier (primary/secondary/muted ≥ 4.5:1 on their surfaces; disabled ≥ 4.5:1 on L1).
- Icons visible in all states; KPI source-cloud chips readable in dark.
- Light mode is byte-identical at the token level (leaf diff) and visually regression-free.
- Storybook renders match the app; no Storybook-only color values.
- `npx vite build` and `npm run build-storybook` succeed (`npm run build`/`npm run type-check` remain red only due to 13 pre-existing, unrelated `ReelFlyView.vue` strict-null errors — out of scope).
- Independent audit (WP-6) passes with zero Blocker/High/Medium findings.

## Testing strategy

- **Per-WP gates:** `npm run tokens:build` diff review (scope check on generated files), `npx vite build`, `npm run build-storybook` — run after every work package, not just at the end.
- **Token diff scope check:** after any `tokens.json` change touching `color.dark.*`, diff `generated/variables.css` and confirm only the expected `--mp-color-dark-*` / `--mp-rgb-color-dark-*` / `--mp-color-chart-dark-tooltipBorder` / `--mp-shadow-dark-*` variables move, with zero `--mp-color-light-*` lines and an unchanged `--mp-rgb-color-dark-*` line count (catches accidental hex→rgba conversions breaking a triplet).
- **Figma export check:** `git status design-kit/figma-export/` must be clean unless a WP explicitly intends to push to Figma.
- **Visual regression:** side-by-side dev-server screenshots (dashboard, dashboards list, a data-table view, settings, Da Vinci surfaces) in light and dark after WP-2 and WP-3.
- **Overlay tests:** widget three-dot menu, dashboard selector, date selector, Actions menu, user menu, rail flyout, form drawer with nested selects, confirm dialog, toasts — all exercised in dark mode.
- **Independent audit (WP-6):** a different model than the implementer reviews the rendered app end-to-end and does not assume correctness because builds pass.

## Out of scope (sanctioned exceptions — do not touch)

`Retail/PosPreview.vue`, `Deck/*`, `Showcase/*`, `Reel/*`, WebGL orb/ring gradient stops in `dv-tokens.css`, customer-preview content (`--sf-*`), light-mode sidebar skins (`sidebar-white.css`, `sidebar-gray.css`), light-theme values generally.

## Accepted light-mode change: activity tag colors

Fixing the dark-mode-invisible "audience"/"order"/"automation" activity tags in `DashboardActivityWidget.vue` and `ModuleLandingPage.vue` (previously a 1.5–1.9:1 contrast failure) meant switching them from hard-coded `oklch()` literals to the shared `--cloud-{commerce,contacts,marketing}-{accent,text}` tokens — the same tokens already used for KPI icon-chips elsewhere in the app. Because those tokens carry their own light-mode values, this also shifted the tags' **light-mode** hue — most notably "audience" moved from an olive/gold hue to teal-blue (the contacts cloud color). This was reviewed and accepted: contrast remains strong in both themes (light 6.24–8.94:1, dark 5.41–11.37:1), so it is not an accessibility regression, only a visual hue change, and it makes these activity tags visually consistent with the same four-category cloud color language already used for KPI chips elsewhere, rather than maintaining a second bespoke palette for the same categories.
