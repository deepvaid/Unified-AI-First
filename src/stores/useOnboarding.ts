// Get Started onboarding — phased merchant setup guide (Shopify-style).
// Single source of truth for the guide page (views/GetStarted.vue), the sidebar
// "Get started" pill, and the Dashboard setup-guide widget. Task completion is
// persisted, and key tasks auto-complete when the real action happens in the app
// (see the `complete()` calls inside useCommerce/useCampaigns/useContacts/useTickets).
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

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
      },
    ],
  },
]

const ALL_TASKS: OnboardingTask[] = ONBOARDING_PHASES.flatMap((p) => p.tasks)

const STORAGE_KEY = 'mp.onboarding.v1'

interface PersistedState {
  completed: Record<string, boolean>
  skipped: Record<string, boolean>
}

function readPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedState) : null
  } catch {
    return null
  }
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const persisted = readPersisted()
  // Seed a lived-in demo state: the domain and first product are already done.
  const completed = ref<Record<string, boolean>>(
    persisted?.completed ?? { 'sending-domain': true, 'first-product': true }
  )
  const skipped = ref<Record<string, boolean>>(persisted?.skipped ?? {})

  watch(
    [completed, skipped],
    () => {
      if (typeof window === 'undefined') return
      try {
        const state: PersistedState = {
          completed: completed.value,
          skipped: skipped.value,
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* private mode etc. */
      }
    },
    { deep: true }
  )

  const totalCount = ALL_TASKS.length
  const doneCount = computed(() => ALL_TASKS.filter((t) => completed.value[t.id]).length)
  const progress = computed(() => Math.round((doneCount.value / totalCount) * 100))
  const allDone = computed(() => doneCount.value === totalCount)
  /** Every task addressed (completed OR skipped) — nothing left to act on. Drives the
   *  terminal celebration and the auto-retiring of the sidebar pill. Mirrors nextTaskId. */
  const allResolved = computed(() => ALL_TASKS.every((t) => completed.value[t.id] || skipped.value[t.id]))
  const skippedCount = computed(() => ALL_TASKS.filter((t) => !completed.value[t.id] && skipped.value[t.id]).length)

  /** First task that is neither complete nor skipped (guide auto-expands this one). */
  const nextTaskId = computed(
    () => ALL_TASKS.find((t) => !completed.value[t.id] && !skipped.value[t.id])?.id ?? null
  )

  function phaseDone(phaseId: string): number {
    const phase = ONBOARDING_PHASES.find((p) => p.id === phaseId)
    return phase ? phase.tasks.filter((t) => completed.value[t.id]).length : 0
  }

  /** Next unresolved tasks across phases — feeds the Dashboard widget. Excludes both
   *  completed and skipped, matching nextTaskId so a skipped task doesn't reappear. */
  function nextTasks(limit: number): OnboardingTask[] {
    return ALL_TASKS.filter((t) => !completed.value[t.id] && !skipped.value[t.id]).slice(0, limit)
  }

  function complete(id: string) {
    if (!completed.value[id]) {
      completed.value = { ...completed.value, [id]: true }
      if (skipped.value[id]) skipped.value = { ...skipped.value, [id]: false }
    }
  }
  function uncomplete(id: string) {
    completed.value = { ...completed.value, [id]: false }
  }
  function skip(id: string) {
    skipped.value = { ...skipped.value, [id]: true }
  }
  function unskip(id: string) {
    skipped.value = { ...skipped.value, [id]: false }
  }
  function reset() {
    completed.value = {}
    skipped.value = {}
  }

  return {
    completed,
    skipped,
    totalCount,
    doneCount,
    progress,
    allDone,
    allResolved,
    skippedCount,
    nextTaskId,
    phaseDone,
    nextTasks,
    complete,
    uncomplete,
    skip,
    unskip,
    reset,
  }
})
