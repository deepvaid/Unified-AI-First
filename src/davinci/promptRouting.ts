// Which lane answers a prompt: a dashboard widget draft, one of Da Vinci's canned
// intents, or the Gemini advisor. Pure — unit-tested under `node --test`
// (tests/davinci/routing.test.ts).
//
// The rule the old code broke: an explicit chart request ("Create a revenue by channel
// widget") must never lose to a keyword intent (the revenue card), and a question
// ("Explain this chart", "How can I increase sales?") must reach the advisor rather
// than be pattern-matched into a canned card.

import type { DashboardMetricDescriptor } from '../stores/dashboards/metricCatalog.ts'
import type { DashboardDatePreset } from '../stores/dashboards/types.ts'
import { normalizePrompt, parseWidgetRequest, resolveWidgetRequest, type WidgetResolution } from './widgetRequest.ts'

export type DvIntentKind = 'campaign' | 'product' | 'revenue' | 'segment' | 'engine' | 'journey' | 'fallback'

// ── Question shapes ──────────────────────────────────────────────────────────

const QUESTION_LEAD = /^(?:what|what's|whats|which|why|how|how's|hows|who|when|where|is|are|do|does|did|can|could|should|would|will|was|were)\b/
const POLITE_REQUEST = /^(?:can|could|would|will) (?:you|u)\b|^please\b/
/** "What needs my attention?", "How do I…?" — wants an answer, not an action. */
export const isQuestion = (t: string): boolean => (/\?\s*$/.test(t) || QUESTION_LEAD.test(t)) && !POLITE_REQUEST.test(t)

const HOW_TO = /^(?:how (?:do|can|should|would|could|to)\b|what(?:'s| is| are) (?:the )?(?:best|right|ideal|good|recommended)\b|when (?:should|is the best)\b|is it (?:ok|okay|good|worth|possible)\b|should (?:i|we)\b|can i\b|could i\b)/
const isHowTo = (t: string): boolean => HOW_TO.test(t)

const EXPLAIN_LEAD = /^(?:please |can you |could you )?(?:explain|summari[sz]e|interpret|describe|analy[sz]e|walk me through|break down|recap)\b/
const ASK_LEAD = /^(?:why|which|what|what's|how|how's|should|is|are|does|do|where|when)\b/
const WIDGET_NOUN = /\b(?:charts?|graphs?|plots?|widgets?|visuali[sz]ations?|tiles?|kpis?|metrics?|dashboards?|tables?|heat ?maps?|gauges?|funnels?|donuts?|pies?|trends?|numbers?|figures?|reports?)\b/
const MAKE_VERB = /\b(?:add|create|make|build|draft|put|pin|plot|visuali[sz]e|show me)\b/

/** "Explain this chart", "Which KPI should I focus on?" — talk ABOUT the data, don't draw more of it. */
export function isExplainQuestion(t: string): boolean {
  return EXPLAIN_LEAD.test(t) || (ASK_LEAD.test(t) && WIDGET_NOUN.test(t) && !MAKE_VERB.test(t))
}

// ── Intent classification ────────────────────────────────────────────────────

const JOURNEY_MAKE = /\b(?:build|create|draft|make|set ?up|start|want|need)\b[^.]*\b(?:journey|automation|drip|flow|series|sequence)\b/
const JOURNEY_TEMPLATE = /welcome series|abandoned cart (?:journey|flow|recovery)|win[- ]?back (?:journey|flow|series)/
// Goal language is a journey ask even without the word "journey": "win back customers
// who haven't bought in 90 days", "re-engage dormant subscribers".
const JOURNEY_GOAL = /\b(?:win[- ]?back|lapsed|stopped buying|re-?engage|dormant|abandoned carts?|cart abandon)/
const REVIEW_VERB = /\b(?:review|analy[sz]e|check|audit|improve|optimi[sz]e|edit|fix|pause|delete|understand|explain|summari[sz]e|performance)\b/

const REVIEW_QUESTION = /\b(?:was|were|did|how (?:good|well|is|are|many|big)|how's|performance|results|report|doing|any good)\b/
const CAMPAIGN_A = /\b(?:run|send|create|launch|draft|set ?up|start|schedule|build|make|want|need|plan)\b[^.]*\b(?:campaign|promo|promotion|blast|newsletter)\b/
const CAMPAIGN_B = /send .*(?:email|campaign)|email .*(?:blast|campaign)/
const ENGINE = /\brecommendation(?:s)?\s+(?:engine|widget|type)\b|which\s+(?:recommendation|engine)|\bengine\b.*\b(?:use|pick|choose|recommend)\b|shoppers\s+(?:should\s+)?see/
const PRODUCT = /\b(?:add|create|new|draft|write)\b.*\b(?:product|item|sku)\b|\bproduct description\b/
// "Draft an email announcing our new product" is email copy, not a product description.
const NOT_PRODUCT_COPY = /\b(?:email|newsletter|campaign|sms|blog|post|announcement)\b/

const REVENUE_WORD = /\b(?:revenue|sales|gmv|aov|average order value|earnings|takings)\b/
const REVENUE_STATUS = /\b(?:how(?:'s| is| are| was| were| did| has| have| does| do)|what(?:'s| is| are| was| were| did)|show me|give me|tell me|report(?: on)?|check|summary of|update on|overview of)\b/
const REVENUE_PERIOD = /\b(?:today|yesterday|so far|to date|this (?:week|month|quarter|year)|(?:last|past) (?:week|month|quarter|year|\d+ days?)|mtd|ytd|wtd)\b/
const HOW_MUCH = /\bhow much (?:did|have|do|are|is|has|was) (?:we|i|my (?:store|shop|business))\b/
const ADVICE = /\b(?:increase|improve|boost|grow|raise|drive|lift|double|maximi[sz]e|optimi[sz]e|strateg(?:y|ies)|ideas?|tips?|advice|should|ways? to|how (?:can|do|could|would|should) (?:i|we)|help me|get more|more (?:sales|revenue))\b/
const CONTENT = /\b(?:draft|write|compose|email|newsletter|post|copy|subject line|campaign|promo|announcement|blog)\b/
/** Writing requests that merely mention a metric ("Draft a sales email…") are not widget asks. */
const COPY_REQUEST = /\b(?:draft|write|compose|rewrite|proofread|subject line|announcement|blog|caption|tweet)\b/
/**
 * "orders", "open rate", "top campaigns" — a short noun phrase that names a metric. A sentence
 * that merely contains one ("I want to review my welcome journey") is a conversation, not a
 * request for the Journeys in Flight widget.
 */
function looksLikeMetricAsk(t: string): boolean {
  return t.split(/\s+/).length <= 8 && !REVIEW_VERB.test(t) && !COPY_REQUEST.test(t) && !/^(?:i|we|help|let's|lets)\b/.test(t)
}
export const DIAGNOSTIC = /\b(?:drop(?:ped|ping)?|fell|fall(?:ing|en)?|declin(?:e|ed|ing)|decreas(?:e|ed|ing)|spik(?:e|ed|ing)|went (?:up|down)|(?:is|are|was|were) (?:up|down)|flat|stall(?:ed|ing)?|why|wrong|broken|problem|issue)\b/

/** "How's revenue this week?" / "how much did we make" — a status ask, not advice or copywriting. */
function isRevenueStatus(t: string): boolean {
  if (DIAGNOSTIC.test(t) || ADVICE.test(t)) return false
  if (HOW_MUCH.test(t)) return true
  return REVENUE_WORD.test(t) && !CONTENT.test(t) && (REVENUE_STATUS.test(t) || REVENUE_PERIOD.test(t))
}

const SEGMENT_NOUN = /\b(?:segments?|audiences?|cohorts?|group of)\b|\b(?:vip|loyal|best|top) (?:customers?|buyers?|shoppers?|subscribers?)\b/
const SEGMENT_VERB = /\b(?:build|create|make|set ?up|define|save|start|draft|generate|want|need|find|list|show)\b/
const isSegmentCreate = (t: string): boolean => SEGMENT_NOUN.test(t) && SEGMENT_VERB.test(t) && !isQuestion(t)

export function classifyIntent(text: string): DvIntentKind {
  const t = normalizePrompt(text)
  if (isExplainQuestion(t)) return 'fallback'

  // Journey CREATION only. Reviews, journeys named in quotes (already being built) and
  // questions ("What's my cart abandonment rate?") go to the advisor.
  const asksToCreate = !/["“”]/.test(text) && !REVIEW_VERB.test(t) && !isQuestion(t)
  if (asksToCreate && (JOURNEY_MAKE.test(t) || JOURNEY_TEMPLATE.test(t))) return 'journey'

  // "Was my last campaign any good?" and "How do I run a campaign?" are questions for the
  // advisor, not briefs for the campaign wizard.
  const isReviewQuestion = REVIEW_QUESTION.test(t)
  const howTo = isHowTo(t)
  if (!isReviewQuestion && !howTo && (CAMPAIGN_A.test(t) || CAMPAIGN_B.test(t))) return 'campaign'

  // Goal language without the word "journey" ("win back customers who haven't bought in 90
  // days") — after the campaign check so "run a campaign to lapsed buyers" stays a campaign.
  if (asksToCreate && JOURNEY_GOAL.test(t)) return 'journey'

  if (ENGINE.test(t)) return 'engine'
  if (!isReviewQuestion && !howTo && PRODUCT.test(t) && !NOT_PRODUCT_COPY.test(t)) return 'product'
  if (isRevenueStatus(t)) return 'revenue'
  if (!isReviewQuestion && isSegmentCreate(t)) return 'segment'
  return 'fallback'
}

// ── Widget requests ──────────────────────────────────────────────────────────

/** The merchant asked to SEE something: a chart word, a breakdown, a time series. */
export function wantsVisual(text: string): boolean {
  const t = normalizePrompt(text)
  if (isHowTo(t)) return false
  const req = parseWidgetRequest(t)
  if (req.family) return true
  if (/\b(?:add|put|pin)\b.*\b(?:to|on) (?:my|the|this) dashboard\b/.test(t)) return true
  if (req.dimension || req.grain) return true
  if (isQuestion(t)) return false
  return req.timeShape && /\b(?:show|add|plot|make|create|build|draft|give me|put|pin|display|visuali[sz]e|track)\b/.test(t)
}

// ── Lane decision ────────────────────────────────────────────────────────────

export interface RouteContext {
  onDashboard: boolean
  /** A dashboard the draft can land on (the routed one, or the last viewed). */
  hasDashboard: boolean
  metrics: DashboardMetricDescriptor[]
  dashboardRange?: DashboardDatePreset
}

export type RouteDecision =
  | { lane: 'widget'; resolution: WidgetResolution }
  | { lane: 'widget-hint' }
  | { lane: 'intent'; intent: Exclude<DvIntentKind, 'fallback'> }
  | { lane: 'gemini' }

export function routePrompt(text: string, ctx: RouteContext): RouteDecision {
  const t = normalizePrompt(text)
  if (isExplainQuestion(t)) return { lane: 'gemini' }

  const intent = classifyIntent(text)
  const resolve = () => resolveWidgetRequest(text, ctx.metrics, { dashboardRange: ctx.dashboardRange })

  // Explicit chart words beat canned cards.
  if (wantsVisual(t)) {
    if (ctx.hasDashboard) {
      const resolution = resolve()
      if (resolution) return { lane: 'widget', resolution }
    }
    return intent !== 'fallback' ? { lane: 'intent', intent } : { lane: 'widget-hint' }
  }

  if (intent !== 'fallback') return { lane: 'intent', intent }

  // On a dashboard, a bare metric word ("orders") is a request for that metric.
  if (ctx.hasDashboard && ctx.onDashboard && !isQuestion(t) && !DIAGNOSTIC.test(t) && looksLikeMetricAsk(t)) {
    const resolution = resolve()
    if (resolution) return { lane: 'widget', resolution }
  }
  return { lane: 'gemini' }
}
