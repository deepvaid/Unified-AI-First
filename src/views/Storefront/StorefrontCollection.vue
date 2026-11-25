<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { useProductExtrasStore } from '@/stores/useProductExtras'
import { gridSettings, isNewCollection } from '@/storefront/listing'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import StorefrontProductCard from './StorefrontProductCard.vue'
import StorefrontProductListing from './StorefrontProductListing.vue'
import { STOREFRONT } from './storefrontContext'
import { collectionByHandle } from './storefrontCatalog'

// A collection (/collections/:handle; `all` is every product). Unknown handles get the 404 page.
// On the richer theme drawing (Northfold, Torqline) it is the collection template's product
// grid: filters, sort and quick add (StorefrontProductListing), with the collection's
// description from Products › Collections under its title. Every other theme keeps the
// classic page below.

const route = useRoute()
const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const collection = computed(() => collectionByHandle(commerce.products, storefront.channel.value.id, String(route.params.handle ?? '')))

const sections = computed(() => storefront.sectionsDrawing.value)
const isAll = computed(() => String(route.params.handle ?? '') === 'all')
const title = computed(() => (isAll.value ? 'All products' : collection.value?.title ?? ''))
const intro = computed(() => {
  if (!sections.value || isAll.value || !collection.value) return ''
  const channelId = storefront.channel.value.id
  const own = useProductExtrasStore().collections.find((c) => c.salesChannels.includes(channelId) && c.title === collection.value!.title)
  return own?.description.trim() ?? ''
})
const settings = computed(() => gridSettings(storefront.theme.value?.templates.collection))
</script>

<template>
  <div v-if="collection && sections" class="sf-collection-v2">
    <nav class="sf-crumbs sf-collection-v2__crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ title }}</span>
    </nav>
    <StorefrontProductListing
      :key="String(route.params.handle)"
      :products="collection.products"
      :title="title"
      :intro="intro"
      :settings="settings"
      :show-new="!isNewCollection(title)"
      :scope="isAll ? '' : title"
    >
      <template #empty>
        <div class="sf-collection-v2__empty">
          <p class="sf-collection-v2__empty-title">Nothing here yet</p>
          <p class="sf-collection-v2__empty-text">New {{ storefront.sellsParts.value ? 'parts' : 'styles' }} are on their way. In the meantime, have a look at everything else.</p>
          <StorefrontAnchor href="/collections/all" class="sf-collection-v2__empty-link">Shop all products</StorefrontAnchor>
        </div>
      </template>
    </StorefrontProductListing>
  </div>
  <div v-else-if="collection" class="sf-collection">
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

/* The richer theme drawing. */
.sf-collection-v2 {
  padding-bottom: 24px;
}

/* On the page's measure and gutter, as the list under it (StorefrontProductListing). */
.sf-collection-v2__crumbs {
  justify-content: center;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 24px var(--sf-gutter, 24px) 0;
  color: var(--sf-muted, #66625c);
  font-size: 13px;
}

.sf-collection-v2__crumbs a {
  color: inherit;
}

.sf-collection-v2__crumbs [aria-current='page'] {
  color: var(--sf-text, #121011);
}

.sf-collection-v2__empty {
  padding: 24px 16px 40px;
  text-align: center;
}

.sf-collection-v2__empty-title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 28px;
  font-weight: var(--sf-heading-weight, 400);
  text-transform: var(--sf-heading-case, none);
}

.sf-collection-v2__empty-text {
  max-width: 30em;
  margin: 8px auto 24px;
  color: var(--sf-muted, #66625c);
}

.sf-collection-v2__empty-link {
  display: inline-flex;
  align-items: center;
  min-height: 50px;
  padding: 0 24px;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-brand, #121011);
  color: var(--sf-on-brand, #ffffff) !important;
  font-weight: 600;
  text-decoration: none !important;
}

.sf-collection-v2__empty-link:focus-visible,
.sf-collection-v2__crumbs a:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .sf-collection-v2__crumbs {
    padding-top: 16px;
  }
}
</style>
