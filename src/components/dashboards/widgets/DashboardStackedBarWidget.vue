<script setup lang="ts">
// Stacked bar chart (dotted Overview v2), after shadcn's "Bar Chart -
// Stacked + Legend": rounded two-segment stacks in the trend blues with a
// centered swatch legend. Light hue sits at the bottom of the stack,
// dark on top, matching the reference.
import { computed } from 'vue'
import { TREND_CURRENT, TREND_PREVIOUS } from '../dotted/dottedChartMath'
import type { DashboardStackedBarData } from '@/stores/dashboards/types'

const props = defineProps<{
  data: DashboardStackedBarData
}>()

/** Segment colors by stack position: bottom light, top dark. */
const STACK_COLORS = [TREND_PREVIOUS, TREND_CURRENT] as const

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
              background: STACK_COLORS[bucket.segments.length - 1 - index],
            }"
          />
        </div>
        <span class="stackbar-widget__label">{{ bucket.label }}</span>
      </div>
    </div>
    <div class="stackbar-widget__legend">
      <span v-for="(entry, index) in data.legend" :key="entry.key" class="stackbar-widget__legend-item">
        <span class="stackbar-widget__swatch" :style="{ background: STACK_COLORS[index] }" />
        {{ entry.label }}
      </span>
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
  justify-content: center;
  gap: 18px;
}

.stackbar-widget__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-primary);
}

.stackbar-widget__swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
}
</style>
