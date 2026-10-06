<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { formatMoney, money, subtract } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import StorefrontPayMark from './StorefrontPayMark.vue'

// What opens over the checkout while a payment is under way, in this prototype's
// stand-in for each party's own screen: the wallet's payment sheet (Apple Pay,
// Google Pay), the bank's 3-D Secure check, or the provider's page the shopper
// is sent to (PayPal, Klarna, Afterpay, Affirm).

const props = defineProps<{
  kind: 'wallet' | 'authenticate' | 'redirect'
  method: { id: string; label: string }
  storeName: string
  total: Money
  email: string
  /** "200 Market Street, San Francisco" or "Collect in store". */
  shipTo: string
  /** One instalment when the method pays in 4, or monthly. */
  instalment: Money
  busy?: boolean
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const title = ref<HTMLElement | null>(null)
onMounted(() => { void nextTick(() => title.value?.focus()) })

const code = ref('')
const codeReady = computed(() => /^\d{6}$/.test(code.value))

const payIn4 = computed(() => props.method.id === 'klarna' || props.method.id === 'afterpay_clearpay')
/** Three equal payments, and a last one that takes the rounding so the plan adds up to the total. */
const schedule = computed(() => {
  const last = subtract(props.total, money(props.instalment.amount * 3, props.total.currency))
  return ['Today', 'In 2 weeks', 'In 4 weeks', 'In 6 weeks'].map((when, i) => ({ when, amount: i === 3 ? last : props.instalment }))
})

const heading = computed(() => {
  if (props.kind === 'authenticate') return 'Confirm it’s you'
  if (props.kind === 'wallet') return `Pay ${props.storeName}`
  if (props.method.id === 'paypal') return `Pay ${props.storeName} with PayPal`
  return payIn4.value ? 'Pay in 4 interest-free payments' : 'Pay over 12 months'
})

function confirm(): void {
  if (props.busy || (props.kind === 'authenticate' && !codeReady.value)) return
  emit('confirm')
}
</script>

<template>
  <div class="sf-sheet" @keydown.esc="emit('cancel')">
    <div class="sf-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sf-sheet-title" :aria-describedby="kind === 'authenticate' ? 'sf-sheet-desc' : undefined">
      <div class="sf-sheet__brand" :class="`sf-sheet__brand--${kind === 'authenticate' ? 'bank' : method.id}`">
        <template v-if="kind === 'authenticate'"><v-icon size="18">shield-check</v-icon> Your bank</template>
        <StorefrontPayMark v-else-if="kind === 'redirect' && method.id !== 'paypal'" :mark="method.label" />
        <template v-else>{{ method.label }}</template>
      </div>

      <h2 id="sf-sheet-title" ref="title" tabindex="-1" class="sf-sheet__title">{{ heading }}</h2>

      <!-- Apple Pay / Google Pay: the wallet's own sheet. -->
      <dl v-if="kind === 'wallet'" class="sf-sheet__rows">
        <div><dt>Card</dt><dd>Visa •••• 4242</dd></div>
        <div><dt>Deliver to</dt><dd>{{ shipTo }}</dd></div>
        <div><dt>Contact</dt><dd>{{ email }}</dd></div>
        <div class="sf-sheet__total"><dt>Total</dt><dd>{{ formatMoney(total) }}</dd></div>
      </dl>

      <!-- 3-D Secure: the card issuer checks it's the cardholder. -->
      <template v-else-if="kind === 'authenticate'">
        <p id="sf-sheet-desc" class="sf-sheet__text">
          Your bank sent a 6-digit code to the phone number ending 0142 to approve {{ formatMoney(total) }} to {{ storeName }}.
          In this prototype any 6 digits work.
        </p>
        <label class="sf-sheet__field">
          <span>Code</span>
          <input v-model="code" class="sf-sheet__input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" @keydown.enter.prevent="confirm">
        </label>
      </template>

      <!-- PayPal and buy now, pay later: the provider's page. -->
      <template v-else>
        <p class="sf-sheet__text">You’re on {{ method.label }}’s page, simulated in this prototype. Signed in as {{ email }}.</p>
        <ol v-if="payIn4" class="sf-sheet__plan">
          <li v-for="step in schedule" :key="step.when"><span>{{ step.when }}</span><strong>{{ formatMoney(step.amount) }}</strong></li>
        </ol>
        <dl v-else class="sf-sheet__rows">
          <div v-if="method.id !== 'paypal'"><dt>Monthly, for 12 months</dt><dd>from {{ formatMoney(instalment) }}/mo</dd></div>
          <div class="sf-sheet__total"><dt>Total</dt><dd>{{ formatMoney(total) }}</dd></div>
        </dl>
      </template>

      <div class="sf-sheet__actions">
        <button type="button" class="sf-sheet__confirm" :class="`sf-sheet__confirm--${kind === 'wallet' || method.id === 'paypal' ? method.id : 'default'}`" :disabled="busy || (kind === 'authenticate' && !codeReady)" @click="confirm">
          <template v-if="busy">Processing…</template>
          <template v-else-if="kind === 'authenticate'">Confirm</template>
          <template v-else-if="kind === 'wallet'">{{ method.id === 'apple_pay' ? 'Pay with Face ID' : `Pay ${formatMoney(total)}` }}</template>
          <template v-else>{{ method.id === 'paypal' ? 'Approve and pay' : 'Approve plan' }}</template>
        </button>
        <button type="button" class="sf-sheet__cancel" :disabled="busy" @click="emit('cancel')">
          {{ kind === 'redirect' ? `Cancel and return to ${storeName}` : 'Cancel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Each party's own look, approximated. */
.sf-sheet {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(18, 16, 17, 0.55);
}

.sf-sheet__panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  border-radius: 14px;
  background: #ffffff;
  color: #121011;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.25);
}

.sf-sheet__brand {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
}

.sf-sheet__brand--apple_pay,
.sf-sheet__brand--google_pay {
  padding: 4px 10px;
  border-radius: 6px;
  background: #000000;
  color: #ffffff;
}

.sf-sheet__brand--paypal {
  padding: 4px 10px;
  border-radius: 6px;
  background: #ffc439;
  color: #003087;
  font-style: italic;
  font-weight: 800;
}

.sf-sheet__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  outline: none;
}

.sf-sheet__text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
}

.sf-sheet__rows {
  display: flex;
  flex-direction: column;
  margin: 0;
  font-size: 14px;
}

.sf-sheet__rows div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #ececec;
}

.sf-sheet__rows dt {
  color: #5f5f5f;
}

.sf-sheet__rows dd {
  margin: 0;
  text-align: right;
}

.sf-sheet__total {
  font-weight: 700;
  border-bottom: 0 !important;
}

.sf-sheet__total dt {
  color: inherit !important;
}

.sf-sheet__plan {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-sheet__plan li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 8px;
  background: #f5f5f3;
  font-size: 12px;
  text-align: center;
}

.sf-sheet__plan strong {
  font-size: 14px;
}

.sf-sheet__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.sf-sheet__input {
  height: 48px;
  padding: 0 14px;
  border: 1px solid #c9c9c9;
  border-radius: 6px;
  font: inherit;
  font-size: 20px;
  letter-spacing: 6px;
}

.sf-sheet__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sf-sheet__confirm,
.sf-sheet__cancel {
  height: 48px;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.sf-sheet__confirm {
  background: #121011;
  color: #ffffff;
}

.sf-sheet__confirm--paypal {
  background: #ffc439;
  color: #003087;
}

.sf-sheet__cancel {
  background: none;
  color: #121011;
}

.sf-sheet__confirm:disabled,
.sf-sheet__cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-sheet__confirm:focus-visible,
.sf-sheet__cancel:focus-visible,
.sf-sheet__input:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>
