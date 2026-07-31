import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type DaVinciOnboardingStage =
  | 'welcome'
  | 'choice'
  | 'voice-consent'
  | 'objective'
  | 'audience'
  | 'readiness'
  | 'brief-ready'
  | 'prerequisite-handoff'
  | 'builder-handoff'
  | 'paused'
  | 'complete'

export type DaVinciInputMode = 'voice' | 'text'
export type CampaignReadinessStatus = 'ready' | 'needs-attention' | 'unknown'

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

export type CampaignReadinessItemId =
  | 'marketing'
  | 'permission'
  | 'plan'
  | 'domain'
  | 'sender'
  | 'audience'
  | 'content'

export interface CampaignReadinessItem {
  id: CampaignReadinessItemId
  label: string
  description: string
  status: CampaignReadinessStatus
  routeName: string
  actionLabel: string
  checkedAt: string
}

export interface CampaignContextBrief {
  channel: 'Email'
  objective: string
  audience: string
  readinessSummary: string
  nextSteps: string[]
  createdAt: string
}

export interface DaVinciOnboardingSession {
  accountId: string
  userId: string
  freshAccount: boolean
  stage: DaVinciOnboardingStage
  inputMode: DaVinciInputMode | null
  brief: CampaignBrief
  /** Audience named before we asked, e.g. "send a campaign to VIPs". Consumed once the objective is known. */
  audienceHint: string | null
  readiness: CampaignReadinessItem[]
  contextBrief: CampaignContextBrief | null
  currentPrerequisite: string | null
  lastRouteName: string | null
  resumeStage: DaVinciOnboardingStage | null
  transcriptRef: string | null
  /** Records that a v1 draft reference was deliberately ignored during the read-only migration. */
  legacyDraftIgnored: boolean
  startedAt: string
  updatedAt: string
}

const STORAGE_PREFIX = 'mp.davinci.campaign-onboarding.v2'
const LEGACY_STORAGE_PREFIX = 'mp.davinci.campaign-onboarding.v1'

function storageKey(accountId: string, prefix = STORAGE_PREFIX) {
  return `${prefix}:${accountId}`
}

type LegacyReadinessItem = Omit<Partial<CampaignReadinessItem>, 'status'> & {
  status?: CampaignReadinessStatus | 'needs-setup'
}

type LegacySession = Omit<Partial<DaVinciOnboardingSession>, 'stage' | 'readiness'> & {
  accountId?: string
  stage?: DaVinciOnboardingStage | 'consent' | 'draft' | 'handoff'
  paused?: boolean
  draftId?: number | null
  readiness?: LegacyReadinessItem[]
}

function migrateStage(session: LegacySession): DaVinciOnboardingStage {
  if (session.paused) return 'paused'
  if (session.stage === 'consent') return 'voice-consent'
  if (session.stage === 'draft') return 'brief-ready'
  if (session.stage === 'handoff') return 'builder-handoff'
  if (session.stage === undefined) return 'choice'
  return session.stage
}

/** Pure migration so old local sessions can be tested without touching storage. */
export function migrateDaVinciOnboardingSession(
  raw: LegacySession,
  accountId: string,
): DaVinciOnboardingSession {
  const now = new Date().toISOString()
  const stage = migrateStage(raw)
  const previousStage = raw.stage === 'consent'
    ? 'voice-consent'
    : raw.stage === 'draft'
      ? 'brief-ready'
      : raw.stage === 'handoff'
        ? 'builder-handoff'
        : raw.stage

  const readiness: CampaignReadinessItem[] = Array.isArray(raw.readiness)
    ? raw.readiness.flatMap((item) => {
        if (
          !item
          || typeof item.id !== 'string'
          || typeof item.label !== 'string'
          || typeof item.description !== 'string'
          || !['ready', 'needs-attention', 'needs-setup', 'unknown'].includes(item.status ?? '')
          || typeof item.routeName !== 'string'
          || typeof item.actionLabel !== 'string'
        ) return []
        return [{
          id: item.id as CampaignReadinessItemId,
          label: item.label,
          description: item.description,
          status: item.status === 'needs-setup' ? 'needs-attention' : item.status as CampaignReadinessStatus,
          routeName: item.routeName,
          actionLabel: item.actionLabel,
          checkedAt: item.checkedAt ?? raw.updatedAt ?? now,
        }]
      })
    : []

  return {
    accountId,
    userId: typeof raw.userId === 'string' ? raw.userId : 'current-user',
    freshAccount: raw.freshAccount === true,
    stage,
    inputMode: raw.inputMode === 'voice' || raw.inputMode === 'text' ? raw.inputMode : null,
    brief: {
      objective: typeof raw.brief?.objective === 'string' ? raw.brief.objective : '',
      audience: raw.brief?.audience ?? null,
    },
    audienceHint: typeof raw.audienceHint === 'string' ? raw.audienceHint : null,
    readiness,
    contextBrief: raw.contextBrief ?? null,
    currentPrerequisite: typeof raw.currentPrerequisite === 'string' ? raw.currentPrerequisite : null,
    lastRouteName: typeof raw.lastRouteName === 'string' ? raw.lastRouteName : null,
    resumeStage: stage === 'paused' && previousStage && previousStage !== 'paused'
      ? previousStage as DaVinciOnboardingStage
      : raw.resumeStage ?? null,
    transcriptRef: typeof raw.transcriptRef === 'string' ? raw.transcriptRef : null,
    legacyDraftIgnored: raw.legacyDraftIgnored === true || raw.draftId != null || raw.stage === 'draft',
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  }
}

function readSession(accountId: string): DaVinciOnboardingSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(accountId))
      ?? window.localStorage.getItem(storageKey(accountId, LEGACY_STORAGE_PREFIX))
    if (!raw) return null
    return migrateDaVinciOnboardingSession(JSON.parse(raw) as LegacySession, accountId)
  } catch {
    return null
  }
}

function freshSession(accountId: string, freshAccount = false): DaVinciOnboardingSession {
  const now = new Date().toISOString()
  return {
    accountId,
    userId: 'current-user',
    freshAccount,
    stage: 'choice',
    inputMode: null,
    brief: { objective: '', audience: null },
    audienceHint: null,
    readiness: [],
    contextBrief: null,
    currentPrerequisite: null,
    lastRouteName: null,
    resumeStage: null,
    transcriptRef: `davinci:${accountId}:${Date.now().toString(36)}`,
    legacyDraftIgnored: false,
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
    if (stage !== 'paused') session.resumeStage = null
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
    session.contextBrief = null
    session.stage = 'audience'
    persist(session)
  }

  function setAudienceHint(hint: string | null) {
    const session = requireSession()
    session.audienceHint = hint
    persist(session)
  }

  function setPaused(paused: boolean) {
    const session = requireSession()
    if (paused) {
      if (session.stage !== 'paused') session.resumeStage = session.stage
      session.stage = 'paused'
    } else {
      session.stage = session.resumeStage && session.resumeStage !== 'paused'
        ? session.resumeStage
        : 'objective'
      session.resumeStage = null
    }
    persist(session)
  }

  function setAudience(audience: CampaignAudienceSelection | null) {
    const session = requireSession()
    session.brief.audience = audience
    session.contextBrief = null
    session.stage = 'readiness'
    persist(session)
  }

  function setReadiness(readiness: CampaignReadinessItem[]) {
    const session = requireSession()
    session.readiness = readiness
    session.stage = 'readiness'
    persist(session)
  }

  function setContextBrief(contextBrief: CampaignContextBrief) {
    const session = requireSession()
    session.contextBrief = contextBrief
    session.stage = 'brief-ready'
    persist(session)
  }

  function setLastRoute(routeName: string | null) {
    const session = requireSession()
    session.lastRouteName = routeName
    persist(session)
  }

  function markPrerequisiteHandoff(routeName: string) {
    const session = requireSession()
    session.stage = 'prerequisite-handoff'
    session.currentPrerequisite = routeName
    session.lastRouteName = routeName
    persist(session)
  }

  function markBuilderHandoff(routeName = 'CreateCampaign') {
    const session = requireSession()
    session.stage = 'builder-handoff'
    session.currentPrerequisite = null
    session.lastRouteName = routeName
    persist(session)
  }

  function complete() {
    const session = requireSession()
    session.stage = 'complete'
    session.resumeStage = null
    persist(session)
  }

  function reset(accountId = activeAccountId.value) {
    if (!accountId) return
    sessions.value = Object.fromEntries(Object.entries(sessions.value).filter(([id]) => id !== accountId))
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey(accountId))
        window.localStorage.removeItem(storageKey(accountId, LEGACY_STORAGE_PREFIX))
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
    setPaused,
    setAudience,
    setReadiness,
    setContextBrief,
    setLastRoute,
    markPrerequisiteHandoff,
    markBuilderHandoff,
    complete,
    reset,
  }
})
