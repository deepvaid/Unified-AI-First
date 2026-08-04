import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { DaVinciInputMode } from '@/stores/useDaVinciOnboarding'

// Da Vinci guided setup — the persisted conversation session for the
// post-signup / post-checkout onboarding. Deliberately separate from the
// campaign wizard's store (useDaVinciOnboarding) so that flow keeps working
// untouched from the drawer. The ordered task plan itself is NOT persisted
// here — it is always recomputed from useOnboarding.planTasks, so a mid-trial
// purchase reshapes the plan instantly.

export type SetupStage =
  | 'welcome'
  | 'goal-discovery'
  | 'plan-ready'
  | 'task-intro'
  | 'task-handoff'
  | 'verifying'
  | 'milestone-complete'
  | 'paused'
  | 'complete'

export type SetupEntry = 'signup' | 'checkout' | 'manual'

export interface DaVinciSetupSession {
  accountId: string
  entry: SetupEntry
  stage: SetupStage
  /** Stage to restore when un-pausing. */
  resumeStage: SetupStage | null
  inputMode: DaVinciInputMode | null
  currentTaskId: string | null
  lastRouteName: string | null
  startedAt: string
  updatedAt: string
}

const STORAGE_PREFIX = 'mp.davinci.setup-onboarding.v1'

function storageKey(accountId: string) {
  return `${STORAGE_PREFIX}:${accountId}`
}

function readSession(accountId: string): DaVinciSetupSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(accountId))
    return raw ? (JSON.parse(raw) as DaVinciSetupSession) : null
  } catch {
    return null
  }
}

function freshSession(accountId: string, entry: SetupEntry): DaVinciSetupSession {
  const now = new Date().toISOString()
  return {
    accountId,
    entry,
    stage: 'welcome',
    resumeStage: null,
    inputMode: null,
    currentTaskId: null,
    lastRouteName: null,
    startedAt: now,
    updatedAt: now,
  }
}

export const useDaVinciSetupStore = defineStore('daVinciSetup', () => {
  const sessions = ref<Record<string, DaVinciSetupSession>>({})
  const activeAccountId = ref<string | null>(null)

  const activeSession = computed(() => {
    if (!activeAccountId.value) return null
    return sessions.value[activeAccountId.value] ?? null
  })

  const isActive = computed(() => {
    const stage = activeSession.value?.stage
    return !!stage && stage !== 'complete'
  })

  function persist(session: DaVinciSetupSession) {
    session.updatedAt = new Date().toISOString()
    sessions.value = { ...sessions.value, [session.accountId]: session }
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey(session.accountId), JSON.stringify(session))
    } catch {
      /* Private mode and storage quotas should not block onboarding. */
    }
  }

  /** Existing session for an account (memory or storage) without creating one. */
  function peek(accountId: string): DaVinciSetupSession | null {
    return sessions.value[accountId] ?? readSession(accountId)
  }

  function begin(accountId: string, options: { restart?: boolean; entry?: SetupEntry } = {}) {
    activeAccountId.value = accountId
    const existing = options.restart ? null : (sessions.value[accountId] ?? readSession(accountId))
    const session = existing ?? freshSession(accountId, options.entry ?? 'manual')
    if (options.entry) session.entry = options.entry
    persist(session)
    return session
  }

  function requireSession() {
    const session = activeSession.value
    if (!session) throw new Error('Da Vinci guided setup has not been started')
    return session
  }

  function setStage(stage: SetupStage) {
    const session = requireSession()
    session.stage = stage
    persist(session)
  }

  function setInputMode(inputMode: DaVinciInputMode) {
    const session = requireSession()
    session.inputMode = inputMode
    persist(session)
  }

  function setCurrentTask(taskId: string | null, stage?: SetupStage) {
    const session = requireSession()
    session.currentTaskId = taskId
    if (stage) session.stage = stage
    persist(session)
  }

  function markTaskHandoff(routeName: string) {
    const session = requireSession()
    session.stage = 'task-handoff'
    session.lastRouteName = routeName
    persist(session)
  }

  function setPaused(paused: boolean) {
    const session = requireSession()
    if (paused && session.stage !== 'paused') {
      session.resumeStage = session.stage
      session.stage = 'paused'
    } else if (!paused && session.stage === 'paused') {
      session.stage = session.resumeStage ?? 'plan-ready'
      session.resumeStage = null
    }
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
    peek,
    begin,
    setStage,
    setInputMode,
    setCurrentTask,
    markTaskHandoff,
    setPaused,
    complete,
    reset,
  }
})
