# Option D — Modern Gradient / Progressive (`?chart=optionD`)

**Philosophy**: data with presence — depth and light, never noise. Every gradient
encodes something (a fade = area under the line; a ramp = magnitude). Matures the
round-3 gradient direction leadership already responded to: light-mode-first,
saturation capped, zero neon.

**Mood board**: posh--dark-gradient-area--01, later--soft-gradient-light--01,
vercel--analytics-area--01 (crosshair grammar), monarch--dark-tooltip--01,
basedash--dark-ring--01, Hyper Charts heritage (SCOP-312);
CAUTIONS: gitbook--gradient-area--01 (saturation ceiling), beehiiv--pastel-gauges--anti.

## Guardrails (the anti-"AI dashboard" list)

1. Gradients are **vertical fade-to-transparent** under a thin **solid** stroke —
   the data edge stays crisp; the fill reads as light, not paint.
2. Bar gradients run through the **axis ramp** (deep at base → bright at cap),
   rounded caps, floating value labels only when ≤8 categories.
3. **One gradient family per chart.** Multi-series line charts get solid strokes
   from the series palette — gradient strokes are reserved for single-series.
4. Saturation cap: OKLCH C ≤ 0.19; glow limited to a 1px-blur drop shadow on the
   lead stroke only. Grid stays. Labels stay quiet.
5. Blue → violet is brand-justified (Maropost primary #1A56DB, secondary #7E3AF2) —
   this is Maropost's own gradient, not a template's.

## Palette logic (draft anchors — validator-tuned in P4)

| Slot | Hue | Draft | Logic |
|---|---|---|---|
| s1 | electric blue | `#2563EB` | lead — brand primary family |
| s2 | violet | `#7A5AF8` | brand secondary family |
| s3 | cyan | `#0EA5E9` | bright cool step |
| s4 | indigo | `#4338CA` | deep anchor |
| s5 | orchid | `#A855D8` | light violet-magenta |
| s6 | slate | `#64748B` | neutral tail |

Gradient axis (deep → bright, drives bar/donut/line-gradient marks):
`#312E81 → #4338CA → #4F6BE8 → #38A7F8 → #7DD3FC`

Semantic: comparison `#C264C9` (orchid, dashed — see P12 note) · positive `#178A50` · negative
`#C6403D` · warning `#B27B00` · neutral `#8A94A0` · gradient-start/end +
area-fill-opacity tokenized (the brief's gradient token set).

## Treatment spec

```
stroke: { curve: smooth, width: 2.5, companionWidth: 2, companionDash: 0, gradientLine: true }
comparison: { color: #C264C9, dash: 0, fillOpacity: 0.18 }
area: { fill: gradient, opacityFrom: 0.35, opacityTo: 0 }            // the signature fade
bar: { radius: 8, single: 45%, grouped: 66%, fill: axis-gradient, floatingLabels: true }
grid: { show: true, dashArray: 0, xLines: false, yLines: true, color: fainter }
axes: { yLabelsOnTimeseries: true }
crosshair: { show: true, dash: 0 }
markers: { hoverSize: 6, lastPoint: true }
legend: { markerShape: circle, markerSize: 8, hoverHighlight: true }
donut: { size: 64%, fill: gradient, strokeWidth: 2, showDataLabels: false }
svg: { shade: tint }                                                  // gauge/ring keep their soft gradients
kpiSpark: { fillOpacity: 0.24 } · effects: { dropShadow: true }       // 1px-blur, lead stroke only
states: { hoverFilter: lighten 0.04, dimmedOpacity: 0.2 }
tooltip: DARK inverse (shared anatomy with B, deeper surface) — premium signal
```

## Risks / open questions for P4

- s1/s3/s4 are all blue-axis: adjacency order interleaves violet slots to keep
  ΔE up; validator decides if s3 cyan needs brightening.
- Floating bar labels + gradient caps is the closest to round-4's rejected land —
  difference: no card chrome changes, no glow, labels only ≤8 categories, and the
  whole thing rides the treatment switch. If it still smells decorative on the
  specimen, drop floating labels first (they're one boolean).
- Donut gradient arcs must keep 2px surface strokes or adjacent gradient slices
  smear together.

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
