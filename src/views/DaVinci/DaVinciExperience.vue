<script setup lang="ts">
// Da Vinci AI experience — native port of the "Marojarvis" voice-first prototype
// (formerly linked externally as https://davinci-ai-first.vercel.app).
// fullPage route: the app shell + copilot drawer are unmounted, so this view
// owns the mic exclusively and provides its own exits (Esc / Classic UI / close).
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DvOrbCanvas from '@/components/copilot/voice/DvOrbCanvas.vue'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
import DvIntentCardList from '@/components/copilot/voice/DvIntentCardList.vue'
import DvCampaignOnboardingCard from '@/components/copilot/DvCampaignOnboardingCard.vue'
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
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import {
  useCopilotStore,
  type CampaignOnboardingProps,
  type ChatMessage,
  type IntentCardsProps,
} from '@/stores/useCopilot'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'
import { useUserProfile } from '@/stores/useUserProfile'

const route = useRoute()
const router = useRouter()
const voice = useDaVinciVoice()
const intents = useDaVinciIntents()
const campaignOnboarding = useDaVinciCampaignOnboarding()
const { pushToast } = useDaVinciToasts()
const profile = useUserProfile()
const copilot = useCopilotStore()
const onboarding = useDaVinciOnboardingStore()
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
const pendingVoiceTranscript = ref('')
const originalVoiceTranscript = ref('')
const voiceConsentPromptVisible = ref(false)
const threadEl = ref<HTMLElement | null>(null)
const hasThread = computed(() => messages.value.length > 0)
const busy = computed(() => voice.state.value !== 'idle')
const avatarSpeed = computed(() => ({ idle: 1, listening: 2.4, thinking: 1.6, speaking: 1.4 })[voice.state.value])
const campaignEntry = computed(
  () => route.query.onboarding === 'campaign' || (onboarding.activeAccountId === accountId.value && onboarding.isActive),
)
const welcomeVisible = computed(() => {
  if (!campaignEntry.value) return false
  const stage = onboarding.activeSession?.stage
  return !stage || stage === 'welcome' || stage === 'choice' || stage === 'voice-consent'
})
const micEducationVisible = computed(() => onboarding.activeSession?.stage === 'voice-consent')
let micPermissionTracked = false

// ── Live (hands-free) conversation ───────────────────────────────────────────
const liveActive = ref(false)
let loopToken = 0
let autoStarted = false
let silentTurnCount = 0
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
        return voice.interimTranscript.value
          ? maskSensitiveTranscript(voice.interimTranscript.value)
          : 'Listening…'
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

function componentDataFor(response: CampaignOnboardingResponse | DvIntentResult) {
  const components: ChatMessage['componentData'] = []
  const cards = response.cards ?? []
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
  return components.length ? components : undefined
}

function appendAssistantResponse(response: CampaignOnboardingResponse | DvIntentResult) {
  messages.value.push({
    id: makeId('a'),
    role: 'assistant',
    text: response.reply,
    componentData: componentDataFor(response),
    toolSteps: 'steps' in response ? response.steps : undefined,
  })
  chatMode.value = true
  if ('onboardingCard' in response && response.onboardingCard?.kind === 'readiness') {
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
  const onboardingResponse = campaignEntry.value && onboarding.isActive ? campaignOnboarding.handleText(text) : null
  // The wizard pauses itself for off-topic questions; acknowledge the switch once,
  // then let the normal assistant answer the actual question.
  const pauseNotice = onboardingResponse ? null : campaignOnboarding.consumePauseNotice()
  const res = onboardingResponse ?? await intents.answer(text, { history })
  await minDelay
  voice.setThinking(false)
  if (pauseNotice) appendAssistantResponse(pauseNotice)
  appendAssistantResponse(res)
  const speech = res.speech ?? res.reply
  captionText.value = speech
  const shouldSpeak = liveActive.value || copilot.readAloud
  if (shouldSpeak && awaitSpeech) await voice.speak(speech)
  else if (shouldSpeak) void voice.speak(speech)
}

/** Typed / quick-reply turn. In live mode it interjects, then resumes the listen loop. */
function sendText(raw: string) {
  voice.unlockSpeech() // prime TTS + mic within the gesture (Safari/iOS autoplay)
  const text = raw.trim()
  if (!text) return
  silentTurnCount = 0
  pendingVoiceTranscript.value = ''
  originalVoiceTranscript.value = ''
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

function prepareCampaignSession() {
  onboarding.begin(accountId.value)
  copilot.beginOnboarding(accountId.value)
}

/** Greets the user by name before the first question, on both the voice and text paths. */
function appendGreeting() {
  const greeting = greetingText.value
  appendAssistantResponse({ intent: 'campaign', reply: greeting, speech: greeting })
  return greeting
}

function continueByTyping() {
  prepareCampaignSession()
  endLive()
  copilot.setReadAloud(false)
  trackDaVinciOnboardingEvent('onboarding_started', accountId.value, { inputMode: 'text' })
  trackDaVinciOnboardingEvent('input_mode_selected', accountId.value, { inputMode: 'text' })
  appendGreeting()
  const response = campaignOnboarding.start(accountId.value, 'text')
  appendAssistantResponse(response)
  nextTick(() => {
    document.querySelector<HTMLInputElement>('.dvx__input')?.focus()
  })
}

function explainVoiceAccess() {
  prepareCampaignSession()
  onboarding.setStage('voice-consent')
}

async function enableVoiceOnboarding() {
  prepareCampaignSession()
  const startingJourney = messages.value.length === 0
  voiceRecoveryMessage.value = ''
  voiceConsentPromptVisible.value = false
  if (startingJourney) {
    trackDaVinciOnboardingEvent('onboarding_started', accountId.value, { inputMode: 'voice' })
  }
  trackDaVinciOnboardingEvent('input_mode_selected', accountId.value, { inputMode: 'voice' })
  trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: 'requested' })
  try {
    await voice.requestMicrophonePermission()
    micPermissionTracked = true
    trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: 'allowed' })
  } catch (error) {
    reportVoiceError(error)
    switchToTextFallback(error instanceof VoiceError ? error.code : 'unknown', true)
    return
  }
  copilot.setReadAloud(true)
  onboarding.setInputMode('voice')
  voice.setMuted(false)
  voice.unlockSpeech()
  await voice.playChime('open')
  if (startingJourney) {
    // Permission has succeeded. Only now may the greeting play and listening begin.
    const greeting = appendGreeting()
    captionText.value = greeting
    await voice.speak(greeting)
    const response = campaignOnboarding.start(accountId.value, 'voice')
    appendAssistantResponse(response)
    captionText.value = response.speech ?? response.reply
    await voice.speak(response.speech ?? response.reply)
  } else {
    const response: CampaignOnboardingResponse = {
      intent: 'campaign',
      reply: 'Voice is ready. I’ll show what I hear before using it.',
      speech: 'Voice is ready. I will show what I hear before using it.',
    }
    appendAssistantResponse(response)
    captionText.value = response.speech ?? response.reply
    await voice.speak(response.speech ?? response.reply)
  }
  if (!voice.sttSupported) return
  liveActive.value = true
  void armListening()
}

function exploreMaropost() {
  prepareCampaignSession()
  trackDaVinciOnboardingEvent('onboarding_skipped', accountId.value, { goal: 'explore' })
  trackDaVinciOnboardingEvent('onboarding_paused', accountId.value, {
    from: onboarding.activeSession?.stage ?? 'choice',
  })
  endLive()
  onboarding.setPaused(true)
  copilot.setReadAloud(false)
  copilot.queueResume(
    'Campaign guidance is paused. Explore Maropost, then open Ask Da Vinci and say “continue campaign” whenever you want to resume.',
  )
  copilot.close()
  void router.push({ name: 'Dashboard', params: { accountId: accountId.value } })
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

function maskSensitiveTranscript(text: string) {
  return text
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[payment number hidden]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[identifier hidden]')
    .replace(/\b(?:api[_ -]?key|password|secret)\s*(?:is|:)?\s*\S+/gi, '[sensitive value hidden]')
}

function switchToTextFallback(reason: string, startCampaign: boolean) {
  endLive()
  copilot.setReadAloud(false)
  onboarding.setInputMode('text')
  voiceConsentPromptVisible.value = false
  trackDaVinciOnboardingEvent('voice_to_text_fallback', accountId.value, { reason })
  if (startCampaign && messages.value.length === 0) {
    appendGreeting()
    appendAssistantResponse(campaignOnboarding.start(accountId.value, 'text'))
  }
  nextTick(() => {
    document.querySelector<HTMLInputElement>('.dvx__input')?.focus()
  })
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
    const recoveredTranscript = err instanceof VoiceError
      ? maskSensitiveTranscript(err.transcript)
      : ''
    if (!silent) reportVoiceError(err)
    endLive()
    if (!silent) {
      switchToTextFallback(err instanceof VoiceError ? err.code : 'unknown', false)
      if (recoveredTranscript) inputText.value = recoveredTranscript
    }
    return
  }
  if (myToken !== loopToken || !liveActive.value) return // superseded by a typed turn / ended
  if (!text) {
    silentTurnCount++
    if (silentTurnCount === 1) {
      const response: CampaignOnboardingResponse = {
        intent: 'campaign',
        reply: 'I didn’t catch anything. Try once more, or use the text box below.',
        speech: 'I didn’t catch anything. Try once more, or type below.',
      }
      appendAssistantResponse(response)
      captionText.value = response.speech ?? response.reply
      await voice.speak(response.speech ?? response.reply)
      if (liveActive.value) void armListening()
      return
    }
    voiceRecoveryMessage.value = 'I still couldn’t hear you, so I switched to typing. Your progress is safe.'
    switchToTextFallback('silence', false)
    return
  }
  silentTurnCount = 0
  originalVoiceTranscript.value = maskSensitiveTranscript(text)
  pendingVoiceTranscript.value = originalVoiceTranscript.value
  nextTick(() => {
    document.querySelector<HTMLInputElement>('.dvx__transcript-input input')?.focus()
  })
}

async function confirmVoiceTranscript() {
  const text = pendingVoiceTranscript.value.trim()
  if (!text) return
  if (text !== originalVoiceTranscript.value) {
    trackDaVinciOnboardingEvent('transcript_corrected', accountId.value, {
      stage: onboarding.activeSession?.stage ?? 'unknown',
    })
  }
  pendingVoiceTranscript.value = ''
  originalVoiceTranscript.value = ''
  await respond(text, { awaitSpeech: true })
  if (liveActive.value) void armListening()
}

function retryVoiceTranscript() {
  pendingVoiceTranscript.value = ''
  originalVoiceTranscript.value = ''
  voiceRecoveryMessage.value = ''
  if (liveActive.value) void armListening()
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
  pendingVoiceTranscript.value = ''
  originalVoiceTranscript.value = ''
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
  } else if (campaignEntry.value && (!micPermissionTracked || onboarding.activeSession?.inputMode !== 'voice')) {
    voiceConsentPromptVisible.value = true
  } else if (audioBlocked.value) {
    void startGreeting()
  } else {
    startLive()
  }
}

function switchToTyping() {
  switchToTextFallback('user-choice', false)
  voiceRecoveryMessage.value = 'Voice is off. Continue in the text box; your campaign progress is unchanged.'
}

function appendAndSpeak(response: CampaignOnboardingResponse) {
  appendAssistantResponse(response)
  if (copilot.readAloud) {
    captionText.value = response.speech ?? response.reply
    void voice.speak(response.speech ?? response.reply)
  }
}

function openProductRoute(routeName: string) {
  endLive()
  onboarding.markPrerequisiteHandoff(routeName)
  trackDaVinciOnboardingEvent('prerequisite_opened', accountId.value, { routeName })
  copilot.queueResume('I’m still with you. Complete this step, then return here and I’ll check your campaign readiness again.')
  copilot.setWidthMode('panel')
  copilot.open()
  void router.push({ name: routeName, params: { accountId: accountId.value }, query: { source: 'davinci' } })
}

function openCampaignBuilder() {
  endLive()
  onboarding.markBuilderHandoff()
  trackDaVinciOnboardingEvent('builder_opened', accountId.value)
  const context = onboarding.activeSession?.contextBrief
  copilot.queueResume(
    `The standard campaign builder is open. ${context?.objective ? `Your objective is “${context.objective}”. ` : ''}Nothing has been filled in or saved; I can explain each step while you complete it.`,
  )
  copilot.setWidthMode('panel')
  copilot.open()
  void router.push({
    name: 'CreateCampaign',
    params: { accountId: accountId.value },
    query: { source: 'davinci' },
  }).catch(() => {
    pushToast({ title: 'Campaign builder unavailable', sub: 'Opening Email campaigns instead' })
    copilot.queueResume('The campaign builder could not open. Your campaign brief is safe; try again from Email campaigns.')
    return router.push({ name: 'EmailCampaigns', params: { accountId: accountId.value } })
  })
}

function onOnboardingAction(action: string) {
  if (action === 'open-builder') {
    openCampaignBuilder()
    return
  }
  if (action === 'review-brief') {
    appendAndSpeak(campaignOnboarding.buildContextBrief())
    return
  }
  if (action === 'change-brief' || action === 'change-objective') {
    trackDaVinciOnboardingEvent('brief_corrected', accountId.value)
  } else if (action === 'change-audience') {
    trackDaVinciOnboardingEvent('audience_corrected', accountId.value)
  }
  const response = campaignOnboarding.handleAction(action)
  if (response) {
    appendAndSpeak(response)
  } else if (action.startsWith('open-')) {
    const routeName = campaignOnboarding.routeForAction(action)
    if (routeName) openProductRoute(routeName)
  }
}

function onCardAction(payload: { card: DvCardDescriptor; action: string }) {
  if (payload.card.type === 'campaign') {
    if (payload.action === 'open-builder') {
      openCampaignBuilder()
      return
    }
    if (payload.action === 'change-brief') {
      trackDaVinciOnboardingEvent('brief_corrected', accountId.value)
      appendAndSpeak(campaignOnboarding.changeObjective())
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
  if (campaignEntry.value) {
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

function toggleReadAloud() {
  const enabled = !copilot.readAloud
  copilot.setReadAloud(enabled)
  voice.setMuted(!enabled)
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
  greetingPrefetch = voice.prefetchSpeech(greetingText.value, '/davinci/greeting.wav')
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
  if (route.query.onboarding === 'campaign') {
    trackDaVinciOnboardingEvent('onboarding_viewed', accountId.value)
    trackDaVinciOnboardingEvent('choice_screen_viewed', accountId.value)
    const session = onboarding.begin(accountId.value)
    copilot.beginOnboarding(accountId.value)
    if (
      session.stage !== 'welcome'
      && session.stage !== 'choice'
      && session.stage !== 'voice-consent'
      && messages.value.length === 0
    ) {
      trackDaVinciOnboardingEvent('onboarding_resumed', accountId.value, { stage: session.stage })
      const response = campaignOnboarding.resume()
      if (response) appendAssistantResponse(response)
    }
  } else {
    void autoGreet() // Returning/general experience keeps the existing hands-free entry.
  }
})

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
          v-if="hasThread"
          variant="outlined"
          size="small"
          rounded="pill"
          :prepend-icon="copilot.readAloud ? 'volume-2' : 'volume-x'"
          :aria-label="copilot.readAloud ? 'Turn read aloud off' : 'Turn read aloud on'"
          class="dvx__ghost-btn"
          @click="toggleReadAloud"
        >
          <span class="dvx__btn-label">{{ copilot.readAloud ? 'Read aloud on' : 'Read aloud off' }}</span>
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
        </v-btn>
      </div>
    </header>

    <!-- Centered content over the orb -->
    <main class="dvx__center" :class="{ 'dvx__center--thread': hasThread }">
      <section v-if="welcomeVisible" class="dvx__welcome" aria-labelledby="dvx-welcome-title">
        <div class="dvx__welcome-eyebrow">
          <v-icon size="16">sparkles</v-icon>
          Voice-first campaign guidance
        </div>
        <h1 id="dvx-welcome-title" class="dvx__welcome-title text-h3">
          Shape your first campaign with Da Vinci.
        </h1>
        <p class="dvx__welcome-copy">
          I’ll help shape your campaign, check what’s ready, and guide you through the campaign builder.
          You’ll review and complete every step.
        </p>

        <div v-if="micEducationVisible" class="dvx__permission pa-4">
          <div class="d-flex align-start ga-3">
            <v-avatar color="primary" variant="tonal" size="36">
              <v-icon size="20">mic</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-2 font-weight-bold">Use your microphone for this session</div>
              <div class="text-body-2 text-medium-emphasis mt-1">
                Da Vinci listens only while the conversation is active. A live transcript, Stop,
                Mute, and Type instead stay available. Raw audio is not retained.
              </div>
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2 mt-4">
            <v-btn
              color="primary"
              prepend-icon="mic"
              :disabled="!voice.sttSupported"
              @click="enableVoiceOnboarding"
            >
              Allow microphone and start
            </v-btn>
            <v-btn variant="outlined" prepend-icon="keyboard" @click="continueByTyping">
              Continue by typing
            </v-btn>
          </div>
          <p v-if="!voice.sttSupported" class="text-caption text-medium-emphasis mt-3 mb-0">
            Voice input is unavailable in this browser. You can complete the same onboarding by typing.
          </p>
        </div>

        <div v-else class="d-flex flex-wrap ga-3">
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mic"
            :disabled="!voice.sttSupported"
            @click="explainVoiceAccess"
          >
            Start with voice
          </v-btn>
          <v-btn variant="outlined" size="large" prepend-icon="keyboard" @click="continueByTyping">
            Continue by typing
          </v-btn>
        </div>

        <div v-if="!micEducationVisible" class="mt-4">
          <v-btn variant="text" prepend-icon="compass" @click="exploreMaropost">
            Explore Maropost
          </v-btn>
          <p v-if="!voice.sttSupported" class="text-caption text-medium-emphasis mt-2 mb-0">
            Voice input is unavailable in this browser. Typing follows the same guided experience.
          </p>
        </div>

        <p v-if="voiceRecoveryMessage" class="text-caption text-error mt-4 mb-0" role="alert">
          {{ voiceRecoveryMessage }}
        </p>

        <div class="dvx__welcome-promise d-flex flex-wrap ga-4 mt-5">
          <span><v-icon size="16">shield-check</v-icon> Permission before listening</span>
          <span><v-icon size="16">list-checks</v-icon> Guidance only</span>
          <span><v-icon size="16">keyboard</v-icon> Type at any time</span>
        </div>

        <p class="dvx__welcome-disclosure mt-3 mb-0">
          Da Vinci is an AI assistant. It can answer questions and check account setup, but it cannot
          create, edit, schedule, or send a campaign. Voice is optional and the microphone stays off
          until you explicitly allow it.
        </p>
      </section>

      <!-- Conversation thread -->
      <section v-if="!welcomeVisible && hasThread" ref="threadEl" class="dvx__thread" aria-live="polite">
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
          <div v-if="intentCardsFor(msg)?.quickReplies?.length" class="dvx__quick">
            <button
              v-for="reply in intentCardsFor(msg)!.quickReplies"
              :key="reply.value"
              type="button"
              class="dvx__chip"
              @click="onQuickReply(reply.value)"
            >
              <v-icon v-if="reply.icon" size="13">{{ reply.icon }}</v-icon>
              {{ reply.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Focal voice control — small mic centered in the orb -->
      <div v-if="!welcomeVisible" class="dvx__stage">
        <v-card
          v-if="voiceConsentPromptVisible"
          flat
          border
          rounded="lg"
          class="dvx__transcript pa-4"
          aria-label="Microphone permission"
        >
          <div class="text-subtitle-2 font-weight-bold">Turn on voice for this conversation?</div>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-3">
            Da Vinci listens only while voice is active, shows a transcript for review, and does not
            retain raw audio.
          </p>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              color="primary"
              size="small"
              prepend-icon="mic"
              :disabled="!voice.sttSupported"
              @click="enableVoiceOnboarding"
            >
              Allow microphone and start
            </v-btn>
            <v-btn variant="outlined" size="small" prepend-icon="keyboard" @click="switchToTyping">
              Continue by typing
            </v-btn>
          </div>
        </v-card>
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
        <v-card
          v-if="pendingVoiceTranscript"
          flat
          border
          rounded="lg"
          class="dvx__transcript pa-3 mt-3"
          aria-label="Review voice transcript"
        >
          <v-text-field
            v-model="pendingVoiceTranscript"
            class="dvx__transcript-input"
            label="I heard"
            variant="outlined"
            density="compact"
            hide-details
            @keydown.enter.prevent="confirmVoiceTranscript"
          />
          <div class="d-flex flex-wrap ga-2 mt-2">
            <v-btn color="primary" size="small" prepend-icon="check" @click="confirmVoiceTranscript">
              Use transcript
            </v-btn>
            <v-btn variant="outlined" size="small" prepend-icon="rotate-ccw" @click="retryVoiceTranscript">
              Try again
            </v-btn>
          </div>
          <p class="text-caption text-medium-emphasis mt-2 mb-0">
            Review or edit what Da Vinci heard before the campaign guidance advances.
          </p>
        </v-card>
        <div v-if="liveActive" class="dvx__live-controls">
          <button v-if="voice.state.value === 'speaking'" type="button" class="dvx__live-btn" @click="voice.cancelSpeech()">
            <v-icon size="15">square</v-icon>
            Interrupt
          </button>
          <button type="button" class="dvx__live-btn dvx__live-btn--end" @click="endLive">
            <v-icon size="15">x</v-icon>
            End conversation
          </button>
          <button type="button" class="dvx__live-btn" @click="switchToTyping">
            <v-icon size="15">keyboard</v-icon>
            Type instead
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
            <v-icon v-if="chip.icon" size="13">{{ chip.icon }}</v-icon>
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
  gap: 10px;
  font-weight: 800;
  font-size: 1.0625rem;
  letter-spacing: 0.01em;
  user-select: none;
}

.dvx__avatar {
  flex-shrink: 0;
}

.dvx__top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* prototype ghost buttons — white pill, hairline border, quiet ink */
.dvx__top-actions .dvx__ghost-btn {
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
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

/* ─── Thread (glass panel over the orb) ───────────────────────────────── */
.dvx__thread {
  width: min(640px, 92vw);
  flex: 0 1 auto;
  min-height: 0;
  max-height: 52vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 18px 20px;
  scrollbar-width: thin;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 60%, transparent);
  backdrop-filter: blur(14px) saturate(130%);
  -webkit-backdrop-filter: blur(14px) saturate(130%);
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-surface)) 70%, var(--dv-border));
  border-radius: 18px;
  /* glass needs shadow separation on pure white */
  box-shadow: 0 1px 2px rgba(24, 27, 33, 0.04), 0 24px 60px -32px rgba(24, 27, 33, 0.28);
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
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--dv-muted);
}

.dvx__turn--user .dvx__role {
  color: var(--dv-accent);
}

.dvx__msg {
  font-size: 0.875rem;
  line-height: 1.55;
  max-width: 90%;
  margin: 0;
}

.dvx__turn--user .dvx__msg {
  font-weight: 500;
  text-align: right;
  color: var(--dv-text-primary);
}

.dvx__cards {
  width: 100%;
  max-width: 430px;
  margin-top: 4px;
}

/* ─── First-run campaign welcome ─────────────────────────────────────── */
.dvx__welcome {
  width: min(var(--mp-layout-searchMaxWidth), 92vw);
  padding: var(--mp-spacing-8);
  border: 1px solid var(--dv-border);
  border-radius: var(--mp-borderRadius-xl);
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, transparent);
  box-shadow: var(--mp-shadow-lg);
  backdrop-filter: blur(var(--mp-spacing-3));
}

.dvx__welcome-eyebrow {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  margin-bottom: var(--mp-spacing-4);
  color: var(--dv-accent);
  font-weight: 600;
}

.dvx__welcome-title {
  margin: 0;
  color: var(--dv-text-primary);
  line-height: 1.12;
}

.dvx__welcome-copy {
  margin: var(--mp-spacing-4) 0 var(--mp-spacing-6);
  color: var(--dv-text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.dvx__permission {
  border: 1px solid var(--dv-border);
  border-radius: var(--mp-borderRadius-lg);
  background: rgb(var(--v-theme-surface));
}

.dvx__welcome-promise {
  color: var(--dv-text-secondary);
  font-size: 0.75rem;
}

.dvx__welcome-promise span {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-spacing-1);
}

.dvx__welcome-goals-label {
  color: var(--dv-text-secondary);
  font-size: 0.75rem;
}

.dvx__welcome-disclosure {
  color: var(--dv-text-secondary);
  font-size: 0.6875rem;
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
  gap: 16px;
}

/* ─── Stage: focal mic centered in the orb ────────────────────────────────── */
.dvx__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.dvx__transcript {
  width: min(520px, 92vw);
  text-align: left;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 94%, transparent);
  backdrop-filter: blur(var(--mp-spacing-2));
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
  font-size: 0.6875rem;
  font-weight: 500;
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
  font-size: 0.9375rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--dv-text-primary);
  line-height: 1.5;
}

/* ─── Live conversation controls ──────────────────────────────────────────── */
.dvx__live-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.dvx__live-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--dvx-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
  border-radius: 999px;
  padding: 8px 16px;
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
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--dv-border);
  border-radius: 999px;
  padding: 7px 7px 7px 20px;
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
  font-size: 1rem;
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
  gap: 8px;
  justify-content: center;
}

.dvx__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.dvx__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 550;
  background: transparent;
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
  border-radius: 999px;
  padding: 8px 14px;
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
    padding: var(--mp-spacing-5);
    border-radius: var(--mp-borderRadius-lg);
  }

  .dvx__welcome-title {
    font-size: 1.75rem !important;
  }

  .dvx__welcome .v-btn {
    width: 100%;
  }

  .dvx__msg {
    font-size: 0.875rem;
  }

  .dvx__thread {
    max-height: 46vh;
  }

  /* Topbar fits 375px: keep the orb, drop the wordmark text, tighten the pills
     so all actions stay reachable instead of overflowing off-screen. */
  .dvx__topbar {
    padding: 0 12px;
    min-height: 60px;
    gap: 8px;
  }

  .dvx__wordmark span {
    display: none;
  }

  .dvx__top-actions {
    gap: 6px;
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
