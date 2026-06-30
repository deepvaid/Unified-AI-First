<script setup lang="ts">
// Da Vinci AI experience — native port of the "Marojarvis" voice-first prototype
// (formerly linked externally as https://davinci-ai-first.vercel.app).
// fullPage route: the app shell + copilot drawer are unmounted, so this view
// owns the mic exclusively and provides its own exits (Esc / Classic UI / close).
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DvOrbCanvas from '@/components/copilot/voice/DvOrbCanvas.vue'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
import DvIntentCardList from '@/components/copilot/voice/DvIntentCardList.vue'
import DvToastStack from '@/components/copilot/DvToastStack.vue'
import { useDaVinciVoice, VoiceError } from '@/composables/useDaVinciVoice'
import { useDaVinciIntents, type DvCardDescriptor, type DvQuickReply } from '@/composables/useDaVinciIntents'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import { useUserProfile } from '@/stores/useUserProfile'

interface ExperienceTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  cards?: DvCardDescriptor[]
  quickReplies?: DvQuickReply[]
}

const route = useRoute()
const router = useRouter()
const voice = useDaVinciVoice()
const intents = useDaVinciIntents()
const { pushToast } = useDaVinciToasts()
const profile = useUserProfile()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? ''
})

const messages = ref<ExperienceTurn[]>([])
const inputText = ref('')
// Starter chips reveal only while the text field is focused (see template).
const inputFocused = ref(false)
const captionText = ref('')
const threadEl = ref<HTMLElement | null>(null)
const hasThread = computed(() => messages.value.length > 0)
const busy = computed(() => voice.state.value !== 'idle')
const avatarSpeed = computed(() => ({ idle: 1, listening: 2.4, thinking: 1.6, speaking: 1.4 })[voice.state.value])

// ── Live (hands-free) conversation ───────────────────────────────────────────
const liveActive = ref(false)
let loopToken = 0
let silenceStreak = 0
let autoStarted = false
// True when the cold-load greeting couldn't play (browser blocked autoplay until
// a user gesture). Flips the focal mic into an explicit "Tap to start" that speaks
// the greeting aloud on the first tap — so it works on a fresh load / shared link.
const audioBlocked = ref(false)
let greetProbe: ReturnType<typeof setTimeout> | null = null
// Personalized greeting, split so the name keeps its accent during the typewriter reveal.
const greetParts = computed(() => ({ pre: 'Hello ', name: profile.firstName, post: ', how can I help you today?' }))
const greetingText = computed(() => `${greetParts.value.pre}${greetParts.value.name}${greetParts.value.post}`)
const greetLen = computed(() => greetParts.value.pre.length + greetParts.value.name.length + greetParts.value.post.length)
const typedCount = ref(0)
const isTyping = ref(false)
const typedPre = computed(() => greetParts.value.pre.slice(0, typedCount.value))
const typedName = computed(() => greetParts.value.name.slice(0, Math.max(0, typedCount.value - greetParts.value.pre.length)))
const typedPost = computed(() =>
  greetParts.value.post.slice(0, Math.max(0, typedCount.value - greetParts.value.pre.length - greetParts.value.name.length)),
)
let typeTimer: ReturnType<typeof setInterval> | null = null
/** Type the greeting out (~1.7s) so it appears as Da Vinci speaks it — the open's "wow" moment. */
function playGreeting() {
  if (typeTimer) clearInterval(typeTimer)
  typedCount.value = 0
  isTyping.value = true
  const total = greetLen.value
  const stepMs = Math.max(32, Math.round(1700 / total))
  typeTimer = setInterval(() => {
    typedCount.value = Math.min(total, typedCount.value + 1)
    if (typedCount.value >= total) {
      if (typeTimer) clearInterval(typeTimer)
      typeTimer = null
      isTyping.value = false
    }
  }, stepMs)
}
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
  if (audioBlocked.value) return 'Tap to start'
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

/** Generate + render a reply; speak it (awaiting in live mode so the loop waits for TTS). */
async function respond(text: string, { awaitSpeech = false } = {}) {
  messages.value.push({ id: makeId('u'), role: 'user', text })
  inputText.value = ''
  scrollThread()

  voice.setThinking(true)
  // Recent turns give Gemini context for open-ended questions (exclude the just-pushed
  // current turn — the server appends it). Deterministic flows ignore it.
  const history = messages.value.slice(0, -1).slice(-6).map((m) => ({ role: m.role, text: m.text }))
  // Keep the prototype's "thinking" floor so deterministic replies don't feel instant.
  const minDelay = new Promise<void>((r) => setTimeout(r, 620 + Math.random() * 420))
  const res = await intents.answer(text, { history })
  await minDelay
  voice.setThinking(false)
  messages.value.push({
    id: makeId('a'),
    role: 'assistant',
    text: res.reply,
    cards: res.cards.length ? res.cards : undefined,
    quickReplies: res.quickReplies,
  })
  const speech = res.speech ?? res.reply
  captionText.value = speech
  scrollThread()
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

// Hide the starter chips on blur, but after a beat so a chip tap still registers.
function onInputBlur() {
  setTimeout(() => {
    inputFocused.value = false
  }, 150)
}

function reportVoiceError(err: unknown) {
  if (!(err instanceof VoiceError)) return
  if (err.code === 'permission') {
    pushToast({ title: 'Microphone blocked', sub: 'Allow microphone access in your browser settings' })
  } else if (err.code === 'network') {
    pushToast({ title: 'Voice service unavailable', sub: 'Check your connection — you can type instead' })
  } else if (err.code === 'audio') {
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
  } catch (err) {
    if (!silent) reportVoiceError(err)
    endLive()
    return
  }
  if (myToken !== loopToken || !liveActive.value) return // superseded by a typed turn / ended
  if (!text) {
    if (++silenceStreak >= 3) endLive()
    else void armListening()
    return
  }
  silenceStreak = 0
  await respond(text, { awaitSpeech: true })
  if (myToken === loopToken && liveActive.value) void armListening()
}

/** Tap to begin a hands-free conversation. */
function startLive() {
  voice.unlockSpeech() // mic permission + iOS audio unlock happen inside the tap
  if (liveActive.value) return
  liveActive.value = true
  silenceStreak = 0
  void armListening()
}

function endLive() {
  liveActive.value = false
  loopToken++ // any in-flight listen continuation bails
  voice.abortListening()
  voice.cancelSpeech()
  voice.setThinking(false)
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
    silenceStreak = 0
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
function autoGreet() {
  if (autoStarted) return
  autoStarted = true
  if (voice.muted.value) return // respect "Voice off"
  voice.unlockSpeech()
  let becameAudible = false
  voice.speak(greetingText.value, {
    onAudible: () => {
      becameAudible = true
    },
    onend: () => {
      if (becameAudible) listenAfterGreeting() // only auto-listen if the greeting truly played
    },
  })
  // If audio hasn't started shortly after, the browser blocked autoplay. Stop the
  // silent utterance (so the orb doesn't fake-"speak" and no surprise mic prompt
  // fires) and surface the tap-to-start affordance.
  greetProbe = setTimeout(() => {
    greetProbe = null
    if (!becameAudible && !liveActive.value && messages.value.length === 0) {
      voice.cancelSpeech()
      // The tap-to-start affordance is the focal mic — only offer it where the mic
      // is actually tappable (STT-capable browsers, i.e. Chrome/Edge).
      if (voice.sttSupported) audioBlocked.value = true
    }
  }, 1500)
}

/** Tap-to-start (fresh load): speak the greeting within the user gesture, then listen. */
function startGreeting() {
  audioBlocked.value = false
  voice.unlockSpeech()
  playGreeting() // re-type the greeting as it speaks
  voice.speak(greetingText.value, { onend: listenAfterGreeting })
}

/** Focal mic tap. While live it interrupts/ends; at rest it either greets-then-listens
 *  (when the cold-load greeting was blocked) or starts the live conversation. */
function onCenterMic() {
  if (liveActive.value) {
    onLiveControl()
  } else if (audioBlocked.value) {
    startGreeting()
  } else {
    startLive()
  }
}

function onCardAction(payload: { card: DvCardDescriptor; action: string }) {
  const titles: Record<string, string> = {
    launch: 'Campaign scheduled',
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
  messages.value = []
  inputText.value = ''
  captionText.value = ''
  audioBlocked.value = false // user has interacted by now — audio is unlocked
  playGreeting() // re-type the greeting on the fresh rest screen
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
  playGreeting() // type the greeting out (visual; always runs)
  autoGreet() // speak the greeting + auto-connect the mic (best-effort; see autoGreet)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (typeTimer) clearInterval(typeTimer)
  if (greetProbe) clearTimeout(greetProbe)
  liveActive.value = false
  loopToken++
  voice.disposeVoice()
})
</script>

<template>
  <div class="dvx" :data-orb-state="voice.state.value" :data-live="liveActive">
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
          class="dvx__ghost-btn"
          @click="voice.setMuted(!voice.muted.value)"
        >
          <span class="dvx__btn-label">{{ voice.muted.value ? 'Voice off' : 'Voice on' }}</span>
        </v-btn>
        <v-btn variant="outlined" size="small" rounded="pill" prepend-icon="panel-left" class="dvx__ghost-btn" @click="openClassicUI">
          <span class="dvx__btn-label">Classic UI</span>
        </v-btn>
        <v-btn icon size="small" variant="text" aria-label="Exit AI experience" @click="exitExperience">
          <v-icon size="18">x</v-icon>
        </v-btn>
      </div>
    </header>

    <!-- Centered content over the orb -->
    <main class="dvx__center" :class="{ 'dvx__center--thread': hasThread }">
      <!-- Conversation thread -->
      <section v-if="hasThread" ref="threadEl" class="dvx__thread" aria-live="polite">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="dvx__turn"
          :class="msg.role === 'user' ? 'dvx__turn--user' : 'dvx__turn--ai'"
        >
          <span class="dvx__role">{{ msg.role === 'user' ? 'You' : 'Da Vinci' }}</span>
          <p class="dvx__msg">{{ msg.text }}</p>
          <DvIntentCardList v-if="msg.cards?.length" :cards="msg.cards" class="dvx__cards" @action="onCardAction" />
          <div v-if="msg.quickReplies?.length" class="dvx__quick">
            <button
              v-for="reply in msg.quickReplies"
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

      <!-- AI-first greeting — types out as Da Vinci speaks it -->
      <div v-if="!hasThread && !liveActive" class="dvx__greeting">
        <h1 class="dvx__greeting-title" :aria-label="greetingText">
          <span aria-hidden="true"
            >{{ typedPre }}<span class="dvx__greeting-name">{{ typedName }}</span
            >{{ typedPost }}<span v-if="isTyping" class="dvx__caret"></span
          ></span>
        </h1>
      </div>

      <!-- Focal voice control — small mic centered in the orb -->
      <div class="dvx__stage">
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
                ? 'Tap to start — greet me and begin listening'
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
        <div v-if="liveActive" class="dvx__live-controls">
          <button v-if="voice.state.value === 'speaking'" type="button" class="dvx__live-btn" @click="voice.cancelSpeech()">
            <v-icon size="15">square</v-icon>
            Interrupt
          </button>
          <button type="button" class="dvx__live-btn dvx__live-btn--end" @click="endLive">
            <v-icon size="15">x</v-icon>
            End conversation
          </button>
        </div>
      </div>

      <!-- Text composer (secondary) — type any time -->
      <div class="dvx__composer">
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
            <v-icon v-if="chip.icon" size="13" color="primary">{{ chip.icon }}</v-icon>
            {{ chip.label }}
          </button>
        </div>
      </div>
    </main>

    <DvToastStack />
  </div>
</template>

<style scoped>
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
  transition: border-color 0.2s ease, transform 0.12s ease;
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
  font-size: 0.9375rem;
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

/* ─── Composer ────────────────────────────────────────────────────────── */
.dvx__composer {
  position: relative;
  width: min(560px, 92vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* ─── AI-first greeting ───────────────────────────────────────────────────── */
.dvx__greeting {
  text-align: center;
  max-width: min(620px, 90vw);
}

.dvx__greeting-title {
  margin: 0;
  font-size: clamp(1.35rem, 2.6vw, 1.9rem);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}

.dvx__greeting-name {
  color: var(--dv-accent);
}

/* Blinking typewriter caret */
.dvx__caret {
  display: inline-block;
  width: 0.07em;
  height: 1.05em;
  margin-left: 0.06em;
  vertical-align: -0.14em;
  background: var(--dv-accent);
  border-radius: 1px;
  animation: dvx-caret 0.9s steps(1) infinite;
}

@keyframes dvx-caret {
  0%,
  50% {
    opacity: 1;
  }
  50.01%,
  100% {
    opacity: 0;
  }
}

/* ─── Stage: focal mic centered in the orb ────────────────────────────────── */
.dvx__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
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
  transition: border-color 0.18s, color 0.18s, transform 0.1s;
}

.dvx__live-btn:hover {
  border-color: var(--dv-accent);
  color: var(--dv-accent);
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
  transition: border-color 0.2s, box-shadow 0.2s;
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
  transition: background 0.18s, transform 0.1s, color 0.18s;
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
  font-family: var(--dvx-mono);
  font-size: 0.75rem;
  font-weight: 400;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  transition: border-color 0.18s, color 0.18s, background 0.18s, transform 0.1s;
}

.dvx__chip:hover {
  border-color: var(--dv-accent);
  color: var(--dv-accent);
  background: var(--dv-accent-soft);
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
  .dvx__caret {
    animation: none;
  }
}
</style>
