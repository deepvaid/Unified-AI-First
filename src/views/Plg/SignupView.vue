<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlgStore, type TrialSignupPayload } from '@/stores/usePlg'
import { useAccountsStore } from '@/stores/useAccounts'
import { useUserProfile } from '@/stores/useUserProfile'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'
import { useDaVinciVoice, VoiceError } from '@/composables/useDaVinciVoice'
import DvOrbitMicBar from '@/components/copilot/voice/DvOrbitMicBar.vue'

const router = useRouter()
const route = useRoute()
const plg = usePlgStore()

// Same three.js particle orb the landing/login pages mount — loaded lazily so
// the signup chunk stays light. Has its own CSS fallback while loading.
const DvOrbCanvas = defineAsyncComponent(() => import('@/components/copilot/voice/DvOrbCanvas.vue'))
const accounts = useAccountsStore()
const profile = useUserProfile()
const daVinciOnboarding = useDaVinciOnboardingStore()
const voice = useDaVinciVoice()

type Stage = 'intro' | 'ask' | 'verify' | 'provisioning' | 'success'
type AskState = 'speaking' | 'listening' | 'reviewing' | 'idle'
type QuestionId = 'name' | 'email' | 'company'

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com',
  'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com',
  'proton.me', 'protonmail.com', 'gmx.com', 'mail.com', 'zoho.com',
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PROVISIONING_STEPS = [
  'Creating your workspace',
  'Provisioning Marketing Cloud',
  'Provisioning Commerce Cloud',
  'Provisioning Service Cloud',
  'Applying trial limits',
]

// ── Conversational questions ─────────────────────────────────────────────
// One question per screen, Typeform-style. Da Vinci speaks each `spoken` line;
// the user answers by voice or typing into the same field.

interface SignupQuestion {
  id: QuestionId
  question: string
  spoken: string
  retrySpoken: string
  placeholder: string
  inputType: 'text' | 'email'
  autocomplete: string
  /** Auto-listen after the question is spoken. Email is type-primary — voice
   *  dictation of addresses is error-prone, so the mic stays tap-to-talk there. */
  autoListen: boolean
  /** Read a dictated answer back for a spelling check before advancing. Proper
   *  nouns come out of STT misspelled; email is exempt (typed-primary already). */
  review?: boolean
  /** Cleanup applied to voice transcripts only (typed input is left alone). */
  normalizeVoice: (raw: string) => string
  validate: (value: string) => string
}

function validateEmail(value: string): string {
  if (!value) return 'Work email is required'
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address'
  const domain = value.split('@')[1]?.toLowerCase().trim() ?? ''
  if (FREE_EMAIL_DOMAINS.has(domain)) return 'Use your work email to start a trial'
  return ''
}

/** "john at acme dot com" → "john@acme.com". STT sentences arrive with spaces,
 *  spelled-out symbols, and a trailing period — normalize before validating. */
function normalizeSpokenEmail(raw: string): string {
  return raw.toLowerCase().trim()
    .replace(/\s+at\s+|\s+@\s+/g, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+(underscore|under score)\s+/g, '_')
    .replace(/\s+(dash|hyphen|minus)\s+/g, '-')
    .replace(/[\s,]+/g, '')
    .replace(/\.+$/, '')
}

function normalizeSpokenName(raw: string): string {
  return raw
    .replace(/^(my name is|i am|i'm|it's|this is)\s+/i, '')
    .replace(/[.,!?]+$/, '')
    .trim()
}

const QUESTIONS: SignupQuestion[] = [
  {
    id: 'name',
    question: 'First — what’s your name?',
    spoken: 'Hi, I’m Da Vinci. I’ll get your Maropost trial set up in about a minute. First — what’s your name?',
    retrySpoken: 'Sorry — I need your first and last name.',
    placeholder: 'First and last name',
    inputType: 'text',
    autocomplete: 'name',
    autoListen: true,
    review: true,
    normalizeVoice: normalizeSpokenName,
    validate: (value) => (value.split(/\s+/).filter(Boolean).length >= 2 ? '' : 'First and last name, please.'),
  },
  {
    id: 'email',
    question: 'What’s your work email?',
    spoken: 'And your work email? You can type it if that’s easier.',
    retrySpoken: 'Hmm, that doesn’t look like a work email — typing it might be easier.',
    placeholder: 'name@company.com',
    inputType: 'email',
    autocomplete: 'email',
    autoListen: false,
    normalizeVoice: normalizeSpokenEmail,
    validate: validateEmail,
  },
  {
    id: 'company',
    question: 'What company is this for?',
    spoken: 'Last one — what’s your company called?',
    retrySpoken: 'What’s the company name?',
    placeholder: 'Company name',
    inputType: 'text',
    autocomplete: 'organization',
    autoListen: true,
    review: true,
    normalizeVoice: (raw) => raw.replace(/[.,!?]+$/, '').trim(),
    validate: (value) => (value ? '' : 'Company name is required'),
  },
]

// Spoken lines for the tail stages. The verify line deliberately omits the
// email address — TTS reads addresses awkwardly; the screen shows it instead.
const VERIFY_SPOKEN = 'I’ve just sent you a verification link — tap it, and I’ll build your workspace.'
const PROVISIONING_SPOKEN = 'Give me a few seconds — I’m building your workspace.'

// Spelling-review line for dictated proper nouns, plus the phrases that count as
// "yes, that's right" (anything else is treated as a re-dictation).
const REVIEW_SPOKEN = 'Did I spell that right? Say next, or fix it.'
const REVIEW_CONFIRM_RE = /^(next|yes|yeah|yep|yup|correct|looks good|good|that's right|thats right|continue|go ahead|okay|ok)\b/i

// ── Flow state ───────────────────────────────────────────────────────────
const stage = ref<Stage>('intro')
const questionIndex = ref(0)
const askState = ref<AskState>('idle')
const voiceMode = ref(false)
const micDenied = ref(false)
const statusText = ref('')
const fieldError = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

// Prefilled when an entry point passes ?email= (kept for share links / future funnels)
const answers = ref<Record<QuestionId, string>>({
  name: '',
  email: typeof route.query.email === 'string' ? route.query.email : '',
  company: '',
})
const inputValue = ref('')

// Bumped on every user-initiated transition so stale speak/listen continuations bail.
let flowToken = 0
// Silence window during a spelling review — elapsing it means "yes, that's right".
let reviewTimer: ReturnType<typeof setTimeout> | null = null

const currentQuestion = computed(() => QUESTIONS[questionIndex.value]!)
const isLastQuestion = computed(() => questionIndex.value === QUESTIONS.length - 1)
const showMic = computed(() => voiceMode.value && !micDenied.value && voice.sttSupported)
const micLabel = computed(() => (askState.value === 'listening' ? 'Tap to finish' : 'Tap to talk'))

// While listening, the live interim transcript fills the field; a keystroke wins instantly.
const displayValue = computed(() =>
  askState.value === 'listening' && voice.interimTranscript.value
    ? voice.interimTranscript.value
    : inputValue.value,
)

const orbState = computed(() => {
  if (stage.value === 'provisioning') return 'thinking'
  if (voiceMode.value) return voice.state.value
  return 'idle'
})

// Name is asked as one field; first/last are derived for the profile + payload.
const nameTokens = computed(() => answers.value.name.trim().split(/\s+/).filter(Boolean))
const firstName = computed(() => nameTokens.value[0] ?? '')
const lastName = computed(() => nameTokens.value.slice(1).join(' '))

// ── Intro — consent + audio unlock ───────────────────────────────────────
async function beginVoice() {
  voiceMode.value = true
  voice.unlockSpeech()
  await voice.tryUnlockAudio()
  void voice.playChime('open')
  // Warm the TTS cache for every static line so questions speak instantly.
  for (const q of QUESTIONS) void voice.prefetchSpeech(q.spoken)
  void voice.prefetchSpeech(REVIEW_SPOKEN)
  void voice.prefetchSpeech(VERIFY_SPOKEN)
  void voice.prefetchSpeech(PROVISIONING_SPOKEN)
  stage.value = 'ask'
  void presentQuestion(0)
}

function beginTyped() {
  voiceMode.value = false
  stage.value = 'ask'
  void presentQuestion(0)
}

// ── Ask loop ─────────────────────────────────────────────────────────────
async function presentQuestion(index: number) {
  const token = ++flowToken
  questionIndex.value = index
  const q = QUESTIONS[index]!
  fieldError.value = ''
  statusText.value = ''
  inputValue.value = answers.value[q.id]
  // The out-in stage fade inserts the new question after the leave transition —
  // @after-enter on the <transition> focuses the input once it actually exists.
  await nextTick()
  inputEl.value?.focus()
  if (!voiceMode.value) return
  // Don't re-speak a question the user navigated back to with an answer in place.
  if (answers.value[q.id]) return
  askState.value = 'speaking'
  await voice.speak(q.spoken) // never rejects; falls back to the browser voice
  if (token !== flowToken || stage.value !== 'ask') return
  if (q.autoListen && !micDenied.value) void listenFor(q)
  else askState.value = 'idle'
}

async function listenFor(q: SignupQuestion, isRetry = false) {
  if (!voiceMode.value || micDenied.value) return
  const token = flowToken
  askState.value = 'listening'
  statusText.value = 'Listening…'
  try {
    const transcript = await voice.startListening({ owner: 'signup', withAnalyser: true })
    if (token !== flowToken || stage.value !== 'ask') return
    askState.value = 'idle'
    const cleaned = q.normalizeVoice(transcript).trim()
    if (!cleaned) {
      statusText.value = 'Didn’t catch that — tap the mic or type.'
      return
    }
    inputValue.value = cleaned
    statusText.value = ''
    if (q.review && !q.validate(cleaned)) {
      void reviewAnswer(q)
      return
    }
    const advanced = submitAnswer()
    // One spoken retry on an invalid voice answer, then hand over to mic-tap/typing.
    if (!advanced && !isRetry) {
      askState.value = 'speaking'
      await voice.speak(q.retrySpoken)
      if (token !== flowToken || stage.value !== 'ask') return
      if (q.autoListen) void listenFor(q, true)
      else askState.value = 'idle'
    }
  } catch (err) {
    if (token !== flowToken || stage.value !== 'ask') return
    handleVoiceError(err)
  }
}

/** Spelling review for dictated proper nouns: the transcript stays in the field
 *  while Da Vinci asks for a check. "Next"/silence advances; anything else is
 *  treated as a re-dictation (once); typing or Enter takes over as usual. */
async function reviewAnswer(q: SignupQuestion, isSecondPass = false) {
  const token = flowToken
  askState.value = 'reviewing'
  statusText.value = 'Say “next” — or fix the spelling.'
  await voice.speak(REVIEW_SPOKEN)
  if (token !== flowToken || stage.value !== 'ask') return
  // Stay in 'reviewing' during the confirm listen so the field keeps showing the
  // dictated answer (displayValue only mirrors interim while 'listening').
  reviewTimer = setTimeout(() => {
    reviewTimer = null
    if (token === flowToken && askState.value === 'reviewing' && !voice.interimTranscript.value) {
      voice.abortListening() // resolves the pending listen with '' → silence path
    }
  }, 5000)
  try {
    const transcript = await voice.startListening({ owner: 'signup', withAnalyser: true })
    if (reviewTimer) { clearTimeout(reviewTimer); reviewTimer = null }
    if (token !== flowToken || stage.value !== 'ask') return
    const heard = transcript.trim()
    if (!heard || REVIEW_CONFIRM_RE.test(heard)) {
      askState.value = 'idle'
      statusText.value = ''
      submitAnswer()
      return
    }
    const cleaned = q.normalizeVoice(heard).trim()
    if (cleaned && !q.validate(cleaned) && !isSecondPass) {
      inputValue.value = cleaned
      void reviewAnswer(q, true)
      return
    }
    if (cleaned && !q.validate(cleaned)) inputValue.value = cleaned
    askState.value = 'idle'
    statusText.value = 'Tap Next when it looks right — or type to fix it.'
  } catch (err) {
    if (reviewTimer) { clearTimeout(reviewTimer); reviewTimer = null }
    if (token !== flowToken || stage.value !== 'ask') return
    handleVoiceError(err)
  }
}

function handleVoiceError(err: unknown) {
  askState.value = 'idle'
  const code = err instanceof VoiceError ? err.code : 'unknown'
  if (code === 'no-speech') {
    statusText.value = 'Didn’t catch that — tap the mic or type.'
  } else if (code === 'permission') {
    // Downgrade gently: Da Vinci keeps speaking the questions, answers are typed.
    micDenied.value = true
    statusText.value = 'Microphone is blocked — no problem, we’ll type.'
  } else if (code === 'network') {
    micDenied.value = true
    statusText.value = 'Voice is unavailable right now — continue by typing.'
  } else {
    statusText.value = 'Voice hit a snag — you can type instead.'
  }
}

function interruptVoice() {
  if (reviewTimer) { clearTimeout(reviewTimer); reviewTimer = null }
  ++flowToken
  voice.abortListening()
  voice.cancelSpeech()
  askState.value = 'idle'
}

function onInput(event: Event) {
  inputValue.value = (event.target as HTMLInputElement).value
}

/** Adopt whatever is on screen (typed or interim transcript) and stop voice. */
function commitDisplayed() {
  inputValue.value = displayValue.value
  interruptVoice()
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    commitDisplayed()
    submitAnswer()
    return
  }
  if (event.key === 'Escape') {
    interruptVoice()
    statusText.value = ''
    return
  }
  // Typing takes over instantly: adopt whatever was transcribed so far, stop the mic.
  if (askState.value === 'listening') {
    commitDisplayed()
    statusText.value = ''
  } else if (askState.value === 'speaking' || askState.value === 'reviewing') {
    interruptVoice()
    statusText.value = ''
  }
}

function onMicTap() {
  if (askState.value === 'listening') {
    voice.stopListening() // finalize — the pending startListening resolves
    return
  }
  // A tap during review starts a fresh dictation — drop the auto-advance timer.
  if (reviewTimer) { clearTimeout(reviewTimer); reviewTimer = null }
  ++flowToken
  voice.cancelSpeech()
  void listenFor(currentQuestion.value)
}

function submitAnswer(): boolean {
  const q = currentQuestion.value
  const value = inputValue.value.trim()
  const error = q.validate(value)
  fieldError.value = error
  if (error) return false
  answers.value[q.id] = value
  if (!isLastQuestion.value) {
    void presentQuestion(questionIndex.value + 1)
  } else {
    interruptVoice()
    stage.value = 'verify'
    if (voiceMode.value) void voice.speak(VERIFY_SPOKEN)
  }
  return true
}

function goBack() {
  interruptVoice()
  statusText.value = ''
  if (stage.value === 'ask' && questionIndex.value > 0) {
    void presentQuestion(questionIndex.value - 1)
  } else {
    stage.value = 'intro'
    voiceMode.value = false
  }
}

function useDifferentEmail() {
  interruptVoice()
  stage.value = 'ask'
  void presentQuestion(1)
}

// ── Verify + provisioning ────────────────────────────────────────────────
const checklist = ref(PROVISIONING_STEPS.map(label => ({ label, done: false })))
const newAccountId = ref('')
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
  timers.forEach(t => clearTimeout(t))
  timers = []
}

function startProvisioning() {
  interruptVoice()
  stage.value = 'provisioning'
  checklist.value = PROVISIONING_STEPS.map(label => ({ label, done: false }))
  if (voiceMode.value) void voice.speak(PROVISIONING_SPOKEN)

  const payload: TrialSignupPayload = {
    firstName: firstName.value,
    lastName: lastName.value,
    email: answers.value.email,
    companyName: answers.value.company,
  }
  newAccountId.value = plg.createTrialAccount(payload)

  clearTimers()
  PROVISIONING_STEPS.forEach((_, i) => {
    timers.push(setTimeout(() => {
      checklist.value[i]!.done = true
      if (i === PROVISIONING_STEPS.length - 1) {
        timers.push(setTimeout(() => {
          stage.value = 'success'
          if (voiceMode.value) void voice.speak(`Done — welcome to Maropost, ${firstName.value}.`)
        }, 400))
      }
    }, (i + 1) * 700))
  })
}

onUnmounted(() => {
  clearTimers()
  ++flowToken
  // Guarded teardown: never clobber a mic session another surface (e.g. the
  // Da Vinci experience we just handed off to) may have started.
  if (voice.owner.value === 'signup' || voice.owner.value === null) {
    voice.abortListening()
    voice.cancelSpeech()
  }
})

// ── Success ──────────────────────────────────────────────────────────────
function enterMaropost() {
  accounts.switchTo(newAccountId.value)
  profile.setName(`${firstName.value} ${lastName.value}`)
  daVinciOnboarding.reset(newAccountId.value)
  daVinciOnboarding.begin(newAccountId.value, { restart: true, freshAccount: true })
  router.push({
    name: 'DaVinciExperience',
    params: { accountId: newAccountId.value },
    query: {
      onboarding: 'campaign',
      // Mic already granted + audio unlocked in this document → the experience
      // can skip its consent screen and start speaking right away.
      ...(voiceMode.value && !micDenied.value ? { voice: 'granted' } : {}),
    },
  })
}
</script>

<template>
  <div class="plg-signup">
    <a class="plg-signup__wordmark" href="/main-landing/">MAROPOST</a>
    <a class="plg-signup__back" href="/main-landing/">← Back to site</a>

    <div class="plg-signup__backdrop" aria-hidden="true">
      <DvOrbCanvas :state="orbState" :audio-source="voice.getVoiceFrame" />
    </div>

    <!-- Luminous light pools the glass pane refracts -->
    <div class="dv-aura" aria-hidden="true">
      <div class="dv-aura__blob dv-aura__blob--violet"></div>
      <div class="dv-aura__blob dv-aura__blob--blue"></div>
      <div class="dv-aura__blob dv-aura__blob--cyan"></div>
    </div>


    <div
      v-if="stage === 'ask'"
      class="plg-signup__progress"
      :aria-label="`Question ${questionIndex + 1} of ${QUESTIONS.length}`"
    >
      {{ questionIndex + 1 }} / {{ QUESTIONS.length }}
    </div>

    <div class="plg-signup__center">
      <transition name="plg-fade" mode="out-in" @after-enter="inputEl?.focus()">
        <!-- Stage — Intro: meet Da Vinci, one tap doubles as consent + audio unlock -->
        <div v-if="stage === 'intro'" key="intro" class="plg-signup__stage dv-glass-field text-center">
          <h1 class="plg-signup__question">Meet Da Vinci.</h1>
          <p class="plg-signup__lede">
            Your AI assistant sets up your account.
            <template v-if="voice.sttSupported"> Speak your answers — or type them.</template>
          </p>

          <div class="d-flex flex-column align-center">
            <v-btn
              variant="flat"
              size="large"
              class="text-none plg-signup__primary plg-signup__cta"
              @click="voice.sttSupported ? beginVoice() : beginTyped()"
            >
              {{ voice.sttSupported ? 'Tap to begin' : 'Get started' }}
            </v-btn>
            <v-btn
              v-if="voice.sttSupported"
              variant="text"
              class="text-none mt-2 plg-signup__quiet"
              @click="beginTyped"
            >
              I’d rather type
            </v-btn>
          </div>

          <p class="plg-signup__consent">
            <template v-if="voice.sttSupported">
              Uses your microphone only while a question is open — type instead at any time.
              Audio is processed by your browser’s speech service.
            </template>
            <template v-else>
              Voice isn’t available in this browser — typing works the same.
            </template>
          </p>

          <div class="plg-signup__switch">
            Already have an account? <a href="/main-landing/login.html">Log in</a>
          </div>
        </div>

        <!-- Stage — Ask: one question per screen, speak or type -->
        <div v-else-if="stage === 'ask'" :key="`q-${questionIndex}`" class="plg-signup__stage dv-glass-field">
          <div aria-live="polite">
            <h1 class="plg-signup__question">{{ currentQuestion.question }}</h1>
          </div>

          <input
            ref="inputEl"
            class="plg-signup__answer"
            :class="{ 'plg-signup__answer--interim': askState === 'listening' && voice.interimTranscript.value }"
            :type="currentQuestion.inputType"
            :placeholder="currentQuestion.placeholder"
            :autocomplete="currentQuestion.autocomplete"
            :value="displayValue"
            :aria-label="currentQuestion.question"
            :aria-describedby="fieldError ? 'plg-answer-error' : undefined"
            @input="onInput"
            @keydown="onInputKeydown"
          />
          <p v-if="fieldError" id="plg-answer-error" class="plg-signup__error" role="alert">
            {{ fieldError }}
          </p>

          <div class="plg-signup__actions">
            <v-btn variant="text" class="text-none plg-signup__quiet" @click="goBack">Back</v-btn>
            <div class="d-flex align-center gap-3">
              <span class="plg-signup__hint">press Enter ↵</span>
              <v-btn
                variant="flat"
                class="text-none plg-signup__primary"
                @click="commitDisplayed(); submitAnswer()"
              >
                {{ isLastQuestion ? 'Continue' : 'Next' }}
              </v-btn>
            </div>
          </div>

          <div class="plg-signup__voice">
            <DvOrbitMicBar
              v-if="showMic"
              :mic-size="50"
              :ripple="askState === 'listening' || askState === 'reviewing'"
              ghost="none"
              :mic-label="micLabel"
              @mic="onMicTap"
            />
            <p class="plg-signup__status" aria-live="polite">{{ statusText }}</p>
          </div>
        </div>

        <!-- Stage — Verify email -->
        <div v-else-if="stage === 'verify'" key="verify" class="plg-signup__stage dv-glass-field text-center">
          <h1 class="plg-signup__question">Check your inbox.</h1>
          <p class="plg-signup__lede">
            I sent a verification link to <strong class="text-high-emphasis">{{ answers.email }}</strong>.
          </p>

          <div class="d-flex flex-column align-center">
            <v-btn
              variant="flat"
              size="large"
              class="text-none plg-signup__primary plg-signup__cta"
              @click="startProvisioning"
            >
              Simulate clicking the verification link
            </v-btn>
            <v-btn variant="text" class="text-none mt-2 plg-signup__quiet" @click="useDifferentEmail">
              Use a different email
            </v-btn>
          </div>

          <p class="plg-signup__consent">Demo shortcut — in production this arrives by email.</p>
        </div>

        <!-- Stage — Provisioning -->
        <div v-else-if="stage === 'provisioning'" key="provisioning" class="plg-signup__stage dv-glass-field text-center">
          <h1 class="plg-signup__question">Building your workspace.</h1>

          <div class="plg-signup__checklist" role="status">
            <div v-for="(item, i) in checklist" :key="i" class="plg-signup__checklist-row">
              <span class="plg-signup__checklist-status">
                <v-progress-circular v-if="!item.done" indeterminate size="16" width="2" color="primary" />
                <v-icon v-else size="18" color="success">check</v-icon>
              </span>
              <span :class="item.done ? 'text-high-emphasis' : 'text-medium-emphasis'">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <!-- Stage — Success -->
        <div v-else key="success" class="plg-signup__stage dv-glass-field text-center">
          <h1 class="plg-signup__question">You’re in, {{ firstName }}!</h1>
          <p class="plg-signup__lede">Your 14-day trial of all three clouds is ready.</p>

          <v-btn
            variant="flat"
            size="large"
            class="text-none plg-signup__primary plg-signup__cta"
            @click="enterMaropost"
          >
            Enter Maropost
          </v-btn>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
/* Visual language mirrors public/main-landing/login.html — the page users
   arrive from — so landing → signup → onboarding reads as one surface. */
.plg-signup {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  /* the diffusion layers overhang the stage by 90px — keep that off the x-axis */
  overflow-x: hidden;
  background: var(--plg-bg);
  --plg-bg: #ffffff;
  --plg-ink: #1c1f24;
  --plg-ink-contrast: #ffffff;
  --plg-ink-hover: #000000;
  --plg-dim: #8b929c;
  --plg-line: rgba(24, 27, 33, 0.14);
  --plg-field: #fcfcfd;
  --plg-accent: #1877f2;
  --plg-text-shadow: rgba(24, 27, 33, 0.05);
}

/* Themes here are maropostLight/maropostDark, so `.v-theme--dark` never matched —
   useAppTheme sets documentElement.dataset.theme, which is what the app uses. */
[data-theme='dark'] .plg-signup {
  --plg-bg: rgb(var(--v-theme-background));
  --plg-ink: #eef1f5;
  --plg-ink-contrast: #14161a;
  --plg-ink-hover: #ffffff;
  --plg-line: rgba(255, 255, 255, 0.18);
  --plg-field: rgba(255, 255, 255, 0.05);
  --plg-text-shadow: rgba(0, 0, 0, 0.22);
}

/* Fixed chrome — wordmark top-left, back link top-right, as on login.html */
.plg-signup__wordmark {
  position: fixed;
  top: 27px;
  left: clamp(22px, 4vw, 48px);
  z-index: 6;
  font-weight: 800;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--plg-ink);
  text-decoration: none;
}

.plg-signup__back {
  position: fixed;
  top: 30px;
  right: clamp(22px, 4vw, 48px);
  z-index: 6;
  color: var(--plg-dim);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.18s;
}
.plg-signup__back:hover {
  color: var(--plg-ink);
}

/* Orb backdrop — same engine the landing/login pages mount */
.plg-signup__backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Minimal progress mark — replaces the wizard stepper */
.plg-signup__progress {
  position: fixed;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  color: var(--plg-dim);
}

.plg-signup__center {
  position: relative;
  z-index: 1;
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 88px 24px 48px;
}

/* Sizing only — the frost + aura come from .dv-glass-field / .dv-aura in
   src/styles/dv-diffusion.css */
.plg-signup__stage {
  width: min(640px, 92vw);
  display: flex;
  flex-direction: column;
  padding: clamp(28px, 4vw, 46px);
}

.plg-signup__stage.text-center {
  align-items: center;
}

/* Typeform-scale question typography — medium weight, with a very light diffuse
   shadow so it lifts off the glass. */
.plg-signup__question {
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 14px;
  text-shadow: 0 2px 10px var(--plg-text-shadow);
}

.plg-signup__lede {
  font-size: clamp(15px, 1.8vw, 17px);
  color: var(--plg-dim);
  margin-bottom: 28px;
  max-width: 44ch;
}

/* Single bold underline input — no card, no field chrome */
.plg-signup__answer {
  width: 100%;
  margin-top: 12px;
  padding: 6px 2px 10px;
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 500;
  color: var(--plg-ink);
  background: transparent;
  border: 0;
  border-bottom: 2px solid var(--plg-line);
  border-radius: 0;
  outline: none;
  transition: border-color 0.18s;
}
.plg-signup__answer:focus {
  border-bottom-color: var(--plg-ink);
}
.plg-signup__answer::placeholder {
  color: var(--plg-dim);
  opacity: 0.6;
}
.plg-signup__answer--interim {
  color: var(--plg-dim);
}

.plg-signup__error {
  margin-top: 10px;
  font-size: 14px;
  color: rgb(var(--v-theme-error));
}

.plg-signup__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;
}

.plg-signup__hint {
  font-size: 12px;
  color: var(--plg-dim);
}

/* Mic + status live in a fixed-height block so the layout never jumps */
.plg-signup__voice {
  min-height: 108px;
  margin-top: 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.plg-signup__status {
  min-height: 20px;
  font-size: 13px;
  color: var(--plg-dim);
  text-align: center;
}

.plg-signup__consent {
  margin-top: 26px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--plg-dim);
  max-width: 46ch;
}

/* Primary CTA — near-black ink, matching login.html's .primary */
.plg-signup__primary {
  background: var(--plg-ink) !important;
  color: var(--plg-ink-contrast) !important;
  /* !important: the global button skin pill-rounds v-btn */
  border-radius: 7px !important;
  font-weight: 600;
  letter-spacing: 0;
}
.plg-signup__primary:hover {
  background: var(--plg-ink-hover) !important;
}

.plg-signup__cta {
  min-width: 220px;
}

.plg-signup__quiet {
  color: var(--plg-dim);
}

.plg-signup__switch {
  text-align: center;
  margin-top: 28px;
  font-size: 13.5px;
  color: var(--plg-dim);
}
.plg-signup__switch a {
  color: var(--plg-accent);
  text-decoration: none;
  font-weight: 600;
}
.plg-signup__switch a:hover {
  text-decoration: underline;
}

.plg-signup__checklist {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
  margin-top: 8px;
}

.plg-signup__checklist-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
}

.plg-signup__checklist-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}

.plg-fade-enter-active,
.plg-fade-leave-active {
  transition: opacity 0.15s ease;
}
.plg-fade-enter-from,
.plg-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .plg-fade-enter-active,
  .plg-fade-leave-active {
    transition: none;
  }
}

@media (prefers-contrast: more) {
  .plg-signup__answer {
    border-bottom-color: var(--plg-ink);
  }
}
</style>
