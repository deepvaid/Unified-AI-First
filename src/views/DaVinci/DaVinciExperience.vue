<script setup lang="ts">
// Da Vinci AI experience — native port of the "Marojarvis" voice-first prototype
// (formerly linked externally as https://davinci-ai-first.vercel.app).
// fullPage route: the app shell + copilot drawer are unmounted, so this view
// owns the mic exclusively and provides its own exits (Esc / Classic UI / close).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DvOrbCanvas from '@/components/copilot/voice/DvOrbCanvas.vue'
import DvOrbMark from '@/components/copilot/DvOrbMark.vue'
import DvVoiceStatePill from '@/components/copilot/voice/DvVoiceStatePill.vue'
import DvIntentCardList from '@/components/copilot/voice/DvIntentCardList.vue'
import DvToastStack from '@/components/copilot/DvToastStack.vue'
import { useDaVinciVoice, VoiceError } from '@/composables/useDaVinciVoice'
import { useDaVinciIntents, type DvCardDescriptor, type DvQuickReply } from '@/composables/useDaVinciIntents'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'

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

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? ''
})

const messages = ref<ExperienceTurn[]>([])
const inputText = ref('')
const inputFocused = ref(false)
const captionText = ref('')
const threadEl = ref<HTMLElement | null>(null)
const hasThread = computed(() => messages.value.length > 0)
const busy = computed(() => voice.state.value !== 'idle')
const isListening = computed(() => voice.state.value === 'listening' && voice.owner.value === 'experience')

function makeId(prefix = 'x') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function scrollThread() {
  nextTick(() => {
    threadEl.value?.scrollTo({ top: threadEl.value.scrollHeight, behavior: 'smooth' })
  })
}

function submit(raw: string) {
  const text = raw.trim()
  if (!text || busy.value) return
  messages.value.push({ id: makeId('u'), role: 'user', text })
  inputText.value = ''
  scrollThread()

  voice.setThinking(true)
  setTimeout(() => {
    const res = intents.handle(text)
    voice.setThinking(false)
    messages.value.push({
      id: makeId('a'),
      role: 'assistant',
      text: res.reply,
      cards: res.cards.length ? res.cards : undefined,
      quickReplies: res.quickReplies,
    })
    captionText.value = res.speech ?? res.reply
    scrollThread()
    void voice.speak(res.speech ?? res.reply)
  }, 620 + Math.random() * 420)
}

function onSend() {
  submit(inputText.value)
}

async function toggleMic() {
  if (isListening.value) {
    voice.stopListening()
    return
  }
  if (busy.value) return
  try {
    const finalText = await voice.startListening({ owner: 'experience', withAnalyser: true })
    if (finalText) submit(finalText)
  } catch (err) {
    if (err instanceof VoiceError) {
      if (err.code === 'permission') {
        pushToast({ title: 'Microphone blocked', sub: 'Allow microphone access in your browser settings' })
      } else if (err.code === 'network') {
        pushToast({ title: 'Voice service unavailable', sub: 'Check your connection — you can type instead' })
      } else if (err.code === 'audio') {
        pushToast({ title: 'No microphone found' })
      }
    }
  }
}

// Mirror the live transcript into the input while dictating (prototype behavior)
watch(voice.interimTranscript, (t) => {
  if (isListening.value && t) inputText.value = t
})

function onQuickReply(value: string) {
  submit(value)
}

// Chips reveal on input focus (stakeholder-clean rest state); stay open while
// focus moves between the input row and the chips themselves (keyboard parity)
function onComposerFocusIn() {
  inputFocused.value = true
}
function onComposerFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as HTMLElement | null
  if (!next || !next.closest('.dvx__inputrow, .dvx__chips')) inputFocused.value = false
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
  voice.abortListening()
  voice.cancelSpeech()
  voice.setThinking(false)
  intents.reset()
  messages.value = []
  inputText.value = ''
  captionText.value = ''
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
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  voice.disposeVoice()
})
</script>

<template>
  <div class="dvx" :data-orb-state="voice.state.value">
    <!-- Orb backdrop -->
    <div class="dvx__backdrop">
      <DvOrbCanvas :state="voice.state.value" :audio-source="voice.getVoiceFrame" class="dvx__orb" />
    </div>

    <!-- Top bar -->
    <header class="dvx__topbar">
      <div class="dvx__wordmark">
        <DvOrbMark class="dvx__avatar" :size="30" variant="tile" tile-radius="10px" :state="voice.state.value" />
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
          New chat
        </v-btn>
        <v-btn
          variant="outlined"
          size="small"
          rounded="pill"
          :prepend-icon="voice.muted.value ? 'volume-x' : 'volume-2'"
          class="dvx__ghost-btn"
          @click="voice.setMuted(!voice.muted.value)"
        >
          {{ voice.muted.value ? 'Voice off' : 'Voice on' }}
        </v-btn>
        <v-btn variant="outlined" size="small" rounded="pill" class="dvx__ghost-btn" @click="openClassicUI">
          Classic UI
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

      <div class="dvx__composer">
        <!-- Voice-first CTA (hidden once a conversation starts) -->
        <div v-if="!hasThread" class="dvx__voice-cta">
          <button
            type="button"
            class="dvx__bigmic"
            :class="{ 'dvx__bigmic--live': isListening, 'dvx__bigmic--disabled': !voice.sttSupported }"
            :disabled="!voice.sttSupported"
            :aria-label="isListening ? 'Stop listening' : 'Press to speak'"
            @click="toggleMic"
          >
            <v-icon size="32">{{ isListening ? 'mic-off' : 'mic' }}</v-icon>
            <v-tooltip v-if="!voice.sttSupported" activator="parent" location="bottom">
              Voice input needs Chrome or Edge — you can type instead
            </v-tooltip>
          </button>
          <div class="dvx__voice-label">
            {{ voice.sttSupported ? (isListening ? 'Listening…' : 'Press to speak') : 'Type below to begin' }}
          </div>
        </div>

        <DvVoiceStatePill
          variant="minimal"
          :state="voice.state.value"
          :label="voice.state.value === 'speaking' && captionText ? captionText : undefined"
        />

        <!-- Input row -->
        <form class="dvx__inputrow" @submit.prevent="onSend" @focusin="onComposerFocusIn" @focusout="onComposerFocusOut">
          <input
            v-model="inputText"
            type="text"
            placeholder="Ask Da Vinci, or say a command…"
            aria-label="Message Da Vinci"
            class="dvx__input"
          />
          <button
            v-if="voice.sttSupported && hasThread"
            type="button"
            class="dvx__iconbtn dvx__iconbtn--mic"
            :class="{ 'dvx__iconbtn--live': isListening }"
            :aria-label="isListening ? 'Stop listening' : 'Speak'"
            @click="toggleMic"
          >
            <v-icon size="18">{{ isListening ? 'mic-off' : 'mic' }}</v-icon>
          </button>
          <button
            type="submit"
            class="dvx__iconbtn dvx__iconbtn--send"
            aria-label="Send"
            :disabled="!inputText.trim() || busy"
          >
            <v-icon size="18">arrow-up</v-icon>
          </button>
        </form>

        <!-- Suggestion chips — revealed when the input is focused -->
        <div
          v-if="!hasThread"
          class="dvx__chips"
          :class="{ 'dvx__chips--on': inputFocused }"
          :aria-hidden="!inputFocused"
          @focusin="onComposerFocusIn"
          @focusout="onComposerFocusOut"
        >
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

.dvx__voice-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.dvx__bigmic {
  position: relative;
  width: clamp(78px, 8.5vw, 96px);
  height: clamp(78px, 8.5vw, 96px);
  border-radius: 50%;
  border: 1px solid var(--dv-border);
  cursor: pointer;
  /* prototype #f4f5f7 — neutral surface that reads on pure white */
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 4%, rgb(var(--v-theme-surface)));
  color: var(--dv-text-secondary);
  display: grid;
  place-items: center;
  box-shadow: 0 4px 14px -8px rgba(24, 27, 33, 0.25);
  transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s, color 0.2s;
}

.dvx__bigmic:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.03);
  color: var(--dv-accent);
}

.dvx__bigmic:active:not(:disabled) {
  transform: scale(0.96);
}

.dvx__bigmic::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--dv-border);
  opacity: 0.6;
  animation: dvx-ring 3s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.dvx__bigmic--live {
  background: var(--dv-accent);
  color: var(--dv-on-accent);
}

.dvx__bigmic--live::after {
  animation-duration: 1.4s;
  border-color: var(--dv-accent);
}

.dvx__bigmic--disabled {
  cursor: default;
  opacity: 0.55;
}

.dvx__bigmic--disabled::after {
  animation: none;
}

.dvx__voice-label {
  font-family: var(--dvx-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dv-text-secondary);
  min-height: 14px;
  transition: color 0.3s;
}

.dvx[data-orb-state='listening'] .dvx__voice-label {
  color: var(--dv-accent);
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

.dvx__iconbtn--mic {
  background: var(--dv-accent-soft);
  color: var(--dv-text-secondary);
}

.dvx__iconbtn--live {
  background: var(--dv-accent);
  color: var(--dv-on-accent);
  animation: dvx-micpulse 1.5s ease infinite;
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
  /* hidden at rest — revealed on input focus (visibility transition keeps
     chips clickable during the fade so click-through never drops) */
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.25s;
}

.dvx__chips--on {
  opacity: 1;
  visibility: visible;
  transform: none;
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

@keyframes dvx-ring {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  80%,
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes dvx-micpulse {
  0% {
    box-shadow: 0 0 0 0 var(--dv-accent-soft);
  }
  70% {
    box-shadow: 0 0 0 12px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@media (max-width: 560px) {
  .dvx__msg {
    font-size: 0.875rem;
  }

  .dvx__thread {
    max-height: 46vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dvx__turn,
  .dvx__bigmic::after,
  .dvx__iconbtn--live {
    animation: none;
  }
}
</style>
