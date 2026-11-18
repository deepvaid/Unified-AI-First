<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { parseDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { isEmail } from '@/maropay/onboarding'
import { useCommerceStore } from '@/stores/useCommerce'
import { useStorefrontShopperStore } from '@/stores/useStorefrontShopper'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { lowestPrice } from '@/storefront/catalog'
import { CANCEL_REASONS, allowedActions, chargeAmount, dayLabel } from '@/subscriptions/contracts'
import type { ContractAction, SubscriptionContract } from '@/subscriptions/contracts'
import { deliverySummary, nextChargeDate, pricePerDelivery } from '@/subscriptions/plans'
import type { SubscriptionPlan } from '@/subscriptions/plans'
import StorefrontAnchor from './StorefrontAnchor.vue'
import { STOREFRONT } from './storefrontContext'
import { collectionsOf, productHandle } from './storefrontCatalog'

// The shopper's own page (/account): sign in, then their subscriptions on this
// store, each with what a shopper may do to it: skip the next delivery, pause or
// resume, move to another plan, cancel with a reason, or pay again after a failed
// payment. The same subscriptions, and the same rules, are behind the admin's
// Commerce › Subscriptions › Subscribers, so a change here shows there at once.
//
// Sign-in is mocked: an email, then a code, and any six digits are accepted. A
// checkout signs its shopper in, so the confirmation's link comes straight here.
// Orders and addresses are not here yet (build prompt, S8).

const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const shopper = useStorefrontShopperStore()
const subscriptions = useSubscriptionsStore()

const channelId = computed(() => storefront.channel.value.id)
const email = computed(() => shopper.emailFor(channelId.value))
const formatMoney = storefront.formatExact

// ── Sign in ──────────────────────────────────────────────────────────

const step = ref<'email' | 'code'>('email')
const typedEmail = ref('')
const code = ref('')
const tried = ref(false)
const emailError = computed(() => (tried.value && !isEmail(typedEmail.value) ? 'Enter an email address like name@example.com.' : null))
const codeError = computed(() => (tried.value && !/^\d{6}$/.test(code.value.trim()) ? 'Enter the 6-digit code.' : null))
const codeField = ref<HTMLInputElement | null>(null)
const emailField = ref<HTMLInputElement | null>(null)

async function sendCode(): Promise<void> {
  tried.value = true
  if (emailError.value) return void emailField.value?.focus()
  tried.value = false
  step.value = 'code'
  await nextTick()
  codeField.value?.focus()
}

function signIn(): void {
  tried.value = true
  if (codeError.value) return void codeField.value?.focus()
  shopper.signIn(channelId.value, typedEmail.value)
  resetSignIn()
}

function resetSignIn(): void {
  step.value = 'email'
  code.value = ''
  tried.value = false
}

function signOut(): void {
  shopper.signOut(channelId.value)
  typedEmail.value = ''
  message.value = ''
  open.value = null
}

// ── Subscriptions ────────────────────────────────────────────────────

const mine = computed(() => (email.value ? subscriptions.contractsOf(channelId.value, email.value) : []))

/** Where "find a subscription" leads: the store's Subscription collection when it has one. */
const shopHref = computed(() =>
  collectionsOf(commerce.products, channelId.value).some((c) => c.handle === 'subscription') ? '/collections/subscription' : '/collections/all')

function productOf(contract: SubscriptionContract) {
  return commerce.products.find((p) => p.id === contract.productId)
}

/** What a shopper may do; changing the date and charging are the merchant's. */
const SHOPPER_ACTIONS: ContractAction[] = ['skip', 'pause', 'resume', 'changePlan', 'retry', 'cancel']
function actionsFor(contract: SubscriptionContract): ContractAction[] {
  const allowed = allowedActions(contract).filter((a) => SHOPPER_ACTIONS.includes(a))
  return allowed.filter((a) => a !== 'changePlan' || subscriptions.plansToChangeTo(contract).length > 0)
}

/** What another plan would cost per delivery, at the product's price today. */
function priceOn(contract: SubscriptionContract, plan: SubscriptionPlan): Money | null {
  const product = productOf(contract)
  const unit = product ? parseDecimal(lowestPrice(product), contract.currency) : null
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
  void done(`Your ${contract.product} subscription is now on ${now.plan.name}: ${formatMoney(chargeAmount(now))} per delivery, from ${dayLabel(now.nextChargeOn!)}.`)
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

// A subscription that leaves the list (another tab cancelled it) takes its open question with it.
watch(mine, (list) => {
  if (open.value && !list.some((c) => c.id === open.value!.id)) open.value = null
})
</script>

<template>
  <div class="sf-acct">
    <!-- ── Sign in ──────────────────────────────────────────────── -->
    <section v-if="!email" class="sf-acct__signin" aria-labelledby="sf-acct-title">
      <h1 id="sf-acct-title" class="sf-page-title">Your account</h1>

      <form v-if="step === 'email'" class="sf-acct__form" novalidate @submit.prevent="sendCode">
        <p class="sf-muted">Enter the email you ordered with. We’ll send you a 6-digit code to sign in, so there is no password to remember.</p>
        <div class="sf-field">
          <label for="sf-acct-email">Email</label>
          <input
            id="sf-acct-email"
            ref="emailField"
            v-model="typedEmail"
            class="sf-input"
            type="email"
            autocomplete="email"
            :aria-invalid="!!emailError"
            :aria-describedby="emailError ? 'sf-acct-email-err' : undefined"
          >
          <span v-if="emailError" id="sf-acct-email-err" class="sf-field__error">{{ emailError }}</span>
        </div>
        <button type="submit" class="sf-button sf-button--block">Email me a code</button>
      </form>

      <form v-else class="sf-acct__form" novalidate @submit.prevent="signIn">
        <p class="sf-muted">
          We sent a 6-digit code to <strong>{{ typedEmail.trim() }}</strong>.
          {{ storefront.demo.value ? 'This is a demo store, so any 6 digits work.' : 'In this prototype any 6 digits work.' }}
        </p>
        <div class="sf-field">
          <label for="sf-acct-code">Code</label>
          <input
            id="sf-acct-code"
            ref="codeField"
            v-model="code"
            class="sf-input"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            :aria-invalid="!!codeError"
            :aria-describedby="codeError ? 'sf-acct-code-err' : undefined"
          >
          <span v-if="codeError" id="sf-acct-code-err" class="sf-field__error">{{ codeError }}</span>
        </div>
        <button type="submit" class="sf-button sf-button--block">Sign in</button>
        <button type="button" class="sf-acct__link" @click="resetSignIn">Use another email</button>
      </form>
    </section>

    <!-- ── Subscriptions ────────────────────────────────────────── -->
    <section v-else aria-labelledby="sf-acct-title">
      <div class="sf-acct__head">
        <h1 id="sf-acct-title" class="sf-page-title">Your subscriptions</h1>
        <p class="sf-acct__who sf-muted">
          Signed in as {{ email }} ·
          <button type="button" class="sf-acct__link" @click="signOut">Sign out</button>
        </p>
      </div>

      <p v-if="message" ref="messageLine" class="sf-acct__message" role="status" tabindex="-1">
        <v-icon size="18" aria-hidden="true">circle-check</v-icon>
        <span>{{ message }}</span>
      </p>

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
              <h2 class="sf-sub__name">
                <StorefrontAnchor v-if="productOf(contract)" :href="`/products/${productHandle(productOf(contract)!)}`">{{ contract.product }}</StorefrontAnchor>
                <template v-else>{{ contract.product }}</template>
              </h2>
              <p class="sf-muted">{{ contract.plan.name }} · {{ deliverySummary(contract.plan) }}<template v-if="contract.qty > 1"> · {{ contract.qty }} of them</template></p>
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
                  <strong>{{ plan.name }}</strong>
                  <span class="sf-muted">{{ deliverySummary(plan) }}<template v-if="priceOn(contract, plan)"> · {{ formatMoney(priceOn(contract, plan)!) }} per delivery</template></span>
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

.sf-acct__signin {
  max-width: 420px;
  margin: 0 auto;
}

.sf-acct__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.sf-acct__form p {
  margin: 0;
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
  outline: 2px solid var(--sf-accent, #2563eb);
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

.sf-acct__message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 0 24px;
  padding: 14px 16px;
  border-radius: 8px;
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
  border-radius: 8px;
  background: #f7f7f5;
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
  border-radius: 8px;
  background: #f7f7f5;
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
  border-radius: 8px;
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
  border-radius: 8px;
  background: #f7f7f5;
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

  .sf-sub__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sf-sub__cancel {
    margin-left: 0;
  }
}
</style>
