# Independent dark-mode audit — round 2 (re-audit) — `feature/dark-mode-system` @ `0c578cb`

**Auditor:** independent model (Opus 5), not the implementer.
**Date:** 2026-07-29
**Supersedes:** the round-1 report, preserved verbatim as
[`dark-mode-independent-audit-round1.md`](./dark-mode-independent-audit-round1.md).

**Method.** Live app (`npm run dev` via the *Main App* launch config) driven in the browser at 1440 / 820 / 390 CSS px,
in dark mode and then light mode. Every page was swept with an injected computed-style auditor that walks all visible
elements and reports (a) solid fills / borders whose composited colour has `r − b > 6` on a dark surface — the
"warm tint" test, (b) every text node's real contrast against its *composited* backdrop, (c) every `<svg>` icon under
2.2:1, (d) borders over 3.6:1 against their own surface. Overlay layering and surface separation were measured from the
live `z-index` / composited backgrounds. Colours that CSS only exposes as unresolved functions (`oklch()`,
`color-mix()`, gradients) were resolved to real RGB by compositing them on a `<canvas>` and reading the pixel back, so
none of the findings rest on eyeballing a downscaled screenshot. Chart tooltips were triggered with real pointer input
(not synthetic events) and measured against their clipping ancestor. Both production builds were run.

**Verdict: FAIL.** 0 Blockers, **2 High**, **3 Medium**, 5 Low.

Round 1's six Blocker/High/Medium findings are all **genuinely fixed** (verified individually — see
"Round-1 regressions: re-verified" below). Round 2's High findings are two *new* defects that round 1's sweep could not
see: one because the colour was hidden behind a `color-mix()` that never resolves in `getComputedStyle`, one because it
lives a few lines below the hero that round 1 did fix.

---

## Blocker

None.

---

## High

### H1 — Every outlined form field in dark mode has a warm cast: `color-mix(in oklch, …, transparent)` silently drops the hue

**File:** `src/styles/settings-form.scss:17` (and the `:hover` twin at `:22`)

```scss
:is(.v-application, .v-overlay-container, [class*='v-theme--']) .v-field--variant-outlined {
  background: color-mix(in oklch, var(--surface-2) 55%, transparent);   /* line 17 */
}
… :hover { background: color-mix(in oklch, var(--surface-2) 72%, transparent); }   /* line 22 */
```

In dark mode `--surface-2` → `--surface-secondary` → `--mp-color-dark-surfaceVariant` = `#272B30` = `rgb(39,43,48)`,
a deliberately **cool** grey (b − r = 9). Chrome resolves the mix to:

```
getComputedStyle(field).backgroundColor  →  oklch(0.287141 0.0107786 none / 0.55)
                                                                 ^^^^ hue lost
```

`transparent` is `rgb(0 0 0 / 0)`; in OKLCH its hue is powerless, and Chrome propagates that as a **missing hue** into
the result. The fill therefore paints with no hue at all. Measured by compositing on a canvas over the real card:

| state | mix | composited over `#1F2226` | r − b |
|---|---|---|---|
| rest | `in oklch` (current) | **rgb(40, 38, 40)** | **0** |
| rest | `in srgb` (correct) | rgb(35, 39, 43) | −8 |
| hover | `in oklch` (current) | **rgb(42, 38, 40)** | **+2** |
| hover | `in srgb` (correct) | rgb(36, 40, 45) | −9 |

So the field fill loses ~8–11 units of blue relative to every surface around it and reads warm brown / mauve against
the cool card. This is plainly visible on Settings → General at 390 px and inside the `MpFormDrawer` dark story: the
"First name" / "Last name" / "Email" fills read brownish while the card, canvas and menus read cool. It is the residue
of exactly the complaint the whole correction was meant to remove, and it is app-wide — this is the *global outlined
field baseline*, so it hits every `v-text-field`, `v-select`, `v-textarea`, `v-autocomplete`, `v-combobox` and date
input in the product.

A runtime sweep for `oklch(… none …)` across the dashboard, settings, orders, marketing, journey-builder and Da Vinci
pages returns **only** `.v-field` backgrounds, so this is one root cause, not a family.

**Why round 1 missed it:** `getComputedStyle` returns the unresolved `oklch(… none …)` string, which a naive
`rgba()`-only parser skips. It has to be composited to be seen.

**Fix:** change the interpolation space to sRGB (or hand-write the alpha):

```scss
background: color-mix(in srgb, var(--surface-2) 55%, transparent);
…:hover { background: color-mix(in srgb, var(--surface-2) 72%, transparent); }
```

**Proven zero light-mode impact:** light `--surface-2` = `--mp-color-light-surfaceVariant` = `#ececec`, which is fully
achromatic, so both spaces composite identically — measured `rgb(245,245,245)` over white either way.

---

### H2 — Da Vinci AI feature cards still use hard-coded light pastel gradients (three large near-white blocks + a 1.84:1 icon)

**File:** `src/views/DaVinci/DaVinciAI.vue` — the `features[].gradient` literals (~lines 89–107) applied inline at
line 186, plus `.dv-feature-play` at line 302

```js
gradient: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)'
gradient: 'linear-gradient(135deg, #dbeafe 0%, #cffafe 100%)'
gradient: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)'
```

```html
<div class="dv-feature-media …" :style="{ background: f.gradient }">
```

```css
.dv-feature-play { background: rgba(255, 255, 255, 0.92); }   /* + a `text-primary` play glyph */
```

Round 1's B2 was fixed correctly — `.dv-hero` now has a `.v-theme--maropostDark` gradient built from the dark accent
containers, and its text measures 11.3–12.7:1 (headline) and 6.3–6.9:1 (body). But the three feature cards immediately
below it, in the same file, were left on the light gradients. In dark mode `/accounts/:id/da-vinci` renders three
16:9 pastel-white blocks (`#ede9fe → #cffafe`) directly on the dark page, each with a 92%-white circle carrying a
`#2CC4FF` play icon:

| element | fg | bg | ratio |
|---|---|---|---|
| `.dv-feature-play .v-icon` (×3, plus more further down the page) | `#2CC4FF` | `#f5f5f5` | **1.84:1** |

**Fix:** move the gradients out of the JS literal into theme-aware CSS (or add a `.v-theme--maropostDark
.dv-feature-media` override) using the same dark accent-container tokens the hero now uses, and give
`.dv-feature-play` a dark-mode surface so the `text-primary` glyph keeps its contrast.

---

## Medium

### M1 — Pie/donut chart tooltips are 1.70:1 in dark mode (light mode is 5.12:1)

**File:** `src/styles/charts.css:45-50`

ApexCharts gives pie/donut tooltip rows an inline `background-color: <series colour>`. `charts.css` then forces the
row text to the theme's tooltip ink:

```css
.apexcharts-tooltip.apexcharts-theme-dark .apexcharts-tooltip-series-group,
… .apexcharts-tooltip-text-y-label { color: var(--mp-color-chart-dark-tooltipText) !important; }  /* #ECECEC */
```

Measured on the Dashboard "Traffic mix" donut — the page from the original bug report:

| theme | row background (series colour) | text | ratio |
|---|---|---|---|
| dark | `#2CC4FF` | `#ECECEC` | **1.70:1** |
| light | `#0092D4` | `#1A1814` | 5.12:1 |

The light theme happens to work because its ink is near-black; the dark theme's near-white ink lands on a bright cyan
slice colour. Affects every pie/donut widget (Traffic mix, Revenue by Channel, Email Address by Domain, Tickets by
Channel, …).

**Fix:** don't force `tooltipText` onto `.apexcharts-tooltip-series-group` when Apex has set a series-colour
background — either disable Apex's series-colour fill (`tooltip.fillSeriesColor: false` / a custom
`tooltip.custom`) so rows sit on `--mp-color-chart-dark-tooltipBackground`, or pick the row ink per series colour.

### M2 — ApexCharts tooltip clipping is still unfixed; WP-2 was reverted without the replacement

**File:** `src/components/dashboards/widgets/DashboardChartWidget.vue:290`
(`.dashboard-chart-widget { overflow: hidden }`), plus `DashboardWidgetCard.vue:262/407`

WP-2 relaxed the chart cards to `overflow: visible` to free the tooltip; round-1 H2 showed that let a stale Apex canvas
paint over neighbouring widgets, and commit `0c578cb` **reverted to clipping**. The recommended replacement (a fixed /
teleported tooltip container, or a resize observer) was not implemented, so the original defect is back whenever the
tooltip is taller than the widget body.

Reproduced with real pointer input, no dev tooling, at 1440×900 in dark mode: set the "Revenue by channel" widget to
**Size S** via its kebab menu, then hover the plot.

```
tooltip height                235 px   (6 series + title)
tooltip top / bottom          496 / 731
.dashboard-chart-widget       548 / 773   (overflow: hidden)
clipped off the top           52 px  →  the "W7" title row and the first series row are cut away
```

The default M size (287 px card) happens to fit a 6-series tooltip; S does not, and neither will M once a chart carries
more series or a longer label.

**Fix:** render the Apex tooltip outside the clipping subtree — `tooltip: { fixed: { enabled: true } }` or an
`appendTo`/teleport target on `.mp-content-frame` — and keep the card clipped so round-1 H2 does not come back.

### M3 — Storybook's pinned dark stories now render dark components on a light canvas

**File:** `.storybook/preview.ts` — `syncDocumentTheme()` (changed in `f3ad635`)

WP-4 simplified the function to

```ts
function syncDocumentTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
}
```

removing the `.v-theme--maropostDark` class it used to stamp on `<html>` and `<body>`. But `src/styles/global.scss:196`
paints the page from Vuetify's theme variable:

```scss
body { background: rgb(var(--v-theme-background)); color: rgb(var(--v-theme-on-background)); }
```

`<body>` is outside `.v-application`, so with no theme class it falls back to the default (light) theme. Measured in
the running Storybook on the story added by the same commit
(`Dashboards/DashboardWidgetActionMenu → DarkModeCardWithOpenMenu`):

```
document.documentElement.dataset.theme             → "dark"
getComputedStyle(document.body).backgroundColor     → rgb(244, 246, 250)     ← light canvas
document.querySelector('.v-application').className  → …v-theme--maropostLight
// add .v-theme--maropostDark back to <body>:
                                                    → rgb(23, 25, 28)        ← correct
```

Same on `Overlays/MpFormDrawer → DarkModeWidgetEdit`. The dark card and its menu render correctly (a nested Vuetify
theme provider wraps the story), but they sit on a light page — which silently defeats the purpose of the pinned dark
regression stories added in this effort, and breaks the "Storybook renders identically to the app" contract in
`.claude/rules/global-styles.md`.

**Fix:** keep `data-theme` on `<html>` (it drives `dv-tokens.css` / `shell-variants.css`) **and** re-apply
`v-theme--maropostDark` / `v-theme--maropostLight` to `<body>` — or set `--v-theme-background` on the
`[data-theme='dark']` root so `body` resolves without the class.

---

## Low

### L1 — Date-range menu: two labels remain marginally under AA (round-1 L1/L2, not remediated)
`src/views/DashboardView.vue` — measured again at HEAD, on the menu surface `#363B42`:
`CURRENT` / `LAST` / `PERIOD TO DATE` / `RETAIL MOMENTS` / `CUSTOM` group labels at 11 px in `#9BA3AC` → **4.40:1**;
the active preset ("Last 30 days") at 13 px in `--accent-ink` = `#00ADF1` → **4.41:1**. Dark mode should read from the
lighter end of the accent ramp (`--accent-default` / `--accent-hover`) rather than the light-mode "pressed" value.

### L2 — Dark surface / text ladder nits (round-1 L3, not remediated)
`src/design-tokens/tokens.json` (`color.dark.*`): `surfaceRaised` `#24272C` is **darker** than `surfaceVariant`
`#272B30`, so a "raised" tier can read as recessed; `textDisabled` `#8A9199` (≈5.0:1 on `#1F2226`) sits very close to
`textMuted` `#9BA3AC` (≈6.3:1), so disabled text does not read as clearly de-emphasised.

### L3 — `inkPanel.fg` is the one warm value left in the dark palette
`--mp-color-dark-inkPanel-fg: #f7f5f2` (r − b = 5) — a warm off-white, used for `MpFloatingBulkBar` text on the cool
`#343A41` panel. Contrast is fine (10.6:1); it is a consistency nitpick against an otherwise fully cool `color.dark.*`.

### L4 — `MpFormDrawer` layering is still incidental (round-1 L4, not remediated)
`src/components/MpFormDrawer.vue` — the removed `z-index: 2005` was not replaced; the drawer takes whatever Vuetify's
layout assigns by registration order. It stacks correctly today. If deterministic layering was the intent, pin it to
`var(--mp-zIndex-modal)` from the new scale.

### L5 — Disabled affordances are dim (informational, theme-parity)
Data-table pagination arrows resolve to **2.18:1** in dark (button `opacity: 0.26` on `#1F2226`); the Da Vinci composer
Send button's icon is 1.99–2.41:1 on its hard-coded purple→cyan gradient at `opacity: 0.45`. Both are *disabled*
states (exempt from WCAG contrast) and both behave the same in light mode, so neither is a dark-mode regression.

---

## Round-1 regressions: re-verified

| round 1 | status | evidence at `0c578cb` |
|---|---|---|
| **B1** whole app at 15% opacity (`MpStatusChip.vue` `:global()` truncation) | **fixed** | `getComputedStyle('.v-application').opacity === "1"` in dark. On `/commerce/:id/orders` the tonal chips composite correctly: Processing `#213A47`/5.92:1, Completed `#263A35`/5.40:1, Cancelled & Refunded `#3E3032`/4.81:1, On Hold `#3C352B`/5.37:1, each 1.28–1.34:1 against the card, i.e. the `0.15` underlay now lands on the chip only. |
| **B2** Da Vinci hero white-on-white | **fixed** | `.v-theme--maropostDark .dv-hero` gradient = `#321B52 → #172A52 → #04324D`; headline/brand 11.33–12.57:1, body copy 6.31–6.85:1. (But see **H2** — the feature cards below it were missed.) |
| **H1** global 60%-grey colour leak (`DvChartCard.vue`) | **fixed** | No bare `.v-theme--maropostDark{…}` declaration rule survives in `dist/assets/*.css` (the only comma-listed bare selector is the intentional theme-alias custom-property block). The Dashboard "Add widget" button's prepend icon is now `rgb(6,33,44)` on `#2CC4FF` = **7.21:1** (was 1.34:1). |
| **H2** chart canvases painting over neighbours | **fixed** — but see **M2** | Cards clip again at `.dashboard-chart-widget`, `.dashboard-widget-card__body` and `.v-card`; no cross-widget spill after sidebar or drawer toggles. The tooltip half of the problem was not solved. |
| **M1** `ModuleLandingPage` dark tints inert + stray global custom property | **fixed** | On `/accounts/:id/marketing` in dark: `.tint-blue` → `#60A5FA`, `.tint-violet` → `#A78BFA`, `.tint-green` → `#4ADE80`, `.tint-cyan` → `#22D3EE`, `.tint-amber` → `#FBBF24`, `.tint-rose` → `#FB7185` (all the dark values, on the element), and `.v-application` no longer carries a stray `--tile-accent`. |
| **M2** search placeholders below AA | **fixed** | `::placeholder { opacity: 1 }` now wins everywhere measured: "Find or Ask" 6.26:1, "Search dashboards" 6.26:1, "Search Settings" 6.26:1, "Search steps…" 5.64:1, "Search conversations…" 5.58:1, "Ask Da Vinci…" 8.22:1. |

---

## What passed

* **Builds.** `npx vite build` → exit 0 (`✓ built in 11.10s`). `npm run build-storybook` → exit 0
  (`✓ built in 19.03s`).
* **No warm brown/olive tint on any surface, card, menu or border.** Full-page scrolling sweeps in dark at 1440 / 820 /
  390 of `/dashboard`, `/dashboards`, `/settings/general`, `/da-vinci` (+ the open copilot drawer), `/journeys/1/builder`,
  `/commerce/:id/orders`, `/marketing` and `/billing` returned **zero** warm hits. Canvas `#17191C`, card `#1F2226`,
  variant `#272B30`, ink panel `#343A41`, overlay `#32373E`, borders `#33373D / #3D4249 / #4D535B` all read cool-neutral.
  The one exception is **H1** (form-field fills), which the sweep could only see once the `color-mix()` was composited.
* **No loud borders.** No border on a >1200 px² element exceeded 3.6:1 against its own surface on any audited page in
  any of the three widths. (The only hit was a ghost CTA whose border *is* its foreground colour, by design.)
* **Text hierarchy.** Apart from the specific ratios called out above, every visible text node on every audited page
  cleared its AA threshold against its composited backdrop at all three widths — `#ECECEC` primary,
  `#C2C7CD` secondary, `#9BA3AC` muted. The user menu header (which sits on an OKLCH gradient) measures 11.3–12.7:1
  (name), 5.25–5.87:1 (email), 6.66–7.46:1 (role chip).
* **Menu / dropdown layering and separation — the "menus merge into the card" complaint is resolved.** Every overlay
  measured on the Dashboard renders on `#32373E` with a 1px `#3D4249` border and
  `rgba(0,0,0,.55) 0 8px 24px -6px`, hit-tests on top, and sits 1.33:1 above the `#1F2226` card beneath it:

  | overlay | z-index | on top | surface | separation vs card |
  |---|---|---|---|---|
  | widget kebab menu | 2000 | yes | `#32373E` | 1.33:1 |
  | dashboard-title switcher | 2010 | yes | `#32373E` | 1.33:1 |
  | date-range panel | 2020 | yes | `#32373E` | 1.33:1 |
  | Actions dropdown | 2030 | yes | `#32373E` | 1.33:1 |
  | app-bar user menu | 2000 | yes | gradient `#233138 → #20282C` | visible |

  Verified visually at 390 px (2× capture) and 820 px as well as 1440 px.
* **Chart tooltips are theme-correct and reachable.** `.apexcharts-tooltip` resolves to `rgb(50,55,62)` background,
  `rgb(236,236,236)` text, `#3D4249` border. Real pointer hovers do raise tooltips on both single- and multi-series
  widgets (an earlier hypothesis that the legend `foreignObject` swallows hover was tested and **disproved** — the
  event bubbles to the canvas div where Apex listens). Horizontal clamping keeps tooltips inside the card; only the
  vertical overflow case in **M2** clips.
* **Interactive states.** Sidebar nav: rest `#1F2226`, hover `#272B30`, selected `#213A47` with 10.09:1 icon+label;
  hovered item icon 5.58:1, label 12.06:1. Primary button: `#2CC4FF` → hover `#29B7EE`, label and icon 7.21:1.
  Keyboard focus ring: `2px solid #2CC4FF`, **7.94:1** against `#1F2226`, `:focus-visible` correct. Table row hover
  wash and row selection both legible; `MpFloatingBulkBar` appears on `#343A41` with a `#3D4249` border.
* **AppBar and AppSidebar.** Expanded and collapsed-rail states both clean at all three widths; no hard-coded warm
  colours, no icon under the 2.2:1 floor, selected-item highlight visible, rail icons visible.
* **Native controls.** `color-scheme: dark` is set on `:root` and `body`, so the date inputs in the date-range panel
  and all scrollbars adopt the dark UA palette (no black-on-black calendar glyphs).
* **Responsive.** Dashboard, Dashboards list, Settings and Da Vinci at 390 / 820 / 1440 all swept clean apart from the
  findings above (which are width-independent).
* **Light mode is genuinely unchanged.**
  * `git diff f59df95..HEAD -- src/design-tokens/generated/variables.css` filtered to non-dark lines contains **only
    the eight additive `--mp-zIndex-*` declarations** — zero light-token value changes.
  * Visual + automated sweep of `/dashboard` in light: zero warm / low-text / low-icon / loud-border hits;
    `.v-application` opacity 1, canvas `rgb(244,246,250)`, cards `#FFFFFF`, fields `#FFFFFF`.
  * The two non-theme-scoped source edits were checked for light-mode risk and are safe:
    `BillingView.vue` `color="white"` → `color="on-primary"` is identical in light (`--mp-color-light-onPrimary:
    #ffffff`); the deleted `.card-hover` rules in `global.scss` have **zero** remaining usages anywhere in `src/` or
    `.storybook/`.
  * The fix proposed for **H1** is also provably light-neutral (see H1).
* **Z-index scale (WP-5).** Additive; the migrated literals (`10000` toast, `2400` modal, `1010` toggle pill,
  `1005` flyout, `100` bulk bar) match their previous values exactly.

---

## Recommended remediation order

1. **H1** — one-word change in `settings-form.scss` (`in oklch` → `in srgb`, both lines). Highest visible payoff, zero
   light-mode risk. Consider a lint/CI guard against `color-mix(in oklch, …, transparent)` on low-chroma tokens.
2. **H2** — theme-aware gradients + play-circle surface for `.dv-feature-media` / `.dv-feature-play`.
3. **M1** — stop forcing dark tooltip ink onto series-colour-filled pie tooltip rows.
4. **M2** — teleport / fix the Apex tooltip so the card can stay clipped.
5. **M3** — restore the `<body>` theme class in `.storybook/preview.ts` (or theme `--v-theme-background` from
   `[data-theme]`), then re-check one pinned dark story.
6. **L1–L4** as polish.
