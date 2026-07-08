<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'

const queries = [
  { name: 'High Value Customers No Purchase 90 Days', lastRun: '2 hours ago', status: 'Success' },
  { name: 'Daily Churn Sync', lastRun: '10 hours ago', status: 'Success' },
  { name: 'Holiday Segment Extract', lastRun: '3 days ago', status: 'Failed' },
]

const search = ref('')

const queryText = ref(`SELECT c.email, c.first_name, SUM(p.amount) AS total_spent
FROM contacts c
JOIN purchases p ON c.id = p.contact_id
WHERE p.date > CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.id
HAVING SUM(p.amount) > 500;`)

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

    <v-card variant="flat" border rounded="lg" class="pa-4">
      <MpSectionHeader title="Query Editor" />
      <v-textarea
        v-model="queryText"
        variant="outlined"
        auto-grow
        rows="6"
        spellcheck="false"
        hide-details
        class="sql-editor"
        aria-label="SQL query editor"
      />
      <div class="d-flex gap-2 mt-3">
        <v-btn color="primary" variant="flat" prepend-icon="play" class="text-none" size="small">Run Query</v-btn>
        <v-btn variant="tonal" prepend-icon="save" class="text-none" size="small">Save</v-btn>
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
        <template v-slot:item.lastRun="{ item }">
          <span class="d-inline-flex align-center gap-2 text-medium-emphasis">
            <v-icon size="14">clock</v-icon>{{ item.lastRun }}
          </span>
        </template>
        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" />
        </template>
        <template v-slot:item.actions>
          <MpRowActionsMenu ariaLabel="Query actions">
            <v-list-item prepend-icon="play" title="Run" />
            <v-list-item prepend-icon="pencil" title="Edit" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="database"
            :title="search ? 'No queries match your search' : 'No saved queries'"
            :description="search ? 'Try a different search term.' : 'Write a query in the editor above and save it to reuse it here.'"
            class="py-10"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.sql-editor :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
