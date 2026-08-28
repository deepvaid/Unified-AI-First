<script setup lang="ts">
import MpDialog from './MpDialog.vue'

withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  /** Destructive action: error icon + error confirm button. */
  danger?: boolean
  /** Optional bullet list of consequences, rendered between the message and the actions. */
  consequences?: string[]
}>(), {
  confirmLabel: 'Confirm',
  danger: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- Composes MpDialog (P4-6): the header/body/footer rhythm, radius, width ramp
       and close affordance all come from the shell. This component contributes
       only what a confirm prompt actually is — the danger tone, the message, the
       consequences list and the two-button footer. -->
  <MpDialog
    :model-value="modelValue"
    size="sm"
    :title="title"
    :icon="danger ? 'triangle-alert' : undefined"
    :tone="danger ? 'error' : 'neutral'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="mp-confirm__message">{{ message }}</p>
    <ul v-if="consequences?.length" class="mp-confirm__consequences">
      <li v-for="(consequence, index) in consequences" :key="index">{{ consequence }}</li>
    </ul>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="emit('update:modelValue', false)">Cancel</v-btn>
      <v-btn :color="danger ? 'error' : 'primary'" variant="flat" class="text-none" @click="confirm">
        {{ confirmLabel }}
      </v-btn>
    </template>
  </MpDialog>
</template>

<style scoped>
.mp-confirm__message {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.mp-confirm__consequences {
  margin: 0;
  padding-left: var(--mp-space-20);
  color: var(--muted);
  line-height: 1.5;
}

.mp-confirm__consequences li + li {
  margin-top: var(--mp-space-4);
}
</style>
