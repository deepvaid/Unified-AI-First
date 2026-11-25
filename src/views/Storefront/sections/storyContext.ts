/*
 * P5.5 exemption — the values a story frame paints are a MERCHANT's theme (Northfold's),
 * the content the storefront draws, not Marobase chrome (DESIGN_AUDIT.md P4-8).
 */
import { computed, defineComponent, h, provide } from 'vue'
import type { Decorator } from '@storybook/vue3'
import type { Money } from '@/maropay/money'
import { storefrontOffer } from '@/maropay/storefront'
import { activeCampaign } from '@/storefront/campaigns'
import { checkoutProfile } from '@/storefront/checkoutProfile'
import { formatStorePrice } from '@/storefront/price'
import { fitState, sellsParts as sellsPartsIn } from '@/storefront/fitment'
import type { FitmentProduct, Vehicle } from '@/storefront/fitment'
import { chartFor } from '@/storefront/sizeCharts'
import type { SizedProduct } from '@/storefront/sizeCharts'
import { storefrontThemeVars } from '@/storefront/themeSections'
import type { StoreTheme, ThemeSection } from '@/storefront/themeSections'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useSizeChartsStore } from '@/stores/useSizeCharts'
import { useStoreCampaignsStore } from '@/stores/useStoreCampaigns'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'
import type { StorefrontChrome } from '@/stores/useStorefront'
import { useStorefrontVehicleStore } from '@/stores/useStorefrontVehicle'
import { roundForDisplay } from '@/subscriptions/plans'
import { announce } from '../storefrontAnnouncer'
import { STOREFRONT, storefrontControlVars } from '../storefrontContext'
import { storefrontProducts } from '../storefrontCatalog'

// The storefront's pages read their store from StorefrontLayout's `STOREFRONT` context.
// A story has no layout, so this decorator provides the same context for a seeded store
// (Northfold by default), from the app's own stores, and paints the store's theme
// around the story as the layout does. `header` and `footer` change those sections'
// settings in a copy of the theme, and `chrome` the store's chrome (Lumos's search
// field, tagline, newsletter column and legal links), so a story can show a style
// without touching the store. Story-only: the app never imports it.

type Settings = Record<string, string | number | boolean>

export interface StorefrontStoryOptions {
  channelId?: string
  header?: Settings
  footer?: Settings
  /** Leaves out the store's Merchandise Cloud search (the header's search icon goes). */
  unsearchable?: boolean
  /** Changes the store's chrome for the story: `headerSearch`, `tagline`, `newsletterColumn`, `bottomLinks`, `headerTools`… */
  chrome?: Partial<StorefrontChrome>
}

function withSettings(theme: StoreTheme, kind: string, settings: Settings | undefined): StoreTheme {
  if (!settings) return theme
  const patch = (sections: ThemeSection[]) => sections.map((s) => (s.kind === kind ? { ...s, settings: { ...s.settings, ...settings } } : s))
  return { ...theme, templates: Object.fromEntries(Object.entries(theme.templates).map(([key, sections]) => [key, patch(sections)])) as StoreTheme['templates'] }
}

export function withStorefront(options: StorefrontStoryOptions = {}): Decorator {
  const channelId = options.channelId ?? 'northfold-demo'
  return (story) => ({
    components: {
      story,
      StorefrontFrame: defineComponent({
        setup(_, { slots }) {
          const channels = useSalesChannelsStore()
          const themes = useStoreThemesStore()
          const maropay = useMaropayStore()
          const sizeChartsStore = useSizeChartsStore()
          const found = computed(() => channels.getChannel('2000290', channelId)!)
          const theme = computed(() => {
            const seeded = themes.themeForChannel(channelId)
            return seeded ? withSettings(withSettings(seeded, 'header', options.header), 'footer', options.footer) : undefined
          })
          const formatExact = (amount: Money) => formatStorePrice(amount, found.value.webStore?.locale)
          const sizeCharts = computed(() => sizeChartsStore.chartsForChannel(channelId))
          // An auto-parts store's vehicle, as the layout keeps it.
          const sellsParts = computed(() => theme.value?.styles.drawing === 'sections' && sellsPartsIn(storefrontProducts(useCommerceStore().products, channelId)))
          const vehicles = useStorefrontVehicleStore()
          const vehicle = computed(() => (sellsParts.value ? vehicles.vehicleFor(channelId) : null))
          const chrome = computed(() => ({ ...useStorefrontStore().chromeFor(found.value), ...options.chrome }))
          provide(STOREFRONT, {
            channel: found,
            theme,
            chrome,
            link: (href: string) => (/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : `/accounts/2000290/sales_channels/${channelId}/storefront${href === '/' ? '' : href.startsWith('/') ? href : `/${href}`}`),
            currency: computed(() => found.value.webStore?.currency ?? 'USD'),
            formatMoney: (amount: Money) => formatStorePrice(roundForDisplay(amount), found.value.webStore?.locale),
            formatExact,
            ownMoneyFormat: computed(() => Boolean(found.value.webStore?.locale)),
            checkout: computed(() => checkoutProfile(found.value.webStore?.currency)),
            demo: computed(() => found.value.webStore?.demo === true),
            searchable: computed(() => !options.unsearchable),
            campaignMessage: computed(() => activeCampaign(useStoreCampaignsStore().campaigns, channelId)?.offer?.message.trim() ?? ''),
            offerFor: (amount: Money) => storefrontOffer(maropay.state, channelId, amount, { format: formatExact }),
            sectionsDrawing: computed(() => theme.value?.styles.drawing === 'sections'),
            sizeCharts,
            sizeChartFor: (product: SizedProduct) => chartFor(product, sizeCharts.value),
            announce,
            sellsParts,
            vehicle,
            setVehicle: (next: Vehicle | null) => vehicles.setVehicle(channelId, next),
            fitOf: (product: FitmentProduct) => fitState(product, vehicle.value),
            chooseVehicle: () => {},
            // As the layout decides it: the sections drawing, with the wishlist among the header's tools.
            wishlist: computed(() => theme.value?.styles.drawing === 'sections' && chrome.value.headerTools.includes('wishlist')),
          })
          const style = computed(() => ({
            // The page's defaults first, so a theme that sets its own width and gutter (Lumos) keeps them.
            '--sf-gutter': '24px',
            '--sf-measure': '1200px',
            ...storefrontThemeVars(theme.value?.styles),
            ...storefrontControlVars(theme.value?.styles),
            background: 'var(--sf-bg)',
            color: 'var(--sf-text)',
            fontFamily: 'var(--sf-body-font), system-ui, sans-serif',
            fontSize: '16px',
            lineHeight: '24px',
          }))
          return () => h('div', { style: style.value }, slots.default?.())
        },
      }),
    },
    template: '<StorefrontFrame><story /></StorefrontFrame>',
  })
}
