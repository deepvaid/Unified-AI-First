<script setup lang="ts">
// shadcn CardFooter content: trend line (font-medium + 16px trend icon)
// over a muted caption line. Data comes from DashboardTrendFooter on the
// widget's data payload; rendered by DashboardWidgetCard / DashboardKpiWidget.
import type { DashboardTrendFooter } from '@/stores/dashboards/types'

withDefaults(defineProps<{
  trend: string
  caption?: string
  direction?: DashboardTrendFooter['direction']
}>(), {
  caption: undefined,
  direction: 'up',
})
</script>

<template>
  <div class="dashboard-trend-footer">
    <div class="dashboard-trend-footer__line">
      {{ trend }}
      <v-icon v-if="direction !== 'none'" size="15" aria-hidden="true">
        {{ direction === 'down' ? 'trending-down' : 'trending-up' }}
      </v-icon>
    </div>
    <div v-if="caption" class="dashboard-trend-footer__caption">{{ caption }}</div>
  </div>
</template>

<style scoped>
.dashboard-trend-footer {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dashboard-trend-footer__line {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.1;
  color: var(--text-primary);
}

.dashboard-trend-footer__caption {
  font-size: 12.5px;
  line-height: 1.3;
  color: var(--muted);
}
</style>
