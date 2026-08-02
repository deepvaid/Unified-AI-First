<script lang="ts">
// Module scope (shared across every instance, unlike <script setup> locals):
// a counter so each EvGradientDonut on the page gets unique <linearGradient>
// ids — SVG ids are global to the document and would otherwise collide.
let uidCounter = 0
</script>

<script setup lang="ts">
// evilcharts-style "Revenue Mix" donut: gradient rounded-cap stroked-arc
// segments separated by a fixed gap, a dashed inner ring for texture, and a
// legend list beside it. Segment sweep is proportional to item.value.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    items: { name: string; value: number }[]
    gradients: [string, string][]
    centerValue: string
    centerCaption: string
    formatValue?: (v: number) => string
    chartLabel: string
    size?: number
  }>(),
  {
    formatValue: (v: number) => '$' + v.toLocaleString('en-US'),
    size: 240,
  },
)

const uid = uidCounter++

const CX = 110
const CY = 110
const R = 82
const GAP_DEG = 16
const START_DEG = -90
const FALLBACK_GRADIENT: [string, string] = ['#a855f7', '#6366f1']

function gradientFor(i: number): [string, string] {
  return props.gradients[i] ?? FALLBACK_GRADIENT
}

// deg: 0 = 3 o'clock, -90 = 12 o'clock, increasing = clockwise.
function polar(deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) }
}

function arcPath(startDeg: number, endDeg: number): string {
  const s = polar(startDeg)
  const e = polar(endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

interface Segment {
  gradId: string
  path: string
  gradFrom: string
  gradTo: string
}

/** 360° minus (n * 16°) of gaps, distributed proportionally by value; starts at 12 o'clock + half a gap. */
const segments = computed<Segment[]>(() => {
  const n = props.items.length
  if (n === 0) return []
  const totalValue = props.items.reduce((sum, it) => sum + it.value, 0)
  const availableDeg = 360 - n * GAP_DEG
  let cursor = START_DEG + GAP_DEG / 2
  const result: Segment[] = []

  for (let i = 0; i < n; i++) {
    const item = props.items[i]
    if (!item) continue
    const share = totalValue > 0 ? item.value / totalValue : 0
    const sweep = share * availableDeg
    const start = cursor
    const end = start + sweep
    cursor = end + GAP_DEG

    const [gradFrom, gradTo] = gradientFor(i)
    result.push({
      gradId: `ev-grad-donut-${uid}-${i}`,
      path: arcPath(start, end),
      gradFrom,
      gradTo,
    })
  }
  return result
})

function legendDotStyle(i: number) {
  const [from, to] = gradientFor(i)
  return { background: `linear-gradient(135deg, ${from}, ${to})` }
}
</script>

<template>
  <div class="evgd">
    <div class="evgd-chart" role="img" :aria-label="chartLabel">
      <svg viewBox="0 0 220 220" class="evgd-svg" :style="{ maxWidth: `${size}px` }">
        <defs>
          <linearGradient
            v-for="seg in segments"
            :id="seg.gradId"
            :key="`grad-${seg.gradId}`"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" :stop-color="seg.gradFrom" />
            <stop offset="100%" :stop-color="seg.gradTo" />
          </linearGradient>
        </defs>

        <path
          v-for="seg in segments"
          :key="seg.gradId"
          :d="seg.path"
          fill="none"
          :stroke="`url(#${seg.gradId})`"
          stroke-width="26"
          stroke-linecap="round"
        />

        <circle cx="110" cy="110" r="54" fill="none" stroke="var(--scn-border)" stroke-width="1.2" stroke-dasharray="3 4" />

        <text x="110" y="105" text-anchor="middle" class="evgd-value">{{ centerValue }}</text>
        <text x="110" y="126" text-anchor="middle" class="evgd-caption">{{ centerCaption }}</text>
      </svg>
    </div>

    <div class="evgd-legend">
      <div v-for="(item, i) in items" :key="item.name" class="evgd-row">
        <span class="evgd-dot" :style="legendDotStyle(i)" aria-hidden="true" />
        <span class="evgd-name">{{ item.name }}</span>
        <span class="evgd-amount">{{ formatValue(item.value) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.evgd {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.evgd-chart {
  flex-shrink: 0;
  min-width: 0;
}

.evgd-svg {
  display: block;
  width: 100%;
  height: auto;
}

.evgd-value {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  fill: var(--scn-fg);
}

.evgd-caption {
  font-size: 13px;
  fill: var(--scn-muted);
}

.evgd-legend {
  flex: 1 1 200px;
  min-width: 0;
}

.evgd-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.evgd-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.evgd-name {
  font-size: 15px;
  color: var(--scn-muted);
}

.evgd-amount {
  font-size: 15px;
  font-weight: 600;
  color: var(--scn-fg);
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}
</style>
