<script setup lang="ts">
import { activeChartPalette } from '@/plugins/chartPalette'

defineProps<{
  title?: string
  subtitle?: string
  bars: number[][]
  labels?: string[]
  seriesNames?: string[]
}>()

const colors = activeChartPalette

function getMax(bars: number[][]) {
  return Math.max(...bars.map(b => b.reduce((s, v) => s + v, 0)))
}
</script>

<template>
  <v-card variant="outlined" class="dv-chart-card">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-1">
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ title || 'Analysis Results' }}</div>
          <div v-if="subtitle" class="text-caption text-medium-emphasis mt-1">{{ subtitle }}</div>
        </div>
        <div class="d-flex ga-1">
          <v-btn icon size="28" variant="text"><v-icon size="16">save</v-icon></v-btn>
          <v-btn icon size="28" variant="text"><v-icon size="16">download</v-icon></v-btn>
          <v-btn icon size="28" variant="text"><v-icon size="16">maximize-2</v-icon></v-btn>
        </div>
      </div>

      <div class="chart-area mt-4 mb-3">
        <div class="chart-y-labels">
          <span v-for="v in [1250,1000,750,500,250]" :key="v">{{ v }}</span>
        </div>
        <div class="chart-bars-wrap">
          <div v-for="(bar, bi) in bars" :key="bi" class="chart-bar-col">
            <div
              v-for="(seg, si) in bar"
              :key="si"
              :style="{ height: (seg / getMax(bars)) * 120 + 'px', background: colors[si % colors.length], borderRadius: si === bar.length - 1 ? '2px 2px 0 0' : '0' }"
            />
          </div>
        </div>
      </div>

      <div v-if="labels" class="d-flex justify-space-between px-4 mb-3">
        <span v-for="l in labels" :key="l" class="chart-x-label text-medium-emphasis">{{ l }}</span>
      </div>

      <div v-if="seriesNames" class="d-flex align-center ga-4 flex-wrap">
        <div v-for="(name, i) in seriesNames" :key="i" class="d-flex align-center ga-1">
          <span class="chart-legend-dot" :style="{ background: colors[i % colors.length] }" />
          <span class="text-caption">{{ name }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-card.dv-chart-card { border-radius: var(--mp-component-card-radius-md) !important; }
.chart-x-label { font-size: var(--mp-typography-fontSize-xs); }
.chart-legend-dot { width: 8px; height: 8px; border-radius: var(--mp-borderRadius-full); }
.chart-area { display: flex; gap: var(--mp-spacing-1); height: 140px; }
.chart-y-labels { display: flex; flex-direction: column; justify-content: space-between; font-size: var(--mp-typography-fontSize-xs); color: rgba(var(--v-theme-on-surface), 0.45); min-width: 36px; text-align: right; padding-right: 6px; }
.chart-bars-wrap { display: flex; align-items: flex-end; gap: 3px; flex: 1; border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); padding: 0 2px; }
.chart-bar-col { flex: 1; display: flex; flex-direction: column-reverse; }
</style>
