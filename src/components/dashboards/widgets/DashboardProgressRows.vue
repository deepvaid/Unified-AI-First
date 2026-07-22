<script setup lang="ts">
import { computed, inject, unref } from 'vue'
import { activeChartTheme, CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'

defineProps<{
  rows: { label: string; formatted: string; percent: number }[]
}>()

const override = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(override) ?? activeChartTheme.value)

function fillColor(index: number): string {
  const series = theme.value.series
  return series[index % series.length]!
}
</script>

<template>
  <div class="progress-rows">
    <div v-for="(row, i) in rows" :key="i" class="progress-rows__row">
      <div class="progress-rows__head">
        <span class="progress-rows__label">{{ row.label }}</span>
        <span class="progress-rows__value">{{ row.formatted }}</span>
      </div>
      <div class="progress-rows__track">
        <div
          class="progress-rows__fill"
          :style="{ width: `${Math.min(100, Math.max(0, row.percent))}%`, background: fillColor(i) }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.progress-rows__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.progress-rows__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.progress-rows__value {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.progress-rows__track {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--ink) 6%, transparent);
  overflow: hidden;
}

.progress-rows__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease-out;
}
</style>
