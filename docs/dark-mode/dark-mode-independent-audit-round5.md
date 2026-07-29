# Dark-mode independent audit — round 5 (post-remediation re-audit)

**Auditor:** independent model (Opus), separate from every implementer in this effort
**Date:** 2026-07-29
**Branch:** `feature/dark-mode-system` @ `5989eca`
**Baseline for the light-regression diff:** `f59df95` (last commit before the WP-1 dark token swap) —
**run live in a second dev server**, not read from the diff
**Supersedes:** round 4 (preserved as [`dark-mode-independent-audit-round4.md`](./dark-mode-independent-audit-round4.md)),
round 3 ([`…-round3.md`](./dark-mode-independent-audit-round3.md)), round 2 ([`…-round2.md`](./dark-mode-independent-audit-round2.md)),
round 1 ([`…-round1.md`](./dark-mode-independent-audit-round1.md)).

**Verdict: FAIL — 0 Blocker, 0 High, 2 Medium, 6 Low.**

The palette swap is sound, and both of the things this round was asked to re-check most sceptically
came back **genuinely fixed**, verified against a live pre-branch baseline rather than against the
implementer's own claims:

- Round-4's **High** (hard-coded `oklch()` activity tag colours) is fixed in *both* files that carried
  the duplicated map — `DashboardActivityWidget.vue` **and** `ModuleLandingPage.vue`. Measured
  1.38–1.74:1 on the baseline; 5.41–8.78:1 on HEAD. Zero hard-coded `oklch(0.x …)` literals remain
  anywhere in `src/`.
- Round-4's two **light-mode leaks** are both genuinely repaired. The AppBar menu shadows in light
  mode are now *byte-identical* to the baseline's computed values, and light-mode chart tooltips no
  longer clip at 1440.

What remains is one root cause with two measurable symptoms, both **Medium**, both in the chart
tooltip that has now been changed in four consecutive rounds:

1. the pinned tooltip **permanently hides the entire y-axis scale** of the Dashboard's largest chart —
   6 of 6 labels, at every width, **in both themes**. The baseline hid 0 of 6. This is a light-mode
   behaviour change on a dark-mode branch.
2. the tooltip is still **clipped at 390 px** (the required mobile width), which the remediation never
   tested — its own verification sweep covered 1100 / 1280 / 1440 only.

Everything else the sweep surfaced was traced to the baseline and is pre-existing, or is a probe
artifact. Those exclusions are listed explicitly below with their measurements, so the next round does
not re-litigate them.

---

## Method

Two Vite dev servers driven in a real browser side by side:

| | revision | port |
|---|---|---|
| HEAD | `5989eca` (`feature/dark-mode-system`) | 60774 |
| baseline | `f59df95` (pre-branch), `git worktree` + symlinked `node_modules` | 5199 |

Theme forced via `localStorage['app-theme-mode']` + reload, confirmed on every sweep by
`document.documentElement.dataset.theme` **and** the `v-theme--maropostLight/Dark` class on
`.v-application`. Every surface inspected at **390 / 820 / 1440** CSS px in both themes.

Findings rest on injected computed-style probes, not on eyeballing captures. Probe design:

- **Canvas-based colour resolver.** Every colour string is painted into a 1×1 context over black and
  over white and solved for premultiplied alpha, so `oklch()`, `oklab()` and `color-mix()` all resolve.
  `unresolved: []` on every page/width/theme confirms full coverage. (A naive `rgb()`/hex parser is
  what hid round 4's High finding for three rounds.)
- **Real composited backdrops.** Each element's backdrop is built by walking ancestors and folding in
  every `background-color` *and* real gradient stops (averaged), with each layer's `opacity` applied.
  Verified correct: `.v-application` carries the dark values (`--surface-1: #1F2226`) while `:root`
  still holds the light ones, and the walk stops at `.v-application`, so composites are right.
- **Positive control on every page.** Two synthetic elements with a known 1.17:1 text pair and a known
  warm swatch (`oklch(0.42 0.09 70)`) are injected and must both be caught before a page's zero-finding
  result is trusted. Both were caught.
- **Warm-tint sweep:** hue 15–100°, chroma > 0.07, lightness < 0.62 in OKLCH, over the *composited*
  `background-color`, all four border colours and `color`.
- **AA contrast:** over the composited backdrop with element `opacity` and colour alpha folded in,
  graded against the size/weight threshold (3:1 large, 4.5:1 otherwise).
- **Chart tooltips:** activated with a **real pointer** (`computer` hover, cross-checked against a
  synthetic-event sweep that produced identical geometry), then measured for (a) overflow past
  `.dashboard-chart-widget`'s clipping box, (b) count of y-axis labels covered, (c) count of legend
  series covered, (d) percentage of `.apexcharts-inner` covered — per widget, per width, per theme,
  on **both revisions**.

### Surfaces exercised (each in light and dark, at 390 / 820 / 1440)

Dashboard (`/dashboard`) incl. Live Activity tags and all 7 chart widgets · Dashboards list
(`/dashboards`) · Settings (`/settings/general`) incl. the dirty-state save bar · Da Vinci
(`/da-vinci`, `/da-vinci/copilot`, `/da-vinci/experience`) and the docked copilot drawer · Journey
Builder (`/journeys/1/builder`) · Contacts table (`/contacts`) with 3 rows selected and the floating
bulk bar up · Orders table (`/commerce/orders`) for `MpStatusChip` · AppBar user menu, account cascade
submenu, assistant menu, and the theme segmented control · `MpFormDrawer` (Add Contact).

### Builds

| command | result |
|---|---|
| `npx vite build` | **exit 0**, built in 10.73s |
| `npm run build-storybook` | **exit 0**, built in 16.60s |

Only pre-existing `chunkSizeWarningLimit` warnings in both. No errors, no new warnings.

---

## Findings

### M-1 · Medium — pinned chart tooltip permanently hides the y-axis scale, in both themes

**Where:** `src/components/dashboards/widgets/DashboardChartWidget.vue:258-269`

```js
fixed: { enabled: true, position: 'topLeft', offsetX: 4, offsetY: 0 },
```

`5989eca` made the tooltip unconditionally pinned to the top-left corner. On the default Dashboard's
`Revenue by channel` widget (6 series) the tooltip measures **144 × 235 px** and is pinned at local
`(4, 4)` inside a **689 × 287** widget. The y-axis label group occupies local `(17, 59) → (44, 252)` —
entirely inside the tooltip's footprint.

Measured, real pointer, `Revenue by channel`:

| revision / theme / width | y-axis labels covered | legend series covered | plot area covered |
|---|---|---|---|
| **baseline** light 1440 | **0 / 6** | 0 / 6 | 23 % (moves with cursor) |
| **baseline** light 390 | **0 / 6** | 6 / 6 (transient) | 48 % (moves with cursor) |
| HEAD dark 1440 | **6 / 6** | 0 / 6 | 13 % (fixed) |
| HEAD light 1440 | **6 / 6** | 0 / 6 | 17 % (fixed) |
| HEAD dark 390 | **6 / 6** | 3 / 6 | 42 % (fixed) |
| HEAD light 390 | **6 / 6** | 3 / 6 | 42 % (fixed) |

The other six widgets are affected less but not zero (1/7, 2/6, 2/6, 0/7, 0/7 at 1440; 2–4 of 6–7 at
390) — the baseline was **0 covered on every widget at every width**.

Two problems:

1. **Functional.** You cannot read the axis scale while reading a value. On the app's most-used page,
   hovering the largest chart blanks its own reference scale.
2. **Scope.** Light mode's tooltip went from follow-cursor to pinned. The branch's stated constraint is
   that light mode is untouched. The commit message justifies the light-mode change by asserting light
   mode "gets clipped by `.dashboard-chart-widget`'s `overflow: hidden`". That is **true at 390 px**
   (baseline clips 59.4 px) but **false at 1440** — measured baseline clipping at 1440 light is **0 on
   all seven widgets**. So light mode at desktop widths had no bug and was changed anyway.

Also note the commit's stated rationale — *"Pin to the top-left (the legend sits top-right) so the
tooltip doesn't cover the series legend"* — rests on a wrong premise: the legend is a **full-width
top band** (`(0, 8)`, `689 × 24`), not top-right. It happens to escape at 1440 only because the series
items are centred and start at x=264; at 390 they don't, and 3 of 6 get covered.

**Suggested fix:** stop tuning `fixed`. Either (a) keep the tooltip follow-cursor and enable `fixed`
only for the specific case it is needed — when the tooltip is taller than the widget's clipping box —
or (b) re-attempt the round-2 root-cause fix (`overflow: visible` on the chart widget) now paired with
a real solution to the stale-canvas bleed that caused `0c578cb` to revert it (force an ApexCharts
`updateOptions`/re-render on the observed parent resize instead of relying on clipping to hide the
stale canvas). If (a) is chosen, pin to `bottomRight` rather than `topLeft` — the y-axis and the
legend both live top-left / top-band.

---

### M-2 · Medium — tooltip content is still clipped at 390 px, in both themes; the required width was never tested

**Where:** same file; `.dashboard-chart-widget { overflow: hidden }` at line 299.

At 390 px the `Revenue by channel` widget is **310 × 231**, and the pinned tooltip is **144 × 235** —
taller than the box that clips it. Measured with row-level precision:

| revision / theme | clip overflow | last row |
|---|---|---|
| baseline light 390 | 59.4 px (top) | — |
| HEAD dark 390 | **7.7 px (bottom)** | `Referral: $3k` cut by 6.7 px |
| HEAD light 390 | **8.3 px (bottom)** | `Referral: $3k` cut by ~7 px |

HEAD is a genuine improvement over the baseline's 59.4 px, and light/dark are now symmetric — but text
is still visibly truncated at a width this audit brief explicitly requires. The remediation commit
discloses "8–13px on one widget" but attributes it to "an unusually short row" and reports its
verification sweep as **1100 / 1280 / 1440** only, so 390 was never checked and the residual was never
tied to mobile.

**Suggested fix:** covered by M-1's fix. Whichever route is taken, add 390 px to the verification
sweep — the same widget is the worst case at every width and it is the one that never gets measured.

---

### L-1 · Low — dark cascade menu: selected-account metadata at 4.09:1 (needs 4.5)

**Where:** AppBar account cascade (`.um-cascade-card` → `.um-item__sub`), dark only.

`Account #2000290` renders `--text-muted` `#9ba3ac` on the selected row's `#31424d` highlight at
**4.09:1** at 12 px / weight 400. Light mode passes. Marginal AA failure on secondary metadata; the
only genuine dark-only contrast failure found in the whole sweep.

**Suggested fix:** use `--text-secondary` (`#C2C7CD`) for `.um-item__sub` inside the selected cascade
row, or lighten the selected-row fill. Either clears 4.5:1.

---

### L-2 · Low — unscoped light-mode hue change: the "audience" activity tag went amber → cyan

**Where:** `DashboardActivityWidget.vue:11` and `ModuleLandingPage.vue:547-549`.

The tag map is not theme-scoped, so replacing the hard-coded literals changed light mode too:

| | baseline light | HEAD light |
|---|---|---|
| audience chip | `#f6f0df` / `#6f5000`, hue 90.8°, 6.53:1 | `#e1f2f6` / `#155e75`, hue 213.4°, 6.31:1 |
| order chip | `#e3f5eb` / `#006b2c`, 5.90:1 | `#e3f4e9` / `#166534`, 6.24:1 |
| automation chip | `#f3effb` / `#614092`, 6.98:1 | `#efe7fd` / `#5b21b6`, 7.49:1 |

Order and automation are effectively unchanged. The audience tag flipped from amber to cyan. Contrast
is fine either way — and cyan is arguably *more* correct because `--cloud-contacts-*` is the Contacts
cloud colour — but this is a visible light-mode palette change shipped on a dark-mode branch and
should be an explicit, recorded decision rather than a side effect.

---

### L-3 · Low — unscoped light-mode change: the Da Vinci widget chip lost its purple gradient

**Where:** `src/components/dashboards/DashboardWidgetCard.vue:309-323`.

```diff
-  background: linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(99, 102, 241, 0.18));
-  color: rgb(99, 79, 218);
+  background: var(--dv-accent-soft);
+  color: var(--dv-text-primary);
+  border: 1px solid var(--dv-border);
```

Light mode: was a purple gradient with `rgb(99,79,218)` text at 5.74:1; is now flat `#EBF2FE` with
`#15326A` at **11:1** plus a border. Strictly better on contrast, visually different, and unscoped.
Same class of issue as L-2 — record the decision.

---

### L-4 · Low — `MpFloatingBulkBar` elevation is a hard-coded light-theme navy in both themes

**Where:** `src/components/MpFloatingBulkBar.vue:54`

```css
box-shadow: 0 8px 32px -12px rgba(11, 53, 88, 0.35);
```

`rgba(11, 53, 88, …)` is the light-theme shadow colour. In dark mode the ink-panel measures `#343a41`
over the `#17191c` canvas — **1.53:1** fill separation — and a navy translucent shadow contributes
almost nothing, so the bar's elevation cue comes only from its `#3d4249` border. Contrast inside the
bar is fine (no text or icon failures).

**Not a regression** — byte-identical to `f59df95`. It is, however, the last non-tokenized elevation
the dark sweep found; `--elevation-overlay` already resolves to `0 8px 24px -6px rgba(0,0,0,0.55)` in
dark and `rgba(11,53,88,0.08)` in light.

---

### L-5 · Low — unscoped light-mode change to the settings save-bar gradient (an improvement, but unrecorded)

**Where:** `src/styles/settings-form.scss:244`

```diff
-  background: linear-gradient(180deg, transparent 0, rgb(var(--v-theme-background)) 24px);
+  background: linear-gradient(180deg, transparent 0, rgb(var(--v-theme-surface)) 24px);
```

Measured in light mode: the save bar's parent (`.settings-page`) is `#ffffff`; the new gradient ends at
`#ffffff` (seam ratio **1.000**), the baseline ended at `#f4f6fa` (seam ratio **1.082** — a visible
band). So this unscoped edit *fixed* a light-mode seam. Recorded only so it is not mistaken for a
regression in a later round.

---

### L-6 · Low — the underlying geometry constraint is still unresolved

`.dashboard-chart-widget` still carries `overflow: hidden`. Round 2 (`937844f`) set it to `visible` and
added `.dashboard-widget-card--chart { overflow: visible !important }` + a `.vgl-item:hover` z-index
escape hatch; round 1's remediation (`0c578cb`) reverted all of it for a legitimate reason — a stale
ApexCharts canvas painting across neighbouring widgets on parent resize. That reason still stands, and
none of the card-level `overflow: visible` rules survive today.

Consequence: every tooltip change since has been a workaround layered on an unfixed constraint, which
is why this one component has been edited in rounds 2, 3, 4 and 5. **Recommend tracking the
stale-canvas re-render as its own work item** rather than accepting another tooltip-positioning round.

---

## Verified genuinely fixed (independently measured, not taken on the commit's word)

| round-4 finding | status | evidence |
|---|---|---|
| **H-1** activity tag colours (`oklch` literals, warm olive chip, 1.5–1.9:1) | **FIXED** | Dashboard Live Activity dark: hues 169.8 / 216.5 / 231.9 / 285.6°, icon contrast **5.41 / 8.56 / 8.78 / 7.11:1**. Baseline dark for the same chips: **1.38 / 1.47 / 1.74:1** on `#494028`, `#3e363b`, `#2e3c2b`. `ModuleLandingPage` copies fixed too (4.80–8.56:1 dark, 6.31–8.05:1 light). `grep -rn "oklch(0\.[0-9]" src` excluding generated tokens → **0 hits**. |
| **M-1** AppBar menu shadow leaked into light | **FIXED** | HEAD light `.user-menu-card` computed shadow `oklch(0.209825 0.0082939 none / 0.12) 0 8px 32px, oklch(… / 0.06) 0 2px 8px`, border `rgb(226,232,240)` — **string-identical to the live baseline**. Same for `.assistant-menu-card` and `.um-cascade-card`. Theme-segment active pill: light `#ffffff` + `0 1px 3px oklch(…/0.08)` (identical to baseline); dark `#32373e` + `rgba(0,0,0,0.32) 0 1px 2px` from the `.v-theme--maropostDark`-scoped override. |
| **M-2** chart tooltip `fixed:true` leaked into light / then clipped light | **FIXED (for clipping)** | Light 1440: clip overflow **0 on all 7 widgets**. Light and dark now geometrically symmetric (same tooltip sizes, same positions ±23 px, same occlusion counts). Light 390 clipping reduced **59.4 px → 8.3 px**. The residual and the new occlusion side effect are M-1/M-2 above. |

Additional independent confirmations:

- **Token layer is clean.** Structural diff of `tokens.json` `f59df95..HEAD`: **0 light-scoped value
  changes**, 29 dark-scoped, and the only non-scoped additions are the new `zIndex` documentation
  entries. Dark palette measured in OKLCH: `--surface-1 #1F2226` (H 255.6°, C 0.009),
  `--surface-2 #272B30` (254.0°, 0.011), `--surface-overlay #32373E` (256.8°, 0.014),
  `--hairline #33373D` (258.4°, 0.012), `--border-default #3D4249` (256.8°, 0.014),
  `--border-strong #4D535B` (255.6°, 0.015), `--ink #ececec` (chroma **0.000**),
  `--text-secondary #C2C7CD` (0.010), `--muted #9BA3AC` (0.016). Baseline dark for comparison:
  `--surface-1 #2C2820` (H **84.5°**, C 0.015), `--muted #b3aa97` (**85.7°**), `--hairline #7E7B75`
  (**84.6°**). The warm cast is gone.
- **Zero non-semantic warm hits in dark** across every page and width. Zero unresolved colours anywhere.
- **Chart tooltip chrome in dark** reads at 11.26–11.91:1 on `#32373e` with a `#3d4249` border.
- **`MpStatusChip` dark** (Orders): the `.v-theme--maropostDark`-scoped underlay bump to `opacity: 0.15`
  is live; fills separate from the row at 1.28–1.34:1 and text on fill measures **4.81–5.92:1**.
- **Bulk bar dark** (3 Contacts rows selected): no low-contrast text, no invisible icons, no warm hits.
- **Journey Builder, Da Vinci experience, Dashboards list, Settings, Orders, Contacts** in dark at all
  three widths: **0 warm, 0 low-contrast, 0 invisible icons, 0 unresolved**. No horizontal page scroll
  at 390 on any page.

---

## Excluded — measured, explained, not findings

Listed so the next round does not re-report them.

| reported by the sweep | why it is not a finding |
|---|---|
| `.dv-hero__ask` at **1.00:1** (`#63acf6` on `#63acf6`, 34 px) | Gradient-clipped text: `background: var(--dv-hero-grad); background-clip: text; color: transparent` (`DvLandingHero.vue:66-74`). The glyphs are painted by the gradient; a computed-`color` probe cannot see them. Probe artifact. |
| `.dv-on-accent-icon` at **1.94–2.73:1** | The Da Vinci composer send button is `disabled` at rest with `opacity: 0.45` (`MpDaVinciBot.vue:1196`). Disabled controls are exempt from WCAG 1.4.11. |
| `.palette-item__add` at **2.86:1** dark | `rgba(var(--v-theme-on-surface), 0.35)` rest state that goes to `primary` on hover (`JourneyBuilder.vue:877-878`). Theme-agnostic, and **worse in light (2.22:1)** — measured identical on the baseline. Pre-existing, not a dark-mode issue. |
| Light-mode marginal AA: settings sidebar active `General` **4.40**, `.palette-count` **3.82**, `Unsubscribed` chip **4.01**, KPI trend pill **4.23**, Da Vinci body copy **4.41**, `MpFormDrawer` field labels **3.54** ×5 | All six reproduce **numerically identically on the live baseline at `f59df95`** (same fg/bg hexes, same ratios). None of the owning files appear in `git diff f59df95..HEAD`. Pre-existing light-mode debt, out of this branch's scope. |
| `.mp-form-drawer { z-index: 2005 }` removed by `f3ad635` | Confirmed dead. Vuetify sets `z-index: 1010` **inline** on the drawer (baseline inline style: `right: 0px; z-index: 1010; …`), which beats any scoped class rule. Computed z-index is 1010 on both revisions. No stacking change. |
| `.card-hover` block deleted from `global.scss` | Confirmed dead: `grep -rn "card-hover" src/ .storybook/` → **0 hits**. |
| `settings-form.scss` `color-mix(in oklch → in srgb)` | Measured delta **(0, 0, 0)** — `--surface-2` is achromatic in both themes (`#ececec` light, `#272B30` dark), so the two interpolation spaces agree. Both resolve to `#ededed` at α 0.549 in light. No visual change. |
| `BillingView` `color="white"` → `color="on-primary"` | Light `--v-theme-on-primary` is `255,255,255`. No-op; the CTA measures `#0073ab` on `#ffffff` at 5.20:1, 8.37:1 against the banner. |
| Theme segment active-pill fill separation **1.188** (dark) | Light measures **1.181** — essentially identical. Not a dark-mode defect; a pre-existing segmented-control design choice (state is also carried by the shadow and the border). |
| `PosPreview.vue` pinning `--cloud-retail-accent: #0d9488` | Deliberate, commented, dark-only effect on a fixed-look POS mock. |

---

## Recommendation

Fix **M-1** and **M-2** together — they are one root cause — and resist a fifth round of
`tooltip.fixed` tuning. The productive move is either a conditional pin (only when the tooltip cannot
fit the clipping box) pinned **away** from the y-axis and legend band, or finally solving the
stale-canvas re-render so `overflow: visible` becomes viable (L-6). Add **390 px** to whatever
verification sweep is run: it is the width where this widget fails, and it is the width no previous
round measured.

L-1 is a one-line token swap. L-2, L-3 and L-5 need a decision recorded, not code. L-4 and L-6 are
follow-ups that predate this branch.
