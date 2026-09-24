<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useMaropayStore } from '@/stores/useMaropay'
import { STEP_UP_CODE } from '@/services/maropay/mockAdapter'

// A fresh "is it really you?" check before bank details change (plan §3G).
// Opening it requests a challenge; the verified token lives in the store for a
// few minutes and is never saved. Three wrong codes end this attempt. The
// prototype prints its code, because there is no authenticator to read.

const props = defineProps<{
  modelValue: boolean
  /** What the check unlocks, shown under the title. */
  purpose: string
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  verified: []
}>()

const maropay = useMaropayStore()
const MAX_ATTEMPTS = 3

const code = ref('')
const verifying = ref(false)
const attempts = ref(0)
const error = ref<string | null>(null)
const locked = computed(() => attempts.value >= MAX_ATTEMPTS)

watch(() => props.modelValue, (open) => {
  if (!open) return
  code.value = ''
  error.value = null
  attempts.value = 0
  verifying.value = false
  maropay.requestStepUp()
}, { immediate: true })

function close(): void {
  emit('update:modelValue', false)
}

async function verify(): Promise<void> {
  if (code.value.length !== 6 || verifying.value || locked.value) return
  verifying.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 500))
  const result = maropay.confirmStepUp(code.value)
  verifying.value = false
  if (result.ok) {
    emit('verified')
    close()
    return
  }
  attempts.value += 1
  code.value = ''
  error.value = locked.value ? 'Too many wrong codes. Close this and start again for a new code.' : result.error.message
}
</script>

<template>
  <MpDialog :model-value="modelValue" size="sm" persistent title="Confirm it’s you" :subtitle="purpose" @update:model-value="emit('update:modelValue', $event)">
    <template #lead>
      <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
        <v-icon size="20">shield-check</v-icon>
      </v-avatar>
    </template>

    <MpFormField label="6-digit code from your authenticator app" :hint="`Prototype code: ${STEP_UP_CODE}`" :error="error ?? undefined">
      <v-otp-input v-model="code" length="6" type="number" :disabled="verifying || locked" autofocus @finish="verify" />
    </MpFormField>

    <template #footer>
      <v-btn variant="text" class="text-none" :disabled="verifying" @click="close">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="code.length !== 6 || locked" :loading="verifying" @click="verify">Confirm</v-btn>
    </template>
  </MpDialog>
</template>
