<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import type { Product } from '@/stores/useCommerce'
import { useCommerceStore } from '@/stores/useCommerce'
import { toHandle } from '@/storefront/handles'
import { gridSettings } from '@/storefront/listing'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import StorefrontListingCard from '../StorefrontListingCard.vue'
import StorefrontQuickAdd from '../StorefrontQuickAdd.vue'
import { STOREFRONT } from '../storefrontContext'
import { inStock, storefrontProducts } from '../storefrontCatalog'
import { num, text } from './sectionSettings'

// A row of the store's products: the `featured-products` section. It shows the
// products of the collection it names (every product when it names none, or
// "all"), those a shopper can buy, as many as it asks for, in a grid or a row that
// scrolls sideways. "View all" opens that collection. The cards are the collection
// page's (StorefrontListingCard), with its quick add when the store's collection
// grid offers it, so a product reads and adds the same wherever it is listed.

const props = defineProps<{ section: ThemeSection }>()

const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()

const title = computed(() => text(props.section.settings, 'title', 'Featured products'))
const handle = computed(() => text(props.section.settings, 'collection', 'all'))
const count = computed(() => Math.min(8, Math.max(1, num(props.section.settings, 'productCount', 4))))
const carousel = computed(() => text(props.section.settings, 'layout') === 'Carousel')
const quickAddOn = computed(() => gridSettings(storefront.theme.value?.templates.collection).quickAdd)

const products = computed<Product[]>(() => storefrontProducts(commerce.products, storefront.channel.value.id)
  .filter((product) => handle.value === 'all' || product.collections.some((name) => toHandle(name) === handle.value))
  .filter(inStock)
  .slice(0, count.value))

// ── Quick add (as the collection page has it) ───────────────────────────
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
  <section v-if="products.length" class="sfs sfp" :aria-labelledby="`${section.id}-title`">
    <div class="sfs__head">
      <h2 :id="`${section.id}-title`" class="sfs__title">{{ title }}</h2>
      <StorefrontAnchor :href="`/collections/${handle}`" class="sfs__more">
        View all<span class="sfs-hidden"> {{ title }}</span>
        <v-icon size="18" aria-hidden="true">arrow-right</v-icon>
      </StorefrontAnchor>
    </div>
    <ul class="sfp__list" :class="{ 'sfp__list--row': carousel }" :style="{ '--sfp-columns': Math.min(4, products.length) }">
      <li v-for="product in products" :key="product.id" class="sfp__item">
        <StorefrontListingCard
          :product="product"
          :quick-add="quickAddOn"
          :added="justAdded.includes(product.id)"
          :show-new="handle !== 'new-in'"
          @quick-add="(p, color) => quickAdd?.start(p, color)"
        />
      </li>
    </ul>
    <StorefrontQuickAdd v-if="quickAddOn" ref="quickAdd" @added="onAdded" />
  </section>
</template>

<style scoped src="./sections.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sfp__list {
  display: grid;
  grid-template-columns: repeat(var(--sfp-columns, 4), minmax(0, 1fr));
  gap: 40px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* A row that scrolls sideways, four cards in view, snapping to a card. */
.sfp__list--row {
  grid-template-columns: none;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 3 * 20px) / 4);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 12px;
}

.sfp__list--row .sfp__item {
  scroll-snap-align: start;
}

.sfp__item {
  min-width: 0;
}

@media (max-width: 900px) {
  .sfp__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 12px;
  }

  .sfp__list--row {
    grid-template-columns: none;
    grid-auto-columns: 62%;
  }
}
</style>
