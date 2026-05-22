<script setup lang="ts">
import { ref } from 'vue'
import { useAnalyticsStore } from '@/stores/useAnalytics'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const store = useAnalyticsStore()
const search = ref('')

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Total Revenue', key: 'revenue', align: 'end' as const },
  { title: 'Orders Placed', key: 'orders', align: 'end' as const },
  { title: 'Active Subscribers', key: 'subscribers', align: 'end' as const },
  { title: 'Campaign Sends', key: 'sends', align: 'end' as const }
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Monthly Analytics"
      subtitle="High-level overview of revenue and audience growth over time."
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="calendar-range" class="text-none" color="surface">Select Date Range</v-btn>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Historical Performance"
        :total-count="store.chartData.length"
      />
      <v-data-table
        :headers="headers"
        :items="store.chartData"
        :search="search"
        hover
        density="comfortable"
        :items-per-page="12"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.revenue="{ item }">
          <span class="font-weight-bold text-primary">${{ item.revenue.toLocaleString() }}</span>
        </template>
        <template v-slot:item.subscribers="{ item }">
          <span class="font-weight-medium">{{ item.subscribers.toLocaleString() }}</span>
        </template>
        <template v-slot:item.sends="{ item }">
          <span class="text-medium-emphasis">{{ item.sends.toLocaleString() }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
