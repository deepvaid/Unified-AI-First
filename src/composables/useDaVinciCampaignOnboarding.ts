import { computed } from 'vue'
import { useCampaignsStore, type CampaignDraftInput } from '@/stores/useCampaigns'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { useContactsStore } from '@/stores/useContacts'
import { useContentStore } from '@/stores/useContent'
import { useOnboardingStore } from '@/stores/useOnboarding'
import {
  useDaVinciOnboardingStore,
  type CampaignAudienceSelection,
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
]

const SKIP_REPLY: DvQuickReply = { label: 'Skip for now', value: 'Skip for now', icon: 'redo-2' }
const CONTINUE_REPLY: DvQuickReply = { label: 'Continue campaign', value: 'Continue campaign', icon: 'play' }

const OBJECTIVE_COPY = {
  generic: {
    name: 'First campaign',
    subject: 'Your first campaign',
    preheader: 'Draft created with Da Vinci — you control content, timing, and send.',
  },
  promotion: {
    name: 'First campaign — Special offer',
    subject: 'A special offer, picked for you',
    preheader: 'A timely offer for our subscribers.',
  },
  announcement: {
    name: 'First campaign — New announcement',
    subject: 'Something new is here',
    preheader: 'Be among the first to see what is new.',
  },
  reconnect: {
    name: 'First campaign — We miss you',
    subject: 'It’s been a while — here’s what’s new',
    preheader: 'A personal reason to come back and take another look.',
  },
  newsletter: {
    name: 'First campaign — Newsletter',
    subject: 'Your latest update',
    preheader: 'News, ideas, and updates selected for you.',
  },
}

function objectiveKey(text: string): keyof typeof OBJECTIVE_COPY {
  const normalized = text.toLowerCase().trim()
  if (!normalized) return 'generic'
  if (/announce|launch|new/.test(normalized)) return 'announcement'
  if (/reconnect|win.?back|lapsed|miss/.test(normalized)) return 'reconnect'
  if (/newsletter|update|digest/.test(normalized)) return 'newsletter'
  return 'promotion'
}

/**
 * True when mid-setup text is a question or clearly about something other than
 * this campaign — the wizard pauses and lets the normal assistant answer, rather
 * than swallowing "what's my revenue this week?" as a campaign objective.
 */
function isOffTopic(text: string): boolean {
  // The wizard's own verbs are always on-topic ("recheck", "change brief", chip values like "Use VIP Customer Circle").
  if (/\b(recheck|check again|change|different|restart|brief|use)\b/i.test(text)) return false
  if (/\?\s*$/.test(text)) return true
  if (/^(what|how|why|when|where|who|which|can|could|do|does|is|are|show|tell)\b/i.test(text)) return true
  return /\b(revenue|sales|ticket|widget|dashboard|order|product description|report)\b/i.test(text)
}

export function useDaVinciCampaignOnboarding() {
  const onboarding = useDaVinciOnboardingStore()
  const setupGuide = useOnboardingStore()
  const campaigns = useCampaignsStore()
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
    return audienceChoices().slice(0, 4).map((audience) => ({
      label: audience.name,
      value: `Use ${audience.name}`,
      icon: audience.kind === 'list' ? 'list-checks' : 'users',
    }))
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
    const selectedAudience = session.value?.brief.audience ?? null
    const domainCompletion = setupGuide.completed['sending-domain']
    const domainStatus = session.value?.freshAccount
      ? 'unknown'
      : domainCompletion === true
      ? 'ready'
      : domainCompletion === false
        ? 'needs-setup'
        : 'unknown'
    return [
      {
        id: 'domain',
        label: 'Sending domain',
        description: domainStatus === 'ready'
          ? 'Your setup guide marks the sending domain as authenticated.'
          : domainStatus === 'unknown'
            ? 'This prototype cannot verify the domain yet. Check DNS setup before sending.'
            : 'Open DNS setup before sending so recipients can trust the message.',
        status: domainStatus,
        routeName: 'SettingsDnsSetup',
        actionLabel: domainStatus === 'ready' ? 'Review domain' : 'Check DNS setup',
      },
      {
        id: 'audience',
        label: 'Audience',
        description: selectedAudience
          ? `${selectedAudience.name} has ${selectedAudience.count.toLocaleString()} contacts.`
          : 'Choose a list or segment before the campaign can be sent.',
        status: selectedAudience && selectedAudience.count > 0 ? 'ready' : 'needs-setup',
        routeName: 'ContactLists',
        actionLabel: 'Create an audience',
      },
      {
        id: 'content',
        label: 'Email content',
        description: content.items.length
          ? `${content.items.length} templates are available to review in the campaign builder.`
          : 'Create or import email content before scheduling the campaign.',
        status: content.items.length ? 'ready' : 'needs-setup',
        routeName: 'EmailContent',
        actionLabel: 'Browse templates',
      },
    ]
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
        ? `I'll send it to ${named.name}. First, what should this campaign achieve?`
        : 'First, what should this campaign achieve?',
      speech: 'First, what should this campaign achieve?',
      quickReplies: [...CAMPAIGN_OBJECTIVES, SKIP_REPLY],
    }
  }

  function audiencePrompt(objective: string): CampaignOnboardingResponse {
    onboarding.setObjective(objective)

    // An audience named before we asked ("send a campaign to VIPs") skips this question.
    const hint = session.value?.audienceHint
    const named = hint ? findAudience(hint) : null
    if (named) {
      onboarding.setAudienceHint(null)
      return readinessResponse(named)
    }

    return {
      intent: 'campaign',
      reply: `Got it — the goal is to ${objective.toLowerCase()}. Who should receive it? I’ll use a real audience from this account.`,
      speech: 'Who should receive it?',
      quickReplies: [...audienceReplies(), SKIP_REPLY],
    }
  }

  function readinessResponse(audience: CampaignAudienceSelection): CampaignOnboardingResponse {
    onboarding.setAudience(audience)
    const items = readinessItems()
    onboarding.setReadiness(items)
    return readinessCardResponse(items)
  }

  function readinessCardResponse(items: CampaignReadinessItem[]): CampaignOnboardingResponse {
    const blockers = items.filter((item) => item.status !== 'ready')
    return {
      intent: 'campaign',
      reply: blockers.length
        ? `I found ${blockers.length} setup ${blockers.length === 1 ? 'item' : 'items'} to review. We can still save an editable draft without sending anything.`
        : 'Your domain, audience, and content library are ready. I can create an editable draft now.',
      speech: blockers.length
        ? `I found ${blockers.length} setup ${blockers.length === 1 ? 'item' : 'items'} to review. We can still create a draft.`
        : 'Everything needed for a draft is ready.',
      onboardingCard: {
        title: blockers.length ? 'Review your campaign setup' : 'Ready for an editable draft',
        description: 'Da Vinci checks readiness, but you keep control of content, timing, and send.',
        step: 3,
        totalSteps: 4,
        items,
        primaryAction: {
          label: 'Continue with a draft',
          action: 'continue-draft',
          icon: 'file-pen-line',
        },
        secondaryAction: {
          label: 'Change brief',
          action: 'change-brief',
          icon: 'refresh-cw',
        },
      },
    }
  }

  function buildDraftInput(): CampaignDraftInput | null {
    const active = session.value
    const audience = active?.brief.audience
    if (!active || !audience) return null

    const selectedList = audience.kind === 'list'
      ? cdp.lists.find((list) => list.id === audience.id)
      : cdp.lists[0]
    const copy = OBJECTIVE_COPY[objectiveKey(active.brief.objective)]

    return {
      kind: 'email',
      name: copy.name,
      subject: copy.subject,
      preheader: copy.preheader,
      tag: 'Onboarding',
      audienceSummary: audience.kind === 'list' ? '1 list' : '1 segment',
      audienceListIds: audience.kind === 'list' ? [audience.id] : [],
      audienceSegmentIds: audience.kind === 'segment' ? [audience.id] : [],
      audienceTableIds: [],
      brand: selectedList?.brand ?? 'Maropost',
      senderName: selectedList?.fromName ?? 'Maropost Store',
      senderEmail: selectedList?.fromEmail ?? 'hello@maropoststore.com',
      replyTo: selectedList?.replyTo ?? 'support@maropoststore.com',
      language: 'English (US)',
      address: selectedList?.address ?? '100 King St, Sydney NSW 2000',
      suppressListIds: [],
      suppressJourneyIds: [],
      suppressSegmentIds: [],
      suppressSecureListIds: [],
      contentId: null,
      showPreviewLink: false,
      dynamicPreview: false,
      spamCheckResult: null,
      scheduleType: 'now',
      scheduleDate: null,
      scheduleTime: null,
      timezone: 'America/New_York',
      optimizations: { sto: false, tzo: false, cto: false, preSend: false },
    }
  }

  function createDraft(): CampaignOnboardingResponse {
    const active = session.value
    if (!active?.brief.audience) {
      onboarding.setStage('audience')
      return {
        intent: 'campaign',
        reply: 'Choose an audience before I create the draft.',
        quickReplies: audienceReplies(),
      }
    }

    let draftId = active.draftId
    if (!draftId || !campaigns.getCampaign(draftId)) {
      const input = buildDraftInput()
      if (!input) {
        return { intent: 'campaign', reply: 'I need a campaign objective and audience before creating the draft.' }
      }
      draftId = campaigns.createCampaign(input, false)
      onboarding.setDraft(draftId)
    }

    const campaign = campaigns.getCampaign(draftId)
    const readiness = active.readiness.length ? active.readiness : readinessItems()
    const remaining = ['Email content', 'Send time']
    if (readiness.some((item) => item.id === 'domain' && item.status !== 'ready')) remaining.unshift('Sending domain')

    const card: DvCardDescriptor = {
      type: 'campaign',
      props: {
        name: campaign?.name ?? 'First campaign',
        subject: campaign?.config?.subject ?? 'Your first campaign',
        audience: active.brief.audience.name,
        audienceSize: active.brief.audience.count,
        sendTime: 'Not scheduled',
        channel: 'Email',
        status: 'Draft',
        draftId,
        remaining,
      },
    }

    return {
      intent: 'campaign',
      reply: 'Your editable draft is ready. I filled the campaign details and audience we agreed on. Nothing has been sent or scheduled.',
      speech: 'Your editable draft is ready. Nothing has been sent or scheduled.',
      cards: [card],
    }
  }

  function changeBrief(): CampaignOnboardingResponse {
    onboarding.setStage('objective')
    return {
      intent: 'campaign',
      reply: 'Of course. What should this campaign achieve instead?',
      speech: 'What should this campaign achieve instead?',
      quickReplies: CAMPAIGN_OBJECTIVES,
    }
  }

  /** One-time notice for the host to show when the wizard paused itself for an off-topic question. */
  let pauseNotice: CampaignOnboardingResponse | null = null

  function consumePauseNotice(): CampaignOnboardingResponse | null {
    const notice = pauseNotice
    pauseNotice = null
    return notice
  }

  function pausedResponse(): CampaignOnboardingResponse {
    return {
      intent: 'campaign',
      reply: 'No problem — campaign setup is paused. Ask me anything; say “continue campaign” when you’re ready.',
      speech: 'Campaign setup is paused. Say continue campaign when you are ready.',
      quickReplies: [CONTINUE_REPLY],
    }
  }

  /** Skip the current question with a sensible default instead of blocking on an answer. */
  function skipStage(): CampaignOnboardingResponse | null {
    const active = session.value
    if (!active) return null
    if (active.stage === 'welcome' || active.stage === 'consent' || active.stage === 'objective') {
      onboarding.setObjective('')
      return {
        intent: 'campaign',
        reply: 'No problem — you can decide the goal in the builder. Who should receive it?',
        speech: 'Who should receive it?',
        quickReplies: [...audienceReplies(), SKIP_REPLY],
      }
    }
    if (active.stage === 'audience') {
      const fallback = audienceChoices()[0]
      if (!fallback) return null
      const response = readinessResponse(fallback)
      return {
        ...response,
        reply: `I’ll start with ${fallback.name} — you can change it in the builder. ${response.reply}`,
        speech: `I’ll start with ${fallback.name}. ${response.speech ?? ''}`.trim(),
      }
    }
    if (active.stage === 'readiness') return createDraft()
    return null
  }

  function handleText(text: string): CampaignOnboardingResponse | null {
    const active = session.value
    if (!active || active.stage === 'complete') return null
    const trimmed = text.trim()
    if (!trimmed) return null

    // Paused: only an explicit "continue campaign" re-enters the wizard.
    if (active.paused) {
      if (/\b(continue|resume)\b.*\bcampaign|\bcampaign\b.*\b(continue|resume)\b/i.test(trimmed)) {
        onboarding.setPaused(false)
        trackDaVinciOnboardingEvent('onboarding_resumed', active.accountId, { from: 'paused' })
        return resume()
      }
      return null
    }

    // Explicit exit — only when the message IS the exit phrase, so words like
    // "later" inside a campaign brief don't eject the user.
    if (/^(cancel|stop|exit|quit|pause|not now|no thanks|(maybe )?later)[.! ]*$/i.test(trimmed)) {
      onboarding.setPaused(true)
      trackDaVinciOnboardingEvent('onboarding_skipped', active.accountId, { stage: active.stage, kind: 'paused' })
      return pausedResponse()
    }

    // Skip advances with defaults rather than blocking on an answer.
    if (/\bskip\b/i.test(trimmed)) {
      const skipped = skipStage()
      if (skipped) return skipped
    }

    // Questions and other-topic asks pause the wizard; the host's normal
    // assistant answers them (host shows the pause notice once).
    if (isOffTopic(trimmed)) {
      onboarding.setPaused(true)
      pauseNotice = {
        intent: 'campaign',
        reply: 'Campaign setup is paused — say “continue campaign” whenever you’re ready.',
        quickReplies: [CONTINUE_REPLY],
      }
      return null
    }

    if (active.stage === 'objective' || active.stage === 'consent' || active.stage === 'welcome') {
      return audiencePrompt(trimmed)
    }
    if (active.stage === 'audience') {
      const audience = findAudience(trimmed)
      if (!audience) {
        return {
          intent: 'campaign',
          reply: 'I couldn’t match that to an audience in this account. Choose one below, or name another list or segment.',
          speech: 'I couldn’t match that audience. Please choose one below.',
          quickReplies: [...audienceReplies(), SKIP_REPLY],
        }
      }
      return readinessResponse(audience)
    }
    if (active.stage === 'readiness' && /\b(change|different|restart|brief)\b/i.test(trimmed)) {
      return changeBrief()
    }
    if (active.stage === 'readiness' && /\b(done|finished|check|recheck|back)\b/i.test(trimmed)) {
      const items = readinessItems()
      onboarding.setReadiness(items)
      return readinessCardResponse(items)
    }
    if (active.stage === 'readiness' && /\b(continue|draft|create|yes|ready|go)\b/i.test(trimmed)) {
      return createDraft()
    }
    return null
  }

  function routeForAction(action: string): string | null {
    const itemId = action.replace(/^open-/, '')
    return session.value?.readiness.find((item) => item.id === itemId)?.routeName ?? null
  }

  function resume(): CampaignOnboardingResponse | null {
    const active = session.value
    if (!active) return null
    if (active.paused) return pausedResponse()
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
        quickReplies: [...audienceReplies(), SKIP_REPLY],
      }
    }
    if (active.stage === 'readiness') {
      const items = readinessItems()
      onboarding.setReadiness(items)
      return readinessCardResponse(items)
    }
    if (active.stage === 'draft' || active.stage === 'handoff') return createDraft()
    if (active.stage === 'complete') {
      return {
        intent: 'campaign',
        reply: 'Your campaign onboarding is complete. The draft remains available in Email campaigns.',
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
    consumePauseNotice,
    createDraft,
    changeBrief,
    routeForAction,
    resume,
  }
}
