import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { isVehicle } from '@/storefront/fitment'
import type { Vehicle } from '@/storefront/fitment'

// The shopper's vehicle on an auto-parts store, one per store and no garage. Like
// the cart and the signed-in shopper it lives for the browser tab (sessionStorage),
// so it follows the shopper from page to page and from the chat to the page.
// Applying a theme or restoring a store clears it (clearVehicle).

const KEY = 'mp.storefront.vehicle.v1'

function read(): Record<string, Vehicle> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object') return {}
    // A vehicle the table no longer offers reads as none.
    return Object.fromEntries(Object.entries(parsed).filter(([, vehicle]) => isVehicle(vehicle))) as Record<string, Vehicle>
  } catch {
    return {}
  }
}

export const useStorefrontVehicleStore = defineStore('storefrontVehicle', () => {
  const vehicles = ref<Record<string, Vehicle>>(read())

  watch(vehicles, (value) => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // Storage blocked: the vehicle stays chosen for this page view.
    }
  }, { deep: true })

  /** The shopper's vehicle on a store, or null. */
  function vehicleFor(channelId: string): Vehicle | null {
    return vehicles.value[channelId] ?? null
  }

  /** Chooses the vehicle on a store; null forgets it. */
  function setVehicle(channelId: string, vehicle: Vehicle | null): void {
    if (vehicle && isVehicle(vehicle)) vehicles.value[channelId] = { year: vehicle.year, make: vehicle.make, model: vehicle.model }
    else delete vehicles.value[channelId]
  }

  function clearVehicle(channelId: string): void {
    delete vehicles.value[channelId]
  }

  return { vehicleFor, setVehicle, clearVehicle }
})
