<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useToast } from '@/composables/useToast'
import {
  CATEGORY_OPTIONS,
  OWNER_OPTIONS,
  RECORD_HEADERS,
  STATUS_OPTIONS,
  makeRecords,
  type PlaceholderRecord,
  type PlaceholderStatus,
} from './placeholder'

// LIST PAGE TEMPLATE — the composition every data-table view follows.
// Copied from src/views/Commerce/SalesOrders.vue with the domain removed.

const toast = useToast()
const { loading } = useInitialLoad()

const records = ref<PlaceholderRecord[]>(makeRecords(24))

/* ── Tabs ──────────────────────────────────────────────────────────
   A tab is a saved cut of the same list, not a different page. */
const activeTab = ref('all')
const tabs = computed(() => [
  { label: 'All', key: 'all', count: records.value.length },
  ...STATUS_OPTIONS.map((status) => ({
    label: status,
    key: status.toLowerCase(),
    count: records.value.filter((r) => r.status === status).length,
  })),
])

/* ── Filters ───────────────────────────────────────────────────────
   Category is promoted to a toolbar pill; the long tail stays in the drawer. */
const search = ref('')
const categoryFilter = ref<string[]>([])
const categoryQuickFilter = {
  key: 'category',
  label: 'Category',
  options: CATEGORY_OPTIONS.map((v) => ({ label: v, value: v })),
}

const filters = ref({
  status: null as PlaceholderStatus | null,
  owner: null as string | null,
})
const filterLabels: Record<string, string> = {
  category: 'Category',
  status: 'Status',
  owner: 'Owner',
}

const activeFilterEntries = computed(() => {
  const entries = Object.entries(filters.value)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
  if (categoryFilter.value.length) {
    entries.unshift({ key: 'category', label: `Category: ${categoryFilter.value.join(', ')}` })
  }
  return entries
})

function removeFilter(key: string) {
  if (key === 'category') {
    categoryFilter.value = []
    return
  }
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  categoryFilter.value = []
  filters.value = { status: null, owner: null }
}

const filteredRecords = computed(() => {
  let rows = records.value
  if (activeTab.value !== 'all') {
    rows = rows.filter((r) => r.status.toLowerCase() === activeTab.value)
  }
  if (categoryFilter.value.length) {
    rows = rows.filter((r) => categoryFilter.value.includes(r.category))
  }
  if (filters.value.status) rows = rows.filter((r) => r.status === filters.value.status)
  if (filters.value.owner) rows = rows.filter((r) => r.owner === filters.value.owner)
  return rows
})

/* ── Columns ───────────────────────────────────────────────────────
   The toolbar's column menu gets every header; the table gets the subset
   that survives the viewport and the user's own hide choices. */
// Seeded with the columns that are off by default — the same move SalesOrders
// makes. They stay in the toolbar's column menu so a user can switch them on.
const hiddenColumns = ref<string[]>(['owner'])
const { visibleHeaders } = useResponsiveTableHeaders(RECORD_HEADERS, hiddenColumns)

/* ── Selection and row actions ─────────────────────────────────────*/
const selected = ref<number[]>([])
function selectAll() {
  selected.value = filteredRecords.value.map((r) => r.id)
}

const confirmDelete = ref(false)
const deleteTarget = ref<PlaceholderRecord | null>(null)

function askDelete(record: PlaceholderRecord | null) {
  deleteTarget.value = record
  confirmDelete.value = true
}

const deleteMessage = computed(() =>
  deleteTarget.value
    ? `${deleteTarget.value.name} will be removed. This cannot be undone.`
    : `${selected.value.length} selected record${selected.value.length === 1 ? '' : 's'} will be removed. This cannot be undone.`,
)

// MpConfirmDialog closes itself — this handler only touches data.
function performDelete() {
  const ids = deleteTarget.value ? [deleteTarget.value.id] : selected.value
  records.value = records.value.filter((r) => !ids.includes(r.id))
  selected.value = selected.value.filter((id) => !ids.includes(id))
  toast.success(`${ids.length} record${ids.length === 1 ? '' : 's'} removed`)
  deleteTarget.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Section · Records"
      title="Records"
      :subtitle="`${records.length} records total`"
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="download" class="text-none" @click="toast.info('Secondary action')">
          Secondary action
        </v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="{ name: 'TemplateFormDrawer' }">
          Create record
        </v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Filter records by status" />
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        v-model:quick-filter-value="categoryFilter"
        :quick-filter="categoryQuickFilter"
        :headers="RECORD_HEADERS"
        :active-filters="activeFilterEntries"
        :total-count="filteredRecords.length"
        search-placeholder="Search records"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #actions>
          <v-btn variant="text" prepend-icon="upload" class="text-none" @click="toast.info('Toolbar action')">
            Import
          </v-btn>
        </template>
        <template #filter-content>
          <!-- A dense popover, not a form: no select here carries validation, so
               hide-details is deliberate. -->
          <MpFormGrid>
            <v-select
              v-model="filters.status"
              label="Status"
              :items="STATUS_OPTIONS"
              placeholder="All"
              hide-details
              clearable
            />
            <v-select
              v-model="filters.owner"
              label="Owner"
              :items="OWNER_OPTIONS"
              placeholder="All"
              hide-details
              clearable
            />
          </MpFormGrid>
        </template>
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        :key="activeTab"
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredRecords"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="10"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.name="{ item }">
          <router-link :to="{ name: 'TemplateDetail' }" class="tpl-link">{{ item.name }}</router-link>
        </template>

        <template #item.category="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.category }}</span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>

        <template #item.amount="{ item }">
          <span class="text-no-wrap font-weight-medium">{{ item.amount }}</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Record actions" :itemLabel="item.name">
              <MpMenuItem title="View" icon="eye" :to="{ name: 'TemplateDetail' }" />
              <MpMenuItem title="Duplicate" icon="copy" @click="toast.info(`${item.name} duplicated`)" />
              <v-divider class="my-1" />
              <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete(item)" />
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search || activeFilterEntries.length || activeTab !== 'all'"
            icon="search"
            title="No records match your search"
            description="Adjust the search or filters to see more."
          />
          <MpEmptyState
            v-else
            emphasis="prominent"
            illustration="empty-generic"
            title="No records yet"
            description="Records appear here once the first one is created."
            action-label="Create record"
            action-icon="plus"
            @action="toast.info('Create record')"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredRecords.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn size="small" variant="flat" color="surface" rounded="lg" prepend-icon="check" class="text-none" @click="toast.success('Bulk action applied')">
        Bulk action
      </v-btn>
      <v-btn size="small" variant="flat" color="surface" rounded="lg" prepend-icon="trash-2" class="text-none text-error" @click="askDelete(null)">
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete record?"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="performDelete"
    />
  </div>
</template>

<style scoped>
.tpl-link {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-decoration: none;
}

.tpl-link:hover {
  text-decoration: underline;
}
</style>
