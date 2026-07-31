import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type OnboardingGoal = 'marketing' | 'store' | 'both'
export type SetupTaskStatus = 'pending' | 'verified' | 'user-confirmed' | 'blocked' | 'skipped'
export type SetupTaskArea = 'email' | 'customers' | 'store' | 'support'
export type SetupIllustrationKey = 'email' | 'audience' | 'store' | 'complete'

export interface OnboardingTask {
  id: string
  area: SetupTaskArea
  title: string
  description: string
  why: string
  minutes: number
  icon: string
  routeName: string
  cta: string
  prerequisites: string[]
  goals: OnboardingGoal[]
  verificationKey: string
  illustrationKey: SetupIllustrationKey
}

export type SetupTaskDefinition = OnboardingTask

export interface OnboardingPhase {
  id: SetupTaskArea
  title: string
  blurb: string
  tasks: OnboardingTask[]
}

const task = (definition: OnboardingTask) => definition

export const ONBOARDING_PHASES: OnboardingPhase[] = [
  {
    id: 'email',
    title: 'Make your email deliverable',
    blurb: 'Set up trusted sending and measurable links.',
    tasks: [
      task({
        id: 'sending-domain', area: 'email', title: 'Authenticate your sending domain',
        description: 'Add the DNS records that prove your email really comes from you.',
        why: 'Authentication protects your reputation and improves inbox placement.', minutes: 5,
        icon: 'shield-check', routeName: 'SettingsDnsSetup', cta: 'Set up DNS', prerequisites: [],
        goals: ['marketing', 'both'], verificationKey: 'sending-domain', illustrationKey: 'email',
      }),
      task({
        id: 'link-tracking', area: 'email', title: 'Configure link tracking',
        description: 'Brand your tracking links so opens and clicks are measured reliably.',
        why: 'Tracking turns each send into useful learning.', minutes: 2,
        icon: 'link', routeName: 'SettingsDnsSetup', cta: 'Configure tracking', prerequisites: ['sending-domain'],
        goals: ['marketing', 'both'], verificationKey: 'link-tracking', illustrationKey: 'email',
      }),
    ],
  },
  {
    id: 'store',
    title: 'Open your store',
    blurb: 'Give customers something to discover, buy, and receive.',
    tasks: [
      task({
        id: 'store-branding', area: 'store', title: 'Add your store identity',
        description: 'Set the store name, logo, and business details customers will see.',
        why: 'A clear identity makes the storefront feel trustworthy.', minutes: 3,
        icon: 'store', routeName: 'SettingsAccountDefaults', cta: 'Set store identity', prerequisites: [],
        goals: ['store', 'both'], verificationKey: 'store-branding', illustrationKey: 'store',
      }),
      task({
        id: 'inventory-location', area: 'store', title: 'Set your inventory location',
        description: 'Tell us where stock lives so inventory and alerts stay accurate.',
        why: 'Orders need a fulfillment location.', minutes: 2,
        icon: 'map-pin', routeName: 'Inventory', cta: 'Set location', prerequisites: [],
        goals: ['store', 'both'], verificationKey: 'inventory-location', illustrationKey: 'store',
      }),
      task({
        id: 'first-product', area: 'store', title: 'Add your first product',
        description: 'Create the first item customers can browse and buy.',
        why: 'Your catalog is the foundation of the store.', minutes: 5,
        icon: 'package', routeName: 'ProductNew', cta: 'Add product', prerequisites: ['inventory-location'],
        goals: ['store', 'both'], verificationKey: 'first-product', illustrationKey: 'store',
      }),
      task({
        id: 'payments', area: 'store', title: 'Connect payments',
        description: 'Choose how customers will pay at checkout.',
        why: 'A payment gateway turns visits into revenue.', minutes: 5,
        icon: 'credit-card', routeName: 'SettingsPaymentAccount', cta: 'Connect payments', prerequisites: [],
        goals: ['store', 'both'], verificationKey: 'payments', illustrationKey: 'store',
      }),
      task({
        id: 'shipping', area: 'store', title: 'Configure shipping',
        description: 'Define where you ship, what it costs, and how long it takes.',
        why: 'Clear delivery choices reduce checkout surprises.', minutes: 8,
        icon: 'truck', routeName: 'SettingsSalesChannels', cta: 'Configure shipping', prerequisites: [],
        goals: ['store', 'both'], verificationKey: 'shipping', illustrationKey: 'store',
      }),
      task({
        id: 'taxes', area: 'store', title: 'Configure taxes',
        description: 'Set up tax collection for the regions where you sell.',
        why: 'Correct tax settings prevent cleanup later.', minutes: 5,
        icon: 'receipt', routeName: 'ProductTaxCategory', cta: 'Configure taxes', prerequisites: [],
        goals: ['store', 'both'], verificationKey: 'taxes', illustrationKey: 'store',
      }),
      task({
        id: 'theme', area: 'store', title: 'Choose a theme',
        description: 'Choose and customize the look of your storefront.',
        why: 'A polished storefront makes products easier to discover.', minutes: 10,
        icon: 'palette', routeName: 'SalesChannels', cta: 'Choose theme', prerequisites: ['first-product'],
        goals: ['store', 'both'], verificationKey: 'theme', illustrationKey: 'store',
      }),
      task({
        id: 'domain', area: 'store', title: 'Connect your storefront domain',
        description: 'Point your custom domain at the storefront.',
        why: 'A branded address is easier to trust and remember.', minutes: 5,
        icon: 'globe', routeName: 'SettingsDnsSetup', cta: 'Connect domain', prerequisites: ['theme'],
        goals: ['store', 'both'], verificationKey: 'domain', illustrationKey: 'store',
      }),
    ],
  },
  {
    id: 'customers',
    title: 'Reach your customers',
    blurb: 'Bring in an audience and launch the first campaign.',
    tasks: [
      task({
        id: 'first-list', area: 'customers', title: 'Create a contact list',
        description: 'Create an audience list for your first campaign.',
        why: 'A list gives every campaign a clear destination.', minutes: 2,
        icon: 'list-checks', routeName: 'ContactLists', cta: 'Create list', prerequisites: [],
        goals: ['marketing', 'both'], verificationKey: 'first-list', illustrationKey: 'audience',
      }),
      task({
        id: 'add-contacts', area: 'customers', title: 'Add contacts',
        description: 'Import or add the people you want to reach.',
        why: 'An empty audience cannot receive your message.', minutes: 5,
        icon: 'users', routeName: 'AllContacts', cta: 'Add contacts', prerequisites: ['first-list'],
        goals: ['marketing', 'both'], verificationKey: 'add-contacts', illustrationKey: 'audience',
      }),
      task({
        id: 'first-email', area: 'customers', title: 'Design your first email',
        description: 'Build an email in the editor or begin with a template.',
        why: 'A reusable design makes future campaigns faster.', minutes: 10,
        icon: 'mail', routeName: 'CreateCampaign', cta: 'Design email', prerequisites: ['sending-domain', 'first-list'],
        goals: ['marketing', 'both'], verificationKey: 'first-email', illustrationKey: 'audience',
      }),
      task({
        id: 'first-campaign', area: 'customers', title: 'Create and send your first campaign',
        description: 'Review the audience and content, then send when you are ready.',
        why: 'The first send brings the setup together.', minutes: 3,
        icon: 'send', routeName: 'CreateCampaign', cta: 'Create campaign', prerequisites: ['sending-domain', 'add-contacts', 'first-email'],
        goals: ['marketing', 'both'], verificationKey: 'first-campaign', illustrationKey: 'audience',
      }),
    ],
  },
  {
    id: 'support',
    title: 'Support your customers',
    blurb: 'Be ready when customers need help.',
    tasks: [
      task({
        id: 'support-inbox', area: 'support', title: 'Set up your support inbox',
        description: 'Connect the email address where customer questions arrive.',
        why: 'A shared inbox keeps every request visible.', minutes: 3,
        icon: 'inbox', routeName: 'SettingsService', cta: 'Set up inbox', prerequisites: [],
        goals: [], verificationKey: 'support-inbox', illustrationKey: 'complete',
      }),
      task({
        id: 'first-ticket', area: 'support', title: 'Handle your first ticket',
        description: 'Open a ticket and learn the support workflow.',
        why: 'Knowing the flow before launch makes the first request easier.', minutes: 3,
        icon: 'headset', routeName: 'Tickets', cta: 'Open tickets', prerequisites: ['support-inbox'],
        goals: [], verificationKey: 'first-ticket', illustrationKey: 'complete',
      }),
    ],
  },
]

export const ALL_ONBOARDING_TASKS = ONBOARDING_PHASES.flatMap((phase) => phase.tasks)
export const MARKETING_TASK_IDS = ['sending-domain', 'link-tracking', 'first-list', 'add-contacts', 'first-email', 'first-campaign'] as const
export const STORE_TASK_IDS = ['store-branding', 'inventory-location', 'first-product', 'payments', 'shipping', 'taxes', 'theme', 'domain'] as const

const LEGACY_STORAGE_KEY = 'mp.onboarding.v1'
const STORAGE_PREFIX = 'mp.onboarding.v2'
const LEGACY_MIGRATION_KEY = `${STORAGE_PREFIX}.legacy-migrated`

interface PersistedV2 {
  accountId: string
  taskStatuses: Record<string, SetupTaskStatus>
  updatedAt: string
}

interface PersistedV1 {
  completed?: Record<string, boolean>
  skipped?: Record<string, boolean>
}

const storageKey = (accountId: string) => `${STORAGE_PREFIX}:${accountId}`

export function migrateLegacyOnboardingState(raw: PersistedV1 | null | undefined): Record<string, SetupTaskStatus> {
  const statuses: Record<string, SetupTaskStatus> = {}
  for (const definition of ALL_ONBOARDING_TASKS) {
    if (raw?.completed?.[definition.id]) statuses[definition.id] = 'verified'
    else if (raw?.skipped?.[definition.id]) statuses[definition.id] = 'skipped'
  }
  return statuses
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const activeAccountId = ref<string | null>(null)
  const taskStatuses = ref<Record<string, SetupTaskStatus>>({})

  const completed = computed<Record<string, boolean>>(() => Object.fromEntries(
    ALL_ONBOARDING_TASKS.map(({ id }) => [id, ['verified', 'user-confirmed'].includes(statusFor(id))]),
  ))
  const skipped = computed<Record<string, boolean>>(() => Object.fromEntries(
    ALL_ONBOARDING_TASKS.map(({ id }) => [id, statusFor(id) === 'skipped']),
  ))

  const totalCount = ALL_ONBOARDING_TASKS.length
  const doneCount = computed(() => ALL_ONBOARDING_TASKS.filter(({ id }) => completed.value[id]).length)
  const progress = computed(() => Math.round((doneCount.value / totalCount) * 100))
  const allDone = computed(() => doneCount.value === totalCount)
  const allResolved = computed(() => ALL_ONBOARDING_TASKS.every(({ id }) => isResolved(id)))
  const skippedCount = computed(() => ALL_ONBOARDING_TASKS.filter(({ id }) => statusFor(id) === 'skipped').length)
  const nextTaskId = computed(() => ALL_ONBOARDING_TASKS.find(({ id }) => !isResolved(id))?.id ?? null)

  function persist() {
    if (!activeAccountId.value || typeof window === 'undefined') return
    try {
      const payload: PersistedV2 = {
        accountId: activeAccountId.value,
        taskStatuses: taskStatuses.value,
        updatedAt: new Date().toISOString(),
      }
      window.localStorage.setItem(storageKey(activeAccountId.value), JSON.stringify(payload))
    } catch {
      // Storage can be unavailable in private contexts; setup remains usable in memory.
    }
  }

  function activateAccount(accountId: string, options: { fresh?: boolean } = {}) {
    if (!accountId) return
    activeAccountId.value = accountId
    if (options.fresh) {
      taskStatuses.value = {}
      persist()
      return
    }

    const stored = readJson<PersistedV2>(storageKey(accountId))
    if (stored?.accountId === accountId && stored.taskStatuses) {
      taskStatuses.value = { ...stored.taskStatuses }
      return
    }

    let migrated: Record<string, SetupTaskStatus> = {}
    if (typeof window !== 'undefined' && !window.localStorage.getItem(LEGACY_MIGRATION_KEY)) {
      migrated = migrateLegacyOnboardingState(readJson<PersistedV1>(LEGACY_STORAGE_KEY))
      try { window.localStorage.setItem(LEGACY_MIGRATION_KEY, accountId) } catch { /* noop */ }
    }
    taskStatuses.value = migrated
    persist()
  }

  function statusFor(id: string): SetupTaskStatus {
    return taskStatuses.value[id] ?? 'pending'
  }

  function isResolved(id: string) {
    return ['verified', 'user-confirmed', 'skipped'].includes(statusFor(id))
  }

  function setStatus(id: string, status: SetupTaskStatus) {
    if (!ALL_ONBOARDING_TASKS.some((definition) => definition.id === id)) return
    taskStatuses.value = { ...taskStatuses.value, [id]: status }
    persist()
  }

  function complete(id: string) { setStatus(id, 'verified') }
  function confirm(id: string) { setStatus(id, 'user-confirmed') }
  function block(id: string) { setStatus(id, 'blocked') }
  function uncomplete(id: string) { setStatus(id, 'pending') }
  function skip(id: string) { setStatus(id, 'skipped') }
  function unskip(id: string) { setStatus(id, 'pending') }

  function phaseDone(phaseId: string): number {
    return ONBOARDING_PHASES.find((phase) => phase.id === phaseId)?.tasks.filter(({ id }) => completed.value[id]).length ?? 0
  }

  function nextTasks(limit: number): OnboardingTask[] {
    return ALL_ONBOARDING_TASKS.filter(({ id }) => !isResolved(id)).slice(0, limit)
  }

  function taskById(id: string | null | undefined) {
    return ALL_ONBOARDING_TASKS.find((definition) => definition.id === id) ?? null
  }

  function reset() {
    taskStatuses.value = {}
    persist()
  }

  return {
    activeAccountId, taskStatuses, completed, skipped,
    totalCount, doneCount, progress, allDone, allResolved, skippedCount, nextTaskId,
    activateAccount, statusFor, isResolved, setStatus, complete, confirm, block,
    uncomplete, skip, unskip, phaseDone, nextTasks, taskById, reset,
  }
})
