<script setup lang="ts">
// Gradient pie. Wedges computed from raw values, colors assigned by index;
// each wedge fades from a light tint down to its base colour.
import { computed, useId } from 'vue'
import { tintHex } from '@/plugins/chartPalette'
import { DOTTED_PIE_BLUES, pieWedges } from './dottedChartMath'

const props = withDefaults(defineProps<{
  values: number[]
  colors?: readonly string[]
  label: string
}>(), {
  colors: () => DOTTED_PIE_BLUES,
})

const wedges = computed(() => pieWedges(props.values))
// SVG gradient ids are global to the page — scope them per instance.
const uid = useId()
</script>

<template>
  <svg viewBox="0 0 120 120" class="dt-pie" role="img" :aria-label="label">
    <defs>
      <linearGradient v-for="(color, i) in colors" :id="`${uid}-w${i}`" :key="i" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="tintHex(color, 0.26)" />
        <stop offset="100%" :stop-color="color" />
      </linearGradient>
    </defs>
    <path
      v-for="(d, i) in wedges"
      :key="i"
      :d="d"
      :fill="`url(#${uid}-w${i % colors.length})`"
    />
  </svg>
</template>

<style scoped>
.dt-pie {
  width: 132px;
  height: 132px;
  flex: none;
  display: block;
}
</style>
