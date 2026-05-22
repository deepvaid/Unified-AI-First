<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useRouter, useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useCampaignsStore()
const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

function openBuilder(id: number) {
  router.push({ name: 'JourneyBuilder', params: { accountId: accountId.value, id: String(id) } })
}
const search = ref('')
const activeTab = ref('all')

// Mirror the real Maropost journeys table structure
const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status', sortable: false, width: 120 },
  { title: 'Trigger', key: 'trigger' },
  { title: 'Enrolled', key: 'enrolled', align: 'end' as const, sortable: true },
  { title: 'Completed', key: 'completed', align: 'end' as const, sortable: true },
  { title: 'Revenue', key: 'revenue', align: 'end' as const, sortable: true },
  { title: 'Created', key: 'created', sortable: true },
  { title: '', key: 'actions', sortable: false, width: 72 },
]

const tabs = [
  { label: 'All', key: 'all' },
  { label: 'Active', key: 'active' },
  { label: 'Paused', key: 'paused' },
  { label: 'Draft', key: 'draft' },
]

const tabsWithCounts = computed(() =>
  tabs.map(t => ({ ...t, count: tabCount(t.key) }))
)

const filteredJourneys = computed(() => {
  const journeys = store.journeys
  if (activeTab.value === 'all') return journeys
  return journeys.filter(j => j.status.toLowerCase() === activeTab.value)
})

const tabCount = (key: string) => {
  if (key === 'all') return store.journeys.length
  return store.journeys.filter(j => j.status.toLowerCase() === key).length
}

// Toggle journey status between Active and Paused
function toggleStatus(journey: typeof store.journeys[0]) {
  journey.status = journey.status === 'Active' ? 'Paused' : 'Active'
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <!-- Page Header -->
    <MpPageHeader
      title="Automation Journeys"
      :subtitle="`${store.journeys.filter(j => j.status === 'Active').length} active · ${store.journeys.reduce((a, j) => a + j.enrolled, 0).toLocaleString()} total enrolled`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openBuilder(0)">New Journey</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabsWithCounts" aria-label="Filter journeys by status" />
      </template>
    </MpPageHeader>

    <!-- Main Table Card -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Journeys"
        search-placeholder="Search journeys..."
        :total-count="filteredJourneys.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredJourneys"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <!-- Journey name — bold, clickable -->
        <template v-slot:item.name="{ item }">
          <div
            class="font-weight-medium text-body-2 cursor-pointer text-primary-hover"
            style="max-width: 320px;"
            @click="openBuilder(item.id)"
          >
            {{ item.name }}
          </div>
        </template>

        <!-- Status — inline v-switch (matches real Maropost UX) -->
        <template v-slot:item.status="{ item }">
          <div class="d-flex align-center gap-2">
            <v-switch
              :model-value="item.status === 'Active'"
              color="success"
              density="compact"
              hide-details
              :disabled="item.status === 'Draft'"
              @update:model-value="toggleStatus(item)"
            ></v-switch>
            <span
              class="text-caption font-weight-medium"
              :class="item.status === 'Active' ? 'text-success' : item.status === 'Paused' ? 'text-warning' : 'text-medium-emphasis'"
            >{{ item.status }}</span>
          </div>
        </template>

        <!-- Trigger -->
        <template v-slot:item.trigger="{ item }">
          <v-chip size="x-small" variant="tonal" color="secondary" class="font-weight-medium">
            {{ item.trigger }}
          </v-chip>
        </template>

        <!-- Enrolled -->
        <template v-slot:item.enrolled="{ item }">
          <span class="font-weight-medium">{{ item.enrolled.toLocaleString() }}</span>
        </template>

        <!-- Completed -->
        <template v-slot:item.completed="{ item }">
          <span class="font-weight-medium">{{ item.completed.toLocaleString() }}</span>
        </template>

        <!-- Revenue -->
        <template v-slot:item.revenue="{ item }">
          <span :class="item.revenue > 0 ? 'text-success font-weight-bold' : 'text-medium-emphasis'">
            {{ item.revenue > 0 ? `$${item.revenue.toLocaleString()}` : '—' }}
          </span>
        </template>

        <!-- Created date -->
        <template v-slot:item.created="{ item }">
          <span class="text-medium-emphasis text-body-2">{{ item.created }}</span>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <div class="action-btns d-flex align-center">
            <v-tooltip text="Edit in builder" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="pencil"
                  variant="text"
                  size="x-small"
                  color="medium-emphasis"
                  @click="openBuilder(item.id)"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="more-vertical" variant="text" size="x-small" color="medium-emphasis"></v-btn>
              </template>
              <v-list density="compact" min-width="180">
                <v-list-item prepend-icon="bar-chart-2" title="View analytics" value="analytics"></v-list-item>
                <v-list-item prepend-icon="copy" title="Duplicate" value="duplicate"></v-list-item>
                <v-list-item
                  :prepend-icon="item.status === 'Active' ? 'circle-pause' : 'circle-play'"
                  :title="item.status === 'Active' ? 'Pause journey' : 'Activate journey'"
                  value="toggle"
                  @click="toggleStatus(item)"
                ></v-list-item>
                <v-divider></v-divider>
                <v-list-item prepend-icon="trash-2" title="Delete" value="delete" class="text-error"></v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>

        <!-- Empty state -->
        <template v-slot:no-data>
          <MpEmptyState
            icon="git-branch"
            :title="search ? 'No journeys match your search' : 'No journeys yet'"
            :description="search ? 'Try adjusting your search terms.' : 'Create your first automation journey to engage customers at the right moment.'"
            :action-label="!search ? 'New Journey' : undefined"
            action-icon="plus"
            @action="openBuilder(0)"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.text-primary-hover:hover { color: rgb(var(--v-theme-primary)) !important; }
</style>
