<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const search = ref('')

const headers = [
  { title: 'Footer Name', key: 'name', sortable: true },
  { title: 'Last Modified', key: 'modified' },
  { title: 'Default', key: 'isDefault' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const footers = ref([
  { name: 'Standard Compliance (CAN-SPAM)', isDefault: true, modified: '2025-11-20' },
  { name: 'EU Compliance (GDPR)', isDefault: false, modified: '2026-01-15' },
  { name: 'Transactional Footer Minimal', isDefault: false, modified: '2026-02-01' },
])
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Footer Management"
      :subtitle="`${footers.length} footers`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">New Footer</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Footers"
        search-placeholder="Search footers..."
        :total-count="footers.length"
      />

      <v-data-table :headers="headers" :items="footers" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.isDefault="{ item }">
          <v-chip v-if="item.isDefault" color="primary" size="small">Default</v-chip>
          <span v-else class="text-medium-emphasis text-body-2">—</span>
        </template>
        <template v-slot:item.actions>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="more-horizontal" variant="text" size="small" />
            </template>
            <v-list density="compact" rounded="xl" nav min-width="160" elevation="8">
              <v-list-item prepend-icon="pencil">Edit Design</v-list-item>
              <v-list-item prepend-icon="star">Set as Default</v-list-item>
              <v-list-item prepend-icon="trash-2" class="text-error">Delete</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
