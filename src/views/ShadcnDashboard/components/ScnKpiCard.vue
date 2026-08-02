<script setup lang="ts">
// shadcn dashboard-block stat card: muted label, large tabular value,
// outlined trend badge in the header action slot, trend footer.
import { computed } from 'vue'
import type { KpiFixture } from '../../ChartLab/chartLabData'
import ScnCard from './ScnCard.vue'
import ScnTrendFooter from './ScnTrendFooter.vue'

const props = defineProps<{ kpi: KpiFixture }>()

const down = computed(() => props.kpi.deltaPct < 0)
</script>

<template>
  <ScnCard>
    <template #heading>
      <p class="kpi__label">{{ kpi.label }}</p>
      <p class="kpi__value">{{ kpi.value }}</p>
    </template>
    <template #action>
      <span class="kpi__badge">
        <v-icon size="12" aria-hidden="true">{{ down ? 'trending-down' : 'trending-up' }}</v-icon>
        {{ kpi.deltaLabel }}
      </span>
    </template>
    <template #footer>
      <ScnTrendFooter
        :trend="down ? 'Trending down this period' : 'Trending up this period'"
        :direction="down ? 'down' : 'up'"
        caption="Compared with the previous 30 days"
      />
    </template>
  </ScnCard>
</template>

<style scoped>
.kpi__label {
  font-size: 14px;
  line-height: 1.3;
  color: var(--scn-muted);
  margin: 0;
}

.kpi__value {
  font-size: 30px;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--scn-fg);
  margin: 4px 0 0;
}

.kpi__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--scn-border);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--scn-fg);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
