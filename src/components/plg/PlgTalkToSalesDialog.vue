<script setup lang="ts">
import { ref } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
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
  <!-- Composes MpDialog (P4-6). Was Vuetify's own card insets plus the gap-2 /
       gap-4 shims; the body's field rhythm is `component.dialog.gap` now. -->
  <MpDialog
    :model-value="modelValue"
    size="sm"
    title="Talk to sales"
    icon="messages-square"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="talk-to-sales__lede">
      Tell us a bit about your goals and our team will reach out within one business day.
    </p>

    <v-select
      v-model="interest"
      label="What are you interested in?"
      :items="INTEREST_OPTIONS"
    />

    <v-textarea
      v-model="notes"
      label="Anything we should know?"
      hint="Optional"
      persistent-hint
      rows="3"
      auto-grow
    />

    <a href="mailto:sales@maropost.com" class="sales-mailto-link">
      or email sales@maropost.com
    </a>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="close">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="submit">Request a call</v-btn>
    </template>
  </MpDialog>
</template>

<style scoped>
.talk-to-sales__lede {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.sales-mailto-link {
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  width: fit-content;
}

.sales-mailto-link:hover {
  text-decoration: underline;
}
</style>
