# Dark-mode independent audit — round 6 (post-remediation re-audit)

**Auditor:** independent model (Opus), separate from every implementer in this effort
**Date:** 2026-07-29
**Branch:** `feature/dark-mode-system` @ `740d09c`
**Baseline for the light-regression diff:** `f59df95` (last commit before the WP-1 dark token swap),
checked out into a **second git worktree and run as a second live dev server on `:5199`** — every
light-mode claim below is a live A/B measurement, not a read of the diff.
**Supersedes:** round 5 (preserved as [`dark-mode-independent-audit-round5.md`](./dark-mode-independent-audit-round5.md)),
round 4 ([`…-round4.md`](./dark-mode-independent-audit-round4.md)), round 3 ([`…-round3.md`](./dark-mode-independent-audit-round3.md)),
round 2 ([`…-round2.md`](./dark-mode-independent-audit-round2.md)), round 1 ([`…-round1.md`](./dark-mode-independent-audit-round1.md)).

**Verdict: FAIL — 0 Blocker, 0 High, 2 Medium, 4 Low.**

## Headline

**Both things this round was asked to re-check came back genuinely fixed, and this time I can say so
from a live baseline A/B rather than from the commit's own word.**

- **Charts / both themes.** At 1440 the chart-tooltip behaviour on HEAD is **string-identical** to the
  pre-branch baseline in light mode, and **byte-identical between light and dark on HEAD** (same widget
  sizes, same clip values, same occlusion counts, same plot-coverage percentages). The conditional pin
  never engages at 1440. Light mode is back to exactly what it was before the branch.
- **Charts / responsive (390 px).** Measured for the first time on both revisions. Clipping on the one
  widget that still pins improved from **59 px off the top of the tooltip** (baseline — the original
  bug, the tooltip title and first rows cut away) to **8–13 px off the bottom** on HEAD. **0 of 6
  y-axis labels covered** at every width in both themes (round 5 measured 6 of 6). No horizontal page
  scroll at 390 anywhere.

What I found instead is the **same shared-rule leak pattern that failed rounds 2, 3 and 4 — twice
more, in places nobody has looked yet.** Both are light-mode changes shipped by dark-mode
remediations that edited a rule shared between themes instead of scoping to `.v-theme--maropostDark`.
Neither was disclosed in any commit message as a light-mode change. Neither was caught by rounds 1–5.

`npx vite build` → **exit 0**. `npm run build-storybook` → **exit 0**.

---

## Findings

### M-1 · Medium — `settings-form.scss` placeholder `opacity: 1` changed **light** mode too

**File:** `src/styles/settings-form.scss:47-54`
**Introduced by:** `0c578cb` ("remediate independent audit round 1 findings")

```scss
:is(.v-application, .v-overlay-container, [class*='v-theme--']) .v-field--variant-outlined .v-field__input::placeholder {
  color: var(--text-muted);
  opacity: 1;          /* ← added, unscoped */
}
```

The commit's own comment states the reason: *"Vuetify's own ::placeholder rule sets opacity:
var(--v-disabled-opacity) (0.5 in the dark theme), which halves --text-muted's contrast below AA."*
That is a dark-mode problem. The rule is theme-shared, so light mode got the change as well — and in
light `--v-disabled-opacity` is **0.38**, not 0.5, so the stated rationale does not apply there at all.

**Measured live, same element, same page (`/settings/general`), light theme, 1440:**

| revision | `::placeholder` opacity | composited placeholder colour | contrast vs field fill `rgb(245,245,245)` |
|---|---|---|---|
| baseline `f59df95` | **0.38** | `rgb(186,190,196)` | **1.71 : 1** |
| HEAD `740d09c` | **1** | `rgb(90,101,115)` | **5.44 : 1** |

Placeholder text on every outlined field in the app — form drawers, settings forms, search fields —
is now roughly 3× more prominent in light mode than before the branch. It is *more* legible, so this
is not an accessibility regression; it is an **undisclosed, app-wide visual change to the default
theme**, and it weakens the placeholder-vs-entered-value distinction that the 0.38 alpha was
providing.

**Fix (either is acceptable, but the choice must be recorded):**
scope it — `.v-theme--maropostDark … ::placeholder { opacity: 1 }` — so light keeps `0.38`; **or**
keep it shared and record it in the plan as a deliberate light-mode change with the before/after
numbers above.

---

### M-2 · Medium — activity-tag category colours changed **hue in light mode** (2 components)

**Files:** `src/components/dashboards/widgets/DashboardActivityWidget.vue:8-13`,
`src/components/ModuleLandingPage.vue:539-556`
**Introduced by:** `9247ded` (widget) and `5989eca` (`ModuleLandingPage` copy)

Round 4 correctly flagged the hard-coded `oklch()` tag colours as a **dark**-mode defect (the
`audience` chip measured 1.47 : 1 on a warm `#3e363b`). The remediation replaced them with the
theme-aware `--cloud-{commerce,contacts,marketing}-{accent,text}` tokens. That fixes dark — and also
repaints the chips in light, because those tokens carry light values too.

**Measured live, Dashboard → "Live activity", light theme, 1440 (identical deltas on
`ModuleLandingPage` → "Recent activity"):**

| tag | baseline `f59df95` (light) | HEAD `740d09c` (light) | delta |
|---|---|---|---|
| `order` | bg `oklch(0.7 0.15 155 / .14)`, fg `oklch(0.45 0.15 155)` | bg `oklch(0.627 0.170 149.2 / .12)`, fg `rgb(22,101,52)` | ~6° — visually the same green |
| `audience` | bg `oklch(0.75 0.12 `**`90`**` / .18)`, fg `oklch(0.45 0.12 `**`90`**`)` — **olive / gold** | bg `oklch(0.609 0.111 `**`221.7`**` / .12)`, fg `rgb(21,94,117)` — **teal-blue** | **132° hue rotation** |
| `automation` | bg `oklch(0.7 0.13 300 / .14)`, fg `oklch(0.45 0.13 300)` | bg `oklch(0.541 0.247 293 / .12)`, fg `rgb(91,33,182)` | ~7° — visually the same violet |

The `audience` / "Segment updated" chip goes from gold to blue **in the default theme**, on the
Dashboard's most-viewed widget and on every `ModuleLandingPage`. Contrast is fine on both revisions
(no a11y regression); this is purely a design change to light mode that no commit message mentions.

Note the commit message for `9247ded` says *"Verified computed contrast >=6:1 in light"* — so light
mode **was** measured, but only for contrast. The hue change was not reported.

**Fix:** either keep the light values (dark-scope the token swap — keep the light `oklch()` literals
and add `.v-theme--maropostDark` overrides using the cloud tokens), or accept the change and record
it. Aligning the chip to its source-cloud colour is a defensible design call; it just should not be a
silent one.

---

### L-1 · Low — the pinned tooltip still clips ~8–13 px on the 6-series widget at ≤ 820

**File:** `src/components/dashboards/widgets/DashboardChartWidget.vue:88-105, 279-295`

The one widget where `tooltipNeedsPinning` engages ("Revenue by channel", 6 series) still overflows
its `overflow: hidden` box. Measured, both themes, identical values:

| width | widget | tooltip | HEAD clip | baseline clip | HEAD legend rows covered >50% | y-axis covered |
|---|---|---|---|---|---|---|
| 1440 | 689 × 287 | 144 × 235 | **0** (not pinned) | 0 | 0 / 6 | 0 / 6 |
| 820 | 722 × 231 | 144 × 235 | **13 px bottom** | **46 px top** | 2 / 6 | 0 / 6 |
| 390 | 310 × 231 | 144 × 235 | **8–13 px bottom** | **59 px top** | 4 / 6 | 0 / 6 |

Strictly better than baseline on every axis that matters (the clipped 8–13 px is the tail of the last
series row, not the title), and the y-axis is finally clear. But the tooltip still covers **67 % of the
plot area** at 390 (baseline 59 %) and 4 of 6 legend rows, because a 144 × 235 tooltip simply does not
fit a 310 × 231 box. This is the unfixed-constraint symptom, not a new defect — see L-4.

### L-2 · Low — the tooltip-height estimate under-predicts by ~3 px

**File:** `src/components/dashboards/widgets/DashboardChartWidget.vue:100`

```ts
const estimatedTooltipHeight = computed(() => 40 + props.data.series.length * 32)
```

Verified live: 2 series → estimate 104, real tooltip **103** (good); 6 series → estimate 232, real
tooltip **235** (3 px short). A widget whose measured height lands in the 3 px window between the two
would skip pinning while genuinely not fitting. The estimate also assumes one 32 px row per series, so
a long series name that wraps would under-predict further. Harmless today (the only 6-series widget
measures 227 / 231 / 287, all outside the window) but it is a latent off-by-a-few-pixels.

### L-3 · Low — Settings sidebar active item at 4.40 : 1 in light (pre-existing, still open)

`a.settings-sidebar__item.router-link-exact-active` "General": `rgb(0,115,171)` on `rgb(236,236,236)`
= **4.40 : 1** at 13.5 px, just under AA. **Reproduces numerically identically on the live baseline**
and the owning file is not in `git diff f59df95..HEAD`, so it is not this branch's regression —
carried forward from round 5, still unfixed.

Same category, same status (baseline-identical, out of this branch's scope): JourneyBuilder
`.mp-builder__chip` "Saved" **4.49 : 1**, `.palette-count` **3.82 : 1** ×4, `.palette-item__add` icon
**2.21 : 1** (light) / **2.89 : 1** (dark — i.e. worse in light), Contacts `Unsubscribed` chip
**4.01 : 1** ×3.

### L-4 · Low — `.dashboard-chart-widget { overflow: hidden }` is still the unfixed root cause

Confirmed live: the element still computes `overflow: hidden`, and none of round 2's
`overflow: visible` card overrides survive (they were reverted in `0c578cb` for a legitimate reason —
a stale ApexCharts canvas painting across neighbours on parent resize). Every tooltip change since has
been a workaround on top of that constraint, which is why this one component has now been edited in
rounds 2, 3, 4, 5 and 6. **Recommend tracking the stale-canvas re-render as its own work item** rather
than accepting a seventh round of tooltip-position tuning.

---

## Verified genuinely fixed (independently measured, not taken on the commit's word)

| prior finding | status | evidence |
|---|---|---|
| **round 4 H-1** — hard-coded `oklch()` activity tag colours, warm olive chip at 1.5–1.9 : 1 in dark | **FIXED** (dark) | Dashboard "Live activity", dark: chip icon contrast **5.41 / 11.37 / 11.02 / 8.65 : 1**; chip hues **151.7° / 211.5° / 293.6°** — all cool. `ModuleLandingPage` copies fixed too: **6.27 / 8.65 / 11.02 : 1**, hues 211 / 230 / 293. `grep -rn "oklch(0\." src` excluding `design-tokens/generated` → **0 hits**. Visually confirmed at 390 dark: the audience/person glyph is cyan and clearly legible. *(The light-mode side-effect of this fix is M-2.)* |
| **round 4 M-1** — AppBar menu shadow leaked into light | **FIXED, and structurally safe** | The whole `f59df95..HEAD` AppBar diff is **four additive `.v-theme--maropostDark`-scoped blocks** — no shared rule is touched, so light cannot be affected by construction. Confirmed live: HEAD-light `.user-menu-card` / `.assistant-menu-card` = bg `rgb(255,255,255)`, border `rgb(226,232,240) 1px`, shadow `oklch(0.209825 0.0082939 none / 0.12) 0 8px 32px, oklch(… / 0.06) 0 2px 8px`, text 17.73 : 1, 360×795 — **string-identical to the live baseline**. Theme-segment active pill light `#ffffff` + `oklch(…/0.08) 0 1px 3px` (identical to baseline); dark `#32373e` + `rgba(0,0,0,0.32) 0 1px 2px`. Dark menus: `#32373E` + `rgba(0,0,0,0.55) 0 8px 24px -6px` — a real elevation step. |
| **round 4 M-2 / round 5 M-1 + M-2** — chart tooltip `fixed` leaking / permanently covering the y-axis | **FIXED** | 1440 light HEAD is **string-identical** to 1440 light baseline across all 7 widgets. 1440 dark HEAD is **byte-identical to 1440 light HEAD**. 820 light == 820 dark. 390 light ≈ 390 dark (8 vs 13 px). **0 / 6–7 y-axis labels covered at every width in both themes.** No theme branch remains in the code — `fixed` is driven only by measured geometry. Residual = L-1 / L-2. |
| **round 5 note** — `.settings-save-bar` gradient stop `--v-theme-background` → `--v-theme-surface` | **benign light-mode change, re-confirmed** | HEAD-light: gradient ends `rgb(255,255,255)`, actual host `.mp-content-frame` background `rgb(255,255,255)` → seam ratio **1.000**. Baseline ended at `rgb(244,246,250)` over the same white host → a visible band. This unscoped edit *improves* light mode. Recorded so it is not re-reported as a regression. |

Additional independent confirmations:

- **Token layer is clean.** Structural JSON diff of `tokens.json` `f59df95..HEAD` (flattened by
  `$value`, bucketed by path): **29 changed values, all 29 dark-scoped; 0 light-scoped; 0 removed**;
  the only additions are the 8 `zIndex` documentation entries. All eight `--mp-zIndex-*` custom
  properties resolve live (`0 / 1 / 100 / 1005 / 1010 / 2000 / 2400 / 10000`), so the z-index literal →
  token migration is a genuine no-op.
- **`settings-form.scss` `color-mix(in oklch → in srgb)` is a no-op in light.** Rendered both mixes to
  a canvas: `#ececec` at 55 % over white = `rgb(245,245,245)` in **both** spaces; at 72 % =
  `rgb(241,241,241)` in both. (In dark the same test shows the oklch mix drifting magenta —
  `rgb(40,37,40)` vs `rgb(35,39,43)` — so the change fixed a dark cast without touching light.)
- **`BillingView` `color="white"` → `color="on-primary"` is a no-op in light**: light
  `--v-theme-on-primary` = `255,255,255`.
- **`DashboardPieWidget` stroke change is a no-op in light**: baseline's
  `stroke="rgb(var(--v-theme-surface))"` presentation attribute *does* resolve (presentation
  attributes are CSS declarations) — computed stroke is `rgb(255,255,255)` on both revisions. Its
  `fillSeriesColor: false` is also a no-op in light (the baseline pie tooltip series-group already had
  no series fill).
- **`DaVinciAI.vue` refactor preserves light exactly**: the three feature-card gradients moved from
  inline `:style` to `.dv-feature-media--*` classes with **byte-identical values**; every dark variant
  is `.v-theme--maropostDark`-scoped. Dark hero / feature / play surfaces verified legible on screen.
- **Full six-page sweep, dark, at 1440 / 820 / 390** (Dashboard, Dashboards list, Settings/General,
  Da Vinci, Journey Builder, Contacts): **0 text-contrast failures, 0 invisible icons beyond the
  pre-existing `palette-item__add`, 0 unresolved `var(--…)` in any computed colour, 0 horizontal page
  scroll.** Every warm-hue hit in dark is the semantic `--warning` amber `rgb(225,160,74)` (light:
  `rgb(168,99,15)`) on favourite stars, `text-warning` buttons, the Journey Builder "1 issue" chip and
  a contact-score dot — theme-aware by design, present on the baseline.
- **Full six-page sweep, light, at 1440 / 820 / 390**: the finding list is **item-for-item and
  ratio-for-ratio identical to the same sweep on the live baseline**. No light-mode regression on any
  of those six pages.
- **Bulk bar, dark, Contacts with rows selected**: `#343A41` panel, text **10.56 : 1**, hue 212,
  `z-index: 100` (= `--mp-zIndex-bulkActionBar`), no low-contrast text, no invisible icons, no warm
  hits. `MpStatusChip` dark (Contacts): "Subscribed" text on fill **6.88 : 1**, plain chips **9.39 : 1**.
- **Storybook**: `npm run build-storybook` exits 0; the pinned dark stories from round 3 are present
  (20+ `export const Dark*` stories across `Mp*`, `AppBar`, `AppSidebar`, copilot voice).

---

## Excluded — measured, explained, not findings

Listed so round 7 does not re-report them.

| reported by the sweep | why it is not a finding |
|---|---|
| `.dv-hero__ask` at **1.00 : 1** in both themes | Gradient-clipped text. Verified live: `background-image: linear-gradient(90deg, #a78bfa, #60a5fa, #22d3ee)`, `background-clip: text`, `color: rgba(0,0,0,0)`. The glyphs are painted by the gradient; a computed-`color` probe cannot see them. Probe artifact. |
| `rgb(225,160,74)` warm hits in dark (favourite star, `text-warning` buttons, "1 issue" chip, contact-score dot, `.palette-dot`) | The semantic `--warning` amber. Theme-aware (light `rgb(168,99,15)`), present on the baseline, intentionally warm. |
| `.palette-item__add` at **2.89 : 1** dark | `rgba(var(--v-theme-on-surface), 0.35)` rest state that goes to `primary` on hover. **Worse in light (2.21 : 1)**, identical on the baseline. Pre-existing, theme-agnostic. |
| Light marginal-AA set (settings sidebar 4.40, `.palette-count` 3.82, `Unsubscribed` 4.01, `.mp-builder__chip` 4.49) | Reproduce **numerically identically on the live baseline**; owning files absent from `git diff f59df95..HEAD`. Pre-existing light debt — recorded as L-3, not a branch regression. |
| Dashboard grid columns not restoring after a 390 → 1440 resize without a reload | Reproduced on the **baseline** as well (vue-grid-layout responsive breakpoints). Not theme-related. All width measurements above were taken after a reload at the target width for this reason. |
| `.dashboard-widget-card__davinci-chip` restyled (violet gradient → `--dv-accent-soft` + `--dv-border`) | A light-mode appearance change in principle, but the chip only renders when `widget.aiProvenance` is set (Da Vinci-authored widgets) and no seeded dashboard has one, so it is unobservable in the app today. Worth a line in the plan, not a finding. |
| `PosPreview.vue` pinning `--cloud-retail-accent: #0d9488` | Deliberate, commented, dark-only effect on a fixed-look POS mock. |
| `.mp-form-drawer { z-index: 2005 }` / `.card-hover` block removals | Confirmed dead in round 5; `grep -rn "card-hover" src/ .storybook/` → 0 hits; Vuetify sets the drawer's `z-index: 1010` **inline**, which beats any scoped class rule. |

---

## Recommendation

The chart work is done — **do not open `DashboardChartWidget.vue` again for tooltip positioning.**
L-1 and L-2 are the residue of L-4, and the productive move is to fix the stale-canvas re-render so
`overflow: visible` becomes viable, as a separate work item.

M-1 and M-2 are the same bug for the sixth time: **a dark-mode fix written into a rule that both
themes read.** Before the next remediation, add a mechanical gate rather than another manual pass —
for every file in `git diff f59df95..HEAD`, diff the *light*-theme computed styles of the touched
selectors against the baseline dev server and require the diff to be empty or explicitly signed off.
Rounds 2, 3, 4 and now 6 would all have been caught by that one check, and none of the five previous
manual audits caught M-1 at all.

Method note for round 7: run the baseline as a live second server (`git worktree add --detach <dir>
f59df95`, symlink `node_modules`, `npx vite --port 5199`). Every claim in this document that says
"identical to baseline" is a same-selector, same-page, same-width A/B measurement against that
server. Reading the diff is not a substitute — M-1 is one added line that looks innocuous in a diff
and measures 1.71 : 1 → 5.44 : 1 live.
