<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useStorefrontWishlistStore } from '@/stores/useStorefrontWishlist'
import { vehicleLabel } from '@/storefront/fitment'
import { wishlistLinkLabel } from '@/storefront/wishlist'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontDrawer from './StorefrontDrawer.vue'
import StorefrontMegaPanel from './StorefrontMegaPanel.vue'
import { STOREFRONT } from './storefrontContext'
import { chromeSettings, flag, templateForRoute, text } from './sections/sectionSettings'

// The storefront's announcement bar and header. Two drawings:
// - classic (every theme but the sections drawing's): the markup StorefrontLayout has
//   always drawn, moved here unchanged, so Atlas and Neelam look as before;
// - sections (Vitaheal, Northfold, Torqline, Lumos): the theme's header section decides
//   the menu style (Inline: wordmark and menu in one row; Centered: wordmark over the
//   menu; Minimal: wordmark and a menu button), whether it sticks to the top on a
//   desktop, and a light or dark scheme. Search shows only once the store can search; on
//   a phone, and in the Minimal style, the menu opens in a drawer. The store's chrome can
//   ask for search as a visible field (`headerSearch: 'field'`, Lumos, Vitaheal): in the
//   bar on a wide screen, in a row of its own under the bar where the bar has no room for
//   it (1240px and narrower, and always in the Centered style). A store with a wishlist
//   (Lumos) gets a heart beside the cart, with how many saved products it still sells.
// In both drawings a menu link that carries a `menu` (Vitaheal's "Shop" and "About", Daybloom's
// "Shop" and "Learn") is a button that opens a panel of links under the header, a mega menu
// (StorefrontMegaPanel); in the phone menu, and the sections drawing's drawer, it is a row
// that opens in place.
// The checkout's header (route meta minimalChrome) is the logo and "Secure checkout".

const storefront = inject(STOREFRONT)!
const route = useRoute()
const router = useRouter()
const cart = useStorefrontCartStore()

const chrome = computed(() => storefront.chrome.value)
const searchable = computed(() => storefront.searchable.value)
const sectionsDrawing = computed(() => storefront.sectionsDrawing.value)
const minimal = computed(() => route.meta.minimalChrome === true)
const cartCount = computed(() => cart.count(storefront.channel.value.id))
const cartLabel = computed(() => (cartCount.value ? `Cart, ${cartCount.value} ${cartCount.value === 1 ? 'item' : 'items'}` : 'Cart'))

/** The theme's announcement, for a store that shows it above the header on every page. */
const announcement = computed(() => {
  if (!chrome.value.announcementAboveHeader) return ''
  if (storefront.campaignMessage.value) return storefront.campaignMessage.value
  const bar = storefront.theme.value?.templates.home.find((s) => s.kind === 'announcement-bar' && !s.hidden)
  return typeof bar?.settings.text === 'string' ? bar.settings.text : ''
})

// ── Classic ─────────────────────────────────────────────────────────────
const menuOpen = ref(false)
watch(() => route.fullPath, () => {
  menuOpen.value = false
  closePanel()
})

// The mega menu, in both drawings (one menu is drawn at a time, so one `navEl`): which
// link's panel is open, and whether a press opened it. A panel the pointer opened closes
// when the pointer leaves; one a press opened stays until a press outside it, Escape, a
// link, or the keyboard moving on.
const openPanel = ref<number | null>(null)
const pinned = ref(false)
const navEl = ref<HTMLElement | null>(null)
let leaving: ReturnType<typeof setTimeout> | undefined

function closePanel(): void {
  clearTimeout(leaving)
  openPanel.value = null
  pinned.value = false
}
function onTrigger(index: number): void {
  clearTimeout(leaving)
  if (openPanel.value === index && pinned.value) return closePanel()
  openPanel.value = index
  pinned.value = true
}
function onPointerEnter(index: number): void {
  clearTimeout(leaving)
  if (!pinned.value) openPanel.value = index
}
// A moment's grace, so crossing the gap between the link and its panel does not close it.
function onPointerLeave(): void {
  clearTimeout(leaving)
  if (!pinned.value) leaving = setTimeout(() => { if (!pinned.value) openPanel.value = null }, 160)
}
/** Escape closes the panel and gives the keyboard back to the link that opened it. */
function onNavEscape(): void {
  const index = openPanel.value
  if (index === null) return
  closePanel()
  navEl.value?.querySelector<HTMLElement>(`[aria-controls="sf-mega-${index}"]`)?.focus()
}
/** The keyboard left the link and its panel. */
function onGroupFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget
  if (next instanceof Node && !(event.currentTarget as HTMLElement).contains(next)) closePanel()
}
function onOutsidePress(event: PointerEvent): void {
  if (!(event.target instanceof Node) || !navEl.value?.contains(event.target)) closePanel()
}
watch(openPanel, (index) => {
  if (index === null) document.removeEventListener('pointerdown', onOutsidePress)
  else document.addEventListener('pointerdown', onOutsidePress)
})
onBeforeUnmount(() => {
  clearTimeout(leaving)
  document.removeEventListener('pointerdown', onOutsidePress)
})

const query = ref('')
function search(): void {
  const q = query.value.trim()
  if (!q) return
  void router.push(storefront.link(`/search?q=${encodeURIComponent(q)}`))
  // The results page has its own box with the query in it: the header's starts empty again.
  if (searchable.value) query.value = ''
}

// ── Sections drawing ────────────────────────────────────────────────────
const settings = computed(() => chromeSettings(storefront.theme.value, templateForRoute(route.name), 'header'))
const menuStyle = computed(() => {
  const style = text(settings.value, 'menuStyle', 'Inline')
  return ['Inline', 'Centered', 'Minimal'].includes(style) ? style.toLowerCase() : 'inline'
})
const sticky = computed(() => flag(settings.value, 'sticky'))
const dark = computed(() => text(settings.value, 'colorScheme') === 'Dark')
const hasAccount = computed(() => chrome.value.headerTools.includes('account'))
/** A menu with a mega menu in it: it takes the bar's full height, so the pointer never leaves a link on its way to the panel. */
const hasPanels = computed(() => chrome.value.nav.some((item) => item.menu))

// Search as a visible field (Lumos): two forms on one query, one shown at a time (in the bar
// when it has room, else in a row under it), so the DOM order stays the order the eye reads.
const searchField = computed(() => searchable.value && chrome.value.headerSearch === 'field')

// The wishlist heart, with how many saved products the store still sells.
const wishlist = useStorefrontWishlistStore()
const wishCount = computed(() => (storefront.wishlist.value ? wishlist.count(storefront.channel.value.id) : 0))
const wishLabel = computed(() => wishlistLinkLabel(wishCount.value))

// An auto-parts store's vehicle chip: "Select vehicle", or the vehicle chosen. It opens
// the vehicle drawer (StorefrontLayout's). Beside the tools on a wide screen; narrower,
// where the menu needs the bar, in its own row under it (the full width on a phone).
// Two buttons, one shown at a time, so the DOM order stays the order the eye reads.
const sellsParts = computed(() => storefront.sellsParts.value)
const vehicleText = computed(() => (storefront.vehicle.value ? vehicleLabel(storefront.vehicle.value) : 'Select vehicle'))
const vehicleName = computed(() => (storefront.vehicle.value ? `${vehicleText.value}, change vehicle` : undefined))

/**
 * The drawer's links: the store's phone menu, the shop's own links (those the
 * header's menu has) first and large, then the rest (pages, account, cart).
 */
const drawerLinks = computed(() => {
  const all = chrome.value.mobileNav.length ? chrome.value.mobileNav : chrome.value.nav
  const main = new Set(chrome.value.nav.map((item) => item.href))
  return { main: all.filter((item) => main.has(item.href)), more: all.filter((item) => !main.has(item.href)) }
})

// Search leads to the search page, which puts the shopper in its box on arrival (StorefrontSearch).
// Two ways there need a hand: the icon on that page itself goes nowhere, and the menu drawer gives
// focus back to its button as it closes, after the page has put it in the box.
function focusSearchBox(): void {
  document.querySelector<HTMLInputElement>('[data-sf-search-box]')?.focus()
}
function onSearchIcon(): void {
  if (route.name === 'StorefrontSearch' && !route.query.q) focusSearchBox()
}
let searchChosen = false
function onMenuSearch(): void {
  searchChosen = true
  menuOpen.value = false
}
function onMenuClosed(): void {
  if (searchChosen) focusSearchBox()
  searchChosen = false
}
</script>

<template>
  <!-- ── Sections drawing ──────────────────────────────────────────── -->
  <template v-if="sectionsDrawing && !minimal">
    <p v-if="announcement" class="sfh-announce">{{ announcement }}</p>
    <header class="sfh" :class="[`sfh--${menuStyle}`, { 'sfh--dark': dark, 'sfh--sticky': sticky, 'sfh--search-field': searchField }]">
      <!-- The bar a mega menu's panel hangs from: under the menu row, over the search and vehicle rows. -->
      <div class="sfh__bar">
        <div class="sfh__row">
          <StorefrontAnchor href="/" class="sfh__logo">
            <v-icon v-if="chrome.wordmarkIcon" size="26" aria-hidden="true">{{ chrome.wordmarkIcon }}</v-icon>
            <span>{{ chrome.wordmark }}</span>
          </StorefrontAnchor>

          <!-- One menu for Inline and Centered: Centered puts it in a second row, under the wordmark. -->
          <nav
            v-if="menuStyle !== 'minimal' && chrome.nav.length"
            ref="navEl"
            class="sfh__nav"
            :class="{ 'sfh__nav--panels': hasPanels }"
            aria-label="Main"
            @keydown.esc="onNavEscape"
          >
            <template v-for="(item, index) in chrome.nav" :key="item.label">
              <div
                v-if="item.menu"
                class="sf-nav__group"
                @pointerenter="$event.pointerType === 'mouse' && onPointerEnter(index)"
                @pointerleave="$event.pointerType === 'mouse' && onPointerLeave()"
                @focusout="onGroupFocusOut"
              >
                <button
                  type="button"
                  class="sf-nav__trigger sfh__trigger"
                  :aria-expanded="openPanel === index"
                  :aria-controls="`sf-mega-${index}`"
                  @click="onTrigger(index)"
                >
                  <span class="sfh__link-text">{{ item.label }}</span>
                  <v-icon size="16" aria-hidden="true">chevron-down</v-icon>
                </button>
                <StorefrontMegaPanel :menu="item.menu" :panel-id="`sf-mega-${index}`" :open="openPanel === index" />
              </div>
              <StorefrontAnchor v-else :href="item.href" class="sfh__link">{{ item.label }}</StorefrontAnchor>
            </template>
          </nav>

          <button
            v-if="sellsParts"
            type="button"
            class="sfh__vehicle sfh__vehicle--inline"
            aria-haspopup="dialog"
            :aria-label="vehicleName"
            @click="storefront.chooseVehicle()"
          >
            <v-icon size="18" aria-hidden="true">car-front</v-icon>
            <span class="sfh__vehicle-text">{{ vehicleText }}</span>
            <v-icon size="16" aria-hidden="true">chevron-down</v-icon>
          </button>

          <form v-if="searchField" class="sfh__search sfh__search--bar" role="search" @submit.prevent="search">
            <span class="sfh__field">
              <input
                v-model="query"
                type="search"
                class="sfh__field-input"
                :placeholder="chrome.searchPlaceholder"
                aria-label="Search the store"
                enterkeyhint="search"
                autocomplete="off"
              >
              <button type="submit" class="sfh__field-go" aria-label="Search">
                <v-icon size="20" aria-hidden="true">search</v-icon>
              </button>
            </span>
          </form>

          <div class="sfh__tools">
            <StorefrontAnchor v-if="searchable && !searchField" href="/search" class="sfh__icon" aria-label="Search" @click="onSearchIcon">
              <v-icon size="22" aria-hidden="true">search</v-icon>
            </StorefrontAnchor>
            <StorefrontAnchor v-if="hasAccount" :href="chrome.accountHref ?? '/user/login'" class="sfh__icon sfh__icon--account" aria-label="Account">
              <v-icon size="22" aria-hidden="true">user-round</v-icon>
            </StorefrontAnchor>
            <StorefrontAnchor v-if="storefront.wishlist.value" href="/wishlist" class="sfh__icon sfh__wish" :aria-label="wishLabel">
              <v-icon size="22" aria-hidden="true">heart</v-icon>
              <span v-if="wishCount" class="sfh__count" aria-hidden="true">{{ wishCount > 99 ? '99+' : wishCount }}</span>
            </StorefrontAnchor>
            <StorefrontAnchor href="/cart-page" class="sfh__icon sfh__cart" :aria-label="cartLabel">
              <v-icon size="22" aria-hidden="true">shopping-bag</v-icon>
              <span v-if="cartCount" class="sfh__count" aria-hidden="true">{{ cartCount > 99 ? '99+' : cartCount }}</span>
            </StorefrontAnchor>
            <button
              type="button"
              class="sfh__icon sfh__menu"
              aria-label="Menu"
              aria-haspopup="dialog"
              :aria-expanded="menuOpen"
              @click="menuOpen = true"
            >
              <v-icon size="24" aria-hidden="true">menu</v-icon>
            </button>
          </div>
        </div>
      </div>

      <div v-if="sellsParts" class="sfh__vehicle-row">
        <button type="button" class="sfh__vehicle" aria-haspopup="dialog" :aria-label="vehicleName" @click="storefront.chooseVehicle()">
          <v-icon size="18" aria-hidden="true">car-front</v-icon>
          <span class="sfh__vehicle-text">{{ vehicleText }}</span>
          <v-icon size="16" aria-hidden="true">chevron-down</v-icon>
        </button>
      </div>

      <form v-if="searchField" class="sfh__search sfh__search--row" role="search" @submit.prevent="search">
        <span class="sfh__field">
          <input
            v-model="query"
            type="search"
            class="sfh__field-input"
            :placeholder="chrome.searchPlaceholder"
            aria-label="Search the store"
            enterkeyhint="search"
            autocomplete="off"
          >
          <button type="submit" class="sfh__field-go" aria-label="Search">
            <v-icon size="20" aria-hidden="true">search</v-icon>
          </button>
        </span>
      </form>
    </header>

    <StorefrontDrawer v-model="menuOpen" title="Menu" :phone-sheet="false" close-label="Close menu" @close="onMenuClosed">
      <nav aria-label="Menu" class="sfh-drawer">
        <StorefrontAnchor v-if="searchable && !searchField" href="/search" class="sfh-drawer__search" @click="onMenuSearch">
          <v-icon size="20" aria-hidden="true">search</v-icon>
          Search
        </StorefrontAnchor>
        <ul v-if="drawerLinks.main.length" class="sfh-drawer__main">
          <li v-for="(item, index) in drawerLinks.main" :key="item.label">
            <!-- A link with a panel opens in place: each column's heading and links, one under the other. -->
            <details v-if="item.menu" class="sfh-drawer__group">
              <summary class="sfh-drawer__link sfh-drawer__summary">
                {{ item.label }}
                <v-icon size="24" aria-hidden="true">chevron-down</v-icon>
              </summary>
              <div v-for="(column, c) in item.menu.columns" :key="column.heading" class="sfh-drawer__col">
                <p :id="`sfh-drawer-${index}-${c}`" class="sfh-drawer__heading">{{ column.heading }}</p>
                <ul :aria-labelledby="`sfh-drawer-${index}-${c}`">
                  <li v-for="link in column.links" :key="link.label">
                    <StorefrontAnchor :href="link.href" class="sfh-drawer__link sfh-drawer__link--small">{{ link.label }}</StorefrontAnchor>
                  </li>
                </ul>
              </div>
            </details>
            <StorefrontAnchor v-else :href="item.href" class="sfh-drawer__link">{{ item.label }}</StorefrontAnchor>
          </li>
        </ul>
        <ul v-if="drawerLinks.more.length" class="sfh-drawer__more">
          <li v-for="item in drawerLinks.more" :key="item.label">
            <StorefrontAnchor :href="item.href" class="sfh-drawer__link sfh-drawer__link--small">{{ item.label }}</StorefrontAnchor>
          </li>
        </ul>
      </nav>
    </StorefrontDrawer>
  </template>

  <!-- ── Classic (moved unchanged from StorefrontLayout) ───────────────── -->
  <template v-else>
    <p v-if="announcement && !minimal" class="sf-announce">{{ announcement }}</p>
    <header v-if="minimal" class="sf-top sf-top--minimal" :class="{ 'sf-top--sections': sectionsDrawing }">
      <StorefrontAnchor href="/" class="sf-logo" :aria-label="sectionsDrawing ? undefined : 'Logo'">
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
          <form v-if="chrome.headerTools.includes('search') || searchable" class="sf-search" :class="{ 'sf-search--ring': searchable }" role="search" @submit.prevent="search">
            <input v-model="query" type="search" :placeholder="chrome.searchPlaceholder" :aria-label="chrome.searchPlaceholder">
            <button type="submit" class="sf-search__go" aria-label="Search">
              <v-icon size="16">search</v-icon>
            </button>
          </form>
          <StorefrontAnchor v-if="chrome.headerTools.includes('account')" :href="chrome.accountHref ?? '/user/login'" class="sf-icon-btn" aria-label="Account">
            <v-icon size="20">user-round</v-icon>
          </StorefrontAnchor>
          <StorefrontAnchor v-if="chrome.headerTools.includes('wishlist')" href="/wishlist-page" class="sf-icon-btn" aria-label="Wishlist">
            <v-icon size="20">heart</v-icon>
          </StorefrontAnchor>
          <StorefrontAnchor href="/cart-page" class="sf-icon-btn sf-cart-link" :aria-label="cartCount ? `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Cart'">
            <v-icon size="20">shopping-cart</v-icon>
            <span v-if="cartCount" class="sf-cart-link__count" aria-hidden="true">{{ cartCount > 99 ? '99+' : cartCount }}</span>
          </StorefrontAnchor>
        </div>
      </div>

      <nav v-if="chrome.nav.length" ref="navEl" class="sf-nav" aria-label="Main" @keydown.esc="onNavEscape">
        <template v-for="(item, index) in chrome.nav" :key="item.label">
          <div
            v-if="item.menu"
            class="sf-nav__group"
            @pointerenter="$event.pointerType === 'mouse' && onPointerEnter(index)"
            @pointerleave="$event.pointerType === 'mouse' && onPointerLeave()"
            @focusout="onGroupFocusOut"
          >
            <button
              type="button"
              class="sf-nav__trigger"
              :class="{ 'sf-nav__trigger--open': openPanel === index }"
              :aria-expanded="openPanel === index"
              :aria-controls="`sf-mega-${index}`"
              @click="onTrigger(index)"
            >
              {{ item.label }}
              <v-icon size="16" aria-hidden="true">chevron-down</v-icon>
            </button>
            <StorefrontMegaPanel :menu="item.menu" :panel-id="`sf-mega-${index}`" :open="openPanel === index" />
          </div>
          <StorefrontAnchor v-else :href="item.href">{{ item.label }}</StorefrontAnchor>
        </template>
      </nav>

      <nav v-if="menuOpen && chrome.mobileNav.length" class="sf-mobile-nav" aria-label="Menu">
        <!-- The header's search box does not fit a phone: the menu leads to the search page instead. -->
        <StorefrontAnchor v-if="searchable" href="/search">Search</StorefrontAnchor>
        <template v-for="item in chrome.mobileNav" :key="item.label">
          <!-- A link with a panel opens in place: its columns, one under the other. -->
          <details v-if="item.menu" class="sf-mobile-group">
            <summary>
              {{ item.label }}
              <v-icon size="18" aria-hidden="true">chevron-down</v-icon>
            </summary>
            <div v-for="column in item.menu.columns" :key="column.heading" class="sf-mobile-group__col">
              <p class="sf-mobile-group__heading">{{ column.heading }}</p>
              <StorefrontAnchor v-for="link in column.links" :key="link.label" :href="link.href">{{ link.label }}</StorefrontAnchor>
            </div>
          </details>
          <StorefrontAnchor v-else :href="item.href">{{ item.label }}</StorefrontAnchor>
        </template>
      </nav>
    </header>
  </template>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
 * P4-8 — DELIBERATELY OUT OF SYSTEM, like the rest of the storefront (see
 * StorefrontLayout.vue): colours, fonts and radius come from the store's theme
 * (--sf-*), and every painted surface sets its own text colour. The classic rules
 * are Aurora's, measured on Neelam-Store, and moved here from StorefrontLayout
 * unchanged; the sections drawing's (.sfh*) follow the theme's header settings.
 * ───────────────────────────────────────────────────────────────────────────── */

/* ── Classic ─────────────────────────────────────────────────────────── */
.sf-top a {
  color: inherit;
  text-decoration: none;
}

.sf-top a:hover {
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

.sf-announce {
  margin: 0;
  padding: 8px 24px;
  background: var(--sf-brand, #373842);
  color: var(--sf-on-brand, #ffffff);
  text-align: center;
  font-size: 13px;
  line-height: 18px;
  letter-spacing: 0.02em;
}

/* Positioned, so a mega menu's panel hangs from the header's bottom edge, the page's full width. */
.sf-top {
  position: relative;
  z-index: 20;
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

/* The logo sits in the middle column and the tools at the end, also for a store
   with no social links to fill the first column. */
.sf-logo {
  grid-column: 2;
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

/* The checkout's logo on a theme with the sections drawing: its wordmark in the heading face and case, as on every other page. */
.sf-top--sections .sf-logo {
  font-family: var(--sf-heading-font, system-ui);
  font-weight: var(--sf-heading-weight, 800);
  font-size: 28px;
  letter-spacing: 0;
  text-transform: var(--sf-heading-case, none);
}

.sf-tools {
  grid-column: 3;
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

/* The input has no outline of its own, so the box shows where the keyboard is. */
.sf-search--ring:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 2px;
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

/* 24px target around the 16px icon (WCAG 2.5.8 — W-12). */
.sf-search__go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  padding: 0;
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

/* ── Mega menu: a menu link that opens a panel of links (StorefrontMegaPanel) ── */
.sf-nav__group {
  display: flex;
}

/* The link's own words and weight; the padding reaches down to the panel, so the pointer never leaves on the way. */
.sf-nav__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 -16px;
  padding: 0 0 16px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.sf-nav__trigger:hover,
.sf-nav__trigger--open {
  text-decoration: underline;
}

.sf-nav__trigger .v-icon {
  transition: transform 160ms ease-out;
}

.sf-nav__trigger--open .v-icon {
  transform: rotate(180deg);
}

.sf-nav__trigger:focus-visible,
.sf-mobile-group summary:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .sf-nav__trigger .v-icon {
    transition: none;
  }
}

.sf-mobile-nav {
  display: none;
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

  /* A link with a panel, in the phone menu: its name opens the links under it. */
  .sf-mobile-group summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
    cursor: pointer;
    list-style: none;
  }

  .sf-mobile-group summary::-webkit-details-marker {
    display: none;
  }

  .sf-mobile-group[open] summary .v-icon {
    transform: rotate(180deg);
  }

  .sf-mobile-group__col {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 0 4px 12px;
    font-weight: 400;
  }

  .sf-mobile-group__heading {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
}

/* ── Sections drawing ────────────────────────────────────────────────── */
.sfh-announce {
  margin: 0;
  padding: 10px var(--sf-gutter);
  background: var(--sf-brand, #111111);
  color: var(--sf-on-brand, #ffffff);
  text-align: center;
  font-size: 13px;
  line-height: 18px;
  letter-spacing: 0.02em;
}

.sfh {
  position: relative;
  z-index: 20;
  border-bottom: 1px solid var(--sf-divider, #e5e5e5);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
}

/* A dark header paints the brand colour and its ink; the focus ring follows the ink so it shows on the dark fill. */
.sfh--dark {
  --sf-accent: var(--sf-on-brand, #ffffff);
  --sf-focus: var(--sf-on-brand, #ffffff);
  border-bottom-color: transparent;
  background: var(--sf-brand, #121011);
  color: var(--sf-on-brand, #ffffff);
}

@media (min-width: 901px) {
  .sfh--sticky {
    position: sticky;
    top: 0;
  }
}

.sfh a {
  color: inherit;
  text-decoration: none;
}

/* The box a mega menu's panel hangs from (StorefrontMegaPanel, top: 100%): right under the
   menu row, the page's full width, over the search and vehicle rows under it. */
.sfh__bar {
  position: relative;
}

.sfh__row {
  display: flex;
  align-items: center;
  gap: 40px;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  min-height: 76px;
  margin: 0 auto;
  padding: 0 var(--sf-gutter, 24px);
}

/* Centred: the wordmark's row keeps its height, and the menu is a second row under it. */
.sfh--centered .sfh__row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: minmax(76px, auto);
  row-gap: 0;
}

.sfh--centered .sfh__logo {
  grid-column: 2;
  grid-row: 1;
}

.sfh--centered .sfh__tools {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
}

.sfh--centered .sfh__nav {
  grid-column: 1 / -1;
  grid-row: 2;
  justify-content: center;
  padding-bottom: 18px;
}

/* Centred: the vehicle chip takes the empty start column. */
.sfh--centered .sfh__vehicle--inline {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
  margin-left: 0;
}

.sfh__logo {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 30px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1;
  letter-spacing: -0.01em;
  text-transform: var(--sf-heading-case, none);
  white-space: nowrap;
}

.sfh__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 28px;
  min-width: 0;
  font-size: 15px;
  line-height: 20px;
}

/* A menu with a mega menu in it takes the bar's full height (its links stay centred), and so
   does each link with a panel, so the pointer crosses no gap on its way down to the panel.
   Centred: the link reaches down through the menu row's own bottom padding. A link with a
   panel stacks above the rows under the bar, so their icons never show through its panel. */
.sfh--inline .sfh__nav--panels {
  align-self: stretch;
}

.sfh__nav--panels .sf-nav__group {
  z-index: 1;
  align-self: stretch;
  align-items: center;
}

.sfh--centered .sfh__nav--panels .sf-nav__group {
  margin-bottom: -18px;
  padding-bottom: 18px;
}

/* An underline that grows under the link, and stays under the page you are on. */
.sfh__link,
.sfh__link-text {
  position: relative;
  padding: 6px 0;
}

.sfh__link::after,
.sfh__link-text::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease-out;
}

.sfh__link:hover::after,
.sfh__link[aria-current='page']::after,
.sfh__trigger:hover .sfh__link-text::after,
.sfh__trigger[aria-expanded='true'] .sfh__link-text::after {
  transform: scaleX(1);
}

/* A link with a panel: the menu's own words and underline (not the classic trigger's reach
   and underline), and a chevron that turns while its panel is open. */
.sfh__trigger {
  margin: 0;
  padding: 0;
}

.sfh__trigger:hover {
  text-decoration: none;
}

.sfh__trigger[aria-expanded='true'] .v-icon {
  transform: rotate(180deg);
}

.sfh__tools {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.sfh__icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--sf-radius, 0);
  background: none;
  color: inherit;
  cursor: pointer;
}

.sfh__icon:hover {
  background: color-mix(in srgb, currentColor 8%, transparent);
}

/* The vehicle chip: the header's ink on a faint wash of it, so it reads on a light or a dark header. */
.sfh__vehicle {
  display: inline-flex;
  flex-shrink: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 280px;
  min-height: 40px;
  margin-left: auto;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
  border-radius: var(--sf-radius, 0);
  background: color-mix(in srgb, currentColor 8%, transparent);
  color: inherit;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.sfh__vehicle:hover {
  background: color-mix(in srgb, currentColor 16%, transparent);
}

/* The header's own ink, never the theme's accent (a yellow ring vanishes on a light header). */
.sfh__vehicle:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.sfh__vehicle-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Wide: the chip takes the push to the end, the tools follow it. Only while it shows,
   or the tools would lose their place at the end of the bar. */
@media (min-width: 1241px) {
  .sfh__vehicle--inline + .sfh__tools {
    margin-left: 0;
  }
}

/* The row under the bar, where the chip goes once the menu needs the bar's width. */
.sfh__vehicle-row {
  display: none;
}

@media (max-width: 1240px) {
  .sfh__vehicle--inline {
    display: none;
  }

  .sfh__vehicle-row {
    display: block;
    box-sizing: border-box;
    max-width: var(--sf-measure, 1200px);
    margin: 0 auto;
    padding: 0 var(--sf-gutter, 24px) 12px;
  }

  .sfh__vehicle-row .sfh__vehicle {
    margin: 0;
  }
}

.sfh__link:focus-visible,
.sfh__trigger:focus-visible,
.sfh__logo:focus-visible,
.sfh__icon:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sfh__count {
  position: absolute;
  top: 6px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 999px;
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff);
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.sfh--dark .sfh__count {
  background: var(--sf-on-brand, #ffffff);
  color: var(--sf-brand, #121011);
}

/* The menu button: on a phone, and on a desktop for the Minimal style. */
.sfh__menu {
  display: none;
}

.sfh--minimal .sfh__menu {
  display: inline-flex;
}

.sfh-drawer {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sfh-drawer ul {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Search: a field-like row leading to the search page. */
.sfh-drawer__search {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid var(--sf-divider, #e5e5e5);
  border-radius: var(--sf-radius, 0);
  color: var(--sf-muted, #5f5f5f);
  font-size: 15px;
  text-decoration: none;
}

.sfh-drawer__link {
  display: flex;
  align-items: center;
  min-height: 48px;
  color: inherit;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 28px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.15;
  text-decoration: none;
  text-transform: var(--sf-heading-case, none);
}

.sfh-drawer__more {
  padding-top: 16px !important;
  border-top: 1px solid var(--sf-divider, #e5e5e5);
}

.sfh-drawer__link--small {
  min-height: 44px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 400;
  text-transform: none;
}

.sfh-drawer__link:hover,
.sfh-drawer__search:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.sfh-drawer__link:focus-visible,
.sfh-drawer__search:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

/* A link with a panel, in the drawer: its name opens its columns in place (no picture tile). */
.sfh-drawer__summary {
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  list-style: none;
}

.sfh-drawer__summary::-webkit-details-marker {
  display: none;
}

.sfh-drawer__summary .v-icon {
  flex: none;
  transition: transform 160ms ease-out;
}

.sfh-drawer__group[open] > .sfh-drawer__summary .v-icon {
  transform: rotate(180deg);
}

.sfh-drawer__col {
  padding: 4px 0;
}

.sfh-drawer__col:last-child {
  padding-bottom: 16px;
}

.sfh-drawer__heading {
  margin: 0;
  padding: 12px 0 4px;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (prefers-reduced-motion: reduce) {
  .sfh-drawer__summary .v-icon {
    transition: none;
  }
}

/* ── Search as a field (Lumos) ───────────────────────────────────────────
 * The theme's field: its control height, a hairline in its field colour that turns
 * its accent on focus (with the focus ring), its corners, the card colour inside,
 * a placeholder in its muted colour, and the magnifier as the submit button. In the
 * bar on a wide screen; under the bar, the full width, where the menu needs the bar. */
.sfh--search-field .sfh__tools {
  margin-left: 0;
}

.sfh__search--bar {
  flex: 0 1 300px;
  min-width: 200px;
  margin-left: auto;
}

.sfh__search--row {
  display: none;
}

/* Centred: the wordmark holds the middle of the bar, so the field always has its row under it. */
.sfh--centered .sfh__search--bar {
  display: none;
}

.sfh--centered .sfh__search--row {
  display: block;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 0 var(--sf-gutter, 24px) 12px;
}

.sfh__field {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: var(--sf-control-height, 44px);
  border: 1px solid var(--sf-input-border, var(--sf-divider, #e5e5e5));
  border-radius: var(--sf-corner, var(--sf-radius, 0));
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-text, #121011);
}

.sfh__field:focus-within {
  border-color: var(--sf-field-focus, var(--sf-text, #121011));
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

/* A dark header: the ring in the header's ink, so it shows on the dark fill. */
.sfh--dark .sfh__field:focus-within {
  outline-color: var(--sf-on-brand, #ffffff);
}

.sfh__field-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  padding: 0 0 0 16px;
  border: 0;
  outline: none;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 16px;
}

.sfh__field-input::placeholder {
  color: var(--sf-muted, #5f5f5f);
  opacity: 1;
}

.sfh__field-go {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: var(--sf-muted, #5f5f5f);
  cursor: pointer;
}

.sfh__field-go:hover {
  color: var(--sf-text, #121011);
}

.sfh__field-go:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: -4px;
}

/* Where the menu needs the bar (as for the vehicle chip): the field goes to a row of its own, the full width. */
@media (max-width: 1240px) {
  .sfh__search--bar {
    display: none;
  }

  .sfh--search-field .sfh__tools {
    margin-left: auto;
  }

  .sfh__search--row {
    display: block;
    box-sizing: border-box;
    max-width: var(--sf-measure, 1200px);
    margin: 0 auto;
    padding: 0 var(--sf-gutter, 24px) 12px;
  }
}

@media (max-width: 900px) {
  .sfh__row {
    gap: 12px;
    min-height: 60px;
  }

  .sfh--centered .sfh__row {
    display: flex;
  }

  .sfh__logo {
    font-size: 26px;
  }

  .sfh__nav,
  .sfh__icon--account {
    display: none;
  }

  .sfh__menu {
    display: inline-flex;
  }

  .sfh__vehicle-row .sfh__vehicle {
    width: 100%;
    max-width: none;
    min-height: 44px;
  }

  .sfh__vehicle-row .sfh__vehicle-text {
    flex: 1 1 auto;
    text-align: left;
  }
}
</style>
