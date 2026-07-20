// Generate the trailer's AI accent shots with Seedance via the BytePlus ModelArk
// video-generation API → trailer-build/ai/*.mp4
//
// Usage:
//   ARK_API_KEY=... [ARK_VIDEO_MODEL=seedance-...] [ARK_BASE=https://ark.ap-southeast.bytepluses.com] \
//     node scripts/trailer/gen-seedance.mjs [--only opener,snap,closer]
//
// Each shot generates once; delete the output file to regenerate. Seed images
// (image-to-video) come from trailer-build/seeds/ — made by assemble.mjs --seeds.
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs'

const KEY = process.env.ARK_API_KEY
const BASE = process.env.ARK_BASE || 'https://ark.ap-southeast.bytepluses.com'
const MODEL = process.env.ARK_VIDEO_MODEL || 'seedance-1-0-pro-250528'
const ONLY = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null

const OUT_DIR = 'trailer-build/ai'
const SEED_DIR = 'trailer-build/seeds'

const SHOTS = [
  {
    name: 'opener', // S1 — chaos drift
    seed: `${SEED_DIR}/chaos.png`,
    prompt:
      'Dark void. Fragments of a software interface — mismatched blue buttons, inconsistent cards, ' +
      'clashing typography — float and slowly drift apart, glass-like, catching cold light. ' +
      'Moody, cinematic, shallow depth of field, slow camera drift. No text overlays. --duration 10 --ratio 16:9',
  },
  {
    name: 'snap', // S3 — order snaps into place
    seed: `${SEED_DIR}/grid.png`,
    prompt:
      'Scattered glass UI fragments accelerate and snap together into one perfectly aligned interface grid; ' +
      'a clean pulse of light radiates from the center on impact, then stillness. ' +
      'Precise, satisfying, cinematic, high contrast. No text overlays. --duration 5 --ratio 16:9',
  },
  {
    name: 'closer', // S11 — wordmark end-card
    seed: `${SEED_DIR}/wordmark.png`,
    prompt:
      'A glowing sphere of soft violet-blue light breathes gently beside elegant white wordmark typography ' +
      'on near-black; a subtle light sweep passes across, then everything settles to stillness. ' +
      'Premium tech brand end-card, very slow, calm. --duration 10 --ratio 16:9',
  },
]

if (!KEY) {
  console.error(
    'Missing ARK_API_KEY — skipping AI shots.\n' +
      'The trailer assembles with real-capture fallbacks (reel chaos/wordmark cards).\n' +
      'When you have the key:  ARK_API_KEY=... node scripts/trailer/gen-seedance.mjs  then re-run assemble.mjs.'
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
  if (!resp.ok) throw new Error(`ARK ${resp.status} ${path}: ${JSON.stringify(body).slice(0, 300)}`)
  return body
}

async function generate(shot) {
  const content = [{ type: 'text', text: shot.prompt }]
  if (shot.seed && existsSync(shot.seed)) {
    const b64 = readFileSync(shot.seed).toString('base64')
    content.push({ type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } })
    console.log(`  seeding from ${shot.seed}`)
  }
  const task = await ark('/api/v3/contents/generations/tasks', {
    method: 'POST',
    body: JSON.stringify({ model: MODEL, content }),
  })
  const id = task.id
  console.log(`  task ${id} queued`)
  for (let i = 0; i < 120; i++) {
    await sleep(5000)
    const status = await ark(`/api/v3/contents/generations/tasks/${id}`)
    if (status.status === 'succeeded') {
      const url = status.content?.video_url
      if (!url) throw new Error('succeeded but no video_url')
      const video = await fetch(url)
      if (!video.ok) throw new Error(`download ${video.status}`)
      return Buffer.from(await video.arrayBuffer())
    }
    if (status.status === 'failed') {
      throw new Error(`generation failed: ${JSON.stringify(status.error || status).slice(0, 300)}`)
    }
    if (i % 6 === 5) console.log(`  …still ${status.status}`)
  }
  throw new Error('timed out after 10 minutes')
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
  console.log(`generating ${shot.name}…`)
  try {
    writeFileSync(out, await generate(shot))
    console.log(`  saved ${out}`)
  } catch (err) {
    failed++
    console.error(`  FAILED ${shot.name}: ${err.message}`)
  }
}
process.exit(failed ? 1 : 0)
