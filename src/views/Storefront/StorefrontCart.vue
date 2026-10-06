<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { formatMoney } from '@/maropay/money'
import { useCommerceStore } from '@/stores/useCommerce'
import { MAX_QTY, lineTotal, useStorefrontCartStore } from '@/stores/useStorefrontCart'
import type { CartLine } from '@/stores/useStorefrontCart'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontExpressButtons from './StorefrontExpressButtons.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, productHandle } from './storefrontCatalog'

// The storefront cart (/cart-page): its lines, the totals, and the ways to pay
// the store offers — Checkout, plus express buttons when the merchant shows them
// (the accepted marks are in the footer).
// The empty state's wording is the real page's.

const router = useRouter()
const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const cart = useStorefrontCartStore()

const channelId = computed(() => storefront.channel.value.id)
const currency = computed(() => storefront.currency.value)
const lines = computed(() => cart.linesFor(channelId.value))
const subtotal = computed(() => cart.subtotal(channelId.value, currency.value))
const offer = computed(() => storefront.offerFor(subtotal.value))

function iconFor(line: CartLine): string {
  const category = commerce.products.find((p) => p.id === line.productId)?.category
  return (category && CATEGORY_ICONS[category]) || 'package'
}

function setQty(line: CartLine, value: number): void {
  if (Number.isFinite(value)) cart.setQty(channelId.value, line.productId, value)
}

function checkout(express?: string): void {
  void router.push({ path: storefront.link('/checkout'), query: express ? { express } : {} })
}
</script>

<template>
  <div class="sf-cart">
    <h1 class="sf-page-title sf-cart__title">Cart</h1>

    <div v-if="!lines.length" class="sf-cart__empty">
      <p class="sf-cart__empty-title">Your Shopping Cart is Empty!</p>
      <StorefrontAnchor href="/" class="sf-button">Start Shopping!</StorefrontAnchor>
    </div>

    <div v-else class="sf-cart__layout">
      <section class="sf-cart__lines" aria-label="Items in your cart">
        <ul>
          <li v-for="line in lines" :key="line.productId" class="sf-cart__line">
            <span class="sf-cart__thumb" aria-hidden="true"><v-icon size="28">{{ iconFor(line) }}</v-icon></span>
            <div class="sf-cart__item">
              <StorefrontAnchor :href="`/products/${productHandle({ name: line.name, id: line.productId })}`" class="sf-cart__name">{{ line.name }}</StorefrontAnchor>
              <span class="sf-muted">{{ formatMoney(lineTotal({ price: line.price, qty: 1 }, currency)) }} each</span>
            </div>
            <div class="sf-qty sf-qty--sm" role="group" :aria-label="`Quantity of ${line.name}`">
              <button type="button" :aria-label="`Decrease quantity of ${line.name}`" @click="setQty(line, line.qty - 1)">
                <v-icon size="14">minus</v-icon>
              </button>
              <input
                :value="line.qty"
                type="number"
                inputmode="numeric"
                min="1"
                :max="MAX_QTY"
                aria-label="Quantity"
                @change="setQty(line, Number(($event.target as HTMLInputElement).value))"
              >
              <button type="button" :aria-label="`Increase quantity of ${line.name}`" :disabled="line.qty >= MAX_QTY" @click="setQty(line, line.qty + 1)">
                <v-icon size="14">plus</v-icon>
              </button>
            </div>
            <span class="sf-cart__total">{{ formatMoney(lineTotal(line, currency)) }}</span>
            <button type="button" class="sf-icon-btn" :aria-label="`Remove ${line.name}`" @click="cart.remove(channelId, line.productId)">
              <v-icon size="18">trash-2</v-icon>
            </button>
          </li>
        </ul>
        <StorefrontAnchor href="/collections/all" class="sf-cart__continue">
          <v-icon size="16">arrow-left</v-icon> Continue shopping
        </StorefrontAnchor>
      </section>

      <aside class="sf-cart__summary" aria-label="Order summary">
        <dl class="sf-cart__sums">
          <div><dt>Subtotal</dt><dd>{{ formatMoney(subtotal) }}</dd></div>
          <div><dt>Shipping</dt><dd>Free</dd></div>
          <div class="sf-cart__grand"><dt>Total</dt><dd>{{ formatMoney(subtotal) }}</dd></div>
        </dl>
        <p v-if="offer.payIn4.labels.length" class="sf-cart__instalments sf-muted">
          or 4 interest-free payments of {{ formatMoney(offer.payIn4.amount) }} with {{ offer.payIn4.labels.join(' or ') }}
        </p>
        <button type="button" class="sf-button sf-button--block" @click="checkout()">
          <v-icon size="16">lock</v-icon> Checkout
        </button>
        <template v-if="offer.express.length">
          <p class="sf-or">or</p>
          <StorefrontExpressButtons :methods="offer.express" @pick="checkout" />
        </template>
      </aside>
    </div>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-cart {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 0;
}

.sf-cart__title {
  margin-bottom: 40px;
}

.sf-cart__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 0;
}

.sf-cart__empty-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sf-cart__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 48px;
  align-items: start;
}

.sf-cart__lines ul {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--sf-divider, #f0f0f0);
}

.sf-cart__line {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto 96px auto;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid var(--sf-divider, #f0f0f0);
}

.sf-cart__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  aspect-ratio: 1;
  border-radius: 6px;
  background: linear-gradient(160deg, #f4f4f2 0%, #e6e5e1 100%);
  color: #8a8780;
}

.sf-cart__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  font-size: 14px;
}

.sf-cart__name {
  font-size: 15px;
  font-weight: 600;
}

.sf-cart__total {
  text-align: right;
  font-weight: 600;
}

.sf-cart__continue {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 14px;
}

.sf-cart__summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  background: #f7f7f5;
}

.sf-cart__sums {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
}

.sf-cart__sums div {
  display: flex;
  justify-content: space-between;
}

.sf-cart__sums dd {
  margin: 0;
}

.sf-cart__grand {
  padding-top: 12px;
  border-top: 1px solid #e3e3e0;
  font-size: 18px;
  font-weight: 700;
}

.sf-cart__instalments {
  margin: -8px 0 0;
  font-size: 13px;
}

@media (max-width: 900px) {
  .sf-cart__layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .sf-cart__line {
    grid-template-columns: 56px minmax(0, 1fr) auto;
    grid-template-areas: 'thumb item remove' 'thumb qty total';
    row-gap: 12px;
  }

  .sf-cart__thumb { grid-area: thumb; width: 56px; }
  .sf-cart__item { grid-area: item; }
  .sf-cart__line .sf-qty { grid-area: qty; justify-self: start; }
  .sf-cart__total { grid-area: total; }
  .sf-cart__line .sf-icon-btn { grid-area: remove; }
}
</style>
