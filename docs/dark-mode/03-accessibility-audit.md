# 03 — Accessibility & Data-Visualization Audit (Dark Mode)

**Agent:** Accessibility & Data-Visualization Agent (model: `cursor-grok-4.5-high-fast`, read-only) — findings independently re-verified by the orchestrator with a second Node-based contrast pass (both the standard alpha-composite method and a proper OKLab-matrix OKLCH→sRGB conversion for the two `color-mix(in oklch, …)` tokens).
**Method:** Static token/code read. Contrast computed via WCAG relative luminance (`(L1+0.05)/(L2+0.05)`); semi-transparent values composited onto their actual background first. No rendered/browser evidence in this pass. Thresholds: **4.5:1** text (WCAG 1.4.3), **3:1** large text/non-text UI (1.4.11 / 2.4.7). Dark surfaces referenced: `background #1a1714`, `surface #222019`, `surfaceBright #333028` unless noted.

---

## Verdict

Dark-mode **token values in isolation are mostly AA-clean or better** (text hierarchy, tonal status chips, AI-panel text all pass with margin). The **actual runtime experience is undermined by four confirmed, computed failures**: the accent bridge overwriting the tuned dark primary, a sub-3:1 focus ring, sub-3:1 hairline/control borders, and charts that never load their dark tokens while Apex's tooltip stays pinned to its light theme. These are fixable by wiring existing-or-planned tokens correctly — none require abandoning the "softer, calmer" direction; several *are* the direction (raising a border from 1.2:1 to 3:1 is not "harsher," it's "visible").

---

## Confirmed failures (computed)

### A1 — Accent bridge overwrites the dark primary (Critical, cross-cutting)

`useAppTheme.ts` `setAccent`/`setMode` (see `01-repository-discovery.md` §3) write a single light-tuned hex into `bucket.colors.primary`/`info` on **every** theme, including the default cyan accent in dark mode.

| Pair | Computed ratio | Threshold | Result |
|---|---|---|---|
| Overwritten primary `#0073AB` on surface `#222019` | **3.14:1** | text 4.5:1 | **FAIL** |
| Overwritten primary `#0073AB` on background `#1a1714` | **3.43:1** | text 4.5:1 | **FAIL** |
| Dark `onPrimary #06212c` on overwritten primary `#0073AB` | **3.20:1** | text 4.5:1 | **FAIL** (filled-button/chip label text) |
| Blue accent `#2D63E8` on surface | **3.15:1** | text 4.5:1 | **FAIL** |
| Gray accent `#4B5563` on surface | **2.16:1** | text 4.5:1 | **FAIL** |
| Purple accent `#8B5CF6` on surface | **3.85:1** | text 4.5:1 | **FAIL** |
| *For comparison — the untouched token* `primary #2CC4FF` on surface | 8.11:1 | — | would PASS AAA |
| *For comparison* — token `onPrimary #06212c` on token `primary #2CC4FF` | 8.28:1 | — | would PASS AAA |

**This single bug is responsible for most of the "harsh/wrong" feeling reported for dark mode** — every filled primary button, chip, and link in dark mode currently uses a color combination roughly 2.5x below the AA text threshold, when a correctly-paired alternative already exists in the token file today.

### A2 — Focus ring below non-text contrast threshold

`global.scss:243-246`: `outline: 2px solid rgba(var(--v-theme-primary), 0.36)`.

| Pair | Computed ratio | Threshold | Result |
|---|---|---|---|
| Dark primary `#2CC4FF` @ 0.36 alpha, composited on surface (`#265b6c` effective) | **2.17:1** | non-text/focus 3:1 | **FAIL** |
| Same, composited on background | **2.18:1** | 3:1 | **FAIL** |
| Field focus ring (`settings-form.scss:69-70`), primary @ 0.12 on surface | **1.25:1** | 3:1 | **FAIL** (more severe) |
| Assistant-pill focus ring, accent @ 0.18 on surface | **1.43:1** | 3:1 | **FAIL** |

Note: this uses the *correct* dark primary (`#2CC4FF`) already — fixing A1 does not fix A2. The alpha value itself is too low once composited against a dark surface (alpha-based rings lose absolute contrast on dark backgrounds even when the base hue is fine).

### A3 — Control / divider non-text contrast

| Token / usage | Computed ratio | Threshold | Result |
|---|---|---|---|
| `outline #4a443a` on surface | **1.69:1** | 3:1 | **FAIL** |
| `outlineVariant`/`border #332e28` on surface | **1.21:1** | 3:1 | **FAIL** |
| `borderSubtle` `rgba(236,236,236,0.14)` on surface (hairline field/card borders) | **1.50:1** | 3:1 | **FAIL** |
| `--mp-border-subtle-hover` `rgba(236,236,236,0.22)` on surface | **1.92:1** | 3:1 | **FAIL** |
| `borderTableRow` `rgba(89,194,255,0.1)` on surface | **1.21:1** | 3:1 | **FAIL** |
| `borderTableHeader` `rgba(89,194,255,0.2)` on surface | **1.50:1** | 3:1 | **FAIL** |
| `aiAccent.border #2E3D69` on `aiAccent.soft #1B2440` | **1.45:1** | 3:1 | **FAIL** |

Every authored dark border/hairline token computed here fails the 3:1 non-text threshold — this is a systemic under-tuning, not an isolated slip, and is the direct cause of "inputs and cards feel like they have no edge" in dark mode. Raising these is explicitly compatible with the "softer, calmer" brief: soft ≠ invisible.

### A4 — Charts: dark tokens unused, light-only chrome, several series below non-text contrast

| Issue | Evidence | Ratio / note |
|---|---|---|
| Runtime series colors are light-only | `chartPalette.ts:4-11,40-51` | `mp_color_chart_dark_*` generated but never imported in app code (confirmed via `rg`, only appears in `Colors.stories.ts`) |
| `chartTooltipTheme = 'light'` hardcoded | `chartPalette.ts:125,173` | Forces Apex's light tooltip chrome onto every dark-mode chart |
| Apex default `foreColor #373d3f` (chart title/legend fallback) on surface | computed | **1.48:1** — **FAIL** 3:1 |
| Chart `blue` series4 `#064F74` on surface | computed | **1.85:1** — **FAIL** 3:1 |
| `indigo` series `#3D4EDC` / `#2E3DB4` on surface | computed | **2.58:1** / **1.90:1** — **FAIL** 3:1 |
| `ocean` series `#0A4FA8` / `#1361B8` on surface | computed | **2.09:1** / **2.66:1** — **FAIL** 3:1 |
| `aurora` series `#4A55E8` / `#2440C9` / `#5D3FD3` on surface | computed | **2.91:1** / **2.06:1** / **2.42:1** — **FAIL** 3:1 |
| The unused `color.chart.dark.*` tokens, e.g. series1 `#2CC4FF` on surface | computed | **8.11:1** — would comfortably PASS |
| Axis labels (`chartLabelColor`, on-surface @0.55) on surface | computed | **5.10:1** — PASS |
| Data labels (on-surface @0.72) on surface | computed | **7.76:1** — PASS |
| Grid lines (on-surface @0.06) | computed | **1.17:1**, but `grid.show:false` by default (`chartPalette.ts:148-149`) — not currently rendered, so not an active failure |

Axis/data label colors are fine because they already route through `on-surface` alpha compositing — **only the series/axis mark colors and the tooltip theme need to become dark-aware**; the label/grid mechanism does not need to change.

### A5 — Missing dark `on-success`/`on-warning`/`on-error` (flat variant only)

Light mode defines explicit white `onSuccess`/`onWarning`/`onError` (`tokens.json:283-293`); dark mode has no equivalents, so Vuetify auto-synthesizes them via `genOnColors()` (confirmed by reading `vuetify/lib/composables/theme.js:162-171`) rather than using an authored, reviewed value.

| Fill (dark) | Auto-generated white text | Ratio | Result |
|---|---|---|---|
| success `#4cc28a` | white | **2.24:1** | **FAIL** |
| warning `#e1a04a` | white | **2.25:1** | **FAIL** |
| error `#e57266` | white | **3.03:1** | FAIL for body text (4.5:1); passes large-text/non-text (3:1) |

**Mitigating factor, confirmed:** `MpStatusChip.vue` defaults to `variant="tonal"` (`MpStatusChip.vue:15`), which uses the semantic color as *text* on a low-opacity underlay — not this flat white-on-fill path. Computed tonal pairings all pass comfortably: success `#4cc28a`/warning `#e1a04a`/error `#e57266` on surface = **7.29:1 / 7.24:1 / 5.38:1**. The failure path only fires where a caller explicitly requests `variant="flat"` for a success/warning/error color — the independent audit (`06`) should grep for that pattern specifically.

### A6 — Error text on brighter dark surface

`error #e57266` on `surfaceBright #333028` (the raised/hover surface tier) = **4.35:1** — **FAILS** 4.5:1 body-text AA, versus **5.38:1** (PASS) on the base `surface`. Any error copy rendered on a raised/hover dark card needs a check at ship time.

### A7 — `--pos`/`--neg` theme-blind pair, now precisely converted

`mp-theme-aliases.css:40-43` uses `color-mix(in oklch, …)` literals with no dark override. Converted via the proper OKLab matrix (not an sRGB approximation):

| Token | Resolved sRGB | On dark surface | On light surface (`#ffffff`) |
|---|---|---|---|
| `--pos: oklch(0.5 0.15 155)` | `#007a3a` | **2.98:1 — FAIL** 3:1 | 5.46:1 — pass |
| `--neg: oklch(0.55 0.2 25)` | `#cc272e` | **3.02:1 — borderline pass 3:1, FAIL 4.5:1 text** | 5.39:1 — pass |

Both values were evidently tuned for the light surface only; on dark they sit right at or just under the *non-text* threshold and clearly fail as body/data text (used as currency figures in `Retail/Transactions.vue`, `Retail/Locations.vue` — i.e. as text, which needs 4.5:1).

### A8 — Confirmed severe failure: command-menu "Ask" icon

`AppBar.vue:1443-1447` gradient `rgb(var(--v-theme-primary)) → rgb(var(--v-theme-secondary))` with fixed `color:#fff`. Dark `secondary` = `#c9c4ba` (light warm tan).

**White `#ffffff` on dark secondary `#c9c4ba` = 1.74:1 — a severe, confirmed FAIL**, not merely a "risk" as originally flagged — this is worse than every other finding in this document except the border failures. This is a small icon glyph (17px, `AppBar.vue:398`), so WCAG 1.4.11 non-text (3:1) is the applicable threshold if it's treated as essential UI, and it still fails by a wide margin.

### A9 — New finding: assistant-pill hover gradient, partial failure

`AppBar.vue:899-904`, fixed `color:#ffffff` over a 4-stop gradient (independently computed, not in the original subagent pass):

| Gradient stop | White text ratio | Result |
|---|---|---|
| `#4f8ef5` (0%) | **3.22:1** | FAIL 4.5:1 text (the pill label is 13px, `AppBar.vue:929` — text-size threshold applies) |
| `#7c5cff` (45%) | 4.35:1 | FAIL 4.5:1 (borderline) |
| `#9a5cff` (72%) | **3.93:1** | FAIL 4.5:1 |
| `#5b44d6` (100%) | 6.48:1 | PASS |

Because the label text spans the gradient, part of "Da Vinci" sits on a sub-4.5:1 region on hover. Not severe (short label, brief hover state), but a real, computed AA gap.

---

## Passing / sound (computed, no action required)

| Pair | Ratio | Level |
|---|---|---|
| `textPrimary #ececec` on surface / background | 13.79:1 / 15.11:1 | AAA |
| `textMuted #b3aa97` on surface | 7.07:1 | AAA |
| `textMuted` on `surfaceBright` | 5.72:1 | AA |
| Token `primary #2CC4FF` / `onPrimary` on `primary` (pre-bug values) | 8.11:1 / 8.28:1 | AAA |
| Tonal status chips (success/warning/error text on ~7.2% underlay) | 4.87–7.29:1 | AA–AAA |
| `aiAccent.textPrimary`/`textSecondary` on AI soft/muted backgrounds | ≥7.8:1 | AAA |
| Disabled full-strength `textMuted` (no extra opacity) on surface | 7.07:1 | AAA |
| `text-medium-emphasis` (≈ on-surface @0.60) | ~5.80:1 | AA |
| Data labels (on-surface @0.72) | 7.76:1 | AA |
| Axis labels (on-surface @0.55) | 5.10:1 | AA |
| Light-mode baseline (`textPrimary` on white, `primary`/`onPrimary` pair, `textMuted` on white) | 17.73:1 / 5.20:1 / 5.93:1 | AA–AAA, confirms light mode is not at risk from anything in this document |

---

## Context-dependent risks (flagged, not claimed as rendered failures)

1. **`color="medium-emphasis"`** on some `v-icon`s is not a registered Vuetify theme color; the CSS class `text-medium-emphasis` is safe, the color *prop* spelling may silently no-op — needs a rendered check, not assumed broken.
2. **Token drift**: `marobase-tokens.css:14-16` uses `#f0f0f0`/`#a3a3a3` for on-surface/on-surface-variant vs. canonical `#ececec`/`#b3aa97` — both independently pass AA, so this is a maintainability risk (see `02-design-system-audit.md` DS-08), not a contrast failure.
3. **Sidebar `textFaint`** (dark) `rgba(151,174,202,0.62)` composited on the sidebar's dark background `#1a1714` = **3.80:1** — computed, passes non-text/large-text (3:1) but fails 4.5:1 if ever used for essential body copy rather than faint/tertiary labels. Confirm usage is decorative/tertiary only.
4. **`.mp-strike`** (struck-through price text) at opacity 0.45 on `textPrimary` — marginal (~3.9:1 per original estimate); worth a computed check once the exact composited color is confirmed against the specific price-text color it's layered on.
5. **Storybook currently shows the *unpatched, correct* dark primary** (`8.11:1`) because it never runs `setAccent`/`setMode` (see `01-repository-discovery.md` §6) — Storybook screenshots taken before A1 is fixed will not reflect the live app's actual (failing) contrast, and after A1 is fixed both will agree. Don't use current Storybook dark screenshots as evidence the app already passes.
6. **No dark-specific Chromatic/story matrix for charts** — the toolbar theme exists and defaults to light; chart stories have no pinned dark parameter, so A4 was caught by source/token read, not by any existing visual gate.

---

## Color-blind / non-color-dependence review

- **Chart series**: the default `blue` palette is a single-hue ramp (Picton Blue at varying tints/shades) — by design this already minimizes protan/deutan confusion risk *within* one series set, but adjacent steps are close enough in hue that shape/line-style is still needed for series identity, which the codebase partially provides (`DashboardChartWidget.vue:207-208` uses a dashed line for a "Previous" comparison series — confirmed good non-color cue for that one case). `indigo`/`ocean`/`aurora` palettes mix blue with violet/teal — `ocean`'s `#0077C8` vs `#2BC5B4` (blue vs teal) is a common deuteranopia confusion pair; verify legend/label backup before enabling these as defaults.
- **Legends exist** for multi-series charts (`DashboardChartWidget.vue:269-271`) — text labels back up color, which is the correct pattern per WCAG 1.4.1; keep this as charts are retuned for dark mode.
- **Status/feedback color**: `MpStatusChip` pairs color with a text label (the status word itself) in all cases reviewed — not color-alone. No color-only error signal was found in the components read for this pass; the independent audit should specifically check form-field error states for an icon/text pairing, not assume it from the design-system components alone.
- **Focus/hover**: none of the interaction-state findings above rely on color alone for *state* (hover/active have background-shift, not just a color swap) — the failures found are contrast-strength failures, not color-dependence failures.

---

## Addendum — light-mode focus ring (confirmed during planning-gate review)

`04-implementation-plan.md` proposes changing the focus-ring *mechanism* (alpha-blend → opaque) in both themes and cites this as "the A2 correction." A2 above was computed for dark mode only, since this audit's scope followed the project brief's dark-mode focus. Before accepting a light-mode mechanism change, the orchestrator independently computed the equivalent light-mode pairs:

| Pair | Computed ratio | Threshold | Result |
|---|---|---|---|
| Cyan primary `#0073AB` @0.36 on white surface | **1.70:1** | non-text 3:1 | **FAIL** (worse than dark's 2.17:1) |
| Cyan primary @0.36 on light background `#f4f6fa` | **1.67:1** | 3:1 | **FAIL** |
| Blue accent `#2D63E8` @0.36 on white | 1.69:1 | 3:1 | **FAIL** |
| Gray accent `#4B5563` @0.36 on white | 1.79:1 | 3:1 | **FAIL** |
| Purple accent (old `#8B5CF6`) @0.36 on white | 1.60:1 | 3:1 | **FAIL** |

**Confirmed: the focus-ring alpha is a pre-existing, cross-theme defect, not dark-mode-specific.** It qualifies under the project brief's explicit exception ("do not change... unless required to fix a clear usability or accessibility issue") for touching a light-mode value. The plan's opaque-ring fix (geometry unchanged, only solidity increased) is therefore justified for light mode too, not just dark.

## Balanced semantic directions for `04-implementation-plan.md`

These keep AA and avoid re-introducing harshness (per the design direction: soften, don't blanket-brighten):

1. **Stop overwriting theme primary with a static hex.** Give `ACCENT_DEFS` (and `accent-presets.css`) a light/dark pair per accent — reuse the existing tuned dark cyan (`#2CC4FF`/`#06212c`) as the model for how much a hue needs to lift for AA on `#222019`, and compute equivalent lifts for blue/gray/purple rather than reusing their light hex.
2. **Raise border/hairline alpha or lightness to clear ~3:1**, not to a harsh white line — e.g. lift `borderSubtle` alpha from 0.14 toward ~0.28–0.35 range (verify the resulting composite computes ≥3:1) or shift the base lightness slightly; this directly satisfies "reduce harshness of... input outlines, card outlines" *by making them a real, calm, visible line instead of a near-invisible one*, which is what "clear surface separation" actually requires.
3. **Increase focus-ring opacity/solidity** (toward ≥0.7 alpha, or an opaque ring with offset) so the composited ring clears 3:1 against both `surface` and `background` — do not widen it or brighten the hue; solidity, not size or saturation, is the fix.
4. **Charts:** switch `activeChartPalette`/axis stops by `vuetifyTheme.global.current.value.dark`, consume the already-generated `mp_color_chart_dark_*` tokens (verified ≥8:1 for at least series1), retire or replace the specific dark-surface sub-3:1 steps identified in A4 for any non-default palette kept as a selectable option, and make `chartTooltipTheme` theme-reactive. Keep dash/marker differentiation for series identity — don't rely on adding more saturated hues.
5. **Author explicit dark `onSuccess`/`onWarning`/`onError`** as deep inks (mirroring the existing `onPrimary #06212c` pattern), not white — this both fixes A5's flat-variant path and matches the "calm, not harsh" direction better than brightening the fills would.
6. **Fix `AppBar.vue`'s two hardcoded gradients (A8, A9)** by routing through the `aiAccent`/`--dv-*` token family (already has correct dark values) instead of literal hex + literal white — this is a token-reuse fix, not a new design decision.
7. **Give `--pos`/`--neg` a dark override** (or alias to `success`/`error`) — target ≥4.5:1 since both are used as body/data text today, not just as non-text indicators.

No recommendation above requires touching light-mode values, the brand accent hue, layout, or component dimensions.
