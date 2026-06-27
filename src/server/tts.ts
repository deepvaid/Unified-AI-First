// Server-only TTS synthesis (OpenAI). Imported ONLY by the Vercel function
// (api/tts.ts) and the Vite dev middleware — never by client code, so it never
// enters the browser bundle and the API key never reaches the client. The key is
// passed in by the (Node) caller so this module needs no process/node types.

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

const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech'

/** Synthesize speech via OpenAI tts-1 → mp3 bytes. Throws TtsError with an HTTP status. */
export async function synthesize(text: string, opts: SynthesisOptions): Promise<SynthesisResult> {
  if (!opts.apiKey) throw new TtsError(503, 'TTS not configured (missing OPENAI_API_KEY)')
  const clean = (text ?? '').trim().slice(0, 4000) // OpenAI cap is 4096 chars
  if (!clean) throw new TtsError(400, 'Empty text')

  const voice = opts.voice || 'nova'
  const model = opts.model || 'tts-1' // cost-effective, low latency

  let resp: Response
  try {
    resp = await fetch(OPENAI_SPEECH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: clean, voice, response_format: 'mp3' }),
    })
  } catch (err) {
    throw new TtsError(502, `TTS upstream unreachable: ${err instanceof Error ? err.message : 'fetch failed'}`)
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '')
    throw new TtsError(502, `TTS provider error ${resp.status}: ${detail.slice(0, 300)}`)
  }
  return { audio: new Uint8Array(await resp.arrayBuffer()), contentType: 'audio/mpeg' }
}
