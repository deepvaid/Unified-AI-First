<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAnalyticsStore } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import type { CustomReport } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useAnalyticsStore()
const { customReports } = storeToRefs(store)

const vizIcon: Record<CustomReport['visualization'], string> = {
  Bar: 'bar-chart-3',
  Line: 'line-chart',
  Area: 'area-chart',
  Table: 'table',
  Pie: 'pie-chart',
  Funnel: 'filter',
}

const statusColor: Record<CustomReport['status'], string> = {
  Ready: 'success',
  Running: 'info',
  Scheduled: 'warning',
}

const sources: CustomReport['source'][] = ['Commerce', 'Marketing', 'Contacts', 'Service']
const visualizations: CustomReport['visualization'][] = ['Bar', 'Line', 'Area', 'Table', 'Pie', 'Funnel']
const schedules: CustomReport['schedule'][] = ['None', 'Daily', 'Weekly', 'Monthly']
const metrics = ['Revenue', 'Orders', 'Open Rate', 'Click Rate', 'Sessions', 'Lifetime Value', 'Active Subscribers', 'Tickets']
const dimensions = ['Date', 'Month', 'Region', 'Channel', 'Product', 'Segment', 'Acquisition Channel', 'Checkout Step']
const dateRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This quarter', 'Year to date']

const drawer = ref(false)
const blankForm = (): {
  name: string
  source: CustomReport['source']
  metric: string
  dimension: string
  visualization: CustomReport['visualization']
  dateRange: string
  schedule: CustomReport['schedule']
} => ({
  name: '',
  source: 'Commerce',
  metric: 'Revenue',
  dimension: 'Date',
  visualization: 'Bar',
  dateRange: 'Last 30 days',
  schedule: 'None',
})
const form = reactive(blankForm())

function openBuilder() {
  Object.assign(form, blankForm())
  drawer.value = true
}

function saveReport() {
  if (!form.name.trim()) return
  const nextId = Math.max(0, ...customReports.value.map((r) => r.id)) + 1
  customReports.value.unshift({
    id: nextId,
    name: form.name.trim(),
    source: form.source,
    visualization: form.visualization,
    metric: form.metric,
    dimension: form.dimension,
    schedule: form.schedule,
    owner: 'You',
    lastRun: new Date().toISOString().slice(0, 10),
    status: form.schedule === 'None' ? 'Ready' : 'Scheduled',
  })
  drawer.value = false
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Custom Reports"
      subtitle="Build, save, and schedule custom analytics reports"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openBuilder">
          Create Report
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row v-if="customReports.length" dense>
      <v-col v-for="r in customReports" :key="r.id" cols="12" sm="6" md="4">
        <v-card variant="flat" border rounded="lg" class="report-card h-100 d-flex flex-column">
          <div class="pa-5 flex-grow-1">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="report-card__icon">
                <v-icon size="20">{{ vizIcon[r.visualization] }}</v-icon>
              </div>
              <v-chip size="x-small" variant="tonal" :color="statusColor[r.status]" class="font-weight-medium">
                {{ r.status }}
              </v-chip>
            </div>

            <div class="text-subtitle-1 font-weight-bold mb-1">{{ r.name }}</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              {{ r.metric }} by {{ r.dimension }}
            </div>

            <div class="d-flex flex-wrap ga-2">
              <v-chip size="x-small" variant="tonal" prepend-icon="database">{{ r.source }}</v-chip>
              <v-chip size="x-small" variant="tonal" prepend-icon="chart-no-axes-column">{{ r.visualization }}</v-chip>
              <v-chip v-if="r.schedule !== 'None'" size="x-small" variant="tonal" prepend-icon="calendar-clock">
                {{ r.schedule }}
              </v-chip>
            </div>
          </div>

          <v-divider />
          <div class="d-flex align-center justify-space-between px-4 py-2">
            <span class="text-caption text-medium-emphasis">
              <v-icon size="12" class="mr-1">user</v-icon>{{ r.owner }} · {{ r.lastRun }}
            </span>
            <div class="d-flex ga-1">
              <v-btn size="small" variant="text" icon="pencil" class="text-none" aria-label="Edit report" />
              <v-btn size="small" variant="tonal" color="primary" prepend-icon="play" class="text-none">Run</v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <MpEmptyState
      v-else
      icon="chart-column"
      title="No custom reports yet"
      description="Create your first report to combine any metric with a dimension and visualization."
      action-label="Create Report"
      action-icon="plus"
      @action="openBuilder"
    />

    <!-- Builder -->
    <MpFormDrawer v-model="drawer" title="Create Custom Report" subtitle="Combine a metric, a dimension, and a chart type.">
      <v-form @submit.prevent="saveReport">
        <v-text-field
          v-model="form.name"
          label="Report name"
          placeholder="e.g. Q4 Revenue by Region"
          variant="outlined"
          density="comfortable"
          autofocus
          class="mb-3"
        />
        <v-select
          v-model="form.source"
          :items="sources"
          label="Data source"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-select v-model="form.metric" :items="metrics" label="Metric" variant="outlined" density="comfortable" class="mb-3" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select v-model="form.dimension" :items="dimensions" label="Group by" variant="outlined" density="comfortable" class="mb-3" />
          </v-col>
        </v-row>

        <div class="text-body-2 font-weight-medium mb-2">Visualization</div>
        <v-chip-group v-model="form.visualization" mandatory selected-class="text-primary" class="mb-3">
          <v-chip
            v-for="v in visualizations"
            :key="v"
            :value="v"
            variant="outlined"
            filter
            :prepend-icon="vizIcon[v]"
          >
            {{ v }}
          </v-chip>
        </v-chip-group>

        <v-row dense>
          <v-col cols="12" sm="6">
            <v-select v-model="form.dateRange" :items="dateRanges" label="Date range" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select v-model="form.schedule" :items="schedules" label="Schedule" variant="outlined" density="comfortable" />
          </v-col>
        </v-row>
      </v-form>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!form.name.trim()" @click="saveReport">
          Create Report
        </v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.report-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
</style>
