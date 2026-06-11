import { ref } from 'vue'

// Unified Da Vinci intent layer — port of the Marojarvis prototype's regex
// classifier + handlers (formerly https://davinci-ai-first.vercel.app), re-domained
// to Maropost mock data. Card descriptors map 1:1 onto the existing Dv* card
// components and are rendered by DvIntentCardList on every surface (copilot
// drawer + full-screen AI experience).
//
// Per-instance (NOT a singleton): each conversation surface owns its own
// multi-turn `pending` clarification state. `handle()` is synchronous — each
// surface owns its own thinking delay.

export type DvIntentKind = 'campaign' | 'product' | 'revenue' | 'segment' | 'fallback'

export type DvCardDescriptor =
  | {
      type: 'campaign'
      props: {
        name: string
        subject: string
        audience: string
        audienceSize: number
        sendTime: string
        channel: string
        status?: string
      }
    }
  | {
      type: 'content'
      props: { type: 'email' | 'product' | 'blog' | 'sms'; title: string; content: string }
    }
  | {
      type: 'kpis'
      props: { kpis: Array<{ label: string; value: string; trend?: string; trendUp?: boolean; icon?: string }> }
    }
  | {
      type: 'chart'
      props: { title?: string; subtitle?: string; bars: number[][]; labels?: string[]; seriesNames?: string[] }
    }
  | {
      type: 'segment'
      props: { name: string; rules: string[]; estimatedSize: number }
    }
  | {
      type: 'insight'
      props: {
        headline: string
        description: string
        severity?: 'info' | 'warning' | 'success' | 'error'
        icon?: string
        actionLabel?: string
      }
    }

export interface DvQuickReply {
  label: string
  value: string
  icon?: string
}

export interface DvPending {
  intent: DvIntentKind
  slot: string
  context: Record<string, string>
}

export interface DvIntentResult {
  intent: DvIntentKind
  /** Chat-bubble text (plain) */
  reply: string
  /** Shorter spoken variant; surfaces fall back to `reply` */
  speech?: string
  cards: DvCardDescriptor[]
  quickReplies?: DvQuickReply[]
  pending: DvPending | null
}

// ── Mock data (Maropost-flavored) ────────────────────────────────────────────
type AudienceKey = 'all' | 'vip' | 'lapsed' | 'cart'

const audiences: Record<AudienceKey, { label: string; size: number }> = {
  all: { label: 'All subscribers', size: 48230 },
  vip: { label: 'VIP customers', size: 3120 },
  lapsed: { label: 'Lapsed buyers', size: 7480 },
  cart: { label: 'Cart abandoners', size: 1985 },
}

const campaignNames = [
  'Spring Style Refresh',
  'Weekend Flash Sale',
  'New Arrivals Spotlight',
  'Loyalty Member Exclusive',
]

const productDrafts = [
  {
    title: 'Aurora Trail Jacket',
    content:
      'Built for shoulder-season hikes, the Aurora Trail Jacket pairs a windproof ripstop shell with a brushed-mesh lining that breathes when the pace picks up. Zippered chest pocket, packable hood, and reflective seams for low-light returns.',
  },
  {
    title: 'Coastline Canvas Tote',
    content:
      'The Coastline Canvas Tote carries beach days and farmers markets alike — 16oz washed canvas, interior zip pocket, and straps reinforced to hold 20kg without complaint. Available in three salt-faded colourways.',
  },
]

export const SUGGESTION_CHIPS: DvQuickReply[] = [
  { label: 'Run a campaign', value: 'Run a campaign', icon: 'megaphone' },
  { label: 'Draft a product description', value: 'Draft a product description', icon: 'package' },
  { label: "How's revenue this week?", value: "How's revenue this week?", icon: 'trending-up' },
  { label: 'Build a VIP segment', value: 'Build a VIP customer segment', icon: 'users' },
]

function findAudience(text: string): AudienceKey | null {
  const t = text.toLowerCase()
  if (/\bvip\b|loyal|best customer/.test(t)) return 'vip'
  if (/lapsed|inactive|win[- ]?back/.test(t)) return 'lapsed'
  if (/cart|abandon/.test(t)) return 'cart'
  if (/\ball\b|everyone|every subscriber|subscribers\b/.test(t)) return 'all'
  return null
}

// ── Classifier (Marojarvis port) ─────────────────────────────────────────────
export function classifyIntent(text: string): DvIntentKind {
  const t = text.toLowerCase()
  if (
    /\b(campaign|promo|promotion|blast|newsletter)\b|send .*(email|campaign)|email .*(blast|campaign)/.test(t)
  ) {
    return 'campaign'
  }
  if (/\b(add|create|new|draft|write)\b.*\b(product|item|sku)\b|\bproduct description\b/.test(t)) {
    return 'product'
  }
  if (/\b(revenue|sales|earn|earned|made|aov)\b|how much|\b(this|last) week\b/.test(t)) {
    return 'revenue'
  }
  if (/\b(segment|audience|vip|cohort)\b|group of/.test(t)) {
    return 'segment'
  }
  return 'fallback'
}

export function useDaVinciIntents() {
  const pending = ref<DvPending | null>(null)
  let seq = 0

  function buildCampaign(key: AudienceKey): DvIntentResult {
    const audience = audiences[key]
    const name = campaignNames[seq++ % campaignNames.length] ?? campaignNames[0]!
    return {
      intent: 'campaign',
      reply: `Done. I've drafted the "${name}" email to ${audience.label.toLowerCase()} — review it below, then confirm to schedule.`,
      speech: `Done. I've drafted the ${name} email to ${audience.label.toLowerCase()}, scheduled for tomorrow at 9 AM.`,
      cards: [
        {
          type: 'campaign',
          props: {
            name,
            subject: `${name} — picked for you`,
            audience: audience.label,
            audienceSize: audience.size,
            sendTime: 'Tomorrow · 9:00 AM',
            channel: 'Email',
            status: 'Draft',
          },
        },
      ],
      pending: null,
    }
  }

  function buildProduct(): DvIntentResult {
    const draft = productDrafts[seq++ % productDrafts.length] ?? productDrafts[0]!
    return {
      intent: 'product',
      reply: `Here's a product description draft for "${draft.title}". Use it as-is or ask me to adjust the tone.`,
      speech: `Here's a product description draft for ${draft.title}.`,
      cards: [{ type: 'content', props: { type: 'product', title: draft.title, content: draft.content } }],
      pending: null,
    }
  }

  function buildRevenue(): DvIntentResult {
    return {
      intent: 'revenue',
      reply: 'Revenue is up this week. Here are the last 7 days at a glance.',
      speech: 'Revenue is up 12 percent this week, at 128 thousand dollars across 1,284 orders.',
      cards: [
        {
          type: 'kpis',
          props: {
            kpis: [
              { label: 'Revenue', value: '$128,420', trend: '+12.4%', trendUp: true, icon: 'dollar-sign' },
              { label: 'Orders', value: '1,284', trend: '+8.1%', trendUp: true, icon: 'shopping-cart' },
              { label: 'Avg order value', value: '$99.86', trend: '+3.9%', trendUp: true, icon: 'receipt' },
            ],
          },
        },
        {
          type: 'chart',
          props: {
            title: 'Revenue · last 7 days',
            subtitle: '$128.4k total · +12.4% vs prior week',
            bars: [[14.2], [16.8], [12.4], [18.1], [20.6], [17.9], [28.4]],
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            seriesNames: ['Revenue ($k)'],
          },
        },
      ],
      pending: null,
    }
  }

  function buildSegment(text: string): DvIntentResult {
    const isVip = /vip|loyal|best/.test(text.toLowerCase())
    const props = isVip
      ? {
          name: 'VIP Customers',
          rules: ['Lifetime spend > $500', 'Ordered in the last 90 days', 'Email engagement: high'],
          estimatedSize: 3120,
        }
      : {
          name: 'High-intent shoppers',
          rules: ['Viewed a product 3+ times in 14 days', 'Added to cart in the last 30 days', 'No purchase yet'],
          estimatedSize: 5240,
        }
    return {
      intent: 'segment',
      reply: `I've built the "${props.name}" segment — about ${props.estimatedSize.toLocaleString()} contacts match right now. It refreshes daily.`,
      speech: `I've built the ${props.name} segment with about ${props.estimatedSize.toLocaleString()} contacts.`,
      cards: [{ type: 'segment', props }],
      pending: null,
    }
  }

  function buildFallback(): DvIntentResult {
    return {
      intent: 'fallback',
      reply: 'I can run campaigns, draft product copy, report on revenue, or build audience segments. Try one of these:',
      speech: 'I can run campaigns, draft product copy, report on revenue, or build segments.',
      cards: [
        {
          type: 'insight',
          props: {
            headline: 'Try a Da Vinci command',
            description:
              'Ask things like "Run a campaign to VIP customers", "Draft a product description", or "How\'s revenue this week?"',
            severity: 'info',
            icon: 'sparkles',
          },
        },
      ],
      quickReplies: SUGGESTION_CHIPS,
      pending: null,
    }
  }

  /** Synchronous — consumes/sets `pending` for multi-turn clarification. */
  function handle(text: string): DvIntentResult {
    const trimmed = text.trim()

    if (pending.value) {
      const p = pending.value
      pending.value = null
      if (p.intent === 'campaign' && p.slot === 'audience') {
        return buildCampaign(findAudience(trimmed) ?? 'all')
      }
    }

    const intent = classifyIntent(trimmed)
    switch (intent) {
      case 'campaign': {
        const known = findAudience(trimmed)
        if (known) return buildCampaign(known)
        pending.value = { intent: 'campaign', slot: 'audience', context: {} }
        return {
          intent: 'campaign',
          reply: 'Happy to. Which audience should this campaign go to?',
          speech: 'Happy to. Which audience should this campaign go to?',
          cards: [],
          quickReplies: [
            { label: 'All subscribers', value: 'Send it to all subscribers', icon: 'users' },
            { label: 'VIP customers', value: 'Send it to VIP customers', icon: 'crown' },
            { label: 'Lapsed buyers', value: 'Send it to lapsed buyers', icon: 'user-minus' },
          ],
          pending: pending.value,
        }
      }
      case 'product':
        return buildProduct()
      case 'revenue':
        return buildRevenue()
      case 'segment':
        return buildSegment(trimmed)
      default:
        return buildFallback()
    }
  }

  function reset() {
    pending.value = null
  }

  return {
    pending,
    classify: classifyIntent,
    handle,
    reset,
    suggestionChips: SUGGESTION_CHIPS,
  }
}
