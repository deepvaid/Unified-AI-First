<script setup lang="ts">
import { computed, inject, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatMoney, sum } from '@/maropay/money'
import type { CheckoutLineItem } from '@/maropay/model'
import { isEmail } from '@/maropay/onboarding'
import { MAROPAY_STORE_ROUTE } from '@/maropay/readiness'
import { cardErrors, flowForMethod, payButtonText } from '@/maropay/storefront'
import type { CardInput, ShopperMethod } from '@/maropay/storefront'
import { useCommerceStore } from '@/stores/useCommerce'
import { useMaropayStore } from '@/stores/useMaropay'
import { MAX_QTY, lineTotal, useStorefrontCartStore } from '@/stores/useStorefrontCart'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontCardFields from './StorefrontCardFields.vue'
import StorefrontCheckoutSheet from './StorefrontCheckoutSheet.vue'
import StorefrontExpressButtons from './StorefrontExpressButtons.vue'
import StorefrontPayButton from './StorefrontPayButton.vue'
import StorefrontPaymentOptions from './StorefrontPaymentOptions.vue'
import { STOREFRONT } from './storefrontContext'
import { CATEGORY_ICONS, productHandle } from './storefrontCatalog'

// The store's checkout (/checkout). One page in the real checkout's order —
// express buttons, then Contact, Delivery and Payment — beside the order summary.
// Payment follows the store's Maropay setup (Store › Payments): the methods in the
// merchant's order with the default chosen, cards offered as Maropay, the pay
// button's words, and express buttons when they're on. Each payment runs through
// Maropay like a real one and lands as an order in Commerce and a payment in
// Maropay Transactions. `?session=` keeps the outcome across a reload.

const route = useRoute()
const router = useRouter()
const storefront = inject(STOREFRONT)!
const maropay = useMaropayStore()
const commerce = useCommerceStore()
const cart = useStorefrontCartStore()

const channelId = computed(() => storefront.channel.value.id)
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const currency = computed(() => storefront.currency.value)
const storeName = computed(() => storefront.chrome.value.wordmark)

function query(key: string): string | null {
  const value = route.query[key]
  return typeof value === 'string' ? value : null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// ── What's being bought ─────────────────────────────────────────────
// Express "buy now" on a product page buys that item alone; otherwise the cart.

const buyNow = computed(() => {
  const product = commerce.products.find((p) => p.id === Number(query('buy')) && p.publishStatus === 'Published')
  return product ? { product, qty: Math.min(MAX_QTY, Math.max(1, Math.floor(Number(query('qty')) || 1))) } : null
})

const lineItems = computed<CheckoutLineItem[]>(() => (buyNow.value
  ? [{ product: buyNow.value.product.name, sku: buyNow.value.product.sku, qty: buyNow.value.qty, price: buyNow.value.product.price }]
  : cart.linesFor(channelId.value).map((l) => ({ product: l.name, sku: l.sku, qty: l.qty, price: l.price }))))

// ── The payment under way (persisted, so a reload resumes it) ──────

const session = computed(() => {
  const id = query('session')
  return id ? maropay.state.sessions.find((s) => s.id === id && s.channelId === channelId.value) ?? null : null
})
const payment = computed(() => (session.value?.paymentId ? maropay.paymentById(session.value.paymentId) ?? null : null))
const done = computed(() => session.value?.state === 'complete' || session.value?.state === 'processing')

/** After the order is placed the summary shows what was bought, not the (now empty) cart. */
const shownLines = computed(() => (done.value && session.value ? session.value.lineItems : lineItems.value))
const total = computed(() => sum(shownLines.value.map((l) => lineTotal(l, currency.value)), currency.value))
const itemCount = computed(() => shownLines.value.reduce((n, l) => n + l.qty, 0))
const offer = computed(() => storefront.offerFor(total.value))

function iconFor(line: CheckoutLineItem): string {
  const category = commerce.products.find((p) => p.sku === line.sku)?.category
  return (category && CATEGORY_ICONS[category]) || 'package'
}

const editHref = computed(() => (buyNow.value ? `/products/${productHandle(buyNow.value.product)}` : '/cart-page'))

// ── Form ─────────────────────────────────────────────────────────────
// A sample shopper is filled in so a test payment is one press away.

const contact = reactive({ email: 'ava.brown@example.com', news: false })
const delivery = ref<'ship' | 'pickup'>('ship')
const address = reactive({ firstName: 'Ava', lastName: 'Brown', address1: '200 Market Street', city: 'San Francisco', region: 'CA', postcode: '94105', country: 'United States' })
const COUNTRIES = ['United States', 'Canada', 'Australia', 'New Zealand', 'United Kingdom']
const card = ref<CardInput>({ number: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' })

/** While Maropay isn't taking the store's payments, its current provider's card form stands alone. */
const options = computed<ShopperMethod[]>(() => (offer.value.live ? offer.value.methods : [{
  id: 'current_provider_card',
  providerId: offer.value.cardsVia ?? 'maropay',
  providerLabel: offer.value.providerLabel ?? '',
  label: 'Credit or debit card',
  caption: `Processed by ${offer.value.providerLabel ?? 'the store’s payment provider'}`,
  category: 'cards',
  redirects: false,
  delayed: false,
  description: null,
  instructions: null,
}]))

const methodId = ref<string | null>(null)
watch(() => options.value.map((m) => m.id).join(), () => {
  if (!options.value.some((m) => m.id === methodId.value)) methodId.value = offer.value.defaultMethodId ?? options.value[0]?.id ?? null
}, { immediate: true })
const method = computed<ShopperMethod | null>(() => options.value.find((m) => m.id === methodId.value) ?? null)
const isCard = computed(() => method.value?.category === 'cards')

const attempted = ref(false)
const errors = computed<Record<string, string>>(() => {
  const e: Record<string, string> = {}
  if (!isEmail(contact.email)) e.email = 'Enter an email address like name@example.com.'
  if (!address.firstName.trim()) e.firstName = 'Enter a first name.'
  if (!address.lastName.trim()) e.lastName = 'Enter a last name.'
  if (delivery.value === 'ship') {
    if (!address.address1.trim()) e.address1 = 'Enter a street address.'
    if (!address.city.trim()) e.city = 'Enter a city.'
    if (!address.postcode.trim()) e.postcode = 'Enter a postcode or ZIP code.'
  }
  if (isCard.value) {
    for (const [key, message] of Object.entries(cardErrors(card.value, Date.now()))) e[`card.${key}`] = message
  }
  return e
})
function errorFor(key: string): string | null {
  return attempted.value ? errors.value[key] ?? null : null
}

const shipTo = computed(() => (delivery.value === 'pickup' ? 'Collect in store' : `${address.address1}, ${address.city}`))
const customer = computed(() => ({ name: `${address.firstName} ${address.lastName}`.trim(), email: contact.email.trim() }))

// ── Paying ───────────────────────────────────────────────────────────

const busy = ref(false)
const problem = ref<string | null>(null)
const notLive = ref(false)
/** Apple Pay / Google Pay sheet, before the payment starts. */
const walletId = ref<string | null>(null)

const payButton = ref<InstanceType<typeof StorefrontPayButton> | null>(null)
const doneHeading = ref<HTMLElement | null>(null)

const failure = computed(() => {
  if (session.value?.state !== 'failed') return null
  const label = labelFor(session.value.methodId)
  switch (payment.value?.failure?.code) {
    case 'card_declined': return 'Your card was declined, so nothing was taken. Try another card or another way to pay.'
    case 'authentication_abandoned': return 'You didn’t finish confirming with your bank, so nothing was taken. Try again when you’re ready.'
    case 'redirect_abandoned': return `You didn’t finish on ${label}, so nothing was taken. Try again or choose another way to pay.`
    default: return payment.value?.failure?.message ?? 'The payment didn’t go through, so nothing was taken.'
  }
})
const message = computed(() => problem.value ?? failure.value)

function labelFor(id: string): string {
  return offer.value.methods.find((m) => m.id === id)?.label ?? maropay.methods.find((m) => m.id === id)?.label ?? 'the payment page'
}

const sheet = computed(() => {
  if (session.value?.state === 'requires_action') return 'authenticate' as const
  if (session.value?.state === 'redirected') return 'redirect' as const
  return walletId.value ? ('wallet' as const) : null
})
const sheetMethod = computed(() => {
  const id = sheet.value === 'wallet' ? walletId.value! : session.value?.methodId ?? ''
  return { id, label: labelFor(id) }
})
const sheetInstalment = computed(() => (sheetMethod.value.id === 'affirm' ? offer.value.monthly.amount : offer.value.payIn4.amount))

async function focusFirstError(): Promise<void> {
  await nextTick()
  document.querySelector<HTMLElement>('.sf-co [aria-invalid="true"]')?.focus()
}

async function submit(): Promise<void> {
  if (busy.value) return
  attempted.value = true
  problem.value = null
  notLive.value = false
  if (Object.keys(errors.value).length) return void focusFirstError()
  if (!offer.value.live) {
    notLive.value = true
    return
  }
  const chosen = method.value
  if (!chosen) return
  if (chosen.category === 'wallets' && !chosen.redirects) walletId.value = chosen.id
  else await pay(chosen)
}

/** Express buttons skip the form: the wallet or PayPal supplies the shopper's details. */
async function express(id: string): Promise<void> {
  if (busy.value) return
  const chosen = offer.value.express.find((m) => m.id === id)
  if (!chosen) return
  problem.value = null
  if (chosen.redirects) await pay(chosen)
  else walletId.value = chosen.id
}

async function pay(chosen: ShopperMethod): Promise<void> {
  busy.value = true
  await delay(700)
  const started = maropay.startCheckout({
    channelId: channelId.value,
    methodId: chosen.id,
    flow: flowForMethod(chosen, card.value.number),
    amount: total.value,
    customer: customer.value,
    lineItems: lineItems.value,
  })
  if (!started.ok) {
    busy.value = false
    problem.value = started.error.message
    return refocusPay()
  }
  const { express: _express, ...rest } = route.query
  await router.replace({ query: { ...rest, session: started.value.id } })
  const step = maropay.confirmCheckout(started.value.id)
  busy.value = false
  if (!step.ok) problem.value = step.error.message
  await refocusPay()
}

/** Pay was disabled while busy, which drops focus; give it back when the shopper stays on the form. */
async function refocusPay(): Promise<void> {
  await nextTick()
  if (!done.value && !sheet.value) payButton.value?.focus()
}

async function confirmSheet(): Promise<void> {
  if (sheet.value === 'wallet') {
    const chosen = offer.value.methods.find((m) => m.id === walletId.value)
    walletId.value = null
    if (chosen) await pay(chosen)
    return
  }
  if (!session.value) return
  busy.value = true
  await delay(600)
  const step = maropay.completeCheckoutAction(session.value.id, 'completed')
  busy.value = false
  if (!step.ok) problem.value = step.error.message
}

function cancelSheet(): void {
  if (busy.value) return
  if (sheet.value === 'wallet') walletId.value = null
  else if (session.value) maropay.completeCheckoutAction(session.value.id, 'abandoned')
}

watch(sheet, async (now, before) => {
  if (now || !before) return
  await nextTick()
  if (done.value) doneHeading.value?.focus()
  else payButton.value?.focus()
})

watch(done, async (isDone) => {
  if (!isDone) return
  if (!buyNow.value) cart.clear(channelId.value)
  await nextTick()
  doneHeading.value?.focus()
}, { immediate: true })

onMounted(() => {
  const id = query('express')
  if (id && !session.value) void express(id)
})

// ── After the order ──────────────────────────────────────────────────

const paidWith = computed(() => {
  if (!payment.value) return ''
  return payment.value.methodId === 'card' ? `Maropay · ${payment.value.methodLabel}` : payment.value.methodLabel
})
const adminLinks = computed(() => {
  const s = session.value
  if (!s?.order || !payment.value) return null
  return {
    order: router.resolve({ name: 'OrderDetail', params: { accountId: accountId.value, orderId: String(s.order.id) } }).href,
    payment: router.resolve({ name: 'MaropayPaymentDetail', params: { accountId: accountId.value, paymentId: payment.value.id } }).href,
  }
})
// Switching a store on is a Maropay job: the store's page there links on to the store editor.
const storePaymentsHref = computed(() => router.resolve({ name: MAROPAY_STORE_ROUTE, params: { accountId: accountId.value, channelId: channelId.value } }).href)
</script>

<template>
  <div class="sf-co">
    <!-- ── Order placed ─────────────────────────────────────────── -->
    <section v-if="done && session" class="sf-co__done" aria-labelledby="sf-co-done">
      <v-icon size="48" class="sf-co__done-icon">circle-check</v-icon>
      <p class="sf-muted sf-co__done-number">Order {{ session.order?.orderNumber }}</p>
      <h1 id="sf-co-done" ref="doneHeading" tabindex="-1" class="sf-page-title sf-co__done-title">Thank you, {{ session.customer.name.split(' ')[0] }}!</h1>
      <p v-if="session.state === 'processing'" class="sf-co__done-text">
        Your order is placed. Your bank is confirming the payment, which takes a few business days; we’ll email {{ session.customer.email }} when it’s through.
      </p>
      <p v-else class="sf-co__done-text">Your order is confirmed. We’ve sent a receipt to {{ session.customer.email }}.</p>
      <dl class="sf-co__done-facts">
        <div><dt>Paid with</dt><dd>{{ paidWith }}</dd></div>
        <div><dt>Total</dt><dd>{{ formatMoney(session.amount) }}</dd></div>
      </dl>
      <StorefrontAnchor href="/" class="sf-button">Continue shopping</StorefrontAnchor>
      <p v-if="adminLinks" class="sf-co__demo">
        <strong>Prototype</strong> — what the merchant sees:
        <a :href="adminLinks.order" target="_blank" rel="noopener">the order in Commerce</a> ·
        <a :href="adminLinks.payment" target="_blank" rel="noopener">the payment in Maropay</a>
      </p>
    </section>

    <!-- ── Nothing to buy ───────────────────────────────────────── -->
    <section v-else-if="!lineItems.length" class="sf-co__empty">
      <h1 class="sf-page-title">Your Shopping Cart is Empty!</h1>
      <StorefrontAnchor href="/" class="sf-button">Start Shopping!</StorefrontAnchor>
    </section>

    <!-- ── Checkout ─────────────────────────────────────────────── -->
    <template v-else>
      <h1 class="sr-only">Checkout</h1>
      <div class="sf-co__layout">
        <form class="sf-co__form" novalidate @submit.prevent="submit">
          <section v-if="offer.express.length" class="sf-co__express" aria-labelledby="sf-co-express">
            <h2 id="sf-co-express" class="sf-co__express-title">Express checkout</h2>
            <StorefrontExpressButtons :methods="offer.express" :disabled="busy" @pick="express" />
            <p class="sf-or">OR</p>
          </section>

          <section class="sf-co__step" aria-labelledby="sf-co-contact">
            <h2 id="sf-co-contact" class="sf-co__step-title"><span class="sf-co__num" aria-hidden="true">1</span> Contact</h2>
            <div class="sf-field">
              <label for="sf-co-email">Email</label>
              <input id="sf-co-email" v-model="contact.email" class="sf-input" type="email" autocomplete="email" :aria-invalid="!!errorFor('email')" :aria-describedby="errorFor('email') ? 'sf-co-email-err' : undefined">
              <span v-if="errorFor('email')" id="sf-co-email-err" class="sf-field__error">{{ errorFor('email') }}</span>
            </div>
            <label class="sf-co__check">
              <input v-model="contact.news" type="checkbox">
              Email me news and offers
            </label>
          </section>

          <section class="sf-co__step" aria-labelledby="sf-co-delivery">
            <h2 id="sf-co-delivery" class="sf-co__step-title"><span class="sf-co__num" aria-hidden="true">2</span> Delivery</h2>
            <div class="sf-co__choices" role="radiogroup" aria-label="Delivery">
              <label class="sf-co__choice" :class="{ 'is-selected': delivery === 'ship' }">
                <input v-model="delivery" type="radio" name="sf-co-delivery" value="ship">
                <v-icon size="20">truck</v-icon>
                <span><strong>Home delivery</strong><span class="sf-muted">3–5 business days · Free</span></span>
              </label>
              <label class="sf-co__choice" :class="{ 'is-selected': delivery === 'pickup' }">
                <input v-model="delivery" type="radio" name="sf-co-delivery" value="pickup">
                <v-icon size="20">store</v-icon>
                <span><strong>Click &amp; collect</strong><span class="sf-muted">Collect from the store · Free</span></span>
              </label>
            </div>
            <div class="sf-co__grid">
              <div class="sf-field">
                <label for="sf-co-first">First name</label>
                <input id="sf-co-first" v-model="address.firstName" class="sf-input" autocomplete="given-name" :aria-invalid="!!errorFor('firstName')" :aria-describedby="errorFor('firstName') ? 'sf-co-first-err' : undefined">
                <span v-if="errorFor('firstName')" id="sf-co-first-err" class="sf-field__error">{{ errorFor('firstName') }}</span>
              </div>
              <div class="sf-field">
                <label for="sf-co-last">Last name</label>
                <input id="sf-co-last" v-model="address.lastName" class="sf-input" autocomplete="family-name" :aria-invalid="!!errorFor('lastName')" :aria-describedby="errorFor('lastName') ? 'sf-co-last-err' : undefined">
                <span v-if="errorFor('lastName')" id="sf-co-last-err" class="sf-field__error">{{ errorFor('lastName') }}</span>
              </div>
              <template v-if="delivery === 'ship'">
                <label class="sf-field sf-co__full">
                  Country
                  <select v-model="address.country" class="sf-input" autocomplete="country-name">
                    <option v-for="country in COUNTRIES" :key="country">{{ country }}</option>
                  </select>
                </label>
                <div class="sf-field sf-co__full">
                  <label for="sf-co-addr">Address</label>
                  <input id="sf-co-addr" v-model="address.address1" class="sf-input" autocomplete="address-line1" :aria-invalid="!!errorFor('address1')" :aria-describedby="errorFor('address1') ? 'sf-co-addr-err' : undefined">
                  <span v-if="errorFor('address1')" id="sf-co-addr-err" class="sf-field__error">{{ errorFor('address1') }}</span>
                </div>
                <div class="sf-field">
                  <label for="sf-co-city">City</label>
                  <input id="sf-co-city" v-model="address.city" class="sf-input" autocomplete="address-level2" :aria-invalid="!!errorFor('city')" :aria-describedby="errorFor('city') ? 'sf-co-city-err' : undefined">
                  <span v-if="errorFor('city')" id="sf-co-city-err" class="sf-field__error">{{ errorFor('city') }}</span>
                </div>
                <div class="sf-co__pair">
                  <label class="sf-field">
                    State
                    <input v-model="address.region" class="sf-input" autocomplete="address-level1">
                  </label>
                  <div class="sf-field">
                    <label for="sf-co-post">Postcode</label>
                    <input id="sf-co-post" v-model="address.postcode" class="sf-input" autocomplete="postal-code" :aria-invalid="!!errorFor('postcode')" :aria-describedby="errorFor('postcode') ? 'sf-co-post-err' : undefined">
                    <span v-if="errorFor('postcode')" id="sf-co-post-err" class="sf-field__error">{{ errorFor('postcode') }}</span>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <fieldset class="sf-co__step sf-co__payment">
            <legend class="sf-co__step-title"><span class="sf-co__num" aria-hidden="true">3</span> Payment</legend>
            <p class="sf-co__note sf-muted"><v-icon size="14">lock</v-icon> All payments are secure and encrypted.</p>

            <StorefrontPaymentOptions v-model:method-id="methodId" :options="options" :pay-button="offer.payButton" :total="total" name="sf-co-method">
              <template #card>
                <StorefrontCardFields
                  v-model:card="card"
                  id-prefix="sf-co"
                  :errors="{ number: errorFor('card.number'), expiry: errorFor('card.expiry'), cvc: errorFor('card.cvc') }"
                  :test-cards="offer.live"
                />
              </template>
            </StorefrontPaymentOptions>
          </fieldset>

          <div v-if="message" class="sf-co__alert" role="alert">
            <v-icon size="18">circle-alert</v-icon>
            <span>{{ message }}</span>
          </div>
          <div v-if="notLive" class="sf-co__alert sf-co__alert--info" role="alert">
            <v-icon size="18">info</v-icon>
            <span>
              {{ storeName }} takes payments through {{ offer.providerLabel ?? 'its current provider' }}, which this prototype doesn’t run.
              To take a test payment here, turn Maropay on for {{ storeName }} in
              <a :href="storePaymentsHref" target="_blank" rel="noopener">Maropay</a>.
            </span>
          </div>

          <StorefrontPayButton
            ref="payButton"
            :label="busy ? 'Processing…' : payButtonText(offer.live ? method : null, offer.payButton, total)"
            :busy="busy"
            :secured="offer.live"
          />
          <p class="sr-only" role="status">{{ busy ? 'Processing your payment' : '' }}</p>
        </form>

        <aside class="sf-co__summary" aria-labelledby="sf-co-summary">
          <div class="sf-co__summary-head">
            <h2 id="sf-co-summary" class="sf-co__summary-title">Order summary</h2>
            <StorefrontAnchor :href="editHref" class="sf-co__edit">{{ buyNow ? 'Edit' : 'Edit cart' }}</StorefrontAnchor>
          </div>
          <ul class="sf-co__lines">
            <li v-for="line in shownLines" :key="line.sku">
              <span class="sf-co__thumb" aria-hidden="true">
                <v-icon size="22">{{ iconFor(line) }}</v-icon>
                <span class="sf-co__qty">{{ line.qty }}</span>
              </span>
              <span class="sf-co__line-name">{{ line.product }}<span class="sr-only">, quantity {{ line.qty }}</span></span>
              <span>{{ formatMoney(lineTotal(line, currency)) }}</span>
            </li>
          </ul>
          <dl class="sf-co__sums">
            <div><dt>Subtotal · {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</dt><dd>{{ formatMoney(total) }}</dd></div>
            <div><dt>Shipping</dt><dd>Free</dd></div>
            <div class="sf-co__grand"><dt>Total</dt><dd><span class="sf-muted sf-co__currency">{{ currency }}</span> {{ formatMoney(total) }}</dd></div>
          </dl>
        </aside>
      </div>
    </template>

    <StorefrontCheckoutSheet
      v-if="sheet"
      :kind="sheet"
      :method="sheetMethod"
      :store-name="storeName"
      :total="total"
      :email="customer.email"
      :ship-to="shipTo"
      :instalment="sheetInstalment"
      :busy="busy"
      @confirm="confirmSheet"
      @cancel="cancelSheet"
    />
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-co {
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 24px 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.sf-co__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 48px;
  align-items: start;
}

.sf-co__form {
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
}

.sf-co__express {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sf-co__express-title {
  margin: 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.sf-co__step {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.sf-co__step-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 0;
  font-size: 20px;
  font-weight: 700;
}

/* A legend only lays out like a heading as a block. */
legend.sf-co__step-title {
  float: left;
  width: 100%;
}

.sf-co__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--sf-brand, #121011);
  color: var(--sf-bg, #ffffff);
  font-size: 13px;
  font-weight: 700;
}

.sf-co__check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.sf-co__choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.sf-co__choice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--sf-input-border, #c9c9c9);
  border-radius: 8px;
  cursor: pointer;
}

.sf-co__choice > span {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
}

.sf-co__choice.is-selected {
  border-color: var(--sf-brand, #121011);
  box-shadow: inset 0 0 0 1px var(--sf-brand, #121011);
}

.sf-co__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.sf-co__full {
  grid-column: 1 / -1;
}

.sf-co__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.sf-co__note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -8px 0 0;
  font-size: 13px;
}

.sf-co__choice input {
  width: 18px;
  height: 18px;
  margin: 0;
  flex-shrink: 0;
  accent-color: var(--sf-brand, #121011);
}

.sf-co__choice input:focus-visible,
.sf-co__check input:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sf-co__alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #fdecea;
  color: #8a1c13;
  font-size: 14px;
  line-height: 20px;
}

.sf-co__alert--info {
  background: #eef4fb;
  color: #123a63;
}

.sf-co__alert a {
  text-decoration: underline;
}

.sf-co__summary {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  background: #f7f7f5;
}

.sf-co__summary-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.sf-co__summary-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.sf-co__edit {
  font-size: 14px;
  text-decoration: underline !important;
}

.sf-co__lines {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-co__lines li {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.sf-co__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  aspect-ratio: 1;
  border: 1px solid #e3e3e0;
  border-radius: 6px;
  background: #ffffff;
  color: #8a8780;
}

.sf-co__qty {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #5f5f5f;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.sf-co__sums {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid #e3e3e0;
  font-size: 14px;
}

.sf-co__sums div {
  display: flex;
  justify-content: space-between;
}

.sf-co__sums dd {
  margin: 0;
}

.sf-co__grand {
  padding-top: 12px;
  border-top: 1px solid #e3e3e0;
  font-size: 18px;
  font-weight: 700;
}

.sf-co__currency {
  font-size: 12px;
  font-weight: 500;
}

.sf-co__done,
.sf-co__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 560px;
  margin: 24px auto 0;
  text-align: center;
}

.sf-co__done-icon {
  color: #2e7d32;
}

.sf-co__done-number {
  margin: 0;
  font-size: 14px;
}

.sf-co__done-title {
  outline: none;
}

.sf-co__done-text {
  margin: 0;
}

.sf-co__done-facts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 8px 0;
  padding: 16px 20px;
  border-radius: 8px;
  background: #f7f7f5;
  font-size: 14px;
}

.sf-co__done-facts div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.sf-co__done-facts dd {
  margin: 0;
  font-weight: 600;
}

.sf-co__demo {
  margin: 16px 0 0;
  padding: 12px 16px;
  border: 1px dashed #b6b6b6;
  border-radius: 8px;
  font-size: 13px;
}

.sf-co__demo a {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .sf-co__layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .sf-co__summary {
    position: static;
    order: -1;
  }

  .sf-co__choices,
  .sf-co__grid {
    grid-template-columns: 1fr;
  }
}
</style>
