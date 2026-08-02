<script setup lang="ts">
// Dotted donut widget (Overview v2): ring variant (stroked circle + centered
// figure, legend below) or pie variant (solid wedges, legend beside), with an
// optional footer stat row.
import { computed } from 'vue'
import DtRingDonut from '../dotted/DtRingDonut.vue'
import DtPieChart from '../dotted/DtPieChart.vue'
import DtLegendList, { type DtLegendRow } from '../dotted/DtLegendList.vue'
import { DOTTED_BLUES, DOTTED_PIE_BLUES } from '../dotted/dottedChartMath'
import type { DashboardDonutData } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardDonutData
}>()

const palette = computed(() => (props.data.variant === 'pie' ? DOTTED_PIE_BLUES : DOTTED_BLUES))
const values = computed(() => props.data.segments.map((segment) => segment.value))
const legendRows = computed<DtLegendRow[]>(() =>
  props.data.segments.map((segment, index) => ({
    label: segment.label,
    value: segment.formattedValue,
    color: palette.value[index % palette.value.length] ?? '#0092D4',
  })),
)
</script>

<template>
  <div class="donut-widget">
    <div v-if="data.variant === 'pie'" class="donut-widget__pie-block">
      <DtPieChart :values="values" label="Share by segment" />
      <DtLegendList :rows="legendRows" :gap="10" class="donut-widget__pie-legend" />
    </div>
    <template v-else>
      <div class="donut-widget__ring-block">
        <DtRingDonut
          :values="values"
          :center-value="data.centerValue"
          :center-caption="data.centerCaption"
        />
      </div>
      <DtLegendList :rows="legendRows" />
    </template>
    <div v-if="data.footerStats?.length" class="donut-widget__footer">
      <div v-for="stat in data.footerStats" :key="stat.label" class="donut-widget__stat">
        <span class="donut-widget__stat-label">{{ stat.label }}</span>
        <span class="donut-widget__stat-value">{{ stat.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donut-widget {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* The chart floats centered in the card's spare height instead of hugging the
   header and leaving a dead slab above the pinned footer. */
.donut-widget__ring-block {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1 1 auto;
}

.donut-widget__pie-block {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1 1 auto;
}

.donut-widget__pie-legend {
  flex: 1;
  min-width: 0;
}

.donut-widget__footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: 24px;
}

.donut-widget__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.donut-widget__stat-label {
  font-size: 11.5px;
  color: var(--muted);
  white-space: nowrap;
}

.donut-widget__stat-value {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
</style>
