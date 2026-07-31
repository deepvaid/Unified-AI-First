<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import DvOrbCanvas from '@/components/copilot/voice/DvOrbCanvas.vue'
import DvCampaignOnboardingCard from '@/components/copilot/DvCampaignOnboardingCard.vue'
import { useDaVinciVoice, VoiceError } from '@/composables/useDaVinciVoice'
import { useDaVinciSetupOnboarding, type SetupOnboardingResponse } from '@/composables/useDaVinciSetupOnboarding'
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'
import { useCopilotStore, type ChatMessage, type SetupOnboardingProps } from '@/stores/useCopilot'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'
import type { DaVinciOnboardingStage } from '@/stores/useDaVinciOnboarding'
import { useOnboardingStore } from '@/stores/useOnboarding'
import { useUserProfile } from '@/stores/useUserProfile'
import welcomeIllustration from '@/assets/davinci/onboarding/welcome.png'
import emailIllustration from '@/assets/davinci/onboarding/email.png'
import audienceIllustration from '@/assets/davinci/onboarding/audience.png'
import storeIllustration from '@/assets/davinci/onboarding/store.png'
import completeIllustration from '@/assets/davinci/onboarding/complete.png'

const route = useRoute()
const router = useRouter()
const voice = useDaVinciVoice()
const guide = useDaVinciSetupOnboarding()
const onboarding = useDaVinciOnboardingStore()
const setup = useOnboardingStore()
const profile = useUserProfile()
const copilot = useCopilotStore()
const { messages } = storeToRefs(copilot)

const accountId = computed(() => String(Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId ?? ''))
const session = computed(() => onboarding.activeSession)
const stage = computed(() => session.value?.stage ?? 'welcome')
const inputMode = computed(() => session.value?.inputMode ?? null)
const entryVisible = computed(() => stage.value === 'welcome' || stage.value === 'voice-consent')
const goalVisible = computed(() => stage.value === 'goal-discovery')
const activeTaskVisible = computed(() => !entryVisible.value && !goalVisible.value)
const latestAssistant = computed(() => [...messages.value].reverse().find((message) => message.role === 'assistant')?.text ?? '')
const latestCard = computed<SetupOnboardingProps | null>(() => {
  const component = [...messages.value].reverse()
    .flatMap((message) => message.componentData ?? [])
    .find((item) => item.type === 'setupOnboarding' || item.type === 'campaignOnboarding')
  return component?.props as SetupOnboardingProps | null ?? null
})

const imageForTask = computed(() => {
  if (stage.value === 'milestone-complete' || stage.value === 'complete') return completeIllustration
  const key = guide.currentTask.value?.illustrationKey
  if (key === 'email') return emailIllustration
  if (key === 'audience') return audienceIllustration
  if (key === 'store') return storeIllustration
  return welcomeIllustration
})

const title = computed(() => {
  if (entryVisible.value) return `Meet Da Vinci, ${profile.firstName || 'your AI guide'}`
  if (goalVisible.value) return session.value?.goal === 'both' && !session.value?.bothFirst
    ? 'Which milestone goes live first?'
    : 'What do you want to launch?'
  if (stage.value === 'plan-ready') return 'Your setup path'
  if (stage.value === 'complete' || stage.value === 'milestone-complete') return 'Milestone complete'
  return guide.currentTask.value?.title ?? 'Your setup path'
})

const subtitle = computed(() => {
  if (entryVisible.value) return 'Tell Da Vinci your goal. It will guide one setup task at a time while you stay in control.'
  if (goalVisible.value) return 'Your answer shapes the order of the setup path.'
  return latestAssistant.value
})

const historyOpen = ref(false)
const permissionOpen = ref(false)
const textComposerOpen = ref(false)
const inputText = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const pendingVoiceTranscript = ref('')
const originalVoiceTranscript = ref('')
const voiceError = ref('')
const liveVoice = ref(false)
const consentReturnStage = ref<DaVinciOnboardingStage | null>(null)
const silentTurns = ref(0)
let listenToken = 0

const liveCaption = computed(() => {
  if (pendingVoiceTranscript.value) return pendingVoiceTranscript.value
  if (voice.interimTranscript.value) return maskSensitive(voice.interimTranscript.value)
  if (voice.state.value === 'listening') return 'Listening…'
  if (voice.state.value === 'thinking') return 'Thinking…'
  if (voice.state.value === 'speaking') return latestAssistant.value
  return inputMode.value === 'voice' ? 'Microphone ready' : 'Type or switch to voice anytime'
})

const voiceStateLabel = computed(() => {
  if (voiceError.value) return 'Voice unavailable'
  if (voice.state.value === 'listening') return 'Listening'
  if (voice.state.value === 'speaking') return 'Da Vinci is speaking'
  if (voice.state.value === 'thinking') return 'Thinking'
  if (inputMode.value === 'voice') return 'Voice ready'
  return 'Microphone off'
})

function id(prefix: string) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}` }

function maskSensitive(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email hidden]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[number hidden]')
    .replace(/\b(?:api[_ -]?key|password|secret)\s*[:=]?\s*\S+/gi, '[sensitive detail hidden]')
}

function appendMessage(message: ChatMessage) {
  messages.value.push(message)
  copilot.chatMode = true
}

function appendResponse(response: SetupOnboardingResponse) {
  appendMessage({
    id: id('assistant'), role: 'assistant', text: response.reply,
    componentData: response.onboardingCard
      ? [{ type: 'setupOnboarding', props: response.onboardingCard }]
      : undefined,
  })
}

async function present(response: SetupOnboardingResponse, speak = inputMode.value === 'voice' && liveVoice.value) {
  appendResponse(response)
  if (!speak) return
  await voice.speak(response.speech ?? response.reply)
  if (liveVoice.value && inputMode.value === 'voice') void listenOnce()
}

async function selectText() {
  listenToken++
  liveVoice.value = false
  voice.abortListening()
  voice.cancelSpeech()
  onboarding.setInputMode('text')
  textComposerOpen.value = true
  permissionOpen.value = false
  trackDaVinciOnboardingEvent('entry_mode_selected', accountId.value, { mode: 'text' })
  const returning = consentReturnStage.value
  if (returning) onboarding.setStage(returning)
  consentReturnStage.value = null
  const response = !returning && (stage.value === 'welcome' || stage.value === 'voice-consent')
    ? guide.start(accountId.value, 'text') : guide.resume()
  await present(response, false)
  await nextTick()
  inputEl.value?.focus()
}

function openVoiceConsent() {
  if (!voice.sttSupported) {
    voiceError.value = 'Speech recognition is not available in this browser. You can use the same setup path by typing.'
    void selectText()
    return
  }
  consentReturnStage.value = stage.value === 'welcome' || stage.value === 'voice-consent' ? null : stage.value
  onboarding.setStage('voice-consent')
  permissionOpen.value = true
}

function closeVoiceConsent() {
  permissionOpen.value = false
  onboarding.setStage(consentReturnStage.value ?? 'welcome')
  consentReturnStage.value = null
}

async function allowVoice() {
  voiceError.value = ''
  trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: 'requested' })
  try {
    voice.unlockSpeech()
    await voice.requestMicrophonePermission()
    trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: 'allowed' })
    trackDaVinciOnboardingEvent('entry_mode_selected', accountId.value, { mode: 'voice' })
    onboarding.setInputMode('voice')
    permissionOpen.value = false
    liveVoice.value = true
    const returning = consentReturnStage.value
    if (returning) onboarding.setStage(returning)
    consentReturnStage.value = null
    const response = returning ? guide.resume() : guide.start(accountId.value, 'voice')
    await present(response, true)
  } catch (error) {
    const code = error instanceof VoiceError ? error.code : 'unknown'
    trackDaVinciOnboardingEvent('microphone_permission', accountId.value, { outcome: code })
    voiceError.value = code === 'permission'
      ? 'Microphone permission was denied. Your setup is preserved; continue by typing.'
      : 'Voice could not start. Your setup is preserved; continue by typing.'
    await selectText()
  }
}

async function listenOnce() {
  if (!liveVoice.value || inputMode.value !== 'voice' || pendingVoiceTranscript.value) return
  const token = ++listenToken
  voiceError.value = ''
  try {
    const transcript = await voice.startListening({ owner: 'setup-experience', withAnalyser: true })
    if (token !== listenToken || !liveVoice.value) return
    if (!transcript.trim()) {
      silentTurns.value += 1
      if (silentTurns.value === 1) {
        await voice.speak('I did not hear anything. Try once more, or choose type instead.')
        if (token === listenToken) void listenOnce()
      } else {
        trackDaVinciOnboardingEvent('voice_to_text_fallback', accountId.value, { reason: 'silence' })
        voiceError.value = 'I still couldn’t hear you. Continue by typing, or tap the microphone to retry.'
        await selectText()
      }
      return
    }
    silentTurns.value = 0
    originalVoiceTranscript.value = maskSensitive(transcript.trim())
    pendingVoiceTranscript.value = originalVoiceTranscript.value
  } catch (error) {
    if (token !== listenToken) return
    const code = error instanceof VoiceError ? error.code : 'unknown'
    const partialTranscript = error instanceof VoiceError ? maskSensitive(error.transcript) : ''
    if (partialTranscript) {
      originalVoiceTranscript.value = partialTranscript
      pendingVoiceTranscript.value = partialTranscript
    }
    voiceError.value = code === 'network'
      ? `The voice service lost its connection. ${partialTranscript ? 'Check the transcript below, or ' : ''}continue by typing.`
      : 'Voice is unavailable right now. Continue by typing.'
    trackDaVinciOnboardingEvent('voice_to_text_fallback', accountId.value, { reason: code })
    await selectText()
  }
}

async function processText(text: string) {
  const clean = maskSensitive(text.trim())
  if (!clean) return
  appendMessage({ id: id('user'), role: 'user', text: clean })
  voice.setThinking(true)
  const response = guide.handleText(clean)
  voice.setThinking(false)
  if (response) await present(response)
  else {
    const paused = guide.consumePauseNotice()
    if (paused) await present(paused, false)
  }
}

async function submitText() {
  const text = inputText.value
  inputText.value = ''
  await processText(text)
}

async function acceptTranscript() {
  const text = pendingVoiceTranscript.value
  if (text !== originalVoiceTranscript.value) {
    trackDaVinciOnboardingEvent('transcript_corrected', accountId.value, { corrected: true })
  }
  pendingVoiceTranscript.value = ''
  originalVoiceTranscript.value = ''
  await processText(text)
}

function retryTranscript() {
  pendingVoiceTranscript.value = ''
  originalVoiceTranscript.value = ''
  void listenOnce()
}

async function chooseGoal(action: string, label: string) {
  appendMessage({ id: id('user'), role: 'user', text: label })
  const response = guide.handleAction(action)
  if (response) await present(response)
}

async function handleCardAction(action: string) {
  const routeName = guide.routeForAction(action)
  if (routeName) {
    if (action.startsWith('open-task:')) guide.markHandoff(action)
    if (action === 'explore-dashboard') {
      if (stage.value === 'milestone-complete') {
        onboarding.complete()
        trackDaVinciOnboardingEvent('onboarding_completed', accountId.value, { goal: session.value?.goal ?? null })
      }
      else onboarding.setPaused(true)
    }
    copilot.beginOnboarding(accountId.value)
    copilot.queueResume('I’m here with the same setup task. Ask what this page means, or tell me when you are done.')
    copilot.open()
    await router.push({
      name: routeName,
      params: { accountId: accountId.value },
      query: action.startsWith('open-task:') ? { source: 'davinci-setup' } : undefined,
    })
    return
  }
  const response = guide.handleAction(action)
  if (response) await present(response)
}

function toggleMic() {
  if (voice.state.value === 'speaking') {
    voice.cancelSpeech()
    void listenOnce()
    return
  }
  if (voice.state.value === 'listening') {
    voice.stopListening()
    return
  }
  if (inputMode.value !== 'voice') openVoiceConsent()
  else void listenOnce()
}

function closeExperience() {
  onboarding.setPaused(true)
  void router.push({ name: 'Dashboard', params: { accountId: accountId.value } })
}

onMounted(() => {
  setup.activateAccount(accountId.value)
  const current = onboarding.begin(accountId.value)
  copilot.beginOnboarding(accountId.value)
  trackDaVinciOnboardingEvent('onboarding_viewed', accountId.value, { entry: route.query.onboarding === 'setup' ? 'registration' : 'voluntary' })
  trackDaVinciOnboardingEvent('choice_screen_viewed', accountId.value)
  if (current.stage !== 'welcome' && current.stage !== 'voice-consent' && messages.value.length === 0) {
    appendResponse(guide.resume())
  }
})

onBeforeUnmount(() => {
  listenToken++
  voice.disposeVoice()
})
</script>

<template>
  <main class="setup-experience">
    <header class="setup-experience__header">
      <div class="setup-experience__brand">MAROPOST <span>DA VINCI</span></div>
      <div class="d-flex align-center ga-1">
        <v-btn icon="history" variant="text" size="small" aria-label="Open conversation history" @click="historyOpen = true" />
        <v-btn icon="x" variant="text" size="small" aria-label="Explore Maropost" @click="closeExperience" />
      </div>
    </header>

    <section class="setup-experience__canvas" aria-labelledby="setup-title">
      <div class="setup-experience__visual" :class="{ 'setup-experience__visual--complete': stage === 'milestone-complete' }">
        <DvOrbCanvas :state="voice.state.value" :audio-source="voice.getVoiceFrame" class="setup-experience__orb" />
        <img :src="imageForTask" alt="" class="setup-experience__illustration" />
      </div>

      <div class="setup-experience__content">
        <div v-if="activeTaskVisible && guide.currentTask.value" class="setup-experience__progress">
          <span>Step {{ guide.progressFor().step }} of {{ guide.progressFor().total }}</span>
          <v-progress-linear :model-value="(guide.progressFor().step / guide.progressFor().total) * 100" rounded height="4" />
        </div>

        <p class="setup-experience__eyebrow">YOUR AI SETUP GUIDE</p>
        <h1 id="setup-title">{{ title }}</h1>
        <p class="setup-experience__subtitle">{{ subtitle }}</p>

        <div v-if="entryVisible" class="setup-experience__entry-actions">
          <v-btn color="primary" size="x-large" rounded="lg" prepend-icon="mic" class="text-none" :disabled="!voice.sttSupported" @click="openVoiceConsent">
            Start with voice
          </v-btn>
          <v-btn variant="outlined" size="large" rounded="lg" prepend-icon="keyboard" class="text-none" @click="selectText">
            Type instead
          </v-btn>
          <v-btn variant="text" size="small" class="text-none text-medium-emphasis" @click="closeExperience">
            Explore Maropost
          </v-btn>
          <p class="setup-experience__privacy"><v-icon size="14">mic-off</v-icon> Microphone off until you choose voice</p>
          <p v-if="!voice.sttSupported" class="setup-experience__privacy">Voice input is unavailable in this browser. Typing follows the same path.</p>
        </div>

        <div v-else-if="goalVisible" class="setup-experience__goals">
          <template v-if="session?.goal === 'both' && !session?.bothFirst">
            <button type="button" class="setup-goal" @click="chooseGoal('both-marketing-first', 'Launch marketing first')">
              <v-icon>mail</v-icon><span><strong>Marketing first</strong><small>Build the audience and launch an email</small></span><v-icon>arrow-right</v-icon>
            </button>
            <button type="button" class="setup-goal" @click="chooseGoal('both-store-first', 'Launch my store first')">
              <v-icon>store</v-icon><span><strong>Store first</strong><small>Add products and prepare checkout</small></span><v-icon>arrow-right</v-icon>
            </button>
          </template>
          <template v-else>
            <button type="button" class="setup-goal" @click="chooseGoal('goal-marketing', 'Launch email marketing')">
              <v-icon>mail</v-icon><span><strong>Launch email marketing</strong><small>Domain, contacts, email, campaign</small></span><v-icon>arrow-right</v-icon>
            </button>
            <button type="button" class="setup-goal" @click="chooseGoal('goal-store', 'Build my online store')">
              <v-icon>store</v-icon><span><strong>Build my online store</strong><small>Products, payments, shipping, theme</small></span><v-icon>arrow-right</v-icon>
            </button>
            <button type="button" class="setup-goal" @click="chooseGoal('goal-both', 'Set up both')">
              <v-icon>sparkles</v-icon><span><strong>Set up both</strong><small>Choose which milestone goes live first</small></span><v-icon>arrow-right</v-icon>
            </button>
          </template>
        </div>

        <DvCampaignOnboardingCard
          v-else-if="latestCard"
          v-bind="latestCard"
          class="setup-experience__task-card"
          @action="handleCardAction"
        />
      </div>
    </section>

    <div v-if="!entryVisible" class="setup-experience__voicebar" :class="`is-${voice.state.value}`">
      <div class="setup-experience__caption" aria-live="polite">
        <span class="setup-experience__state-dot"></span>
        <span>{{ voiceStateLabel }}</span>
        <strong>{{ liveCaption }}</strong>
      </div>

      <div v-if="pendingVoiceTranscript" class="setup-experience__transcript-review">
        <v-text-field v-model="pendingVoiceTranscript" label="Check what Da Vinci heard" density="compact" hide-details autofocus />
        <v-btn color="primary" size="small" class="text-none" @click="acceptTranscript">Use transcript</v-btn>
        <v-btn variant="text" size="small" class="text-none" @click="retryTranscript">Try again</v-btn>
      </div>

      <form v-else-if="textComposerOpen || inputMode === 'text'" class="setup-experience__composer" @submit.prevent="submitText">
        <v-text-field ref="inputEl" v-model="inputText" aria-label="Message Da Vinci" placeholder="Tell Da Vinci what you want to do…" density="comfortable" hide-details autocomplete="off" />
        <v-btn type="submit" icon="arrow-up" color="primary" size="small" aria-label="Send message" :disabled="!inputText.trim()" />
        <v-btn icon="mic" variant="text" size="small" aria-label="Switch to voice" @click="openVoiceConsent" />
      </form>

      <div v-else class="setup-experience__voice-controls">
        <v-btn :icon="voice.state.value === 'speaking' ? 'audio-lines' : 'mic'" color="primary" size="large" :aria-label="voice.state.value === 'speaking' ? 'Interrupt Da Vinci' : 'Start listening'" @click="toggleMic" />
        <v-btn icon="keyboard" variant="text" aria-label="Type instead" @click="selectText" />
        <v-btn :icon="voice.muted.value ? 'volume-x' : 'volume-2'" variant="text" :aria-label="voice.muted.value ? 'Unmute Da Vinci' : 'Mute Da Vinci'" @click="voice.setMuted(!voice.muted.value)" />
      </div>
      <p v-if="voiceError" class="setup-experience__error" role="alert">{{ voiceError }}</p>
    </div>

    <v-dialog v-model="permissionOpen" max-width="480" persistent>
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="d-flex align-center justify-space-between">
          <h2 class="text-h6">Use voice with Da Vinci</h2>
          <v-btn icon="x" variant="text" size="small" aria-label="Close microphone explanation" @click="closeVoiceConsent" />
        </v-card-title>
        <v-card-text>
          <div class="setup-experience__permission-icon"><v-icon size="28">mic</v-icon></div>
          <p>Da Vinci listens only while the microphone shows <strong>Listening</strong>. A live caption stays visible, and you can interrupt or switch to typing at any time.</p>
          <p class="text-body-2 text-medium-emphasis mb-0">Raw audio is not retained. Your transcript and setup progress may be saved to this account.</p>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-btn color="primary" variant="flat" class="text-none" @click="allowVoice">Continue</v-btn>
          <v-btn variant="text" class="text-none" @click="selectText">Type instead</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="historyOpen" width="560" scrollable>
      <v-card rounded="xl" max-height="76vh">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Conversation</span><v-btn icon="x" variant="text" size="small" aria-label="Close conversation" @click="historyOpen = false" />
        </v-card-title>
        <v-card-text class="setup-experience__history">
          <div v-if="!messages.length" class="text-body-2 text-medium-emphasis">Your conversation will appear here.</div>
          <div v-for="message in messages" :key="message.id" class="setup-history-message" :class="`is-${message.role}`">
            <small>{{ message.role === 'assistant' ? 'Da Vinci' : 'You' }}</small>
            <p>{{ message.text }}</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </main>
</template>

<style scoped>
.setup-experience { --dvx-ink: #172036; min-height: 100vh; color: var(--dvx-ink); background: radial-gradient(circle at 12% 15%, rgba(119, 224, 214, .15), transparent 28%), radial-gradient(circle at 88% 5%, rgba(151, 132, 248, .13), transparent 30%), #fbfcff; display: flex; flex-direction: column; }
.setup-experience__header { height: 68px; padding: 0 clamp(20px, 4vw, 56px); display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 4; }
.setup-experience__brand { font-size: 13px; font-weight: 800; letter-spacing: .12em; }
.setup-experience__brand span { color: rgb(var(--v-theme-primary)); margin-left: 8px; font-weight: 650; }
.setup-experience__canvas { width: min(1180px, calc(100% - 40px)); flex: 1; margin: 0 auto; padding: clamp(12px, 3vh, 38px) 0 150px; display: grid; grid-template-columns: minmax(320px, .9fr) minmax(360px, 1fr); align-items: center; gap: clamp(28px, 6vw, 84px); }
.setup-experience__visual { position: relative; min-height: 460px; display: grid; place-items: center; }
.setup-experience__orb { position: absolute; inset: 0; opacity: .62; }
.setup-experience__illustration { position: relative; z-index: 1; width: min(88%, 460px); max-height: 420px; object-fit: contain; filter: drop-shadow(0 24px 32px rgba(45, 61, 92, .14)); }
.setup-experience__visual--complete .setup-experience__illustration { width: min(76%, 390px); }
.setup-experience__content { max-width: 560px; }
.setup-experience__eyebrow { margin: 0 0 10px; color: rgb(var(--v-theme-primary)); font-size: 11px; font-weight: 800; letter-spacing: .14em; }
.setup-experience h1 { margin: 0; max-width: 660px; font-size: clamp(36px, 4.7vw, 62px); line-height: 1.02; letter-spacing: -.05em; font-weight: 730; }
.setup-experience__subtitle { margin: 18px 0 0; max-width: 570px; color: #5d6679; font-size: clamp(16px, 1.6vw, 19px); line-height: 1.55; }
.setup-experience__entry-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; margin-top: 30px; }
.setup-experience__privacy { display: flex; gap: 7px; align-items: center; margin: 4px 0 0; font-size: 12px; color: #737c8d; }
.setup-experience__goals { display: grid; gap: 10px; margin-top: 26px; }
.setup-goal { width: 100%; display: grid; grid-template-columns: 38px 1fr 24px; align-items: center; gap: 12px; padding: 15px 16px; border: 1px solid #e1e5ed; border-radius: 16px; background: rgba(255, 255, 255, .82); text-align: left; color: inherit; cursor: pointer; transition: border-color .16s, transform .16s, box-shadow .16s; }
.setup-goal:hover, .setup-goal:focus-visible { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 12px 28px rgba(37, 71, 120, .09); transform: translateY(-1px); outline: none; }
.setup-goal > :first-child { color: rgb(var(--v-theme-primary)); }
.setup-goal span { display: grid; gap: 2px; }
.setup-goal strong { font-size: 15px; }
.setup-goal small { color: #70798a; font-size: 12px; }
.setup-experience__progress { width: min(360px, 100%); margin-bottom: 24px; color: #697285; font-size: 12px; display: grid; gap: 7px; }
.setup-experience__task-card { margin-top: 25px; max-width: 520px; box-shadow: 0 18px 50px rgba(35, 51, 85, .07); }
.setup-experience__voicebar { position: fixed; z-index: 8; left: 50%; bottom: 18px; transform: translateX(-50%); width: min(720px, calc(100% - 28px)); padding: 10px 14px; border: 1px solid rgba(197, 204, 216, .8); border-radius: 20px; background: rgba(255, 255, 255, .9); backdrop-filter: blur(18px); box-shadow: 0 18px 52px rgba(32, 46, 75, .16); }
.setup-experience__caption { display: grid; grid-template-columns: 8px auto 1fr; align-items: center; gap: 8px; min-height: 26px; color: #727b8d; font-size: 11px; }
.setup-experience__caption strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #313a4d; font-weight: 550; }
.setup-experience__state-dot { width: 7px; height: 7px; border-radius: 50%; background: #9aa2b0; }
.is-listening .setup-experience__state-dot { background: #12a594; box-shadow: 0 0 0 5px rgba(18, 165, 148, .12); }
.is-speaking .setup-experience__state-dot { background: #7967df; }
.setup-experience__voice-controls { display: flex; justify-content: center; align-items: center; gap: 8px; padding-top: 4px; }
.setup-experience__composer, .setup-experience__transcript-review { display: flex; align-items: center; gap: 8px; padding-top: 5px; }
.setup-experience__composer :deep(.v-input), .setup-experience__transcript-review :deep(.v-input) { flex: 1; }
.setup-experience__error { margin: 6px 2px 0; color: #b33b52; font-size: 12px; text-align: center; }
.setup-experience__permission-icon { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), .09); margin-bottom: 16px; }
.setup-experience__history { display: grid; gap: 14px; }
.setup-history-message { max-width: 86%; }
.setup-history-message.is-user { justify-self: end; }
.setup-history-message small { display: block; margin: 0 0 4px; color: #7a8394; }
.setup-history-message p { margin: 0; padding: 10px 12px; border-radius: 13px; background: #f2f4f8; font-size: 14px; }
.setup-history-message.is-user p { background: rgba(var(--v-theme-primary), .1); }
@media (max-width: 780px) {
  .setup-experience__header { height: 58px; padding: 0 16px; }
  .setup-experience__canvas { width: calc(100% - 28px); padding: 0 0 170px; grid-template-columns: 1fr; gap: 6px; align-content: start; }
  .setup-experience__visual { min-height: 230px; }
  .setup-experience__illustration { width: min(65%, 280px); max-height: 230px; }
  .setup-experience__orb { inset: -20%; }
  .setup-experience__content { max-width: none; }
  .setup-experience h1 { font-size: clamp(31px, 10vw, 44px); }
  .setup-experience__subtitle { margin-top: 12px; font-size: 15px; }
  .setup-experience__entry-actions { margin-top: 22px; width: 100%; align-items: stretch; }
  .setup-experience__task-card { margin-top: 18px; }
  .setup-experience__caption { grid-template-columns: 8px auto; }
  .setup-experience__caption strong { grid-column: 1 / -1; padding-left: 16px; }
  .setup-experience__transcript-review { flex-wrap: wrap; }
  .setup-experience__transcript-review :deep(.v-input) { flex-basis: 100%; }
}
@media (prefers-reduced-motion: reduce) { .setup-goal { transition: none; } }
</style>
