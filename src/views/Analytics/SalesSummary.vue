<script setup lang="ts">
import { computed } from 'vue'
import { useAnalyticsStore } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useAnalyticsStore()
const { accountMetrics, salesChannels } = storeToRefs(store)

const totalOrders = computed(() => salesChannels.value.reduce((sum, c) => sum + c.orders, 0))
const avgOrderValue = computed(() =>
  totalOrders.value ? accountMetrics.value.totalRevenue / totalOrders.value : 0,
)
const topChannel = computed(() => salesChannels.value[0])
const maxRevenue = computed(() => Math.max(...salesChannels.value.map((c) => c.revenue), 1))

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const tableHeaders = [
  { title: 'Channel', key: 'channel' },
  { title: 'Revenue', key: 'revenue', align: 'end' as const },
  { title: 'Orders', key: 'orders', align: 'end' as const },
  { title: 'Avg Order', key: 'aov', align: 'end' as const },
  { title: 'Share', key: 'share', align: 'end' as const },
  { title: 'vs. prior', key: 'delta', align: 'end' as const },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Sales Summary"
      subtitle="Revenue attribution and channel performance overview"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="calendar-range" class="text-none" color="surface">Last 30 days</v-btn>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export Report</v-btn>
      </template>
    </MpPageHeader>

    <!-- KPI row -->
    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Revenue Attributed"
          :value="currency(accountMetrics.totalRevenue)"
          icon="dollar-sign"
          color="primary"
          trend="+8.3%"
          :trend-positive="true"
          period="vs. prior 30 days"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Orders"
          :value="totalOrders.toLocaleString()"
          icon="shopping-bag"
          trend="+5.1%"
          :trend-positive="true"
          period="vs. prior 30 days"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Avg Order Value"
          :value="currency(avgOrderValue)"
          icon="receipt"
          trend="+2.4%"
          :trend-positive="true"
          period="vs. prior 30 days"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <MpKpiCard
          label="Top Channel"
          :value="topChannel?.channel ?? '—'"
          icon="trophy"
          :sub-stat="topChannel ? `${topChannel.share}% of revenue` : ''"
        />
      </v-col>
    </v-row>

    <!-- Revenue by channel -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <div class="d-flex align-center justify-space-between px-5 pt-4 pb-1">
        <div class="text-subtitle-1 font-weight-bold">Revenue by Channel</div>
        <span class="text-caption text-medium-emphasis">Attributed revenue, last 30 days</span>
      </div>

      <div v-if="salesChannels.length" class="channel-bars px-5 py-4">
        <div v-for="c in salesChannels" :key="c.channel" class="channel-row">
          <div class="channel-row__label">
            <v-icon size="16" class="channel-row__icon">{{ c.icon }}</v-icon>
            <span class="text-body-2 font-weight-medium">{{ c.channel }}</span>
          </div>
          <div class="channel-row__track">
            <div class="channel-row__fill" :style="{ width: `${(c.revenue / maxRevenue) * 100}%` }" />
          </div>
          <div class="channel-row__value num">{{ currency(c.revenue) }}</div>
          <div class="channel-row__share text-medium-emphasis num">{{ c.share.toFixed(1) }}%</div>
          <div
            class="channel-row__delta num"
            :class="c.delta >= 0 ? 'text-success' : 'text-error'"
          >
            <v-icon size="13">{{ c.delta >= 0 ? 'trending-up' : 'trending-down' }}</v-icon>
            {{ Math.abs(c.delta).toFixed(1) }}%
          </div>
        </div>
      </div>

      <MpEmptyState
        v-else
        icon="bar-chart-3"
        title="No channel data"
        description="Revenue attribution will appear here once orders are recorded."
      />

      <v-divider />

      <v-data-table
        :headers="tableHeaders"
        :items="salesChannels"
        density="comfortable"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #item.channel="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="16" class="text-medium-emphasis">{{ item.icon }}</v-icon>
            <span class="font-weight-medium">{{ item.channel }}</span>
          </div>
        </template>
        <template #item.revenue="{ item }">
          <span class="font-weight-bold text-primary">{{ currency(item.revenue) }}</span>
        </template>
        <template #item.orders="{ item }">{{ item.orders.toLocaleString() }}</template>
        <template #item.aov="{ item }">{{ currency(item.orders ? item.revenue / item.orders : 0) }}</template>
        <template #item.share="{ item }">{{ item.share.toFixed(1) }}%</template>
        <template #item.delta="{ item }">
          <span :class="item.delta >= 0 ? 'text-success' : 'text-error'" class="font-weight-medium">
            {{ item.delta >= 0 ? '+' : '' }}{{ item.delta.toFixed(1) }}%
          </span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.channel-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.channel-row {
  display: grid;
  grid-template-columns: 180px 1fr 110px 56px 74px;
  align-items: center;
  gap: 16px;
}

.channel-row__label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.channel-row__icon {
  color: rgb(var(--v-theme-primary));
}

.channel-row__track {
  height: 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}

.channel-row__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-primary), 0.65),
    rgb(var(--v-theme-primary))
  );
  transition: width 0.4s ease;
}

.channel-row__value {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.channel-row__share {
  text-align: right;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.channel-row__delta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  font-size: 0.8125rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 700px) {
  .channel-row {
    grid-template-columns: 120px 1fr 90px;
  }
  .channel-row__share,
  .channel-row__delta {
    display: none;
  }
}
</style>
