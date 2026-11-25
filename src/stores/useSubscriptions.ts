import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { browserStorage, keepPerChannel } from '@/stores/demoKeep'
import { SEEDED_DEMO_CHANNELS, demoChannelRecord } from '@/stores/useSalesChannels'
import { parseDecimal } from '@/maropay/money'
import { localDateKey } from '@/maropay/model'
import type { CheckoutSession, Payment } from '@/maropay/model'
import { DEMO_STORES, canApplyTheme } from '@/storefront/demoStores'
import { currentBlueprintId, historyFor, snapshotFor } from '@/storefront/demoStores/install'
import type { InstallChannel } from '@/storefront/demoStores/install'
import * as rules from '@/subscriptions/contracts'
import type { ContractActor, ContractOrder, SubscriptionContract } from '@/subscriptions/contracts'
import { isOnPlan, planRow, plansForProduct } from '@/subscriptions/plans'
import type { PlanInput, PlanStatus, SubscriptionPlan } from '@/subscriptions/plans'

// The subscription plans stores sell, and the subscriptions shoppers hold on them.
// Only demo stores have any (src/storefront/demoStores/): each store's plans and
// subscriptions are kept in this browser in slots of its own, under the keys
// Vitaheal always used (`mp.vitaheal-demo.plans.v1`, `subscriptions.v1`).
// - Plans come with the theme a store runs. When another theme is applied, the
//   store's own plans (seeded or made in it) stay listed, switched off, beside the
//   ones it brings. A restore puts the seeded ones back and removes the others.
// - Subscriptions are history: applying a theme keeps them; only the store's
//   "Restore original store" puts them back as seeded.
// The rules are in src/subscriptions/plans.ts and contracts.ts.

/** Saved plans are only read back when they still look like plans. */
function isPlanList(value: unknown): value is SubscriptionPlan[] {
  return Array.isArray(value) && value.every((p: Partial<SubscriptionPlan> | null) =>
    !!p && typeof p.id === 'string' && typeof p.channelId === 'string' && typeof p.name === 'string'
    && typeof p.intervalCount === 'number' && typeof p.unitsPerDelivery === 'number' && typeof p.discountPct === 'number'
    && Array.isArray(p.benefits) && Array.isArray(p.productIds)
    && (p.options === undefined || (Array.isArray(p.options) && p.options.every((o) => !!o && typeof o.id === 'string' && typeof o.intervalCount === 'number' && typeof o.discountPct === 'number'))))
}

const copy = (plan: SubscriptionPlan): SubscriptionPlan => ({
  ...plan,
  benefits: [...plan.benefits],
  productIds: [...plan.productIds],
  ...(plan.options ? { options: plan.options.map((option) => ({ ...option })) } : {}),
})

/** Saved subscriptions are only read back when they still look like subscriptions. */
function isContractList(value: unknown): value is SubscriptionContract[] {
  return Array.isArray(value) && value.every((c: Partial<SubscriptionContract> | null) =>
    !!c && typeof c.id === 'string' && typeof c.number === 'string' && typeof c.channelId === 'string'
    && typeof c.customer?.email === 'string' && typeof c.plan?.id === 'string' && typeof c.price === 'string'
    && typeof c.status === 'string' && rules.CONTRACT_STATUSES.includes(c.status) && Array.isArray(c.history))
}

const today = (): string => localDateKey(Date.now())

/** `list` with one store's rows replaced by `rows`, where that store's rows were (else at the end). */
function withStoreRows<T extends { channelId: string }>(list: T[], channelId: string, rows: T[]): T[] {
  const at = list.findIndex((row) => row.channelId === channelId)
  const others = list.filter((row) => row.channelId !== channelId)
  const cut = at < 0 ? others.length : at
  return [...others.slice(0, cut), ...rows, ...others.slice(cut)]
}

/** One store's rows of a saved list (a list saved before stores had slots of their own may hold others'). */
const rowsOf = <T extends { channelId: string }>(list: T[], channelId: string): T[] => list.filter((row) => row.channelId === channelId)

/**
 * The plans a store is seeded with: those of the theme it runs, and, when that is
 * not the one it started from, its own plans switched off.
 */
function seededPlans(channel: InstallChannel): SubscriptionPlan[] {
  const running = currentBlueprintId(channel, browserStorage())
  const brought = running ? snapshotFor(channel, running, today()).plans : []
  const original = channel.webStore?.blueprint?.original
  if (!original || original === running) return brought
  const own = snapshotFor(channel, original, today()).plans.map((plan): SubscriptionPlan => ({ ...plan, status: 'Paused' }))
  return [...own, ...brought]
}

/** The ids of the plans another theme than the store's own brings into it: a later Apply replaces those, and keeps the rest. */
function broughtPlanIds(channel: InstallChannel): Set<string> {
  const original = channel.webStore?.blueprint?.original
  return new Set(DEMO_STORES.filter((blueprint) => blueprint.id !== original)
    .flatMap((blueprint) => snapshotFor(channel, blueprint.id, today()).plans.map((plan) => plan.id)))
}

/** The subscriptions a store had before the demo: a demo store's own, whatever theme it runs. */
const seededContracts = (channelId: string): SubscriptionContract[] => historyFor(channelId, today())?.subscriptions ?? []

/** What charging a subscription came to: the renewal's order, or why nothing was taken. */
export type ChargeResult = { ok: true; order: ContractOrder } | { ok: false; message: string }

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const plans = ref<SubscriptionPlan[]>([])
  const contracts = ref<SubscriptionContract[]>([])

  /** The store's plans as seeded now (inside an action or event: it reads the sales channels store). */
  const reseededPlans = (channelId: string): SubscriptionPlan[] => {
    const channel = demoChannelRecord(channelId)
    return channel ? seededPlans(channel) : []
  }

  // `null` from another tab: it restored the store or applied a theme, so seed it again.
  const keptPlans = keepPerChannel('plans', 1, isPlanList, {
    read: (channelId) => rowsOf(plans.value, channelId),
    take: (channelId, saved) => {
      plans.value = withStoreRows(plans.value, channelId, saved ? rowsOf(saved, channelId) : reseededPlans(channelId))
    },
  })
  const keptContracts = keepPerChannel('subscriptions', 1, isContractList, {
    read: (channelId) => rowsOf(contracts.value, channelId),
    take: (channelId, saved) => {
      contracts.value = withStoreRows(contracts.value, channelId, saved ? rowsOf(saved, channelId) : seededContracts(channelId))
    },
  })

  /** The stores whose plans and subscriptions are seeded and kept (attachStore): each only once. */
  const attached = new Set<string>()

  /**
   * Seeds a store's plans as the theme it runs now has them and its subscriptions as
   * it had them before the demo, then keeps both: what this browser saved is read,
   * never cleared. A subscription a shopper buys on the store is saved from then on.
   */
  function attachStore(channel: InstallChannel): void {
    if (attached.has(channel.id)) return
    attached.add(channel.id)
    plans.value = withStoreRows(plans.value, channel.id, seededPlans(channel))
    contracts.value = withStoreRows(contracts.value, channel.id, seededContracts(channel.id))
    keptPlans.attach(channel.id)
    keptContracts.attach(channel.id)
  }
  for (const channel of SEEDED_DEMO_CHANNELS) attachStore(channel)

  /** The store's record when it can take a theme (inside an action: it reads the sales channels store). */
  const demoChannel = (channelId: string): InstallChannel | undefined => {
    const channel = demoChannelRecord(channelId)
    return canApplyTheme(channel) ? channel : undefined
  }

  /**
   * Brings a store that can take a theme in with what this browser saved for it,
   * as the app starts (a store made from a theme; src/stores/useDemoStores.ts).
   * Nothing saved is cleared. Does nothing a second time, or for a store that
   * cannot take a theme.
   */
  function attachDemo(channelId: string): void {
    const channel = demoChannel(channelId)
    if (channel) attachStore(channel)
  }

  /**
   * The store's plans follow the theme it runs now (contract: reseedDemo). On its own
   * theme they go back as seeded (a restore, a seed fix). On another theme the plans
   * that theme brings come in, the plans an earlier theme brought go, and the store's
   * own plans, seeded or made in it, stay listed, switched off. Its subscriptions stay,
   * and are kept from now on if they were not yet. A store that cannot take a theme is left alone.
   */
  function reseedDemo(channelId: string): void {
    const channel = demoChannel(channelId)
    if (!channel) return
    attachStore(channel)
    const running = currentBlueprintId(channel, browserStorage())
    const seeded = seededPlans(channel)
    let next = seeded
    if (running && running !== channel.webStore?.blueprint?.original) {
      const brought = broughtPlanIds(channel)
      // Paused, and no longer the one preselected: the plans the theme brings offer their own.
      const own = rowsOf(plans.value, channelId).filter((plan) => !brought.has(plan.id)).map((plan): SubscriptionPlan => ({ ...copy(plan), status: 'Paused', isDefault: false }))
      next = [...own, ...snapshotFor(channel, running, today()).plans]
    }
    plans.value = withStoreRows(plans.value, channelId, next)
    // As seeded: the store follows its seed again. Otherwise the watcher saves the plans it keeps; when
    // they are the ones already shown (a second Apply), the slot already holds them, so it is left alone.
    if (JSON.stringify(next) === JSON.stringify(seeded)) {
      keptPlans.clear(channelId)
      keptPlans.adopt(channelId)
    }
  }

  /** Puts the store's subscriptions back as seeded (contract: restoreDemoHistory, a restore only). */
  function restoreDemoHistory(channelId: string): void {
    const channel = demoChannel(channelId)
    if (!channel) return
    attachStore(channel)
    keptContracts.clear(channelId)
    contracts.value = withStoreRows(contracts.value, channelId, seededContracts(channelId))
    keptContracts.adopt(channelId)
  }

  /** The plans a shopper can pick for a product in a store. */
  function offeredFor(channelId: string, productId: number): SubscriptionPlan[] {
    return plansForProduct(plans.value, channelId, productId)
  }

  /** Every plan a product is attached to, paused ones too, as the admin lists them. */
  function plansWithProduct(productId: number): SubscriptionPlan[] {
    return plans.value.filter((p) => p.productIds.includes(productId))
  }

  /** A store has one preselected plan: making this one the default takes it from the others. */
  function keepOneDefault(plan: SubscriptionPlan): void {
    if (!plan.isDefault) return
    for (const other of plans.value) {
      if (other.id !== plan.id && other.channelId === plan.channelId) other.isDefault = false
    }
  }

  function createPlan(channelId: string, input: PlanInput): SubscriptionPlan {
    const next = plans.value.reduce((max, p) => Math.max(max, Number(/^plan-(\d+)$/.exec(p.id)?.[1] ?? 0)), 0) + 1
    const plan = copy({ ...input, id: `plan-${next}`, channelId })
    plans.value.push(plan)
    keepOneDefault(plan)
    return plan
  }

  function updatePlan(id: string, input: PlanInput): void {
    const index = plans.value.findIndex((p) => p.id === id)
    const current = plans.value[index]
    if (!current) return
    const plan = copy({ ...input, id, channelId: current.channelId })
    plans.value[index] = plan
    keepOneDefault(plan)
  }

  function setPlanStatus(id: string, status: PlanStatus): void {
    const plan = plans.value.find((p) => p.id === id)
    if (!plan) return
    plan.status = status
    if (status === 'Active') keepOneDefault(plan)
  }

  function deletePlan(id: string): void {
    plans.value = plans.value.filter((p) => p.id !== id)
  }

  /** How many shoppers hold an active subscription on a plan, or on one of its delivery options. */
  function activeSubscribers(planId: string): number {
    return contracts.value.filter((c) => c.status === 'Active' && isOnPlan(c.plan.id, planId)).length
  }

  // ── Subscriptions ────────────────────────────────────────────────────
  // What shoppers hold. Both the shopper's page and the admin call these, so a
  // change on one shows on the other, with who made it in the history.

  function contractById(id: string): SubscriptionContract | undefined {
    return contracts.value.find((c) => c.id === id)
  }

  /** One shopper's subscriptions in a store. */
  function contractsOf(channelId: string, email: string): SubscriptionContract[] {
    return rules.contractsFor(contracts.value, channelId, email)
  }

  /** The subscription an order started or renewed. */
  function contractOfOrder(orderId: number): SubscriptionContract | undefined {
    return rules.contractOfOrder(contracts.value, orderId)
  }

  /** Puts a changed copy in place. Returns whether the rule changed anything. */
  function change(id: string, rule: (contract: SubscriptionContract) => SubscriptionContract): boolean {
    const index = contracts.value.findIndex((c) => c.id === id)
    const current = contracts.value[index]
    if (!current) return false
    const next = rule(current)
    if (next === current) return false
    contracts.value[index] = next
    return true
  }

  const skipNext = (id: string, actor: ContractActor) => change(id, (c) => rules.skipNext(c, today(), actor))
  const reschedule = (id: string, date: string, actor: ContractActor) => change(id, (c) => rules.reschedule(c, date, today(), actor))
  const pause = (id: string, actor: ContractActor) => change(id, (c) => rules.pause(c, today(), actor))
  const resume = (id: string, actor: ContractActor) => change(id, (c) => rules.resume(c, today(), actor))
  const cancel = (id: string, reason: string, actor: ContractActor) => change(id, (c) => rules.cancel(c, reason, today(), actor))

  /** The other plans a subscription's product is sold on. */
  function plansToChangeTo(contract: SubscriptionContract): SubscriptionPlan[] {
    if (contract.productId === null) return []
    return offeredFor(contract.channelId, contract.productId).filter((p) => p.id !== contract.plan.id)
  }

  /** Moves a subscription to another plan, at that plan's price today for the variant it was bought on. */
  function changePlan(id: string, planId: string, actor: ContractActor): boolean {
    const contract = contractById(id)
    // A plan, or one of a plan's delivery options.
    const plan = planRow(plans.value, planId)
    const product = useCommerceStore().products.find((p) => p.id === contract?.productId)
    const unit = contract && product ? parseDecimal(rules.contractUnitPrice(product, contract), contract.currency) : null
    if (!contract || !plan || !unit) return false
    return change(id, (c) => rules.changePlan(c, plan, unit, today(), actor))
  }

  /** A checkout just placed its order: each line bought on a plan starts a subscription. */
  function startFromCheckout(session: CheckoutSession, payment: Payment): void {
    const order = session.order
    if (!order) return
    // The line names its product; an older session only has the SKU, looked up
    // within the store, since a theme copied to another store keeps its SKUs.
    const products = useCommerceStore().products.filter((p) => p.channelIds?.includes(session.channelId))
    for (const line of session.lineItems) {
      if (!line.plan) continue
      const number = rules.nextContractNumber(contracts.value)
      contracts.value.unshift(rules.contractFromLine({
        id: `sub-${number.slice(2)}`,
        number,
        channelId: session.channelId,
        customer: { name: session.customer.name, email: session.customer.email, ...(session.customer.address ? { address: { ...session.customer.address } } : {}) },
        productId: line.productId ?? products.find((p) => p.sku === line.sku)?.id ?? null,
        line: {
          product: line.product, sku: line.sku, qty: line.qty, price: line.price, plan: line.plan,
          ...(line.variantTitle ? { variantTitle: line.variantTitle } : {}),
        },
        currency: session.amount.currency,
        paymentMethod: payment.methodLabel,
        methodId: session.methodId,
        order: { id: order.id, number: order.orderNumber },
        date: order.date,
      }))
    }
  }

  /**
   * Charges the next delivery now, or retries a failed one, on the saved payment
   * method. It runs through the store's payment provider like a checkout, so the
   * renewal is an order in Commerce with a payment of its own.
   */
  function chargeNow(id: string, actor: ContractActor = 'merchant'): ChargeResult {
    const contract = contractById(id)
    if (!contract || !rules.allowedActions(contract).some((a) => a === 'charge' || a === 'retry')) {
      return { ok: false, message: 'This subscription can’t be charged in its current state.' }
    }
    const maropay = useMaropayStore()
    const started = maropay.startCheckout({
      channelId: contract.channelId,
      methodId: contract.methodId,
      flow: 'success',
      amount: rules.chargeAmount(contract),
      customer: { name: contract.customer.name, email: contract.customer.email, ...(contract.customer.address ? { address: { ...contract.customer.address } } : {}) },
      lineItems: [{
        product: contract.product, sku: contract.sku, qty: contract.qty, price: contract.price, plan: { ...contract.plan },
        ...(contract.variantTitle ? { variantTitle: contract.variantTitle } : {}),
      }],
      cardLabel: contract.methodId === 'card' ? contract.paymentMethod : null,
      renewalOf: contract.number,
    })
    if (!started.ok) return { ok: false, message: started.error.message }
    const step = maropay.confirmCheckout(started.value.id)
    if (!step.ok) return { ok: false, message: step.error.message }
    const placed = step.value.session.order
    if (!placed) return { ok: false, message: 'The payment didn’t go through, so nothing was taken.' }
    const order = { id: placed.id, number: placed.orderNumber }
    change(id, (c) => rules.recordRenewal(c, order, placed.date, actor))
    return { ok: true, order }
  }

  return {
    plans, offeredFor, plansWithProduct, createPlan, updatePlan, setPlanStatus, deletePlan, activeSubscribers, attachDemo, reseedDemo, restoreDemoHistory,
    contracts, contractById, contractsOf, contractOfOrder, plansToChangeTo,
    skipNext, reschedule, pause, resume, cancel, changePlan, startFromCheckout, chargeNow,
  }
})
