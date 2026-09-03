<script setup lang="ts">
// Da Vinci AI experience — native port of the "Marojarvis" voice-first prototype
// (formerly linked externally as https://davinci-ai-first.vercel.app).
// fullPage route: the app shell + copilot drawer are unmounted, so this view
// owns the mic exclusively and provides its own exits (Esc / Classic UI / close).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DvOrbCanvas from '@/components/copilot/voice/DvOrbCanvas.vue'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
import DvIntentCardList from '@/components/copilot/voice/DvIntentCardList.vue'
import DvCampaignOnboardingCard from '@/components/copilot/DvCampaignOnboardingCard.vue'
import DvSetupOnboardingCard from '@/components/copilot/DvSetupOnboardingCard.vue'
import DvToastStack from '@/components/copilot/DvToastStack.vue'
import { useDaVinciVoice, VoiceError } from '@/composables/useDaVinciVoice'
import {
  useDaVinciIntents,
  type DvCardDescriptor,
  type DvIntentResult,
} from '@/composables/useDaVinciIntents'
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
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import {
  useCopilotStore,
  type CampaignOnboardingProps,
  type ChatMessage,
  type IntentCardsProps,
  type SetupOnboardingProps,
} from '@/stores/useCopilot'
import { useDaVinciOnboardingStore, type DaVinciInputMode } from '@/stores/useDaVinciOnboarding'
import { useDaVinciSetupStore, type SetupEntry } from '@/stores/useDaVinciSetup'
import { useOnboardingStore } from '@/stores/useOnboarding'
import { useUserProfile } from '@/stores/useUserProfile'

const route = useRoute()
const router = useRouter()
const voice = useDaVinciVoice()
const intents = useDaVinciIntents()
const campaignOnboarding = useDaVinciCampaignOnboarding()
const setupOnboarding = useDaVinciSetupOnboarding()
const { pushToast } = useDaVinciToasts()
const profile = useUserProfile()
const copilot = useCopilotStore()
const onboarding = useDaVinciOnboardingStore()
const setupStore = useDaVinciSetupStore()
const setupGuide = useOnboardingStore()
const { messages, chatMode } = storeToRefs(copilot)

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? ''
})

const inputText = ref('')
// Starter chips reveal only while the text field is focused (see template).
const inputFocused = ref(false)
const captionText = ref('')
const voiceRecoveryMessage = ref('')
const threadEl = ref<HTMLElement | null>(null)
const hasThread = computed(() => messages.value.length > 0)
const busy = computed(() => voice.state.value !== 'idle')
const avatarSpeed = computed(() => ({ idle: 1, listening: 2.4, thinking: 1.6, speaking: 1.4 })[voice.state.value])
// Guided setup (post-signup / post-checkout) is the primary arrival flow;
// `?onboarding=campaign` stays as a back-compat entry to the campaign wizard.
const setupEntry = computed(
  () => route.query.onboarding === 'setup' || (setupStore.activeAccountId === accountId.value && setupStore.isActive),
)
const campaignEntry = computed(
  () => !setupEntry.value
    && (route.query.onboarding === 'campaign' || (onboarding.activeAccountId === accountId.value && onboarding.isActive)),
)
function setupEntryKind(): SetupEntry {
  if (route.query.entry === 'checkout') return 'checkout'
  return route.query.onboarding === 'setup' ? 'signup' : 'manual'
}
// Signup already granted the mic and unlocked audio; while the handoff auto-start
// runs, suppress the welcome so the greeting is captioned instead of hidden behind
// stale buttons.
const voiceHandoff = ref(false)
const welcomeVisible = computed(() => {
  if (voiceHandoff.value) return false
  if (setupEntry.value) {
    const stage = setupStore.activeSession?.stage
    return !stage || stage === 'welcome'
  }
  if (campaignEntry.value) {
    const stage = onboarding.activeSession?.stage
    return !stage || stage === 'welcome' || stage === 'consent'
  }
  return false
})
const welcomeEyebrow = computed(() =>
  setupEntry.value ? 'Your guided setup, with Da Vinci' : 'Your first campaign, guided by Da Vinci',
)
const welcomeTitle = computed(() =>
  setupEntry.value ? 'Let’s get your account working.' : 'Turn your first idea into an editable email campaign.',
)
const welcomeCopy = computed(() => {
  if (!setupEntry.value) {
    return 'I’ll check your setup, explain what’s missing, and prepare a draft. You control the content, timing, and send — I won’t send anything.'
  }
  if (setupEntryKind() === 'checkout') {
    return 'Your plan is live. I’ll explain what matters, take you to the right pages, and keep track as you go — you make every change. I never save, publish, or send anything.'
  }
  return 'I’ll show you around, explain what matters, and take you to the right pages — you make every change. I never save, publish, or send anything.'
})
let micPermissionTracked = false

// ── Live (hands-free) conversation ───────────────────────────────────────────
const liveActive = ref(false)
let loopToken = 0
let autoStarted = false
// True when the cold-load greeting couldn't play (browser blocked autoplay until
// a user gesture). Flips the focal mic into an explicit "Tap to start" that speaks
// the greeting aloud on the first tap — so it works on a fresh load / shared link.
const audioBlocked = ref(false)
let greetProbe: ReturnType<typeof setTimeout> | null = null
// When autoplay is blocked, the first interaction anywhere on the screen speaks
// the greeting — so it plays on every fresh load without hunting for the mic.
let gestureGreetCleanup: (() => void) | null = null
// Greeting prefetch handle — the speak paths await this (capped) so an immediate
// auto-greet doesn't race its own cache seed and needlessly stream the greeting.
let greetingPrefetch: Promise<void> | null = null
const greetingReady = () =>
  Promise.race([greetingPrefetch ?? Promise.resolve(), new Promise<void>((r) => setTimeout(r, 600))])
// Grant re-probe: some browsers permit autoplay without any gesture (enterprise
// AutoplayAllowlist, --autoplay-policy flag, Safari per-site Auto-Play, Chrome MEI).
// While blocked, poll for that grant and greet the moment audio is allowed — zero tap.
let grantProbeCleanup: (() => void) | null = null
// Personalized greeting — spoken aloud on open, and captioned on screen.
// Keep in sync with scripts/bake-greeting.mjs (the baked WAV is keyed by this exact text).
const greetingText = computed(() => `Hi ${profile.firstName} — welcome to Maropost. I'm Da Vinci, your guide.`)
// Diagnostic overlay: append ?debug=1 to the URL to see voices / chosen voice
// (local vs REMOTE) / last TTS lifecycle event / speaking state on the page itself.
const showDebug = computed(() => route.query.debug === '1')
// Short microcopy under the central mic — invites at rest, mirrors state when busy/live.
const stageHint = computed(() => {
  if (liveActive.value) {
    switch (voice.state.value) {
      case 'listening':
        return voice.interimTranscript.value || 'Listening…'
      case 'thinking':
        return 'Thinking…'
      case 'speaking':
        return captionText.value || 'Speaking…'
      default:
        return 'Starting…'
    }
  }
  if (voice.state.value === 'thinking') return 'Thinking…'
  if (voice.state.value === 'speaking') return captionText.value || 'Speaking…'
  if (audioBlocked.value) return 'Click anywhere to begin'
  return voice.sttSupported ? 'Tap to talk' : 'Type below to begin'
})

function makeId(prefix = 'x') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function scrollThread() {
  nextTick(() => {
    threadEl.value?.scrollTo({ top: threadEl.value.scrollHeight, behavior: 'smooth' })
  })
}

type ExperienceResponse = CampaignOnboardingResponse | DvIntentResult | SetupOnboardingResponse

function componentDataFor(response: ExperienceResponse) {
  const components: ChatMessage['componentData'] = []
  const cards = 'cards' in response ? response.cards ?? [] : []
  if (cards.length || response.quickReplies?.length) {
    components.push({
      type: 'intentCards',
      props: { cards, quickReplies: response.quickReplies },
    })
  }
  if ('onboardingCard' in response && response.onboardingCard) {
    components.push({
      type: 'campaignOnboarding',
      props: response.onboardingCard,
    })
  }
  if ('setupCard' in response && response.setupCard) {
    components.push({
      type: 'setupOnboarding',
      props: response.setupCard,
    })
  }
  return components.length ? components : undefined
}

function appendAssistantResponse(response: ExperienceResponse) {
  messages.value.push({
    id: makeId('a'),
    role: 'assistant',
    text: response.reply,
    componentData: componentDataFor(response),
    toolSteps: 'steps' in response ? response.steps : undefined,
  })
  chatMode.value = true
  if ('onboardingCard' in response && response.onboardingCard) {
    const blockers = response.onboardingCard.items?.filter((item) => item.status !== 'ready').length ?? 0
    trackDaVinciOnboardingEvent('readiness_shown', accountId.value, { blockers })
  }
  scrollThread()
}

function intentCardsFor(message: ChatMessage): IntentCardsProps | null {
  const component = message.componentData?.find((item) => item.type === 'intentCards')
  return component ? component.props as IntentCardsProps : null
}

function onboardingCardFor(message: ChatMessage): CampaignOnboardingProps | null {
  const component = message.componentData?.find((item) => item.type === 'campaignOnboarding')
  return component ? component.props as CampaignOnboardingProps : null
}

function setupCardFor(message: ChatMessage): SetupOnboardingProps | null {
  const component = message.componentData?.find((item) => item.type === 'setupOnboarding')
  return component ? component.props as SetupOnboardingProps : null
}

/** Generate + render a reply; speak it (awaiting in live mode so the loop waits for TTS). */
async function respond(text: string, { awaitSpeech = false } = {}) {
  messages.value.push({ id: makeId('u'), role: 'user', text })
  chatMode.value = true
  inputText.value = ''
  scrollThread()

  voice.setThinking(true)
  // Recent turns give Gemini context for open-ended questions (exclude the just-pushed
  // current turn — the server appends it). Deterministic flows ignore it.
  const history = messages.value.slice(0, -1).slice(-6).map((m) => ({ role: m.role, text: m.text }))
  // Small pacing floor so a cached/canned reply doesn't pop in jarringly. Trimmed from
  // ~620-1040ms → ~200-400ms: real TTS latency now supplies the "processing" beat, and
  // for LLM turns this runs concurrently with the (slower) brain call anyway.
  const minDelay = new Promise<void>((r) => setTimeout(r, 200 + Math.random() * 200))
  // Routing precedence (kept identical to the drawer): guided setup → campaign
  // wizard → the normal assistant (Gemini for open questions).
  const setupResponse = setupEntry.value && setupStore.isActive ? setupOnboarding.handleText(text) : null
  const onboardingResponse = setupResponse
    ? null
    : campaignEntry.value && onboarding.isActive
      ? campaignOnboarding.handleText(text)
      : null
  // Either flow pauses itself for off-topic questions; acknowledge the switch once,
  // then let the normal assistant answer the actual question.
  const pauseNotice = setupResponse || onboardingResponse
    ? null
    : setupOnboarding.consumePauseNotice() ?? campaignOnboarding.consumePauseNotice()
  const res = setupResponse ?? onboardingResponse ?? await intents.answer(text, { history })
  await minDelay
  voice.setThinking(false)
  if (pauseNotice) appendAssistantResponse(pauseNotice)
  appendAssistantResponse(res)
  const speech = res.speech ?? res.reply
  captionText.value = speech
  if ('exitToDashboard' in res && res.exitToDashboard) {
    exitSetupToDashboard()
    return
  }
  if (awaitSpeech) await voice.speak(speech)
  else void voice.speak(speech)
}

/** Typed / quick-reply turn. In live mode it interjects, then resumes the listen loop. */
function sendText(raw: string) {
  voice.unlockSpeech() // prime TTS + mic within the gesture (Safari/iOS autoplay)
  const text = raw.trim()
  if (!text) return
  if (liveActive.value) {
    loopToken++ // supersede the in-flight listen so its continuation bails
    voice.abortListening()
    void (async () => {
      await respond(text, { awaitSpeech: true })
      if (liveActive.value) void armListening()
    })()
  } else {
    if (busy.value) return
    void respond(text)
  }
}

function onSend() {
  sendText(inputText.value)
}

function onQuickReply(value: string) {
  sendText(value)
}

function prepareOnboardingSession() {
  if (setupEntry.value) setupStore.begin(accountId.value, { entry: setupEntryKind() })
  else onboarding.begin(accountId.value)
  copilot.beginOnboarding(accountId.value)
}

/** First flow turn — guided setup on the primary arrival, campaign wizard on back-compat links. */
function startFlowResponse(inputMode: DaVinciInputMode): ExperienceResponse {
  return setupEntry.value
    ? setupOnboarding.start(accountId.value, inputMode, { entry: setupEntryKind() })
    : campaignOnboarding.start(accountId.value, inputMode)
}

/** Greets the user by name before the first question, on both the voice and text paths. */
function appendGreeting() {
  const greeting = greetingText.value
  appendAssistantResponse({ intent: 'fallback', reply: greeting, speech: greeting, cards: [] })
  return greeting
}

function continueByTyping() {
  prepareOnboardingSession()
  endLive()
  copilot.setReadAloud(false)
  trackDaVinciOnboardingEvent('onboarding_started', accountId.value, { inputMode: 'text' })
  trackDaVinciOnboardingEvent('input_mode_selected', accountId.value, { inputMode: 'text' })
  appendGreeting()
  const response = startFlowResponse('text')
  appendAssistantResponse(response)
  nextTick(() => {
    document.querySelector<HTMLInputElement>('.dvx__input')?.focus()
  })
}

async function enableVoiceOnboarding() {
  prepareOnboardingSession()
  voiceRecoveryMessage.value = ''
  copilot.setReadAloud(true)
  trackDaVinciOnboardingEvent('onboarding_started', accountId.value, { inputMode: 'voice' })
  trackDaVinciOnboardingEvent('input_mode_selected', accountId.value, { inputMode: 'voice' })
  trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: 'requested' })
  voice.setMuted(false)
  voice.unlockSpeech()
  // Greet by name first, then ask the first question — each captioned as it is spoken.
  const greeting = appendGreeting()
  captionText.value = greeting
  await voice.playChime('open')
  await voice.speak(greeting)
  const response = startFlowResponse('voice')
  appendAssistantResponse(response)
  captionText.value = response.speech ?? response.reply
  await voice.speak(response.speech ?? response.reply)
  if (!voice.sttSupported) return
  liveActive.value = true
  void armListening()
}

// Hide the starter chips on blur, but after a beat so a chip tap still registers.
function onInputBlur() {
  setTimeout(() => {
    inputFocused.value = false
  }, 150)
}

function reportVoiceError(err: unknown) {
  if (!(err instanceof VoiceError)) return
  if (err.code === 'permission') {
    trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: 'denied' })
    trackDaVinciOnboardingEvent('voice_recovery', accountId.value, { reason: 'permission' })
    voiceRecoveryMessage.value = 'Microphone access is blocked. Allow it in browser settings, or continue by typing.'
    pushToast({ title: 'Microphone blocked', sub: 'Allow microphone access in your browser settings' })
  } else if (err.code === 'network') {
    trackDaVinciOnboardingEvent('voice_recovery', accountId.value, { reason: 'network' })
    voiceRecoveryMessage.value = 'Voice is unavailable right now. Check your connection, or continue by typing.'
    pushToast({ title: 'Voice service unavailable', sub: 'Check your connection — you can type instead' })
  } else if (err.code === 'audio') {
    trackDaVinciOnboardingEvent('voice_recovery', accountId.value, { reason: 'no-microphone' })
    voiceRecoveryMessage.value = 'No microphone was found. Connect one, or continue by typing.'
    pushToast({ title: 'No microphone found' })
  }
}

/** One listen → respond turn, then re-arm — the continuous hands-free loop.
 *  `silent` suppresses the error toast for the first auto-start arm, where a
 *  cold-load mic may be blocked by the browser until the user interacts. */
async function armListening(silent = false) {
  if (!liveActive.value) return
  const myToken = ++loopToken
  let text = ''
  try {
    text = await voice.startListening({ owner: 'experience', withAnalyser: true })
    if (!micPermissionTracked) {
      micPermissionTracked = true
      trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: 'allowed' })
    }
  } catch (err) {
    if (!silent) reportVoiceError(err)
    endLive()
    return
  }
  if (myToken !== loopToken || !liveActive.value) return // superseded by a typed turn / ended
  if (!text) {
    // Silence never ends hands-free — keep listening until the user explicitly
    // ends the conversation (End button / Esc / leaving the page).
    void armListening()
    return
  }
  await respond(text, { awaitSpeech: true })
  if (myToken === loopToken && liveActive.value) void armListening()
}

/** Tap to begin a hands-free conversation. */
function startLive() {
  voice.unlockSpeech() // mic permission + iOS audio unlock happen inside the tap
  if (liveActive.value) return
  voiceRecoveryMessage.value = ''
  liveActive.value = true
  void armListening()
}

function endLive() {
  const wasLive = liveActive.value
  liveActive.value = false
  loopToken++ // any in-flight listen continuation bails
  voice.abortListening()
  voice.cancelSpeech()
  voice.setThinking(false)
  if (wasLive) void voice.playChime('close') // comm channel signs off
}

/** Primary live control: interrupt while speaking, otherwise end the conversation. */
function onLiveControl() {
  if (voice.state.value === 'speaking') voice.cancelSpeech() // → awaited speak resolves → loop re-listens
  else endLive()
}

/** After the greeting finishes speaking, drop into the hands-free listen loop. */
function listenAfterGreeting() {
  if (voice.sttSupported && !liveActive.value && messages.value.length === 0) {
    liveActive.value = true
    void armListening(true) // silent: no toast if the mic arm is blocked
  }
}

/**
 * On open: speak the greeting aloud, then auto-connect the mic (hands-free).
 * Best-effort — browsers block audio without a user gesture, so a cold refresh /
 * shared link stays silent; opening Da Vinci from inside the app carries the
 * gesture and auto-starts. We probe whether audio actually began: if it didn't,
 * we cancel the silent (blocked) utterance and flip to an explicit "Tap to start"
 * (see audioBlocked) so the first tap greets the user out loud.
 */
async function autoGreet() {
  if (autoStarted) return
  autoStarted = true
  if (voice.muted.value) return // respect "Voice off"
  voice.unlockSpeech()
  await greetingReady() // let the pre-baked WAV land so the speak is a cache hit
  await voice.playChime('open') // comm channel connects (no-op while autoplay is blocked)
  let becameAudible = false
  voice.speak(greetingText.value, {
    onAudible: () => {
      becameAudible = true
    },
    onend: () => {
      if (becameAudible) listenAfterGreeting() // only auto-listen if the greeting truly played
    },
  })
  // If audio never actually began (onAudible / real utterance.onstart), the browser
  // blocked autoplay. Trust becameAudible, NOT speechSynthesis.speaking — Chrome can
  // report speaking===true with no sound. The in-composable watchdog has already
  // retried once by now, so a still-silent greeting means a genuine block: stop the
  // dead utterance and surface tap-to-start. Window is generous so a slow-but-real
  // Chrome onset (after the voices gate + retry) isn't cut off.
  greetProbe = setTimeout(() => {
    greetProbe = null
    if (!becameAudible && !liveActive.value && messages.value.length === 0) {
      voice.cancelSpeech()
      // The tap-to-start affordance is the focal mic — only offer it where the mic
      // is actually tappable (STT-capable browsers, i.e. Chrome/Edge).
      if (voice.sttSupported) audioBlocked.value = true
      // Also let the first interaction *anywhere* speak the greeting, so it plays
      // on every fresh load without the user having to find the mic.
      armGestureGreeting()
      // And keep probing for a no-gesture autoplay grant (policy/flag/Safari
      // setting/MEI) — the moment audio is permitted, greet with zero tap.
      armGrantReprobe()
    }
  }, 2400) // headroom for the voices gate (≤700ms) + one watchdog retry (450ms) before giving up
}

/** While blocked, watch for a later autoplay grant and auto-greet the moment audio is
 *  permitted — never gives up: probes every 1s for the first ~30s, then every 3s, until
 *  a conversation starts or the view unmounts. Skips while the user is typing (composer
 *  focused) — the send flow owns that path. */
function armGrantReprobe() {
  if (grantProbeCleanup) return
  let fired = false
  let tries = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  const atRest = () =>
    !liveActive.value && messages.value.length === 0 && !voice.muted.value && voice.state.value === 'idle'
  const composerFocused = () => !!(document.activeElement as HTMLElement | null)?.closest('.dvx__composer')
  const fire = () => {
    if (fired || !atRest() || composerFocused()) return
    fired = true
    void startGreeting() // disarms this probe + the gesture listener internally
  }
  const check = async () => {
    if (fired) return
    if (!atRest()) {
      disarmGrantReprobe()
      return
    }
    if (await voice.tryUnlockAudio()) fire()
  }
  const schedule = () => {
    timer = setTimeout(async () => {
      await check()
      if (grantProbeCleanup && !fired) schedule() // keep probing; back off after ~30s
    }, ++tries <= 30 ? 1000 : 3000)
  }
  const offUnlock = voice.onAudioUnlocked(fire) // Chrome resolves a queued resume() on grant
  const onVis = () => void check()
  document.addEventListener('visibilitychange', onVis)
  grantProbeCleanup = () => {
    if (timer) clearTimeout(timer)
    timer = null
    offUnlock()
    document.removeEventListener('visibilitychange', onVis)
    grantProbeCleanup = null
  }
  void check() // immediate first probe — a policy-granted browser greets right away
  schedule()
}

function disarmGrantReprobe() {
  grantProbeCleanup?.()
}

/** Arm a one-shot listener: the first gesture anywhere (except typing in the
 *  composer or tapping the mic, which have their own flows) speaks the greeting. */
function armGestureGreeting() {
  if (gestureGreetCleanup) return
  const handler = (e: Event) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('.dvx__composer, .dvx__centermic')) return // let typing / mic do their thing
    if (liveActive.value || messages.value.length > 0 || voice.muted.value) {
      disarmGestureGreeting()
      return
    }
    void startGreeting() // disarms internally + speaks within this gesture
  }
  document.addEventListener('pointerdown', handler, true)
  document.addEventListener('keydown', handler, true)
  gestureGreetCleanup = () => {
    document.removeEventListener('pointerdown', handler, true)
    document.removeEventListener('keydown', handler, true)
    gestureGreetCleanup = null
  }
}

function disarmGestureGreeting() {
  gestureGreetCleanup?.()
}

/** Start the greeting (gesture-driven or grant-driven): speak it, then listen. */
async function startGreeting() {
  disarmGestureGreeting()
  disarmGrantReprobe() // one greeting only — a racing grant/statechange must not re-fire it
  audioBlocked.value = false
  voice.unlockSpeech() // synchronously within the gesture, before any await
  await greetingReady() // cache-hit the pre-baked WAV instead of streaming
  await voice.playChime('open') // comm channel connects
  void voice.speak(greetingText.value, { onend: listenAfterGreeting })
}

/** Focal mic tap. While live it interrupts/ends; at rest it either greets-then-listens
 *  (when the cold-load greeting was blocked) or starts the live conversation. */
function onCenterMic() {
  if (liveActive.value) {
    onLiveControl()
  } else if (audioBlocked.value) {
    void startGreeting()
  } else {
    startLive()
  }
}

function appendAndSpeak(response: ExperienceResponse) {
  appendAssistantResponse(response)
  if (copilot.readAloud) {
    captionText.value = response.speech ?? response.reply
    void voice.speak(response.speech ?? response.reply)
  }
}

/** "Just explore" — leave the conversation, keep Da Vinci reachable from the drawer. */
function exitSetupToDashboard() {
  endLive()
  copilot.queueResume('I’m here if you need me — the Get Started guide in the sidebar has your full setup list.')
  copilot.setWidthMode('panel')
  copilot.open()
  void router.push({ name: 'Dashboard', params: { accountId: accountId.value } })
}

/** Guided-setup deep link: queue the follow-up, open the drawer, then navigate —
 *  the drawer survives the route change and speaks the queued line on arrival. */
function openSetupRoute(routeName: string, action: string) {
  endLive()
  const followText = action.startsWith('open-task:')
    ? setupHandoffFollowText(setupOnboarding.currentTask.value)
    : 'I’m here whenever you need me — pick any task from the guide and I’ll follow along.'
  copilot.queueResume(followText)
  copilot.setWidthMode('panel')
  copilot.open()
  void router.push({ name: routeName, params: { accountId: accountId.value }, query: { source: 'davinci' } })
}

function onSetupAction(action: string) {
  if (action.startsWith('open-task:') || action === 'view-all-tasks' || action === 'explore-dashboard') {
    const routeName = setupOnboarding.markHandoff(action)
    if (routeName) openSetupRoute(routeName, action)
    return
  }
  const response = setupOnboarding.handleAction(action)
  if (response) {
    appendAndSpeak(response)
    if (response.exitToDashboard) exitSetupToDashboard()
  }
}

function openProductRoute(routeName: string) {
  endLive()
  onboarding.setLastRoute(routeName)
  trackDaVinciOnboardingEvent('prerequisite_opened', accountId.value, { routeName })
  copilot.queueResume('I’m still with you. Complete this step, then return here and I’ll check your campaign readiness again.')
  copilot.setWidthMode('panel')
  copilot.open()
  void router.push({ name: routeName, params: { accountId: accountId.value }, query: { source: 'davinci' } })
}

function reviewDraft(draftId: number) {
  endLive()
  onboarding.markHandoff()
  trackDaVinciOnboardingEvent('draft_opened', accountId.value, { draftId })
  copilot.queueResume(
    'Your draft is open. I filled the details we agreed on. You still control content, timing, and send. Nothing has been sent.',
  )
  copilot.setWidthMode('panel')
  copilot.open()
  void router.push({
    name: 'CreateCampaign',
    params: { accountId: accountId.value },
    query: { id: String(draftId), source: 'davinci' },
  })
}

function onOnboardingAction(action: string) {
  if (action === 'continue-draft') {
    const response = campaignOnboarding.createDraft()
    appendAndSpeak(response)
    const card = response.cards?.find((item) => item.type === 'campaign')
    if (card?.type === 'campaign' && card.props.draftId) {
      trackDaVinciOnboardingEvent('draft_created', accountId.value, { draftId: card.props.draftId })
    }
    return
  }
  if (action === 'change-brief') {
    trackDaVinciOnboardingEvent('brief_corrected', accountId.value)
    appendAndSpeak(campaignOnboarding.changeBrief())
    return
  }
  if (action.startsWith('open-')) {
    const routeName = campaignOnboarding.routeForAction(action)
    if (routeName) openProductRoute(routeName)
  }
}

function onCardAction(payload: { card: DvCardDescriptor; action: string }) {
  if (payload.card.type === 'campaign') {
    if (payload.action === 'review-draft') {
      if (payload.card.props.draftId) {
        reviewDraft(payload.card.props.draftId)
        return
      }
      // A campaign card with no draft id can only come from a restored snapshot
      // predating the real-draft flow. Create the draft instead of reporting a
      // success that never happened.
      const draft = campaignOnboarding.createDraft()
      const draftId = draft.cards?.find((card) => card.type === 'campaign')?.props.draftId
      if (draftId) reviewDraft(draftId)
      else appendAndSpeak(draft)
      return
    }
    if (payload.action === 'change-brief') {
      trackDaVinciOnboardingEvent('brief_corrected', accountId.value)
      appendAndSpeak(campaignOnboarding.changeBrief())
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

function newChat() {
  endLive()
  intents.reset()
  copilot.resetConversation()
  if (setupEntry.value) {
    setupStore.reset(accountId.value)
    setupStore.begin(accountId.value, { restart: true, entry: setupEntryKind() })
    copilot.beginOnboarding(accountId.value)
  } else if (campaignEntry.value) {
    onboarding.reset(accountId.value)
    onboarding.begin(accountId.value, { restart: true })
    copilot.beginOnboarding(accountId.value)
  }
  inputText.value = ''
  captionText.value = ''
  audioBlocked.value = false // user has interacted by now — audio is unlocked
  pushToast({ title: 'New chat started' })
}

function openClassicUI() {
  router.push({ name: 'DaVinciCopilot', params: { accountId: accountId.value } })
}

function exitExperience() {
  router.push({ name: 'DaVinciAI', params: { accountId: accountId.value } })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') exitExperience()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  // Seed the greeting audio from the pre-baked static WAV so it plays INSTANTLY in
  // the natural Gemini voice on the first gesture (no ~5s synth wait). Falls back to
  // browser TTS if the asset is missing. The speak paths await this handle (capped).
  // The WAV was baked for the demo user's exact greeting (scripts/bake-greeting.mjs) —
  // seeding it under any other name's text would greet fresh signups as "Ross".
  const bakedGreeting = "Hi Ross — welcome to Maropost. I'm Da Vinci, your guide."
  greetingPrefetch = voice.prefetchSpeech(
    greetingText.value,
    greetingText.value === bakedGreeting ? '/davinci/greeting.wav' : undefined,
  )
  // Warm the HTTP cache for the session earcons (decode happens on first playChime).
  void fetch('/davinci/chime-open.wav').catch(() => {})
  void fetch('/davinci/chime-close.wav').catch(() => {})
  // Seed every pre-baked canned reply line (scripts/bake-lines.mjs) the same way, so
  // deterministic replies speak instantly too. Missing manifest ⇒ lines just stream.
  void (async () => {
    try {
      const resp = await fetch('/davinci/lines/manifest.json')
      if (!resp.ok) return
      const entries = (await resp.json()) as Array<{ text: string; file: string }>
      for (const entry of entries) void voice.prefetchSpeech(entry.text, `/davinci/lines/${entry.file}`)
    } catch {
      /* optional asset — canned lines fall back to streaming synth */
    }
  })()
  if (route.query.onboarding === 'setup') {
    // Guided setup arrival — the primary post-signup / post-checkout flow.
    trackDaVinciOnboardingEvent('onboarding_viewed', accountId.value)
    const session = setupStore.begin(accountId.value, { entry: setupEntryKind() })
    copilot.beginOnboarding(accountId.value)
    // Voice-first signup handoff: the mic was already granted and audio unlocked
    // in this document, so skip the welcome screen and start speaking.
    // If the unlock probe fails we fall through to the normal welcome — never a dead end.
    if (route.query.voice === 'granted' && voice.sttSupported && session.stage === 'welcome') {
      voiceHandoff.value = true
      void (async () => {
        if (await voice.tryUnlockAudio()) void enableVoiceOnboarding()
        else voiceHandoff.value = false // autoplay still blocked → normal welcome, never a dead end
      })()
      return
    }
    if (session.stage !== 'welcome' && messages.value.length === 0) {
      trackDaVinciOnboardingEvent('onboarding_resumed', accountId.value, { stage: session.stage })
      appendAssistantResponse(setupOnboarding.resume())
    }
  } else if (route.query.onboarding === 'campaign') {
    // Back-compat: pre-guided-setup links still open the campaign wizard.
    trackDaVinciOnboardingEvent('onboarding_viewed', accountId.value)
    const session = onboarding.begin(accountId.value)
    copilot.beginOnboarding(accountId.value)
    if (route.query.voice === 'granted' && voice.sttSupported && session.stage === 'welcome') {
      voiceHandoff.value = true
      void (async () => {
        if (await voice.tryUnlockAudio()) void enableVoiceOnboarding()
        else voiceHandoff.value = false // autoplay still blocked → normal welcome, never a dead end
      })()
      return
    }
    if (session.stage !== 'welcome' && session.stage !== 'consent' && messages.value.length === 0) {
      trackDaVinciOnboardingEvent('onboarding_resumed', accountId.value, { stage: session.stage })
      const response = campaignOnboarding.resume()
      if (response) appendAssistantResponse(response)
    }
  } else {
    void autoGreet() // Returning/general experience keeps the existing hands-free entry.
  }
})

// A product hook verified the current setup task while this surface is open
// (e.g. the user finished it in another tab) — congratulate and advance in place.
watch(
  () => {
    const taskId = setupStore.activeSession?.currentTaskId
    return taskId ? setupGuide.completed[taskId] === true : false
  },
  (done) => {
    if (!done || !setupStore.isActive || setupStore.activeAccountId !== accountId.value) return
    const taskId = setupStore.activeSession?.currentTaskId
    if (!taskId) return
    const response = setupOnboarding.onTaskAutoCompleted(taskId)
    if (response) appendAndSpeak(response)
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (greetProbe) clearTimeout(greetProbe)
  disarmGestureGreeting()
  disarmGrantReprobe()
  liveActive.value = false
  loopToken++
  voice.disposeVoice()
})
</script>

<template>
  <div class="dvx" :data-orb-state="voice.state.value" :data-live="liveActive">
    <!-- Diagnostic overlay (append ?debug=1) — voice path visibility without DevTools -->
    <div v-if="showDebug" class="dvx__debug">
      <div><strong>Da Vinci voice debug</strong></div>
      <div>state: {{ voice.state.value }}<span v-if="voice.muted.value"> · muted</span></div>
      <div>voices: {{ voice.voiceDebug.value.voices }}</div>
      <div>chosen: {{ voice.voiceDebug.value.chosen }}</div>
      <div>last event: {{ voice.voiceDebug.value.lastEvent }}</div>
      <div>audioBlocked: {{ audioBlocked }}</div>
    </div>

    <!-- Orb backdrop -->
    <div class="dvx__backdrop">
      <DvOrbCanvas :state="voice.state.value" :audio-source="voice.getVoiceFrame" class="dvx__orb" />
    </div>

    <!-- Luminous light pools the diffusion field refracts (same as signup) -->
    <div class="dv-aura" aria-hidden="true">
      <div class="dv-aura__blob dv-aura__blob--violet"></div>
      <div class="dv-aura__blob dv-aura__blob--blue"></div>
      <div class="dv-aura__blob dv-aura__blob--cyan"></div>
    </div>

    <!-- Top bar -->
    <header class="dvx__topbar">
      <div class="dvx__wordmark">
        <DvOrbitOrb class="dvx__avatar" :size="30" :speed="avatarSpeed" />
        <span>Da Vinci</span>
      </div>
      <div class="dvx__top-actions">
        <v-btn
          v-if="hasThread"
          variant="outlined"
          size="small"
          rounded="pill"
          prepend-icon="plus"
          aria-label="Start a new chat"
          class="dvx__ghost-btn"
          @click="newChat"
        >
          <span class="dvx__btn-label">New chat</span>
        </v-btn>
        <v-btn
          variant="outlined"
          size="small"
          rounded="pill"
          :prepend-icon="voice.muted.value ? 'volume-x' : 'volume-2'"
          :aria-label="voice.muted.value ? 'Turn voice on' : 'Turn voice off'"
          class="dvx__ghost-btn"
          @click="voice.setMuted(!voice.muted.value)"
        >
          <span class="dvx__btn-label">{{ voice.muted.value ? 'Voice off' : 'Voice on' }}</span>
        </v-btn>
        <v-btn
          variant="outlined"
          size="small"
          rounded="pill"
          prepend-icon="panel-left"
          aria-label="Open classic Da Vinci interface"
          class="dvx__ghost-btn"
          @click="openClassicUI"
        >
          <span class="dvx__btn-label">Classic UI</span>
        </v-btn>
        <v-btn icon size="small" variant="text" aria-label="Exit AI experience" @click="exitExperience">
          <v-icon size="18">x</v-icon>
          <v-tooltip activator="parent" location="bottom">Exit AI experience</v-tooltip>
        </v-btn>
      </div>
    </header>

    <!-- Centered content over the orb -->
    <main class="dvx__center" :class="{ 'dvx__center--thread': hasThread }">
      <section v-if="welcomeVisible" class="dvx__welcome dv-glass-field" aria-labelledby="dvx-welcome-title">
        <div class="dvx__welcome-eyebrow">
          <v-icon size="16">sparkles</v-icon>
          {{ welcomeEyebrow }}
        </div>
        <h1 id="dvx-welcome-title" class="dvx__welcome-title">
          {{ welcomeTitle }}
        </h1>
        <p class="dvx__welcome-copy">
          {{ welcomeCopy }}
        </p>

        <div class="d-flex flex-wrap ga-3">
          <v-btn
            variant="flat"
            size="large"
            prepend-icon="mic"
            class="dvx__welcome-primary"
            :disabled="!voice.sttSupported"
            @click="enableVoiceOnboarding"
          >
            Start with voice
          </v-btn>
          <v-btn variant="outlined" size="large" prepend-icon="keyboard" @click="continueByTyping">
            Continue by typing
          </v-btn>
        </div>

        <p v-if="!voice.sttSupported" class="text-caption text-medium-emphasis mt-3 mb-0">
          Voice input is unavailable in this browser. You can complete the same onboarding by typing.
        </p>

        <p v-if="voiceRecoveryMessage" class="text-caption text-error mt-4 mb-0" role="alert">
          {{ voiceRecoveryMessage }}
        </p>

        <p class="dvx__welcome-disclosure mt-3 mb-0">
          You’re chatting with an AI assistant. If you use voice, audio is processed by your browser’s
          speech service.
        </p>
      </section>

      <!-- Conversation thread -->
      <div v-if="!welcomeVisible && hasThread" class="dvx__thread-shell dv-glass-field">
        <section ref="threadEl" class="dvx__thread" aria-live="polite">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="dvx__turn"
          :class="msg.role === 'user' ? 'dvx__turn--user' : 'dvx__turn--ai'"
        >
          <span class="dvx__role">{{ msg.role === 'user' ? 'You' : 'Da Vinci' }}</span>
          <p class="dvx__msg">{{ msg.text }}</p>
          <DvIntentCardList
            v-if="intentCardsFor(msg)?.cards.length"
            :cards="intentCardsFor(msg)!.cards"
            class="dvx__cards"
            @action="onCardAction"
          />
          <DvCampaignOnboardingCard
            v-if="onboardingCardFor(msg)"
            v-bind="onboardingCardFor(msg)!"
            class="dvx__cards"
            @action="onOnboardingAction"
          />
          <DvSetupOnboardingCard
            v-if="setupCardFor(msg)"
            v-bind="setupCardFor(msg)!"
            class="dvx__cards"
            @action="onSetupAction"
          />
          <div v-if="intentCardsFor(msg)?.quickReplies?.length" class="dvx__quick">
            <button
              v-for="reply in intentCardsFor(msg)!.quickReplies"
              :key="reply.value"
              type="button"
              class="dvx__chip"
              @click="onQuickReply(reply.value)"
            >
              <v-icon v-if="reply.icon" size="16">{{ reply.icon }}</v-icon>
              {{ reply.label }}
            </button>
          </div>
        </div>
        </section>
      </div>

      <!-- Focal voice control — small mic centered in the orb -->
      <div v-if="!welcomeVisible" class="dvx__stage">
        <button
          type="button"
          class="dvx__centermic"
          :class="{
            'dvx__centermic--active': liveActive || busy,
            'dvx__centermic--invite': audioBlocked && !busy,
            'dvx__centermic--disabled': !voice.sttSupported,
          }"
          :disabled="!voice.sttSupported"
          :aria-label="
            liveActive
              ? voice.state.value === 'speaking'
                ? 'Interrupt'
                : 'End conversation'
              : audioBlocked
                ? 'Begin — greet me and start listening'
                : 'Start voice conversation'
          "
          @click="onCenterMic()"
        >
          <v-icon :size="26">{{ liveActive && voice.state.value === 'speaking' ? 'square' : 'mic' }}</v-icon>
          <v-tooltip v-if="!voice.sttSupported" activator="parent" location="top">
            Voice input needs Chrome or Edge — you can type below
          </v-tooltip>
        </button>
        <p class="dvx__hint" :class="{ 'dvx__hint--live': liveActive && voice.state.value === 'listening' }">
          {{ stageHint }}
        </p>
        <p v-if="voiceRecoveryMessage" class="text-caption text-error mb-0" role="alert">
          {{ voiceRecoveryMessage }}
        </p>
        <div v-if="liveActive" class="dvx__live-controls">
          <button v-if="voice.state.value === 'speaking'" type="button" class="dvx__live-btn" @click="voice.cancelSpeech()">
            <v-icon size="16">square</v-icon>
            Interrupt
          </button>
          <button type="button" class="dvx__live-btn dvx__live-btn--end" @click="endLive">
            <v-icon size="16">x</v-icon>
            End conversation
          </button>
        </div>
      </div>

      <!-- Text composer (secondary) — type any time -->
      <div v-if="!welcomeVisible" class="dvx__composer">
        <form class="dvx__inputrow" @submit.prevent="onSend">
          <input
            v-model="inputText"
            type="text"
            placeholder="Message Da Vinci…"
            aria-label="Message Da Vinci"
            class="dvx__input"
            @focus="inputFocused = true"
            @blur="onInputBlur"
          />
          <button
            type="submit"
            class="dvx__iconbtn dvx__iconbtn--send"
            aria-label="Send"
            :disabled="!inputText.trim() || (!liveActive && busy)"
          >
            <v-icon size="18">arrow-up</v-icon>
            <v-tooltip activator="parent" location="top">Send</v-tooltip>
          </button>
        </form>

        <!-- Starter suggestion chips — revealed only while the text field is focused -->
        <div v-if="inputFocused && !hasThread && !liveActive" class="dvx__chips">
          <button
            v-for="chip in intents.suggestionChips"
            :key="chip.value"
            type="button"
            class="dvx__chip"
            @click="onQuickReply(chip.value)"
          >
            <v-icon v-if="chip.icon" size="16">{{ chip.icon }}</v-icon>
            {{ chip.label }}
          </button>
        </div>
      </div>
    </main>

    <DvToastStack />
  </div>
</template>

<style scoped>
/* Diagnostic overlay (?debug=1) — intentionally plain; never shipped to users.
   WP-F3 z-index hygiene: must stay visible above modals/dialogs while
   debugging their state, so it shares the toast tier (the only documented
   layer above Vuetify's own modal z-index) rather than an undocumented
   literal — reference-only per tokens.json, this is a hand-rolled overlay. */
.dvx__debug {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: var(--mp-zIndex-toast);
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.82);
  color: #d6fcd6;
  font: 12px/1.5 ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace;
  pointer-events: none;
  white-space: nowrap;
}

.dvx {
  /* prototype micro-label character without shipping a new font */
  --dvx-mono: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace;
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--dv-experience-bg);
  color: rgb(var(--v-theme-on-surface));
}

.dvx__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.dvx__orb {
  width: 100%;
  height: 100%;
}

/* ─── Top bar ─────────────────────────────────────────────────────────── */
.dvx__topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(22px, 4vw, 48px);
  min-height: 72px;
}

.dvx__wordmark {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  font-weight: var(--mp-fontWeight-heavy);
  font-size: var(--mp-fontSize-16);
  letter-spacing: 0.01em;
  user-select: none;
}

.dvx__avatar {
  flex-shrink: 0;
}

.dvx__top-actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
}

/* prototype ghost buttons — white pill, hairline border, quiet ink */
.dvx__top-actions .dvx__ghost-btn {
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: 0;
  transition:
    border-color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.dvx__top-actions .dvx__ghost-btn:hover {
  border-color: var(--dv-text-secondary);
}

.dvx__top-actions .dvx__ghost-btn:active {
  transform: scale(0.97);
}

/* ─── Center column ───────────────────────────────────────────────────── */
.dvx__center {
  position: relative;
  z-index: 1;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(18px, 3vh, 30px);
  padding: 96px 22px 30px;
}

.dvx__center--thread {
  justify-content: flex-end;
  padding-bottom: 34px;
}

/* ─── Thread (diffusion field over the orb) ───────────────────────────── */
/* Shell carries the diffusion field; the thread scrolls INSIDE it so the
   feathered pseudo-layers aren't clipped by an overflow container. */
.dvx__thread-shell {
  width: min(640px, 92vw);
  flex: 0 1 auto;
  min-height: 0;
  max-height: 52vh;
  display: flex;
}

.dvx__thread {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-24);
  padding: var(--mp-space-16) var(--mp-space-20);
  scrollbar-width: thin;
}

.dvx__turn {
  display: flex;
  flex-direction: column;
  gap: 7px;
  animation: dvx-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.dvx__turn--user {
  align-items: flex-end;
}

.dvx__role {
  font-family: var(--dvx-mono);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--dv-muted);
}

.dvx__turn--user .dvx__role {
  color: var(--dv-accent);
}

.dvx__msg {
  font-size: var(--mp-fontSize-14);
  line-height: 1.55;
  max-width: 90%;
  margin: 0;
}

.dvx__turn--user .dvx__msg {
  font-weight: var(--mp-fontWeight-medium);
  text-align: right;
  color: var(--dv-text-primary);
}

.dvx__cards {
  width: 100%;
  max-width: 430px;
  margin-top: var(--mp-space-4);
}

/* ─── First-run campaign welcome ─────────────────────────────────────── */
/* Sizing only — the frost comes from .dv-glass-field in src/styles/dv-diffusion.css */
.dvx__welcome {
  width: min(640px, 92vw);
  padding: clamp(28px, 4vw, 46px);
}

.dvx__welcome-eyebrow {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin-bottom: var(--mp-space-16);
  color: var(--dv-accent);
  font-weight: var(--mp-fontWeight-semibold);
}

.dvx__welcome-title {
  margin: 0;
  /* ink, not brand navy — matches the register (signup) typography on glass */
  color: var(--dv-ink);
  line-height: 1.12;
  font-size: clamp(var(--mp-fontSize-28), 5vw, var(--mp-display-md-fontSize));
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: var(--mp-letterSpacing-tight);
}

/* Ink capsule CTA — same treatment as the signup's primary button */
.dvx__welcome-primary {
  background: var(--dv-ink) !important;
  color: rgb(var(--v-theme-surface)) !important;
  border-radius: var(--mp-radius-8) !important;
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0;
}

.dvx__welcome-copy {
  margin: var(--mp-space-16) 0 var(--mp-space-24);
  color: var(--dv-text-secondary);
  font-size: var(--mp-fontSize-16);
  line-height: 1.6;
}

.dvx__welcome-disclosure {
  color: var(--dv-text-secondary);
  font-size: var(--mp-fontSize-11);
  line-height: 1.5;
  max-width: 46ch;
}

/* ─── Composer ────────────────────────────────────────────────────────── */
.dvx__composer {
  position: relative;
  width: min(560px, 92vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-16);
}

/* ─── Stage: focal mic centered in the orb ────────────────────────────────── */
.dvx__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-14);
  text-align: center;
}

/* Small mic — the primary "tap to talk" affordance, with a soft accent glow */
.dvx__centermic {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--dv-accent) 30%, var(--dv-border));
  background: rgb(var(--v-theme-surface));
  color: var(--dv-accent);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow:
    0 10px 30px -12px color-mix(in srgb, var(--dv-accent) 55%, transparent),
    0 2px 8px rgba(24, 27, 33, 0.06);
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s, background 0.2s, color 0.2s,
    border-color 0.2s;
}

.dvx__centermic:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 16px 38px -12px color-mix(in srgb, var(--dv-accent) 70%, transparent),
    0 2px 8px rgba(24, 27, 33, 0.08);
}

.dvx__centermic:active:not(:disabled) {
  transform: scale(0.96);
}

/* Active (live or busy): filled accent + pulsing ring */
.dvx__centermic--active {
  background: var(--dv-accent);
  color: var(--dv-on-accent);
  border-color: var(--dv-accent);
}

.dvx__centermic--active::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid var(--dv-accent);
  opacity: 0.5;
  animation: dvx-livepulse 1.6s ease-out infinite;
}

/* Invite (cold load, audio blocked): outlined mic with a gentle pulse ring to
   signal the first tap is needed before the greeting can play. */
.dvx__centermic--invite::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid var(--dv-accent);
  opacity: 0.5;
  animation: dvx-livepulse 1.8s ease-out infinite;
}

.dvx__centermic--disabled {
  cursor: default;
  opacity: 0.5;
  box-shadow: none;
}

/* Microcopy under the mic */
.dvx__hint {
  margin: 0;
  font-family: var(--dvx-mono);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dv-text-secondary);
  min-height: 14px;
  max-width: min(440px, 88vw);
  transition: color 0.3s;
}

/* When showing the live interim transcript, switch to readable sentence case */
.dvx__hint--live {
  font-family: inherit;
  font-size: var(--mp-fontSize-15);
  letter-spacing: 0;
  text-transform: none;
  color: var(--dv-text-primary);
  line-height: 1.5;
}

/* ─── Live conversation controls ──────────────────────────────────────────── */
.dvx__live-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  justify-content: center;
}

.dvx__live-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-family: var(--dvx-mono);
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
  border-radius: var(--mp-radius-full);
  padding: var(--mp-space-8) var(--mp-space-16);
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.dvx__live-btn:hover {
  border-color: var(--dv-text-primary);
  color: var(--dv-text-primary);
}

.dvx__live-btn:active {
  transform: scale(0.97);
}

.dvx__live-btn--end:hover {
  border-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-error));
}

@keyframes dvx-livepulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* ─── Input row ───────────────────────────────────────────────────────── */
.dvx__inputrow {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 40%, transparent);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid var(--dv-border);
  border-radius: var(--mp-radius-full);
  padding: var(--mp-space-6) var(--mp-space-6) var(--mp-space-6) var(--mp-space-20);
  box-shadow: 0 1px 2px rgba(24, 27, 33, 0.03), 0 18px 44px -28px rgba(24, 27, 33, 0.45);
  transition:
    border-color var(--dur-base) var(--ease),
    box-shadow var(--dur-base) var(--ease);
}

.dvx__inputrow:focus-within {
  border-color: var(--dv-accent);
  box-shadow: 0 1px 2px rgba(24, 27, 33, 0.03), 0 0 0 4px var(--dv-accent-soft);
}

.dvx__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: var(--mp-fontSize-16);
  /* explicit ink — theme-var indirection left typed text near-invisible on white */
  color: var(--dv-text-primary);
  caret-color: var(--dv-accent);
  padding: 9px 0;
}

.dvx__input::placeholder {
  color: var(--dv-text-secondary);
  opacity: 0.75;
}

.dvx__iconbtn {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition:
    background var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}

.dvx__iconbtn:active {
  transform: scale(0.94);
}

.dvx__iconbtn--send {
  background: var(--dv-accent);
  color: var(--dv-on-accent);
}

.dvx__iconbtn--send:disabled {
  /* neutral gray when empty (prototype #e7e8eb) — accent only when actionable */
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 8%, rgb(var(--v-theme-surface)));
  color: var(--dv-text-secondary);
  cursor: default;
  transform: none;
}

/* ─── Chips / quick replies ───────────────────────────────────────────── */
.dvx__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  justify-content: center;
}

.dvx__quick {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  margin-top: var(--mp-space-6);
}

.dvx__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  background: transparent;
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
  border-radius: var(--mp-radius-full);
  padding: var(--mp-space-8) var(--mp-space-14);
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

/* Quiet ghost hover — border firms to ink over a faint wash; no accent fill */
.dvx__chip:hover {
  border-color: var(--dv-text-primary);
  color: var(--dv-text-primary);
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 4%, transparent);
}

.dvx__chip:active {
  transform: scale(0.97);
}

@keyframes dvx-rise {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@media (max-width: 560px) {
  .dvx__welcome {
    padding: var(--mp-space-20);
  }

  .dvx__welcome .v-btn {
    width: 100%;
  }

  .dvx__thread-shell {
    max-height: 46vh;
  }

  /* Topbar fits 375px: keep the orb, drop the wordmark text, tighten the pills
     so all actions stay reachable instead of overflowing off-screen. */
  .dvx__topbar {
    padding: 0 var(--mp-space-12);
    min-height: var(--mp-layout-appbarHeight);
    gap: var(--mp-space-8);
  }

  .dvx__wordmark span {
    display: none;
  }

  .dvx__top-actions {
    gap: var(--mp-space-6);
    min-width: 0;
  }

  /* Icon-only pills on mobile so every action fits without overflow */
  .dvx__btn-label {
    display: none;
  }

  .dvx__top-actions .dvx__ghost-btn {
    min-width: 0;
    padding-inline: 9px;
  }

  .dvx__top-actions .dvx__ghost-btn :deep(.v-btn__prepend) {
    margin-inline: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dvx__turn,
  .dvx__centermic--active::after,
  .dvx__centermic--invite::after {
    animation: none;
  }
}

</style>
