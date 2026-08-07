<script setup lang="ts">
// Stacked bar chart (dotted Overview v2), after shadcn's "Bar Chart -
// Stacked + Legend": rounded stacks in the blue ramp (light at the bottom of
// the stack, dark on top) with a legend that also carries each series' total
// and share, the way the reference dashboards annotate their distributions.
import { computed, inject, unref } from 'vue'
import { CHART_PALETTE_OVERRIDE, tintHex, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import { STACK_BLUES } from '../dotted/dottedChartMath'
import type { DashboardStackedBarData } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardStackedBarData
}>()

const { theme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
// Flat (Polaris) themes use their own categorical colours with flat fills;
// exploration options take the stack ramp (and flat/tint shading) from their treatment.
const treatment = computed(() => resolvedTheme.value.treatment)
const legacyFlat = computed(() => !!resolvedTheme.value.flatMarks)
const flat = computed(() => (treatment.value ? treatment.value.svg.shade === 'flat' : legacyFlat.value))
const STACK_COLORS = computed<readonly string[]>(() => {
  const t = treatment.value
  if (t) return t.ramps?.stack ?? resolvedTheme.value.series
  return legacyFlat.value ? resolvedTheme.value.series : STACK_BLUES
})

/** Segment fill: flat theme colour, or base fading to a lighter tint on top. */
function segmentFill(index: number): string {
  const color = STACK_COLORS.value[index] ?? STACK_COLORS.value[0]!
  return flat.value ? color : `linear-gradient(to top, ${color}, ${tintHex(color, 0.3)})`
}

const maxTotal = computed(() =>
  Math.max(1, ...props.data.buckets.map((bucket) =>
    bucket.segments.reduce((sum, segment) => sum + segment.value, 0),
  )),
)

function segmentPct(value: number): number {
  return (value / maxTotal.value) * 100
}

function bucketTitle(bucket: DashboardStackedBarData['buckets'][number]): string {
  const parts = bucket.segments.map((segment, index) =>
    `${props.data.legend[index]?.label ?? segment.key} ${segment.formattedValue}`,
  )
  return `${bucket.label}: ${parts.join(' · ')}`
}
</script>

<template>
  <div class="stackbar-widget">
    <div class="stackbar-widget__plot" role="img" aria-label="Stacked bar chart">
      <div
        v-for="bucket in data.buckets"
        :key="bucket.label"
        class="stackbar-widget__col"
        :title="bucketTitle(bucket)"
      >
        <div class="stackbar-widget__bar">
          <span
            v-for="(segment, index) in [...bucket.segments].reverse()"
            :key="segment.key"
            class="stackbar-widget__segment"
            :style="{
              height: `${segmentPct(segment.value)}%`,
              background: segmentFill(bucket.segments.length - 1 - index),
            }"
          />
        </div>
        <span class="stackbar-widget__label">{{ bucket.label }}</span>
      </div>
    </div>
    <div class="stackbar-widget__legend">
      <div v-for="(entry, index) in data.legend" :key="entry.key" class="stackbar-widget__legend-row">
        <span class="stackbar-widget__swatch" :style="{ background: STACK_COLORS[index] }" />
        <span class="stackbar-widget__legend-label">{{ entry.label }}</span>
        <span class="stackbar-widget__legend-value">{{ entry.total }}</span>
        <span class="stackbar-widget__legend-pct">{{ entry.pct }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stackbar-widget {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.stackbar-widget__plot {
  display: flex;
  align-items: stretch;
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
  padding-top: 8px;
}

.stackbar-widget__col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
}

.stackbar-widget__bar {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  flex: 1 1 auto;
  min-height: 0;
}

.stackbar-widget__segment {
  border-radius: 3px;
}

.stackbar-widget__segment:first-child {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.stackbar-widget__label {
  font-size: 11.5px;
  color: var(--muted);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stackbar-widget__legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
}

.stackbar-widget__legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
}

.stackbar-widget__legend-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stackbar-widget__legend-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex: none;
}

.stackbar-widget__legend-pct {
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  width: 34px;
  text-align: right;
  flex: none;
}

.stackbar-widget__swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
}
</style>
