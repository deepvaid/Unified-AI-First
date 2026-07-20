// Generate the trailer's AI accent shots with Seedance via the BytePlus ModelArk
// video-generation API → trailer-build/ai/*.mp4
//
// Usage:
//   node scripts/trailer/gen-seedance.mjs [--only opener,snap,closer]
//   (ARK_API_KEY from env or .env.local; ARK_VIDEO_MODEL / ARK_BASE to override)
//
// Each shot generates once; delete the output file to regenerate. Seed images
// (image-to-video first frames) come from trailer-build/seeds/.
import './env.mjs'
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'

const KEY = process.env.ARK_API_KEY
const BASE = process.env.ARK_BASE || 'https://ark.ap-southeast.bytepluses.com'
// First candidate that the account has enabled wins (404/model-not-found → next).
const MODEL_CANDIDATES = process.env.ARK_VIDEO_MODEL
  ? [process.env.ARK_VIDEO_MODEL]
  : ['dreamina-seedance-2-0-260128', 'seedance-1-0-pro-250528']
const ONLY = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null

const OUT_DIR = 'trailer-build/ai'
const SEED_DIR = 'trailer-build/seeds'

const SHOTS = [
  {
    name: 'opener', // S1 — chaos drift
    duration: 10,
    seed: `${SEED_DIR}/chaos.png`,
    prompt:
      'Dark void. Fragments of a software interface — mismatched blue buttons, inconsistent cards, ' +
      'clashing typography — float and slowly drift apart, glass-like, catching cold light. ' +
      'Moody, cinematic, shallow depth of field, slow camera drift. No text overlays.',
  },
  {
    name: 'snap', // S3 — order snaps into place
    duration: 5,
    seed: `${SEED_DIR}/grid.png`,
    prompt:
      'Scattered glass UI fragments accelerate and snap together into one perfectly aligned interface grid; ' +
      'a clean pulse of light radiates from the center on impact, then stillness. ' +
      'Precise, satisfying, cinematic, high contrast. No text overlays.',
  },
  {
    name: 'closer', // S11 — wordmark end-card
    duration: 10,
    seed: `${SEED_DIR}/wordmark.png`,
    prompt:
      'A glowing sphere of soft violet-blue light breathes gently beside elegant white wordmark typography ' +
      'on near-black; a subtle light sweep passes across, then everything settles to stillness. ' +
      'Premium tech brand end-card, very slow, calm.',
  },
]

if (!KEY) {
  console.error(
    'Missing ARK_API_KEY — skipping AI shots.\n' +
      'The trailer assembles with real-capture fallbacks (reel chaos/wordmark cards).\n' +
      'Add ARK_API_KEY=... to .env.local, run this script, then re-run assemble.mjs.'
  )
  process.exit(2)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function ark(path, init = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const body = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const err = new Error(`ARK ${resp.status} ${path}: ${JSON.stringify(body).slice(0, 300)}`)
    err.status = resp.status
    err.code = body?.error?.code || ''
    throw err
  }
  return body
}

let model = null
async function resolveModel(shot) {
  // Probe candidates with the real first request; remember the winner.
  const errors = []
  for (const candidate of MODEL_CANDIDATES) {
    try {
      const task = await createTask(candidate, shot)
      model = candidate
      console.log(`  model: ${candidate}`)
      return task
    } catch (err) {
      if (err.status === 404 || /model/i.test(err.code)) {
        errors.push(`${candidate}: ${err.message}`)
        continue
      }
      throw err
    }
  }
  throw new Error(
    `No candidate model enabled on this account.\n  ${errors.join('\n  ')}\n` +
      'Check the model ID in your BytePlus ModelArk console and set ARK_VIDEO_MODEL=... in .env.local.'
  )
}

function createTask(modelId, shot) {
  const content = [{ type: 'text', text: shot.prompt }]
  if (shot.seed && existsSync(shot.seed)) {
    const b64 = readFileSync(shot.seed).toString('base64')
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${b64}` },
      role: 'first_frame',
    })
  }
  return ark('/api/v3/contents/generations/tasks', {
    method: 'POST',
    body: JSON.stringify({
      model: modelId,
      content,
      ratio: '16:9',
      resolution: '1080p',
      duration: shot.duration,
      watermark: false,
      generate_audio: false,
    }),
  })
}

async function generate(shot) {
  if (shot.seed && existsSync(shot.seed)) console.log(`  seeding first frame from ${shot.seed}`)
  const task = model ? await createTask(model, shot) : await resolveModel(shot)
  const id = task.id
  console.log(`  task ${id} queued`)
  for (let i = 0; i < 180; i++) {
    await sleep(5000)
    const s = await ark(`/api/v3/contents/generations/tasks/${id}`)
    const status = s.status || s.task_status
    if (status === 'succeeded') {
      const url = s.content?.video_url
      if (!url) throw new Error(`succeeded but no video_url: ${JSON.stringify(s).slice(0, 300)}`)
      const video = await fetch(url)
      if (!video.ok) throw new Error(`download ${video.status}`)
      return Buffer.from(await video.arrayBuffer())
    }
    if (status === 'failed' || status === 'cancelled') {
      throw new Error(`generation ${status}: ${JSON.stringify(s.error || s).slice(0, 300)}`)
    }
    if (i % 6 === 5) console.log(`  …still ${status}`)
  }
  throw new Error('timed out after 15 minutes')
}

mkdirSync(OUT_DIR, { recursive: true })
let failed = 0
for (const shot of SHOTS) {
  if (ONLY && !ONLY.includes(shot.name)) continue
  const out = `${OUT_DIR}/${shot.name}.mp4`
  if (existsSync(out)) {
    console.log(`exists ${out} — delete to regenerate`)
    continue
  }
  console.log(`generating ${shot.name} (${shot.duration}s)…`)
  try {
    writeFileSync(out, await generate(shot))
    console.log(`  saved ${out}`)
  } catch (err) {
    failed++
    console.error(`  FAILED ${shot.name}: ${err.message}`)
  }
}
process.exit(failed ? 1 : 0)
