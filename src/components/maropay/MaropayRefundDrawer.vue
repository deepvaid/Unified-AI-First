<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { compare, formatMoney, isPositive, moneyParts, parseDecimal, toDecimal } from '@/maropay/money'
import type { Money } from '@/maropay/money'
import { PROVIDER_LABELS } from '@/maropay/model'
import type { MaropayError, Payment, Result } from '@/maropay/model'
import type { RefundResult } from '@/services/maropay/mockAdapter'

// Refund a payment — from its Maropay page or from the order. The refund goes
// back through the provider that took the payment, and the drawer says so. One
// idempotency key per attempt: pressing Refund twice, or retrying after a
// timeout, can never refund twice.

const props = defineProps<{
  modelValue: boolean
  payment: Payment
  /** What's left to refund (captured minus succeeded and pending refunds). */
  remaining: Money
  /** Store name for the original-provider note. */
  storeName: string
  /** Runs the refund; the page passes the store action. */
  refund: (amount: Money, reason: string, key: string) => Result<RefundResult>
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  refunded: [result: RefundResult]
}>()

const amountText = ref('')
const reason = ref('')
const attempted = ref(false)
const submitting = ref(false)
const problem = ref<MaropayError | null>(null)
const failedRefund = ref<string | null>(null)
let key = ''

function newKey(): string {
  return `refund_${props.payment.id}_${Date.now()}`
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  amountText.value = toDecimal(props.remaining)
  reason.value = ''
  attempted.value = false
  problem.value = null
  failedRefund.value = null
  key = newKey()
}, { immediate: true })

const currency = computed(() => props.payment.amount.currency)
const symbol = computed(() => moneyParts(props.remaining).symbol)
const ours = computed(() => props.payment.provider === 'maropay')
const providerName = computed(() => PROVIDER_LABELS[props.payment.provider])

const amount = computed(() => parseDecimal(amountText.value, currency.value))
const amountError = computed(() => {
  if (!amountText.value.trim()) return 'Enter the amount to refund.'
  if (!amount.value) return `Enter an amount like ${toDecimal(props.remaining)}.`
  if (!isPositive(amount.value)) return 'Enter an amount greater than zero.'
  if (compare(amount.value, props.remaining) > 0) return `That’s more than the ${formatMoney(props.remaining)} left to refund.`
  return null
})

const submitLabel = computed(() => (amount.value && !amountError.value ? `Refund ${formatMoney(amount.value)}` : 'Refund'))

function close(): void {
  emit('update:modelValue', false)
}

async function submit(): Promise<void> {
  attempted.value = true
  if (amountError.value || !amount.value || submitting.value) return
  submitting.value = true
  problem.value = null
  failedRefund.value = null
  await new Promise((resolve) => window.setTimeout(resolve, 500))
  const result = props.refund(amount.value, reason.value.trim(), key)
  submitting.value = false
  if (!result.ok) {
    // Nothing was recorded, so a retry reuses the key and can't double up.
    problem.value = result.error
    return
  }
  if (result.value.refund.status === 'failed') {
    failedRefund.value = result.value.refund.failureReason ?? 'The refund didn’t go through.'
    key = newKey()
    return
  }
  emit('refunded', result.value)
  close()
}
</script>

<template>
  <MpFormDrawer
    :model-value="modelValue"
    :title="`Refund ${payment.orderNumber ? `order ${payment.orderNumber}` : payment.id}`"
    :subtitle="`${formatMoney(remaining)} left to refund · ${payment.methodLabel}`"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <MpAlert v-if="!ours" tone="info" live="off" :title="`Refunded through ${providerName}`">
      {{ providerName }} took this payment before {{ storeName }} switched to Maropay. The refund goes back through {{ providerName }} and doesn’t touch your Maropay balance.
    </MpAlert>

    <MpFormGrid>
      <v-text-field
        v-model="amountText"
        label="Refund amount *"
        :prefix="symbol"
        inputmode="decimal"
        :error-messages="attempted || amountText ? amountError ?? undefined : undefined"
      />
      <v-text-field v-model="reason" label="Reason" placeholder="e.g. Item returned" />
    </MpFormGrid>

    <p class="maropay-refund__note">
      {{ ours
        ? 'Refunds come out of your Maropay balance. Processing fees aren’t returned. The shopper usually sees the money in 5–10 business days.'
        : `The shopper usually sees the money in 5–10 business days, depending on ${providerName}.` }}
    </p>

    <MpAlert v-if="failedRefund" tone="error" title="The refund didn’t go through">
      {{ failedRefund }} You can try again.
    </MpAlert>
    <MpAlert v-else-if="problem" tone="error" :title="problem.retryable ? 'We didn’t hear back' : 'The refund wasn’t made'">
      {{ problem.message }}
    </MpAlert>

    <template #footer>
      <v-btn variant="text" class="text-none" :disabled="submitting" @click="close">Cancel</v-btn>
      <v-btn color="error" variant="flat" class="text-none" :loading="submitting" @click="submit">
        {{ problem?.retryable ? 'Try again' : submitLabel }}
      </v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.maropay-refund__note {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}
</style>
