<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { vehicleLabel } from '@/storefront/fitment'
import type { Vehicle } from '@/storefront/fitment'
import StorefrontDrawer from './StorefrontDrawer.vue'
import StorefrontVehicleSelector from './StorefrontVehicleSelector.vue'
import { STOREFRONT } from './storefrontContext'

// The vehicle selector in a drawer, on an auto-parts store. StorefrontLayout mounts
// it once and opens it from anywhere (`chooseVehicle`): the header's vehicle chip, a
// list's "Change", the fit banner's Select vehicle, the chat. Saving keeps the
// vehicle for the store (the tab's session), closes the drawer and says "Showing
// parts for 2019 Ford F-150" to screen readers once focus is back on the page;
// Clear vehicle forgets it.

const open = defineModel<boolean>({ default: false })
const storefront = inject(STOREFRONT)!

const vehicle = computed(() => storefront.vehicle.value)
/** Each opening starts the selects on the vehicle as it is now. */
const opened = ref(0)
watch(open, (value) => { if (value) opened.value += 1 })

/** Said once the drawer has closed, so it is heard on the page rather than in a dialog going away. */
let message = ''

function save(next: Vehicle): void {
  storefront.setVehicle(next)
  message = `Showing parts for ${vehicleLabel(next)}`
  open.value = false
}

function clear(): void {
  storefront.setVehicle(null)
  message = 'Vehicle cleared'
  open.value = false
}

function onClosed(): void {
  if (message) storefront.announce(message)
  message = ''
}
</script>

<template>
  <StorefrontDrawer
    v-model="open"
    title="Your vehicle"
    description="Choose it once and every page shows whether a part fits."
    close-label="Close vehicle selector"
    @close="onClosed"
  >
    <StorefrontVehicleSelector :key="opened" :vehicle="vehicle" clearable @submit="save" @clear="clear" />
  </StorefrontDrawer>
</template>
