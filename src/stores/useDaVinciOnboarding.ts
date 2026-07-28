import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type DaVinciOnboardingStage =
  | 'welcome'
  | 'consent'
  | 'objective'
  | 'audience'
  | 'readiness'
  | 'draft'
  | 'handoff'
  | 'complete'

export type DaVinciInputMode = 'voice' | 'text'
export type CampaignReadinessStatus = 'ready' | 'needs-setup' | 'unknown'

export interface CampaignAudienceSelection {
  kind: 'list' | 'segment'
  id: number
  name: string
  count: number
}

export interface CampaignBrief {
  objective: string
  audience: CampaignAudienceSelection | null
}

export interface CampaignReadinessItem {
  id: 'domain' | 'audience' | 'content'
  label: string
  description: string
  status: CampaignReadinessStatus
  routeName: string
  actionLabel: string
}

export interface DaVinciOnboardingSession {
  accountId: string
  freshAccount: boolean
  stage: DaVinciOnboardingStage
  inputMode: DaVinciInputMode | null
  brief: CampaignBrief
  /** Audience named before we asked, e.g. "send a campaign to VIPs". Consumed once the objective is known. */
  audienceHint: string | null
  readiness: CampaignReadinessItem[]
  draftId: number | null
  lastRouteName: string | null
  startedAt: string
  updatedAt: string
}

const STORAGE_PREFIX = 'mp.davinci.campaign-onboarding.v1'

function storageKey(accountId: string) {
  return `${STORAGE_PREFIX}:${accountId}`
}

function readSession(accountId: string): DaVinciOnboardingSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(accountId))
    return raw ? (JSON.parse(raw) as DaVinciOnboardingSession) : null
  } catch {
    return null
  }
}

function freshSession(accountId: string, freshAccount = false): DaVinciOnboardingSession {
  const now = new Date().toISOString()
  return {
    accountId,
    freshAccount,
    stage: 'welcome',
    inputMode: null,
    brief: { objective: '', audience: null },
    audienceHint: null,
    readiness: [],
    draftId: null,
    lastRouteName: null,
    startedAt: now,
    updatedAt: now,
  }
}

export const useDaVinciOnboardingStore = defineStore('daVinciOnboarding', () => {
  const sessions = ref<Record<string, DaVinciOnboardingSession>>({})
  const activeAccountId = ref<string | null>(null)

  const activeSession = computed(() => {
    if (!activeAccountId.value) return null
    return sessions.value[activeAccountId.value] ?? null
  })

  const isActive = computed(() => {
    const stage = activeSession.value?.stage
    return !!stage && stage !== 'complete'
  })

  function persist(session: DaVinciOnboardingSession) {
    session.updatedAt = new Date().toISOString()
    sessions.value = { ...sessions.value, [session.accountId]: session }
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey(session.accountId), JSON.stringify(session))
    } catch {
      /* Private mode and storage quotas should not block onboarding. */
    }
  }

  function begin(accountId: string, options: { restart?: boolean; freshAccount?: boolean } = {}) {
    activeAccountId.value = accountId
    const existing = options.restart ? null : (sessions.value[accountId] ?? readSession(accountId))
    const session = existing ?? freshSession(accountId, options.freshAccount)
    persist(session)
    return session
  }

  function requireSession() {
    const session = activeSession.value
    if (!session) throw new Error('Da Vinci onboarding has not been started')
    return session
  }

  function setStage(stage: DaVinciOnboardingStage) {
    const session = requireSession()
    session.stage = stage
    persist(session)
  }

  function setInputMode(inputMode: DaVinciInputMode) {
    const session = requireSession()
    session.inputMode = inputMode
    persist(session)
  }

  function setObjective(objective: string) {
    const session = requireSession()
    session.brief.objective = objective
    session.stage = 'audience'
    persist(session)
  }

  function setAudienceHint(hint: string | null) {
    const session = requireSession()
    session.audienceHint = hint
    persist(session)
  }

  function setAudience(audience: CampaignAudienceSelection) {
    const session = requireSession()
    session.brief.audience = audience
    session.stage = 'readiness'
    persist(session)
  }

  function setReadiness(readiness: CampaignReadinessItem[]) {
    const session = requireSession()
    session.readiness = readiness
    session.stage = 'readiness'
    persist(session)
  }

  function setDraft(draftId: number) {
    const session = requireSession()
    session.draftId = draftId
    session.stage = 'draft'
    persist(session)
  }

  function setLastRoute(routeName: string | null) {
    const session = requireSession()
    session.lastRouteName = routeName
    persist(session)
  }

  function markHandoff(routeName = 'CreateCampaign') {
    const session = requireSession()
    session.stage = 'handoff'
    session.lastRouteName = routeName
    persist(session)
  }

  function complete() {
    const session = requireSession()
    session.stage = 'complete'
    persist(session)
  }

  function reset(accountId = activeAccountId.value) {
    if (!accountId) return
    sessions.value = Object.fromEntries(Object.entries(sessions.value).filter(([id]) => id !== accountId))
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey(accountId))
      } catch {
        /* Private mode and storage quotas should not block a reset. */
      }
    }
    if (activeAccountId.value === accountId) activeAccountId.value = null
  }

  return {
    sessions,
    activeAccountId,
    activeSession,
    isActive,
    begin,
    setStage,
    setInputMode,
    setObjective,
    setAudienceHint,
    setAudience,
    setReadiness,
    setDraft,
    setLastRoute,
    markHandoff,
    complete,
    reset,
  }
})
