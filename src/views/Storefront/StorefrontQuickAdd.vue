<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import { parseDecimal } from '@/maropay/money'
import type { Product, ProductVariant } from '@/stores/useCommerce'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { fitDetail, lineVehicle, variantFitState } from '@/storefront/fitment'
import { addsDirectly, cardPhoto, cardPrice, soldOutText } from '@/storefront/listing'
import { galleryFor } from '@/storefront/productPage'
import { describeVariant, initialSelection, optionKey, optionKind, optionValuesOf, variantAvailable, variantFor } from '@/storefront/variants'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontDrawer from './StorefrontDrawer.vue'
import StorefrontFitBanner from './StorefrontFitBanner.vue'
import StorefrontVariantPicker from './StorefrontVariantPicker.vue'
import { STOREFRONT } from './storefrontContext'
import { priceOf, productHandle } from './storefrontCatalog'

// Quick add from a product list (the "+" on a card, richer theme drawing). A
// product that needs a choice opens a drawer (a bottom sheet on a phone) with its
// photo, live price and the variant picker, starting on the colour the card
// showed; "Add to cart" then says "Select a size" rather than ever being
// disabled. Once added, the drawer says so, with "View cart" and "Keep
// shopping". A product with one variant is added straight from the card. Either
// way the cart in the header counts it and screen readers hear "Added to your cart".
//
// On a store that sells parts the drawer says how the part fits the shopper's
// vehicle (StorefrontFitBanner, compact), for the choice made once there is one (a
// 16 in wiper may not fit where the 22 in does), and a choice that fits goes into
// the cart with the vehicle on its line ("Fits 2019 Ford F-150"). A part the
// vehicle doesn't take is never added straight from its card: the drawer opens and
// says so first.
//
// The list calls `start(product, color)`; one of these serves a whole list.

const emit = defineEmits<{
  /** A product went into the cart (straight from the card, or from the drawer). */
  added: [product: Product, variant: ProductVariant | undefined]
}>()

const storefront = inject(STOREFRONT)!
const cart = useStorefrontCartStore()
const channelId = computed(() => storefront.channel.value.id)

const open = ref(false)
const product = ref<Product | null>(null)
const selection = ref<Record<string, string>>()
const variant = ref<ProductVariant>()
const stage = ref<'choose' | 'added'>('choose')
/** The picker's exposed API (a generic component, so typed by hand). */
const picker = ref<{ validate: () => boolean; focus: (optionName?: string) => Promise<void> } | null>(null)
const addedActions = ref<HTMLElement | null>(null)

const options = computed(() => product.value?.detail?.options ?? [])
const colorOption = computed(() => options.value.find((option) => optionKind(option) === 'color'))
/** Where the shopper's next choice is: sizes, else the last option. */
const sizeOption = computed(() => options.value.find((option) => optionKind(option) === 'size') ?? options.value[options.value.length - 1])

const money = (decimal: string | undefined) => {
  if (!product.value || !decimal) return ''
  const currency = storefront.currency.value
  return storefront.formatMoney(parseDecimal(decimal, currency) ?? priceOf(product.value, currency))
}

/** The chosen variant's price, or the card's until one is chosen. */
const price = computed(() => {
  if (!product.value) return null
  const v = variant.value
  if (!v) return cardPrice(product.value)
  const compare = v.compareAtPrice || product.value.compareAtPrice
  return { price: v.price, compareAt: compare && Number.parseFloat(compare) > Number.parseFloat(v.price) ? compare : undefined, from: false }
})

const photo = computed(() => {
  if (!product.value) return undefined
  const color = colorOption.value ? selection.value?.[colorOption.value.name] : undefined
  return cardPhoto(product.value, color ? { name: color } : undefined)
})

/** "Shown in Oat" under the photo when the colour chosen has no photo of its own, as the product page says it. */
const shownIn = computed(() => (product.value && photo.value && selection.value ? galleryFor(product.value, selection.value).shownIn : ''))

/** "Size M · Sand". */
const line = computed(() => (variant.value && product.value ? describeVariant(variant.value, options.value) : ''))

/** How the part fits the shopper's vehicle, on a store that sells parts: the choice made, else the part. */
const fit = computed(() => {
  const p = product.value
  if (!storefront.sellsParts.value || !p?.detail?.fitment) return null
  return variant.value ? variantFitState(p, variant.value, storefront.vehicle.value) : storefront.fitOf(p)
})

/** The vehicle a line names: the shopper's, when this choice of the part fits it (never a universal part). */
function vehicleFor(p: Product, v: ProductVariant | undefined): { vehicle?: string } {
  const vehicle = lineVehicle(p, v, storefront.vehicle.value)
  return vehicle ? { vehicle } : {}
}

/** The variants that could be bought when the drawer opened: one of them sold out since "just sold out". */
const availableAtOpen = ref(new Set<number>())

/** "Cart subtotal (2 items) $226.00", once added. */
const cartItems = computed(() => cart.count(channelId.value))
const subtotal = computed(() => storefront.formatMoney(cart.subtotal(channelId.value, storefront.currency.value)))

/** The product page, opened on what is chosen here. */
const detailsHref = computed(() => {
  if (!product.value) return '/'
  const query = options.value
    .filter((option) => selection.value?.[option.name] !== undefined)
    .map((option) => `${optionKey(option.name)}=${optionKey(selection.value![option.name]!)}`)
  return `/products/${productHandle(product.value)}${query.length ? `?${query.join('&')}` : ''}`
})

/**
 * Quick-adds `p`: straight into the cart when it has nothing to choose
 * ('added'), else opens the drawer on `color` (as the product names it) or its
 * first colour in stock ('opened').
 */
function start(p: Product, color?: string): 'added' | 'opened' {
  if (addsDirectly(p, storefront.sellsParts.value ? storefront.fitOf(p) : 'unknown')) {
    addDirect(p)
    return 'added'
  }
  const colorKey = p.detail?.options.find((option) => optionKind(option) === 'color')
  product.value = p
  variant.value = undefined
  availableAtOpen.value = new Set((p.detail?.variantsList ?? []).filter(variantAvailable).map((v) => v.id))
  stage.value = 'choose'
  selection.value = initialSelection(p, color && colorKey ? { [optionKey(colorKey.name)]: optionKey(color) } : {})
  open.value = true
  return 'opened'
}

function addDirect(p: Product): void {
  const v = variantFor(p, initialSelection(p))
  if (v && !variantAvailable(v)) return
  cart.add(channelId.value, p, 1, { ...(v ? { variant: v } : {}), ...vehicleFor(p, v) })
  const what = v && p.detail?.options.length ? describeVariant(v, p.detail.options) : ''
  storefront.announce(`Added to your cart · ${p.name}${what ? ` · ${what}` : ''}`)
  emit('added', p, v)
}

/** Add to cart in the drawer: asks for what is missing, refuses a size that is sold out, else adds. */
async function add(): Promise<void> {
  const p = product.value
  if (!p || !picker.value) return
  if (!picker.value.validate()) {
    // The picker says "Select a size" under the sizes and moves focus there; a screen reader hears it too.
    const missing = options.value.find((option) => selection.value?.[option.name] === undefined)
    if (missing) storefront.announce(`Select a ${missing.name.toLowerCase()}`)
    return
  }
  const v = variant.value
  if (!v) return
  if (!variantAvailable(v)) {
    const at = options.value.findIndex((option) => option.name === sizeOption.value?.name)
    const value = optionValuesOf(v, options.value)[at] ?? ''
    storefront.announce(soldOutText(value, sizeOption.value?.name ?? '', availableAtOpen.value.has(v.id)))
    void picker.value.focus(sizeOption.value?.name)
    return
  }
  cart.add(channelId.value, p, 1, { variant: v, ...vehicleFor(p, v) })
  stage.value = 'added'
  storefront.announce(`Added to your cart · ${p.name}${line.value ? ` · ${line.value}` : ''}`)
  emit('added', p, v)
  await nextTick()
  addedActions.value?.querySelector<HTMLElement>('a, button')?.focus()
}

defineExpose({ start })
</script>

<template>
  <StorefrontDrawer
    v-model="open"
    :title="stage === 'added' ? 'Added to your cart' : (product?.name ?? '')"
  >
    <template v-if="product">
      <div class="sf-qa__summary" :class="{ 'sf-qa__summary--added': stage === 'added' }">
        <div class="sf-qa__media">
          <span class="sf-qa__thumb">
            <img v-if="photo" :src="photo" alt="" class="sf-qa__image">
            <v-icon v-else size="32" aria-hidden="true">shirt</v-icon>
          </span>
          <p v-if="shownIn" class="sf-qa__shown">{{ shownIn }}</p>
        </div>
        <div class="sf-qa__facts">
          <p v-if="stage === 'added'" class="sf-qa__name">{{ product.name }}</p>
          <p v-else-if="product.detail?.subtitle" class="sf-qa__subtitle">{{ product.detail.subtitle }}</p>
          <p v-if="stage === 'added' && line" class="sf-qa__line">{{ line }}</p>
          <p v-if="price" class="sf-qa__price">
            <template v-if="price.compareAt">
              <span class="sf-qa__sale"><span class="sf-sr">Sale price </span>{{ money(price.price) }}</span>
              <s class="sf-qa__was"><span class="sf-sr">Usual price </span>{{ money(price.compareAt) }}</s>
            </template>
            <span v-else><template v-if="price.from">From </template>{{ money(price.price) }}</span>
          </p>
          <StorefrontAnchor v-if="stage === 'choose'" :href="detailsHref" class="sf-qa__details">View full details</StorefrontAnchor>
        </div>
      </div>

      <StorefrontFitBanner v-if="fit && stage === 'choose'" class="sf-qa__fit" :state="fit" :vehicle="storefront.vehicle.value" :detail="fit === 'fits' && product ? fitDetail(product, storefront.vehicle.value) : ''" compact />

      <p v-if="stage === 'added'" class="sf-qa__subtotal">
        <span>Cart subtotal ({{ cartItems }} {{ cartItems === 1 ? 'item' : 'items' }})</span>
        <span>{{ subtotal }}</span>
      </p>

      <StorefrontVariantPicker
        v-if="stage === 'choose'"
        :key="product.id"
        ref="picker"
        v-model="selection"
        :product="product"
        layout="sheet"
        @variant="variant = $event"
      />
    </template>

    <template #footer>
      <button v-if="stage === 'choose'" type="button" class="sf-qa__button sf-qa__button--primary" @click="add">
        Add to cart<template v-if="price"> · {{ money(price.price) }}</template>
      </button>
      <div v-else ref="addedActions" class="sf-qa__actions">
        <StorefrontAnchor href="/cart-page" class="sf-qa__button sf-qa__button--primary" @click="open = false">View cart ({{ cart.count(channelId) }})</StorefrontAnchor>
        <button type="button" class="sf-qa__button sf-qa__button--secondary" @click="open = false">Keep shopping</button>
      </div>
    </template>
  </StorefrontDrawer>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-qa__summary {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.sf-qa__summary--added {
  margin-bottom: 0;
}

.sf-qa__media {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 6px;
  width: 96px;
}

.sf-qa__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-surface, color-mix(in srgb, var(--sf-text, #121011) 5%, var(--sf-bg, #ffffff)));
  color: var(--sf-muted, #66625c);
}

.sf-qa__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-qa__shown {
  margin: 0;
  color: var(--sf-muted, #66625c);
  font-size: 13px;
  line-height: 18px;
}

.sf-qa__facts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding-top: 2px;
}

.sf-qa__facts p {
  margin: 0;
}

.sf-qa__name {
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
}

.sf-qa__subtitle,
.sf-qa__line {
  font-size: 14px;
  line-height: 20px;
  color: var(--sf-muted, #66625c);
}

.sf-qa__price {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  font-variant-numeric: tabular-nums;
}

.sf-qa__sale {
  color: var(--sf-badge-sale, #b3261e);
}

.sf-qa__was {
  color: var(--sf-muted, #66625c);
  font-weight: 400;
}

.sf-qa__details {
  align-self: flex-start;
  margin-top: 4px;
  font-size: 14px;
  line-height: 20px;
  color: var(--sf-text, #121011);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sf-qa__details:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-qa__fit {
  margin-bottom: 24px;
}

.sf-qa__subtotal {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 24px 0 0;
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--sf-text, #121011) 13%, transparent);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.sf-qa__actions {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 12px;
}

/* The store's buttons: its colours, corners and button case, as wide as the drawer; the height and
   text of a theme that styles its controls (Lumos: storefront-controls.css). A label stays on one
   line: two buttons too wide to share a row take a row each. */
.sf-qa__button {
  display: inline-flex;
  flex: 1 1 160px;
  align-items: center;
  justify-content: center;
  min-height: var(--sf-control-height, 50px);
  padding: 0 20px;
  border: 1px solid var(--sf-brand, #121011);
  border-radius: var(--sf-radius, 0);
  font: inherit;
  font-size: var(--sf-control-text, 15px);
  font-weight: 600;
  text-decoration: none;
  text-transform: var(--sf-button-case, none);
  white-space: nowrap;
  cursor: pointer;
}

.sf-qa__button--primary {
  background: var(--sf-brand, #121011);
  color: var(--sf-on-brand, #ffffff);
}

.sf-qa__button--primary:hover {
  background: color-mix(in srgb, var(--sf-brand, #121011) 86%, var(--sf-bg, #ffffff));
}

.sf-qa__button--secondary {
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  border-color: color-mix(in srgb, var(--sf-text, #121011) 30%, transparent);
}

.sf-qa__button--secondary:hover {
  border-color: var(--sf-text, #121011);
}

.sf-qa__button:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
