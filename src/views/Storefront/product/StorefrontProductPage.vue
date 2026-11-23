<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Product } from '@/stores/useCommerce'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { toHandle } from '@/storefront/handles'
import { forSameAudience, relatedByCollection } from '@/storefront/productPage'
import { RECOMMENDATION_ROW, recommendFor, recommendationHeading } from '@/storefront/search'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import { STOREFRONT } from '../storefrontContext'
import { storefrontProducts } from '../storefrontCatalog'
import StorefrontProductMain from './StorefrontProductMain.vue'
import StorefrontProductRecommendations from './StorefrontProductRecommendations.vue'

// A product page drawn by the sections drawing (a theme with `drawing: 'sections'`:
// Northfold, Torqline). It draws the theme's product template in order: the
// `product-detail` section (gallery and buy box, StorefrontProductMain) and a
// `featured-products` section (the row of other products). The header and footer
// sections are the layout's. A template without a product-detail section still
// gets one, because the page is the product; a hidden one is drawn all the same.

const props = defineProps<{ product: Product }>()
const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()

const channelId = computed(() => storefront.channel.value.id)
const collection = computed(() => props.product.collections[0] ?? null)

const DEFAULT_DETAIL: ThemeSection = { id: 'product-detail', kind: 'product-detail', label: 'Product information', settings: {} }

const sections = computed<ThemeSection[]>(() => {
  const template = storefront.theme.value?.templates.product ?? []
  const drawn = template.filter((s) => s.kind === 'product-detail' || (s.kind === 'featured-products' && !s.hidden))
  const detail = drawn.find((s) => s.kind === 'product-detail')
  return detail ? drawn.filter((s) => s.kind !== 'product-detail' || s === detail) : [DEFAULT_DETAIL, ...drawn]
})

// The row under the product. Once the store is connected to Merchandise Cloud its
// product-page engine chooses and names it ("Goes well with Linen Overshirt");
// otherwise it is the product's own collection, under the section's title. Either
// way it keeps to the piece's wearer: a men's piece is shown with men's pieces and
// those for everyone, never a women's one.
const engine = computed(() => (storefront.searchable.value ? useMerchandisingStore().productEngineFor(channelId.value) : undefined))
const listed = computed(() => forSameAudience(storefrontProducts(commerce.products, channelId.value), props.product))

function rowFor(section: ThemeSection): { heading: string; products: Product[] } {
  const wanted = Number(section.settings.productCount)
  const count = Number.isFinite(wanted) && wanted > 0 ? Math.min(wanted, RECOMMENDATION_ROW) : RECOMMENDATION_ROW
  if (engine.value) {
    return {
      heading: recommendationHeading(engine.value.type, props.product.name),
      products: recommendFor(props.product, listed.value, engine.value).slice(0, count),
    }
  }
  const title = typeof section.settings.title === 'string' && section.settings.title.trim() ? section.settings.title.trim() : 'You may also like'
  return { heading: title, products: relatedByCollection(listed.value, props.product, count) }
}
</script>

<template>
  <div class="sf-pp">
    <nav class="sf-pp__crumbs" aria-label="Breadcrumb">
      <ol>
        <li><StorefrontAnchor href="/">Home</StorefrontAnchor></li>
        <li v-if="collection">
          <StorefrontAnchor :href="`/collections/${toHandle(collection)}`">{{ collection }}</StorefrontAnchor>
        </li>
        <li><span aria-current="page">{{ product.name }}</span></li>
      </ol>
    </nav>

    <template v-for="section in sections" :key="section.id">
      <StorefrontProductMain v-if="section.kind === 'product-detail'" :product="product" :section="section" />
      <StorefrontProductRecommendations
        v-else-if="section.kind === 'featured-products'"
        v-bind="rowFor(section)"
      />
    </template>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-pp {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 20px var(--sf-gutter, 24px) 0;
}

.sf-pp__crumbs {
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 20px;
}

.sf-pp__crumbs ol {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-pp__crumbs li {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

/* A separator the screen reader does not read out. */
.sf-pp__crumbs li + li::before {
  content: '/';
  content: '/' / '';
  margin: 0 10px;
  color: var(--sf-muted, #66625c);
}

.sf-pp__crumbs a {
  color: var(--sf-muted, #66625c) !important;
}

.sf-pp__crumbs a:hover {
  color: var(--sf-text, #121011) !important;
}

.sf-pp__crumbs a:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

@media (max-width: 900px) {
  .sf-pp {
    padding-top: 12px;
  }

  .sf-pp__crumbs {
    margin-bottom: 12px;
  }
}
</style>
