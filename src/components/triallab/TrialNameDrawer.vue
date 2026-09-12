<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'

/**
 * TrialNameDrawer — the contextual way to supply a name after onboarding
 * (variants B/D never ask up front). One field, Save/Cancel, no reminder
 * afterwards. Clearing the field and saving removes the name again.
 */
const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  kind: 'person' | 'workspace'
  /** Current value, or null when nothing has been supplied yet. */
  initial: string | null
}>(), { initial: null })

const emit = defineEmits<{ save: [value: string | null] }>()

const value = ref('')
const field = ref<{ focus?: () => void } | null>(null)

// The drawer's focus trap moves focus to the panel itself on open; the field
// takes it back one frame later so typing lands where the user expects.
watch(model, async (open) => {
  if (!open) return
  value.value = props.initial ?? ''
  await nextTick()
  await nextTick()
  field.value?.focus?.()
})

const copy = computed(() => props.kind === 'person'
  ? {
      title: props.initial ? 'Edit your name' : 'Add your name',
      subtitle: 'Shown in your profile and greetings. One word is fine.',
      label: 'Your name',
      placeholder: 'What should we call you?',
    }
  : {
      title: props.initial ? 'Rename workspace' : 'Name this workspace',
      subtitle: 'A label to help you recognise this account. You can change it later.',
      label: 'Workspace name',
      placeholder: 'e.g. Northwind Trading',
    })

function save() {
  emit('save', value.value.trim() || null)
  model.value = false
}
</script>

<template>
  <MpFormDrawer v-model="model" :title="copy.title" :subtitle="copy.subtitle" size="sm">
    <form novalidate @submit.prevent="save">
      <MpFormGrid :cols="1">
        <v-text-field
          ref="field"
          v-model="value"
          :label="copy.label"
          :placeholder="copy.placeholder"
          autocomplete="off"
        />
      </MpFormGrid>
    </form>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="model = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="save">Save</v-btn>
    </template>
  </MpFormDrawer>
</template>
