// Bake the design-system trailer voiceover to trailer-build/vo/*.wav (+ manifest.json
// with measured durations). Same Gemini TTS pipeline as scripts/bake-lines.mjs, but
// with a cinematic narration style instead of the Da Vinci assistant style.
//
// Usage:
//   GEMINI_API_KEY=... node scripts/trailer/bake-vo.mjs [--force]
//   (voice via TTS_VOICE env, default Charon; model via TTS_MODEL; pace via VO_ATEMPO)
import './env.mjs'
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const KEY = process.env.GEMINI_API_KEY
const VOICE = process.env.TTS_VOICE || 'Charon'
const MODEL = process.env.TTS_MODEL || 'gemini-3.1-flash-tts-preview'
const FORCE = process.argv.includes('--force')
const OUT_DIR = 'trailer-build/vo'
// Brisk trailer pace (slightly above the chat voice's 1.12).
const ATEMPO = process.env.VO_ATEMPO || '1.12'

const STYLE =
  'You are the narrator of a fast, modern product trailer. Energetic, confident, brisk — ' +
  'forward momentum in every line, punchy delivery, never shouty or salesy. Keep pauses tight. ' +
  'Say exactly the line below, nothing else.'

// Scene VO lines. s02 is intentionally silent (kinetic type carries it).
const LINES = [
  ['s01', 'This is how the product looked for years. Every screen its own era… every flow its own rules.'],
  ['s03', 'So we rebuilt the language.'],
  ['s04', 'MaroBase. One design system — running as a real product. Not mock-ups… live code.'],
  ['s05', 'Eighty-nine components. A hundred and seventy-one screens. One source of truth.'],
  ['s06', 'Orders. Journeys. Contacts. Settings. Every flow rebuilt on the same foundations — in a working sandbox you can click today.'],
  ['s07', 'Light or dark. One flip.'],
  ['s08', 'Even Da Vinci speaks it.'],
  ['s09', "This isn't a deck. It runs."],
  ['s10', 'One system. Every screen.'],
  ['s11', 'MaroBase — the Maropost design system.'],
]

if (!KEY) {
  console.error('Missing GEMINI_API_KEY')
  process.exit(1)
}

/** Prepend a 44-byte PCM WAV header so ffmpeg/browsers can decode the raw L16 bytes. */
function pcmToWav(pcm, sampleRate) {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const out = new Uint8Array(44 + pcm.length)
  const dv = new DataView(out.buffer)
  const w = (off, s) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  w(0, 'RIFF')
  dv.setUint32(4, 36 + pcm.length, true)
  w(8, 'WAVE')
  w(12, 'fmt ')
  dv.setUint32(16, 16, true)
  dv.setUint16(20, 1, true)
  dv.setUint16(22, numChannels, true)
  dv.setUint32(24, sampleRate, true)
  dv.setUint32(28, byteRate, true)
  dv.setUint16(32, blockAlign, true)
  dv.setUint16(34, bitsPerSample, true)
  w(36, 'data')
  dv.setUint32(40, pcm.length, true)
  out.set(pcm, 44)
  return out
}

async function synth(text) {
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE}\n\n${text}` }] }],
      generationConfig: {
        temperature: 1.05,
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
      },
    }),
  })
  if (!resp.ok) throw new Error(`TTS ${resp.status}: ${(await resp.text()).slice(0, 200)}`)
  const data = await resp.json()
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
  if (!part) throw new Error('No audio returned')
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || '')?.[1]) || 24000
  return retime(pcmToWav(new Uint8Array(Buffer.from(part.inlineData.data, 'base64')), rate))
}

/** Pitch-preserving pace correction (requires ffmpeg). */
function retime(wav) {
  const tmpIn = `${OUT_DIR}/.retime-in.wav`
  const tmpOut = `${OUT_DIR}/.retime-out.wav`
  writeFileSync(tmpIn, Buffer.from(wav))
  try {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', tmpIn, '-af', `atempo=${ATEMPO}`, tmpOut])
    return new Uint8Array(readFileSync(tmpOut))
  } finally {
    for (const f of [tmpIn, tmpOut]) {
      try {
        unlinkSync(f)
      } catch {
        /* noop */
      }
    }
  }
}

function durationOf(path) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path,
  ])
  return Number(String(out).trim())
}

mkdirSync(OUT_DIR, { recursive: true })
const manifest = []
let baked = 0
for (const [id, text] of LINES) {
  const path = `${OUT_DIR}/${id}.wav`
  if (!FORCE && existsSync(path)) {
    manifest.push({ id, text, file: `${id}.wav`, duration: durationOf(path) })
    continue
  }
  try {
    const wav = await synth(text)
    writeFileSync(path, Buffer.from(wav))
    baked++
    const duration = durationOf(path)
    manifest.push({ id, text, file: `${id}.wav`, duration })
    console.log(`baked ${id}.wav (${duration.toFixed(2)}s) — "${text.slice(0, 70)}${text.length > 70 ? '…' : ''}"`)
  } catch (err) {
    console.error(`FAILED ${id}: ${err.message}`)
    process.exitCode = 1
  }
}
writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2))
const total = manifest.reduce((s, m) => s + m.duration, 0)
console.log(`\n${LINES.length} lines → ${baked} baked. Spoken total ${total.toFixed(1)}s. Manifest: ${OUT_DIR}/manifest.json`)
