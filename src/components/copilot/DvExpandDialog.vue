<script setup lang="ts">
import { computed } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import DvDraftPreview from '@/components/copilot/DvDraftPreview.vue'
import type { DashboardWidgetDraft } from '@/stores/dashboards/types'

const props = defineProps<{
  modelValue: boolean
  draft: DashboardWidgetDraft
  typeLabel: string
  isAdded: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  add: []
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const subtitle = computed(() => {
  const sub = props.draft.subtitle ?? 'last 30 days'
  return `${props.typeLabel} · ${sub}`
})

function close() {
  emit('update:modelValue', false)
}

function handleAdd() {
  emit('add')
}

</script>

<template>
  <!-- Composes MpDialog (P4-6): the head/body/foot this used to draw itself at
       16x20 / 20 / 12x16 now come from the shell at one inset. -->
  <MpDialog
    v-model="localOpen"
    size="lg"
    :title="draft.title"
    :subtitle="subtitle"
    icon="sparkles"
  >
    <div class="dv-expand__preview">
      <DvDraftPreview :draft="draft" density="expanded" />
    </div>

    <template #footer>
      <v-btn variant="flat" class="text-none" @click="close" color="surface">Close</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        :disabled="isAdded"
        @click="handleAdd"
      >
        <v-icon size="16" start>{{ isAdded ? 'check' : 'plus' }}</v-icon>
        {{ isAdded ? 'Added' : 'Add to dashboard' }}
      </v-btn>
    </template>
  </MpDialog>
</template>

<style scoped lang="scss">
.dv-expand__preview {
  background: rgb(var(--v-theme-background));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-12);
  padding: var(--mp-component-card-paddingSpacious);
}
</style>
