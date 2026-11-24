<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { parseDecimal } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { useStorefrontWishlistStore } from '@/stores/useStorefrontWishlist'
import { fitLabel } from '@/storefront/fitment'
import type { FitState } from '@/storefront/fitment'
import { addsDirectly, cardPhoto, cardPrice, choiceSummary, chosenColor, colorsOf, isNewArrival, partNumber, soldOut, stockLine, unbrokenHyphens } from '@/storefront/listing'
import type { CardStyle } from '@/storefront/listing'
import { heartLabel, toggleAnnouncement } from '@/storefront/wishlist'
import StorefrontAnchor from './StorefrontAnchor.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, priceOf, productHandle } from './storefrontCatalog'

// A product in a list on the richer theme drawing (collection and search pages):
// an editorial card with a 3:4 photo, the name, the price (the sale price in the
// theme's sale colour with the struck "was" price), the colours it comes in, and
// a "+" that quick-adds it. The classic drawing keeps StorefrontProductCard.
//
// The name is the card's link, and its hit area covers the whole card; the "+"
// sits above it as a button of its own (a button inside a link is not valid).
// When the list is filtered by colour, the card leads with that colour's photo
// and opens the product page in it.
//
// The `Dense` style is a parts card (Torqline): a square photo, the name, the part
// number, how it fits the shopper's vehicle (fitLabel's words with an icon, never
// colour alone; nothing while no vehicle is chosen), the stock line, the price and
// an Add to cart button. That button emits `quick-add` too: the list's quick add
// puts a part without options straight in the cart, and opens for the rest, and
// for a part the shopper's vehicle doesn't take, so it says so before adding.
//
// The `Boxed` style is the Figma product card (Lumos): a framed card on the theme's
// card colour, corners and shadow; the photo at 248:273 with a badge (Sale, New or
// Sold out) and, on a store with a wishlist, a heart that saves the product; then
// the name (two lines at most), the price, and a full-width Add to cart that adds
// straight away or opens quick add when there is a choice to make, as Dense does.
// The heart is a toggle button (`aria-pressed`) with one name; what it did is said
// politely ("Saved to your wishlist · Arlo 3-Seat Sofa").

const props = withDefaults(defineProps<{
  product: Product
  /** The list's colour filter (URL keys): the card shows the first of them the product comes in. */
  colorKeys?: readonly string[]
  /** Show the quick-add "+". */
  quickAdd?: boolean
  /** The product was just added straight from this card: the "+" reads "Added" for a moment. */
  added?: boolean
  /** The "New" mark (off on a New… collection's own page, where every card would carry it). */
  showNew?: boolean
  headingLevel?: 2 | 3 | 4
  /** Editorial (Northfold), Dense (a part, Torqline) or Boxed (Lumos): the collection template's `cardStyle`. */
  cardStyle?: CardStyle
}>(), {
  colorKeys: () => [],
  quickAdd: true,
  added: false,
  showNew: true,
  headingLevel: 3,
  cardStyle: 'Editorial',
})

const emit = defineEmits<{
  /** The shopper asked to quick-add, in this colour (as the product names it) when the card shows one. */
  'quick-add': [product: Product, color: string | undefined]
}>()

const storefront = inject(STOREFRONT)!

const price = computed(() => cardPrice(props.product))
const money = (decimal: string) => storefront.formatMoney(parseDecimal(decimal, storefront.currency.value) ?? priceOf(props.product, storefront.currency.value))
const colors = computed(() => colorsOf(props.product))
const color = computed(() => chosenColor(props.product, props.colorKeys))
const photo = computed(() => cardPhoto(props.product, color.value))
const out = computed(() => soldOut(props.product))
const href = computed(() => `/products/${productHandle(props.product)}${color.value ? `?color=${color.value.key}` : ''}`)

/** One mark on the photo: sold out, else the saving, else new. */
const badge = computed<{ kind: 'sold-out' | 'sale' | 'new'; text: string } | null>(() => {
  if (out.value) return { kind: 'sold-out', text: 'Sold out' }
  if (price.value.salePercent) return { kind: 'sale', text: `−${price.value.salePercent}%` }
  if (props.showNew && isNewArrival(props.product)) return { kind: 'new', text: 'New' }
  return null
})

/** Up to four dots, then "+2". */
const DOTS = 4
const dots = computed(() => colors.value.slice(0, colors.value.length > DOTS ? DOTS - 1 : DOTS))
const more = computed(() => colors.value.length - dots.value.length)
const colorNames = computed(() => {
  const names = colors.value.map((c) => c.name)
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? ''
})

// A photo that does not load gives way to the placeholder.
const broken = ref(false)
watch(photo, () => { broken.value = false })

// ── Dense (a part) ────────────────────────────────────────────────────────
const dense = computed(() => props.cardStyle === 'Dense')
const number = computed(() => (dense.value ? partNumber(props.product) : ''))
// A part whose choices each have a number (Front and Rear pads) says what it comes in instead.
const choices = computed(() => (dense.value && !number.value ? choiceSummary(props.product) : ''))
const stock = computed(() => stockLine(props.product))
const FIT_ICONS: Partial<Record<FitState, string>> = { fits: 'circle-check', 'no-fit': 'triangle-alert', universal: 'badge-check' }
/** The fit badge; none while it can't be told (no vehicle chosen, or the part lists no fitment). */
const fit = computed(() => {
  const state = storefront.fitOf(props.product)
  const icon = FIT_ICONS[state]
  const label = fitLabel(state, storefront.vehicle.value)
  return icon ? { state, icon, label, shown: unbrokenHyphens(label) } : null
})
const addLabel = computed(() => `${props.added ? 'Added to cart' : 'Add to cart'}, ${props.product.name}`)

// ── Boxed (the Figma product card) ────────────────────────────────────────
const boxed = computed(() => props.cardStyle === 'Boxed')
const wishlist = useStorefrontWishlistStore()
const saved = computed(() => wishlist.has(storefront.channel.value.id, props.product.id))
function toggleSaved(): void {
  const now = wishlist.toggle(storefront.channel.value.id, props.product.id)
  storefront.announce(toggleAnnouncement(props.product.name, now))
}
/** Boxed spells its sale out ("Sale"); the price under the name says by how much. */
const boxedBadge = computed(() => (badge.value?.kind === 'sale' ? { ...badge.value, text: 'Sale' } : badge.value))
</script>

<template>
  <article v-if="boxed" class="sf-bcard" :class="{ 'is-sold-out': out }">
    <component :is="`h${headingLevel}`" class="sf-bcard__name">
      <StorefrontAnchor :href="href" class="sf-bcard__link">{{ product.name }}</StorefrontAnchor>
    </component>
    <p class="sf-bcard__price">
      <template v-if="price.compareAt">
        <span class="sf-bcard__sale"><span class="sf-sr">Sale price </span>{{ money(price.price) }}</span>
        <s class="sf-bcard__was"><span class="sf-sr">Usual price </span>{{ money(price.compareAt) }}</s>
      </template>
      <span v-else><template v-if="price.from">From </template>{{ money(price.price) }}</span>
    </p>

    <div class="sf-bcard__media">
      <img v-if="photo && !broken" :src="photo" alt="" class="sf-bcard__image" loading="lazy" @error="broken = true">
      <v-icon v-else size="44" class="sf-bcard__placeholder" aria-hidden="true">{{ CATEGORY_ICONS[product.category] ?? 'package' }}</v-icon>
      <span
        v-if="boxedBadge"
        class="sf-bcard__badge"
        :class="`sf-bcard__badge--${boxedBadge.kind}`"
        :aria-hidden="boxedBadge.kind === 'sale' ? 'true' : undefined"
      >{{ boxedBadge.text }}</span>
      <button
        v-if="storefront.wishlist.value"
        type="button"
        class="sf-bcard__heart"
        :class="{ 'is-saved': saved }"
        :aria-pressed="saved ? 'true' : 'false'"
        :aria-label="heartLabel(product.name)"
        @click="toggleSaved"
      >
        <v-icon size="16" aria-hidden="true">heart</v-icon>
      </button>
    </div>

    <button
      v-if="quickAdd && !out"
      type="button"
      class="sf-bcard__add"
      :class="{ 'is-added': added }"
      :aria-label="addLabel"
      :aria-haspopup="addsDirectly(product, storefront.fitOf(product)) ? undefined : 'dialog'"
      @click="emit('quick-add', product, color?.name)"
    >
      <v-icon v-if="added" size="18" aria-hidden="true">check</v-icon>
      {{ added ? 'Added' : 'Add to cart' }}
    </button>
  </article>

  <article v-else-if="dense" class="sf-dcard" :class="{ 'is-sold-out': out }">
    <component :is="`h${headingLevel}`" class="sf-dcard__name">
      <StorefrontAnchor :href="href" class="sf-dcard__link">{{ product.name }}</StorefrontAnchor>
    </component>
    <p v-if="number" class="sf-dcard__number">Part # {{ number }}</p>
    <p v-else-if="choices" class="sf-dcard__number">{{ choices }}</p>
    <p v-if="fit" class="sf-dcard__fit" :class="`sf-dcard__fit--${fit.state}`">
      <v-icon size="16" class="sf-dcard__fit-icon" aria-hidden="true">{{ fit.icon }}</v-icon>
      <span class="sf-sr">{{ fit.label }}</span>
      <span aria-hidden="true">{{ fit.shown }}</span>
    </p>
    <p class="sf-dcard__stock" :class="`sf-dcard__stock--${stock.level}`">{{ stock.text }}</p>
    <p class="sf-dcard__price">
      <template v-if="price.compareAt">
        <span class="sf-dcard__sale"><span class="sf-sr">Sale price </span>{{ money(price.price) }}</span>
        <s class="sf-dcard__was"><span class="sf-sr">Usual price </span>{{ money(price.compareAt) }}</s>
      </template>
      <span v-else><template v-if="price.from">From </template>{{ money(price.price) }}</span>
    </p>

    <div class="sf-dcard__media">
      <img v-if="photo && !broken" :src="photo" alt="" class="sf-dcard__image" loading="lazy" @error="broken = true">
      <v-icon v-else size="44" class="sf-dcard__placeholder" aria-hidden="true">{{ CATEGORY_ICONS[product.category] ?? 'package' }}</v-icon>
      <span v-if="badge?.kind === 'sale'" class="sf-dcard__badge" aria-hidden="true">{{ badge.text }}</span>
    </div>

    <button
      v-if="quickAdd && !out"
      type="button"
      class="sf-dcard__add"
      :class="{ 'is-added': added }"
      :aria-label="addLabel"
      :aria-haspopup="addsDirectly(product, storefront.fitOf(product)) ? undefined : 'dialog'"
      @click="emit('quick-add', product, undefined)"
    >
      <v-icon size="18" aria-hidden="true">{{ added ? 'check' : 'shopping-cart' }}</v-icon>
      {{ added ? 'Added' : 'Add to cart' }}
    </button>
  </article>

  <article v-else class="sf-lcard" :class="{ 'is-sold-out': out }">
    <component :is="`h${headingLevel}`" class="sf-lcard__name">
      <StorefrontAnchor :href="href" class="sf-lcard__link">{{ product.name }}</StorefrontAnchor>
    </component>

    <p class="sf-lcard__price">
      <template v-if="price.compareAt">
        <span class="sf-lcard__sale"><span class="sf-sr">Sale price </span>{{ money(price.price) }}</span>
        <s class="sf-lcard__was"><span class="sf-sr">Usual price </span>{{ money(price.compareAt) }}</s>
      </template>
      <span v-else><template v-if="price.from">From </template>{{ money(price.price) }}</span>
    </p>

    <p v-if="colors.length > 1" class="sf-lcard__colors">
      <span class="sf-lcard__dots" aria-hidden="true">
        <span
          v-for="c in dots"
          :key="c.key"
          class="sf-lcard__dot"
          :class="{ 'is-shown': c.key === color?.key }"
          :style="{ '--sf-dot': c.hex ?? 'transparent' }"
          :title="c.name"
        />
        <span v-if="more > 0" class="sf-lcard__more">+{{ more }}</span>
      </span>
      <span class="sf-lcard__color-count" aria-hidden="true">{{ colors.length }} colors</span>
      <span class="sf-sr">Available in {{ colorNames }}</span>
    </p>

    <div class="sf-lcard__media">
      <img v-if="photo && !broken" :src="photo" alt="" class="sf-lcard__image" loading="lazy" @error="broken = true">
      <v-icon v-else size="44" class="sf-lcard__placeholder" aria-hidden="true">{{ CATEGORY_ICONS[product.category] ?? 'shirt' }}</v-icon>
      <span v-if="badge" class="sf-lcard__badge" :class="`sf-lcard__badge--${badge.kind}`" :aria-hidden="badge.kind === 'sale' ? 'true' : undefined">{{ badge.text }}</span>
      <button
        v-if="quickAdd && !out"
        type="button"
        class="sf-lcard__quick"
        :class="{ 'is-added': added }"
        :aria-label="`Quick add ${product.name}`"
        @click="emit('quick-add', product, color?.name)"
      >
        <v-icon size="20" aria-hidden="true">{{ added ? 'check' : 'plus' }}</v-icon>
        <span v-if="added" class="sf-lcard__quick-text" aria-hidden="true">Added</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours, fonts and
 * corners come from the store's theme (--sf-*); every painted surface sets its
 * own text colour. */
.sf-lcard {
  --sf-lcard-line: color-mix(in srgb, var(--sf-text, #121011) 14%, transparent);
  --sf-lcard-surface: var(--sf-surface, color-mix(in srgb, var(--sf-text, #121011) 5%, var(--sf-bg, #ffffff)));
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* The photo leads the card; in the reading order it follows the name and price. */
.sf-lcard__media {
  position: relative;
  order: -1;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 3 / 4;
  margin-bottom: 14px;
  overflow: hidden;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-lcard-surface);
  color: var(--sf-muted, #66625c);
}

.sf-lcard__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sf-lcard:hover .sf-lcard__image {
  transform: scale(1.03);
}

.is-sold-out .sf-lcard__image {
  opacity: 0.72;
}

.sf-lcard__name {
  margin: 0;
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  line-height: 21px;
}

.sf-lcard__link {
  color: var(--sf-text, #121011);
  text-decoration: none;
}

/* The name's hit area covers the card, so the photo opens the product too. */
.sf-lcard__link::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.sf-lcard:hover .sf-lcard__link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sf-lcard__link:focus-visible {
  outline: none;
}

.sf-lcard__link:focus-visible::after {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 4px;
}

.sf-lcard__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}

.sf-lcard__sale {
  color: var(--sf-badge-sale, #b3261e);
  font-weight: 500;
}

.sf-lcard__was {
  color: var(--sf-muted, #66625c);
}

.sf-lcard__colors {
  display: flex;
  align-items: center;
  min-height: 20px;
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--sf-muted, #66625c);
}

.sf-lcard__dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sf-lcard__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--sf-dot);
  /* A hairline so a white or cream dot shows on a light page. */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16);
}

.sf-lcard__dot.is-shown {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.16), 0 0 0 2px var(--sf-bg, #ffffff), 0 0 0 3px var(--sf-text, #121011);
}

.sf-lcard__more {
  margin-inline-start: 2px;
  font-variant-numeric: tabular-nums;
}

.sf-lcard__color-count {
  display: none;
}

.sf-lcard__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 3px 8px;
  border-radius: var(--sf-radius, 0);
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.02em;
}

.sf-lcard__badge--sale {
  background: var(--sf-badge-sale, #b3261e);
  color: var(--sf-on-badge-sale, #ffffff);
}

.sf-lcard__badge--new {
  background: var(--sf-badge-custom, #1a1a1a);
  color: var(--sf-on-badge-custom, #ffffff);
}

.sf-lcard__badge--sold-out {
  background: var(--sf-badge-sold-out, #66625c);
  color: var(--sf-on-badge-sold-out, #ffffff);
}

/* Quick add: above the card's link, in the photo's corner. */
.sf-lcard__quick {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12), 0 4px 14px rgba(0, 0, 0, 0.08);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}

.sf-lcard__quick:hover,
.sf-lcard__quick.is-added {
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff);
}

.sf-lcard__quick:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-lcard__quick-text {
  padding-inline-end: 4px;
}

.sf-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .sf-lcard__image,
  .sf-lcard__quick {
    transition: none;
  }

  .sf-lcard:hover .sf-lcard__image {
    transform: none;
  }
}

/* ── Boxed: the Figma product card (Lumos) ─────────────────────────────────
 * A framed card on the theme's card colour (--sf-card), its card corners
 * (--sf-card-radius) and shadow (--sf-card-shadow), a hairline in its divider
 * colour. The photo at 248:273 on the theme's surface, its top corners rounded;
 * the badge top-left, the heart top-right. Then the name (16px bold, two lines),
 * the price (16px; a sale in the sale colour with the "was" price struck) and a
 * full-width solid Add to cart at the card's foot, so a row of cards lines up.
 * Each fallback is the card's own value, for a theme that sets none of these. */
.sf-bcard {
  --sf-bcard-radius: var(--sf-card-radius, var(--sf-radius, 8px));
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--sf-divider, #e8e8e8);
  border-radius: var(--sf-bcard-radius);
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-text, #272727);
  box-shadow: var(--sf-card-shadow, none);
}

/* The photo leads the card; in the reading order it follows the name and price. */
.sf-bcard__media {
  position: relative;
  order: -1;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 248 / 273;
  overflow: hidden;
  border-radius: calc(var(--sf-bcard-radius) - 1px) calc(var(--sf-bcard-radius) - 1px) 0 0;
  background: var(--sf-surface, color-mix(in srgb, var(--sf-text, #272727) 4%, var(--sf-bg, #ffffff)));
  color: var(--sf-muted, #6d6d6d);
}

.sf-bcard__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.is-sold-out .sf-bcard__image {
  opacity: 0.6;
}

.sf-bcard__name {
  display: -webkit-box;
  margin: 12px 12px 0;
  overflow: hidden;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.sf-bcard__link {
  color: var(--sf-text, #272727);
  text-decoration: none;
}

/* The name's hit area covers the card, so the photo opens the product too. */
.sf-bcard__link::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: var(--sf-bcard-radius);
}

.sf-bcard:hover .sf-bcard__link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sf-bcard__link:focus-visible {
  outline: none;
}

.sf-bcard__link:focus-visible::after {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-bcard__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  margin: 6px 12px 16px;
  font-size: 16px;
  line-height: 22px;
  font-variant-numeric: tabular-nums;
}

.sf-bcard__sale {
  color: var(--sf-badge-sale, #b3261e);
  font-weight: 600;
}

.sf-bcard__was {
  color: var(--sf-muted, #6d6d6d);
  font-size: 14px;
}

/* A small pill, top-left: 10px uppercase on the badge's own colour. */
.sf-bcard__badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.sf-bcard__badge--sale {
  background: var(--sf-badge-sale, #b3261e);
  color: var(--sf-on-badge-sale, #ffffff);
}

.sf-bcard__badge--new {
  background: var(--sf-badge-custom, var(--sf-accent, #1a1a1a));
  color: var(--sf-on-badge-custom, #ffffff);
}

.sf-bcard__badge--sold-out {
  background: var(--sf-badge-sold-out, #66625c);
  color: var(--sf-on-badge-sold-out, #ffffff);
}

/* The wishlist heart: a 36px white disc, top-right, above the card's link. Its hit area is
   44px; hover fills it with the button colour; saved, the heart is filled in the accent. */
.sf-bcard__heart {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-text, #272727);
  box-shadow: 0 2px 4px -2px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease;
}

.sf-bcard__heart::after {
  content: '';
  position: absolute;
  inset: -4px;
}

.sf-bcard__heart:hover {
  background: var(--sf-button-bg, var(--sf-accent, #1a1a1a));
  color: var(--sf-button-ink, #ffffff);
}

.sf-bcard__heart.is-saved {
  color: var(--sf-accent, #1a1a1a);
}

.sf-bcard__heart.is-saved :deep(svg) {
  fill: currentColor;
}

.sf-bcard__heart.is-saved:hover {
  background: var(--sf-card, var(--sf-bg, #ffffff));
  color: var(--sf-badge-sale, #b3261e);
}

.sf-bcard__heart:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

/* The store's solid button, the card's width, at its foot (the space left goes above it), above the card's link. */
.sf-bcard__add {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  margin: auto 12px 12px;
  padding: 0 16px;
  border: 1px solid var(--sf-button-border, var(--sf-button-bg, var(--sf-brand, #121011)));
  border-radius: var(--sf-button-radius, var(--sf-radius, 4px));
  background: var(--sf-button-bg, var(--sf-brand, #121011));
  color: var(--sf-button-ink, var(--sf-on-brand, #ffffff));
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-transform: var(--sf-button-case, none);
  cursor: pointer;
  transition: background-color 200ms ease, border-color 200ms ease;
}

.sf-bcard__add:hover,
.sf-bcard__add.is-added {
  border-color: var(--sf-button-hover, var(--sf-button-bg, var(--sf-brand, #121011)));
  background: var(--sf-button-hover, var(--sf-button-bg, var(--sf-brand, #121011)));
}

.sf-bcard__add:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .sf-bcard__heart,
  .sf-bcard__add {
    transition: none;
  }
}

/* A phone: two cards to a row, so the type and the button come down a step. */
@media (max-width: 600px) {
  .sf-bcard__name {
    margin: 10px 10px 0;
    font-size: 14px;
    line-height: 18px;
  }

  .sf-bcard__price {
    margin: 4px 10px 12px;
    font-size: 14px;
    line-height: 20px;
  }

  .sf-bcard__was {
    font-size: 13px;
  }

  .sf-bcard__add {
    margin: auto 10px 10px;
    padding: 0 8px;
    font-size: 13px;
  }
}

/* ── Dense: a part ─────────────────────────────────────────────────────────
 * A square photo on the theme's surface, then name, part number, fit, stock,
 * price and the store's button, the button at the foot of the card so a row of
 * cards lines up. The fit badge uses the fixed pairs of StorefrontFitBanner, so a
 * fit reads the same on every store and every page; each ink passes 4.5:1 on its
 * fill. Part numbers and prices use tabular figures. */
.sf-dcard {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-width: 0;
}

.sf-dcard__media {
  position: relative;
  order: -1;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  margin-bottom: 8px;
  overflow: hidden;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-surface, color-mix(in srgb, var(--sf-text, #121011) 5%, var(--sf-bg, #ffffff)));
  color: var(--sf-muted, #66625c);
}

.sf-dcard__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.is-sold-out .sf-dcard__image {
  opacity: 0.6;
}

.sf-dcard__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 8px;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-badge-sale, #b3261e);
  color: var(--sf-on-badge-sale, #ffffff);
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.sf-dcard__number,
.sf-dcard__fit,
.sf-dcard__stock,
.sf-dcard__price {
  margin: 0;
}

.sf-dcard__name {
  margin: 0;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 21px;
}

.sf-dcard__link {
  color: var(--sf-text, #121011);
  text-decoration: none;
}

/* The name's hit area covers the card, so the photo opens the part too. */
.sf-dcard__link::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.sf-dcard:hover .sf-dcard__link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sf-dcard__link:focus-visible {
  outline: none;
}

.sf-dcard__link:focus-visible::after {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 4px;
}

.sf-dcard__number {
  color: var(--sf-muted, #66625c);
  font-size: 13px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.sf-dcard__fit {
  --sf-dcard-fit-ink: #3d434a;
  --sf-dcard-fit-fill: #eceef1;
  display: inline-flex;
  align-items: flex-start;
  align-self: flex-start;
  gap: 6px;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: var(--sf-radius, 0);
  background: var(--sf-dcard-fit-fill);
  color: var(--sf-dcard-fit-ink);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.sf-dcard__fit--fits {
  --sf-dcard-fit-ink: #146c2e;
  --sf-dcard-fit-fill: #e6f4ea;
}

.sf-dcard__fit--no-fit {
  --sf-dcard-fit-ink: #8a4b00;
  --sf-dcard-fit-fill: #fdf0d5;
}

.sf-dcard__fit-icon {
  flex: none;
  margin-top: 1px;
  color: inherit;
}

.sf-dcard__stock {
  font-size: 13px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}

.sf-dcard__stock--in {
  color: var(--sf-text, #121011);
}

.sf-dcard__stock--low {
  color: var(--sf-text, #121011);
  font-weight: 600;
}

.sf-dcard__stock--out {
  color: var(--sf-muted, #66625c);
}

.sf-dcard__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  font-variant-numeric: tabular-nums;
}

.sf-dcard__sale {
  color: var(--sf-badge-sale, #b3261e);
}

.sf-dcard__was {
  color: var(--sf-muted, #66625c);
  font-size: 14px;
  font-weight: 400;
}

/* The store's button, above the card's link, at the card's foot. */
.sf-dcard__add {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  margin-top: auto;
  padding: 0 16px;
  border: 1px solid var(--sf-button-border, var(--sf-brand, #121011));
  border-radius: var(--sf-button-radius, var(--sf-radius, 0));
  background: var(--sf-button-bg, var(--sf-brand, #121011));
  color: var(--sf-button-ink, var(--sf-on-brand, #ffffff));
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.sf-dcard__add:hover,
.sf-dcard__add.is-added {
  filter: brightness(0.94);
}

.sf-dcard__add:focus-visible {
  outline: 2px solid var(--sf-text, #121011);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .sf-dcard__name {
    font-size: 15px;
    line-height: 20px;
  }

  .sf-dcard__fit {
    font-size: 12px;
    line-height: 16px;
  }

  .sf-dcard__price {
    font-size: 16px;
  }

  .sf-dcard__add {
    padding: 0 10px;
    font-size: 14px;
  }
}

/* A phone: two cards to a row, so the dots give way to "3 colors" and the "+" is a full touch target. */
@media (max-width: 600px) {
  .sf-lcard__media {
    margin-bottom: 10px;
  }

  .sf-lcard__name {
    font-size: 14px;
    line-height: 20px;
  }

  .sf-lcard__dots {
    display: none;
  }

  .sf-lcard__color-count {
    display: inline;
  }

  .sf-lcard__badge {
    top: 8px;
    left: 8px;
  }

  .sf-lcard__quick {
    right: 6px;
    bottom: 6px;
    min-width: 44px;
    height: 44px;
  }
}
</style>
