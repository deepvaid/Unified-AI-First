import { storeToRefs } from 'pinia'
import router from '@/router'
import { askGeminiResult, type GeminiFailure, type GeminiTurn } from '@/services/geminiClient'
import { goalOptions, type JourneyGoal } from '@/composables/useJourneyGenerator'
import { useDaVinciCampaignOnboarding } from '@/composables/useDaVinciCampaignOnboarding'
import type { DaVinciToastInput } from '@/composables/useDaVinciToasts'
import { generateCreateDraft, generateEnrichDraft, type CatalogVocab } from '@/composables/useCatalogGenerator'
import { useCommerceStore, type Product } from '@/stores/useCommerce'
import { useContactsStore } from '@/stores/useContacts'
import { useAccountsStore } from '@/stores/useAccounts'
import { useCopilotStore, type AddedWidgetRef, type CampaignOnboardingProps } from '@/stores/useCopilot'
import { isDashboardSourceAvailable } from '@/stores/dashboards/metricCatalog'
import { productSalesMix } from '@/stores/dashboards/productMix'
import type { DashboardMetricId, DashboardMetricUnit } from '@/stores/dashboards/types'
import { templateById } from '@/stores/journeyFlowData'
import { templateSetupById } from '@/stores/journeyTemplateSetup'
import { parseLocalDateKey } from '@/utils/localDate'
import { classifyIntent, type DvIntentKind } from '@/davinci/promptRouting'
import { detectEngineKey, detectEnginePage, detectJourneyGoal, slotVerdict, type PendingSlot } from '@/davinci/pendingSlot'
import { displayName, matchProductName } from '@/davinci/productMatch'
import { answerSegmentRequest } from '@/davinci/segmentRequest'
import { fallbackSpeech, productSpeech, segmentSpeech } from './dvIntentData'

// Unified Da Vinci intent layer — port of the Marojarvis prototype's regex
// classifier + handlers (formerly https://davinci-ai-first.vercel.app), re-domained
// to Maropost mock data. Card descriptors map 1:1 onto the existing Dv* card
// components and are rendered by DvIntentCardList on every surface (copilot
// drawer + full-screen AI experience).
//
// Per-instance (NOT a singleton): each conversation surface owns its own
// multi-turn `pending` clarification state. `handle()` is synchronous — each
// surface owns its own thinking delay.

// Classification lives in src/davinci/promptRouting.ts (pure, unit-tested); re-exported for callers.
export type { DvIntentKind }
export { classifyIntent, detectJourneyGoal }

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
      props: {
        type: 'email' | 'product' | 'blog' | 'sms'
        title: string
        content: string
        /** The catalogue product a product draft is for — "use" opens that product rather than a new one. */
        productId?: number
      }
    }
  | {
      type: 'kpis'
      props: { kpis: Array<{ label: string; value: string; trend?: string; trendUp?: boolean; icon?: string }> }
    }
  | {
      type: 'chart'
      props: {
        title?: string
        subtitle?: string
        labels: string[]
        series: Array<{ name: string; data: number[]; isComparison?: boolean }>
        unit?: DashboardMetricUnit
        /** The dashboard metric the chart can be saved as. */
        saveMetricId?: DashboardMetricId
        /** The widget it was saved as (set by DvIntentCardList once saved). */
        savedTo?: AddedWidgetRef | null
      }
    }
  | {
      type: 'segment'
      props: {
        name: string
        rules: string[]
        estimatedSize: number
        /** The segment this card was saved as — set on the message so a remount can't save twice. */
        savedSegmentId?: number
      }
    }
  | {
      type: 'insight'
      props: {
        headline: string
        description: string
        severity?: 'info' | 'warning' | 'success' | 'error'
        icon?: string
        actionLabel?: string
        /** Where the action button goes (route name, resolved with the current account). */
        routeName?: string
      }
    }

export interface DvQuickReply {
  label: string
  value: string
  icon?: string
  /** Secondary line, shown by the 'list' layout only. */
  hint?: string
}

export type DvPending = PendingSlot

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
  /** The campaign wizard's readiness card, when a request said enough to go straight to it. */
  onboardingCard?: CampaignOnboardingProps
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
  journey: ['Match journey template'],
  fallback: ['Consult Da Vinci brain'],
}

export const SUGGESTION_CHIPS: DvQuickReply[] = [
  { label: 'Run a campaign', value: 'Run a campaign', icon: 'megaphone' },
  { label: 'Draft a product description', value: 'Draft a product description', icon: 'package' },
  { label: "How's revenue this week?", value: "How's revenue this week?", icon: 'trending-up' },
  { label: 'Build a VIP segment', value: 'Build a VIP customer segment', icon: 'users' },
]

export function useDaVinciIntents() {
  // The open clarification lives in the copilot store: New chat clears it, and the drawer and the
  // full-page experience share one thread, so they share one slot.
  const { pendingSlot: pending } = storeToRefs(useCopilotStore())
  const campaignOnboarding = useDaVinciCampaignOnboarding()
  const commerce = useCommerceStore()
  const contacts = useContactsStore()
  const accounts = useAccountsStore()

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
    const response = campaignOnboarding.requestCampaign(accountId, audienceHint)

    return {
      intent: 'campaign',
      reply: response.reply,
      speech: response.speech,
      cards: response.cards ?? [],
      quickReplies: response.quickReplies,
      onboardingCard: response.onboardingCard,
      pending: null,
      steps: INTENT_STEPS.campaign,
    }
  }

  /**
   * A description for the product the request names: one of the merchant's own when it is in the
   * catalogue, else whatever was described; with nothing named, the current best seller. It used to
   * alternate between two invented products ("Aurora Trail Jacket", "Coastline Canvas Tote") whatever was
   * asked. The copy comes from the Catalog Co-Pilot's generator, so every surface writes the same one.
   */
  function buildProduct(text: string): DvIntentResult {
    const vocab: CatalogVocab = {
      categories: [...new Set(commerce.products.map((product) => product.category))],
      collections: [],
      brands: [...new Set(commerce.products.map((product) => product.vendor))],
    }
    const describe = (product: Product): string => {
      const detail = product.detail
      const outcome = generateEnrichDraft(
        {
          name: product.name,
          subtitle: detail?.subtitle ?? '',
          sku: product.sku,
          description: detail?.description ?? '',
          brand: detail?.brand ?? product.vendor,
          tag: detail?.tag ?? '',
          categories: detail?.categories ?? [product.category],
          collection: detail?.collection ?? '',
          options: detail?.options ?? [],
        },
        'description',
        text,
        vocab,
      )
      return (outcome.ok && outcome.draft.description) || detail?.description || ''
    }
    const result = (title: string, content: string, reply: string, productId?: number): DvIntentResult => ({
      intent: 'product',
      reply,
      speech: productSpeech(title),
      cards: [{ type: 'content', props: { type: 'product', title, content, productId } }],
      pending: null,
      steps: INTENT_STEPS.product,
    })

    const named = matchProductName(text, commerce.products.map((product) => product.name))
    const product = named ? commerce.products.find((entry) => entry.name === named) : undefined
    if (product) {
      const title = displayName(product.name)
      return result(title, describe(product), `Here’s a description draft for “${title}”. Copy it, or open the product to use it — nothing changes until you save.`, product.id)
    }

    // Not in the catalogue, but described ("a ceramic mug called Morning Ritual"): draft for that.
    const fresh = generateCreateDraft(text, vocab)
    if (fresh.ok && fresh.draft.title && fresh.draft.description) {
      return result(fresh.draft.title, fresh.draft.description, `Here’s a description draft for “${fresh.draft.title}”. Use it as-is, or ask me to adjust the tone.`)
    }

    // No product named: the best seller is the one most worth a fresh description.
    const topName = productSalesMix(1)[0]?.name ?? ''
    const bestSeller = commerce.products.find((entry) => entry.name.startsWith(topName)) ?? commerce.products[0]
    if (bestSeller) {
      const title = displayName(bestSeller.name)
      return result(title, describe(bestSeller), `You didn’t name a product, so I drafted one for your best seller, “${title}”. Name another and I’ll write that instead.`, bestSeller.id)
    }
    const reply = 'There are no products in this catalogue yet. Add one in Products and I’ll draft its description.'
    return { intent: 'product', reply, speech: reply, cards: [], pending: null, steps: INTENT_STEPS.product }
  }

  /**
   * Last 7 days vs the 7 before, from the same orders the dashboard KPIs read —
   * the card used to quote canned figures ($128,420 / 1,284 orders) that
   * contradicted the Overview dashboard in the same session.
   */
  function buildRevenue(): DvIntentResult {
    // Revenue is a Commerce number. Without Commerce there is nothing to report — the card used
    // to show the (global) mock store's revenue to a marketing-only account.
    const account = accounts.accounts.find((entry) => entry.id === currentAccountId())
    if (account && !isDashboardSourceAvailable('commerce', account)) {
      const reply = 'This account doesn’t have Commerce, so there is no revenue to report yet. Once a store is connected I can break it down by day and by channel.'
      return { intent: 'revenue', reply, speech: reply, cards: [], quickReplies: SUGGESTION_CHIPS, pending: null, steps: INTENT_STEPS.revenue }
    }

    const today = new Date()
    // Local midnight N days from today. Built from date parts, not `- N * 86_400_000`, so a DST change
    // inside the window can't slide an order into its neighbouring day.
    const dayStart = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset).getTime()
    const orderTime = (order: { date?: string }) => parseLocalDateKey(order.date).getTime()
    const ordersBetween = (from: number, to: number) =>
      commerce.orders.filter((order) => {
        const ts = orderTime(order)
        return ts >= from && ts < to
      })
    const sumTotal = (orders: Array<{ total: string }>) => orders.reduce((sum, order) => sum + parseFloat(order.total), 0)

    const current = ordersBetween(dayStart(-6), dayStart(1))
    const previous = ordersBetween(dayStart(-13), dayStart(-6))
    const revenue = sumTotal(current)
    const previousRevenue = sumTotal(previous)
    const aov = current.length ? revenue / current.length : 0
    const previousAov = previous.length ? previousRevenue / previous.length : 0

    const pct = (value: number, base: number) => (base ? ((value - base) / base) * 100 : 0)
    const trend = (value: number, base: number) => {
      const change = pct(value, base)
      // Flat is neither good nor bad — leave `trendUp` unset so it reads neutral, not green.
      return { trend: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, trendUp: Math.abs(change) < 0.05 ? undefined : change >= 0 }
    }
    const money = (value: number) =>
      value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    const count = (value: number) => value.toLocaleString('en-US')

    // Each day of this week beside the same weekday a week earlier — the chart shows the comparison the subtitle claims.
    const labels: string[] = []
    const thisWeek: number[] = []
    const lastWeek: number[] = []
    for (let offset = -6; offset <= 0; offset++) {
      labels.push(new Date(dayStart(offset)).toLocaleDateString('en-US', { weekday: 'short' }))
      thisWeek.push(Math.round(sumTotal(ordersBetween(dayStart(offset), dayStart(offset + 1)))))
      lastWeek.push(Math.round(sumTotal(ordersBetween(dayStart(offset - 7), dayStart(offset - 6)))))
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
            labels,
            series: [
              { name: 'Revenue', data: thisWeek },
              { name: 'Previous 7 days', data: lastWeek, isComparison: true },
            ],
            unit: 'currency',
            saveMetricId: 'commerce_revenue_over_time',
          },
        },
      ],
      pending: null,
      steps: INTENT_STEPS.revenue,
    }
  }

  /**
   * The segment the request describes, measured against the segments this account already has
   * (src/davinci/segmentRequest.ts). It used to be one of two canned cards whatever was asked — "customers
   * who haven't purchased in 90 days" came back as "High-intent shoppers" with a made-up size.
   */
  function buildSegment(text: string): DvIntentResult {
    const { spec, existing, size } = answerSegmentRequest(text, contacts.segments)
    const count = size.toLocaleString('en-US')
    if (existing) {
      // Already in the account: show it with its real count (the card reads as saved) rather than draft a twin.
      return {
        intent: 'segment',
        reply: `You already have this one: “${existing.name}” holds ${count} contacts. Open it in Segments, or tell me how you’d change it.`,
        speech: `You already have a ${existing.name} segment, with ${count} contacts.`,
        cards: [{ type: 'segment', props: { name: existing.name, rules: [...spec.rules], estimatedSize: size, savedSegmentId: existing.id } }],
        pending: null,
        steps: INTENT_STEPS.segment,
      }
    }
    return {
      intent: 'segment',
      reply: `“${spec.name}” is drafted — about ${count} contacts match right now. Save it to add it to your segments; nothing is sent to it.`,
      speech: segmentSpeech(spec.spokenName, size),
      // A fresh props object per message: the card records `savedSegmentId` on it once saved.
      cards: [{ type: 'segment', props: { name: spec.name, rules: [...spec.rules], estimatedSize: size } }],
      pending: null,
      steps: INTENT_STEPS.segment,
    }
  }

  /**
   * `unavailable` labels the canned reply when the Gemini advisor could not answer — otherwise a
   * merchant cannot tell a real answer from the fallback. `busy` (rate-limited / too slow) is worth
   * retrying in a moment; `offline` is not reachable at all.
   */
  function buildFallback(unavailable?: GeminiFailure): DvIntentResult {
    if (unavailable === 'busy') {
      return {
        intent: 'fallback',
        reply: "Da Vinci's advisor is busy right now — try that again in a moment. I can still run campaigns, draft product copy, report on revenue, or build audience segments:",
        speech: 'The advisor is busy right now. Try again in a moment.',
        cards: [
          {
            type: 'insight',
            props: {
              headline: 'Advisor busy',
              description: 'Too many requests, or the answer took too long. Try again in a moment — the actions below work without it.',
              severity: 'warning',
              icon: 'hourglass',
            },
          },
        ],
        quickReplies: SUGGESTION_CHIPS,
        pending: null,
      }
    }
    if (unavailable === 'offline') {
      return {
        intent: 'fallback',
        reply: "Da Vinci's advisor is offline right now, so I can't answer that one. I can still run campaigns, draft product copy, report on revenue, or build audience segments:",
        speech: "The advisor is offline right now. I can still run campaigns, draft product copy, report on revenue, or build segments.",
        cards: [
          {
            type: 'insight',
            props: {
              headline: 'Advisor offline',
              description: 'Open-ended answers need the Da Vinci connection. Try again in a moment — the actions below work without it.',
              severity: 'warning',
              icon: 'wifi-off',
            },
          },
        ],
        quickReplies: SUGGESTION_CHIPS,
        pending: null,
      }
    }
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
    const template = goal ? templateById[goal] : undefined

    if (!goal || !template) {
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

    // Describe the template the wizard really opens (`?goal=` lands on the template of that id) — not a
    // generated draft the wizard never sees, which is what this used to summarise and then call "pre-filled".
    // The count the wizard's Setup step asks content for (a template's graph can hold more send nodes than that).
    const emails = templateSetupById[goal]?.emails.length ?? 0
    const emailCopy = emails ? ` You choose the content for ${emails} ${emails === 1 ? 'email' : 'emails'} in the wizard.` : ''
    pending.value = { intent: 'journey', slot: 'open', context: { goal } }

    return {
      intent: 'journey',
      reply: `The ${template.name} template fits that. I can open it in the journey wizard — you name it and choose the list and content there, and nothing is created until you finish.`,
      speech: `The ${template.name} journey fits that. Want me to open the journey wizard?`,
      cards: [
        {
          type: 'insight',
          props: {
            headline: `${template.name} journey`,
            description: `${template.description}${emailCopy}`,
            severity: 'info',
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

  /** Acknowledge a "no" to an open offer without starting anything. */
  function acknowledgeDecline(slot: PendingSlot): DvIntentResult {
    const reply = slot.intent === 'journey' && slot.slot === 'open'
      ? 'No problem — I won’t open the wizard.'
      : slot.intent === 'journey'
        ? 'No problem. Tell me what the journey should do whenever you’re ready.'
        : 'No problem — ask me about recommendation engines any time.'
    return { intent: slot.intent, reply, speech: reply, cards: [], quickReplies: SUGGESTION_CHIPS, pending: null }
  }

  /**
   * A reply that answers (or declines) the open clarification. Anything else releases the
   * slot and returns null — the old code treated the NEXT message as the answer, so one
   * engine question turned every later prompt into engine advice.
   */
  function resolvePending(text: string): DvIntentResult | null {
    const slot = pending.value
    if (!slot) return null
    const verdict = slotVerdict(slot, text)
    pending.value = null
    if (verdict === 'unrelated') return null
    if (verdict === 'decline') return acknowledgeDecline(slot)
    if (slot.intent === 'engine') return buildEngineAdvice(text, slot.context)
    if (slot.intent === 'journey' && slot.slot === 'goal') return buildJourneyDraftIntent(text, {})
    if (slot.intent === 'journey' && slot.slot === 'open') {
      const goal = (slot.context.goal as JourneyGoal) ?? 'welcome'
      const templateName = templateById[goal]?.name
      openJourneyWizard(goal)
      return {
        intent: 'journey',
        reply: `Opening the journey wizard${templateName ? ` on the ${templateName} template` : ''} — nothing is created until you finish setup.`,
        speech: 'Opening the journey wizard.',
        cards: [],
        pending: null,
      }
    }
    return null
  }

  /** True when `text` answers an open clarification; otherwise the slot is released and the message routes normally. */
  function claimsPendingSlot(text: string): boolean {
    const slot = pending.value
    if (!slot) return false
    if (slotVerdict(slot, text.trim()) === 'unrelated') {
      pending.value = null
      return false
    }
    return true
  }

  function handle(text: string): DvIntentResult {
    const trimmed = text.trim()
    const answered = resolvePending(trimmed)
    if (answered) return answered

    switch (classifyIntent(trimmed)) {
      case 'campaign':
        return startCampaignDiscovery(trimmed)
      case 'product':
        return buildProduct(trimmed)
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
    if (claimsPendingSlot(trimmed) || classifyIntent(trimmed) !== 'fallback') {
      return handle(text)
    }

    const result = await askGeminiResult(trimmed, opts.history ?? [], { context: opts.context, signal: opts.signal })
    if (!result.ok) return buildFallback(result.failure)
    const smart = result.reply

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
                actionLabel: smart.action?.label,
                routeName: smart.action?.routeName,
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

  /** Whether the text really reached the clipboard — browsers refuse it without permission or focus. */
  async function copyText(text: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  /**
   * Performs a card action for real and returns the toast that says what happened — or null when the
   * action changed nothing worth announcing. One shared implementation for the drawer and the
   * full-page experience: the hosts used to answer "Save segment" with a "Segment saved" toast and
   * write nothing, while the disclosure promised Da Vinci "won't change your account on its own".
   * Saving a segment records `savedSegmentId` on the card, so the message keeps showing "Saved".
   */
  async function performCardAction(card: DvCardDescriptor, action: string): Promise<DaVinciToastInput | null> {
    const accountId = currentAccountId()
    if (card.type === 'segment') {
      const openSegments = () => {
        void router.push({ name: 'Segments', params: { accountId } })
      }
      if (action === 'save') {
        // Saving the same card twice — or a segment the account already has — must not add a duplicate.
        const existing = contacts.segments.find((segment) => segment.name.toLowerCase() === card.props.name.toLowerCase())
        if (existing) {
          card.props.savedSegmentId = existing.id
          return {
            tone: 'info',
            title: `"${existing.name}" is already in your segments`,
            sub: 'I didn’t add a second copy.',
            action: 'Open segments',
            onAction: openSegments,
          }
        }
        const segment = contacts.addSegment({
          name: card.props.name,
          description: card.props.rules.join(' · '),
          count: card.props.estimatedSize,
          type: 'Dynamic',
          status: 'Active',
        })
        card.props.savedSegmentId = segment.id
        return {
          title: `Segment "${segment.name}" created`,
          sub: 'It refreshes daily. Nothing has been sent to it.',
          action: 'Open segments',
          onAction: openSegments,
        }
      }
      if (action === 'open') {
        openSegments()
        return null
      }
    }
    if (card.type === 'insight' && card.props.routeName) {
      const name = card.props.routeName
      void router.push({ name, params: { accountId } })
      return { title: `Opening ${name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}` }
    }
    if (card.type === 'content' && (action === 'copy' || action === 'use')) {
      const copied = await copyText(card.props.content)
      if (action === 'copy') {
        return copied
          ? { title: 'Copied to clipboard' }
          : { tone: 'warning', title: 'Couldn’t copy the draft', sub: 'Your browser blocked clipboard access — select the text to copy it yourself.' }
      }
      const isProduct = card.props.type === 'product'
      const where = isProduct ? 'the product editor' : 'email content'
      const productId = card.props.productId
      const open = () => {
        // A draft for a product already in the catalogue opens that product, not a blank new one.
        void router.push(
          !isProduct ? { name: 'EmailContent', params: { accountId }, query: { source: 'davinci' } }
            : productId != null ? { name: 'ProductEdit', params: { accountId, productId: String(productId) }, query: { source: 'davinci' } }
              : { name: 'ProductNew', params: { accountId }, query: { source: 'davinci' } },
        )
      }
      // Without the clipboard the draft can't travel — stay put and say so, rather than open an empty editor.
      if (!copied) {
        return {
          tone: 'warning',
          title: 'Couldn’t copy the draft',
          sub: 'Your browser blocked clipboard access. Copy it from the chat, then open the editor.',
          action: `Open ${where}`,
          onAction: open,
        }
      }
      open()
      return { title: `Copied — opening ${where}`, sub: 'Paste the draft where you want it. Nothing is saved until you do.' }
    }
    return null
  }

  return {
    pending,
    classify: classifyIntent,
    claimsPendingSlot,
    offline: () => buildFallback('offline'),
    handle,
    performCardAction,
    answer,
    reset,
    suggestionChips: SUGGESTION_CHIPS,
  }
}
