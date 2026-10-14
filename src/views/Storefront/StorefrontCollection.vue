<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import StorefrontProductCard from './StorefrontProductCard.vue'
import { collectionByHandle } from './storefrontCatalog'

// A collection (/collections/:handle; `all` is every product). Unknown handles get the 404 page.

const route = useRoute()
const commerce = useCommerceStore()
const collection = computed(() => collectionByHandle(commerce.products, String(route.params.handle ?? '')))
</script>

<template>
  <div v-if="collection" class="sf-collection">
    <nav class="sf-crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">›</span>
      <span aria-current="page">{{ collection.title }}</span>
    </nav>
    <h1 class="sf-page-title sf-collection__title">{{ collection.title }}</h1>
    <p class="sf-collection__count sf-muted">{{ collection.products.length }} {{ collection.products.length === 1 ? 'product' : 'products' }}</p>
    <div v-if="collection.products.length" class="sf-grid">
      <StorefrontProductCard v-for="product in collection.products" :key="product.id" :product="product" />
    </div>
    <p v-else class="sf-collection__empty">Nothing in this collection yet.</p>
  </div>
  <StorefrontNotFound v-else />
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-collection {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 0;
}

.sf-collection__title {
  margin-top: 32px;
}

.sf-collection__count {
  margin: 8px 0 40px;
  text-align: center;
  font-size: 14px;
}

.sf-collection__empty {
  text-align: center;
}
</style>
