<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/useCommerce'
import { lineDetailText, lineImage, lineProductQuery, lineVariantText, withQuery } from '@/storefront/shopperOrders'
import { MAX_QTY, lineKey, lineTotal, useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { deliverySummary, recurringCharges } from '@/subscriptions/plans'
import type { CartLine } from '@/stores/useStorefrontCart'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontDiscountCode from './StorefrontDiscountCode.vue'
import StorefrontExpressButtons from './StorefrontExpressButtons.vue'
import StorefrontLineText from './StorefrontLineText.vue'
import { useStorefrontDiscount } from './storefrontDiscount'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, productHandle } from './storefrontCatalog'

// The storefront cart (/cart-page): its lines, the totals, and the ways to pay
// the store offers — Checkout, plus express buttons when the merchant shows them
// (the accepted marks are in the footer). A line bought in a size or colour says
// which ("Size M · Black") and shows that colour's photo; changing its quantity
// keeps it (src/storefront/shopperOrders.ts). On a store that sells parts a line
// also names the part number and the vehicle it fit ("Front · Part # TQ-BRK-4471 ·
// Fits 2019 Ford F-150").
// The empty state's wording is the real page's; a theme on the sections drawing
// says it in sentence case and leads to the whole catalogue.

const router = useRouter()
const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const cart = useStorefrontCartStore()

const channelId = computed(() => storefront.channel.value.id)
const currency = computed(() => storefront.currency.value)
const lines = computed(() => cart.linesFor(channelId.value))
const subtotal = computed(() => cart.subtotal(channelId.value, currency.value))
// A campaign's code, when the store has one running. It lowers this order only.
const code = useStorefrontDiscount(() => lines.value, () => subtotal.value)
const total = computed(() => code.payable.value)
const offer = computed(() => storefront.offerFor(total.value))
/** What a subscription line charges again, and how often. */
const recurring = computed(() => recurringCharges(lines.value, (line) => lineTotal(line, currency.value)))

const formatMoney = storefront.formatMoney

function iconFor(line: CartLine): string {
  const category = commerce.products.find((p) => p.id === line.productId)?.category
  return (category && CATEGORY_ICONS[category]) || 'package'
}

function productOf(line: CartLine) {
  return commerce.products.find((p) => p.id === line.productId)
}

function imageFor(line: CartLine): string | undefined {
  return lineImage(productOf(line), line)
}

/** "Size M · Black"; empty for a product without a choice. */
function variantOf(line: CartLine): string {
  return lineVariantText(productOf(line), line)
}

/** Everything under the line's name: its variant, and on a store that sells parts its number and vehicle. */
function detailOf(line: CartLine): string {
  return lineDetailText(productOf(line), line, { partNumber: storefront.sellsParts.value })
}

/** The product's page, opened on the line's size and colour. */
function hrefOf(line: CartLine): string {
  return withQuery(`/products/${productHandle({ name: line.name, id: line.productId })}`, lineProductQuery(productOf(line), line))
}

/**
 * A line as its buttons name it: the same product bought once and on a plan are two
 * lines, and so are two sizes of a shirt; they must not sound alike.
 */
function nameOf(line: CartLine): string {
  const variant = variantOf(line)
  const name = variant ? `${line.name}, ${variant}` : line.name
  return line.plan ? `${name}, ${line.plan.name}` : name
}

const root = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)

/**
 * Takes a line out. Its row goes, so the keyboard moves to the next line's name (the
 * new last one when it was the last), or to the page's heading once the cart is empty,
 * and what went is said.
 */
async function removeLine(line: CartLine, index: number): Promise<void> {
  const name = nameOf(line)
  cart.remove(channelId.value, lineKey(line))
  await nextTick()
  const names = root.value?.querySelectorAll<HTMLElement>('.sf-cart__name') ?? []
  ;(names[Math.min(index, names.length - 1)] ?? title.value)?.focus()
  storefront.announce(`Removed ${name}.`)
}

function setQty(line: CartLine, value: number): void {
  if (Number.isFinite(value)) cart.setQty(channelId.value, lineKey(line), value)
}

function checkout(express?: string): void {
  void router.push({ path: storefront.link('/checkout'), query: express ? { express } : {} })
}
</script>

<template>
  <div ref="root" class="sf-cart">
    <h1 ref="title" class="sf-page-title sf-cart__title" tabindex="-1">Cart</h1>

    <div v-if="!lines.length" class="sf-cart__empty">
      <template v-if="storefront.sectionsDrawing.value">
        <p class="sf-cart__empty-title">Your cart is empty</p>
        <StorefrontAnchor href="/collections/all" class="sf-button">Start shopping</StorefrontAnchor>
      </template>
      <template v-else>
        <p class="sf-cart__empty-title">Your Shopping Cart is Empty!</p>
        <StorefrontAnchor href="/" class="sf-button">Start Shopping!</StorefrontAnchor>
      </template>
    </div>

    <div v-else class="sf-cart__layout">
      <section class="sf-cart__lines" aria-label="Items in your cart">
        <ul>
          <li v-for="(line, index) in lines" :key="lineKey(line)" class="sf-cart__line">
            <span class="sf-cart__thumb" aria-hidden="true">
              <img v-if="imageFor(line)" :src="imageFor(line)" alt="" class="sf-cart__image">
              <v-icon v-else size="28">{{ iconFor(line) }}</v-icon>
            </span>
            <div class="sf-cart__item">
              <StorefrontAnchor :href="hrefOf(line)" class="sf-cart__name">{{ line.name }}</StorefrontAnchor>
              <StorefrontLineText v-if="detailOf(line)" :text="detailOf(line)" :unbroken="storefront.sellsParts.value" class="sf-cart__variant" :class="{ 'sf-cart__variant--part': storefront.sellsParts.value }" />
              <span v-if="line.plan" class="sf-cart__plan">{{ line.plan.name }} · {{ deliverySummary(line.plan) }}</span>
              <span class="sf-muted">{{ formatMoney(lineTotal({ price: line.price, qty: 1 }, currency)) }} {{ line.plan ? 'per delivery' : 'each' }}</span>
            </div>
            <div class="sf-qty sf-qty--sm" role="group" :aria-label="`Quantity of ${nameOf(line)}`">
              <button type="button" :aria-label="`Decrease quantity of ${nameOf(line)}`" @click="setQty(line, line.qty - 1)">
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
              <button type="button" :aria-label="`Increase quantity of ${nameOf(line)}`" :disabled="line.qty >= MAX_QTY" @click="setQty(line, line.qty + 1)">
                <v-icon size="14">plus</v-icon>
              </button>
            </div>
            <span class="sf-cart__total">{{ formatMoney(lineTotal(line, currency)) }}</span>
            <button type="button" class="sf-icon-btn" :aria-label="`Remove ${nameOf(line)}`" @click="removeLine(line, index)">
              <v-icon size="18">trash-2</v-icon>
            </button>
          </li>
        </ul>
        <StorefrontAnchor href="/collections/all" class="sf-cart__continue">
          <v-icon size="16">arrow-left</v-icon> Continue shopping
        </StorefrontAnchor>
      </section>

      <aside class="sf-cart__summary" aria-label="Order summary">
        <dl class="sf-cart__sums" :class="{ 'sf-cart__sums--sections': storefront.sectionsDrawing.value }">
          <div><dt>Subtotal</dt><dd>{{ formatMoney(subtotal) }}</dd></div>
          <div><dt>Shipping</dt><dd>Free</dd></div>
          <div v-if="code.discount.value" class="sf-cart__discount">
            <dt>Discount · {{ code.label.value }}</dt><dd>−{{ formatMoney(code.discount.value.amount) }}</dd>
          </div>
          <div class="sf-cart__grand"><dt>Total</dt><dd>{{ formatMoney(total) }}</dd></div>
          <div v-for="charge in recurring" :key="charge.interval" class="sf-cart__recurring">
            <dt>Then {{ charge.interval }}</dt><dd>{{ formatMoney(charge.amount) }}</dd>
          </div>
        </dl>
        <StorefrontDiscountCode
          v-if="code.offered.value || code.applied.value"
          v-model:typed="code.typed.value"
          id-prefix="sf-cart"
          :applied="code.discount.value ? code.applied.value : ''"
          :problem="code.notice.value"
          :saving="code.discount.value ? formatMoney(code.discount.value.amount) : ''"
          @apply="code.apply"
          @remove="code.remove"
        />
        <p v-if="code.discount.value && recurring.length" class="sf-cart__code-note sf-muted">The code lowers this order. Later deliveries are charged at the plan’s price.</p>
        <p v-if="offer.payIn4.labels.length" class="sf-cart__instalments sf-muted">
          or 4 interest-free payments of {{ formatMoney(offer.payIn4.amount) }} with {{ offer.payIn4.labels.join(' or ') }}
        </p>
        <!-- data-sf-clear: the chat launcher on a phone steps aside while it would cover these (StorefrontChat). -->
        <button type="button" class="sf-button sf-button--block" data-sf-clear @click="checkout()">
          <v-icon size="16">lock</v-icon> Checkout
        </button>
        <!-- Express buttons skip the checkout form, and with it the consent a subscription needs. -->
        <template v-if="offer.express.length && !recurring.length">
          <p class="sf-or">or</p>
          <StorefrontExpressButtons :methods="offer.express" data-sf-clear @pick="checkout" />
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

/* The heading takes focus only when the last line is removed; no ring for that. */
.sf-cart__title:focus {
  outline: none;
}

/* A theme on the sections drawing sets its headings' weight and case (a serif at its
   own weight); every other theme keeps the bold title it always had. */
.sf-page-title {
  font-weight: var(--sf-heading-weight, 700);
  text-transform: var(--sf-heading-case, none);
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
  border-radius: var(--sf-corner, 6px);
  background: linear-gradient(160deg, #f4f4f2 0%, #e6e5e1 100%);
  color: #8a8780;
}

.sf-cart__image {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
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

.sf-cart__plan,
.sf-cart__variant {
  font-size: 13px;
  font-weight: 500;
}

.sf-cart__variant--part {
  font-variant-numeric: tabular-nums;
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
  border-radius: var(--sf-corner, 8px);
  background: var(--sf-surface, #f7f7f5);
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

/* On the sections drawing an amount stays whole: "−$19.60", never "−" over "$19.60". */
.sf-cart__sums--sections div {
  gap: 16px;
}

.sf-cart__sums--sections dd {
  white-space: nowrap;
}

.sf-cart__grand {
  padding-top: 12px;
  border-top: 1px solid #e3e3e0;
  font-size: 18px;
  font-weight: 700;
}

.sf-cart__recurring {
  font-size: 14px;
  color: var(--sf-muted, #5f5f5f);
}

.sf-cart__discount {
  font-weight: 600;
}

.sf-cart__code-note {
  margin: -6px 0 0;
  font-size: 13px;
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
