<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { SEARCH_SORTS, redirectPath, searchStore } from '@/storefront/search'
import type { SearchSort } from '@/storefront/search'
import { resultCountText } from '@/storefront/facets'
import { gridSettings, listingNoun } from '@/storefront/listing'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import StorefrontProductCard from './StorefrontProductCard.vue'
import StorefrontProductListing from './StorefrontProductListing.vue'
import { STOREFRONT } from './storefrontContext'
import { collectionsOf, storefrontProducts } from './storefrontCatalog'

// The store's search page (/search?q=). A store has one once it is connected to
// Merchandise Cloud; until then this address is the store's 404 page, as before.
// What a query finds follows the merchant's rules in Merchandising: pins,
// synonyms, redirects and blacklisted products (src/storefront/search.ts).
// On the richer theme drawing (Northfold, Torqline) the results are a product list
// like a collection's, with filters, sort and quick add (StorefrontProductListing);
// its sort starts on the best match. Every other theme keeps the classic page below.

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

// The richer drawing's box and button. The list is drawn afresh for each query (its key), box
// and all, so after a search from the box focus goes back to where the shopper was.
const box = ref<HTMLInputElement | null>(null)
const go = ref<HTMLButtonElement | null>(null)

async function submit(): Promise<void> {
  const q = typed.value.trim()
  if (!q) return
  const from = document.activeElement === go.value ? go : document.activeElement === box.value ? box : null
  await router.push({ query: { q } })
  await nextTick()
  from?.value?.focus()
}

// Arriving on the empty search page (the header's search icon, the menu's Search) puts the shopper in the box.
watch(box, (el) => {
  if (el && !query.value) el.focus()
}, { flush: 'post' })

// The richer theme drawing: the search's own order is the best match, which the list's sort starts on.
const sections = computed(() => storefront.sectionsDrawing.value)
const matches = computed(() => (sections.value ? searchStore(query.value, storefrontProducts(commerce.products, channelId.value), merchandising.searchRulesFor(channelId.value)).products : []))
const settings = computed(() => gridSettings(storefront.theme.value?.templates.collection))
// A new search from the box on this page: the shopper stays in the box, so they hear what it found.
watch(query, (q) => {
  if (!sections.value || !q || redirecting.value) return
  const found = matches.value.length
  storefront.announce(found ? `Results for “${q}”: ${resultCountText(found, found, listingNoun(matches.value))}` : `Nothing matches “${q}”`)
})
</script>

<template>
  <StorefrontNotFound v-if="!storefront.searchable.value" />
  <div v-else-if="!redirecting && sections" class="sf-search-v2">
    <nav class="sf-crumbs sf-search-v2__crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Search</span>
    </nav>
    <StorefrontProductListing
      :key="query"
      :products="matches"
      :title="query && matches.length ? `Results for “${query}”` : 'Search'"
      page="search"
      :settings="settings"
    >
      <template #lead>
        <form class="sf-search-v2__form" role="search" @submit.prevent="submit">
          <label class="sf-search-v2__field">
            <span class="sf-search-v2__sr">Search the store</span>
            <v-icon size="18" class="sf-search-v2__icon" aria-hidden="true">search</v-icon>
            <input ref="box" v-model="typed" type="search" class="sf-search-v2__input" placeholder="What are you looking for?" enterkeyhint="search" data-sf-search-box>
          </label>
          <button ref="go" type="submit" class="sf-search-v2__go">Search</button>
        </form>
        <p v-if="result.alsoSearched.length && matches.length" class="sf-search-v2__also">Including results for {{ result.alsoSearched.join(' and ') }}.</p>
      </template>
      <template #empty>
        <div class="sf-search-v2__empty">
          <template v-if="query">
            <h2 class="sf-search-v2__none">Nothing matches “{{ query }}”</h2>
            <p class="sf-search-v2__hint">Check the spelling or try a broader word. Or start from a collection:</p>
          </template>
          <p v-else class="sf-search-v2__hint">Search by name, or by what you are looking for. Or start from a collection:</p>
          <ul class="sf-search-v2__collections" aria-label="Collections">
            <li v-for="collection in collections" :key="collection.handle">
              <StorefrontAnchor :href="`/collections/${collection.handle}`" class="sf-search-v2__chip">{{ collection.name }}</StorefrontAnchor>
            </li>
            <li><StorefrontAnchor href="/collections/all" class="sf-search-v2__chip">All products</StorefrontAnchor></li>
          </ul>
        </div>
      </template>
    </StorefrontProductListing>
  </div>
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

/* The richer theme drawing. */
.sf-search-v2 {
  padding-bottom: 24px;
}

/* On the page's measure and gutter, as the list under it (StorefrontProductListing). */
.sf-search-v2__crumbs {
  justify-content: center;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 24px var(--sf-gutter, 24px) 0;
  color: var(--sf-muted, #66625c);
  font-size: 13px;
}

.sf-search-v2__crumbs a {
  color: inherit;
}

.sf-search-v2__crumbs [aria-current='page'] {
  color: var(--sf-text, #121011);
}

.sf-search-v2__form {
  display: flex;
  gap: 8px;
  max-width: 560px;
  margin: 24px auto 0;
}

.sf-search-v2__field {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
}

.sf-search-v2__icon {
  position: absolute;
  left: 14px;
  color: var(--sf-muted, #66625c);
  pointer-events: none;
}

.sf-search-v2__input {
  width: 100%;
  height: 48px;
  padding: 0 14px 0 42px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 22%, transparent);
  border-radius: var(--sf-radius, 0);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  font: inherit;
  font-size: 15px;
}

.sf-search-v2__input:hover {
  border-color: color-mix(in srgb, var(--sf-text, #121011) 45%, transparent);
}

.sf-search-v2__go {
  flex-shrink: 0;
  min-height: 48px;
  padding: 0 22px;
  border: 1px solid var(--sf-brand, #121011);
  border-radius: var(--sf-radius, 0);
  background: var(--sf-brand, #121011);
  color: var(--sf-on-brand, #ffffff);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.sf-search-v2__input:focus-visible,
.sf-search-v2__go:focus-visible,
.sf-search-v2__chip:focus-visible,
.sf-search-v2__crumbs a:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sf-search-v2__also {
  margin: 14px 0 0;
  color: var(--sf-muted, #66625c);
  font-size: 14px;
}

.sf-search-v2__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.sf-search-v2__empty {
  padding: 8px 16px 40px;
  text-align: center;
}

.sf-search-v2__none {
  margin: 0;
  line-height: 1.2;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 28px;
  font-weight: var(--sf-heading-weight, 400);
  text-transform: var(--sf-heading-case, none);
  overflow-wrap: anywhere;
}

.sf-search-v2__hint {
  margin: 8px 0 0;
  color: var(--sf-muted, #66625c);
}

.sf-search-v2__collections {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.sf-search-v2__chip {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid color-mix(in srgb, var(--sf-text, #121011) 22%, transparent);
  border-radius: var(--sf-radius, 0);
  color: var(--sf-text, #121011) !important;
  font-size: 14px;
  text-decoration: none !important;
}

.sf-search-v2__chip:hover {
  border-color: var(--sf-text, #121011);
}

@media (max-width: 600px) {
  .sf-search-v2__crumbs {
    padding-top: 16px;
  }

  .sf-search-v2__go {
    padding: 0 16px;
  }
}
</style>
