<script setup lang="ts">
// Da Vinci AI experience — native port of the "Marojarvis" voice-first prototype
// (formerly linked externally as https://davinci-ai-first.vercel.app).
// fullPage route: the app shell + copilot drawer are unmounted, so this view
// owns the mic exclusively and provides its own exits (Esc / Classic UI / close).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DvOrbCanvas from '@/components/copilot/voice/DvOrbCanvas.vue'
import DvOrbitOrb from '@/components/copilot/voice/DvOrbitOrb.vue'
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
const inputEl = ref<HTMLInputElement | null>(null)
const captionText = ref('')
const threadEl = ref<HTMLElement | null>(null)
const hasThread = computed(() => messages.value.length > 0)
const busy = computed(() => voice.state.value !== 'idle')
const isListening = computed(() => voice.state.value === 'listening' && voice.owner.value === 'experience')
const avatarSpeed = computed(() => ({ idle: 1, listening: 2.4, thinking: 1.6, speaking: 1.4 })[voice.state.value])

function makeId(prefix = 'x') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function scrollThread() {
  nextTick(() => {
    threadEl.value?.scrollTo({ top: threadEl.value.scrollHeight, behavior: 'smooth' })
  })
}

async function submit(raw: string) {
  const text = raw.trim()
  if (!text || busy.value) return
  messages.value.push({ id: makeId('u'), role: 'user', text })
  inputText.value = ''
  scrollThread()

  voice.setThinking(true)
  // Recent turns give Gemini context for open-ended questions (exclude the
  // just-pushed current turn — the server appends it). Deterministic flows ignore it.
  const history = messages.value.slice(0, -1).slice(-6).map((m) => ({ role: m.role, text: m.text }))
  // Keep the prototype's "thinking" floor so deterministic replies don't feel
  // instant; it overlaps with Gemini's network time rather than adding to it.
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
  captionText.value = res.speech ?? res.reply
  scrollThread()
  void voice.speak(res.speech ?? res.reply)
}

function onSend() {
  voice.unlockSpeech() // prime TTS within the gesture (Safari/iOS autoplay)
  void submit(inputText.value)
}

async function toggleMic() {
  voice.unlockSpeech() // prime TTS within the tap so the spoken reply is allowed
  if (isListening.value) {
    voice.stopListening()
    return
  }
  if (busy.value) return
  try {
    const finalText = await voice.startListening({ owner: 'experience', withAnalyser: true })
    if (finalText) void submit(finalText)
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
  voice.unlockSpeech() // prime TTS within the gesture (Safari/iOS autoplay)
  void submit(value)
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
  // Let users start typing immediately on desktop (avoid popping the mobile keyboard over the orb).
  if (window.matchMedia('(pointer: fine)').matches) {
    nextTick(() => inputEl.value?.focus())
  }
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

      <div class="dvx__composer">
        <DvVoiceStatePill
          variant="minimal"
          :state="voice.state.value"
          :label="voice.state.value === 'speaking' && captionText ? captionText : undefined"
        />

        <!-- Unified composer: type any time, or tap the mic to talk — no press-to-speak gate -->
        <form class="dvx__inputrow" @submit.prevent="onSend">
          <button
            type="button"
            class="dvx__iconbtn dvx__micbtn"
            :class="{ 'dvx__micbtn--live': isListening, 'dvx__micbtn--disabled': !voice.sttSupported }"
            :disabled="!voice.sttSupported"
            :aria-label="isListening ? 'Stop listening' : 'Speak to Da Vinci'"
            @click="toggleMic"
          >
            <v-icon size="18">{{ isListening ? 'mic-off' : 'mic' }}</v-icon>
            <v-tooltip v-if="!voice.sttSupported" activator="parent" location="top">
              Voice input needs Chrome or Edge — you can type instead
            </v-tooltip>
          </button>
          <input
            ref="inputEl"
            v-model="inputText"
            type="text"
            :placeholder="isListening ? 'Listening…' : 'Message Da Vinci, or tap the mic to talk…'"
            aria-label="Message Da Vinci"
            class="dvx__input"
          />
          <button
            type="submit"
            class="dvx__iconbtn dvx__iconbtn--send"
            aria-label="Send"
            :disabled="!inputText.trim() || busy"
          >
            <v-icon size="18">arrow-up</v-icon>
          </button>
        </form>

        <!-- Starter suggestion chips (before a conversation) -->
        <div v-if="!hasThread" class="dvx__chips">
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

/* In-bar mic — the voice control now lives inside the unified composer (left) */
.dvx__micbtn {
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 4%, rgb(var(--v-theme-surface)));
  border: 1px solid var(--dv-border);
  color: var(--dv-text-secondary);
}

.dvx__micbtn:hover:not(:disabled) {
  border-color: var(--dv-accent);
  color: var(--dv-accent);
}

.dvx__micbtn--live {
  background: var(--dv-accent);
  border-color: var(--dv-accent);
  color: var(--dv-on-accent);
}

.dvx__micbtn--disabled {
  cursor: default;
  opacity: 0.5;
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
  padding: 7px;
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
  .dvx__turn {
    animation: none;
  }
}
</style>
