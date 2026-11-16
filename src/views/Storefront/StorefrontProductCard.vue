<script setup lang="ts">
import { computed, inject } from 'vue'
import { parseDecimal } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { hasPriceRange, lowestPrice } from '@/storefront/catalog'
import StorefrontAnchor from './StorefrontAnchor.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, inStock, priceOf, productHandle } from './storefrontCatalog'

// A product in a grid (home, collections, "You may also like"). A product with
// pictures shows its first; one whose variants differ in price shows the lowest
// after "From". Products without either look as they always did.

const props = defineProps<{ product: Product }>()
const storefront = inject(STOREFRONT)!
const priceRange = computed(() => hasPriceRange(props.product))
const price = computed(() => {
  const currency = storefront.currency.value
  return storefront.formatMoney(parseDecimal(lowestPrice(props.product), currency) ?? priceOf(props.product, currency))
})
const image = computed(() => props.product.imageUrls?.[0])
const subtitle = computed(() => props.product.detail?.subtitle.trim())
</script>

<template>
  <StorefrontAnchor :href="`/products/${productHandle(product)}`" class="sf-card">
    <span class="sf-card__media" aria-hidden="true">
      <img v-if="image" :src="image" alt="" class="sf-card__image" loading="lazy">
      <v-icon v-else size="44">{{ CATEGORY_ICONS[product.category] ?? 'package' }}</v-icon>
      <span v-if="!inStock(product)" class="sf-card__tag">Sold out</span>
    </span>
    <span v-if="subtitle" class="sf-card__subtitle">{{ subtitle }}</span>
    <span class="sf-card__name">{{ product.name }}</span>
    <span class="sf-card__price"><template v-if="priceRange">From </template>{{ price }}</span>
  </StorefrontAnchor>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sf-card:hover {
  text-decoration: none !important;
}

.sf-card:hover .sf-card__name {
  text-decoration: underline;
}

/* Stands in for the product photograph. */
.sf-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  margin-bottom: 6px;
  border-radius: 8px;
  background: linear-gradient(160deg, #f4f4f2 0%, #e6e5e1 100%);
  color: #8a8780;
}

.sf-card__tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sf-badge-sold-out, #121011);
  color: var(--sf-on-badge-sold-out, #ffffff);
  font-size: 12px;
  font-weight: 600;
}

.sf-card__image {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.sf-card__subtitle {
  color: var(--sf-muted, #5f5f5f);
  font-size: 13px;
  line-height: 18px;
}

.sf-card__name {
  font-size: 15px;
  line-height: 20px;
}

.sf-card__price {
  font-size: 15px;
  font-weight: 600;
}
</style>
