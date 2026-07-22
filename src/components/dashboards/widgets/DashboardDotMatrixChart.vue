<script setup lang="ts">
import { computed, inject, unref } from 'vue'
import { activeChartTheme, CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'

const props = withDefaults(defineProps<{
  /** Arbitrary positive values — one column of dots per value. */
  values: number[]
  /** Dots in the tallest column; every column scales against this. */
  maxDots?: number
  /** Column to render at full opacity (default = index of the max value). */
  highlightIndex?: number
  /** Dot diameter in px. */
  dotSize?: number
}>(), {
  maxDots: 6,
  highlightIndex: -1,
  dotSize: 8,
})

const override = inject(CHART_PALETTE_OVERRIDE, undefined)
const theme = computed<ChartTheme>(() => unref(override) ?? activeChartTheme.value)
const dotColor = computed(() => theme.value.series[0])

const maxValue = computed(() => Math.max(...props.values, 1))

const highlight = computed(() => {
  if (props.highlightIndex >= 0) return props.highlightIndex
  let idx = 0
  let best = -Infinity
  props.values.forEach((value, index) => {
    if (value > best) {
      best = value
      idx = index
    }
  })
  return idx
})

const columns = computed(() =>
  props.values.map((value, index) => ({
    count: Math.max(1, Math.round((value / maxValue.value) * props.maxDots)),
    highlighted: index === highlight.value,
  })),
)
</script>

<template>
  <div class="dot-matrix" aria-hidden="true">
    <div
      v-for="(col, i) in columns"
      :key="i"
      class="dot-matrix__col"
      :class="{ 'dot-matrix__col--dim': !col.highlighted }"
    >
      <span
        v-for="d in col.count"
        :key="d"
        class="dot-matrix__dot"
        :style="{ width: `${dotSize}px`, height: `${dotSize}px`, background: dotColor }"
      />
    </div>
  </div>
</template>

<style scoped>
.dot-matrix {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.dot-matrix__col {
  display: flex;
  flex-direction: column-reverse;
  gap: 3px;
}

.dot-matrix__col--dim {
  opacity: 0.55;
}

.dot-matrix__dot {
  display: block;
  border-radius: 50%;
}
</style>
