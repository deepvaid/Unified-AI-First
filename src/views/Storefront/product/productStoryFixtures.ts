import { computed, provide, ref } from 'vue'
import type { Decorator } from '@storybook/vue3'
import { money } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { StorefrontOffer } from '@/maropay/storefront'
import { demoStoreFor } from '@/storefront/demoStores'
import { snapshotFor } from '@/storefront/demoStores/install'
import { fitState } from '@/storefront/fitment'
import type { Vehicle } from '@/storefront/fitment'
import { formatStorePrice } from '@/storefront/price'
import { chartFor } from '@/storefront/sizeCharts'
import { storefrontThemeVars } from '@/storefront/themeSections'
import type { StoreTheme } from '@/storefront/themeSections'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { roundForDisplay } from '@/subscriptions/plans'
import { STOREFRONT } from '../storefrontContext'
import type { StorefrontContext } from '../storefrontContext'
import { announce } from '../storefrontAnnouncer'
import { northfold } from '../storefrontStoryFixtures'

// What StorefrontLayout gives the pages of Northfold (demo), for the product page
// stories: its channel, theme, size charts and money, from the store's seed. Payment
// is the store's cards and wallets, without instalments.

const NORTHFOLD = demoStoreFor('northfold')

const theme: StoreTheme = {
  id: northfold.theme.id,
  channelId: NORTHFOLD.homeChannel.id,
  name: northfold.theme.name,
  status: 'Published',
  publishedAt: northfold.theme.publishedAt,
  updatedAt: northfold.theme.publishedAt,
  styles: northfold.theme.styles,
  templates: northfold.theme.templates,
}

function offerFor(amount: Money): StorefrontOffer {
  return {
    maropayLive: false,
    cardsVia: null,
    providers: [],
    methods: [],
    defaultMethodId: null,
    express: [],
    payIn4: { labels: [], amount: money(0, amount.currency) },
    monthly: { labels: [], amount: money(0, amount.currency) },
    acceptedMarks: ['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'],
    payButton: 'pay',
  }
}

/** Northfold's storefront context, as its layout provides it. Links stay as written. */
export function northfoldContext(): StorefrontContext {
  const format = (amount: Money) => formatStorePrice(amount)
  return {
    channel: computed(() => NORTHFOLD.homeChannel),
    theme: computed(() => theme),
    chrome: computed(() => northfold.chrome),
    link: (href) => href,
    currency: computed(() => 'USD'),
    formatMoney: format,
    formatExact: format,
    ownMoneyFormat: computed(() => false),
    checkout: computed(() => northfold.checkout),
    demo: computed(() => true),
    searchable: computed(() => true),
    campaignMessage: computed(() => ''),
    offerFor,
    sectionsDrawing: computed(() => true),
    sizeCharts: computed(() => northfold.sizeCharts),
    sizeChartFor: (product) => chartFor(product, northfold.sizeCharts),
    announce,
    sellsParts: computed(() => false),
    vehicle: computed(() => null),
    setVehicle: () => {},
    fitOf: () => 'unknown',
    chooseVehicle: () => {},
    wishlist: computed(() => false),
  }
}

/** Provides Northfold's storefront context to the story, as StorefrontLayout does for its pages. */
export const provideNorthfold: Decorator = () => ({
  setup() {
    provide(STOREFRONT, northfoldContext())
    return {}
  },
  template: '<story />',
})

// ── Torqline Auto Parts (demo) ───────────────────────────────────────────────
// The auto-parts store, for the stories of its vehicle selector, fit banner, vehicle
// finder and product page. The shopper's vehicle is the story's own (a ref), so a
// story never writes the tab's session storage, and Select vehicle sets
// `vehicleDrawerOpen` for a story that mounts the drawer.

const TORQLINE = demoStoreFor('torqline')

/** Torqline as its home channel is seeded, on a fixed day. */
export const torqline = snapshotFor(TORQLINE.homeChannel, 'torqline', '2026-11-20')

export function torqlineProduct(name: string) {
  const product = torqline.products.find((p) => p.name === name)
  if (!product) throw new Error(`No Torqline product "${name}"`)
  return product
}

const torqlineTheme: StoreTheme = {
  id: torqline.theme.id,
  channelId: TORQLINE.homeChannel.id,
  name: torqline.theme.name,
  status: 'Published',
  publishedAt: torqline.theme.publishedAt,
  updatedAt: torqline.theme.publishedAt,
  styles: torqline.theme.styles,
  templates: torqline.theme.templates,
}

/** The vehicle drawer a story mounts opens when a banner or chip asks for it. */
export const vehicleDrawerOpen = ref(false)

/** Torqline's storefront context, as its layout provides it, with the shopper's vehicle (none by default). Links stay as written. */
export function torqlineContext(initial: Vehicle | null = null): StorefrontContext {
  const format = (amount: Money) => formatStorePrice(amount)
  const vehicle = ref<Vehicle | null>(initial)
  return {
    channel: computed(() => TORQLINE.homeChannel),
    theme: computed(() => torqlineTheme),
    chrome: computed(() => torqline.chrome),
    link: (href) => href,
    currency: computed(() => 'USD'),
    formatMoney: format,
    formatExact: format,
    ownMoneyFormat: computed(() => false),
    checkout: computed(() => torqline.checkout),
    demo: computed(() => true),
    searchable: computed(() => true),
    campaignMessage: computed(() => ''),
    offerFor,
    sectionsDrawing: computed(() => true),
    sizeCharts: computed(() => []),
    sizeChartFor: () => undefined,
    announce,
    sellsParts: computed(() => true),
    vehicle: computed(() => vehicle.value),
    setVehicle: (next) => { vehicle.value = next },
    fitOf: (product) => fitState(product, vehicle.value),
    chooseVehicle: () => { vehicleDrawerOpen.value = true },
    wishlist: computed(() => false),
  }
}

/** Provides Torqline's storefront context to the story, with the shopper's vehicle when one is given. */
export function provideTorqline(vehicle: Vehicle | null = null): Decorator {
  return () => ({
    setup() {
      vehicleDrawerOpen.value = false
      provide(STOREFRONT, torqlineContext(vehicle))
      return {}
    },
    template: '<story />',
  })
}

// ── Vitaheal (demo) ──────────────────────────────────────────────────────────
// The supplements store on subscription plans, in kronor, for the product page's
// purchase options. Prices read as its pages write them ("399 kr"), what is charged
// to the öre ("585,90 kr").

const VITAHEAL = demoStoreFor('vitaheal')

/** Vitaheal as its home channel is seeded, on a fixed day. */
export const vitaheal = snapshotFor(VITAHEAL.homeChannel, 'vitaheal', '2026-11-20')

export function vitahealProduct(name: string) {
  const product = vitaheal.products.find((p) => p.name === name)
  if (!product) throw new Error(`No Vitaheal product "${name}"`)
  return product
}

const vitahealTheme: StoreTheme = {
  id: vitaheal.theme.id,
  channelId: VITAHEAL.homeChannel.id,
  name: vitaheal.theme.name,
  status: 'Published',
  publishedAt: vitaheal.theme.publishedAt,
  updatedAt: vitaheal.theme.publishedAt,
  styles: vitaheal.theme.styles,
  templates: vitaheal.theme.templates,
}

/** Vitaheal's storefront context, as its layout provides it. Links stay as written. */
export function vitahealContext(): StorefrontContext {
  const { currency, locale } = vitaheal.market
  return {
    channel: computed(() => VITAHEAL.homeChannel),
    theme: computed(() => vitahealTheme),
    chrome: computed(() => vitaheal.chrome),
    link: (href) => href,
    currency: computed(() => currency),
    formatMoney: (amount) => formatStorePrice(roundForDisplay(amount), locale),
    formatExact: (amount) => formatStorePrice(amount, locale),
    ownMoneyFormat: computed(() => true),
    checkout: computed(() => vitaheal.checkout),
    demo: computed(() => true),
    searchable: computed(() => false),
    campaignMessage: computed(() => ''),
    offerFor,
    sectionsDrawing: computed(() => true),
    sizeCharts: computed(() => []),
    sizeChartFor: () => undefined,
    announce,
    sellsParts: computed(() => false),
    vehicle: computed(() => null),
    setVehicle: () => {},
    fitOf: () => 'unknown',
    chooseVehicle: () => {},
    wishlist: computed(() => false),
  }
}

/**
 * Provides Vitaheal's storefront context to the story, with the store's plans as it
 * is seeded (the subscriptions store is the app's; pair it with `isolateStorage`).
 */
export const provideVitaheal: Decorator = () => ({
  setup() {
    const subscriptions = useSubscriptionsStore()
    subscriptions.plans = [...subscriptions.plans.filter((plan) => plan.channelId !== VITAHEAL.homeChannel.id), ...vitaheal.plans]
    provide(STOREFRONT, vitahealContext())
    return {}
  },
  template: '<story />',
})

/** Vitaheal's page around a story: its theme's colours, fonts and corners, as StorefrontLayout gives them. */
export function vitahealFrame(width = '480px', padding = '24px'): Decorator {
  const style = {
    ...storefrontThemeVars(vitaheal.theme.styles),
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

/** Torqline's page around a story: its theme's colours, fonts and corners, as StorefrontLayout gives them. */
export function torqlineFrame(width = '480px', padding = '24px'): Decorator {
  const style = {
    ...storefrontThemeVars(torqline.theme.styles),
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
