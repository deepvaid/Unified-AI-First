<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseDecimal, zero } from '@/maropay/money'
import type { Product, ProductVariant } from '@/stores/useCommerce'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useStorefrontWishlistStore } from '@/stores/useStorefrontWishlist'
import { audienceOf } from '@/storefront/audience'
import { isAvailable } from '@/storefront/catalog'
import { fitDetail, lineVehicle, variantFitState } from '@/storefront/fitment'
import { soldOutText } from '@/storefront/listing'
import { galleryFor, partNumberOf, priceFor, productRows, selectionFromQuery, withSelectionQuery } from '@/storefront/productPage'
import type { ThemeSection } from '@/storefront/themeSections'
import { describeVariant, initialSelection, optionKind, variantAvailable } from '@/storefront/variants'
import { heartLabel, toggleAnnouncement } from '@/storefront/wishlist'
import StorefrontAnchor from '../StorefrontAnchor.vue'
import StorefrontDrawer from '../StorefrontDrawer.vue'
import StorefrontFitBanner from '../StorefrontFitBanner.vue'
import StorefrontPayMark from '../StorefrontPayMark.vue'
import StorefrontSizeGuide from '../StorefrontSizeGuide.vue'
import StorefrontVariantPicker from '../StorefrontVariantPicker.vue'
import { chromeSettings, flag } from '../sections/sectionSettings'
import { STOREFRONT } from '../storefrontContext'
import StorefrontProductGallery from './StorefrontProductGallery.vue'
import StorefrontProductPrice from './StorefrontProductPrice.vue'
import StorefrontProductRows from './StorefrontProductRows.vue'

// The product template's `product-detail` section, drawn by the sections drawing:
// the gallery beside the buy box. The buy box is the title and price, the colour
// swatches and size buttons (StorefrontVariantPicker), "Only 2 left in M", the fit
// note, a "Size guide" link that opens the product's chart in a drawer, Add to cart
// and Buy now, then the template's collapsible rows.
//
// The choice is kept in the URL (`?color=sand&size=m`), so a shared link opens the
// same colour and size; `?sizeGuide=1` (the chat's "Open the size guide") opens the
// guide. Add to cart is never disabled: without a size it says "Select a size" under
// the sizes, moves focus there and says it to screen readers. The gallery follows
// the colour; a colour without photos of its own says what is shown instead.
//
// On a desktop the buy box stays in view beside the photos (sticky, under the header
// when the header is sticky; a buy box taller than the window scrolls until its foot
// is in view, then stays). The choices and the buttons are marked `data-sf-clear`, so
// the chat launcher steps aside when it would cover them (StorefrontChat.vue).
//
// On an auto-parts store (Torqline) the buy box also shows the part number, which
// follows the chosen variant, and, with the section's `fitment`, the fit banner under
// the title: whether the part fits the shopper's vehicle (StorefrontFitBanner). Once a
// choice is made the banner speaks for that choice: a 16 in wiper on a truck that
// takes 22 in "Doesn’t fit", with "Your vehicle takes: Driver 22 in, passenger 22 in".
// A choice added to the cart while it fits carries the vehicle on its line ("Fits 2019
// Ford F-150"); one that doesn't carries none. Buy now's line gets it at the checkout.
//
// On a store with a wishlist (Lumos) a heart beside Add to cart saves the product: a toggle
// button (`aria-pressed`) with one name, and what it did is said politely.
//
// Section settings: galleryLayout ('Stacked' | 'Thumbnails'), imageRatio ('Portrait' |
// 'Square' | 'Landscape'), sizeGuide (true unless false), fitment (false unless true).

const props = defineProps<{
  product: Product
  /** The template's product-detail section: its settings and `collapsible-row` blocks. */
  section: ThemeSection
}>()

const route = useRoute()
const router = useRouter()
const storefront = inject(STOREFRONT)!
const cart = useStorefrontCartStore()

const channelId = computed(() => storefront.channel.value.id)
const options = computed(() => props.product.detail?.options ?? [])
const settings = computed(() => props.section.settings)
const galleryLayout = computed(() => (settings.value.galleryLayout === 'Stacked' ? 'Stacked' : 'Thumbnails'))
const imageRatio = computed(() => {
  const ratio = settings.value.imageRatio
  return ratio === 'Portrait' || ratio === 'Landscape' ? ratio : 'Square'
})

// ── The choice ───────────────────────────────────────────────────────────────
const selection = ref<Record<string, string>>(initialSelection(props.product, selectionFromQuery(route.query)))
const variant = ref<ProductVariant>()
const picker = ref<{ validate: () => boolean; focus: (optionName?: string) => Promise<void> } | null>(null)

const sizeOption = computed(() => options.value.find((option) => optionKind(option) === 'size'))
/** The option the stock notes talk about: the size, else the last option. */
const noteOption = computed(() => sizeOption.value ?? options.value[options.value.length - 1])
const chosenSize = computed(() => (sizeOption.value ? selection.value[sizeOption.value.name] : undefined))

// Every change of choice goes in the URL (replacing, not adding to, the history).
watch(selection, (value) => {
  added.value = null
  const query = withSelectionQuery(route.query, options.value, value)
  const same = (a: object, b: object) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort())
  if (!same(query, route.query)) void router.replace({ query })
})

// ── What it costs, what is shown ─────────────────────────────────────────────
const currency = computed(() => storefront.currency.value)
const asMoney = (decimal: string) => parseDecimal(decimal, currency.value) ?? zero(currency.value)
const price = computed(() => priceFor(props.product, variant.value))
const offer = computed(() => storefront.offerFor(asMoney(price.value.price)))
const gallery = computed(() => galleryFor(props.product, selection.value))
/** Who the piece is for, so a size chart shared by women's and men's pieces shows its own columns. */
const audience = computed(() => audienceOf(props.product.collections, props.product.detail?.subtitle))
const subtitle = computed(() => props.product.detail?.subtitle?.trim() ?? '')
const fitNote = computed(() => props.product.detail?.fitNote?.trim() ?? '')

/** The product's size chart, when the template shows a size guide and the product links one. */
const chart = computed(() => (settings.value.sizeGuide === false ? undefined : storefront.sizeChartFor(props.product)))
const rows = computed(() => productRows(props.section.blocks, props.product, { sizeGuide: !!chart.value, vehicle: storefront.vehicle.value }))

// ── A part: its number and its fit ───────────────────────────────────────────
const sellsParts = computed(() => storefront.sellsParts.value)
const showFit = computed(() => sellsParts.value && settings.value.fitment === true)
/** How the part, or the choice once one is made, stands against the shopper's vehicle. */
const fit = computed(() => variantFitState(props.product, chosenVariant.value, storefront.vehicle.value))
/** What the rows that fit say: under "Fits", or, when the part fits but this choice doesn't, what the vehicle takes. */
const fitRows = computed(() => {
  const detail = fitDetail(props.product, storefront.vehicle.value)
  if (fit.value === 'fits') return detail
  return fit.value === 'no-fit' && detail ? `Your vehicle takes: ${detail}` : ''
})
const partNumber = computed(() => (sellsParts.value ? partNumberOf(props.product, chosenVariant.value) : ''))
/** While a choice that changes the part number is still open: "Choose a position to see its part number." */
const partNumberHint = computed(() => {
  if (!sellsParts.value || partNumber.value) return ''
  const open = options.value.find((option) => selection.value[option.name] === undefined)
  return open ? `Choose a ${open.name.toLowerCase()} to see its part number.` : ''
})

const soldOut = computed(() => {
  if (!options.value.length) return !isAvailable(props.product)
  return variant.value ? !variantAvailable(variant.value) : !(props.product.detail?.variantsList ?? []).some(variantAvailable)
})

/** What could be bought when the page opened: only a choice that sold out since then "just sold out" (as the picker says it). */
const availableAtStart = new Set((props.product.detail?.variantsList ?? []).filter(variantAvailable).map((v) => v.id))
const productAvailableAtStart = isAvailable(props.product)

// ── Size guide ───────────────────────────────────────────────────────────────
const guideOpen = ref(route.query.sizeGuide === '1' && !!chart.value)
watch(() => route.query.sizeGuide, (value) => {
  if (value === '1' && chart.value) guideOpen.value = true
})

/** A guide opened by `?sizeGuide=1` takes the word out of the URL when it closes, so a reload does not open it again. */
function onGuideClosed(): void {
  if (route.query.sizeGuide === undefined) return
  const { sizeGuide: _closed, ...rest } = route.query
  void router.replace({ query: rest })
}

// ── Buying ───────────────────────────────────────────────────────────────────
const added = ref<{ line: string } | null>(null)
const justAdded = ref(false)
let addedTimer: number | undefined
onBeforeUnmount(() => window.clearTimeout(addedTimer))

const addLabel = computed(() => (soldOut.value ? 'Sold out' : justAdded.value ? 'Added to cart' : 'Add to cart'))

/**
 * Whether the choice can be bought. If an option is unchosen, the picker says
 * "Select a size" under it and moves focus there; if the choice is sold out, focus
 * goes back to the sizes. Either way a screen reader hears why.
 */
function ready(): boolean {
  const missing = options.value.find((option) => selection.value[option.name] === undefined)
  if (missing) {
    picker.value?.validate()
    storefront.announce(`Select a ${missing.name.toLowerCase()}`)
    return false
  }
  if (soldOut.value) {
    const option = noteOption.value
    const value = option ? selection.value[option.name] : undefined
    const soldDuringVisit = options.value.length ? !!variant.value && availableAtStart.has(variant.value.id) : productAvailableAtStart
    storefront.announce(option && value
      ? soldOutText(value, option.name, soldDuringVisit)
      : soldDuringVisit ? 'Sorry, this just sold out.' : 'Sorry, this is sold out.')
    if (option) void picker.value?.focus(option.name)
    return false
  }
  return true
}

/** The variant to put on a line: only for a product that has a choice to make. */
const chosenVariant = computed(() => (options.value.length ? variant.value : undefined))

function addToCart(): void {
  if (!ready()) return
  const chosen = chosenVariant.value
  // The vehicle goes on the line only while this choice of the part fits it.
  const vehicle = sellsParts.value ? lineVehicle(props.product, chosen, storefront.vehicle.value) : undefined
  cart.add(channelId.value, props.product, 1, { variant: chosen, vehicle })
  const line = chosen ? describeVariant(chosen, options.value) : ''
  added.value = { line }
  justAdded.value = true
  window.clearTimeout(addedTimer)
  addedTimer = window.setTimeout(() => { justAdded.value = false }, 2000)
  storefront.announce(line ? `Added to your cart · ${line}` : 'Added to your cart')
}

// ── The wishlist (a store that has one) ─────────────────────────────────────
const wishlist = useStorefrontWishlistStore()
const saved = computed(() => wishlist.has(channelId.value, props.product.id))
function toggleSaved(): void {
  const now = wishlist.toggle(channelId.value, props.product.id)
  storefront.announce(toggleAnnouncement(props.product.name, now))
}

/** Buys just this choice, without touching the cart. */
function buyNow(): void {
  if (!ready()) return
  const chosen = chosenVariant.value
  void router.push({
    path: storefront.link('/checkout'),
    query: { buy: String(props.product.id), qty: '1', ...(chosen ? { variant: String(chosen.id) } : {}) },
  })
}

// ── The buy box beside the photos (desktop) ──────────────────────────────────
/** Space between the buy box and the top of the window, or the foot of a sticky header. */
const STICKY_GAP = 24
const info = ref<HTMLElement | null>(null)
const infoTop = ref(STICKY_GAP)
const stickyHeader = computed(() => flag(chromeSettings(storefront.theme.value, 'product', 'header'), 'sticky'))

/** Under a sticky header; a buy box taller than the window sticks by its foot instead. */
function placeInfo(): void {
  const el = info.value
  if (!el) return
  const header = stickyHeader.value ? document.querySelector('header.sfh')?.getBoundingClientRect().height ?? 0 : 0
  const top = Math.round(header) + STICKY_GAP
  infoTop.value = Math.min(top, window.innerHeight - el.offsetHeight - STICKY_GAP)
}

let infoObserver: ResizeObserver | undefined
onMounted(() => {
  placeInfo()
  window.addEventListener('resize', placeInfo)
  if (typeof ResizeObserver !== 'undefined' && info.value) {
    infoObserver = new ResizeObserver(placeInfo)
    infoObserver.observe(info.value)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', placeInfo)
  infoObserver?.disconnect()
})
watch(stickyHeader, placeInfo)
</script>

<template>
  <div class="sf-pm" :class="{ 'sf-pm--part': sellsParts }">
    <div class="sf-pm__gallery">
      <StorefrontProductGallery
        :images="gallery.images"
        :name="product.name"
        :color="gallery.color"
        :colors="gallery.colors"
        :note="gallery.shownIn"
        :layout="galleryLayout"
        :ratio="imageRatio"
      />
    </div>

    <div ref="info" class="sf-pm__info" :style="{ '--sf-pm-top': `${infoTop}px` }">
      <div class="sf-pm__head">
        <h1 class="sf-pm__title">{{ product.name }}</h1>
        <p v-if="subtitle" class="sf-pm__subtitle">{{ subtitle }}</p>
        <p v-if="partNumber" class="sf-pm__part">Part # <span class="sf-pm__part-number">{{ partNumber }}</span></p>
        <p v-else-if="partNumberHint" class="sf-pm__part sf-pm__part--hint">{{ partNumberHint }}</p>
      </div>

      <StorefrontFitBanner v-if="showFit" :state="fit" :vehicle="storefront.vehicle.value" :detail="fitRows" />

      <div class="sf-pm__price">
        <StorefrontProductPrice
          :price="storefront.formatMoney(asMoney(price.price))"
          :compare-at="price.compareAt ? storefront.formatMoney(asMoney(price.compareAt)) : ''"
          :percent-off="price.percentOff"
          :from="price.from"
        />
        <p v-if="offer.payIn4.labels.length" class="sf-pm__instalments">
          <span>or 4 interest-free payments of <strong>{{ storefront.formatMoney(offer.payIn4.amount) }}</strong> with</span>
          <template v-for="(label, index) in offer.payIn4.labels" :key="label">
            <span v-if="index" class="sf-pm__muted">or</span>
            <StorefrontPayMark :mark="label" />
          </template>
        </p>
      </div>

      <StorefrontVariantPicker
        v-if="options.length"
        ref="picker"
        v-model="selection"
        :product="product"
        data-sf-clear
        @variant="variant = $event"
      >
        <template #option-aside="{ kind }">
          <button v-if="kind === 'size' && chart" type="button" class="sf-pm__guide" aria-haspopup="dialog" @click="guideOpen = true">
            <v-icon size="16" aria-hidden="true">ruler</v-icon>
            Size guide
          </button>
        </template>
      </StorefrontVariantPicker>

      <p v-if="fitNote" class="sf-pm__fit">
        <span class="sf-pm__fit-label">Fit</span>
        <span>{{ fitNote }}</span>
      </p>

      <div class="sf-pm__actions" data-sf-clear>
        <div class="sf-pm__buy">
          <button
            type="button"
            class="sf-button sf-button--block sf-pm__add"
            :class="{ 'is-sold-out': soldOut }"
            :aria-disabled="soldOut ? 'true' : undefined"
            @click="addToCart"
          >
            <v-icon v-if="justAdded && !soldOut" size="18" aria-hidden="true">check</v-icon>
            {{ addLabel }}
          </button>
          <button
            v-if="storefront.wishlist.value"
            type="button"
            class="sf-pm__heart"
            :class="{ 'is-saved': saved }"
            :aria-pressed="saved ? 'true' : 'false'"
            :aria-label="heartLabel(product.name)"
            @click="toggleSaved"
          >
            <v-icon size="20" aria-hidden="true">heart</v-icon>
          </button>
        </div>
        <button v-if="!soldOut" type="button" class="sf-button sf-button--secondary sf-button--block" @click="buyNow">
          Buy now
        </button>
      </div>

      <div v-if="added" class="sf-pm__added">
        <v-icon size="20" aria-hidden="true">circle-check</v-icon>
        <p><strong>Added to your cart</strong><template v-if="added.line"> · {{ added.line }}</template></p>
        <StorefrontAnchor href="/cart-page" class="sf-pm__view-cart">View cart ({{ cart.count(channelId) }})</StorefrontAnchor>
      </div>

      <div v-if="offer.acceptedMarks.length" class="sf-pm__trust">
        <p class="sf-pm__secure">
          <v-icon size="16" aria-hidden="true">lock</v-icon>
          {{ offer.cardsVia === 'maropay' ? 'Secure checkout with Maropay' : 'Secure checkout' }}
        </p>
        <ul class="sf-marks" aria-label="Ways to pay">
          <li v-for="mark in offer.acceptedMarks" :key="mark"><StorefrontPayMark :mark="mark" /></li>
        </ul>
      </div>

      <StorefrontProductRows :rows="rows" @size-guide="guideOpen = true" />
    </div>

    <StorefrontDrawer v-if="chart" v-model="guideOpen" title="Size guide" :description="product.name" size="lg" @close="onGuideClosed">
      <StorefrontSizeGuide :chart="chart" :size="chosenSize" :fit-note="fitNote" :audience="audience" />
    </StorefrontDrawer>
  </div>
</template>

<style scoped src="../storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours, fonts and
 * corners are the store's theme (--sf-*); targets are at least 44px tall. */
.sf-pm {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 56px;
  align-items: start;
}

.sf-pm__gallery {
  min-width: 0;
}

.sf-pm__info {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  max-width: 480px;
}

.sf-pm__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sf-pm__title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 40px;
  font-weight: var(--sf-heading-weight, 400);
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-transform: var(--sf-heading-case, none);
}

.sf-pm__subtitle {
  margin: 0;
  color: var(--sf-muted, #66625c);
  font-size: 15px;
  line-height: 22px;
}

.sf-pm__part {
  margin: 0;
  color: var(--sf-muted, #66625c);
  font-size: 14px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}

.sf-pm__part-number {
  color: var(--sf-text, #121011);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.sf-pm__price {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: -8px;
}

.sf-pm__instalments {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
}

.sf-pm__muted {
  color: var(--sf-muted, #66625c);
}

/* Beside the Size legend: underlined, 24px tall, 44px of hit area. */
.sf-pm__guide {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.sf-pm__guide::after {
  content: '';
  position: absolute;
  inset: -10px -6px;
}

.sf-pm__guide:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-pm__fit {
  display: flex;
  gap: 10px;
  margin: -6px 0 0;
  font-size: 14px;
  line-height: 22px;
}

.sf-pm__fit-label {
  flex: none;
  font-weight: 600;
}

.sf-pm__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sf-pm__add.is-sold-out {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Add to cart, with the wishlist heart beside it on a store that has one. */
.sf-pm__buy {
  display: flex;
  gap: 10px;
}

.sf-pm__buy .sf-pm__add {
  flex: 1 1 auto;
  min-width: 0;
}

/* A round button the height of Add to cart, on the card colour; saved, the heart is filled in the accent. */
.sf-pm__heart {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--sf-control-height, 50px);
  height: var(--sf-control-height, 50px);
  padding: 0;
  border: 1px solid var(--sf-input-border, var(--sf-divider, #c9c9c9));
  border-radius: 50%;
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-text, #121011);
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
}

.sf-pm__heart:hover {
  border-color: var(--sf-button-bg, var(--sf-accent, #121011));
  background: var(--sf-button-bg, var(--sf-accent, #121011));
  color: var(--sf-button-ink, #ffffff);
}

.sf-pm__heart.is-saved {
  color: var(--sf-accent, #121011);
}

.sf-pm__heart.is-saved :deep(svg) {
  fill: currentColor;
}

.sf-pm__heart.is-saved:hover {
  border-color: var(--sf-input-border, var(--sf-divider, #c9c9c9));
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-badge-sale, #b3261e);
}

.sf-pm__heart:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .sf-pm__heart {
    transition: none;
  }
}

.sf-pm__added {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: -12px;
  padding: 12px 16px;
  border-radius: var(--sf-radius, 4px);
  background: var(--sf-surface, color-mix(in srgb, var(--sf-text, #121011) 6%, var(--sf-bg, #ffffff)));
  color: var(--sf-text, #121011);
  font-size: 14px;
  line-height: 20px;
}

.sf-pm__added p {
  margin: 0;
}

.sf-pm__added strong {
  font-weight: 600;
}

.sf-pm__view-cart {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 600;
  text-decoration: underline !important;
  text-underline-offset: 3px;
  white-space: nowrap;
}

.sf-pm__view-cart:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-pm__trust {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
}

.sf-pm__secure {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

/* Desktop: the buy box stays beside the photos as they scroll by. */
@media (min-width: 901px) {
  .sf-pm__info {
    position: sticky;
    top: var(--sf-pm-top, 24px);
  }
}

@media (max-width: 1100px) {
  .sf-pm {
    gap: 40px;
  }
}

@media (max-width: 900px) {
  .sf-pm {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .sf-pm__info {
    max-width: none;
    gap: 20px;
  }

  .sf-pm__title {
    font-size: 30px;
  }

  .sf-pm__added {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .sf-pm__view-cart {
    grid-column: 2;
    min-height: 32px;
  }
}
</style>
