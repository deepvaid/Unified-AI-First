# Chart colour options

Working assets for the stakeholder review of two light-mode chart palettes
applied to the existing Overview dashboard. Layout, widgets, chart types,
typography, axes, legends, tooltips, and interactions stay the same — only
series, comparison, and ramp colours change.

**Live review (dev)**

- Option 1 · Single Blue: `/accounts/2000290/dashboard?chart=optionA`
- Option 2 · Multi Colour: `/accounts/2000290/dashboard?chart=optionB`
- Side-by-side: `/chart-exploration`

## Layout

```
docs/chart-exploration/
├── README.md              ← you are here
├── manifest.json          ← written by capture.mjs
├── parity.json            ← DOM/layout parity across the three options
├── copy.json              ← per-option stakeholder copy
├── options/option-{a,b,c}/ ← per-option captures
├── comparison/            ← exploration-page + specimen-grid captures
└── notes/                 ← palette rationale (historical notes retained)
```

## Regenerating captures

```
npm run dev
node scripts/chart-exploration/validate-palettes.mjs
node scripts/chart-exploration/capture.mjs --widths 1440,768,375
```

Shots are named `<shot>--<chart>--<width>--<mode>.png`. All captures for a
comparison must come from **one session** (data is seeded off Date.now() at
day granularity; the script aborts if a run crosses midnight).
