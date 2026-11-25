<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { useCommerceStore } from '@/stores/useCommerce'
import type { Order, OrderLineItem } from '@/stores/useCommerce'
import { useStorefrontShopperStore } from '@/stores/useStorefrontShopper'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { lineProduct } from '@/storefront/cart'
import { shopperOrderStatus } from '@/storefront/orderStatus'
import { lineDetailText, lineImage, lineVariantText, orderParam, orderSums, ordersOfShopper, placedOn } from '@/storefront/shopperOrders'
import { CANCEL_REASONS, allowedActions, chargeAmount, contractUnitPrice } from '@/subscriptions/contracts'
import type { ContractAction, SubscriptionContract } from '@/subscriptions/contracts'
import { deliverySummary, nextChargeDate, planTitle, pricePerDelivery } from '@/subscriptions/plans'
import type { SubscriptionPlan } from '@/subscriptions/plans'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontLineText from './StorefrontLineText.vue'
import StorefrontOrderStatus from './StorefrontOrderStatus.vue'
import StorefrontSignIn from './StorefrontSignIn.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, collectionsOf, productHandle } from './storefrontCatalog'

// The shopper's own page (/account): sign in, then their subscriptions on this
// store, when it sells them, and their orders here. A subscription offers what a
// shopper may do to it: skip the next delivery, pause or resume, move to another
// plan, cancel with a reason, or pay again after a failed payment. The same
// subscriptions, and the same rules, are behind the admin's Commerce ›
// Subscriptions › Subscribers, so a change here shows there at once. Each order
// opens its own page (account/orders/:number, StorefrontOrder.vue).
//
// Sign-in is mocked (StorefrontSignIn): an email, then a code, and any six digits
// are accepted. A checkout signs its shopper in, so the confirmation's links come
// straight here.

const storefront = inject(STOREFRONT)!
/** A day the way the store writes dates: "Dec 24, 2026", or "24 Dec 2026" for a store that writes amounts its own way. */
const dayLabel = (date: string): string => placedOn(date, storefront.ownMoneyFormat.value)
const commerce = useCommerceStore()
const shopper = useStorefrontShopperStore()
const subscriptions = useSubscriptionsStore()

const channelId = computed(() => storefront.channel.value.id)
const email = computed(() => shopper.emailFor(channelId.value))
const formatMoney = storefront.formatExact

function signOut(): void {
  shopper.signOut(channelId.value)
  message.value = ''
  open.value = null
}

// ── Subscriptions ────────────────────────────────────────────────────

const mine = computed(() => (email.value ? subscriptions.contractsOf(channelId.value, email.value) : []))
/** Order history is on the demo stores; every other store keeps the subscriptions-only page it had. */
const withOrders = computed(() => storefront.demo.value)
/** A store that sells subscriptions, or a shopper who still holds one here (the store's plans were switched off since). */
const showSubscriptions = computed(() => !withOrders.value
  || subscriptions.plans.some((p) => p.channelId === channelId.value && p.status === 'Active') || mine.value.length > 0)

/** Where "find a subscription" leads: the store's Subscription collection when it has one. */
const shopHref = computed(() =>
  collectionsOf(commerce.products, channelId.value).some((c) => c.handle === 'subscription') ? '/collections/subscription' : '/collections/all')

function productOf(contract: SubscriptionContract) {
  return commerce.products.find((p) => p.id === contract.productId)
}

/** The choice it was bought in, as an order line reads it ("Can"); empty when it had none. */
function choiceOf(contract: SubscriptionContract): string {
  return contract.variantTitle ? lineVariantText(productOf(contract), { sku: contract.sku, variantTitle: contract.variantTitle }) : ''
}

/** What a shopper may do; changing the date and charging are the merchant's. */
const SHOPPER_ACTIONS: ContractAction[] = ['skip', 'pause', 'resume', 'changePlan', 'retry', 'cancel']
function actionsFor(contract: SubscriptionContract): ContractAction[] {
  const allowed = allowedActions(contract).filter((a) => SHOPPER_ACTIONS.includes(a))
  return allowed.filter((a) => a !== 'changePlan' || subscriptions.plansToChangeTo(contract).length > 0)
}

/** What another plan would cost per delivery, at today's price of the choice it was bought in. */
function priceOn(contract: SubscriptionContract, plan: SubscriptionPlan): Money | null {
  const product = productOf(contract)
  const unit = product ? parseDecimal(contractUnitPrice(product, contract), contract.currency) : null
  return unit ? pricePerDelivery(unit, plan) : null
}

// One question open at a time, under the subscription it is about.
const open = ref<{ id: string; action: 'skip' | 'pause' | 'changePlan' | 'cancel' } | null>(null)
const planId = ref('')
const reason = ref<string>(CANCEL_REASONS[0])
const message = ref('')
const messageLine = ref<HTMLElement | null>(null)

function ask(contract: SubscriptionContract, action: 'skip' | 'pause' | 'changePlan' | 'cancel'): void {
  open.value = { id: contract.id, action }
  planId.value = subscriptions.plansToChangeTo(contract)[0]?.id ?? ''
  reason.value = CANCEL_REASONS[0]
}

function isOpen(contract: SubscriptionContract, action: string): boolean {
  return open.value?.id === contract.id && open.value.action === action
}

/** Says what happened, where a screen reader hears it and a keyboard lands on it. */
async function done(text: string): Promise<void> {
  open.value = null
  message.value = text
  await nextTick()
  messageLine.value?.focus()
}

function latest(id: string): SubscriptionContract | undefined {
  return subscriptions.contractById(id)
}

function skip(contract: SubscriptionContract): void {
  if (!subscriptions.skipNext(contract.id, 'customer')) return
  void done(`Skipped. Your next ${contract.product} delivery is now ${dayLabel(latest(contract.id)!.nextChargeOn!)}.`)
}

function pause(contract: SubscriptionContract): void {
  if (subscriptions.pause(contract.id, 'customer')) void done(`Your ${contract.product} subscription is paused. Nothing is charged or sent until you resume it.`)
}

function resume(contract: SubscriptionContract): void {
  if (!subscriptions.resume(contract.id, 'customer')) return
  void done(`Welcome back. Your next ${contract.product} delivery is ${dayLabel(latest(contract.id)!.nextChargeOn!)}.`)
}

function changePlan(contract: SubscriptionContract): void {
  if (!subscriptions.changePlan(contract.id, planId.value, 'customer')) return
  const now = latest(contract.id)!
  // A delivery option keeps its plan's name: what changed is how often it comes.
  const what = now.plan.byFrequency ? `now comes ${deliverySummary(now.plan)}` : `is now on ${now.plan.name}`
  void done(`Your ${contract.product} subscription ${what}: ${formatMoney(chargeAmount(now))} per delivery, from ${dayLabel(now.nextChargeOn!)}.`)
}

function cancel(contract: SubscriptionContract): void {
  if (subscriptions.cancel(contract.id, reason.value, 'customer')) void done(`Your ${contract.product} subscription is cancelled. Nothing more will be charged.`)
}

function retry(contract: SubscriptionContract): void {
  const result = subscriptions.chargeNow(contract.id, 'customer')
  void done(result.ok
    ? `Thank you. We took ${formatMoney(chargeAmount(contract))} with ${contract.paymentMethod} and your ${contract.product} delivery is on its way (order ${result.order.number}).`
    : result.message)
}

// ── Orders ───────────────────────────────────────────────────────────
// Every order the signed-in shopper placed on this store, newest first.

const orders = computed(() => ordersOfShopper(commerce.orders, channelId.value, email.value))
/** Lines a card shows before it says how many more there are. */
const SHOWN_LINES = 3

function productOfLine(line: OrderLineItem) {
  return lineProduct(commerce.products, line)
}

/** "Size M · Sand", or "Front · Part # TQ-BRK-4471 · Fits 2019 Ford F-150" on a store that sells parts. */
function detailOfLine(line: OrderLineItem): string {
  return lineDetailText(productOfLine(line), line, { partNumber: storefront.sellsParts.value || !!line.vehicle })
}

function iconOfLine(line: OrderLineItem): string {
  const category = productOfLine(line)?.category
  return (category && CATEGORY_ICONS[category]) || 'package'
}

function orderHref(order: Order): string {
  return `/account/orders/${orderParam(order.orderNumber)}`
}

function placed(order: Order): string {
  return placedOn(order.date, storefront.ownMoneyFormat.value)
}

function itemsText(order: Order): string {
  const count = orderSums(order).count
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

// A subscription that leaves the list (another tab cancelled it) takes its open question with it.
watch(mine, (list) => {
  if (open.value && !list.some((c) => c.id === open.value!.id)) open.value = null
})
</script>

<template>
  <div class="sf-acct" :class="{ 'sf-acct--sections': storefront.sectionsDrawing.value }">
    <!-- ── Sign in ──────────────────────────────────────────────── -->
    <StorefrontSignIn v-if="!email" />

    <!-- ── Signed in ────────────────────────────────────────────── -->
    <section v-else aria-labelledby="sf-acct-title">
      <div class="sf-acct__head">
        <h1 id="sf-acct-title" class="sf-page-title">{{ withOrders ? 'Your account' : 'Your subscriptions' }}</h1>
        <p class="sf-acct__who sf-muted">
          Signed in as {{ email }} ·
          <button type="button" class="sf-acct__link" @click="signOut">Sign out</button>
        </p>
      </div>

      <p v-if="message" ref="messageLine" class="sf-acct__message" role="status" tabindex="-1">
        <v-icon size="18" aria-hidden="true">circle-check</v-icon>
        <span>{{ message }}</span>
      </p>

      <section v-if="showSubscriptions" class="sf-acct__section" :aria-labelledby="withOrders ? 'sf-acct-subs' : 'sf-acct-title'">
        <h2 v-if="withOrders" id="sf-acct-subs" class="sf-acct__section-title">Subscriptions</h2>
        <div v-if="!mine.length" class="sf-acct__empty">
          <p class="sf-acct__empty-title">You have no subscriptions with this email.</p>
          <p class="sf-muted">Subscribe to a product and it shows up here, with its next delivery and everything you can change.</p>
          <StorefrontAnchor :href="shopHref" class="sf-button">See what you can subscribe to</StorefrontAnchor>
        </div>

        <ul v-else class="sf-acct__list">
          <li v-for="contract in mine" :key="contract.id" class="sf-sub" :class="{ 'sf-sub--ended': contract.status === 'Cancelled' }">
            <div class="sf-sub__top">
              <span class="sf-sub__thumb" aria-hidden="true">
                <img v-if="productOf(contract)?.imageUrls?.[0]" :src="productOf(contract)!.imageUrls![0]" alt="">
                <v-icon v-else size="28">package</v-icon>
              </span>
              <div class="sf-sub__what">
                <h3 class="sf-sub__name">
                  <StorefrontAnchor v-if="productOf(contract)" :href="`/products/${productHandle(productOf(contract)!)}`">{{ contract.product }}</StorefrontAnchor>
                  <template v-else>{{ contract.product }}</template>
                </h3>
                <!-- "Can · 3-month supply", as the order lines below read a choice. -->
                <p class="sf-muted"><template v-if="choiceOf(contract)">{{ choiceOf(contract) }} · </template>{{ contract.plan.name }} · {{ deliverySummary(contract.plan) }}<template v-if="contract.qty > 1"> · {{ contract.qty }} of them</template></p>
              </div>
              <span class="sf-sub__status" :class="`sf-sub__status--${contract.status.toLowerCase().replace(' ', '-')}`">{{ contract.status }}</span>
            </div>

            <p v-if="contract.status === 'Payment failed'" class="sf-sub__alert" role="alert">
              <v-icon size="18" aria-hidden="true">circle-alert</v-icon>
              <span>We couldn’t take your last payment with {{ contract.paymentMethod }}, so your delivery is on hold.</span>
            </p>

            <dl class="sf-sub__facts">
              <div v-if="contract.status === 'Active'"><dt>Next delivery</dt><dd>{{ dayLabel(contract.nextChargeOn!) }}</dd></div>
              <div v-else-if="contract.status === 'Paused'"><dt>Next delivery</dt><dd>Paused</dd></div>
              <div v-else-if="contract.status === 'Payment failed'"><dt>Payment due</dt><dd>{{ dayLabel(contract.nextChargeOn!) }}</dd></div>
              <div v-else><dt>Ended</dt><dd>{{ dayLabel(contract.history[0]!.date) }}</dd></div>
              <div><dt>Per delivery</dt><dd>{{ formatMoney(chargeAmount(contract)) }}</dd></div>
              <div><dt>Paid with</dt><dd>{{ contract.paymentMethod }}</dd></div>
              <div><dt>Subscription</dt><dd>{{ contract.number }}</dd></div>
            </dl>

            <div v-if="actionsFor(contract).length" class="sf-sub__actions">
              <button v-if="actionsFor(contract).includes('retry')" type="button" class="sf-button" @click="retry(contract)">Try the payment again</button>
              <button v-if="actionsFor(contract).includes('resume')" type="button" class="sf-button" @click="resume(contract)">Resume subscription</button>
              <button v-if="actionsFor(contract).includes('skip')" type="button" class="sf-button sf-button--secondary" :aria-expanded="isOpen(contract, 'skip')" @click="ask(contract, 'skip')">Skip next delivery</button>
              <button v-if="actionsFor(contract).includes('pause')" type="button" class="sf-button sf-button--secondary" :aria-expanded="isOpen(contract, 'pause')" @click="ask(contract, 'pause')">Pause</button>
              <button v-if="actionsFor(contract).includes('changePlan')" type="button" class="sf-button sf-button--secondary" :aria-expanded="isOpen(contract, 'changePlan')" @click="ask(contract, 'changePlan')">Change plan</button>
              <button v-if="actionsFor(contract).includes('cancel')" type="button" class="sf-acct__link sf-sub__cancel" :aria-expanded="isOpen(contract, 'cancel')" @click="ask(contract, 'cancel')">Cancel subscription</button>
            </div>

            <!-- The question each action asks before it happens. -->
            <div v-if="isOpen(contract, 'skip')" class="sf-sub__ask">
              <p>
                Skip the delivery of <strong>{{ dayLabel(contract.nextChargeOn!) }}</strong>?
                Your next one will be {{ dayLabel(nextChargeDate(contract.nextChargeOn!, contract.plan)) }}, and nothing is charged before then.
              </p>
              <div class="sf-sub__ask-actions">
                <button type="button" class="sf-button" @click="skip(contract)">Skip this delivery</button>
                <button type="button" class="sf-button sf-button--secondary" @click="open = null">Keep it</button>
              </div>
            </div>

            <div v-else-if="isOpen(contract, 'pause')" class="sf-sub__ask">
              <p>Pause this subscription? Nothing is charged or sent until you resume it, and you can resume whenever you like.</p>
              <div class="sf-sub__ask-actions">
                <button type="button" class="sf-button" @click="pause(contract)">Pause subscription</button>
                <button type="button" class="sf-button sf-button--secondary" @click="open = null">Keep it running</button>
              </div>
            </div>

            <form v-else-if="isOpen(contract, 'changePlan')" class="sf-sub__ask" @submit.prevent="changePlan(contract)">
              <fieldset class="sf-sub__choices">
                <legend>Change to</legend>
                <label v-for="plan in subscriptions.plansToChangeTo(contract)" :key="plan.id" class="sf-sub__choice">
                  <input v-model="planId" type="radio" :name="`sf-plan-${contract.id}`" :value="plan.id">
                  <span>
                    <strong>{{ planTitle(plan) }}</strong>
                    <!-- A delivery option's name already says how often it comes. -->
                    <span class="sf-muted"><template v-if="!plan.optionOf">{{ deliverySummary(plan) }}<template v-if="priceOn(contract, plan)"> · </template></template><template v-if="priceOn(contract, plan)">{{ formatMoney(priceOn(contract, plan)!) }} per delivery</template></span>
                  </span>
                </label>
              </fieldset>
              <p class="sf-muted">The new plan starts with your next delivery, on {{ dayLabel(contract.nextChargeOn!) }}.</p>
              <div class="sf-sub__ask-actions">
                <button type="submit" class="sf-button">Change plan</button>
                <button type="button" class="sf-button sf-button--secondary" @click="open = null">Keep my plan</button>
              </div>
            </form>

            <form v-else-if="isOpen(contract, 'cancel')" class="sf-sub__ask" @submit.prevent="cancel(contract)">
              <fieldset class="sf-sub__choices">
                <legend>Why are you cancelling?</legend>
                <label v-for="option in CANCEL_REASONS" :key="option" class="sf-sub__choice">
                  <input v-model="reason" type="radio" :name="`sf-reason-${contract.id}`" :value="option">
                  <span>{{ option }}</span>
                </label>
              </fieldset>
              <p class="sf-muted">Cancelling stops every future charge. To take a break instead, pause it.</p>
              <div class="sf-sub__ask-actions">
                <button type="submit" class="sf-button">Cancel subscription</button>
                <button type="button" class="sf-button sf-button--secondary" @click="open = null">Keep my subscription</button>
              </div>
            </form>
          </li>
        </ul>
      </section>

      <!-- ── Orders ───────────────────────────────────────────── -->
      <section v-if="withOrders" class="sf-acct__section" aria-labelledby="sf-acct-orders">
        <h2 id="sf-acct-orders" class="sf-acct__section-title">Orders</h2>

        <div v-if="!orders.length" class="sf-acct__empty">
          <p class="sf-acct__empty-title">No orders yet</p>
          <p class="sf-muted">When you order with {{ email }}, your orders show up here, with where each one is.</p>
          <StorefrontAnchor href="/collections/all" class="sf-button">Start shopping</StorefrontAnchor>
        </div>

        <ul v-else class="sf-acct__list">
          <li v-for="order in orders" :key="order.id" class="sf-order">
            <div class="sf-order__head">
              <div class="sf-order__what">
                <h3 class="sf-order__number">Order {{ order.orderNumber }}</h3>
                <p class="sf-muted">Placed {{ placed(order) }} · {{ itemsText(order) }}</p>
              </div>
              <StorefrontOrderStatus :status="shopperOrderStatus(order)" />
            </div>

            <ul class="sf-order__lines">
              <li v-for="(line, i) in order.lineItems.slice(0, SHOWN_LINES)" :key="i" class="sf-order__line">
                <span class="sf-order__thumb" aria-hidden="true">
                  <img v-if="lineImage(productOfLine(line), line)" :src="lineImage(productOfLine(line), line)" alt="">
                  <v-icon v-else size="22">{{ iconOfLine(line) }}</v-icon>
                </span>
                <span class="sf-order__line-text">
                  <span class="sf-order__line-name">{{ line.product }}</span>
                  <span class="sf-muted">
                    <template v-if="detailOfLine(line)"><StorefrontLineText :text="detailOfLine(line)" :unbroken="storefront.sellsParts.value" /> · </template>
                    <template v-if="line.plan">{{ line.plan.name }} · </template>Qty {{ line.qty }}
                  </span>
                </span>
              </li>
            </ul>
            <p v-if="order.lineItems.length > SHOWN_LINES" class="sf-order__more sf-muted">
              and {{ order.lineItems.length - SHOWN_LINES }} more {{ order.lineItems.length - SHOWN_LINES === 1 ? 'item' : 'items' }}
            </p>

            <div class="sf-order__foot">
              <p class="sf-order__total">Total <strong>{{ formatMoney(orderSums(order).total) }}</strong></p>
              <StorefrontAnchor :href="orderHref(order)" class="sf-button sf-button--secondary sf-order__view">
                View order<span class="sf-acct__sr"> {{ order.orderNumber }}</span>
              </StorefrontAnchor>
            </div>
          </li>
        </ul>
      </section>
    </section>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Every painted surface
   here sets its own text colour, so a dark theme cannot put dark text on it. */
.sf-acct {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 24px 0;
}

/* A theme on the sections drawing sets its headings' weight and case (a serif at its
   own weight); every other theme keeps the bold title it always had. */
.sf-page-title {
  font-weight: var(--sf-heading-weight, 700);
  text-transform: var(--sf-heading-case, none);
}

.sf-acct__link {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.sf-acct__link:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-acct__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 24px;
  margin-bottom: 24px;
}

.sf-acct__who {
  margin: 0;
  font-size: 14px;
}

.sf-acct__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Subscriptions, then orders: each under its own heading. */
.sf-acct__section + .sf-acct__section {
  margin-top: 48px;
}

.sf-acct__section-title {
  margin: 0 0 16px;
  font-family: var(--sf-heading-font, system-ui), -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 22px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.25;
  text-transform: var(--sf-heading-case, none);
}

.sf-acct__message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 24px;
  padding: 14px 16px;
  border-radius: var(--sf-corner, 8px);
  background: #e3f2e6;
  color: #1b4d20;
  font-size: 15px;
}

.sf-acct__message:focus-visible {
  outline: 2px solid #1b4d20;
  outline-offset: 2px;
}

.sf-acct__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 32px;
  border-radius: var(--sf-corner, 8px);
  background: var(--sf-surface, #f7f7f5);
  color: #121011;
}

.sf-acct__empty p {
  margin: 0;
}

.sf-acct__empty .sf-muted {
  color: #5f5f5f;
}

.sf-acct__empty-title {
  font-size: 18px;
  font-weight: 600;
}

.sf-acct__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-sub {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--sf-input-border, #c9c9c9);
  border-radius: var(--sf-radius, 8px);
}

.sf-sub--ended .sf-sub__thumb {
  opacity: 0.6;
}

.sf-sub__top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sf-sub__thumb {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  overflow: hidden;
  border-radius: var(--sf-corner, 8px);
  background: var(--sf-surface, #f7f7f5);
  color: #5f5f5f;
}

.sf-sub__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-sub__what {
  flex: 1;
  min-width: 0;
}

.sf-sub__what p {
  margin: 4px 0 0;
  font-size: 14px;
}

.sf-sub__name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.sf-sub__name a {
  color: inherit;
  text-decoration: none;
}

.sf-sub__name a:hover,
.sf-sub__name a:focus-visible {
  text-decoration: underline;
}

.sf-sub__status {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.sf-sub__status--active {
  background: #e3f2e6;
  color: #1b4d20;
}

.sf-sub__status--paused {
  background: #fff1cc;
  color: #6b4300;
}

.sf-sub__status--cancelled {
  background: #ececec;
  color: #3d3d3d;
}

.sf-sub__status--payment-failed {
  background: #fde4e4;
  color: #8f1414;
}

.sf-sub__alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--sf-corner, 8px);
  background: #fde4e4;
  color: #8f1414;
  font-size: 14px;
}

.sf-sub__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.sf-sub__facts dt {
  color: var(--sf-muted, #5f5f5f);
  font-size: 13px;
}

.sf-sub__facts dd {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 600;
}

.sf-sub__actions,
.sf-sub__ask-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.sf-sub__actions .sf-button,
.sf-sub__ask-actions .sf-button {
  height: 44px;
  padding: 0 18px;
  font-size: 14px;
}

.sf-sub__cancel {
  margin-left: auto;
  font-size: 14px;
}

.sf-sub__ask {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--sf-corner, 8px);
  background: var(--sf-surface, #f7f7f5);
  color: #121011;
}

.sf-sub__ask p {
  margin: 0;
}

.sf-sub__ask .sf-muted {
  color: #5f5f5f;
}

/* The question sits on its own light surface, so its buttons keep the theme's
   brand colour but the secondary one takes this surface's text colour. */
.sf-sub__ask .sf-button--secondary {
  color: #121011 !important;
}

.sf-sub__choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.sf-sub__choices legend {
  margin-bottom: 10px;
  padding: 0;
  font-weight: 600;
}

.sf-sub__choice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.sf-sub__choice input {
  width: 18px;
  height: 18px;
  margin: 2px 0 0;
  flex-shrink: 0;
  accent-color: var(--sf-brand, #121011);
}

.sf-sub__choice > span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ── An order ─────────────────────────────────────────────────── */
.sf-order {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--sf-input-border, #c9c9c9);
  border-radius: var(--sf-radius, 8px);
}

.sf-order__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
}

.sf-order__what {
  min-width: 0;
}

.sf-order__what p {
  margin: 4px 0 0;
  font-size: 14px;
}

.sf-order__number {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.sf-order__lines {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-order__line {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
}

.sf-order__thumb {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: min(var(--sf-radius, 6px), 6px);
  background: var(--sf-surface, #f7f7f5);
  color: #5f5f5f;
}

.sf-order__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-order__line-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sf-order__line-name {
  font-weight: 600;
}

.sf-order__more {
  margin: -4px 0 0;
  font-size: 14px;
}

.sf-order__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  padding-top: 16px;
  border-top: 1px solid var(--sf-divider, #f0f0f0);
}

.sf-order__total {
  margin: 0;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.sf-order__total strong {
  margin-left: 6px;
  font-weight: 700;
}

.sf-order__view {
  height: 44px;
  padding: 0 18px;
  font-size: 14px;
}

/* ── The sections drawing ─────────────────────────────────────────
   The store's narrow reading measure (shared with its policy pages) and gutter; card
   headings in the theme's heading type; the message and the subscription states in
   the theme's surface and text, their meaning in the icon's or dot's colour. */
.sf-acct.sf-acct--sections {
  max-width: var(--sf-measure-narrow, 860px);
  padding-inline: var(--sf-gutter, 24px);
}

.sf-acct--sections .sf-order__number,
.sf-acct--sections .sf-sub__name {
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 24px;
  font-weight: var(--sf-heading-weight, 600);
  line-height: 1.2;
  text-transform: var(--sf-heading-case, none);
}

.sf-acct--sections .sf-acct__message {
  border: 1px solid var(--sf-divider, #e3e3e0);
  background: var(--sf-surface, #e3f2e6);
  color: var(--sf-text, #1b4d20);
}

.sf-acct--sections .sf-acct__message .v-icon {
  color: #2e6b34;
}

.sf-acct--sections .sf-acct__message:focus-visible {
  outline-color: var(--sf-text, #1b4d20);
}

.sf-acct--sections .sf-sub__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--sf-divider, #e3e3e0);
  border-radius: var(--sf-corner, 999px);
  background: var(--sf-surface, #f7f7f5);
  color: var(--sf-text, #121011);
  font-weight: 500;
}

.sf-acct--sections .sf-sub__status::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sf-muted, #5f5f5f);
}

.sf-acct--sections .sf-sub__status--active::before { background: #2e6b34; }
.sf-acct--sections .sf-sub__status--paused::before { background: #8a5a00; }
.sf-acct--sections .sf-sub__status--payment-failed::before { background: #b3261e; }

@media (max-width: 640px) {
  .sf-acct {
    padding: 24px 16px 0;
  }

  .sf-sub {
    padding: 16px;
  }

  .sf-sub__top {
    flex-wrap: wrap;
  }

  .sf-sub__thumb {
    width: 56px;
    height: 56px;
  }

  /* The sections drawing's name is large and may be uppercase ("VITAHEAL ELECTROLYTES"):
     a smaller size, and a column that asks for 10rem, so the status drops under the name
     instead of squeezing it. A word still wider than the column breaks, never runs out. */
  .sf-acct--sections .sf-sub__what {
    flex: 1 1 10rem;
  }

  .sf-acct--sections .sf-sub__name {
    font-size: 20px;
    overflow-wrap: anywhere;
  }

  .sf-sub__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sf-sub__cancel {
    margin-left: 0;
  }

  .sf-order {
    padding: 16px;
  }

  .sf-order__head {
    flex-direction: column;
  }

  .sf-order__view {
    width: 100%;
  }
}
</style>
