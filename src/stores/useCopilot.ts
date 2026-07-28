import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
import type { DvCardDescriptor, DvQuickReply } from '@/composables/useDaVinciIntents'
import type { CampaignReadinessItem } from '@/stores/useDaVinciOnboarding'

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

export interface CampaignOnboardingAction {
  label: string
  action: string
  icon?: string
}

export interface CampaignOnboardingProps {
  title: string
  description?: string
  step: number
  totalSteps: number
  items?: CampaignReadinessItem[]
  primaryAction?: CampaignOnboardingAction
  secondaryAction?: CampaignOnboardingAction
}

export interface ChatComponent {
  type: 'widgetDraftSet' | 'insight' | 'intentCards' | 'campaignOnboarding'
  props:
    | DraftSetProps
    | { headline: string; description: string; severity?: string }
    | IntentCardsProps
    | CampaignOnboardingProps
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

  function beginOnboarding(accountId: string) {
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

  function resetConversation() {
    messages.value = []
    chatMode.value = false
    conversationId.value = null
  }

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
