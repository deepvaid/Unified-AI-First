// A new web store's first minutes in the back office: setting it up, then the
// checklist that takes it to launch.
//
// - Setup: after Create sales channel, the store is put together step by step
//   (its Commerce Cloud account, search, the storefront, checkout, its address).
//   Nothing is kept for it: where it stands is read from when the store was made,
//   so a reload, or another tab, shows the same progress.
// - Launch: eight steps, in the order a merchant does them. Most are read from the
//   store itself (it has a product, a theme, a way to pay); three have nothing to
//   read, so the merchant marks them done.
//
// Pure, so `npm run test:storefront` runs it in Node (tests/storefront/storeLaunch.test.ts).

// ── Setup ────────────────────────────────────────────────────────────────────

export type SetupStepId = 'account' | 'merchandise' | 'storefront' | 'checkout' | 'address'
export type SetupStepStatus = 'done' | 'running' | 'waiting'

export interface SetupStep {
  id: SetupStepId
  /** While it runs or waits: "Building your storefront". */
  title: string
  /** Once it is done: "Storefront built". */
  doneTitle: string
}

/** What of the store decides its steps. */
export interface SetupStore {
  /** Connected to Merchandise Cloud when it was made. */
  merchandise: boolean
  /** The theme it starts as a copy of ("Daybloom"), or null for a blank store. */
  theme: string | null
  /** Its address, without a scheme. */
  domain: string
}

/** How long each step takes. Short: a demo should not wait, but each step should be seen. */
export const SETUP_STEP_MS = 2200

/** The store's setup steps, in order. A store not connected to Merchandise Cloud has no search to set up. */
export function setupSteps(store: SetupStore): SetupStep[] {
  return [
    { id: 'account', title: 'Connecting your Commerce Cloud account', doneTitle: 'Commerce Cloud account connected' },
    ...(store.merchandise
      ? [{ id: 'merchandise' as const, title: 'Setting up search and recommendations', doneTitle: 'Search and recommendations set up' }]
      : []),
    store.theme
      ? { id: 'storefront', title: `Building your storefront from the ${store.theme} theme`, doneTitle: `Storefront built from the ${store.theme} theme` }
      : { id: 'storefront', title: 'Building your storefront', doneTitle: 'Storefront built' },
    { id: 'checkout', title: 'Setting up checkout', doneTitle: 'Checkout set up' },
    { id: 'address', title: `Putting your store online at ${store.domain}`, doneTitle: `Online at ${store.domain}` },
  ]
}

export interface SetupProgress {
  steps: (SetupStep & { status: SetupStepStatus })[]
  doneCount: number
  /** 0 to 100, counting part of the step that is running. */
  percent: number
  /** Every step is done. */
  ready: boolean
  /** The step running now; null once ready. */
  current: SetupStep | null
}

/**
 * Where a store's setup stands at `now` (ms), for a store made at `startedAt` (ISO).
 * A date that cannot be read, or one in the future, counts as "just made".
 */
export function setupProgress(steps: readonly SetupStep[], startedAt: string, now: number): SetupProgress {
  const started = Date.parse(startedAt)
  const elapsed = Number.isFinite(started) ? Math.max(0, now - started) : 0
  const doneCount = Math.min(steps.length, Math.floor(elapsed / SETUP_STEP_MS))
  const ready = doneCount >= steps.length
  return {
    steps: steps.map((step, index) => ({ ...step, status: index < doneCount ? 'done' : index === doneCount ? 'running' : 'waiting' })),
    doneCount,
    percent: ready || !steps.length ? 100 : Math.min(99, Math.round((elapsed / (steps.length * SETUP_STEP_MS)) * 100)),
    ready,
    current: ready ? null : steps[doneCount] ?? null,
  }
}

/** How long the whole setup takes, for a timer that stops when it is over. */
export function setupDuration(steps: readonly SetupStep[]): number {
  return steps.length * SETUP_STEP_MS
}

// ── Launch ───────────────────────────────────────────────────────────────────

export type LaunchStepId = 'location' | 'product' | 'branding' | 'theme' | 'shipping' | 'taxes' | 'payments' | 'domain'
/** Where a step's button leads on the store's page. `confirm` marks the step done. */
export type LaunchTarget = 'inventory' | 'products' | 'add_product' | 'themes' | 'store_builder' | 'taxes' | 'payments' | 'preview' | 'confirm'

/** The steps with nothing in the store to read: the merchant says when they are done. */
export const MANUAL_LAUNCH_STEPS: readonly LaunchStepId[] = ['branding', 'shipping', 'taxes']

/** What of the store the checklist reads. */
export interface LaunchFacts {
  /** The store's name in the admin. */
  name: string
  /** What shoppers read at the top of every page: the store's name, or the brand of the theme it was made from. */
  brand: string
  /** Where its stock is kept, by name. */
  locations: string[]
  /** Products the store sells. */
  products: number
  /** Its published theme, or null. */
  theme: string | null
  /** Countries its checkout delivers to. */
  countries: number
  /** The ways to pay it accepts ("Maropay", "Stripe"). */
  paymentMethods: string[]
  /** Its address, without a scheme. */
  domain: string
  /** The manual steps the merchant has marked done. */
  confirmed: readonly string[]
}

export interface LaunchAction {
  label: string
  target: LaunchTarget
}

export interface LaunchStep {
  id: LaunchStepId
  title: string
  /** What is true now when done, else what to do and why. */
  description: string
  done: boolean
  /** The merchant marks it done; nothing in the store says so. */
  manual: boolean
  /** The main button. A manual step's is "Mark as done" until it is. */
  action: LaunchAction | null
  /** A second, quieter link: where the work is done, beside "Mark as done". */
  link: LaunchAction | null
}

const plural = (count: number, one: string, many = `${one}s`): string => `${count} ${count === 1 ? one : many}`

/** The eight steps to launch, in order, as the store stands. */
export function launchChecklist(facts: LaunchFacts): LaunchStep[] {
  const confirmed = (id: LaunchStepId): boolean => facts.confirmed.includes(id)
  const markDone: LaunchAction = { label: 'Mark as done', target: 'confirm' }
  const [firstLocation, ...otherLocations] = facts.locations
  const hasLocation = firstLocation !== undefined
  const hasProducts = facts.products > 0
  const hasTheme = facts.theme !== null
  const paid = facts.paymentMethods.length > 0

  return [
    {
      id: 'location',
      title: 'Add a location',
      description: hasLocation
        ? `Orders ship from ${firstLocation}${otherLocations.length ? ` and ${plural(otherLocations.length, 'other location')}` : ''}.`
        : 'Say where your stock is kept, so every order knows where it ships from.',
      done: hasLocation,
      manual: false,
      action: { label: hasLocation ? 'Manage' : 'Add location', target: 'inventory' },
      link: null,
    },
    {
      id: 'product',
      title: 'Add your first product',
      description: hasProducts
        ? `${plural(facts.products, 'product')} in this store.`
        : 'Add something to sell. It shows in the store as soon as it is published.',
      done: hasProducts,
      manual: false,
      action: hasProducts ? { label: 'Manage', target: 'products' } : { label: 'Add product', target: 'add_product' },
      link: null,
    },
    {
      id: 'branding',
      title: 'Check your store name and logo',
      description: facts.brand === facts.name
        ? `Shoppers see “${facts.brand}” at the top of every page.`
        : `Shoppers see “${facts.brand}” at the top of every page: the name your theme came with.`,
      done: confirmed('branding'),
      manual: true,
      action: confirmed('branding') ? null : markDone,
      link: hasTheme ? { label: 'View store', target: 'preview' } : null,
    },
    {
      id: 'theme',
      title: 'Choose a theme',
      description: hasTheme
        ? `${facts.theme} is published.`
        : 'Pick a look from the theme library. You can change every part of it later.',
      done: hasTheme,
      manual: false,
      action: hasTheme ? { label: 'Edit theme', target: 'store_builder' } : { label: 'Choose theme', target: 'themes' },
      link: null,
    },
    {
      id: 'shipping',
      title: 'Check your shipping',
      description: `Shoppers get free home delivery in 3 to 5 business days, to ${plural(facts.countries, 'country', 'countries')}.`,
      done: confirmed('shipping'),
      manual: true,
      action: confirmed('shipping') ? null : markDone,
      link: null,
    },
    {
      id: 'taxes',
      title: 'Check your taxes',
      description: 'Every product has a tax category. Check that the categories and their rates are right for where you sell.',
      done: confirmed('taxes'),
      manual: true,
      action: confirmed('taxes') ? null : markDone,
      link: { label: 'Open tax categories', target: 'taxes' },
    },
    {
      id: 'payments',
      title: 'Set up payments',
      description: paid
        ? `Shoppers can pay with ${facts.paymentMethods.join(', ')}.`
        : 'Choose how shoppers pay. Until you do, no one can check out.',
      done: paid,
      manual: false,
      action: { label: paid ? 'Manage' : 'Set up payments', target: 'payments' },
      link: null,
    },
    {
      id: 'domain',
      title: 'Check your store’s address',
      description: `Your store is at ${facts.domain}.`,
      done: facts.domain.trim() !== '',
      manual: false,
      action: hasTheme ? { label: 'View store', target: 'preview' } : null,
      link: null,
    },
  ]
}

export interface LaunchSummary {
  done: number
  total: number
  percent: number
  /** The first step still to do; null when the store is ready to launch. */
  next: LaunchStep | null
  ready: boolean
}

export function launchSummary(steps: readonly LaunchStep[]): LaunchSummary {
  const done = steps.filter((step) => step.done).length
  return {
    done,
    total: steps.length,
    percent: steps.length ? Math.round((done / steps.length) * 100) : 0,
    next: steps.find((step) => !step.done) ?? null,
    ready: steps.length > 0 && done === steps.length,
  }
}

/** The manual steps a store has marked done, as read back from the browser: only ids this build knows. */
export function isConfirmedList(value: unknown): value is LaunchStepId[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string' && MANUAL_LAUNCH_STEPS.includes(id as LaunchStepId))
}
