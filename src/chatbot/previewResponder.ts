/**
 * The builder preview's stand-in for the assistant. Pure and import-free so `node:test`
 * can run it. It answers from the chatbot's own knowledge base and is honest about what
 * a preview cannot do: anything that needs the live store (orders, invoices) says so
 * instead of inventing a result.
 */

export interface PreviewEntry {
  title: string
  text: string
  /** Name of the knowledge source the entry came from. */
  source: string
}

export interface PreviewContext {
  shoppingEnabled: boolean
  trackingEnabled: boolean
  /** Entries from enabled, active knowledge sources only. */
  entries: PreviewEntry[]
}

export type PreviewReply =
  | { kind: 'products'; text: string }
  | { kind: 'live'; text: string }
  | { kind: 'answer'; text: string; source: string }
  | { kind: 'unknown'; text: string }

const LIVE = /\b(track|tracking|my order|order status|where('s| is).*order|parcel|shipment|invoice|cancel my)\b/
const SHOPPING = /\b(buy|shop|shopping|looking for|recommend|boots?|shoes?|dress(es)?|add to cart)\b/

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'you', 'your', 'our', 'can', 'what', 'whats', 'how', 'does', 'did', 'will',
  'with', 'have', 'has', 'any', 'about', 'when', 'where', 'who', 'why', 'this', 'that', 'there', 'from',
  'need', 'want', 'like', 'please', 'tell', 'know', 'get', 'much', 'many', 'long', 'take', 'takes',
])

function stem(word: string): string {
  return word.replace(/(ing|es|s)$/, '')
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

function keywords(message: string): string[] {
  return words(message).filter((w) => w.length >= 3 && !STOP_WORDS.has(w)).map(stem).filter((w) => w.length >= 3)
}

function hits(tokens: string[], text: string): number {
  const haystack = words(text).map(stem)
  return tokens.filter((t) => haystack.some((w) => w.length >= 3 && (w.startsWith(t) || t.startsWith(w)))).length
}

/** Best knowledge-base entry for a message, or null when nothing matches. Titles count double. */
export function bestEntry(message: string, entries: PreviewEntry[]): PreviewEntry | null {
  const tokens = keywords(message)
  if (!tokens.length) return null
  let best: PreviewEntry | null = null
  let bestScore = 0
  for (const entry of entries) {
    const score = hits(tokens, entry.title) * 2 + hits(tokens, entry.text)
    if (score > bestScore) {
      best = entry
      bestScore = score
    }
  }
  return best
}

export function respond(message: string, ctx: PreviewContext): PreviewReply {
  const text = message.toLowerCase()

  if (LIVE.test(text)) {
    return {
      kind: 'live',
      text: ctx.trackingEnabled
        ? 'This needs your live store, so the preview can’t look it up. Once the chatbot is published, I’ll ask for the order details and show the result here.'
        : 'Order tracking is turned off for this chatbot, so I’d point the shopper to your support team instead.',
    }
  }

  if (ctx.shoppingEnabled && SHOPPING.test(text)) {
    return { kind: 'products', text: 'Here are a few great matches:' }
  }

  const entry = bestEntry(message, ctx.entries)
  if (entry) return { kind: 'answer', text: entry.text, source: entry.source }

  const topics = ctx.entries.slice(0, 3).map((e) => e.title)
  return {
    kind: 'unknown',
    text: topics.length
      ? `I don’t have that in the knowledge base yet. Right now I can answer questions about: ${topics.join(', ')}.`
      : 'I don’t have a knowledge base to answer from yet. Add a website, the questionnaire or a file to teach me.',
  }
}
