<script setup lang="ts">
import { computed, provide } from 'vue'
import { CHART_PALETTE_OVERRIDE, type ChartTheme } from '@/plugins/chartPalette'

// `chartId` mirrors the pinned theme onto a `data-chart` attribute so per-theme
// CSS (tooltip/legend skins) can scope to a panel the same way it scopes to
// <html data-chart> app-wide. Omitted = no attribute = unchanged markup.
const props = defineProps<{ theme: ChartTheme; chartId?: string }>()

// Pin an explicit chart theme for everything rendered in the default slot, so each
// comparison panel's real dashboard widgets render their own theme (see chartPalette.ts).
provide(CHART_PALETTE_OVERRIDE, computed(() => props.theme))
</script>

<template>
  <div :data-chart="chartId">
    <slot />
  </div>
</template>
