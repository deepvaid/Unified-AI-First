import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export type SubscriptionKey =
  | 'commerce'
  | 'retail'
  | 'marketing'
  | 'analytics'
  | 'service'
  | 'davinci'

export interface Account {
  id: string
  name: string
  initials: string
  color: 'primary' | 'secondary' | 'success'
  subscriptions: SubscriptionKey[]
  /** Sidebar appearance for this account; omitted = gray (the default). */
  sidebarTheme?: 'white' | 'gray' | 'dark'
}

const STORAGE_KEY = 'mp.activeAccountId'

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: '2000290',
    name: 'Scooter Village (All access)',
    initials: 'SV',
    color: 'primary',
    subscriptions: ['commerce', 'retail', 'marketing', 'analytics', 'service', 'davinci'],
  },
  {
    id: '2000291',
    name: 'Maropost Demo Store',
    initials: 'MD',
    color: 'secondary',
    subscriptions: ['commerce', 'retail', 'marketing', 'analytics', 'service', 'davinci'],
    sidebarTheme: 'white',
  },
  {
    id: '2000292',
    name: 'Growth Starter (No Service Cloud)',
    initials: 'GS',
    color: 'success',
    subscriptions: ['marketing', 'analytics'],
  },
  {
    id: '2000293',
    name: 'Acme Outdoor Gear',
    initials: 'AO',
    color: 'primary',
    subscriptions: ['commerce', 'marketing', 'analytics'],
  },
  {
    id: '2000294',
    name: 'Bella Cosmetics (Commerce + Marketing + Service)',
    initials: 'BC',
    color: 'secondary',
    subscriptions: ['commerce', 'marketing', 'service'],
  },
  {
    id: '2000295',
    name: 'Cedar & Pine Home (Shopping Assistant only)',
    initials: 'CP',
    color: 'success',
    subscriptions: ['commerce'],
  },
  {
    id: '2000296',
    name: 'Downtown Roasters',
    initials: 'DR',
    color: 'primary',
    subscriptions: ['commerce', 'marketing', 'analytics'],
  },
  {
    id: '2000297',
    name: 'EliteWear Athletics',
    initials: 'EA',
    color: 'secondary',
    subscriptions: ['commerce', 'retail', 'marketing', 'analytics', 'service', 'davinci'],
  },
  {
    id: '2000298',
    name: 'Freshly Baked Co. (Service only)',
    initials: 'FB',
    color: 'success',
    subscriptions: ['service'],
  },
  {
    id: '2000299',
    name: 'GreenLeaf Organics',
    initials: 'GL',
    color: 'primary',
    subscriptions: ['commerce', 'marketing', 'analytics'],
  },
  {
    id: '2000300',
    name: 'Harbor Fish Market',
    initials: 'HF',
    color: 'secondary',
    subscriptions: ['commerce', 'marketing'],
  },
  {
    id: '2000301',
    name: 'Ironside Fitness',
    initials: 'IF',
    color: 'success',
    subscriptions: ['marketing', 'analytics', 'davinci'],
  },
  {
    id: '2000302',
    name: 'Jade & Willow Spa',
    initials: 'JW',
    color: 'primary',
    subscriptions: ['commerce', 'marketing', 'service'],
  },
  {
    id: '2000303',
    name: 'Urban Counter (Retail only)',
    initials: 'UC',
    color: 'secondary',
    subscriptions: ['retail', 'analytics'],
  },
]

const CUSTOM_ACCOUNTS_KEY = 'mp.accounts.v1'

/** Demo-created accounts (e.g. PLG trial signups) persisted across reloads. */
function readStoredCustomAccounts(): Account[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CUSTOM_ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (a): a is Account =>
        !!a && typeof a.id === 'string' && typeof a.name === 'string'
        && Array.isArray(a.subscriptions) && !DEFAULT_ACCOUNTS.some(d => d.id === a.id),
    )
  } catch {
    return []
  }
}

function readStoredId(all: Account[], fallback: string): string {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return fallback
    return all.some(a => a.id === stored) ? stored : fallback
  } catch {
    return fallback
  }
}

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([...DEFAULT_ACCOUNTS, ...readStoredCustomAccounts()])
  const activeId = ref<string>(readStoredId(accounts.value, DEFAULT_ACCOUNTS[0]!.id))

  const activeAccount = computed(
    () => accounts.value.find(a => a.id === activeId.value) ?? accounts.value[0] ?? DEFAULT_ACCOUNTS[0]!,
  )

  function hasSubscription(key: SubscriptionKey): boolean {
    return activeAccount.value?.subscriptions.includes(key) ?? false
  }

  function hasAnySubscription(keys: SubscriptionKey[]): boolean {
    return keys.some(key => hasSubscription(key))
  }

  function switchTo(id: string) {
    if (!accounts.value.some(a => a.id === id)) return
    activeId.value = id
  }

  function addAccount(account: Account) {
    if (accounts.value.some(a => a.id === account.id)) return
    accounts.value = [...accounts.value, account]
    if (typeof window === 'undefined') return
    try {
      const custom = accounts.value.filter(a => !DEFAULT_ACCOUNTS.some(d => d.id === a.id))
      window.localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(custom))
    } catch {
      // ignore storage quota / disabled errors
    }
  }

  watch(activeId, (next) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage quota / disabled errors
    }
  })

  return { accounts, activeId, activeAccount, hasSubscription, hasAnySubscription, switchTo, addAccount }
})
