<script setup lang="ts">
import { computed, inject, unref } from 'vue'
import { activeChartTheme, CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'

const props = withDefaults(defineProps<{
  segments: { label: string; value: number }[]
  /** Rendered size in px; geometry is fixed in a 200-unit viewBox so it scales responsively. */
  size?: number
  /** Ring stroke width in viewBox units. */
  thickness?: number
  /** Gap between segments, in degrees. */
  gapDeg?: number
  centerLabel?: string
  centerCaption?: string
}>(), {
  size: 200,
  thickness: 26,
  gapDeg: 3,
  centerLabel: undefined,
  centerCaption: undefined,
})

const override = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(override) ?? activeChartTheme.value)

// Fixed drawing space — the viewBox scales the whole thing to `size` px.
const VIEW = 200
const CENTER = VIEW / 2
const radius = computed(() => CENTER - props.thickness / 2 - 2)

const total = computed(() => props.segments.reduce((sum, s) => sum + Math.max(0, s.value), 0))

const DEG = 180 / Math.PI

function point(angleDeg: number) {
  // Angle measured clockwise from 12 o'clock.
  const a = (angleDeg - 90) / DEG
  return {
    x: CENTER + radius.value * Math.cos(a),
    y: CENTER + radius.value * Math.sin(a),
  }
}

function arcPath(startDeg: number, endDeg: number): string {
  const start = point(startDeg)
  const end = point(endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius.value.toFixed(2)} ${radius.value.toFixed(2)} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

const arcs = computed(() => {
  if (total.value <= 0) return []
  // The round cap extends beyond each end by strokeWidth/2 — shrink each arc by that
  // (converted to an angle) plus half the gap, so caps never bleed into the gaps.
  const capDeg = (props.thickness / 2 / radius.value) * DEG
  const inset = props.gapDeg / 2 + capDeg
  let cursor = 0
  return props.segments.map((seg, i) => {
    const share = Math.max(0, seg.value) / total.value
    const sweep = share * 360
    const rawStart = cursor
    const rawEnd = cursor + sweep
    cursor = rawEnd
    const pct = Math.round(share * 100)
    // Segments too small to survive the inset render as a minimal dot-length arc.
    let drawStart: number
    let drawEnd: number
    if (sweep < 2 * capDeg + props.gapDeg) {
      const mid = (rawStart + rawEnd) / 2
      drawStart = mid - 0.5
      drawEnd = mid + 0.5
    } else {
      drawStart = rawStart + inset
      drawEnd = rawEnd - inset
    }
    return {
      d: arcPath(drawStart, drawEnd),
      color: theme.value.series[i % 6],
      label: seg.label,
      pct,
    }
  })
})

const largest = computed(() => {
  if (!props.segments.length || total.value <= 0) return null
  const top = props.segments.reduce((a, b) => (b.value > a.value ? b : a))
  return { label: top.label, pct: Math.round((Math.max(0, top.value) / total.value) * 100) }
})

const displayLabel = computed(() => props.centerLabel ?? (largest.value ? `${largest.value.pct}%` : ''))
const displayCaption = computed(() => props.centerCaption ?? largest.value?.label ?? '')

const ariaLabel = computed(() => {
  if (!arcs.value.length) return 'Segment ring, no data'
  return `Segment ring: ${arcs.value.map((a) => `${a.label} ${a.pct}%`).join(', ')}`
})
</script>

<template>
  <svg
    class="ring"
    :viewBox="`0 0 ${VIEW} ${VIEW}`"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="ariaLabel"
  >
    <path
      v-for="(arc, i) in arcs"
      :key="i"
      :d="arc.d"
      fill="none"
      :stroke="arc.color"
      :stroke-width="thickness"
      stroke-linecap="round"
    >
      <title>{{ arc.label }} — {{ arc.pct }}%</title>
    </path>
    <text
      v-if="displayLabel"
      class="ring__label"
      :x="CENTER"
      :y="CENTER - 2"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ displayLabel }}
    </text>
    <text
      v-if="displayCaption"
      class="ring__caption"
      :x="CENTER"
      :y="CENTER + 16"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ displayCaption }}
    </text>
  </svg>
</template>

<style scoped>
.ring {
  display: block;
  max-width: 100%;
}

.ring path {
  transition: opacity 0.15s ease;
}

.ring:hover path:not(:hover) {
  opacity: 0.45;
}

.ring__label {
  fill: var(--ink);
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ring__caption {
  fill: var(--muted);
  font-size: 11.5px;
  font-weight: 500;
}
</style>
