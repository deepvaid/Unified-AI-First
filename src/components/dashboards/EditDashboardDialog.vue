<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { accentToVuetifyColor } from './dashboardOptions'
import type { Dashboard } from '@/stores/dashboards/types'
import { useDashboardsStore } from '@/stores/useDashboards'

const model = defineModel<boolean>({ default: false })

const props = defineProps<{
  accountId: string
  dashboard: Dashboard | null
}>()

const emit = defineEmits<{
  saved: [dashboardId: string]
}>()

const dashboardsStore = useDashboardsStore()

const name = ref('')
const description = ref('')

watch(
  [model, () => props.dashboard],
  ([isOpen, dashboard]) => {
    if (!isOpen || !dashboard) return
    name.value = dashboard.name
    description.value = dashboard.description ?? ''
  },
  { immediate: true },
)

const trimmedName = computed(() => name.value.trim())
const nameError = computed(() => {
  if (!trimmedName.value) return 'Name is required'
  if (trimmedName.value.length > 60) return 'Name must be 60 characters or fewer'
  return ''
})
const descriptionError = computed(() => (description.value.length > 240 ? 'Description must be 240 characters or fewer' : ''))
const canSave = computed(() => Boolean(props.dashboard) && !nameError.value && !descriptionError.value)

// Static identity preview — icon/accent come from the dashboard (seeded), not editable.
const previewIcon = computed(() => props.dashboard?.icon ?? 'layout-dashboard')
const previewColor = computed(() => accentToVuetifyColor(props.dashboard?.accent))

function close() {
  model.value = false
}

function save() {
  if (!canSave.value || !props.dashboard) return
  dashboardsStore.updateDashboard(props.accountId, props.dashboard.id, {
    name: trimmedName.value,
    description: description.value.trim(),
  })
  emit('saved', props.dashboard.id)
  close()
}
</script>

<template>
  <v-dialog v-model="model" max-width="560" persistent scrollable>
    <v-card flat rounded="lg" color="surface" class="edit-dashboard-dialog">
      <v-card-title class="d-flex align-center ga-3 pa-5">
        <v-avatar size="44" variant="tonal" :color="previewColor">
          <v-icon>{{ previewIcon }}</v-icon>
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-overline text-medium-emphasis">Edit dashboard</div>
          <div class="text-h6 font-weight-bold">{{ trimmedName || 'Untitled dashboard' }}</div>
        </div>
        <v-btn icon="x" variant="text" size="small" aria-label="Close" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-5 d-flex flex-column ga-5">
        <v-text-field
          v-model="name"
          label="Dashboard name"
          placeholder="e.g. Lifecycle Health"
          :error-messages="nameError ? [nameError] : []"
          counter="60"
          density="comfortable"
        />

        <v-textarea
          v-model="description"
          label="Description"
          placeholder="What does this dashboard answer?"
          :error-messages="descriptionError ? [descriptionError] : []"
          counter="240"
          rows="2"
          auto-grow
          density="comfortable"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" class="text-none" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          Save changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
