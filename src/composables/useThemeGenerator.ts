// Da Vinci theme section generator — deterministic, prompt-driven section drafts.
// Maps a plain-English request onto the real 12-kind section catalog and derives
// per-kind copy overrides from the prompt. Scripted today; the synchronous entry
// point (generateSections) can later delegate to /api/gemini structured output —
// same async-shapeable pattern as useJourneyGenerator.

import {
  TEMPLATE_TYPE_LABELS,
  getSectionDef,
  type TemplateType,
} from '@/stores/themeBuilderData'

export interface ThemeGenResult {
  kinds: string[]
  overrides: Record<string, string | number | boolean>[]
  reply: string
  matched: boolean
}

// Keyword → catalog kind. Ordered most-specific first; matched phrases are
// consumed (stripped from the working prompt) before later rules run, so
// "image banner" fires image-banner without also triggering the bare
// "banner"→hero rule. See generateSections.
const keywordRules: { test: RegExp; kind: string }[] = [
  { test: /image banner|editorial/, kind: 'image-banner' },
  { test: /promo|announcement|shipping|sale bar/, kind: 'announcement-bar' },
  { test: /gallery|grid|collection/, kind: 'collection-grid' },
  { test: /featured|bestseller|best seller|new arrivals|products?/, kind: 'featured-products' },
  { test: /testimonial|review|social proof/, kind: 'testimonials' },
  { test: /newsletter|email|signup|sign up|subscribe/, kind: 'newsletter' },
  { test: /story|about|text|rich/, kind: 'rich-text' },
  { test: /slideshow/, kind: 'hero' },
  { test: /banner|hero/, kind: 'hero' },
]

// A "build me a whole storefront" request expands to a starter home layout.
const bundleTest = /full (home ?)?page|whole (store ?)?front|landing page|starter/

// The primary text field each kind exposes for a personalized headline/title.
const primaryTextField: Record<string, string> = {
  'hero': 'headline',
  'image-banner': 'headline',
  'featured-products': 'title',
  'collection-grid': 'title',
  'rich-text': 'heading',
  'testimonials': 'title',
  'newsletter': 'headline',
  'announcement-bar': 'text',
}

/**
 * Pull a headline/title phrase out of the prompt: a quoted "…" wins, otherwise a
 * trailing "with headline X" / "titled X" / "called X". Returns undefined when the
 * prompt carries no explicit copy. Same phrase-extraction spirit as the journey
 * generator's copy weaving — kept local and simple.
 */
function extractPhrase(prompt: string): string | undefined {
  const quoted = prompt.match(/["“”']([^"“”']+)["“”']/)
  if (quoted?.[1]?.trim()) return quoted[1].trim()
  const trailing = prompt.match(/\b(?:with headline|titled|called|headline)\s+(.+)$/i)
  if (trailing?.[1]) {
    return trailing[1].trim().replace(/[.!?,]+$/, '') || undefined
  }
  return undefined
}

/** Section title for the reply, e.g. "featured-products" → "Featured products". */
function titleFor(kind: string): string {
  return getSectionDef(kind)?.title ?? kind
}

function joinTitles(kinds: string[]): string {
  const titles = kinds.map(titleFor)
  if (titles.length <= 1) return titles.join('')
  return `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`
}

function fallbackReply(): string {
  return 'I can add sections like a hero banner, featured products, an image banner, '
    + 'testimonials, or a newsletter. Try “Draft a full homepage” or “add an image banner”.'
}

/**
 * Turn a prompt into an ordered list of section kinds (+ per-kind copy overrides)
 * to append to the active template. Deterministic, synchronous, offline-safe.
 */
export function generateSections(
  prompt: string,
  ctx: { template: TemplateType; existingKinds: string[] },
): ThemeGenResult {
  const text = prompt.toLowerCase().trim()

  // Which kinds the prompt asks for — a bundle expands to a starter layout,
  // otherwise every matching keyword rule fires (in catalog-ish order).
  let requested: string[]
  if (bundleTest.test(text)) {
    requested = ['hero', 'featured-products', 'testimonials', 'newsletter']
  } else {
    // Exclusive-by-precedence: each rule consumes the phrases it matched, so a
    // generic keyword can't re-fire on words already claimed by a more specific
    // rule ("image banner" → image-banner only, "image banner and hero" → both).
    requested = []
    let working = text
    for (const rule of keywordRules) {
      const pattern = new RegExp(rule.test.source, 'g')
      const consumed = working.replace(pattern, ' ')
      if (consumed === working) continue
      if (!requested.includes(rule.kind)) requested.push(rule.kind)
      working = consumed
    }
  }

  // Respect `unique` catalog defs: skip a kind already present on the template.
  const kinds: string[] = []
  for (const kind of requested) {
    const def = getSectionDef(kind)
    if (def?.unique && ctx.existingKinds.includes(kind)) continue
    if (!kinds.includes(kind)) kinds.push(kind)
  }

  if (kinds.length === 0) {
    return { kinds: [], overrides: [], reply: fallbackReply(), matched: false }
  }

  // Personalize: an explicit phrase sets the primary text field of the first kind
  // that exposes one (the most specific target the user described).
  const phrase = extractPhrase(prompt)
  const overrides: Record<string, string | number | boolean>[] = kinds.map(() => ({}))
  if (phrase) {
    const target = kinds.findIndex((kind) => primaryTextField[kind])
    if (target !== -1) {
      overrides[target] = { [primaryTextField[kinds[target]!]!]: phrase }
    }
  }

  const reply = `Added ${joinTitles(kinds)} to your ${TEMPLATE_TYPE_LABELS[ctx.template]} page.`
  return { kinds, overrides, reply, matched: true }
}

/** Welcome-state prompt chips. Lucide icon names (kebab-case). */
export const examplePrompts: { label: string; icon: string; prompt: string }[] = [
  { label: 'Draft a full homepage', icon: 'sparkles', prompt: 'Draft a full homepage' },
  { label: 'Add an image banner', icon: 'images', prompt: 'Add an image banner' },
  { label: 'Featured collection grid', icon: 'layout-grid', prompt: 'Add a featured collection grid' },
  { label: 'Add testimonials', icon: 'quote', prompt: 'Add testimonials for social proof' },
  { label: 'Add a newsletter signup', icon: 'mail', prompt: 'Add a newsletter signup' },
]
