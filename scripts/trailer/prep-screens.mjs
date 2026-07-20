// Copy the evolution screenshot library into public/trailer-screens/ (gitignored)
// so the /reel/fly 3D fly-through can load them from the dev server.
// Full-page captures are cropped to their top 1440×900 viewport — the fly-through
// only shows a 16:10 window, and rasterizing 3500px-tall images per frame is what
// makes the capture browser choke.
//
// Usage: node scripts/trailer/prep-screens.mjs
import { mkdirSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const SRC = 'docs/design-system/evolution/after'
const DST = 'public/trailer-screens'

mkdirSync(DST, { recursive: true })
let n = 0
for (const f of readdirSync(SRC)) {
  const m = /^(.+)--1440--(light|dark)\.png$/.exec(f)
  if (!m) continue
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', `${SRC}/${f}`, '-vf',
    "crop=1440:'min(ih,900)':0:0", `${DST}/${m[1]}--${m[2]}.png`])
  n++
}
console.log(`${n} screens cropped → ${DST}`)
