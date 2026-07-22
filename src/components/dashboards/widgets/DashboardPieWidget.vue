<script setup lang="ts">
import { computed, inject, unref } from 'vue'
import { activeChartTheme, CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'
import DashboardSegmentRing from './DashboardSegmentRing.vue'
import type { DashboardSeriesData } from '@/stores/dashboards/types'

const props = withDefaults(defineProps<{
  data: DashboardSeriesData
  height?: number
}>(), {
  height: 0,
})

const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(themeOverride) ?? activeChartTheme.value)

// Single-series pie data → ring segments (labels + first series values).
const segments = computed(() => {
  const values = (props.data.series[0]?.data ?? []) as number[]
  return props.data.labels.map((label, i) => ({ label, value: Number(values[i] ?? 0) }))
})

const total = computed(() => segments.value.reduce((sum, seg) => sum + Math.max(0, seg.value), 0))

const legend = computed(() =>
  segments.value.map((seg, i) => ({
    label: seg.label,
    color: theme.value.series[i % 6],
    pct: total.value > 0 ? Math.round((Math.max(0, seg.value) / total.value) * 100) : 0,
  })),
)

// Ring scales to the widget body height like the old Apex chart did (reserving room
// for the legend below), capped at a sensible max.
const ringSize = computed(() => {
  const available = props.height && props.height > 60 ? props.height : 240
  return Math.max(120, Math.min(available - 64, 240))
})
</script>

<template>
  <div class="dashboard-pie-widget">
    <div class="dashboard-pie-widget__ring">
      <DashboardSegmentRing :segments="segments" :size="ringSize" />
    </div>
    <ul class="dashboard-pie-widget__legend">
      <li v-for="item in legend" :key="item.label" class="dashboard-pie-widget__legend-item">
        <span class="dashboard-pie-widget__dot" :style="{ background: item.color }" />
        <span class="dashboard-pie-widget__legend-label">{{ item.label }}</span>
        <span class="dashboard-pie-widget__legend-pct">{{ item.pct }}%</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dashboard-pie-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-top: 4px;
}

.dashboard-pie-widget__ring {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.dashboard-pie-widget__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px 14px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.dashboard-pie-widget__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
}

.dashboard-pie-widget__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dashboard-pie-widget__legend-pct {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
</style>
