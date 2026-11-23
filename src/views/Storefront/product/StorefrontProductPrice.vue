<script setup lang="ts">
// A product's price on a product page of the sections drawing. On sale: the price
// in the theme's sale colour, the usual price struck through, and a "−25%" badge.
// A screen reader hears "Sale price $88.00, Usual price $118.00, 25% off".
// Amounts arrive formatted the store's way (`formatMoney`).

import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** "$88.00". */
  price: string
  /** The usual price when on sale: "$118.00". */
  compareAt?: string
  /** Whole percent off the usual price; 0 hides the badge. */
  percentOff?: number
  /** The variants differ in price and none is chosen: "From $34.00". */
  from?: boolean
}>(), {
  compareAt: '',
  percentOff: 0,
  from: false,
})

const now = computed(() => `${props.from ? 'From ' : ''}${props.price}`)

/**
 * What a screen reader hears, as one sentence. The amounts are drawn in separate
 * boxes, and a browser puts a space between boxes ("$118.00 , 25% off"), so the
 * spoken line is its own text and the drawn parts are hidden from it.
 */
const spoken = computed(() => {
  if (!props.compareAt) return now.value
  return `Sale price ${now.value}, Usual price ${props.compareAt}${props.percentOff ? `, ${props.percentOff}% off` : ''}`
})
</script>

<template>
  <p class="sf-price" :class="{ 'is-sale': compareAt }">
    <span class="sf-price__sr">{{ spoken }}</span>
    <span class="sf-price__now" aria-hidden="true">{{ now }}</span>
    <s v-if="compareAt" class="sf-price__was" aria-hidden="true">{{ compareAt }}</s>
    <span v-if="compareAt && percentOff" class="sf-price__badge" aria-hidden="true">−{{ percentOff }}%</span>
  </p>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. The sale colour is the
 * theme's sale badge fill (--sf-badge-sale), its ink the colour picked for it. */
.sf-price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin: 0;
  font-size: 18px;
  line-height: 26px;
  font-variant-numeric: tabular-nums;
}

.sf-price__now {
  font-weight: 500;
}

.is-sale .sf-price__now {
  color: var(--sf-badge-sale, #b3261e);
}

.sf-price__was {
  color: var(--sf-muted, #66625c);
  font-size: 16px;
  text-decoration-thickness: 1px;
}

.sf-price__badge {
  align-self: center;
  padding: 2px 8px;
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-badge-sale, #b3261e);
  color: var(--sf-on-badge-sale, #ffffff);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0.02em;
}

.sf-price__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
