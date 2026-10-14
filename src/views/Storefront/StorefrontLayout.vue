<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMaropayStore } from '@/stores/useMaropay'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { useStorefrontStore } from '@/stores/useStorefront'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { money } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { storefrontOffer } from '@/maropay/storefront'
import { storefrontThemeVars } from '@/stores/themeBuilderData'
import MpEmptyState from '@/components/MpEmptyState.vue'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontPayMark from './StorefrontPayMark.vue'
import { STOREFRONT } from './storefrontContext'

// A Maropost web store as its shoppers see it — full page, no admin chrome. Opened
// from Themes › Show store and the store editor's View store. It draws the store's
// current theme (colours, fonts, corner radius as CSS custom properties) and the
// header and footer the storefront renders (useStorefront). Neelam-Store's is the
// UAT crawl (docs/rebuild/neelam-store/CRAWL-SUMMARY.md). How the store takes
// payment — methods, express buttons, instalments — is the store's Maropay setup
// (Store › Payments), shared with every page as `offerFor`. Checkout gets a
// distraction-free header (logo only) and no footer, as hosted checkouts do.

const route = useRoute()
const router = useRouter()
const salesChannels = useSalesChannelsStore()
const themes = useStoreThemesStore()
const storefronts = useStorefrontStore()
const maropay = useMaropayStore()
const cart = useStorefrontCartStore()

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
const currency = computed(() => maropay.account?.currency ?? 'USD')

function offerFor(amount: Money) {
  return storefrontOffer(maropay.state, channelId.value, amount)
}

provide(STOREFRONT, { channel, theme, chrome, link, currency, offerFor })

const minimal = computed(() => route.meta.minimalChrome === true)
const cartCount = computed(() => (found.value ? cart.count(found.value.id) : 0))
const footerMarks = computed(() => offerFor(money(0, currency.value)).acceptedMarks)

const themeVars = computed(() => storefrontThemeVars(theme.value?.styles))

// ── Header ──────────────────────────────────────────────────────────────
const menuOpen = ref(false)
watch(() => route.fullPath, () => { menuOpen.value = false })

const query = ref('')
function search(): void {
  const q = query.value.trim()
  if (!q) return
  void router.push(link(`/search?q=${encodeURIComponent(q)}`))
}

// ── Newsletter ──────────────────────────────────────────────────────────
const email = ref('')
const consent = ref(false)
const subscribing = ref(false)
const canSubscribe = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) && consent.value && !subscribing.value)

function subscribe(): void {
  if (!canSubscribe.value) return
  subscribing.value = true
  window.setTimeout(() => {
    subscribing.value = false
    email.value = ''
    consent.value = false
  }, 600)
}
</script>

<template>
  <div v-if="found" class="storefront sf-surface" :style="themeVars">
    <header v-if="minimal" class="sf-top sf-top--minimal">
      <StorefrontAnchor href="/" class="sf-logo" aria-label="Logo">
        <v-icon v-if="chrome.wordmarkIcon" size="28">{{ chrome.wordmarkIcon }}</v-icon>
        <span>{{ chrome.wordmark }}</span>
      </StorefrontAnchor>
      <span class="sf-top__secure"><v-icon size="16">lock</v-icon> Secure checkout</span>
    </header>

    <header v-else class="sf-top">
      <div class="sf-top__row">
        <button type="button" class="sf-icon-btn sf-top__menu" aria-label="menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
          <v-icon size="22">{{ menuOpen ? 'x' : 'menu' }}</v-icon>
        </button>

        <ul v-if="chrome.social.length" class="sf-social" aria-label="Social links">
          <li v-for="item in chrome.social" :key="item.label">
            <StorefrontAnchor :href="item.href" class="sf-icon-btn" :aria-label="item.label">
              <v-icon size="18">{{ item.icon }}</v-icon>
            </StorefrontAnchor>
          </li>
        </ul>

        <StorefrontAnchor href="/" class="sf-logo" aria-label="Logo">
          <v-icon v-if="chrome.wordmarkIcon" size="28">{{ chrome.wordmarkIcon }}</v-icon>
          <span>{{ chrome.wordmark }}</span>
        </StorefrontAnchor>

        <div class="sf-tools">
          <form class="sf-search" role="search" @submit.prevent="search">
            <input v-model="query" type="search" :placeholder="chrome.searchPlaceholder" :aria-label="chrome.searchPlaceholder">
            <button type="submit" class="sf-search__go" aria-label="Search">
              <v-icon size="16">search</v-icon>
            </button>
          </form>
          <StorefrontAnchor href="/user/login" class="sf-icon-btn" aria-label="Account">
            <v-icon size="20">user-round</v-icon>
          </StorefrontAnchor>
          <StorefrontAnchor href="/wishlist-page" class="sf-icon-btn" aria-label="Wishlist">
            <v-icon size="20">heart</v-icon>
          </StorefrontAnchor>
          <StorefrontAnchor href="/cart-page" class="sf-icon-btn sf-cart-link" :aria-label="cartCount ? `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Cart'">
            <v-icon size="20">shopping-cart</v-icon>
            <span v-if="cartCount" class="sf-cart-link__count" aria-hidden="true">{{ cartCount > 99 ? '99+' : cartCount }}</span>
          </StorefrontAnchor>
        </div>
      </div>

      <nav v-if="chrome.nav.length" class="sf-nav" aria-label="Main">
        <StorefrontAnchor v-for="item in chrome.nav" :key="item.label" :href="item.href">{{ item.label }}</StorefrontAnchor>
      </nav>

      <nav v-if="menuOpen && chrome.mobileNav.length" class="sf-mobile-nav" aria-label="Menu">
        <StorefrontAnchor v-for="item in chrome.mobileNav" :key="item.label" :href="item.href">{{ item.label }}</StorefrontAnchor>
      </nav>
    </header>

    <div class="sf-body">
      <RouterView />
    </div>

    <footer v-if="!minimal && (chrome.footerColumns.length || chrome.newsletter || chrome.copyright || footerMarks.length)" class="sf-foot">
      <div v-if="chrome.footerColumns.length || chrome.newsletter" class="sf-foot__grid">
        <div v-for="column in chrome.footerColumns" :key="column.heading.label" class="sf-foot__col">
          <StorefrontAnchor :href="column.heading.href" class="sf-foot__heading">{{ column.heading.label }}</StorefrontAnchor>
          <ul>
            <li v-for="item in column.items" :key="item.label">
              <StorefrontAnchor :href="item.href">{{ item.label }}</StorefrontAnchor>
            </li>
          </ul>
        </div>

        <form v-if="chrome.newsletter" class="sf-foot__col sf-newsletter" novalidate @submit.prevent="subscribe">
          <p class="sf-foot__heading">{{ chrome.newsletter.heading }}</p>
          <input v-model="email" type="email" required :placeholder="chrome.newsletter.placeholder" :aria-label="chrome.newsletter.placeholder" class="sf-input">
          <label class="sf-newsletter__consent">
            <input v-model="consent" type="checkbox">
            <span>
              <template v-for="(part, index) in chrome.newsletter.consent" :key="index">
                <template v-if="typeof part === 'string'">{{ part }}</template>
                <StorefrontAnchor v-else :href="part.href">{{ part.label }}</StorefrontAnchor>
              </template>
            </span>
          </label>
          <button type="submit" class="sf-button" :disabled="!canSubscribe">
            {{ subscribing ? chrome.newsletter.busy : chrome.newsletter.button }}
          </button>
        </form>
      </div>
      <ul v-if="footerMarks.length" class="sf-foot__marks" aria-label="Ways to pay">
        <li v-for="mark in footerMarks" :key="mark"><StorefrontPayMark :mark="mark" /></li>
      </ul>
      <p v-if="chrome.copyright" class="sf-foot__copyright">{{ chrome.copyright }}</p>
    </footer>
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
 * It never follows the app's dark mode.
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

.sf-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

/* Header */
.sf-top {
  border-bottom: 1px solid var(--sf-divider);
}

.sf-top--minimal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--sf-measure);
  margin: 0 auto;
  padding: 20px var(--sf-gutter);
  border-bottom: 0;
}

.sf-top__secure {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.sf-cart-link {
  position: relative;
}

.sf-cart-link__count {
  position: absolute;
  top: 0;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--sf-brand, #373842);
  color: var(--sf-bg, #ffffff);
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.sf-top__row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  max-width: var(--sf-measure);
  margin: 0 auto;
  padding: 20px var(--sf-gutter) 12px;
}

.sf-top__menu {
  display: none;
}

.sf-social {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: 1px;
  white-space: nowrap;
}

.sf-logo:hover {
  text-decoration: none !important;
}

.sf-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.sf-search {
  display: flex;
  align-items: center;
  height: 39px;
  padding: 0 6px 0 16px;
  border: 1px solid var(--sf-search-border);
  border-radius: 999px;
  margin-right: 8px;
}

.sf-search input {
  width: 180px;
  border: 0;
  outline: none;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 14px;
}

.sf-search__go {
  display: inline-flex;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

.sf-nav {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 0 var(--sf-gutter) 16px;
  font-size: 15px;
  font-weight: 500;
}

.sf-mobile-nav {
  display: none;
}

/* Body */
.sf-body {
  flex: 1;
}

/* Footer */
.sf-foot {
  border-top: 1px solid var(--sf-divider);
  margin-top: 48px;
}

.sf-foot__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 1.4fr;
  gap: 32px;
  max-width: var(--sf-measure);
  margin: 0 auto;
  padding: 40px var(--sf-gutter);
}

.sf-foot__col ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.sf-foot__heading {
  display: inline-block;
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.sf-newsletter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sf-input {
  height: 50px;
  padding: 0 14px;
  border: 1px solid var(--sf-divider);
  border-radius: 4px;
  background: var(--sf-bg, var(--sf-bg-fallback));
  color: inherit;
  font: inherit;
}

.sf-newsletter__consent {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 18px;
}

.sf-newsletter__consent a {
  text-decoration: underline;
}

.sf-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  padding: 0 24px;
  border: 0;
  border-radius: var(--sf-radius, 6px);
  background: var(--sf-brand, var(--sf-text-fallback));
  color: var(--sf-bg, var(--sf-bg-fallback));
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.sf-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-foot__marks {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: var(--sf-measure);
  margin: 0 auto;
  padding: 0 var(--sf-gutter) 24px;
  list-style: none;
}

.sf-foot__copyright {
  margin: 0;
  padding: 16px var(--sf-gutter) 24px;
  border-top: 1px solid var(--sf-divider);
  text-align: center;
  font-size: 13px;
}

@media (max-width: 900px) {
  .sf-top__row {
    grid-template-columns: auto 1fr auto;
  }

  .sf-top__menu {
    display: inline-flex;
  }

  .sf-social,
  .sf-search,
  .sf-nav {
    display: none;
  }

  .sf-logo {
    justify-self: center;
  }

  .sf-mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px var(--sf-gutter) 16px;
    font-weight: 500;
  }

  .sf-foot__grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
