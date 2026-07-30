<script setup lang="ts">
import { computed, useId } from 'vue'
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

const titleId = useId()
</script>

<template>
  <v-dialog v-model="localOpen" max-width="880" scrollable width="calc(100vw - 32px)" :aria-labelledby="titleId">
    <v-card flat border rounded="lg" class="dv-expand">
      <header class="dv-expand__head">
        <v-icon color="primary" size="18">sparkles</v-icon>
        <div class="dv-expand__head-text">
          <div :id="titleId" class="dv-expand__title">{{ draft.title }}</div>
          <div class="dv-expand__sub">{{ subtitle }}</div>
        </div>
        <v-btn icon size="32" variant="text" aria-label="Close enlarged preview" @click="close">
          <v-icon size="16">x</v-icon>
        </v-btn>
      </header>

      <div class="dv-expand__body">
        <div class="dv-expand__preview">
          <DvDraftPreview :draft="draft" density="expanded" />
        </div>
      </div>

      <v-divider />

      <footer class="dv-expand__foot">
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
      </footer>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.dv-expand {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--mp-component-dialog-radius-default) !important;
  overflow: hidden;
}

.dv-expand__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-expand__head-text {
  flex: 1;
  min-width: 0;
}

.dv-expand__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.1px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dv-expand__sub {
  font-size: 12.5px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.dv-expand__body {
  padding: 20px;
  overflow-y: auto;
}

.dv-expand__preview {
  background: rgb(var(--v-theme-background));
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-component-card-radius-md);
  padding: 24px;
}

.dv-expand__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface-light));
}
</style>
