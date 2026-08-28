<script setup lang="ts">
// Dotted progress-bar list widget (Overview v2): optional big-number headline
// + labeled rows with gradient bars (best sellers, retail today).
import { computed, inject, unref } from 'vue'
import DtDottedBar from '../dotted/DtDottedBar.vue'
import { useBarGradients } from '../dotted/dottedChartMath'
import { CHART_PALETTE_OVERRIDE, useChartTheme, type ChartTheme } from '@/plugins/chartPalette'
import type { DashboardBarListData } from '@/stores/dashboards/types'

defineProps<{
  data: DashboardBarListData
}>()

const { theme } = useChartTheme()
const themeOverride = inject(CHART_PALETTE_OVERRIDE, undefined)
const resolvedTheme = computed<ChartTheme>(() => unref(themeOverride) ?? theme.value)
const { barGradient } = useBarGradients(resolvedTheme)
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
        <DtDottedBar :pct="row.pct" :gradient="barGradient" />
        <span v-if="row.meta" class="barlist-widget__meta">{{ row.meta }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.barlist-widget {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
  width: 100%;
  height: 100%;
  min-height: 0;
}

.barlist-widget__headline {
  display: flex;
  align-items: baseline;
  gap: var(--mp-space-10);
}

.barlist-widget__headline-value {
  font-size: var(--mp-fontSize-32);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.barlist-widget__headline-delta {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--pos);
}

.barlist-widget__headline-delta--neg {
  color: var(--neg);
}

.barlist-widget__headline-caption {
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
}

.barlist-widget__rows {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-14);
  /* Absorb the fixed grid row's spare height evenly between rows. */
  flex: 1 1 auto;
  justify-content: space-evenly;
}

.barlist-widget__row {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.barlist-widget__row-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mp-space-12);
}

.barlist-widget__label {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.barlist-widget__value {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  flex: none;
}

.barlist-widget__meta {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
}
</style>
