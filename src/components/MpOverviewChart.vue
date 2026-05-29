<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type OverviewPoint = {
  label: string
  revenue: number
  engagement: number
  orders: number
}

type PlottedPoint = OverviewPoint & {
  x: number
  revenueY: number
  engagementY: number
}

const props = withDefaults(defineProps<{
  points: OverviewPoint[]
  revenueLabel?: string
  engagementLabel?: string
  ordersLabel?: string
}>(), {
  revenueLabel: 'Revenue',
  engagementLabel: 'Engagement rate',
  ordersLabel: 'Orders',
})

const chartId = `mp-overview-chart-${Math.random().toString(36).slice(2, 8)}`
const chartWidth = 760
const chartHeight = 276
const padding = {
  top: 22,
  right: 56,
  bottom: 34,
  left: 60,
}
const activeIndex = ref(0)

watch(
  () => props.points,
  (points) => {
    activeIndex.value = points.length > 0 ? points.length - 1 : 0
  },
  { immediate: true },
)

const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

const revenueMax = computed(() => getRoundedMax(props.points.map((point) => point.revenue), 4))
const engagementMax = computed(() => getRoundedPercentMax(props.points.map((point) => point.engagement), 4))

const revenueTicks = computed(() => {
  return Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4
    return {
      y: padding.top + innerHeight * ratio,
      value: revenueMax.value * (1 - ratio),
    }
  })
})

const engagementTicks = computed(() => {
  return Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4
    return {
      y: padding.top + innerHeight * ratio,
      value: engagementMax.value * (1 - ratio),
    }
  })
})

const slotWidth = computed(() => {
  if (props.points.length <= 1) {
    return innerWidth
  }

  return innerWidth / props.points.length
})

const plottedPoints = computed(() => {
  const pointCount = props.points.length

  return props.points.map((point, index) => {
    const x = pointCount === 1
      ? padding.left + innerWidth / 2
      : padding.left + (innerWidth * index) / (pointCount - 1)
    const revenueY = padding.top + innerHeight - ((point.revenue / revenueMax.value) * innerHeight)
    const engagementY = padding.top + innerHeight - ((point.engagement / engagementMax.value) * innerHeight)

    return {
      ...point,
      x,
      revenueY,
      engagementY,
    }
  })
})

const revenueLinePath = computed(() => buildSmoothPath(plottedPoints.value, 'revenueY'))
const revenueAreaPath = computed(() => buildAreaPath(plottedPoints.value, 'revenueY'))

const activePoint = computed(() => {
  return plottedPoints.value[activeIndex.value] ?? plottedPoints.value[plottedPoints.value.length - 1] ?? null
})

const previousPoint = computed(() => {
  if (activeIndex.value <= 0) {
    return null
  }

  return plottedPoints.value[activeIndex.value - 1] ?? null
})

const revenueDelta = computed(() => {
  if (!activePoint.value || !previousPoint.value || previousPoint.value.revenue === 0) {
    return null
  }

  return ((activePoint.value.revenue - previousPoint.value.revenue) / previousPoint.value.revenue) * 100
})

const engagementDelta = computed(() => {
  if (!activePoint.value || !previousPoint.value || previousPoint.value.engagement === 0) {
    return null
  }

  return ((activePoint.value.engagement - previousPoint.value.engagement) / previousPoint.value.engagement) * 100
})

const plotInsetStyle = computed(() => {
  return {
    top: `${(padding.top / chartHeight) * 100}%`,
    right: `${(padding.right / chartWidth) * 100}%`,
    bottom: `${(padding.bottom / chartHeight) * 100}%`,
    left: `${(padding.left / chartWidth) * 100}%`,
    gridTemplateColumns: `repeat(${Math.max(props.points.length, 1)}, minmax(0, 1fr))`,
  }
})

const tooltipStyle = computed(() => {
  if (!activePoint.value) {
    return {}
  }

  const leftPercent = Math.min(84, Math.max(16, (activePoint.value.x / chartWidth) * 100))
  const topPercent = Math.min(30, Math.max(8, ((activePoint.value.revenueY - 18) / chartHeight) * 100))

  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
  }
})

const chartAriaLabel = computed(() => {
  if (props.points.length === 0) {
    return 'No overview data available.'
  }

  return props.points.map((point) => {
    return `${point.label}: ${formatCurrency(point.revenue)} revenue, ${formatPercent(point.engagement)} engagement, ${formatNumber(point.orders)} orders`
  }).join('. ')
})

function setActivePoint(index: number) {
  activeIndex.value = index
}

function getRoundedMax(values: number[], minStep: number) {
  const highest = Math.max(...values, 1)
  const rounded = Math.ceil(highest / 25000) * 25000
  return Math.max(rounded, minStep)
}

function getRoundedPercentMax(values: number[], minStep: number) {
  const highest = Math.max(...values, 1)
  return Math.max(Math.ceil(highest / 5) * 5, minStep)
}

function buildSmoothPath(points: PlottedPoint[], yKey: 'revenueY' | 'engagementY') {
  if (points.length === 0) {
    return ''
  }

  if (points.length === 1) {
    const only = points[0]!
    return `M ${only.x} ${only[yKey]}`
  }

  const first = points[0]!
  let path = `M ${first.x} ${first[yKey]}`

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!
    const current = points[index]!
    const midpoint = (previous.x + current.x) / 2

    path += ` C ${midpoint} ${previous[yKey]} ${midpoint} ${current[yKey]} ${current.x} ${current[yKey]}`
  }

  return path
}

function buildAreaPath(points: PlottedPoint[], yKey: 'revenueY' | 'engagementY') {
  if (points.length === 0) {
    return ''
  }

  const linePath = buildSmoothPath(points, yKey)
  const firstPoint = points[0]!
  const lastPoint = points[points.length - 1]!
  const baseline = padding.top + innerHeight

  return `${linePath} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatAxisCurrency(value: number) {
  if (value === 0) {
    return '$0'
  }

  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }

  return `$${Math.round(value / 1000)}k`
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatDelta(value: number | null) {
  if (value == null) {
    return 'No prior comparison'
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}
</script>

<template>
  <div class="mp-overview-chart">
    <div class="mp-overview-chart__summary">
      <div class="mp-overview-chart__stat">
        <div class="mp-overview-chart__eyebrow">{{ revenueLabel }}</div>
        <div class="mp-overview-chart__value">{{ activePoint ? formatCompactCurrency(activePoint.revenue) : '$0' }}</div>
        <div
          class="mp-overview-chart__delta"
          :class="{
            'mp-overview-chart__delta--positive': revenueDelta != null && revenueDelta >= 0,
            'mp-overview-chart__delta--negative': revenueDelta != null && revenueDelta < 0,
          }"
        >
          {{ formatDelta(revenueDelta) }}
        </div>
      </div>

      <div class="mp-overview-chart__stat">
        <div class="mp-overview-chart__eyebrow">{{ engagementLabel }}</div>
        <div class="mp-overview-chart__value">{{ activePoint ? formatPercent(activePoint.engagement) : '0.0%' }}</div>
        <div
          class="mp-overview-chart__delta"
          :class="{
            'mp-overview-chart__delta--positive': engagementDelta != null && engagementDelta >= 0,
            'mp-overview-chart__delta--negative': engagementDelta != null && engagementDelta < 0,
          }"
        >
          {{ formatDelta(engagementDelta) }}
        </div>
      </div>

      <div class="mp-overview-chart__stat mp-overview-chart__stat--context">
        <div class="mp-overview-chart__eyebrow">{{ ordersLabel }}</div>
        <div class="mp-overview-chart__value">{{ activePoint ? formatNumber(activePoint.orders) : '0' }}</div>
        <div class="mp-overview-chart__context">
          {{ activePoint?.label ?? 'No data selected' }}
        </div>
      </div>
    </div>

    <div class="mp-overview-chart__plot">
      <div
        v-if="activePoint"
        class="mp-overview-chart__tooltip"
        :style="tooltipStyle"
      >
        <div class="mp-overview-chart__tooltip-label">{{ activePoint.label }}</div>
        <div class="mp-overview-chart__tooltip-value">{{ formatCurrency(activePoint.revenue) }}</div>
        <div class="mp-overview-chart__tooltip-subtext">{{ formatPercent(activePoint.engagement) }} engagement</div>
      </div>

      <svg
        class="mp-overview-chart__svg"
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        role="img"
        :aria-label="chartAriaLabel"
      >
        <defs>
          <linearGradient :id="`${chartId}-area`" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(var(--v-theme-primary), 0.34)" />
            <stop offset="100%" stop-color="rgba(var(--v-theme-primary), 0.02)" />
          </linearGradient>
          <linearGradient :id="`${chartId}-line`" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#2CC4FF" />
            <stop offset="56%" stop-color="rgb(var(--v-theme-primary))" />
            <stop offset="100%" stop-color="#00608D" />
          </linearGradient>
          <linearGradient :id="`${chartId}-bars`" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(0, 173, 241, 0.5)" />
            <stop offset="100%" stop-color="rgba(0, 173, 241, 0.08)" />
          </linearGradient>
        </defs>

        <g>
          <line
            v-for="tick in revenueTicks"
            :key="`grid-${tick.y}`"
            :x1="padding.left"
            :x2="chartWidth - padding.right"
            :y1="tick.y"
            :y2="tick.y"
            class="mp-overview-chart__grid-line"
          />

          <text
            v-for="tick in revenueTicks"
            :key="`revenue-${tick.y}`"
            :x="padding.left - 12"
            :y="tick.y + 4"
            text-anchor="end"
            class="mp-overview-chart__axis-label"
          >
            {{ formatAxisCurrency(tick.value) }}
          </text>

          <text
            v-for="tick in engagementTicks"
            :key="`engagement-${tick.y}`"
            :x="chartWidth - padding.right + 12"
            :y="tick.y + 4"
            text-anchor="start"
            class="mp-overview-chart__axis-label"
          >
            {{ Math.round(tick.value) }}%
          </text>
        </g>

        <g>
          <rect
            v-for="(point, index) in plottedPoints"
            :key="`${point.label}-bar`"
            :x="point.x - Math.min(26, slotWidth * 0.24)"
            :y="point.engagementY"
            :width="Math.min(52, slotWidth * 0.48)"
            :height="padding.top + innerHeight - point.engagementY"
            rx="10"
            :class="[
              'mp-overview-chart__bar',
              { 'mp-overview-chart__bar--active': index === activeIndex },
            ]"
            :fill="`url(#${chartId}-bars)`"
          />
        </g>

        <path
          :d="revenueAreaPath"
          :fill="`url(#${chartId}-area)`"
          class="mp-overview-chart__area"
        />
        <path
          :d="revenueLinePath"
          :stroke="`url(#${chartId}-line)`"
          class="mp-overview-chart__line"
        />

        <g>
          <g
            v-for="(point, index) in plottedPoints"
            :key="`${point.label}-point`"
          >
            <line
              v-if="index === activeIndex"
              :x1="point.x"
              :x2="point.x"
              :y1="padding.top"
              :y2="padding.top + innerHeight"
              class="mp-overview-chart__focus-line"
            />
            <circle
              :cx="point.x"
              :cy="point.revenueY"
              r="7"
              :class="[
                'mp-overview-chart__point-ring',
                { 'mp-overview-chart__point-ring--active': index === activeIndex },
              ]"
            />
            <circle
              :cx="point.x"
              :cy="point.revenueY"
              r="4.2"
              :class="[
                'mp-overview-chart__point-core',
                { 'mp-overview-chart__point-core--active': index === activeIndex },
              ]"
            />
            <text
              :x="point.x"
              :y="chartHeight - 10"
              text-anchor="middle"
              :class="[
                'mp-overview-chart__x-label',
                { 'mp-overview-chart__x-label--active': index === activeIndex },
              ]"
            >
              {{ point.label }}
            </text>
          </g>
        </g>
      </svg>

      <div
        class="mp-overview-chart__hotspots"
        :style="plotInsetStyle"
      >
        <button
          v-for="(point, index) in plottedPoints"
          :key="`${point.label}-hotspot`"
          type="button"
          class="mp-overview-chart__hotspot"
          :aria-label="`${point.label}, ${formatCurrency(point.revenue)} revenue, ${formatPercent(point.engagement)} engagement, ${formatNumber(point.orders)} orders`"
          @mouseenter="setActivePoint(index)"
          @focus="setActivePoint(index)"
        />
      </div>
    </div>

    <div class="mp-overview-chart__legend" aria-hidden="true">
      <div class="mp-overview-chart__legend-item">
        <span class="mp-overview-chart__legend-swatch mp-overview-chart__legend-swatch--line" />
        Revenue trend
      </div>
      <div class="mp-overview-chart__legend-item">
        <span class="mp-overview-chart__legend-swatch mp-overview-chart__legend-swatch--bar" />
        Engagement rate
      </div>
    </div>

    <table class="mp-overview-chart__sr-only">
      <caption>Revenue and engagement overview data</caption>
      <thead>
        <tr>
          <th scope="col">Period</th>
          <th scope="col">Revenue</th>
          <th scope="col">Engagement</th>
          <th scope="col">Orders</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="point in points" :key="`${point.label}-table`">
          <th scope="row">{{ point.label }}</th>
          <td>{{ formatCurrency(point.revenue) }}</td>
          <td>{{ formatPercent(point.engagement) }}</td>
          <td>{{ formatNumber(point.orders) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.mp-overview-chart {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
}

.mp-overview-chart__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mp-overview-chart__stat {
  border: 1px solid rgba(var(--v-theme-border), 0.78);
  background: rgb(var(--v-theme-surface));
  border-radius: 18px;
  padding: 16px 18px;
}

.mp-overview-chart__stat--context {
  background: rgba(var(--v-theme-surface-variant), 0.52);
}

.mp-overview-chart__eyebrow {
  font-size: var(--mp-typography-fontSize-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.58);
  margin-bottom: 8px;
}

.mp-overview-chart__value {
  font-size: clamp(1.2rem, 2vw, 1.8rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: rgb(var(--v-theme-on-surface));
}

.mp-overview-chart__delta,
.mp-overview-chart__context {
  margin-top: 6px;
  font-size: var(--mp-typography-fontSize-sm);
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.mp-overview-chart__delta--positive {
  color: rgb(var(--v-theme-success));
}

.mp-overview-chart__delta--negative {
  color: rgb(var(--v-theme-error));
}

.mp-overview-chart__plot {
  position: relative;
  flex: 1 1 auto;
  min-height: 360px;
  border-radius: 24px;
  border: 1px solid rgba(var(--v-theme-border), 0.8);
  background:
    radial-gradient(circle at top left, rgba(0, 173, 241, 0.08), transparent 30%),
    rgb(var(--v-theme-surface));
  overflow: hidden;
  padding: 10px 10px 4px;
}

.mp-overview-chart__svg {
  display: block;
  width: 100%;
  min-height: 320px;
  height: 100%;
}

.mp-overview-chart__grid-line {
  stroke: rgba(var(--v-theme-border), 0.56);
  stroke-dasharray: 4 6;
}

.mp-overview-chart__axis-label {
  font-size: 11px;
  fill: rgba(var(--v-theme-on-surface), 0.42);
}

.mp-overview-chart__bar {
  opacity: 0.8;
  transition: opacity $mp-transition-fast, transform $mp-transition-fast;
  transform-origin: center bottom;
}

.mp-overview-chart__bar--active {
  opacity: 1;
  transform: scaleY(1.02);
}

.mp-overview-chart__area {
  opacity: 1;
}

.mp-overview-chart__line {
  fill: none;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mp-overview-chart__focus-line {
  stroke: rgba(var(--v-theme-primary), 0.18);
  stroke-dasharray: 5 7;
}

.mp-overview-chart__point-ring {
  fill: rgba(255, 255, 255, 0.92);
  stroke: rgba(var(--v-theme-primary), 0.3);
  stroke-width: 2;
  transition: transform $mp-transition-fast, stroke $mp-transition-fast, fill $mp-transition-fast;
  transform-origin: center center;
}

.mp-overview-chart__point-ring--active {
  transform: scale(1.12);
  stroke: rgb(var(--v-theme-primary));
}

.mp-overview-chart__point-core {
  fill: rgba(var(--v-theme-primary), 0.92);
}

.mp-overview-chart__point-core--active {
  fill: rgb(var(--v-theme-primary-darken-1));
}

.mp-overview-chart__x-label {
  font-size: 11px;
  fill: rgba(var(--v-theme-on-surface), 0.44);
  font-weight: 600;
}

.mp-overview-chart__x-label--active {
  fill: rgb(var(--v-theme-primary));
}

.mp-overview-chart__tooltip {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, 0);
  min-width: 140px;
  border-radius: 16px;
  padding: 10px 12px;
  background: rgba(14, 23, 44, 0.92);
  color: #f8fbff;
  box-shadow: 0 14px 28px rgba(11, 21, 42, 0.18);
  pointer-events: none;
}

.mp-overview-chart__tooltip-label {
  font-size: var(--mp-typography-fontSize-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(248, 251, 255, 0.68);
}

.mp-overview-chart__tooltip-value {
  margin-top: 4px;
  font-size: var(--mp-typography-fontSize-lg);
  font-weight: 700;
}

.mp-overview-chart__tooltip-subtext {
  margin-top: 2px;
  font-size: var(--mp-typography-fontSize-sm);
  color: rgba(248, 251, 255, 0.76);
}

.mp-overview-chart__hotspots {
  position: absolute;
  display: grid;
}

.mp-overview-chart__hotspot {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.mp-overview-chart__hotspot:focus-visible {
  outline: none;
  box-shadow: inset 0 -3px 0 rgba(var(--v-theme-primary), 0.4);
}

.mp-overview-chart__legend {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: var(--mp-typography-fontSize-sm);
}

.mp-overview-chart__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mp-overview-chart__legend-swatch {
  display: inline-flex;
  width: 16px;
  height: 16px;
  border-radius: 999px;
}

.mp-overview-chart__legend-swatch--line {
  background: linear-gradient(135deg, #2CC4FF 0%, rgb(var(--v-theme-primary)) 100%);
}

.mp-overview-chart__legend-swatch--bar {
  background: linear-gradient(180deg, rgba(0, 173, 241, 0.7) 0%, rgba(0, 173, 241, 0.18) 100%);
}

.mp-overview-chart__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 900px) {
  .mp-overview-chart__summary {
    grid-template-columns: 1fr;
  }

  .mp-overview-chart__plot {
    min-height: 300px;
    padding-top: 24px;
  }

  .mp-overview-chart__tooltip {
    min-width: 128px;
  }
}
</style>
