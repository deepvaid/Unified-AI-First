<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Product } from '@/stores/useCommerce'
import { useCommerceStore } from '@/stores/useCommerce'
import { fitsVehicle, vehicleLabel } from '@/storefront/fitment'
import { toHandle } from '@/storefront/handles'
import { gridSettings } from '@/storefront/listing'
import { acrossCollections } from '@/storefront/productPage'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import StorefrontListingCard from '../StorefrontListingCard.vue'
import StorefrontQuickAdd from '../StorefrontQuickAdd.vue'
import { STOREFRONT } from '../storefrontContext'
import { inStock, storefrontProducts } from '../storefrontCatalog'
import SectionHead from './SectionHead.vue'
import { flag, num, text } from './sectionSettings'

// A row of the store's products: the `featured-products` section. It shows the
// products of the collection it names (every product when it names none, or
// "all"), those a shopper can buy, as many as it asks for, in a grid or a row that
// scrolls sideways. "View all" opens that collection. The cards are the collection
// page's (StorefrontListingCard), in its card style and with its quick add when the
// store's collection grid offers it, so a product reads and adds the same wherever
// it is listed.
//
// On an auto-parts store, `vehicle: true` keeps the row to the shopper's vehicle
// once one is chosen: the parts that fit it first, then the universal ones, under
// "Popular parts for your 2019 Ford F-150". Before one is chosen it shows the range:
// a part from each category in turn, so it doesn't repeat a category row under it.
// On any other store the setting changes nothing.
//
// On the home page the title may have a line above it in the accent colour (the
// `eyebrow`, "Recommendations") and words of it in the accent colour (`accentWords`).
// A carousel shows four cards (1.2 on a phone, so the next one peeks in) and has
// Previous and Next buttons beside "View all", each turned off at its end.

const props = defineProps<{ section: ThemeSection }>()

const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()

const handle = computed(() => text(props.section.settings, 'collection', 'all'))
const count = computed(() => Math.min(8, Math.max(1, num(props.section.settings, 'productCount', 4))))
const carousel = computed(() => text(props.section.settings, 'layout') === 'Carousel')
const grid = computed(() => gridSettings(storefront.theme.value?.templates.collection))
const quickAddOn = computed(() => grid.value.quickAdd)

const listed = computed<Product[]>(() => storefrontProducts(commerce.products, storefront.channel.value.id)
  .filter((product) => handle.value === 'all' || product.collections.some((name) => toHandle(name) === handle.value))
  .filter(inStock))

/** The row follows the shopper's vehicle: the `vehicle` setting, on an auto-parts store. */
const partsRow = computed(() => flag(props.section.settings, 'vehicle') && storefront.sellsParts.value)
const vehicle = computed(() => (partsRow.value ? storefront.vehicle.value : null))
/** The parts the vehicle takes: those that fit it, then the universal ones, each in the store's order. */
const fitting = computed<Product[]>(() => {
  if (!vehicle.value) return []
  const takes = listed.value.filter((product) => fitsVehicle(product, vehicle.value))
  return [...takes.filter((product) => storefront.fitOf(product) === 'fits'), ...takes.filter((product) => storefront.fitOf(product) !== 'fits')]
})
const forVehicle = computed(() => fitting.value.length > 0)

const title = computed(() => {
  const base = text(props.section.settings, 'title', 'Featured products')
  return forVehicle.value ? `${base} for your ${vehicleLabel(vehicle.value!)}` : base
})
const products = computed<Product[]>(() => {
  if (forVehicle.value) return fitting.value.slice(0, count.value)
  return partsRow.value ? acrossCollections(listed.value, count.value) : listed.value.slice(0, count.value)
})

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

// ── The carousel's Previous and Next ─────────────────────────────────────
const list = ref<HTMLUListElement | null>(null)
const atStart = ref(true)
const atEnd = ref(true)

function measure(): void {
  const el = list.value
  if (!el || !carousel.value) return
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
}

/** Moves the row a page of cards (as many as are in view) back or forward. */
function page(direction: -1 | 1): void {
  const el = list.value
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollBy({ left: direction * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
}

watch([carousel, products], () => nextTick(measure), { immediate: true })
// The row's width changes with the window: what fits, and so whether there is anywhere to go.
let resizes: ResizeObserver | null = null
onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !list.value) return
  resizes = new ResizeObserver(measure)
  resizes.observe(list.value)
})
onBeforeUnmount(() => resizes?.disconnect())
</script>

<template>
  <section v-if="products.length" class="sfs sfp" :aria-labelledby="`${section.id}-title`">
    <SectionHead
      :title="title"
      :title-id="`${section.id}-title`"
      :eyebrow="text(section.settings, 'eyebrow')"
      :accent-words="text(section.settings, 'accentWords')"
    >
      <div class="sfp__tools">
        <StorefrontAnchor :href="`/collections/${handle}`" class="sfs__more">
          View all<span class="sfs-hidden"> {{ title }}</span>
          <v-icon size="18" aria-hidden="true">arrow-right</v-icon>
        </StorefrontAnchor>
        <template v-if="carousel && !(atStart && atEnd)">
          <button type="button" class="sfp__arrow" :disabled="atStart" :aria-controls="`${section.id}-list`" @click="page(-1)">
            <v-icon size="20" aria-hidden="true">arrow-left</v-icon>
            <span class="sfs-hidden">Previous products</span>
          </button>
          <button type="button" class="sfp__arrow" :disabled="atEnd" :aria-controls="`${section.id}-list`" @click="page(1)">
            <v-icon size="20" aria-hidden="true">arrow-right</v-icon>
            <span class="sfs-hidden">Next products</span>
          </button>
        </template>
      </div>
    </SectionHead>
    <ul
      :id="`${section.id}-list`"
      ref="list"
      class="sfp__list"
      :class="{ 'sfp__list--row': carousel }"
      :style="{ '--sfp-columns': Math.min(4, products.length) }"
      @scroll.passive="measure"
    >
      <li v-for="product in products" :key="product.id" class="sfp__item">
        <StorefrontListingCard
          :product="product"
          :quick-add="quickAddOn"
          :added="justAdded.includes(product.id)"
          :show-new="handle !== 'new-in'"
          :card-style="grid.cardStyle"
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

.sfp__tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sfs__more + .sfp__arrow {
  margin-left: 8px;
}

/* Previous and Next: 44px circles on the page's colours, quiet when there is nowhere to go. */
.sfp__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--sf-divider, #d9d9d9);
  border-radius: 999px;
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-text, #121011);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.sfp__arrow:hover:not(:disabled) {
  border-color: var(--sf-text, #121011);
}

.sfp__arrow:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (max-width: 900px) {
  .sfp__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 12px;
  }

  .sfp__list--row {
    grid-template-columns: none;
    grid-auto-columns: calc((100% - 12px) / 1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sfp__arrow {
    transition: none;
  }
}
</style>
