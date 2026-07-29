# Dark-mode independent audit — round 3 (post-remediation re-audit)

**Auditor:** independent model (Opus), separate from the implementer
**Date:** 2026-07-29
**Branch:** `feature/dark-mode-system` @ `a47741c`
**Baseline for light-regression diff:** `f59df95` (last commit before the WP-1 token swap)
**Supersedes:** round 2, preserved verbatim as
[`dark-mode-independent-audit-round2.md`](./dark-mode-independent-audit-round2.md);
round 1 as [`dark-mode-independent-audit-round1.md`](./dark-mode-independent-audit-round1.md).

**Method.** Live app (Vite dev server via the *Main App* launch config) driven in a real browser.
Dark mode forced with `localStorage['app-theme-mode'] = 'dark'` and confirmed via
`document.documentElement.dataset.theme` + the `v-theme--maropostDark` class. Every surface was
inspected at **390 / 820 / 1440 CSS px**, then spot-checked in light mode. Screenshots were paired
with injected computed-style probes so no finding rests on eyeballing a downscaled capture:

- **warm-tint sweep** — HSL hue 15-95°, saturation > 0.07, lightness < 0.62 over `backgroundColor`,
  all four border colours and `color` of every visible element;
- **contrast sweep** — every text node's ratio against its *composited* backdrop, with element
  `opacity` and colour alpha folded in, graded against the size/weight-appropriate AA threshold;
- **overlay geometry** — for each open overlay, the panel's fill, shadow and border compared against
  the fill of every `.v-card` / `.mp-content-frame` it geometrically overlaps;
- **icon sweep** — every `.v-icon` / `<svg>` under 3:1, with genuinely-hidden hover-reveal elements
  separated from accidental invisibility;
- **chart tooltips** — activated with real pointer events on the Apex hover areas and their rects
  compared against the chart canvas bounds.

**Verdict: FAIL — 1 High, 2 Medium, 7 Low.**
The palette swap itself is sound and the original warm/muddy complaint is genuinely gone. What is
*not* fixed is the second half of the original report — "menus visually merge into the cards beneath
them" — which survives intact in the AppBar's three hand-rolled overlay panels.

---

## Surfaces exercised (all in dark)

| Surface | Route | Widths |
|---|---|---|
| Main Dashboard — KPI + chart + pie widgets, widget kebab menu, dashboard-title switcher, date-range selector, Actions menu, Add widget | `/dashboard` | 390 / 820 / 1440 |
| Dashboards list — data table, row hover, pagination | `/accounts/2000290/dashboards` | 1440 |
| Settings → Account Defaults — form fields, disabled field, selects, sticky save bar | `/accounts/2000290/settings` | 800 / 1440 |
| Da Vinci AI landing — hero, token meter, feature cards, entitlement chips | `/accounts/2000290/da-vinci` | 1440 |
| Da Vinci copilot — chat thread, chart card, draft chip, suggestion chips, composer | `/accounts/2000290/da-vinci/copilot` | 1440 |
| Journey Builder canvas — nodes, selected node, inspector panel, step rail | `/accounts/2000290/journeys/1/builder` | 1440 |
| Sales Orders — status chips, filter tabs, floating bulk bar | `/commerce/2000290/orders` | 800 / 1440 |
| Design System demo — shared component gallery | `/accounts/2000290/design-system` | 1000 |
| AppBar overlays — user menu, assistant menu, theme segment | any | 800 / 1440 |
| Light-mode spot-check — Dashboard + widget menu, Settings | `/dashboard`, `/accounts/2000290/settings` | 1200 |

---

## Blocker

None. Nothing is invisible, unreadable, or unusable.

---

## High

### H-1 — AppBar overlay panels still merge into the card beneath them (the original complaint, unfixed)

**File:** `src/components/layout/AppBar.vue`
**Selectors:** `.assistant-menu-card` (≈939), `.um-cascade-card` (≈1012), `.user-menu-card` (≈1035)

All three hand-rolled overlay panels share this rule:

```css
background: var(--surface-1);
border: 1px solid var(--hairline);
box-shadow:
  0 8px 32px color-mix(in oklch, var(--ink) 12%, transparent),
  0 2px 8px  color-mix(in oklch, var(--ink) 6%, transparent);
```

Two things go wrong, and only in dark mode:

1. `--surface-1` → `--surface-primary` → `color.dark.surface` = **`#1F2226`** — the *identical* fill
   used by `.v-card` and `.mp-content-frame`. There is **zero luminance step** between the floating
   panel and the surface it floats over.
2. `--ink` → `--text-primary` = **`#ececec`**, so the elevation shadow resolves to a near-**white
   glow** (`oklch(0.943083 … / 0.12) 0 8px 32px`). A light halo under a panel reads as haze, not
   elevation. The dark alias block already states this rule and this code violates it —
   `mp-theme-aliases.css`: *"No white sheen on dark: a light inset reads as a glow, not elevation."*

Measured with the user menu open on `/commerce/2000290/orders` at 800×700:

| | value |
|---|---|
| `.user-menu-card` background | `rgb(31, 34, 38)` |
| overlapping `.v-card` background | `rgb(31, 34, 38)` — overlap **335 × 406 px** |
| overlapping `.mp-content-frame` background | `rgb(31, 34, 38)` — overlap **360 × 622 px** |
| `.user-menu-card` shadow, **dark** | `oklch(0.943083 … / 0.12) 0 8px 32px` → white glow |
| `.user-menu-card` shadow, **light** | `oklch(0.209825 … / 0.12) 0 8px 32px` → real shadow |
| `.assistant-menu-card` background | `rgb(31, 34, 38)` over `.dv-panel__header` `rgb(31, 34, 38)` — overlap 280 × 56 px |

The only remaining separation is a 1px `#33373D` hairline, two luminance levels above the fill on
both sides of the edge. This is why the defect is dark-specific: in light mode the same rule works,
because `--surface-1` is `#ffffff` *and* `--ink` is dark, so the panel still gets a real drop shadow.

For contrast, every *Vuetify* menu on the same pages does this correctly — `#32373E` fill,
`rgba(0,0,0,0.55) 0 8px 24px -6px` shadow, `#3D4249` border. The widget kebab menu, dashboard
switcher, date-range selector and Actions dropdown all read as unmistakably above the cards. These
three AppBar panels are the only overlays that do not.

**Suggested fix:** `background: var(--surface-overlay)` and `box-shadow: var(--elevation-overlay)` on
all three selectors, dropping the `--ink` `color-mix()` shadows entirely — both aliases already
resolve per theme, so light mode is unchanged.

---

## Medium

### M-1 — Theme-toggle "selected" state is darker than its own track (inverted elevation)

**File:** `src/components/layout/AppBar.vue` ≈1313 — `.theme-segment :deep(.v-btn--active)`

```css
background: var(--surface-1);                                           /* #1F2226 */
box-shadow: 0 1px 3px color-mix(in oklch, var(--ink) 8%, transparent);  /* white glow */
```

Measured with the user menu open, dark mode:

| element | background |
|---|---|
| `.theme-segment` (track) | `rgb(39, 43, 48)` = `#272B30` |
| active button (`Dark theme`) | `rgb(31, 34, 38)` = `#1F2226` |

The selected pill is **darker** than the track containing it, with a white halo — it reads as
pressed/inset instead of the raised light pill the light theme draws. Still discriminable, so not
High, but it inverts the intended semantics on the one control most likely to be used while
evaluating dark mode.

**Suggested fix:** `background: var(--surface-overlay)` (or `--surface-raised`) plus
`box-shadow: var(--elevation-raised)`.

### M-2 — Settings sticky save bar paints the canvas token onto a surface-token background

**File:** `src/styles/settings-form.scss:244` — `.settings-save-bar`

```css
background: linear-gradient(180deg, transparent 0, rgb(var(--v-theme-background)) 24px);
```

In the studio shell the settings page lives inside `.mp-content-frame`, so the bar paints the
**canvas** colour on top of the **surface** colour:

| | dark | light |
|---|---|---|
| bar fill (`--v-theme-background`) | `rgb(23, 25, 28)` `#17191C` | `rgb(244, 246, 250)` `#F4F6FA` |
| host `.mp-content-frame` | `rgb(31, 34, 38)` `#1F2226` | `rgb(255, 255, 255)` `#FFFFFF` |

In light the 4/255 delta is imperceptible. In dark, at that end of the luminance range, it renders as
a clearly visible darker band that stops at the form column's width and lines up with nothing —
confirmed visually at `/accounts/2000290/settings`, 800×900, scrolled to the bottom. Structurally
pre-existing, but only *visible* in dark, so it is in scope.

**Suggested fix:** use `rgb(var(--v-theme-surface))` / `var(--surface-primary)` as the gradient stop
so the bar matches whatever surface hosts it. Fixing the shared rule covers all four consumers
(`AccountDefaultsPage`, `GeneralPage`, `NotificationsPage`, `ServicePage`).

---

## Low

### L-1 — Bulk-bar slot buttons are darker than the ink panel that contains them

`color="surface"` on the bulk-action buttons resolves to `#1F2226` inside a `#343A41` ink panel, so
the controls read recessed. Light mode is correct (white pills on the near-black `#1a1814` panel).
`src/views/Commerce/SalesOrders.vue:482-483` and the equivalent lines across the other
~20 `MpFloatingBulkBar` consumers. Legibility is fine (`#ececec` on `#1F2226`); hierarchy only.
Suggested fix: an `--ink-panel-*` control token, or `color="surface-bright"`.

### L-2 — Bulk bar shadow is a hard-coded light-mode blue tint

`src/components/MpFloatingBulkBar.vue:54` — `box-shadow: 0 8px 32px -12px rgba(11, 53, 88, 0.35)`.
A blue-tinted 35% shadow is effectively invisible over `#17191C`, so the panel loses its elevation
cue. Suggested fix: `box-shadow: var(--elevation-overlay)`.

### L-3 — Three warm values remain in the dark palette

A hue sweep of every colour token under `color.dark.*` in `src/design-tokens/tokens.json`
(hue 15-95°, saturation > 0.05) returns only the intentional warning family plus:

| token | value | hue |
|---|---|---|
| `color.dark.inkPanel.fg` | `#f7f5f2` | 36° |
| `color.dark.inkPanel.mutedFg` | `rgba(247,245,242,0.64)` | 36° |
| `color.dark.onSecondary` | `#1A1814` | 40° |

Perceptually negligible (a warm off-white and a warm near-black) but they are the last
non-semantic warm values left, and `inkPanel.fg` is actually rendered — it is the bulk bar's text
colour. Suggested fix: `#ECECEC` / `rgba(236,236,236,0.64)` / `#111316`.

### L-4 — `.v-overlay-container` resolves the light alias block while the app is dark

The dark aliases are scoped to `.v-theme--maropostDark` (applied to `.v-application`), not to
`:root[data-theme="dark"]` — `src/styles/mp-theme-aliases.css:117`. Verified in dark mode:

```
getComputedStyle('.v-application')       → --surface-1: #1F2226   --focus-ring: #2CC4FF
getComputedStyle('.v-overlay-container') → --surface-1: #ffffff   --focus-ring: #0073AB
```

No visible leak today: a scan of every ≥10×10 px element under `.v-overlay-container` with overlays
open found **0** elements resolving `--surface-1: #ffffff`, because Vuetify stamps the theme class
onto each overlay root. But rules written as
`:is(.v-application, .v-overlay-container, [class*='v-theme--']) …` — e.g. `settings-form.scss:14`,
which is where `.v-field--variant-outlined` gets its fill — are one un-themed teleported node away
from a light field on a dark panel. Suggested fix: mirror the dark alias block onto
`:root[data-theme="dark"]`, or at minimum onto `.v-overlay-container`.

### L-5 — `Start new chat` label is marginally under AA on the gradient's purple stop

`src/views/DaVinci/DaVinciCopilot.vue:120` — `--dv-on-accent` `#0B1530` at 12.5px over `--dv-grad`'s
`#8B5CF6` stop measures **4.31 : 1** (needs 4.5), rising to ~5:1 over the blue stop. Identical in
light mode, so not a dark-mode regression.

### L-6 — Chart tooltips are now pinned top-right in *both* themes

`src/components/dashboards/widgets/DashboardChartWidget.vue:266` sets `tooltip.fixed.enabled = true`.
This does fix the clipping (verified below), but the tooltip now permanently covers the legend and
the right-most data while hovering — in light mode too. That is a behaviour change to light mode
introduced by dark-mode work and deserves an explicit sign-off rather than passing silently. The
alternative already tried in `937844f` (keep follow-cursor, set `overflow: visible` on the
chart-widget card) was reverted during remediation.

### L-7 — Disabled pagination icon buttons at 2.18 : 1

Vuetify's default `--v-disabled-opacity` `0.26` applied to `#ececec` over `#1F2226`. Disabled
controls are exempt from WCAG contrast and this is unchanged Vuetify behaviour, but it is very faint
on dark; raising the dark theme's `--v-disabled-opacity` to ~0.38 would help.

---

## Verified correct — no finding

**Warm tint is gone.** The hue sweep across Dashboard, Dashboards list, Settings, Da Vinci AI,
Da Vinci copilot, Journey Builder, Sales Orders and Design System returned **only** intentional
warning-amber `#E1A04A` instances (the favourite star, the `On Hold` status chip, the journey
"1 Issue" chip, a palette dot). No brown or olive canvas, card, menu, border or text anywhere at any
width.

**Surface ladder matches the plan at runtime.** canvas `#17191C` → card `#1F2226` →
raised `#24272C` → overlay/menu `#32373E`; borders `#33373D` / `#3D4249` / `#4D535B`;
text `#ececec` / `#C2C7CD` / `#9BA3AC` / `#8A9199`; dark elevation tokens are black-based
(`0 8px 24px -6px rgba(0,0,0,0.55)` for overlay).

**Text legibility.** The AA sweep over all eight pages produced **zero** genuine failures. The only
flagged node is `.dv-hero__ask`, a `background-clip: text` gradient headline whose `color` is
`transparent` by design and which renders visibly. Worst real values: 11px muted section labels
4.70:1, the `Default` badge 5.36:1, secondary body 5.88:1, primary body 10.15:1.

**Overlay stacking and separation.** The widget three-dot menu, dashboard-title switcher, date-range
selector and Actions dropdown were each opened at 390 / 820 / 1440. All render **above** the
dashboard cards (`.v-overlay` z-index 2000) with fill `#32373E`, shadow
`rgba(0,0,0,0.55) 0 8px 24px -6px` and a `#3D4249` hairline — an unmistakable step off the
`#1F2226` card. Nothing clipped, nothing behind.

**Chart tooltip clipping is fixed.** Line widget: tooltip activates with real content
(`W12 / Direct $9k / … / Referral $3k`) at `left: 545.75px; top: 0` inside a 689px canvas → right
edge 820.75 vs canvas right edge 821, i.e. fully inside the card, screenshot-confirmed. Pie widget:
tooltip rect `352,1165,124×35` inside canvas `290,1145,746×225`; surface `#32373E`, text `#ececec`.

**Interactive states.** Sidebar nav hover and selected both show a visible lighter wash; table row
hover visible; widget-card hover visible; a real `Tab` traversal paints a bright cyan `#2CC4FF`
focus ring (`--focus-ring` inside `.v-application` correctly resolves to `#2CC4FF`, not the light
`#0073AB`); journey node selection shows a cyan border; status chips render 15%-alpha coloured
underlays at 4.81-5.92:1.

**AppSidebar / AppBar.** No hard-coded warm colours. All three sidebar variants
(`data-sidebar` = white / gray / dark) correctly collapse to `#1F2226` in dark. Every icon flagged
under 3:1 is either full-opacity `#ececec` / `#9BA3AC`, a deliberately hidden hover-reveal chevron
(`opacity: 0`), or a dark glyph on an accent-filled button — no accidental invisibility.

**WP-3 component fixes confirmed.** KPI icon chips carry per-cloud dark accents (green / purple /
cyan / indigo at 12% alpha with light glyphs); `MpSourceCloudChip` keeps per-cloud colours in dark;
`MpStatusChip` underlays are visible at 0.15 alpha; the Billing `Upgrade Plan` button is no longer
white-on-white and `.plan-banner` text (`#06212C`) sits at ~8:1 on the cyan stop;
`ModuleLandingPage` tiles show no light-only tints. Native `<input type="date">` inherits
`color-scheme: dark`, so the picker indicator stays visible.

**Light mode — no regression.**
`git diff f59df95..HEAD -- src/design-tokens/generated/variables.css` yields exactly **2** lines
matching `/light/i`, and both are `--mp-*-color-dark-surfaceLight`, a token in the *dark* namespace.
Zero light-token value changes. Visual spot-check of the Dashboard at 1200×1000 in light: white
cards on `#F9FAFB`, blue accents, green trend chips, light-green KPI icon chips, and the widget
kebab menu renders as a normal white elevated card — all exactly as an unchanged light theme should.
The light-mode `.user-menu-card` shadow was measured at `oklch(0.209825 … / 0.12)` (a real dark
shadow), confirming H-1 is dark-only.

**Builds.**
- `npx vite build` → **exit 0** (`✓ built in 11.01s`; only the pre-existing >500 kB chunk advisory).
- `npm run build-storybook` → **exit 0**.

---

## Summary table

| ID | Severity | Area | File |
|---|---|---|---|
| H-1 | High | AppBar overlay panels merge into the card beneath; white-glow shadow | `src/components/layout/AppBar.vue` (≈939 / ≈1012 / ≈1035) |
| M-1 | Medium | Theme-toggle selected state darker than its own track | `src/components/layout/AppBar.vue` (≈1313) |
| M-2 | Medium | Settings save bar paints the canvas token on a surface background | `src/styles/settings-form.scss:244` |
| L-1 | Low | Bulk-bar slot buttons darker than the ink panel | `src/views/Commerce/SalesOrders.vue:482-483` (+ ~20 consumers) |
| L-2 | Low | Bulk-bar shadow hard-coded to a light-mode blue tint | `src/components/MpFloatingBulkBar.vue:54` |
| L-3 | Low | Three warm values left in the dark palette | `src/design-tokens/tokens.json` |
| L-4 | Low | `.v-overlay-container` resolves the light alias block | `src/styles/mp-theme-aliases.css:117` |
| L-5 | Low | `Start new chat` 4.31:1 on the gradient's purple stop | `src/views/DaVinci/DaVinciCopilot.vue:120` |
| L-6 | Low | Pinned chart tooltip changes light-mode behaviour too | `src/components/dashboards/widgets/DashboardChartWidget.vue:266` |
| L-7 | Low | Disabled pagination icons at 2.18:1 | Vuetify dark `--v-disabled-opacity` |
