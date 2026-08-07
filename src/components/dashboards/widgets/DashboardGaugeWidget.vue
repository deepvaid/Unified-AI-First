<script setup lang="ts">
// Dotted goal gauge widget (Overview v2): centered progress ring + optional
// footer stat row. Flat (Polaris) themes drive the arc colour and drop the
// gradient shading.
import { computed, inject, unref } from 'vue'
import DtGauge from '../dotted/DtGauge.vue'
import { CHART_PALETTE_OVERRIDE, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import type { DashboardGaugeData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardGaugeData
}>()

const { theme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
// Exploration options drive the arc from their treatment; legacy themes keep the
// flatMarks rule.
const treatment = computed(() => resolvedTheme.value.treatment)
const legacyFlat = computed(() => !!resolvedTheme.value.flatMarks)
const flat = computed(() => (treatment.value ? treatment.value.svg.shade === 'flat' : legacyFlat.value))
const arcColor = computed(() => (
  treatment.value
    ? resolvedTheme.value.series[0]
    : (legacyFlat.value ? resolvedTheme.value.series[0] : undefined)
))
</script>

<template>
  <div class="gauge-widget">
    <div class="gauge-widget__center">
      <DtGauge
        :pct="data.pct"
        :center-value="data.centerValue"
        :center-caption="data.centerCaption"
        :sweep="data.arc === 'three-quarter' ? 270 : 360"
        :color="arcColor"
        :flat="flat"
      />
    </div>
    <div v-if="data.footerStats?.length" class="gauge-widget__footer">
      <div v-for="stat in data.footerStats" :key="stat.label" class="gauge-widget__stat">
        <span class="gauge-widget__stat-label">{{ stat.label }}</span>
        <span class="gauge-widget__stat-value">{{ stat.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gauge-widget {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.gauge-widget__center {
  display: flex;
  justify-content: center;
  flex: 1;
  align-items: center;
}

.gauge-widget__footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: 24px;
}

.gauge-widget__stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.gauge-widget__stat-label {
  font-size: 11.5px;
  color: var(--muted);
  white-space: nowrap;
}

.gauge-widget__stat-value {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
</style>
