# Option B — Sophisticated Multi-Color (`?chart=optionB`)

**Philosophy**: color is meaning — one hue per data family, fixed assignment,
saturation held one notch down. Stripe/Linear editorial, never rainbow.

**Mood board**: stripe--overview--01, stripe--radar-legends--03,
customerio--multiseries--01, zendesk--stacked-area--01, peec--sources-lines--01,
gorgias--volume-trio--01, monarch--dark-tooltip--01, vercel--usage-sparkrows--02;
ANTI: mixpanel--rainbow--anti.

## Rules that keep it professional

1. **≤5 chromatic slots + 1 neutral.** The sixth series is always slate — a big
   multi-series chart ends in calm, not in a sixth loud hue.
2. **Desaturated one notch** from library defaults (OKLCH C ≈ 0.11–0.14, not 0.2).
3. **Fixed hue order** (the CVD-safety mechanism), seeded from the validated
   dataviz reference order (blue → orange → teal → violet → rose → neutral).
4. **Dark inverse tooltip** (Monarch) — the system's signature interaction move.

## Palette logic (draft anchors — validator-tuned in P4)

| Slot | Hue | Draft | Logic |
|---|---|---|---|
| s1 | blue | `#2E6FC2` | Maropost-adjacent lead, calmer than #1A56DB |
| s2 | terracotta | `#D4703A` | warm counterpoint, muted from #EB6834 |
| s3 | teal | `#1E9E7A` | cool green-teal, spaced from both neighbors |
| s4 | violet | `#6B5CC8` | echoes brand secondary #7E3AF2, muted |
| s5 | rose | `#C25E8E` | soft magenta, not pink-pastel |
| s6 | neutral | `#66727E` | slate — the "everything else" slot |

Semantic: comparison `#C2622E` (terracotta, dashed — see P12 note) · positive `#178A50` ·
negative `#C6403D` · warning `#B27B00` · neutral `#8A94A0` · grid dotted.

## Treatment spec

```
stroke: { curve: straight, width: 2, companionWidth: 2, companionDash: 0, gradientLine: false }
comparison: { color: #C2622E, dash: 0, fillOpacity: 0.08 }
area: { fill: solid, opacityFrom: 0.09, opacityTo: 0.09 }            // flat translucent panes
bar: { radius: 4, single: 45%, grouped: 68%, fill: solid, floatingLabels: false }
grid: { show: true, dashArray: 4, xLines: false, yLines: true }      // dotted — editorial texture
axes: { yLabelsOnTimeseries: true }
crosshair: { show: true, dash: 4 }
markers: { hoverSize: 5, lastPoint: false }
legend: { markerShape: circle, markerSize: 8, hoverHighlight: true }
donut: { size: 66%, fill: solid, strokeWidth: 2, showDataLabels: false }
svg: { shade: flat } · kpiSpark: { fillOpacity: 0.10 } · effects: { dropShadow: false }
states: { hoverFilter: none, dimmedOpacity: 0.25 }                   // strong dimming — color IS identity here
tooltip: DARK inverse — near-black surface, per-series dot rows, white values
```

## Risks / open questions for P4

- The classic CVD traps: s2 terracotta vs s3 teal (protan), s3 teal vs positive
  green semantic. Validator gates both; teal may need a lightness push.
- Straight-line curve on the 30-point revenue area may read jagged — check the
  specimen; fall back to `monotoneCubic` if so (still crisper than smooth).
- KPI sparklines: all four KPI cards use s1 — B's multi-hue identity shows in
  multi-series charts, not in the KPI row (color follows the entity, and each KPI
  card is a single-series surface — cycling hues across cards would be decoration).

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
