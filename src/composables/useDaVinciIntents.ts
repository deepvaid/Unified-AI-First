import { ref } from 'vue'
import router from '@/router'
import { askGemini, type GeminiTurn } from '@/services/geminiClient'
import { generateJourneyDraft, goalOptions, type JourneyGoal } from '@/composables/useJourneyGenerator'
import { useDaVinciCampaignOnboarding } from '@/composables/useDaVinciCampaignOnboarding'
import {
  fallbackSpeech,
  productDrafts,
  productSpeech,
  revenueSpeech,
  segmentSpeech,
  segmentVariants,
} from './dvIntentData'

// Unified Da Vinci intent layer — port of the Marojarvis prototype's regex
// classifier + handlers (formerly https://davinci-ai-first.vercel.app), re-domained
// to Maropost mock data. Card descriptors map 1:1 onto the existing Dv* card
// components and are rendered by DvIntentCardList on every surface (copilot
// drawer + full-screen AI experience).
//
// Per-instance (NOT a singleton): each conversation surface owns its own
// multi-turn `pending` clarification state. `handle()` is synchronous — each
// surface owns its own thinking delay.

export type DvIntentKind = 'campaign' | 'product' | 'revenue' | 'segment' | 'engine' | 'journey' | 'fallback'

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
        remaining?: string[]
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
  /** Named tool steps behind this reply (DvToolSteps disclosure); omit for plain conversation. */
  steps?: string[]
}

// ── Mock data (Maropost-flavored) ────────────────────────────────────────────
// Data + speech templates live in dvIntentData.ts (imported above) — shared with
// scripts/bake-lines.mjs so every canned speech line is pre-baked to audio whose
// text matches the runtime string byte-for-byte (the text is the audio-cache key).

/**
 * Named tool steps per intent — shown live (DvToolSteps) while the reply is
 * "generating" and stamped onto the finished message. Single source of truth so
 * the live preview and the stamped result always match.
 */
export const INTENT_STEPS: Record<DvIntentKind, string[]> = {
  campaign: ['Pick audience', 'Draft email'],
  product: ['Scan catalog tone', 'Draft description'],
  revenue: ['Query revenue · last 7 days', 'Compare vs prior week'],
  segment: ['Scan contacts', 'Assemble rules'],
  engine: ['Match engine to page'],
  journey: ['Assemble sequence'],
  fallback: ['Consult Da Vinci brain'],
}

export const SUGGESTION_CHIPS: DvQuickReply[] = [
  { label: 'Run a campaign', value: 'Run a campaign', icon: 'megaphone' },
  { label: 'Draft a product description', value: 'Draft a product description', icon: 'package' },
  { label: "How's revenue this week?", value: "How's revenue this week?", icon: 'trending-up' },
  { label: 'Build a VIP segment', value: 'Build a VIP customer segment', icon: 'users' },
]

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

// ── Classifier (Marojarvis port) ─────────────────────────────────────────────
export function classifyIntent(text: string): DvIntentKind {
  const t = text.toLowerCase()
  // Journey CREATION only — "review my journey…" style asks fall through to
  // the generic advisor (Gemini/fallback) instead of drafting a new journey.
  if (
    /\b(build|create|draft|make|set ?up|start|want|need)\b[^.]*\b(journey|automation|drip|flow|series|sequence)\b/.test(t)
    || /welcome series|abandoned cart (journey|flow|recovery)|win[- ]?back (journey|flow|series)/.test(t)
  ) {
    return 'journey'
  }
  if (
    /\b(campaign|promo|promotion|blast|newsletter)\b|send .*(email|campaign)|email .*(blast|campaign)/.test(t)
  ) {
    return 'campaign'
  }
  if (/\brecommendation(s)?\s+(engine|widget|type)\b|which\s+(recommendation|engine)|\bengine\b.*\b(use|pick|choose|recommend)\b|shoppers\s+(should\s+)?see/.test(t)) {
    return 'engine'
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
  const campaignOnboarding = useDaVinciCampaignOnboarding()
  let seq = 0

  /**
   * Hands a campaign request to the guide-only onboarding flow. It can understand
   * the objective, inspect read-only readiness, and open the empty standard builder;
   * it never creates a campaign record or fills product fields.
   */
  function startCampaignDiscovery(audienceHint: string): DvIntentResult {
    const accountId = String(router.currentRoute.value.params.accountId ?? '2000290')
    const active = campaignOnboarding.session.value
    const response = active && active.accountId === accountId && active.stage !== 'complete'
      ? (campaignOnboarding.resume() ?? campaignOnboarding.start(accountId, 'text', { audienceHint }))
      : campaignOnboarding.start(accountId, 'text', { audienceHint })

    return {
      intent: 'campaign',
      reply: response.reply,
      speech: response.speech,
      cards: response.cards ?? [],
      quickReplies: response.quickReplies,
      pending: null,
      steps: INTENT_STEPS.campaign,
    }
  }

  function buildProduct(): DvIntentResult {
    const draft = productDrafts[seq++ % productDrafts.length] ?? productDrafts[0]!
    return {
      intent: 'product',
      reply: `Here's a product description draft for "${draft.title}". Use it as-is, or ask me to adjust the tone.`,
      speech: productSpeech(draft.title),
      cards: [{ type: 'content', props: { type: 'product', title: draft.title, content: draft.content } }],
      pending: null,
      steps: INTENT_STEPS.product,
    }
  }

  function buildRevenue(): DvIntentResult {
    return {
      intent: 'revenue',
      reply: 'Revenue is up this week. The last 7 days, at a glance.',
      speech: revenueSpeech,
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
      steps: INTENT_STEPS.revenue,
    }
  }

  function buildSegment(text: string): DvIntentResult {
    const isVip = /vip|loyal|best/.test(text.toLowerCase())
    const props = isVip ? segmentVariants.vip : segmentVariants.highIntent
    return {
      intent: 'segment',
      reply: `Your "${props.name}" segment is ready — about ${props.estimatedSize.toLocaleString()} contacts match right now. It refreshes daily.`,
      speech: segmentSpeech(props.name, props.estimatedSize),
      cards: [{ type: 'segment', props }],
      pending: null,
      steps: INTENT_STEPS.segment,
    }
  }

  function buildFallback(): DvIntentResult {
    return {
      intent: 'fallback',
      reply: 'I can help you run campaigns, draft product copy, report on revenue, or build audience segments. Try one of these:',
      speech: fallbackSpeech,
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
  // ── Recommendation-engine advisor (Merchandise → engine wizard hand-off) ──
  const ENGINE_ADVICE: Record<string, { label: string; why: string; icon: string }> = {
    popular: { label: 'Popular Products', why: 'best sellers are the safest high-engagement default for broad traffic', icon: 'trending-up' },
    newest: { label: 'Newest Products', why: 'it keeps returning shoppers seeing your fresh stock first', icon: 'package-plus' },
    trending: { label: 'Trending Products', why: 'it surfaces items gaining momentum before they peak', icon: 'flame' },
    personalized: { label: 'Personalized', why: 'it adapts to each shopper’s browsing and purchase history', icon: 'sparkles' },
    fbt: { label: 'Frequently Purchased Together', why: 'it lifts basket size right where purchase intent is highest', icon: 'shopping-basket' },
    recent: { label: 'Recently Viewed', why: 'it picks shoppers up exactly where they left off', icon: 'history' },
  }

  function detectEngineKey(text: string): string | null {
    const t = text.toLowerCase()
    if (/popular|best.?sell|top seller/.test(t)) return 'popular'
    if (/newest|new arrival|fresh|latest/.test(t)) return 'newest'
    if (/trend/.test(t)) return 'trending'
    if (/personal|history|behaviou?r/.test(t)) return 'personalized'
    if (/frequently|together|basket|bundle/.test(t)) return 'fbt'
    if (/recently viewed|left off|browsed/.test(t)) return 'recent'
    return null
  }

  function detectEnginePage(text: string): string | null {
    const t = text.toLowerCase()
    if (/home\s?page|homepage|front page/.test(t)) return 'Home'
    if (/category|listing|plp/.test(t)) return 'Category'
    if (/product page|pdp/.test(t)) return 'Product'
    if (/cart|checkout/.test(t)) return 'Cart'
    if (/custom page/.test(t)) return 'Custom'
    return null
  }

  const ENGINE_PAGE_DEFAULTS: Record<string, string> = {
    Home: 'personalized',
    Category: 'trending',
    Product: 'fbt',
    Cart: 'fbt',
    Custom: 'popular',
  }

  function buildEngineAdvice(text: string, context: Record<string, string>): DvIntentResult {
    const page = detectEnginePage(text) ?? context.page ?? null
    const key = detectEngineKey(text) ?? (page ? ENGINE_PAGE_DEFAULTS[page] : null) ?? 'personalized'
    const advice = ENGINE_ADVICE[key] ?? ENGINE_ADVICE.personalized!
    const where = page ? `your ${page} page` : 'your store'
    const alternates = Object.entries(ENGINE_ADVICE)
      .filter(([k]) => k !== key)
      .slice(0, 2)

    pending.value = { intent: 'engine', slot: 'type', context: { page: page ?? '' } }

    return {
      intent: 'engine',
      reply: `For ${where} I’d start with ${advice.label} — ${advice.why}. Show 4–10 products, add Popular Products as a fallback for first-time visitors, and use an Exclude filter to keep low-stock items out. Pick “${advice.label}” in the wizard and the preview updates live.`,
      speech: `I’d go with ${advice.label} for ${where}.`,
      cards: [
        {
          type: 'insight',
          props: {
            headline: `Recommended: ${advice.label}`,
            description: `Best fit for ${where} — ${advice.why}.`,
            severity: 'success',
            icon: advice.icon,
          },
        },
      ],
      quickReplies: alternates.map(([, alt]) => ({
        label: `What about ${alt.label}?`,
        value: `What about ${alt.label}?`,
        icon: alt.icon,
      })),
      pending: pending.value,
      steps: INTENT_STEPS.engine,
    }
  }

  function openJourneyWizard(goal: JourneyGoal) {
    const accountId = String(router.currentRoute.value.params.accountId ?? '2000290')
    void router.push({ name: 'CreateJourney', params: { accountId }, query: { ai: '1', goal } })
  }

  function buildJourneyDraftIntent(text: string, context: Record<string, string>): DvIntentResult {
    const goal = detectJourneyGoal(text) ?? (context.goal as JourneyGoal | undefined) ?? null

    if (!goal) {
      pending.value = { intent: 'journey', slot: 'goal', context: {} }
      return {
        intent: 'journey',
        reply: 'With pleasure. What should the journey do?',
        speech: 'Happy to draft that journey. What should it do?',
        cards: [],
        quickReplies: goalOptions.slice(0, 4).map(g => ({ label: g.label, value: g.label, icon: g.icon })),
        pending: pending.value,
      }
    }

    // Summarize the exact draft the wizard will open with (same generator).
    const draft = generateJourneyDraft({ goal, audience: 'All subscribers' })
    const emails = draft.sequence.length
    pending.value = { intent: 'journey', slot: 'open', context: { goal } }

    return {
      intent: 'journey',
      reply: `${draft.rationale} I've pre-filled the journey wizard with this brief — nothing is created until you review the draft and accept it.`,
      speech: `Draft ready: ${emails} emails. Want me to open the journey wizard?`,
      cards: [
        {
          type: 'insight',
          props: {
            headline: `Draft ready: ${draft.suggestedName}`,
            description: `${emails} ${emails === 1 ? 'email' : 'emails'}, branching on contact behaviour. Review it in the wizard — add your brand and offer there to personalize every subject line.`,
            severity: 'success',
            icon: 'workflow',
          },
        },
      ],
      quickReplies: [
        { label: 'Open in journey wizard', value: 'Open the journey wizard', icon: 'sparkles' },
        { label: 'Different goal', value: 'Draft a different journey', icon: 'refresh-ccw' },
      ],
      pending: pending.value,
      steps: INTENT_STEPS.journey,
    }
  }

  function handle(text: string): DvIntentResult {
    const trimmed = text.trim()

    if (pending.value) {
      const p = pending.value
      pending.value = null
      if (p.intent === 'campaign' && p.slot === 'audience') {
        return startCampaignDiscovery(trimmed)
      }
      if (p.intent === 'engine') {
        return buildEngineAdvice(trimmed, p.context)
      }
      if (p.intent === 'journey' && p.slot === 'goal') {
        return buildJourneyDraftIntent(trimmed, {})
      }
      if (p.intent === 'journey' && p.slot === 'open') {
        if (/\b(open|yes|go|sure|please|wizard|do it)\b/i.test(trimmed)) {
          openJourneyWizard((p.context.goal as JourneyGoal) ?? 'welcome')
          return {
            intent: 'journey',
            reply: 'Opening the journey wizard — your brief is pre-filled and the draft is ready to review.',
            speech: 'Opening the journey wizard.',
            cards: [],
            pending: null,
          }
        }
        // Anything else falls through to a fresh classification below.
      }
    }

    const intent = classifyIntent(trimmed)
    switch (intent) {
      case 'campaign':
        return startCampaignDiscovery(trimmed)
      case 'product':
        return buildProduct()
      case 'revenue':
        return buildRevenue()
      case 'segment':
        return buildSegment(trimmed)
      case 'engine':
        return buildEngineAdvice(trimmed, {})
      case 'journey':
        return buildJourneyDraftIntent(trimmed, {})
      default:
        return buildFallback()
    }
  }

  /**
   * Async variant of `handle`. The multi-turn `pending` slot and the four known
   * intents (campaign / product / revenue / segment) resolve instantly and
   * identically to `handle`. Only open-ended (fallback) input is routed to Gemini
   * Flash for a smart reply, degrading to the canned `buildFallback()` when Gemini
   * is unavailable (no key / network / provider error).
   */
  async function answer(
    text: string,
    opts: { history?: GeminiTurn[]; context?: string; signal?: AbortSignal } = {},
  ): Promise<DvIntentResult> {
    const trimmed = text.trim()

    // Deterministic flows stay byte-for-byte: a pending clarification or any known
    // intent goes straight through the existing synchronous handler.
    if (pending.value || classifyIntent(trimmed) !== 'fallback') {
      return handle(text)
    }

    const smart = await askGemini(trimmed, opts.history ?? [], { context: opts.context, signal: opts.signal })
    if (!smart) return buildFallback()

    return {
      intent: 'fallback',
      reply: smart.reply,
      speech: smart.speech,
      steps: INTENT_STEPS.fallback,
      cards: smart.card
        ? [
            {
              type: 'insight',
              props: {
                headline: smart.card.headline,
                description: smart.card.description,
                severity: smart.card.severity ?? 'info',
                icon: 'sparkles',
              },
            },
          ]
        : [],
      quickReplies: SUGGESTION_CHIPS,
      pending: null,
    }
  }

  function reset() {
    pending.value = null
  }

  return {
    pending,
    classify: classifyIntent,
    handle,
    answer,
    reset,
    suggestionChips: SUGGESTION_CHIPS,
  }
}
