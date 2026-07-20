# Design System Trailer — script, storyboard, and build pipeline

A ~1:42 cinematic trailer for the design system + prototype sandbox, in the style
of Atlassian's "Reimagining Atlassian Design System: A vision": real UI screens
flying in 3D space, Gemini TTS (Charon — the Da Vinci voice) narration with a
cinematic mix, a code-composed score synced to the edit, and Seedance AI accent
shots. Follows the "Chaos → Order" arc from [demo-reel-plan.md](demo-reel-plan.md).

Output: `trailer-build/maropost-design-system-trailer.mp4` (1080p24 H.264, AAC 48 kHz, ~102s).

Language rules honored in the VO (see leadership-showcase-script.md): "working
prototype environment" (never "production-ready"), "converge into LiquidSky"
(never "replace"), no dates or percentages.

## Voiceover script — "One System"

| Scene | Line |
|-------|------|
| S1 | "For years, the product grew screen by screen… and every screen told a slightly different story." |
| S2 | *(silent — kinetic type: "Three buttons. Five blues. Zero consistency.")* |
| S3 | "So we built one." |
| S4 | "One design system. Tokens, components, and patterns — drawn from the real product, rebuilt as a working prototype environment." |
| S5 | "Every component documented. Every screen accounted for." |
| S6 | "Orders. Dashboards. Journeys. The same language on every surface — so teams stop redesigning the basics, and start shipping." |
| S7 | "Light or dark. One flip. Everywhere." |
| S8 | "Even our AI speaks it." |
| S9 | "This isn't a mock-up. It runs." |
| S10 | "One system. Every screen." |
| S11 | "The Maropost design system — built to converge into LiquidSky." |

## Storyboard

| # | Visual | Source |
|---|--------|--------|
| S1 | **Seedance AI**: glassy UI fragments (mismatched save buttons, chips) drift in dark space | `trailer-build/ai/opener.mp4` (fallback: `/reel` card 1 wobble, slow-mo) |
| S2 | Kinetic type "Three buttons. Five blues. Zero consistency." | `/reel` card 2 |
| S3 | The SNAP → "AFTER — one system, one truth" | AI `snap` when generated (fallback: `/reel` card 1 back half) |
| S4–S7 | **3D fly-through** (`/reel/fly`, one continuous camera journey): descent over a floating landscape of real screens → giant stats wall (89·84·171·297) → dive down a street of screens → head-on dashboard, whole world crossfades to dark | `flyover` capture |
| S8 | Da Vinci orb breathing | `/accounts/2000290/da-vinci/experience` |
| S9 | Stat punch, oversized numbers | `/reel` card 4 |
| S10 | "One system. / Every screen." | `/reel` card 3 |
| S11 | Wordmark close, fade to black | AI `closer` when generated (fallback: `/reel` card 5) |

## The fly-through (`/reel/fly`)

[ReelFlyView.vue](../../src/views/Reel/ReelFlyView.vue) — a CSS-3D world of real
screenshots (`docs/design-system/evolution/after/`, light+dark stacked per plane),
giant stat numbers, live Mp components, and a grid floor; one master camera
animation. **[flyover-plan.json](../../src/views/Reel/flyover-plan.json) is the
single source of truth**: the view derives the camera timing from it, capture.mjs
derives the recording length, and assemble.mjs places the VO lines at the same
offsets — edit the plan and everything re-syncs. `R` replays from t=0.

## Pipeline — how to (re)build

Everything lives in `scripts/trailer/`; artifacts land in `trailer-build/` (gitignored).
Secrets (`GEMINI_API_KEY`, `ARK_API_KEY`) are read from `.env.local` automatically (env.mjs).

```bash
# 0. Dev server on :5173 (npm run dev)

# 1. Voiceover — Gemini TTS, voice Charon, cinematic delivery
node scripts/trailer/bake-vo.mjs                             # --force to re-bake

# 2. Fly-through source screens (crops full-page PNGs to 16:10)
node scripts/trailer/prep-screens.mjs

# 3. Screen captures — Playwright, 1920×1080
node scripts/trailer/capture.mjs --headed                    # --only flyover to redo one
#    ⚠ the flyover NEEDS --headed: headless software rendering can't hold
#    real-time on the 3D scene and the recording lags behind the choreography.

# 4. Seedance AI accent shots (BytePlus ModelArk, Seedance 2.0)
node scripts/trailer/gen-seedance.mjs                        # skips shots already on disk

# 5. Assemble — flyover block, film grade, VO polish chain, score, sidechain duck
node scripts/trailer/assemble.mjs
```

Notes:
- **Seedance vs Seedream** — Seedream is ByteDance's *image* model; the *video*
  model is **Seedance** (`dreamina-seedance-2-0-260128` on ModelArk). Missing key
  or paused model → graceful skip + real-capture fallbacks; re-run steps 4→5 later.
  If generation fails with `SetLimitExceeded`, raise/disable "Safe Experience Mode"
  on the ModelArk Model Activation page.
- **Music** — `assemble.mjs` composes `trailer-build/score.wav` in code
  ([make-score.mjs](../../scripts/trailer/make-score.mjs)): sub drone, Am/F pads,
  a riser ending exactly on the S3 snap, impacts on the snap and stat punch, a
  pulse through the flyover — all read from the edit's own `timeline.json`.
  Drop a licensed track at `trailer-build/music.mp3` to use it instead (mixed at
  −18 dB). Both are ducked under the VO via sidechain compression.
- **VO mix** — highpass, body +3dB @120Hz, presence +2dB @3kHz, compression,
  a hint of echo — then everything loudnorm'd to −16 LUFS.
- **Timing contract** — `capture.mjs` ends every shot with a known "action tail";
  `assemble.mjs` (`TAIL` map) uses it to find each animation's t=0. The flyover's
  tail derives from flyover-plan.json in both scripts.
- Scene lengths (outside the flyover) = trimmed VO duration + 0.55s pad; the
  flyover block is fixed by the plan. Re-baking VO retimes the standalone scenes.
