# Chart Exploration — Working Context

> Persistent state for the chart visual-system exploration (leadership review).
> **Read this before starting any phase. Update the Phase status table and the
> relevant sections at the end of every phase.** Newest notes on top within sections.

## Phase status

| # | Phase (master brief) | Status | Commit | Summary (1 line) |
|---|----------------------|--------|--------|------------------|
| 0 | Baseline & audit | ✅ done | 22d323b | Branch, context, capture harness, 9 baseline shots, audit (notes/00-audit.md) |
| 1 | Deep visual research | ✅ done | (P1 commit) | 25 refs (Mobbin, 11 queries) + 8 pattern takeaways + 4 direction seeds |
| 2 | Four mood boards / directions | ✅ done | (P2 commit) | copy.json + notes/option-{a..d}.md: palette logic, treatment specs, mood-board refs |
| 3 | Fable design review gate | ✅ done | (P2 commit) | All four pass differentiation/philosophy checks; risk list handed to P4 validator |
| 4 | Color systems + validator | ✅ done | (P4 commit) | All 4 palettes pass hard gates after 5 tuning rounds; QA record in notes/p4-validation.md; hex source = scripts/chart-exploration/option-palettes.mjs |
| 5 | Implementation (Opus) | ✅ done | eafa177…7f356bc | Treatment system + 4 themes + CSS skins + library widgets + /chart-exploration; token freeze DEFERRED to post-polish |
| 6 | Interactions | ✅ done | (verified live) | Tooltip skins ×4, crosshair/markers, legend dim (B 0.25) + deselect (0.45), comparison, pos/neg diverging all verified |
| 7 | Screenshots + Figma prep | ✅ done | a344532 + (this) | 55-shot one-session library, deck/index.html, Figma file olj3jdXnCXlKUTcS2di7LD pages 00–06 (webp→PNG refill lesson in figma-file.md) |
| 8 | Executive comparison | ✅ done | (same) | Page 06 + deck §06: 4 folds, same-chart row, specimen grid, choose cards — verified via get_screenshot |
| 9 | Fable final critique | ✅ done | (P10 commit) | Verdicts below; 3 fixes ordered (D donut shadow, specimen floating labels, vsToday copy) |
| 10 | Opus polish | ✅ done | f186c9e + ae59f65 | 3 critique fixes + token freeze (32/32 round-trip, validator green, baseline DOM-verified) |
| 11 | Final Fable review + handoff | ✅ done | (this commit) | All 7 brief questions answered YES; see below |

Statuses: ☐ pending · ◐ in progress · ✅ done · ⚠ blocked (say why in Remaining tasks)

## Objective

Give Maropost leadership (Ross, CEO — very high design bar) 4 genuinely distinct,
production-credible **chart visual systems applied to the exact same dashboard**, so
they can choose a data-visualization language in under a minute. NOT a dashboard
redesign: only the visualization layer (series colors, fills, gradients, strokes,
grid, axes, legends, tooltips, hover/selected/comparison/pos-neg states) differs.

Continues SCOP-312: round-2 flat multi-color rejected ("random colors… too flat"),
round-3 gradient themes landed (indigo/ocean/aurora), round-4/5 chrome overhaul
rejected wholesale. Current default = `shopify` flat-blue (Polaris grammar, Maropost hues).

## Constraints (do not relitigate)

- Layout / widgets / positions / sizes / metrics / data / IA / nav / cards / hierarchy: **unchanged**.
- No-param dashboard (`shopify` default) stays **byte-identical** — it IS baseline "00 — Current".
- Existing palettes (blue/indigo/ocean/aurora) + `/chart-themes` keep working.
- No round-4/5 resurrection (canvas token, borderless cards, showcase widgets).
- Branch `feature/chart-exploration` only; merge to master/prod is the user's post-review call.
- Light mode only (user decision 2026-08-07): dark theme entries = copies of light
  series/axis/treatment with DARK_CHROME kept; dark tuning is explicit follow-up.
- Autonomous end-to-end run (user decision); Figma deliverable = **new file** (user decision);
  Design Kit `RyWEOafKLPhvZCltyQicOm` is never written to.
- npm, not pnpm. Global CSS only via `src/styles/app-styles.ts` manifest.
- Leave untracked `Maropost dashboard redesign.zip` alone. Never touch KPI dark-mode
  identity bug (`DashboardKpiWidget.vue:48`) or `#ffffff` marker stroke — documented follow-ups.
- Full plan: `~/.claude/plans/master-task-maropost-dashboard-happy-corbato.md`

## Current dashboard structure (capture targets)

`/accounts/2000290/dashboard` (the `/` redirect) → `src/views/DashboardView.vue`,
"Overview" seed (`buildHomeWidgets`, `src/stores/useDashboards.ts:221-239`):

| Widget | metricId | Viz | Tech |
|---|---|---|---|
| Revenue / Orders / AOV / Open Rate | commerce_revenue, commerce_orders, commerce_aov, marketing_open_rate | KPI + sparkline | hand-rolled SVG |
| Revenue over time | commerce_revenue_over_time | area, 2 series (dashed `isComparison`) | ApexCharts |
| Deliverability | marketing_deliverability_score | 270° ring gauge | SVG (DtGauge) |
| Revenue by channel | demo_channel_trend | line, 6 series + Trend/Compare toggle | ApexCharts |
| Traffic mix | demo_channel_mix | donut, 6 slices | ApexCharts |
| Email volume | marketing_email_volume | grouped bar, 2×8 | ApexCharts |
| Contacts by domain | contacts_by_domain | ring donut, 5 segments + custom legend | SVG (DtRingDonut) |
| Top campaigns / Recent orders | marketing_top_campaigns, commerce_recent_orders | tables | v-table (NOT themed) |
| Live activity | marketing_live_activity | feed | CSS (NOT themed) |

Specimen mapping: line=demo_channel_trend · bar=marketing_email_volume ·
area=commerce_revenue_over_time · donut=demo_channel_mix.
Data: all positive; only Revenue-over-time has a comparison series. Data derives from
Date.now() at day granularity → captures happen in one session (midnight guard).

Theme system: `src/plugins/chartPalette.ts` (`CHART_THEMES`, `?chart=` in `App.vue:74`,
`CHART_PALETTE_OVERRIDE` + `PaletteScope.vue` for per-panel pinning). Full audit:
`docs/chart-exploration/notes/00-audit.md`.

## Research findings

Full notes: `docs/chart-exploration/research/research-notes.md` (8 takeaways). Keys:
1. Previous-period = same hue, reduced weight/dash (settled convention — keep, restyle only).
2. De-emphasis uses **neutrals**, not paler brand tints → every option carries a muted-series token.
3. Multi-color: ≤5 hue-spaced desaturated slots + 1 neutral, fixed assignment (Mixpanel rainbow = anti).
4. Gradients read premium only when they encode: vertical fade-to-transparent + thin solid stroke, one family per chart (GitBook/beehiiv = cautions).
5. Tooltip families: minimal-light (Vercel) vs dark-inverse (Monarch) — dark tooltip is the cheapest "designed" signal → B/D differentiator.
6. Crosshair + hover-revealed marker is modern; per-point markers read dated.
7. Donut: strong center total + value-bearing legend; ring thickness consistency > slice count.
8. Axis restraint must be *consistent across the page* — baseline's per-widget axis policy is the tell.

## References

25 downloaded refs in `docs/chart-exploration/research/refs/` mapped in `refs.json`
(product, pattern, source URL, informs-option). Anti-refs included: Mixpanel rainbow,
beehiiv pastel wash. Heritage (non-downloadable): Hyper Charts kit (round-3 gradient
direction Ross liked), Polaris Viz (baseline grammar).

## Options being explored

Full specs: `docs/chart-exploration/notes/option-{a..d}.md` + `copy.json` (leadership copy).

- **Option A — Restrained Blue**: mono-blue + designated neutral slots (s5/s6 slate/steel,
  documented chroma-floor deviation), flat marks, solid hairline grid, square legends,
  minimal light tooltip, unified y-axis policy. Must read as "baseline, systematized".
- **Option B — Sophisticated Multi-Color**: 5 muted spaced hues (blue/terracotta/teal/
  violet/rose) + slate 6th, straight strokes, dotted grid, circle legends, DARK tooltip,
  neutral-gray comparison, dimming 0.25. Anti-Tailwind-default via terracotta/rose.
- **Option C — Blue·Teal·Green family**: hue span 250→160 with alternating lightness,
  soft gradient area wash (0.28→0.02), tint-gradient bars, last-point dot, reserved
  deeper positive-green distinct from series greens.
- **Option D — Modern Gradient**: blue→violet (brand primary+secondary justified),
  fade-to-transparent areas under solid strokes, axis-ramp gradient bars + rounded caps
  + floating labels (≤8 cats), gradient donut, deep dark tooltip, 1px-blur shadow max.
  Guardrail list in notes; floating labels are the first fallback to drop.

### P3 review verdict (2026-08-07)
Pass. Four genuinely distinct systems (hue strategy / fill philosophy / grid texture /
tooltip family / legend anatomy all differ). Named risks → P4 validator: A s2/s4
adjacency; B terracotta-teal CVD + teal-vs-positive; C green/teal CVD pairs (make-or-
break) + cyan/azure pair; D blue-axis adjacency. A-vs-baseline visible difference and
D decoration-smell re-checked on real screenshots at P9.

## Color tokens

Naming: `color.chart.{light,dark}.{optionA..D}.{series1..6, axis1..5, comparison,
positive, negative, warning, neutral, grid, hover, selection, mutedSeries,
gradientStart, gradientEnd, tooltip*}` + `component.chart.{option}.{...opacities}`
in `src/design-tokens/tokens.json` → `npm run tokens:build`. Iterate inline in
`chartPalette.ts` first; freeze to tokens as P5's final commit.
Validator: `node scripts/chart-exploration/validate-palettes.mjs` (P4).

## Design decisions

- 2026-08-07 (P5/P6) — Commits: eafa177 (treatment type + themes + plumbing), d256e71
  (Chart/Pie widgets), 4ff3211 (SVG family), 263d36f (CSS skins/dimming — dimming
  re-points Apex's own child selectors via --mp-chart-dim-opacity to avoid opacity
  multiplication), dee2673 (library widgets), cc86928 (/chart-exploration view +
  data-widget-metric attr), 7f356bc (diverging bars outrank axis-gradient).
  Type-check gate = "no NEW errors" (12 pre-existing in ReelFlyView.vue, present on
  master). Token freeze into tokens.json DEFERRED until after P9/P10 polish so hexes
  freeze exactly once. Baseline parity verified at DOM level (no-param → shopify
  strokes/fills byte-exact) + tooltip CSS uses var(--mp-tip-*, <current literal>)
  fallbacks. D's grouped bars use tint-gradient (a single axis ramp can't express
  two grouped series); axis-gradient shows on single/distributed bars.
- 2026-08-07 (P4) — Validated final palettes live in `scripts/chart-exploration/option-palettes.mjs`
  (P5 copies to chartPalette.ts; token freeze later). Gate policies: muted slate slots
  exempt from chroma/band only; positive-vs-series ΔE 8–15 = WARN legal via icon+label
  pairing; light-slot sub-3:1 contrast = relief via legends/tooltips (dataviz method).

- 2026-08-07 — Light-only palettes; dark = type-satisfying copies with DARK_CHROME (user).
- 2026-08-07 — Autonomous end-to-end; new Figma file (user).
- 2026-08-07 — Additive `ChartTreatment` on `ChartTheme`; legacy themes leave it
  undefined → verbatim legacy code paths (baseline safety over refactor cleanliness).
- 2026-08-07 — Per-theme tooltip/legend CSS via `[data-chart]` scopes + CSS-variable
  indirection (`var(--mp-tip-*, <current literal>)`); do NOT consolidate duplicated
  scoped tooltip blocks (specificity/injection-order risk to baseline).
- 2026-08-07 — Option A must be *systematized restraint* (unified legend/tooltip/grid
  discipline), not a recolor of the baseline — otherwise it's not a real choice.

## P9 — Principal-designer critique (2026-08-07)

Evidence: full capture library + Figma pages + live interaction pass.
- **Visual quality**: B/C/D presentation-grade; A deliberately conservative but clean. PASS.
- **Differentiation**: B/C/D unmistakable at every size. **A vs baseline is too subtle at
  the fold** (its discipline shows in the 6-series line, donut, comparison gray) → fix:
  per-option "What changed vs today" line so the comparison is honest and legible. PASS w/ fix.
- **Data clarity**: all four legible; D's grouped-bar floating labels COLLIDE ONLY in the
  small specimen cells (fine at real widget size) → fix at the specimen-view level.
- **Scalability**: treatments cover every widget incl. library widgets; palettes
  validator-gated (CVD + normal floors); light-slot relief documented. PASS.
- **Maropost fit**: A/C anchored on brand blues; D justified by brand primary+secondary
  violet; B is the deliberate hue-outlier (that's its job). PASS.
- **Executive readiness**: 06 (Figma + deck) reads in <1 min. PASS after fixes.
- **AI smell test**: two tells found — D donut's drop-shadow halo (sticker-like; shadow
  was designed for strokes, not filled rings) and D's specimen-cell label collisions.
  A donut at full size verified GOOD (pale steel slice carried by gaps + legend).

**P10 fix list**: 1) remove treatment dropShadow from DashboardPieWidget (donuts never
shadow); 2) specimen grid disables floatingLabels in small cells (view-level theme clone);
3) copy.json `vsToday` per option → deck + Figma option pages; 4) recapture affected
shots, rebuild deck, swap Figma hashes.

## Rejected ideas

- Refactoring `gradientMarks`/`flatMarks` booleans into treatments for ALL themes —
  cleaner but risks silent baseline drift; deferred to post-review follow-up.
- Consolidating the 3 duplicated `.mp-chart-tip` scoped CSS blocks — same reason.
- New charting library (Unovis etc. from round-5 notes) — ApexCharts + hand-rolled SVG
  already render everything; a library swap is not a visualization-language decision.

## Implementation notes (gotchas)

- ApexCharts 5.10 honors `window.Apex` global defaults → `addInitScript` with
  `{ chart: { animations: { enabled: false } } }` kills entrance animations (verified in dist).
- `DashboardChartWidget` gates first paint on `requestIdleCallback` + skeleton →
  settle = fonts.ready + no `.v-skeleton-loader` + ≥4 `.apexcharts-canvas`.
- Copilot drawer is non-persistent (fresh context = closed).
- Figma: images >4096px on long side get downsampled → dsf-1 variant for full-page shots.
  Mandatory skills before tools: `figma:figma-create-new-file`, `figma:figma-use`.
- Playwright is a plain dependency (`import { chromium } from 'playwright'`); the
  `@playwright/test` path in the repo is dead.
- Dev server: launch.json "Main App" → :5173 (autoPort — capture script asserts reachability).

## P11 — Final review verdict (2026-08-07)

The brief's seven questions, answered against evidence:
1. **Presentation-ready?** YES — verified at widget/fold/specimen scale + live interactions.
2. **Meaningfully different?** YES — hue strategy, fill philosophy, grid, tooltip family and
   legend anatomy all differ; the specimen grid proves it at a glance; A-vs-baseline made
   honest via "What changed vs today" lines.
3. **Credible references?** YES — 25 cited refs incl. anti-references + round-3 heritage.
4. **Embarrassing/unfinished?** NO — D halo + specimen collisions fixed; dark mode is a
   documented provisional (user decision), not an accident.
5. **Objective comparison?** YES — baseline byte-identical (DOM-verified after every
   commit incl. token freeze), one-session captures, identical specimen fixtures.
6. **Technically achievable?** YES — already running in this codebase on ApexCharts +
   the token pipeline; ApexCharts has a Vue 2 binding for the production app.
7. **Enough quality to choose?** YES — each option ships philosophy, references,
   validated accessibility, trade-offs, and honest deltas.

## Deliverables (final)

- **Figma**: https://www.figma.com/design/olj3jdXnCXlKUTcS2di7LD (pages Cover, 00–06)
- **Live (PROD — shareable)**: https://ai-first-maropost.vercel.app
  - Baseline: `/accounts/2000290/dashboard`
  - Options: `/accounts/2000290/dashboard?chart=optionA|optionB|optionC|optionD`
  - Side-by-side compare: `/chart-exploration`
- **Deck**: `docs/chart-exploration/deck/index.html` (self-contained, local)
- **Merged to master** 2026-08-07 (ff-only, 17 commits, `2bc211c..b590aa4`, pushed to
  origin → Vercel prod). `feature/chart-exploration` kept as a reference branch.
- Tokens frozen in `tokens.json` (`color.chart.{light,dark}.option*`)
- Deploy note: Vercel's `buildCommand` runs `npx vite build` (NOT `npm run build`), so the
  12 pre-existing `ReelFlyView.vue` type errors don't block prod. `npx vite build` verified
  green before the push.

## Remaining tasks (follow-ups, post-direction-selection)

- [ ] Tune dark-mode palettes + tooltip skins for the winning option (dark entries are
      provisional light copies; treatment.posNeg/comparison read light tokens — split per
      mode when tuning)
- [ ] Fix `DashboardKpiWidget.vue:48` dark-mode array-identity bug (one-liner, separate PR)
- [ ] Merge `feature/chart-exploration` → master + push (user's call; prod alias gives
      shareable stakeholder links)
- [ ] If Option D wins: revisit floating labels on grouped bars at narrow widget sizes
