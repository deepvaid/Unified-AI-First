<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Table Name', key: 'name', sortable: true },
  { title: 'Rows', key: 'rows', align: 'end' as const },
  { title: 'Primary Key', key: 'key' },
  { title: 'Last Updated', key: 'updated' },
  { title: '', key: 'actions', sortable: false, width: 48 },
]

const tables = [
  { name: 'Purchase History', rows: 450200, key: 'transaction_id', updated: '2026-03-07' },
  { name: 'App Usage Logs', rows: 1250000, key: 'log_id', updated: '2026-03-07' },
  { name: 'Loyalty Points', rows: 85000, key: 'customer_id', updated: '2026-03-06' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Relational Tables"
      :subtitle="`${tables.length} tables`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Table</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Tables"
      />

      <v-data-table
        :headers="headers"
        :items="tables"
        :search="search"
        :items-per-page="15"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.rows="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.rows.toLocaleString() }}</span>
        </template>
        <template v-slot:item.actions>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" density="comfortable" color="medium-emphasis" />
            </template>
            <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
              <v-list-item prepend-icon="pencil" title="Edit" />
              <v-list-item prepend-icon="database" title="Export" />
              <v-divider class="my-1" style="opacity: 0.4" />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
