<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { SEARCH_SORTS, redirectPath, searchStore } from '@/storefront/search'
import type { SearchSort } from '@/storefront/search'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import StorefrontProductCard from './StorefrontProductCard.vue'
import { STOREFRONT } from './storefrontContext'
import { collectionsOf, storefrontProducts } from './storefrontCatalog'

// The store's search page (/search?q=). A store has one once it is connected to
// Merchandise Cloud; until then this address is the store's 404 page, as before.
// What a query finds follows the merchant's rules in Merchandising: pins,
// synonyms, redirects and blacklisted products (src/storefront/search.ts).

const route = useRoute()
const router = useRouter()
const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const merchandising = useMerchandisingStore()

const channelId = computed(() => storefront.channel.value.id)
const query = computed(() => {
  const q = route.query.q
  return String((Array.isArray(q) ? q[0] : q) ?? '').trim()
})
const sort = ref<SearchSort>('relevance')
const result = computed(() => searchStore(query.value, storefrontProducts(commerce.products, channelId.value), merchandising.searchRulesFor(channelId.value), sort.value))
const collections = computed(() => collectionsOf(commerce.products, channelId.value))

// A redirect takes the shopper to its page: inside the store when it is one of the store's own.
const redirecting = computed(() => storefront.searchable.value && !!result.value.redirectTo)
watch(() => (storefront.searchable.value ? result.value.redirectTo : undefined), (to) => {
  if (!to) return
  const path = redirectPath(to, storefront.channel.value.webStore?.domain)
  if (path) void router.replace(storefront.link(path))
  else window.location.assign(to)
}, { immediate: true })

const typed = ref(query.value)
watch(query, (q) => { typed.value = q })
function submit(): void {
  const q = typed.value.trim()
  if (q) void router.push({ query: { q } })
}
</script>

<template>
  <StorefrontNotFound v-if="!storefront.searchable.value" />
  <div v-else-if="!redirecting" class="sf-results">
    <nav class="sf-crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">›</span>
      <span aria-current="page">Search</span>
    </nav>

    <h1 class="sf-page-title sf-results__title">{{ query ? `Results for “${query}”` : 'Search' }}</h1>

    <form class="sf-results__form" role="search" @submit.prevent="submit">
      <input v-model="typed" type="search" class="sf-input" placeholder="Search products" aria-label="Search products">
      <button type="submit" class="sf-button">Search</button>
    </form>

    <template v-if="result.products.length">
      <div class="sf-results__bar">
        <p class="sf-muted" role="status">
          {{ result.products.length }} {{ result.products.length === 1 ? 'product' : 'products' }}<template v-if="result.alsoSearched.length">, including results for {{ result.alsoSearched.join(' and ') }}</template>
        </p>
        <label v-if="result.products.length > 1" class="sf-results__sort">
          <span class="sf-muted">Sort by</span>
          <select v-model="sort" class="sf-input">
            <option v-for="option in SEARCH_SORTS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
      </div>
      <div class="sf-grid">
        <StorefrontProductCard v-for="product in result.products" :key="product.id" :product="product" />
      </div>
    </template>

    <div v-else class="sf-results__empty" role="status">
      <template v-if="query">
        <p class="sf-results__none">Nothing matches “{{ query }}”.</p>
        <p class="sf-muted">Check the spelling, try a shorter word, or browse a collection.</p>
      </template>
      <p v-else class="sf-muted">Search by product name, or by what you are looking for.</p>
      <ul class="sf-results__collections" aria-label="Collections">
        <li v-for="collection in collections" :key="collection.handle">
          <StorefrontAnchor :href="`/collections/${collection.handle}`" class="sf-results__chip">{{ collection.name }}</StorefrontAnchor>
        </li>
        <li><StorefrontAnchor href="/collections/all" class="sf-results__chip">All products</StorefrontAnchor></li>
      </ul>
    </div>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-results {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 0;
}

.sf-results__title {
  margin-top: 32px;
  overflow-wrap: anywhere;
}

.sf-results__form {
  display: flex;
  gap: 8px;
  max-width: 520px;
  margin: 24px auto 0;
}

.sf-results__form .sf-input {
  flex: 1;
  min-width: 0;
}

.sf-results__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 40px 0 24px;
  font-size: 14px;
}

.sf-results__bar p {
  margin: 0;
}

.sf-results__sort {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sf-results__sort .sf-input {
  width: auto;
}

.sf-results__empty {
  margin-top: 40px;
  text-align: center;
}

.sf-results__none {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.sf-results__collections {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.sf-results__chip {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 14px;
}
</style>
