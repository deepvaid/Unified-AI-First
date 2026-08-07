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
// Embossed marks (Option D): a lit top edge and a darker base lip inside each segment.
const gloss = computed(() => !!treatment.value?.effects.gloss)
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

/* --- 'bar' variant: one full-width horizontal bar of proportional segments --- */

/** Totals per legend slot, summed across whatever buckets the metric supplied. */
const barTotals = computed(() =>
  props.data.legend.map((_, index) =>
    props.data.buckets.reduce((sum, bucket) => sum + (bucket.segments[index]?.value ?? 0), 0),
  ),
)

/** Proportional widths, floored at 4% so a small tail segment stays visible. */
const barWidths = computed(() => {
  const total = Math.max(1, barTotals.value.reduce((sum, value) => sum + value, 0))
  const floored = barTotals.value.map((value) => Math.max(4, (value / total) * 100))
  const sum = floored.reduce((a, b) => a + b, 0)
  return floored.map((value) => (value / sum) * 100)
})

/** Horizontal segments shade along the bar, not up it. */
function hSegmentFill(index: number): string {
  const color = STACK_COLORS.value[index] ?? STACK_COLORS.value[0]!
  return flat.value ? color : `linear-gradient(to right, ${color}, ${tintHex(color, 0.28)})`
}

const barAriaLabel = computed(() =>
  props.data.legend.map((entry) => `${entry.label} ${entry.total}`).join(', '),
)
</script>

<template>
  <!-- 'bar': label/value pairs over a single segmented bar (Sales by product name). -->
  <div v-if="data.variant === 'bar'" class="stackbar-widget stackbar-widget--single" :class="{ 'stackbar-widget--gloss': gloss }">
    <div class="stackbar-widget__pairs">
      <div v-for="(entry, index) in data.legend" :key="entry.key" class="stackbar-widget__pair">
        <span class="stackbar-widget__pair-label">
          <span class="stackbar-widget__swatch" :style="{ background: STACK_COLORS[index] }" />
          <span class="stackbar-widget__pair-name">{{ entry.label }}</span>
        </span>
        <span class="stackbar-widget__pair-value">{{ entry.total }}</span>
      </div>
    </div>
    <div class="stackbar-widget__hbar" role="img" :aria-label="barAriaLabel">
      <span
        v-for="(entry, index) in data.legend"
        :key="entry.key"
        class="stackbar-widget__hsegment"
        :style="{ width: `${barWidths[index]}%`, background: hSegmentFill(index) }"
        :title="`${entry.label} ${entry.total} · ${entry.pct}%`"
      />
    </div>
  </div>
  <div v-else class="stackbar-widget" :class="{ 'stackbar-widget--gloss': gloss }">
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

/* --- 'bar' variant --- */
/* Legend sits directly under the card subtitle and the bar is anchored to the
   bottom edge (the Shopify composition), so spare card height never opens a
   void above the values. */
.stackbar-widget--single {
  justify-content: flex-start;
  gap: 24px;
}

/* 180px tracks put two pairs per row in a half-width card, which both fits the
   long product names and gives the block enough height to sit in the card. */
.stackbar-widget__pairs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 26px 24px;
}

.stackbar-widget__pair {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stackbar-widget__pair-label {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  font-size: 12px;
  color: var(--muted);
}

.stackbar-widget__pair-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stackbar-widget__pair-value {
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.stackbar-widget__hbar {
  display: flex;
  gap: 3px;
  width: 100%;
  height: 26px;
  flex: none;
  margin-top: auto;
}

.stackbar-widget__hsegment {
  min-width: 0;
  border-radius: 4px;
}

/* Rounded ends on the bar as a whole. */
.stackbar-widget__hsegment:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.stackbar-widget__hsegment:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* Emboss: an inset sheen along the lit edge and a soft shadow at the base, so a
   segment reads as a solid catching light rather than a flat fill. Vertical
   stacks light from the top; the horizontal bar lights from its left edge. */
.stackbar-widget--gloss .stackbar-widget__segment {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -6px 8px -6px rgba(12, 10, 40, 0.5);
}

.stackbar-widget--gloss .stackbar-widget__hsegment {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -5px 7px -5px rgba(12, 10, 40, 0.45);
}
</style>