import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useDaVinciHistory } from '@/composables/useDaVinciHistory'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'
import type { DvCardDescriptor, DvQuickReply } from '@/composables/useDaVinciIntents'
import { makeId } from '@/davinci/conversation'
import { buildRecord } from '@/davinci/history'
import type { PendingSlot } from '@/davinci/pendingSlot'
import type { CampaignReadinessItem } from '@/stores/useDaVinciOnboarding'
import type { SetupTaskStatus } from '@/stores/useOnboarding'

// ── Shared conversation types ────────────────────────────────────────────────
// The conversation lives here (not in MpDaVinciBot) so it survives route
// changes, drawer close/reopen, and the drawer ↔ full-width ↔ full-page
// surfaces all render the same live thread.

/** A draft that has been added to a dashboard — persisted on the message so a remount can't offer Add twice. */
export interface AddedWidgetRef {
  title: string
  dashboardName: string
  widgetId: string
  dashboardId: string
  accountId: string
}

export interface DraftSetProps {
  drafts: DashboardWidgetDraft[]
  rationale: string
  conversationId: string
  /** The dashboard the drafts were made for — the intro sentence names it. */
  dashboardName?: string
  /** Per draft: what differs from what was asked for ("Orders can only be shown as a KPI tile…"). */
  notes?: Array<string | null>
  /** Per draft: the widget it became once added. */
  added?: Array<AddedWidgetRef | null>
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

export interface ChatComponent {
  type: 'widgetDraftSet' | 'intentCards' | 'campaignOnboarding' | 'setupOnboarding'
  props:
    | DraftSetProps
    | IntentCardsProps
    | CampaignOnboardingProps
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
  /** An open clarification ("which engine?") — shared with the thread so New chat clears it and both surfaces agree. */
  const pendingSlot = ref<PendingSlot | null>(null)
  const activeOnboardingAccountId = ref<string | null>(null)
  const readAloud = ref(false)
  const resumeMessage = ref<string | null>(null)

  /**
   * Bumped whenever the thread is swapped (New chat, restore, delete). A surface working on the old thread —
   * a reply on its way, a mic open — watches it and lets go, so nothing lands in a conversation it doesn't belong to.
   */
  const threadEpoch = ref(0)

  /** The id every message of this conversation shares (widget drafts and history point at it). */
  function ensureConversationId(): string {
    if (!conversationId.value) conversationId.value = makeId('c')
    return conversationId.value
  }

  // ── History ────────────────────────────────────────────────────────────────
  // The live thread is recorded under its conversationId shortly after it changes, and again as
  // the page goes away — so every conversation with a question in it can be reopened from the list.
  const history = useDaVinciHistory()
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function saveNow() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (!messages.value.some((message) => message.role === 'user')) return
    const id = ensureConversationId()
    const previous = history.get(id)
    const record = buildRecord(id, messages.value, previous)
    if (record && record !== previous) history.save(record) // unchanged comes back as `previous`
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveNow, 400)
  }

  watch(messages, scheduleSave, { deep: true })
  if (typeof window !== 'undefined') window.addEventListener('pagehide', saveNow)

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

  /** Records that draft `index` of a widgetDraftSet message became a real widget. */
  function markDraftAdded(messageId: string, index: number, added: AddedWidgetRef) {
    const message = messages.value.find((entry) => entry.id === messageId)
    const set = message?.componentData?.find((entry) => entry.type === 'widgetDraftSet')?.props as DraftSetProps | undefined
    if (!set) return
    const next = [...(set.added ?? [])]
    next[index] = added
    set.added = next
  }

  /** Records that a chat chart card was saved as a dashboard widget (so a remount can't save twice). */
  function markChartSaved(card: DvCardDescriptor, added: AddedWidgetRef) {
    if (card.type === 'chart') card.props.savedTo = added
  }

  /** Empties the thread. Does not record it first — callers that keep the conversation do that. */
  function clearThread() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    messages.value = []
    chatMode.value = false
    conversationId.value = null
    pendingSlot.value = null
    threadEpoch.value += 1
  }

  /** New chat: the conversation so far stays in the history. */
  function resetConversation() {
    saveNow()
    clearThread()
  }

  /** Makes a recorded conversation the live thread. False when it is no longer in the history. */
  function restoreConversation(id: string): boolean {
    if (id === conversationId.value) return true
    const record = history.get(id)
    if (!record) return false
    saveNow() // the thread being left
    // A copy — the live thread mutates its messages in place, and the record must stay as it was recorded.
    messages.value = JSON.parse(JSON.stringify(record.messages)) as ChatMessage[]
    conversationId.value = record.id
    chatMode.value = true
    pendingSlot.value = null
    threadEpoch.value += 1
    return true
  }

  /** Deleting the conversation on screen clears the screen too — it would otherwise be recorded again. */
  function deleteConversation(id: string) {
    history.remove(id)
    if (id === conversationId.value) clearThread()
  }

  function deleteAllConversations() {
    history.clearAll()
    clearThread()
  }

  return {
    isOpen,
    isExpanded,
    widthMode,
    pendingPrompt,
    messages,
    chatMode,
    conversationId,
    threadEpoch,
    pendingSlot,
    activeOnboardingAccountId,
    readAloud,
    resumeMessage,
    open,
    openWithPrompt,
    consumePendingPrompt,
    ensureConversationId,
    beginOnboarding,
    setReadAloud,
    queueResume,
    consumeResume,
    close,
    toggle,
    setWidthMode,
    toggleExpanded,
    markDraftAdded,
    markChartSaved,
    resetConversation,
    restoreConversation,
    deleteConversation,
    deleteAllConversations,
  }
})
