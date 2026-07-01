// Vercel serverless function: POST /api/tts { text, voice?, model? } → audio/wav.
// Synthesizes via Gemini TTS, keeping GEMINI_API_KEY server-side (Vercel env var) so
// the key is never shipped to the browser. Mirrored by a Vite dev middleware for local dev.
import { synthesize, synthesizeStream, TtsError } from '../src/server/tts.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readJson(req: any): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
  }
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }
  try {
    const { text, voice, model, stream } = (await readJson(req)) as {
      text?: string
      voice?: string
      model?: string
      stream?: boolean
    }
    const opts = {
      apiKey: process.env.GEMINI_API_KEY,
      voice: voice ?? process.env.TTS_VOICE,
      model: model ?? process.env.TTS_MODEL,
    }

    // Streaming path: pipe raw PCM (audio/L16 24kHz mono) as Gemini produces it, so the
    // client starts playing at the first chunk (~1.8s) instead of the full clip (~5s).
    if (stream) {
      let started = false
      try {
        for await (const chunk of synthesizeStream(text ?? '', opts)) {
          if (!started) {
            started = true
            res.statusCode = 200
            res.setHeader('Content-Type', 'audio/l16; rate=24000')
            res.setHeader('Cache-Control', 'no-store')
          }
          res.write(Buffer.from(chunk))
        }
      } catch (err) {
        if (!started) {
          res.statusCode = err instanceof TtsError ? err.status : 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'tts failed' }))
          return
        }
        // headers already flushed mid-stream — nothing to do but end
      }
      if (!started) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'TTS returned no audio' }))
        return
      }
      res.end()
      return
    }

    const { audio, contentType } = await synthesize(text ?? '', opts)
    res.statusCode = 200
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-store')
    res.end(Buffer.from(audio))
  } catch (err) {
    const status = err instanceof TtsError ? err.status : 500
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'tts failed' }))
  }
}
