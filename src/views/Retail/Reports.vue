<script setup lang="ts">
import { computed, useId } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import { useRetailStore } from '@/stores/useRetail'

const store = useRetailStore()
const sparkId = useId()

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const kpis = computed(() => {
  const k = store.kpis
  return [
    { label: 'Sales today',       value: fmt(k.salesToday),                                 icon: 'trending-up',     color: 'retail',     trend: `${k.salesTrend}% vs yesterday`,       trendPositive: k.salesTrend >= 0, period: 'Today across all stores' },
    { label: 'Transactions',      value: k.txnCountToday.toString(),                        icon: 'receipt',         color: 'primary',    trend: `${k.txnTrend}% vs yesterday`,         trendPositive: k.txnTrend >= 0,   period: 'Completed today' },
    { label: 'Average basket',    value: fmt(k.avgBasket),                                   icon: 'shopping-bag',    color: 'analytics',  trend: `${k.avgBasketTrend}% vs yesterday`,   trendPositive: k.avgBasketTrend >= 0, period: 'Per transaction' },
    { label: 'Returns today',     value: k.returnsToday.toString(),                          icon: 'undo-2',          color: 'warning',    subStat: 'Refunds + partial refunds' },
  ]
})

/* Mock series for sparkline (same formula as merch) */
const sparklinePoints = computed(() => {
  const delta = store.kpis.salesTrend
  const slope = Math.max(-0.2, Math.min(0.24, delta / 900))
  const base = [0.2, 0.23, 0.31, 0.28, 0.36, 0.34, 0.43, 0.40, 0.51, 0.47, 0.56]
  const values = base.map((v, i) => Math.min(0.9, Math.max(0.08, v + slope * i)))
  const maxIndex = values.length - 1
  return values.map((v, i) => `${((i / maxIndex) * 100).toFixed(1)},${(48 - v * 38).toFixed(1)}`).join(' ')
})

/* Top SKUs (synth from transactions) */
const topSkus = computed(() => {
  const tally = new Map<string, { count: number; revenue: number }>()
  store.transactionList.forEach((t) => {
    if (t.status !== 'completed') return
    // synthesize a SKU from registerId so it's deterministic-looking
    const sku = (['TEE-001-BLK-M', 'JEAN-512-DRK-32', 'SNEAK-A1-WHT-10', 'CAP-001-NVY', 'BAG-LTH-BLK'] as const)[Number(t.id.slice(-1)) % 5]!
    const row = tally.get(sku) ?? { count: 0, revenue: 0 }
    row.count += t.itemCount
    row.revenue += t.total
    tally.set(sku, row)
  })
  return Array.from(tally.entries())
    .map(([sku, v]) => ({ sku, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
})

const topByLocation = computed(() => {
  return store.locationList.map((l) => {
    const txns = store.transactionList.filter((t) => t.locationId === l.id && t.status === 'completed')
    return {
      ...l,
      txnCount: txns.length,
      revenue: txns.reduce((s, t) => s + t.total, 0),
    }
  }).sort((a, b) => b.revenue - a.revenue)
})

const topByAssociate = computed(() => {
  return store.associateList.map((a) => {
    const txns = store.transactionList.filter((t) => t.associateId === a.id && t.status === 'completed')
    return {
      ...a,
      txnCount: txns.length,
      revenue: txns.reduce((s, t) => s + t.total, 0),
    }
  }).filter((a) => a.txnCount > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
})

const productHeaders = [
  { title: 'SKU',     key: 'sku',     sortable: true },
  { title: 'Units',   key: 'count',   sortable: true, align: 'end' as const, width: 110 },
  { title: 'Revenue', key: 'revenue', sortable: true, align: 'end' as const, width: 130 },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Reports"
      subtitle="Daily trading summary for your Retail Cloud. Phase 2 adds trend comparisons and exports."
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="calendar" @click="">Today</v-btn>
        <v-btn variant="outlined" class="text-none" prepend-icon="download" disabled>Export (Phase 2)</v-btn>
      </template>
    </MpPageHeader>

    <!-- KPI row -->
    <v-row dense>
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
        <v-card flat border rounded="lg" class="retail-kpi-card h-100">
          <div class="retail-kpi-card__inner">
            <div class="retail-kpi-card__left">
              <div class="retail-kpi-card__header-row">
                <div class="retail-kpi-card__icon-chip" :class="`retail-kpi-card__icon-chip--${kpi.color}`">
                  <v-icon size="14">{{ kpi.icon }}</v-icon>
                </div>
                <div style="min-width:0">
                  <div class="retail-kpi-card__title">{{ kpi.label }}</div>
                  <div v-if="kpi.period" class="retail-kpi-card__period">{{ kpi.period }}</div>
                </div>
              </div>
              <div class="retail-kpi-card__value num">{{ kpi.value }}</div>
              <div v-if="kpi.trend" class="retail-kpi-card__trend">
                <span class="retail-kpi-card__trend-pill" :class="kpi.trendPositive ? 'retail-kpi-card__trend-pill--pos' : 'retail-kpi-card__trend-pill--neg'">
                  <v-icon size="12">{{ kpi.trendPositive ? 'chevron-up' : 'chevron-down' }}</v-icon>
                  {{ kpi.trend }}
                </span>
              </div>
              <div v-else-if="kpi.subStat" class="retail-kpi-card__sub">{{ kpi.subStat }}</div>
            </div>
            <div v-if="kpi.trend" class="retail-kpi-card__sparkline-col" aria-hidden="true">
              <svg class="retail-kpi-card__sparkline" viewBox="0 0 100 52" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="`${sparkId}-${kpi.label}`" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
                    <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <polygon :points="`0,52 ${sparklinePoints} 100,52`" :fill="`url(#${sparkId}-${kpi.label})`" class="retail-kpi-card__sparkline-fill" />
                <polyline :points="sparklinePoints" class="retail-kpi-card__sparkline-line" />
              </svg>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Mid row: by location and top SKUs -->
    <v-row dense>
      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="retail-widget-card h-100">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Sales by location</div>
            <div class="retail-widget-header__actions">
              <span class="retail-widget-header__sub">Today</span>
            </div>
          </div>
          <div class="retail-widget-body">
            <div v-for="row in topByLocation" :key="row.id" class="retail-bar-row">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="retail-list-title">{{ row.name }}</span>
                <span class="font-weight-bold" style="color: var(--ink); font-size: 13px;">{{ fmt(row.revenue) }}</span>
              </div>
              <v-progress-linear
                :model-value="topByLocation[0] ? (row.revenue / topByLocation[0].revenue) * 100 : 0"
                color="primary"
                height="6"
                rounded
                bg-color="surface-variant"
              />
              <div class="retail-list-sub mt-1">{{ row.txnCount }} transactions</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card flat border rounded="lg" class="retail-widget-card h-100 d-flex flex-column">
          <div class="retail-widget-header">
            <div class="retail-widget-header__title">Top selling SKUs</div>
            <div class="retail-widget-header__actions">
              <span class="retail-widget-header__sub">Today</span>
            </div>
          </div>
          <v-data-table
            :headers="productHeaders"
            :items="topSkus"
            item-value="sku"
            density="compact"
            hide-default-footer
            class="retail-flat-table flex-grow-1"
          >
            <template #item.revenue="{ item }">
              <span class="font-weight-bold">{{ fmt(item.revenue) }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bottom: top associates -->
    <v-card flat border rounded="lg" class="retail-widget-card">
      <div class="retail-widget-header">
        <div class="retail-widget-header__title">Top associates</div>
        <div class="retail-widget-header__actions">
          <span class="retail-widget-header__sub">Today across all stores</span>
        </div>
      </div>
      <v-data-table
        :headers="[
          { title: 'Associate', key: 'name', sortable: true },
          { title: 'Role', key: 'role', sortable: true, width: 180 },
          { title: 'Transactions', key: 'txnCount', sortable: true, align: 'end', width: 140 },
          { title: 'Revenue', key: 'revenue', sortable: true, align: 'end', width: 140 },
        ]"
        :items="topByAssociate"
        item-value="id"
        density="compact"
        hide-default-footer
        class="retail-flat-table"
      >
        <template #item.role="{ item }">
          <v-chip size="x-small" variant="tonal" color="default" class="font-weight-medium">{{ item.role.replace('_', ' ') }}</v-chip>
        </template>
        <template #item.revenue="{ item }">
          <span class="font-weight-bold">{{ fmt(item.revenue) }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.retail-bar-row + .retail-bar-row {
  margin-top: 14px;
}

.retail-flat-table :deep(.v-table) {
  background: transparent;
}
</style>
