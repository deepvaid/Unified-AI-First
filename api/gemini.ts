// Vercel serverless function: POST /api/gemini { text, history? } → { reply, speech, card? }.
// Keeps GEMINI_API_KEY server-side (Vercel env var), so the key is never shipped
// to the browser. Mirrored by a Vite dev middleware (vite.config.ts) for local dev.
import { generateReply, GeminiError, type GeminiTurn } from '../src/server/gemini.js'

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
    const { text, history, context, mode } = (await readJson(req)) as {
      text?: string
      history?: GeminiTurn[]
      context?: string
      mode?: string
    }
    const result = await generateReply(text ?? '', {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
      history,
      context: typeof context === 'string' ? context : undefined,
      mode: mode === 'design-system' ? 'design-system' : 'default',
    })
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(result))
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : 500
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'gemini failed' }))
  }
}
