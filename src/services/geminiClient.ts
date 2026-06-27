// Client wrapper for the secure /api/gemini proxy. Sends only { text, history } —
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
}

export async function askGemini(text: string, history: GeminiTurn[] = []): Promise<GeminiReply | null> {
  try {
    const resp = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, history }),
    })
    if (!resp.ok) return null
    const data = (await resp.json()) as Partial<GeminiReply>
    if (!data || typeof data.reply !== 'string' || !data.reply.trim()) return null
    return {
      reply: data.reply,
      speech: typeof data.speech === 'string' && data.speech.trim() ? data.speech : data.reply,
      card: data.card,
    }
  } catch {
    return null
  }
}
