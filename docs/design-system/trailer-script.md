# Design System Trailer — script, storyboard, and build pipeline

A ~1:00 fast-cut trailer (v3) for the design system + prototype sandbox, in the style
of Atlassian's "Reimagining Atlassian Design System: A vision": real UI screens
flying in 3D space, Gemini TTS (Charon — the Da Vinci voice) narration with a
cinematic mix, a code-composed score synced to the edit, and Seedance AI accent
shots, burned-in styled captions, and a beat-driven edit. Follows the "Chaos → Order" arc from [demo-reel-plan.md](demo-reel-plan.md).

Output: `trailer-build/maropost-design-system-trailer.mp4` (1080p24 H.264, AAC 48 kHz, ~58s). The design system is named **MaroBase**; no LiquidSky references.

Language rules honored in the VO (see leadership-showcase-script.md): "working
sandbox" (never "production-ready"), no dates or percentages, and — per current
direction — **no LiquidSky references**.

## Voiceover script — "MaroBase" (v3, brisk)

Every spoken line is also burned in as a styled caption (Inter, brand-blue emphasis).

| Scene | Line |
|-------|------|
| S0 | *(silent cold open — Seedance fragments; beat starts)* |
| S1 | "This is how the product looked for years. Every screen its own era… every flow its own rules." |
| S2 | *(silent — kinetic type: "Three buttons. Five blues. Zero consistency.")* |
| S3 | "So we rebuilt the language." |
| S4 | "MaroBase. One design system — running as a real product. Not mock-ups… live code." |
| S5 | "Eighty-nine components. A hundred and seventy-one screens. One source of truth." |
| S6 | "Orders. Journeys. Contacts. Settings. Every flow rebuilt on the same foundations — in a working sandbox you can click today." |
| S7 | "Light or dark. One flip." |
| S8 | "Even Da Vinci speaks it." |
| S9 | "This isn't a deck. It runs." |
| S10 | "One system. Every screen." |
| S11 | "MaroBase — the Maropost design system." |

## Storyboard

| # | Visual | Source |
|---|--------|--------|
| S0 | **Seedance AI** cold open: glassy UI fragments drift in dark space | `trailer-build/ai/opener.mp4` first 2.5s |
| S1 | **Old-UAT quick-cut montage** — real old product screens, archive grade (desaturated, vignette), alternating Ken Burns pushes | `maropost-screenshots/uat-old/*.png` (drop more in and re-run) |
| S2 | Kinetic type "Three buttons. Five blues. Zero consistency." | `/reel` card 2 |
| S3 | The SNAP → "AFTER — one system, one truth" | AI `snap` when generated (fallback: `/reel` card 1 back half) |
| S4–S7 | **Fast 3D fly-through** (`/reel/fly`, ~28s): descent over floating screens → stats wall → street dive → head-on dashboard, world flips dark | `flyover` capture |
| S8 | Da Vinci orb breathing | `/accounts/2000290/da-vinci/experience` |
| S9 | Stat punch, oversized numbers | `/reel` card 4 |
| S10 | "One system. / Every screen." | `/reel` card 3 |
| S11 | **MAROBASE** wordmark ("by Maropost"), fade to black | `/reel?brand=marobase` card 5 |

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
- **Music** — a user track at `trailer-build/music.mp3` is used when present
  (current cut uses one). Otherwise `assemble.mjs` composes `trailer-build/score.wav`
  in code ([make-score.mjs](../../scripts/trailer/make-score.mjs)): 120 BPM
  four-on-the-floor kick + offbeat hats, sub drone, Am/F pads, riser into the S3
  snap, impacts on snap and stat punch — read from the edit's own `timeline.json`.
  Standalone cut lengths quantize to a 0.25s grid so cuts sit near the half-beat.
  Both beds are ducked under the VO via sidechain compression.
- **Captions** — [make-captions.mjs](../../scripts/trailer/make-captions.mjs)
  renders each VO line as HTML/CSS (Inter, brand-blue `<em>` emphasis) to
  transparent PNGs via headless Chromium, composited with `overlay` (this ffmpeg
  build has no libass/drawtext).
- **VO mix** — highpass, body +3dB @120Hz, presence +2dB @3kHz, compression,
  a hint of echo — then everything loudnorm'd to −16 LUFS.
- **Timing contract** — `capture.mjs` ends every shot with a known "action tail";
  `assemble.mjs` (`TAIL` map) uses it to find each animation's t=0. The flyover's
  tail derives from flyover-plan.json in both scripts.
- Scene lengths (outside the flyover) = trimmed VO duration + 0.55s pad; the
  flyover block is fixed by the plan. Re-baking VO retimes the standalone scenes.
