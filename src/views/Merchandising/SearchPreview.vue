<script setup lang="ts">
import { computed, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MerchProductCard from '@/components/merchandising/MerchProductCard.vue'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { catalogFor } from '@/storefront/catalog'
import { sellsParts } from '@/storefront/fitment'
import { partNumberSearch, partNumberTarget, searchStore } from '@/storefront/search'

/**
 * Merchandising › Search › Preview. For a store with products of its own this
 * runs the search its shoppers get (src/storefront/search.ts), so a pin, synonym,
 * redirect or blacklisted product made here shows before a shopper meets it. On a
 * store that sells parts (Torqline) a part number typed whole opens its part, as on
 * the storefront, unless a redirect takes the same words. The other stores have no
 * storefront search yet and keep the "coming soon" panel.
 */
const store = useMerchandisingStore()
const commerce = useCommerceStore()
const themes = useStoreThemesStore()

const query = ref('')
const catalog = computed(() => catalogFor(commerce.products, store.activeChannelId))
const rules = computed(() => store.searchRulesFor(store.activeChannelId))
const result = computed(() => searchStore(query.value, catalog.value, rules.value))
/** The storefront looks up part numbers where the store sells parts on the sections drawing (StorefrontLayout's `sellsParts`). */
const parts = computed(() => themes.themeForChannel(store.activeChannelId)?.styles.drawing === 'sections' && sellsParts(catalog.value))
const part = computed(() => (parts.value ? partNumberSearch(query.value, catalog.value, rules.value) : undefined))
// The same products as Merchandising lists them: photo, and the price the store's way.
const found = computed(() => result.value.products.flatMap((product) => store.merchProductList.find((p) => p.id === String(product.id)) ?? []))
const tried = computed(() => [...new Set(store.searchPinList.map((pin) => pin.query))].slice(0, 4))
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      title="Search Preview"
      :subtitle="store.ownData ? `What shoppers find when they search ${store.activeStore.domain}` : `Test search results live for ${store.activeStore.domain}. Coming soon.`"
    />

    <v-card v-if="!store.ownData" flat border rounded="lg" class="flex-grow-1 d-flex align-center justify-center">
      <MpEmptyState
        icon="search"
        title="Search Preview is coming soon"
        description="You'll be able to test queries against your live index, preview ranking, and tweak relevance from this page."
        action-label="Notify me when ready"
        action-icon="bell"
      />
    </v-card>

    <template v-else>
      <v-card flat border rounded="lg" class="mp-card-inset">
        <v-text-field
          v-model="query"
          placeholder="Type what a shopper would search for"
          aria-label="Search query"
          prepend-inner-icon="search"
          clearable
          autofocus
          hide-details
        /><!-- hide-details: a query box, not a form field. It has no label and nothing to validate. -->
        <div v-if="tried.length" class="d-flex flex-wrap align-center ga-2 mt-3">
          <span class="text-caption text-medium-emphasis">Try a pinned search:</span>
          <v-chip v-for="term in tried" :key="term" size="small" variant="tonal" @click="query = term">{{ term }}</v-chip>
        </div>
        <p class="text-caption text-medium-emphasis mt-3 mb-0">Results follow this store's pins, synonyms, redirects{{ parts ? ', blacklisted products and part numbers' : ' and blacklisted products' }}, the same as on the storefront.</p>
      </v-card>

      <MpAlert v-if="result.redirectTo" tone="info" title="This search is redirected">
        Shoppers who search “{{ result.query }}” go straight to {{ result.redirectTo }} and see no results.
      </MpAlert>

      <MpAlert v-else-if="part" tone="info" title="This search is a part number">
        Shoppers who search “{{ result.query }}” go straight to {{ partNumberTarget(part) }}, the part with that number, and see no results.
      </MpAlert>

      <v-card v-else flat border rounded="lg" class="flex-grow-1 mp-card-inset">
        <MpEmptyState
          v-if="!result.query"
          icon="search"
          title="Search this store"
          description="Type a query to see the products a shopper would get, in the order they would get them."
        />
        <MpEmptyState
          v-else-if="!found.length"
          icon="search-x"
          :title="`Nothing matches “${result.query}”`"
          description="Shoppers get an empty page with links to your collections. Add a synonym or a redirect to send this search somewhere useful."
        />
        <template v-else>
          <p class="text-body-2 text-medium-emphasis mb-4" role="status">
            {{ found.length }} {{ found.length === 1 ? 'product' : 'products' }} for “{{ result.query }}”<template v-if="result.alsoSearched.length">, widened by a synonym to {{ result.alsoSearched.join(' and ') }}</template><template v-if="result.pinnedIds.length">, {{ result.pinnedIds.length }} pinned to the top</template>
          </p>
          <div class="preview-grid">
            <MerchProductCard
              v-for="(product, index) in found"
              :key="product.id"
              :product="product"
              :pinned="result.pinnedIds.includes(Number(product.id))"
              :rank="index + 1"
              :interactive="false"
            />
          </div>
        </template>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--mp-space-80) * 2), 1fr));
  gap: var(--mp-component-card-gap);
}
</style>
