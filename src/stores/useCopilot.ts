import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
import type { DvCardDescriptor, DvQuickReply } from '@/composables/useDaVinciIntents'
import type { SetupTaskStatus } from '@/stores/useOnboarding'

// ── Shared conversation types ────────────────────────────────────────────────
// The conversation lives here (not in MpDaVinciBot) so it survives route
// changes, drawer close/reopen, and the drawer ↔ full-width ↔ full-page
// surfaces all render the same live thread.

export interface DraftSetProps {
  drafts: DashboardWidgetDraft[]
  rationale: string
  conversationId: string
}

export interface IntentCardsProps {
  cards: DvCardDescriptor[]
  quickReplies?: DvQuickReply[]
}

export interface SetupOnboardingAction {
  label: string
  action: string
  icon?: string
}

export interface SetupTaskCardItem {
  id: string
  label: string
  description?: string
  status: SetupTaskStatus
  minutes?: number
}

export interface SetupOnboardingProps {
  title: string
  description?: string
  kind?: 'goal' | 'plan' | 'task' | 'handoff' | 'verification' | 'complete' | 'unsupported'
  step: number
  totalSteps: number
  taskId?: string
  status?: SetupTaskStatus
  items?: SetupTaskCardItem[]
  actions?: SetupOnboardingAction[]
  primaryAction?: SetupOnboardingAction
  secondaryAction?: SetupOnboardingAction
}

/** Compatibility aliases for existing story and component imports during the setup-flow migration. */
export type CampaignOnboardingAction = SetupOnboardingAction
export type CampaignOnboardingProps = SetupOnboardingProps

export interface ChatComponent {
  type: 'widgetDraftSet' | 'insight' | 'intentCards' | 'setupOnboarding' | 'campaignOnboarding'
  props:
    | DraftSetProps
    | { headline: string; description: string; severity?: string }
    | IntentCardsProps
    | SetupOnboardingProps
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  componentData?: ChatComponent[]
  /** Named tool steps the assistant "ran" for this reply (DvToolSteps disclosure). */
  toolSteps?: string[]
}

/** Panel 400px · wide 720px · full = the whole content area (in-place takeover). */
export type CopilotWidthMode = 'panel' | 'wide' | 'full'
const ONBOARDING_TRANSCRIPT_PREFIX = 'mp.davinci.onboarding-transcript.v1'
const MAX_ONBOARDING_MESSAGES = 80

function onboardingTranscriptKey(accountId: string) {
  return `${ONBOARDING_TRANSCRIPT_PREFIX}:${accountId}`
}

function readOnboardingTranscript(accountId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(onboardingTranscriptKey(accountId)) ?? '[]')
    if (!Array.isArray(stored)) return []
    return stored.filter((message: unknown): message is ChatMessage => {
      if (!message || typeof message !== 'object') return false
      const candidate = message as Partial<ChatMessage>
      return typeof candidate.id === 'string'
        && (candidate.role === 'user' || candidate.role === 'assistant')
        && typeof candidate.text === 'string'
    }).slice(-MAX_ONBOARDING_MESSAGES)
  } catch {
    return []
  }
}

export const useCopilotStore = defineStore('copilot', () => {
  const isOpen = ref(false)
  const widthMode = ref<CopilotWidthMode>('panel')
  const isExpanded = computed(() => widthMode.value !== 'panel')
  /** Prompt queued by a feature surface; the bot consumes it on open so the panel never starts blank. */
  const pendingPrompt = ref<string | null>(null)

  // Live conversation — shared by every text-chat surface.
  const messages = ref<ChatMessage[]>([])
  const chatMode = ref(false)
  const conversationId = ref<string | null>(null)
  const activeOnboardingAccountId = ref<string | null>(null)
  const readAloud = ref(false)
  const resumeMessage = ref<string | null>(null)

  function open() {
    isOpen.value = true
  }

  function openWithPrompt(prompt: string) {
    pendingPrompt.value = prompt
    isOpen.value = true
  }

  function consumePendingPrompt(): string | null {
    const prompt = pendingPrompt.value
    pendingPrompt.value = null
    return prompt
  }

  function persistOnboardingTranscript(accountId: string, transcript = messages.value) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        onboardingTranscriptKey(accountId),
        JSON.stringify(transcript.slice(-MAX_ONBOARDING_MESSAGES)),
      )
    } catch {
      /* Transcript persistence is best effort and must not block the assistant. */
    }
  }

  function beginOnboarding(accountId: string) {
    const previousAccountId = activeOnboardingAccountId.value
    if (previousAccountId && previousAccountId !== accountId) {
      persistOnboardingTranscript(previousAccountId)
      messages.value = readOnboardingTranscript(accountId)
      chatMode.value = messages.value.length > 0
      conversationId.value = null
    } else if (!previousAccountId && messages.value.length === 0) {
      messages.value = readOnboardingTranscript(accountId)
      chatMode.value = messages.value.length > 0
    }
    activeOnboardingAccountId.value = accountId
  }

  function setReadAloud(enabled: boolean) {
    readAloud.value = enabled
  }

  function queueResume(message: string) {
    resumeMessage.value = message
  }

  function consumeResume(): string | null {
    const message = resumeMessage.value
    resumeMessage.value = null
    return message
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function setWidthMode(mode: CopilotWidthMode) {
    widthMode.value = mode
  }

  /** Header chevron: panel ↔ wide. Full width is set explicitly via setWidthMode. */
  function toggleExpanded() {
    widthMode.value = widthMode.value === 'panel' ? 'wide' : 'panel'
  }

  function resetConversation(options: { forgetStored?: boolean } = {}) {
    const forgetStored = options.forgetStored ?? true
    if (forgetStored && activeOnboardingAccountId.value && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(onboardingTranscriptKey(activeOnboardingAccountId.value))
      } catch {
        /* Storage cleanup is best effort. */
      }
    }
    messages.value = []
    chatMode.value = false
    conversationId.value = null
  }

  watch(messages, (nextMessages) => {
    if (activeOnboardingAccountId.value) {
      persistOnboardingTranscript(activeOnboardingAccountId.value, nextMessages)
    }
  }, { deep: true })

  return {
    isOpen,
    isExpanded,
    widthMode,
    pendingPrompt,
    messages,
    chatMode,
    conversationId,
    activeOnboardingAccountId,
    readAloud,
    resumeMessage,
    open,
    openWithPrompt,
    consumePendingPrompt,
    beginOnboarding,
    setReadAloud,
    queueResume,
    consumeResume,
    close,
    toggle,
    setWidthMode,
    toggleExpanded,
    resetConversation,
  }
})
