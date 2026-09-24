<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MaropayStepUpDialog from '@/components/maropay/MaropayStepUpDialog.vue'
import { useMaropayStore } from '@/stores/useMaropay'
import type { MaropayError, PayoutDestination } from '@/maropay/model'
import { bankAccountErrors, bankCodeFor, digitsOnly } from '@/maropay/onboarding'

// Where payouts go. Changing it needs a fresh check that it's really the owner
// (the step-up dialog), and the full numbers never reach state — Maropay keeps
// the last four digits. The store sends a security notice once it changes.

const props = defineProps<{
  modelValue: boolean
  /** The account payouts go to now, if there is one. */
  current: PayoutDestination | null
  /** Registration country — decides the bank code's name and length. */
  country: string
  defaultHolder: string
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  saved: []
}>()

const maropay = useMaropayStore()

const form = reactive({ holderName: '', bankName: '', bankCode: '', accountNumber: '', confirmAccountNumber: '' })
type Field = keyof typeof form
const attempted = ref(false)
const stepUpOpen = ref(false)
const problem = ref<MaropayError | null>(null)

watch(() => props.modelValue, (open) => {
  if (!open) return
  Object.assign(form, { holderName: props.current?.holderName ?? props.defaultHolder, bankName: '', bankCode: '', accountNumber: '', confirmAccountNumber: '' })
  attempted.value = false
  problem.value = null
}, { immediate: true })

const bankCode = computed(() => bankCodeFor(props.country))
const errors = computed(() => bankAccountErrors(form, props.country))

function errorFor(field: Field): string | undefined {
  return attempted.value ? errors.value[field] : undefined
}

function close(): void {
  emit('update:modelValue', false)
}

/** Details first, then the check — so a mistyped number never costs a code. */
function save(): void {
  attempted.value = true
  problem.value = null
  if (Object.keys(errors.value).length) return
  stepUpOpen.value = true
}

function onVerified(): void {
  const result = maropay.updateBankAccount({ holderName: form.holderName, bankName: form.bankName, accountNumber: digitsOnly(form.accountNumber) })
  if (!result.ok) {
    problem.value = result.error
    return
  }
  Object.assign(form, { bankCode: '', accountNumber: '', confirmAccountNumber: '' })
  emit('saved')
  close()
}
</script>

<template>
  <MpFormDrawer
    :model-value="modelValue"
    :title="current ? 'Change payout bank account' : 'Add payout bank account'"
    :subtitle="current ? `Payouts go to ${current.bankName} •••• ${current.last4} now` : undefined"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <MpFormGrid :cols="2">
      <v-text-field v-model="form.holderName" label="Account holder name *" class="mp-form-grid__full" autocomplete="off" :error-messages="errorFor('holderName')" />
      <v-text-field v-model="form.bankName" label="Bank name *" placeholder="e.g. Chase" class="mp-form-grid__full" autocomplete="off" :error-messages="errorFor('bankName')" />
      <v-text-field v-model="form.bankCode" :label="`${bankCode.label} *`" inputmode="numeric" autocomplete="off" class="mp-form-grid__full" :error-messages="errorFor('bankCode')" />
      <v-text-field v-model="form.accountNumber" label="Account number *" inputmode="numeric" autocomplete="off" :error-messages="errorFor('accountNumber')" />
      <v-text-field v-model="form.confirmAccountNumber" label="Confirm account number *" inputmode="numeric" autocomplete="off" :error-messages="errorFor('confirmAccountNumber')" />
    </MpFormGrid>

    <p class="maropay-bank__note">
      The next payout goes to this account. Only the last four digits are kept once it’s saved, and we’ll send a security notice about the change.
    </p>

    <MpAlert v-if="problem" tone="error" title="The bank account wasn’t changed">{{ problem.message }}</MpAlert>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="close">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" prepend-icon="shield-check" @click="save">Confirm and save</v-btn>
    </template>
  </MpFormDrawer>

  <MaropayStepUpDialog v-model="stepUpOpen" purpose="Changing where payouts go needs a fresh check." @verified="onVerified" />
</template>

<style scoped>
.maropay-bank__note {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--text-secondary);
}
</style>
