// Get Started onboarding — phased merchant setup guide (Shopify-style).
// Single source of truth for the guide page (views/GetStarted.vue), the sidebar
// "Get started" pill, the Dashboard setup-guide widget, and the Da Vinci guided
// setup conversation. Task state is persisted per account, and key tasks
// auto-complete when the real action happens in the app (see the `complete()`
// calls inside useCommerce/useCampaigns/useContacts/useTickets).
//
// The visible plan is subscription-aware: paid accounts see the tasks for the
// clouds they bought; trial accounts see the tasks for the goal they chose in
// the Da Vinci guided setup (goal ∩ subscribed clouds).
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAccountsStore } from '@/stores/useAccounts'
import { usePlgStore, type PlgCloud } from '@/stores/usePlg'

/** What the merchant wants to get working first (chosen in Da Vinci guided setup). */
export type SetupGoal = 'marketing' | 'store' | 'both' | 'service' | 'explore'

/**
 * verified      — the product action really happened (auto-completion hooks)
 * user-confirmed — the merchant said they did it; we could not verify it
 */
export type SetupTaskStatus = 'pending' | 'verified' | 'user-confirmed' | 'skipped'

export interface OnboardingTask {
  id: string
  title: string
  description: string
  /** One-line "why it matters" shown on the expanded step. */
  why: string
  /** Rough time-to-complete, shown as a chip. */
  minutes: number
  icon: string
  /** Route name the primary CTA deep-links to (params: { accountId }). */
  routeName: string
  cta: string
  /** Which cloud this task belongs to — drives the subscription/goal filter. */
  cloud: PlgCloud
  /** Task ids that should be resolved before this one makes sense. */
  prerequisites?: string[]
}

export interface OnboardingPhase {
  id: string
  title: string
  blurb: string
  tasks: OnboardingTask[]
}

export const ONBOARDING_PHASES: OnboardingPhase[] = [
  {
    id: 'email',
    title: 'Make your email deliverable',
    blurb: 'Two quick technical steps so your campaigns land in inboxes, not spam folders.',
    tasks: [
      {
        id: 'sending-domain',
        title: 'Authenticate your sending domain',
        description: 'Add the DNS records that prove your email really comes from you.',
        why: 'Authenticated domains see dramatically better inbox placement.',
        minutes: 5,
        icon: 'shield-check',
        routeName: 'SettingsDnsSetup',
        cta: 'Set up DNS',
        cloud: 'marketing',
      },
      {
        id: 'link-tracking',
        title: 'Turn on link tracking',
        description: 'Brand your tracking links so opens and clicks are measured reliably.',
        why: 'Without it, campaign engagement reporting is blind.',
        minutes: 2,
        icon: 'link',
        routeName: 'SettingsDnsSetup',
        cta: 'Configure tracking',
        cloud: 'marketing',
        prerequisites: ['sending-domain'],
      },
    ],
  },
  {
    id: 'store',
    title: 'Open your store',
    blurb: 'Everything a customer needs to find you, browse, and pay.',
    tasks: [
      {
        id: 'inventory-location',
        title: 'Set your inventory location',
        description: 'Tell us where stock lives so inventory and alerts stay accurate.',
        why: 'Orders can’t route without a fulfillment location.',
        minutes: 2,
        icon: 'map-pin',
        routeName: 'Inventory',
        cta: 'Set location',
        cloud: 'commerce',
      },
      {
        id: 'first-product',
        title: 'Add your first product',
        description: 'Create and publish your first product listing.',
        why: 'Your catalog starts here — everything else builds on it.',
        minutes: 5,
        icon: 'package',
        routeName: 'ProductNew',
        cta: 'Add product',
        cloud: 'commerce',
      },
      {
        id: 'store-branding',
        title: 'Name your store & upload a logo',
        description: 'Set the name and logo customers see everywhere.',
        why: 'Consistent branding builds trust from the first visit.',
        minutes: 3,
        icon: 'store',
        routeName: 'SettingsAccountDefaults',
        cta: 'Set branding',
        cloud: 'commerce',
      },
      {
        id: 'theme',
        title: 'Pick a theme',
        description: 'Choose and customize the look of your storefront.',
        why: 'A polished storefront converts browsers into buyers.',
        minutes: 10,
        icon: 'palette',
        routeName: 'SalesChannels',
        cta: 'Choose theme',
        cloud: 'commerce',
        prerequisites: ['first-product'],
      },
      {
        id: 'shipping',
        title: 'Set shipping zones & rates',
        description: 'Define where you ship, what it costs, and how long it takes.',
        why: 'Surprise shipping costs are the #1 cause of abandoned carts.',
        minutes: 8,
        icon: 'truck',
        routeName: 'SettingsSalesChannels',
        cta: 'Configure shipping',
        cloud: 'commerce',
      },
      {
        id: 'taxes',
        title: 'Configure taxes',
        description: 'Set up tax collection for the regions you sell in.',
        why: 'Correct tax from day one saves painful cleanup later.',
        minutes: 5,
        icon: 'receipt',
        routeName: 'ProductTaxCategory',
        cta: 'Set up taxes',
        cloud: 'commerce',
      },
      {
        id: 'payments',
        title: 'Connect a payment gateway',
        description: 'Choose how you want to accept payments at checkout.',
        why: 'No gateway, no revenue — this one unblocks selling.',
        minutes: 5,
        icon: 'credit-card',
        routeName: 'SettingsPaymentAccount',
        cta: 'Add payments',
        cloud: 'commerce',
      },
      {
        id: 'domain',
        title: 'Connect your domain',
        description: 'Point your custom domain at your new storefront.',
        why: 'Your own domain looks professional and carries your SEO.',
        minutes: 5,
        icon: 'globe',
        routeName: 'SettingsDnsSetup',
        cta: 'Connect domain',
        cloud: 'commerce',
      },
    ],
  },
  {
    id: 'customers',
    title: 'Reach your customers',
    blurb: 'Bring your audience in and send your first campaign.',
    tasks: [
      {
        id: 'first-list',
        title: 'Create your first list',
        description: 'Organize contacts into a list you can target.',
        why: 'Lists are the foundation of every send and journey.',
        minutes: 2,
        icon: 'list-checks',
        routeName: 'ContactLists',
        cta: 'Create list',
        cloud: 'marketing',
      },
      {
        id: 'add-contacts',
        title: 'Add contacts',
        description: 'Import or add the people you want to reach.',
        why: 'An empty audience can’t hear your message.',
        minutes: 5,
        icon: 'users',
        routeName: 'AllContacts',
        cta: 'Add contacts',
        cloud: 'marketing',
        prerequisites: ['first-list'],
      },
      {
        id: 'first-email',
        title: 'Design your first email',
        description: 'Build an email with the editor or start from a template.',
        why: 'Templates get you to a professional email in minutes.',
        minutes: 10,
        icon: 'mail',
        routeName: 'CreateCampaign',
        cta: 'Design email',
        cloud: 'marketing',
        prerequisites: ['sending-domain', 'first-list'],
      },
      {
        id: 'first-campaign',
        title: 'Send your first campaign',
        description: 'Pick a list, hit send, and watch the results roll in.',
        why: 'The first send is where everything comes together.',
        minutes: 3,
        icon: 'send',
        routeName: 'CreateCampaign',
        cta: 'Send campaign',
        cloud: 'marketing',
        prerequisites: ['add-contacts', 'first-email'],
      },
    ],
  },
  {
    id: 'support',
    title: 'Support your customers',
    blurb: 'Be ready when customers reach out.',
    tasks: [
      {
        id: 'support-inbox',
        title: 'Set up your support inbox',
        description: 'Connect the email address customer inquiries arrive at.',
        why: 'Fast first replies are the strongest loyalty signal.',
        minutes: 3,
        icon: 'inbox',
        routeName: 'SettingsService',
        cta: 'Set up inbox',
        cloud: 'service',
      },
      {
        id: 'first-ticket',
        title: 'Handle your first ticket',
        description: 'Create a ticket and see the support workflow end to end.',
        why: 'Knowing the flow before launch means no scrambling after.',
        minutes: 3,
        icon: 'headset',
        routeName: 'Tickets',
        cta: 'Open tickets',
        cloud: 'service',
        prerequisites: ['support-inbox'],
      },
    ],
  },
]

/** Every task definition, in phase order — the unfiltered catalog. */
export const ALL_ONBOARDING_TASKS: OnboardingTask[] = ONBOARDING_PHASES.flatMap((p) => p.tasks)

/** Clouds a goal draws tasks from; null = every cloud the account subscribes to. */
const GOAL_CLOUDS: Record<SetupGoal, PlgCloud[] | null> = {
  marketing: ['marketing'],
  store: ['commerce'],
  both: ['marketing', 'commerce'],
  service: ['service'],
  explore: null,
}

/** Guided-path ordering: deliverability/marketing quick wins first, then store, then support. */
const CLOUD_ORDER: PlgCloud[] = ['marketing', 'commerce', 'retail', 'service']

const LEGACY_STORAGE_KEY = 'mp.onboarding.v1'
const STORAGE_PREFIX = 'mp.onboarding.v2'
const MIGRATION_MARKER = 'mp.onboarding.v2.migrated'

interface PersistedAccountState {
  statuses: Record<string, SetupTaskStatus>
  goal: SetupGoal | null
  updatedAt: string
}

/** Lived-in demo state for seed accounts: domain and first product already done. */
function demoSeedStatuses(): Record<string, SetupTaskStatus> {
  return { 'sending-domain': 'verified', 'first-product': 'verified' }
}

function storageKey(accountId: string) {
  return `${STORAGE_PREFIX}:${accountId}`
}

function readAccountState(accountId: string): PersistedAccountState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(accountId))
    return raw ? (JSON.parse(raw) as PersistedAccountState) : null
  } catch {
    return null
  }
}

/** One-time upgrade of the old global v1 record into the first activated account. */
function migrateLegacyState(): Record<string, SetupTaskStatus> | null {
  if (typeof window === 'undefined') return null
  try {
    if (window.localStorage.getItem(MIGRATION_MARKER)) return null
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    window.localStorage.setItem(MIGRATION_MARKER, '1')
    const legacy = JSON.parse(raw) as { completed?: Record<string, boolean>; skipped?: Record<string, boolean> }
    const statuses: Record<string, SetupTaskStatus> = {}
    for (const [id, done] of Object.entries(legacy.completed ?? {})) if (done) statuses[id] = 'verified'
    for (const [id, skip] of Object.entries(legacy.skipped ?? {})) {
      if (skip && statuses[id] !== 'verified') statuses[id] = 'skipped'
    }
    return statuses
  } catch {
    return null
  }
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const accounts = useAccountsStore()
  const plg = usePlgStore()

  const activeAccountId = ref<string | null>(null)
  const statuses = ref<Record<string, SetupTaskStatus>>({})
  const goal = ref<SetupGoal | null>(null)

  function persist() {
    if (typeof window === 'undefined' || !activeAccountId.value) return
    try {
      const state: PersistedAccountState = {
        statuses: statuses.value,
        goal: goal.value,
        updatedAt: new Date().toISOString(),
      }
      window.localStorage.setItem(storageKey(activeAccountId.value), JSON.stringify(state))
    } catch {
      /* private mode etc. */
    }
  }

  function activateAccount(accountId: string) {
    if (!accountId || activeAccountId.value === accountId) return
    activeAccountId.value = accountId
    const stored = readAccountState(accountId)
    if (stored) {
      statuses.value = stored.statuses ?? {}
      goal.value = stored.goal ?? null
      return
    }
    const migrated = migrateLegacyState()
    statuses.value = migrated ?? demoSeedStatuses()
    goal.value = null
    persist()
  }

  // Sync flush: callers mutate right after accounts.switchTo() (e.g. signup
  // resets the fresh account's checklist) — activation must not lag a tick.
  watch(() => accounts.activeId, (id) => activateAccount(id), { immediate: true, flush: 'sync' })

  // ── Subscription/goal-aware plan ──────────────────────────────────────────

  /** Clouds the account subscribes to, folded onto the task vocabulary (retail → commerce). */
  const subscribedClouds = computed<Set<PlgCloud>>(() => {
    const subs = accounts.activeAccount?.subscriptions ?? []
    const clouds = new Set<PlgCloud>()
    if (subs.includes('marketing')) clouds.add('marketing')
    if (subs.includes('commerce') || subs.includes('retail')) clouds.add('commerce')
    if (subs.includes('service')) clouds.add('service')
    return clouds
  })

  /**
   * Clouds the visible plan draws from:
   * paid → purchased tiers (retail counts as commerce); trial → chosen goal ∩ subscribed;
   * no goal yet (or "explore") → every subscribed cloud.
   */
  const planClouds = computed<Set<PlgCloud>>(() => {
    if (!plg.isTrial) {
      const tiers = Object.keys(plg.active.tiers) as PlgCloud[]
      const clouds = new Set<PlgCloud>()
      for (const tier of tiers) clouds.add(tier === 'retail' ? 'commerce' : tier)
      // Defensive: an account with no tier data falls back to its subscriptions.
      return clouds.size ? clouds : subscribedClouds.value
    }
    const goalClouds = goal.value ? GOAL_CLOUDS[goal.value] : null
    if (!goalClouds) return subscribedClouds.value
    return new Set(goalClouds.filter((cloud) => subscribedClouds.value.has(cloud)))
  })

  /** The personalized plan, in guided order (marketing quick wins → store → support). */
  const planTasks = computed<OnboardingTask[]>(() => {
    const tasks = ALL_ONBOARDING_TASKS.filter((t) => planClouds.value.has(t.cloud))
    return [...tasks].sort((a, b) => CLOUD_ORDER.indexOf(a.cloud) - CLOUD_ORDER.indexOf(b.cloud))
  })

  /** Phases with only the tasks in the current plan — feeds the Get Started page. */
  const visiblePhases = computed<OnboardingPhase[]>(() =>
    ONBOARDING_PHASES
      .map((p) => ({ ...p, tasks: p.tasks.filter((t) => planClouds.value.has(t.cloud)) }))
      .filter((p) => p.tasks.length > 0)
  )

  // ── Status accessors (completed/skipped kept for existing consumers) ──────

  function statusFor(id: string): SetupTaskStatus {
    return statuses.value[id] ?? 'pending'
  }

  function isResolved(id: string): boolean {
    return statusFor(id) !== 'pending'
  }

  function taskById(id: string | null | undefined): OnboardingTask | null {
    if (!id) return null
    return ALL_ONBOARDING_TASKS.find((t) => t.id === id) ?? null
  }

  const completed = computed<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const [id, status] of Object.entries(statuses.value)) {
      map[id] = status === 'verified' || status === 'user-confirmed'
    }
    return map
  })

  const skipped = computed<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const [id, status] of Object.entries(statuses.value)) map[id] = status === 'skipped'
    return map
  })

  const totalCount = computed(() => planTasks.value.length)
  const doneCount = computed(() => planTasks.value.filter((t) => completed.value[t.id]).length)
  const progress = computed(() =>
    totalCount.value ? Math.round((doneCount.value / totalCount.value) * 100) : 0
  )
  const allDone = computed(() => totalCount.value > 0 && doneCount.value === totalCount.value)
  /** Every plan task addressed (completed OR skipped) — nothing left to act on. Drives the
   *  terminal celebration and the auto-retiring of the sidebar pill. Mirrors nextTaskId. */
  const allResolved = computed(() => planTasks.value.every((t) => isResolved(t.id)))
  const skippedCount = computed(() => planTasks.value.filter((t) => skipped.value[t.id]).length)

  /** First plan task that is neither complete nor skipped (guide auto-expands this one). */
  const nextTaskId = computed(() => planTasks.value.find((t) => !isResolved(t.id))?.id ?? null)

  /** One gate for every guide surface (sidebar pill, dashboard widget): accounts that
   *  went through the PLG journey (trial or purchased) and still have work left. */
  const showGuideSurfaces = computed(
    () => plg.hasExplicitState && !plg.isExpired && !allResolved.value
  )

  function phaseDone(phaseId: string): number {
    const phase = visiblePhases.value.find((p) => p.id === phaseId)
    return phase ? phase.tasks.filter((t) => completed.value[t.id]).length : 0
  }

  /** Next unresolved plan tasks — feeds the Dashboard widget. Excludes both
   *  completed and skipped, matching nextTaskId so a skipped task doesn't reappear. */
  function nextTasks(limit: number): OnboardingTask[] {
    return planTasks.value.filter((t) => !isResolved(t.id)).slice(0, limit)
  }

  function setStatus(id: string, status: SetupTaskStatus) {
    statuses.value = { ...statuses.value, [id]: status }
    persist()
  }

  /** Product-verified completion — called by the auto-completion hooks. */
  function complete(id: string) {
    if (statusFor(id) !== 'verified') setStatus(id, 'verified')
  }

  /** The merchant confirmed a task we could not verify from product state. */
  function confirm(id: string) {
    if (statusFor(id) !== 'verified') setStatus(id, 'user-confirmed')
  }

  function uncomplete(id: string) {
    setStatus(id, 'pending')
  }

  function skip(id: string) {
    if (!completed.value[id]) setStatus(id, 'skipped')
  }

  function unskip(id: string) {
    if (statusFor(id) === 'skipped') setStatus(id, 'pending')
  }

  function setGoal(next: SetupGoal | null) {
    goal.value = next
    persist()
  }

  /** Clears progress AND goal for the active account (fresh signups call this). */
  function reset() {
    statuses.value = {}
    goal.value = null
    persist()
  }

  return {
    activeAccountId,
    goal,
    statuses,
    completed,
    skipped,
    planClouds,
    planTasks,
    visiblePhases,
    totalCount,
    doneCount,
    progress,
    allDone,
    allResolved,
    skippedCount,
    nextTaskId,
    showGuideSurfaces,
    statusFor,
    isResolved,
    taskById,
    phaseDone,
    nextTasks,
    complete,
    confirm,
    uncomplete,
    skip,
    unskip,
    setGoal,
    reset,
  }
})
