<script setup lang="ts">
// Traffic mix — rounded gapped donut with center total and legend-with-values
// (references: "Spend by Marketing Channel", "Total Spend"). ApexCharts cannot
// round pie slice ends, so the arcs are hand-rolled SVG strokes.
import { computed, ref } from 'vue'
import { tintHex } from '@/plugins/chartPalette'
import { MIX_ROWS, SESSIONS_TOTAL, formatCountShort } from '../chartLabData'

const CX = 100
const CY = 100
const R = 78
const THICKNESS = 20
const PAD_DEG = 3.6 // gap on each side of a segment

function polar(deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)]
}

function arcPath(startDeg: number, endDeg: number): string {
  const [sx, sy] = polar(startDeg)
  const [ex, ey] = polar(endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

const segments = computed(() => {
  let cursor = 0
  return MIX_ROWS.map((row) => {
    const start = cursor * 3.6 + PAD_DEG
    const end = (cursor + row.pct) * 3.6 - PAD_DEG
    cursor += row.pct
    return { ...row, path: arcPath(start, Math.max(end, start + 0.5)) }
  })
})

const hovered = ref<string | null>(null)
</script>

<template>
  <div class="tdn">
    <svg viewBox="0 0 200 200" class="tdn__svg" aria-hidden="true">
      <defs>
        <linearGradient v-for="s in segments" :id="`lab-mix-${s.key}`" :key="s.key" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="tintHex(s.color, 0.26)" />
          <stop offset="100%" :stop-color="s.color" />
        </linearGradient>
      </defs>
      <path
        v-for="s in segments"
        :key="s.key"
        :d="s.path"
        fill="none"
        :stroke="`url(#lab-mix-${s.key})`"
        :stroke-width="THICKNESS"
        stroke-linecap="round"
        class="tdn__seg"
        :class="{ 'tdn__seg--dim': hovered !== null && hovered !== s.key }"
        @mouseenter="hovered = s.key"
        @mouseleave="hovered = null"
      >
        <title>{{ s.name }} — {{ s.pct }}% · {{ s.sessions.toLocaleString('en-US') }} sessions</title>
      </path>
      <text x="100" y="94" text-anchor="middle" class="tdn__total">{{ formatCountShort(SESSIONS_TOTAL) }}</text>
      <text x="100" y="112" text-anchor="middle" class="tdn__caption">Sessions · 30d</text>
    </svg>
    <ol class="tdn__legend" aria-label="Traffic mix by channel">
      <li
        v-for="s in MIX_ROWS"
        :key="s.key"
        class="tdn__row"
        :aria-label="`${s.name}: ${s.pct}% of sessions, ${s.sessions.toLocaleString('en-US')}`"
      >
        <span class="tdn__dot" :style="{ background: s.color }" aria-hidden="true" />
        <span class="tdn__name" aria-hidden="true">{{ s.name }}</span>
        <span class="tdn__value" aria-hidden="true">{{ s.pct }}%</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.tdn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  flex: 1;
  justify-content: center;
}

.tdn__svg {
  width: 100%;
  max-width: 220px;
  height: auto;
}

.tdn__seg {
  transition: opacity 0.18s ease;
}

.tdn__seg--dim {
  opacity: 0.3;
}

.tdn__total {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
  fill: var(--text-primary);
  font-family: Inter, system-ui, sans-serif;
}

.tdn__caption {
  font-size: 10px;
  fill: var(--text-muted);
  font-family: Inter, system-ui, sans-serif;
}

.tdn__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 18px;
  width: 100%;
}

.tdn__row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.tdn__dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  flex-shrink: 0;
}

.tdn__name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tdn__value {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .tdn__seg {
    transition: none;
  }
}
</style>
