<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const queries = [
  { name: 'High Value Customers No Purchase 90 Days', lastRun: '2 hours ago', status: 'Success' },
  { name: 'Daily Churn Sync', lastRun: '10 hours ago', status: 'Success' },
  { name: 'Holiday Segment Extract', lastRun: '3 days ago', status: 'Failed' },
]

const search = ref('')

const headers = [
  { title: 'Query Name', key: 'name', sortable: true },
  { title: 'Last Run', key: 'lastRun' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="SQL Queries"
      :subtitle="`${queries.length} saved queries`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Query</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="pa-4 mb-4">
      <div class="text-subtitle-2 font-weight-bold mb-3">Query Editor</div>
      <div class="bg-black pa-4 rounded-lg font-family-monospace text-body-2 text-green">
        SELECT c.email, c.first_name, SUM(p.amount) as total_spent<br>
        FROM contacts c<br>
        JOIN purchases p ON c.id = p.contact_id<br>
        WHERE p.date > CURRENT_DATE - INTERVAL '90 days'<br>
        GROUP BY c.id<br>
        HAVING SUM(p.amount) > 500;
      </div>
      <div class="d-flex gap-2 mt-3">
        <v-btn variant="flat" prepend-icon="play" class="text-none" size="small" color="surface">Run Query</v-btn>
        <v-btn variant="flat" prepend-icon="save" class="text-none" size="small" color="surface">Save</v-btn>
      </div>
    </v-card>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Saved Queries"
      />

      <v-data-table
        :headers="headers"
        :items="queries"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.status === 'Success' ? 'success' : 'error'" size="small" variant="tonal">{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="play" title="Run" />
              <v-list-item prepend-icon="pencil" title="Edit" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
