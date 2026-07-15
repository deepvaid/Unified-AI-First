<script setup lang="ts">
// Compact inline KPI tiles for the assistant (drawer + experience). Deliberately
// NOT the dashboard MpKpiCard — that card is `h-100` and balloons to fill the
// experience's tall flex column, overflowing onto the chart card below.
defineProps<{
  kpis: Array<{
    label: string
    value: string
    trend?: string
    trendUp?: boolean
    icon?: string
  }>
}>()
</script>

<template>
  <div class="dv-kpi-row">
    <div v-for="(kpi, i) in kpis" :key="i" class="dv-kpi-tile">
      <div class="dv-kpi-tile__label">{{ kpi.label }}</div>
      <div class="dv-kpi-tile__value">{{ kpi.value }}</div>
      <div
        v-if="kpi.trend"
        class="dv-kpi-tile__trend"
        :class="kpi.trendUp === false ? 'is-down' : 'is-up'"
      >
        <v-icon size="13">{{ kpi.trendUp === false ? 'trending-down' : 'trending-up' }}</v-icon>
        <span>{{ kpi.trend }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dv-kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dv-kpi-tile {
  flex: 1 1 120px;
  min-width: 120px;
  padding: 10px 12px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-component-card-radius-md);
  background: rgb(var(--v-theme-surface));
}

.dv-kpi-tile__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dv-kpi-tile__value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface));
}

.dv-kpi-tile__trend {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
}

.dv-kpi-tile__trend.is-up {
  color: rgb(var(--v-theme-success));
}

.dv-kpi-tile__trend.is-down {
  color: rgb(var(--v-theme-error));
}
</style>
