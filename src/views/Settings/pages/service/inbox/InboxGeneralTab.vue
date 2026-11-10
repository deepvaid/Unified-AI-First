<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useToast } from '@/composables/useToast'
import { CRM_OPTIONS, useServiceSettingsStore } from '@/stores/useServiceSettings'
import { isDuplicateName, type Inbox } from '@/service/model'

const props = defineProps<{ inbox: Inbox }>()
const emit = defineEmits<{ dirty: [dirty: boolean] }>()

const settings = useServiceSettingsStore()
const toast = useToast()

const saved = () => ({ name: props.inbox.name, description: props.inbox.description, crm: props.inbox.crm || null })
const draft = reactive(saved())

const isDirty = computed(() => JSON.stringify(draft) !== JSON.stringify(saved()))
watch(isDirty, value => emit('dirty', value), { immediate: true })

const nameError = computed(() => {
  if (!draft.name.trim()) return 'Give the inbox a name.'
  return isDuplicateName(settings.inboxes, draft.name, props.inbox.id) ? 'An inbox with this name already exists.' : ''
})

function discard() {
  Object.assign(draft, saved())
}
function save() {
  if (nameError.value) return
  settings.updateInbox(props.inbox.id, { name: draft.name.trim(), description: draft.description.trim(), crm: draft.crm ?? '' })
  Object.assign(draft, saved())
  toast.success('Inbox details saved')
}
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset">
    <MpFormSection title="Inbox details" description="How agents see this inbox in the ticket list and on every ticket from it." />
    <MpFormGrid :cols="2">
      <v-text-field v-model="draft.name" label="Inbox name *" :error-messages="isDirty ? nameError : ''"></v-text-field>
      <v-select
        v-model="draft.crm"
        :items="CRM_OPTIONS"
        label="CRM"
        placeholder="None"
        hint="Contacts who write to this inbox are matched in this CRM."
        clearable
      ></v-select>
      <v-textarea v-model="draft.description" label="Description" rows="3" class="mp-form-grid__full"></v-textarea>
    </MpFormGrid>

    <div class="inbox-tab__actions d-flex justify-end ga-2">
      <v-btn variant="text" class="text-none" :disabled="!isDirty" @click="discard">Discard</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!isDirty || !!nameError" @click="save">Save changes</v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.inbox-tab__actions {
  margin-top: var(--mp-component-field-sectionGap);
}
</style>
