<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type {
  DashboardFilterState,
  DashboardWidgetDraft,
  DashboardWidgetLibraryEntry,
} from '@/stores/dashboards/types'
import { useCopilotStore } from '@/stores/useCopilot'
import { useDashboardsStore } from '@/stores/useDashboards'
import WidgetLibraryStep from './wizard/WidgetLibraryStep.vue'
import WidgetEditStep from './wizard/WidgetEditStep.vue'

type WizardStage = 'pick' | 'edit'

const model = defineModel<boolean>({ default: false })

const props = defineProps<{
  accountId: string
  dashboardId: string
  dashboardFilters: DashboardFilterState
  initialDraft?: DashboardWidgetDraft | null
}>()

const dashboardsStore = useDashboardsStore()
const copilot = useCopilotStore()

const stage = ref<WizardStage>('pick')
const draft = ref<DashboardWidgetDraft | null>(null)

const isEditing = computed(() => Boolean(props.initialDraft?.widgetId))

const drawerTitle = computed(() => {
  if (isEditing.value) return 'Edit widget'
  if (stage.value === 'edit') return 'Edit widget'
  return 'Add widget'
})

const drawerSubtitle = computed(() => {
  if (isEditing.value) return 'Update your widget and save the changes.'
  if (stage.value === 'edit') return 'Step 2 of 2 · Refine and add to dashboard'
  return 'Step 1 of 2 · Choose what to monitor'
})

function libraryEntryToDraft(entry: DashboardWidgetLibraryEntry): DashboardWidgetDraft {
  return {
    dashboardId: props.dashboardId,
    type: entry.type,
    title: entry.title,
    subtitle: entry.description,
    dataSource: entry.dataSource,
    metricId: entry.metricId,
    drilldown: entry.drilldown,
    chartVariant: entry.chartVariant,
  }
}

function reset() {
  stage.value = 'pick'
  draft.value = null
}

function initializeFromProps() {
  reset()
  const incoming = props.initialDraft
  if (!incoming) return

  // Editing existing widget — go straight to edit stage
  if (incoming.widgetId) {
    draft.value = { ...incoming }
    stage.value = 'edit'
    return
  }

  // Da Vinci-generated draft routed to Edit (e.g. via "Edit before adding" in copilot)
  if (incoming.aiProvenance) {
    draft.value = { ...incoming }
    stage.value = 'edit'
  }
}

watch(
  [model, () => props.initialDraft],
  ([isOpen]) => {
    if (isOpen) initializeFromProps()
  },
  { immediate: true, deep: true },
)

const confirmClose = ref(false)

watch(model, (isOpen) => {
  if (!isOpen) {
    dashboardsStore.closeWidgetEditor()
  }
})

function discardDraftAndClose() {
  confirmClose.value = false
  draft.value = null
  stage.value = 'pick'
  model.value = false
}

function handleLibrarySelect(entry: DashboardWidgetLibraryEntry) {
  draft.value = libraryEntryToDraft(entry)
  stage.value = 'edit'
}

// Hand off to Da Vinci: close the drawer and open the copilot instead.
function handleCreateWithAi() {
  close()
  copilot.open()
}

function handleDraftUpdate(next: DashboardWidgetDraft) {
  draft.value = next
}

function persist(): boolean {
  const current = draft.value
  if (!current) return false
  const descriptor = getMetricDescriptor(current.metricId)
  if (!descriptor) return false

  const payload: DashboardWidgetDraft = {
    ...current,
    title: current.title?.trim() || descriptor.defaultTitle,
    drilldown: current.drilldown ?? descriptor.drilldown,
    aiProvenance: current.aiProvenance ?? props.initialDraft?.aiProvenance,
    widgetId: props.initialDraft?.widgetId,
  }

  if (payload.widgetId) {
    dashboardsStore.updateWidget(props.accountId, payload)
  } else {
    dashboardsStore.addWidget(props.accountId, payload)
  }
  return true
}

function close() {
  if (draft.value && stage.value === 'edit' && !isEditing.value) {
    confirmClose.value = true
    return
  }
  model.value = false
}

function goBack() {
  if (stage.value === 'edit' && !isEditing.value) {
    stage.value = 'pick'
    return
  }
  close()
}

function handleSave() {
  if (persist()) {
    draft.value = null
    model.value = false
  }
}

const editPrimaryLabel = computed(() => (isEditing.value ? 'Save changes' : 'Add to dashboard'))

const showFooterPrimary = computed(() => stage.value === 'edit')
</script>

<template>
  <MpFormDrawer
    v-model="model"
    :title="drawerTitle"
    :subtitle="drawerSubtitle"
    :width="600"
  >
    <div class="widget-wizard">
      <WidgetLibraryStep
        v-if="stage === 'pick'"
        @select="handleLibrarySelect"
        @create-with-ai="handleCreateWithAi"
      />

      <WidgetEditStep
        v-else-if="stage === 'edit' && draft"
        :account-id="accountId"
        :draft="draft"
        :filters="dashboardFilters"
        @update:draft="handleDraftUpdate"
      />
    </div>

    <template #footer>
      <div class="d-flex align-center ga-2 w-100">
        <v-btn
          v-if="stage === 'edit' && !isEditing"
          variant="text"
          class="text-none"
          prepend-icon="arrow-left"
          @click="goBack"
        >
          Back
        </v-btn>
        <v-spacer />
        <v-btn variant="text" class="text-none" @click="close">Cancel</v-btn>
        <v-btn
          v-if="showFooterPrimary"
          color="primary"
          variant="flat"
          class="text-none"
          @click="handleSave"
        >
          {{ editPrimaryLabel }}
        </v-btn>
      </div>
    </template>
  </MpFormDrawer>

  <MpConfirmDialog
    v-model="confirmClose"
    danger
    title="Discard widget draft?"
    message="You have a widget configuration that hasn’t been added yet. Leaving now will discard it."
    confirm-label="Discard draft"
    @confirm="discardDraftAndClose"
  />
</template>

<style scoped lang="scss">
.widget-wizard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
