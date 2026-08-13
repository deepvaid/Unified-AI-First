# Option C — Maropost Blue · Teal · Green (`?chart=optionC`)

**Philosophy**: an ownable connected family — Maropost blue flowing through teal
into green, one temperature. Cohesion from hue kinship, separation from
alternating lightness.

**Mood board**: base44--blue-green-identity--01, klaviyo--deliverability-rows--01,
expensify--blue-green-pie--01, wrike--donut-anatomy--01, basedash--dark-ring--01,
mailchimp--accent-funnel--01 (gray de-emphasis rule carried over).

## Rules that make the family work

1. **Hue span 250°→160° (blue → teal → sea green), nothing warmer.** The family IS
   the identity; one warm hue would break it.
2. **Alternating lightness down the slot order** — neighbors differ by hue AND
   lightness, which is what six near-family hues need to stay separable.
3. **Semantic positive green is reserved**: deeper and yellower (h≈150, L lower)
   than any series green, so "up and to the right" never impersonates series 3.
4. **Soft family-tinted area fills** — warmth without noise (Base44's identity trick).

## Palette logic (draft anchors — validator-tuned in P4)

| Slot | Hue pos | Draft | Logic |
|---|---|---|---|
| s1 | blue 250 | `#0073AB` | Picton 600 — the brand anchor leads |
| s2 | cyan 210 | `#3FC0DC` | light cyan — L jump + hue step |
| s3 | green 165 | `#0F6B4F` | deep sea green — far pole, dark |
| s4 | azure 235 | `#4E9FDE` | mid azure — back toward blue, mid L |
| s5 | teal 180 | `#2AA893` | mid teal — between the poles |
| s6 | navy 255 | `#173A66` | deep navy — dark bookend |

Semantic: comparison `#2E9E6B` (family green, dashed — see P12 note) · positive `#157A3E`
(reserved, yellower + deeper than s3/s5) · negative `#C2402A` · warning `#B27B00` ·
neutral `#8A94A0` · grid `rgba(26,24,20,0.07)`.

## Treatment spec

```
stroke: { curve: smooth, width: 2.5, companionWidth: 2, companionDash: 0, gradientLine: false }
comparison: { color: #2E9E6B, dash: 0, fillOpacity: 0.16 }
area: { fill: gradient, opacityFrom: 0.28, opacityTo: 0.02 }         // the family wash — C's signature
bar: { radius: 6, single: 45%, grouped: 70%, fill: tint-gradient, floatingLabels: false }
grid: { show: true, dashArray: 0, xLines: false, yLines: true }
axes: { yLabelsOnTimeseries: true }
crosshair: { show: true, dash: 0 }
markers: { hoverSize: 4, lastPoint: true }                            // persistent last-point dot on single series
legend: { markerShape: circle, markerSize: 8, hoverHighlight: true }
donut: { size: 64%, fill: solid, strokeWidth: 2, showDataLabels: false }
svg: { shade: flat } · kpiSpark: { fillOpacity: 0.18 } · effects: { dropShadow: false }
states: { hoverFilter: none, dimmedOpacity: 0.3 }
tooltip: minimal light with a family-tinted title bar accent (subtle)
```

## Risks / open questions for P4

- **CVD is the make-or-break check**: s3 deep green vs s5 mid teal, and s5 vs
  positive-green semantic. Lightness alternation is the mitigation; validator
  decides. If s5 can't clear, swap s5 → deep slate-teal or drop to 5 chromatic +
  navy bookend.
- s2 cyan vs s4 azure (both mid-light, 25° apart) is the second-riskiest pair.
- Six family slices on the donut is the stress test (same as A) — 2px slice gaps
  + legend values carry it.

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
