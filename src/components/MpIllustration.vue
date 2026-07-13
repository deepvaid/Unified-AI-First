<script setup lang="ts">
import { computed } from 'vue'
import noResults from '@/assets/illustrations/no-results.svg?raw'
import emptyOrders from '@/assets/illustrations/empty-orders.svg?raw'
import emptyContacts from '@/assets/illustrations/empty-contacts.svg?raw'
import emptyCampaigns from '@/assets/illustrations/empty-campaigns.svg?raw'
import emptyProducts from '@/assets/illustrations/empty-products.svg?raw'
import emptyGeneric from '@/assets/illustrations/empty-generic.svg?raw'
import startHere from '@/assets/illustrations/start-here.svg?raw'
import error from '@/assets/illustrations/error.svg?raw'

export type IllustrationName =
  | 'no-results'
  | 'empty-orders'
  | 'empty-contacts'
  | 'empty-campaigns'
  | 'empty-products'
  | 'empty-generic'
  | 'start-here'
  | 'error'

const props = withDefaults(defineProps<{
  name: IllustrationName
  /** Rendered width in px; height is size * 0.75 to match the 160x120 viewBox. */
  size?: number
}>(), {
  size: 160,
})

const registry: Record<IllustrationName, string> = {
  'no-results': noResults,
  'empty-orders': emptyOrders,
  'empty-contacts': emptyContacts,
  'empty-campaigns': emptyCampaigns,
  'empty-products': emptyProducts,
  'empty-generic': emptyGeneric,
  'start-here': startHere,
  'error': error,
}

const markup = computed(() => registry[props.name] ?? '')
</script>

<template>
  <span
    v-if="markup"
    class="mp-illustration"
    aria-hidden="true"
    :style="{ width: `${size}px`, height: `${size * 0.75}px` }"
    v-html="markup"
  />
</template>

<style scoped>
.mp-illustration {
  display: inline-flex;
  color: var(--muted, rgba(0, 0, 0, 0.45));
}

.mp-illustration :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
