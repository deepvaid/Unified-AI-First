<script setup lang="ts">
import { ref } from 'vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const store = useCampaignsStore()
const search = ref('')

const headers = [
  { title: 'Transactional Event', key: 'name', sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Sent Date', key: 'sentDate' },
  { title: 'Delivered', key: 'metrics.sent', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const flows = store.campaigns.filter(c => c.id % 2 === 0)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Transactional Email"
      :subtitle="`${flows.length} transactional flows`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Flow</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Flows"
        search-placeholder="Search flows..."
        :total-count="flows.length"
      />

      <v-data-table :headers="headers" :items="flows" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'Sent' ? 'success' : 'primary'" size="small">
            {{ item.status === 'Sent' ? 'Active' : 'Draft' }}
          </v-chip>
        </template>
        <template v-slot:item.actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="xl" nav min-width="160" elevation="8">
              <v-list-item prepend-icon="pencil">Edit</v-list-item>
              <v-list-item prepend-icon="copy">Duplicate</v-list-item>
              <v-list-item prepend-icon="trash-2" class="text-error">Delete</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
