<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatMoney, moneyParts } from '@/maropay/money'
import type { CheckoutSession, Payment } from '@/maropay/model'
import { isManualKind } from '@/maropay/providers'
import { paidWithText, shopperReference } from '@/maropay/storefront'
import StorefrontAnchor from './StorefrontAnchor.vue'

// The order's receipt, the moment the payment goes through: a till slip — the
// amount, who it thanks, then order · paid with · date · reference — and a
// countdown back to the store. A manual method (bank deposit, cheque, cash on
// delivery) places the order instead and shows the merchant's instructions; a
// delayed bank debit says the bank is still confirming. Out of system (P4-8),
// like the rest of the storefront; "Maropost" never appears here.

const props = defineProps<{
  session: CheckoutSession
  payment: Payment | null
  /** A manual method's payment instructions, from the offer the shopper paid through. */
  instructions: string | null
  storeName: string
  homeHref: string
}>()

const router = useRouter()

const manual = computed(() => isManualKind(props.session.providerId))
const delayed = computed(() => !manual.value && props.session.state === 'processing')
const paid = computed(() => !manual.value && !delayed.value)
const firstName = computed(() => props.session.customer.name.split(' ')[0] ?? '')
const parts = computed(() => moneyParts(props.session.amount))
const paidWith = computed(() => (props.payment ? paidWithText(props.payment) : props.session.methodLabel))
const reference = computed(() => shopperReference(props.payment?.id ?? props.session.id))
const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const when = computed(() => DATE.format(new Date(props.payment?.capturedAt ?? props.payment?.createdAt ?? props.session.createdAt)))

const title = computed(() => (paid.value ? 'Payment received' : manual.value ? 'Order placed' : 'Payment processing'))
const lead = computed(() => {
  if (paid.value) return `Thanks, ${firstName.value} — your order is confirmed.`
  if (manual.value) return `Thanks, ${firstName.value} — we’ll confirm it once your payment arrives.`
  return `Thanks, ${firstName.value} — your bank is confirming the payment, which takes a few business days. We’ll email ${props.session.customer.email} when it’s through.`
})

const initials = computed(() => props.storeName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join(''))

// ── Back to the store ───────────────────────────────────────────────
// Ten seconds (not three — enough to read the slip), paused while the pointer or focus is on the
// page, cancelled by any key, never started under reduced motion or on a return visit to the same
// receipt (a reload must not bounce the shopper away again).

const TOTAL = 10
const left = ref(TOTAL)
const paused = ref(false)
const cancelled = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const seenKey = computed(() => `sf-receipt-seen-${props.session.id}`)
const countdownOn = computed(() => paid.value && !reducedMotion && !cancelled.value)

function goHome(): void {
  stop()
  void router.push(props.homeHref)
}

function stop(): void {
  if (timer) clearInterval(timer)
  timer = null
}

function cancel(): void {
  cancelled.value = true
  stop()
}

function onKey(): void {
  if (countdownOn.value) cancel()
}

onMounted(() => {
  let seen = false
  try { seen = sessionStorage.getItem(seenKey.value) === '1'; sessionStorage.setItem(seenKey.value, '1') } catch { /* private mode: no memory, no harm */ }
  if (seen || !countdownOn.value) { cancelled.value = true; return }
  window.addEventListener('keydown', onKey)
  timer = setInterval(() => {
    if (paused.value) return
    left.value -= 1
    if (left.value <= 0) goHome()
  }, 1000)
})

onBeforeUnmount(() => {
  stop()
  window.removeEventListener('keydown', onKey)
})

const heading = ref<HTMLElement | null>(null)
defineExpose({ focus: () => heading.value?.focus() })
</script>

<template>
  <div class="sf-receipt" @mouseenter="paused = true" @mouseleave="paused = false" @focusin="paused = true" @focusout="paused = false">
    <p class="sf-receipt__store"><span class="sf-receipt__mark" aria-hidden="true">{{ initials }}</span>{{ storeName }}</p>

    <article class="sf-receipt__slip" :class="{ 'sf-receipt__slip--pending': !paid }">
      <div class="sf-receipt__top">
        <span class="sf-receipt__disc" :class="{ 'sf-receipt__disc--pending': !paid }" aria-hidden="true">
          <v-icon size="28">{{ paid ? 'check' : 'clock' }}</v-icon>
        </span>
        <p class="sf-receipt__status sf-muted">{{ title }}</p>
        <h1 id="sf-co-done" ref="heading" tabindex="-1" class="sf-receipt__amount">
          <span class="sf-receipt__symbol">{{ parts.symbol }}</span>{{ parts.integer }}<span v-if="parts.fraction" class="sf-receipt__cents">.{{ parts.fraction }}</span>
          <span class="d-sr-only"> {{ formatMoney(session.amount) }} — {{ title }}</span>
        </h1>
        <p class="sf-receipt__lead">{{ lead }}</p>
      </div>

      <div class="sf-receipt__tear" aria-hidden="true" />

      <dl class="sf-receipt__facts">
        <div><dt>Order</dt><dd>{{ session.order?.orderNumber ?? '—' }}</dd></div>
        <div><dt>{{ manual ? 'Pay by' : 'Paid with' }}</dt><dd>{{ paidWith }}</dd></div>
        <div><dt>Date</dt><dd>{{ when }}</dd></div>
        <div><dt>Reference</dt><dd class="sf-receipt__ref">{{ reference }}</dd></div>
      </dl>

      <div v-if="manual && instructions" class="sf-receipt__instructions">
        <h2 class="sf-receipt__instructions-title">How to pay</h2>
        <p>{{ instructions }}</p>
        <p class="sf-muted">Quote {{ reference }} so we can match your payment. We ship once it clears.</p>
      </div>
    </article>

    <div v-if="countdownOn" class="sf-receipt__back">
      <div class="sf-receipt__back-row">
        <span>Taking you back to the store</span>
        <span class="sf-receipt__seconds" aria-hidden="true">{{ left }}s</span>
      </div>
      <div class="sf-receipt__bar" role="progressbar" :aria-valuenow="TOTAL - left" :aria-valuemin="0" :aria-valuemax="TOTAL" aria-label="Seconds until the store opens">
        <span class="sf-receipt__bar-fill" :style="{ width: `${((TOTAL - left) / TOTAL) * 100}%` }" />
      </div>
      <p class="sf-muted sf-receipt__back-note">
        Please keep this tab open. <button type="button" class="sf-receipt__now" @click="goHome">Go now</button> · <button type="button" class="sf-receipt__now" @click="cancel">Stay here</button>
      </p>
    </div>
    <StorefrontAnchor v-else :href="homeHref" class="sf-button sf-receipt__continue">Continue shopping</StorefrontAnchor>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. The slip is a card with a torn edge;
   its tones are the storefront's own. */
.sf-receipt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.sf-receipt__store {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-weight: 700;
  font-size: 16px;
}

.sf-receipt__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--sf-text, #121011);
  color: var(--sf-bg, #ffffff);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.sf-receipt__slip {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 40px 32px 28px;
  border-radius: 20px 20px 0 0;
  background: var(--sf-bg, #ffffff);
  box-shadow: 0 12px 40px -16px rgba(0, 0, 0, 0.18);
  text-align: center;
}

/* The scalloped bottom edge of a till slip. */
.sf-receipt__slip::after {
  content: '';
  position: absolute;
  inset: auto 0 -10px;
  height: 10px;
  background: radial-gradient(circle at 10px 0, transparent 9px, var(--sf-bg, #ffffff) 10px) 0 0 / 20px 10px repeat-x;
}

.sf-receipt__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.sf-receipt__disc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 6px;
  border-radius: 50%;
  background: #e3f2e6;
  color: #2e7d32;
  box-shadow: inset 0 0 0 10px #f1f8f2;
}

.sf-receipt__disc--pending {
  background: #f7f7f5;
  color: var(--sf-muted, #5f5f5f);
  box-shadow: inset 0 0 0 10px #fbfbfa;
}

.sf-receipt__status {
  margin: 0;
  font-size: 16px;
}

.sf-receipt__amount {
  margin: 0;
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  outline: none;
}

.sf-receipt__symbol {
  font-size: 0.75em;
  vertical-align: 0.15em;
}

.sf-receipt__cents {
  font-size: 0.5em;
  color: var(--sf-muted, #5f5f5f);
}

.sf-receipt__lead {
  max-width: 32ch;
  margin: 4px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: var(--sf-muted, #5f5f5f);
}

/* The perforation: a dashed line with two notches at the edges. */
.sf-receipt__tear {
  position: relative;
  height: 1px;
  margin: 28px -32px 24px;
  border-top: 2px dashed #e3e3e0;
}

.sf-receipt__tear::before,
.sf-receipt__tear::after {
  content: '';
  position: absolute;
  top: -14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--sf-page, #f7f7f5);
}

.sf-receipt__tear::before { left: -14px; }
.sf-receipt__tear::after { right: -14px; }

.sf-receipt__facts {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  text-align: left;
  font-size: 15px;
}

.sf-receipt__facts div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.sf-receipt__facts dt {
  flex: none;
  color: var(--sf-muted, #5f5f5f);
}

.sf-receipt__facts dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.sf-receipt__ref {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.sf-receipt__instructions {
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  background: #f7f7f5;
  text-align: left;
  font-size: 14px;
  line-height: 1.5;
}

.sf-receipt__instructions p {
  margin: 0 0 8px;
}

.sf-receipt__instructions p:last-child {
  margin-bottom: 0;
}

.sf-receipt__instructions-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 700;
}

.sf-receipt__back {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 440px;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
}

.sf-receipt__back-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.sf-receipt__seconds {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-weight: 500;
  color: var(--sf-muted, #5f5f5f);
}

.sf-receipt__bar {
  height: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: #e3e3e0;
}

.sf-receipt__bar-fill {
  display: block;
  height: 100%;
  background: var(--sf-text, #121011);
  transition: width 1s linear;
}

.sf-receipt__back-note {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 400;
  text-align: center;
}

.sf-receipt__now {
  padding: 0;
  border: 0;
  background: none;
  color: var(--sf-accent, var(--sf-text, #121011));
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.sf-receipt__now:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 4px;
}

.sf-receipt__continue {
  margin-top: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .sf-receipt__bar-fill {
    transition: none;
  }
}

@media (max-width: 480px) {
  .sf-receipt__slip {
    padding: 32px 20px 24px;
  }

  .sf-receipt__tear {
    margin-inline: -20px;
  }

  .sf-receipt__amount {
    font-size: 44px;
  }
}
</style>
