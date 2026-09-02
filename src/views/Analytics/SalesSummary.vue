<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnalyticsStore, dateRangeLabel, type DateRangeValue } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'

const store = useAnalyticsStore()
const { accountMetrics, salesChannels } = storeToRefs(store)
const toast = useToast()

// Channel attribution has no per-row date, so the range is a labelled reporting-window control.
const dateRange = ref<DateRangeValue>({ preset: 'Last 30 days' })

function exportCsv() {
  downloadCsv('sales-summary', salesChannels.value, [
    { title: 'Channel', value: 'channel' },
    { title: 'Revenue', value: 'revenue' },
    { title: 'Orders', value: 'orders' },
    { title: 'Avg Order', value: (c) => (c.orders ? Math.round(c.revenue / c.orders) : 0) },
    { title: 'Share', value: (c) => `${c.share.toFixed(1)}%` },
    { title: 'vs. prior', value: (c) => `${c.delta >= 0 ? '+' : ''}${c.delta.toFixed(1)}%` },
  ])
  toast.success(`Exported ${salesChannels.value.length} rows`)
}

const totalOrders = computed(() => salesChannels.value.reduce((sum, c) => sum + c.orders, 0))
const avgOrderValue = computed(() =>
  totalOrders.value ? accountMetrics.value.totalRevenue / totalOrders.value : 0,
)
const topChannel = computed(() => salesChannels.value[0])
const maxRevenue = computed(() => Math.max(...salesChannels.value.map((c) => c.revenue), 1))

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// Channel + Revenue are the identity/headline pair and always show; the derived
// metrics drop out progressively so the table never side-scrolls on a phone.
// (The channel-bar rows above drop share + delta below layout.breakpointCompact.)
const tableHeaders = [
  { title: 'Channel', key: 'channel' },
  { title: 'Revenue', key: 'revenue', align: 'end' as const },
  { title: 'Orders', key: 'orders', align: 'end' as const, hideBelow: 'sm' as const },
  { title: 'Avg Order', key: 'aov', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'Share', key: 'share', align: 'end' as const, hideBelow: 'md' as const },
  { title: 'vs. prior', key: 'delta', align: 'end' as const, hideBelow: 'sm' as const },
]

const { visibleHeaders } = useResponsiveTableHeaders(tableHeaders)
const { loading } = useInitialLoad()
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Sales Summary"
      subtitle="Revenue attribution and channel performance overview"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export Report</v-btn>
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
      <div class="channel-head">
        <MpSectionHeader
          title="Revenue by Channel"
          :description="`Attributed revenue, ${dateRangeLabel(dateRange).toLowerCase()}`"
        />
      </div>

      <MpTableSkeleton v-if="loading" :rows="6" :columns="6" />

      <template v-else>
      <div v-if="salesChannels.length" class="channel-bars">
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
            <v-icon size="16">{{ c.delta >= 0 ? 'trending-up' : 'trending-down' }}</v-icon>
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
        :headers="visibleHeaders"
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
          <span class="font-weight-medium">{{ currency(item.revenue) }}</span>
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
      </template>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
/* The card's own inset frames the section header and the bar list; the table
   below carries its own cell padding, so it sits flush. */
.channel-head {
  padding: var(--mp-component-card-padding) var(--mp-component-card-padding) 0;
}

/* One grid for the whole list (rows are `display: contents`), so the
   content-sized label and figure columns are shared and every bar starts on the
   same line without a fixed pixel width per column. */
.channel-bars {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: var(--mp-space-12) var(--mp-space-16);
  padding: 0 var(--mp-component-card-padding) var(--mp-component-card-padding);
}

.channel-row {
  display: contents;
}

.channel-row__label {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  min-width: 0;
}

.channel-row__icon {
  color: var(--on-surface-muted);
}

.channel-row__track {
  height: var(--mp-space-10);
  border-radius: var(--mp-radius-full);
  background: var(--surface-secondary);
  overflow: hidden;
}

.channel-row__fill {
  height: 100%;
  border-radius: var(--mp-radius-full);
  background: var(--accent-default);
  transition: width var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard);
}

.channel-row__value {
  text-align: right;
  font-weight: var(--mp-fontWeight-semibold);
}

.channel-row__share {
  text-align: right;
  font-size: var(--mp-fontSize-13);
}

.channel-row__delta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mp-space-2);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
}

@media (max-width: ($mp-layout-breakpointCompact - 0.02px)) {
  .channel-bars {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .channel-row__share,
  .channel-row__delta {
    display: none;
  }
}
</style>
