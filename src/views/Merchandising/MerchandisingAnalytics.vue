<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

type ReportKind = 'snapshot' | 'search' | 'collections' | 'recommendations'

const route = useRoute()
const store = useMerchandisingStore()

const kind = computed<ReportKind>(() => (route.meta.reportKind as ReportKind | undefined) ?? 'snapshot')

const TITLES: Record<ReportKind, string> = {
  snapshot: 'Performance snapshot',
  search: 'Search analytics',
  collections: 'Smart Collections analytics',
  recommendations: 'Recommendations analytics',
}

const SUBTITLES: Record<ReportKind, string> = {
  snapshot: 'How Merchandising Cloud contributes to revenue for',
  search: 'What shoppers search for and how results convert on',
  collections: 'How Smart Collections perform on',
  recommendations: 'How recommendation widgets perform on',
}

const title = computed(() => TITLES[kind.value])
const subtitle = computed(() => `${SUBTITLES[kind.value]} ${store.activeStore.domain}`)

/* Presentational only — the mock data does not change with the range. */
const dateRange = ref('Last 30 days')
const DATE_RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days']

const report = computed(() => store.moduleAnalytics)

/* — Formatters — */
const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const currencyExact = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (n: number) => n.toLocaleString('en-US')
const pct = (n: number) => `${n.toFixed(1)}%`

/* — Snapshot — */
const snapshotKpis = computed(() => {
  const s = report.value.snapshot
  return [
    { label: 'Revenue', value: currency(s.revenue), icon: 'dollar-sign', color: 'primary' },
    { label: 'Merchandising revenue', value: currency(s.mcRevenue), icon: 'sparkles', color: 'secondary' },
    { label: 'Avg order value', value: currencyExact(s.avgOrderValue), icon: 'receipt', color: 'info' },
    { label: 'Products sold', value: num(s.productsSold), icon: 'package', color: 'success' },
    { label: 'Visits', value: num(s.visits), icon: 'mouse-pointer-click', color: 'warning' },
    { label: 'Unique visitors', value: num(s.uniqueVisitors), icon: 'users', color: 'default' },
  ]
})

const mcShare = computed(() => {
  const s = report.value.snapshot
  return s.revenue > 0 ? (s.mcRevenue / s.revenue) * 100 : 0
})

const shareBars = computed(() => {
  const s = report.value.snapshot
  return [
    { label: 'Merchandising Cloud', icon: 'sparkles', value: s.mcRevenue, share: mcShare.value },
    { label: 'Total revenue', icon: 'dollar-sign', value: s.revenue, share: 100 },
  ]
})

/* — Tables — */
const searchHeaders = [
  { title: 'Query', key: 'term' },
  { title: 'Searches', key: 'count', align: 'end' as const },
  { title: 'CTR', key: 'ctr', align: 'end' as const },
  { title: 'Conversion', key: 'conversion', align: 'end' as const },
]

const zeroResultHeaders = [
  { title: 'Term', key: 'term' },
  { title: 'Count', key: 'count', align: 'end' as const },
]

const collectionHeaders = [
  { title: 'Collection', key: 'collection' },
  { title: 'Views', key: 'views', align: 'end' as const },
  { title: 'Revenue', key: 'revenue', align: 'end' as const },
  { title: 'Conversion', key: 'conversion', align: 'end' as const },
]

const recommendationHeaders = [
  { title: 'Engine', key: 'engine' },
  { title: 'Impressions', key: 'impressions', align: 'end' as const },
  { title: 'Clicks', key: 'clicks', align: 'end' as const },
  { title: 'Revenue', key: 'revenue', align: 'end' as const },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader :title="title" :subtitle="subtitle">
      <template #actions>
        <!-- Page-header control, not a form field: compact + `hide-details` keep
             the header row one control tall. -->
        <v-select
          v-model="dateRange"
          :items="DATE_RANGES"
          hide-details
          prepend-inner-icon="calendar-range"
          class="merch-date-range"
          aria-label="Date range"
        />
      </template>
    </MpPageHeader>

    <!-- Snapshot -->
    <template v-if="kind === 'snapshot'">
      <v-row dense class="flex-grow-0">
        <v-col v-for="kpi in snapshotKpis" :key="kpi.label" cols="12" sm="6" md="4" lg="2">
          <MpKpiCard :label="kpi.label" :value="kpi.value" :icon="kpi.icon" :color="kpi.color" />
        </v-col>
      </v-row>

      <v-card flat border rounded="lg">
        <div class="d-flex align-center justify-space-between px-5 pt-4 pb-1">
          <div class="text-subtitle-1 font-weight-bold">Merchandising Cloud share of revenue</div>
          <span class="text-caption text-medium-emphasis">{{ pct(mcShare) }} of revenue, {{ dateRange.toLowerCase() }}</span>
        </div>
        <div class="share-bars px-5 py-4">
          <div v-for="bar in shareBars" :key="bar.label" class="share-row">
            <div class="share-row__label">
              <v-icon size="16" class="share-row__icon">{{ bar.icon }}</v-icon>
              <span class="text-body-2 font-weight-medium">{{ bar.label }}</span>
            </div>
            <div class="share-row__track">
              <div class="share-row__fill" :style="{ width: `${bar.share}%` }" />
            </div>
            <div class="share-row__value">{{ currency(bar.value) }}</div>
            <div class="share-row__share text-medium-emphasis">{{ pct(bar.share) }}</div>
          </div>
        </div>
      </v-card>
    </template>

    <!-- Search -->
    <template v-else-if="kind === 'search'">
      <v-card flat border rounded="lg">
        <div class="d-flex align-center justify-space-between px-5 pt-4 pb-1">
          <div class="text-subtitle-1 font-weight-bold">Top searches</div>
          <span class="text-caption text-medium-emphasis">{{ dateRange }}</span>
        </div>
        <v-data-table
          :headers="searchHeaders"
          :items="report.searchReport.queries"
          density="comfortable"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #item.term="{ item }">
            <span class="font-weight-medium">{{ item.term }}</span>
          </template>
          <template #item.count="{ item }">{{ num(item.count) }}</template>
          <template #item.ctr="{ item }">{{ pct(item.ctr) }}</template>
          <template #item.conversion="{ item }">{{ pct(item.conversion) }}</template>
          <template #no-data>
            <MpEmptyState
              icon="search"
              title="No search data yet"
              description="Search analytics will appear here once shoppers start searching."
            />
          </template>
        </v-data-table>
      </v-card>

      <v-card flat border rounded="lg">
        <div class="d-flex align-center justify-space-between px-5 pt-4 pb-1">
          <div class="text-subtitle-1 font-weight-bold">Zero-result searches</div>
          <span class="text-caption text-medium-emphasis">{{ dateRange }}</span>
        </div>
        <v-data-table
          :headers="zeroResultHeaders"
          :items="report.searchReport.noResultQueries"
          density="comfortable"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #item.term="{ item }">
            <span class="font-weight-medium">{{ item.term }}</span>
          </template>
          <template #item.count="{ item }">{{ num(item.count) }}</template>
          <template #no-data>
            <MpEmptyState
              icon="search-x"
              title="No zero-result searches"
              description="Great news — every search returned results."
            />
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Smart Collections -->
    <template v-else-if="kind === 'collections'">
      <v-card flat border rounded="lg">
        <div class="d-flex align-center justify-space-between px-5 pt-4 pb-1">
          <div class="text-subtitle-1 font-weight-bold">Top collections</div>
          <span class="text-caption text-medium-emphasis">{{ dateRange }}</span>
        </div>
        <v-data-table
          :headers="collectionHeaders"
          :items="report.collectionsReport.rows"
          density="comfortable"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #item.collection="{ item }">
            <span class="font-weight-medium">{{ item.collection }}</span>
          </template>
          <template #item.views="{ item }">{{ num(item.views) }}</template>
          <template #item.revenue="{ item }">
            <span class="font-weight-bold text-primary">{{ currency(item.revenue) }}</span>
          </template>
          <template #item.conversion="{ item }">{{ pct(item.conversion) }}</template>
          <template #no-data>
            <MpEmptyState
              icon="layout-grid"
              title="No collection data yet"
              description="Collection analytics will appear here once shoppers browse your collections."
            />
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Recommendations -->
    <template v-else>
      <v-card flat border rounded="lg">
        <div class="d-flex align-center justify-space-between px-5 pt-4 pb-1">
          <div class="text-subtitle-1 font-weight-bold">Widget performance</div>
          <span class="text-caption text-medium-emphasis">{{ dateRange }}</span>
        </div>
        <v-data-table
          :headers="recommendationHeaders"
          :items="report.recommendationsReport.rows"
          density="comfortable"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #item.engine="{ item }">
            <span class="font-weight-medium">{{ item.engine }}</span>
          </template>
          <template #item.impressions="{ item }">{{ num(item.impressions) }}</template>
          <template #item.clicks="{ item }">{{ num(item.clicks) }}</template>
          <template #item.revenue="{ item }">
            <span class="font-weight-bold text-primary">{{ currency(item.revenue) }}</span>
          </template>
          <template #no-data>
            <MpEmptyState
              icon="sparkles"
              title="No recommendation data yet"
              description="Widget analytics will appear here once your engines start serving recommendations."
            />
          </template>
        </v-data-table>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.merch-date-range {
  width: 190px;
  flex-grow: 0;
}

.share-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.share-row {
  display: grid;
  grid-template-columns: 180px 1fr 110px 56px;
  align-items: center;
  gap: 16px;
}

.share-row__label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.share-row__icon {
  color: rgb(var(--v-theme-primary));
}

.share-row__track {
  height: 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}

.share-row__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-primary), 0.65),
    rgb(var(--v-theme-primary))
  );
  transition: width 0.4s ease;
}

.share-row__value {
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.share-row__share {
  text-align: right;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 700px) {
  .share-row {
    grid-template-columns: 120px 1fr 90px;
  }
  .share-row__share {
    display: none;
  }
}
</style>
