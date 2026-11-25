<script setup lang="ts">
import { computed, inject, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sum } from '@/maropay/money'
import type { CheckoutCustomer, CheckoutLineItem } from '@/maropay/model'
import { isEmail } from '@/maropay/onboarding'
import { MAROPAY_STORE_ROUTE } from '@/maropay/readiness'
import { cardErrors, cardLabel, flowForMethod, payButtonText } from '@/maropay/storefront'
import type { CardInput, ShopperMethod } from '@/maropay/storefront'
import { lineProduct } from '@/storefront/cart'
import type { SnapshotCheckout } from '@/storefront/demoStores'
import { lineVehicle } from '@/storefront/fitment'
import { lineDetailText, lineImage, lineProductQuery, orderParam, withQuery } from '@/storefront/shopperOrders'
import { variantAvailable } from '@/storefront/variants'
import { useCommerceStore } from '@/stores/useCommerce'
import { useDemoStores } from '@/stores/useDemoStores'
import { useMaropayStore } from '@/stores/useMaropay'
import { MAX_QTY, lineTotal, useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useStorefrontShopperStore } from '@/stores/useStorefrontShopper'
import { deliverySummary, nextChargeDate, recurringCharges } from '@/subscriptions/plans'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontCardFields from './StorefrontCardFields.vue'
import StorefrontCheckoutSheet from './StorefrontCheckoutSheet.vue'
import StorefrontDiscountCode from './StorefrontDiscountCode.vue'
import { useStorefrontDiscount } from './storefrontDiscount'
import StorefrontExpressButtons from './StorefrontExpressButtons.vue'
import StorefrontLineText from './StorefrontLineText.vue'
import StorefrontPayButton from './StorefrontPayButton.vue'
import StorefrontPaymentOptions from './StorefrontPaymentOptions.vue'
import StorefrontReceipt from './StorefrontReceipt.vue'
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
const shopper = useStorefrontShopperStore()

const channelId = computed(() => storefront.channel.value.id)
const accountId = computed(() => String(route.params.accountId ?? '2000290'))
const currency = computed(() => storefront.currency.value)
/** Every amount here is what is charged, to the last cent, written the store's way ("585,90 kr"). */
const formatMoney = storefront.formatExact
/**
 * Where the store delivers and who the form is filled in with. A demo store's own
 * checkout (src/storefront/demoStores) also says whether it offers Click & collect
 * and keeps the address typed here on the order.
 */
const profile: SnapshotCheckout = useDemoStores().snapshotOf(channelId.value)?.checkout ?? storefront.checkout.value
/** Click & collect is offered unless the store says it has no counter to collect from. */
const pickupOffered = profile.pickup !== false
const storeName = computed(() => storefront.chrome.value.wordmark)

function query(key: string): string | null {
  const value = route.query[key]
  return typeof value === 'string' ? value : null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// ── What's being bought ─────────────────────────────────────────────
// Express "buy now" on a product page buys that item alone, in the variant chosen
// there (`?buy=<productId>&variant=<variantId>`); otherwise the cart.

const buyNow = computed(() => {
  const product = commerce.products.find((p) => p.id === Number(query('buy')) && p.publishStatus === 'Published')
  if (!product) return null
  // A variant counts only where the product has a choice to make, as in the cart.
  const variant = product.detail?.options.length ? product.detail.variantsList.find((v) => String(v.id) === query('variant')) : undefined
  return { product, variant, qty: Math.min(MAX_QTY, Math.max(1, Math.floor(Number(query('qty')) || 1))) }
})

/**
 * On the sections drawing the product page always names a variant in stock: a buy-now
 * link that names none, or one sold out, has nothing to buy (never an order for an
 * unknown size, and never the cart instead).
 */
const unbuyable = computed(() => {
  const now = buyNow.value
  return !!now && storefront.sectionsDrawing.value && !!now.product.detail?.options.length && (!now.variant || !variantAvailable(now.variant))
})

/** The vehicle a buy-now part names, as a cart line does: the shopper's, when the choice bought fits it. */
const buyNowVehicle = computed(() => (buyNow.value ? lineVehicle(buyNow.value.product, buyNow.value.variant, storefront.vehicle.value) : undefined))

const lineItems = computed<CheckoutLineItem[]>(() => (unbuyable.value ? [] : buyNow.value
  ? [{
      product: buyNow.value.product.name,
      sku: buyNow.value.variant?.sku || buyNow.value.product.sku,
      qty: buyNow.value.qty,
      price: buyNow.value.variant?.price || buyNow.value.product.price,
      productId: buyNow.value.product.id,
      ...(buyNow.value.variant ? { variantId: buyNow.value.variant.id, variantTitle: buyNow.value.variant.title } : {}),
      ...(buyNowVehicle.value ? { vehicle: buyNowVehicle.value } : {}),
    }]
  : cart.linesFor(channelId.value).map((l) => ({
      product: l.name,
      sku: l.sku,
      qty: l.qty,
      price: l.price,
      productId: l.productId,
      ...(l.variantId !== undefined ? { variantId: l.variantId } : {}),
      ...(l.variantTitle ? { variantTitle: l.variantTitle } : {}),
      ...(l.vehicle ? { vehicle: l.vehicle } : {}),
      ...(l.plan ? { plan: l.plan } : {}),
    }))))

// ── The payment under way (persisted, so a reload resumes it) ──────

const session = computed(() => {
  const id = query('session')
  return id ? maropay.state.sessions.find((s) => s.id === id && s.channelId === channelId.value) ?? null : null
})
const payment = computed(() => (session.value?.paymentId ? maropay.paymentById(session.value.paymentId) ?? null : null))
const done = computed(() => session.value?.state === 'complete' || session.value?.state === 'processing')

/** After the order is placed the summary shows what was bought, not the (now empty) cart. */
const shownLines = computed(() => (done.value && session.value ? session.value.lineItems : lineItems.value))
const subtotal = computed(() => sum(shownLines.value.map((l) => lineTotal(l, currency.value)), currency.value))

// ── Discount code ────────────────────────────────────────────────────
// A campaign's code lowers this order: the total, the pay button and what is
// charged. Each covered line carries the code, so the order in the admin shows it.
const code = useStorefrontDiscount(() => lineItems.value, () => subtotal.value)
const total = computed(() => code.payable.value)
/** The lines as they are paid for: covered ones say which code took what off. */
const paidLines = computed<CheckoutLineItem[]>(() => {
  const discount = code.discount.value
  if (!discount) return lineItems.value
  return lineItems.value.map((line, index) => (discount.covers[index] ? { ...line, coupon: discount.code, discountPct: discount.discountPct } : line))
})
const itemCount = computed(() => shownLines.value.reduce((n, l) => n + l.qty, 0))
const offer = computed(() => storefront.offerFor(total.value))

// ── Subscriptions ────────────────────────────────────────────────────
// A line bought on a plan is charged again each interval, so the shopper has to
// agree to that here. Express buttons skip this form, so they are not offered.

/** What is charged again, and how often. */
const recurring = computed(() => recurringCharges(shownLines.value, (line) => lineTotal(line, currency.value)))
const recurringText = computed(() => recurring.value.map((c) => `${formatMoney(c.amount)} ${c.interval}`).join(' and '))
const consent = ref(false)
const expressMethods = computed(() => (recurring.value.length ? [] : offer.value.express))
/** The next charge of the soonest plan, for the confirmation. */
const nextCharge = computed(() => {
  const s = session.value
  if (!s?.order) return null
  const dates = s.lineItems.flatMap((l) => (l.plan ? [nextChargeDate(s.order!.date, l.plan)] : [])).sort()
  return dates[0] ? new Date(`${dates[0]}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null
})

function iconFor(line: CheckoutLineItem): string {
  const category = lineProduct(commerce.products, line)?.category
  return (category && CATEGORY_ICONS[category]) || 'package'
}

/** The line's picture: the chosen colour's own photo, else the product's first. */
function imageFor(line: CheckoutLineItem): string | undefined {
  return lineImage(lineProduct(commerce.products, line), line)
}

/** "Size M · Sand", or "Front · Part # TQ-BRK-4471 · Fits 2019 Ford F-150" on a store that sells parts, under the line's name. */
function variantText(line: CheckoutLineItem): string {
  return lineDetailText(lineProduct(commerce.products, line), line, { partNumber: storefront.sellsParts.value })
}

/** Back to what is being bought: the product page on the variant chosen, or the cart. */
const editHref = computed(() => {
  const now = buyNow.value
  if (!now) return '/cart-page'
  if (unbuyable.value) return `/products/${productHandle(now.product)}`
  const line = lineItems.value[0]!
  return withQuery(`/products/${productHandle(now.product)}`, lineProductQuery(now.product, line))
})

// ── Form ─────────────────────────────────────────────────────────────
// A sample shopper is filled in so a test payment is one press away. Who that is and
// where the store delivers follow the store (src/storefront/checkoutProfile.ts).

const { email: sampleEmail, ...sampleAddress } = profile.shopper
const contact = reactive({ email: sampleEmail, news: false })
const delivery = ref<'ship' | 'pickup'>('ship')
const address = reactive({ ...sampleAddress })
const card = ref<CardInput>({ number: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' })

/** Every provider's methods, in the store's lineup order — Maropay's beside the merchant's own and the manual ones. */
const options = computed<ShopperMethod[]>(() => offer.value.methods)

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
  if (recurring.value.length && !consent.value) e.consent = 'Tick the box to agree to the repeat charges.'
  return e
})
function errorFor(key: string): string | null {
  return attempted.value ? errors.value[key] ?? null : null
}

/** A US address has a ZIP code. Said so on the sections drawing; every other theme keeps "Postcode". */
const postcodeLabel = computed(() => (storefront.sectionsDrawing.value && address.country === 'United States' ? 'ZIP code' : 'Postcode'))

const shipTo = computed(() => (delivery.value === 'pickup' ? 'Collect in store' : `${address.address1}, ${address.city}`))
/** The address goes with the order for a store that keeps it; "Collect in store" stands in for the street on a pickup. */
const customer = computed<CheckoutCustomer>(() => ({
  name: `${address.firstName} ${address.lastName}`.trim(),
  email: contact.email.trim(),
  ...(profile.keepsAddress
    ? {
        address: delivery.value === 'pickup'
          ? { line1: 'Collect in store', city: '', region: '', postalCode: '', country: address.country }
          : { line1: address.address1.trim(), city: address.city.trim(), region: address.region.trim(), postalCode: address.postcode.trim(), country: address.country },
      }
    : {}),
}))

// ── Paying ───────────────────────────────────────────────────────────

const busy = ref(false)
const problem = ref<string | null>(null)
/** Apple Pay / Google Pay sheet, before the payment starts. */
const walletId = ref<string | null>(null)

const payButton = ref<InstanceType<typeof StorefrontPayButton> | null>(null)
const receipt = ref<InstanceType<typeof StorefrontReceipt> | null>(null)

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
  if (Object.keys(errors.value).length) return void focusFirstError()
  const chosen = method.value
  if (!chosen) return
  if (chosen.category === 'wallets' && !chosen.redirects) walletId.value = chosen.id
  else await pay(chosen)
}

/** Express buttons skip the form: the wallet or PayPal supplies the shopper's details. */
async function express(id: string): Promise<void> {
  if (busy.value) return
  const chosen = expressMethods.value.find((m) => m.id === id)
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
    lineItems: paidLines.value,
    cardLabel: chosen.category === 'cards' ? cardLabel(card.value.number) : null,
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
  if (done.value) receipt.value?.focus()
  else payButton.value?.focus()
})

watch(done, async (isDone) => {
  if (!isDone) return
  if (!buyNow.value) cart.clear(channelId.value)
  // On a store with an account page, whoever just paid is signed in: "Manage your subscription" opens
  // without asking who they are, and the store's chatbot can find the order they just placed.
  if (session.value && storefront.chrome.value.accountHref) shopper.signIn(channelId.value, session.value.customer.email)
  await nextTick()
  receipt.value?.focus()
}, { immediate: true })

onMounted(() => {
  const id = query('express')
  if (id && !session.value) void express(id)
})

// ── After the order ──────────────────────────────────────────────────

/** The order's page in the account, where the shopper is signed in by now; only on a demo store with an account page (the others' accounts list no orders). */
const orderHref = computed(() => {
  const number = session.value?.order?.orderNumber
  return number && storefront.demo.value && storefront.chrome.value.accountHref ? `/account/orders/${orderParam(number)}` : null
})

/** A manual method's instructions, from the offer the shopper paid through. */
const instructions = computed(() => (session.value ? offer.value.methods.find((m) => m.id === session.value!.methodId)?.instructions ?? null : null))
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
  <div class="sf-co" :class="{ 'sf-co--sections': storefront.sectionsDrawing.value }">
    <!-- ── Order placed ─────────────────────────────────────────── -->
    <section v-if="done && session" class="sf-co__done" aria-labelledby="sf-co-done">
      <StorefrontReceipt
        ref="receipt"
        :session="session"
        :payment="payment"
        :instructions="instructions"
        :store-name="storefront.chrome.value.wordmark"
        :home-href="storefront.link('/')"
        :auto-return="!storefront.demo.value"
        :order-href="orderHref"
      />
      <p v-if="nextCharge" class="sf-co__subscribed">
        <v-icon size="18">repeat</v-icon>
        <span>
          Your subscription has started. The next charge is on {{ nextCharge }}.
          <StorefrontAnchor href="/account" class="sf-co__manage">Manage your subscription</StorefrontAnchor>
        </span>
      </p>
      <p v-if="adminLinks" class="sf-co__demo">
        <strong>{{ storefront.demo.value ? 'What the merchant sees:' : 'Prototype' }}</strong>
        {{ storefront.demo.value ? '' : '— what the merchant sees:' }}
        <a :href="adminLinks.order" target="_blank" rel="noopener">the order in Commerce</a>
        <!-- A store shown to prospects links to Maropay only for a payment Maropay took. -->
        <template v-if="!storefront.demo.value || payment?.provider === 'maropay'">
          · <a :href="adminLinks.payment" target="_blank" rel="noopener">the payment in Maropay</a>
        </template>
      </p>
    </section>

    <!-- ── Nothing to buy ───────────────────────────────────────── -->
    <section v-else-if="!lineItems.length" class="sf-co__empty">
      <template v-if="unbuyable">
        <h1 class="sf-page-title">Choose a {{ buyNow!.product.detail!.options.map((o) => o.name.toLowerCase()).join(' and ') }} first</h1>
        <StorefrontAnchor :href="editHref" class="sf-button">Back to {{ buyNow!.product.name }}</StorefrontAnchor>
      </template>
      <template v-else-if="storefront.sectionsDrawing.value">
        <h1 class="sf-page-title">Your cart is empty</h1>
        <StorefrontAnchor href="/collections/all" class="sf-button">Start shopping</StorefrontAnchor>
      </template>
      <template v-else>
        <h1 class="sf-page-title">Your Shopping Cart is Empty!</h1>
        <StorefrontAnchor href="/" class="sf-button">Start Shopping!</StorefrontAnchor>
      </template>
    </section>

    <!-- ── Checkout ─────────────────────────────────────────────── -->
    <template v-else>
      <h1 class="sr-only">Checkout</h1>
      <div class="sf-co__layout">
        <form class="sf-co__form" novalidate @submit.prevent="submit">
          <section v-if="expressMethods.length" class="sf-co__express" aria-labelledby="sf-co-express">
            <h2 id="sf-co-express" class="sf-co__express-title">Express checkout</h2>
            <StorefrontExpressButtons :methods="expressMethods" :disabled="busy" @pick="express" />
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
            <div v-if="pickupOffered" class="sf-co__choices" role="radiogroup" aria-label="Delivery">
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
            <!-- A store without a counter ships every order: one way, nothing to choose. -->
            <p v-else class="sf-co__choice sf-co__choice--only">
              <v-icon size="20" aria-hidden="true">truck</v-icon>
              <span><strong>Home delivery</strong><span class="sf-muted">3–5 business days · Free</span></span>
            </p>
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
                    <option v-for="country in profile.countries" :key="country">{{ country }}</option>
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
                <div :class="{ 'sf-co__pair': profile.regionLabel }">
                  <label v-if="profile.regionLabel" class="sf-field">
                    {{ profile.regionLabel }}
                    <input v-model="address.region" class="sf-input" autocomplete="address-level1">
                  </label>
                  <div class="sf-field">
                    <label for="sf-co-post">{{ postcodeLabel }}</label>
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

            <StorefrontPaymentOptions v-if="options.length" v-model:method-id="methodId" :options="options" :pay-button="offer.payButton" :total="total" name="sf-co-method">
              <template #card>
                <StorefrontCardFields
                  v-model:card="card"
                  id-prefix="sf-co"
                  :errors="{ number: errorFor('card.number'), expiry: errorFor('card.expiry'), cvc: errorFor('card.cvc') }"
                  test-cards
                />
              </template>
            </StorefrontPaymentOptions>
            <!-- No provider at all: nothing to choose, nothing to press. -->
            <div v-else class="sf-co__none">
              <p><strong>{{ storeName }} isn’t taking online payments yet.</strong></p>
              <p class="sf-muted sf-co__none-note">
                <template v-if="!storefront.demo.value">Prototype: connect</template><template v-else>Connect</template> a provider or activate Maropay on the store’s
                <a :href="storePaymentsHref" target="_blank" rel="noopener">Payments page</a> and this checkout follows.
              </p>
            </div>
          </fieldset>

          <div v-if="recurring.length" class="sf-co__consent">
            <label class="sf-co__check sf-co__check--top">
              <input
                id="sf-co-consent"
                v-model="consent"
                type="checkbox"
                :aria-invalid="!!errorFor('consent')"
                :aria-describedby="errorFor('consent') ? 'sf-co-consent-err' : undefined"
              >
              <span>
                I agree that {{ storeName }} charges my payment method {{ recurringText }} until I cancel.
                My payment method is saved for these charges.
              </span>
            </label>
            <span v-if="errorFor('consent')" id="sf-co-consent-err" class="sf-field__error">{{ errorFor('consent') }}</span>
          </div>

          <div v-if="message" class="sf-co__alert" role="alert">
            <v-icon size="18">circle-alert</v-icon>
            <span>{{ message }}</span>
          </div>

          <!-- data-sf-clear: the chat launcher on a phone steps aside while it would cover the pay button (StorefrontChat). -->
          <StorefrontPayButton
            v-if="options.length"
            ref="payButton"
            data-sf-clear
            :label="busy ? 'Processing…' : payButtonText(method, offer.payButton, total, formatMoney)"
            :busy="busy"
            :secured="method?.providerId === 'maropay'"
          />
          <p class="sr-only" role="status">{{ busy ? 'Processing your payment' : '' }}</p>
        </form>

        <aside class="sf-co__summary" aria-labelledby="sf-co-summary">
          <div class="sf-co__summary-head">
            <h2 id="sf-co-summary" class="sf-co__summary-title">Order summary</h2>
            <StorefrontAnchor :href="editHref" class="sf-co__edit">{{ buyNow ? 'Edit' : 'Edit cart' }}</StorefrontAnchor>
          </div>
          <ul class="sf-co__lines">
            <li v-for="line in shownLines" :key="line.sku + (line.plan?.id ?? '')">
              <span class="sf-co__thumb" aria-hidden="true">
                <img v-if="imageFor(line)" :src="imageFor(line)" alt="" class="sf-co__thumb-image">
                <v-icon v-else size="22">{{ iconFor(line) }}</v-icon>
                <span class="sf-co__qty">{{ line.qty }}</span>
              </span>
              <span class="sf-co__line-name">
                {{ line.product }}<span class="sr-only">, quantity {{ line.qty }}</span>
                <StorefrontLineText v-if="variantText(line)" :text="variantText(line)" :unbroken="storefront.sellsParts.value" class="sf-co__line-plan" :class="{ 'sf-co__line-part': storefront.sellsParts.value }" />
                <span v-if="line.plan" class="sf-co__line-plan">{{ line.plan.name }} · {{ deliverySummary(line.plan) }}</span>
              </span>
              <span>{{ formatMoney(lineTotal(line, currency)) }}</span>
            </li>
          </ul>
          <dl class="sf-co__sums">
            <div><dt>Subtotal · {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</dt><dd>{{ formatMoney(subtotal) }}</dd></div>
            <div><dt>Shipping</dt><dd>Free</dd></div>
            <div v-if="code.discount.value" class="sf-co__discount">
              <dt>Discount · {{ code.discount.value.code }}, {{ code.label.value }}</dt><dd>−{{ formatMoney(code.discount.value.amount) }}</dd>
            </div>
            <div class="sf-co__grand"><dt>Total</dt><dd><span v-if="!storefront.ownMoneyFormat.value" class="sf-muted sf-co__currency">{{ currency }}</span> {{ formatMoney(total) }}</dd></div>
            <div v-for="charge in recurring" :key="charge.interval" class="sf-co__recurring">
              <dt>Then {{ charge.interval }}</dt><dd>{{ formatMoney(charge.amount) }}</dd>
            </div>
          </dl>
          <StorefrontDiscountCode
            v-if="code.offered.value || code.applied.value"
            v-model:typed="code.typed.value"
            id-prefix="sf-co"
            class="sf-co__code"
            :applied="code.discount.value ? code.applied.value : ''"
            :problem="code.notice.value"
            :saving="code.discount.value ? formatMoney(code.discount.value.amount) : ''"
            @apply="code.apply"
            @remove="code.remove"
          />
          <p v-if="code.discount.value && recurring.length" class="sf-co__code-note sf-muted">The code lowers this order. Later deliveries are charged at the plan’s price.</p>
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
  border-radius: var(--sf-corner, 8px);
  cursor: pointer;
}

.sf-co__choice > span {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
}

/* The one way a store without a counter delivers: said, not chosen. */
.sf-co__choice--only {
  margin: 0;
  cursor: default;
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
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

.sf-co__alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--sf-corner, 8px);
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
  border-radius: var(--sf-corner, 8px);
  background: var(--sf-surface, #f7f7f5);
}

/* A theme on the sections drawing sets its headings' weight and case (a serif at its
   own weight); every other theme keeps the bold title it always had. */
.sf-page-title {
  font-weight: var(--sf-heading-weight, 700);
  text-transform: var(--sf-heading-case, none);
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

.sf-co__thumb-image {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.sf-co__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  aspect-ratio: 1;
  border: 1px solid #e3e3e0;
  border-radius: var(--sf-corner, 6px);
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
  gap: 16px;
}

/* An amount stays whole: "−$19.60", never "−" over "$19.60". */
.sf-co__sums dd {
  margin: 0;
  white-space: nowrap;
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

/* A line bought on a plan says so under its name. */
.sf-co__line-plan {
  display: block;
  font-size: 12px;
  color: var(--sf-muted, #5f5f5f);
}

/* A part's number reads in even figures. */
.sf-co__line-part {
  font-variant-numeric: tabular-nums;
}

.sf-co__recurring {
  color: var(--sf-muted, #5f5f5f);
}

.sf-co__consent {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* A label of several lines keeps its box level with the first one. */
.sf-co__check--top {
  align-items: flex-start;
}

.sf-co__check--top input {
  width: 18px;
  height: 18px;
  margin: 1px 0 0;
  flex-shrink: 0;
  accent-color: var(--sf-brand, #121011);
}

.sf-co__subscribed {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
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

.sf-co__none {
  padding: 16px 20px;
  border: 1px dashed #b6b6b6;
  border-radius: var(--sf-corner, 8px);
  font-size: 14px;
}

.sf-co__none p {
  margin: 0;
}

.sf-co__none-note {
  margin-top: 6px !important;
  font-size: 13px;
}

.sf-co__none a {
  text-decoration: underline;
}

.sf-co__discount {
  font-weight: 600;
}

.sf-co__code {
  margin-top: 16px;
}

.sf-co__code-note {
  margin: 8px 0 0;
  font-size: 13px;
}

.sf-co__manage {
  text-decoration: underline;
  white-space: nowrap;
}

.sf-co__demo {
  margin: 16px 0 0;
  padding: 12px 16px;
  border: 1px dashed #b6b6b6;
  border-radius: var(--sf-corner, 8px);
  font-size: 13px;
}

.sf-co__demo a {
  text-decoration: underline;
}

/* ── The sections drawing ─────────────────────────────────────────
   The store's own measure, so the form lines up with the logo and every other page;
   headings in the theme's heading type; the payment options, the card form and the
   card's tile drawn in the theme's colours and corners instead of the app's. */
.sf-co--sections {
  max-width: var(--sf-measure, 1200px);
  padding-inline: var(--sf-gutter, 24px);
}

.sf-co--sections .sf-co__step-title,
.sf-co--sections .sf-co__summary-title,
.sf-co--sections .sf-co__express-title {
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-weight: var(--sf-heading-weight, 700);
  text-transform: var(--sf-heading-case, none);
  letter-spacing: 0;
}

.sf-co--sections .sf-co__step-title {
  font-size: 26px;
  line-height: 1.2;
}

.sf-co--sections .sf-co__summary-title {
  font-size: 24px;
  line-height: 1.2;
}

.sf-co--sections .sf-co__express-title {
  font-size: 20px;
}

.sf-co--sections .sf-co__num {
  border-radius: var(--sf-corner, 50%);
  font-family: var(--sf-body-font, system-ui), system-ui, sans-serif;
}

.sf-co--sections .sf-co__thumb {
  border-color: var(--sf-divider, #e3e3e0);
  background: var(--sf-surface, #ffffff);
  color: var(--sf-muted, #8a8780);
}

.sf-co--sections .sf-co__sums,
.sf-co--sections .sf-co__grand {
  border-top-color: var(--sf-divider, #e3e3e0);
}

.sf-co--sections :deep(.sf-co__option) {
  border-radius: var(--sf-corner, 8px);
}

.sf-co--sections :deep(.sf-co__card) {
  border-radius: var(--sf-corner, 8px);
  background: var(--sf-surface, #f7f7f5);
}

.sf-co--sections :deep(.sf-co__testcards button) {
  border-radius: var(--sf-corner, 4px);
  background: var(--sf-bg, #ffffff);
}

/* Each option's lead tile takes the theme's corners; a card option's (and Maropay's) also
   wears the theme's colours, not the app's slate and blue. Brand tiles keep their colours. */
.sf-co--sections :deep(.sf-co__option-head > .maropay-mark) {
  border-radius: var(--sf-corner, 6px);
}

.sf-co--sections :deep(.sf-co__option-head > .maropay-mark--card),
.sf-co--sections :deep(.sf-co__option-head > .maropay-mark--maropay) {
  background: var(--sf-surface, #f7f7f5);
  color: var(--sf-text, #121011);
  box-shadow: inset 0 0 0 1px var(--sf-divider, #e3e3e0);
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
