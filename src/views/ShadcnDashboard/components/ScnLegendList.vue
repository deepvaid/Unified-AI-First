<script setup lang="ts">
// Swatch + label + value legend rows shared by the donut/pie cards.
import type { LegendRow } from '../dottedDemoData'

withDefaults(defineProps<{ rows: LegendRow[]; gap?: number }>(), { gap: 9 })
</script>

<template>
  <div class="dt-legend" :style="{ gap: `${gap}px` }">
    <div v-for="row in rows" :key="row.label" class="dt-legend__row">
      <span class="dt-legend__swatch" :style="{ background: row.color }" aria-hidden="true" />
      <span class="dt-legend__label">{{ row.label }}</span>
      <span class="dt-legend__spacer" />
      <span class="dt-legend__value">{{ row.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.dt-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.dt-legend__row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12.5px;
}

.dt-legend__swatch {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 2px;
}

.dt-legend__label {
  font-weight: 600;
  color: var(--scn-fg);
}

.dt-legend__spacer {
  flex: 1;
}

.dt-legend__value {
  color: var(--scn-muted);
  font-variant-numeric: tabular-nums;
}
</style>
