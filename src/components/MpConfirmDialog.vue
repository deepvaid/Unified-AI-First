<script setup lang="ts">
import { useId } from 'vue'

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

const titleId = useId()
const messageId = useId()
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    :aria-labelledby="titleId"
    :aria-describedby="messageId"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="lg" border flat class="pa-1">
      <v-card-title :id="titleId" class="text-body-1 font-weight-bold d-flex align-center gap-2">
        <v-icon v-if="danger" color="error" size="20">triangle-alert</v-icon>
        {{ title }}
      </v-card-title>
      <v-card-text :id="messageId" class="text-body-2 text-medium-emphasis">{{ message }}</v-card-text>
      <v-card-text v-if="consequences?.length" class="text-body-2 text-medium-emphasis pt-0">
        <ul class="mp-confirm-consequences pl-5 mb-0">
          <li v-for="(consequence, index) in consequences" :key="index">{{ consequence }}</li>
        </ul>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" class="text-none" @click="emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn :color="danger ? 'error' : 'primary'" variant="flat" class="text-none" @click="confirm">
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mp-confirm-consequences li + li {
  margin-top: var(--mp-spacing-1);
}
</style>
