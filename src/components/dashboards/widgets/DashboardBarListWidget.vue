<script setup lang="ts">
// Dotted progress-bar list widget (Overview v2): optional big-number headline
// + labeled rows with stippled gradient bars (best sellers, retail today).
import DtDottedBar from '../dotted/DtDottedBar.vue'
import type { DashboardBarListData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardBarListData
}>()
</script>

<template>
  <div class="barlist-widget">
    <div v-if="data.headline" class="barlist-widget__headline">
      <span class="barlist-widget__headline-value">{{ data.headline.value }}</span>
      <span
        v-if="data.headline.delta"
        class="barlist-widget__headline-delta"
        :class="data.headline.deltaPositive === false ? 'barlist-widget__headline-delta--neg' : ''"
      >{{ data.headline.delta }}</span>
      <span v-if="data.headline.caption" class="barlist-widget__headline-caption">{{ data.headline.caption }}</span>
    </div>
    <div class="barlist-widget__rows">
      <div v-for="row in data.rows" :key="row.label" class="barlist-widget__row">
        <div class="barlist-widget__row-head">
          <span class="barlist-widget__label">{{ row.label }}</span>
          <span class="barlist-widget__value">{{ row.value }}</span>
        </div>
        <DtDottedBar :pct="row.pct" />
        <span v-if="row.meta" class="barlist-widget__meta">{{ row.meta }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.barlist-widget {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.barlist-widget__headline {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.barlist-widget__headline-value {
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.barlist-widget__headline-delta {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pos);
}

.barlist-widget__headline-delta--neg {
  color: var(--neg);
}

.barlist-widget__headline-caption {
  font-size: 12.5px;
  color: var(--muted);
}

.barlist-widget__rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* Absorb the fixed grid row's spare height evenly between rows. */
  flex: 1 1 auto;
  justify-content: space-evenly;
}

.barlist-widget__row {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.barlist-widget__row-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.barlist-widget__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.barlist-widget__value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  flex: none;
}

.barlist-widget__meta {
  font-size: 11.5px;
  color: var(--muted);
}
</style>
