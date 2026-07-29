# Independent dark-mode audit — `feature/dark-mode-system` @ `881f409`

**Auditor:** independent model (Opus 5), not the implementer.
**Date:** 2026-07-29
**Method:** live app (`npm run dev`, Main App launch config) inspected in dark mode at 390 / 820 / 1440 CSS px, plus
computed-style contrast/tint sampling injected into the page, plus verification of the **built** CSS in `dist/` so that
Vite/HMR artefacts could not mask or invent defects. Both `npx vite build` and `npm run build-storybook` were run.

**Verdict: FAIL.** 2 Blockers, 2 High, 2 Medium, 4 Low.

The headline problem is that **both production builds pass while dark mode is unusable**. Three of the WP-3 component
fixes were written as `:global(.v-theme--maropostDark) <descendant>` inside a `<style scoped>` block. Vue's scoped-CSS
compiler truncates such a selector at the `:global()` node, so each one ships as a **bare global rule targeting every
element that carries the dark theme class**, including `.v-application` itself. This is verifiable in the built CSS:

```
$ grep -oE "\.v-theme--maropostDark\{[^}]{0,80}\}" dist/assets/*.css
dist/assets/index-C8Ztz-Nt.css:.v-theme--maropostDark{opacity:.15}
dist/assets/index-C8Ztz-Nt.css:.v-theme--maropostDark{color:var(--mp-color-chart-dark-axisLabel)}
dist/assets/ModuleLandingPage-0eIl2MsY.css:.v-theme--maropostDark{--tile-accent: #60a5fa;…}   (×8)
```

Everything below the `:global()` findings was audited with those three rules locally neutralised, then the tree was
restored to `881f409` (working tree is clean; the blocker reproduces at HEAD).

---

## Blocker

### B1 — The entire app renders at 15% opacity in dark mode
**File:** `src/components/MpStatusChip.vue:174`

```css
:global(.v-theme--maropostDark) .mp-status-chip.v-chip--variant-tonal :deep(.v-chip__underlay) {
  opacity: 0.15;
}
```

compiles to `.v-theme--maropostDark{opacity:.15}`. `.v-application` carries that class, so the whole application tree
paints at 15% opacity. Measured at HEAD on `/dashboard`:

```
getComputedStyle(document.querySelector('.v-application')).opacity  →  "0.15"   (dark)
                                                                    →  "1"      (light)
```

Every surface, every label, every icon is a ghost. This is the first thing a reviewer sees on the page from the original
bug report, and it is present in the production bundle.

**Fix:** drop `:global()` — inside a scoped block the ancestor class works on its own:

```css
.v-theme--maropostDark .mp-status-chip.v-chip--variant-tonal :deep(.v-chip__underlay) { opacity: 0.15; }
```

Verified: with that selector the chip underlay resolves to `0.15` on `/commerce/:id/orders` and `.v-application` stays
at opacity 1.

### B2 — Da Vinci AI landing hero is white-on-white
**File:** `src/views/DaVinci/DaVinciAI.vue:272-275`

```css
.dv-hero { background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 50%, #cffafe 100%); }
```

Hard-coded light gradient with no dark-mode variant. Its children inherit the theme's `on-surface`:

| element | colour | over | contrast |
|---|---|---|---|
| `.dv-hero__brand span` "Da Vinci AI" | `rgb(236,236,236)` | `#ede9fe → #cffafe` | **≈1.0:1** |
| `h1.dv-hero__headline` "The complete AI solution…" | `rgb(236,236,236)` | same | **≈1.0:1** |
| `.dv-hero p` body copy | `rgba(236,236,236,0.7)` | same | **≈1.0:1** |

The hero headline, the product name and the supporting paragraph are invisible on `/accounts/:id/da-vinci` in dark mode.
WP-3 fixed "a hard-coded light-purple Da Vinci chip" but missed the hero on the same surface.

**Fix:** give `.dv-hero` a dark-mode gradient from the dark accent/container tokens (or tint the dark surface), or pin the
hero's foreground to a dark ink when the light gradient is intentionally kept.

---

## High

### H1 — Global 60%-grey colour leak washes out text and icons
**File:** `src/components/copilot/DvChartCard.vue:90`

`:global(.v-theme--maropostDark) .chart-y-labels { color: var(--mp-color-chart-dark-axisLabel) }` ships as
`.v-theme--maropostDark{color:var(--mp-color-chart-dark-axisLabel)}` = `rgba(236,236,236,0.6)` applied to every element
carrying the dark theme class — which Vuetify puts on `v-btn`, `v-icon`, `v-card`, `v-chip`, `v-list`, `v-field`, and
`.v-application` itself. Anything that inherits its colour instead of declaring one now gets a chart axis-label grey.

Confirmed instance on the Dashboard: the primary **Add widget** button.

| | with the leak (HEAD) | with the leak removed |
|---|---|---|
| button label | `rgb(6,33,44)` — correct `on-primary` | `rgb(6,33,44)` |
| prepend `+` icon | `rgba(236,236,236,0.6)` on `rgb(44,196,255)` → **1.34:1** | `rgb(6,33,44)` → ≈8.5:1 |

**Fix:** `.v-theme--maropostDark .chart-y-labels { … }` (no `:global()`).

### H2 — Chart canvases now paint outside their card, over neighbouring widgets
**Files:** `src/components/dashboards/DashboardWidgetCard.vue:400-424`, `src/components/dashboards/DashboardGrid.vue:319-323`,
`src/components/dashboards/widgets/DashboardChartWidget.vue` (`.dashboard-chart-widget { overflow: visible }`)

WP-2 set `overflow: visible !important` on chart widget cards and their bodies, and gave hovered grid items
`z-index: 2`. The ApexCharts canvas does not re-measure when the content column changes width, so after any normal
layout change its stale, wider canvas is no longer clipped — it paints across its neighbours.

Reproduced on `/dashboard` (1440×900) by clicking **Expand sidebar** — one click, no dev tooling:

```
widget                  card right   canvas right   spill
Revenue by channel          677          1034       +357 px
Revenue Over Time           969          1381       +412 px
Revenue by Channel          970          1068        +98 px
Email Volume                618           683        +65 px
Email Address by Domain     969          1034        +65 px
Ticket Volume               969          1034        +65 px
Tickets by Channel          618           683        +65 px
```

Visually: the "Revenue by channel" line series, its `Social / Organic / Referral` legend chips and its `W9…W12` axis
labels are drawn straight across the "Traffic mix" donut card. Opening/closing the Da Vinci drawer produces the same
result (measured spills of 149–252 px), and the `.vgl-item:hover { z-index: 2 }` rule guarantees the spill is lifted
*above* the neighbour whenever the user's cursor is on the chart. Before WP-2 the same stale canvas existed but was
clipped at the card edge, so nothing bled.

**Fix:** keep the card clipping and free only the tooltip — e.g. render the Apex tooltip in a fixed/teleported container
(`tooltip.fixed` / `appendTo` outside the card), or observe the container and call `chart.updateOptions`/`resize` so the
canvas width never goes stale before relaxing `overflow`.

---

## Medium

### M1 — The ModuleLandingPage dark-tint fix does not apply, and leaks a global custom property
**File:** `src/components/ModuleLandingPage.vue:316-323`

Same `:global()` truncation. Because the eight base `.tint-*` rules declare `--tile-accent` **on the tile element**
(`.tint-blue[data-v-…]`), and the leaked rule only sets an *inherited* value on `.v-application`, the element-level
light values win. Runtime check on `/accounts/:id/marketing` in dark mode at HEAD:

```
.v-application  --tile-accent: #2dd4bf     ← stray global (last of the 8 leaked rules)
.tint-blue      --tile-accent: #2563eb  --tile-accent-ink: #1d4ed8   ← still the LIGHT values
.tint-violet    --tile-accent: #7c3aed  --tile-accent-ink: #6d28d9
.tint-cyan      --tile-accent: #0891b2  --tile-accent-ink: #0e7490
```

So the WP-3 item "light-only ModuleLandingPage tint colors" is inert: module-tile hover borders
(`color-mix(--tile-accent 30%, …)`) and focus rings (`18%`) still use light-mode accents on dark surfaces, and any future
consumer of `var(--tile-accent, …)` inherits a stray teal.

**Fix:** `.v-theme--maropostDark .tint-blue { … }` etc. (no `:global()`), so the dark declaration also lands on the
element and wins by source order.

### M2 — Search placeholders are below AA in dark mode (2.5–2.6:1)
**File:** `src/styles/settings-form.scss:46-49` (sets `color` but not `opacity`); Vuetify supplies
`::placeholder { opacity: var(--v-disabled-opacity) }` = `0.5` in the dark theme.

Measured (effective colour after the 0.5 alpha, against the real backdrop):

| field | surface | ratio |
|---|---|---|
| `MpDataTableToolbar` "Search…" (`/commerce/:id/orders`) | `#1F2226` | **2.61:1** |
| "Search dashboards" (`/accounts/:id/dashboards`) | `#1F2226` | **2.61:1** |
| "Search steps…" (Journey Builder rail) | `#1F2226` | **2.50:1** |
| "Search dashboards" (switcher menu) | `#32373E` | 4.70:1 |

`--text-muted` (#9BA3AC) is a perfectly good placeholder colour at full strength (≈6.3:1); the 0.5 alpha is what breaks
it. Add `opacity: 1` next to the `color` declaration and widen the selector beyond `--variant-outlined`.

---

## Low

### L1 — Active date-range preset text is 4.43:1
`src/views/DashboardView.vue:1190-1195` uses `color: var(--accent-ink)`, which in dark resolves to
`--mp-color-dark-accent-cyan-active` = `#00ADF1` — a *darker* cyan, i.e. the light-mode "pressed" direction. On the
`color-mix(--accent 12%, transparent)` active background it measures 4.43:1 at 13px, marginally under AA. Dark mode
should read from the lighter end of the accent ramp (`--accent-default` / `--accent-hover`).

### L2 — Date-menu group labels are 4.42:1
`src/views/DashboardView.vue:1157-1164` — `CURRENT` / `LAST` / `PERIOD TO DATE` at 11px in `--muted` on the menu
surface. Just under AA for small text.

### L3 — Two nits in the dark surface/text ladder
`src/design-tokens/tokens.json` (`color.dark.*`):
* `--surface-raised` `#24272C` is **darker** than `--surface-secondary` `#272B30`, so a "raised" surface can read as
  recessed relative to a variant surface.
* `--text-disabled` `#8A9199` (≈5.0:1 on `#1F2226`) sits very close to `--text-muted` `#9BA3AC` (≈6.3:1); disabled text
  does not read as clearly de-emphasised.

### L4 — `MpFormDrawer` layering is now incidental rather than declared
`src/components/MpFormDrawer.vue` — WP-4 removed `.mp-form-drawer { z-index: 2005 }` as a dead rule. The drawer now takes
whatever z-index Vuetify's layout assigns by registration order (observed `1010`, above the copilot drawer at `1008`, so
today it still stacks correctly and the drawer never overlaps the app bar geometrically). But the ordering is no longer
declared anywhere. If deterministic layering was the intent, pin it to `var(--mp-zIndex-modal)` from the new scale.

---

## What passed

* **Builds.** `npx vite build` → exit 0. `npm run build-storybook` → exit 0. (Both pass *through* Blocker B1, which is
  the most important observation in this report: the build is not a dark-mode gate.)
* **No warm brown/olive tint anywhere.** Automated sweep of every visible element on Dashboard, Dashboards list,
  Settings → General, Da Vinci AI, Journey Builder, Sales Orders and Marketing landing found **zero** dark surfaces or
  borders with `r − b > 6`. Canvas `#17191C`, card `#1F2226`, variant `#272B30`, overlay `#32373E`, borders
  `#33373D / #3D4249 / #4D535B` all read cool-neutral. Only semantic warning/error fills came back "warm", as expected.
* **No loud borders.** No border on a >1200px² element exceeded 3.5:1 against its own surface on any audited page.
* **Menu / dropdown layering and separation.** Widget three-dot menu, dashboard-title switcher, date-range panel,
  Actions dropdown and the app-bar user menu all render above the dashboard cards (`.v-overlay` z-index `2000` vs card
  `0`) on a distinctly lighter surface (`#32373E` vs card `#1F2226`) with a 1px `#3D4249` border and
  `rgba(0,0,0,.55) 0 8px 24px -6px` shadow. The "menus merge into the card beneath" complaint is resolved.
* **Chart tooltip theming.** `.apexcharts-tooltip` resolves to `rgb(50,55,62)` background with `rgb(236,236,236)` text,
  and every ancestor between the tooltip and `.mp-content-frame` is now `overflow: visible` — so tooltips will not be
  clipped. (The mechanism used to achieve this is H2.)
* **AppBar and AppSidebar.** Collapsed rail and expanded sidebar both clean; no hard-coded warm colours; selected item
  highlight and all rail icons visible; no low-contrast icons detected in either state.
* **Responsive.** Dashboard at 390 px and 820 px and Sales Orders / Settings at 1440 px are clean — automated sweep
  returned no warm, low-text or low-icon hits at any of the three widths.
* **Data tables.** `MpStatusChip` tonal chips (Processing / Completed / Cancelled / Refunded / On Hold) all legible,
  underlay `0.15` once B1's selector is corrected; fulfilment dots, row icons, header labels and pagination all readable.
* **Light mode unchanged.** `git diff f59df95..HEAD -- src/design-tokens/generated/variables.css` filtered to non-dark
  lines contains **only the eight new `--mp-zIndex-*` additions** — zero light-token value changes. Visual spot-check of
  `/dashboard` in light mode matches the pre-change appearance, and `.v-application` opacity is `1` in light (the three
  leaked rules are all keyed on `.v-theme--maropostDark`, so light mode is genuinely unaffected).
* **Z-index scale (WP-5).** Additive only; `dropdown: 2000` > `bulkActionBar: 100` > `stickyHeader: 1`, and the
  migrated literals match their previous values.

## Recommended remediation order

1. **B1** — one-line selector fix in `MpStatusChip.vue`. Nothing else can be judged until this lands.
2. **H1**, **M1** — the same `:global()` fix in `DvChartCard.vue` and `ModuleLandingPage.vue`. Then add a guard: grep
   `src/**/*.vue` for `:global(` in scoped blocks, or assert in CI that `dist/assets/*.css` contains no bare
   `.v-theme--maropostDark{…}` rule.
3. **B2** — dark variant for `.dv-hero`.
4. **H2** — re-clip the chart cards and solve the tooltip properly (fixed/teleported tooltip, or resize the canvas).
5. **M2**, then the Low items.
