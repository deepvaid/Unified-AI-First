// Multi-turn clarification: Da Vinci asks "which engine?" / "what should the journey
// do?" / "open the wizard?" and holds a `PendingSlot` until the merchant answers.
//
// The bug this replaces: any next message was treated as the answer, so one engine
// question turned every later prompt into engine advice — even after New chat. A slot
// now only claims a reply that actually answers it. Pure — see tests/davinci/pendingSlot.test.ts.

import type { JourneyGoal } from '../composables/useJourneyGenerator.ts'
import { isAffirmation, isDecline } from './phrases.ts'
import { isQuestion, type DvIntentKind } from './promptRouting.ts'

export interface PendingSlot {
  intent: DvIntentKind
  slot: string
  context: Record<string, string>
}

export type SlotVerdict = 'answer' | 'decline' | 'unrelated'

/** Maps free text onto a journey goal, if one is recognizable. */
export function detectJourneyGoal(text: string): JourneyGoal | null {
  const t = text.toLowerCase()
  if (/welcome|onboard|new subscriber/.test(t)) return 'welcome'
  if (/abandon|cart/.test(t)) return 'abandoned-cart'
  if (/nurture|\bleads?\b/.test(t)) return 'nurture'
  if (/advoca|referral|refer a friend|vip perk/.test(t)) return 'advocacy'
  if (/re-?engage|inactive|quiet|dormant/.test(t)) return 're-engagement'
  if (/win[- ]?back|lapsed|stopped buying/.test(t)) return 'lapsed-buyer'
  return null
}

const ENGINE_KEYS: Array<[string, RegExp]> = [
  ['popular', /popular|best.?sell|top seller/],
  ['newest', /newest|new arrival|fresh|latest/],
  ['trending', /trend/],
  ['personalized', /personal|history|behaviou?r/],
  ['fbt', /frequently|together|basket|bundle/],
  ['recent', /recently viewed|left off|browsed/],
]

const ENGINE_PAGES: Array<[string, RegExp]> = [
  ['Home', /home\s?page|homepage|front page/],
  ['Category', /category|listing|plp/],
  ['Product', /product page|pdp/],
  ['Cart', /cart|checkout/],
  ['Custom', /custom page/],
]

const firstMatch = (table: Array<[string, RegExp]>, text: string): string | null =>
  table.find(([, pattern]) => pattern.test(text.toLowerCase()))?.[0] ?? null

export const detectEngineKey = (text: string): string | null => firstMatch(ENGINE_KEYS, text)
export const detectEnginePage = (text: string): string | null => firstMatch(ENGINE_PAGES, text)

const ASKS_FOR_WIDGET = /\b(?:widget|chart|graph|table|kpi|tile|dashboard)\b/i
/** How an answer is put: "What about…", "And…", "Use…", "Let's go with…", "Yes, …" — followed by the engine or page. */
const FOLLOW_UP_LEAD = /^(?:(?:ok(?:ay)?|yes|yeah|sure|and|then|now)\b[,.!]?\s+)*(?:(?:what|how) about\b|(?:let'?s\s+)?(?:go with|use|try|pick|choose)\b|i(?:'d| would)? (?:like|prefer|want)\b)?\s*/
const FOLLOW_UP_TAIL = /\b(?:instead|rather(?: than)?)\b.*$/
const ENGINE_FILLER = /\b(?:the|a|an|my|our|for|on|in|to|of|page|pages|products?|items?|engines?|recommendations?|widgets?|type|please|just|only|ones?|options?|bought|purchased|now)\b/g

/**
 * The message is nothing BUT an engine or page name ("Trending", "newest products", "the cart page").
 * One word beyond that — "show revenue trend", "latest orders", "cart abandonment rate" — is another
 * question that happens to contain one, so the old "any short message with a keyword" rule read it
 * as an answer and returned engine advice.
 */
function isBareEnginePhrase(t: string): boolean {
  // `\w*` on both sides: the tables match a stem ("trend", "best.?sell"), the merchant wrote the whole word.
  const rest = [...ENGINE_KEYS, ...ENGINE_PAGES].reduce((left, [, pattern]) => left.replace(new RegExp(`\\w*(?:${pattern.source})\\w*`, 'g'), ' '), t)
  return rest.replace(ENGINE_FILLER, ' ').replace(/[^a-z]+/g, ' ').trim() === ''
}

/**
 * "What about Newest Products?", "Trending", "And for the cart page?", "Let's go with trending" — not "Show open
 * rate trend for last 30 days", and not "What about cart abandonment rate?" either: the lead-in ("what about",
 * "and", "use", "yes") is taken off first, and what is left must still be only an engine or page name.
 */
function answersEngine(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[’‘]/g, "'")
  if (!detectEngineKey(t) && !detectEnginePage(t)) return false
  return isBareEnginePhrase(t.replace(FOLLOW_UP_LEAD, '').replace(FOLLOW_UP_TAIL, ''))
}

/**
 * Does `text` answer the open clarification? `unrelated` releases the slot so the
 * message routes like any other; `decline` gets an acknowledgement, not a new offer.
 */
export function slotVerdict(slot: PendingSlot, text: string): SlotVerdict {
  const t = text.trim()
  if (!t || ASKS_FOR_WIDGET.test(t)) return 'unrelated'
  if (slot.intent === 'journey' || slot.intent === 'engine') {
    if (isDecline(t)) return 'decline'
  }
  if (slot.intent === 'journey' && slot.slot === 'open') return isAffirmation(t) ? 'answer' : 'unrelated'
  // "How many carts were abandoned?" contains a goal word but asks something else.
  if (slot.intent === 'journey' && slot.slot === 'goal') return !isQuestion(t) && detectJourneyGoal(t) ? 'answer' : 'unrelated'
  if (slot.intent === 'engine') return answersEngine(t) ? 'answer' : 'unrelated'
  return 'unrelated'
}
