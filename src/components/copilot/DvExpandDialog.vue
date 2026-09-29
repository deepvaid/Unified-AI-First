<script setup lang="ts">
import { computed } from 'vue'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpDialog from '@/components/MpDialog.vue'
import { buildDraftPreviewWidget } from '@/components/dashboards/wizard/buildPreviewWidget'
import type { DashboardFilterState, DashboardWidgetDraft } from '@/stores/dashboards/types'

const props = defineProps<{
  modelValue: boolean
  draft: DashboardWidgetDraft
  accountId: string
  filters: DashboardFilterState
  typeLabel: string
  isAdded: boolean
  /** Why the draft can't be added right now. Disables Add. */
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  add: []
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const previewWidget = computed(() => buildDraftPreviewWidget(props.draft))
const isKpi = computed(() => props.draft.type === 'kpi')

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
    :subtitle="typeLabel"
    icon="sparkles"
  >
    <div class="dv-expand__preview" :class="{ 'dv-expand__preview--kpi': isKpi }">
      <!-- A live DashboardWidgetCard sizes its chart from its own body, so the frame needs a definite height. -->
      <div class="dv-expand__frame" :class="{ 'dv-expand__frame--kpi': isKpi }">
        <DashboardWidgetCard
          v-if="previewWidget"
          :account-id="accountId"
          :widget="previewWidget"
          :filters="filters"
          preview
          :show-actions="false"
        />
      </div>
    </div>

    <MpAlert v-if="error && !isAdded" tone="error" icon="circle-alert">{{ error }}</MpAlert>

    <template #footer>
      <v-btn variant="flat" class="text-none" @click="close" color="surface">Close</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        :disabled="isAdded || !!error"
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

/* A lone KPI tile stretched across the wide dialog reads as a banner. */
.dv-expand__preview--kpi {
  max-width: var(--mp-component-dialog-width-sm);
  margin-inline: auto;
}

.dv-expand__frame {
  height: var(--mp-component-preview-widgetHeight-lg);
}

.dv-expand__frame--kpi {
  height: var(--mp-component-preview-widgetHeight-sm);
}
</style>
