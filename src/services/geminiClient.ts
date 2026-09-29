// Client wrapper for the secure /api/gemini proxy. Sends only { text, history, context } —
// the API key lives server-side and never reaches the browser. Returns null on any
// failure (no key, network, provider error) so callers can degrade gracefully to
// the canned fallback, mirroring how TTS falls back to the browser voice.

export interface GeminiTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface GeminiReply {
  reply: string
  speech: string
  card?: { headline: string; description: string; severity?: 'info' | 'success' | 'warning' | 'error' }
  /** One in-app destination for the card, allow-listed server-side (route name + verb-first label). */
  action?: { label: string; routeName: string }
}

export interface AskGeminiOptions {
  /** Compact live-workspace context block (current page, account, plan, dashboard). */
  context?: string
  /** Abort the in-flight request (copilot Stop button). */
  signal?: AbortSignal
  /** Server persona/grounding preset — 'design-system' for the docs assistant. */
  mode?: 'default' | 'design-system'
  /** How long to wait before giving up as "busy". Defaults to 12s; tests shorten it. */
  timeoutMs?: number
}

/** Why no reply came back: retry-able soon (rate limit, slow answer) vs. simply unreachable. */
export type GeminiFailure = 'busy' | 'offline'
export type GeminiResult = { ok: true; reply: GeminiReply } | { ok: false; failure: GeminiFailure }

/** A reply that takes longer than this is abandoned — the merchant should never wait on a dead request. */
const DEFAULT_TIMEOUT_MS = 12_000

/**
 * Asks the advisor and says WHY when it can't answer. A user-initiated Stop (via `opts.signal`)
 * is rethrown as an AbortError so the caller's generation guard can swallow it — a timeout is
 * NOT a Stop and resolves as `busy`, so the composer can never be left waiting.
 */
export async function askGeminiResult(
  text: string,
  history: GeminiTurn[] = [],
  opts: AskGeminiOptions = {},
): Promise<GeminiResult> {
  const controller = new AbortController()
  const relayStop = () => controller.abort(opts.signal?.reason)
  if (opts.signal?.aborted) relayStop()
  else opts.signal?.addEventListener('abort', relayStop, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('Gemini timed out', 'TimeoutError')), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    const resp = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, history, context: opts.context, mode: opts.mode }),
      signal: controller.signal,
    })
    if (!resp.ok) return { ok: false, failure: resp.status === 429 || resp.status === 504 ? 'busy' : 'offline' }
    const data = (await resp.json()) as Partial<GeminiReply>
    if (!data || typeof data.reply !== 'string' || !data.reply.trim()) return { ok: false, failure: 'offline' }
    return {
      ok: true,
      reply: {
        reply: data.reply,
        speech: typeof data.speech === 'string' && data.speech.trim() ? data.speech : data.reply,
        card: data.card,
        action: data.card && data.action?.label && data.action?.routeName ? data.action : undefined,
      },
    }
  } catch (err) {
    if (opts.signal?.aborted) throw err // the merchant pressed Stop — not a failure
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) return { ok: false, failure: 'busy' }
    return { ok: false, failure: 'offline' }
  } finally {
    clearTimeout(timer)
    opts.signal?.removeEventListener('abort', relayStop)
  }
}

/** Reply or null — for callers (the docs assistant) that only degrade to their own fallback. */
export async function askGemini(
  text: string,
  history: GeminiTurn[] = [],
  opts: AskGeminiOptions = {},
): Promise<GeminiReply | null> {
  const result = await askGeminiResult(text, history, opts)
  return result.ok ? result.reply : null
}
