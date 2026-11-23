import { computed, provide } from 'vue'
import type { Decorator } from '@storybook/vue3'
import { money } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { StorefrontOffer } from '@/maropay/storefront'
import { demoStoreFor } from '@/storefront/demoStores'
import { formatStorePrice } from '@/storefront/price'
import { chartFor } from '@/storefront/sizeCharts'
import type { StoreTheme } from '@/storefront/themeSections'
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
