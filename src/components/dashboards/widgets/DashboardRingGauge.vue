<script setup lang="ts">
import { computed, inject, onMounted, ref, unref } from 'vue'
import { activeChartTheme, CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'

const props = withDefaults(defineProps<{
  /** Progress 0–100. */
  value: number
  label?: string
  caption?: string
  size?: number
  thickness?: number
}>(), {
  label: '',
  caption: '',
  size: 120,
  thickness: 10,
})

const override = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(override) ?? activeChartTheme.value)
const arcColor = computed(() => theme.value.series[0])

const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

// Animate from an empty ring to the target on mount (CSS transition on dashoffset).
const mounted = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})
const dashOffset = computed(() =>
  mounted.value ? circumference.value * (1 - clamped.value / 100) : circumference.value,
)
</script>

<template>
  <div
    class="ring-gauge"
    role="img"
    :aria-label="label || `${Math.round(clamped)}%`"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="arcColor"
        :stroke-width="thickness"
        stroke-opacity="0.12"
      />
      <circle
        class="ring-gauge__arc"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="arcColor"
        :stroke-width="thickness"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${center} ${center})`"
      />
    </svg>
    <div class="ring-gauge__center">
      <div class="ring-gauge__value">{{ Math.round(clamped) }}%</div>
      <div v-if="caption" class="ring-gauge__caption">{{ caption }}</div>
    </div>
  </div>
</template>

<style scoped>
.ring-gauge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ring-gauge__arc {
  transition: stroke-dashoffset 0.6s ease-out;
}

.ring-gauge__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.ring-gauge__value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.ring-gauge__caption {
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.2;
}
</style>
