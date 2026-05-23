<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import type { ApexOptions } from 'apexcharts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

const ApexChart = defineAsyncComponent({
  loader: async () => (await import('vue3-apexcharts')).default,
})

const store = useMerchandisingStore()

type RangePreset = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'month_to_date' | 'year_to_date'

const rangePresets: Array<{ title: string; value: RangePreset }> = [
  { title: 'Last 7 days', value: 'last_7_days' },
  { title: 'Last 30 days', value: 'last_30_days' },
  { title: 'Last 90 days', value: 'last_90_days' },
  { title: 'Month to date', value: 'month_to_date' },
  { title: 'Year to date', value: 'year_to_date' },
]

const activeRange = ref<RangePreset>('last_30_days')
const activeRangeLabel = computed(
  () => rangePresets.find((r) => r.value === activeRange.value)?.title ?? 'Last 30 days',
)
const dateMenuOpen = ref(false)

function setRange(value: RangePreset) {
  activeRange.value = value
  dateMenuOpen.value = false
}

const analytics = computed(() => store.analytics)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function trimmedTrend(series: typeof analytics.value.revenueTrend) {
  // Reduce series for shorter ranges (presentation only)
  const range = activeRange.value
  if (range === 'last_7_days') return series.slice(-7)
  if (range === 'last_90_days') return [...series, ...series.slice(-60)]
  return series
}

const trendSeries = computed(() => trimmedTrend(analytics.value.revenueTrend))

const lineChartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    parentHeightOffset: 0,
  },
  stroke: { curve: 'smooth', width: [2.5, 2] },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.28,
      opacityTo: 0.02,
      stops: [0, 90, 100],
    },
  },
  dataLabels: { enabled: false },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    markers: { size: 6 },
    fontWeight: 600,
  },
  colors: ['rgb(var(--v-theme-primary))', 'rgb(var(--v-theme-secondary))'],
  xaxis: {
    type: 'datetime',
    categories: trendSeries.value.map((d) => d.date),
    labels: { style: { colors: 'rgba(0,0,0,0.55)' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      formatter: (v: number) => `$${(v / 1000).toFixed(1)}k`,
      style: { colors: 'rgba(0,0,0,0.55)' },
    },
  },
  grid: { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 4 },
  tooltip: {
    shared: true,
    intersect: false,
    y: { formatter: (v: number) => formatCurrency(v) },
  },
}))

const lineChartSeries = computed(() => [
  { name: 'Total revenue', data: trendSeries.value.map((d) => d.total) },
  { name: 'Findify-driven', data: trendSeries.value.map((d) => d.findify) },
])

const donutChartOptions = computed<ApexOptions>(() => ({
  chart: { type: 'donut', fontFamily: 'inherit', parentHeightOffset: 0 },
  labels: analytics.value.contribution.map((c) => c.label),
  colors: ['rgb(var(--v-theme-primary))', 'rgba(var(--v-theme-on-surface), 0.16)'],
  legend: {
    position: 'bottom',
    fontWeight: 600,
    markers: { size: 6 },
  },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          name: { fontSize: '12px', color: 'rgba(0,0,0,0.55)' },
          value: {
            fontSize: '22px',
            fontWeight: 700,
            formatter: (v: string) => formatCurrency(Number(v)),
          },
          total: {
            show: true,
            label: 'Findify share',
            fontSize: '12px',
            color: 'rgba(0,0,0,0.55)',
            formatter: () => `${analytics.value.findifyShare}%`,
          },
        },
      },
    },
  },
  tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
}))

const donutChartSeries = computed(() => analytics.value.contribution.map((c) => c.value))
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Analytics"
      :subtitle="`How Merchandising Cloud is driving revenue for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-menu v-model="dateMenuOpen" :close-on-content-click="false" location="bottom end">
          <template #activator="{ props: activator }">
            <v-btn
              v-bind="activator"
              variant="outlined"
              class="text-none"
              prepend-icon="calendar-range"
              append-icon="chevron-down"
            >
              {{ activeRangeLabel }}
            </v-btn>
          </template>
          <v-list density="compact" min-width="220">
            <v-list-item
              v-for="preset in rangePresets"
              :key="preset.value"
              :active="preset.value === activeRange"
              :title="preset.title"
              @click="setRange(preset.value)"
            />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <!-- KPI row -->
    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Total revenue"
          :value="formatCurrency(analytics.totalRevenue)"
          icon="dollar-sign"
          color="primary"
          :trend="`+${analytics.totalRevenueTrend}%`"
          trend-positive
          sub-stat="vs. previous period"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Findify-driven revenue"
          :value="formatCurrency(analytics.findifyRevenue)"
          icon="sparkles"
          color="info"
          :trend="`+${analytics.findifyRevenueTrend}%`"
          trend-positive
          sub-stat="vs. previous period"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Findify share"
          :value="`${analytics.findifyShare}%`"
          icon="pie-chart"
          color="success"
          :trend="`+${analytics.findifyShareTrend} pp`"
          trend-positive
          sub-stat="of total revenue"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Avg. order value"
          :value="formatCurrency(analytics.avgOrderValue)"
          icon="receipt"
          color="warning"
          :trend="`+${analytics.avgOrderValueTrend}%`"
          trend-positive
          sub-stat="vs. previous period"
        />
      </v-col>
    </v-row>

    <!-- Charts row -->
    <v-row dense>
      <v-col cols="12" md="8">
        <v-card flat border rounded="lg" class="h-100">
          <div class="merch-chart__header">
            <div>
              <div class="text-subtitle-2 font-weight-bold">Revenue trend</div>
              <div class="text-caption text-medium-emphasis">Total revenue vs. Findify-driven · daily</div>
            </div>
          </div>
          <div class="merch-chart__body">
            <ApexChart
              :options="lineChartOptions"
              :series="lineChartSeries"
              type="area"
              height="320"
            />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card flat border rounded="lg" class="h-100">
          <div class="merch-chart__header">
            <div>
              <div class="text-subtitle-2 font-weight-bold">Findify contribution</div>
              <div class="text-caption text-medium-emphasis">Share of total revenue</div>
            </div>
          </div>
          <div class="merch-chart__body merch-chart__body--donut">
            <ApexChart
              :options="donutChartOptions"
              :series="donutChartSeries"
              type="donut"
              height="320"
            />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
.merch-chart__header {
  padding: 18px 20px 0 20px;
}

.merch-chart__body {
  padding: 8px 12px 12px 12px;
}

.merch-chart__body--donut {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
