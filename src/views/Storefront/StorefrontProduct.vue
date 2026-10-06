<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatMoney } from '@/maropay/money'
import { useCommerceStore } from '@/stores/useCommerce'
import { toHandle } from '@/stores/useProductExtras'
import { MAX_QTY, useStorefrontCartStore } from '@/stores/useStorefrontCart'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontExpressButtons from './StorefrontExpressButtons.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import StorefrontPayMark from './StorefrontPayMark.vue'
import StorefrontProductCard from './StorefrontProductCard.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, inStock, priceOf, productFromHandle, relatedProducts } from './storefrontCatalog'

// A product page (/products/:handle). Everything below the price follows the
// store's payment setup in Store › Payments: instalment lines for approved buy
// now, pay later methods, express buttons, and the methods the store accepts.

const route = useRoute()
const router = useRouter()
const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const cart = useStorefrontCartStore()

const product = computed(() => productFromHandle(commerce.products, String(route.params.handle ?? '')))
const channelId = computed(() => storefront.channel.value.id)
const unit = computed(() => (product.value ? priceOf(product.value, storefront.currency.value) : null))
// Instalments are quoted on one item, as stores do.
const offer = computed(() => (unit.value ? storefront.offerFor(unit.value) : null))
const collection = computed(() => product.value?.collections[0] ?? null)
const related = computed(() => (product.value ? relatedProducts(commerce.products, product.value) : []))
const available = computed(() => (product.value ? inStock(product.value) : false))
const description = computed(() => {
  const p = product.value
  if (!p) return ''
  return p.detail?.description?.trim() || `${p.name} from ${p.vendor}, part of our ${p.category} range. Free shipping on every order.`
})

const qty = ref(1)
const added = ref(false)
watch(product, () => {
  qty.value = 1
  added.value = false
})
watch(qty, (value) => {
  if (!Number.isFinite(value) || value < 1) qty.value = 1
  else if (value > MAX_QTY) qty.value = MAX_QTY
})

function addToCart(): void {
  if (!product.value || !available.value) return
  cart.add(channelId.value, product.value, qty.value)
  added.value = true
}

/** Express buys just this item, without touching the cart. */
function buyNow(methodId: string): void {
  if (!product.value) return
  void router.push({ path: storefront.link('/checkout'), query: { buy: String(product.value.id), qty: String(qty.value), express: methodId } })
}
</script>

<template>
  <div v-if="product && unit && offer" class="sf-pdp">
    <nav class="sf-crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">›</span>
      <template v-if="collection">
        <StorefrontAnchor :href="`/collections/${toHandle(collection)}`">{{ collection }}</StorefrontAnchor>
        <span aria-hidden="true">›</span>
      </template>
      <span aria-current="page">{{ product.name }}</span>
    </nav>

    <div class="sf-pdp__main">
      <!-- Stands in for the product photographs. -->
      <div class="sf-pdp__media" aria-hidden="true">
        <v-icon size="112">{{ CATEGORY_ICONS[product.category] ?? 'package' }}</v-icon>
      </div>

      <div class="sf-pdp__info">
        <p class="sf-pdp__vendor">{{ product.vendor }}</p>
        <h1 class="sf-pdp__title sf-heading-font">{{ product.name }}</h1>
        <p class="sf-pdp__price">{{ formatMoney(unit) }}</p>

        <p v-if="offer.payIn4.labels.length" class="sf-pdp__instalments">
          <span>or 4 interest-free payments of <strong>{{ formatMoney(offer.payIn4.amount) }}</strong> with</span>
          <template v-for="(label, index) in offer.payIn4.labels" :key="label">
            <span v-if="index" class="sf-muted">or</span>
            <StorefrontPayMark :mark="label" />
          </template>
        </p>
        <p v-if="offer.monthly.labels.length" class="sf-pdp__instalments">
          <span>or from <strong>{{ formatMoney(offer.monthly.amount) }}/mo</strong> with</span>
          <StorefrontPayMark v-for="label in offer.monthly.labels" :key="label" :mark="label" />
        </p>

        <p class="sf-pdp__stock" :class="{ 'sf-pdp__stock--out': !available }">
          <span class="sf-pdp__dot" aria-hidden="true" />
          {{ available ? 'In stock, ready to ship' : 'Sold out' }}
        </p>

        <div class="sf-pdp__buy">
          <div class="sf-qty" role="group" :aria-label="`Quantity of ${product.name}`">
            <button type="button" aria-label="Decrease quantity" :disabled="qty <= 1 || !available" @click="qty--">
              <v-icon size="16">minus</v-icon>
            </button>
            <input v-model.number="qty" type="number" inputmode="numeric" min="1" :max="MAX_QTY" aria-label="Quantity" :disabled="!available">
            <button type="button" aria-label="Increase quantity" :disabled="qty >= MAX_QTY || !available" @click="qty++">
              <v-icon size="16">plus</v-icon>
            </button>
          </div>
          <button type="button" class="sf-button sf-pdp__add" :disabled="!available" @click="addToCart">
            {{ available ? 'Add to cart' : 'Sold out' }}
          </button>
        </div>
        <p v-if="added" class="sf-pdp__added" role="status">
          <v-icon size="18">circle-check</v-icon>
          <span>Added to your cart.</span>
          <StorefrontAnchor href="/cart-page">View cart ({{ cart.count(channelId) }})</StorefrontAnchor>
        </p>

        <div v-if="offer.express.length && available" class="sf-pdp__express">
          <p class="sf-or">or buy now with</p>
          <StorefrontExpressButtons :methods="offer.express" @pick="buyNow" />
        </div>

        <div v-if="offer.live" class="sf-pdp__trust">
          <p class="sf-pdp__secure"><v-icon size="16">lock</v-icon> Secure checkout with Maropay</p>
          <ul class="sf-marks" aria-label="Ways to pay">
            <li v-for="mark in offer.acceptedMarks" :key="mark"><StorefrontPayMark :mark="mark" /></li>
          </ul>
        </div>

        <section class="sf-pdp__desc" aria-labelledby="sf-pdp-desc">
          <h2 id="sf-pdp-desc" class="sf-pdp__desc-title">Description</h2>
          <p>{{ description }}</p>
        </section>
      </div>
    </div>

    <section v-if="related.length" class="sf-pdp__related" aria-labelledby="sf-pdp-related">
      <h2 id="sf-pdp-related" class="sf-section-title">You may also like</h2>
      <div class="sf-grid">
        <StorefrontProductCard v-for="item in related" :key="item.id" :product="item" />
      </div>
    </section>
  </div>
  <StorefrontNotFound v-else />
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-pdp {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 0;
}

.sf-pdp__main {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 48px;
  margin-top: 24px;
}

.sf-pdp__media {
  position: sticky;
  top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 8px;
  background: linear-gradient(160deg, #f4f4f2 0%, #e6e5e1 100%);
  color: #8a8780;
}

.sf-pdp__info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.sf-pdp__info > p {
  margin: 0;
}

.sf-pdp__vendor {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--sf-muted, #5f5f5f);
}

.sf-pdp__title {
  margin: -8px 0 0;
  font-size: 34px;
  line-height: 1.2;
  font-weight: 700;
}

.sf-pdp__price {
  font-size: 24px;
  font-weight: 600;
}

.sf-pdp__instalments {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: -8px !important;
  font-size: 14px;
}

.sf-pdp__stock {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.sf-pdp__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2e7d32;
}

.sf-pdp__stock--out .sf-pdp__dot {
  background: #9e9e9e;
}

.sf-pdp__buy {
  display: flex;
  gap: 12px;
}

.sf-pdp__add {
  flex: 1;
}

.sf-pdp__added {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2e7d32;
}

.sf-pdp__added a {
  color: var(--sf-text, #121011);
  text-decoration: underline;
}

.sf-pdp__express {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sf-pdp__trust {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 8px;
  background: #f7f7f5;
}

.sf-pdp__secure {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.sf-pdp__desc {
  padding-top: 16px;
  border-top: 1px solid var(--sf-divider, #f0f0f0);
}

.sf-pdp__desc-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
}

.sf-pdp__desc p {
  margin: 0;
}

.sf-pdp__related {
  margin-top: 64px;
}

@media (max-width: 900px) {
  .sf-pdp__main {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .sf-pdp__media {
    position: static;
  }

  .sf-pdp__title {
    font-size: 28px;
  }
}
</style>
