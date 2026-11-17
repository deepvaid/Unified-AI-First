import { defineStore } from 'pinia'
import { ref } from 'vue'
import { browserStorage, keepInBrowser } from '@/stores/demoKeep'
import { demoSlot } from '@/storefront/demoStorage'
import { VITAHEAL_PLANS } from '@/storefront/vitahealDemo'
import { plansForProduct } from '@/subscriptions/plans'
import type { PlanInput, PlanStatus, SubscriptionPlan } from '@/subscriptions/plans'

// The subscription plans stores sell. Today only the Vitaheal (demo) store has
// any, so the whole list is kept in this browser with that store's products and
// put back by its "Restore original store". The rules are in src/subscriptions/plans.ts.

/** Saved plans are only read back when they still look like plans. */
function isPlanList(value: unknown): value is SubscriptionPlan[] {
  return Array.isArray(value) && value.every((p: Partial<SubscriptionPlan> | null) =>
    !!p && typeof p.id === 'string' && typeof p.channelId === 'string' && typeof p.name === 'string'
    && typeof p.intervalCount === 'number' && typeof p.unitsPerDelivery === 'number' && typeof p.discountPct === 'number'
    && Array.isArray(p.benefits) && Array.isArray(p.productIds))
}

const copy = (plan: SubscriptionPlan): SubscriptionPlan => ({ ...plan, benefits: [...plan.benefits], productIds: [...plan.productIds] })

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

  /** Puts the seeded plans back. Called by the demo store's restore (useCommerce). */
  function restore(): void {
    saved.clear()
    plans.value = seeded()
    kept.adopt()
  }

  return { plans, offeredFor, plansWithProduct, createPlan, updatePlan, setPlanStatus, deletePlan, restore }
})
