# Option A — Restrained Blue (`?chart=optionA`)

**Philosophy**: one blue, weighted by importance; everything secondary steps back
into neutrals. The baseline's temperament, systematized by a principal designer.

**Mood board** (refs.json → `informs: option-a`): shopify--analytics-grid--01,
shopify--analytics-dense--02, shopify--home-compare--03, vercel--analytics-area--01,
chatbase--minimal-area--01, mailchimp--accent-funnel--01, stripe--recovery-bars--02.

## How it must beat the baseline (not a recolor)

1. **A true muted-series slot.** The baseline fades to pale blues (#6FD1F5, #A9E3E0)
   that vanish on white; A gives low-priority series *neutral slate* ink that stays
   legible (research takeaway 2).
2. **Wider lightness spread with hue micro-steps** inside the blue family
   (navy → azure → sky) so 6-series adjacency actually resolves.
3. **One axis/grid/legend/tooltip policy** across every widget — the discipline is
   the design.

## Palette logic (draft anchors — validator-tuned in P4)

Slot order = adjacency order. Hue stays in the blue family (OKLCH h ≈ 230–255);
slots 5–6 are **designated muted-series slots** (slate/steel, chroma deliberately
below the categorical floor — a documented deviation: their job is de-emphasis,
and legend labels always accompany them).

| Slot | Role | Draft | Logic |
|---|---|---|---|
| s1 | lead | `#0E72B8` | azure 600 — stronger than baseline #13ACF0, ≥3:1 on white |
| s2 | second | `#7FC2E8` | pale sky — big L jump from s1 |
| s3 | third | `#1B3F7A` | navy — deep anchor |
| s4 | fourth | `#38A8DC` | cyan-azure — between s1 and s2 in L, hue-shifted |
| s5 | muted | `#5C6B7A` | slate — context series |
| s6 | muted-2 | `#AFC3D1` | steel — furthest background |

Semantic: comparison `#1B4F7A` (deep navy, dashed — see P12 note) · positive `#1B7A46` ·
negative `#C2402A` · warning `#B27B00` · neutral `#8A94A0` · selection = s1 ·
grid `rgba(26,24,20,0.07)` hairline solid.

## Treatment spec (ChartTreatment values)

```
stroke: { curve: smooth, width: 2, companionWidth: 1.75, companionDash: 0, gradientLine: false }
comparison: { color: #1B4F7A, dash: 0, fillOpacity: 0.10 }
area: { fill: gradient, opacityFrom: 0.14, opacityTo: 0.02 }        // quieter than baseline
bar: { radius: 2, single: 45%, grouped: 68%, fill: solid, floatingLabels: false }
grid: { show: true, dashArray: 0, xLines: false, yLines: true }
axes: { yLabelsOnTimeseries: true }                                  // ONE policy: y-labels on, everywhere
crosshair: { show: true, dash: 0 }
markers: { hoverSize: 4, lastPoint: false }
legend: { markerShape: square, markerSize: 8, hoverHighlight: true }
donut: { size: 62%, fill: solid, strokeWidth: 2, showDataLabels: false }  // values live in legend + tooltip
svg: { shade: flat } · kpiSpark: { fillOpacity: 0.12 } · effects: { dropShadow: false }
states: { hoverFilter: none, dimmedOpacity: 0.35 }
tooltip: minimal light — white, hairline border, radius 8 (baseline anatomy, tightened)
```

## Risks / open questions for P4

- s2/s4 adjacency (both light-mid blues) is the pair most likely to need re-stepping.
- Slots 5–6 chroma-floor deviation: keep documented; validator run covers s1–s4 as
  the chromatic set, s5–s6 checked for ΔE separation + contrast only.
- Donut with 6 slices in near-mono blues + slate is the hardest chart — check the
  specimen before sign-off; slice gaps (2px surface stroke) carry the separation.

---
**P4 note:** the draft anchors above were superseded by the validated palette in
`scripts/chart-exploration/option-palettes.mjs` — see `p4-validation.md` for the
final hexes and the archived gate output.

---
**P12 note (2026-08-07, stakeholder direction):** the previous-period series now takes a
**distinct hue** per option instead of a neutral gray. Rationale: gray read as
"disabled/no data" rather than as a second real series. The dash is retained, so the
grammar is now *hue = which period, dash = the past*. All four comparison colours were
re-validated against their lead colour (normal ΔE, protan/deutan CVD, contrast vs white).

---
**P16 note (2026-08-07, stakeholder direction):** the previous period is no longer a
dashed stroke. It is now a **thin solid line over a translucent wash of its own colour**
(shadcn area convention) so both periods can be compared as overlaid shapes.
`comparison.dash` is 0 for every option; `comparison.fillOpacity` carries each option's
own weight and fades to the same floor as the current period.

---
**P17 note (2026-08-07, stakeholder direction):** "do same for all options" — the
embossed gloss introduced for Option D now applies to **every** option. Bars carry a lit
top edge and a darkened base lip (`effects.gloss`), including the solid-fill options,
where gloss now outranks the flat return. This deliberately trades one differentiator
between the four directions for a consistent mark treatment.
