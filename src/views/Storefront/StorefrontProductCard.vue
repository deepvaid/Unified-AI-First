<script setup lang="ts">
import { computed, inject } from 'vue'
import { formatMoney } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import StorefrontAnchor from './StorefrontAnchor.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, inStock, priceOf, productHandle } from './storefrontCatalog'

// A product in a grid (home, collections, "You may also like").

const props = defineProps<{ product: Product }>()
const storefront = inject(STOREFRONT)!
const price = computed(() => formatMoney(priceOf(props.product, storefront.currency.value)))
</script>

<template>
  <StorefrontAnchor :href="`/products/${productHandle(product)}`" class="sf-card">
    <span class="sf-card__media" aria-hidden="true">
      <v-icon size="44">{{ CATEGORY_ICONS[product.category] ?? 'package' }}</v-icon>
      <span v-if="!inStock(product)" class="sf-card__tag">Sold out</span>
    </span>
    <span class="sf-card__name">{{ product.name }}</span>
    <span class="sf-card__price">{{ price }}</span>
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
  background: #121011;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
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
