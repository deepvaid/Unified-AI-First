<script setup lang="ts">
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Job Name', key: 'name', sortable: true },
  { title: 'Source', key: 'source' },
  { title: 'Destination', key: 'destination' },
  { title: 'Schedule', key: 'schedule' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const jobs = ref([
  { name: 'Salesforce Lead Sync', source: 'Salesforce CRM', destination: 'Contact List (Salesforce Leads)', schedule: 'Every 1 Hour', status: 'Active' },
  { name: 'Shopify Orders Import', source: 'Shopify', destination: 'Commerce Orders', schedule: 'Real-time', status: 'Active' },
  { name: 'Nightly Data Warehouse Export', source: 'All Contacts', destination: 'Amazon S3 Bucket', schedule: 'Daily @ 2:00 AM', status: 'Active' },
])

const filters = ref({
  status: [] as string[],
})

const filterLabels: Record<string, string> = {
  status: 'Status',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => Array.isArray(v) ? v.length > 0 : v !== null)
    .map(([key, value]) => ({
      key,
      label: `${filterLabels[key]}: ${Array.isArray(value) ? value.join(', ') : value}`
    }))
)

function removeFilter(key: string) {
  const val = filters.value[key as keyof typeof filters.value]
  ;(filters.value as any)[key] = Array.isArray(val) ? [] : null
}

function clearAllFilters() {
  Object.keys(filters.value).forEach(key => {
    ;(filters.value as any)[key] = []
  })
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Data Journeys"
      :subtitle="`${jobs.length} data sync automations`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Data Journey</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Data Sync Automation"
        search-placeholder="Search jobs..."
        :active-filters="activeFilterEntries"
        :total-count="jobs.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.status"
              label="Status"
              :items="['Active', 'Paused', 'Error']"
              multiple
              chips
              closable-chips
              clearable
              variant="outlined"
              density="compact"
              hide-details
              class="mb-3"
            />
          </div>
        </template>
      </MpDataTableToolbar>

      <v-data-table :headers="headers" :items="jobs" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'Active' ? 'success' : 'warning'" size="small">{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="xl" nav min-width="160" elevation="8">
              <v-list-item prepend-icon="pencil">Edit</v-list-item>
              <v-list-item prepend-icon="circle-play">Run Now</v-list-item>
              <v-list-item prepend-icon="trash-2" class="text-error">Delete</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
