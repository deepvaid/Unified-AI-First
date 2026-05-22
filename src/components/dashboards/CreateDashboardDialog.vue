<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDashboardsStore } from '@/stores/useDashboards'

const model = defineModel<boolean>({ default: false })

const props = defineProps<{
  accountId: string
}>()

const emit = defineEmits<{
  created: [dashboardId: string]
}>()

const dashboardsStore = useDashboardsStore()

const name = ref('')
const description = ref('')

watch(model, (isOpen) => {
  if (!isOpen) return
  name.value = ''
  description.value = ''
})

const trimmedName = computed(() => name.value.trim())
const nameError = computed(() => {
  if (!trimmedName.value) return ''
  if (trimmedName.value.length > 60) return 'Name must be 60 characters or fewer'
  return ''
})
const canCreate = computed(() => Boolean(trimmedName.value) && !nameError.value && description.value.length <= 240)

function close() {
  model.value = false
}

function create() {
  if (!canCreate.value) return
  const dashboard = dashboardsStore.createDashboard(props.accountId, trimmedName.value, {
    description: description.value.trim(),
  })
  if (!dashboard) return
  emit('created', dashboard.id)
  close()
}
</script>

<template>
  <v-dialog v-model="model" max-width="520" persistent scrollable>
    <v-card flat rounded="lg" color="surface" class="create-dashboard-dialog">
      <v-card-title class="d-flex align-center ga-3 pa-5">
        <v-avatar size="44" variant="tonal" color="primary">
          <v-icon>grid-2x2-plus</v-icon>
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-overline text-medium-emphasis">New dashboard</div>
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
          autofocus
          density="comfortable"
          @keydown.enter="create"
        />

        <v-textarea
          v-model="description"
          label="Description"
          placeholder="Optional. What does this dashboard answer?"
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
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" @click="create">
          Create dashboard
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
