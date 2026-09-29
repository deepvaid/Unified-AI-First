// Multi-turn clarification: Da Vinci asks "which engine?" / "what should the journey
// do?" / "open the wizard?" and holds a `PendingSlot` until the merchant answers.
//
// The bug this replaces: any next message was treated as the answer, so one engine
// question turned every later prompt into engine advice — even after New chat. A slot
// now only claims a reply that actually answers it. Pure — see tests/davinci/pendingSlot.test.ts.

import type { JourneyGoal } from '../composables/useJourneyGenerator.ts'
import { isAffirmation, isDecline } from './phrases.ts'
import type { DvIntentKind } from './promptRouting.ts'

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
  if (/nurture|lead/.test(t)) return 'nurture'
  if (/advoca|referral|refer a friend|vip perk/.test(t)) return 'advocacy'
  if (/re-?engage|inactive|quiet|dormant/.test(t)) return 're-engagement'
  if (/win[- ]?back|lapsed|stopped buying/.test(t)) return 'lapsed-buyer'
  return null
}

export function detectEngineKey(text: string): string | null {
  const t = text.toLowerCase()
  if (/popular|best.?sell|top seller/.test(t)) return 'popular'
  if (/newest|new arrival|fresh|latest/.test(t)) return 'newest'
  if (/trend/.test(t)) return 'trending'
  if (/personal|history|behaviou?r/.test(t)) return 'personalized'
  if (/frequently|together|basket|bundle/.test(t)) return 'fbt'
  if (/recently viewed|left off|browsed/.test(t)) return 'recent'
  return null
}

export function detectEnginePage(text: string): string | null {
  const t = text.toLowerCase()
  if (/home\s?page|homepage|front page/.test(t)) return 'Home'
  if (/category|listing|plp/.test(t)) return 'Category'
  if (/product page|pdp/.test(t)) return 'Product'
  if (/cart|checkout/.test(t)) return 'Cart'
  if (/custom page/.test(t)) return 'Custom'
  return null
}

const ASKS_FOR_WIDGET = /\b(?:widget|chart|graph|table|kpi|tile|dashboard)\b/i
const FOLLOW_UP = /^(?:what|how) about\b|^and\b|\binstead\b|\brather\b|^(?:use|try|pick|choose|go with)\b/

/** "What about Newest Products?", "Trending", "And for the cart page?" — not "Show open rate trend for last 30 days". */
function answersEngine(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!detectEngineKey(t) && !detectEnginePage(t)) return false
  return FOLLOW_UP.test(t) || t.split(/\s+/).length <= 4
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
  if (slot.intent === 'journey' && slot.slot === 'goal') return detectJourneyGoal(t) ? 'answer' : 'unrelated'
  if (slot.intent === 'engine') return answersEngine(t) ? 'answer' : 'unrelated'
  return 'unrelated'
}
