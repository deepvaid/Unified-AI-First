<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MbPageHeader } from '@marobase/ui'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import CreateDashboardDialog from '@/components/dashboards/CreateDashboardDialog.vue'
import EditDashboardDialog from '@/components/dashboards/EditDashboardDialog.vue'
import { accentToVuetifyColor, relativeTime } from '@/components/dashboards/dashboardOptions'
import type { Dashboard } from '@/stores/dashboards/types'
import { useAccountsStore } from '@/stores/useAccounts'
import { useDashboardsStore } from '@/stores/useDashboards'

type DashboardTableItem = Dashboard & {
  widgetCount: number
}

const headers = [
  { title: 'Dashboard', key: 'name', sortable: true, minWidth: '320px' },
  { title: 'Type', key: 'kind', sortable: true, width: '120px' },
  { title: 'Widgets', key: 'widgetCount', align: 'end' as const, sortable: true, width: '120px' },
  { title: 'Updated', key: 'updatedAt', sortable: true, width: '140px' },
  { title: 'Last Viewed', key: 'lastViewedAt', sortable: true, width: '150px' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false, width: '132px' },
]

const route = useRoute()
const router = useRouter()
const accountsStore = useAccountsStore()
const dashboardsStore = useDashboardsStore()

const accountId = computed(() => {
  const value = Array.isArray(route.params.accountId)
    ? route.params.accountId[0]
    : route.params.accountId
  return value ?? accountsStore.activeId
})

watch(
  accountId,
  (next) => {
    if (next !== accountsStore.activeId) {
      accountsStore.switchTo(next)
    }
    dashboardsStore.ensureAccountDashboards(next)
  },
  { immediate: true },
)

const account = computed(() => accountsStore.accounts.find((entry) => entry.id === accountId.value))
const dashboards = computed(() => dashboardsStore.getDashboardsForAccount(accountId.value))

const search = ref('')
const selectedIds = ref<string[]>([])
const hiddenColumns = ref<string[]>([])

const createDialogOpen = ref(false)
const editingDashboard = ref<Dashboard | null>(null)
const editDialogOpen = ref(false)
const confirmAction = ref<{
  title: string
  body: string
  confirmLabel: string
  destructive?: boolean
  perform: () => void
} | null>(null)

const visibleHeaders = computed(() =>
  headers.filter((header) => !hiddenColumns.value.includes(header.key)),
)

const dashboardRows = computed<DashboardTableItem[]>(() =>
  dashboards.value.map((dashboard) => ({
    ...dashboard,
    widgetCount: dashboard.widgets.length,
  })),
)

const filteredDashboards = computed(() => {
  const query = search.value.trim().toLowerCase()
  const rows = query
    ? dashboardRows.value.filter((dashboard) => (
      dashboard.name.toLowerCase().includes(query)
      || (dashboard.description ?? '').toLowerCase().includes(query)
    ))
    : [...dashboardRows.value]

  rows.sort((a, b) => {
    const left = a.lastViewedAt ?? a.updatedAt
    const right = b.lastViewedAt ?? b.updatedAt
    return new Date(right).getTime() - new Date(left).getTime()
  })

  return rows
})

const totalCount = computed(() => filteredDashboards.value.length)

watch(search, () => {
  const visibleIds = new Set(filteredDashboards.value.map((dashboard) => dashboard.id))
  selectedIds.value = selectedIds.value.filter((id) => visibleIds.has(id))
})

function selectAll() {
  selectedIds.value = filteredDashboards.value.map((dashboard) => dashboard.id)
}

function handleDashboardRowClick(event: MouseEvent, payload: { item: DashboardTableItem }) {
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, input, [role="button"], .v-selection-control, .v-overlay')) {
    return
  }

  openDashboard(payload.item.id)
}

const selectedSet = computed(() => new Set(selectedIds.value))
const selectedDashboards = computed(() =>
  dashboards.value.filter((dashboard) => selectedSet.value.has(dashboard.id)),
)
const hasSelection = computed(() => selectedIds.value.length > 0)
const selectedHasCustom = computed(() => selectedDashboards.value.some((dashboard) => dashboard.kind === 'custom'))
const selectedAllFavorited = computed(() => selectedDashboards.value.length > 0 && selectedDashboards.value.every((dashboard) => dashboard.favorite))

function dashboardRoute(dashboard: Dashboard) {
  if (dashboard.isDefault) {
    return { name: 'Dashboard' as const, params: { accountId: dashboard.accountId } }
  }
  return { name: 'DashboardDetail' as const, params: { accountId: dashboard.accountId, dashboardId: dashboard.id } }
}

function openDashboard(dashboardId: string) {
  const dashboard = dashboards.value.find((entry) => entry.id === dashboardId)
  if (!dashboard) return
  router.push(dashboardRoute(dashboard))
}

function clearSelection() {
  selectedIds.value = []
}

function clearFilters() {
  search.value = ''
}

function openEdit(dashboardId: string) {
  const dashboard = dashboards.value.find((entry) => entry.id === dashboardId)
  if (!dashboard) return
  editingDashboard.value = dashboard
  editDialogOpen.value = true
}

function handleDuplicate(dashboardId: string) {
  dashboardsStore.duplicateDashboard(accountId.value, dashboardId)
}

function handleSetDefault(dashboardId: string) {
  dashboardsStore.setDefaultDashboard(accountId.value, dashboardId)
}

function handleToggleFavorite(dashboardId: string) {
  dashboardsStore.toggleFavorite(accountId.value, dashboardId)
}

function handleDelete(dashboardId: string) {
  const dashboard = dashboards.value.find((entry) => entry.id === dashboardId)
  if (!dashboard) return
  confirmAction.value = {
    title: `Delete “${dashboard.name}”?`,
    body: 'This dashboard and all of its widgets will be permanently removed for this account.',
    confirmLabel: 'Delete dashboard',
    destructive: true,
    perform: () => {
      dashboardsStore.deleteDashboard(accountId.value, dashboardId)
      selectedIds.value = selectedIds.value.filter((id) => id !== dashboardId)
    },
  }
}

function handleReset(dashboardId: string) {
  const dashboard = dashboards.value.find((entry) => entry.id === dashboardId)
  if (!dashboard) return
  confirmAction.value = {
    title: `Reset “${dashboard.name}” to defaults?`,
    body: 'Widget layout and any customizations will be reverted to the original system template.',
    confirmLabel: 'Reset dashboard',
    perform: () => dashboardsStore.resetSystemDashboard(accountId.value, dashboardId),
  }
}

function bulkDuplicate() {
  if (!hasSelection.value) return
  dashboardsStore.bulkDuplicate(accountId.value, selectedIds.value)
  clearSelection()
}

function bulkFavorite() {
  if (!hasSelection.value) return
  const target = !selectedAllFavorited.value
  selectedIds.value.forEach((id) => {
    const dashboard = dashboards.value.find((entry) => entry.id === id)
    if (!dashboard) return
    if (Boolean(dashboard.favorite) !== target) {
      dashboardsStore.toggleFavorite(accountId.value, id)
    }
  })
}

function bulkDelete() {
  if (!hasSelection.value) return
  const customSelection = selectedDashboards.value.filter((dashboard) => dashboard.kind === 'custom')
  if (!customSelection.length) return
  confirmAction.value = {
    title: `Delete ${customSelection.length} dashboard${customSelection.length === 1 ? '' : 's'}?`,
    body: 'Only custom dashboards in your selection will be deleted. System dashboards stay intact.',
    confirmLabel: 'Delete dashboards',
    destructive: true,
    perform: () => {
      dashboardsStore.bulkDelete(accountId.value, customSelection.map((dashboard) => dashboard.id))
      clearSelection()
    },
  }
}

function backToActiveDashboard() {
  const target = dashboardsStore.getDefaultDashboard(accountId.value)
  if (!target) {
    router.push({ name: 'Dashboard', params: { accountId: accountId.value } })
    return
  }
  router.push(dashboardRoute(target))
}

function performConfirm() {
  if (!confirmAction.value) return
  confirmAction.value.perform()
  confirmAction.value = null
}

function handleDashboardCreated(dashboardId: string) {
  selectedIds.value = []
  search.value = ''
  const dashboard = dashboards.value.find((entry) => entry.id === dashboardId)
  if (dashboard) router.push(dashboardRoute(dashboard))
}
</script>

<template>
  <div class="dashboards-list">
    <div class="dashboards-list__back-row">
      <v-btn
        variant="text"
        size="small"
        prepend-icon="arrow-left"
        class="text-none px-2"
        @click="backToActiveDashboard"
      >
        Back to active dashboard
      </v-btn>
    </div>

    <MbPageHeader
      :title="`Dashboards`"
      :subtitle="`Browse, organize, and personalize every dashboard for ${account?.name ?? 'this workspace'}.`"
      size="md"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="plus"
          class="text-none"
          @click="createDialogOpen = true"
        >
          New Dashboard
        </v-btn>
      </template>
    </MbPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        title="All Dashboards"
        search-placeholder="Search dashboards"
        :headers="headers"
        :selected-count="selectedIds.length"
        :total-count="totalCount"
        @clear-selection="clearSelection"
        @select-all="selectAll"
      >
        <template #bulk-actions>
          <v-btn
            variant="outlined"
            size="small"
            class="text-none"
            rounded="lg"
            :prepend-icon="selectedAllFavorited ? 'star-off' : 'star'"
            @click="bulkFavorite"
          >
            {{ selectedAllFavorited ? 'Unfavorite' : 'Favorite' }}
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            class="text-none"
            rounded="lg"
            prepend-icon="copy"
            @click="bulkDuplicate"
          >
            Duplicate
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            color="error"
            class="text-none"
            rounded="lg"
            prepend-icon="trash-2"
            :disabled="!selectedHasCustom"
            @click="bulkDelete"
          >
            Delete
          </v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selectedIds"
        :headers="visibleHeaders"
        :items="filteredDashboards"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1 dashboards-table"
        @click:row="handleDashboardRowClick"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3 py-2 min-width-0">
            <v-avatar size="36" variant="tonal" :color="accentToVuetifyColor(item.accent)" class="flex-shrink-0">
              <v-icon size="18">{{ item.icon ?? 'layout-dashboard' }}</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <div class="d-flex align-center ga-2 min-width-0">
                <button
                  type="button"
                  class="dashboard-link"
                  :aria-label="`Open ${item.name}`"
                  @click.stop="openDashboard(item.id)"
                >
                  {{ item.name }}
                </button>
                <v-icon
                  v-if="item.favorite"
                  size="14"
                  color="warning"
                  aria-label="Favorite"
                  class="flex-shrink-0"
                >
                  star
                </v-icon>
                <v-chip v-if="item.isDefault" size="x-small" variant="tonal" color="success" class="flex-shrink-0">
                  Default
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis dashboard-description">
                {{ item.description || 'No description' }}
              </div>
            </div>
          </div>
        </template>

        <template #item.kind="{ item }">
          <v-chip
            size="x-small"
            variant="tonal"
            :color="item.kind === 'system' ? 'secondary' : 'primary'"
          >
            {{ item.kind === 'system' ? 'System' : 'Custom' }}
          </v-chip>
        </template>

        <template #item.widgetCount="{ item }">
          <span class="text-body-2">{{ item.widgetCount }}</span>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2">{{ relativeTime(item.updatedAt) }}</span>
        </template>

        <template #item.lastViewedAt="{ item }">
          <span class="text-body-2">{{ relativeTime(item.lastViewedAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-end ga-1" @click.stop>
            <v-tooltip
              :text="item.isDefault ? 'Currently default' : 'Set as default'"
              location="top"
            >
              <template #activator="{ props: tipProps }">
                <v-btn
                  v-bind="tipProps"
                  :icon="item.isDefault ? 'bookmark-check' : 'bookmark'"
                  :color="item.isDefault ? 'success' : undefined"
                  variant="text"
                  size="small"
                  density="comfortable"
                  :disabled="item.isDefault"
                  :aria-label="item.isDefault ? `${item.name} is the default dashboard` : `Set ${item.name} as default`"
                  @click="handleSetDefault(item.id)"
                />
              </template>
            </v-tooltip>
            <v-btn
              :icon="item.favorite ? 'star' : 'star'"
              :color="item.favorite ? 'warning' : undefined"
              variant="text"
              size="small"
              density="comfortable"
              :aria-label="item.favorite ? `Unfavorite ${item.name}` : `Favorite ${item.name}`"
              @click="handleToggleFavorite(item.id)"
            />
            <v-menu location="bottom end">
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  icon="more-vertical"
                  variant="text"
                  size="small"
                  density="comfortable"
                  :aria-label="`More actions for ${item.name}`"
                />
              </template>
              <v-list density="compact" min-width="200" rounded="lg" elevation="3" class="py-1">
                <v-list-item prepend-icon="arrow-up-right" title="Open" @click="openDashboard(item.id)" />
                <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item.id)" />
                <v-list-item prepend-icon="copy" title="Duplicate" @click="handleDuplicate(item.id)" />
                <v-list-item
                  v-if="!item.isDefault"
                  prepend-icon="bookmark-check"
                  title="Set as default"
                  @click="handleSetDefault(item.id)"
                />
                <v-list-item
                  v-if="item.kind === 'system'"
                  prepend-icon="rotate-ccw"
                  title="Reset to defaults"
                  @click="handleReset(item.id)"
                />
                <v-divider v-if="item.kind === 'custom'" class="my-1" style="opacity: 0.4" />
                <v-list-item
                  v-if="item.kind === 'custom'"
                  prepend-icon="trash-2"
                  title="Delete"
                  class="text-error"
                  @click="handleDelete(item.id)"
                />
              </v-list>
            </v-menu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            :icon="search ? 'list-x' : 'grid-2x2-plus'"
            :title="search ? 'No dashboards match your search' : 'No dashboards yet'"
            :description="search ? 'Try a different search term.' : 'Create the first custom dashboard for this workspace to get started.'"
            :action-label="search ? 'Clear search' : 'Create dashboard'"
            :action-icon="search ? 'x' : 'plus'"
            @action="search ? clearFilters() : (createDialogOpen = true)"
          />
        </template>
      </v-data-table>
    </v-card>

    <CreateDashboardDialog
      v-model="createDialogOpen"
      :account-id="accountId"
      @created="handleDashboardCreated"
    />

    <EditDashboardDialog
      v-model="editDialogOpen"
      :account-id="accountId"
      :dashboard="editingDashboard"
    />

    <v-dialog :model-value="!!confirmAction" max-width="440" persistent @update:model-value="confirmAction = null">
      <v-card v-if="confirmAction" rounded="lg">
        <v-card-title class="pa-5 text-h6 font-weight-bold">{{ confirmAction.title }}</v-card-title>
        <v-card-text class="pb-2 text-body-2 text-medium-emphasis">{{ confirmAction.body }}</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="confirmAction = null">Cancel</v-btn>
          <v-btn
            :color="confirmAction.destructive ? 'error' : 'primary'"
            variant="flat"
            class="text-none"
            @click="performConfirm"
          >
            {{ confirmAction.confirmLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
.dashboards-list {
  display: flex;
  flex-direction: column;
}

.dashboards-list__back-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.dashboards-table {
  background: transparent;
}

.dashboards-table :deep(tbody tr) {
  cursor: pointer;
}

.dashboard-link {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  max-width: 28ch;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-link:hover {
  color: rgb(var(--v-theme-primary));
}

.dashboard-link:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.2);
}

.dashboard-description {
  max-width: 48ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
