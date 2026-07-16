// Bake every canned Da Vinci reply line to public/davinci/lines/*.wav (+ manifest.json)
// so deterministic replies play instantly (cached) in the realistic Gemini voice.
// The line list comes from src/composables/dvIntentData.ts — the SAME module the
// runtime handlers use, so baked text always matches the audio-cache key.
// (Node ≥23.6 runs the .ts import natively via type stripping.)
//
// Usage:
//   GEMINI_API_KEY=... node scripts/bake-lines.mjs [--force]
//   (voice via TTS_VOICE env, default Charon — matches replies; model via TTS_MODEL)
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const { listCannedSpeech } = await import('../src/composables/dvIntentData.ts')
const { DV_VOICE_STYLE, DV_VOICE_TEMPERATURE } = await import('../src/server/tts.ts')

const KEY = process.env.GEMINI_API_KEY
const VOICE = process.env.TTS_VOICE || 'Charon'
const MODEL = process.env.TTS_MODEL || 'gemini-3.1-flash-tts-preview'
const FORCE = process.argv.includes('--force')
const OUT_DIR = 'public/davinci/lines'
// The audition-locked pace: baked lines carry exactly 1.12× (live replies can't).
const ATEMPO = process.env.BAKE_ATEMPO || '1.12'

if (!KEY) {
  console.error('Missing GEMINI_API_KEY')
  process.exit(1)
}

/** Prepend a 44-byte PCM WAV header so browsers can decodeAudioData the raw L16 bytes. */
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
      contents: [{ parts: [{ text: `${DV_VOICE_STYLE}\n\n${text}` }] }],
      generationConfig: {
        temperature: DV_VOICE_TEMPERATURE,
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

/** Pitch-preserving pace correction to the audition-locked rate (requires ffmpeg). */
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

const lines = listCannedSpeech()
mkdirSync(OUT_DIR, { recursive: true })
const manifest = []
let baked = 0
let skipped = 0
for (let i = 0; i < lines.length; i++) {
  const text = lines[i]
  const file = `line-${String(i).padStart(2, '0')}.wav`
  const path = `${OUT_DIR}/${file}`
  manifest.push({ text, file })
  if (!FORCE && existsSync(path)) {
    skipped++
    continue
  }
  try {
    const wav = await synth(text)
    writeFileSync(path, Buffer.from(wav))
    baked++
    console.log(`baked ${file} (${wav.length}B) — "${text.slice(0, 70)}${text.length > 70 ? '…' : ''}"`)
  } catch (err) {
    console.error(`FAILED ${file}: ${err.message}`)
    process.exitCode = 1
  }
}
writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2))
console.log(`\n${lines.length} lines → ${baked} baked, ${skipped} skipped (exists). Manifest: ${OUT_DIR}/manifest.json`)
console.log('Re-run with --force after editing templates/data in dvIntentData.ts.')
