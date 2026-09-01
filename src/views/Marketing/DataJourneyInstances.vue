<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useDataJourneysStore } from '@/stores/useDataJourneys'

const store = useDataJourneysStore()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const journeyId = computed(() => Number(route.params.id))
const journey = computed(() => store.dataJourneys.find(j => j.id === journeyId.value))
const runs = computed(() => store.instancesOf(journeyId.value))

const headers = [
  { title: 'Instance', key: 'name', sortable: false },
  { title: 'Status', key: 'status', sortable: false, width: 120 },
  { title: 'Finished at', key: 'finishedAt', sortable: true },
  { title: 'Updated at', key: 'updatedAt', sortable: true },
  { title: 'Created at', key: 'createdAt', sortable: true },
]

function formatAt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} at ${time}`
}
</script>

<template>
  <div class="pa-6">
    <MpPageHeader
      :backTo="{ name: 'DataJourneys', params: { accountId } }"
      eyebrow="Data Journeys"
      :title="journey ? `${journey.name} — instances` : 'Instances'"
      :subtitle="journey ? `Every run of this data journey, newest first.` : undefined"
    />

    <v-card v-if="journey" flat border rounded="lg" class="mt-4">
      <v-data-table :headers="headers" :items="runs" :items-per-page="10">
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template v-slot:item.finishedAt="{ item }">{{ formatAt(item.finishedAt) }}</template>
        <template v-slot:item.updatedAt="{ item }">{{ formatAt(item.updatedAt) }}</template>
        <template v-slot:item.createdAt="{ item }">{{ formatAt(item.createdAt) }}</template>
        <template #no-data>
          <MpEmptyState
            icon="history"
            title="No runs yet"
            description="This data journey hasn't produced any instances. Enable it and its trigger will start creating runs."
          />
        </template>
      </v-data-table>
    </v-card>

    <MpEmptyState
      v-else
      class="mt-4"
      icon="workflow"
      title="Data journey not found"
      description="This data journey doesn't exist or was deleted."
    />
  </div>
</template>
