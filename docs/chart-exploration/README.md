# Chart Visual System Exploration

Working assets for the leadership review of Maropost's chart / data-visualization
language. Four candidate systems (`?chart=optionA…optionD`) applied to the exact same
dashboard, compared against the untouched baseline (`shopify`, the default).

**State + decisions live in [`/CHART_EXPLORATION_CONTEXT.md`](../../CHART_EXPLORATION_CONTEXT.md).**

## Layout

```
docs/chart-exploration/
├── README.md              ← you are here
├── manifest.json          ← written by capture.mjs (shot inventory + capturedAt + gitSha)
├── copy.json              ← per-option copy (philosophy / references / why / trade-off)
│                             — single source for the exploration view, deck, and Figma
├── research/
│   ├── refs.json          ← citation map (product, screen, source URL, local file, informs)
│   ├── refs/              ← downloaded reference screenshots
│   └── research-notes.md  ← citation table + per-pattern takeaways + direction seeds
├── 00-current/            ← baseline captures (?chart=shopify explicitly)
├── options/option-{a..d}/ ← per-option captures
├── comparison/            ← exploration-page + specimen-grid captures
├── deck/index.html        ← self-contained review deck (fallback if Figma unavailable)
├── notes/
│   ├── 00-audit.md        ← baseline audit (inventory + what's weak)
│   └── option-{a..d}.md   ← per-option rationale, tokens, validator output
└── figma-file.md          ← Figma file link, page map, ops log
```

## Regenerating captures

```
npm run dev                      # or the launch.json "Main App" config
node scripts/chart-exploration/capture.mjs --only dashboard --charts current
node scripts/chart-exploration/capture.mjs            # full matrix (once options exist)
```

Shots are named `<shot>--<chart>--<width>--<mode>.png`. All captures for a comparison
must come from **one session** (data is seeded off Date.now() at day granularity; the
script aborts if a run crosses midnight).

## Live review URLs (dev)

- Baseline: `/accounts/2000290/dashboard` (or explicit `?chart=shopify`)
- Options: `/accounts/2000290/dashboard?chart=optionA` … `optionD`
- Side-by-side: `/chart-exploration`
