import { ref } from 'vue'
import router from '@/router'
import { askGemini, type GeminiTurn } from '@/services/geminiClient'
import { generateJourneyDraft, goalOptions, type JourneyGoal } from '@/composables/useJourneyGenerator'
import { useDaVinciCampaignOnboarding } from '@/composables/useDaVinciCampaignOnboarding'
import type { DaVinciToastInput } from '@/composables/useDaVinciToasts'
import { useCommerceStore } from '@/stores/useCommerce'
import { useContactsStore } from '@/stores/useContacts'
import {
  fallbackSpeech,
  productDrafts,
  productSpeech,
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
        draftId?: number
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
    // Goal language is a journey ask even without the word "journey": "win back
    // customers who haven't bought in 90 days", "re-engage dormant subscribers",
    // "recover abandoned carts". The handler maps it onto a goal via detectJourneyGoal.
    || /\b(win[- ]?back|lapsed|stopped buying|re-?engage|dormant|abandoned carts?|cart abandon)/.test(t)
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
  // Revenue needs a revenue word. The old rule also fired on bare "this week" and
  // "made", so "which products should I put on sale this week?" came back as a
  // revenue card instead of reaching the advisor.
  if (/\b(revenue|sales|gmv|aov|average order value|earnings)\b|\bhow much (did|have|do) (we|i)\b/.test(t)) {
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
  const commerce = useCommerceStore()
  const contacts = useContactsStore()
  let seq = 0

  function currentAccountId(): string {
    return String(router.currentRoute.value.params.accountId ?? '2000290')
  }

  /**
   * Hands a campaign request to the onboarding wizard, which asks for the objective
   * and audience before creating a real, editable draft. Never fabricates a draft:
   * every card it returns carries a draftId that opens the real campaign builder.
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

  /**
   * Last 7 days vs the 7 before, from the same orders the dashboard KPIs read —
   * the card used to quote canned figures ($128,420 / 1,284 orders) that
   * contradicted the Overview dashboard in the same session.
   */
  function buildRevenue(): DvIntentResult {
    const DAY = 86_400_000
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const orderTime = (order: { date?: string }) => new Date(order.date ?? '').getTime()
    const ordersBetween = (from: number, to: number) =>
      commerce.orders.filter((order) => {
        const ts = orderTime(order)
        return ts >= from && ts < to
      })
    const sumTotal = (orders: Array<{ total: string }>) => orders.reduce((sum, order) => sum + parseFloat(order.total), 0)

    const current = ordersBetween(todayStart - 6 * DAY, todayStart + DAY)
    const previous = ordersBetween(todayStart - 13 * DAY, todayStart - 6 * DAY)
    const revenue = sumTotal(current)
    const previousRevenue = sumTotal(previous)
    const aov = current.length ? revenue / current.length : 0
    const previousAov = previous.length ? previousRevenue / previous.length : 0

    const pct = (value: number, base: number) => (base ? ((value - base) / base) * 100 : 0)
    const trend = (value: number, base: number) => {
      const change = pct(value, base)
      return { trend: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, trendUp: change >= 0 }
    }
    const money = (value: number) =>
      value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    const count = (value: number) => value.toLocaleString('en-US')

    const labels: string[] = []
    const bars: number[][] = []
    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const start = todayStart - daysAgo * DAY
      labels.push(new Date(start).toLocaleDateString('en-US', { weekday: 'short' }))
      bars.push([Math.round(sumTotal(ordersBetween(start, start + DAY)))])
    }

    const revenueChange = pct(revenue, previousRevenue)
    const direction = revenueChange >= 0 ? 'up' : 'down'
    const reply = `Revenue is ${direction} ${Math.abs(revenueChange).toFixed(1)}% on the week before — ${money(revenue)} across ${count(current.length)} orders in the last 7 days.`

    return {
      intent: 'revenue',
      reply,
      speech: `Revenue is ${direction} ${Math.abs(Math.round(revenueChange))} percent this week — ${money(revenue)}, across ${count(current.length)} orders.`,
      cards: [
        {
          type: 'kpis',
          props: {
            kpis: [
              { label: 'Revenue', value: money(revenue), ...trend(revenue, previousRevenue), icon: 'dollar-sign' },
              { label: 'Orders', value: count(current.length), ...trend(current.length, previous.length), icon: 'shopping-cart' },
              { label: 'Avg order value', value: money(aov), ...trend(aov, previousAov), icon: 'receipt' },
            ],
          },
        },
        {
          type: 'chart',
          props: {
            title: 'Revenue · last 7 days',
            subtitle: `${money(revenue)} total · ${trend(revenue, previousRevenue).trend} vs prior week`,
            bars,
            labels,
            seriesNames: ['Revenue ($)'],
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

  function copyText(text: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(text).catch(() => {})
  }

  /**
   * Performs a card action for real and returns the toast to show. One shared
   * implementation for the drawer and the full-page experience — the hosts used to
   * answer "Save segment" with a "Segment saved" toast and write nothing, while the
   * disclosure promised Da Vinci "won't change your account on its own".
   */
  function performCardAction(card: DvCardDescriptor, action: string): DaVinciToastInput | null {
    const accountId = currentAccountId()
    if (card.type === 'segment') {
      if (action === 'save') {
        const segment = contacts.addSegment({
          name: card.props.name,
          description: card.props.rules.join(' · '),
          count: card.props.estimatedSize,
          type: 'Dynamic',
          status: 'Active',
        })
        return {
          title: `Segment "${segment.name}" created`,
          sub: 'It refreshes daily. Nothing has been sent to it.',
          action: 'Open segments',
          onAction: () => {
            void router.push({ name: 'Segments', params: { accountId } })
          },
        }
      }
      if (action === 'preview') {
        void router.push({ name: 'Segments', params: { accountId } })
        return { title: 'Opening segments', sub: 'Matching contacts are listed on the segment page.' }
      }
    }
    if (card.type === 'content') {
      if (action === 'copy') {
        copyText(card.props.content)
        return { title: 'Copied to clipboard' }
      }
      if (action === 'edit' || action === 'use') {
        copyText(card.props.content)
        const target = card.props.type === 'product'
          ? { name: 'ProductNew', params: { accountId }, query: { source: 'davinci' } }
          : { name: 'EmailContent', params: { accountId }, query: { source: 'davinci' } }
        void router.push(target)
        return {
          title: card.props.type === 'product' ? 'Copied — opening the product editor' : 'Copied — opening email content',
          sub: 'Paste the draft where you want it. Nothing is saved until you do.',
        }
      }
    }
    return null
  }

  return {
    pending,
    classify: classifyIntent,
    handle,
    performCardAction,
    answer,
    reset,
    suggestionChips: SUGGESTION_CHIPS,
  }
}
