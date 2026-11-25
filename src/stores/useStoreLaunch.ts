import { ref } from 'vue'
import { defineStore } from 'pinia'
import { demoSlotFor } from '@/storefront/demoStorage'
import { MANUAL_LAUNCH_STEPS, isConfirmedList } from '@/storefront/storeLaunch'
import type { LaunchStepId } from '@/storefront/storeLaunch'
import { browserStorage } from './demoKeep'

// The steps of a store's launch checklist that the merchant marks done by hand
// (src/storefront/storeLaunch.ts: the store's name and logo, shipping, taxes).
// Kept in this browser with the rest of the store's data, under the store's own
// key (`…launch.v1`), so deleting the store removes it and a restore forgets it.

export const useStoreLaunchStore = defineStore('storeLaunch', () => {
  const confirmedBy = ref<Record<string, LaunchStepId[]>>({})
  const slotOf = (channelId: string) => demoSlotFor(channelId, 'launch', 1, browserStorage(), isConfirmedList)

  /** Reads what this browser kept for the store. Call it when a store's page opens. */
  function load(channelId: string): void {
    confirmedBy.value[channelId] = slotOf(channelId).load() ?? []
  }

  /** The manual steps the store's merchant has marked done. */
  function confirmed(channelId: string): LaunchStepId[] {
    return confirmedBy.value[channelId] ?? []
  }

  /** Marks a manual step done. False for a step the store reads by itself. */
  function confirm(channelId: string, step: LaunchStepId): boolean {
    if (!MANUAL_LAUNCH_STEPS.includes(step)) return false
    const now = confirmed(channelId)
    if (!now.includes(step)) {
      confirmedBy.value[channelId] = [...now, step]
      slotOf(channelId).save(confirmedBy.value[channelId])
    }
    return true
  }

  /** The store was restored or deleted: nothing is marked done any more. */
  function forget(channelId: string): void {
    delete confirmedBy.value[channelId]
    slotOf(channelId).clear()
  }

  return { load, confirmed, confirm, forget }
})
