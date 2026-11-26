import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { browserStorage, keepInBrowser } from '@/stores/demoKeep'
import { parseDecimal } from '@/maropay/money'
import { localDateKey } from '@/maropay/model'
import type { CheckoutSession, Payment } from '@/maropay/model'
import { lowestPrice } from '@/storefront/catalog'
import { demoSlot } from '@/storefront/demoStorage'
import { VITAHEAL_PLANS, vitahealSubscriptions } from '@/storefront/vitahealDemo'
import * as rules from '@/subscriptions/contracts'
import type { ContractActor, ContractOrder, SubscriptionContract } from '@/subscriptions/contracts'
import { plansForProduct } from '@/subscriptions/plans'
import type { PlanInput, PlanStatus, SubscriptionPlan } from '@/subscriptions/plans'

// The subscription plans stores sell, and the subscriptions shoppers hold on them.
// Today only the Vitaheal (demo) store has any, so both lists are kept in this
// browser with that store's products and put back by its "Restore original store".
// The rules are in src/subscriptions/plans.ts and contracts.ts.

/** Saved plans are only read back when they still look like plans. */
function isPlanList(value: unknown): value is SubscriptionPlan[] {
  return Array.isArray(value) && value.every((p: Partial<SubscriptionPlan> | null) =>
    !!p && typeof p.id === 'string' && typeof p.channelId === 'string' && typeof p.name === 'string'
    && typeof p.intervalCount === 'number' && typeof p.unitsPerDelivery === 'number' && typeof p.discountPct === 'number'
    && Array.isArray(p.benefits) && Array.isArray(p.productIds))
}

const copy = (plan: SubscriptionPlan): SubscriptionPlan => ({ ...plan, benefits: [...plan.benefits], productIds: [...plan.productIds] })

/** Saved subscriptions are only read back when they still look like subscriptions. */
function isContractList(value: unknown): value is SubscriptionContract[] {
  return Array.isArray(value) && value.every((c: Partial<SubscriptionContract> | null) =>
    !!c && typeof c.id === 'string' && typeof c.number === 'string' && typeof c.channelId === 'string'
    && typeof c.customer?.email === 'string' && typeof c.plan?.id === 'string' && typeof c.price === 'string'
    && typeof c.status === 'string' && rules.CONTRACT_STATUSES.includes(c.status) && Array.isArray(c.history))
}

const today = (): string => localDateKey(Date.now())

/** What charging a subscription came to: the renewal's order, or why nothing was taken. */
export type ChargeResult = { ok: true; order: ContractOrder } | { ok: false; message: string }

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const saved = demoSlot('plans', 1, browserStorage(), isPlanList)
  const seeded = (): SubscriptionPlan[] => VITAHEAL_PLANS.map(copy)

  const plans = ref<SubscriptionPlan[]>(saved.load() ?? seeded())
  const kept = keepInBrowser(saved, () => plans.value, (fromOtherTab) => {
    plans.value = fromOtherTab ?? seeded()
  })

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
    if (plan) plan.status = status
  }

  function deletePlan(id: string): void {
    plans.value = plans.value.filter((p) => p.id !== id)
  }

  // ── Subscriptions ────────────────────────────────────────────────────
  // What shoppers hold. Both the shopper's page and the admin call these, so a
  // change on one shows on the other, with who made it in the history.

  // v2: subscriptions in US dollars (2026-11-26); those saved in kronor are not read again.
  const savedContracts = demoSlot('subscriptions', 2, browserStorage(), isContractList)
  const seededContracts = (): SubscriptionContract[] => vitahealSubscriptions(today())

  const contracts = ref<SubscriptionContract[]>(savedContracts.load() ?? seededContracts())
  const keptContracts = keepInBrowser(savedContracts, () => contracts.value, (fromOtherTab) => {
    contracts.value = fromOtherTab ?? seededContracts()
  })

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

  /** Moves a subscription to another plan, at that plan's price for the product today. */
  function changePlan(id: string, planId: string, actor: ContractActor): boolean {
    const contract = contractById(id)
    const plan = plans.value.find((p) => p.id === planId)
    const product = useCommerceStore().products.find((p) => p.id === contract?.productId)
    const unit = contract && product ? parseDecimal(lowestPrice(product), contract.currency) : null
    if (!contract || !plan || !unit) return false
    return change(id, (c) => rules.changePlan(c, plan, unit, today(), actor))
  }

  /** A checkout just placed its order: each line bought on a plan starts a subscription. */
  function startFromCheckout(session: CheckoutSession, payment: Payment): void {
    const order = session.order
    if (!order) return
    const products = useCommerceStore().products
    for (const line of session.lineItems) {
      if (!line.plan) continue
      const number = rules.nextContractNumber(contracts.value)
      contracts.value.unshift(rules.contractFromLine({
        id: `sub-${number.slice(2)}`,
        number,
        channelId: session.channelId,
        customer: { name: session.customer.name, email: session.customer.email, ...(session.customer.address ? { address: { ...session.customer.address } } : {}) },
        productId: products.find((p) => p.sku === line.sku)?.id ?? null,
        line: { product: line.product, sku: line.sku, qty: line.qty, price: line.price, plan: line.plan },
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
      lineItems: [{ product: contract.product, sku: contract.sku, qty: contract.qty, price: contract.price, plan: { ...contract.plan } }],
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

  /** Puts the seeded plans and subscribers back. Called by the demo store's restore (useCommerce). */
  function restore(): void {
    saved.clear()
    plans.value = seeded()
    kept.adopt()
    savedContracts.clear()
    contracts.value = seededContracts()
    keptContracts.adopt()
  }

  return {
    plans, offeredFor, plansWithProduct, createPlan, updatePlan, setPlanStatus, deletePlan, restore,
    contracts, contractById, contractsOf, contractOfOrder, plansToChangeTo,
    skipNext, reschedule, pause, resume, cancel, changePlan, startFromCheckout, chargeNow,
  }
})
