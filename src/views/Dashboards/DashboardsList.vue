<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import DashboardFormDialog from '@/components/dashboards/DashboardFormDialog.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { accentToVuetifyColor, relativeTime } from '@/components/dashboards/dashboardOptions'
import type { Dashboard } from '@/stores/dashboards/types'
import { useAccountsStore } from '@/stores/useAccounts'
import { useDashboardsStore } from '@/stores/useDashboards'

type DashboardTableItem = Dashboard & {
  widgetCount: number
}

const headers = [
  { title: 'Dashboard', key: 'name', sortable: true },
  { title: 'Type', key: 'kind', sortable: true, width: '120px', hideBelow: 'sm' as const },
  { title: 'Widgets', key: 'widgetCount', align: 'end' as const, sortable: true, width: '120px', hideBelow: 'lg' as const },
  { title: 'Updated', key: 'updatedAt', sortable: true, width: '140px', hideBelow: 'md' as const },
  { title: 'Last Viewed', key: 'lastViewedAt', sortable: true, width: '150px', hideBelow: 'lg' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
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

const { loading } = useInitialLoad()
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

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

const backTarget = computed(() => {
  const target = dashboardsStore.getDefaultDashboard(accountId.value)
  return target
    ? dashboardRoute(target)
    : { name: 'Dashboard' as const, params: { accountId: accountId.value } }
})

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
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Dashboards"
      :subtitle="`${dashboards.length} dashboards · ${dashboards.filter(d => d.kind === 'custom').length} custom · ${account?.name ?? 'this workspace'}`"
      :back-to="backTarget"
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
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        search-placeholder="Search dashboards"
        :headers="headers"
        :total-count="totalCount"
      >
      </MpDataTableToolbar>

      <MpTableSkeleton v-if="loading" :rows="7" :columns="5" />

      <v-data-table
        v-else
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
              <div class="d-flex align-center ga-2 min-width-0 dashboard-title-row">
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
                  size="16"
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
          <span class="text-body-2 text-medium-emphasis">{{ item.kind === 'system' ? 'System' : 'Custom' }}</span>
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
          <div class="d-flex align-center justify-end" @click.stop>
            <MpRowActionsMenu ariaLabel="Dashboard actions" :itemLabel="item.name">
              <MpMenuItem icon="arrow-up-right" title="Open" @click="openDashboard(item.id)" />
              <MpMenuItem icon="pencil" title="Edit details" @click="openEdit(item.id)" />
              <MpMenuItem icon="copy" title="Duplicate" @click="handleDuplicate(item.id)" />
              <MpMenuItem
                :icon="item.favorite ? 'star-off' : 'star'"
                :title="item.favorite ? 'Unfavorite' : 'Favorite'"
                @click="handleToggleFavorite(item.id)"
              />
              <MpMenuItem
                v-if="!item.isDefault"
                icon="bookmark-check"
                title="Set as default"
                @click="handleSetDefault(item.id)"
              />
              <MpMenuItem
                v-if="item.kind === 'system'"
                icon="rotate-ccw"
                title="Reset to defaults"
                @click="handleReset(item.id)"
              />
              <v-divider v-if="item.kind === 'custom'" class="my-1" />
              <MpMenuItem
                v-if="item.kind === 'custom'"
                icon="trash-2"
                title="Delete"
                danger
                @click="handleDelete(item.id)"
              />
            </MpRowActionsMenu>
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

    <MpFloatingBulkBar
      :count="selectedIds.length"
      :total="totalCount"
      @clear="clearSelection"
      @select-all="selectAll"
    >
      <v-btn
        variant="flat"
        color="surface"
        size="small"
        class="text-none"
        rounded="lg"
        :prepend-icon="selectedAllFavorited ? 'star-off' : 'star'"
        @click="bulkFavorite"
      >
        {{ selectedAllFavorited ? 'Unfavorite' : 'Favorite' }}
      </v-btn>
      <v-btn
        variant="flat"
        color="surface"
        size="small"
        class="text-none"
        rounded="lg"
        prepend-icon="copy"
        @click="bulkDuplicate"
      >
        Duplicate
      </v-btn>
      <v-btn
        variant="flat"
        color="surface"
        size="small"
        class="text-none text-error"
        rounded="lg"
        prepend-icon="trash-2"
        :disabled="!selectedHasCustom"
        @click="bulkDelete"
      >
        Delete
      </v-btn>
    </MpFloatingBulkBar>

    <DashboardFormDialog
      v-model="createDialogOpen"
      :account-id="accountId"
      @saved="handleDashboardCreated"
    />

    <DashboardFormDialog
      v-model="editDialogOpen"
      :account-id="accountId"
      :dashboard="editingDashboard"
    />

    <MpConfirmDialog
      :model-value="!!confirmAction"
      :title="confirmAction?.title ?? ''"
      :message="confirmAction?.body ?? ''"
      :confirm-label="confirmAction?.confirmLabel"
      :danger="confirmAction?.destructive"
      @update:model-value="confirmAction = null"
      @confirm="performConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
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
  color: var(--on-surface);
  cursor: pointer;
  font: inherit;
  font-weight: var(--mp-fontWeight-semibold);
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
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--mp-radius-4);
}

.dashboard-description {
  max-width: 48ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Phones: tighten name/description caps + cell padding so the table fits without horizontal scroll */
@media (max-width: $mp-layout-breakpointCompact) {
  .dashboard-link {
    max-width: 14ch;
  }

  .dashboard-description {
    max-width: 15ch;
  }

  .dashboards-table :deep(td),
  .dashboards-table :deep(th) {
    padding-inline: var(--mp-component-table-cellPaddingInlineCompact);
  }

  .dashboard-title-row {
    flex-wrap: wrap;
  }
}
</style>
