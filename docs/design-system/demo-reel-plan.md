# Demo Reel Plan — 75 seconds, "Chaos → Order"

A one-day production guide for the intro film. The arc is the one that lands hardest with PM + engineering audiences (per research into Material You, Airbnb DLS, Figma Config, and Linear-style reveals): **mismatched UI wobbles → snaps into one system → proof montage → stat punch → wordmark.**

Everything you need to shoot already exists in the repo:
- **`/reel`** — five recordable full-screen title cards on a fixed dark 16:9 stage. `←` `→` switch cards, **`R` replays the current card's animation from zero**. A hint shows for 2 seconds then fades (start recording after it's gone, or trim it).
- **`/showcase`** — the hero cascade, count-up stats, and component wall.
- Product routes — orders, dashboard, journey builder, Da Vinci.

Target: **75s · 1080p (record at 2× retina) · MP4 H.264 + AAC · 50–100 MB** (plays inline in Slack).

---

## The beat sheet

| Time | Beat | Capture | Notes |
|------|------|---------|-------|
| 0:00–0:07 | **Chaos.** Mismatched tiles pop in and wobble. Caption "BEFORE". | `/reel` card 1 (first 3.2s of the take) | Record card 1 once as a full ~6s take; you'll split it at the snap in the edit. Music: sparse or held back. |
| 0:07–0:12 | **Name the pain.** "Three buttons. / Five blues. / Zero consistency." | `/reel` card 2 | Hard cut on a beat. |
| 0:12–0:16 | **The SNAP.** Chaos dissolves; system components land, staggered. Caption "AFTER — one system, one truth". | `/reel` card 1 (back half of the same take) | This is the money cut: drop the music to near-silence for ~0.5s *before* it, land the snap **on the downbeat**. |
| 0:16–0:24 | **Foundations.** Token chips settle around "One system. Every screen."; theme pill visible. | `/showcase` hero, fresh load | Reload the page on camera so the cascade plays. Slow push-in (Screen Studio zoom). |
| 0:24–0:30 | **The numbers are real.** Stats count up 89 · 84 · 171 · 297. | `/showcase` scrolled to stats bar | Scroll into it on camera to trigger the count-up. |
| 0:30–0:45 | **Proof montage** — ~5s each, beat-synced cuts: ① Sales Orders: switch tab → open filter drawer → select a row (bulk bar pops) ② Dashboard: drag one widget, open date presets ③ Journey Builder: canvas pan, open a node panel | `/commerce/2000290/orders` → `/accounts/2000290/dashboard` → `/accounts/2000290/journeys/1/builder` | Auto-zoom ON — the cursor choreography sells "it's real." Keep each action singular and confident. |
| 0:45–0:53 | **The flip.** On the dashboard: light → dark → hold dark 1.5s → back to light. | Dashboard + the app-bar avatar-menu theme toggle (or `/showcase` pill) | The crowd-pleaser. One flip each way — don't strobe. |
| 0:53–0:56 | **The AI wink.** Da Vinci orb breathing, captions visible. | `/accounts/2000290/da-vinci/experience` | 3 seconds, no audio needed — just the orb living. |
| 0:56–1:03 | **Stat punch.** Oversized numbers count up on the dark stage. | `/reel` card 4 | Cut on the beat as the last label lands. |
| 1:03–1:08 | **The line.** "One system. / Every screen." | `/reel` card 3 | Type card, cyan accent line. |
| 1:08–1:15 | **Wordmark close.** Orb + MAROPOST + tagline + URL. Hold. | `/reel` card 5 | Let it breathe ~2s after the URL lands; music resolves and *stops* — a full-second still ending reads confident. |

**60-second cutdown** (if Slack attention demands it): drop the Da Vinci wink and tighten the montage to 4s per clip; everything else survives.

---

## Capture checklist (before you hit record)

1. Fresh browser window (or clean profile): bookmarks bar hidden, extensions quiet, notifications OFF (macOS Focus mode).
2. `npm run dev` → shoot against `localhost:5173` (or the Vercel URL — identical pixels).
3. Window ~1600×900+ at 100% zoom; the `/reel` stage self-letterboxes to 16:9.
4. Theme: start **light** everywhere except `/reel` (it locks itself dark — by design).
5. Reload each product route before its take (fresh seeded state).
6. For `/reel` takes: navigate to the card, wait for the hint to fade (2s), press **R**, and record the replay. Shoot each card twice — takes are cheap.
7. Cursor: park it off-frame for `/reel` cards; for product clips it's the *star* — move slowly, one deliberate action at a time.

## Toolchain (researched, one-day-feasible)

**Record — Screen Studio** (~$20/mo, macOS): the automatic zoom-on-click and cursor smoothing are 80% of the "wow." Project at 1080p/60, auto-zoom on for product clips, OFF (or minimal) for `/reel` title cards — those compose themselves.

**Edit — CapCut desktop** (free tier is enough): drop the music track FIRST, use beat detection to place markers, then cut clips to markers. Hard cuts only — no dissolves (dissolves read as apology). Build the audio vacuum before the snap by dipping music to ~10% for half a second.

**Music — Pixabay Music** (free, commercial-safe, no attribution): search "minimal tech beat", "corporate electronic", or "upbeat tech" — pick something 90–110 BPM with a clear downbeat for the snap. Glance at the track's license page before shipping; for extra polish Uppbeat ($7.99/mo) has a deeper catalog.

**Free fallback path:** QuickTime capture → iMovie edit → Pixabay music. You lose auto-zoom; compensate by recording tighter windows (zoom the browser to 125% for product clips).

**Export:** MP4 · H.264 + AAC · 1920×1080 · 30 fps (60 if the motion feels choppy) · ~10 Mbps VBR → lands in the 50–100 MB sweet spot. Test-play on the actual meeting-room screen *and* in a Slack DM to yourself before the day.

---

## Hour-by-hour (≈3 hours)

| Time | Task |
|------|------|
| 0:00–0:20 | Read this sheet twice. Pick the music track first — the cut rhythm depends on it. |
| 0:20–1:10 | Capture: 5 `/reel` cards (two takes each) + `/showcase` load & scroll + 3 product clips + the flip + 3s of orb. |
| 1:10–2:10 | Assemble in CapCut: music → beat markers → clips in beat-sheet order → titles ok as-is (cards carry the type). |
| 2:10–2:40 | Polish: the audio vacuum before the snap, the confident end-stop, one watch-through at 1× *without* touching anything. |
| 2:40–3:00 | Export, test in Slack + meeting room, park the file on the desktop for the S4 deck cue. |

**Taste rules borrowed from the best** — steal shamelessly: land big moments on the downbeat (Linear) · one action per shot, no cursor wandering (Raycast keeps UI the hero) · a beat of silence before the reveal (Vercel) · end on a full-second still (Stripe) · when in doubt, cut earlier — 75 tight seconds beat 90 loose ones.
