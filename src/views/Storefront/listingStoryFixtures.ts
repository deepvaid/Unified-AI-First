/*
 * P5.5 exemption — the stores drawn here are a MERCHANT's (Northfold's, Torqline's), the
 * content the storefront draws, not Marobase chrome. Same line Phase 4 drew for the
 * storefront (DESIGN_AUDIT.md P4-8).
 */
import { computed, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Decorator } from '@storybook/vue3'
import type { Money } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { demoStoreFor } from '@/storefront/demoStores'
import { snapshotFor } from '@/storefront/demoStores/install'
import { checkoutProfile } from '@/storefront/checkoutProfile'
import { fitState } from '@/storefront/fitment'
import type { FitmentProduct, Vehicle } from '@/storefront/fitment'
import { NORTHFOLD_CHROME } from '@/storefront/northfoldDemo'
import { formatStorePrice } from '@/storefront/price'
import { storefrontThemeVars } from '@/storefront/themeSections'
import { TORQLINE_CHROME } from '@/storefront/torqlineDemo'
import { roundForDisplay } from '@/subscriptions/plans'
import { announce } from './storefrontAnnouncer'
import { STOREFRONT } from './storefrontContext'
import type { StorefrontContext } from './storefrontContext'
import { northfold } from './storefrontStoryFixtures'

// The product-list stories (StorefrontProductListing, its card, filters and quick add)
// draw Northfold (demo) as its shoppers see it: its own seeded products and theme, and
// the storefront context StorefrontLayout gives every page, with the parts these
// pieces read (money, links, the store, the announcer). The parts stories draw
// Torqline Auto Parts (demo) the same way, with a vehicle chosen or not.

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
  sellsParts: computed(() => false),
  vehicle: computed(() => null),
  setVehicle: () => {},
  fitOf: () => 'unknown',
  chooseVehicle: () => {},
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

// ── Torqline Auto Parts (demo) ───────────────────────────────────────────────

const TORQLINE = demoStoreFor('torqline')
const TORQLINE_CHANNEL = TORQLINE.homeChannel
const TORQLINE_BASE = `/accounts/2000290/sales_channels/${TORQLINE_CHANNEL.id}/storefront`

/** Torqline as its home channel is seeded, on a fixed day. */
export const torqline = snapshotFor(TORQLINE_CHANNEL, 'torqline', '2026-11-23')

/** Torqline's twenty-one parts, as the store sells them. */
export const torqlineProducts: Product[] = torqline.products.map((p) => ({ ...p, status: p.inventory > 0 ? 'In Stock' : 'Out of Stock' }))

export function torqlinePart(name: string): Product {
  const product = torqlineProducts.find((p) => p.name === name)
  if (!product) throw new Error(`No Torqline part "${name}"`)
  return product
}

/** A collection's parts, in the store's order. */
export function torqlineCollection(title: string): Product[] {
  return torqlineProducts.filter((p) => p.collections.includes(title))
}

/** A vehicle most of the truck parts fit. */
export const F150: Vehicle = { year: 2019, make: 'Ford', model: 'F-150' }
/** A vehicle no brake part fits (the car brakes start with 2016). */
export const CIVIC_2015: Vehicle = { year: 2015, make: 'Honda', model: 'Civic' }

function torqlineContext(vehicle: Vehicle | null): StorefrontContext {
  return {
    ...context,
    channel: computed(() => TORQLINE_CHANNEL),
    theme: computed(() => ({ ...torqline.theme, channelId: TORQLINE_CHANNEL.id, status: 'Published' as const, updatedAt: torqline.theme.publishedAt })),
    chrome: computed(() => TORQLINE_CHROME),
    link: (href: string) => (/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : href === '/' ? TORQLINE_BASE : `${TORQLINE_BASE}${href.startsWith('/') ? '' : '/'}${href}`),
    sizeCharts: computed(() => []),
    sellsParts: computed(() => true),
    vehicle: computed(() => vehicle),
    fitOf: (product: FitmentProduct) => fitState(product, vehicle),
    // The layout's vehicle drawer is not drawn here; the header and product stories show it.
    chooseVehicle: () => announce('The vehicle selector opens here.'),
  } as unknown as StorefrontContext
}

/** Torqline's page around a story: its background, text, fonts and theme variables. */
export function torqlineFrame(width = '480px', padding = '24px'): Decorator {
  const style = {
    ...storefrontThemeVars(torqline.theme.styles),
    boxSizing: 'border-box',
    maxWidth: width,
    padding,
    background: 'var(--sf-bg)',
    color: 'var(--sf-text)',
    fontFamily: 'var(--sf-body-font), system-ui, sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
  }
  return () => ({
    setup: () => ({ style }),
    template: '<div :style="style"><story /></div>',
  })
}

/**
 * Provides Torqline to the story with the shopper's `vehicle` (or none), and starts it
 * on `page` with `query` in the URL (`{ fits: '0' }` turns the fits switch off).
 */
export function torqlineStore(vehicle: Vehicle | null = null, query: Record<string, string> = {}, page = 'collections/brakes'): Decorator {
  return (story) => ({
    components: { story },
    setup() {
      provide(STOREFRONT, torqlineContext(vehicle))
      const ready = ref(false)
      void useRouter().replace({ path: `${TORQLINE_BASE}/${page}`, query }).finally(() => { ready.value = true })
      return { ready }
    },
    template: '<story v-if="ready" />',
  })
}
