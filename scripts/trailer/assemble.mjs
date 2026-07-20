// Assemble the design-system trailer → trailer-build/maropost-design-system-trailer.mp4
//
// v2: the film's core (S4–S7) is one continuous 3D fly-through (/reel/fly),
// timed by src/views/Reel/flyover-plan.json — the same file the view derives its
// camera from, so narration and camera waypoints stay in sync by construction.
// Scene lengths for the standalone beats are driven by the baked VO durations.
// AI accent shots (trailer-build/ai/*.mp4, Seedance) are used when present, with
// real-capture fallbacks. Music: trailer-build/music.mp3 if you drop one in,
// otherwise a generated score composed against this edit's own timeline.
//
// Usage: node scripts/trailer/assemble.mjs
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const BUILD = 'trailer-build'
const CAPS = `${BUILD}/captures`
const AI = `${BUILD}/ai`
const WORK = `${BUILD}/.work`
const OUT = `${BUILD}/maropost-design-system-trailer.mp4`

const FPS = 24
const W = 1920
const H = 1080

const flyoverPlan = JSON.parse(readFileSync('src/views/Reel/flyover-plan.json', 'utf8'))
const FLY_TOTAL = flyoverPlan.segments.reduce((s, x) => s + x.dur, 0)

// Seconds of scripted "action tail" at the end of each capture (the last sleep in
// capture.mjs) — animation start = capture duration − tail. Keep in sync.
const TAIL = {
  'reel-chaos-snap': 12,
  'reel-type-before': 9,
  'reel-type-after': 8,
  'reel-stats': 9,
  'reel-wordmark': 9,
  'davinci-orb': 8,
  flyover: FLY_TOTAL + 1.7, // same formula as capture.mjs
}

function ff(args) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'inherit', 'inherit'] })
}

function probe(path) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])
  return Number(String(out).trim())
}

/** Absolute source-time where the shot's animation starts. */
function animStart(name) {
  return Math.max(0, probe(`${CAPS}/${name}.mp4`) - TAIL[name])
}

// ── VO: trim head/tail silence, measure ──────────────────────────────────────
const manifest = JSON.parse(readFileSync(`${BUILD}/vo/manifest.json`, 'utf8'))
mkdirSync(`${BUILD}/vo-trim`, { recursive: true })
const vo = {}
for (const line of manifest) {
  const src = `${BUILD}/vo/${line.file}`
  const dst = `${BUILD}/vo-trim/${line.file}`
  if (!existsSync(dst)) {
    ff(['-i', src, '-af',
      'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,' +
      'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.3,areverse',
      dst])
  }
  vo[line.id] = { path: dst, dur: probe(dst) }
}

// ── Scene plan ────────────────────────────────────────────────────────────────
const PAD = 0.55 // breathing room after each VO line
const ai = (name) => (existsSync(`${AI}/${name}.mp4`) ? `${AI}/${name}.mp4` : null)

const SCENES = [
  { id: 's01', vo: 's01', min: 8, ai: ai('opener'), fallback: { src: 'reel-chaos-snap', from: 0, slowmo: 3.4 } },
  { id: 's02', dur: 4.6, visual: { src: 'reel-type-before', from: 0 } },
  { id: 's03', vo: 's03', min: 4.2, ai: ai('snap'), fallback: { src: 'reel-chaos-snap', from: 3.4 } },
  { id: 'flyover', flyover: true },
  { id: 's08', vo: 's08', visual: { src: 'davinci-orb', from: 0.5 } },
  { id: 's09', vo: 's09', visual: { src: 'reel-stats', from: 0 } },
  { id: 's10', vo: 's10', visual: { src: 'reel-type-after', from: 0 } },
  { id: 's11', vo: 's11', min: 7.5, ai: ai('closer'), fallback: { src: 'reel-wordmark', from: 0 } },
]

const durOf = (s) => (s.flyover ? FLY_TOTAL : s.vo ? Math.max(vo[s.vo].dur + PAD, s.min || 0) : s.dur)

const COMMON = ['-r', String(FPS), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-an']
const BASE_VF = `fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
  `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p`
// Subtle film grade for the fly-through (contrast + saturation lift, vignette)
const GRADE = 'eq=contrast=1.05:saturation=1.07,vignette=angle=PI/5.4'

/** Cut a segment from a capture (relative to its animation start). */
function cutCapture(name, relFrom, dur, out, { grade = false } = {}) {
  const start = animStart(name) + relFrom
  const avail = probe(`${CAPS}/${name}.mp4`) - start
  const pad = Math.max(0, dur - avail + 0.05)
  const vf = [BASE_VF, grade ? GRADE : null, pad > 0 ? `tpad=stop_mode=clone:stop_duration=${pad.toFixed(2)}` : null]
    .filter(Boolean)
    .join(',')
  ff(['-ss', start.toFixed(3), '-i', `${CAPS}/${name}.mp4`, '-t', (dur + (pad > 0 ? pad : 0)).toFixed(3), '-vf', vf, ...COMMON, '-t', dur.toFixed(3), out])
}

/** Use an AI clip, scaled/padded and length-fitted (retime if close, else freeze). */
function cutAi(path, dur, out) {
  const avail = probe(path)
  if (avail < dur && dur / avail <= 1.35) {
    // Slow the clip to fill the scene — frame-blend keeps motion smooth.
    ff(['-i', path, '-vf',
      `setpts=PTS*${(dur / avail).toFixed(4)},minterpolate=fps=${FPS}:mi_mode=blend,${BASE_VF}`,
      ...COMMON, '-t', dur.toFixed(3), out])
    return
  }
  const pad = Math.max(0, dur - avail + 0.05)
  const vf = [BASE_VF, pad > 0 ? `tpad=stop_mode=clone:stop_duration=${pad.toFixed(2)}` : null].filter(Boolean).join(',')
  ff(['-i', path, '-vf', vf, ...COMMON, '-t', dur.toFixed(3), out])
}

/** Slow the chaos wobble to fill the scene (frame-blend interpolation). */
function cutSlowmo(name, srcLen, dur, out) {
  const start = animStart(name)
  const factor = (dur / srcLen).toFixed(4)
  ff(['-ss', start.toFixed(3), '-i', `${CAPS}/${name}.mp4`, '-t', srcLen.toFixed(3), '-vf',
    `setpts=PTS*${factor},minterpolate=fps=${FPS}:mi_mode=blend,${BASE_VF}`,
    ...COMMON, '-t', dur.toFixed(3), out])
}

mkdirSync(WORK, { recursive: true })
const clips = []
const sceneStarts = {}
let t = 0

for (const scene of SCENES) {
  const dur = durOf(scene)
  const out = `${WORK}/${scene.id}.mp4`
  sceneStarts[scene.id] = t
  t += dur

  if (scene.flyover) {
    cutCapture('flyover', 0, dur, out, { grade: true })
  } else if (scene.ai) {
    cutAi(scene.ai, dur, out)
  } else if (scene.fallback?.slowmo) {
    cutSlowmo(scene.fallback.src, scene.fallback.slowmo, dur, out)
  } else if (scene.fallback) {
    cutCapture(scene.fallback.src, scene.fallback.from, dur, out)
  } else {
    cutCapture(scene.visual.src, scene.visual.from, dur, out)
  }
  clips.push(out)
  console.log(`scene ${scene.id}  ${dur.toFixed(2)}s  @${sceneStarts[scene.id].toFixed(2)}s`)
}

const TOTAL = t

// ── VO placement: standalone scenes at scene start; flyover lines at their
//    segment offsets inside the flyover block ─────────────────────────────────
const placements = []
for (const scene of SCENES) {
  if (scene.flyover) {
    let off = sceneStarts[scene.id]
    for (const seg of flyoverPlan.segments) {
      const slot = seg.dur - 0.65
      if (vo[seg.id].dur > slot) {
        console.warn(`WARN: VO ${seg.id} (${vo[seg.id].dur.toFixed(1)}s) overflows its ${seg.dur}s flyover segment`)
      }
      placements.push({ id: seg.id, at: off + 0.35 })
      off += seg.dur
    }
  } else if (scene.vo) {
    placements.push({ id: scene.vo, at: sceneStarts[scene.id] + 0.35 })
  }
}

// Timeline manifest — consumed by make-score.mjs (and handy for debugging)
const flySegStarts = []
{
  let off = sceneStarts['flyover']
  for (const seg of flyoverPlan.segments) {
    flySegStarts.push({ id: seg.id, start: off, dur: seg.dur })
    off += seg.dur
  }
}
writeFileSync(`${BUILD}/timeline.json`, JSON.stringify({
  total: TOTAL,
  scenes: [
    ...SCENES.map((s) => ({ id: s.id, start: sceneStarts[s.id], dur: durOf(s) })),
    ...flySegStarts,
  ],
  vo: placements,
}, null, 2))

console.log(`\ntotal ${TOTAL.toFixed(1)}s — concatenating…`)

// ── Video concat + global fades ───────────────────────────────────────────────
const listFile = `${WORK}/all.txt`
writeFileSync(listFile, clips.map((p) => `file '${p.split('/').pop()}'`).join('\n'))
const silentVideo = `${WORK}/video.mp4`
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-vf',
  `fade=t=in:st=0:d=0.6,fade=t=out:st=${(TOTAL - 1.4).toFixed(2)}:d=1.4`,
  ...COMMON, silentVideo])

// ── Audio: polished VO + music bed (user track or generated score) ───────────
// Cinematic VO chain: clean lows, body at 120Hz, presence at 3k, glue compression,
// a hint of space.
const VO_POLISH =
  'highpass=f=70,equalizer=f=120:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1.2:g=2,' +
  'acompressor=threshold=-20dB:ratio=3:attack=8:release=140:makeup=2,' +
  'aecho=0.7:0.25:110:0.14'

const MUSIC = existsSync(`${BUILD}/music.mp3`) ? `${BUILD}/music.mp3` : null
if (!MUSIC) {
  console.log('composing score (drop trailer-build/music.mp3 to use your own track instead)…')
  execFileSync('node', ['scripts/trailer/make-score.mjs'], { stdio: 'inherit' })
}
const BED = MUSIC || `${BUILD}/score.wav`

const inputs = []
const chains = []
const mixIn = []
placements.forEach((p, i) => {
  inputs.push('-i', vo[p.id].path)
  const delayMs = Math.round(p.at * 1000)
  chains.push(`[${i + 1}:a]aresample=48000,${VO_POLISH},pan=stereo|c0=c0|c1=c0,adelay=${delayMs}|${delayMs}[v${i}]`)
  mixIn.push(`[v${i}]`)
})
const bedIdx = placements.length + 1
inputs.push(...(MUSIC ? ['-stream_loop', '-1'] : []), '-i', BED)

let filter = chains.join(';')
filter += `;${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0,asplit=2[vo][voKey]`
const bedGain = MUSIC ? 'volume=0.13,' : 'volume=0.9,'
filter += `;[${bedIdx}:a]aresample=48000,${bedGain}afade=t=in:st=0:d=1.2,afade=t=out:st=${(TOTAL - 3).toFixed(2)}:d=3[bed]`
// Duck the bed under the narration
filter += `;[bed][voKey]sidechaincompress=threshold=0.05:ratio=5:attack=20:release=400:makeup=1[duck]`
filter += `;[vo][duck]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`

ff(['-i', silentVideo, ...inputs, '-filter_complex', filter, '-map', '0:v', '-map', '[out]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', TOTAL.toFixed(3), OUT])

console.log(`\ndone → ${OUT} (${probe(OUT).toFixed(1)}s)`)
