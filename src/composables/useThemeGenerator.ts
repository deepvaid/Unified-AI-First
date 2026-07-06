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
// "banner"→hero rule. See generateSections. Every rule is \b-anchored so a
// keyword only fires on a whole word ("about" no longer matches inside "how
// about", "starter" no longer matches inside "starters"). "featured collection"
// resolves to a single collection-grid (the collection-grid rule claims the
// word "featured" before the featured-products rule can).
const keywordRules: { test: RegExp; kind: string }[] = [
  { test: /\b(?:image banner|editorial)\b/, kind: 'image-banner' },
  { test: /\b(?:featured collections?|collection grid|gallery|grid|collections?)\b/, kind: 'collection-grid' },
  { test: /\b(?:promo|announcement|shipping|sale bar)\b/, kind: 'announcement-bar' },
  { test: /\b(?:featured products?|featured|bestsellers?|best sellers?|new arrivals|products?)\b/, kind: 'featured-products' },
  { test: /\b(?:testimonials?|reviews?|social proof)\b/, kind: 'testimonials' },
  { test: /\b(?:newsletter|emails?|signups?|sign up|subscribe)\b/, kind: 'newsletter' },
  { test: /\b(?:story|about us|rich text)\b/, kind: 'rich-text' },
  { test: /\bslideshow\b/, kind: 'hero' },
  { test: /\b(?:banner|hero)\b/, kind: 'hero' },
]

// A "build me a whole storefront" request expands to a starter home layout.
// \b-anchored so "starters" / "pages" don't trip it.
const bundleTest = /\b(?:full (?:home ?)?page|whole (?:store ?)?front|landing page|starter (?:home|page|layout|store))\b/

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

// Double-quote delimiters only (straight + curly). Straight apostrophe is
// deliberately excluded so possessives/contractions ("men's and women's") are
// not mistaken for a quoted phrase.
const QUOTE_RE = /["“”]([^"“”]+)["“”]/
const TRAILING_RE = /\b(?:with headline|titled|called|headline)\s+(.+)$/i

/**
 * Pull a headline/title phrase out of the prompt: a quoted "…" wins, otherwise a
 * trailing "with headline X" / "titled X" / "called X". Returns undefined when the
 * prompt carries no explicit copy. Same phrase-extraction spirit as the journey
 * generator's copy weaving — kept local and simple.
 */
function extractPhrase(prompt: string): string | undefined {
  const quoted = prompt.match(QUOTE_RE)
  if (quoted?.[1]?.trim()) return quoted[1].trim()
  const trailing = prompt.match(TRAILING_RE)
  if (trailing?.[1]) {
    return trailing[1].trim().replace(/[.!?,]+$/, '') || undefined
  }
  return undefined
}

/** First index in `text` where any rule for `kind` matches, or MAX if none. */
function firstMatchIndex(text: string, kind: string): number {
  let min = Number.MAX_SAFE_INTEGER
  for (const rule of keywordRules) {
    if (rule.kind !== kind) continue
    const i = text.search(rule.test)
    if (i >= 0 && i < min) min = i
  }
  return min
}

/** Index in `text` where the headline phrase begins (quote or trailing cue). */
function phraseIndex(text: string): number {
  const q = text.search(/["“”]/)
  if (q >= 0) return q
  return text.search(/\b(?:with headline|titled|called|headline)\b/)
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
  // otherwise every matching keyword rule fires.
  const isBundle = bundleTest.test(text)
  let requested: string[]
  if (isBundle) {
    // Curated storefront order (kept as-is).
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
    // Order the sections the way the user said them, not the rule order.
    requested.sort((a, b) => firstMatchIndex(text, a) - firstMatchIndex(text, b))
  }

  // Filter what actually gets added:
  //  - `unique` kinds already on the template are always skipped;
  //  - a bundle skips any kind already present (a "full homepage" shouldn't
  //    duplicate the hero/newsletter a template already has).
  const kinds: string[] = []
  for (const kind of requested) {
    const def = getSectionDef(kind)
    if (def?.unique && ctx.existingKinds.includes(kind)) continue
    if (isBundle && ctx.existingKinds.includes(kind)) continue
    if (!kinds.includes(kind)) kinds.push(kind)
  }

  if (kinds.length === 0) {
    // A bundle whose sections all already exist is understood, just a no-op.
    if (isBundle) {
      return {
        kinds: [],
        overrides: [],
        reply: `Your ${TEMPLATE_TYPE_LABELS[ctx.template]} page already has those starter sections.`,
        matched: true,
      }
    }
    return { kinds: [], overrides: [], reply: fallbackReply(), matched: false }
  }

  // Personalize: an explicit phrase sets the primary text field of the kind
  // whose keyword sits nearest the phrase — so "image banner and a hero
  // \"Winter Sale\"" applies the headline to the hero, not the image banner.
  const phrase = extractPhrase(prompt)
  const overrides: Record<string, string | number | boolean>[] = kinds.map(() => ({}))
  if (phrase) {
    const candidates = kinds.filter((kind) => primaryTextField[kind])
    if (candidates.length) {
      const at = phraseIndex(text)
      const target = at < 0
        ? candidates[0]!
        : candidates.reduce((best, kind) =>
            Math.abs(firstMatchIndex(text, kind) - at) < Math.abs(firstMatchIndex(text, best) - at) ? kind : best,
          candidates[0]!)
      overrides[kinds.indexOf(target)] = { [primaryTextField[target]!]: phrase }
    }
  }

  const reply = `Added ${joinTitles(kinds)} to your ${TEMPLATE_TYPE_LABELS[ctx.template]} page.`
  return { kinds, overrides, reply, matched: true }
}

/** Welcome-state prompt chips. Lucide icon names (kebab-case). */
export const examplePrompts: { label: string; icon: string; prompt: string }[] = [
  { label: 'Draft a full homepage', icon: 'sparkles', prompt: 'Draft a full homepage' },
  { label: 'Add an image banner', icon: 'images', prompt: 'Add an image banner' },
  { label: 'Add a collection grid', icon: 'layout-grid', prompt: 'Add a collection grid' },
  { label: 'Add testimonials', icon: 'quote', prompt: 'Add testimonials for social proof' },
  { label: 'Add a newsletter signup', icon: 'mail', prompt: 'Add a newsletter signup' },
]
