# Design System Trailer — script, storyboard, and build pipeline

A 75-second cinematic trailer for the design system + prototype sandbox: real UI
recordings as the backbone, Gemini TTS (Charon — the Da Vinci voice) narration,
and three optional Seedance AI accent shots. Follows the "Chaos → Order" arc from
[demo-reel-plan.md](demo-reel-plan.md).

Output: `trailer-build/maropost-design-system-trailer-75s.mp4` (1080p24 H.264, AAC 48 kHz, ~78s).

Language rules honored in the VO (see leadership-showcase-script.md): "working
prototype environment" (never "production-ready"), "converge into LiquidSky"
(never "replace"), no dates or percentages.

## Voiceover script — "One System"

| Scene | Line |
|-------|------|
| S1 | "For years, the product grew screen by screen… and every screen told a slightly different story." |
| S2 | *(silent — kinetic type carries it: "Three buttons. Five blues. Zero consistency.")* |
| S3 | "So we built one." |
| S4 | "One design system. Tokens, components, and patterns — drawn from the real product, rebuilt as a working prototype environment." |
| S5 | "Every component documented. Every screen accounted for." |
| S6 | "Orders. Dashboards. Journeys. The same language on every surface — so teams stop redesigning the basics, and start shipping." |
| S7 | "Light or dark. One flip. Everywhere." |
| S8 | "Even our AI speaks it." |
| S9 | "This isn't a mock-up. It runs." |
| S10 | "One system. Every screen." |
| S11 | "The Maropost design system — built to converge into LiquidSky." |

## Storyboard (scene lengths follow the baked VO durations)

| # | Visual | Source |
|---|--------|--------|
| S1 | Chaos: mismatched save buttons wobble in dark space (slow-motion) | `/reel` card 1 wobble phase · AI `opener` when present |
| S2 | Kinetic type "Three buttons. Five blues. Zero consistency." | `/reel` card 2 |
| S3 | The SNAP → "AFTER — one system, one truth" | `/reel` card 1 back half · AI `snap` when present |
| S4 | Showcase hero + token chips, slow push-in | `/showcase` scroll |
| S5 | Stats count up 89·84·171·297 | `/showcase` stats bar |
| S6 | Proof montage: Sales Orders → Dashboard → Journey Builder (journey 1) | product routes |
| S7 | Theme flip: light dashboard crossfades to dark | two captures, xfade |
| S8 | Da Vinci orb breathing | `/accounts/2000290/da-vinci/experience` |
| S9 | Stat punch, oversized numbers | `/reel` card 4 |
| S10 | "One system. / Every screen." | `/reel` card 3 |
| S11 | Wordmark close (orb + MAROPOST + URL), fade to black | `/reel` card 5 · AI `closer` when present |

## Pipeline — how to (re)build

Everything lives in `scripts/trailer/`; artifacts land in `trailer-build/` (gitignored).

```bash
# 0. Dev server running on :5173 (npm run dev)

# 1. Voiceover — Gemini TTS, voice Charon, pace 1.05×
GEMINI_API_KEY=... node scripts/trailer/bake-vo.mjs          # --force to re-bake

# 2. Screen captures — Playwright chromium, 1920×1080 → captures/*.mp4
node scripts/trailer/capture.mjs                             # --only name,name to redo shots

# 3. (Optional) Seedance AI accent shots via BytePlus ModelArk
ARK_API_KEY=... ARK_VIDEO_MODEL=<model id from your ModelArk console> \
  node scripts/trailer/gen-seedance.mjs                      # seeds from trailer-build/seeds/

# 4. Assemble — retime to VO, zoom push-ins, theme-flip xfade, loudnorm −16 LUFS
node scripts/trailer/assemble.mjs
```

Notes:
- **Seedance vs Seedream** — Seedream is ByteDance's *image* model; the *video*
  model is **Seedance** (both on BytePlus ModelArk). Without `ARK_API_KEY` the
  generator exits gracefully and assembly uses the real-capture fallbacks above,
  so the trailer is always complete. After generating AI shots, just re-run step 4.
- **Music bed** — drop any licensed track at `trailer-build/music.mp3` (Pixabay,
  per demo-reel-plan.md) and re-run step 4; it mixes at −18 dB under the VO.
- **Timing contract** — `capture.mjs` ends every shot with a known "action tail";
  `assemble.mjs` (`TAIL` map) uses it to find each animation's t=0. If you change
  a shot's final sleep in capture.mjs, update the TAIL map to match.
- Scene lengths = trimmed VO duration + 0.55s pad (S2 is fixed at 4.6s). Editing
  a VO line and re-baking automatically retimes the cut.
