<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Amount', key: 'amount', align: 'end' as const },
  { title: 'Status', key: 'status' },
]

const invoices = [
  { date: '2026-03-01', amount: '$5,400.00', status: 'Paid' },
  { date: '2026-02-01', amount: '$5,400.00', status: 'Paid' },
  { date: '2026-01-01', amount: '$5,400.00', status: 'Paid' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Billing & Usage"
      subtitle="Manage your subscription, usage, and invoices"
    />

    <v-row class="flex-shrink-0">
      <v-col cols="12" md="4">
        <v-card variant="flat" border rounded="lg" class="pa-5">
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Current Plan</div>
          <div class="text-h5 text-primary font-weight-bold mb-1">Enterprise Plus</div>
          <div class="text-medium-emphasis mb-4">$5,400 / month</div>
          <v-btn variant="flat" class="text-none" block color="surface">Change Plan</v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card variant="flat" border rounded="lg" class="pa-5 h-100">
          <div class="text-subtitle-1 font-weight-bold mb-4">Monthly Usage Data</div>
          <div class="mb-4">
            <div class="d-flex justify-space-between mb-1">
              <span class="text-body-2">Email Sends (1.45M / 2.00M)</span>
              <span class="text-body-2 font-weight-medium">72%</span>
            </div>
            <v-progress-linear model-value="72" color="primary" height="8" rounded />
          </div>
          <div>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-body-2">Active Contacts (450k / 500k)</span>
              <span class="text-body-2 font-weight-medium text-warning">90%</span>
            </div>
            <v-progress-linear model-value="90" color="warning" height="8" rounded />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Invoice History"
      >
        <template #actions>
          <v-btn variant="flat" prepend-icon="download" size="small" class="text-none" color="surface">Download All</v-btn>
        </template>
      </MpDataTableToolbar>
      <v-data-table :headers="headers" :items="invoices" :search="search" hover density="comfortable" :items-per-page="10" fixed-header class="flex-grow-1">
        <template v-slot:item.status="{ item }">
          <v-chip color="success" size="small">{{ item.status }}</v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
