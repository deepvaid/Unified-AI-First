<script setup lang="ts">
import { computed, provide } from 'vue'
import { CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'

const props = defineProps<{ theme: ChartTheme }>()

// Pin an explicit chart theme for everything rendered in the default slot, so each
// comparison panel's real dashboard widgets render their own theme (see chartPalette.ts).
provide(CHART_PALETTE_OVERRIDE, computed(() => props.theme))
</script>

<template>
  <div>
    <slot />
  </div>
</template>
