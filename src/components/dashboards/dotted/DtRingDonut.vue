<script setup lang="ts">
// Stroked-circle donut. Segments are computed from raw values; colors
// assigned by index from the chart blues, each shading from a light tint
// at the top of the ring toward the base colour.
import { computed, useId } from 'vue'
import { embossStops, tintHex } from '@/plugins/chartPalette'
import { DOTTED_BLUES, ringSegments } from './dottedChartMath'

const props = withDefaults(defineProps<{
  values: number[]
  colors?: readonly string[]
  centerValue?: string
  centerCaption?: string
  centerSize?: number
  /** Flat (Polaris) mode: plain segment colours, no gradient shading. */
  flat?: boolean
  /** Embossed mode: lit crown + darkened base lip, matching the bar marks. */
  emboss?: boolean
}>(), {
  colors: () => DOTTED_BLUES,
  centerSize: 22,
  flat: false,
  emboss: false,
})

// Same recipe the bars use, so a ring and a column read as the same material.
const rampFor = (color: string) => (props.emboss
  ? embossStops([
      { offset: 0, color: tintHex(color, 0.26), opacity: 1 },
      { offset: 100, color, opacity: 1 },
    ])
  : [
      { offset: 0, color: tintHex(color, 0.26), opacity: 1 },
      { offset: 100, color, opacity: 1 },
    ])

const segments = computed(() => ringSegments(props.values))
// SVG gradient ids are global to the page — scope them per instance.
const uid = useId()
</script>

<template>
  <div class="dt-donut">
    <svg viewBox="0 0 140 140" class="dt-donut__svg" role="img" :aria-label="`${centerValue ?? ''} ${centerCaption ?? 'donut chart'}`">
      <defs v-if="!flat">
        <linearGradient v-for="(color, i) in colors" :id="`${uid}-s${i}`" :key="i" x1="0" y1="0" x2="0" y2="1">
          <stop
            v-for="(stop, si) in rampFor(color)"
            :key="si"
            :offset="`${stop.offset}%`"
            :stop-color="stop.color"
          />
        </linearGradient>
      </defs>
      <g transform="rotate(-90 70 70)" fill="none" stroke-width="17">
        <circle
          v-for="(seg, i) in segments"
          :key="i"
          cx="70" cy="70" r="54"
          :stroke="flat ? colors[i % colors.length] : `url(#${uid}-s${i % colors.length})`"
          :stroke-dasharray="seg.dash"
          :stroke-dashoffset="seg.offset"
        />
      </g>
    </svg>
    <div v-if="centerValue" class="dt-donut__center">
      <span class="dt-donut__value" :style="{ fontSize: `${centerSize}px` }">{{ centerValue }}</span>
      <span v-if="centerCaption" class="dt-donut__caption">{{ centerCaption }}</span>
    </div>
  </div>
</template>

<style scoped>
.dt-donut {
  position: relative;
  width: 172px;
  height: 172px;
}

.dt-donut__svg {
  width: 172px;
  height: 172px;
  display: block;
}

.dt-donut__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.dt-donut__value {
  font-weight: 650;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.dt-donut__caption {
  font-size: 11px;
  color: var(--muted);
}
</style>
