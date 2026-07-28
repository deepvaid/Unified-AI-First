<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import DvWidgetDraftCard from './copilot/DvWidgetDraftCard.vue'
import DvHistoryDrawer from './copilot/DvHistoryDrawer.vue'
import DvToastStack from './copilot/DvToastStack.vue'
import DvInsightCard from './copilot/DvInsightCard.vue'
import DvIntentCardList from './copilot/voice/DvIntentCardList.vue'
import DvCampaignOnboardingCard from './copilot/DvCampaignOnboardingCard.vue'
import DvLandingHero from './copilot/DvLandingHero.vue'
import DvOrbitOrb from './copilot/voice/DvOrbitOrb.vue'
import DvOrbitVoiceSurface from './copilot/voice/DvOrbitVoiceSurface.vue'
import DvToolSteps, { type DvToolStep } from './copilot/DvToolSteps.vue'
import type { OrbitState } from './copilot/voice/orbit'
import {
  useCopilotStore,
  type ChatMessage,
  type CampaignOnboardingProps,
  type DraftSetProps,
  type IntentCardsProps,
} from '@/stores/useCopilot'
import { useAccountsStore } from '@/stores/useAccounts'
import { useDashboardsStore } from '@/stores/useDashboards'
import { getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
import { useDaVinciHistory } from '@/composables/useDaVinciHistory'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import { useDaVinciContext } from '@/composables/useDaVinciContext'
import {
  useDaVinciCampaignOnboarding,
  type CampaignOnboardingResponse,
} from '@/composables/useDaVinciCampaignOnboarding'
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'
import {
  useDaVinciIntents,
  INTENT_STEPS,
  type DvCardDescriptor,
  type DvIntentResult,
} from '@/composables/useDaVinciIntents'
import { useDaVinciVoice, VoiceError } from '@/composables/useDaVinciVoice'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'

interface MpDaVinciBotProps {
  initialChatMode?: boolean
  initialMessages?: ChatMessage[]
  subtitle?: string
  headerless?: boolean
}

const props = withDefaults(defineProps<MpDaVinciBotProps>(), {
  initialChatMode: false,
  initialMessages: () => [],
  subtitle: 'Intelligent AI assistant',
  headerless: false,
})

const emit = defineEmits<{
  close: []
  expand: []
}>()

const route = useRoute()
const router = useRouter()
const accountsStore = useAccountsStore()
const dashboardsStore = useDashboardsStore()
const { addItem, incrementAdded, clearAll } = useDaVinciHistory()
const { pushToast } = useDaVinciToasts()
const intents = useDaVinciIntents()
const campaignOnboarding = useDaVinciCampaignOnboarding()
const voice = useDaVinciVoice()
const copilot = useCopilotStore()
const onboarding = useDaVinciOnboardingStore()
const { contextBlock } = useDaVinciContext()

// The conversation lives in the copilot store so it survives navigation, drawer
// close/reopen, and is shared by the drawer / full-width / full-page surfaces.
const { messages, chatMode, conversationId: currentConversationId } = storeToRefs(copilot)

// Legacy hydration path (DaVinciCopilot cold deep links): seed the store only
// when it holds no live conversation.
if (props.initialMessages.length && messages.value.length === 0) {
  messages.value = [...props.initialMessages]
  chatMode.value = true
}
if (props.initialChatMode) chatMode.value = true

const inputText = ref('')
const isTyping = ref(false)
const generatingStatus = ref('')
const bodyEl = ref<HTMLElement | null>(null)
const historyOpen = ref(false)

// ── Generation lifecycle: live tool steps, stop, queued follow-ups ─────────
/** Bumped on every new generation and on stop — stale callbacks check it and bail. */
let generationSeq = 0
let geminiAbort: AbortController | null = null
const liveSteps = ref<DvToolStep[]>([])
const queuedPrompts = ref<string[]>([])

const routeAccountId = computed(() => {
  const accountId = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return accountId
})

const routeDashboardId = computed(() => {
  const dashboardId = Array.isArray(route.params.dashboardId) ? route.params.dashboardId[0] : route.params.dashboardId
  return dashboardId
})

const isDashboardRoute = computed(() => route.name === 'Dashboard' || route.name === 'DashboardDetail')

const activeAccount = computed(() => {
  if (!routeAccountId.value) return accountsStore.activeAccount
  return accountsStore.accounts.find((account) => account.id === routeAccountId.value) ?? accountsStore.activeAccount
})

const activeDashboard = computed(() => {
  if (!isDashboardRoute.value || !routeAccountId.value) return null
  return dashboardsStore.getDashboardById(routeAccountId.value, routeDashboardId.value) ?? null
})

const targetAccountId = computed(() => routeAccountId.value ?? activeAccount.value?.id ?? null)

if (route.query.source === 'davinci' && targetAccountId.value) {
  onboarding.begin(targetAccountId.value)
  copilot.beginOnboarding(targetAccountId.value)
  copilot.open()
  if (!copilot.resumeMessage && messages.value.length === 0) {
    copilot.queueResume(
      'Welcome back. Your Da Vinci campaign checkpoint is restored. This draft is still editable, and nothing has been sent.',
    )
  }
}

const targetDashboard = computed(() => {
  if (activeDashboard.value) return activeDashboard.value
  if (!targetAccountId.value) return null
  // Off a dashboard route (full-page copilot, drawer over list/other pages),
  // target the dashboard the user was most recently on — e.g. the one they just
  // created — rather than blindly the account default.
  return dashboardsStore.getLastViewedDashboard(targetAccountId.value) ?? null
})

const headerStatus = computed(() => {
  if (!chatMode.value) return props.subtitle
  if (isTyping.value) return generatingStatus.value || 'Drafting widgets…'
  return 'Intelligent AI assistant'
})

const suggestionPills = computed(() => {
  const pills = [
    { text: 'Try a different angle', icon: 'refresh-cw' },
    { text: 'Compare to YoY', icon: 'calendar-range' },
    { text: 'Segment by region', icon: 'align-left' },
  ]
  return pills
})

const landingSuggestions = computed(() => {
  const items: string[] = []
  if (isDashboardRoute.value) {
    items.push('Show me email campaign performance over the last 30 days')
    items.push('Revenue by channel for last 90 days')
    items.push('Top campaigns by conversion')
  } else {
    items.push('Show open rate trend for last 30 days')
    if (activeAccount.value?.subscriptions.includes('commerce')) {
      items.push('Create a revenue by channel widget')
      items.push('Add a recent orders table')
    } else {
      items.push('Add a top campaigns table')
      items.push('Show contact growth trend')
    }
    if (activeAccount.value?.subscriptions.includes('service')) {
      items.push('Show ticket volume over time')
    }
  }
  return items.slice(0, 4)
})

function makeId(prefix = 'm') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function scrollToBottom() {
  nextTick(() => {
    if (bodyEl.value) {
      bodyEl.value.scrollTo({ top: bodyEl.value.scrollHeight, behavior: 'smooth' })
    }
  })
}

function buildRationale(prompt: string, base: DashboardWidgetDraft): string {
  const metric = getMetricDescriptor(base.metricId)
  const metricLabel = metric?.label ?? 'these metrics'
  const sourceLabel = metric?.dataSource ?? base.dataSource
  void prompt
  return `You asked about ${metricLabel.toLowerCase()} · last 30 days. I pulled from ${capitalize(sourceLabel)} and picked the visualisation that best surfaces the headline numbers. Refine it to change the chart type or rename before adding.`
}

function buildIntro(count: number): string {
  const dashName = targetDashboard.value?.name ?? 'this dashboard'
  const noun = count === 1 ? 'widget' : 'widgets'
  return `Here&rsquo;s <strong>${count} ${noun}</strong> I drafted for <strong>${dashName}</strong>. Click <em>Add widget</em> to review and confirm.`
}


function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Voice dictation + TTS + text↔voice mode (drawer surface) ──────────
const ttsEnabled = ref(typeof window !== 'undefined' && window.localStorage.getItem('davinci-drawer-tts') === '1')

// Text is always the default experience — voice mode is an explicit per-session opt-in
const uiMode = ref<'text' | 'voice'>('text')
const isVoiceMode = computed(() => uiMode.value === 'voice')

// The flush DaVinciCopilot page and the drawer can be mounted simultaneously —
// distinct mic owner tokens keep the engine's last-claim-wins arbitration sane.
const voiceOwner = computed(() => (props.headerless ? 'copilot-page' : 'drawer'))

// The drawer hides without unmounting (v-navigation-drawer just translates it
// off-canvas) — copilot.isOpen is the visibility signal for pause/cleanup.
const surfaceVisible = computed(() => props.headerless || copilot.isOpen)

// Feature surfaces can queue a prompt (copilot.openWithPrompt) — run it as soon
// as this surface is visible so the panel never opens blank.
watch(
  [surfaceVisible, () => copilot.pendingPrompt],
  ([visible, prompt]) => {
    if (!visible || !prompt) return
    const seeded = copilot.consumePendingPrompt()
    if (seeded) processQuery(seeded)
  },
  { immediate: true },
)

watch(
  [surfaceVisible, () => copilot.resumeMessage],
  ([visible, resumeMessage]) => {
    if (!visible || !resumeMessage) return
    const text = copilot.consumeResume()
    if (!text) return
    messages.value.push({ id: makeId('a'), role: 'assistant', text })
    chatMode.value = true
    if (targetAccountId.value) {
      trackDaVinciOnboardingEvent('onboarding_resumed', targetAccountId.value, {
        stage: onboarding.activeSession?.stage ?? 'unknown',
      })
    }
    scrollToBottom()
    maybeSpeak(text)
  },
  { immediate: true },
)

// Voice in → voice out (assistant convention): a mic-dictated query gets a
// spoken reply even in text mode. Typed queries stay silent unless the
// persisted "Read replies aloud" toggle is on. Voice mode always speaks.
const lastInputWasVoice = ref(false)
const speakReplies = computed(
  () => isVoiceMode.value || ttsEnabled.value || copilot.readAloud || lastInputWasVoice.value,
)

const isDictating = computed(
  () => voice.state.value === 'listening' && voice.owner.value === voiceOwner.value,
)

function stopVoiceActivity() {
  if (voice.owner.value === voiceOwner.value) voice.abortListening()
  voice.cancelSpeech()
  voice.setThinking(false)
  resetOrbit()
}

// ─── Orbit voice surface — drawer-local UI state machine ───────────────
const orbitError = ref(false) // dictation resolved silent (didn't catch that)
const orbitErrorMessage = ref('It was a bit noisy. Try again, or type your request instead.')
const orbitPaused = ref(false) // user stopped the mic without speaking
const orbitLastRequest = ref('') // echo pill while thinking
const orbitResponse = ref<{ draft: DashboardWidgetDraft | null; caption: string } | null>(null)
const orbitAdded = ref<{ title: string; dashboardName: string; widgetId: string; dashboardId: string; accountId: string } | null>(null)
const orbitDraftKey = ref(0) // bump remounts the draft card after Undo
let orbitCancelRequested = false

// Deferred reply timers (the "thinking" delay) — tracked so they're cleared on
// unmount / hide; otherwise a late callback can speak a reply after you've left.
const pendingTimers: ReturnType<typeof setTimeout>[] = []
function clearPendingTimers() {
  pendingTimers.forEach((id) => clearTimeout(id))
  pendingTimers.length = 0
}

const orbitState = computed<OrbitState>(() => {
  if (isDictating.value) return 'listening'
  if (voice.state.value === 'thinking' || isTyping.value) return 'thinking'
  if (orbitError.value) return 'error'
  if (orbitPaused.value) return 'paused'
  if (orbitAdded.value) return 'added'
  if (orbitResponse.value) return 'responding'
  return 'ready'
})


function resetOrbit() {
  orbitError.value = false
  orbitErrorMessage.value = 'It was a bit noisy. Try again, or type your request instead.'
  orbitPaused.value = false
  orbitLastRequest.value = ''
  orbitResponse.value = null
  orbitAdded.value = null
  orbitCancelRequested = false
}

/** Footer ghost ✕ while listening — discard the capture, back to ready. */
function orbitCancelListening() {
  orbitCancelRequested = true
  voice.abortListening()
}

function orbitTryAgain() {
  orbitError.value = false
  void toggleMic()
}

function onOrbitWidgetSaved(payload: { title: string; dashboardName: string; widgetId: string; dashboardId: string; accountId: string }) {
  if (currentConversationId.value) incrementAdded(currentConversationId.value)
  orbitAdded.value = payload
}

function orbitUndo() {
  const added = orbitAdded.value
  if (!added) return
  dashboardsStore.removeWidget(added.accountId, added.dashboardId, added.widgetId)
  orbitAdded.value = null
  orbitDraftKey.value++
  pushToast({ title: 'Widget removed', sub: added.title })
}

function orbitOpenDashboard() {
  const added = orbitAdded.value
  if (!added) return
  emit('close')
  router.push({ name: 'DashboardDetail', params: { accountId: added.accountId, dashboardId: added.dashboardId } })
}

function orbitAddAnother() {
  orbitAdded.value = null
  orbitResponse.value = null
  void toggleMic()
}

function setUiMode(mode: 'text' | 'voice') {
  if (mode === uiMode.value) return
  if (mode === 'voice' && !voice.sttSupported) return
  uiMode.value = mode
  if (mode === 'text') stopVoiceActivity()
  else resetOrbit()
}

function toggleTts() {
  ttsEnabled.value = !ttsEnabled.value
  window.localStorage.setItem('davinci-drawer-tts', ttsEnabled.value ? '1' : '0')
  if (!ttsEnabled.value && !isVoiceMode.value) voice.cancelSpeech()
}

// Manual tap-to-talk. Future: auto-relisten loop after TTS ends (deliberate
// non-goal for now — surprise always-open mics are an anti-pattern).
async function toggleMic() {
  voice.unlockSpeech() // prime TTS within the tap (Safari/iOS autoplay)
  if (isDictating.value) {
    // Orbit: stopping the mic before any speech lands = paused, not error
    if (isVoiceMode.value && !voice.interimTranscript.value) orbitPaused.value = true
    voice.stopListening()
    return
  }
  // A fresh capture clears any prior Orbit outcome
  orbitError.value = false
  orbitPaused.value = false
  orbitResponse.value = null
  orbitAdded.value = null
  orbitCancelRequested = false
  try {
    // The Orbit orb is time-based CSS — no analyser needed in the drawer
    const finalText = await voice.startListening({
      owner: voiceOwner.value,
      withAnalyser: false,
    })
    if (finalText) {
      lastInputWasVoice.value = true // voice in → voice out (spoken reply even in text mode)
      processQuery(finalText)
    } else if (isVoiceMode.value && !orbitCancelRequested && !orbitPaused.value) {
      // Silent resolve the user didn't ask for → "didn't catch that"
      orbitErrorMessage.value = 'It was a bit noisy. Try again, or type your request instead.'
      orbitError.value = true
    }
    orbitCancelRequested = false
  } catch (err) {
    if (err instanceof VoiceError && err.code === 'permission') {
      pushToast({ title: 'Microphone blocked', sub: 'Allow microphone access in your browser settings' })
      orbitErrorMessage.value = 'Microphone access is blocked. Allow it in browser settings, or continue by typing.'
      orbitError.value = true
    } else if (err instanceof VoiceError && err.code === 'audio') {
      pushToast({ title: 'No microphone found' })
      orbitErrorMessage.value = 'No microphone was found. Connect one, or continue by typing.'
    } else if (err instanceof VoiceError && err.code === 'network') {
      pushToast({ title: 'Voice service unavailable', sub: 'Check your connection — you can type instead' })
      orbitErrorMessage.value = 'Voice is unavailable right now. Check your connection, or continue by typing.'
    }
    if (isVoiceMode.value && err instanceof VoiceError && (err.code === 'network' || err.code === 'audio')) {
      orbitError.value = true
    }
  }
}

// Mirror the live transcript into the composer while dictating in text mode
// (voice mode shows it as the composer caption instead)
watch(voice.interimTranscript, (t) => {
  if (isDictating.value && !isVoiceMode.value && t) inputText.value = t
})

function stripHtml(html: string) {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent ?? ''
}

function maybeSpeak(text: string) {
  if (!speakReplies.value) return
  void voice.speak(stripHtml(text))
}

// Drawer hidden mid-session → cancel pending replies, release the mic, stop
// speech (so a queued reply can't start talking after you've closed it). The
// conversation itself lives in the copilot store and survives.
watch(surfaceVisible, (visible) => {
  if (visible) return
  stopGeneration()
  if (isVoiceMode.value) stopVoiceActivity()
  else voice.cancelSpeech()
})

// The component does unmount when a fullPage route replaces the shell — clear
// deferred replies and stop any speech; owner-guard only the listen-abort so it
// never kills the AI experience's own mic session.
onBeforeUnmount(() => {
  stopGeneration()
  if (isVoiceMode.value) stopVoiceActivity()
  else {
    if (voice.owner.value === voiceOwner.value) voice.abortListening()
    voice.cancelSpeech()
  }
})

/** Renders the classified intent's steps live (pending → running) inside the thinking window. */
function startStepTicker(labels: string[], gen: number, totalMs: number) {
  if (!labels.length) {
    liveSteps.value = []
    return
  }
  liveSteps.value = labels.map((label, i) => ({ label, status: i === 0 ? 'running' : 'pending' }))
  const stepMs = Math.max(250, Math.floor(totalMs / labels.length))
  labels.forEach((_, i) => {
    if (i === 0) return
    pendingTimers.push(
      setTimeout(() => {
        if (gen !== generationSeq) return
        liveSteps.value = labels.map((label, j) => ({
          label,
          status: j < i ? 'done' : j === i ? 'running' : 'pending',
        }))
      }, stepMs * i),
    )
  })
}

/** Reply landed (or was discarded) — clear the working state and run the next queued follow-up. */
function finishGeneration(gen: number) {
  if (gen !== generationSeq) return
  isTyping.value = false
  voice.setThinking(false)
  liveSteps.value = []
  generatingStatus.value = ''
  scrollToBottom()
  const next = queuedPrompts.value.shift()
  if (next) runGeneration(next)
}

/** Composer Stop button — cancels the in-flight reply AND any queued follow-ups. */
function stopGeneration() {
  generationSeq++
  geminiAbort?.abort()
  geminiAbort = null
  clearPendingTimers()
  queuedPrompts.value = []
  isTyping.value = false
  voice.setThinking(false)
  liveSteps.value = []
  generatingStatus.value = ''
}

/** Shared completion for intent-layer results (canned intents + Gemini). */
function completeIntentResult(res: DvIntentResult, gen: number) {
  if (gen !== generationSeq) return
  messages.value.push({
    id: makeId('a'),
    role: 'assistant',
    text: res.reply,
    toolSteps: res.steps,
    componentData:
      res.cards.length || res.quickReplies?.length
        ? [{ type: 'intentCards', props: { cards: res.cards, quickReplies: res.quickReplies } }]
        : undefined,
  })
  if (isVoiceMode.value) orbitResponse.value = { draft: null, caption: stripHtml(res.reply) }
  maybeSpeak(res.speech ?? res.reply)
  finishGeneration(gen)
}

function appendCampaignOnboardingResponse(res: CampaignOnboardingResponse) {
  const componentData: ChatMessage['componentData'] = []
  if (res.cards?.length || res.quickReplies?.length) {
    componentData.push({
      type: 'intentCards',
      props: { cards: res.cards ?? [], quickReplies: res.quickReplies },
    })
  }
  if (res.onboardingCard) {
    componentData.push({
      type: 'campaignOnboarding',
      props: res.onboardingCard,
    })
  }
  messages.value.push({
    id: makeId('a'),
    role: 'assistant',
    text: res.reply,
    componentData: componentData.length ? componentData : undefined,
  })
  chatMode.value = true
  if (res.onboardingCard && targetAccountId.value) {
    const blockers = res.onboardingCard.items?.filter((item) => item.status !== 'ready').length ?? 0
    trackDaVinciOnboardingEvent('readiness_shown', targetAccountId.value, { blockers })
  }
  scrollToBottom()
  maybeSpeak(res.speech ?? res.reply)
}

function pushUserTurn(text: string) {
  messages.value.push({ id: makeId('u'), role: 'user', text })
  chatMode.value = true
  inputText.value = ''
  scrollToBottom()
}

function openCampaignDraft(draftId: number) {
  const accountId = targetAccountId.value
  if (!accountId) return
  onboarding.markHandoff()
  trackDaVinciOnboardingEvent('draft_opened', accountId, { draftId })
  copilot.queueResume(
    'Your draft is open. I filled the details we agreed on. You still control content, timing, and send. Nothing has been sent.',
  )
  copilot.setWidthMode('panel')
  copilot.open()
  void router.push({
    name: 'CreateCampaign',
    params: { accountId },
    query: { id: String(draftId), source: 'davinci' },
  })
}

function openCampaignPrerequisite(action: string) {
  const accountId = targetAccountId.value
  const routeName = campaignOnboarding.routeForAction(action)
  if (!accountId || !routeName) return
  onboarding.setLastRoute(routeName)
  trackDaVinciOnboardingEvent('prerequisite_opened', accountId, { routeName })
  copilot.queueResume('I’m still with you. Complete this step, then I’ll check campaign readiness again.')
  copilot.open()
  void router.push({ name: routeName, params: { accountId }, query: { source: 'davinci' } })
}

function onCampaignOnboardingAction(action: string) {
  if (action === 'continue-draft') {
    const response = campaignOnboarding.createDraft()
    appendCampaignOnboardingResponse(response)
    const card = response.cards?.find((item) => item.type === 'campaign')
    if (card?.type === 'campaign' && card.props.draftId && targetAccountId.value) {
      trackDaVinciOnboardingEvent('draft_created', targetAccountId.value, { draftId: card.props.draftId })
    }
    return
  }
  if (action === 'change-brief') {
    if (targetAccountId.value) trackDaVinciOnboardingEvent('brief_corrected', targetAccountId.value)
    appendCampaignOnboardingResponse(campaignOnboarding.changeBrief())
    return
  }
  if (action.startsWith('open-')) openCampaignPrerequisite(action)
}

function onIntentCardAction(payload: { card: DvCardDescriptor; action: string }) {
  if (payload.card.type === 'campaign') {
    if (payload.action === 'review-draft' && payload.card.props.draftId) {
      openCampaignDraft(payload.card.props.draftId)
      return
    }
    if (payload.action === 'change-brief') {
      if (targetAccountId.value) trackDaVinciOnboardingEvent('brief_corrected', targetAccountId.value)
      appendCampaignOnboardingResponse(campaignOnboarding.changeBrief())
      return
    }
  }
  const titles: Record<string, string> = {
    save: 'Segment saved',
    use: 'Copy ready to use',
    copy: 'Copied to clipboard',
    edit: 'Opening editor…',
    preview: 'Preview coming up…',
    action: 'Done',
  }
  pushToast({ title: titles[payload.action] ?? 'Done' })
}

function processQuery(text: string) {
  if (!text) return
  const onboardingResponse = onboarding.isActive ? campaignOnboarding.handleText(text) : null
  if (onboardingResponse) {
    pushUserTurn(text)
    appendCampaignOnboardingResponse(onboardingResponse)
    return
  }
  // Text mode mid-generation: show the turn immediately, answer it after the
  // current reply lands (queued follow-up).
  if (isTyping.value && !isVoiceMode.value) {
    pushUserTurn(text)
    queuedPrompts.value.push(text)
    return
  }
  pushUserTurn(text)
  runGeneration(text)
}

/** Answer `text` (the user turn is already in the transcript). */
function runGeneration(text: string) {
  const gen = ++generationSeq
  isTyping.value = true
  generatingStatus.value = 'Working on it…'
  if (isVoiceMode.value) {
    voice.setThinking(true)
    orbitLastRequest.value = text
  }
  scrollToBottom()

  // Multi-turn intent clarification (e.g. campaign audience slot) — a
  // conversational turn, not tool work; no steps.
  if (intents.pending.value) {
    startStepTicker([], gen, 900)
    pendingTimers.push(setTimeout(() => completeIntentResult(intents.handle(text), gen), 900))
    return
  }

  const conversationId = currentConversationId.value ?? makeId('c')
  const isFirstPrompt = !currentConversationId.value
  currentConversationId.value = conversationId

  // Widget-draft path (dashboard context)
  if (targetAccountId.value && targetDashboard.value) {
    const base = dashboardsStore.buildAiWidgetDraft(targetAccountId.value, targetDashboard.value.id, text)
    if (base) {
      const drafts = [base]
      const rationale = buildRationale(text, base)
      const metricLabel = getMetricDescriptor(base.metricId)?.label ?? base.title ?? 'data'
      generatingStatus.value = `Pulling ${metricLabel.toLowerCase()} from the last 30 days`
      const steps = [
        `Check ${targetDashboard.value.name} widgets`,
        `Pull ${metricLabel.toLowerCase()} · last 30 days`,
        'Draft widget',
      ]
      startStepTicker(steps, gen, 1200)
      pendingTimers.push(setTimeout(() => {
        if (gen !== generationSeq) return
        messages.value.push({
          id: makeId('a'),
          role: 'assistant',
          text: buildIntro(drafts.length),
          toolSteps: steps,
          componentData: [
            {
              type: 'widgetDraftSet',
              props: { drafts, rationale, conversationId },
            },
          ],
        })
        if (isFirstPrompt) {
          addItem({ title: text, draftedCount: drafts.length })
        }
        if (isVoiceMode.value) {
          orbitResponse.value = { draft: drafts[0] ?? null, caption: stripHtml(buildIntro(drafts.length)) }
        }
        maybeSpeak(buildIntro(drafts.length))
        finishGeneration(gen)
      }, 1200))
      return
    }
  }

  // Intent / Gemini path — preview the classified intent's steps while working;
  // the finished message carries the result's actual steps.
  startStepTicker(INTENT_STEPS[intents.classify(text)], gen, 1200)
  pendingTimers.push(setTimeout(async () => {
    if (gen !== generationSeq) return
    // No widget mapping — try the unified intent layer (campaigns, products,
    // revenue, segments) before falling back to the widget-prompt hint.
    const res = intents.handle(text)
    if (res.intent !== 'fallback') {
      completeIntentResult(res, gen)
      return
    }
    if (!isDashboardRoute.value) {
      // Open-ended question outside a dashboard widget-building context — answer
      // with Gemini Flash (falls back to the canned hint if Gemini is unavailable),
      // grounded in the live workspace context block. (Guarded on the dashboard
      // ROUTE, not the default dashboard's existence — every account has a default
      // dashboard, so the old guard sent nearly all open-ended asks to the widget
      // hint and Gemini almost never fired from the drawer.)
      const history = messages.value.slice(0, -1).slice(-6).map((m) => ({ role: m.role, text: m.text }))
      geminiAbort = new AbortController()
      let smart: DvIntentResult
      try {
        smart = await intents.answer(text, {
          history,
          context: contextBlock.value,
          signal: geminiAbort.signal,
        })
      } catch {
        return // aborted via Stop — generationSeq is already stale
      } finally {
        geminiAbort = null
      }
      completeIntentResult(smart, gen)
      return
    }
    // Fallback on a dashboard route → widget-prompt hint
    if (isVoiceMode.value) {
      orbitResponse.value = {
        draft: null,
        caption:
          "I couldn't map that to a widget yet. Try revenue, orders, open rate, campaigns, contact growth, or ticket volume.",
      }
    }
    messages.value.push({
      id: makeId('a'),
      role: 'assistant',
      text: "I couldn't map that to a supported widget yet. Try asking for revenue, orders, open rate, campaigns, contact growth, or ticket volume.",
      componentData: [
        {
          type: 'insight',
          props: {
            headline: 'Try a widget-ready prompt',
            description:
              'Use prompts like “Create a revenue by channel widget”, “Show open rate trend for last 30 days”, or “Add a recent orders table”.',
            severity: 'info',
          },
        },
      ],
    })
    finishGeneration(gen)
  }, 1200))
}

function sendQuery() {
  voice.unlockSpeech() // prime TTS within the gesture (Safari/iOS autoplay)
  lastInputWasVoice.value = false // typed → silent unless "read aloud" is on
  processQuery(inputText.value.trim())
}

function sendSuggestion(text: string) {
  voice.unlockSpeech()
  lastInputWasVoice.value = false
  processQuery(text)
}

function newChat() {
  stopGeneration()
  stopVoiceActivity()
  copilot.resetConversation()
  inputText.value = ''
  historyOpen.value = false
  pushToast({ title: 'New chat started' })
}

function onWidgetSaved(
  payload: { title: string; dashboardName: string; widgetId: string; dashboardId: string; accountId: string },
  msg: ChatMessage,
) {
  const comp = msg.componentData?.[0]
  if (comp && comp.type === 'widgetDraftSet') {
    incrementAdded((comp.props as DraftSetProps).conversationId)
  }
  // Use the dashboard the widget was actually added to (from the card's payload),
  // not the live route target — they can differ when the draft was pinned.
  const { dashboardId, accountId } = payload
  pushToast({
    title: `Widget added to ${payload.dashboardName}`,
    sub: payload.title,
    action: dashboardId && accountId ? 'View' : undefined,
    onAction: () => {
      if (dashboardId && accountId) {
        router.push({ name: 'DashboardDetail', params: { accountId, dashboardId } })
      }
    },
  })
}

function onWidgetRefined() {
  pushToast({ title: 'Draft updated', sub: 'Da Vinci re-rendered with your changes' })
}

function isDraftSetMessage(msg: ChatMessage): msg is ChatMessage & { componentData: [{ type: 'widgetDraftSet'; props: DraftSetProps }] } {
  const comp = msg.componentData?.[0]
  return !!comp && comp.type === 'widgetDraftSet'
}

function isInsightMessage(msg: ChatMessage): boolean {
  const comp = msg.componentData?.[0]
  return !!comp && comp.type === 'insight'
}

function getDraftSetProps(msg: ChatMessage): DraftSetProps | null {
  const comp = msg.componentData?.[0]
  if (!comp || comp.type !== 'widgetDraftSet') return null
  return comp.props as DraftSetProps
}

function getInsightProps(msg: ChatMessage): { headline: string; description: string; severity?: string } | null {
  const comp = msg.componentData?.[0]
  if (!comp || comp.type !== 'insight') return null
  return comp.props as { headline: string; description: string; severity?: string }
}

function getIntentCardsProps(msg: ChatMessage): IntentCardsProps | null {
  const comp = msg.componentData?.find((item) => item.type === 'intentCards')
  if (!comp || comp.type !== 'intentCards') return null
  return comp.props as IntentCardsProps
}

function getCampaignOnboardingProps(msg: ChatMessage): CampaignOnboardingProps | null {
  const comp = msg.componentData?.find((item) => item.type === 'campaignOnboarding')
  if (!comp || comp.type !== 'campaignOnboarding') return null
  return comp.props as CampaignOnboardingProps
}

function handleClearAll() {
  const confirmed = window.confirm('Delete all Da Vinci conversations? This cannot be undone.')
  if (!confirmed) return
  clearAll()
  pushToast({ title: 'All conversations deleted' })
}

function onComposerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendQuery()
  }
}
</script>

<template>
  <div class="dv-panel">
    <!-- ═══ HEADER ═══ -->
    <header v-if="!headerless" class="dv-panel__header">
      <DvOrbitOrb class="dv-panel__avatar" :size="32" :speed="isTyping ? 1.6 : 1" />
      <div class="dv-panel__title">
        <div class="dv-panel__title-name">Da Vinci</div>
        <div class="dv-panel__title-sub">{{ headerStatus }}</div>
      </div>
      <v-btn icon size="34" variant="text" aria-label="Start a new chat" class="dv-panel__icon-btn" @click="newChat">
        <v-icon size="18">square-pen</v-icon>
        <v-tooltip activator="parent" location="bottom">New chat</v-tooltip>
      </v-btn>
      <v-btn
        icon
        size="34"
        variant="text"
        aria-label="Conversation history"
        class="dv-panel__icon-btn"
        @click="historyOpen = !historyOpen"
      >
        <v-icon size="18">history</v-icon>
        <v-tooltip activator="parent" location="bottom">Conversation history</v-tooltip>
      </v-btn>
      <v-btn
        icon
        size="34"
        variant="text"
        :aria-label="copilot.isExpanded ? 'Collapse panel' : 'Expand panel'"
        class="dv-panel__icon-btn"
        @click="emit('expand')"
      >
        <v-icon size="18">{{ copilot.isExpanded ? 'chevrons-right' : 'chevrons-left' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ copilot.isExpanded ? 'Collapse' : 'Expand' }}</v-tooltip>
      </v-btn>
      <v-menu offset="6" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn icon size="34" variant="text" aria-label="More" class="dv-panel__icon-btn" v-bind="menuProps">
            <v-icon size="18">more-vertical</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" class="dv-panel__menu">
          <v-list-item v-if="copilot.widthMode !== 'full'" @click="copilot.setWidthMode('full')">
            <template #prepend><v-icon size="18">maximize-2</v-icon></template>
            <v-list-item-title>Full width</v-list-item-title>
          </v-list-item>
          <v-list-item v-else @click="copilot.setWidthMode('panel')">
            <template #prepend><v-icon size="18">minimize-2</v-icon></template>
            <v-list-item-title>Exit full width</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isVoiceMode" @click="setUiMode('text')">
            <template #prepend><v-icon size="18">keyboard</v-icon></template>
            <v-list-item-title>Switch to text mode</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="voice.ttsSupported" @click="toggleTts">
            <template #prepend><v-icon size="18">{{ ttsEnabled ? 'volume-2' : 'volume-x' }}</v-icon></template>
            <v-list-item-title>Read replies aloud</v-list-item-title>
            <template #append><v-icon v-if="ttsEnabled" size="16" color="primary">check</v-icon></template>
          </v-list-item>
          <v-divider />
          <v-list-item class="dv-panel__menu-danger" @click="handleClearAll">
            <template #prepend><v-icon size="18" color="error">trash-2</v-icon></template>
            <v-list-item-title>Delete all conversations</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn icon size="34" variant="text" aria-label="Close" class="dv-panel__icon-btn" @click="emit('close')">
        <v-icon size="18">x</v-icon>
      </v-btn>
    </header>

    <DvHistoryDrawer
      :open="historyOpen"
      :active-id="currentConversationId ?? undefined"
      @close="historyOpen = false"
      @select="(_id) => (historyOpen = false)"
      @new-chat="newChat"
    />

    <div class="dv-panel__split">
      <!-- Full-width takeover shows the conversation history as a persistent rail
           (same composition as the DaVinciCopilot page). -->
      <aside v-if="!headerless && copilot.widthMode === 'full' && !isVoiceMode" class="dv-panel__rail">
        <DvHistoryDrawer
          :open="true"
          mode="rail"
          :active-id="currentConversationId ?? undefined"
          @new-chat="newChat"
        />
      </aside>

      <div class="dv-panel__main">
    <!-- ═══ ORBIT VOICE SURFACE (voice mode) — owns the whole body + footer ═══ -->
    <DvOrbitVoiceSurface
      v-if="isVoiceMode"
      :state="orbitState"
      :transcript="voice.interimTranscript.value"
      :last-request="orbitLastRequest"
      :caption="orbitResponse?.caption ?? ''"
      :speaking="voice.state.value === 'speaking'"
      :suggestions="landingSuggestions"
      :draft="orbitResponse?.draft ?? null"
      :account-id="targetAccountId ?? ''"
      :dashboard-id="targetDashboard?.id ?? ''"
      :filters="targetDashboard?.filters"
      :draft-key="orbitDraftKey"
      :added-to="orbitAdded?.dashboardName ?? ''"
      :error-message="orbitErrorMessage"
      @mic="toggleMic"
      @cancel="orbitCancelListening"
      @suggestion="sendSuggestion"
      @try-again="orbitTryAgain"
      @type-instead="setUiMode('text')"
      @undo="orbitUndo"
      @open-dashboard="orbitOpenDashboard"
      @add-another="orbitAddAnother"
      @widget-saved="onOrbitWidgetSaved"
      @widget-refined="onWidgetRefined"
    />

    <!-- ═══ BODY (text mode) ═══ -->
    <div v-if="!isVoiceMode" ref="bodyEl" class="dv-panel__body">
      <!-- Landing state -->
      <DvLandingHero
        v-if="!chatMode"
        class="dv-landing"
        :suggestions="landingSuggestions"
        @suggestion="sendSuggestion"
      />

      <!-- Conversation -->
      <template v-for="msg in messages" :key="msg.id">
        <div v-if="msg.role === 'user'" class="dv-msg-user">
          <div class="dv-msg-user__bubble">{{ msg.text }}</div>
        </div>
        <div v-else class="dv-msg-bot">
          <DvOrbitOrb class="dv-msg-bot__avatar" :size="28" />
          <div class="dv-msg-bot__body">
            <DvToolSteps
              v-if="msg.toolSteps?.length"
              :steps="msg.toolSteps.map((label) => ({ label, status: 'done' as const }))"
            />
            <!-- HTML is allowed ONLY for the developer-authored widget-draft intro (buildIntro).
                 All other assistant text (canned intents, Gemini replies) is interpolated, never
                 fed to v-html — prevents XSS from model output. -->
            <div v-if="msg.text && isDraftSetMessage(msg)" class="dv-msg-bot__intro" v-html="msg.text"></div>
            <div v-else-if="msg.text" class="dv-msg-bot__intro">{{ msg.text }}</div>

            <template v-if="isDraftSetMessage(msg)">
              <div v-if="getDraftSetProps(msg)?.rationale" class="dv-msg-bot__rationale">
                <span class="dv-eyebrow">Why these</span>
                {{ getDraftSetProps(msg)?.rationale }}
              </div>

              <div class="dv-drafts">
                <div class="dv-drafts__meta">
                  <span class="dv-drafts__count">
                    <v-icon size="14" color="primary">sparkles</v-icon>
                    Draft
                  </span>
                </div>

                <DvWidgetDraftCard
                  v-for="(draft, idx) in getDraftSetProps(msg)?.drafts ?? []"
                  :key="`${msg.id}-${idx}`"
                  :account-id="targetAccountId ?? ''"
                  :dashboard-id="targetDashboard?.id ?? ''"
                  :draft="draft"
                  :filters="targetDashboard?.filters"
                  @saved="onWidgetSaved($event, msg)"
                  @refined="onWidgetRefined"
                />
              </div>
            </template>

            <DvInsightCard
              v-if="isInsightMessage(msg)"
              :headline="getInsightProps(msg)?.headline ?? ''"
              :description="getInsightProps(msg)?.description ?? ''"
              :severity="(getInsightProps(msg)?.severity as 'info' | 'success' | 'warning' | 'error' | undefined)"
            />

            <template v-if="getIntentCardsProps(msg)">
              <DvIntentCardList
                v-if="getIntentCardsProps(msg)?.cards?.length"
                :cards="getIntentCardsProps(msg)?.cards ?? []"
                @action="onIntentCardAction"
              />
              <div v-if="getIntentCardsProps(msg)?.quickReplies?.length" class="dv-quick-replies">
                <button
                  v-for="reply in getIntentCardsProps(msg)?.quickReplies ?? []"
                  :key="reply.value"
                  type="button"
                  class="dv-landing__pill"
                  @click="sendSuggestion(reply.value)"
                >
                  <v-icon v-if="reply.icon" size="14" color="primary">{{ reply.icon }}</v-icon>
                  {{ reply.label }}
                </button>
              </div>
            </template>

            <DvCampaignOnboardingCard
              v-if="getCampaignOnboardingProps(msg)"
              v-bind="getCampaignOnboardingProps(msg)!"
              @action="onCampaignOnboardingAction"
            />
          </div>
        </div>
      </template>

      <!-- Generating: live tool steps (Amboras-style) with skeleton -->
      <div v-if="isTyping" class="dv-msg-bot">
        <DvOrbitOrb class="dv-msg-bot__avatar" :size="28" :speed="1.6" arc />
        <div class="dv-msg-bot__body">
          <DvToolSteps v-if="liveSteps.length" :steps="liveSteps" :default-open="true" />
          <div v-else class="dv-status">
            <span class="dv-status__dot" aria-hidden="true"></span>
            {{ generatingStatus }}
          </div>
          <div class="dv-skeleton">
            <div class="dv-skeleton__top">
              <span class="dv-eyebrow">Drafting · last 30 days</span>
            </div>
            <div class="dv-skeleton__bars">
              <div class="dv-skeleton__bar"></div>
              <div class="dv-skeleton__bar dv-skeleton__bar--mid"></div>
              <div class="dv-skeleton__bar dv-skeleton__bar--narrow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ COMPOSER (text mode) ═══ -->
    <footer v-if="!isVoiceMode" class="dv-panel__composer">
      <div v-if="chatMode" class="dv-composer__pills">
        <button
          v-for="pill in suggestionPills"
          :key="pill.text"
          type="button"
          class="dv-composer__pill"
          @click="sendSuggestion(pill.text)"
        >
          <v-icon size="13">{{ pill.icon }}</v-icon>
          {{ pill.text }}
        </button>
      </div>
      <div class="dv-composer__field">
        <input
          v-model="inputText"
          type="text"
          :placeholder="isTyping ? 'Queue a follow-up…' : 'Ask Da Vinci…'"
          class="dv-composer__input"
          @keydown="onComposerKeydown"
        />
        <div class="dv-composer__actions">
          <v-btn icon size="32" variant="text" aria-label="Attach">
            <v-icon size="16">paperclip</v-icon>
          </v-btn>
          <v-btn
            v-if="voice.sttSupported"
            icon
            size="32"
            variant="text"
            :aria-label="isDictating ? 'Stop voice input' : 'Start voice input'"
            class="dv-composer__mic"
            :class="{ 'dv-composer__mic--live': isDictating }"
            @click="toggleMic"
          >
            <v-icon size="16">{{ isDictating ? 'mic-off' : 'mic' }}</v-icon>
          </v-btn>
          <v-btn
            v-if="voice.sttSupported"
            icon
            size="32"
            variant="text"
            aria-label="Switch to voice mode"
            @click="setUiMode('voice')"
          >
            <v-icon size="16">audio-lines</v-icon>
            <v-tooltip activator="parent" location="top">Voice mode</v-tooltip>
          </v-btn>
          <button
            v-if="isTyping"
            type="button"
            class="dv-composer__send dv-composer__stop"
            aria-label="Stop generating"
            @click="stopGeneration"
          >
            <v-icon size="13" class="dv-composer__stop-icon">square</v-icon>
          </button>
          <button
            type="button"
            class="dv-composer__send"
            aria-label="Send"
            :disabled="!inputText.trim()"
            @click="sendQuery"
          >
            <v-icon size="16" class="dv-on-accent-icon">arrow-up</v-icon>
          </button>
        </div>
      </div>
      <p class="dv-composer__note">Da Vinci can make mistakes. Check important info.</p>
    </footer>
      </div>
    </div>

    <DvToastStack />
  </div>
</template>

<style scoped lang="scss">
.dv-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: rgb(var(--v-theme-surface));
  min-height: 0;
  overflow: hidden;
  /* Clip header/composer corners when hosted in the rounded copilot drawer */
  border-radius: inherit;
}

/* ─── Header ───────────────────────────────────────────────────────── */
.dv-panel__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 16px;
  height: 56px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
  flex-shrink: 0;
}

.dv-panel__avatar {
  flex-shrink: 0;
}

.dv-on-accent-icon :deep(.v-icon),
.dv-on-accent-icon :deep(svg) {
  color: var(--dv-on-accent) !important;
}

.dv-panel__title {
  flex: 1;
  min-width: 0;
}

.dv-panel__title-name {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}

.dv-panel__title-sub {
  font-size: 12.5px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dv-panel__icon-btn {
  flex-shrink: 0;
}

.dv-panel__icon-btn:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--dv-accent) 40%, transparent);
  outline-offset: 2px;
}

.dv-panel__menu {
  min-width: 220px;
  border-radius: var(--mp-component-card-radius-md) !important;
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-panel__menu-danger :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-error));
}

/* ─── Split: optional history rail (full-width mode) + main column ──── */
.dv-panel__split {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.dv-panel__rail {
  width: 260px;
  flex: 0 0 260px;
  background: rgb(var(--v-theme-surface-variant));
  border-right: 1px solid rgb(var(--v-theme-outline-variant));
  overflow-y: auto;
}

.dv-panel__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ─── Body ─────────────────────────────────────────────────────────── */
.dv-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.dv-panel__body::-webkit-scrollbar {
  width: 6px;
}

.dv-panel__body::-webkit-scrollbar-thumb {
  background: rgb(var(--v-theme-outline-variant));
  border-radius: 9999px;
}

/* Landing */
.dv-landing {
  padding: 24px 8px 8px;
}

/* Quick-reply pills (shared with conversation quick replies) */
.dv-landing__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 10px 14px;
  border-radius: var(--mp-borderRadius-full);
  border: 1px solid var(--dv-border);
  background: rgb(var(--v-theme-surface));
  font-size: var(--mp-typography-fontSize-sm);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
  text-align: left;
}

.dv-landing__pill:hover {
  background: var(--dv-accent-soft);
  border-color: var(--dv-accent);
}

/* User bubble */
.dv-msg-user {
  display: flex;
  justify-content: flex-end;
}

.dv-msg-user__bubble {
  max-width: 88%;
  padding: 10px 14px;
  background: var(--dv-accent);
  color: var(--dv-on-accent);
  border-radius: var(--mp-component-card-radius-lg) var(--mp-component-card-radius-lg)
    var(--mp-borderRadius-sm) var(--mp-component-card-radius-lg);
  font-size: var(--mp-typography-fontSize-body);
  font-weight: 500;
  line-height: 1.45;
}

/* Bot reply */
.dv-msg-bot {
  display: flex;
  gap: 10px;
}

.dv-msg-bot__avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.dv-msg-bot__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dv-msg-bot__intro {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface));
}

.dv-msg-bot__intro :deep(strong) {
  font-weight: 600;
}

.dv-msg-bot__rationale {
  font-size: var(--mp-typography-fontSize-sm);
  font-weight: 400;
  line-height: 1.5;
  color: var(--dv-text-secondary);
  padding: 10px 12px;
  background: var(--dv-accent-soft);
  border-radius: var(--mp-component-card-radius-md);
  border-left: 2px solid var(--dv-accent);
}

.dv-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface));
  display: block;
  margin-bottom: 4px;
}

/* Drafts row */
.dv-drafts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dv-drafts__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-drafts__count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Generating status + skeleton */
.dv-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: rgb(var(--v-theme-primary));
  animation: dvPulse 1.4s ease-in-out infinite;
}

.dv-skeleton {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-component-card-radius-md);
  background: rgb(var(--v-theme-surface));
  padding: 14px;
}

.dv-skeleton__top {
  margin-bottom: 12px;
}

.dv-skeleton__bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dv-skeleton__bar {
  height: 14px;
  border-radius: 6px;
  background: rgb(var(--v-theme-surface-variant));
  width: 100%;
  animation: dvShimmer 1.4s ease-in-out infinite;
}

.dv-skeleton__bar--mid { width: 80%; }
.dv-skeleton__bar--narrow { width: 55%; }

@keyframes dvPulse {
  0%, 100% { opacity: 0.55; transform: scale(0.92); }
  50% { opacity: 1; transform: scale(1.08); }
}

/* ─── Voice dictation + quick replies ─────────────────────────────── */
.dv-composer__mic--live {
  color: var(--dv-accent);
  animation: dvPulse 1.4s ease infinite;
}

.dv-quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .dv-composer__mic--live {
    animation: none;
  }
}

@keyframes dvShimmer {
  0%, 100% { opacity: 0.65; }
  50% { opacity: 1; }
}

/* ─── Composer ─────────────────────────────────────────────────────── */
.dv-panel__composer {
  /* Matches body/header surface — the border-top hairline carries separation */
  flex-shrink: 0;
  padding: 16px 16px 16px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-composer__pills {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.dv-composer__pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 9999px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface));
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.dv-composer__pill:hover {
  background: rgb(var(--v-theme-surface-variant));
  border-color: rgb(var(--v-theme-outline));
  color: rgb(var(--v-theme-on-surface));
}

/* Gemini-style composer: tall rounded box — text on top, action row at bottom */
.dv-composer__field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 10px 10px 8px 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-component-card-radius-xl);
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-outline-variant));
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dv-composer__field:focus-within {
  border-color: var(--dv-accent);
  box-shadow: inset 0 0 0 2px var(--dv-accent);
}

.dv-composer__input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--mp-typography-fontSize-body);
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
  padding: 6px 4px 2px;
  font-family: inherit;
}

.dv-composer__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.dv-composer__actions .dv-composer__send {
  margin-left: auto;
}

.dv-composer__note {
  margin: 8px 0 0;
  text-align: center;
  font-size: 11.5px;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-composer__input::placeholder {
  color: var(--dv-text-secondary);
}

.dv-composer__send {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: none;
  background: var(--dv-grad);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: filter 120ms ease, opacity 120ms ease;
}

.dv-composer__send:hover {
  filter: brightness(1.05);
}

.dv-composer__send:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--dv-accent) 40%, transparent);
  outline-offset: 2px;
}

.dv-composer__send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Stop button — same round footprint as Send, neutral fill */
.dv-composer__stop {
  background: rgb(var(--v-theme-on-surface));
}

.dv-composer__stop:hover {
  filter: brightness(1.2);
}

.dv-composer__stop .dv-composer__stop-icon,
.dv-composer__stop .dv-composer__stop-icon :deep(svg) {
  color: rgb(var(--v-theme-surface)) !important;
}
</style>
