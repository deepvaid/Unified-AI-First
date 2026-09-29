<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardChartWidget from '@/components/dashboards/widgets/DashboardChartWidget.vue'
import MpDialog from '@/components/MpDialog.vue'
import { useDaVinciTarget } from '@/composables/useDaVinciTarget'
import { useDaVinciToasts } from '@/composables/useDaVinciToasts'
import { addBlockerMessage, draftForMetric } from '@/davinci/widgetRequest'
import { getMetricDescriptor } from '@/stores/dashboards/metricCatalog'
import type { DashboardMetricId, DashboardMetricUnit, DashboardSeriesData } from '@/stores/dashboards/types'
import type { AddedWidgetRef } from '@/stores/useCopilot'
import { useDashboardsStore } from '@/stores/useDashboards'
import { downloadCsv } from '@/utils/exportCsv'

// A chart in the conversation, drawn by the SAME chart widget the dashboard uses — theme, axis,
// currency formatting, tooltips and dark mode all come with it. (This used to be a hand-drawn CSS
// chart: a y-axis fixed at 1250…250 whatever the data, labels detached from their bars, and three
// buttons that did nothing.)

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  labels: string[]
  /** `isComparison` marks a previous-period series (dashed, aligned day by day). */
  series: Array<{ name: string; data: number[]; isComparison?: boolean }>
  unit?: DashboardMetricUnit
  /** The dashboard metric this chart can be saved as. Absent = no Save button. */
  saveMetricId?: DashboardMetricId
  /** The widget it was saved as — persisted on the message so a remount can't save twice. */
  savedTo?: AddedWidgetRef | null
}>(), {
  title: 'Analysis Results',
  subtitle: undefined,
  unit: 'count',
  saveMetricId: undefined,
  savedTo: null,
})

const emit = defineEmits<{
  saved: [added: AddedWidgetRef]
}>()

const router = useRouter()
const dashboardsStore = useDashboardsStore()
const { pushToast } = useDaVinciToasts()
const { accountId, dashboard: target } = useDaVinciTarget()

const enlarged = ref(false)
const savedHere = ref<AddedWidgetRef | null>(null)

const data = computed<DashboardSeriesData>(() => ({
  kind: 'series',
  unit: props.unit,
  labels: props.labels,
  series: props.series,
}))
const hasData = computed(() => props.series.some((s) => !s.isComparison && s.data.some((value) => value > 0)))

// ── Save → a dashboard widget ────────────────────────────────────────────────
const metric = computed(() => (props.saveMetricId ? getMetricDescriptor(props.saveMetricId) : undefined))
const saveDraft = computed(() => {
  if (!metric.value || !target.value) return null
  return { ...draftForMetric(metric.value, target.value.id, 'Saved from a Da Vinci chart'), lastRefreshedAt: '' }
})
const blocker = computed(() => (saveDraft.value && accountId.value ? dashboardsStore.addWidgetBlocker(accountId.value, saveDraft.value) : null))

/** Saved — and the widget is still on that dashboard (a manual delete offers Save again). */
const isSaved = computed(() => {
  const ref = props.savedTo ?? savedHere.value
  if (!ref) return false
  return !!dashboardsStore.getDashboardById(ref.accountId, ref.dashboardId)?.widgets.some((widget) => widget.id === ref.widgetId)
})

// No Commerce on the account (or no dashboard) → there is nothing this chart could be saved as.
const canSave = computed(() => !!saveDraft.value && blocker.value?.reason !== 'unsupported')
const saveHint = computed(() => {
  if (isSaved.value) return `Added to ${(props.savedTo ?? savedHere.value)?.dashboardName ?? 'your dashboard'}`
  if (blocker.value) return addBlockerMessage(blocker.value)
  return 'Add to dashboard'
})

function save() {
  const draft = saveDraft.value
  const dashboard = target.value
  if (!draft || !dashboard || !accountId.value || isSaved.value || blocker.value) return
  const widget = dashboardsStore.addWidget(accountId.value, draft)
  if (!widget) {
    pushToast({ title: 'Couldn’t add the widget', sub: 'Try again from the dashboard’s Add widget menu.' })
    return
  }
  const added: AddedWidgetRef = {
    title: widget.title,
    dashboardName: dashboard.name,
    widgetId: widget.id,
    dashboardId: dashboard.id,
    accountId: accountId.value,
  }
  savedHere.value = added
  emit('saved', added)
  pushToast({
    title: `${widget.title} added to ${dashboard.name}`,
    sub: 'It follows the dashboard’s date range.',
    action: 'View',
    onAction: () => {
      void router.push({ name: 'DashboardDetail', params: { accountId: added.accountId, dashboardId: added.dashboardId } })
    },
  })
}

// ── Download → CSV ───────────────────────────────────────────────────────────
function download() {
  const rows = props.labels.map((label, index) => ({ label, values: props.series.map((s) => s.data[index] ?? 0) }))
  const filename = (props.title || 'chart').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chart'
  downloadCsv(filename, rows, [
    { title: 'Period', value: 'label' },
    ...props.series.map((s, index) => ({ title: s.name, value: (row: (typeof rows)[number]) => row.values[index] })),
  ])
}
</script>

<template>
  <v-card flat border rounded="lg" class="dv-chart-card">
    <div class="dv-chart-card__head">
      <div class="dv-chart-card__copy">
        <div class="dv-chart-card__title">{{ title }}</div>
        <div v-if="subtitle" class="dv-chart-card__subtitle">{{ subtitle }}</div>
      </div>
      <div class="dv-chart-card__actions">
        <v-btn
          v-if="canSave"
          icon
          size="28"
          variant="text"
          :aria-label="saveHint"
          :disabled="isSaved || !!blocker"
          @click="save"
        >
          <v-icon size="16">{{ isSaved ? 'check' : 'layout-dashboard' }}</v-icon>
          <v-tooltip activator="parent" location="top">{{ saveHint }}</v-tooltip>
        </v-btn>
        <v-btn icon size="28" variant="text" aria-label="Download CSV" @click="download">
          <v-icon size="16">download</v-icon>
          <v-tooltip activator="parent" location="top">Download CSV</v-tooltip>
        </v-btn>
        <v-btn icon size="28" variant="text" aria-label="Enlarge chart" @click="enlarged = true">
          <v-icon size="16">maximize-2</v-icon>
          <v-tooltip activator="parent" location="top">Enlarge</v-tooltip>
        </v-btn>
      </div>
    </div>

    <div class="dv-chart-card__body">
      <DashboardChartWidget v-if="hasData" :data="data" widget-type="timeseries" chart-variant="area" />
      <p v-else class="dv-chart-card__empty">Nothing to chart for this period yet.</p>
    </div>

    <MpDialog v-model="enlarged" size="lg" :title="title" :subtitle="subtitle" icon="chart-column">
      <DashboardChartWidget v-if="hasData" :data="data" widget-type="timeseries" chart-variant="area" :height="420" />
      <p v-else class="dv-chart-card__empty">Nothing to chart for this period yet.</p>
    </MpDialog>
  </v-card>
</template>

<style scoped>
.v-card.dv-chart-card {
  border-radius: var(--mp-radius-12) !important;
  background: rgb(var(--v-theme-surface));
}

.dv-chart-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-8);
  padding: var(--mp-space-14) var(--mp-space-14) var(--mp-space-4);
}

.dv-chart-card__copy {
  min-width: 0;
}

.dv-chart-card__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.25;
  color: rgb(var(--v-theme-on-surface));
}

.dv-chart-card__subtitle {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
}

.dv-chart-card__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--mp-space-2);
}

.dv-chart-card__body {
  padding: 0 var(--mp-space-14) var(--mp-space-12);
}

.dv-chart-card__empty {
  margin: 0;
  padding: var(--mp-space-24) 0;
  text-align: center;
  font-size: var(--mp-fontSize-13);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
