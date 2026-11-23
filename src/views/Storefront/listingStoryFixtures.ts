/*
 * P5.5 exemption — the store drawn here is a MERCHANT's (Northfold's), the content
 * the storefront draws, not Marobase chrome. Same line Phase 4 drew for the
 * storefront (DESIGN_AUDIT.md P4-8).
 */
import { computed, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Decorator } from '@storybook/vue3'
import type { Money } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { demoStoreFor } from '@/storefront/demoStores'
import { checkoutProfile } from '@/storefront/checkoutProfile'
import { NORTHFOLD_CHROME } from '@/storefront/northfoldDemo'
import { formatStorePrice } from '@/storefront/price'
import { roundForDisplay } from '@/subscriptions/plans'
import { announce } from './storefrontAnnouncer'
import { STOREFRONT } from './storefrontContext'
import type { StorefrontContext } from './storefrontContext'
import { northfold } from './storefrontStoryFixtures'

// The product-list stories (StorefrontProductListing, its card, filters and quick add)
// draw Northfold (demo) as its shoppers see it: its own seeded products and theme, and
// the storefront context StorefrontLayout gives every page, with the parts these
// pieces read (money, links, the store, the announcer).

const CHANNEL = demoStoreFor('northfold').homeChannel
const BASE = `/accounts/2000290/sales_channels/${CHANNEL.id}/storefront`

/** Northfold's twenty products, as the store sells them. */
export const northfoldProducts: Product[] = northfold.products.map((p) => ({ ...p, status: p.inventory > 0 ? 'In Stock' : 'Out of Stock' }))

export function listingProduct(name: string): Product {
  const product = northfoldProducts.find((p) => p.name === name)
  if (!product) throw new Error(`No Northfold product "${name}"`)
  return product
}

/** A collection's products, in the store's order. */
export function northfoldCollection(title: string): Product[] {
  return northfoldProducts.filter((p) => p.collections.includes(title))
}

/** The product with every variant sold out. */
export function soldOutCopy(product: Product): Product {
  const copy = structuredClone(product)
  for (const v of copy.detail?.variantsList ?? []) v.stock = Object.fromEntries(Object.keys(v.stock).map((k) => [k, 0]))
  copy.inventory = 0
  copy.status = 'Out of Stock'
  return copy
}

const formatMoney = (amount: Money) => formatStorePrice(roundForDisplay(amount))

/** What StorefrontLayout shares with its pages, for Northfold. The parts the payment pieces read are left out. */
const context = {
  channel: computed(() => CHANNEL),
  theme: computed(() => ({ ...northfold.theme, channelId: CHANNEL.id, status: 'Published' as const, updatedAt: northfold.theme.publishedAt })),
  chrome: computed(() => NORTHFOLD_CHROME),
  link: (href: string) => (/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : href === '/' ? BASE : `${BASE}${href.startsWith('/') ? '' : '/'}${href}`),
  currency: computed(() => 'USD'),
  formatMoney,
  formatExact: (amount: Money) => formatStorePrice(amount),
  ownMoneyFormat: computed(() => false),
  checkout: computed(() => checkoutProfile('USD')),
  demo: computed(() => true),
  searchable: computed(() => true),
  campaignMessage: computed(() => ''),
  sectionsDrawing: computed(() => true),
  sizeCharts: computed(() => northfold.sizeCharts),
  sizeChartFor: () => undefined,
  announce,
} as unknown as StorefrontContext

/**
 * Provides the store to the story, and starts it on a collection page with `query`
 * in the URL (the list keeps its filters and sort there). Stories that use it get
 * their own frame on the docs page (`overlayDocs`), so their URLs do not mix.
 */
export function northfoldStore(query: Record<string, string> = {}, page = 'collections/women'): Decorator {
  return (story) => ({
    components: { story },
    setup() {
      provide(STOREFRONT, context)
      const ready = ref(false)
      void useRouter().replace({ path: `${BASE}/${page}`, query }).finally(() => { ready.value = true })
      return { ready }
    },
    template: '<story v-if="ready" />',
  })
}
