<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { parseDecimal } from '@/maropay/money'
import type { Product } from '@/stores/useCommerce'
import { cardPhoto, cardPrice, chosenColor, colorsOf, isNewArrival, soldOut } from '@/storefront/listing'
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
}>(), {
  colorKeys: () => [],
  quickAdd: true,
  added: false,
  showNew: true,
  headingLevel: 3,
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
</script>

<template>
  <article class="sf-lcard" :class="{ 'is-sold-out': out }">
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
  outline: 2px solid var(--sf-accent, #2563eb);
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
  outline: 2px solid var(--sf-accent, #2563eb);
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
