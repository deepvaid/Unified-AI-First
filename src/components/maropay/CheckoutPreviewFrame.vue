<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatMoney } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import type { MethodCategory } from '@/maropay/model'

// What the shopper sees at the store's checkout, drawn inside the admin — a
// merchant-chrome simulation, so it keeps a storefront look of its own (on
// tokens, re-skinned through --cp-* props). It only presents: the page runs the
// checkout and feeds back the stage. Only the store's ready methods are
// listed, so a method still awaiting approval is simply not there.

export type CheckoutStage = 'checkout' | 'authenticate' | 'redirect' | 'processing' | 'complete' | 'declined'

const props = withDefaults(defineProps<{
  storeName: string
  domain?: string | null
  product: { name: string; price: Money }
  customer: { name: string; email: string }
  /** The store's checkout methods, in checkout order. */
  methods: Array<{ id: string; label: string; category: MethodCategory }>
  /** Methods this run can use; the rest are shown but can't be picked. */
  usable: string[]
  /** Chosen method id (v-model:method). */
  method: string | null
  stage: CheckoutStage
  busy?: boolean
  orderNumber?: string | null
  declineMessage?: string | null
  device?: 'desktop' | 'mobile'
}>(), {
  domain: null,
  busy: false,
  orderNumber: null,
  declineMessage: null,
  device: 'desktop',
})

const emit = defineEmits<{
  'update:method': [methodId: string]
  pay: []
  /** The shopper finished (or walked away from) the bank check or the redirect. */
  authenticate: [outcome: 'completed' | 'abandoned']
  /** Try again after a decline. */
  retry: []
}>()

const CATEGORY_ICONS: Record<MethodCategory, string> = {
  cards: 'credit-card',
  wallets: 'smartphone',
  bnpl: 'calendar-clock',
  local: 'landmark',
}

const total = computed(() => formatMoney(props.product.price))
const methodLabel = computed(() => props.methods.find((m) => m.id === props.method)?.label ?? 'the payment provider')
const firstName = computed(() => props.customer.name.split(/\s+/)[0] ?? props.customer.name)

const code = ref('')
watch(() => props.stage, () => { code.value = '' })

const announcement = computed(() => {
  switch (props.stage) {
    case 'declined': return 'Payment declined.'
    case 'authenticate': return 'Your bank asks you to confirm this payment.'
    case 'redirect': return `Opened ${methodLabel.value}.`
    case 'processing': return `Order ${props.orderNumber ?? ''} placed. The payment is processing.`
    case 'complete': return `Order ${props.orderNumber ?? ''} confirmed.`
    default: return ''
  }
})
</script>

<template>
  <div class="cp-frame" :class="`cp-frame--${device}`">
    <div class="cp-frame__chrome" aria-hidden="true">
      <span class="cp-frame__dots"><i /><i /><i /></span>
      <span class="cp-frame__address"><v-icon size="12">lock</v-icon>{{ domain ?? 'your-store.example' }}/checkout</span>
    </div>

    <div class="cp-frame__page">
      <div class="cp-frame__store">{{ storeName }}</div>

      <!-- Checkout form (and the decline that brings the shopper back to it) -->
      <div v-if="stage === 'checkout' || stage === 'declined'" class="cp-frame__layout">
        <div class="cp-frame__form">
          <p class="cp-frame__label">Contact</p>
          <p class="cp-frame__value">{{ customer.name }} · {{ customer.email }}</p>

          <p id="cp-methods" class="cp-frame__label">Payment</p>
          <div class="cp-frame__methods" role="radiogroup" aria-labelledby="cp-methods">
            <label
              v-for="m in methods"
              :key="m.id"
              class="cp-method"
              :class="{ 'cp-method--selected': method === m.id, 'cp-method--off': !usable.includes(m.id) }"
            >
              <input
                type="radio"
                name="cp-method"
                class="cp-method__input"
                :value="m.id"
                :checked="method === m.id"
                :disabled="busy || !usable.includes(m.id)"
                @change="emit('update:method', m.id)"
              >
              <v-icon size="16">{{ CATEGORY_ICONS[m.category] }}</v-icon>
              <span class="cp-method__label">{{ m.label }}</span>
              <span v-if="!usable.includes(m.id)" class="cp-method__note">Not used in this run</span>
            </label>
          </div>

          <p v-if="stage === 'declined'" class="cp-frame__error" role="alert">
            <v-icon size="16">circle-alert</v-icon>{{ declineMessage ?? 'Your card was declined.' }}
          </p>

          <button type="button" class="cp-frame__pay" :disabled="busy || !method" @click="stage === 'declined' ? emit('retry') : emit('pay')">
            {{ busy ? 'Processing…' : stage === 'declined' ? 'Try again' : `Pay ${total}` }}
          </button>
        </div>

        <div class="cp-frame__summary">
          <p class="cp-frame__label">Order summary</p>
          <div class="cp-frame__line"><span>{{ product.name }}</span><span>{{ total }}</span></div>
          <div class="cp-frame__line cp-frame__line--muted"><span>Shipping</span><span>Free</span></div>
          <div class="cp-frame__line cp-frame__line--total"><span>Total</span><span>{{ total }}</span></div>
        </div>
      </div>

      <!-- The shopper's bank asks them to confirm (3-D Secure) -->
      <div v-else-if="stage === 'authenticate'" class="cp-frame__sheet" role="group" aria-label="Confirm with your bank">
        <v-icon size="28" class="cp-frame__sheet-icon">landmark</v-icon>
        <p class="cp-frame__sheet-title">Confirm this payment</p>
        <p class="cp-frame__sheet-text">{{ storeName }} · {{ total }}. Enter the 6-digit code your bank sent. Any six digits work in this preview.</p>
        <v-otp-input v-model="code" length="6" type="number" :disabled="busy" aria-label="Verification code" />
        <div class="cp-frame__sheet-actions">
          <button type="button" class="cp-frame__pay" :disabled="busy || code.length !== 6" @click="emit('authenticate', 'completed')">Confirm</button>
          <button type="button" class="cp-frame__link" :disabled="busy" @click="emit('authenticate', 'abandoned')">Cancel payment</button>
        </div>
      </div>

      <!-- Redirected to the payment provider's page -->
      <div v-else-if="stage === 'redirect'" class="cp-frame__sheet" role="group" :aria-label="methodLabel">
        <v-icon size="28" class="cp-frame__sheet-icon">external-link</v-icon>
        <p class="cp-frame__sheet-title">{{ methodLabel }}</p>
        <p class="cp-frame__sheet-text">Approve {{ total }} to {{ storeName }}, paid in 4 interest-free instalments.</p>
        <div class="cp-frame__sheet-actions">
          <button type="button" class="cp-frame__pay" :disabled="busy" @click="emit('authenticate', 'completed')">Approve and return to store</button>
          <button type="button" class="cp-frame__link" :disabled="busy" @click="emit('authenticate', 'abandoned')">Cancel and return</button>
        </div>
      </div>

      <!-- Placed, waiting on the bank (delayed methods) -->
      <div v-else-if="stage === 'processing'" class="cp-frame__done">
        <v-icon size="32" class="cp-frame__sheet-icon">hourglass</v-icon>
        <p class="cp-frame__sheet-title">Order {{ orderNumber }} placed</p>
        <p class="cp-frame__sheet-text">Your bank is confirming the payment, which can take a few business days. We’ll email {{ customer.email }} when it’s done.</p>
      </div>

      <div v-else class="cp-frame__done">
        <v-icon size="32" class="cp-frame__done-icon">circle-check</v-icon>
        <p class="cp-frame__sheet-title">Thanks, {{ firstName }}!</p>
        <p class="cp-frame__sheet-text">Order {{ orderNumber }} is confirmed. A receipt is on its way to {{ customer.email }}.</p>
      </div>
    </div>

    <div class="d-sr-only" role="status" aria-live="polite">{{ announcement }}</div>
  </div>
</template>

<style scoped>
/* The storefront's own look: re-skin through these, never :deep. */
.cp-frame {
  --cp-brand: var(--accent-default);
  --cp-on-brand: var(--accent-on);
  --cp-page: var(--surface-primary);
  --cp-panel: var(--surface-secondary);
  --cp-ink: var(--on-surface);
  --cp-muted: var(--on-surface-muted);

  width: 100%;
  margin-inline: auto;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: var(--mp-component-card-radius);
  background: var(--cp-page);
  color: var(--cp-ink);
}

.cp-frame--mobile {
  max-width: var(--mp-component-preview-viewport-mobile);
}

.cp-frame__chrome {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-space-8) var(--mp-space-12);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--cp-panel);
  color: var(--cp-muted);
}

.cp-frame__dots {
  display: inline-flex;
  gap: var(--mp-space-4);
}

.cp-frame__dots i {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  border-radius: var(--mp-radius-full);
  background: var(--border-default);
}

.cp-frame__address {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  min-width: 0;
  overflow: hidden;
  font-size: var(--mp-fontSize-12);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cp-frame__page {
  padding: var(--mp-space-24);
}

.cp-frame__store {
  margin-bottom: var(--mp-space-20);
  font-size: var(--mp-fontSize-18);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--cp-ink);
}

.cp-frame__layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: var(--mp-space-24);
}

.cp-frame--mobile .cp-frame__layout {
  grid-template-columns: minmax(0, 1fr);
}

.cp-frame--mobile .cp-frame__summary {
  order: -1;
}

.cp-frame__label {
  margin: 0 0 var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: var(--cp-muted);
}

.cp-frame__value {
  margin: 0 0 var(--mp-space-20);
  font-size: var(--mp-fontSize-14);
}

.cp-frame__methods {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.cp-method {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  padding: var(--mp-space-12);
  border: 1px solid var(--border-default);
  border-radius: var(--mp-component-input-radius);
  font-size: var(--mp-fontSize-14);
  cursor: pointer;
}

.cp-method--selected {
  border-color: var(--cp-brand);
  box-shadow: 0 0 0 1px var(--cp-brand);
}

.cp-method--off {
  cursor: default;
  color: var(--cp-muted);
}

.cp-method__input {
  accent-color: var(--cp-brand);
}

.cp-method__input:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.cp-method__label {
  flex: 1 1 auto;
}

.cp-method__note {
  font-size: var(--mp-fontSize-12);
}

.cp-frame__error {
  display: flex;
  align-items: center;
  gap: var(--mp-space-6);
  margin: var(--mp-space-16) 0 0;
  font-size: var(--mp-fontSize-14);
  color: var(--neg-ink);
}

.cp-frame__pay {
  width: 100%;
  margin-top: var(--mp-space-20);
  min-height: var(--mp-component-control-height);
  padding-inline: var(--mp-space-16);
  border: 0;
  border-radius: var(--mp-component-input-radius);
  background: var(--cp-brand);
  color: var(--cp-on-brand);
  font: inherit;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  cursor: pointer;
}

.cp-frame__pay:disabled {
  cursor: default;
  opacity: 0.6;
}

.cp-frame__pay:focus-visible,
.cp-frame__link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.cp-frame__summary {
  align-self: start;
  padding: var(--mp-space-16);
  border-radius: var(--mp-component-input-radius);
  background: var(--cp-panel);
  color: var(--cp-ink);
}

.cp-frame__line {
  display: flex;
  justify-content: space-between;
  gap: var(--mp-space-12);
  padding-block: var(--mp-space-4);
  font-size: var(--mp-fontSize-14);
  font-variant-numeric: tabular-nums;
}

.cp-frame__line--muted {
  color: var(--cp-muted);
}

.cp-frame__line--total {
  margin-top: var(--mp-space-8);
  padding-top: var(--mp-space-10);
  border-top: 1px solid var(--border-subtle);
  font-weight: var(--mp-fontWeight-semibold);
}

.cp-frame__sheet,
.cp-frame__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-space-8);
  max-width: var(--mp-component-state-measure);
  margin-inline: auto;
  padding-block: var(--mp-space-24);
  text-align: center;
}

.cp-frame__sheet-icon {
  color: var(--cp-muted);
}

.cp-frame__done-icon {
  color: var(--pos-ink);
}

.cp-frame__sheet-title {
  margin: 0;
  font-size: var(--mp-fontSize-16);
  font-weight: var(--mp-fontWeight-semibold);
}

.cp-frame__sheet-text {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: var(--cp-muted);
}

.cp-frame__sheet-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--mp-space-8);
  width: 100%;
}

.cp-frame__link {
  min-height: var(--mp-component-control-height);
  border: 0;
  background: none;
  color: var(--cp-muted);
  font: inherit;
  font-size: var(--mp-fontSize-14);
  cursor: pointer;
}
</style>
