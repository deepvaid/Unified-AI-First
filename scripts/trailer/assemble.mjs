// Assemble the design-system trailer → trailer-build/maropost-design-system-trailer-75s.mp4
//
// Scene lengths are driven by the baked VO durations (trailer-build/vo/manifest.json).
// Visuals come from trailer-build/captures/ (Playwright recordings); the three AI
// accent shots use trailer-build/ai/*.mp4 when present, otherwise real-capture
// fallbacks (reel chaos/wordmark cards). Optional music bed: trailer-build/music.mp3.
//
// Usage: node scripts/trailer/assemble.mjs
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const BUILD = 'trailer-build'
const CAPS = `${BUILD}/captures`
const AI = `${BUILD}/ai`
const WORK = `${BUILD}/.work`
const OUT = `${BUILD}/maropost-design-system-trailer-75s.mp4`

const FPS = 24
const W = 1920
const H = 1080

// Seconds of scripted "action tail" at the end of each capture (the last sleep in
// capture.mjs) — animation start = capture duration − tail. Keep in sync.
const TAIL = {
  'reel-chaos-snap': 12,
  'reel-type-before': 9,
  'reel-type-after': 8,
  'reel-stats': 9,
  'reel-wordmark': 9,
  'showcase-hero': 13,
  'showcase-stats': 9,
  orders: 7,
  'dashboard-light': 9,
  'dashboard-dark': 9,
  'journey-builder': 8,
  'davinci-orb': 8,
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
  { id: 's04', vo: 's04', visual: { src: 'showcase-hero', from: 0, zoom: true } },
  { id: 's05', vo: 's05', visual: { src: 'showcase-stats', from: 0, zoom: true } },
  { id: 's06', vo: 's06', montage: ['orders', 'dashboard-light', 'journey-builder'] },
  { id: 's07', vo: 's07', flip: true },
  { id: 's08', vo: 's08', visual: { src: 'davinci-orb', from: 0.5 } },
  { id: 's09', vo: 's09', visual: { src: 'reel-stats', from: 0 } },
  { id: 's10', vo: 's10', visual: { src: 'reel-type-after', from: 0 } },
  { id: 's11', vo: 's11', min: 7.5, ai: ai('closer'), fallback: { src: 'reel-wordmark', from: 0 } },
]

const durOf = (s) => (s.vo ? Math.max(vo[s.vo].dur + PAD, s.min || 0) : s.dur)

const COMMON = ['-r', String(FPS), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-an']
const ZOOM =
  `scale=${W * 2}:${H * 2},zoompan=z='min(1+0.0009*in,1.09)':d=1:` +
  `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`
const BASE_VF = `fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
  `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p`

/** Cut a segment from a capture (relative to its animation start). */
function cutCapture(name, relFrom, dur, out, { zoom = false } = {}) {
  const start = animStart(name) + relFrom
  const avail = probe(`${CAPS}/${name}.mp4`) - start
  const pad = Math.max(0, dur - avail + 0.05)
  const vf = [BASE_VF, zoom ? ZOOM : null, pad > 0 ? `tpad=stop_mode=clone:stop_duration=${pad.toFixed(2)}` : null]
    .filter(Boolean)
    .join(',')
  ff(['-ss', start.toFixed(3), '-i', `${CAPS}/${name}.mp4`, '-t', (dur + (pad > 0 ? pad : 0)).toFixed(3), '-vf', vf, ...COMMON, '-t', dur.toFixed(3), out])
}

/** Use an AI clip, scaled/padded and length-fitted (freeze last frame if short). */
function cutAi(path, dur, out) {
  const avail = probe(path)
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

  if (scene.ai) {
    cutAi(scene.ai, dur, out)
  } else if (scene.fallback?.slowmo) {
    cutSlowmo(scene.fallback.src, scene.fallback.slowmo, dur, out)
  } else if (scene.fallback) {
    cutCapture(scene.fallback.src, scene.fallback.from, dur, out)
  } else if (scene.montage) {
    const per = dur / scene.montage.length
    const parts = scene.montage.map((name, i) => {
      const p = `${WORK}/${scene.id}-${i}.mp4`
      cutCapture(name, 0, per, p, { zoom: true })
      return p
    })
    const list = `${WORK}/${scene.id}-list.txt`
    writeFileSync(list, parts.map((p) => `file '${p.split('/').pop()}'`).join('\n'))
    ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out])
  } else if (scene.flip) {
    // light → dark crossfade on the dashboard; reuse a later slice of the light capture
    const half = dur / 2
    const a = `${WORK}/${scene.id}-a.mp4`
    const b = `${WORK}/${scene.id}-b.mp4`
    cutCapture('dashboard-light', 4.3, half + 0.6, a)
    cutCapture('dashboard-dark', 0, dur - half + 0.6, b)
    ff(['-i', a, '-i', b, '-filter_complex',
      `[0:v][1:v]xfade=transition=fade:duration=1.0:offset=${(half - 0.4).toFixed(2)},fps=${FPS},format=yuv420p[v]`,
      '-map', '[v]', ...COMMON, '-t', dur.toFixed(3), out])
  } else {
    cutCapture(scene.visual.src, scene.visual.from, dur, out, { zoom: scene.visual.zoom })
  }
  clips.push(out)
  console.log(`scene ${scene.id}  ${dur.toFixed(2)}s  @${sceneStarts[scene.id].toFixed(2)}s`)
}

const TOTAL = t
console.log(`\ntotal ${TOTAL.toFixed(1)}s — concatenating…`)

// ── Video concat + global fades ───────────────────────────────────────────────
const listFile = `${WORK}/all.txt`
writeFileSync(listFile, clips.map((p) => `file '${p.split('/').pop()}'`).join('\n'))
const silentVideo = `${WORK}/video.mp4`
ff(['-f', 'concat', '-safe', '0', '-i', listFile, '-vf',
  `fade=t=in:st=0:d=0.6,fade=t=out:st=${(TOTAL - 1.4).toFixed(2)}:d=1.4`,
  ...COMMON, silentVideo])

// ── Audio: VO lines at scene starts (+ optional music bed) ────────────────────
const voScenes = SCENES.filter((s) => s.vo)
const inputs = []
const chains = []
const mixIn = []
voScenes.forEach((s, i) => {
  inputs.push('-i', vo[s.vo].path)
  const delayMs = Math.round((sceneStarts[s.id] + 0.35) * 1000)
  // input 0 is the (silent) video — audio inputs start at 1
  chains.push(`[${i + 1}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay=${delayMs}|${delayMs}[v${i}]`)
  mixIn.push(`[v${i}]`)
})
let filter = chains.join(';') + `;${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0[vo]`
let mapOut = '[vo]'
const MUSIC = `${BUILD}/music.mp3`
if (existsSync(MUSIC)) {
  inputs.push('-stream_loop', '-1', '-i', MUSIC)
  filter += `;[${voScenes.length + 1}:a]aresample=48000,volume=0.13,afade=t=in:st=0:d=1.5,afade=t=out:st=${(TOTAL - 3).toFixed(2)}:d=3[mus]`
  filter += `;[vo][mus]amix=inputs=2:normalize=0[mix]`
  mapOut = '[mix]'
  console.log('music bed: trailer-build/music.mp3')
} else {
  console.log('no music.mp3 — voiceover-only mix (drop a track at trailer-build/music.mp3 and re-run)')
}
filter += `;${mapOut}loudnorm=I=-16:TP=-1.5:LRA=11[out]`

ff(['-i', silentVideo, ...inputs, '-filter_complex', filter, '-map', '0:v', '-map', '[out]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', TOTAL.toFixed(3), OUT])

console.log(`\ndone → ${OUT} (${probe(OUT).toFixed(1)}s)`)
