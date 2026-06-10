<script setup lang="ts">
import MpKpiCard from '@/components/MpKpiCard.vue'

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
  <div class="d-flex ga-2 flex-wrap">
    <MpKpiCard
      v-for="(kpi, i) in kpis"
      :key="i"
      :label="kpi.label"
      :value="kpi.value"
      :icon="kpi.icon"
      :trend="kpi.trend"
      :trend-positive="kpi.trendUp"
      class="dv-kpi-row__card flex-grow-1"
    />
  </div>
</template>

<style scoped>
.dv-kpi-row__card {
  min-width: 120px;
}
</style>
