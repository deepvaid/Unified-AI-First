<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Block Name', key: 'name', sortable: true },
  { title: 'Active Rules', key: 'rules', align: 'end' as const },
  { title: 'Last Updated', key: 'lastUpdated' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const items = ref([
  { name: 'VIP Header Greeting', rules: 3, lastUpdated: '2026-03-01' },
  { name: 'Product Recommendation Block', rules: 5, lastUpdated: '2026-02-15' },
  { name: 'Abandoned Cart Items', rules: 2, lastUpdated: '2026-01-10' },
])
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Dynamic Content"
      :subtitle="`${items.length} content blocks`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Block</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Content Blocks"
        search-placeholder="Search blocks..."
        :total-count="items.length"
      />

      <v-data-table :headers="headers" :items="items" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="xl" nav min-width="160" elevation="8">
              <v-list-item prepend-icon="pencil">Manage Rules</v-list-item>
              <v-list-item prepend-icon="copy">Duplicate</v-list-item>
              <v-list-item prepend-icon="trash-2" class="text-error">Delete</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
