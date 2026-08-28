<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'
import { accentToVuetifyColor } from './dashboardOptions'
import type { Dashboard } from '@/stores/dashboards/types'
import { useDashboardsStore } from '@/stores/useDashboards'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    accountId: string
    dashboard?: Dashboard | null
  }>(),
  { dashboard: null },
)

const emit = defineEmits<{
  saved: [dashboardId: string]
}>()

const dashboardsStore = useDashboardsStore()

const isEditMode = computed(() => props.dashboard != null)

const name = ref('')
const description = ref('')

watch(
  [model, () => props.dashboard],
  ([isOpen, dashboard]) => {
    if (!isOpen) return
    if (dashboard) {
      name.value = dashboard.name
      description.value = dashboard.description ?? ''
    } else {
      name.value = ''
      description.value = ''
    }
  },
  { immediate: true },
)

const trimmedName = computed(() => name.value.trim())
const nameError = computed(() => {
  if (!trimmedName.value) return isEditMode.value ? 'Name is required' : ''
  if (trimmedName.value.length > 60) return 'Name must be 60 characters or fewer'
  return ''
})
const descriptionError = computed(() =>
  description.value.length > 240 ? 'Description must be 240 characters or fewer' : '',
)
const canSubmit = computed(() => Boolean(trimmedName.value) && !nameError.value && !descriptionError.value)

// Static identity preview — icon/accent come from the dashboard (seeded), not editable.
const previewIcon = computed(() => (props.dashboard ? props.dashboard.icon ?? 'layout-dashboard' : 'grid-2x2-plus'))
const previewColor = computed(() => (props.dashboard ? accentToVuetifyColor(props.dashboard.accent) : 'primary'))

function close() {
  model.value = false
}

function submit() {
  if (!canSubmit.value) return
  if (props.dashboard) {
    dashboardsStore.updateDashboard(props.accountId, props.dashboard.id, {
      name: trimmedName.value,
      description: description.value.trim(),
    })
    emit('saved', props.dashboard.id)
    close()
    return
  }
  const dashboard = dashboardsStore.createDashboard(props.accountId, trimmedName.value, {
    description: description.value.trim(),
  })
  if (!dashboard) return
  emit('saved', dashboard.id)
  close()
}

function handleNameEnter() {
  if (isEditMode.value) return
  submit()
}

</script>

<template>
  <!-- Composes MpDialog (P4-6): header/body/footer insets, radius and width all
       come from the shell; the avatar rides in on #lead and the mode label on
       `eyebrow` (the same two names MpListRow and MpPageHeader already use). -->
  <MpDialog
    v-model="model"
    size="sm"
    persistent
    :eyebrow="isEditMode ? 'Edit dashboard' : 'New dashboard'"
    :title="trimmedName || 'Untitled dashboard'"
  >
    <template #lead>
      <v-avatar size="44" variant="tonal" :color="previewColor">
        <v-icon>{{ previewIcon }}</v-icon>
      </v-avatar>
    </template>

    <v-text-field
      v-model="name"
      label="Dashboard name *"
      placeholder="e.g. Lifecycle Health"
      :error-messages="nameError ? [nameError] : []"
      counter="60"
      :autofocus="!isEditMode"
      @keydown.enter="handleNameEnter"
    />

    <v-textarea
      v-model="description"
      label="Description"
      hint="Optional — what does this dashboard answer?"
      :error-messages="isEditMode && descriptionError ? [descriptionError] : []"
      counter="240"
      rows="3"
      auto-grow
    />

    <template #footer>
      <v-btn variant="text" class="text-none" @click="close">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSubmit" @click="submit">
        {{ isEditMode ? 'Save changes' : 'Create dashboard' }}
      </v-btn>
    </template>
  </MpDialog>
</template>
