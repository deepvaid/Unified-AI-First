<script setup lang="ts">
// eRFM Report — rebuilt from the crawl of /accounts/:accountId/erfm_report.
// See docs/rebuild/erfm-report/{AUDIT,FLOWS,PARITY}.md.
//
// The page compares two dates. Every section reads the same base/comparison
// pair, so moving either date moves all five sections together.
import { computed, defineAsyncComponent, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import ErfmMatrix, { type ErfmMatrixCell } from '@/components/analytics/ErfmMatrix.vue'
import ErfmGroupDrawer from '@/components/analytics/ErfmGroupDrawer.vue'
import ErfmSettingsDrawer from '@/components/analytics/ErfmSettingsDrawer.vue'
import { chartLegendOptions, useChartTheme } from '@/plugins/chartPalette'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatNumber, formatPercent } from '@/utils/formatNumber'
import {
  ERFM_ENGAGEMENT_LEVELS,
  ERFM_GROUP_KEYS,
  ERFM_MAX_HISTORY_MONTHS,
  ERFM_REVENUE_PER_CONTACT,
  useAnalyticsStore,
  type ErfmGroupKey,
  type ErfmSettings,
} from '@/stores/useAnalytics'

const store = useAnalyticsStore()
const {
  erfmBaseDate,
  erfmComparisonDate,
  erfmBaseMatrix,
  erfmComparisonMatrix,
  erfmTransitions,
  erfmPerformanceBase,
  erfmPerformanceComparison,
  erfmGroupAliases,
  erfmSettings,
} = storeToRefs(store)

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { loading } = useInitialLoad()

const { palette, theme, applyChartTheme } = useChartTheme()

// Apex paints into a canvas, so it needs resolved colours — a `var()` string
// never resolves in a fillStyle. Vuetify's theme object already holds hexes.
const vuetifyTheme = useTheme()
const negativeColor = computed(() => vuetifyTheme.current.value.colors.error)

const ApexChart = defineAsyncComponent({
  loader: async () => (await import('vue3-apexcharts')).default,
  suspensible: false,
})

// ─── Group + engagement labels ──────────────────────────────────
const groupLabels = computed(() => ERFM_GROUP_KEYS.map((k) => erfmGroupAliases.value[k]))
const engagementLevels = [...ERFM_ENGAGEMENT_LEVELS]

function labelFor(key: ErfmGroupKey): string {
  return erfmGroupAliases.value[key]
}

// ─── §A Date window ─────────────────────────────────────────────
const baseDateMenu = ref(false)
const comparisonDateMenu = ref(false)

const iso = (d: Date) => d.toISOString().slice(0, 10)

function shiftDays(isoDate: string, days: number): Date {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d
}

function shiftMonths(isoDate: string, months: number): Date {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setMonth(d.getMonth() + months)
  return d
}

/** Base must precede the comparison date, and history stops 13 months back. */
const baseDateBounds = computed(() => ({
  min: iso(shiftMonths(erfmComparisonDate.value, -ERFM_MAX_HISTORY_MONTHS)),
  max: iso(shiftDays(erfmComparisonDate.value, -1)),
}))

const comparisonDateBounds = computed(() => ({
  min: iso(shiftDays(erfmBaseDate.value, 1)),
  max: iso(new Date()),
}))

// v-date-picker works in Date objects; the store keeps ISO strings.
const basePickerDate = computed({
  get: () => new Date(`${erfmBaseDate.value}T00:00:00`),
  set: (d: Date) => {
    store.setErfmDates(iso(d), erfmComparisonDate.value)
    baseDateMenu.value = false
  },
})

const comparisonPickerDate = computed({
  get: () => new Date(`${erfmComparisonDate.value}T00:00:00`),
  set: (d: Date) => {
    store.setErfmDates(erfmBaseDate.value, iso(d))
    comparisonDateMenu.value = false
  },
})

const windowDays = computed(() => {
  const a = new Date(`${erfmBaseDate.value}T00:00:00`).getTime()
  const b = new Date(`${erfmComparisonDate.value}T00:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
})

// ─── §B RFM & Engagement matrix ─────────────────────────────────
const insightMetric = ref<'contacts' | 'revenue'>('contacts')

const INSIGHT_METRICS = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'revenue', label: 'Revenue' },
]

/** Applies the metric to a raw contacts grid. */
function project(matrix: Record<ErfmGroupKey, number[]>): number[][] {
  return ERFM_GROUP_KEYS.map((key) => {
    const row = matrix[key]
    if (insightMetric.value === 'contacts') return [...row]
    return row.map((contacts) => contacts * ERFM_REVENUE_PER_CONTACT[key])
  })
}

const insightCells = computed(() => project(erfmComparisonMatrix.value))
const insightBaseCells = computed(() => project(erfmBaseMatrix.value))

/** Cell-level percentage change, base → comparison. Null when the base cell is empty. */
const insightDeltas = computed(() =>
  insightCells.value.map((row, r) =>
    row.map((value, c) => {
      const base = insightBaseCells.value[r]?.[c] ?? 0
      if (base === 0) return null
      return ((value - base) / base) * 100
    })
  )
)

const selectedCell = ref<ErfmMatrixCell | null>(null)

function onCellSelect(cell: ErfmMatrixCell) {
  selectedCell.value = cell
  segmentGroup.value = ERFM_GROUP_KEYS[cell.row] ?? null
  segmentEngagement.value = cell.col === engagementLevels.length ? 'Total' : engagementLevels[cell.col] ?? null
}

// ─── §B Create Segment ──────────────────────────────────────────
const segmentGroup = ref<ErfmGroupKey | null>(null)
const segmentEngagement = ref<string | null>(null)

const groupOptions = computed(() =>
  ERFM_GROUP_KEYS.map((key) => ({ value: key, title: erfmGroupAliases.value[key] }))
)

/** `Total` is a roll-up of every level, and upstream offers it as a choice. */
const engagementOptions = computed(() => [...engagementLevels, 'Total'])

const canCreateSegment = computed(() => !!segmentGroup.value && !!segmentEngagement.value)

function resetSegment() {
  segmentGroup.value = null
  segmentEngagement.value = null
  selectedCell.value = null
}

/**
 * Upstream hands a prefilled definition to the next-gen segment builder rather
 * than saving a segment here, so this navigates too — with the cohort and the
 * snapshot date carried in the query.
 */
function createSegment() {
  if (!canCreateSegment.value) return
  const name = `Segment ${labelFor(segmentGroup.value!)} and ${segmentEngagement.value} on ${erfmComparisonDate.value}`
  toast.success('Segment definition prefilled', { title: name })
  router.push({
    name: 'CreateSegmentNextGen',
    params: { accountId: route.params.accountId },
    query: {
      rfmGroup: segmentGroup.value!,
      engagement: segmentEngagement.value!,
      onDate: erfmComparisonDate.value,
      name,
    },
  })
}

// ─── §C Compare distribution ────────────────────────────────────
const distributionMode = ref<'contacts' | 'delta' | 'percent'>('contacts')

const DISTRIBUTION_MODES = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'delta', label: 'Added or dropped' },
  { value: 'percent', label: 'Percentage change' },
]

const rowTotal = (matrix: Record<ErfmGroupKey, number[]>, key: ErfmGroupKey) =>
  matrix[key].reduce((sum, v) => sum + v, 0)

const distribution = computed(() =>
  ERFM_GROUP_KEYS.map((key) => {
    const baseTotal = rowTotal(erfmBaseMatrix.value, key)
    const comparisonTotal = rowTotal(erfmComparisonMatrix.value, key)
    return {
      key,
      label: erfmGroupAliases.value[key],
      baseTotal,
      comparisonTotal,
      delta: comparisonTotal - baseTotal,
      percent: baseTotal === 0 ? 0 : ((comparisonTotal - baseTotal) / baseTotal) * 100,
    }
  })
)

const totalContacts = computed(() => ({
  base: distribution.value.reduce((s, d) => s + d.baseTotal, 0),
  comparison: distribution.value.reduce((s, d) => s + d.comparisonTotal, 0),
}))

/**
 * Bars stay in chronological order, but the *comparison* snapshot is the subject
 * of the report, so it takes the palette's lead colour and the base date takes
 * the muted one — the theme's own blue-vs-grey pairing, the way round that
 * emphasises the later date.
 */
const datedSeriesColors = computed<string[]>(() => {
  const [lead, muted] = palette.value
  return [muted ?? lead ?? '#D2D2D2', lead ?? '#1E9BE3']
})

const distributionSeries = computed(() => {
  if (distributionMode.value === 'contacts') {
    return [
      { name: erfmBaseDate.value, data: distribution.value.map((d) => d.baseTotal) },
      { name: erfmComparisonDate.value, data: distribution.value.map((d) => d.comparisonTotal) },
    ]
  }
  if (distributionMode.value === 'delta') {
    return [{ name: 'Net change in contacts', data: distribution.value.map((d) => d.delta) }]
  }
  return [{ name: 'Change', data: distribution.value.map((d) => Number(d.percent.toFixed(2))) }]
})

const distributionOptions = computed<ApexOptions>(() => {
  const chrome = theme.value.chrome
  const isPercent = distributionMode.value === 'percent'
  const isDiverging = distributionMode.value !== 'contacts'
  return {
    ...applyChartTheme.value(),
    ...(distributionMode.value === 'contacts' ? { colors: datedSeriesColors.value } : {}),
    chart: { ...applyChartTheme.value().chart, type: 'bar', stacked: false },
    plotOptions: {
      bar: {
        columnWidth: distributionMode.value === 'contacts' ? '62%' : '42%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        // Apex reads `colors.backgroundBarColors` unconditionally, so both keys
        // have to be present even when there is no negative range to paint.
        colors: {
          ranges: isDiverging ? [{ from: -1e12, to: -0.0001, color: negativeColor.value }] : [],
          backgroundBarColors: [],
        },
      },
    },
    dataLabels: { enabled: false },
    xaxis: { ...applyChartTheme.value().xaxis, categories: distribution.value.map((d) => d.label) },
    yaxis: {
      ...applyChartTheme.value().yaxis,
      labels: {
        style: { colors: chrome.axisLabel, fontSize: '12px' },
        formatter: (v: number) => (isPercent ? formatPercent(v, 0) : formatNumber(v)),
      },
    },
    tooltip: {
      ...applyChartTheme.value().tooltip,
      y: { formatter: (v: number) => (isPercent ? formatPercent(v, 1) : formatNumber(v)) },
    },
    // Two dated series need a key; the single-series modes name themselves on the
    // axis, so a one-item legend would just be noise.
    legend:
      distributionMode.value === 'contacts'
        ? chartLegendOptions(datedSeriesColors.value, chrome, 'top')
        : { show: false },
  }
})

// ─── §D Group change over time ──────────────────────────────────
const groupChangeView = ref<'matrix' | 'table'>('matrix')

const GROUP_CHANGE_VIEWS = [
  { value: 'matrix', label: 'Matrix' },
  { value: 'table', label: 'Table' },
]

const transitionCells = computed(() =>
  ERFM_GROUP_KEYS.map((from) => ERFM_GROUP_KEYS.map((to) => erfmTransitions.value[from][to]))
)

/** Numeric cells are pre-formatted, so `cellProps` carries the tabular-nums
 *  class instead of a per-column slot template. Sorting is off upstream too. */
const NUM_CELL = { cellProps: { class: 'num' }, align: 'end' as const, sortable: false }

const transitionHeaders = computed(() => [
  { title: 'From / To', key: 'group', sortable: false },
  ...ERFM_GROUP_KEYS.map((key) => ({ title: erfmGroupAliases.value[key], key, ...NUM_CELL })),
])

const transitionRows = computed(() =>
  ERFM_GROUP_KEYS.map((from) => ({
    group: erfmGroupAliases.value[from],
    ...(Object.fromEntries(
      ERFM_GROUP_KEYS.map((to) => [to, formatNumber(erfmTransitions.value[from][to])])
    ) as Record<ErfmGroupKey, string>),
  }))
)

/** Contacts acquired between the two dates — they enter as Inactive, so the
 *  transition columns don't add up to the comparison totals without them. */
const acquiredContacts = computed(() => totalContacts.value.comparison - totalContacts.value.base)

// ─── §E Average performance ─────────────────────────────────────
const performanceDate = ref<'base' | 'comparison'>('base')

const PERFORMANCE_DATES = computed(() => [
  { value: 'base', label: 'Base date' },
  { value: 'comparison', label: 'Comparison date' },
])

const performanceHeaders = computed(() => [
  { title: 'Group', key: 'group', sortable: false },
  { title: 'Days since purchase', key: 'daysSincePurchase', ...NUM_CELL },
  { title: 'Total orders', key: 'totalOrders', ...NUM_CELL },
  { title: 'Placed order revenue', key: 'placedOrderRevenue', ...NUM_CELL },
  { title: 'Abandoned carts', key: 'abandonedCarts', ...NUM_CELL },
  { title: 'Site visits', key: 'siteVisits', ...NUM_CELL },
  { title: 'Click rate', key: 'clickRate', ...NUM_CELL },
])

const performanceRows = computed(() => {
  const source =
    performanceDate.value === 'base' ? erfmPerformanceBase.value : erfmPerformanceComparison.value
  return source.map((row) => ({
    group: erfmGroupAliases.value[row.group],
    // `daysSincePurchase` is `'180+'` for the Inactive group upstream, so the
    // column carries a string as well as numbers — preserved deliberately.
    daysSincePurchase:
      typeof row.daysSincePurchase === 'number' ? row.daysSincePurchase.toFixed(1) : row.daysSincePurchase,
    totalOrders: row.totalOrders.toFixed(1),
    placedOrderRevenue: formatCurrency(row.placedOrderRevenue),
    abandonedCarts: row.abandonedCarts.toFixed(2),
    siteVisits: row.siteVisits.toFixed(1),
    clickRate: formatPercent(row.clickRate, 1),
  }))
})

const performanceDateLabel = computed(() =>
  performanceDate.value === 'base' ? erfmBaseDate.value : erfmComparisonDate.value
)

// ─── Header drawers ─────────────────────────────────────────────
const groupDrawerOpen = ref(false)
const settingsDrawerOpen = ref(false)

function onGroupsSaved(next: Record<ErfmGroupKey, string>) {
  store.saveErfmGroupAliases(next)
  toast.success('Group names updated')
}

function onSettingsSaved(next: ErfmSettings) {
  store.saveErfmSettings(next)
  toast.success('The report has been recalculated for the current period.', {
    title: 'RFM definitions applied',
  })
}

const hasData = computed(() => totalContacts.value.comparison > 0)
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      title="eRFM Report"
      subtitle="Engagement, Recency, Frequency and Monetary"
    >
      <template #actions>
        <v-btn
          variant="outlined"
          prepend-icon="list"
          class="text-none"
          @click="groupDrawerOpen = true"
        >
          Groups
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="settings"
          class="text-none"
          @click="settingsDrawerOpen = true"
        >
          Settings
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- §A Date window -->
    <v-card variant="flat" border rounded="lg" class="erfm-card">
      <MpSectionHeader title="Compare RFM groups as of" />
      <p class="text-body-2 text-medium-emphasis mb-4">
        Pick two dates to see how many contacts sat in each group, and what moved between them.
        History goes back {{ ERFM_MAX_HISTORY_MONTHS }} months.
      </p>

      <div class="erfm-dates">
        <v-menu v-model="baseDateMenu" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-text-field
              v-bind="menuProps"
              :model-value="erfmBaseDate"
              label="Base date"
              readonly
              append-inner-icon="calendar"
              class="erfm-dates__field"
            />
          </template>
          <v-date-picker
            v-model="basePickerDate"
            :min="baseDateBounds.min"
            :max="baseDateBounds.max"
            show-adjacent-months
          />
        </v-menu>

        <span class="erfm-dates__vs text-body-2 text-medium-emphasis" aria-hidden="true">vs</span>

        <v-menu v-model="comparisonDateMenu" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-text-field
              v-bind="menuProps"
              :model-value="erfmComparisonDate"
              label="Comparison date"
              readonly
              append-inner-icon="calendar"
              class="erfm-dates__field"
            />
          </template>
          <v-date-picker
            v-model="comparisonPickerDate"
            :min="comparisonDateBounds.min"
            :max="comparisonDateBounds.max"
            show-adjacent-months
          />
        </v-menu>

        <span class="erfm-dates__span text-caption text-medium-emphasis num">
          {{ formatNumber(windowDays) }} days apart
        </span>
      </div>
    </v-card>

    <template v-if="hasData">
      <!-- §B RFM & engagement insights -->
      <v-card variant="flat" border rounded="lg" class="erfm-card">
        <div class="erfm-head">
          <MpSectionHeader title="RFM &amp; engagement insights" />
          <div class="erfm-head__control">
  <MpSegmentedControl
              v-model="insightMetric"
              :items="INSIGHT_METRICS"
              size="sm"
              ariaLabel="Matrix metric"
            />
          </div>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Contacts at {{ erfmComparisonDate }}, with the change since {{ erfmBaseDate }}.
          Choose a cell — or the two menus below — to build that cohort as a segment.
        </p>

        <MpTableSkeleton v-if="loading" :rows="6" :columns="7" />
        <ErfmMatrix
          v-else
          corner-label="Group"
          :row-labels="groupLabels"
          :col-labels="engagementLevels"
          :cells="insightCells"
          :secondary="insightDeltas"
          :unit="insightMetric === 'revenue' ? 'currency' : 'count'"
          :selected="selectedCell"
          show-totals
          selectable
          caption="RFM group by engagement level. Choose a cell to build that cohort as a segment."
          @select="onCellSelect"
        />

        <!-- Create segment -->
        <div class="erfm-create">
          <MpSectionHeader title="Create segment" :heading-level="3" />
          <p class="text-body-2 text-medium-emphasis mb-4">
            Picks the contacts in one group at one engagement level, as at {{ erfmComparisonDate }}.
          </p>
          <MpFormGrid :cols="2">
            <v-select
              v-model="segmentGroup"
              :items="groupOptions"
              label="RFM group *"
              placeholder="Choose a group"
            />
            <v-select
              v-model="segmentEngagement"
              :items="engagementOptions"
              label="Engagement level *"
              placeholder="Choose a level"
            />
          </MpFormGrid>
          <div class="erfm-create__actions">
            <v-btn
              variant="text"
              class="text-none"
              :disabled="!segmentGroup && !segmentEngagement"
              @click="resetSegment"
            >
              Reset
            </v-btn>
            <v-btn
              variant="flat"
              color="primary"
              class="text-none"
              prepend-icon="plus"
              :disabled="!canCreateSegment"
              @click="createSegment"
            >
              Create segment
            </v-btn>
          </div>
        </div>
      </v-card>

      <!-- §C Compare distribution -->
      <v-card variant="flat" border rounded="lg" class="erfm-card">
        <div class="erfm-head">
          <MpSectionHeader title="Compare distribution of contacts" />
          <div class="erfm-head__control">
  <MpSegmentedControl
              v-model="distributionMode"
              :items="DISTRIBUTION_MODES"
              size="sm"
              ariaLabel="Distribution measure"
            />
          </div>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ formatNumber(totalContacts.base) }} contacts at {{ erfmBaseDate }} →
          {{ formatNumber(totalContacts.comparison) }} at {{ erfmComparisonDate }}.
        </p>

        <MpTableSkeleton v-if="loading" :rows="5" :columns="5" :show-header="false" />
        <div v-else class="erfm-chart">
          <!-- Keyed per mode: Apex's `updateOptions` drops function properties, so
               a switched mode kept the previous axis formatter. Remounting is the
               same fix upstream applies with its own `chartKey`. -->
          <ApexChart
            :key="distributionMode"
            type="bar"
            height="100%"
            width="100%"
            :options="distributionOptions"
            :series="distributionSeries"
          />
        </div>
      </v-card>

      <!-- §D Group change over time -->
      <v-card variant="flat" border rounded="lg" class="erfm-card">
        <div class="erfm-head">
          <MpSectionHeader title="Group change over time" />
          <div class="erfm-head__control">
  <MpSegmentedControl
              v-model="groupChangeView"
              :items="GROUP_CHANGE_VIEWS"
              size="sm"
              ariaLabel="Group change view"
            />
          </div>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Where each group's contacts sat on {{ erfmBaseDate }}, and where they sat on
          {{ erfmComparisonDate }}. A further {{ formatNumber(acquiredContacts) }} contacts were
          acquired in between and enter as {{ labelFor('inactive') }}.
        </p>

        <MpTableSkeleton v-if="loading" :rows="5" :columns="6" />
        <ErfmMatrix
          v-else-if="groupChangeView === 'matrix'"
          corner-label="From / To"
          :row-labels="groupLabels"
          :col-labels="groupLabels"
          :cells="transitionCells"
          caption="Contacts moving from each base-date group to each comparison-date group."
        />
        <v-data-table
          v-else
          :headers="transitionHeaders"
          :items="transitionRows"
          density="comfortable"
          hide-default-footer
          :items-per-page="-1"
        />
      </v-card>

      <!-- §E Average performance -->
      <v-card variant="flat" border rounded="lg" class="erfm-card">
        <div class="erfm-head">
          <MpSectionHeader title="Average performance" />
          <div class="erfm-head__control">
  <MpSegmentedControl
              v-model="performanceDate"
              :items="PERFORMANCE_DATES"
              size="sm"
              ariaLabel="Performance snapshot date"
            />
          </div>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Per-contact averages for each group, as at {{ performanceDateLabel }}.
        </p>

        <MpTableSkeleton v-if="loading" :rows="5" :columns="7" />
        <v-data-table
          v-else
          :headers="performanceHeaders"
          :items="performanceRows"
          density="comfortable"
          hide-default-footer
          :items-per-page="-1"
        />
      </v-card>
    </template>

    <MpEmptyState
      v-else
      icon="scatter-chart"
      title="No RFM data for these dates"
      description="Groups are calculated from order history. Pick an earlier base date, or check back once this account has orders in the window."
    />

    <ErfmGroupDrawer
      v-model="groupDrawerOpen"
      :aliases="erfmGroupAliases"
      @save="onGroupsSaved"
    />
    <ErfmSettingsDrawer
      v-model="settingsDrawerOpen"
      :settings="erfmSettings"
      @save="onSettingsSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.erfm-card {
  padding: var(--mp-component-card-padding);
}

/* MpSectionHeader's root has no flex-wrap and its actions slot is flex-shrink-0,
   so a three-segment control overflows the card below ~480px. Pairing the title
   and the control in a wrapping row here keeps that fix local to this page —
   the shared component's behaviour is logged in GAPS.md instead. */
.erfm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--mp-space-12);
}

.erfm-head > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

/* A three-segment control is wider than a 375px card's inner width even on its
   own line, so it scrolls in place rather than being clipped or truncated. */
.erfm-head__control {
  max-width: 100%;
  overflow-x: auto;
  flex-shrink: 0;
  /* Keeps the focus ring on the active segment from being clipped. */
  padding: var(--mp-space-2);
  margin: calc(-1 * var(--mp-space-2));
}

.erfm-dates {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--mp-space-12);
}

.erfm-dates__field {
  width: var(--mp-component-menu-minWidth);
  flex: 0 1 var(--mp-component-menu-minWidth);
}

.erfm-dates__vs {
  /* Sits on the input box, not the label above it. */
  padding-top: calc(var(--mp-component-field-labelHeight) + var(--mp-component-field-labelGap) + var(--mp-space-10));
}

.erfm-dates__span {
  padding-top: calc(var(--mp-component-field-labelHeight) + var(--mp-component-field-labelGap) + var(--mp-space-12));
}

/* Once the two fields stack, an inline "vs" lands beside the base date and reads
   as part of it — the field labels already carry the relationship — and the
   "days apart" note no longer has an input box to line up with. */
@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .erfm-dates__vs {
    display: none;
  }

  .erfm-dates__span {
    flex: 1 0 100%;
    padding-top: 0;
  }
}

/* The create-segment block is a nested region of the insights card, so it gets
   the nested radius and the card's own inset as its separation. */
.erfm-create {
  margin-top: var(--mp-component-card-gap);
  padding-top: var(--mp-component-card-padding);
  border-top: 1px solid var(--border-subtle);
}

.erfm-create__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-space-8);
  margin-top: var(--mp-component-field-groupGap);
}

/* No chart-height token exists yet; this is the one literal left on the page
   (proposed: component.chart.height). */
.erfm-chart {
  min-height: 320px;
  height: 320px;
}
</style>
