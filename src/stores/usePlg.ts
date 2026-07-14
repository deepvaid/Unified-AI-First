import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useAccountsStore, type Account } from './useAccounts'

/**
 * PLG (Product-Led Growth) subscription state — trial lifecycle, per-cloud
 * plan tiers, entitlements, and demo presets. Mock-data only.
 *
 * Accounts without an explicit entry here synthesize a fully-paid default,
 * so the seed demo accounts are visually unchanged by PLG surfaces.
 */

export type PlgCloud = 'marketing' | 'commerce' | 'service'
export type PlanTier = 'build' | 'essential' | 'professional' | 'enterprise'
export type BillingCycle = 'monthly' | 'annual'
export type AddOnKey = 'sms_usage' | 'dedicated_ip' | 'davinci_tokens'
export type PlgStatus = 'trialing' | 'trial_expired' | 'active' | 'grace' | 'cancelled_pending'

/** limit === -1 means unlimited */
export interface UsageMeter {
  used: number
  limit: number
}

export interface PlgUsage {
  aiTokens: UsageMeter
  sms: UsageMeter
  chatbots: UsageMeter
  emailSends: UsageMeter
  stores: UsageMeter
  skus: UsageMeter
}

export interface PlgAccountState {
  mode: 'trial' | 'paid'
  status: PlgStatus
  cycle: BillingCycle
  /** ISO date the trial started (also used as subscription start for paid). */
  startedAt: string
  /** ISO date the 14-day trial ends; meaningful while mode === 'trial'. */
  trialEndsAt: string
  /** Per-cloud paid tier; empty while trialing. */
  tiers: Partial<Record<PlgCloud, PlanTier>>
  addOns: AddOnKey[]
  usage: PlgUsage
  cancelAt?: string
  renewsAt?: string
  gracePaymentFailedAt?: string
}

export interface TrialSignupPayload {
  firstName: string
  lastName: string
  email: string
  companyName: string
  companyUrl: string
}

export interface PlgEntitlements {
  sms: boolean
  davinciAi: boolean
  /** -1 = unlimited */
  chatbotLimit: number
  emailSendLimit: number
  storeLimit: number
  skuLimit: number
  aiTokenLimit: number
}

// ---------------------------------------------------------------------------
// Plan catalog (pricing + features per cloud, sourced from PLG Figma comps)
// ---------------------------------------------------------------------------

export interface PlanFeature {
  label: string
  included: boolean
}

export interface PlanDef {
  tier: PlanTier
  name: string
  /** USD per month, monthly billing. Annual = monthly × 12 × 0.9. */
  monthly: number
  badge: string
  features: PlanFeature[]
}

export interface CloudCatalog {
  cloud: PlgCloud
  name: string
  tagline: string
  icon: string
  plans: PlanDef[]
}

export const ANNUAL_DISCOUNT = 0.1

export function planPrice(def: PlanDef, cycle: BillingCycle): number {
  return cycle === 'annual' ? Math.round(def.monthly * 12 * (1 - ANNUAL_DISCOUNT)) : def.monthly
}

const TIER_ORDER: PlanTier[] = ['build', 'essential', 'professional', 'enterprise']

export function tierRank(tier: PlanTier): number {
  return TIER_ORDER.indexOf(tier)
}

export const PLAN_CATALOG: CloudCatalog[] = [
  {
    cloud: 'marketing',
    name: 'Marketing Cloud',
    tagline: 'Email, automation, and audience growth — everything you need to reach customers.',
    icon: 'send',
    plans: [
      {
        tier: 'build',
        name: 'Build',
        monthly: 29,
        badge: 'Start here',
        features: [
          { label: '50K marketing contacts / mo', included: true },
          { label: '300K emails / mo', included: true },
          { label: '1 landing page', included: true },
          { label: '5 active journeys', included: true },
          { label: 'Da Vinci AI', included: false },
          { label: 'Relational tables', included: false },
        ],
      },
      {
        tier: 'essential',
        name: 'Essential',
        monthly: 299,
        badge: 'Grow faster',
        features: [
          { label: '250K marketing contacts / mo', included: true },
          { label: '2M emails / mo', included: true },
          { label: '3 landing pages', included: true },
          { label: '10 active journeys', included: true },
          { label: 'Da Vinci AI (sized allocation)', included: true },
          { label: 'Relational tables', included: false },
        ],
      },
      {
        tier: 'professional',
        name: 'Professional',
        monthly: 899,
        badge: 'Most popular',
        features: [
          { label: '1M marketing contacts / mo', included: true },
          { label: '10M emails / mo', included: true },
          { label: 'Unlimited landing pages', included: true },
          { label: '15 active journeys', included: true },
          { label: 'Da Vinci AI (large allocation)', included: true },
          { label: 'Relational tables', included: false },
        ],
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        monthly: 1799,
        badge: 'For scaling',
        features: [
          { label: '5M marketing contacts / mo', included: true },
          { label: '50M emails / mo', included: true },
          { label: 'Unlimited landing pages', included: true },
          { label: 'Unlimited active journeys', included: true },
          { label: 'Da Vinci AI (custom)', included: true },
          { label: 'Relational tables', included: true },
        ],
      },
    ],
  },
  {
    cloud: 'commerce',
    name: 'Commerce Cloud',
    tagline: 'Front end to back end, everything you need on one powerful ecommerce platform.',
    icon: 'shopping-cart',
    plans: [
      {
        tier: 'build',
        name: 'Build',
        monthly: 29,
        badge: 'Start here',
        features: [
          { label: '10K products', included: true },
          { label: '2 inventory locations', included: true },
          { label: '1 storefront', included: true },
          { label: '5 customer groups', included: true },
          { label: 'Da Vinci AI', included: false },
        ],
      },
      {
        tier: 'essential',
        name: 'Essential',
        monthly: 199,
        badge: 'Grow faster',
        features: [
          { label: 'Unlimited products', included: true },
          { label: '2 inventory locations', included: true },
          { label: '2 storefronts', included: true },
          { label: 'Unlimited customer groups', included: true },
          { label: 'Da Vinci AI (sized allocation)', included: true },
        ],
      },
      {
        tier: 'professional',
        name: 'Professional',
        monthly: 789,
        badge: 'Most popular',
        features: [
          { label: 'Unlimited products', included: true },
          { label: '5 inventory locations', included: true },
          { label: '5 storefronts', included: true },
          { label: 'Unlimited customer groups', included: true },
          { label: 'Da Vinci AI (large allocation)', included: true },
        ],
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        monthly: 1999,
        badge: 'For scaling',
        features: [
          { label: 'Unlimited products', included: true },
          { label: '10 inventory locations', included: true },
          { label: '20 storefronts', included: true },
          { label: 'Unlimited customer groups', included: true },
          { label: 'Da Vinci AI (custom)', included: true },
        ],
      },
    ],
  },
  {
    cloud: 'service',
    name: 'Service Cloud',
    tagline: 'Tickets, helpdesk, and customer support.',
    icon: 'headphones',
    plans: [
      {
        tier: 'build',
        name: 'Build',
        monthly: 29,
        badge: 'Start here',
        features: [
          { label: '200 tickets / mo', included: true },
          { label: '1 support email', included: true },
          { label: '1 chatbot', included: true },
          { label: 'Da Vinci AI', included: false },
        ],
      },
      {
        tier: 'essential',
        name: 'Essential',
        monthly: 59,
        badge: 'Grow faster',
        features: [
          { label: '2,000 tickets / mo', included: true },
          { label: '2 support emails', included: true },
          { label: '3 chatbots', included: true },
          { label: 'Da Vinci AI (sized allocation)', included: true },
        ],
      },
      {
        tier: 'professional',
        name: 'Professional',
        monthly: 379,
        badge: 'Most popular',
        features: [
          { label: '6,000 tickets / mo', included: true },
          { label: '5 support emails', included: true },
          { label: '10 chatbots', included: true },
          { label: 'Da Vinci AI (large allocation)', included: true },
        ],
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        monthly: 899,
        badge: 'For scaling',
        features: [
          { label: '20K tickets / mo', included: true },
          { label: 'Unlimited support emails', included: true },
          { label: 'Unlimited chatbots', included: true },
          { label: 'Da Vinci AI (custom)', included: true },
        ],
      },
    ],
  },
]

export interface AddOnDef {
  key: AddOnKey
  name: string
  description: string
  icon: string
  /** monthly USD; null = priced via sales */
  monthly: number | null
}

export const ADD_ON_CATALOG: AddOnDef[] = [
  {
    key: 'sms_usage',
    name: 'SMS Usage',
    description: 'Scale your sending capacity as you grow.',
    icon: 'message-square',
    monthly: null,
  },
  {
    key: 'dedicated_ip',
    name: 'Dedicated IP',
    description: 'Improve deliverability with a dedicated IP address.',
    icon: 'globe',
    monthly: 79,
  },
  {
    key: 'davinci_tokens',
    name: 'Da Vinci AI tokens',
    description: 'Extra AI token allocation for copilot and generation.',
    icon: 'sparkles',
    monthly: 49,
  },
]

// ---------------------------------------------------------------------------
// Demo presets (stakeholder walkthroughs)
// ---------------------------------------------------------------------------

export type PlgDemoPreset =
  | 'trial-d3'
  | 'trial-d12'
  | 'trial-expired'
  | 'paid-build'
  | 'paid-essential'
  | 'paid-professional'
  | 'paid-enterprise'
  | 'grace'

export const PLG_DEMO_PRESETS: { key: PlgDemoPreset; label: string }[] = [
  { key: 'trial-d3', label: 'Trial — day 3' },
  { key: 'trial-d12', label: 'Trial — day 12 (expiring)' },
  { key: 'trial-expired', label: 'Trial — expired' },
  { key: 'paid-build', label: 'Paid — Build' },
  { key: 'paid-essential', label: 'Paid — Essential' },
  { key: 'paid-professional', label: 'Paid — Professional' },
  { key: 'paid-enterprise', label: 'Paid — Enterprise' },
  { key: 'grace', label: 'Payment failed (grace)' },
]

export function isPlgDemoPreset(v: unknown): v is PlgDemoPreset {
  return typeof v === 'string' && PLG_DEMO_PRESETS.some(p => p.key === v)
}

// ---------------------------------------------------------------------------
// Trial onboarding checklist (micro-onboarding tasks, shared by the dashboard
// setup guide and the sidebar "Get started" entry)
// ---------------------------------------------------------------------------

export interface PlgOnboardingTask {
  title: string
  description: string
  icon: string
  routeName: string
  status: string
  complete: boolean
}

export const PLG_ONBOARDING_TASKS: PlgOnboardingTask[] = [
  {
    title: 'Create your workspace',
    description: 'Your 14-day trial of all three clouds is active.',
    icon: 'circle-check',
    routeName: 'Dashboard',
    status: 'Done',
    complete: true,
  },
  {
    title: 'Import your contacts',
    description: 'Bring your audience into Marketing Cloud.',
    icon: 'users',
    routeName: 'AllContacts',
    status: 'To do',
    complete: false,
  },
  {
    title: 'Send your first campaign',
    description: 'Build and send an email in minutes.',
    icon: 'send',
    routeName: 'EmailCampaigns',
    status: 'To do',
    complete: false,
  },
  {
    title: 'Launch a chatbot',
    description: 'Answer customers automatically with Service Cloud.',
    icon: 'bot',
    routeName: 'ChatbotList',
    status: 'To do',
    complete: false,
  },
  {
    title: 'Connect your store',
    description: 'Set up channels, checkout, and fulfillment.',
    icon: 'store',
    routeName: 'StoreSetup',
    status: 'To do',
    complete: false,
  },
]

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'mp.plg.v1'
const TRIAL_DAYS = 14
const DAY_MS = 86_400_000

function isoIn(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

/** Trial limits per the PLG PRD (MMC: no SMS + capped sends/AI, MSC: 1 chatbot, MCC: store/SKU caps). */
function trialUsage(): PlgUsage {
  return {
    aiTokens: { used: 12_400, limit: 50_000 },
    sms: { used: 0, limit: 0 },
    chatbots: { used: 1, limit: 1 },
    emailSends: { used: 2_350, limit: 10_000 },
    stores: { used: 1, limit: 1 },
    skus: { used: 148, limit: 1_000 },
  }
}

const TIER_AI_TOKENS: Record<PlanTier, number> = {
  build: 0,
  essential: 100_000,
  professional: 500_000,
  enterprise: -1,
}

const TIER_EMAIL_SENDS: Record<PlanTier, number> = {
  build: 300_000,
  essential: 2_000_000,
  professional: 10_000_000,
  enterprise: 50_000_000,
}

const TIER_CHATBOTS: Record<PlanTier, number> = {
  build: 1,
  essential: 3,
  professional: 10,
  enterprise: -1,
}

const TIER_STORES: Record<PlanTier, number> = {
  build: 1,
  essential: 2,
  professional: 5,
  enterprise: 20,
}

function paidUsage(tiers: Partial<Record<PlgCloud, PlanTier>>): PlgUsage {
  const m = tiers.marketing
  const s = tiers.service
  const c = tiers.commerce
  const best = ([...Object.values(tiers)] as PlanTier[]).sort((a, b) => tierRank(b) - tierRank(a))[0]
  return {
    aiTokens: { used: 182_000, limit: best ? TIER_AI_TOKENS[best] : 0 },
    sms: { used: 4_820, limit: m && m !== 'build' ? 25_000 : 0 },
    chatbots: { used: 1, limit: s ? TIER_CHATBOTS[s] : 0 },
    emailSends: { used: 640_000, limit: m ? TIER_EMAIL_SENDS[m] : 0 },
    stores: { used: 1, limit: c ? TIER_STORES[c] : 0 },
    skus: { used: 3_240, limit: c && c !== 'build' ? -1 : 10_000 },
  }
}

function readStoredStates(): Record<string, PlgAccountState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Synthesized "always was paid" state for seed accounts — keeps them pixel-identical. */
function defaultPaidState(account: Account): PlgAccountState {
  const tiers: Partial<Record<PlgCloud, PlanTier>> = {}
  if (account.subscriptions.includes('marketing')) tiers.marketing = 'professional'
  if (account.subscriptions.includes('commerce')) tiers.commerce = 'professional'
  if (account.subscriptions.includes('service')) tiers.service = 'professional'
  return {
    mode: 'paid',
    status: 'active',
    cycle: 'monthly',
    startedAt: isoIn(-180),
    trialEndsAt: isoIn(-166),
    tiers,
    addOns: ['dedicated_ip'],
    usage: paidUsage(tiers),
    renewsAt: isoIn(21),
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePlgStore = defineStore('plg', () => {
  const accounts = useAccountsStore()

  /** Only demo-created or demo-overridden accounts live here. */
  const states = ref<Record<string, PlgAccountState>>(readStoredStates())

  function stateFor(accountId: string): PlgAccountState {
    const stored = states.value[accountId]
    if (stored) return stored
    const account = accounts.accounts.find(a => a.id === accountId)
    return defaultPaidState(account ?? accounts.activeAccount)
  }

  const active = computed<PlgAccountState>(() => stateFor(accounts.activeId))

  const daysLeft = computed(() => {
    const ms = new Date(active.value.trialEndsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(ms / DAY_MS))
  })

  const isTrial = computed(() => active.value.mode === 'trial')
  const isExpired = computed(
    () => isTrial.value && (active.value.status === 'trial_expired' || daysLeft.value <= 0),
  )
  const isExpiring = computed(() => isTrial.value && !isExpired.value && daysLeft.value <= 3)

  /** True only for accounts with explicit PLG state (trial or demo-overridden). */
  const hasExplicitState = computed(() => !!states.value[accounts.activeId])

  const entitlements = computed<PlgEntitlements>(() => {
    const s = active.value
    if (s.mode === 'trial') {
      if (isExpired.value) {
        return {
          sms: false,
          davinciAi: false,
          chatbotLimit: 0,
          emailSendLimit: 0,
          storeLimit: 0,
          skuLimit: 0,
          aiTokenLimit: 0,
        }
      }
      return {
        sms: false,
        davinciAi: true,
        chatbotLimit: 1,
        emailSendLimit: 10_000,
        storeLimit: 1,
        skuLimit: 1_000,
        aiTokenLimit: 50_000,
      }
    }
    const tiers = Object.values(s.tiers) as PlanTier[]
    const best = tiers.sort((a, b) => tierRank(b) - tierRank(a))[0]
    const m = s.tiers.marketing
    const svc = s.tiers.service
    const c = s.tiers.commerce
    return {
      sms: !!m && (m !== 'build' || s.addOns.includes('sms_usage')),
      davinciAi: !!best && best !== 'build',
      chatbotLimit: svc ? TIER_CHATBOTS[svc] : 0,
      emailSendLimit: m ? TIER_EMAIL_SENDS[m] : 0,
      storeLimit: c ? TIER_STORES[c] : 0,
      skuLimit: c && c !== 'build' ? -1 : 10_000,
      aiTokenLimit: best ? TIER_AI_TOKENS[best] : 0,
    }
  })

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const ACCOUNT_COLORS: Account['color'][] = ['primary', 'secondary', 'success']

  function createTrialAccount(payload: TrialSignupPayload): string {
    const numericIds = accounts.accounts
      .map(a => Number.parseInt(a.id, 10))
      .filter(n => Number.isFinite(n))
    const id = String(Math.max(2000302, ...numericIds) + 1)
    const initials = payload.companyName
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w[0]!.toUpperCase())
      .slice(0, 2)
      .join('') || 'MP'
    accounts.addAccount({
      id,
      name: payload.companyName,
      initials,
      color: ACCOUNT_COLORS[accounts.accounts.length % ACCOUNT_COLORS.length]!,
      subscriptions: ['commerce', 'marketing', 'analytics', 'service', 'davinci'],
    })
    states.value[id] = {
      mode: 'trial',
      status: 'trialing',
      cycle: 'monthly',
      startedAt: isoIn(0),
      trialEndsAt: isoIn(TRIAL_DAYS),
      tiers: {},
      addOns: [],
      usage: trialUsage(),
    }
    return id
  }

  /** Ensure the active account has explicit (mutable) PLG state before editing it. */
  function ensureActiveState(): PlgAccountState {
    const id = accounts.activeId
    if (!states.value[id]) states.value[id] = stateFor(id)
    return states.value[id]!
  }

  function activatePaidPlan(options: {
    selections: Partial<Record<PlgCloud, PlanTier>>
    cycle: BillingCycle
    addOns?: AddOnKey[]
  }) {
    const s = ensureActiveState()
    s.mode = 'paid'
    s.status = 'active'
    s.cycle = options.cycle
    s.tiers = { ...s.tiers, ...options.selections }
    s.addOns = [...new Set([...s.addOns, ...(options.addOns ?? [])])]
    s.usage = paidUsage(s.tiers)
    s.startedAt = isoIn(0)
    s.renewsAt = isoIn(options.cycle === 'annual' ? 365 : 30)
    s.cancelAt = undefined
    s.gracePaymentFailedAt = undefined
  }

  function changeTier(cloud: PlgCloud, tier: PlanTier) {
    const s = ensureActiveState()
    s.tiers = { ...s.tiers, [cloud]: tier }
    if (s.mode === 'paid') s.usage = paidUsage(s.tiers)
  }

  function purchaseAddOn(key: AddOnKey) {
    const s = ensureActiveState()
    if (!s.addOns.includes(key)) s.addOns = [...s.addOns, key]
  }

  function cancelSubscription(_options: { reason: string; comment?: string }) {
    const s = ensureActiveState()
    s.status = 'cancelled_pending'
    s.cancelAt = s.renewsAt ?? isoIn(30)
  }

  function applyDemoPreset(preset: PlgDemoPreset) {
    const id = accounts.activeId
    const base: PlgAccountState = {
      mode: 'trial',
      status: 'trialing',
      cycle: 'monthly',
      startedAt: isoIn(0),
      trialEndsAt: isoIn(TRIAL_DAYS),
      tiers: {},
      addOns: [],
      usage: trialUsage(),
    }
    switch (preset) {
      case 'trial-d3':
        base.startedAt = isoIn(-3)
        base.trialEndsAt = isoIn(TRIAL_DAYS - 3)
        break
      case 'trial-d12':
        base.startedAt = isoIn(-12)
        base.trialEndsAt = isoIn(TRIAL_DAYS - 12)
        base.usage = { ...trialUsage(), aiTokens: { used: 46_900, limit: 50_000 } }
        break
      case 'trial-expired':
        base.status = 'trial_expired'
        base.startedAt = isoIn(-16)
        base.trialEndsAt = isoIn(-2)
        break
      case 'paid-build':
      case 'paid-essential':
      case 'paid-professional':
      case 'paid-enterprise': {
        const tier = preset.replace('paid-', '') as PlanTier
        base.mode = 'paid'
        base.status = 'active'
        base.tiers = { marketing: tier, commerce: tier, service: tier }
        base.startedAt = isoIn(-45)
        base.renewsAt = isoIn(21)
        base.usage = paidUsage(base.tiers)
        break
      }
      case 'grace':
        base.mode = 'paid'
        base.status = 'grace'
        base.tiers = { marketing: 'professional', commerce: 'professional', service: 'professional' }
        base.startedAt = isoIn(-75)
        base.renewsAt = isoIn(-4)
        base.gracePaymentFailedAt = isoIn(-4)
        base.usage = paidUsage(base.tiers)
        break
    }
    states.value[id] = base
  }

  function resetAccount(accountId?: string) {
    const id = accountId ?? accounts.activeId
    if (states.value[id]) {
      const next = { ...states.value }
      delete next[id]
      states.value = next
    }
  }

  watch(
    states,
    (next) => {
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore storage quota / disabled errors
      }
    },
    { deep: true },
  )

  return {
    states,
    stateFor,
    active,
    daysLeft,
    isTrial,
    isExpired,
    isExpiring,
    hasExplicitState,
    entitlements,
    createTrialAccount,
    activatePaidPlan,
    changeTier,
    purchaseAddOn,
    cancelSubscription,
    applyDemoPreset,
    resetAccount,
  }
})
