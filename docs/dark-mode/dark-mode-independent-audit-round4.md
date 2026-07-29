# Dark-mode independent audit — round 4 (post-remediation re-audit)

**Auditor:** independent model (Opus), separate from the implementer
**Date:** 2026-07-29
**Branch:** `feature/dark-mode-system` @ `b46425c`
**Baseline for the light-regression diff:** `f59df95` (last commit before the WP-1 token swap)
**Supersedes:** round 3 (preserved as [`dark-mode-independent-audit-round3.md`](./dark-mode-independent-audit-round3.md)),
round 2 ([`…-round2.md`](./dark-mode-independent-audit-round2.md)), round 1 ([`…-round1.md`](./dark-mode-independent-audit-round1.md)).

**Verdict: FAIL — 1 High, 2 Medium, 7 Low.**

The palette swap is sound and the original *warm/muddy* complaint is essentially gone. Round 3's
three findings (H-1 AppBar overlay merge, M-1 theme-toggle inversion, M-2 settings save bar) are all
genuinely fixed — verified by measurement, not by reading the diff. Two new problems dominate this
round:

1. one widget on the **main Dashboard** still hard-codes light-only `oklch()` colours, producing an
   olive-brown chip with a near-invisible glyph — both halves of the original bug report, on the exact
   page the bug report screenshotted;
2. the round-3 AppBar fix and the round-2 tooltip fix both changed **shared, theme-agnostic rules**,
   so they regressed **light mode** — which the brief requires to be untouched.

---

## Method

Live app (Vite dev server, *Main App* launch config) driven in a real browser. Dark mode forced via
`localStorage['app-theme-mode'] = 'dark'`, confirmed by `document.documentElement.dataset.theme` and
the `v-theme--maropostDark` class on `.v-application`. Every surface inspected at **390 / 820 /
1440** CSS px, then spot-checked in light.

Screenshots were paired with injected computed-style probes so no finding rests on eyeballing a
downscaled capture. Two methodological corrections were made to the probe during this round, both of
which changed the results — worth recording because earlier rounds may have been affected:

- **`oklch()` / `color-mix()` were being silently skipped.** A naive `rgb()`/hex parser returns
  `null` for the modern colour syntaxes this codebase uses heavily, so those declarations were
  dropped from the sweep entirely. Replaced with a **canvas-based resolver** (paint the colour into
  a 1×1 context over both black and white, solve for the premultiplied alpha) which resolves every
  colour space the browser understands. `unresolved: []` on every page confirms full coverage. **This
  is what exposed the High finding** — it had been invisible to the earlier parser.
- **Gradient backdrops produced false positives.** Substituting a synthetic mid-grey for any
  `background-image` inflated several contrast failures (e.g. `.um-header__email` reported at 2.96:1;
  its real gradient is `#233138`→`#20282C` and the true ratio is **5.25–5.87:1**). Replaced with
  real gradient-stop extraction and averaging. Off-canvas drawers (`x ≥ innerWidth`) are now excluded
  too — the parked Da Vinci panel and widget-library drawer were polluting results.

Sweeps run per page/width: warm-tint hue sweep (hue 15–100°, sat > 0.07, lightness < 0.62 over
`background-color`, all four border colours and `color`, composited); AA contrast over the
*composited* backdrop with element `opacity` and colour alpha folded in, graded against the
size/weight threshold; icon visibility (< 3:1, with genuinely hidden hover-reveal elements
separated out); overlay geometry (panel fill/shadow/border vs the fill of every `.v-card` /
`.mp-content-frame` it geometrically overlaps, plus internal two-tone detection); chart tooltips
activated with a **real pointer** and their rects compared against the chart-widget bounds.

> Note on one artifact: synthetic `MouseEvent` dispatch onto ApexCharts legend nodes threw
> `Utils.escapeString` errors and left one tab blank. That was **self-inflicted by the probe**, not
> an app defect — a clean reload rendered normally. It is not reported as a finding.

### Surfaces exercised (dark unless noted)

| Surface | Route | Widths |
|---|---|---|
| Main Dashboard — KPI, chart, pie, activity + setup widgets | `/accounts/2000290/dashboard` | 390 / 820 / 1440 |
| …widget kebab, dashboard-title switcher, date-range selector, Actions, Add widget | ″ | 390 / 820 / 1440 |
| Dashboards list — data table, pagination | `/accounts/2000290/dashboards` | 1440 |
| Settings → Account Defaults — form fields, selects, sticky save bar | `/accounts/2000290/settings` | 1440 |
| Da Vinci AI landing — hero, token meter, feature cards | `/accounts/2000290/da-vinci` | 1440 |
| Da Vinci copilot drawer — thread, suggestion chips, composer | `/accounts/2000290/dashboards` | 1440 |
| Journey Builder canvas — nodes, step palette, inspector | `/accounts/2000290/journeys/1/builder` | 1440 |
| Sales Orders — status chips, filter tabs, floating bulk bar | `/commerce/2000290/orders` | 1440 |
| AppBar overlays — user menu, theme segment | any | 1440 |
| **Light-mode** spot-check — Dashboard, user menu, Settings save bar | `/dashboard`, `/settings` | 1440 |

---

## Blocker

None. Nothing is unreadable or unusable.

---

## High

### H-1 — `DashboardActivityWidget` tag chips keep light-only `oklch()` colours: olive-brown chip + invisible glyph on the main Dashboard

**File:** `src/components/dashboards/widgets/DashboardActivityWidget.vue:8-13`

```ts
const tagColors: Record<string, { bg: string; color: string }> = {
  email:      { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },          // ✅ tokenised
  order:      { bg: 'color-mix(in oklch, oklch(0.7 0.15 155) 14%, transparent)', color: 'oklch(0.45 0.15 155)' },
  audience:   { bg: 'color-mix(in oklch, oklch(0.75 0.12 90) 18%, transparent)', color: 'oklch(0.45 0.12 90)' },
  automation: { bg: 'color-mix(in oklch, oklch(0.7 0.13 300) 14%, transparent)', color: 'oklch(0.45 0.13 300)' },
}
```

Only `email` uses semantic tokens. The other three hard-code `oklch(0.45 …)` foregrounds — an
L = 0.45 mid-tone chosen to sit on a **white** card. In dark mode they land on a 14–18 % tint over
`#1F2226`. Measured on `/accounts/2000290/dashboard` (Live activity widget), identical at 390 / 820 /
1440:

| row (tag) | chip bg over card | hue / sat | glyph colour | **glyph contrast** |
|---|---|---|---|---|
| Campaign sent (`email`) | `#202F37` | 201° / 0.26 | `#00ADF1` | 4.9 : 1 ✅ |
| Order placed (`order`) | `#223730` | 160° / 0.24 | `#006B2C` | **1.89 : 1** |
| Segment updated (`audience`) | **`#3E3A2D`** | **46° / 0.16** | **`#6F5000`** | **1.51 : 1** |
| Automation triggered (`automation`) | `#323140` | 244° / 0.13 | `#614092` | **1.60 : 1** |

Two distinct defects, both matching the original report:

1. **Invisible icons.** Three of the four glyph colours sit at **1.51–1.89 : 1** against their own
   chip. A 14 px glyph at 1.5 : 1 is not legible.
2. **Warm tint remaining.** The `audience` chip is the only non-token warm surface left that is
   actually rendered: fill `#3E3A2D` at hue **46°** and glyph `#6F5000` at hue **43°** — a literal
   olive-brown swatch. The hue sweep flags `oklch(0.45 0.12 90)` at saturation **1.00**. This is
   visible in the screenshot as a warm square among otherwise cool-neutral chips, on the exact page
   the bug-report screenshots came from.

**Suggested fix:** replace the three hard-coded entries with the same semantic-token pattern `email`
already uses — a per-accent `--accent-*-soft` / `--accent-*-ink` pair that resolves per theme (the
KPI icon chips fixed in WP-3 already have exactly this machinery for green / purple / cyan / indigo).

---

## Medium

### M-1 — Light-mode elevation regression: the round-3 AppBar fix weakened light shadows by ~4×

**File:** `src/components/layout/AppBar.vue:944`, `:1015`, `:1036` (panels) and `:1308` (theme segment)

Round 3's H-1/M-1 remediation was correct for dark but changed a rule that is **shared by both
themes**:

```css
/* before (b46425c^) */
box-shadow: 0 8px 32px color-mix(in oklch, var(--ink) 12%, transparent),
            0 2px 8px  color-mix(in oklch, var(--ink) 6%, transparent);
/* after */
box-shadow: var(--elevation-overlay);
```

In dark this is a clear improvement (`--elevation-overlay` → `0 8px 24px -6px rgba(0,0,0,0.55)`,
verified below). In **light** it is a downgrade, because `--elevation-overlay` → `--mp-shadow-md`:

| | light shadow | alpha | blur | spread |
|---|---|---|---|---|
| before | `oklch(0.209825…/0.12) 0 8px 32px`, plus a second `…/0.06 0 2px 8px` layer | 12 % (+6 %) | 32 px | 0 |
| **after** | `rgba(11,53,88,0.08) 0 2px 16px -8px` | **8 %** | **16 px** | **−8 px** |

Alpha down a third, blur halved, and a **−8 px spread that shrinks the shadow inward** — the net
visible ambient shadow is roughly a quarter as prominent, and the two-layer depth cue is gone.

That matters because in light these panels have **no fill step at all**. Measured with the user menu
open at 1440×900, light:

| | value |
|---|---|
| `.user-menu-card` background | `rgb(255,255,255)` (`--surface-overlay` = `--surface-1` = `#ffffff` in light) |
| overlapping `.mp-content-frame` | `rgb(255,255,255)` — overlap **360 × 787 px**, `sameFill: true` |
| overlapping `.v-card` ×2 | `rgb(255,255,255)` — overlaps **305 × 230**, **324 × 370**, `sameFill: true` |
| remaining separation | 1 px `#E2E8F0` border + the now-weakened shadow |

This is structurally the *same* defect round 3 filed as H-1 for dark — a floating panel with zero
luminance step over the surface beneath it — now transplanted into light mode. `.theme-segment
:deep(.v-btn--active)` took the same hit (`0 1px 3px rgba(ink,8%)` → `0 1px 2px rgba(11,53,88,0.04)`,
alpha halved).

**Suggested fix:** keep the alias indirection but make the light value carry real weight — either
give `--elevation-overlay` a stronger light definition in `mp-theme-aliases.css` (light overlays need
more alpha than light *cards* do, so reusing `--mp-shadow-md` is the wrong token), or add a dedicated
`--elevation-menu` pair: light ≈ the previous two-layer 12 %/32 px stack, dark = the existing
black-based `0 8px 24px -6px rgba(0,0,0,0.55)`.

### M-2 — Chart tooltips are pinned top-right in *both* themes; light mode lost cursor-following

**File:** `src/components/dashboards/widgets/DashboardChartWidget.vue:266`

```ts
fixed: { enabled: true },
```

`git log -S` confirms this was introduced in `a47741c` (round-2 remediation) to cure a *dark-mode*
clipping symptom, and `git show f59df95:…` confirms that before the dark-mode work the `tooltip`
block had no `fixed` key — tooltips followed the cursor. The setting is unconditional, so it changes
light-mode behaviour too.

It does fix the clipping. Measured with a **real pointer** hover near the right edge of *Revenue by
channel*, dark, 1440×900:

| | value |
|---|---|
| tooltip | `apexcharts-tooltip apexcharts-theme-dark apexcharts-active`, `opacity: 1` |
| content | `W12 / Direct $9k / Email $8k / Paid Search $7k / Social $6k / Organic $6k / …` |
| tooltip rect | `678, 317, 143 × 235` |
| `.dashboard-chart-widget` rect | `132, 313, 689 × 287` |
| inset from card edges | right **0 px**, bottom **48 px**, top **4 px**, left 546 px → **not clipped** ✅ |
| surface / text | `#32373E` / `#ECECEC` ✅ |

But a 143 × 235 px panel pinned to the top-right of a 689 × 287 px plot covers **~82 % of the chart
height** and the entire right-hand region including the legend, for the whole duration of the hover,
in light mode as well as dark. Sitting flush at right inset 0 also leaves no margin before
`overflow: hidden`.

This is a behaviour regression in the theme the brief requires to be unchanged, and it degrades the
fix's own surface. The alternative tried in `937844f` (keep follow-cursor, let the tooltip escape via
`overflow: visible` on the chart-widget card) was reverted during remediation.

**Suggested fix:** revert to follow-cursor and solve the clipping by geometry rather than pinning —
Apex's `fixed.offsetX/offsetY` clamping, or restore the `overflow: visible` approach scoped to the
chart widget so the tooltip may leave the card. Failing that, gate `fixed` behind an explicit product
decision and document that light mode changed.

---

## Low

### L-1 — `.v-overlay-container` resolves the *light* alias block while the app is dark (now load-bearing)

`src/styles/mp-theme-aliases.css:116-117` scopes the dark aliases to `.v-theme--maropostDark`, which
Vuetify puts on `.v-application` and on each overlay *content* root — but not on the container.
Verified in dark:

```
getComputedStyle('.v-overlay-container') →
  --surface-1: #ffffff   --surface-overlay: #ffffff   --ink: #1a1814   --focus-ring: #0073AB
```

A scan of every ≥ 10 × 10 px element under `.v-overlay-container` with overlays open found **0**
elements resolving the light values, so there is no visible leak today. The stakes rose this round,
though: after M-1's change the AppBar's three panels take their **fill** from `--surface-overlay`, so
any overlay content Vuetify does not stamp would render a **white panel in dark mode**. Suggested
fix: mirror the dark alias block onto `:root[data-theme="dark"]`, or at minimum onto
`.v-overlay-container`.

### L-2 — Bulk-bar shadow is a hard-coded light-mode blue tint

`src/components/MpFloatingBulkBar.vue:54` — `box-shadow: 0 8px 32px -12px rgba(11, 53, 88, 0.35)`.
Measured live on `/commerce/2000290/orders`; a blue-tinted shadow is effectively invisible over
`#17191C`, so the panel loses its elevation cue. Suggested fix: `var(--elevation-overlay)`.
*(Carried from round 3 L-2, unaddressed.)*

### L-3 — Bulk-bar action buttons are darker than the ink panel containing them

Measured: panel `#343A41`, slot buttons `#1F2226` — the controls read *recessed* (luminance step
1.39 the wrong way). Text legibility is fine (`Mark Fulfilled` 13.52 : 1, `Cancel Orders` 6.14 : 1);
hierarchy only. `src/views/Commerce/SalesOrders.vue:482-483` and ~20 other `MpFloatingBulkBar`
consumers. Suggested fix: an `--ink-panel-*` control token. *(Round 3 L-1, unaddressed.)*

### L-4 — Three warm values remain in the dark palette

`src/design-tokens/tokens.json` — `color.dark.inkPanel.fg` `#f7f5f2` (hue 36°),
`color.dark.inkPanel.mutedFg` `rgba(247,245,242,0.64)`, `color.dark.onSecondary` `#1A1814` (hue 40°).
Perceptually negligible (a warm off-white and a warm near-black) but `inkPanel.fg` **is** rendered —
confirmed live as the bulk bar's text colour at 10.56 : 1. Suggested fix: `#ECECEC` /
`rgba(236,236,236,0.64)` / `#111316`. *(Round 3 L-3, unaddressed.)*

### L-5 — Disabled controls very faint on dark

Vuetify's `--v-disabled-opacity` `0.26` over `#ECECEC` yields disabled pagination icons at
**2.18 : 1** (`#545759` on `#1F2226`) and the user-menu `Reset` label at **2.08 : 1**. Disabled
controls are WCAG-exempt and this is stock Vuetify behaviour, but raising the dark theme's
`--v-disabled-opacity` to ~0.38 would help. *(Round 3 L-7.)*

### L-6 — Journey Builder step-palette `+` affordance at 2.86 : 1

`src/views/Marketing/JourneyBuilder.vue:877` — `.palette-item__add { color: rgba(var(--v-theme-on-surface), 0.35) }`
measures `#66686B` on `#1F2226` = **2.86 : 1**, just under 3 : 1. Theme-aware and deliberately
low-emphasis (line 878 promotes it to `--v-theme-primary` on hover), so this is polish, not a bug.

### L-7 — AppBar panel border is indistinguishable from its own fill

`.user-menu-card` renders fill `#32373E` with border `#33373D` (`--hairline`) — one luminance level
apart, so the border contributes nothing. Vuetify's own menus use `#3D4249` (`--border-strong`) and
read crisper. Cosmetic inconsistency only; the fill step and shadow already do the separating.

---

## Verified correct — no finding

**Round 3's findings are genuinely fixed.** Measured, not assumed:

| round 3 | status | evidence (dark, 1440) |
|---|---|---|
| H-1 AppBar panels merge into cards | **fixed** | `.user-menu-card` fill `#32373E` (not `#1F2226`), shadow `rgba(0,0,0,0.55) 0 8px 24px -6px` (no white glow), separation from `.mp-content-frame`/`.v-card` **1.33 : 1** |
| M-1 theme toggle inverted | **fixed** | active pill `#32373E` vs track `#272B30` — pill now *lighter*, shadow `rgba(0,0,0,0.32) 0 1px 2px` |
| M-2 settings save bar painted canvas on surface | **fixed** | gradient stop `rgb(31,34,38)` == host `.mp-content-frame` `#1F2226`; in light `rgb(255,255,255)` == host `#FFFFFF`, so the old faint grey band is gone in *both* themes |

**Surface ladder matches the plan at runtime.** canvas `#17191C` → card `#1F2226` → raised `#24272C`
→ overlay/menu `#32373E`; borders `#33373D` / `#3D4249` / `#4D535B`; text `#ECECEC` / `#C2C7CD` /
`#9BA3AC` / `#8A9199`; dark elevations black-based; `--focus-ring` `#2CC4FF`.

**Overlay stacking and separation — all five Dashboard overlays correct.** Opened individually and
together at 390 / 820 / 1440. Every one renders **above** the cards with a real fill step and a
black-based shadow; none merges, none is clipped, none is behind:

| overlay | z-index | fill | shadow | border | separation vs card |
|---|---|---|---|---|---|
| widget kebab | 2000 | `#32373E` | `rgba(0,0,0,0.55) 0 8px 24px -6px` | `#3D4249` | 1.33 : 1 |
| user menu | 2010 | `#32373E` | ″ | `#33373D` | 1.33 : 1 |
| dashboard-title switcher | 2020 | `#32373E` | ″ | `#3D4249` | 1.33 : 1 |
| date-range selector | 2030 | `#32373E` (+ `#363B42` presets rail, 1.06) | ″ | `#3D4249` | 1.33 : 1 |
| Actions | 2040 | `#32373E` | ″ | `#3D4249` | 1.33 : 1 |

Internal two-tone detection found nothing but the date menu's intentional presets rail. An earlier
suspicion that the switcher's `v-list` painted `#1F2226` inside a `#32373E` panel was a **probe
artifact** (transparent element falling back to the probe's base colour); direct traversal confirms
the card is uniform `#32373E` and the list is `bg-transparent`.

**Text legibility.** Across Dashboard (390/820/1440), Dashboards list, Settings, Da Vinci landing,
Da Vinci copilot, Journey Builder and Sales Orders the AA sweep returns **zero genuine failures**.
The only flagged nodes are `.dv-hero__ask` (a `background-clip: text` gradient headline whose `color`
is `transparent` by design — renders visibly) and two disabled labels (L-5). Settings and Da Vinci
landing return `0 / 0 / 0` for warm / text / icon.

**Icons.** Every icon under 3 : 1 is accounted for: the H-1 activity chips, disabled controls (L-5),
the deliberate palette `+` (L-6), or genuinely hidden hover-reveal chevrons (`opacity: 0`, 17–29 per
page depending on width). No accidental invisibility in the AppBar or sidebar.

**Interactive states.** Sidebar hover `#272B30` (Δ 1.121, hue 213°) and selected `#213A47`
(Δ 1.339, hue 201°) are both visible and cool — and identical for **all three** `data-sidebar`
variants (`dark` / `white` / `gray`) plus none, confirming the warm `rgba(26,24,20,0.06)` in
`sidebar-white.css` / `sidebar-gray.css` never reaches dark mode. Table-row hover is
`rgba(var(--v-theme-on-surface), 0.02)` → `#23262A` on `#1F2226` (Δ 1.051): a deliberate
"whisper-quiet wash" (`global.scss:480`) that is theme-aware and actually has *higher* Weber contrast
on dark (13 %) than on light (2 %) — not a finding.

**Warm tint is gone** everywhere else. The hue sweep across all eight surfaces at all three widths
returns only intentional warning-amber `#E1A04A` (favourite star, `On Hold` chip, journey "1 Issue"
button) — plus the H-1 chip. No brown or olive canvas, card, menu, border or text.

**Light mode — tokens untouched.**
`git diff f59df95..HEAD -- src/design-tokens/generated/variables.css` changes **150** lines; every one
is either in the `-dark-` namespace or a newly-added `--mp-zIndex-*` token. The single line matching
`/light/i` is `--mp-rgb-color-dark-surfaceLight`, a token in the *dark* namespace. **Zero light-token
value changes.** The light Dashboard sweep's flags (warm `rgb(26,24,20)` = the light theme's
long-standing warm near-black ink; a `+326.4%` trend pill at 4.23 : 1; a search icon at 2.56 : 1) are
therefore all pre-existing light-mode characteristics, not regressions. The light regressions in this
report (M-1, M-2) come from changed **CSS rules and chart options**, not from tokens.

**Builds.** `npx vite build` → **exit 0** (`✓ built in 13.80s`). `npm run build-storybook` →
**exit 0** (`✓ built in 19.57s`). Both emit only the pre-existing >500 kB chunk advisory.

---

## Summary table

| ID | Severity | Area | File |
|---|---|---|---|
| H-1 | High | Activity-widget tag chips: light-only `oklch()` → olive-brown chip + glyphs at 1.51–1.89 : 1 | `src/components/dashboards/widgets/DashboardActivityWidget.vue:8-13` |
| M-1 | Medium | Light-mode elevation regression on AppBar panels + theme segment (~4× weaker shadow, zero fill step) | `src/components/layout/AppBar.vue:944,1015,1036,1308` |
| M-2 | Medium | Chart tooltip pinned top-right in both themes; light lost cursor-following | `src/components/dashboards/widgets/DashboardChartWidget.vue:266` |
| L-1 | Low | `.v-overlay-container` resolves the light alias block while dark (now load-bearing) | `src/styles/mp-theme-aliases.css:116-117` |
| L-2 | Low | Bulk-bar shadow hard-coded to a light-mode blue tint | `src/components/MpFloatingBulkBar.vue:54` |
| L-3 | Low | Bulk-bar buttons darker than their ink panel | `src/views/Commerce/SalesOrders.vue:482-483` (+ ~20 consumers) |
| L-4 | Low | Three warm values left in the dark palette (`inkPanel.fg` is rendered) | `src/design-tokens/tokens.json` |
| L-5 | Low | Disabled controls at 2.08–2.18 : 1 on dark | Vuetify dark `--v-disabled-opacity` |
| L-6 | Low | Journey palette `+` at 2.86 : 1 at rest | `src/views/Marketing/JourneyBuilder.vue:877` |
| L-7 | Low | AppBar panel border indistinguishable from its own fill | `src/components/layout/AppBar.vue` |

**Gate:** fails on 1 High + 2 Medium. H-1 is a straightforward tokenisation fix. M-1 and M-2 share a
root cause worth calling out for the remediation pass: **both were dark-mode fixes applied to rules
that are not theme-scoped.** Any further remediation should check the light rendering of every rule
it touches, not just the dark one.
