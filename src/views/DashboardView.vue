<script setup lang="ts">
import { computed, onErrorCaptured, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import DashboardGrid from '@/components/dashboards/DashboardGrid.vue'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import WidgetWizardDrawer from '@/components/dashboards/WidgetWizardDrawer.vue'
import CreateDashboardDialog from '@/components/dashboards/CreateDashboardDialog.vue'
import EditDashboardDialog from '@/components/dashboards/EditDashboardDialog.vue'
import { accentToVuetifyColor } from '@/components/dashboards/dashboardOptions'
import type { WidgetSize } from '@/components/dashboards/widgetSizePresets'
import type {
  Dashboard,
  DashboardComparisonMode,
  DashboardDateGrain,
  DashboardDatePreset,
  DashboardFilterState,
  DashboardWidgetDraft,
} from '@/stores/dashboards/types'
import { useAccountsStore } from '@/stores/useAccounts'
import { useCopilotStore } from '@/stores/useCopilot'
import { useDashboardsStore } from '@/stores/useDashboards'

const route = useRoute()
const router = useRouter()
const accountsStore = useAccountsStore()
const dashboardsStore = useDashboardsStore()
const copilot = useCopilotStore()

const widgetWizardOpen = ref(false)
const editMode = ref(false)
const renderError = ref<string | null>(null)
const dateMenuOpen = ref(false)
const advancedFiltersOpen = ref(false)
const dashboardNotice = ref('')
const dashboardNoticeVisible = ref(false)
const expandedWidgetId = ref<string | null>(null)

onErrorCaptured((err) => {
  const message = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)
  console.error('[DashboardView Error]', err)
  renderError.value = message
  return false
})
const createDashboardOpen = ref(false)
const editDashboardOpen = ref(false)
const editDashboardTarget = ref<Dashboard | null>(null)
const switcherSearch = ref('')
const confirmAction = ref<{
  title: string
  body: string
  confirmLabel: string
  destructive?: boolean
  perform: () => void
} | null>(null)

interface SetupTask {
  title: string
  description: string
  icon: string
  status: string
  complete: boolean
  route: RouteLocationRaw
}

const datePresetOptions: Array<{ title: string; value: DashboardDatePreset; group: string }> = [
  { title: 'Today', value: 'today', group: 'Current' },
  { title: 'Yesterday', value: 'yesterday', group: 'Current' },
  { title: 'Last 7 days', value: 'last_7_days', group: 'Last' },
  { title: 'Last 30 days', value: 'last_30_days', group: 'Last' },
  { title: 'Last 90 days', value: 'last_90_days', group: 'Last' },
  { title: 'Month to date', value: 'month_to_date', group: 'Period to date' },
  { title: 'Quarter to date', value: 'quarter_to_date', group: 'Period to date' },
  { title: 'Year to date', value: 'year_to_date', group: 'Period to date' },
  { title: 'Black Friday/Cyber Monday', value: 'black_friday_cyber_monday', group: 'Retail moments' },
  { title: 'Custom range', value: 'custom', group: 'Custom' },
]
const grainOptions: Array<{ title: string; value: DashboardDateGrain }> = [
  { title: 'Daily', value: 'daily' },
  { title: 'Weekly', value: 'weekly' },
  { title: 'Monthly', value: 'monthly' },
]
const comparisonOptions: Array<{ title: string; value: DashboardComparisonMode }> = [
  { title: 'No comparison', value: 'none' },
  { title: 'Previous period', value: 'previous_period' },
  { title: 'Previous year', value: 'previous_year' },
  { title: 'Custom comparison', value: 'custom' },
]

const defaultDashboardFilters: DashboardFilterState = {
  rangePreset: 'last_30_days',
  grain: 'daily',
  comparison: 'previous_period',
}

const dateDraft = ref<DashboardFilterState>({ ...defaultDashboardFilters })

const accountId = computed(() => {
  const routeAccountId = Array.isArray(route.params.accountId)
    ? route.params.accountId[0]
    : route.params.accountId
  // Fall back to active account if the route ID isn't a real account (e.g. 'demo' from Commerce routes)
  const isRealAccount = routeAccountId && accountsStore.accounts.some((a) => a.id === routeAccountId)
  return isRealAccount ? routeAccountId : accountsStore.activeId
})

const dashboardIdParam = computed(() => {
  const routeDashboardId = Array.isArray(route.params.dashboardId)
    ? route.params.dashboardId[0]
    : route.params.dashboardId
  return routeDashboardId
})

watch(
  accountId,
  (nextAccountId) => {
    if (nextAccountId !== accountsStore.activeId) {
      accountsStore.switchTo(nextAccountId)
    }
    dashboardsStore.ensureAccountDashboards(nextAccountId)
  },
  { immediate: true },
)

const dashboards = computed(() => dashboardsStore.getDashboardsForAccount(accountId.value))
const activeDashboard = computed(() => dashboardsStore.getDashboardById(accountId.value, dashboardIdParam.value))
const activeDashboardId = computed(() => activeDashboard.value?.id)
const expandedWidget = computed(() =>
  activeDashboard.value?.widgets.find((widget) => widget.id === expandedWidgetId.value) ?? null,
)
const expandedWidgetOpen = computed({
  get: () => Boolean(expandedWidget.value),
  set: (isOpen: boolean) => {
    if (!isOpen) expandedWidgetId.value = null
  },
})
const activeWidgetDraft = computed<DashboardWidgetDraft | null>(() => {
  const draft = dashboardsStore.widgetEditorDraft
  if (!draft || draft.dashboardId !== activeDashboardId.value) return null
  return draft
})
const setupTasks = computed<SetupTask[]>(() => [
  {
    title: 'Verify sending DNS',
    description: 'DKIM, SPF, and DMARC are ready.',
    icon: 'shield-check',
    status: 'Done',
    complete: true,
    route: { name: 'Settings', params: { accountId: accountId.value } },
  },
  {
    title: 'Connect payment gateway',
    description: 'Finish payment setup before launch.',
    icon: 'credit-card',
    status: 'Needs review',
    complete: false,
    route: { name: 'StoreSetup', params: { accountId: accountId.value } },
  },
  {
    title: 'Complete store setup',
    description: 'Review channels, checkout, and fulfillment.',
    icon: 'store',
    status: 'In progress',
    complete: false,
    route: { name: 'StoreSetup', params: { accountId: accountId.value } },
  },
  {
    title: 'Review connected apps',
    description: 'Check installed apps and sync health.',
    icon: 'puzzle',
    status: '4 active',
    complete: true,
    route: { name: 'AppStore', params: { accountId: accountId.value } },
  },
])
const completedSetupTasks = computed(() => setupTasks.value.filter((task) => task.complete).length)
const setupProgress = computed(() => Math.round((completedSetupTasks.value / setupTasks.value.length) * 100))

const pageTitle = computed(() => activeDashboard.value?.name ?? 'Dashboard')

const filteredDashboards = computed(() => {
  const query = switcherSearch.value.trim().toLowerCase()
  const sorted = [...dashboards.value].sort((a, b) => {
    const left = a.lastViewedAt ?? a.updatedAt
    const right = b.lastViewedAt ?? b.updatedAt
    return new Date(right).getTime() - new Date(left).getTime()
  })
  if (!query) return sorted.slice(0, 8)
  return sorted
    .filter((dashboard) =>
      dashboard.name.toLowerCase().includes(query)
      || (dashboard.description ?? '').toLowerCase().includes(query),
    )
    .slice(0, 12)
})

function dashboardRouteLocation(dashboard: Dashboard) {
  if (dashboard.isDefault) {
    return { name: 'Dashboard' as const, params: { accountId: dashboard.accountId } }
  }
  return { name: 'DashboardDetail' as const, params: { accountId: dashboard.accountId, dashboardId: dashboard.id } }
}

function navigateToDashboard(dashboard: Dashboard | undefined) {
  if (!dashboard) {
    router.push({ name: 'Dashboard', params: { accountId: accountId.value } })
    return
  }
  router.push(dashboardRouteLocation(dashboard))
}

function openListingPage() {
  router.push({ name: 'DashboardsList', params: { accountId: accountId.value } })
}

watch(
  [accountId, dashboardIdParam],
  () => {
    if (!activeDashboard.value) {
      router.replace({ name: 'Dashboard', params: { accountId: accountId.value } })
    }
  },
  { immediate: true },
)

watch(
  activeDashboardId,
  (id) => {
    if (id) {
      dashboardsStore.markVisited(accountId.value, id)
    }
  },
  { immediate: true },
)

watch(
  activeWidgetDraft,
  (draft) => {
    if (!draft) return
    widgetWizardOpen.value = true
  },
  { immediate: true },
)

watch(widgetWizardOpen, (isOpen) => {
  if (!isOpen) {
    dashboardsStore.closeWidgetEditor()
  }
})

watch(activeDashboardId, () => {
  editMode.value = false
  expandedWidgetId.value = null
})

const activeFilters = computed<DashboardFilterState>(() => activeDashboard.value?.filters ?? defaultDashboardFilters)

const activeFilterCount = computed(() => {
  const f = activeFilters.value
  const d = defaultDashboardFilters
  let count = 0
  if (f.rangePreset !== d.rangePreset) count++
  if (f.comparison !== d.comparison) count++
  if (f.grain !== d.grain) count++
  return count
})
const selectedPresetOption = computed(() =>
  datePresetOptions.find((option) => option.value === activeFilters.value.rangePreset) ?? datePresetOptions[3],
)
const dateRangeLabel = computed(() => selectedPresetOption.value?.title ?? 'Last 30 days')
function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function openDateMenu() {
  dateDraft.value = { ...activeFilters.value }
  if (!dateDraft.value.startDate) dateDraft.value.startDate = todayIso()
  if (!dateDraft.value.endDate) dateDraft.value.endDate = todayIso()
  dateMenuOpen.value = true
}

function updateDateDraftPreset(nextPreset: DashboardDatePreset) {
  dateDraft.value = {
    ...dateDraft.value,
    rangePreset: nextPreset,
  }
}

function applyDateDraft() {
  if (!activeDashboard.value) return
  dashboardsStore.updateDashboardFilters(accountId.value, activeDashboard.value.id, dateDraft.value)
  dateMenuOpen.value = false
}

function showDashboardNotice(message: string) {
  dashboardNotice.value = message
  dashboardNoticeVisible.value = true
}

function openStubAction(label: string) {
  showDashboardNotice(`${label} is represented as a prototype action.`)
}

function openSetupTask(task: SetupTask) {
  router.push(task.route)
}

function openWidgetBuilder() {
  dashboardsStore.closeWidgetEditor()
  widgetWizardOpen.value = true
}

function openCopilotForWidget() {
  copilot.open()
}

function handleLayoutUpdate(layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) {
  if (!activeDashboard.value) return
  dashboardsStore.updateLayout(accountId.value, activeDashboard.value.id, layout)
}

function handleRemoveWidget(widgetId: string) {
  if (!activeDashboard.value) return
  dashboardsStore.removeWidget(accountId.value, activeDashboard.value.id, widgetId)
}

function handleResizeWidget(payload: { widgetId: string; size: WidgetSize }) {
  if (!activeDashboard.value) return
  dashboardsStore.resizeWidget(accountId.value, activeDashboard.value.id, payload.widgetId, payload.size)
}

function handleExpandWidget(widgetId: string) {
  const widget = activeDashboard.value?.widgets.find((candidate) => candidate.id === widgetId)
  if (!widget) return
  expandedWidgetId.value = widget.id
}

function handleRefreshWidget(widgetId: string) {
  if (!activeDashboard.value) return
  const widget = activeDashboard.value.widgets.find((candidate) => candidate.id === widgetId)
  dashboardsStore.refreshWidget(accountId.value, activeDashboard.value.id, widgetId)
  showDashboardNotice(`${widget?.title ?? 'Widget'} refreshed.`)
}

function handleEditWidget(widgetId: string) {
  if (!activeDashboard.value) return
  dashboardsStore.openWidgetEditorForWidget(accountId.value, activeDashboard.value.id, widgetId)
}

function openCreateDashboard() {
  createDashboardOpen.value = true
}

function handleDashboardCreated(dashboardId: string) {
  const dashboard = dashboardsStore.getDashboardById(accountId.value, dashboardId)
  navigateToDashboard(dashboard)
}

function openEditDashboard() {
  if (!activeDashboard.value) return
  editDashboardTarget.value = activeDashboard.value
  editDashboardOpen.value = true
}

function setActiveAsDefault() {
  if (!activeDashboard.value || activeDashboard.value.isDefault) return
  dashboardsStore.setDefaultDashboard(accountId.value, activeDashboard.value.id)
}

function setDashboardAsDefault(dashboard: Dashboard) {
  if (dashboard.isDefault) return
  dashboardsStore.setDefaultDashboard(accountId.value, dashboard.id)
  showDashboardNotice(`“${dashboard.name}” is now the default dashboard.`)
}

function duplicateCurrentDashboard() {
  if (!activeDashboard.value) return
  const duplicate = dashboardsStore.duplicateDashboard(accountId.value, activeDashboard.value.id)
  if (duplicate) navigateToDashboard(duplicate)
}

function refreshDashboard() {
  showDashboardNotice('Dashboard data refreshed for this prototype session.')
}

function openEditDashboardFor(dashboard: Dashboard) {
  editDashboardTarget.value = dashboard
  editDashboardOpen.value = true
}

function resetCurrentDashboard() {
  if (!activeDashboard.value) return
  const dashboard = activeDashboard.value
  confirmAction.value = {
    title: `Reset “${dashboard.name}” to defaults?`,
    body: 'Widget layout and customizations will be reverted to the original system template.',
    confirmLabel: 'Reset dashboard',
    perform: () => dashboardsStore.resetSystemDashboard(accountId.value, dashboard.id),
  }
}

function deleteCurrentDashboard() {
  if (!activeDashboard.value) return
  const dashboard = activeDashboard.value
  confirmAction.value = {
    title: `Delete “${dashboard.name}”?`,
    body: 'This dashboard and all of its widgets will be permanently removed for this account.',
    confirmLabel: 'Delete dashboard',
    destructive: true,
    perform: () => {
      dashboardsStore.deleteDashboard(accountId.value, dashboard.id)
      router.replace({ name: 'Dashboard', params: { accountId: accountId.value } })
    },
  }
}

function performConfirm() {
  if (!confirmAction.value) return
  confirmAction.value.perform()
  confirmAction.value = null
}

function toggleFavoriteActive() {
  if (!activeDashboard.value) return
  dashboardsStore.toggleFavorite(accountId.value, activeDashboard.value.id)
}
</script>

<template>
  <div class="dashboard-hub">
    <v-alert
      v-if="renderError"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="renderError = null"
    >
      <div class="text-subtitle-2 font-weight-bold mb-1">Dashboard failed to load</div>
      <pre class="text-caption" style="white-space: pre-wrap; margin: 0;">{{ renderError }}</pre>
    </v-alert>

    <section class="dashboard-page-header">
      <!-- Row 1: Title + primary actions -->
      <div class="dashboard-page-header__top">
        <div class="dashboard-page-header__title-area">
          <button
            type="button"
            class="dashboard-page-header__fav"
            :class="{ 'dashboard-page-header__fav--active': activeDashboard?.favorite }"
            :aria-label="activeDashboard?.favorite ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavoriteActive"
          >
            <v-icon size="16">star</v-icon>
          </button>

          <v-menu location="bottom start" offset="8" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <button
                v-bind="menuProps"
                type="button"
                class="dashboard-title-switcher"
                :aria-label="`Switch dashboard. Current: ${pageTitle}`"
              >
                <h1 class="dashboard-page-header__h1">{{ pageTitle }}</h1>
                <v-icon size="16" class="dashboard-title-switcher__chevron">chevron-down</v-icon>
              </button>
            </template>

            <v-card width="380" rounded="lg" flat border class="dashboard-switcher-card">
              <div class="pa-3 dashboard-switcher-card__search">
                <v-text-field
                  v-model="switcherSearch"
                  prepend-inner-icon="search"
                  placeholder="Search dashboards"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                />
              </div>
              <v-list class="py-1 bg-transparent" density="comfortable" max-height="320">
                <v-list-item
                  v-for="dashboard in filteredDashboards"
                  :key="dashboard.id"
                  rounded="lg"
                  class="mx-2 mb-1"
                  :active="dashboard.id === activeDashboardId"
                  @click="navigateToDashboard(dashboard)"
                >
                  <template #prepend>
                    <v-avatar size="32" variant="tonal" :color="accentToVuetifyColor(dashboard.accent)">
                      <v-icon size="18">{{ dashboard.icon ?? 'layout-dashboard' }}</v-icon>
                    </v-avatar>
                  </template>
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <span class="text-body-2 font-weight-bold">{{ dashboard.name }}</span>
                    <v-icon v-if="dashboard.favorite" size="14" color="warning">star</v-icon>
                    <v-chip v-if="dashboard.isDefault" size="x-small" variant="tonal" color="success">Default</v-chip>
                  </div>
                  <template #append>
                    <div class="d-flex align-center ga-1">
                      <v-tooltip
                        :text="dashboard.isDefault ? 'Currently default' : 'Set as default'"
                        location="top"
                      >
                        <template #activator="{ props: tipProps }">
                          <v-btn
                            v-bind="tipProps"
                            :icon="dashboard.isDefault ? 'bookmark-check' : 'bookmark'"
                            :color="dashboard.isDefault ? 'success' : undefined"
                            variant="text"
                            size="x-small"
                            :disabled="dashboard.isDefault"
                            :aria-label="dashboard.isDefault ? `${dashboard.name} is the default dashboard` : `Set ${dashboard.name} as default`"
                            @click.stop="setDashboardAsDefault(dashboard)"
                          />
                        </template>
                      </v-tooltip>
                      <v-btn
                        icon="pencil"
                        variant="text"
                        size="x-small"
                        :aria-label="`Edit ${dashboard.name}`"
                        @click.stop="openEditDashboardFor(dashboard)"
                      />
                    </div>
                  </template>
                </v-list-item>
                <div
                  v-if="filteredDashboards.length === 0"
                  class="text-body-2 text-medium-emphasis text-center py-6"
                >
                  No dashboards match your search.
                </div>
              </v-list>
              <v-divider />
              <div class="pa-2">
                <v-btn
                  block
                  variant="text"
                  prepend-icon="layout-list"
                  class="text-none justify-start"
                  @click="openListingPage"
                >
                  View all dashboards
                </v-btn>
              </div>
            </v-card>
          </v-menu>

        </div>

        <div class="dashboard-page-header__actions">
          <v-menu location="bottom end" offset="4">
            <template #activator="{ props: dashMenuProps }">
              <v-btn
                v-bind="dashMenuProps"
                variant="text"
                size="x-small"
                append-icon="chevron-down"
                class="text-none"
                :disabled="!activeDashboard"
              >
                Actions
              </v-btn>
            </template>
            <v-card width="320" rounded="lg" flat border class="dph-dropdown">
              <div class="dph-dropdown__label">Actions</div>
              <div class="dph-dropdown__list">
                <button type="button" class="dph-dropdown-row" @click="openListingPage">
                  <v-icon size="20" class="dph-dropdown-row__icon">layout-list</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Manage dashboards</strong>
                    <small>View, organise, and delete</small>
                  </span>
                </button>
                <button type="button" class="dph-dropdown-row" @click="openCreateDashboard">
                  <v-icon size="20" class="dph-dropdown-row__icon">plus</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Create dashboard</strong>
                    <small>Start from a blank or template</small>
                  </span>
                </button>
                <button type="button" class="dph-dropdown-row" :disabled="!activeDashboard" @click="openEditDashboard">
                  <v-icon size="20" class="dph-dropdown-row__icon">pencil</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Edit dashboard details</strong>
                    <small>Name, icon, and description</small>
                  </span>
                </button>
                <button type="button" class="dph-dropdown-row" :disabled="!activeDashboard" @click="duplicateCurrentDashboard">
                  <v-icon size="20" class="dph-dropdown-row__icon">copy-plus</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Duplicate dashboard</strong>
                    <small>Clone with all widgets</small>
                  </span>
                </button>
                <button v-if="activeDashboard && !activeDashboard.isDefault" type="button" class="dph-dropdown-row" @click="setActiveAsDefault">
                  <v-icon size="20" class="dph-dropdown-row__icon">bookmark</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Set as default</strong>
                    <small>Show first on login</small>
                  </span>
                </button>
                <button type="button" class="dph-dropdown-row" @click="editMode = !editMode">
                  <v-icon size="20" class="dph-dropdown-row__icon">move</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>{{ editMode ? 'Done editing layout' : 'Edit layout' }}</strong>
                    <small>Drag and resize widgets</small>
                  </span>
                </button>
                <button type="button" class="dph-dropdown-row" @click="openStubAction('Copy dashboard link')">
                  <v-icon size="20" class="dph-dropdown-row__icon">link</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Copy dashboard link</strong>
                    <small>Share a direct URL</small>
                  </span>
                </button>
                <button type="button" class="dph-dropdown-row" @click="openStubAction('Invite editors')">
                  <v-icon size="20" class="dph-dropdown-row__icon">user-plus</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Invite editors</strong>
                    <small>Collaborate with your team</small>
                  </span>
                </button>
                <button v-if="activeDashboard?.kind === 'system'" type="button" class="dph-dropdown-row" @click="resetCurrentDashboard">
                  <v-icon size="20" class="dph-dropdown-row__icon">rotate-ccw</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Reset to defaults</strong>
                    <small>Revert to system template</small>
                  </span>
                </button>
                <button v-if="activeDashboard?.kind === 'custom'" type="button" class="dph-dropdown-row dph-dropdown-row--danger" @click="deleteCurrentDashboard">
                  <v-icon size="20" class="dph-dropdown-row__icon">trash-2</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Delete dashboard</strong>
                    <small>Permanently remove</small>
                  </span>
                </button>
              </div>
            </v-card>
          </v-menu>

          <v-menu location="bottom end" offset="8">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="text"
                size="x-small"
                prepend-icon="plus"
                append-icon="chevron-down"
                class="text-none"
                :disabled="!activeDashboard"
              >
                Add content
              </v-btn>
            </template>
            <v-card width="320" rounded="lg" flat border class="dph-dropdown">
              <div class="dph-dropdown__label">Add content</div>
              <div class="dph-dropdown__list">
                <button type="button" class="dph-dropdown-row" @click="openCopilotForWidget">
                  <v-icon size="20" class="dph-dropdown-row__icon">sparkles</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Create with Da Vinci</strong>
                    <small>Generate a widget from a prompt</small>
                  </span>
                </button>
                <button type="button" class="dph-dropdown-row" @click="openWidgetBuilder()">
                  <v-icon size="20" class="dph-dropdown-row__icon">layout-grid</v-icon>
                  <span class="dph-dropdown-row__body">
                    <strong>Choose existing widget</strong>
                    <small>Pick from prebuilt KPIs, charts, tables, and activity</small>
                  </span>
                </button>
              </div>
            </v-card>
          </v-menu>
        </div>
      </div>

      <!-- Row 2: Filter strip -->
      <div class="dashboard-page-header__filters">
        <div class="dashboard-page-header__filters-left">
          <v-menu v-model="dateMenuOpen" location="bottom start" offset="8" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="flat"
                size="small"
                density="comfortable"
                prepend-icon="calendar-range"
                append-icon="chevron-down"
                class="text-none dashboard-filter-btn--pill"
                @click.stop="openDateMenu"
              >
                {{ dateRangeLabel }}
              </v-btn>
            </template>
            <v-card width="760" rounded="lg" flat border class="dashboard-date-menu">
              <div class="dashboard-date-menu__presets">
                <template v-for="(option, index) in datePresetOptions" :key="option.value">
                  <div
                    v-if="index === 0 || datePresetOptions[index - 1]?.group !== option.group"
                    class="dashboard-date-menu__group"
                  >
                    {{ option.group }}
                  </div>
                  <button
                    type="button"
                    class="dashboard-date-menu__preset"
                    :class="{ 'dashboard-date-menu__preset--active': dateDraft.rangePreset === option.value }"
                    @click="updateDateDraftPreset(option.value)"
                  >
                    {{ option.title }}
                  </button>
                </template>
              </div>
              <div class="dashboard-date-menu__body">
                <div class="dashboard-date-menu__fields">
                  <v-text-field v-model="dateDraft.startDate" label="Start date" type="date" density="comfortable" variant="outlined" hide-details />
                  <v-icon size="18">arrow-right</v-icon>
                  <v-text-field v-model="dateDraft.endDate" label="End date" type="date" density="comfortable" variant="outlined" hide-details />
                </div>
                <div class="dashboard-date-menu__fields mt-3">
                  <v-select v-model="dateDraft.grain" :items="grainOptions" item-title="title" item-value="value" label="Grain" density="comfortable" variant="outlined" hide-details />
                  <v-select v-model="dateDraft.comparison" :items="comparisonOptions" item-title="title" item-value="value" label="Comparison" density="comfortable" variant="outlined" hide-details />
                </div>
                <v-alert variant="tonal" color="info" class="mt-4" density="compact">
                  Widgets will show {{ datePresetOptions.find((option) => option.value === dateDraft.rangePreset)?.title ?? 'the selected range' }} with {{ grainOptions.find((option) => option.value === dateDraft.grain)?.title.toLowerCase() ?? 'daily' }} grouping.
                </v-alert>
                <div class="d-flex justify-end ga-2 mt-4">
                  <v-btn variant="text" class="text-none" @click="dateMenuOpen = false">Cancel</v-btn>
                  <v-btn color="primary" variant="flat" class="text-none" @click="applyDateDraft">Apply</v-btn>
                </div>
              </div>
            </v-card>
          </v-menu>

          <v-menu v-model="advancedFiltersOpen" location="bottom start" offset="8" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="flat"
                size="small"
                density="comfortable"
                prepend-icon="list-filter"
                append-icon="chevron-down"
                class="text-none dashboard-filter-btn--pill"
              >
                Filters
                <span
                  v-if="activeFilterCount > 0"
                  class="dashboard-filter-btn__badge"
                  aria-label="`${activeFilterCount} active filters`"
                >{{ activeFilterCount }}</span>
              </v-btn>
            </template>
            <v-card width="360" rounded="lg" flat border class="pa-3">
              <div class="text-subtitle-2 font-weight-bold mb-2">Filters</div>
              <v-select label="Data source" :items="['All sources', 'Commerce', 'Marketing', 'Contacts', 'Service']" density="compact" variant="outlined" hide-details class="mb-3" />
              <v-select label="Owner" :items="['Everyone', 'Marketing team', 'Commerce team']" density="compact" variant="outlined" hide-details />
              <div class="d-flex flex-wrap ga-2 mt-3">
                <v-chip size="small" variant="tonal" color="primary">Channel</v-chip>
                <v-chip size="small" variant="tonal" color="primary">Campaign type</v-chip>
                <v-chip size="small" variant="tonal" color="primary">Customer segment</v-chip>
              </div>
            </v-card>
          </v-menu>
        </div>

        <div class="dashboard-page-header__filters-right">
          <div class="dashboard-page-header__status">
            <span class="dashboard-page-header__dot" />
            <span>Live &middot; synced 2 min ago</span>
          </div>
          <v-btn
            icon="refresh-cw"
            variant="text"
            size="x-small"
            class="dashboard-page-header__refresh"
            aria-label="Refresh dashboard"
            @click="refreshDashboard"
          />
        </div>
      </div>
    </section>

    <v-alert
      v-if="editMode"
      type="info"
      variant="tonal"
      rounded="xl"
      class="mt-4"
      icon="move"
    >
      Drag, resize, or pick a size preset (S/M/L/XL). Layout changes save automatically for this account and dashboard.
    </v-alert>

    <DashboardGrid
      v-if="activeDashboard"
      :account-id="accountId"
      :dashboard-id="activeDashboard.id"
      :widgets="activeDashboard.widgets"
      :filters="activeDashboard.filters"
      :edit-mode="editMode"
      :setup-tasks="setupTasks"
      :setup-completed="completedSetupTasks"
      :setup-progress="setupProgress"
      @expand-widget="handleExpandWidget"
      @edit-widget="handleEditWidget"
      @refresh-widget="handleRefreshWidget"
      @remove-widget="handleRemoveWidget"
      @resize-widget="handleResizeWidget"
      @update-layout="handleLayoutUpdate"
      @add-widget="openWidgetBuilder()"
      @select-setup-task="openSetupTask"
    />

    <WidgetWizardDrawer
      v-model="widgetWizardOpen"
      :account-id="accountId"
      :dashboard-id="activeDashboardId ?? ''"
      :dashboard-filters="activeDashboard?.filters ?? defaultDashboardFilters"
      :initial-draft="activeWidgetDraft"
    />

    <CreateDashboardDialog
      v-model="createDashboardOpen"
      :account-id="accountId"
      @created="handleDashboardCreated"
    />

    <EditDashboardDialog
      v-model="editDashboardOpen"
      :account-id="accountId"
      :dashboard="editDashboardTarget"
    />

    <v-dialog v-model="expandedWidgetOpen" max-width="1120" width="calc(100vw - 32px)">
      <v-card v-if="expandedWidget" rounded="lg" flat border color="surface" class="dashboard-widget-expand">
        <div class="dashboard-widget-expand__header">
          <div class="dashboard-widget-expand__copy">
            <div class="dashboard-widget-expand__eyebrow">Expanded widget</div>
            <div class="dashboard-widget-expand__title">{{ expandedWidget.title }}</div>
          </div>
          <v-btn
            icon="x"
            variant="text"
            size="small"
            :aria-label="`Close ${expandedWidget.title}`"
            @click="expandedWidgetOpen = false"
          />
        </div>
        <div class="dashboard-widget-expand__body">
          <DashboardWidgetCard
            :account-id="accountId"
            :widget="expandedWidget"
            :filters="activeDashboard?.filters ?? defaultDashboardFilters"
            :editable="false"
            :show-actions="false"
          />
        </div>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="!!confirmAction" max-width="440" persistent @update:model-value="confirmAction = null">
      <v-card v-if="confirmAction" rounded="lg" color="surface">
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

    <v-snackbar v-model="dashboardNoticeVisible" timeout="2600" color="surface" location="bottom right">
      {{ dashboardNotice }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.dashboard-hub {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-widget-expand {
  overflow: hidden;
  background: var(--surface-1) !important;
}

.dashboard-widget-expand__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--hairline);
}

.dashboard-widget-expand__copy {
  min-width: 0;
}

.dashboard-widget-expand__eyebrow {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.dashboard-widget-expand__title {
  overflow: hidden;
  margin-top: 3px;
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-widget-expand__body {
  height: min(68vh, 620px);
  min-height: 360px;
  padding: 16px;
  background: var(--surface-2);
}

.dashboard-widget-expand__body :deep(.dashboard-widget-card) {
  height: 100%;
}

.dashboard-page-header {
  margin: -32px -36px 12px;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-1);
}

:deep(.dashboard-grid) {
  margin-top: -8px;
}

@media (max-width: 1024px) {
  .dashboard-page-header {
    margin: -28px -28px 10px;
  }
}

@media (max-width: 640px) {
  .dashboard-page-header {
    margin: -22px -22px 8px;
  }
}

.dashboard-page-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 36px;
}

@media (max-width: 1024px) {
  .dashboard-page-header__top {
    padding: 10px 28px;
  }
}

@media (max-width: 640px) {
  .dashboard-page-header__top {
    padding: 8px 22px;
  }
}

.dashboard-page-header__title-area {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.dashboard-page-header__fav {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--muted);
  appearance: none;
  flex-shrink: 0;
  transition: color 120ms ease, background 120ms ease;
}

.dashboard-page-header__fav:hover {
  background: var(--surface-2);
}

.dashboard-page-header__fav--active {
  color: #f59e0b;
}

.dashboard-page-header__fav--active :deep(.v-icon svg) {
  fill: currentColor;
}

.dashboard-page-header__fav:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

.dashboard-title-switcher {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  appearance: none;
}

.dashboard-title-switcher:hover {
  background: var(--surface-2);
  border-color: var(--hairline);
}

.dashboard-title-switcher:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.dashboard-page-header__h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1.2;
  white-space: nowrap;
}

.dashboard-title-switcher__chevron {
  color: var(--muted);
}

.dashboard-page-header__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dph-dropdown {
  border-color: var(--hairline);
  padding: 8px;
  overflow: hidden;
}

.dph-dropdown__label {
  padding: 8px 8px 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.dph-dropdown__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dph-dropdown-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  appearance: none;
  transition: background 100ms ease;
}

.dph-dropdown-row:hover,
.dph-dropdown-row:focus-visible {
  background: var(--surface-2);
}

.dph-dropdown-row:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.dph-dropdown-row:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.dph-dropdown-row__icon {
  color: var(--muted);
  flex-shrink: 0;
}

.dph-dropdown-row__body strong,
.dph-dropdown-row__body small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dph-dropdown-row__body strong {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ink);
}

.dph-dropdown-row__body small {
  margin-top: 1px;
  color: var(--muted);
  font-size: 11.5px;
}

.dph-dropdown-row--danger .dph-dropdown-row__icon,
.dph-dropdown-row--danger .dph-dropdown-row__body strong {
  color: rgb(var(--v-theme-error));
}

.dph-dropdown-row--danger:hover {
  background: rgba(var(--v-theme-error), 0.06);
}

.dashboard-page-header__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 36px;
  background: var(--surface-1);
  border-top: 1px solid var(--hairline);
}

@media (max-width: 1024px) {
  .dashboard-page-header__filters {
    padding: 4px 28px;
  }
}

@media (max-width: 640px) {
  .dashboard-page-header__filters {
    padding: 4px 22px;
  }
}

.dashboard-page-header__filters-left,
.dashboard-page-header__filters-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Compact filter pill — used by both Date range and Filters triggers */
.dashboard-filter-btn--pill.v-btn {
  border-radius: 9999px !important;
  padding-inline: 10px 8px !important;
  min-height: 26px !important;
  height: 26px !important;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--ink);
  background: color-mix(in oklch, var(--ink) 5%, var(--surface-1)) !important;
  box-shadow: none !important;
}

.dashboard-filter-btn--pill.v-btn:hover {
  background: color-mix(in oklch, var(--ink) 9%, var(--surface-1)) !important;
}

.dashboard-filter-btn--pill :deep(.v-btn__prepend) {
  margin-inline-end: 6px;
}

.dashboard-filter-btn--pill :deep(.v-btn__append) {
  margin-inline-start: 4px;
}

.dashboard-filter-btn--pill :deep(.v-btn__prepend .v-icon),
.dashboard-filter-btn--pill :deep(.v-btn__append .v-icon) {
  color: var(--muted);
  font-size: 14px;
  opacity: 0.85;
}

.dashboard-filter-btn--pill :deep(.v-btn__overlay) {
  opacity: 0 !important;
}

.dashboard-filter-btn__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  margin-inline-start: 6px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--ink);
  color: rgb(var(--v-theme-surface));
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.dashboard-page-header__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.dashboard-page-header__dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--pos);
}

.dashboard-page-header__refresh {
  width: 22px !important;
  height: 22px !important;
  color: var(--muted) !important;
}

.dashboard-page-header__refresh :deep(.v-icon) {
  font-size: 13px;
}

.dashboard-date-menu {
  display: grid;
  grid-template-columns: 220px 1fr;
  overflow: hidden;
}

.dashboard-date-menu__presets {
  padding: 10px;
  border-right: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface-variant));
}

.dashboard-date-menu__group {
  padding: 12px 8px 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.dashboard-date-menu__preset {
  display: block;
  width: 100%;
  min-height: 34px;
  padding: 7px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  text-align: left;
}

.dashboard-date-menu__preset:hover,
.dashboard-date-menu__preset--active {
  background: var(--surface-1);
  color: var(--accent-ink);
  font-weight: 600;
}

.dashboard-date-menu__preset:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.dashboard-date-menu__body {
  padding: 16px;
}

.dashboard-date-menu__fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.dashboard-date-menu__fields + .dashboard-date-menu__fields {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.dashboard-switcher-card {
  border-color: var(--hairline);
}

.dashboard-switcher-card__search {
  border-bottom: 1px solid var(--hairline);
}

@media (max-width: 960px) {
  .dashboard-page-header__top {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .dashboard-page-header__actions {
    width: 100%;
    overflow-x: auto;
  }

  .dashboard-page-header__filters {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .dashboard-date-menu {
    grid-template-columns: 1fr;
    width: min(92vw, 760px);
  }

  .dashboard-date-menu__presets {
    border-right: 0;
    border-bottom: 1px solid var(--hairline);
    max-height: 230px;
    overflow: auto;
  }

  .dashboard-date-menu__fields,
  .dashboard-date-menu__fields + .dashboard-date-menu__fields {
    grid-template-columns: 1fr;
  }
}
</style>
