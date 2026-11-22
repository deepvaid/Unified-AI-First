// What a campaign request already says — the occasion it is for and the goal that implies — and the
// copy a draft starts with. Pure — unit-tested under `node --test` (tests/davinci/campaignBrief.test.ts).
//
// The bug this replaces: "Draft a Black Friday email campaign for my VIP customers" was asked "what
// should this campaign achieve?", and the draft came out as "First campaign — Special offer" with the
// subject "A special offer, picked for you" — the occasion was dropped, and an established store was
// told it was writing its first campaign.

export type CampaignObjectiveKey = 'generic' | 'promotion' | 'announcement' | 'reconnect' | 'newsletter'

export interface CampaignRequest {
  /** The occasion or theme the request names ("Black Friday", "Summer Sale"), in title case. */
  topic: string | null
  /** The goal the request implies; null when it has to be asked. */
  objective: Exclude<CampaignObjectiveKey, 'generic'> | null
}

/** The wizard's own goal labels — the value an inferred objective is recorded as. */
export const OBJECTIVE_LABELS: Record<Exclude<CampaignObjectiveKey, 'generic'>, string> = {
  promotion: 'Promote an offer',
  announcement: 'Announce something',
  reconnect: 'Reconnect with customers',
  newsletter: 'Share a newsletter',
}

const OCCASIONS: Array<[RegExp, string]> = [
  [/\bblack friday\b/, 'Black Friday'],
  [/\bcyber monday\b/, 'Cyber Monday'],
  [/\bcyber week\b/, 'Cyber Week'],
  [/\bboxing day\b/, 'Boxing Day'],
  [/\b(?:christmas|xmas)\b/, 'Christmas'],
  [/\bnew year(?:'s|s)?\b/, 'New Year'],
  [/\bvalentine(?:'s|s)?(?: day)?\b/, 'Valentine’s Day'],
  [/\bmother(?:'s|s) day\b/, 'Mother’s Day'],
  [/\bfather(?:'s|s) day\b/, 'Father’s Day'],
  [/\beaster\b/, 'Easter'],
  [/\bhalloween\b/, 'Halloween'],
  [/\bthanksgiving\b/, 'Thanksgiving'],
  [/\bback[- ]to[- ]school\b/, 'Back to School'],
  [/\bend[- ]of[- ]season\b/, 'End of Season'],
  [/\b(?:holidays?|festive)\b/, 'Holiday'],
  [/\bsummer\b/, 'Summer'],
  [/\bspring\b/, 'Spring'],
  [/\b(?:fall|autumn)\b/, 'Fall'],
  [/\bwinter\b/, 'Winter'],
  [/\bflash\b/, 'Flash'],
  [/\bclearance\b/, 'Clearance'],
  [/\banniversary\b/, 'Anniversary'],
]
/** Occasions that are a sale by themselves — "Black Friday" needs no "Sale" after it. */
const SALE_BY_NAME = new Set(['Black Friday', 'Cyber Monday', 'Cyber Week', 'Boxing Day', 'Clearance'])

const PROMOTION = /\b(?:sales?|offers?|deals?|discounts?|promos?|promotions?|coupons?|vouchers?|black friday|cyber monday|cyber week|boxing day|clearance|flash)\b|\d+ ?(?:%|percent) off/
const ANNOUNCEMENT = /\b(?:announc\w*|launch\w*|introduc\w*|restock\w*|back in stock|new (?:arrivals?|collection|products?|range|line|store|feature))\b/
const RECONNECT = /\b(?:reconnect|win[- ]?back|lapsed|miss you|come back|re-?engage)\b/
const NEWSLETTER = /\b(?:newsletters?|digest|round-?up|(?:weekly|monthly) update)\b/

/** The occasion and goal a campaign request states up front. */
export function readCampaignRequest(text: string): CampaignRequest {
  const t = text.toLowerCase()
  const occasion = OCCASIONS.find(([pattern]) => pattern.test(t))?.[1] ?? null
  const isSale = /\bsales?\b/.test(t)
  const topic = occasion && isSale && !SALE_BY_NAME.has(occasion) ? `${occasion} Sale` : occasion

  const objective = PROMOTION.test(t) ? 'promotion'
    : ANNOUNCEMENT.test(t) ? 'announcement'
      : RECONNECT.test(t) ? 'reconnect'
        : NEWSLETTER.test(t) ? 'newsletter'
          : null
  return { topic, objective }
}

/** The goal a wizard answer names ("Promote an offer", or the merchant's own words). */
export function objectiveKey(text: string): CampaignObjectiveKey {
  const normalized = text.toLowerCase().trim()
  if (!normalized) return 'generic'
  // Newsletter first, and "new" as a whole word: "Share a newsletter" used to match "new" and become an announcement.
  if (/newsletter|update|digest/.test(normalized)) return 'newsletter'
  if (/announce|launch|\bnew\b/.test(normalized)) return 'announcement'
  if (/reconnect|win.?back|lapsed|miss/.test(normalized)) return 'reconnect'
  return 'promotion'
}

export interface CampaignCopy {
  name: string
  subject: string
  preheader: string
}

const BASE_COPY: Record<CampaignObjectiveKey, CampaignCopy> = {
  generic: {
    name: 'New campaign',
    subject: 'An update for you',
    preheader: 'Draft created with Da Vinci — you control content, timing, and send.',
  },
  promotion: {
    name: 'Special offer',
    subject: 'A special offer, picked for you',
    preheader: 'A timely offer for our subscribers.',
  },
  announcement: {
    name: 'New announcement',
    subject: 'Something new is here',
    preheader: 'Be among the first to see what is new.',
  },
  reconnect: {
    name: 'We miss you',
    subject: 'It’s been a while — here’s what’s new',
    preheader: 'A personal reason to come back and take another look.',
  },
  newsletter: {
    name: 'Newsletter',
    subject: 'Your latest update',
    preheader: 'News, ideas, and updates selected for you.',
  },
}

/**
 * The name, subject and preheader a draft starts with. A named occasion leads all three; `first` keeps
 * the "First campaign" framing for an account that has never sent one (guided onboarding).
 */
export function campaignCopy(objective: CampaignObjectiveKey, topic: string | null, first: boolean): CampaignCopy {
  const base = BASE_COPY[objective]
  if (topic) {
    switch (objective) {
      case 'promotion':
        return { name: `${topic} — Special offer`, subject: `${topic}: an offer picked for you`, preheader: `Our ${topic} offer is live — see what’s inside.` }
      case 'announcement':
        return { name: `${topic} — Announcement`, subject: `${topic} is here`, preheader: base.preheader }
      case 'reconnect':
        return { name: `${topic} — We miss you`, subject: `It’s been a while — come back for ${topic}`, preheader: base.preheader }
      case 'newsletter':
        return { name: `${topic} — Newsletter`, subject: `${topic}: your latest update`, preheader: base.preheader }
      default:
        return { name: `${topic} campaign`, subject: topic, preheader: base.preheader }
    }
  }
  if (!first) return base
  return objective === 'generic'
    ? { name: 'First campaign', subject: 'Your first campaign', preheader: base.preheader }
    : { ...base, name: `First campaign — ${base.name}` }
}
