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
        :class="kpi.trendUp === undefined ? 'is-flat' : kpi.trendUp ? 'is-up' : 'is-down'"
      >
        <v-icon size="13">{{ kpi.trendUp === undefined ? 'minus' : kpi.trendUp ? 'trending-up' : 'trending-down' }}</v-icon>
        <span>{{ kpi.trend }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dv-kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  container-type: inline-size;
}

.dv-kpi-tile {
  flex: 1 1 120px;
  min-width: 120px;
  padding: var(--mp-space-10) var(--mp-space-12);
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: var(--mp-radius-12);
  background: rgb(var(--v-theme-surface));
}

.dv-kpi-tile__label {
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dv-kpi-tile__value {
  font-size: var(--mp-fontSize-20);
  font-weight: 700;
  line-height: 1.2;
  margin-top: var(--mp-space-2);
  color: rgb(var(--v-theme-on-surface));
}

.dv-kpi-tile__trend {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  margin-top: var(--mp-space-4);
  font-size: var(--mp-fontSize-12);
  font-weight: 500;
}

.dv-kpi-tile__trend.is-up {
  color: rgb(var(--v-theme-success));
}

.dv-kpi-tile__trend.is-down {
  color: rgb(var(--v-theme-error));
}

/* Flat is neither good nor bad. */
.dv-kpi-tile__trend.is-flat {
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Three 120px tiles need ~376px. In the 400px drawer (~300px of content) they used to wrap 2+1 and
   the third stretched full width; instead they stack as rows — label left, value and trend right.
   (The literal is a container-query breakpoint: custom properties cannot be used inside @container.) */
@container (max-width: 375px) {
  .dv-kpi-tile {
    flex-basis: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--mp-space-12);
  }

  .dv-kpi-tile__label {
    grid-row: 1 / span 2;
  }

  .dv-kpi-tile__value,
  .dv-kpi-tile__trend {
    grid-column: 2;
    margin-top: 0;
    justify-self: end;
  }
}
</style>
