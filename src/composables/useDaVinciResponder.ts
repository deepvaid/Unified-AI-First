import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { type GeminiTurn } from '@/services/geminiClient'
import { useDaVinciCampaignOnboarding, type CampaignOnboardingResponse } from '@/composables/useDaVinciCampaignOnboarding'
import { useDaVinciContext } from '@/composables/useDaVinciContext'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import { INTENT_STEPS, useDaVinciIntents, type DvIntentResult } from '@/composables/useDaVinciIntents'
import { useDaVinciSetupOnboarding, type SetupOnboardingResponse } from '@/composables/useDaVinciSetupOnboarding'
import { useDaVinciTarget } from '@/composables/useDaVinciTarget'
import { makeId } from '@/davinci/conversation'
import { landingPrompts } from '@/davinci/followUps'
import { routePrompt, type RouteContext, type RouteDecision } from '@/davinci/promptRouting'
import { draftFromResolution, rationaleFor, timeBasisLabel } from '@/davinci/widgetRequest'
import { getAvailableMetrics } from '@/stores/dashboards/metricCatalog'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
import { useCopilotStore, type AddedWidgetRef, type ChatComponent, type ChatMessage } from '@/stores/useCopilot'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'
import { useDaVinciSetupStore } from '@/stores/useDaVinciSetup'

// One reply path for every Da Vinci conversation surface — the drawer and the full-page
// experience. They used to route separately, and drifted: the experience had no widget lane,
// no workspace context for Gemini, no way to stop a reply, and rendered none of the drafts
// the drawer could post into the shared thread.
//
// A turn is: flows (guided setup, then the campaign wizard) → `plan` (which lane answers,
// and what to show while it works) → `reply` (build the assistant message). Hosts own the
// pacing — the drawer's step ticker and Stop button, the experience's speech loop — and how
// a finished turn is shown and spoken.

export type DvFlowResponse = SetupOnboardingResponse | CampaignOnboardingResponse

export type DvFlowTurn =
  | { kind: 'setup'; response: SetupOnboardingResponse }
  | { kind: 'campaign'; response: CampaignOnboardingResponse }
  /** No flow claimed the message; `notices` are pause acknowledgements to show before the answer. */
  | { kind: 'pass'; notices: DvFlowResponse[] }

export type DvReplyLane = 'slot' | 'widget' | 'widget-hint' | 'intent' | 'gemini'

export interface DvReplyPlan {
  lane: DvReplyLane
  route?: RouteDecision
  /** Tool steps to show while the reply is being worked out. */
  steps: string[]
  /** One line for the header while working. */
  status: string
  /** How long the working state lasts before the reply lands. */
  paceMs: number
}

export interface DvAssistantTurn {
  message: ChatMessage
  /** Spoken form; falls back to the text. */
  speech: string
  /** Plain caption for the voice surface. */
  caption: string
  /** Set for widget drafts — the voice surface renders the draft card. */
  draft: DashboardWidgetDraft | null
  note: string | null
  draftedCount: number
}

/** "Here’s 1 widget I drafted for Overview." — plain text: it is also spoken, and Gemini sees it as history. */
export function draftCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'widget' : 'widgets'}`
}

export function draftIntro(count: number, dashboardName: string): string {
  return `Here’s ${draftCountLabel(count)} I drafted for ${dashboardName}. Select Add widget to review and confirm.`
}

export function useDaVinciResponder() {
  const copilot = useCopilotStore()
  const router = useRouter()
  const { pushToast } = useDaVinciToasts()
  const intents = useDaVinciIntents()
  const setupOnboarding = useDaVinciSetupOnboarding()
  const campaignOnboarding = useDaVinciCampaignOnboarding()
  const setupStore = useDaVinciSetupStore()
  const onboarding = useDaVinciOnboardingStore()
  const { contextBlock } = useDaVinciContext()
  const target = useDaVinciTarget()

  /** What the router needs to know about where we are — drives the lane, the chips and the pills. */
  const routeContext = computed<RouteContext>(() => ({
    onDashboard: target.isDashboardRoute.value,
    hasDashboard: !!(target.accountId.value && target.dashboard.value),
    metrics: getAvailableMetrics(target.account.value),
    dashboardRange: target.dashboard.value?.filters.rangePreset,
  }))

  // ── 1. Guided flows ────────────────────────────────────────────────────────
  // Setup first, then the campaign wizard — and each only answers for the account it belongs to.
  // Either pauses itself for off-topic questions; the pause notice is acknowledged once, then the
  // normal assistant answers the actual question.
  function flowTurn(text: string, accountId: string | null): DvFlowTurn {
    const setupActive = !!accountId && setupStore.isActive && setupStore.activeAccountId === accountId
    const setupResponse = setupActive ? setupOnboarding.handleText(text) : null
    if (setupResponse) return { kind: 'setup', response: setupResponse }

    const campaignActive = !!accountId && onboarding.isActive && onboarding.activeAccountId === accountId
    const campaignResponse = campaignActive ? campaignOnboarding.handleText(text) : null
    if (campaignResponse) return { kind: 'campaign', response: campaignResponse }

    const notices = [setupOnboarding.consumePauseNotice(), campaignOnboarding.consumePauseNotice()].filter(
      (notice): notice is DvFlowResponse => !!notice,
    )
    return { kind: 'pass', notices }
  }

  /** A flow's (or a plain intent's) response as a chat message: setup goal chips, campaign readiness card, quick replies… */
  function flowMessage(response: DvFlowResponse | DvIntentResult): ChatMessage {
    const components: ChatComponent[] = []
    const cards = 'cards' in response ? response.cards ?? [] : []
    if (cards.length || response.quickReplies?.length) {
      components.push({ type: 'intentCards', props: { cards, quickReplies: response.quickReplies } })
    }
    if ('onboardingCard' in response && response.onboardingCard) {
      components.push({ type: 'campaignOnboarding', props: response.onboardingCard })
    }
    if ('setupCard' in response && response.setupCard) {
      components.push({ type: 'setupOnboarding', props: response.setupCard })
    }
    return {
      id: makeId('a'),
      role: 'assistant',
      text: response.reply,
      componentData: components.length ? components : undefined,
      toolSteps: 'steps' in response ? response.steps : undefined,
    }
  }

  // ── 2. Which lane answers ──────────────────────────────────────────────────
  function plan(text: string): DvReplyPlan {
    // A reply that answers an open clarification (engine page, journey goal, yes/no) is a
    // conversational turn, not tool work. Anything else releases the slot and routes fresh.
    if (intents.claimsPendingSlot(text)) return { lane: 'slot', steps: [], status: 'Working on it…', paceMs: 900 }

    const route = routePrompt(text, routeContext.value)
    const dashboard = target.dashboard.value

    if (route.lane === 'widget' && dashboard) {
      const metric = route.resolution.metric
      const label = metric.label.toLowerCase()
      const basis = timeBasisLabel(metric, dashboard.filters.rangePreset).toLowerCase()
      return {
        lane: 'widget',
        route,
        steps: [`Check ${dashboard.name} widgets`, `Pull ${label} · ${basis}`, 'Draft widget'],
        status: `Pulling ${label} · ${basis}`,
        paceMs: 1200,
      }
    }
    if (route.lane === 'widget-hint') {
      return { lane: 'widget-hint', route, steps: INTENT_STEPS.fallback, status: 'Working on it…', paceMs: 1200 }
    }
    if (route.lane === 'intent') {
      return { lane: 'intent', route, steps: INTENT_STEPS[route.intent], status: 'Working on it…', paceMs: 1200 }
    }
    return { lane: 'gemini', route, steps: INTENT_STEPS.fallback, status: 'Working on it…', paceMs: 1200 }
  }

  // ── 3. The reply ───────────────────────────────────────────────────────────
  function fromIntentResult(res: DvIntentResult): DvAssistantTurn {
    return {
      message: {
        id: makeId('a'),
        role: 'assistant',
        text: res.reply,
        toolSteps: res.steps,
        componentData:
          res.cards.length || res.quickReplies?.length
            ? [{ type: 'intentCards', props: { cards: res.cards, quickReplies: res.quickReplies } }]
            : undefined,
      },
      speech: res.speech ?? res.reply,
      caption: res.reply,
      draft: null,
      note: null,
      draftedCount: 0,
    }
  }

  function widgetTurn(route: Extract<RouteDecision, { lane: 'widget' }>, text: string, steps: string[]): DvAssistantTurn {
    const dashboard = target.dashboard.value!
    const { resolution } = route
    const draft: DashboardWidgetDraft = {
      ...draftFromResolution(resolution, dashboard.id, text),
      lastRefreshedAt: new Date().toISOString(),
    }
    const intro = draftIntro(1, dashboard.name)
    return {
      message: {
        id: makeId('a'),
        role: 'assistant',
        text: intro,
        toolSteps: steps,
        componentData: [
          {
            type: 'widgetDraftSet',
            props: {
              drafts: [draft],
              rationale: rationaleFor(resolution),
              conversationId: copilot.ensureConversationId(),
              dashboardName: dashboard.name,
              notes: [resolution.note ?? null],
            },
          },
        ],
      },
      speech: intro,
      caption: intro,
      draft,
      note: resolution.note ?? null,
      draftedCount: 1,
    }
  }

  function hintTurn(): DvAssistantTurn {
    const reply = "I couldn't map that to a supported widget yet. Try asking for revenue, orders, open rate, campaigns, contact growth, or ticket volume."
    const prompts = landingPrompts(routeContext.value)
    return {
      message: {
        id: makeId('a'),
        role: 'assistant',
        text: reply,
        componentData: [
          {
            type: 'intentCards',
            props: {
              cards: [
                {
                  type: 'insight',
                  props: {
                    headline: 'Try a widget-ready prompt',
                    description: prompts.length
                      ? 'Tap one of these, or describe the number you want to see.'
                      : 'Describe the number you want to see — revenue, orders, open rate, campaigns, contacts or tickets.',
                    severity: 'info',
                    icon: 'sparkles',
                  },
                },
              ],
              quickReplies: prompts.map((prompt) => ({ label: prompt, value: prompt, icon: 'plus' })),
            },
          },
        ],
      },
      speech: reply,
      caption: reply,
      draft: null,
      note: null,
      draftedCount: 0,
    }
  }

  /** Builds the assistant turn. Only the Gemini lane waits; it rethrows the caller's own abort. */
  async function reply(
    replyPlan: DvReplyPlan,
    text: string,
    opts: { history?: GeminiTurn[]; signal?: AbortSignal } = {},
  ): Promise<DvAssistantTurn> {
    if (replyPlan.lane === 'widget' && replyPlan.route?.lane === 'widget') return widgetTurn(replyPlan.route, text, replyPlan.steps)
    if (replyPlan.lane === 'widget-hint') return hintTurn()
    if (replyPlan.lane === 'gemini') {
      return fromIntentResult(await intents.answer(text, { history: opts.history, context: contextBlock.value, signal: opts.signal }))
    }
    return fromIntentResult(intents.handle(text))
  }

  // ── 4. After a draft is added ──────────────────────────────────────────────
  /** Remembers on the message that draft `index` became a widget, and says so — one toast, with a link. */
  function announceDraftAdded(added: AddedWidgetRef, messageId: string, index: number) {
    copilot.markDraftAdded(messageId, index, added)
    pushToast({
      title: `Widget added to ${added.dashboardName}`,
      sub: added.title,
      action: 'View',
      onAction: () => {
        void router.push({ name: 'DashboardDetail', params: { accountId: added.accountId, dashboardId: added.dashboardId } })
      },
    })
  }

  return {
    intents,
    target,
    routeContext,
    flowTurn,
    flowMessage,
    plan,
    reply,
    offlineTurn: () => fromIntentResult(intents.offline()),
    announceDraftAdded,
  }
}
