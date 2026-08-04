<script setup lang="ts">
// Solid pie. Wedges computed from raw values, colors assigned by index.
import { computed } from 'vue'
import { DOTTED_PIE_BLUES, pieWedges } from './dottedChartMath'

const props = withDefaults(defineProps<{
  values: number[]
  colors?: readonly string[]
  label: string
}>(), {
  colors: () => DOTTED_PIE_BLUES,
})

const wedges = computed(() => pieWedges(props.values))
</script>

<template>
  <svg viewBox="0 0 120 120" class="dt-pie" role="img" :aria-label="label">
    <path
      v-for="(d, i) in wedges"
      :key="i"
      :d="d"
      :fill="colors[i % colors.length]"
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
