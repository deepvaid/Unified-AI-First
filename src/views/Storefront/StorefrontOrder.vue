<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useChatbotStore } from '@/stores/useChatbot'
import { useCommerceStore } from '@/stores/useCommerce'
import type { OrderAddress, OrderLineItem } from '@/stores/useCommerce'
import { useStoreContentStore } from '@/stores/useStoreContent'
import { lineTotal } from '@/stores/useStorefrontCart'
import { useStorefrontShopperStore } from '@/stores/useStorefrontShopper'
import { lineProduct } from '@/storefront/cart'
import { shopperOrderStatus } from '@/storefront/orderStatus'
import { lineImage, lineProductQuery, lineVariantText, orderOfShopper, orderParam, orderSums, placedOn, withQuery } from '@/storefront/shopperOrders'
import { deliverySummary } from '@/subscriptions/plans'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontOrderStatus from './StorefrontOrderStatus.vue'
import StorefrontSignIn from './StorefrontSignIn.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, productHandle } from './storefrontCatalog'

// One of the shopper's orders (/account/orders/:number): where it is, what was in it
// (each line in the size and colour bought, with its photo), what it cost with the
// code that took something off, where it goes, and who to ask. Only the signed-in
// shopper's own order on this store opens; anything else is "We can't find that
// order", so a guessed number never shows someone else's. Signed out, the page asks
// the shopper to sign in first (StorefrontSignIn).

const route = useRoute()
const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const shopper = useStorefrontShopperStore()
const content = useStoreContentStore()
const chatbots = useChatbotStore()

const channelId = computed(() => storefront.channel.value.id)
const email = computed(() => shopper.emailFor(channelId.value))
const number = computed(() => orderParam(String(route.params.number ?? '')))
const order = computed(() => orderOfShopper(commerce.orders, channelId.value, email.value, number.value))
const status = computed(() => (order.value ? shopperOrderStatus(order.value) : null))
const sums = computed(() => (order.value ? orderSums(order.value) : null))
const formatMoney = storefront.formatExact
const placed = computed(() => (order.value ? placedOn(order.value.date, storefront.ownMoneyFormat.value) : ''))

function productOfLine(line: OrderLineItem) {
  return lineProduct(commerce.products, line)
}

/** The product's page, opened on the size and colour bought; none once the store no longer sells it. */
function productHref(line: OrderLineItem): string | null {
  const product = productOfLine(line)
  if (!product || product.publishStatus !== 'Published') return null
  return withQuery(`/products/${productHandle(product)}`, lineProductQuery(product, line))
}

function iconOfLine(line: OrderLineItem): string {
  const category = productOfLine(line)?.category
  return (category && CATEGORY_ICONS[category]) || 'package'
}

function totalOf(line: OrderLineItem) {
  return lineTotal(line, order.value!.currency)
}

function unitPrice(line: OrderLineItem) {
  return lineTotal({ price: line.price, qty: 1 }, order.value!.currency)
}

/** Collect in store stands where the street would be. */
const collect = computed(() => order.value?.shippingAddress.line1 === 'Collect in store')

/** The address as a parcel label reads it: a state goes after the city, a postcode before a city that has none. */
function addressLines(address: OrderAddress): string[] {
  const town = address.region
    ? [[address.city, address.region].filter(Boolean).join(', '), address.postalCode].filter(Boolean).join(' ')
    : [address.postalCode, address.city].filter(Boolean).join(' ')
  return [address.name, address.line1, town, address.country].filter((part) => part && part !== '—')
}

// ── Need help? ──────────────────────────────────────────────────────
const contactHref = computed(() => (content.entryByHandle(channelId.value, 'page', 'contact') ? '/page/contact' : null))
/** The store's chat is on its pages (the same rule as StorefrontLayout). */
const hasChat = computed(() => storefront.demo.value && chatbots.getByChannel(channelId.value)?.status === 'Active')

/** The sections drawing separates its breadcrumbs with "/", as its listing and product pages do. */
const crumbSeparator = computed(() => (storefront.sectionsDrawing.value ? '/' : '›'))

// What the shopper pressed goes away as the page changes, so the keyboard is put
// where the page now starts: the sign-in's email field, or the order's heading.
const signInForm = ref<InstanceType<typeof StorefrontSignIn> | null>(null)

async function signOut(): Promise<void> {
  shopper.signOut(channelId.value)
  await nextTick()
  signInForm.value?.focus()
}

async function signedIn(): Promise<void> {
  await nextTick()
  document.getElementById(order.value ? 'sf-ord-title' : 'sf-ord-missing')?.focus()
}
</script>

<template>
  <div class="sf-ord" :class="{ 'sf-ord--sections': storefront.sectionsDrawing.value }">
    <nav class="sf-crumbs sf-ord__crumbs" aria-label="Breadcrumb">
      <StorefrontAnchor href="/">Home</StorefrontAnchor>
      <span aria-hidden="true">{{ crumbSeparator }}</span>
      <StorefrontAnchor href="/account">Your account</StorefrontAnchor>
      <span aria-hidden="true">{{ crumbSeparator }}</span>
      <span aria-current="page">Order #{{ number }}</span>
    </nav>

    <!-- ── Signed out: sign in first ────────────────────────────── -->
    <StorefrontSignIn
      v-if="!email"
      ref="signInForm"
      title="Sign in to see your order"
      :lead="`Enter the email you used for order #${number}. We’ll send you a 6-digit code to sign in, so there is no password to remember.`"
      @signed-in="signedIn"
    />

    <!-- ── Not this shopper's order, or not this store's ────────── -->
    <section v-else-if="!order || !status || !sums" class="sf-ord__missing" aria-labelledby="sf-ord-missing">
      <h1 id="sf-ord-missing" class="sf-page-title" tabindex="-1">We can’t find that order</h1>
      <p class="sf-muted">
        Order #{{ number }} isn’t one of the orders for {{ email }} on this store.
        It may have been placed with another email address.
      </p>
      <div class="sf-ord__missing-actions">
        <StorefrontAnchor href="/account" class="sf-button">See your orders</StorefrontAnchor>
        <button type="button" class="sf-button sf-button--secondary" @click="signOut">Sign in with another email</button>
      </div>
    </section>

    <!-- ── The order ────────────────────────────────────────────── -->
    <article v-else class="sf-ord__order" aria-labelledby="sf-ord-title">
      <header class="sf-ord__head">
        <div>
          <h1 id="sf-ord-title" class="sf-ord__title" tabindex="-1">Order {{ order.orderNumber }}</h1>
          <p class="sf-muted sf-ord__placed">Placed {{ placed }} · {{ sums.count }} {{ sums.count === 1 ? 'item' : 'items' }}</p>
        </div>
        <StorefrontOrderStatus :status="status" />
      </header>

      <section class="sf-ord__status" :class="`sf-ord__status--${status.key}`" aria-label="Where your order is">
        <p class="sf-ord__status-text">{{ status.message }}</p>
        <dl v-if="status.tracking" class="sf-ord__tracking">
          <div v-if="status.tracking.courier"><dt>Courier</dt><dd>{{ status.tracking.courier }}</dd></div>
          <div><dt>Tracking number</dt><dd class="sf-ord__mono">{{ status.tracking.number }}</dd></div>
        </dl>
      </section>

      <div class="sf-ord__layout">
        <section class="sf-ord__items" aria-labelledby="sf-ord-items">
          <h2 id="sf-ord-items" class="sf-ord__section-title">Items</h2>
          <ul class="sf-ord__lines">
            <li v-for="(line, i) in order.lineItems" :key="i" class="sf-ord__line">
              <span class="sf-ord__thumb" aria-hidden="true">
                <img v-if="lineImage(productOfLine(line), line)" :src="lineImage(productOfLine(line), line)" alt="">
                <v-icon v-else size="24">{{ iconOfLine(line) }}</v-icon>
              </span>
              <span class="sf-ord__line-text">
                <StorefrontAnchor v-if="productHref(line)" :href="productHref(line)!" class="sf-ord__line-name">{{ line.product }}</StorefrontAnchor>
                <span v-else class="sf-ord__line-name">{{ line.product }}</span>
                <span v-if="lineVariantText(productOfLine(line), line)" class="sf-ord__line-variant">{{ lineVariantText(productOfLine(line), line) }}</span>
                <span v-if="line.plan" class="sf-muted">{{ line.plan.name }} · {{ deliverySummary(line.plan) }}</span>
                <span class="sf-muted">Qty {{ line.qty }}<template v-if="line.qty > 1"> · {{ formatMoney(unitPrice(line)) }} each</template></span>
              </span>
              <span class="sf-ord__line-total">{{ formatMoney(totalOf(line)) }}</span>
            </li>
          </ul>
        </section>

        <aside class="sf-ord__side">
          <section class="sf-ord__panel" aria-labelledby="sf-ord-paid">
            <h2 id="sf-ord-paid" class="sf-ord__section-title">Payment</h2>
            <dl class="sf-ord__sums">
              <div><dt>Subtotal</dt><dd>{{ formatMoney(sums.items) }}</dd></div>
              <div v-if="sums.discount" class="sf-ord__discount">
                <dt>Discount · {{ sums.discount.code }}</dt><dd>−{{ formatMoney(sums.discount.amount) }}</dd>
              </div>
              <div><dt>Shipping</dt><dd>{{ sums.shipping.amount ? formatMoney(sums.shipping) : 'Free' }}</dd></div>
              <div class="sf-ord__grand"><dt>Total</dt><dd>{{ formatMoney(sums.total) }}</dd></div>
            </dl>
            <p v-if="order.paymentMethod && order.paymentMethod !== '—'" class="sf-ord__paid-with sf-muted">Paid with {{ order.paymentMethod }}</p>
          </section>

          <section class="sf-ord__panel" aria-labelledby="sf-ord-address">
            <h2 id="sf-ord-address" class="sf-ord__section-title">{{ collect ? 'Collection' : 'Shipping address' }}</h2>
            <p v-if="collect" class="sf-ord__address">{{ order.shippingAddress.name }}<br>Collect in store</p>
            <address v-else class="sf-ord__address">
              <template v-for="(part, i) in addressLines(order.shippingAddress)" :key="i">{{ part }}<br></template>
            </address>
          </section>
        </aside>
      </div>

      <section class="sf-ord__help" aria-labelledby="sf-ord-help">
        <h2 id="sf-ord-help" class="sf-ord__section-title">Need help?</h2>
        <p>
          Questions about this order or a return? Quote order {{ order.orderNumber }} and we’ll help.
          <template v-if="hasChat"> Our assistant in the chat can also look it up for you.</template>
        </p>
        <div class="sf-ord__help-actions">
          <StorefrontAnchor v-if="contactHref" :href="contactHref" class="sf-button sf-button--secondary">Contact us</StorefrontAnchor>
          <StorefrontAnchor href="/account" class="sf-ord__back">
            <v-icon size="16" aria-hidden="true">arrow-left</v-icon> All your orders
          </StorefrontAnchor>
        </div>
      </section>
    </article>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Every painted surface
   here sets its own text colour, so a dark theme cannot put dark text on it. */
.sf-ord {
  max-width: 1040px;
  margin: 0 auto;
  padding: 24px 24px 0;
}

/* A theme on the sections drawing sets its headings' weight and case (a serif at its
   own weight); every other theme keeps the bold title it always had. */
.sf-page-title {
  font-weight: var(--sf-heading-weight, 700);
  text-transform: var(--sf-heading-case, none);
}

.sf-ord__crumbs {
  margin-bottom: 32px;
}

.sf-ord__crumbs a {
  color: inherit;
}

.sf-ord__missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}

.sf-ord__missing p {
  margin: 0;
}

.sf-ord__missing-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.sf-ord__order {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.sf-ord__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 24px;
}

/* Headings take focus only from the page itself, after a sign-in; no ring for that. */
.sf-ord__title:focus,
.sf-page-title:focus {
  outline: none;
}

.sf-ord__title {
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 31px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.2;
  text-transform: var(--sf-heading-case, none);
  font-variant-numeric: tabular-nums;
}

.sf-ord__placed {
  margin: 6px 0 0;
  font-size: 15px;
}

.sf-ord__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 32px;
  padding: 20px 24px;
  border-radius: min(var(--sf-radius, 8px), 8px);
  background: #eef1f6;
  color: #23364f;
}

.sf-ord__status--awaiting-payment { background: #fff1cc; color: #6b4300; }
.sf-ord__status--payment-problem { background: #fde4e4; color: #8f1414; }
.sf-ord__status--shipped { background: #e3eefa; color: #123a63; }
.sf-ord__status--delivered { background: #e3f2e6; color: #1b4d20; }
.sf-ord__status--cancelled,
.sf-ord__status--refunded { background: #ececec; color: #3d3d3d; }

.sf-ord__status-text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.sf-ord__tracking {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  margin: 0;
  font-size: 14px;
}

.sf-ord__tracking dt {
  font-size: 13px;
  opacity: 0.85;
}

.sf-ord__tracking dd {
  margin: 2px 0 0;
  font-weight: 600;
}

.sf-ord__mono {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  letter-spacing: 0.04em;
}

.sf-ord__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 48px;
  align-items: start;
}

.sf-ord__section-title {
  margin: 0 0 16px;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 20px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.3;
  text-transform: var(--sf-heading-case, none);
}

.sf-ord__lines {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--sf-divider, #f0f0f0);
}

.sf-ord__line {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--sf-divider, #f0f0f0);
  font-size: 14px;
}

.sf-ord__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: min(var(--sf-radius, 6px), 6px);
  background: var(--sf-surface, #f7f7f5);
  color: #5f5f5f;
}

.sf-ord__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-ord__line-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sf-ord__line-name {
  align-self: flex-start;
  color: inherit;
  font-size: 15px;
  font-weight: 600;
}

a.sf-ord__line-name {
  text-decoration: none;
}

a.sf-ord__line-name:hover,
a.sf-ord__line-name:focus-visible {
  text-decoration: underline;
}

.sf-ord__line-variant {
  font-weight: 500;
}

.sf-ord__line-total {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.sf-ord__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sf-ord__panel {
  padding: 24px;
  border-radius: min(var(--sf-radius, 8px), 8px);
  background: var(--sf-surface, #f7f7f5);
  color: var(--sf-text, #121011);
}

.sf-ord__sums {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.sf-ord__sums div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.sf-ord__sums dd {
  margin: 0;
}

.sf-ord__discount {
  font-weight: 600;
}

.sf-ord__grand {
  padding-top: 12px;
  border-top: 1px solid var(--sf-divider, #e3e3e0);
  font-size: 17px;
  font-weight: 700;
}

.sf-ord__paid-with {
  margin: 14px 0 0;
  font-size: 14px;
}

.sf-ord__address {
  margin: 0;
  font-size: 15px;
  font-style: normal;
  line-height: 1.6;
}

.sf-ord__help {
  padding-top: 32px;
  border-top: 1px solid var(--sf-divider, #f0f0f0);
}

.sf-ord__help p {
  max-width: 60ch;
  margin: 0 0 16px;
}

.sf-ord__help-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
}

.sf-ord__help-actions .sf-button {
  height: 44px;
  padding: 0 20px;
  font-size: 14px;
}

.sf-ord__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  color: inherit;
  font-size: 14px;
}

/* The richer theme drawing's display serif reads larger. */
.sf-ord--sections .sf-ord__title {
  font-size: 40px;
  line-height: 1.1;
}

.sf-ord--sections .sf-ord__section-title {
  font-size: 24px;
}

/* The store's own measure and gutter (on a phone too), so the order lines up with the
   logo, the cart and the product pages; breadcrumbs as the product page draws them. */
.sf-ord.sf-ord--sections {
  max-width: var(--sf-measure, 1200px);
  padding-inline: var(--sf-gutter, 24px);
}

.sf-ord--sections .sf-ord__crumbs {
  gap: 10px;
  color: var(--sf-muted, #5f5f5f);
  font-size: 13px;
  line-height: 20px;
}

.sf-ord--sections .sf-ord__crumbs a {
  color: var(--sf-muted, #5f5f5f);
}

.sf-ord--sections .sf-ord__crumbs [aria-current='page'] {
  color: var(--sf-text, #121011);
}

/* Where the order is, on the theme's quiet surface in its text colour, square as the theme
   draws it; a dot in the status's colour (at least 5:1 on Northfold's surface) marks it. */
.sf-ord--sections .sf-ord__status {
  --sf-status-tone: var(--sf-muted, #5f5f5f);
  border-radius: var(--sf-corner, 0px);
  background: var(--sf-surface, #f7f7f5);
  color: var(--sf-text, #121011);
}

.sf-ord--sections .sf-ord__status--preparing,
.sf-ord--sections .sf-ord__status--shipped { --sf-status-tone: #2f5d8a; }
.sf-ord--sections .sf-ord__status--awaiting-payment { --sf-status-tone: #8a5a00; }
.sf-ord--sections .sf-ord__status--payment-problem { --sf-status-tone: #b3261e; }
.sf-ord--sections .sf-ord__status--delivered { --sf-status-tone: #2e6b34; }

.sf-ord--sections .sf-ord__status-text {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.sf-ord--sections .sf-ord__status-text::before {
  content: '';
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sf-status-tone);
  transform: translateY(-1px);
}

.sf-ord--sections .sf-ord__tracking dt {
  color: var(--sf-muted, #5f5f5f);
  opacity: 1;
}

@media (max-width: 900px) {
  .sf-ord__layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (max-width: 640px) {
  .sf-ord {
    padding: 16px 16px 0;
  }

  .sf-ord__crumbs {
    margin-bottom: 24px;
  }

  .sf-ord__line {
    grid-template-columns: 64px minmax(0, 1fr) auto;
    gap: 12px;
  }

  .sf-ord__thumb {
    width: 64px;
  }

  .sf-ord__status {
    padding: 16px;
  }

  .sf-ord--sections .sf-ord__title {
    font-size: 32px;
  }

  .sf-ord__missing-actions .sf-button {
    width: 100%;
  }
}
</style>
