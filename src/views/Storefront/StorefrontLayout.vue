<script setup lang="ts">
import { computed, provide, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useSizeChartsStore } from '@/stores/useSizeCharts'
import { useStoreCampaignsStore } from '@/stores/useStoreCampaigns'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'
import type { Money } from '@/maropay/money'
import { storefrontOffer } from '@/maropay/storefront'
import { activeCampaign } from '@/storefront/campaigns'
import { storesWithOwnCatalogue } from '@/storefront/catalog'
import { merchandisingStatus } from '@/utils/merchandisingChannels'
import { checkoutProfile } from '@/storefront/checkoutProfile'
import { formatStorePrice } from '@/storefront/price'
import { chartFor } from '@/storefront/sizeCharts'
import type { SizedProduct } from '@/storefront/sizeCharts'
import { roundForDisplay } from '@/subscriptions/plans'
import { storefrontThemeVars } from '@/stores/themeBuilderData'
import MpEmptyState from '@/components/MpEmptyState.vue'
import StorefrontChat from './StorefrontChat.vue'
import StorefrontFooter from './StorefrontFooter.vue'
import StorefrontHeader from './StorefrontHeader.vue'
import { STOREFRONT } from './storefrontContext'
import { announce } from './storefrontAnnouncer'

// A Maropost web store as its shoppers see it — full page, no admin chrome. Opened
// from Themes › Show store and the store editor's View store. It draws the store's
// current theme (colours, fonts, corner radius as CSS custom properties) and the
// header and footer the storefront renders (useStorefront; drawn by StorefrontHeader
// and StorefrontFooter). Neelam-Store's is the
// UAT crawl (docs/rebuild/neelam-store/CRAWL-SUMMARY.md). How the store takes
// payment — methods, express buttons, instalments — is the store's Maropay setup
// (Store › Payments), shared with every page as `offerFor`. Checkout gets a
// distraction-free header (logo only) and no footer, as hosted checkouts do.

const route = useRoute()
const salesChannels = useSalesChannelsStore()
const themes = useStoreThemesStore()
const storefronts = useStorefrontStore()
const maropay = useMaropayStore()

const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const channelId = computed(() => String(route.params.channelId ?? ''))
const found = computed(() => {
  const channel = salesChannels.getChannel(accountId.value, channelId.value)
  return channel?.type === 'web_store' ? channel : undefined
})

const base = computed(() => `/accounts/${accountId.value}/sales_channels/${channelId.value}/storefront`)

function link(href: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href
  if (href === '/') return base.value
  // A relative href without a leading slash resolves from the storefront root, as it does from the real home page.
  return href.startsWith('/') ? `${base.value}${href}` : `${base.value}/${href}`
}

const channel = computed(() => found.value!)
const theme = computed(() => (found.value ? themes.themeForChannel(found.value.id) : undefined))
const chrome = computed(() => storefronts.chromeFor(channel.value))
const currency = computed(() => found.value?.webStore?.currency ?? maropay.account?.currency ?? 'USD')
// Kronor are shown whole ("586 kr" for 585,90): only the display is rounded, the order keeps the exact amount.
const formatMoney = (amount: Money) => formatStorePrice(roundForDisplay(amount), found.value?.webStore?.locale)
// What is charged is never rounded: the checkout, the pay button and the receipt read "585,90 kr".
const formatExact = (amount: Money) => formatStorePrice(amount, found.value?.webStore?.locale)
const ownMoneyFormat = computed(() => Boolean(found.value?.webStore?.locale))
const checkout = computed(() => checkoutProfile(found.value?.webStore?.currency))
const demo = computed(() => found.value?.webStore?.demo === true)

function offerFor(amount: Money) {
  return storefrontOffer(maropay.state, channelId.value, amount, { format: formatExact })
}

// A running campaign's message takes the store's announcement bar for as long as it runs.
const campaignMessage = computed(() => activeCampaign(useStoreCampaignsStore().campaigns, channelId.value)?.offer?.message.trim() ?? '')

// Search is Merchandise Cloud's: a store has it once it is connected. It runs on the store's own
// products, so a store on the shared catalogue keeps the header it had.
const searchable = computed(() => !!found.value
  && merchandisingStatus(found.value) === 'connected'
  && storesWithOwnCatalogue(useCommerceStore().products).includes(found.value.id))

// The richer theme drawing (Northfold, Torqline) and what its pieces read: the store's size charts.
const sectionsDrawing = computed(() => theme.value?.styles.drawing === 'sections')
const sizeChartsStore = useSizeChartsStore()
const sizeCharts = computed(() => sizeChartsStore.chartsForChannel(channelId.value))
const sizeChartFor = (product: SizedProduct) => chartFor(product, sizeCharts.value)

provide(STOREFRONT, {
  channel, theme, chrome, link, currency, formatMoney, formatExact, ownMoneyFormat, checkout, demo, searchable, campaignMessage, offerFor,
  sectionsDrawing, sizeCharts, sizeChartFor, announce,
})

// A store shown to prospects names itself in the browser tab, where the router's fallback reads "Storefront home · Maropost".
watch(() => [route.fullPath, demo.value], () => {
  if (demo.value) document.title = chrome.value.wordmark
}, { immediate: true, flush: 'post' })

const minimal = computed(() => route.meta.minimalChrome === true)

// The store's chatbot, on its pages. Only a store shown to prospects has the widget so far; other
// stores keep their chatbot in the admin alone. It stays off the checkout, which is distraction-free.
const chatbots = useChatbotStore()
const chatbot = computed(() => {
  const linked = demo.value ? chatbots.getByChannel(channelId.value) : undefined
  return linked?.status === 'Active' ? linked : undefined
})
const themeVars = computed(() => storefrontThemeVars(theme.value?.styles))
</script>

<template>
  <div v-if="found" class="storefront sf-surface" :class="{ 'sf-surface--sections': sectionsDrawing }" :style="themeVars">
    <!-- The sections drawing's own skip link, in the theme's button colours; it stands in for the app's (same target). -->
    <a v-if="sectionsDrawing" href="#main-content" class="sf-skip">Skip to main content</a>
    <StorefrontHeader />

    <div class="sf-body">
      <RouterView />
    </div>

    <StorefrontFooter />

    <!-- Hidden, not removed, on the checkout: the conversation is still there when the shopper comes back. -->
    <StorefrontChat v-if="chatbot" v-show="!minimal" :chatbot="chatbot" />
  </div>

  <MpEmptyState
    v-else
    icon="store"
    title="Storefront not found"
    description="This sales channel doesn’t exist or isn’t a web store."
    :heading-level="1"
  />
</template>

<style scoped src="./storefront-surface.css"></style>
<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
 * P4-8 — DELIBERATELY OUT OF SYSTEM, like StorefrontPreview. This is a
 * merchant's storefront as their theme draws it, not
 * Marobase chrome: colours, fonts and radius come from the store's theme
 * (--sf-*), and the fixed sizes below are Aurora's, measured on Neelam-Store.
 * It never follows the app's dark mode. The header and footer, and their rules,
 * are StorefrontHeader's and StorefrontFooter's.
 * ───────────────────────────────────────────────────────────────────────────── */
.storefront {
  --sf-search-border: #9e9e9e;
  --sf-gutter: 24px;
  --sf-measure: 1200px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.storefront a {
  color: inherit;
  text-decoration: none;
}

.storefront a:hover {
  text-decoration: underline;
}

/* Body */
.sf-body {
  flex: 1;
}

/* The sections drawing's skip link: the theme's text on its page colour, framed in the
   text colour so it stands out on a dark announcement bar and on the light header alike;
   square as the theme draws its buttons, fully in view when focused. The app's own
   (App.vue) stays as it is everywhere else and steps aside only while this one is here. */
.sf-skip {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 40;
  padding: 10px 16px;
  border: 2px solid var(--sf-text, #121011);
  border-radius: var(--sf-button-radius, var(--sf-corner, 0px));
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011) !important;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-decoration: none !important;
  transform: translateY(calc(-100% - 16px));
}

.sf-skip:focus {
  transform: none;
  outline: 2px solid var(--sf-bg, #ffffff);
  outline-offset: 0;
}

:global(.v-application:has(.sf-skip) .skip-link) {
  display: none;
}
</style>
