<script setup lang="ts">
// Goal gauge: round-capped progress arc over a soft track. The arc shades
// from the base blue toward a lighter tint along the sweep.
import { computed, useId } from 'vue'
import { embossStops, tintHex } from '@/plugins/chartPalette'

const props = withDefaults(defineProps<{
  /** 0–100 */
  pct: number
  centerValue: string
  centerCaption: string
  /** Arc sweep in degrees; 270 gives the shadcn radial that opens at the bottom. */
  sweep?: number
  /** Arc colour (theme-driven for flat Polaris themes). */
  color?: string
  /** Flat (Polaris) mode: solid arc, no gradient shading. */
  flat?: boolean
  /** Embossed mode: lit crown + darkened base lip, matching the bar marks. */
  emboss?: boolean
}>(), {
  sweep: 360,
  color: '#0092D4',
  flat: false,
  emboss: false,
})

// Embossed arcs light from the top like every other mark, so the gradient runs
// vertically; the default arc keeps its along-the-sweep horizontal shading.
const arcStops = computed(() => (props.emboss
  ? embossStops([
      { offset: 0, color: tintHex(props.color, 0.3), opacity: 1 },
      { offset: 100, color: props.color, opacity: 1 },
    ])
  : [
      { offset: 0, color: props.color, opacity: 1 },
      { offset: 100, color: tintHex(props.color, 0.35), opacity: 1 },
    ]))

const CIRC = 2 * Math.PI * 52
const arcLength = computed(() => CIRC * (props.sweep / 360))
const dash = computed(() => {
  const on = (Math.min(100, Math.max(0, props.pct)) / 100) * arcLength.value
  return `${on.toFixed(1)} ${(CIRC - on).toFixed(1)}`
})
const trackDash = computed(() => `${arcLength.value.toFixed(1)} ${(CIRC - arcLength.value).toFixed(1)}`)
// Full ring starts at 12 o'clock; a partial sweep centers its gap on the
// bottom (shadcn radial: 270° runs from 7:30 clockwise to 4:30).
const rotation = computed(() => (
  props.sweep < 360 ? `rotate(${90 + (360 - props.sweep) / 2} 70 70)` : 'rotate(-90 70 70)'
))
// SVG gradient ids are global to the page — scope them per instance.
const uid = useId()
</script>

<template>
  <div class="dt-gauge">
    <svg viewBox="0 0 140 140" class="dt-gauge__svg" role="img" :aria-label="`${centerValue} ${centerCaption}`">
      <defs v-if="!flat">
        <linearGradient
          :id="`${uid}-arc`"
          x1="0" y1="0"
          :x2="emboss ? 0 : 1" :y2="emboss ? 1 : 0"
        >
          <stop
            v-for="(stop, si) in arcStops"
            :key="si"
            :offset="`${stop.offset}%`"
            :stop-color="stop.color"
          />
        </linearGradient>
      </defs>
      <g :transform="rotation" fill="none" stroke-width="15" stroke-linecap="round">
        <circle cx="70" cy="70" r="52" class="dt-gauge__track" :stroke-dasharray="sweep < 360 ? trackDash : undefined" />
        <circle cx="70" cy="70" r="52" :stroke="flat ? color : `url(#${uid}-arc)`" :stroke-dasharray="dash" />
      </g>
    </svg>
    <div class="dt-gauge__center">
      <span class="dt-gauge__value">{{ centerValue }}</span>
      <span class="dt-gauge__caption">{{ centerCaption }}</span>
    </div>
  </div>
</template>

<style scoped>
.dt-gauge {
  position: relative;
  width: 172px;
  height: 172px;
}

.dt-gauge__svg {
  width: 172px;
  height: 172px;
  display: block;
}

.dt-gauge__track {
  stroke: var(--surface-secondary);
}

.dt-gauge__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.dt-gauge__value {
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.dt-gauge__caption {
  font-size: 11px;
  color: var(--muted);
}
</style>
