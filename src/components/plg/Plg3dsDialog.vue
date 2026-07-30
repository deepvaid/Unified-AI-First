<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  amountLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  approved: []
}>()

const code = ref('')
const verifying = ref(false)

const isComplete = computed(() => code.value.length === 6)

function close() {
  emit('update:modelValue', false)
}

async function approve() {
  if (!isComplete.value || verifying.value) return
  verifying.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  verifying.value = false
  emit('approved')
  close()
}

// Reset the entered code whenever the dialog is (re)opened.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      code.value = ''
      verifying.value = false
    }
  },
)

const titleId = useId()
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="400"
    persistent
    :aria-labelledby="titleId"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <v-card flat border rounded="lg" class="plg-3ds pa-2">
      <div class="d-flex align-center ga-3 pa-4 pb-2">
        <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
          <v-icon size="20">landmark</v-icon>
        </v-avatar>
        <div class="min-width-0">
          <div :id="titleId" class="text-body-2 font-weight-bold">Verification — Maropost purchase</div>
          <div class="text-caption text-medium-emphasis">{{ amountLabel }}</div>
        </div>
      </div>

      <v-divider />

      <div class="pa-4 d-flex flex-column ga-4">
        <p class="text-body-2 text-medium-emphasis mb-0">
          Your bank has sent a one-time passcode to &bull;&bull;&bull;&bull; 4242's cardholder.
        </p>

        <v-otp-input
          v-model="code"
          length="6"
          type="number"
          :disabled="verifying"
          autofocus
        />

        <div class="text-caption text-medium-emphasis">Demo code: 123456</div>
      </div>

      <v-divider />

      <div class="pa-4 d-flex justify-end ga-2">
        <v-btn variant="text" class="text-none" :disabled="verifying" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="!isComplete"
          :loading="verifying"
          @click="approve"
        >
          Approve
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.plg-3ds {
  background: rgb(var(--v-theme-surface));
}
</style>
