<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormField from '@/components/MpFormField.vue'

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

</script>

<template>
  <!-- Composes MpDialog (P4-6). Was a hand-rolled pa-2 card with pa-4 bands. -->
  <MpDialog
    :model-value="modelValue"
    size="sm"
    persistent
    title="Verification — Maropost purchase"
    :subtitle="amountLabel"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <template #lead>
      <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
        <v-icon size="20">landmark</v-icon>
      </v-avatar>
    </template>

    <p class="plg-3ds__prompt">
      Your bank has sent a one-time passcode to &bull;&bull;&bull;&bull; 4242's cardholder.
    </p>

    <MpFormField label="One-time passcode" hint="Demo code: 123456">
      <v-otp-input
        v-model="code"
        length="6"
        type="number"
        :disabled="verifying"
        autofocus
      />
    </MpFormField>

    <template #footer>
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
    </template>
  </MpDialog>
</template>

<style scoped>
.plg-3ds__prompt {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

</style>
