<script setup lang="ts">
import { computed, onErrorCaptured, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import DashboardGrid from '@/components/dashboards/DashboardGrid.vue'
import DashboardWidgetCard from '@/components/dashboards/DashboardWidgetCard.vue'
import WidgetWizardDrawer from '@/components/dashboards/WidgetWizardDrawer.vue'
import DashboardFormDialog from '@/components/dashboards/DashboardFormDialog.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
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
import { useDashboardsStore } from '@/stores/useDashboards'
import { useOnboardingStore } from '@/stores/useOnboarding'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const accountsStore = useAccountsStore()
const dashboardsStore = useDashboardsStore()
const toast = useToast()

const widgetWizardOpen = ref(false)
const renderError = ref<string | null>(null)
const dateMenuOpen = ref(false)
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
const onboardingStore = useOnboardingStore()
const setupTasks = computed<SetupTask[]>(() => {
  // PLG accounts (trial or purchased) see the next steps from their
  // personalized Get Started plan instead of the static demo tasks.
  if (onboardingStore.showGuideSurfaces) {
    return onboardingStore.nextTasks(5).map(task => ({
      title: task.title,
      description: task.description,
      icon: task.icon,
      status: `≈ ${task.minutes} min`,
      complete: false,
      route: { name: task.routeName, params: { accountId: accountId.value } },
    }))
  }
  return [
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
  ]
})
const completedSetupTasks = computed(() =>
  onboardingStore.showGuideSurfaces ? onboardingStore.doneCount : setupTasks.value.filter((task) => task.complete).length
)
const setupTotal = computed(() => (onboardingStore.showGuideSurfaces ? onboardingStore.totalCount : undefined))
const setupGuideRoute = computed(() =>
  onboardingStore.showGuideSurfaces ? { name: 'GetStarted', params: { accountId: accountId.value } } : undefined
)
const setupProgress = computed(() =>
  onboardingStore.showGuideSurfaces
    ? onboardingStore.progress
    : Math.round((completedSetupTasks.value / setupTasks.value.length) * 100)
)

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
  expandedWidgetId.value = null
})

const activeFilters = computed<DashboardFilterState>(() => activeDashboard.value?.filters ?? defaultDashboardFilters)

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
  toast.info(message)
}

function openSetupTask(task: SetupTask) {
  router.push(task.route)
}

function openWidgetBuilder() {
  dashboardsStore.closeWidgetEditor()
  widgetWizardOpen.value = true
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

// Attention-banner collapse: patch just that widget's grid height; the layout
// store call leaves every other widget untouched and vertical-compact reflows.
function handleSetWidgetHeight(payload: { widgetId: string; h: number }) {
  if (!activeDashboard.value) return
  const widget = activeDashboard.value.widgets.find((candidate) => candidate.id === payload.widgetId)
  if (!widget) return
  dashboardsStore.updateLayout(accountId.value, activeDashboard.value.id, [
    { i: widget.id, x: widget.layout.x, y: widget.layout.y, w: widget.layout.w, h: payload.h },
  ])
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

function duplicateCurrentDashboard() {
  if (!activeDashboard.value) return
  const duplicate = dashboardsStore.duplicateDashboard(accountId.value, activeDashboard.value.id)
  if (duplicate) navigateToDashboard(duplicate)
}

function refreshDashboard() {
  showDashboardNotice('Dashboard data refreshed for this prototype session.')
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

// ── Rich menu model (icon + title + description rows, like the global Create-new menu) ──
interface DashMenuRow {
  icon: string
  title: string
  sub: string
  on: () => void
  disabled?: boolean
  danger?: boolean
}

// One small flat menu — dashboard-level verbs only. Manage/Create live in the
// switcher footer; layout editing is direct manipulation on the grid itself.
const dashboardActionGroups = computed<DashMenuRow[][]>(() => {
  const d = activeDashboard.value
  const groups: DashMenuRow[][] = [[
    { icon: 'pencil', title: 'Edit details', sub: 'Rename and update the description', on: openEditDashboard, disabled: !d },
    { icon: 'copy-plus', title: 'Duplicate', sub: 'Copy this dashboard and its widgets', on: duplicateCurrentDashboard, disabled: !d },
    ...(d && !d.isDefault
      ? [{ icon: 'bookmark', title: 'Set as default', sub: 'Open this dashboard on load', on: setActiveAsDefault } as DashMenuRow]
      : []),
  ]]
  if (d) {
    groups.push([
      d.kind === 'system'
        ? { icon: 'rotate-ccw', title: 'Reset to defaults', sub: 'Restore the original widgets', on: resetCurrentDashboard }
        : { icon: 'trash-2', title: 'Delete dashboard', sub: 'Permanently remove this dashboard', on: deleteCurrentDashboard, danger: true },
    ])
  }
  return groups
})

function toggleFavoriteActive() {
  if (!activeDashboard.value) return
  dashboardsStore.toggleFavorite(accountId.value, activeDashboard.value.id)
}
</script>

<template>
  <div class="dashboard-hub">
    <MpAlert
      v-if="renderError"
      tone="error"
      title="Dashboard failed to load"
      dismissible
      @dismiss="renderError = null"
    >
      <pre class="text-caption dashboard-hub__error-detail">{{ renderError }}</pre>
    </MpAlert>

    <section class="dashboard-page-header">
      <!-- Row 1: Title + primary actions -->
      <div class="dashboard-page-header__top">
        <div class="dashboard-page-header__heading">
          <span class="mp-meta-label dashboard-page-header__eyebrow">Dashboards</span>
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
                    <v-icon v-if="dashboard.favorite" size="16" color="warning">star</v-icon>
                    <v-chip v-if="dashboard.isDefault" size="x-small" variant="tonal" color="success">Default</v-chip>
                  </div>
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
                  prepend-icon="plus"
                  class="text-none justify-start"
                  @click="openCreateDashboard"
                >
                  Create dashboard
                </v-btn>
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
        </div>

        <div class="dashboard-page-header__actions">
          <v-menu location="bottom end" offset="4">
            <template #activator="{ props: dashMenuProps }">
              <v-btn
                v-bind="dashMenuProps"
                variant="text"
                size="small"
                append-icon="chevron-down"
                class="text-none"
                aria-haspopup="menu"
                :disabled="!activeDashboard"
              >
                Actions
              </v-btn>
            </template>
            <v-card width="300" rounded="lg" flat border class="mp-menu" role="menu">
              <template v-for="(group, gi) in dashboardActionGroups" :key="gi">
                <v-divider v-if="gi > 0" class="mp-menu__divider" />
                <button
                  v-for="item in group"
                  :key="item.title"
                  type="button"
                  role="menuitem"
                  class="mp-menu-row"
                  :class="{ 'mp-menu-row--danger': item.danger }"
                  :disabled="item.disabled"
                  @click="item.on"
                >
                  <v-icon size="18" class="mp-menu-row__icon">{{ item.icon }}</v-icon>
                  <span class="mp-menu-row__body">
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.sub }}</small>
                  </span>
                </button>
              </template>
            </v-card>
          </v-menu>

          <v-btn
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="plus"
            class="text-none"
            :disabled="!activeDashboard"
            @click="openWidgetBuilder()"
          >
            Add widget
          </v-btn>
        </div>
      </div>

      <!-- Row 2: Filter strip -->
      <div class="dashboard-page-header__filters">
        <div class="dashboard-page-header__filters-left">
          <v-menu v-model="dateMenuOpen" location="bottom start" offset="8" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="tonal"
                size="small"
                prepend-icon="calendar-range"
                append-icon="chevron-down"
                class="text-none"
                @click.stop="openDateMenu"
              >
                {{ dateRangeLabel }}
              </v-btn>
            </template>
            <v-card width="680" rounded="lg" flat border class="dashboard-date-menu">
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
                <MpFormGrid :cols="2">
                  <v-text-field v-model="dateDraft.startDate" label="Start date" type="date" hide-details />
                  <v-text-field v-model="dateDraft.endDate" label="End date" type="date" hide-details />
                  <v-select v-model="dateDraft.grain" :items="grainOptions" item-title="title" item-value="value" label="Grain" hide-details />
                  <v-select v-model="dateDraft.comparison" :items="comparisonOptions" item-title="title" item-value="value" label="Comparison" hide-details />
                </MpFormGrid>
                <MpAlert tone="info" class="mt-4 dashboard-date-menu__note">
                  Widgets will show {{ datePresetOptions.find((option) => option.value === dateDraft.rangePreset)?.title ?? 'the selected range' }} with {{ grainOptions.find((option) => option.value === dateDraft.grain)?.title.toLowerCase() ?? 'daily' }} grouping.
                </MpAlert>
                <div class="dashboard-date-menu__actions d-flex justify-end ga-2">
                  <v-btn variant="text" class="text-none" @click="dateMenuOpen = false">Cancel</v-btn>
                  <v-btn color="primary" variant="flat" class="text-none" @click="applyDateDraft">Apply</v-btn>
                </div>
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
            size="small"
            class="text-medium-emphasis"
            aria-label="Refresh dashboard"
            @click="refreshDashboard"
          />
        </div>
      </div>
    </section>

    <DashboardGrid
      v-if="activeDashboard"
      :account-id="accountId"
      :dashboard-id="activeDashboard.id"
      :widgets="activeDashboard.widgets"
      :filters="activeDashboard.filters"
      :setup-tasks="setupTasks"
      :setup-completed="completedSetupTasks"
      :setup-progress="setupProgress"
      :setup-total="setupTotal"
      :setup-guide-route="setupGuideRoute"
      @expand-widget="handleExpandWidget"
      @edit-widget="handleEditWidget"
      @refresh-widget="handleRefreshWidget"
      @remove-widget="handleRemoveWidget"
      @resize-widget="handleResizeWidget"
      @set-widget-height="handleSetWidgetHeight"
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

    <DashboardFormDialog
      v-model="createDashboardOpen"
      :account-id="accountId"
      @saved="handleDashboardCreated"
    />

    <DashboardFormDialog
      v-model="editDashboardOpen"
      :account-id="accountId"
      :dashboard="editDashboardTarget"
    />

    <MpDialog
      v-model="expandedWidgetOpen"
      size="lg"
      flush
      eyebrow="Expanded widget"
      :title="expandedWidget?.title ?? ''"
    >
      <div v-if="expandedWidget" class="dashboard-widget-expand__body">
        <DashboardWidgetCard
          :account-id="accountId"
          :widget="expandedWidget"
          :filters="activeDashboard?.filters ?? defaultDashboardFilters"
          :show-actions="false"
        />
      </div>
    </MpDialog>

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
.dashboard-hub {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-24);
}

.dashboard-hub__error-detail {
  margin: 0;
  white-space: pre-wrap;
}

/* The expanded-widget stage. MpDialog is `flush` here, so this div is the frame:
   it owns the widget's height and tint, which no dialog shell can decide. */
.dashboard-widget-expand__body {
  height: min(68vh, 620px);
  min-height: 360px;
  padding: var(--mp-space-16);
  background: var(--surface-secondary);
}

.dashboard-widget-expand__body :deep(.dashboard-widget-card) {
  height: 100%;
}

/* Bleeds over the .mp-main-shell inset (32/36 · 28 ≤1024 · 22 ≤640) so the
   band spans the frame edge-to-edge; the values mirror the shell constants. */
.dashboard-page-header {
  margin: -32px -36px var(--mp-space-12);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-primary);
}

/* Cancel the desktop grid library's 20px top gutter so the hub's 24px gap
   is the real header→grid rhythm. The mobile list has no gutter to cancel. */
@media (min-width: 1280px) {
  :deep(.dashboard-grid) {
    margin-top: -20px;
  }
}

@media (max-width: 1024px) {
  .dashboard-page-header {
    margin: -28px -28px var(--mp-space-10);
  }
}

@media (max-width: $mp-layout-breakpointCompact) {
  .dashboard-page-header {
    margin: -22px -22px var(--mp-space-8);
  }
}

.dashboard-page-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  padding: var(--mp-space-10) 36px;
}

@media (max-width: 1024px) {
  .dashboard-page-header__top {
    padding: var(--mp-space-10) 28px;
  }
}

@media (max-width: $mp-layout-breakpointCompact) {
  .dashboard-page-header__top {
    padding: var(--mp-space-8) 22px;
  }
}

.dashboard-page-header__heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dashboard-page-header__eyebrow {
  /* Sits flush with the h1: fav button + title-area gap + switcher inset */
  margin-left: calc(var(--mp-space-28) + var(--mp-space-4) + var(--mp-space-6));
  margin-bottom: 1px;
  color: var(--muted);
  line-height: 1.2;
}

.dashboard-page-header__title-area {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  min-width: 0;
}

.dashboard-page-header__fav {
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  border-radius: var(--mp-component-chip-radius);
  cursor: pointer;
  color: var(--muted);
  appearance: none;
  flex-shrink: 0;
  transition: color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.dashboard-page-header__fav:hover {
  background: var(--surface-secondary);
}

.dashboard-page-header__fav--active {
  /* Match the favorite-star color used in the dashboard switcher list (color="warning") */
  color: rgb(var(--v-theme-warning));
}

.dashboard-page-header__fav--active :deep(.v-icon svg) {
  fill: currentColor;
}

.dashboard-page-header__fav:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.dashboard-title-switcher {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  padding: var(--mp-space-2) var(--mp-space-6);
  border: 1px solid transparent;
  border-radius: var(--mp-component-chip-radius);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font: inherit;
  appearance: none;
}

.dashboard-title-switcher:hover {
  background: var(--surface-secondary);
  border-color: var(--border-subtle);
}

.dashboard-title-switcher:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.dashboard-page-header__h1 {
  margin: 0;
  font-size: var(--mp-text-pageTitle-fontSize);
  font-weight: var(--mp-text-pageTitle-fontWeight);
  letter-spacing: var(--mp-text-pageTitle-letterSpacing);
  line-height: var(--mp-text-pageTitle-lineHeight);
  white-space: nowrap;
  font-feature-settings: 'ss01', 'cv11';
}

.dashboard-title-switcher__chevron {
  color: var(--muted);
}

.dashboard-page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  flex-shrink: 0;
}

.dashboard-page-header__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  padding: var(--mp-space-4) 36px;
  background: var(--surface-primary);
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 1024px) {
  .dashboard-page-header__filters {
    padding: var(--mp-space-4) 28px;
  }
}

@media (max-width: $mp-layout-breakpointCompact) {
  .dashboard-page-header__filters {
    padding: var(--mp-space-4) 22px;
  }
}

.dashboard-page-header__filters-left,
.dashboard-page-header__filters-right {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.dashboard-page-header__status {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  font-size: var(--mp-text-caption-fontSize);
  font-weight: var(--mp-text-caption-fontWeight);
  color: var(--muted);
  white-space: nowrap;
}

.dashboard-page-header__dot {
  width: var(--mp-space-8);
  height: var(--mp-space-8);
  flex-shrink: 0;
  border-radius: var(--mp-radius-full);
  background: var(--pos);
}

/* ── Rich action menu (Actions) — matches the global Create-new menu ── */
/* !important because the global .v-card.rounded-lg rule pins 16px with
   !important; the menu panel sits on the menu radius token instead. */
.v-card.mp-menu {
  border-color: var(--border-subtle);
  border-radius: var(--mp-component-menu-radius) !important;
  /* A rich two-line menu keeps a slightly deeper inset than the 4px plain-list
     popover inset. */
  padding: var(--mp-space-8);
  overflow: hidden;
}

.mp-menu__divider {
  margin: var(--mp-space-6);
  opacity: 0.6;
}

.mp-menu-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--mp-component-listItem-gap);
  width: 100%;
  /* Menu density: floors, not caps — these two-line rows grow past 36. */
  min-height: var(--mp-component-menu-itemHeight);
  padding: var(--mp-component-menu-itemPaddingBlock) var(--mp-component-listItem-paddingInline);
  border: 0;
  border-radius: var(--r-chip);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.mp-menu-row:hover:not(:disabled),
.mp-menu-row:focus-visible {
  background: var(--surface-secondary);
}

.mp-menu-row:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.mp-menu-row:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.mp-menu-row__icon {
  color: var(--text-primary);
  flex-shrink: 0;
}

.mp-menu-row__body {
  min-width: 0;
}

.mp-menu-row__body strong,
.mp-menu-row__body small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mp-menu-row__body strong {
  /* 14/12 — same two-line rhythm as the app bar's rich menu rows. */
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.3;
  color: var(--text-primary);
}

.mp-menu-row__body small {
  margin-top: var(--mp-space-2);
  color: var(--muted);
  font-size: var(--mp-fontSize-12);
}

.mp-menu-row--danger .mp-menu-row__icon,
.mp-menu-row--danger .mp-menu-row__body strong {
  color: rgb(var(--v-theme-error));
}

.mp-menu-row--danger:hover:not(:disabled) {
  background: var(--neg-soft);
}

.dashboard-date-menu {
  display: grid;
  grid-template-columns: 200px 1fr;
  overflow: hidden;
}

.dashboard-date-menu__presets {
  padding: var(--mp-space-8);
  border-right: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
}

.dashboard-date-menu__group {
  padding: var(--mp-space-10) var(--mp-space-8) var(--mp-space-4);
  color: var(--muted);
  font-size: var(--mp-text-metaLabel-fontSize);
  font-weight: var(--mp-text-metaLabel-fontWeight);
  letter-spacing: var(--mp-text-metaLabel-letterSpacing);
  text-transform: var(--mp-text-metaLabel-textTransform);
}

/* --muted is calibrated against the plain menu surface; this rail double-tints
   it, which pushes dark mode under AA. --text-secondary clears it without
   touching light's stronger --muted pass. */
.v-theme--maropostDark .dashboard-date-menu__group {
  color: var(--text-secondary);
}

.dashboard-date-menu__group:first-child {
  padding-top: var(--mp-space-4);
}

.dashboard-date-menu__preset {
  display: block;
  width: 100%;
  min-height: var(--mp-component-field-height-sm);
  padding: var(--mp-space-6) var(--mp-space-10);
  border: 0;
  border-radius: var(--mp-component-chip-radius);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font: inherit;
  font-size: var(--mp-fontSize-13);
  text-align: left;
  transition: background var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    color var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
}

.dashboard-date-menu__preset:hover {
  background: var(--surface-primary);
}

.dashboard-date-menu__preset--active,
.dashboard-date-menu__preset--active:hover {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: var(--mp-fontWeight-semibold);
}

.dashboard-date-menu__preset:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.dashboard-date-menu__body {
  display: flex;
  flex-direction: column;
  padding: var(--mp-component-card-padding);
}

.dashboard-date-menu__note {
  flex: 0 0 auto;
}

.dashboard-date-menu__actions {
  margin-top: auto;
  padding-top: var(--mp-space-16);
}

.dashboard-switcher-card {
  border-color: var(--border-subtle);
}

.dashboard-switcher-card__search {
  border-bottom: 1px solid var(--border-subtle);
}

@media (max-width: $mp-layout-breakpointSplit) {
  .dashboard-page-header__top {
    flex-direction: column;
    align-items: stretch;
    gap: var(--mp-space-8);
  }

  .dashboard-page-header__actions {
    width: 100%;
    overflow-x: auto;
  }

  .dashboard-page-header__filters {
    flex-direction: column;
    align-items: stretch;
    gap: var(--mp-space-6);
  }

  .dashboard-date-menu {
    grid-template-columns: 1fr;
    width: min(92vw, 760px);
  }

  .dashboard-date-menu__presets {
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
    max-height: 230px;
    overflow: auto;
  }

}
</style>
