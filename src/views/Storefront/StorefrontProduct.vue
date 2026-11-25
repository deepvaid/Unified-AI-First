<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { toHandle } from '@/stores/useProductExtras'
import { MAX_QTY, useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { toDecimal } from '@/maropay/money'
import { hasPriceRange } from '@/storefront/catalog'
import { ONE_TIME, defaultOptionId, linePlan, purchaseOptions } from '@/subscriptions/plans'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontExpressButtons from './StorefrontExpressButtons.vue'
import StorefrontNotFound from './StorefrontNotFound.vue'
import StorefrontPayMark from './StorefrontPayMark.vue'
import StorefrontProductCard from './StorefrontProductCard.vue'
import StorefrontPurchaseOptions from './StorefrontPurchaseOptions.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, inStock, priceOf, productFromHandle, relatedProducts, storefrontProducts } from './storefrontCatalog'
import { useMerchandisingStore } from '@/stores/useMerchandising'
import { recommendFor, recommendationHeading } from '@/storefront/search'
import StorefrontProductPage from './product/StorefrontProductPage.vue'

// A product page (/products/:handle). Everything below the price follows the
// store's payment setup in Store › Payments: instalment lines for approved buy
// now, pay later methods, express buttons, and the methods the store accepts.
// A theme with the sections drawing (Northfold, Torqline) draws its product
// template instead (./product/StorefrontProductPage.vue); this page's own drawing
// below is the classic one every other theme keeps.

const route = useRoute()
const router = useRouter()
const storefront = inject(STOREFRONT)!
const { sectionsDrawing } = storefront
const commerce = useCommerceStore()
const cart = useStorefrontCartStore()
const subscriptions = useSubscriptionsStore()

const channelId = computed(() => storefront.channel.value.id)
const product = computed(() => productFromHandle(commerce.products, channelId.value, String(route.params.handle ?? '')))
const unit = computed(() => (product.value ? priceOf(product.value, storefront.currency.value) : null))
// Instalments are quoted on one item, as stores do.
const offer = computed(() => (unit.value ? storefront.offerFor(unit.value) : null))
const formatMoney = storefront.formatMoney
/** Until the variant picker (slice S5) the page sells the lowest-priced variant, so a range reads "From". */
const priceRange = computed(() => (product.value ? hasPriceRange(product.value) : false))
const subtitle = computed(() => product.value?.detail?.subtitle.trim())
const collection = computed(() => product.value?.collections[0] ?? null)
// The row under the product. Once the store is connected to Merchandise Cloud, its
// product-page recommendation engine chooses and names it; otherwise it is the first
// products of the same category, as before.
const engine = computed(() => (storefront.searchable.value ? useMerchandisingStore().productEngineFor(channelId.value) : undefined))
const related = computed(() => {
  if (!product.value) return []
  return engine.value
    ? recommendFor(product.value, storefrontProducts(commerce.products, channelId.value), engine.value)
    : relatedProducts(commerce.products, channelId.value, product.value)
})
const relatedHeading = computed(() => (engine.value && product.value ? recommendationHeading(engine.value.type, product.value.name) : 'You may also like'))
const available = computed(() => (product.value ? inStock(product.value) : false))
/** A product saved without a brand has "—" for one in the admin; shoppers see no brand line. */
const vendor = computed(() => {
  const name = product.value?.vendor.trim()
  return name && name !== '—' ? name : ''
})
const description = computed(() => {
  const p = product.value
  if (!p) return ''
  const written = p.detail?.description?.trim()
  if (written) return written
  // The stand-in line needs a brand to read as a sentence; without one the section is left out.
  return vendor.value ? `${p.name} from ${vendor.value}, part of our ${p.category} range. Free shipping on every order.` : ''
})

// How to buy it: on one of its subscription plans, or once. A product on no plan
// has only "once", and then the page shows no options at all.
const options = computed(() => (product.value && unit.value
  ? purchaseOptions(unit.value, subscriptions.offeredFor(channelId.value, product.value.id))
  : []))
const optionId = ref(ONE_TIME)
const option = computed(() => options.value.find((o) => o.id === optionId.value) ?? null)
// The chosen plan can go while the page is open (the merchant pauses it): fall back to the default.
watch(() => options.value.map((o) => o.id).join(), () => {
  if (!option.value) optionId.value = defaultOptionId(options.value)
})

const qty = ref(1)
const added = ref(false)
/** Which of the product's pictures the gallery shows large. */
const shown = ref(0)
// A product page opens on its preselected plan, with one item and its first picture.
watch(() => product.value?.id, () => {
  qty.value = 1
  added.value = false
  shown.value = 0
  optionId.value = defaultOptionId(options.value)
}, { immediate: true })
watch(optionId, () => {
  added.value = false
})
watch(qty, (value) => {
  if (!Number.isFinite(value) || value < 1) qty.value = 1
  else if (value > MAX_QTY) qty.value = MAX_QTY
})

function addToCart(): void {
  if (!product.value || !available.value) return
  const chosen = option.value
  cart.add(channelId.value, product.value, qty.value, chosen?.plan ? { plan: linePlan(chosen.plan), price: toDecimal(chosen.price) } : undefined)
  added.value = true
}

/** Express buys just this item, without touching the cart. */
function buyNow(methodId: string): void {
  if (!product.value) return
  void router.push({ path: storefront.link('/checkout'), query: { buy: String(product.value.id), qty: String(qty.value), express: methodId } })
}
</script>

<template>
  <StorefrontProductPage v-if="product && sectionsDrawing" :key="product.id" :product="product" />
  <div v-else-if="product && unit && offer" class="sf-pdp">
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
      <div v-if="product.imageUrls?.length" class="sf-pdp__gallery">
        <div class="sf-pdp__media">
          <img :src="product.imageUrls[shown] ?? product.imageUrls[0]" :alt="product.name" class="sf-pdp__image">
        </div>
        <ul v-if="product.imageUrls.length > 1" class="sf-pdp__thumbs" :aria-label="`Pictures of ${product.name}`">
          <li v-for="(url, index) in product.imageUrls" :key="url">
            <button
              type="button"
              class="sf-pdp__thumb"
              :class="{ 'sf-pdp__thumb--on': shown === index }"
              :aria-label="`Show picture ${index + 1} of ${product.imageUrls.length}`"
              :aria-current="shown === index ? 'true' : undefined"
              @click="shown = index"
            >
              <img :src="url" alt="">
            </button>
          </li>
        </ul>
      </div>
      <!-- Stands in for the product photographs. -->
      <div v-else class="sf-pdp__media" aria-hidden="true">
        <v-icon size="112">{{ CATEGORY_ICONS[product.category] ?? 'package' }}</v-icon>
      </div>

      <div class="sf-pdp__info">
        <p v-if="vendor" class="sf-pdp__vendor">{{ vendor }}</p>
        <h1 class="sf-pdp__title sf-heading-font">{{ product.name }}</h1>
        <p v-if="subtitle" class="sf-pdp__subtitle">{{ subtitle }}</p>
        <p class="sf-pdp__price"><template v-if="priceRange">From </template>{{ formatMoney(unit) }}</p>

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

        <StorefrontPurchaseOptions v-if="options.length > 1" v-model="optionId" :options="options" :format-money="formatMoney" />

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
            {{ !available ? 'Sold out' : option?.plan ? 'Add subscription to cart' : 'Add to cart' }}
          </button>
        </div>
        <p v-if="added" class="sf-pdp__added" role="status">
          <v-icon size="18">circle-check</v-icon>
          <span>Added to your cart.</span>
          <StorefrontAnchor href="/cart-page">View cart ({{ cart.count(channelId) }})</StorefrontAnchor>
        </p>

        <!-- Express buttons skip the checkout form, and with it the consent a subscription needs. -->
        <div v-if="offer.express.length && available && !option?.plan" class="sf-pdp__express">
          <p class="sf-or">or buy now with</p>
          <StorefrontExpressButtons :methods="offer.express" @pick="buyNow" />
        </div>

        <div v-if="offer.methods.length" class="sf-pdp__trust">
          <p class="sf-pdp__secure"><v-icon size="16">lock</v-icon> {{ offer.cardsVia === 'maropay' ? 'Secure checkout with Maropay' : 'Secure checkout' }}</p>
          <ul class="sf-marks" aria-label="Ways to pay">
            <li v-for="mark in offer.acceptedMarks" :key="mark"><StorefrontPayMark :mark="mark" /></li>
          </ul>
        </div>

        <section v-if="description" class="sf-pdp__desc" aria-labelledby="sf-pdp-desc">
          <h2 id="sf-pdp-desc" class="sf-pdp__desc-title">Description</h2>
          <p>{{ description }}</p>
        </section>
      </div>
    </div>

    <section v-if="related.length" class="sf-pdp__related" aria-labelledby="sf-pdp-related">
      <h2 id="sf-pdp-related" class="sf-section-title">{{ relatedHeading }}</h2>
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

/* A product with pictures: the large one, then a thumbnail for each. The pair stays in view together. */
.sf-pdp__gallery {
  position: sticky;
  top: 24px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.sf-pdp__gallery .sf-pdp__media {
  position: static;
}

.sf-pdp__thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-pdp__thumb {
  display: block;
  width: 72px;
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: none;
  overflow: hidden;
  cursor: pointer;
}

.sf-pdp__thumb--on {
  border-color: var(--sf-text, #121011);
}

.sf-pdp__thumb:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-pdp__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.sf-pdp__image {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.sf-pdp__subtitle {
  margin: -8px 0 0;
  color: var(--sf-muted, #5f5f5f);
  font-size: 16px;
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

  .sf-pdp__media,
  .sf-pdp__gallery {
    position: static;
  }

  .sf-pdp__title {
    font-size: 28px;
  }
}
</style>
