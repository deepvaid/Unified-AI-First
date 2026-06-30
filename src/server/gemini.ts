// Server-only Gemini Flash chat (Google Generative Language API). Imported ONLY
// by the Vercel function (api/gemini.ts) and the Vite dev middleware — never by
// client code, so it never enters the browser bundle and the API key never
// reaches the client. The key is passed in by the (Node) caller so this module
// needs no process/node types. Mirrors src/server/tts.ts.

export class GeminiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'GeminiError'
    this.status = status
  }
}

export interface GeminiTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface GenerateOptions {
  apiKey: string | undefined
  model?: string
  history?: GeminiTurn[]
}

export interface GeminiReply {
  reply: string
  speech: string
  card?: { headline: string; description: string; severity?: 'info' | 'success' | 'warning' | 'error' }
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_INSTRUCTION = `You are Da Vinci, the AI assistant inside Maropost — a commerce + marketing platform for online merchants (think Shopify meets Mailchimp).

Maropost already handles four actions for the merchant through dedicated flows: running email campaigns, drafting product descriptions, reporting revenue, and building audience segments. You are NOT handling those — you are answering everything else: open-ended marketing/commerce questions, advice, explanations, and brainstorming.

Be a sharp, practical e-commerce growth expert. Give concise, confident, voice-friendly answers. Never invent specific numbers about this merchant's store (orders, revenue, contact counts) — speak in general best-practice terms, and when relevant, point them to the matching Maropost action (campaign, product copy, revenue report, or segment builder).

Respond ONLY with the JSON object defined by the response schema:
- "reply": the answer for the chat bubble. 1–4 short sentences. Plain text, no markdown.
- "speech": a shorter spoken version of the reply (one sentence, natural to hear aloud).
- "card": OPTIONAL. Include only when a single takeaway is worth highlighting — a short "headline" and one-sentence "description". Omit it otherwise.`

/** Generate a smart open-ended reply via Gemini Flash. Throws GeminiError with an HTTP status. */
export async function generateReply(text: string, opts: GenerateOptions): Promise<GeminiReply> {
  if (!opts.apiKey) throw new GeminiError(503, 'Gemini not configured (missing GEMINI_API_KEY)')
  const clean = (text ?? '').trim().slice(0, 2000)
  if (!clean) throw new GeminiError(400, 'Empty text')

  const model = opts.model || 'gemini-3.1-flash-lite'

  // Trim history to the last 6 turns and map roles to Gemini's ('model' for assistant).
  const history = (opts.history ?? [])
    .filter((t) => t && typeof t.text === 'string' && t.text.trim())
    .slice(-6)
    .map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text.slice(0, 2000) }] }))

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [...history, { role: 'user', parts: [{ text: clean }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
      // Disable extended "thinking" — for 1-4 sentence conversational replies it adds
      // ~1-4s of latency (and billed thinking tokens) with no quality gain. Biggest
      // latency win for the voice copilot. Honored on the 3.x Flash-Lite line.
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          speech: { type: 'string' },
          card: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
            },
            required: ['headline', 'description'],
          },
        },
        required: ['reply', 'speech'],
      },
    },
  }

  let resp: Response
  try {
    resp = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': opts.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new GeminiError(502, `Gemini upstream unreachable: ${err instanceof Error ? err.message : 'fetch failed'}`)
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '')
    throw new GeminiError(502, `Gemini provider error ${resp.status}: ${detail.slice(0, 300)}`)
  }

  const data = (await resp.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  } | null
  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!raw.trim()) throw new GeminiError(502, 'Gemini returned no content')

  // responseMimeType is JSON, so the text should parse — but degrade gracefully
  // to treating the whole string as the reply if the model ever returns prose.
  let parsed: Partial<GeminiReply>
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = { reply: raw.trim() }
  }

  const reply = (parsed.reply ?? '').trim() || raw.trim()
  const speech = (parsed.speech ?? '').trim() || reply
  const card =
    parsed.card && parsed.card.headline && parsed.card.description
      ? {
          headline: parsed.card.headline,
          description: parsed.card.description,
          severity: parsed.card.severity,
        }
      : undefined

  return { reply, speech, card }
}
