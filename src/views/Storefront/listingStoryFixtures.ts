/*
 * P5.5 exemption — the stores drawn here are a MERCHANT's (Northfold's, Torqline's, Lumos's, Vitaheal's, Aurora's),
 * the content the storefront draws, not Marobase chrome. Same line Phase 4 drew for the
 * storefront (DESIGN_AUDIT.md P4-8).
 */
import { computed, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Decorator } from '@storybook/vue3'
import type { Money } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { AURORA_THEME_STYLES } from '@/storefront/auroraDemo'
import { demoStoreFor } from '@/storefront/demoStores'
import { contextFor, snapshotFor } from '@/storefront/demoStores/install'
import { LUMOS_BLUEPRINT } from '@/storefront/demoStores/lumos'
import { VITAHEAL_BLUEPRINT } from '@/storefront/demoStores/vitaheal'
import { checkoutProfile } from '@/storefront/checkoutProfile'
import { fitState } from '@/storefront/fitment'
import type { FitmentProduct, Vehicle } from '@/storefront/fitment'
import { NORTHFOLD_CHROME } from '@/storefront/northfoldDemo'
import { formatStorePrice } from '@/storefront/price'
import { storefrontThemeVars } from '@/storefront/themeSections'
import { TORQLINE_CHROME } from '@/storefront/torqlineDemo'
import { roundForDisplay } from '@/subscriptions/plans'
import { announce } from './storefrontAnnouncer'
import { STOREFRONT, storefrontControlVars } from './storefrontContext'
import type { StorefrontContext } from './storefrontContext'
import { northfold } from './storefrontStoryFixtures'

// The product-list stories (StorefrontProductListing, its card, filters and quick add)
// draw Northfold (demo) as its shoppers see it: its own seeded products and theme, and
// the storefront context StorefrontLayout gives every page, with the parts these
// pieces read (money, links, the store, the announcer). The parts stories draw
// Torqline Auto Parts (demo) the same way, with a vehicle chosen or not, and the
// Boxed card and wishlist stories draw Lumos Home (demo), whose theme has a wishlist.
// The subscription stories draw Vitaheal (demo): Boxed cards, in US dollars, with its plans
// (the subscriptions store seeds them for its channel, as the app does).
// The Framed card stories draw Northfold's products in Aurora's look (auroraFrame).

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
  wishlist: computed(() => false),
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

// ── Lumos Home (demo) ────────────────────────────────────────────────────────

const LUMOS_CHANNEL = LUMOS_BLUEPRINT.homeChannel
/** Lumos's channel, for a story that saves to its wishlist. */
export const LUMOS_STORY_CHANNEL = LUMOS_CHANNEL.id
const LUMOS_BASE = `/accounts/2000290/sales_channels/${LUMOS_CHANNEL.id}/storefront`

/** Lumos as its home channel is seeded, on a fixed day, built from its blueprint. */
export const lumos = LUMOS_BLUEPRINT.build(contextFor(LUMOS_BLUEPRINT, LUMOS_CHANNEL, '2026-11-24'))

/** Lumos's twenty pieces, as the store sells them. */
export const lumosProducts: Product[] = lumos.products.map((p) => ({ ...p, status: p.inventory > 0 ? 'In Stock' : 'Out of Stock' }))

export function lumosProduct(name: string): Product {
  const product = lumosProducts.find((p) => p.name === name)
  if (!product) throw new Error(`No Lumos product "${name}"`)
  return product
}

/** A collection's pieces, in the store's order. */
export function lumosCollection(title: string): Product[] {
  return lumosProducts.filter((p) => p.collections.includes(title))
}

/** Lumos's storefront: its own theme and chrome, Boxed cards and the wishlist. */
const lumosContext = {
  ...context,
  channel: computed(() => LUMOS_CHANNEL),
  theme: computed(() => ({ ...lumos.theme, channelId: LUMOS_CHANNEL.id, status: 'Published' as const, updatedAt: lumos.theme.publishedAt })),
  chrome: computed(() => lumos.chrome),
  link: (href: string) => (/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : href === '/' ? LUMOS_BASE : `${LUMOS_BASE}${href.startsWith('/') ? '' : '/'}${href}`),
  sizeCharts: computed(() => []),
  wishlist: computed(() => true),
} as unknown as StorefrontContext

/** Lumos's page around a story: its theme's colours, fonts, corners and controls, as StorefrontLayout gives them. */
export function lumosFrame(width = '300px', padding = '24px'): Decorator {
  const style = {
    ...storefrontThemeVars(lumos.theme.styles),
    ...storefrontControlVars(lumos.theme.styles),
    '--sf-gutter': '24px',
    '--sf-measure': '1200px',
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
 * Provides Lumos to the story, and starts it on `page` (a collection by default). Its
 * wishlist is the app's, kept in this browser: pair it with `isolateStorage`.
 */
export function lumosStore(query: Record<string, string> = {}, page = 'collections/living-room'): Decorator {
  return (story) => ({
    components: { story },
    setup() {
      provide(STOREFRONT, lumosContext)
      const ready = ref(false)
      void useRouter().replace({ path: `${LUMOS_BASE}/${page}`, query }).finally(() => { ready.value = true })
      return { ready }
    },
    template: '<story v-if="ready" />',
  })
}

// ── Vitaheal (demo) ──────────────────────────────────────────────────────────

const VITAHEAL_CHANNEL = VITAHEAL_BLUEPRINT.homeChannel
const VITAHEAL_BASE = `/accounts/2000290/sales_channels/${VITAHEAL_CHANNEL.id}/storefront`
const VITAHEAL_LOCALE = VITAHEAL_CHANNEL.webStore?.locale

/** Vitaheal as its home channel is seeded, on a fixed day, built from its blueprint. */
export const vitaheal = VITAHEAL_BLUEPRINT.build(contextFor(VITAHEAL_BLUEPRINT, VITAHEAL_CHANNEL, '2026-11-25'))

/** Vitaheal's sixteen supplements, as the store sells them. */
export const vitahealShelf: Product[] = vitaheal.products.map((p) => ({ ...p, status: p.inventory > 0 ? 'In Stock' : 'Out of Stock' }))

export function vitahealProduct(name: string): Product {
  const product = vitahealShelf.find((p) => p.name === name)
  if (!product) throw new Error(`No Vitaheal product "${name}"`)
  return product
}

/** Vitaheal's storefront: its own theme and chrome, in its own currency (US dollars), no wishlist. */
const vitahealContext = {
  ...context,
  channel: computed(() => VITAHEAL_CHANNEL),
  theme: computed(() => ({ ...vitaheal.theme, channelId: VITAHEAL_CHANNEL.id, status: 'Published' as const, updatedAt: vitaheal.theme.publishedAt })),
  chrome: computed(() => vitaheal.chrome),
  link: (href: string) => (/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : href === '/' ? VITAHEAL_BASE : `${VITAHEAL_BASE}${href.startsWith('/') ? '' : '/'}${href}`),
  currency: computed(() => VITAHEAL_CHANNEL.webStore!.currency!),
  formatMoney: (amount: Money) => formatStorePrice(roundForDisplay(amount), VITAHEAL_LOCALE),
  formatExact: (amount: Money) => formatStorePrice(amount, VITAHEAL_LOCALE),
  ownMoneyFormat: computed(() => Boolean(VITAHEAL_LOCALE)),
  checkout: computed(() => checkoutProfile(VITAHEAL_CHANNEL.webStore!.currency)),
  sizeCharts: computed(() => []),
  wishlist: computed(() => false),
} as unknown as StorefrontContext

/** Vitaheal's page around a story: its theme's colours, fonts, corners and controls, as StorefrontLayout gives them. */
export function vitahealFrame(width = '300px', padding = '24px'): Decorator {
  const style = {
    ...storefrontThemeVars(vitaheal.theme.styles),
    ...storefrontControlVars(vitaheal.theme.styles),
    '--sf-gutter': '24px',
    '--sf-measure': '1200px',
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
 * Provides Vitaheal to the story, and starts it on `page` (the Subscription collection by
 * default). Its cart is the app's, kept in this browser: pair it with `isolateStorage`.
 */
export function vitahealStore(query: Record<string, string> = {}, page = 'collections/subscription'): Decorator {
  return (story) => ({
    components: { story },
    setup() {
      provide(STOREFRONT, vitahealContext)
      const ready = ref(false)
      void useRouter().replace({ path: `${VITAHEAL_BASE}/${page}`, query }).finally(() => { ready.value = true })
      return { ready }
    },
    template: '<story v-if="ready" />',
  })
}

// ── Aurora's look ────────────────────────────────────────────────────────────

/** Aurora's page as a style (its theme's colours, fonts, corners and controls): the one frame its stories draw in. */
export const AURORA_PAGE_STYLE = {
  ...storefrontThemeVars(AURORA_THEME_STYLES),
  ...storefrontControlVars(AURORA_THEME_STYLES),
  background: 'var(--sf-bg)',
  color: 'var(--sf-text)',
  fontFamily: 'var(--sf-body-font), system-ui, sans-serif',
}

/** Aurora's page around a story (AURORA_PAGE_STYLE), for Northfold's products in Framed cards. */
export function auroraFrame(width = '340px', padding = '24px'): Decorator {
  const style = {
    ...AURORA_PAGE_STYLE,
    '--sf-gutter': '24px',
    '--sf-measure': '1200px',
    boxSizing: 'border-box',
    maxWidth: width,
    padding,
    fontSize: '16px',
    lineHeight: '24px',
  }
  return () => ({
    setup: () => ({ style }),
    template: '<div :style="style"><story /></div>',
  })
}
