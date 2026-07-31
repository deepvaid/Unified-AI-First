import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { OnboardingGoal, SetupTaskStatus } from '@/stores/useOnboarding'
import { MARKETING_TASK_IDS, STORE_TASK_IDS } from '@/stores/useOnboarding'

export type DaVinciOnboardingStage =
  | 'welcome'
  | 'voice-consent'
  | 'goal-discovery'
  | 'plan-ready'
  | 'task-intro'
  | 'task-handoff'
  | 'verifying'
  | 'task-complete'
  | 'milestone-complete'
  | 'paused'
  | 'complete'

export type DaVinciInputMode = 'voice' | 'text'
export type BothGoalOrder = 'marketing-first' | 'store-first'

export interface SetupOnboardingSession {
  accountId: string
  userId: string
  goal: OnboardingGoal | null
  bothFirst: BothGoalOrder | null
  orderedTaskIds: string[]
  currentTaskId: string | null
  stage: DaVinciOnboardingStage
  resumeStage: DaVinciOnboardingStage | null
  inputMode: DaVinciInputMode | null
  taskStatuses: Record<string, SetupTaskStatus>
  lastRoute: string | null
  transcriptRef: string | null
  pausedAt: string | null
  createdAt: string
  updatedAt: string
  legacyCampaignMigrated: boolean
}

export type DaVinciOnboardingSession = SetupOnboardingSession

const STORAGE_PREFIX = 'mp.davinci.setup-onboarding.v1'
const LEGACY_PREFIXES = ['mp.davinci.campaign-onboarding.v2', 'mp.davinci.campaign-onboarding.v1'] as const

const key = (prefix: string, accountId: string) => `${prefix}:${accountId}`

interface LegacyCampaignSession {
  accountId?: string
  userId?: string
  stage?: string
  inputMode?: DaVinciInputMode | null
  transcriptRef?: string | null
  startedAt?: string
  updatedAt?: string
  draftId?: number | null
  brief?: unknown
  contextBrief?: unknown
}

function now() { return new Date().toISOString() }

function freshSession(accountId: string): SetupOnboardingSession {
  const timestamp = now()
  return {
    accountId,
    userId: 'current-user',
    goal: null,
    bothFirst: null,
    orderedTaskIds: [],
    currentTaskId: null,
    stage: 'welcome',
    resumeStage: null,
    inputMode: null,
    taskStatuses: {},
    lastRoute: null,
    transcriptRef: `davinci:${accountId}:${Date.now().toString(36)}`,
    pausedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    legacyCampaignMigrated: false,
  }
}

/** Pure legacy migration: campaign context and draft identifiers are intentionally discarded. */
export function migrateLegacyCampaignSession(
  raw: LegacyCampaignSession,
  accountId: string,
): SetupOnboardingSession {
  const session = freshSession(accountId)
  session.userId = typeof raw.userId === 'string' ? raw.userId : session.userId
  session.goal = 'marketing'
  session.orderedTaskIds = [...MARKETING_TASK_IDS]
  session.currentTaskId = MARKETING_TASK_IDS[0]
  session.stage = raw.stage === 'paused' ? 'paused' : 'task-intro'
  session.resumeStage = raw.stage === 'paused' ? 'task-intro' : null
  session.inputMode = raw.inputMode === 'voice' || raw.inputMode === 'text' ? raw.inputMode : null
  session.transcriptRef = typeof raw.transcriptRef === 'string' ? raw.transcriptRef : session.transcriptRef
  session.createdAt = typeof raw.startedAt === 'string' ? raw.startedAt : session.createdAt
  session.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : session.updatedAt
  session.legacyCampaignMigrated = true
  return session
}

function readSession(accountId: string): SetupOnboardingSession | null {
  if (typeof window === 'undefined') return null
  try {
    const current = window.localStorage.getItem(key(STORAGE_PREFIX, accountId))
    if (current) return JSON.parse(current) as SetupOnboardingSession

    for (const prefix of LEGACY_PREFIXES) {
      const legacy = window.localStorage.getItem(key(prefix, accountId))
      if (legacy) return migrateLegacyCampaignSession(JSON.parse(legacy) as LegacyCampaignSession, accountId)
    }
  } catch {
    // Invalid or unavailable storage starts a safe, empty session.
  }
  return null
}

export function orderedTasksForGoal(goal: OnboardingGoal, bothFirst: BothGoalOrder | null = null) {
  if (goal === 'marketing') return [...MARKETING_TASK_IDS]
  if (goal === 'store') return [...STORE_TASK_IDS]
  return bothFirst === 'store-first'
    ? [...STORE_TASK_IDS, ...MARKETING_TASK_IDS]
    : [...MARKETING_TASK_IDS, ...STORE_TASK_IDS]
}

export const useDaVinciOnboardingStore = defineStore('daVinciOnboarding', () => {
  const sessions = ref<Record<string, SetupOnboardingSession>>({})
  const activeAccountId = ref<string | null>(null)

  const activeSession = computed(() => activeAccountId.value
    ? sessions.value[activeAccountId.value] ?? null
    : null)

  const isActive = computed(() => {
    const stage = activeSession.value?.stage
    return !!stage && stage !== 'complete'
  })

  function persist(session: SetupOnboardingSession) {
    session.updatedAt = now()
    sessions.value = { ...sessions.value, [session.accountId]: { ...session } }
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key(STORAGE_PREFIX, session.accountId), JSON.stringify(session))
    } catch {
      // The experience remains available in memory when storage is unavailable.
    }
  }

  function requireSession() {
    if (!activeSession.value) throw new Error('Da Vinci setup onboarding has not been started')
    return activeSession.value
  }

  function begin(accountId: string, options: { restart?: boolean } = {}) {
    activeAccountId.value = accountId
    const existing = options.restart ? null : (sessions.value[accountId] ?? readSession(accountId))
    const session = existing ?? freshSession(accountId)
    persist(session)
    return session
  }

  function setInputMode(inputMode: DaVinciInputMode) {
    const session = requireSession()
    session.inputMode = inputMode
    persist(session)
  }

  function setStage(stage: DaVinciOnboardingStage) {
    const session = requireSession()
    session.stage = stage
    if (stage !== 'paused') {
      session.resumeStage = null
      session.pausedAt = null
    }
    persist(session)
  }

  function setGoal(goal: OnboardingGoal, bothFirst: BothGoalOrder | null = null) {
    const session = requireSession()
    session.goal = goal
    session.bothFirst = goal === 'both' ? bothFirst : null
    session.orderedTaskIds = goal === 'both' && !bothFirst ? [] : orderedTasksForGoal(goal, bothFirst)
    session.currentTaskId = session.orderedTaskIds[0] ?? null
    session.stage = goal === 'both' && !bothFirst ? 'goal-discovery' : 'plan-ready'
    persist(session)
  }

  function setBothOrder(order: BothGoalOrder) {
    const session = requireSession()
    session.goal = 'both'
    session.bothFirst = order
    session.orderedTaskIds = orderedTasksForGoal('both', order)
    session.currentTaskId = session.orderedTaskIds[0] ?? null
    session.stage = 'plan-ready'
    persist(session)
  }

  function syncTaskStatuses(statuses: Record<string, SetupTaskStatus>) {
    const session = requireSession()
    session.taskStatuses = { ...statuses }
    persist(session)
  }

  function setCurrentTask(taskId: string | null, stage: DaVinciOnboardingStage = 'task-intro') {
    const session = requireSession()
    session.currentTaskId = taskId
    session.stage = taskId ? stage : 'milestone-complete'
    persist(session)
  }

  function markTaskHandoff(routeName: string) {
    const session = requireSession()
    session.stage = 'task-handoff'
    session.lastRoute = routeName
    persist(session)
  }

  function setLastRoute(routeName: string | null) {
    const session = requireSession()
    session.lastRoute = routeName
    persist(session)
  }

  function setPaused(paused: boolean) {
    const session = requireSession()
    if (paused) {
      if (session.stage !== 'paused') session.resumeStage = session.stage
      session.stage = 'paused'
      session.pausedAt = now()
    } else {
      session.stage = session.resumeStage && session.resumeStage !== 'paused'
        ? session.resumeStage
        : session.currentTaskId ? 'task-intro' : session.goal ? 'plan-ready' : 'goal-discovery'
      session.resumeStage = null
      session.pausedAt = null
    }
    persist(session)
  }

  function complete() {
    const session = requireSession()
    session.stage = 'complete'
    session.currentTaskId = null
    session.resumeStage = null
    session.pausedAt = null
    persist(session)
  }

  function reset(accountId = activeAccountId.value) {
    if (!accountId) return
    const next = { ...sessions.value }
    delete next[accountId]
    sessions.value = next
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(key(STORAGE_PREFIX, accountId)) } catch { /* noop */ }
    }
    if (activeAccountId.value === accountId) activeAccountId.value = null
  }

  return {
    sessions, activeAccountId, activeSession, isActive,
    begin, setInputMode, setStage, setGoal, setBothOrder, syncTaskStatuses,
    setCurrentTask, markTaskHandoff, setLastRoute, setPaused, complete, reset,
  }
})
