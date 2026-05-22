<script setup lang="ts">
import { ref, computed } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Page Name', key: 'name', sortable: true },
  { title: 'Domain', key: 'domain' },
  { title: 'Total Visits', key: 'visits', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const items = ref([
  { name: 'Spring Promo Landing Page', domain: 'promo.example.com', visits: 12500, status: 'Published' },
  { name: 'Webinar Registration', domain: 'events.example.com', visits: 850, status: 'Published' },
  { name: 'Black Friday 2026 Early', domain: 'bf.example.com', visits: 0, status: 'Draft' },
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
      title="Landing Pages"
      :subtitle="`${items.length} pages`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Page</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Pages"
        search-placeholder="Search pages..."
        :active-filters="activeFilterEntries"
        :total-count="items.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.status"
              label="Status"
              :items="['Published', 'Draft']"
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

      <v-data-table :headers="headers" :items="items" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'Published' ? 'success' : 'default'" size="small">{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.visits="{ item }">
          <span class="font-weight-medium">{{ item.visits.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="xl" nav min-width="160" elevation="8">
              <v-list-item prepend-icon="pencil">Edit</v-list-item>
              <v-list-item prepend-icon="copy">Duplicate</v-list-item>
              <v-list-item prepend-icon="external-link">Preview</v-list-item>
              <v-list-item prepend-icon="trash-2" class="text-error">Delete</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
