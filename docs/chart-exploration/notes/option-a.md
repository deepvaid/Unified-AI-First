# Option 1 · Single Blue (`?chart=optionA`)

**Philosophy**: one blue family, ordered by alternating lightness. Comparison is
a lighter, desaturated blue — not grey.

Supplied sequential hexes failed adjacency / chroma / lightness-band gates.
Slots were reordered and weak ends were darkened or chroma-lifted so adjacent
series stay distinguishable (normal ΔE ≥ 15, CVD ΔE ≥ 8).

| Slot | Role | Hex | Notes |
|---|---|---|---|
| s1 | lead | `#0B5CAD` | supplied enterprise blue |
| s2 | light | `#76B8F0` | chroma-lifted from `#78BCE2` into the L/C band |
| s3 | dark | `#005889` | deeper blue for alternating lightness |
| s4 | mid | `#4AA6D8` | supplied |
| s5 | dark | `#006C98` | alternating dark |
| s6 | mid | `#479CC9` | alternating mid |

Axis (monotone blue): `#024180` `#205899` `#3870B3` `#5088CD` `#68A1E7`  
Comparison: `#597494` · positive `#1B7A46` · negative `#C2402A`

Treatment is the current dashboard chrome (straight 2px stroke, solid area,
4px bars, dashed grid, circle legends). Colour only.
