<script setup lang="ts">
// Swatch + label + value legend rows for the dotted donut/pie widgets.
export interface DtLegendRow {
  label: string
  value: string
  color: string
  /** Optional period-over-period change, e.g. "↗ 5%" (rendered pos/neg tinted). */
  delta?: string
  deltaPositive?: boolean
}

withDefaults(defineProps<{ rows: DtLegendRow[]; gap?: number }>(), { gap: 9 })
</script>

<template>
  <div class="dt-legend" :style="{ gap: `${gap}px` }">
    <div v-for="row in rows" :key="row.label" class="dt-legend__row">
      <span class="dt-legend__swatch" :style="{ background: row.color }" aria-hidden="true" />
      <span class="dt-legend__label">{{ row.label }}</span>
      <span class="dt-legend__spacer" />
      <span class="dt-legend__value">{{ row.value }}</span>
      <span
        v-if="row.delta"
        class="dt-legend__delta"
        :class="{ 'dt-legend__delta--neg': row.deltaPositive === false }"
      >{{ row.delta }}</span>
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
  font-size: var(--mp-fontSize-13);
}

.dt-legend__swatch {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 2px;
}

.dt-legend__label {
  font-weight: 600;
  color: var(--text-primary);
}

.dt-legend__spacer {
  flex: 1;
}

.dt-legend__value {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.dt-legend__delta {
  font-size: var(--mp-fontSize-12);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--pos);
  white-space: nowrap;
  min-width: 44px;
  text-align: right;
}

.dt-legend__delta--neg {
  color: var(--neg);
}
</style>
