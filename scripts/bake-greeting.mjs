// Bake the pre-recorded Da Vinci greeting to public/davinci/greeting.wav so it
// plays instantly (cached) in the realistic Gemini voice. Re-run when the demo
// name, greeting text, or voice changes.
//
// Usage:
//   GEMINI_API_KEY=... node scripts/bake-greeting.mjs ["greeting text"] [outPath]
//   (voice via TTS_VOICE env, default Charon — male; model via TTS_MODEL)
import { writeFileSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname } from 'node:path'
import { execFileSync } from 'node:child_process'

const { DV_VOICE_STYLE, DV_VOICE_TEMPERATURE } = await import('../src/server/tts.ts')

const KEY = process.env.GEMINI_API_KEY
const VOICE = process.env.TTS_VOICE || 'Charon'
const MODEL = process.env.TTS_MODEL || 'gemini-3.1-flash-tts-preview'
// Must match DaVinciExperience.vue's greetingText for the demo user (the text is the audio-cache key).
const TEXT = process.argv[2] || "Hi Ross — welcome to Maropost. I'm Da Vinci, your guide."
const OUT = process.argv[3] || 'public/davinci/greeting.wav'
// The audition-locked pace (pitch-preserving, applied via ffmpeg post-step).
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

const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
  method: 'POST',
  headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: `${DV_VOICE_STYLE}\n\n${TEXT}` }] }],
    generationConfig: {
      temperature: DV_VOICE_TEMPERATURE,
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
    },
  }),
})
if (!resp.ok) {
  console.error('TTS failed', resp.status, (await resp.text()).slice(0, 300))
  process.exit(1)
}
const data = await resp.json()
const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
const b64 = part?.inlineData?.data
if (!b64) {
  console.error('No audio returned')
  process.exit(1)
}
const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || '')?.[1]) || 24000
const pcm = new Uint8Array(Buffer.from(b64, 'base64'))
const wav = pcmToWav(pcm, rate)
mkdirSync(dirname(OUT), { recursive: true })
// Pitch-preserving pace correction to the audition-locked rate (requires ffmpeg).
const tmp = `${OUT}.raw.wav`
writeFileSync(tmp, Buffer.from(wav))
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-af', `atempo=${ATEMPO}`, OUT])
unlinkSync(tmp)
const bytes = readFileSync(OUT).length
console.log(`Baked ${OUT} — voice=${VOICE} rate=${rate} atempo=${ATEMPO} bytes=${bytes} text="${TEXT}"`)
