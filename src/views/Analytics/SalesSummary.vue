<script setup lang="ts">
import { useAnalyticsStore } from '@/stores/useAnalytics'
import { storeToRefs } from 'pinia'
import MpPageHeader from '@/components/MpPageHeader.vue'

const store = useAnalyticsStore()
const { accountMetrics } = storeToRefs(store)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Sales Summary"
      subtitle="Revenue attribution and channel performance overview"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export Report</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="pa-6">
      <div class="text-overline text-medium-emphasis mb-1">Total Revenue Attributed</div>
      <div class="text-h3 text-primary font-weight-bold">${{ (accountMetrics.revenueAttributed).toLocaleString() }}</div>
    </v-card>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <div class="d-flex align-center ga-3 px-4 pt-4 pb-3">
        <div class="text-subtitle-1 font-weight-bold">Revenue by Channel</div>
      </div>
      <div class="d-flex justify-center align-center flex-grow-1" style="min-height: 300px; background-color: rgba(var(--v-theme-surface-variant), 0.2);">
        <span class="text-medium-emphasis">Sales Summary Chart Data Visualization Stub</span>
      </div>
    </v-card>
  </div>
</template>
