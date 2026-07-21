<script setup lang="ts">
import { provide, toRef } from 'vue'
import { CHART_PALETTE_OVERRIDE } from '@/plugins/chartPalette'

const props = defineProps<{ colors: string[] }>()

// Pin an explicit chart palette for everything rendered in the default slot, so each
// comparison panel's real dashboard widgets render their own palette (see chartPalette.ts).
provide(CHART_PALETTE_OVERRIDE, toRef(props, 'colors'))
</script>

<template>
  <div>
    <slot />
  </div>
</template>
