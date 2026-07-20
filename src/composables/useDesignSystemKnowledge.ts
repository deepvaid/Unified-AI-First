// Knowledge base for the design-system Da Vinci (DvDocsAssistant): bundles the
// design-system markdown docs via Vite ?raw, chunks them by heading, and does
// lightweight keyword retrieval so each question ships only the most relevant
// excerpts to /api/gemini (mode: 'design-system'). Also parses the FAQ crib
// sheet into Q&A entries for the offline fallback (no GEMINI_API_KEY).

import faqRaw from '../../docs/design-system/showcase-faq-crib-sheet.md?raw'
import operatingModelRaw from '../../docs/design-system/operating-model.md?raw'
import auditRaw from '../../docs/design-system/audit.md?raw'
import inventoryRaw from '../../docs/design-system/inventory.md?raw'
import handoverRaw from '../../docs/design-system/handover-2026-07.md?raw'

export interface DocChunk {
  doc: string
  heading: string
  text: string
}

export interface FaqEntry {
  number: number
  question: string
  answer: string
  ifPushed: string
}

/** Always-included preamble: the verified counts + program language rules. */
const FACTS_BLOCK = `Core facts (counted from the repo, 2026-07): 89 shared components · 84 documented in Storybook · 171 product screens · 297 design tokens · 2 themes (light/dark) from one switch. 17 builder screens share one builder shell.
Program language rules: the sandbox is a "working prototype environment" (never "production-ready"); shared work "converges into LiquidSky" (never "replaces" it); no dates or percentages before the two pilots report.`

const STOPWORDS = new Set([
  'an', 'as', 'at', 'be', 'by', 'do', 'go', 'if', 'in', 'is', 'it', 'my', 'no', 'of', 'on', 'or',
  'so', 'to', 'up', 'us', 'we',
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'our', 'can', 'this', 'that', 'with',
  'what', 'when', 'how', 'why', 'who', 'will', 'was', 'were', 'has', 'have', 'had', 'does', 'did',
  'its', 'it’s', 'into', 'from', 'they', 'them', 'their', 'there', 'here', 'been', 'being',
  'would', 'should', 'could', 'about', 'which', 'while', 'where', 'than', 'then', 'them', 'these',
  'those', 'some', 'any', 'all', 'one', 'two', 'just', 'like', 'get', 'gets', 'use', 'using',
])

// Two-letter tokens are kept (minus stopwords) so domain acronyms like QA, AI,
// UX, PM survive tokenization — dropping them made "How does QA work?" match on
// nothing but "work".
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

/** Split a markdown doc into heading-scoped chunks (## sections; long ones split again on ###/bold-question marks). */
function chunkDoc(doc: string, raw: string): DocChunk[] {
  const chunks: DocChunk[] = []
  const sections = raw.split(/^(?=## )/m)
  for (const section of sections) {
    const headingMatch = section.match(/^##\s+(.+)$/m)
    const heading = headingMatch?.[1]?.trim() ?? 'Introduction'
    // FAQ-style sections carry many independent Q&As — split those out so
    // retrieval can pick a single question instead of a whole section.
    const parts = section.split(/^(?=\*\*\d+\.)/m)
    for (const part of parts) {
      const text = part.trim()
      if (text.length < 60) continue
      chunks.push({ doc, heading, text })
    }
  }
  return chunks
}

const CHUNKS: DocChunk[] = [
  ...chunkDoc('FAQ crib sheet', faqRaw),
  ...chunkDoc('Operating model', operatingModelRaw),
  ...chunkDoc('Design-system audit', auditRaw),
  ...chunkDoc('Component inventory', inventoryRaw),
  ...chunkDoc('Handover 2026-07', handoverRaw),
]

/** Parse the crib sheet's `**N. "question"**` + `>` blockquote structure into entries. */
function parseFaq(raw: string): FaqEntry[] {
  const entries: FaqEntry[] = []
  const re = /\*\*(\d+)\.\s+([^\n]+?)\*\*\s*\n+((?:>.*\n?)+)(?:\s*\*(?:If pushed|Second use[^:]*):\*\s*([^\n]+))?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    const answer = match[3]!
      .split('\n')
      .map((l) => l.replace(/^>\s?/, '').trim())
      .filter(Boolean)
      .join(' ')
    entries.push({
      number: Number(match[1]),
      question: match[2]!.replace(/^["“]|["”]$/g, '').trim(),
      answer,
      ifPushed: (match[4] ?? '').replace(/^["“]|["”]$/g, '').trim(),
    })
  }
  return entries
}

const FAQ_ENTRIES: FaqEntry[] = parseFaq(faqRaw)

function scoreText(queryTokens: string[], text: string, heading = ''): number {
  const textTokens = new Set(tokenize(text))
  const headingTokens = new Set(tokenize(heading))
  let score = 0
  for (const t of queryTokens) {
    if (headingTokens.has(t)) score += 3
    if (textTokens.has(t)) score += 1
  }
  return score
}

export function useDesignSystemKnowledge() {
  /** Build the grounding context for a question: facts block + top-scoring doc excerpts (~9KB cap). */
  function retrieve(question: string, maxChunks = 6, charBudget = 9000): string {
    const queryTokens = tokenize(question)
    const ranked = CHUNKS.map((c) => ({ c, score: scoreText(queryTokens, c.text, c.heading) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)

    const parts: string[] = [FACTS_BLOCK]
    let used = FACTS_BLOCK.length
    for (const { c } of ranked.slice(0, maxChunks)) {
      const excerpt = `[${c.doc} — ${c.heading}]\n${c.text}`
      if (used + excerpt.length > charBudget) break
      parts.push(excerpt)
      used += excerpt.length
    }
    return parts.join('\n\n---\n\n')
  }

  /** Offline fallback: the best-matching written FAQ answer, or null when nothing is close. */
  function bestFaqMatch(question: string): FaqEntry | null {
    const queryTokens = tokenize(question)
    if (!queryTokens.length) return null
    let best: FaqEntry | null = null
    let bestScore = 0
    for (const entry of FAQ_ENTRIES) {
      const score = scoreText(queryTokens, entry.answer, entry.question) + scoreText(queryTokens, entry.question) * 2
      if (score > bestScore) {
        best = entry
        bestScore = score
      }
    }
    // Require at least two meaningful signals so gibberish doesn't match Q1.
    return bestScore >= 4 ? best : null
  }

  const starterChips = [
    'Are we replacing LiquidSky?',
    'When can the design team start using it?',
    'Can my team keep working in its own silo?',
    'How does QA work in all this?',
    'Is the design final?',
    'What’s the governance for AI-coded screens?',
  ]

  return { retrieve, bestFaqMatch, starterChips, faqEntries: FAQ_ENTRIES }
}
