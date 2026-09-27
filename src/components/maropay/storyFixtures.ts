/**
 * Story fixtures for the Maropay components: real scenario states built by the
 * same builders the prototype uses (src/maropay/scenarios.ts), over a small
 * synthetic Atlas Outfitters order book — so a story shows exactly what a
 * reviewer sees in the app.
 */
import { buildScenario } from '@/maropay/scenarios'
import type { ScenarioContext } from '@/maropay/scenarios'
import type { MaropayAccountState, MaropayScenarioKey } from '@/maropay/model'
import { activationChecklist, deriveBalances, deriveOverviewInstruction, methodStatusForStore, nextPayout, readinessDimensions } from '@/maropay/readiness'

const DAY = 86_400_000
const NOW = Date.now()

function dateKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TOTALS = [1180, 1040, 1120, 890, 760, 820, 940, 680, 590, 520, 610, 700, 640, 560, 620, 730, 850, 960, 1040, 900, 810]
const STATUSES = ['Paid', 'Paid', 'Voided', 'Refunded', 'Paid']

const CONTEXT: ScenarioContext = {
  accountId: '2000290',
  accountName: 'Scooter Village (All access)',
  now: NOW,
  channels: [
    { id: 'retest-sales-notification', name: 'Atlas Outfitters', type: 'web_store', provider: 'maropost_store_builder', status: 'connected', domain: 'atlas-outfitters.uat.maropost.store' },
    { id: 'beta-sales-channel', name: 'Beta Sales Channel', type: 'web_store', provider: 'maropost_store_builder', status: 'needs_setup', domain: 'beta-2000290.uat.maropost.store' },
  ],
  orders: TOTALS.map((total, i) => ({
    id: i + 1,
    orderNumber: `#${10000 + i}`,
    channelId: i % 3 === 1 ? null : 'retest-sales-notification',
    total: total.toFixed(2),
    currency: 'USD',
    date: dateKey(NOW - i * DAY),
    paymentStatus: STATUSES[i % 5]!,
    paymentMethod: i % 2 ? 'Visa •••• 4242' : 'Apple Pay',
    paymentReference: `pay_${910000 + i * 731}`,
    customer: { name: `Customer ${i + 1}`, email: `customer${i + 1}@email.com` },
  })),
}

export function storyState(key: MaropayScenarioKey): MaropayAccountState {
  return buildScenario(key, CONTEXT)
}

function storyFacts(channelId: string) {
  const c = CONTEXT.channels.find((ch) => ch.id === channelId)
  return c ? { name: c.name, type: c.type, provider: c.provider, status: c.status } : null
}

export function storyReadiness(state: MaropayAccountState) {
  return { instruction: deriveOverviewInstruction(state, NOW, storyFacts), dimensions: readinessDimensions(state, NOW) }
}

export function storyBalance(state: MaropayAccountState) {
  return { balance: deriveBalances(state, NOW)[0]!, upcoming: nextPayout(state, NOW) }
}

/** M03 after the merchant uploaded the requested ID: waiting on the payments partner. */
export function underReviewState(): MaropayAccountState {
  const state = storyState('m03')
  state.account!.verification = 'under_review'
  for (const task of state.tasks) task.status = 'waiting_review'
  return state
}

/** M05 after the owner closed the account — nothing was left in flight. */
export function closedState(): MaropayAccountState {
  const state = storyState('m05')
  state.account!.closedAt = new Date(NOW).toISOString()
  return state
}

/** The primary store's activation checklist, as the store's Payments page shows it. */
export function storyChecklist(state: MaropayAccountState) {
  const facts = { name: 'Atlas Outfitters', type: 'web_store' as const, provider: 'maropost_store_builder', status: 'connected' }
  return activationChecklist(state, state.bindings[0]!, facts, NOW)
}

/** One catalogue method with its status on the primary store. */
export function storyMethod(state: MaropayAccountState, methodId: string) {
  const method = state.methods.find((m) => m.id === methodId)!
  return { ...method, status: methodStatusForStore(method, state.bindings[0] ?? null) }
}

/** The first payment in a scenario that matches — e.g. a captured Maropay payment, or one PayPal took. */
export function storyPayment(key: MaropayScenarioKey, match: (p: MaropayAccountState['payments'][number]) => boolean = () => true) {
  return storyState(key).payments.find(match)!
}

export const STORY_NOW = NOW
