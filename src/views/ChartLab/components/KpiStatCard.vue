<script setup lang="ts">
// KPI stat card — icon chip + label header, big value + tinted delta pill
// inside a soft inset panel (reference: "Total Campaigns / Active Contacts /
// Avg. Open Rate / Revenue (MTD)" strip).
import type { KpiFixture } from '../chartLabData'

defineProps<{ kpi: KpiFixture }>()
</script>

<template>
  <section class="kpi" :aria-label="`${kpi.label}: ${kpi.value}, ${kpi.deltaLabel} ${kpi.caption}`">
    <header class="kpi__head">
      <span class="kpi__chip" aria-hidden="true">
        <v-icon size="15">{{ kpi.icon }}</v-icon>
      </span>
      <span class="kpi__label">{{ kpi.label }}</span>
    </header>
    <div class="kpi__panel" aria-hidden="true">
      <span class="kpi__value">{{ kpi.value }}</span>
      <span class="kpi__pill" :class="kpi.deltaPct >= 0 ? 'kpi__pill--pos' : 'kpi__pill--neg'">
        <v-icon size="12">{{ kpi.deltaPct >= 0 ? 'trending-up' : 'trending-down' }}</v-icon>
        {{ kpi.deltaLabel }}
      </span>
    </div>
    <p class="kpi__caption" aria-hidden="true">{{ kpi.caption }}</p>
  </section>
</template>

<style scoped>
.kpi {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03), 0 10px 28px rgba(15, 23, 42, 0.04);
  padding: 16px 18px;
  min-width: 0;
}

.kpi__head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}

.kpi__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: var(--surface-secondary);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.kpi__label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi__panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--surface-secondary);
  border-radius: 14px;
  padding: 12px 14px;
}

.kpi__value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.kpi__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.kpi__pill--pos {
  color: var(--pos-ink);
  background: color-mix(in oklch, var(--pos) 14%, #ffffff);
}

.kpi__pill--neg {
  color: var(--neg-ink);
  background: color-mix(in oklch, var(--neg) 14%, #ffffff);
}

.kpi__caption {
  margin: 8px 4px 0;
  font-size: 11.5px;
  color: var(--text-muted);
}
</style>
