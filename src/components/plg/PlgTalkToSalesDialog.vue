<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

withDefaults(defineProps<{
  modelValue: boolean
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const INTEREST_OPTIONS = [
  'Choosing the right plan',
  'Enterprise pricing',
  'Migration & onboarding',
  'Something else',
]

const interest = ref<string | null>(null)
const notes = ref('')
const toast = useToast()

function close() {
  emit('update:modelValue', false)
}

function submit() {
  close()
  emit('submitted')
  toast.info('Thanks — our team will reach out within one business day.')
  interest.value = null
  notes.value = ''
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="460" @update:model-value="emit('update:modelValue', $event)">
    <v-card flat rounded="lg" class="pa-1">
      <v-card-title class="text-body-1 font-weight-bold d-flex align-center gap-2">
        <v-icon size="20" color="primary">messages-square</v-icon>
        Talk to sales
      </v-card-title>
      <v-card-text class="d-flex flex-column gap-4">
        <p class="text-body-2 text-medium-emphasis mb-0">
          Tell us a bit about your goals and our team will reach out within one business day.
        </p>

        <v-select
          v-model="interest"
          label="What are you interested in?"
          :items="INTEREST_OPTIONS"
          variant="outlined"
          density="comfortable"
          hide-details
        />

        <v-textarea
          v-model="notes"
          label="Anything we should know?"
          hint="Optional"
          persistent-hint
          variant="outlined"
          density="comfortable"
          rows="3"
          auto-grow
        />

        <a href="mailto:sales@maropost.com" class="text-caption text-medium-emphasis sales-mailto-link">
          or email sales@maropost.com
        </a>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" class="text-none" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="submit">Request a call</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.sales-mailto-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  width: fit-content;
}

.sales-mailto-link:hover {
  text-decoration: underline;
}
</style>
