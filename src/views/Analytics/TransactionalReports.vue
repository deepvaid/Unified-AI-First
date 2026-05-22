<script setup lang="ts">
import { ref } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const store = useCampaignsStore()
const search = ref('')

const headers = [
  { title: 'Transactional Event', key: 'name', sortable: true },
  { title: 'Trigger Date', key: 'sentDate' },
  { title: 'Delivery Rate', key: 'deliveryRate', align: 'end' as const },
]

const transReports = store.campaigns.slice(0, 15).map(c => ({
  ...c,
  name: `Order Confirmation - ${c.name}`,
  deliveryRate: `${Math.floor(Math.random() * 5 + 95)}%`
}))
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Transactional Email Reports"
      :subtitle="`${transReports.length} transactional flows`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export CSV</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Transactional Events"
        :total-count="transReports.length"
      />
      <v-data-table :headers="headers" :items="transReports" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1" />
    </v-card>
  </div>
</template>
