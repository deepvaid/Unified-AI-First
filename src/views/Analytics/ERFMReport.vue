<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAnalyticsStore, dateRangeLabel, type DateRangeValue } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDateRangeSelect from '@/components/MpDateRangeSelect.vue'
import { downloadCsv } from '@/utils/exportCsv'
import { useToast } from '@/composables/useToast'

const store = useAnalyticsStore()
const { rfmAnalyzed, rfmSegments } = storeToRefs(store)
const toast = useToast()

// Segments are computed over the whole base, so the range is a labelled analysis-window control.
const dateRange = ref<DateRangeValue>({ preset: 'Last 90 days' })

function exportSegments() {
  downloadCsv('erfm-segments', rfmSegments.value, [
    { title: 'Segment', value: 'name' },
    { title: 'Customers', value: 'count' },
    { title: 'Share', value: (s) => `${s.share.toFixed(1)}%` },
    { title: 'Avg Recency (days)', value: 'recencyDays' },
    { title: 'Avg Frequency', value: 'frequency' },
    { title: 'Avg Value', value: 'avgValue' },
    { title: 'Recommended Action', value: 'action' },
  ])
  toast.success(`Exported ${rfmSegments.value.length} rows`)
}

const toneColor: Record<string, string> = {
  success: 'rgb(var(--v-theme-success))',
  info: 'rgb(var(--v-theme-info))',
  warning: 'rgb(var(--v-theme-warning))',
  error: 'rgb(var(--v-theme-error))',
  neutral: 'rgba(var(--v-theme-on-surface), 0.4)',
}

const weighted = (pick: (s: (typeof rfmSegments.value)[number]) => number) =>
  rfmSegments.value.reduce((sum, s) => sum + pick(s) * s.count, 0) / (rfmAnalyzed.value || 1)

const avgRecency = computed(() => Math.round(weighted((s) => s.recencyDays)))
const avgFrequency = computed(() => weighted((s) => s.frequency).toFixed(1))
const avgMonetary = computed(() => weighted((s) => s.avgValue))

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      title="eRFM Report"
      subtitle="Enhanced Recency, Frequency & Monetary segmentation"
    >
      <template #actions>
        <MpDateRangeSelect v-model="dateRange" />
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportSegments">Export Segments</v-btn>
      </template>
    </MpPageHeader>

    <template v-if="rfmSegments.length">
      <!-- Summary KPIs -->
      <v-row dense>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Customers Analyzed" :value="rfmAnalyzed.toLocaleString()" icon="users" color="analytics" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Avg Recency" :value="`${avgRecency} days`" icon="clock" sub-stat="Since last order" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Avg Frequency" :value="`${avgFrequency} orders`" icon="repeat" sub-stat="Lifetime orders" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <MpKpiCard label="Avg Monetary" :value="currency(avgMonetary)" icon="dollar-sign" color="success" sub-stat="Avg customer value" />
        </v-col>
      </v-row>

      <!-- Distribution bar -->
      <v-card variant="flat" border rounded="lg" class="pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-1">Segment Distribution</div>
        <div class="text-caption text-medium-emphasis mb-4">Share of analyzed customer base · {{ dateRangeLabel(dateRange).toLowerCase() }}</div>
        <div class="rfm-dist">
          <div
            v-for="s in rfmSegments"
            :key="s.key"
            class="rfm-dist__seg"
            :style="{ width: `${s.share}%`, background: toneColor[s.tone] }"
            :title="`${s.name} — ${s.share}%`"
          />
        </div>
        <div class="d-flex flex-wrap ga-4 mt-4">
          <div v-for="s in rfmSegments" :key="s.key" class="d-flex align-center ga-2">
            <span class="rfm-legend-dot" :style="{ background: toneColor[s.tone] }" />
            <span class="text-caption">{{ s.name }}</span>
          </div>
        </div>
      </v-card>

      <!-- Segment cards -->
      <v-row dense>
        <v-col v-for="s in rfmSegments" :key="s.key" cols="12" sm="6" md="4">
          <v-card variant="flat" border rounded="lg" class="rfm-card h-100" :style="{ '--seg': toneColor[s.tone] }">
            <div class="rfm-card__accent" />
            <div class="pa-5">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center ga-2">
                  <span class="rfm-legend-dot" :style="{ background: toneColor[s.tone] }" />
                  <span class="text-subtitle-2 font-weight-bold">{{ s.name }}</span>
                </div>
                <span class="text-caption text-medium-emphasis num">{{ s.share.toFixed(1) }}%</span>
              </div>

              <div class="d-flex align-baseline ga-2 mb-4">
                <span class="text-h5 font-weight-bold num">{{ s.count.toLocaleString() }}</span>
                <span class="text-caption text-medium-emphasis">customers</span>
              </div>

              <div class="rfm-card__stats mb-4">
                <div class="rfm-card__stat">
                  <div class="text-caption text-medium-emphasis">Recency</div>
                  <div class="text-body-2 font-weight-medium num">{{ s.recencyDays }}d</div>
                </div>
                <div class="rfm-card__stat">
                  <div class="text-caption text-medium-emphasis">Frequency</div>
                  <div class="text-body-2 font-weight-medium num">{{ s.frequency }}</div>
                </div>
                <div class="rfm-card__stat">
                  <div class="text-caption text-medium-emphasis">Avg value</div>
                  <div class="text-body-2 font-weight-medium num">{{ currency(s.avgValue) }}</div>
                </div>
              </div>

              <v-btn variant="tonal" size="small" block class="text-none" prepend-icon="sparkles">
                {{ s.action }}
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <MpEmptyState
      v-else
      icon="scatter-chart"
      title="No segments yet"
      description="RFM segmentation appears once enough order history is available."
    />
  </div>
</template>

<style scoped>
.rfm-dist {
  display: flex;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  gap: 2px;
}

.rfm-dist__seg {
  height: 100%;
  min-width: 4px;
  transition: opacity 0.15s ease;
}

.rfm-dist__seg:hover {
  opacity: 0.8;
}

.rfm-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.rfm-card {
  position: relative;
  overflow: hidden;
}

.rfm-card__accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--seg);
}

.rfm-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.num {
  font-variant-numeric: tabular-nums;
}
</style>
