<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  DASHBOARD_ACCENT_OPTIONS,
  DASHBOARD_ICON_OPTIONS,
  accentToVuetifyColor,
} from './dashboardOptions'
import type { Dashboard, DashboardAccent } from '@/stores/dashboards/types'
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
const icon = ref<string>('layout-dashboard')
const accent = ref<DashboardAccent>('primary')

watch(
  [model, () => props.dashboard],
  ([isOpen, dashboard]) => {
    if (!isOpen || !dashboard) return
    name.value = dashboard.name
    description.value = dashboard.description ?? ''
    icon.value = dashboard.icon ?? 'layout-dashboard'
    accent.value = dashboard.accent ?? 'primary'
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

const previewColor = computed(() => accentToVuetifyColor(accent.value))

function close() {
  model.value = false
}

function save() {
  if (!canSave.value || !props.dashboard) return
  dashboardsStore.updateDashboard(props.accountId, props.dashboard.id, {
    name: trimmedName.value,
    description: description.value.trim(),
    icon: icon.value,
    accent: accent.value,
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
          <v-icon>{{ icon }}</v-icon>
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

        <div>
          <div class="text-subtitle-2 font-weight-bold mb-2">Accent color</div>
          <div class="edit-dashboard-dialog__swatches">
            <button
              v-for="option in DASHBOARD_ACCENT_OPTIONS"
              :key="option.value"
              type="button"
              class="edit-dashboard-dialog__swatch"
              :class="{ 'edit-dashboard-dialog__swatch--active': accent === option.value }"
              :aria-label="`Use ${option.label} accent`"
              :aria-pressed="accent === option.value"
              @click="accent = option.value"
            >
              <v-avatar size="32" variant="tonal" :color="option.vuetifyColor">
                <v-icon size="18">palette</v-icon>
              </v-avatar>
              <span class="text-caption">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="text-subtitle-2 font-weight-bold mb-2">Icon</div>
          <div class="edit-dashboard-dialog__icons">
            <button
              v-for="option in DASHBOARD_ICON_OPTIONS"
              :key="option.icon"
              type="button"
              class="edit-dashboard-dialog__icon"
              :class="{ 'edit-dashboard-dialog__icon--active': icon === option.icon }"
              :aria-label="`Use ${option.label} icon`"
              :aria-pressed="icon === option.icon"
              @click="icon = option.icon"
            >
              <v-icon size="22">{{ option.icon }}</v-icon>
            </button>
          </div>
        </div>
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

<style scoped lang="scss">
.edit-dashboard-dialog__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.edit-dashboard-dialog__swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 120ms ease, background 120ms ease;
}

.edit-dashboard-dialog__swatch:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.edit-dashboard-dialog__swatch--active {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.06);
}

.edit-dashboard-dialog__icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 8px;
}

.edit-dashboard-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid var(--mp-border-subtle);
  border-radius: 12px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.78);
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
}

.edit-dashboard-dialog__icon:hover {
  border-color: rgba(var(--v-theme-primary), 0.32);
  color: rgb(var(--v-theme-primary));
}

.edit-dashboard-dialog__icon--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
</style>
