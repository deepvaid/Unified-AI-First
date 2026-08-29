<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useRouter, useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusToggle from '@/components/MpStatusToggle.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { formatCurrency } from '@/utils/formatCurrency'
import { useToast } from '@/composables/useToast'

const store = useCampaignsStore()
const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(s: string) {
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return s
  return `${MONTHS[+m - 1]} ${+d}, ${y}`
}

const kpis = computed(() => {
  const j = store.journeys
  return [
    { label: 'Active journeys', value: j.filter(x => x.status === 'Active').length, icon: 'git-branch', color: 'primary' },
    { label: 'Total enrolled', value: j.reduce((a, x) => a + x.enrolled, 0).toLocaleString(), icon: 'users', color: 'info' },
    { label: 'Completed', value: j.reduce((a, x) => a + x.completed, 0).toLocaleString(), icon: 'circle-check', color: 'success' },
    { label: 'Attributed revenue', value: formatCurrency(j.reduce((a, x) => a + x.revenue, 0)), icon: 'dollar-sign', color: 'success' },
  ]
})

function openBuilder(id: number) {
  router.push({ name: 'JourneyBuilder', params: { accountId: accountId.value, id: String(id) } })
}

function openCreateWizard() {
  router.push({ name: 'CreateJourney', params: { accountId: accountId.value } })
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
  { title: 'Steps', key: 'items', align: 'end' as const, sortable: true, width: 90 },
  { title: 'Created', key: 'created', sortable: true },
  { title: '', key: 'actions', sortable: false, width: 72 },
]

/** Node count in a journey's flow — mirrors the legacy list's "Items" column. */
function itemsCount(id: number) {
  return store.journeyFlows[id]?.length ?? 0
}

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

const toast = useToast()

function duplicateJourney(journey: typeof store.journeys[0]) {
  store.duplicateJourney(journey.id)
  toast.info(`Duplicated "${journey.name}"`)
}

function viewAnalytics() {
  router.push({ name: 'JourneyReports', params: { accountId: accountId.value } })
}

const deleteDialogOpen = ref(false)
const deleteTarget = ref<typeof store.journeys[0] | null>(null)

function requestDelete(journey: typeof store.journeys[0]) {
  if (journey.status === 'Active') {
    toast.info(`Pause "${journey.name}" before deleting.`)
    return
  }
  deleteTarget.value = journey
  deleteDialogOpen.value = true
}

function confirmDelete() {
  if (deleteTarget.value) store.deleteJourney(deleteTarget.value.id)
  deleteDialogOpen.value = false
  deleteTarget.value = null
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
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreateWizard()">New Journey</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabsWithCounts" aria-label="Filter journeys by status" />
      </template>
    </MpPageHeader>

    <!-- KPI row -->
    <v-row dense>
      <v-col v-for="k in kpis" :key="k.label" cols="12" sm="6" md="3">
        <MpKpiCard :label="k.label" :value="k.value" :icon="k.icon" :color="k.color" />
      </v-col>
    </v-row>

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
          <MpStatusToggle :status="item.status" @toggle="toggleStatus(item)" />
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
            {{ item.revenue > 0 ? formatCurrency(item.revenue) : '—' }}
          </span>
        </template>

        <!-- Items (node count) -->
        <template v-slot:item.items="{ item }">
          <span class="text-medium-emphasis">{{ itemsCount(item.id) }}</span>
        </template>

        <!-- Created date -->
        <template v-slot:item.created="{ item }">
          <span class="text-medium-emphasis text-body-2 created-cell">{{ fmtDate(item.created) }}</span>
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
                  class="text-medium-emphasis"
                  aria-label="Edit in builder"
                  @click="openBuilder(item.id)"
                ></v-btn>
              </template>
            </v-tooltip>
            <MpRowActionsMenu ariaLabel="Journey actions" :itemLabel="item.name">
              <v-list-item role="menuitem" prepend-icon="bar-chart-2" title="View analytics" value="analytics" @click="viewAnalytics()"></v-list-item>
              <v-list-item role="menuitem" prepend-icon="copy" title="Duplicate" value="duplicate" @click="duplicateJourney(item)"></v-list-item>
              <v-list-item
                role="menuitem"
                :prepend-icon="item.status === 'Active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'Active' ? 'Pause journey' : 'Activate journey'"
                value="toggle"
                @click="toggleStatus(item)"
              ></v-list-item>
              <v-divider class="my-1" />
              <v-list-item role="menuitem" prepend-icon="trash-2" title="Delete" value="delete" class="text-error" @click="requestDelete(item)"></v-list-item>
            </MpRowActionsMenu>
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
            @action="openCreateWizard()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialogOpen"
      danger
      title="Delete this journey?"
      :message="`&quot;${deleteTarget?.name}&quot; and its flow will be permanently deleted. This can't be undone.`"
      confirm-label="Delete journey"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.text-primary-hover:hover { color: rgb(var(--v-theme-primary)) !important; }
.created-cell { white-space: nowrap; }
</style>
