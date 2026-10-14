<script setup lang="ts">
import { useUserProfile } from '@/stores/useUserProfile'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import DvWidgetDraftCard from './copilot/DvWidgetDraftCard.vue'
import DvHistoryDrawer from './copilot/DvHistoryDrawer.vue'
import DvToastStack from './copilot/DvToastStack.vue'
import DvInsightCard from './copilot/DvInsightCard.vue'
import DvIntentCardList from './copilot/voice/DvIntentCardList.vue'
import DvCampaignOnboardingCard from './copilot/DvCampaignOnboardingCard.vue'
import DvSetupOnboardingCard from './copilot/DvSetupOnboardingCard.vue'
import DvLandingHero from './copilot/DvLandingHero.vue'
import DvOrbitOrb from './copilot/voice/DvOrbitOrb.vue'
import DvOrbitVoiceSurface from './copilot/voice/DvOrbitVoiceSurface.vue'
import DvToolSteps, { type DvToolStep } from './copilot/DvToolSteps.vue'
import DvCatalogContextBar from './copilot/DvCatalogContextBar.vue'
import DvCatalogDraftCard from './copilot/DvCatalogDraftCard.vue'
import DvCatalogGateCard from './copilot/DvCatalogGateCard.vue'
import PlgTalkToSalesDialog from './plg/PlgTalkToSalesDialog.vue'
import MpConfirmDialog from './MpConfirmDialog.vue'
import MpListRow from './MpListRow.vue'
import type { OrbitState } from './copilot/voice/orbit'
import {
  useCopilotStore,
  type CatalogDraftProps,
  type CatalogGateProps,
  type CatalogNoticeProps,
  type ChatComponent,
  type ChatMessage,
  type CampaignOnboardingProps,
  type DraftSetProps,
  type IntentCardsProps,
  type SetupOnboardingProps,
} from '@/stores/useCopilot'
import { useCatalogCopilotStore, type CatalogApplyResult } from '@/stores/useCatalogCopilot'
import {
  SIMULATED_TIMEOUT_RE,
  type CatalogDraft,
  type CatalogFieldKey,
  type CatalogGenErrorCode,
  type CatalogGenFailure,
  type CatalogGenSuccess,
} from '@/composables/useCatalogGenerator'
import type { CatalogGateAction } from '@/composables/catalogCopilotConfig'
import { promptLengthBucket } from '@/composables/useCatalogCopilotAnalytics'
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
import {
  setupHandoffFollowText,
  useDaVinciSetupOnboarding,
  type SetupOnboardingResponse,
} from '@/composables/useDaVinciSetupOnboarding'
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'
import {
  useDaVinciIntents,
  INTENT_STEPS,
  type DvCardDescriptor,
  type DvIntentResult,
} from '@/composables/useDaVinciIntents'
import { useDaVinciVoice, VoiceError } from '@/composables/useDaVinciVoice'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'
import { useDaVinciSetupStore } from '@/stores/useDaVinciSetup'
import { useOnboardingStore } from '@/stores/useOnboarding'

interface MpDaVinciBotProps {
  initialChatMode?: boolean
  initialMessages?: ChatMessage[]
  subtitle?: string
  headerless?: boolean
}

// Greeting follows the signed-in profile (a trial owner without a name is greeted as "there").
const profile = useUserProfile()
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
const setupOnboarding = useDaVinciSetupOnboarding()
const voice = useDaVinciVoice()
const copilot = useCopilotStore()
const catalog = useCatalogCopilotStore()
const onboarding = useDaVinciOnboardingStore()
const setupStore = useDaVinciSetupStore()
const setupGuide = useOnboardingStore()
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
/**
 * A prompt that is asking for a dashboard widget. Off a dashboard route this is the
 * only way into the widget-draft lane — everything else routes on merchant intent.
 */
const WIDGET_GRAMMAR = /\b(widget|chart|graph|table|kpi|tile|visuali[sz]ation|dashboard)\b|\b(show|plot|add)\b[^.]*\b(trend|over time|by channel|by country|by device|by domain)\b/i
/** A question ("what needs my attention?") wants an answer, not a widget — even on a dashboard. */
const QUESTION_GRAMMAR = /\?\s*$|^(what|which|why|how|should|is|are|do|does|can|could|would|who|when|where)\b/i
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
  // A live guided-setup session wins the restore; otherwise fall back to the
  // legacy campaign-wizard checkpoint behaviour.
  const setupSession = setupStore.peek(targetAccountId.value)
  if (setupSession && setupSession.stage !== 'complete') {
    setupStore.begin(targetAccountId.value)
    copilot.beginOnboarding(targetAccountId.value)
    copilot.open()
    if (!copilot.resumeMessage && messages.value.length === 0) {
      copilot.queueResume(setupHandoffFollowText(setupGuide.taskById(setupSession.currentTaskId)))
    }
  } else {
    onboarding.begin(targetAccountId.value)
    copilot.beginOnboarding(targetAccountId.value)
    copilot.open()
    if (!copilot.resumeMessage && messages.value.length === 0) {
      copilot.queueResume(
        'Welcome back. Your Da Vinci campaign checkpoint is restored. This draft is still editable, and nothing has been sent.',
      )
    }
  }
}

// Cold load / account switch anywhere mid-onboarding: silently adopt a live
// persisted setup session for the current account so typed messages keep
// routing through the guided flow (no drawer open, no resume message).
watch(
  targetAccountId,
  (accountId) => {
    if (!accountId || setupStore.activeAccountId === accountId) return
    const setupSession = setupStore.peek(accountId)
    if (setupSession && setupSession.stage !== 'complete') setupStore.begin(accountId)
  },
  { immediate: true },
)

/** The guided setup flow only answers for the account it belongs to. */
const setupFlowActive = computed(
  () => setupStore.isActive && setupStore.activeAccountId === targetAccountId.value,
)

const targetDashboard = computed(() => {
  if (activeDashboard.value) return activeDashboard.value
  if (!targetAccountId.value) return null
  // Off a dashboard route (full-page copilot, drawer over list/other pages),
  // target the dashboard the user was most recently on — e.g. the one they just
  // created — rather than blindly the account default.
  return dashboardsStore.getLastViewedDashboard(targetAccountId.value) ?? null
})

const headerStatus = computed(() => {
  // The context bar names the mode; the header only reports work in progress.
  if (catalog.context && isTyping.value) return generatingStatus.value || 'Drafting…'
  if (!chatMode.value) return props.subtitle
  if (isTyping.value) return generatingStatus.value || 'Drafting widgets…'
  return 'Intelligent AI assistant'
})

// The composer pills are analytics follow-ups ("Compare to YoY"); under a catalog
// reply — even after the catalog session ends — they would be non sequiturs.
const lastReplyIsCatalog = computed(() => {
  const last = [...messages.value].reverse().find((m) => m.role === 'assistant')
  return !!last?.componentData?.some((c) =>
    c.type === 'catalogDraft' || c.type === 'catalogGate' || c.type === 'catalogNotice'
    || (c.type === 'intentCards' && (c.props as IntentCardsProps).layout === 'list'))
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
// Persistent voice-failure notice for TEXT mode (voice mode surfaces orbitErrorMessage).
// Replaces the old transient toasts so denial recovery stays visible and instructional.
const voiceNotice = ref('')
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
    // Persistent, instructional recovery — no transient toasts. The voice surface
    // shows orbitErrorMessage; text mode shows the same copy as a composer notice.
    if (err instanceof VoiceError && err.code === 'permission') {
      orbitErrorMessage.value = 'Microphone access is blocked. Allow it in browser settings — click the lock icon in the address bar. Typing works fully in the meantime.'
      orbitError.value = true
    } else if (err instanceof VoiceError && err.code === 'audio') {
      orbitErrorMessage.value = 'No microphone was found. Connect one, or continue by typing.'
    } else if (err instanceof VoiceError && err.code === 'network') {
      orbitErrorMessage.value = 'Voice is unavailable right now. Check your connection, or continue by typing.'
    }
    if (err instanceof VoiceError && (err.code === 'permission' || err.code === 'audio' || err.code === 'network')) {
      if (isVoiceMode.value) orbitError.value = true
      else voiceNotice.value = orbitErrorMessage.value
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

function appendSetupOnboardingResponse(res: SetupOnboardingResponse) {
  const componentData: ChatMessage['componentData'] = []
  if (res.quickReplies?.length) {
    componentData.push({
      type: 'intentCards',
      props: { cards: [], quickReplies: res.quickReplies },
    })
  }
  if (res.setupCard) {
    componentData.push({
      type: 'setupOnboarding',
      props: res.setupCard,
    })
  }
  messages.value.push({
    id: makeId('a'),
    role: 'assistant',
    text: res.reply,
    componentData: componentData.length ? componentData : undefined,
  })
  chatMode.value = true
  scrollToBottom()
  maybeSpeak(res.speech ?? res.reply)
}

function onSetupOnboardingAction(action: string) {
  const accountId = targetAccountId.value
  if (action.startsWith('open-task:') || action === 'view-all-tasks' || action === 'explore-dashboard') {
    const routeName = setupOnboarding.markHandoff(action)
    if (!accountId || !routeName) return
    copilot.queueResume(
      action.startsWith('open-task:')
        ? setupHandoffFollowText(setupOnboarding.currentTask.value)
        : 'I’m here whenever you need me — pick any task from the guide and I’ll follow along.',
    )
    copilot.setWidthMode('panel')
    copilot.open()
    void router.push({ name: routeName, params: { accountId }, query: { source: 'davinci' } })
    return
  }
  const response = setupOnboarding.handleAction(action)
  if (response) {
    appendSetupOnboardingResponse(response)
    if (response.exitToDashboard && accountId) {
      void router.push({ name: 'Dashboard', params: { accountId } })
    }
  }
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
    if (payload.action === 'review-draft') {
      if (payload.card.props.draftId) {
        openCampaignDraft(payload.card.props.draftId)
        return
      }
      // A campaign card with no draft id can only come from a restored snapshot
      // predating the real-draft flow. Create the draft instead of reporting a
      // success that never happened.
      const draft = campaignOnboarding.createDraft()
      const draftId = draft.cards?.find((card) => card.type === 'campaign')?.props.draftId
      if (draftId) openCampaignDraft(draftId)
      else appendCampaignOnboardingResponse(draft)
      return
    }
    if (payload.action === 'change-brief') {
      if (targetAccountId.value) trackDaVinciOnboardingEvent('brief_corrected', targetAccountId.value)
      appendCampaignOnboardingResponse(campaignOnboarding.changeBrief())
      return
    }
  }
  // Shared with the full-page experience: creates the segment / copies the draft
  // and navigates, then reports what actually happened.
  pushToast(intents.performCardAction(payload.card, payload.action) ?? { title: 'Done' })
}

function processQuery(text: string) {
  if (!text) return
  // Routing precedence (kept identical to the Experience surface): guided
  // setup → campaign wizard → the normal assistant. A live catalog context owns
  // the conversation until the merchant leaves it, so the flows stand aside.
  const catalogActive = !!catalog.context
  const setupResponse = !catalogActive && setupFlowActive.value ? setupOnboarding.handleText(text) : null
  if (setupResponse) {
    pushUserTurn(text)
    appendSetupOnboardingResponse(setupResponse)
    if (setupResponse.exitToDashboard && targetAccountId.value) {
      void router.push({ name: 'Dashboard', params: { accountId: targetAccountId.value } })
    }
    return
  }
  const onboardingResponse = !catalogActive && onboarding.isActive ? campaignOnboarding.handleText(text) : null
  if (onboardingResponse) {
    pushUserTurn(text)
    appendCampaignOnboardingResponse(onboardingResponse)
    return
  }
  // Either flow pauses itself for off-topic questions; acknowledge the switch
  // once, then answer the actual question through the normal path.
  const setupPauseNotice = catalogActive ? null : setupOnboarding.consumePauseNotice()
  const pauseNotice = catalogActive ? null : campaignOnboarding.consumePauseNotice()
  // Text mode mid-generation: show the turn immediately, answer it after the
  // current reply lands (queued follow-up).
  if (isTyping.value && !isVoiceMode.value) {
    pushUserTurn(text)
    if (setupPauseNotice) appendSetupOnboardingResponse(setupPauseNotice)
    if (pauseNotice) appendCampaignOnboardingResponse(pauseNotice)
    queuedPrompts.value.push(text)
    return
  }
  pushUserTurn(text)
  if (setupPauseNotice) appendSetupOnboardingResponse(setupPauseNotice)
  if (pauseNotice) appendCampaignOnboardingResponse(pauseNotice)
  runGeneration(text)
}

// A product hook verified the current setup task while the drawer is visible —
// congratulate and advance in place (this is the "user imported contacts and
// Da Vinci noticed" moment).
watch(
  () => {
    const taskId = setupStore.activeSession?.currentTaskId
    return taskId ? setupGuide.completed[taskId] === true : false
  },
  (done) => {
    if (!done || !surfaceVisible.value || !setupFlowActive.value) return
    const taskId = setupStore.activeSession?.currentTaskId
    if (!taskId) return
    const response = setupOnboarding.onTaskAutoCompleted(taskId)
    if (response) appendSetupOnboardingResponse(response)
  },
)

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

  // Catalog Co-Pilot. "Add a product called…" from anywhere enters catalog create
  // mode and drafts for real (instead of the canned description card). Inside the
  // context every prompt is a catalog ask — unless it is another job entirely
  // ("how's revenue this week?"), which leaves the context and routes normally.
  // This sits in runGeneration, not processQuery: queued follow-ups land here too.
  if (!catalog.context && !intents.pending.value && catalog.ctaVisible && intents.classify(text) === 'product') {
    catalog.openCreate('chat', { greet: false })
  }
  if (catalog.context) {
    const kind = intents.classify(text)
    if (kind === 'product' || kind === 'fallback') {
      runCatalogLane(text, gen)
      return
    }
    catalog.exit()
  }

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

  // Route on what the merchant asked for first. The widget matcher used to run
  // before the intent layer whenever a dashboard was resolvable — which is always,
  // once the home page has been seen — so "win back customers who haven't bought
  // in 90 days" came back as a Customer Count KPI widget. The widget lane now only
  // fires for prompts that ask for a widget: on a dashboard route, or with an
  // explicit widget/chart word anywhere in the app.
  const intentKind = intents.classify(text)
  const asksForWidget = WIDGET_GRAMMAR.test(text) || (isDashboardRoute.value && !QUESTION_GRAMMAR.test(text))
  if (intentKind === 'fallback' && asksForWidget && targetAccountId.value && targetDashboard.value) {
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
  startStepTicker(INTENT_STEPS[intentKind], gen, 1200)
  pendingTimers.push(setTimeout(async () => {
    if (gen !== generationSeq) return
    // No widget mapping — try the unified intent layer (campaigns, products,
    // revenue, segments) before falling back to the widget-prompt hint.
    const res = intents.handle(text)
    if (res.intent !== 'fallback') {
      completeIntentResult(res, gen)
      return
    }
    if (!WIDGET_GRAMMAR.test(text)) {
      // Open-ended question — answer with Gemini Flash (falls back to the canned
      // hint if Gemini is unavailable), grounded in the live workspace context
      // block. Dashboard routes included: a merchant asking "what needs my
      // attention?" from the home page deserves an answer, not a widget hint.
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
    // Asked for a widget we can't map → widget-prompt hint
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

// ── Catalog Co-Pilot (Da Vinci Catalog Management) ─────────────────────────
// Da Vinci drafts; the merchant applies; the form's own Save / Publish persists.

const applyingDraftId = ref<string | null>(null)
const talkToSalesOpen = ref(false)

/** Catalog context with a gate up: drafting is blocked and the composer says so. */
const catalogGated = computed(() => !!catalog.context && !!catalog.gateReason)

const composerPlaceholder = computed(() => {
  if (catalogGated.value) return 'Drafting is unavailable — see the options above'
  if (isTyping.value) return 'Queue a follow-up…'
  if (catalog.context?.mode === 'create') return 'Describe the product, or refine the draft…'
  if (catalog.context) return 'Ask for a change…'
  return 'Ask Da Vinci…'
})

const skeletonEyebrow = computed(() => (catalog.context ? 'Drafting product' : 'Drafting · last 30 days'))

const NOTICE_HEADLINES: Record<CatalogGenErrorCode, string> = {
  timeout: 'Da Vinci didn’t respond in time',
  missing_title: 'Add a product title first',
  unclear: 'Tell me a little more',
  no_changes: 'Nothing to change',
}

function runCatalogLane(text: string, gen: number) {
  const ctx = catalog.context
  if (!ctx) return
  intents.reset()
  catalog.track('MCC - Da Vinci Catalog - Prompt Submitted', {
    mode: ctx.mode,
    is_preset: catalog.isPreset(text),
    prompt_length_bucket: promptLengthBucket(text),
    conversation_id: currentConversationId.value,
  })
  if (catalog.gateReason) {
    // Policy, not generation: answer at once, never bill.
    catalog.pushGate()
    finishGeneration(gen)
    return
  }
  const started = Date.now()
  const outcome = catalog.generate(text)
  const delay = outcome.ok ? 1400 : outcome.code === 'timeout' ? 2600 : 700
  generatingStatus.value = 'Drafting…'
  startStepTicker(outcome.steps, gen, delay)
  pendingTimers.push(setTimeout(() => {
    if (gen !== generationSeq) return
    const latency = Date.now() - started
    if (outcome.ok) {
      catalog.track('MCC - Da Vinci Catalog - Draft Returned', {
        mode: ctx.mode,
        latency_ms: latency,
        field_count: outcome.keys.length,
        has_variants: !!outcome.draft.options?.length,
      })
      pushCatalogDraft(outcome)
    } else {
      catalog.track('MCC - Da Vinci Catalog - Draft Failed', { mode: ctx.mode, error_code: outcome.code, latency_ms: latency })
      pushCatalogNotice(outcome, text)
    }
    finishGeneration(gen)
  }, delay))
}

function pushCatalogDraft(outcome: CatalogGenSuccess) {
  const ctx = catalog.context
  if (!ctx) return
  catalog.closeOpenDrafts('superseded')
  const card: CatalogDraftProps = {
    draftId: makeId('draft'),
    mode: ctx.mode,
    field: ctx.field,
    productId: ctx.productId,
    draft: outcome.draft,
    current: outcome.current,
    keys: outcome.keys,
    target: { name: ctx.target.name, params: { ...ctx.target.params } },
    status: 'draft',
    gaps: outcome.gaps,
    notes: outcome.notes,
  }
  const componentData: ChatComponent[] = [{ type: 'catalogDraft', props: card }]
  if (outcome.refinements.length) {
    componentData.push({
      type: 'intentCards',
      props: {
        cards: [],
        quickReplies: outcome.refinements.map((value) => ({ label: value, value })),
        layout: 'compact',
      },
    })
  }
  // One sentence in the bubble; the card carries the detail. Speech keeps the full version.
  messages.value.push({ id: makeId('a'), role: 'assistant', text: outcome.intro, toolSteps: outcome.steps, componentData })
  chatMode.value = true
  maybeSpeak(outcome.explanation)
}

function pushCatalogNotice(outcome: CatalogGenFailure, prompt: string) {
  const notice: CatalogNoticeProps = {
    tone: outcome.code === 'timeout' ? 'error' : 'warning',
    headline: NOTICE_HEADLINES[outcome.code],
    description: outcome.message,
    // The simulated fault is one-shot: Try again re-sends the brief without it.
    retryPrompt: outcome.code === 'timeout' ? prompt.replace(SIMULATED_TIMEOUT_RE, '').replace(/\s{2,}/g, ' ').trim() : undefined,
  }
  messages.value.push({ id: makeId('a'), role: 'assistant', text: '', componentData: [{ type: 'catalogNotice', props: notice }] })
  chatMode.value = true
}

function catalogDrafts(msg: ChatMessage): CatalogDraftProps[] {
  return (msg.componentData ?? []).filter((item) => item.type === 'catalogDraft').map((item) => item.props as CatalogDraftProps)
}

function catalogGates(msg: ChatMessage): CatalogGateProps[] {
  return (msg.componentData ?? []).filter((item) => item.type === 'catalogGate').map((item) => item.props as CatalogGateProps)
}

function catalogNotices(msg: ChatMessage): CatalogNoticeProps[] {
  return (msg.componentData ?? []).filter((item) => item.type === 'catalogNotice').map((item) => item.props as CatalogNoticeProps)
}

async function onCatalogApply(card: CatalogDraftProps, keys: CatalogFieldKey[]) {
  if (card.status !== 'draft' || applyingDraftId.value) return
  catalog.track('MCC - Da Vinci Catalog - Apply Clicked', { mode: card.mode, fields_applied_count: keys.length })
  const fields: CatalogDraft = {}
  for (const key of keys) Object.assign(fields, { [key]: card.draft[key] })
  applyingDraftId.value = card.draftId
  let result: CatalogApplyResult
  try {
    result = await catalog.apply({
      draftId: card.draftId,
      mode: card.mode,
      field: card.field,
      productId: card.productId,
      target: card.target,
      fields,
      keys,
    })
  } finally {
    applyingDraftId.value = null
  }
  // Success is confirmed once on the form (its notice) and once here (the card's
  // Applied state) — no toast on top.
  if (result.ok) {
    catalog.markDraft(card.draftId, 'applied', keys)
  } else if (result.reason === 'navigation') {
    pushToast({ title: 'Nothing was applied', sub: 'You stayed on this page, so no credits were used.' })
  }
  // A gate reason: the store has already posted the gate card.
}

function onCatalogDiscard(card: CatalogDraftProps) {
  if (card.status !== 'draft') return
  catalog.markDraft(card.draftId, 'discarded')
  catalog.track('MCC - Da Vinci Catalog - Discarded', { mode: card.mode, had_draft: true })
}

function onCatalogGateAction(gate: CatalogGateProps, action: CatalogGateAction) {
  const accountId = targetAccountId.value
  if (action === 'add-manually') {
    catalog.exit()
    copilot.close()
    if (accountId) void router.push({ name: 'ProductNew', params: { accountId } })
    return
  }
  catalog.track('MCC - Da Vinci Catalog - Upgrade Clicked', {
    gate_reason: gate.reason,
    is_trial: gate.wallet.kind === 'trial',
    target: action === 'talk-to-sales' ? 'sales' : action === 'buy-credits' ? 'billing' : 'plans',
  })
  if (action === 'talk-to-sales') {
    talkToSalesOpen.value = true
    return
  }
  if (!accountId) return
  catalog.exit()
  copilot.close()
  void router.push({ name: action === 'buy-credits' ? 'Billing' : 'Plans', params: { accountId } })
}

function onCatalogRetry(notice: CatalogNoticeProps) {
  if (notice.retryPrompt) sendSuggestion(notice.retryPrompt)
}

// Entering catalog context: the voice surface renders no catalog cards, so drop to text.
watch(() => catalog.context, (ctx) => {
  if (!ctx) return
  if (isVoiceMode.value) setUiMode('text')
  scrollToBottom()
})

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
  catalog.exit('user')
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

/** Quick replies hide once stale: their session ended, or the draft they refine was replaced, applied or discarded. */
function quickRepliesLive(msg: ChatMessage): boolean {
  if (getIntentCardsProps(msg)?.retired) return false
  return catalogDrafts(msg).every((card) => card.status === 'draft')
}

function getCampaignOnboardingProps(msg: ChatMessage): CampaignOnboardingProps | null {
  const comp = msg.componentData?.find((item) => item.type === 'campaignOnboarding')
  if (!comp || comp.type !== 'campaignOnboarding') return null
  return comp.props as CampaignOnboardingProps
}

function getSetupOnboardingProps(msg: ChatMessage): SetupOnboardingProps | null {
  const comp = msg.componentData?.find((item) => item.type === 'setupOnboarding')
  if (!comp || comp.type !== 'setupOnboarding') return null
  return comp.props as SetupOnboardingProps
}

const clearAllOpen = ref(false)

function handleClearAll() {
  clearAllOpen.value = true
}

function confirmClearAll() {
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
      <div class="dv-panel__actions">
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
          class="dv-panel__icon-btn dv-panel__expand"
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
            <v-divider class="my-1" />
            <v-list-item class="text-error" @click="handleClearAll">
              <template #prepend><v-icon size="18" color="error">trash-2</v-icon></template>
              <v-list-item-title>Delete all conversations</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn icon size="34" variant="text" aria-label="Close" class="dv-panel__icon-btn" @click="emit('close')">
          <v-icon size="18">x</v-icon>
        </v-btn>
      </div>
    </header>

    <DvCatalogContextBar
      v-if="catalog.context && !isVoiceMode"
      :mode="catalog.context.mode"
      :field="catalog.context.field"
      :product-name="catalog.context.productName"
      :wallet="catalog.wallet"
      @exit="catalog.exit('user')"
    />

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
        :name="profile.firstName"
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

            <DvCatalogDraftCard
              v-for="card in catalogDrafts(msg)"
              :key="card.draftId"
              :mode="card.mode"
              :field="card.field"
              :draft="card.draft"
              :current="card.current"
              :keys="card.keys"
              :status="card.status"
              :applied-keys="card.appliedKeys"
              :gaps="card.gaps"
              :notes="card.notes"
              :commit-label="card.target.name === 'ProductEdit' ? 'Save' : 'Save as Draft or Publish'"
              :busy="applyingDraftId === card.draftId"
              @apply="(keys) => onCatalogApply(card, keys)"
              @discard="onCatalogDiscard(card)"
            />
            <DvCatalogGateCard
              v-for="(gate, gateIndex) in catalogGates(msg)"
              :key="`${msg.id}-gate-${gateIndex}`"
              :reason="gate.reason"
              :wallet="gate.wallet"
              @action="(action) => onCatalogGateAction(gate, action)"
            />
            <DvInsightCard
              v-for="(notice, noticeIndex) in catalogNotices(msg)"
              :key="`${msg.id}-notice-${noticeIndex}`"
              :headline="notice.headline"
              :description="notice.description"
              :severity="notice.tone"
              :icon="notice.tone === 'error' ? 'circle-alert' : 'triangle-alert'"
              :action-label="notice.retryPrompt ? 'Try again' : undefined"
              @action="onCatalogRetry(notice)"
            />

            <template v-if="getIntentCardsProps(msg)">
              <DvIntentCardList
                v-if="getIntentCardsProps(msg)?.cards?.length"
                :cards="getIntentCardsProps(msg)?.cards ?? []"
                @action="onIntentCardAction"
              />
              <!-- Starting points: full-width rows with a hint of what each drafts. -->
              <div
                v-if="getIntentCardsProps(msg)?.quickReplies?.length && quickRepliesLive(msg) && getIntentCardsProps(msg)?.layout === 'list'"
                class="dv-quick-list"
              >
                <MpListRow
                  v-for="reply in getIntentCardsProps(msg)?.quickReplies ?? []"
                  :key="reply.value"
                  variant="boxed"
                  density="compact"
                  clickable
                  class="dv-quick-list__row"
                  @click="sendSuggestion(reply.value)"
                >
                  <template v-if="reply.icon" #lead>
                    <v-icon size="16" class="dv-quick-list__icon">{{ reply.icon }}</v-icon>
                  </template>
                  <span class="dv-quick-list__label">{{ reply.label }}</span>
                  <span v-if="reply.hint" class="dv-quick-list__hint">{{ reply.hint }}</span>
                  <template #trailing>
                    <v-icon size="16" aria-hidden="true">arrow-up</v-icon>
                  </template>
                </MpListRow>
              </div>
              <div
                v-else-if="getIntentCardsProps(msg)?.quickReplies?.length && quickRepliesLive(msg)"
                class="dv-quick-replies"
                :class="{ 'dv-quick-replies--compact': getIntentCardsProps(msg)?.layout === 'compact' }"
              >
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
            <DvSetupOnboardingCard
              v-if="getSetupOnboardingProps(msg)"
              v-bind="getSetupOnboardingProps(msg)!"
              @action="onSetupOnboardingAction"
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
              <span class="dv-eyebrow">{{ skeletonEyebrow }}</span>
            </div>
            <!-- A catalog draft is a card: the placeholder takes its shape. -->
            <div v-if="catalog.context" class="dv-skeleton__bars">
              <div class="dv-skeleton__bar dv-skeleton__bar--narrow"></div>
              <div class="dv-skeleton__bar"></div>
              <div class="dv-skeleton__bar dv-skeleton__bar--mid"></div>
              <div class="dv-skeleton__bar"></div>
              <div class="dv-skeleton__bar dv-skeleton__bar--mid"></div>
              <div class="dv-skeleton__pill"></div>
            </div>
            <div v-else class="dv-skeleton__bars">
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
      <div v-if="voiceNotice" class="dv-composer__notice" role="alert">
        <v-icon size="14">mic-off</v-icon>
        <span>{{ voiceNotice }}</span>
        <v-btn icon size="20" variant="text" aria-label="Dismiss voice notice" @click="voiceNotice = ''">
          <v-icon size="14">x</v-icon>
        </v-btn>
      </div>
      <div v-if="chatMode && !catalog.context && !lastReplyIsCatalog" class="dv-composer__pills">
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
          :placeholder="composerPlaceholder"
          :disabled="catalogGated"
          :aria-label="catalog.context ? 'Message Catalog Co-Pilot' : 'Message Da Vinci'"
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
            :disabled="catalogGated"
            :aria-label="isDictating ? 'Stop voice input' : 'Start voice input'"
            class="dv-composer__mic"
            :class="{ 'dv-composer__mic--live': isDictating }"
            @click="toggleMic"
          >
            <v-icon size="16">{{ isDictating ? 'mic-off' : 'mic' }}</v-icon>
          </v-btn>
          <v-btn
            v-if="voice.sttSupported && !catalog.context"
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
            :disabled="!inputText.trim() || catalogGated"
            @click="sendQuery"
          >
            <v-icon size="16" class="dv-on-accent-icon">arrow-up</v-icon>
          </button>
        </div>
      </div>
      <p class="dv-composer__note">
        <template v-if="!chatMode">
          You’re chatting with an AI assistant — it drafts and guides, and won’t change your account on
          its own. If you use voice, audio is processed by your browser’s speech service.
        </template>
        <template v-else>Da Vinci can make mistakes. Check important info.</template>
      </p>
    </footer>
      </div>
    </div>

    <PlgTalkToSalesDialog v-model="talkToSalesOpen" />
    <MpConfirmDialog
      v-model="clearAllOpen"
      title="Delete all Da Vinci conversations?"
      message="This cannot be undone."
      confirm-label="Delete All"
      danger
      @confirm="confirmClearAll"
    />
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
/* gap is 6, not 10: the orb's halo already pads it (a 32px orb in a 46px box). */
.dv-panel__header {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  padding: var(--mp-space-8) var(--mp-space-8) var(--mp-space-8) var(--mp-space-16);
  height: var(--mp-space-48);
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
  font-size: var(--mp-fontSize-15);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}

.dv-panel__title-sub {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-regular);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: var(--mp-space-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* One tight icon cluster: the 34px buttons carry their own padding, so a wide
   gap only took room from the title — the status line truncated even at 400px. */
.dv-panel__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-2);
  flex-shrink: 0;
}

.dv-panel__icon-btn {
  flex-shrink: 0;
}

/* Phones: the drawer already spans nearly the whole viewport, so Expand gains
   next to nothing — drop it, and tighten the header so "Da Vinci" and its status
   get the room instead of wrapping and truncating. */
@media (max-width: #{$mp-layout-breakpointCompact - 0.02px}) {
  .dv-panel__header {
    padding-left: var(--mp-space-12);
  }

  .dv-panel__expand {
    display: none;
  }
}

.dv-panel__icon-btn:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--dv-accent) 40%, transparent);
  outline-offset: 2px;
}

.dv-panel__menu {
  min-width: 220px;
  border-radius: var(--mp-radius-12) !important;
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}

/* ─── Split: optional history rail (full-width mode) + main column ──── */
.dv-panel__split {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.dv-panel__rail {
  width: var(--mp-layout-sectionRailWidth);
  flex: 0 0 var(--mp-layout-sectionRailWidth);
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
  /* Sticky card footers (DvCatalogDraftCard) pin to the scrollport edge, not the padding. */
  --dv-sticky-bottom: calc(-1 * var(--mp-space-24));
  flex: 1;
  overflow-y: auto;
  padding: var(--mp-space-20) var(--mp-space-20) var(--mp-space-24);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  min-height: 0;
}

.dv-panel__body::-webkit-scrollbar {
  width: var(--mp-space-6);
}

.dv-panel__body::-webkit-scrollbar-thumb {
  background: rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-full);
}

/* Landing */
.dv-landing {
  padding: var(--mp-space-24) var(--mp-space-8) var(--mp-space-8);
}

/* Quick-reply pills (shared with conversation quick replies) */
.dv-landing__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-8);
  min-height: var(--mp-component-control-height);
  padding: var(--mp-space-10) var(--mp-space-14);
  border-radius: var(--mp-radius-full);
  border: 1px solid var(--dv-border);
  background: rgb(var(--v-theme-surface));
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
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
  padding: var(--mp-space-10) var(--mp-space-14);
  background: var(--dv-accent);
  color: var(--dv-on-accent);
  border-radius: var(--mp-component-card-radius) var(--mp-component-card-radius)
    var(--mp-radius-4) var(--mp-component-card-radius);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.45;
}

/* Bot reply */
.dv-msg-bot {
  display: flex;
  gap: var(--mp-space-10);
}

.dv-msg-bot__avatar {
  flex-shrink: 0;
  margin-top: var(--mp-space-2);
}

.dv-msg-bot__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
}

.dv-msg-bot__intro {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface));
}

.dv-msg-bot__intro :deep(strong) {
  font-weight: var(--mp-fontWeight-semibold);
}

.dv-msg-bot__rationale {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-regular);
  line-height: 1.5;
  color: var(--dv-text-secondary);
  padding: var(--mp-space-10) var(--mp-space-12);
  background: var(--dv-accent-soft);
  border-radius: var(--mp-radius-12);
  border-left: 2px solid var(--dv-accent);
}

.dv-eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface));
  display: block;
  margin-bottom: var(--mp-space-4);
}

/* Drafts row */
.dv-drafts {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-10);
}

.dv-drafts__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-drafts__count {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
}

/* Generating status + skeleton */
.dv-status {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-status__dot {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-primary));
  animation: dvPulse 1.4s ease-in-out infinite;
}

.dv-skeleton {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-12);
  background: rgb(var(--v-theme-surface));
  padding: var(--mp-space-14);
}

.dv-skeleton__top {
  margin-bottom: var(--mp-space-12);
}

.dv-skeleton__bars {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.dv-skeleton__bar {
  height: var(--mp-space-14);
  border-radius: var(--mp-component-chip-radius);
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
  gap: var(--mp-space-8);
  margin-top: var(--mp-space-8);
}

/* Follow-up refinements: lighter than a starting point, several to a row. */
.dv-quick-replies--compact {
  gap: var(--mp-space-6);
  margin-top: 0;
}

.dv-quick-replies--compact .dv-landing__pill {
  min-height: var(--mp-component-segmented-height-sm);
  padding: var(--mp-space-4) var(--mp-space-12);
  gap: var(--mp-space-6);
}

.dv-quick-list {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  margin-top: var(--mp-space-4);
}

/* Scoped under .dv-quick-list so these beat MpListRow's own boxed styles. */
.dv-quick-list .dv-quick-list__row {
  padding-block: var(--mp-space-8);
  border-color: var(--dv-border);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.dv-quick-list .dv-quick-list__row:hover,
.dv-quick-list .dv-quick-list__row:focus-visible {
  border-color: var(--dv-accent);
  background: var(--dv-accent-soft);
  color: var(--dv-text-primary);
}

.dv-quick-list__icon {
  color: var(--dv-text-primary);
}

.dv-quick-list__label {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  line-height: var(--mp-lineHeight-compact);
}

.dv-quick-list__hint {
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-compact);
  color: var(--on-surface-muted);
}

.dv-quick-list__row:hover .dv-quick-list__hint,
.dv-quick-list__row:focus-visible .dv-quick-list__hint {
  color: var(--dv-text-secondary);
}

.dv-quick-list__row :deep(.mp-list-row__trailing .v-icon) {
  transform: rotate(45deg);
}

.dv-skeleton__pill {
  width: var(--mp-space-80);
  height: var(--mp-space-28);
  margin-top: var(--mp-space-4);
  border-radius: var(--mp-radius-full);
  background: rgb(var(--v-theme-surface-variant));
  animation: dvShimmer 1.4s ease-in-out infinite;
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
  padding: var(--mp-space-16) var(--mp-space-16) var(--mp-space-16);
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-composer__notice {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin-bottom: var(--mp-space-10);
  padding: var(--mp-space-6) var(--mp-space-8) var(--mp-space-6) var(--mp-space-12);
  border-radius: var(--mp-component-input-radius);
  border: 1px solid rgb(var(--v-theme-error), 0.28);
  background: rgb(var(--v-theme-error), 0.06);
  color: rgb(var(--v-theme-error));
  font-size: var(--mp-fontSize-13);
  line-height: 1.45;
}

.dv-composer__notice span {
  flex: 1;
}

.dv-composer__pills {
  display: flex;
  gap: var(--mp-space-6);
  margin-bottom: var(--mp-space-10);
  flex-wrap: wrap;
}

.dv-composer__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  padding: var(--mp-space-6) var(--mp-space-12);
  border-radius: var(--mp-radius-full);
  border: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface));
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
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
  gap: var(--mp-space-4);
  padding: var(--mp-space-10) var(--mp-space-10) var(--mp-space-8) var(--mp-space-14);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-20);
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
  font-size: var(--mp-fontSize-14);
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
  padding: var(--mp-space-6) var(--mp-space-4) var(--mp-space-2);
  font-family: inherit;
}

.dv-composer__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-2);
}

.dv-composer__actions .dv-composer__send {
  margin-left: auto;
}

.dv-composer__note {
  margin: var(--mp-space-8) 0 0;
  text-align: center;
  font-size: var(--mp-fontSize-12);
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-composer__input::placeholder {
  color: var(--dv-text-secondary);
}

.dv-composer__send {
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--mp-radius-full);
  border: none;
  background: var(--dv-grad);
  /* P5.5: the gradient is a fill, so it states its own ink. --dv-on-accent
     exists for exactly this and was not being applied — the icon inherited
     the composer's text color instead. */
  color: var(--dv-on-accent);
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
