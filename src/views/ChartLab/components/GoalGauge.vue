<script setup lang="ts">
// Semicircle gauge with rounded caps (reference: "Expenses 78%" gauge).
// Generic: percentage, center text and caption line via props.
import { computed } from 'vue'
import { tintHex } from '@/plugins/chartPalette'
import { C } from '../chartLabData'

const props = withDefaults(
  defineProps<{
    /** Arc fill, 0–100. */
    pct: number
    /** Big center figure ("78%", "10 / 10"). */
    center: string
    centerCaption: string
    /** Sentence under the gauge — also the accessible text. */
    line: string
    color?: string
  }>(),
  { color: undefined },
)

const arcColor = computed(() => props.color ?? C.teal)

const CX = 100
const CY = 96
const R = 74
const THICKNESS = 16

// Semicircle from 270° (left) to 450° (right), measured like a clock face.
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

const trackPath = arcPath(270, 450)
const fillPath = computed(() => arcPath(270, 270 + (Math.min(Math.max(props.pct, 0), 100) / 100) * 180))
const gradientId = `lab-gauge-${Math.abs(props.center.length * 7919 + props.pct)}`
</script>

<template>
  <div class="ggg">
    <svg viewBox="0 0 200 116" class="ggg__svg" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" :stop-color="arcColor" />
          <stop offset="100%" :stop-color="tintHex(arcColor, 0.35)" />
        </linearGradient>
      </defs>
      <path :d="trackPath" fill="none" stroke="var(--surface-secondary)" :stroke-width="THICKNESS" stroke-linecap="round" />
      <path :d="fillPath" fill="none" :stroke="`url(#${gradientId})`" :stroke-width="THICKNESS" stroke-linecap="round" />
      <text x="100" y="86" text-anchor="middle" class="ggg__value">{{ center }}</text>
      <text x="100" y="104" text-anchor="middle" class="ggg__caption">{{ centerCaption }}</text>
    </svg>
    <p class="ggg__line" role="img" :aria-label="`${center} ${centerCaption} — ${line}.`">
      {{ line }}
    </p>
  </div>
</template>

<style scoped>
.ggg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
}

.ggg__svg {
  width: 100%;
  max-width: 210px;
  height: auto;
}

.ggg__value {
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -0.01em;
  fill: var(--text-primary);
  font-family: Inter, system-ui, sans-serif;
}

.ggg__caption {
  font-size: 10px;
  fill: var(--text-muted);
  font-family: Inter, system-ui, sans-serif;
}

.ggg__line {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
}
</style>
