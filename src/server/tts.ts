// Server-only TTS synthesis (Google Gemini TTS). Imported ONLY by the Vercel
// function (api/tts.ts) and the Vite dev middleware — never by client code, so it
// never enters the browser bundle and the API key never reaches the client. The
// key is passed in by the (Node) caller. Mirrors src/server/gemini.ts.
//
// Gemini TTS (`:generateContent` with responseModalities:['AUDIO']) returns raw
// headerless PCM (audio/L16, 24kHz, mono, 16-bit LE). Browsers' decodeAudioData
// needs a container, so we WAV-wrap server-side and return audio/wav.

export class TtsError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'TtsError'
    this.status = status
  }
}

export interface SynthesisOptions {
  apiKey: string | undefined
  voice?: string
  model?: string
}

export interface SynthesisResult {
  audio: Uint8Array
  contentType: string
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/** Decode base64 → bytes without Node's Buffer (this module compiles under the app's
 *  browser tsconfig; atob is a standard global available in Node 16+ and browsers). */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Prepend a 44-byte PCM WAV header so browsers can decodeAudioData the raw L16 bytes. */
function pcmToWav(pcm: Uint8Array, sampleRate: number): Uint8Array {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const out = new Uint8Array(44 + pcm.length)
  const dv = new DataView(out.buffer)
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  dv.setUint32(4, 36 + pcm.length, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  dv.setUint32(16, 16, true) // PCM fmt chunk size
  dv.setUint16(20, 1, true) // audioFormat = PCM
  dv.setUint16(22, numChannels, true)
  dv.setUint32(24, sampleRate, true)
  dv.setUint32(28, byteRate, true)
  dv.setUint16(32, blockAlign, true)
  dv.setUint16(34, bitsPerSample, true)
  writeStr(36, 'data')
  dv.setUint32(40, pcm.length, true)
  out.set(pcm, 44)
  return out
}

/** Synthesize speech via Gemini TTS → WAV bytes. Throws TtsError with an HTTP status. */
export async function synthesize(text: string, opts: SynthesisOptions): Promise<SynthesisResult> {
  if (!opts.apiKey) throw new TtsError(503, 'TTS not configured (missing GEMINI_API_KEY)')
  const clean = (text ?? '').trim().slice(0, 2000)
  if (!clean) throw new TtsError(400, 'Empty text')

  const voice = opts.voice || 'Charon' // male; one of Gemini's 30 prebuilt voices
  const model = opts.model || 'gemini-3.1-flash-tts-preview'

  const body = {
    contents: [{ parts: [{ text: clean }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  }

  let resp: Response
  try {
    resp = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': opts.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new TtsError(502, `TTS upstream unreachable: ${err instanceof Error ? err.message : 'fetch failed'}`)
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '')
    throw new TtsError(502, `TTS provider error ${resp.status}: ${detail.slice(0, 300)}`)
  }

  const data = (await resp.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>
  } | null
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
  const b64 = part?.inlineData?.data
  if (!b64) throw new TtsError(502, 'TTS returned no audio')

  const mime = part?.inlineData?.mimeType ?? ''
  const rate = Number(/rate=(\d+)/.exec(mime)?.[1]) || 24000
  return { audio: pcmToWav(base64ToBytes(b64), rate), contentType: 'audio/wav' }
}

/** PCM sample rate of Gemini TTS audio (audio/L16 mono). Client plays raw PCM at this rate. */
export const TTS_PCM_RATE = 24000

/**
 * Streaming synthesis — yields raw PCM (L16 24kHz mono LE) chunks as Gemini produces them
 * via `:streamGenerateContent` (SSE). First chunk arrives ~1.8s vs ~5s for the full clip, so
 * the client can start playing much sooner. Throws TtsError (503/400/502) before the first
 * yield if the request can't start; mid-stream failures just end the generator.
 */
export async function* synthesizeStream(text: string, opts: SynthesisOptions): AsyncGenerator<Uint8Array> {
  if (!opts.apiKey) throw new TtsError(503, 'TTS not configured (missing GEMINI_API_KEY)')
  const clean = (text ?? '').trim().slice(0, 2000)
  if (!clean) throw new TtsError(400, 'Empty text')

  const voice = opts.voice || 'Charon'
  const model = opts.model || 'gemini-3.1-flash-tts-preview'
  const body = {
    contents: [{ parts: [{ text: clean }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  }

  let resp: Response
  try {
    resp = await fetch(`${GEMINI_BASE}/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'x-goog-api-key': opts.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new TtsError(502, `TTS upstream unreachable: ${err instanceof Error ? err.message : 'fetch failed'}`)
  }
  if (!resp.ok || !resp.body) {
    const detail = resp.body ? await resp.text().catch(() => '') : ''
    throw new TtsError(502, `TTS provider error ${resp.status}: ${detail.slice(0, 200)}`)
  }

  // Parse SSE `data: {json}` lines; each carries a base64 PCM chunk in inlineData.data.
  const parseLine = (line: string): Uint8Array | null => {
    const m = /^data:\s*(.*)$/s.exec(line)
    const payload = m?.[1]?.trim()
    if (!payload) return null
    try {
      const j = JSON.parse(payload) as {
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>
      }
      const d = j?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
      return d ? base64ToBytes(d) : null
    } catch {
      return null
    }
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let nl: number
    while ((nl = buf.indexOf('\n')) >= 0) {
      const pcm = parseLine(buf.slice(0, nl))
      buf = buf.slice(nl + 1)
      if (pcm && pcm.length) yield pcm
    }
  }
  if (buf.trim()) {
    const pcm = parseLine(buf)
    if (pcm && pcm.length) yield pcm
  }
}
