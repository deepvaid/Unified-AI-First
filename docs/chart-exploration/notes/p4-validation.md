# P4 — Palette validation record (2026-08-07)

Final palettes live in `scripts/chart-exploration/option-palettes.mjs` (the QA source
of truth until the tokens.json freeze). Gate: `node scripts/chart-exploration/validate-palettes.mjs`
— vendored dataviz six-checks validator (OKLCH band 0.43–0.77, chroma ≥0.10,
CVD ΔE ≥8 Machado sev-1.0, normal-vision ΔE ≥15, contrast vs #FFFFFF, ordinal axis checks).

Tuning took 5 rounds; key moves: A s2 rechromed (#5FB9EB); B rose/slate lightness
split (#D078A3/#515C67) + teal pushed cyan (#17948C) + axis re-spaced; C green slots
made teal-leaning + lightness-interleaved (#008268/#3FB68E) + navy lifted into band
(#1F5099) + olive-leaning positive (#38761D); D lightness-interleaved order with
periwinkle s2 (#9A8EF9) + brightened axis cap (#4FB3F2).

Remaining WARNs are documented relief cases, not defects:
- Light-slot contrast (relief = legends + tooltips + table views, per dataviz method)
- positive-vs-series ΔE 8–15 (relief = positives always ship icon+label — KPI pill chevrons)

```

━━ optionA — Restrained Blue ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASS  chromatic · Lightness band         all 4 inside L 0.43–0.77
  PASS  chromatic · Chroma floor           all 4 >= 0.1
  PASS  chromatic · CVD separation         worst adjacent #5FB9EB↔#0E72B8 ΔE 21.8 (protan) · tritan 19.7
  PASS  chromatic · Normal-vision floor    worst adjacent #5FB9EB↔#0E72B8 ΔE 21.6 (normal)
  WARN  chromatic · Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#5FB9EB",2.18],["#38A8DC",2.69]]
  PASS  full-order adjacency               worst CVD ΔE 18.0 (target ≥8) · worst normal ΔE 19.6 (floor ≥15)
  PASS  axis · Lightness monotone          steps read light→dark
  PASS  axis · Adjacent ΔL                 all gaps >= 0.06
  PASS  axis · Light-end contrast          #63BCE8 at 2.12:1 vs surface
  PASS  axis · Single hue (soft)           hue spread 19°
  PASS  semantic · comparison              #6E93AE — 3.26:1 vs surface
  PASS  semantic · positive                #1B7A46 — 5.36:1 vs surface
  PASS  semantic · negative                #C2402A — 5.17:1 vs surface
  PASS  semantic · warning                 #B27B00 — 3.67:1 vs surface
  PASS  semantic · neutral                 #8A94A0 — 3.08:1 vs surface
  WARN  semantic · positive-vs-series      min ΔE 12.5 (≥15 pass · 8–15 warn w/ icon+label mitigation)

━━ optionB — Sophisticated Multi-Color ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASS  chromatic · Lightness band         all 5 inside L 0.43–0.77
  PASS  chromatic · Chroma floor           all 5 >= 0.1
  PASS  chromatic · CVD separation         worst adjacent #17948C↔#D4703A ΔE 10.8 (protan) · tritan 10.8
  PASS  chromatic · Normal-vision floor    worst adjacent #D078A3↔#6B5CC8 ΔE 20.6 (normal)
  PASS  chromatic · Contrast vs surface    all 5 >= 3:1
  PASS  full-order adjacency               worst CVD ΔE 10.8 (target ≥8) · worst normal ΔE 20.6 (floor ≥15)
  PASS  axis · Lightness monotone          steps read light→dark
  PASS  axis · Adjacent ΔL                 all gaps >= 0.06
  PASS  axis · Light-end contrast          #8FB3E6 at 2.15:1 vs surface
  PASS  axis · Single hue (soft)           hue spread 2°
  PASS  semantic · comparison              #828E9A — 3.34:1 vs surface
  PASS  semantic · positive                #178A50 — 4.39:1 vs surface
  PASS  semantic · negative                #C6403D — 5.00:1 vs surface
  PASS  semantic · warning                 #B27B00 — 3.67:1 vs surface
  PASS  semantic · neutral                 #8A94A0 — 3.08:1 vs surface
  WARN  semantic · positive-vs-series      min ΔE 8.5 (≥15 pass · 8–15 warn w/ icon+label mitigation)

━━ optionC — Blue Teal Green ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASS  chromatic · Lightness band         all 6 inside L 0.43–0.77
  PASS  chromatic · Chroma floor           all 6 >= 0.1
  PASS  chromatic · CVD separation         worst adjacent #3FB68E↔#4E9FDE ΔE 14.1 (deutan) · tritan 3.3
  PASS  chromatic · Normal-vision floor    worst adjacent #3FB68E↔#4E9FDE ΔE 15.5 (normal)
  WARN  chromatic · Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#45C6E0",2.02],["#4E9FDE",2.86],["#3FB68E",2.53]]
  PASS  full-order adjacency               worst CVD ΔE 14.1 (target ≥8) · worst normal ΔE 15.5 (floor ≥15)
  PASS  axis · Lightness monotone          steps read light→dark
  PASS  axis · Adjacent ΔL                 all gaps >= 0.06
  PASS  axis · Light-end contrast          #4FC2CE at 2.11:1 vs surface
  PASS  axis · Single hue (soft)           hue spread 37°
  PASS  semantic · comparison              #5E93AA — 3.37:1 vs surface
  PASS  semantic · positive                #38761D — 5.56:1 vs surface
  PASS  semantic · negative                #C2402A — 5.17:1 vs surface
  PASS  semantic · warning                 #B27B00 — 3.67:1 vs surface
  PASS  semantic · neutral                 #8A94A0 — 3.08:1 vs surface
  WARN  semantic · positive-vs-series      min ΔE 8.5 (≥15 pass · 8–15 warn w/ icon+label mitigation)

━━ optionD — Modern Gradient ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASS  chromatic · Lightness band         all 5 inside L 0.43–0.77
  PASS  chromatic · Chroma floor           all 5 >= 0.1
  PASS  chromatic · CVD separation         worst adjacent #A855D8↔#33ABEE ΔE 9.9 (deutan) · tritan 13.8
  PASS  chromatic · Normal-vision floor    worst adjacent #9A8EF9↔#2563EB ΔE 18.5 (normal)
  WARN  chromatic · Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#9A8EF9",2.76],["#33ABEE",2.56]]
  PASS  full-order adjacency               worst CVD ΔE 9.9 (target ≥8) · worst normal ΔE 18.5 (floor ≥15)
  PASS  axis · Lightness monotone          steps read light→dark
  PASS  axis · Adjacent ΔL                 all gaps >= 0.06
  PASS  axis · Light-end contrast          #4FB3F2 at 2.32:1 vs surface
  PASS  axis · Single hue (soft)           hue spread 39°
  PASS  semantic · comparison              #7C8CA3 — 3.42:1 vs surface
  PASS  semantic · positive                #148549 — 4.69:1 vs surface
  PASS  semantic · negative                #C6403D — 5.00:1 vs surface
  PASS  semantic · warning                 #B27B00 — 3.67:1 vs surface
  PASS  semantic · neutral                 #8A94A0 — 3.08:1 vs surface
  WARN  semantic · positive-vs-series      min ΔE 14.8 (≥15 pass · 8–15 warn w/ icon+label mitigation)

✓ all option palettes pass the hard gates
```
