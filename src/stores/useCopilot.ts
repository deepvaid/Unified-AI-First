import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
import type { DvCardDescriptor, DvQuickReply } from '@/composables/useDaVinciIntents'
import type { CampaignReadinessItem } from '@/stores/useDaVinciOnboarding'
import type { SetupTaskStatus } from '@/stores/useOnboarding'
import type { CatalogDraft, CatalogFieldKey } from '@/composables/useCatalogGenerator'
import type {
  CatalogField,
  CatalogGateReason,
  CatalogMode,
  CatalogTarget,
  CatalogWallet,
} from '@/composables/catalogCopilotConfig'

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
  /** 'pills' (default) · 'list' — full-width starting points with hints · 'compact' — small wrapping pills. */
  layout?: 'pills' | 'list' | 'compact'
  /** The session these replies belong to has ended — the replies hide rather than send into another one. */
  retired?: boolean
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

export interface SetupTaskCardItem {
  id: string
  label: string
  status: SetupTaskStatus
  minutes?: number
}

export interface SetupOnboardingProps {
  kind: 'goal' | 'plan' | 'task' | 'verification' | 'complete' | 'unsupported'
  title: string
  description?: string
  step: number
  totalSteps: number
  taskId?: string
  status?: SetupTaskStatus
  items?: SetupTaskCardItem[]
  primaryAction?: CampaignOnboardingAction
  secondaryAction?: CampaignOnboardingAction
}

// ── Catalog Co-Pilot cards (Da Vinci Catalog Management) ────────────────────
// Card status lives here, in the thread, not in the card: the full-page copilot
// remounts the bot, and an applied draft must still read as applied.

export type CatalogDraftStatus = 'draft' | 'applied' | 'discarded' | 'superseded' | 'inactive'

export interface CatalogDraftProps {
  draftId: string
  mode: CatalogMode
  field?: CatalogField
  productId?: number
  draft: CatalogDraft
  /** Current values for the drafted keys (enrich / field) — the diff's left side. */
  current?: CatalogDraft
  keys: CatalogFieldKey[]
  /** Where Apply lands — fixed when the draft is made. */
  target: CatalogTarget
  status: CatalogDraftStatus
  appliedKeys?: CatalogFieldKey[]
  /** Fields left blank on purpose (no price or brand stated). */
  gaps?: CatalogFieldKey[]
  /** Assumptions to check, one short sentence each. */
  notes?: string[]
}

export interface CatalogGateProps {
  reason: CatalogGateReason
  wallet: CatalogWallet
}

export interface CatalogNoticeProps {
  tone: 'error' | 'warning'
  headline: string
  description: string
  /** Re-sent by "Try again" — recoverable failures only. */
  retryPrompt?: string
}

export interface ChatComponent {
  type:
    | 'widgetDraftSet'
    | 'insight'
    | 'intentCards'
    | 'campaignOnboarding'
    | 'setupOnboarding'
    | 'catalogDraft'
    | 'catalogGate'
    | 'catalogNotice'
  props:
    | DraftSetProps
    | { headline: string; description: string; severity?: string }
    | IntentCardsProps
    | CampaignOnboardingProps
    | SetupOnboardingProps
    | CatalogDraftProps
    | CatalogGateProps
    | CatalogNoticeProps
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
