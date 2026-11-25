<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import type { Product } from '@/stores/useCommerce'
import { gridSettings } from '@/storefront/listing'
import StorefrontListingCard from '../StorefrontListingCard.vue'
import StorefrontQuickAdd from '../StorefrontQuickAdd.vue'
import { STOREFRONT } from '../storefrontContext'

// The row under a product (the product template's `featured-products` section):
// "Goes well with Linen Overshirt" when the store's recommendation engine chooses
// it, "You may also like" when the store has none. The page chooses the products.
// The cards are the collection page's (StorefrontListingCard), in its card style and
// with its quick add when the store's collection grid offers it, so a product reads
// and adds the same wherever it is listed.

defineProps<{
  heading: string
  products: Product[]
}>()

const storefront = inject(STOREFRONT)!
const grid = computed(() => gridSettings(storefront.theme.value?.templates.collection))
const quickAddOn = computed(() => grid.value.quickAdd)

const quickAdd = ref<InstanceType<typeof StorefrontQuickAdd> | null>(null)
/** Cards whose product was just added straight from the card: their "+" reads "Added" for a moment. */
const justAdded = ref<number[]>([])
const timers = new Map<number, number>()

function onAdded(product: Product): void {
  justAdded.value = [...justAdded.value.filter((id) => id !== product.id), product.id]
  window.clearTimeout(timers.get(product.id))
  timers.set(product.id, window.setTimeout(() => {
    justAdded.value = justAdded.value.filter((id) => id !== product.id)
    timers.delete(product.id)
  }, 2000))
}
onBeforeUnmount(() => {
  for (const timer of timers.values()) window.clearTimeout(timer)
})
</script>

<template>
  <section v-if="products.length" class="sf-recs" aria-labelledby="sf-recs-title">
    <h2 id="sf-recs-title" class="sf-recs__title">{{ heading }}</h2>
    <ul class="sf-recs__grid">
      <li v-for="item in products" :key="item.id" class="sf-recs__item">
        <StorefrontListingCard
          :product="item"
          :quick-add="quickAddOn"
          :added="justAdded.includes(item.id)"
          :card-style="grid.cardStyle"
          @quick-add="(p, color) => quickAdd?.start(p, color)"
        />
      </li>
    </ul>
    <StorefrontQuickAdd v-if="quickAddOn" ref="quickAdd" @added="onAdded" />
  </section>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Four across, two on a phone. */
.sf-recs {
  margin-top: 88px;
}

.sf-recs__title {
  margin: 0 0 24px;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 30px;
  font-weight: var(--sf-heading-weight, 400);
  line-height: 1.15;
  text-transform: var(--sf-heading-case, none);
}

.sf-recs__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 40px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-recs__item {
  min-width: 0;
}

@media (max-width: 900px) {
  .sf-recs {
    margin-top: 56px;
  }

  .sf-recs__title {
    font-size: 26px;
  }

  .sf-recs__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 12px;
  }
}
</style>
