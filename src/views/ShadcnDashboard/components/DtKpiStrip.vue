<script setup lang="ts">
// Joined 4-cell KPI selector strip — selecting a cell drives the main chart.
import type { DottedMetric, KpiCell } from '../dottedDemoData'

defineProps<{ cells: KpiCell[]; vsLabel: string }>()
const model = defineModel<DottedMetric>({ required: true })
</script>

<template>
  <section class="dt-kpis">
    <button
      v-for="cell in cells"
      :key="cell.key"
      type="button"
      class="dt-kpis__cell"
      :class="{ 'dt-kpis__cell--active': model === cell.key }"
      :aria-pressed="model === cell.key"
      @click="model = cell.key"
    >
      <span class="dt-kpis__wash" aria-hidden="true" />
      <span class="dt-kpis__bar" aria-hidden="true" />
      <span class="dt-kpis__label">{{ cell.label }}</span>
      <span class="dt-kpis__value">{{ cell.value }}</span>
      <span class="dt-kpis__delta-row">
        <span class="dt-kpis__delta" :style="{ color: cell.deltaColor }">{{ cell.delta }}</span>
        <span class="dt-kpis__vs">{{ vsLabel }}</span>
      </span>
    </button>
  </section>
</template>

<style scoped>
.dt-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--scn-border);
  border: 1px solid var(--scn-border);
  border-radius: var(--scn-radius);
  overflow: hidden;
}

.dt-kpis__cell {
  position: relative;
  background: linear-gradient(180deg, var(--scn-card) 0%, var(--dt-kpi-bottom, #fafbfd) 100%);
  border: 0;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.v-theme--maropostDark .dt-kpis__cell {
  --dt-kpi-bottom: var(--scn-card);
}

.dt-kpis__wash {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--accent) 15%, transparent) 0%,
    color-mix(in oklch, var(--accent) 3%, transparent) 100%
  );
  opacity: 0;
}

.dt-kpis__bar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0;
}

.dt-kpis__cell--active .dt-kpis__wash,
.dt-kpis__cell--active .dt-kpis__bar {
  opacity: 1;
}

.dt-kpis__label {
  position: relative;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--scn-muted);
}

.dt-kpis__value {
  position: relative;
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
}

.dt-kpis__delta-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
}

.dt-kpis__delta {
  font-size: 12.5px;
  font-weight: 600;
}

.dt-kpis__vs {
  font-size: 12.5px;
  color: var(--scn-muted);
}

@media (max-width: 1100px) {
  .dt-kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .dt-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
