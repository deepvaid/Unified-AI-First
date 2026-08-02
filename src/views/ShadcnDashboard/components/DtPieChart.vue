<script setup lang="ts">
// Solid pie ("Orders by sales channel") — wedge paths from the mockup with a
// full-circle dotted texture overlay.
import { useId } from 'vue'

defineProps<{ wedges: Array<{ d: string; color: string }>; label: string }>()

const patternId = `dtPieDots-${useId()}`
</script>

<template>
  <svg viewBox="0 0 120 120" class="dt-pie" role="img" :aria-label="label">
    <path v-for="wedge in wedges" :key="wedge.color" :d="wedge.d" :fill="wedge.color" />
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
