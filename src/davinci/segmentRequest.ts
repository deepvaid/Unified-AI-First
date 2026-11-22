// Which segment a request means, and how many contacts it holds. Pure — unit-tested under
// `node --test` (tests/davinci/segmentRequest.test.ts).
//
// The bug this replaces: every segment ask got one of two canned cards. "Create a segment of customers
// who haven't purchased in 90 days" came back as "High-intent shoppers" (viewed a product 3+ times, no
// purchase yet) with a made-up size — in an account that already had a "Lapsed 90 Days" segment.

export type SegmentKind =
  | 'lapsed'
  | 'unengaged'
  | 'cart'
  | 'new'
  | 'repeat'
  | 'vip'
  | 'high-value'
  | 'engaged'
  | 'high-intent'

export interface SegmentSpec {
  kind: SegmentKind
  /** Card title, e.g. "Lapsed buyers · 60 days". */
  name: string
  /** The same name without the window — read aloud ("Lapsed buyers"). */
  spokenName: string
  rules: string[]
  /** The window the request named, or the kind's default, in days. Null for kinds without one. */
  days: number | null
  /** The spend a high-value ask named, in dollars. */
  amount: number | null
}

export interface ExistingSegment {
  id: number
  name: string
  description?: string
  count: number
}

export interface SegmentAnswer {
  spec: SegmentSpec
  /** The account already has this segment — show it rather than draft a twin. */
  existing: ExistingSegment | null
  /** Contacts in it: the existing segment's count, or an estimate from its nearest relative. */
  size: number
}

// ── The window ───────────────────────────────────────────────────────────────

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirty: 30, sixty: 60, ninety: 90,
}
const UNIT_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, quarter: 90, year: 365 }
const COUNTED_WINDOW = new RegExp(
  `\\b(\\d{1,3}|${Object.keys(NUMBER_WORDS).join('|')})\\s*\\+?[- ]?(day|week|month|quarter|year)s?\\b`,
)
const NAMED_WINDOW = /\b(?:this|last|past|previous) (week|month|quarter|year)\b/

/** "in 90 days", "the last three months", "this quarter" → days. Null when the request names no window. */
export function windowDays(text: string): number | null {
  const t = text.toLowerCase()
  const counted = COUNTED_WINDOW.exec(t)
  if (counted) {
    const amount = /^\d/.test(counted[1]!) ? Number(counted[1]) : NUMBER_WORDS[counted[1]!] ?? 1
    return amount * UNIT_DAYS[counted[2]!]!
  }
  const named = NAMED_WINDOW.exec(t)
  return named ? UNIT_DAYS[named[1]!]! : null
}

/** "spent over $500", "more than 1,000 dollars" → 500 / 1000. */
function spendAmount(text: string): number | null {
  const match = /\$\s?(\d[\d,]*)|\b(\d[\d,]*)\s?(?:dollars|usd|bucks)\b/.exec(text.toLowerCase())
  const raw = match?.[1] ?? match?.[2]
  return raw ? Number(raw.replace(/,/g, '')) : null
}

// ── The kind ─────────────────────────────────────────────────────────────────

const NEGATION = "(?:haven'?t|have not|hasn'?t|has not|didn'?t|did not|don'?t|do not|not|no|without|never)"
const NOT_BOUGHT = new RegExp(`\\b${NEGATION}\\b[^.]{0,40}\\b(?:purchas\\w*|bought|buy\\w*|order\\w*|shop\\w*|spen[dt]\\w*)\\b`)
const LAPSED = /\b(?:lapsed|lapsing|churn\w*|at[- ]risk|win[- ]?back|stopped (?:buying|ordering|purchasing))\b/
const NOT_ENGAGED = new RegExp(`\\b${NEGATION}\\b[^.]{0,40}\\b(?:open\\w*|click\\w*|engag\\w*|read)\\b|\\b(?:inactive|dormant|unengaged|disengaged)\\b`)
const CART = /\babandon\w*\b[^.]{0,20}\b(?:carts?|baskets?|checkout)\b|\b(?:carts?|baskets?)\b[^.]{0,20}\babandon\w*/
const NEW = /\bnew (?:customers?|subscribers?|sign-?ups?|contacts?|buyers?|shoppers?|members?)\b|\bfirst[- ]time\b|\b(?:just|recently|newly) (?:joined|signed up|subscribed)\b|\b(?:signed up|joined|subscribed) (?:in|within|during|over) the (?:last|past)\b/
const REPEAT = /\b(?:repeat|returning|frequent)\b|\bmore than once\b|\b(?:2|two|3|three)\+? (?:or more )?(?:orders|purchases)\b|\bmultiple (?:orders|purchases)\b/
const VIP = /\bvips?\b|\bloyal(?:ty)?\b/
const HIGH_VALUE = /\b(?:best|top|biggest|high[- ]?(?:value|spend\w*)|big spenders?)\b|\b(?:spent|spend|spending)\b[^.]{0,20}\b(?:over|more than|above|at least)\b|\blifetime (?:value|spend)\b|\bltv\b/
const ENGAGED = /\b(?:engaged|active)\b|\b(?:open\w*|click\w*)\b/

function kindOf(t: string): SegmentKind {
  if (CART.test(t)) return 'cart'
  if (NOT_BOUGHT.test(t) || LAPSED.test(t)) return 'lapsed'
  if (NOT_ENGAGED.test(t)) return 'unengaged'
  if (NEW.test(t)) return 'new'
  if (REPEAT.test(t)) return 'repeat'
  if (VIP.test(t)) return 'vip'
  if (HIGH_VALUE.test(t)) return 'high-value'
  if (ENGAGED.test(t)) return 'engaged'
  return 'high-intent'
}

const DEFAULT_DAYS: Partial<Record<SegmentKind, number>> = { lapsed: 90, unengaged: 120, cart: 7, new: 30, engaged: 30 }

const money = (value: number) => `$${value.toLocaleString('en-US')}`

/** The segment `text` asks for: its name and the rules that define it. */
export function segmentSpecFor(text: string): SegmentSpec {
  const t = text.toLowerCase()
  const kind = kindOf(t)
  const days = kind in DEFAULT_DAYS ? windowDays(t) ?? DEFAULT_DAYS[kind]! : null
  const amount = kind === 'high-value' ? spendAmount(t) ?? 500 : null
  const windowed = (label: string) => ({ name: `${label} · ${days} days`, spokenName: label })

  switch (kind) {
    case 'lapsed':
      return {
        kind, days, amount, ...windowed('Lapsed buyers'),
        rules: ['Has placed at least 1 order', `No order in the last ${days} days`, 'Subscribed to email'],
      }
    case 'unengaged':
      return {
        kind, days, amount, ...windowed('Inactive subscribers'),
        rules: [`No opens or clicks in the last ${days} days`, 'Still subscribed to email'],
      }
    case 'cart':
      return {
        kind, days, amount, ...windowed('Cart abandoners'),
        rules: [`Added to cart in the last ${days} days`, 'Did not complete checkout', 'Has an email address'],
      }
    case 'new': {
      const buyers = /\b(?:customers?|buyers?|shoppers?|first[- ]time)\b/.test(t)
      return {
        kind, days, amount, ...windowed(buyers ? 'New customers' : 'New signups'),
        rules: [buyers ? `First order in the last ${days} days` : `Joined in the last ${days} days`, 'Subscribed to email'],
      }
    }
    case 'repeat':
      return { kind, days, amount, name: 'Repeat buyers', spokenName: 'Repeat buyers', rules: ['2 or more orders', 'Subscribed to email'] }
    case 'vip':
      return {
        kind, days, amount, name: 'VIP customers', spokenName: 'VIP customers',
        rules: ['Tagged VIP or in a loyalty tier', 'Subscribed to email'],
      }
    case 'high-value':
      return {
        kind, days, amount, name: 'High-value customers', spokenName: 'High-value customers',
        rules: [`Lifetime spend over ${money(amount!)}`, 'Subscribed to email'],
      }
    case 'engaged':
      return {
        kind, days, amount, ...windowed('Engaged subscribers'),
        rules: [`Opened or clicked an email in the last ${days} days`, 'Subscribed to email'],
      }
    default:
      return {
        kind, days, amount, name: 'High-intent shoppers', spokenName: 'High-intent shoppers',
        rules: ['Viewed a product 3+ times in 14 days', 'Added to cart in the last 30 days', 'No purchase yet'],
      }
  }
}

// ── The account's own segments ───────────────────────────────────────────────

/** How an existing segment of each kind is recognised from its name and description. */
const RELATIVE: Record<SegmentKind, RegExp> = {
  lapsed: /\blapsed\b|\bno (?:orders?|purchases?|activity)\b/i,
  unengaged: /\bre-?engag\w*|\binactive\b|\bdormant\b/i,
  cart: /\babandon\w*/i,
  new: /\bnew (?:sign-?ups?|customers?|subscribers?)\b|\bjoined in\b/i,
  repeat: /\brepeat\b|\b2\+ orders\b/i,
  vip: /\bvips?\b|\bloyal\w*/i,
  'high-value': /\bhigh[- ]value\b|\bltv\b|\blifetime\b/i,
  engaged: /\bengaged\b/i,
  'high-intent': /\bhigh[- ]intent\b/i,
}

/** A longer "nothing since" window holds fewer contacts; a longer "within the last" window holds more. */
const SHRINKS_WITH_WINDOW: SegmentKind[] = ['lapsed', 'unengaged']

/** Share of the account's largest audience a kind takes when it has no relative to measure against. */
const SHARE: Record<SegmentKind, number> = {
  lapsed: 0.22, unengaged: 0.16, cart: 0.05, new: 0.12, repeat: 0.3, vip: 0.02, 'high-value': 0.1, engaged: 0.4, 'high-intent': 0.28,
}
const DEFAULT_BASE = 5000

const describe = (segment: ExistingSegment) => `${segment.name} ${segment.description ?? ''}`
const daysIn = (segment: ExistingSegment): number | null => windowDays(describe(segment))
const amountIn = (segment: ExistingSegment): number | null => spendAmount(describe(segment))
const roundToTen = (value: number) => Math.max(10, Math.round(value / 10) * 10)
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * The segment a request means, measured against the segments the account already has: the same segment
 * if it exists (its real count), else an estimate scaled from its nearest relative, else a share of the
 * account's largest audience.
 */
export function answerSegmentRequest(text: string, existing: ExistingSegment[]): SegmentAnswer {
  const spec = segmentSpecFor(text)
  const relatives = existing.filter((segment) => RELATIVE[spec.kind].test(describe(segment)))

  const same = relatives.find((segment) => {
    if (spec.days != null) return daysIn(segment) === spec.days
    if (spec.amount != null) return (amountIn(segment) ?? spec.amount) === spec.amount
    return true
  })
  if (same) return { spec, existing: same, size: same.count }

  // A relative with another window: "Lapsed 90 Days" tells us roughly how many lapse in 60.
  const relative = relatives.find((segment) => spec.days != null && daysIn(segment) != null)
  if (relative && spec.days != null) {
    const ratio = spec.days / daysIn(relative)!
    const factor = SHRINKS_WITH_WINDOW.includes(spec.kind) ? clamp(1 / Math.sqrt(ratio), 0.4, 2) : clamp(ratio, 0.25, 4)
    return { spec, existing: null, size: roundToTen(relative.count * factor) }
  }

  const base = existing.reduce((largest, segment) => Math.max(largest, segment.count), 0) || DEFAULT_BASE
  return { spec, existing: null, size: roundToTen(base * SHARE[spec.kind]) }
}
