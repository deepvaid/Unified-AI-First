<script setup lang="ts">
// Solid pie with the full-circle dotted texture overlay. Wedges computed from
// raw values, colors assigned by index.
import { computed, useId } from 'vue'
import { DOTTED_PIE_BLUES, pieWedges } from './dottedChartMath'

const props = withDefaults(defineProps<{
  values: number[]
  colors?: readonly string[]
  label: string
}>(), {
  colors: () => DOTTED_PIE_BLUES,
})

const patternId = `dtPieDots-${useId()}`
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
    <defs>
      <pattern :id="patternId" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="0.95" fill="#ffffff" fill-opacity="0.5" />
      </pattern>
    </defs>
    <circle cx="60" cy="60" r="56" :fill="`url(#${patternId})`" />
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
