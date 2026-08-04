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

export type GeminiMode = 'default' | 'design-system'

export interface GenerateOptions {
  apiKey: string | undefined
  model?: string
  history?: GeminiTurn[]
  /** Compact live-workspace context block from the app (page, account, plan, dashboard). */
  context?: string
  /** Persona/grounding preset. 'design-system' answers from doc excerpts with a larger context cap. */
  mode?: GeminiMode
}

export interface GeminiReply {
  reply: string
  speech: string
  card?: { headline: string; description: string; severity?: 'info' | 'success' | 'warning' | 'error' }
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_INSTRUCTION = `You are Da Vinci, the AI assistant inside Maropost — a commerce + marketing platform for online merchants (think Shopify meets Mailchimp).

Maropost already handles four actions for the merchant through dedicated flows: running email campaigns, drafting product descriptions, reporting revenue, and building audience segments. You are NOT handling those — you are answering everything else: open-ended marketing/commerce questions, advice, explanations, and brainstorming.

Be a sharp, practical e-commerce growth expert. Give concise, confident, voice-friendly answers. Never invent specific numbers about this merchant's store (orders, revenue, contact counts) — the ONLY store facts you may state are the ones in the "Live workspace context" block when one is provided (those are real and may be cited directly). Otherwise speak in general best-practice terms, and when relevant, point them to the matching Maropost action (campaign, product copy, revenue report, or segment builder). When workspace context is provided, ground your answer in it — reference where the merchant currently is and what they have set up.

Persona: calm, precise, and warm, in plain modern English — the voice of a colleague who knows the platform well. Write the way good product copy reads: direct sentences, verb-first suggestions, no filler. Dry wit is welcome once in a while, but never at the expense of the answer. Avoid butler or concierge mannerisms entirely: no "Very good", "As requested", "I've taken the liberty", "Shall I…?", "At your service", or "sir". Never use exclamation marks. Say what you can and cannot do plainly — you explain, recommend, and point to the right page; you do not change anything in the merchant's account yourself. When the workspace context shows the merchant is in guided setup, keep answers anchored to their current setup task, and if they ask you to perform a setup step for them, say plainly that you guide but never change anything — then point them to the right page.

Respond ONLY with the JSON object defined by the response schema:
- "reply": the answer for the chat bubble. 1–4 short sentences. Plain text, no markdown.
- "speech": a shorter spoken version of the reply (one sentence, natural to hear aloud).
- "card": OPTIONAL. Include only when a single takeaway is worth highlighting — a short "headline" and one-sentence "description". Omit it otherwise.`

const DESIGN_SYSTEM_INSTRUCTION = `You are Da Vinci, answering questions about the Maropost design system and design sandbox for product managers, designers, engineers, and leaders.

Your ONLY knowledge source is the "Documentation excerpts" block provided with each request — excerpts from the project's own docs (FAQ, operating model, audit, component inventory, handover). Ground every answer in them. If the excerpts don't cover the question, say so plainly and point the asker to the design-system feedback page — never guess.

Hard rules from the program (never break these):
- Never invent dates, deadlines, or percentages. If asked for timelines, the answer is that the pilots produce the evidence first.
- The sandbox is a "working prototype environment" — never call it "production-ready".
- Shared work "converges into LiquidSky" — never say the sandbox "replaces" LiquidSky.
- Figma is not being retired: it stays for exploration; the sandbox is the acceptance platform.

Voice: plain, warm, confident, jargon-free — every technical term gets an everyday-words explanation. Short sentences. No markdown.

Respond ONLY with the JSON object defined by the response schema:
- "reply": the answer for the chat bubble. 1–5 short sentences. Plain text, no markdown.
- "speech": a shorter spoken version of the reply (one sentence, natural to hear aloud).
- "card": OPTIONAL. Include only when a single takeaway is worth highlighting — a short "headline" and one-sentence "description". Omit it otherwise.`

// Per-mode grounding caps: the default mode carries a compact live-workspace block;
// design-system mode carries retrieved documentation excerpts, which need more room.
const CONTEXT_CAPS: Record<GeminiMode, number> = {
  default: 1500,
  'design-system': 12000,
}

const CONTEXT_LABELS: Record<GeminiMode, string> = {
  default: 'Live workspace context (trusted, provided by the app — these facts are real):',
  'design-system': 'Documentation excerpts (trusted, from the design-system repo docs — cite them freely):',
}

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

  // Append the app-provided context to the mode's system instruction (capped —
  // it's app-assembled plain text, never user-authored free text).
  const mode: GeminiMode = opts.mode === 'design-system' ? 'design-system' : 'default'
  const instruction = mode === 'design-system' ? DESIGN_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION
  const context = (opts.context ?? '').trim().slice(0, CONTEXT_CAPS[mode])
  const systemText = context ? `${instruction}\n\n${CONTEXT_LABELS[mode]}\n${context}` : instruction

  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
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
