<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { Product } from '@/stores/useCommerce'
import { useCommerceStore } from '@/stores/useCommerce'
import { useStorefrontWishlistStore } from '@/stores/useStorefrontWishlist'
import { gridSettings } from '@/storefront/listing'
import { savedCountText } from '@/storefront/wishlist'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontListingCard from './StorefrontListingCard.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import StorefrontQuickAdd from './StorefrontQuickAdd.vue'
import { STOREFRONT } from './storefrontContext'
import { storefrontProducts } from './storefrontCatalog'

// The shopper's wishlist (/wishlist) on a store that has one (Lumos): the products they
// saved with a heart, newest first, as Boxed cards with their heart and Add to cart
// (quick add when there is a choice to make). It is kept in this browser, per store
// (useStorefrontWishlist), and the page says so. A product the store no longer sells is
// left out. Pressing a heart here takes the product off: its card goes, focus moves to
// the heart of the card now in its place (or the title once none is left), and screen
// readers hear "Removed from your wishlist · …". With nothing saved, an empty state
// leads to every product. Any other store has no wishlist: this address is its 404 page.

const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const wishlist = useStorefrontWishlistStore()

const channelId = computed(() => storefront.channel.value.id)
const products = computed<Product[]>(() => {
  const sold = new Map(storefrontProducts(commerce.products, channelId.value).map((product) => [product.id, product]))
  return wishlist.idsFor(channelId.value).map((id) => sold.get(id)).filter((product): product is Product => !!product)
})
const grid = computed(() => gridSettings(storefront.theme.value?.templates.collection))

// ── A card taken off: focus moves on ──────────────────────────────────────
const title = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
watch(() => products.value.map((product) => product.id), async (now, before) => {
  const gone = before.findIndex((id) => !now.includes(id))
  if (gone < 0) return
  await nextTick()
  // Only when the heart that was pressed took focus with it.
  if (document.activeElement && document.activeElement !== document.body) return
  const hearts = [...(list.value?.querySelectorAll<HTMLElement>('.sf-bcard__heart') ?? [])]
  ;(hearts[Math.min(gone, hearts.length - 1)] ?? title.value)?.focus()
})

// ── Quick add (as the collection page has it) ─────────────────────────────
const quickAdd = ref<InstanceType<typeof StorefrontQuickAdd> | null>(null)
/** Cards whose product was just added straight from the card: their button reads "Added" for a moment. */
const justAdded = ref<number[]>([])
const timers = new Map<number, number>()

function onAdded(product: Product): void {
  justAdded.value = [...justAdded.value.filter((id) => id !== product.id), product.id]
  window.clearTimeout(timers.get(product.id))
  timers.set(product.id, window.setTimeout(() => {
    justAdded.value = justAdded.value.filter((id) => id !== product.id)
    timers.delete(product.id)
  }, 2000))
}
onBeforeUnmount(() => {
  for (const timer of timers.values()) window.clearTimeout(timer)
})
</script>

<template>
  <StorefrontNotFound v-if="!storefront.wishlist.value" />
  <div v-else class="sf-wish">
    <header class="sf-wish__head">
      <h1 ref="title" class="sf-wish__title" tabindex="-1">Wishlist</h1>
      <p v-if="products.length" class="sf-wish__count">{{ savedCountText(products.length) }} in this browser</p>
    </header>

    <ul v-if="products.length" ref="list" class="sf-wish__grid" role="list">
      <li v-for="product in products" :key="product.id">
        <StorefrontListingCard
          :product="product"
          card-style="Boxed"
          :heading-level="2"
          :quick-add="grid.quickAdd"
          :added="justAdded.includes(product.id)"
          @quick-add="(p, color) => quickAdd?.start(p, color)"
        />
      </li>
    </ul>

    <div v-else class="sf-wish__empty">
      <span class="sf-wish__disc" aria-hidden="true">
        <v-icon size="28">heart</v-icon>
      </span>
      <h2 class="sf-wish__empty-title">Nothing saved yet</h2>
      <p class="sf-wish__empty-text">Tap the heart on any product to save it here. Your wishlist is kept in this browser.</p>
      <StorefrontAnchor href="/collections/all" class="sf-button">Shop all</StorefrontAnchor>
    </div>

    <StorefrontQuickAdd v-if="grid.quickAdd" ref="quickAdd" @added="onAdded" />
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Colours, fonts and
 * corners come from the store's theme (--sf-*); the page sits on its measure and
 * gutter (--sf-measure, --sf-gutter), as the collection page does. */
.sf-wish {
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 48px var(--sf-gutter, 24px) 24px;
}

.sf-wish__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.sf-wish__title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: var(--sf-section-title, 40px);
  font-weight: var(--sf-heading-weight, 400);
  line-height: 1.15;
  text-transform: var(--sf-heading-case, none);
}

.sf-wish__title:focus {
  outline: none;
}

.sf-wish__count {
  margin: 0;
  color: var(--sf-muted, #66625c);
  font-size: 16px;
  line-height: 24px;
}

.sf-wish__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Centred, as the theme's empty states are: a heart on the theme's tint, a heading, a line and the way back to shopping. */
.sf-wish__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 440px;
  margin: 0 auto;
  padding: 32px 0 48px;
  text-align: center;
}

.sf-wish__disc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  border-radius: 50%;
  background: var(--sf-tint, color-mix(in srgb, var(--sf-accent, #121011) 9%, var(--sf-bg, #ffffff)));
  color: var(--sf-accent, #121011);
}

.sf-wish__empty-title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 20px;
  font-weight: var(--sf-heading-weight, 500);
  line-height: 28px;
  text-transform: var(--sf-heading-case, none);
}

.sf-wish__empty-text {
  max-width: 390px;
  margin: 8px 0 24px;
  color: var(--sf-muted, #66625c);
  font-size: 15px;
  line-height: 22px;
}

@media (max-width: 1023px) {
  .sf-wish__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .sf-wish {
    padding-top: 32px;
  }

  .sf-wish__head {
    margin-bottom: 24px;
  }

  .sf-wish__title {
    font-size: var(--sf-section-title-sm, 28px);
  }

  .sf-wish__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}
</style>
