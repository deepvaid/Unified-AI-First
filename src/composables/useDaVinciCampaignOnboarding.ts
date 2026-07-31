import { computed } from 'vue'
import { useAccountsStore } from '@/stores/useAccounts'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { useContactsStore } from '@/stores/useContacts'
import { useContentStore } from '@/stores/useContent'
import { useOnboardingStore } from '@/stores/useOnboarding'
import { usePlgStore } from '@/stores/usePlg'
import { useRbacStore } from '@/stores/useRbac'
import {
  useDaVinciOnboardingStore,
  type CampaignAudienceSelection,
  type CampaignContextBrief,
  type CampaignReadinessItem,
  type DaVinciInputMode,
} from '@/stores/useDaVinciOnboarding'
import type { CampaignOnboardingProps } from '@/stores/useCopilot'
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'
import type {
  DvCardDescriptor,
  DvIntentKind,
  DvQuickReply,
} from '@/composables/useDaVinciIntents'

export interface CampaignOnboardingResponse {
  intent: DvIntentKind
  reply: string
  speech?: string
  cards?: DvCardDescriptor[]
  quickReplies?: DvQuickReply[]
  onboardingCard?: CampaignOnboardingProps
}

export const CAMPAIGN_OBJECTIVES: DvQuickReply[] = [
  { label: 'Promote an offer', value: 'Promote an offer', icon: 'badge-percent' },
  { label: 'Announce something', value: 'Announce something', icon: 'megaphone' },
  { label: 'Reconnect with customers', value: 'Reconnect with customers', icon: 'user-round-check' },
  { label: 'Share a newsletter', value: 'Share a newsletter', icon: 'newspaper' },
  { label: 'Something else', value: 'Something else', icon: 'message-circle-question' },
]

const SKIP_REPLY: DvQuickReply = { label: 'Skip for now', value: 'Skip for now', icon: 'redo-2' }
const CONTINUE_REPLY: DvQuickReply = { label: 'Continue campaign', value: 'Continue campaign', icon: 'play' }
const NO_AUDIENCE_REPLY: DvQuickReply = {
  label: 'I don’t have an audience yet',
  value: 'I don’t have an audience yet',
  icon: 'user-round-plus',
}
const UNSURE_AUDIENCE_REPLY: DvQuickReply = {
  label: 'I’m not sure',
  value: 'I’m not sure which audience to use',
  icon: 'circle-help',
}

const CAMPAIGN_ROUTE_REGISTRY: Record<CampaignReadinessItem['id'], string> = {
  marketing: 'Plans',
  permission: 'SettingsUsersPermissions',
  plan: 'Plans',
  domain: 'SettingsDnsSetup',
  sender: 'ContactLists',
  audience: 'ContactLists',
  content: 'EmailContent',
}
const READINESS_FRESHNESS_MS = 5 * 60 * 1000

const OBJECTIVE_PATTERNS = [
  /offer|promotion|promo|sale|discount/i,
  /announce|announcement|launch|new product/i,
  /reconnect|win.?back|lapsed|miss/i,
  /newsletter|update|digest/i,
]

function isAmbiguousObjective(text: string): boolean {
  return OBJECTIVE_PATTERNS.filter((pattern) => pattern.test(text)).length > 1
}

function isUnsupportedActionRequest(text: string): boolean {
  return (
    /\b(create|build|write|send|schedule|publish|launch)\b.{0,24}\b(for me|on my behalf|right now)\b/i.test(text)
    || /^(create|build|send|schedule|publish|launch)\s+(it|this|the campaign|my campaign)[.! ]*$/i.test(text)
  )
}

/**
 * True when mid-setup text is a question or clearly about something other than
 * this campaign — the wizard pauses and lets the normal assistant answer.
 */
function isOffTopic(text: string): boolean {
  if (/\b(recheck|check again|change|different|restart|brief|use|builder)\b/i.test(text)) return false
  if (/\?\s*$/.test(text)) return true
  if (/^(what|how|why|when|where|who|which|can|could|do|does|is|are|show|tell)\b/i.test(text)) return true
  return /\b(revenue|sales|ticket|widget|dashboard|order|product description|report)\b/i.test(text)
}

export function useDaVinciCampaignOnboarding() {
  const onboarding = useDaVinciOnboardingStore()
  const setupGuide = useOnboardingStore()
  const accounts = useAccountsStore()
  const rbac = useRbacStore()
  const plg = usePlgStore()
  const cdp = useCdpEntitiesStore()
  const contacts = useContactsStore()
  const content = useContentStore()

  const session = computed(() => onboarding.activeSession)

  function audienceChoices(): CampaignAudienceSelection[] {
    const lists: CampaignAudienceSelection[] = cdp.lists.slice(0, 4).map((list) => ({
      kind: 'list',
      id: list.id,
      name: list.name,
      count: list.count,
    }))
    const segments: CampaignAudienceSelection[] = contacts.segments.slice(0, 2).map((segment) => ({
      kind: 'segment',
      id: segment.id,
      name: segment.name,
      count: segment.count,
    }))
    return [...lists, ...segments]
  }

  function audienceReplies(): DvQuickReply[] {
    return [
      ...audienceChoices().slice(0, 4).map((audience) => ({
        label: audience.name,
        value: `Use ${audience.name}`,
        icon: audience.kind === 'list' ? 'list-checks' : 'users',
      })),
      NO_AUDIENCE_REPLY,
      UNSURE_AUDIENCE_REPLY,
      SKIP_REPLY,
    ]
  }

  function findAudience(text: string): CampaignAudienceSelection | null {
    const normalized = text.toLowerCase()
    const choices = audienceChoices()
    const exact = choices.find((audience) => normalized.includes(audience.name.toLowerCase()))
    if (exact) return exact
    if (/\bvip\b|loyal|best customer/.test(normalized)) {
      return choices.find((audience) => /vip|loyal/.test(audience.name.toLowerCase())) ?? null
    }
    if (/lapsed|inactive|win.?back|reconnect/.test(normalized)) {
      return choices.find((audience) => /lapsed|win.?back|inactive/.test(audience.name.toLowerCase())) ?? null
    }
    if (/all|everyone|subscriber/.test(normalized)) {
      return choices.find((audience) => /master|subscriber|all/.test(audience.name.toLowerCase())) ?? choices[0] ?? null
    }
    return null
  }

  function readinessItems(): CampaignReadinessItem[] {
    const checkedAt = new Date().toISOString()
    const selectedAudience = session.value?.brief.audience ?? null
    const domainCompletion = setupGuide.completed['sending-domain']
    const domainStatus = session.value?.freshAccount
      ? 'unknown'
      : domainCompletion === true
        ? 'ready'
        : domainCompletion === false
          ? 'needs-attention'
          : 'unknown'
    const permissions = rbac.effectivePermissions(rbac.currentUserId)
    const canCreateCampaign = permissions.has('marketing.campaigns.create')
    const marketingEnabled = accounts.hasSubscription('marketing')
    const senderAvailable = cdp.lists.some((list) => !!list.fromName.trim() && !!list.fromEmail.trim())

    return [
      {
        id: 'marketing',
        label: 'Marketing Cloud',
        description: marketingEnabled
          ? 'Marketing Cloud is available for this account.'
          : 'This account does not include Marketing Cloud.',
        status: marketingEnabled ? 'ready' : 'needs-attention',
        routeName: CAMPAIGN_ROUTE_REGISTRY.marketing,
        actionLabel: marketingEnabled ? 'Review plan' : 'View Marketing plans',
        checkedAt,
      },
      {
        id: 'permission',
        label: 'Campaign access',
        description: canCreateCampaign
          ? 'Your current role can create campaigns.'
          : 'Your current role cannot create campaigns. Ask an account owner for access.',
        status: canCreateCampaign ? 'ready' : 'needs-attention',
        routeName: CAMPAIGN_ROUTE_REGISTRY.permission,
        actionLabel: canCreateCampaign ? 'Review access' : 'View users and permissions',
        checkedAt,
      },
      {
        id: 'plan',
        label: 'Account status',
        description: plg.isExpired
          ? 'This trial has expired. Choose a plan before creating a campaign.'
          : plg.isTrial
            ? `${plg.daysLeft} trial day${plg.daysLeft === 1 ? '' : 's'} remaining.`
            : 'The account is active.',
        status: plg.isExpired ? 'needs-attention' : 'ready',
        routeName: CAMPAIGN_ROUTE_REGISTRY.plan,
        actionLabel: plg.isExpired ? 'Choose a plan' : 'Review plan',
        checkedAt,
      },
      {
        id: 'domain',
        label: 'Sending domain',
        description: domainStatus === 'ready'
          ? 'The setup guide marks the sending domain as authenticated.'
          : domainStatus === 'unknown'
            ? 'Da Vinci cannot verify the domain yet. Check DNS setup before sending.'
            : 'Open DNS setup before sending so recipients can trust the message.',
        status: domainStatus,
        routeName: CAMPAIGN_ROUTE_REGISTRY.domain,
        actionLabel: domainStatus === 'ready' ? 'Review domain' : 'Check DNS setup',
        checkedAt,
      },
      {
        id: 'sender',
        label: 'Sender identity',
        description: senderAvailable
          ? 'At least one sender name and email address are available to review.'
          : 'Add a sender name and email address before sending.',
        status: senderAvailable ? 'ready' : 'needs-attention',
        routeName: CAMPAIGN_ROUTE_REGISTRY.sender,
        actionLabel: senderAvailable ? 'Review sender details' : 'Add sender details',
        checkedAt,
      },
      {
        id: 'audience',
        label: 'Audience',
        description: selectedAudience
          ? `${selectedAudience.name} has ${selectedAudience.count.toLocaleString()} contacts.`
          : 'No audience is selected yet. You can create one first or choose it in the builder.',
        status: selectedAudience && selectedAudience.count > 0 ? 'ready' : 'needs-attention',
        routeName: CAMPAIGN_ROUTE_REGISTRY.audience,
        actionLabel: selectedAudience ? 'Review audience' : 'Create an audience',
        checkedAt,
      },
      {
        id: 'content',
        label: 'Email content',
        description: content.items.length
          ? `${content.items.length} templates are available to review in the campaign builder.`
          : 'Create or import email content before scheduling the campaign.',
        status: content.items.length ? 'ready' : 'needs-attention',
        routeName: CAMPAIGN_ROUTE_REGISTRY.content,
        actionLabel: 'Browse templates',
        checkedAt,
      },
    ]
  }

  function readinessIsStale(items: CampaignReadinessItem[]) {
    if (!items.length) return true
    return items.some((item) => {
      const checkedAt = new Date(item.checkedAt).getTime()
      return !Number.isFinite(checkedAt) || Date.now() - checkedAt > READINESS_FRESHNESS_MS
    })
  }

  function start(
    accountId: string,
    inputMode: DaVinciInputMode,
    options: { audienceHint?: string } = {},
  ): CampaignOnboardingResponse {
    onboarding.begin(accountId)
    onboarding.setInputMode(inputMode)
    onboarding.setStage('objective')
    onboarding.setAudienceHint(options.audienceHint ?? null)
    const named = options.audienceHint ? findAudience(options.audienceHint) : null
    return {
      intent: 'campaign',
      reply: named
        ? `You mentioned ${named.name}. First, what should this campaign achieve?`
        : 'First, what should this campaign achieve?',
      speech: 'First, what should this campaign achieve?',
      quickReplies: [...CAMPAIGN_OBJECTIVES, SKIP_REPLY],
    }
  }

  function audiencePrompt(objective: string): CampaignOnboardingResponse {
    if (/^something else[.! ]*$/i.test(objective)) {
      return {
        intent: 'campaign',
        reply: 'Tell me the outcome you want from this campaign. A short description is enough.',
        speech: 'What outcome do you want from this campaign?',
        quickReplies: [SKIP_REPLY],
      }
    }
    if (isAmbiguousObjective(objective)) {
      return {
        intent: 'campaign',
        reply: 'I hear more than one goal. Which should this first campaign focus on?',
        speech: 'Which goal should this first campaign focus on?',
        quickReplies: CAMPAIGN_OBJECTIVES.slice(0, 4),
      }
    }

    onboarding.setObjective(objective)
    const accountId = session.value?.accountId
    if (accountId) trackDaVinciOnboardingEvent('objective_completed', accountId, { objective })

    const hint = session.value?.audienceHint
    const named = hint ? findAudience(hint) : null
    if (named) {
      onboarding.setAudienceHint(null)
      return readinessResponse(named)
    }

    return {
      intent: 'campaign',
      reply: `Got it — the goal is to ${objective.toLowerCase()}. Who should receive it? I’ll only use read-only audience information from this account.`,
      speech: 'Who should receive it?',
      quickReplies: audienceReplies(),
    }
  }

  function readinessResponse(audience: CampaignAudienceSelection | null): CampaignOnboardingResponse {
    onboarding.setAudience(audience)
    const accountId = session.value?.accountId
    if (accountId) {
      trackDaVinciOnboardingEvent('audience_completed', accountId, {
        audienceId: audience?.id ?? null,
        audienceKind: audience?.kind ?? null,
        skipped: audience === null,
      })
    }
    const items = readinessItems()
    onboarding.setReadiness(items)
    return readinessCardResponse(items)
  }

  function readinessCardResponse(items: CampaignReadinessItem[]): CampaignOnboardingResponse {
    const blockers = items.filter((item) => item.status !== 'ready')
    return {
      intent: 'campaign',
      reply: blockers.length
        ? `I found ${blockers.length} setup ${blockers.length === 1 ? 'item' : 'items'} to review. I can guide you to the first one, or you can review the brief and continue in the campaign builder.`
        : 'Your campaign setup checks are ready. Review the brief, then you can continue in the campaign builder.',
      speech: blockers.length
        ? `I found ${blockers.length} setup ${blockers.length === 1 ? 'item' : 'items'} to review.`
        : 'Your campaign setup checks are ready.',
      onboardingCard: {
        kind: 'readiness',
        title: blockers.length ? 'Review your campaign setup' : 'Campaign setup is ready',
        description: 'Da Vinci can check and guide, but it cannot create, schedule, or send the campaign.',
        step: 3,
        totalSteps: 4,
        items,
        actions: [
          { label: 'Review campaign brief', action: 'review-brief', icon: 'clipboard-list' },
          { label: 'Change objective', action: 'change-objective', icon: 'refresh-cw' },
          { label: 'Change audience', action: 'change-audience', icon: 'users' },
          { label: 'Continue later', action: 'continue-later', icon: 'pause' },
        ],
      },
    }
  }

  function contextBriefResponse(
    brief: CampaignContextBrief,
    intro = 'Your campaign brief is ready to use as a guide.',
  ): CampaignOnboardingResponse {
    return {
      intent: 'campaign',
      reply: `${intro} Nothing has been created, saved, scheduled, or sent.`,
      speech: 'Your campaign brief is ready. Nothing has been created or sent.',
      onboardingCard: {
        kind: 'brief',
        title: 'Your campaign brief',
        description: 'Use this as your checklist in the standard campaign builder.',
        step: 4,
        totalSteps: 4,
        brief,
        actions: [
          { label: 'Open campaign builder', action: 'open-builder', icon: 'arrow-up-right' },
          { label: 'Change objective', action: 'change-objective', icon: 'refresh-cw' },
          { label: 'Change audience', action: 'change-audience', icon: 'users' },
          { label: 'Review setup', action: 'review-setup', icon: 'list-checks' },
          { label: 'Continue later', action: 'continue-later', icon: 'pause' },
        ],
      },
    }
  }

  function buildContextBrief(): CampaignOnboardingResponse {
    const active = session.value
    if (!active) {
      return {
        intent: 'campaign',
        reply: 'Start campaign guidance first so I can prepare a read-only brief.',
      }
    }

    const readiness = readinessItems()
    onboarding.setReadiness(readiness)
    const blockers = readiness.filter((item) => item.status !== 'ready')
    const contextBrief: CampaignContextBrief = {
      channel: 'Email',
      objective: active.brief.objective || 'Decide in the campaign builder',
      audience: active.brief.audience?.name ?? 'Choose in the campaign builder',
      readinessSummary: blockers.length
        ? `${blockers.length} setup ${blockers.length === 1 ? 'item needs' : 'items need'} attention`
        : 'All checked setup items are ready',
      nextSteps: [
        ...blockers.slice(0, 3).map((item) => `Review ${item.label.toLowerCase()}`),
        'Choose the campaign type and enter the details',
        'Add content, review timing, and send when you are ready',
      ],
      createdAt: new Date().toISOString(),
    }
    onboarding.setContextBrief(contextBrief)
    trackDaVinciOnboardingEvent('brief_ready', active.accountId, { blockers: blockers.length })
    return contextBriefResponse(contextBrief)
  }

  function changeObjective(): CampaignOnboardingResponse {
    onboarding.setStage('objective')
    return {
      intent: 'campaign',
      reply: 'What should this campaign achieve instead?',
      speech: 'What should this campaign achieve instead?',
      quickReplies: CAMPAIGN_OBJECTIVES,
    }
  }

  function changeAudience(): CampaignOnboardingResponse {
    onboarding.setStage('audience')
    return {
      intent: 'campaign',
      reply: 'Who should receive this campaign instead?',
      speech: 'Who should receive this campaign instead?',
      quickReplies: audienceReplies(),
    }
  }

  function reviewSetup(): CampaignOnboardingResponse {
    const items = readinessItems()
    onboarding.setReadiness(items)
    return readinessCardResponse(items)
  }

  let pauseNotice: CampaignOnboardingResponse | null = null

  function consumePauseNotice(): CampaignOnboardingResponse | null {
    const notice = pauseNotice
    pauseNotice = null
    return notice
  }

  function pausedResponse(): CampaignOnboardingResponse {
    return {
      intent: 'campaign',
      reply: 'No problem — campaign guidance is paused. Ask me anything; say “continue campaign” when you’re ready.',
      speech: 'Campaign guidance is paused. Say continue campaign when you are ready.',
      quickReplies: [CONTINUE_REPLY],
    }
  }

  function pause(): CampaignOnboardingResponse {
    const active = session.value
    const fromStage = active?.stage ?? 'unknown'
    onboarding.setPaused(true)
    if (active) trackDaVinciOnboardingEvent('onboarding_paused', active.accountId, { from: fromStage })
    return pausedResponse()
  }

  function skipStage(): CampaignOnboardingResponse | null {
    const active = session.value
    if (!active) return null
    if (active.stage === 'welcome' || active.stage === 'choice' || active.stage === 'voice-consent' || active.stage === 'objective') {
      onboarding.setObjective('Decide in the campaign builder')
      return {
        intent: 'campaign',
        reply: 'No problem — you can decide the goal in the builder. Who should receive it?',
        speech: 'Who should receive it?',
        quickReplies: audienceReplies(),
      }
    }
    if (active.stage === 'audience') {
      const response = readinessResponse(null)
      return {
        ...response,
        reply: `You can choose the audience in the builder. ${response.reply}`,
        speech: response.speech,
      }
    }
    if (active.stage === 'readiness') return buildContextBrief()
    return null
  }

  function handleText(text: string): CampaignOnboardingResponse | null {
    const active = session.value
    if (!active || active.stage === 'complete') return null
    const trimmed = text.trim()
    if (!trimmed) return null

    if (active.stage === 'paused') {
      if (/\b(continue|resume)\b.*\bcampaign|\bcampaign\b.*\b(continue|resume)\b/i.test(trimmed)) {
        onboarding.setPaused(false)
        trackDaVinciOnboardingEvent('onboarding_resumed', active.accountId, { from: 'paused' })
        return resume()
      }
      return null
    }

    if (isUnsupportedActionRequest(trimmed)) {
      trackDaVinciOnboardingEvent('unsupported_action_requested', active.accountId, { stage: active.stage })
      return {
        intent: 'campaign',
        reply: 'I can help shape the campaign, check setup, and guide you through the builder, but I can’t create, schedule, or send it for you.',
        speech: 'I can guide you, but I cannot create or send the campaign.',
        onboardingCard: {
          kind: 'unsupported',
          title: 'You stay in control of campaign actions',
          description: 'Da Vinci can explain and guide. Only you can enter, save, schedule, or send campaign details.',
          step: active.contextBrief ? 4 : 3,
          totalSteps: 4,
          actions: active.contextBrief
            ? [{ label: 'Open campaign builder', action: 'open-builder', icon: 'arrow-up-right' }]
            : [{ label: 'Review campaign setup', action: 'review-setup', icon: 'list-checks' }],
        },
        quickReplies: active.contextBrief
          ? [{ label: 'Review campaign brief', value: 'Review campaign brief', icon: 'clipboard-list' }]
          : [CONTINUE_REPLY],
      }
    }

    if (/^(cancel|stop|exit|quit|pause|not now|no thanks|(maybe )?later)[.! ]*$/i.test(trimmed)) {
      trackDaVinciOnboardingEvent('onboarding_skipped', active.accountId, { stage: active.stage, kind: 'paused' })
      return pause()
    }

    if (/\bskip\b/i.test(trimmed)) {
      const skipped = skipStage()
      if (skipped) return skipped
    }

    if (/\bchange\b.*\bobjective|\bdifferent\b.*\bgoal/i.test(trimmed)) return changeObjective()
    if (/\bchange\b.*\baudience|\bdifferent\b.*\b(list|segment|audience)/i.test(trimmed)) return changeAudience()
    if (/\b(review|show)\b.*\bbrief|\bopen campaign builder\b/i.test(trimmed)) return buildContextBrief()

    if (isOffTopic(trimmed)) {
      onboarding.setPaused(true)
      pauseNotice = {
        intent: 'campaign',
        reply: 'Campaign guidance is paused — say “continue campaign” whenever you’re ready.',
        quickReplies: [CONTINUE_REPLY],
      }
      return null
    }

    if (
      active.stage === 'objective'
      || active.stage === 'voice-consent'
      || active.stage === 'choice'
      || active.stage === 'welcome'
    ) {
      return audiencePrompt(trimmed)
    }
    if (active.stage === 'audience') {
      if (/\b(don.?t have|do not have|no audience|not sure|unsure|decide later)\b/i.test(trimmed)) {
        return readinessResponse(null)
      }
      const audience = findAudience(trimmed)
      if (!audience) {
        return {
          intent: 'campaign',
          reply: 'I couldn’t match that to an audience in this account. Choose one below, continue without one, or name another list or segment.',
          speech: 'I couldn’t match that audience. Please choose one below.',
          quickReplies: audienceReplies(),
        }
      }
      return readinessResponse(audience)
    }
    if (
      (active.stage === 'readiness' || active.stage === 'prerequisite-handoff')
      && /\b(done|finished|check|recheck|back|review setup|continue)\b/i.test(trimmed)
    ) {
      return reviewSetup()
    }
    if (active.stage === 'readiness' && /\b(continue|brief|create|draft|yes|ready|go)\b/i.test(trimmed)) {
      return buildContextBrief()
    }
    if (
      active.stage === 'brief-ready'
      || active.stage === 'builder-handoff'
    ) {
      return active.contextBrief ? contextBriefResponse(active.contextBrief) : buildContextBrief()
    }
    if (active.stage === 'prerequisite-handoff') return reviewSetup()
    return null
  }

  function routeForAction(action: string): string | null {
    const itemId = action.replace(/^open-/, '') as CampaignReadinessItem['id']
    if (!(itemId in CAMPAIGN_ROUTE_REGISTRY)) return null
    return CAMPAIGN_ROUTE_REGISTRY[itemId]
  }

  function handleAction(action: string): CampaignOnboardingResponse | null {
    if (action === 'review-brief') return buildContextBrief()
    if (action === 'change-brief' || action === 'change-objective') return changeObjective()
    if (action === 'change-audience') return changeAudience()
    if (action === 'review-setup') return reviewSetup()
    if (action === 'continue-later') return pause()
    return null
  }

  function resume(): CampaignOnboardingResponse | null {
    const active = session.value
    if (!active) return null
    if (active.stage === 'paused') return pausedResponse()
    if (active.stage === 'welcome' || active.stage === 'choice' || active.stage === 'voice-consent') {
      return {
        intent: 'campaign',
        reply: 'Welcome back. Choose voice or text when you are ready to shape your first campaign.',
      }
    }
    if (active.stage === 'objective') {
      return {
        intent: 'campaign',
        reply: 'Welcome back. What should your first campaign achieve?',
        speech: 'Welcome back. What should your first campaign achieve?',
        quickReplies: [...CAMPAIGN_OBJECTIVES, SKIP_REPLY],
      }
    }
    if (active.stage === 'audience') {
      const goalLine = active.brief.objective ? `The goal is to ${active.brief.objective.toLowerCase()}. ` : ''
      return {
        intent: 'campaign',
        reply: `Welcome back. ${goalLine}Who should receive it?`,
        speech: 'Welcome back. Who should receive this campaign?',
        quickReplies: audienceReplies(),
      }
    }
    if (active.stage === 'readiness' || active.stage === 'prerequisite-handoff') return reviewSetup()
    if (active.stage === 'brief-ready' || active.stage === 'builder-handoff') {
      if (readinessIsStale(active.readiness)) {
        const refreshed = buildContextBrief()
        return {
          ...refreshed,
          reply: `Welcome back. I refreshed the account readiness checks. ${refreshed.reply}`,
        }
      }
      return active.contextBrief
        ? contextBriefResponse(active.contextBrief, 'Welcome back. Your campaign brief is still here.')
        : buildContextBrief()
    }
    if (active.stage === 'complete') {
      return {
        intent: 'campaign',
        reply: 'Your guided onboarding is complete. You can start another campaign from Email campaigns.',
      }
    }
    return null
  }

  return {
    session,
    audienceChoices,
    audienceReplies,
    readinessItems,
    start,
    handleText,
    handleAction,
    consumePauseNotice,
    buildContextBrief,
    changeObjective,
    changeAudience,
    reviewSetup,
    routeForAction,
    resume,
  }
}
